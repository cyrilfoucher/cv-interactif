import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DAILY_LIMIT,
  GLOBAL_DAILY_LIMIT,
  GLOBAL_QUOTA_MESSAGE,
  QUOTA_MESSAGE,
  checkRateLimit,
} from "@/lib/rateLimit";

beforeEach(() => {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  vi.stubEnv("RATE_LIMIT_SECRET", "test-secret");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function useUpTo(ip: string, times: number) {
  for (let i = 0; i < times; i++) await checkRateLimit(ip);
}

describe("limite par visiteur (en mémoire)", () => {
  it("autorise 12 questions puis refuse la 13e", async () => {
    for (let i = 1; i <= DAILY_LIMIT; i++) {
      expect(await checkRateLimit("1.1.1.1")).toEqual({ allowed: true, remaining: DAILY_LIMIT - i });
    }
    expect(await checkRateLimit("1.1.1.1")).toEqual({ allowed: false, remaining: 0, reason: "visitor" });
  });

  it("compte chaque adresse IP séparément", async () => {
    await useUpTo("2.2.2.2", DAILY_LIMIT + 1);
    expect((await checkRateLimit("3.3.3.3")).allowed).toBe(true);
  });

  it("repart de zéro le lendemain", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-16T12:00:00+01:00"));
    await useUpTo("4.4.4.4", DAILY_LIMIT + 1);
    expect((await checkRateLimit("4.4.4.4")).allowed).toBe(false);

    vi.setSystemTime(new Date("2026-11-17T12:00:00+01:00"));
    expect((await checkRateLimit("4.4.4.4")).allowed).toBe(true);
  });

  it("change de jour à minuit, heure de Paris", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-16T23:30:00+01:00"));
    await useUpTo("5.5.5.5", DAILY_LIMIT);
    expect((await checkRateLimit("5.5.5.5")).allowed).toBe(false);

    vi.setSystemTime(new Date("2026-11-17T00:30:00+01:00"));
    expect((await checkRateLimit("5.5.5.5")).allowed).toBe(true);
  });
});

describe("adresses IPv6", () => {
  it("regroupe les adresses d'un même préfixe /64", async () => {
    await useUpTo("2001:db8:1:2::1", DAILY_LIMIT);
    expect((await checkRateLimit("2001:db8:1:2:abcd:ef01:2345:6789")).allowed).toBe(false);
  });

  it("sépare deux préfixes différents", async () => {
    await useUpTo("2001:db8:1:5::1", DAILY_LIMIT + 1);
    expect((await checkRateLimit("2001:db8:1:6::1")).allowed).toBe(true);
  });

  it("traite une IPv4 écrite en IPv6 comme l'IPv4", async () => {
    await useUpTo("9.9.9.9", DAILY_LIMIT);
    expect((await checkRateLimit("::ffff:9.9.9.9")).allowed).toBe(false);
  });
});

describe("plafond global", () => {
  it("refuse tout le monde une fois les 200 questions du jour atteintes", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T12:00:00+01:00"));
    for (let i = 0; i < GLOBAL_DAILY_LIMIT; i++) {
      expect((await checkRateLimit(`10.0.${Math.floor(i / 250)}.${i % 250}`)).allowed).toBe(true);
    }
    expect(await checkRateLimit("10.1.0.1")).toEqual({ allowed: false, remaining: 0, reason: "global" });
  });

  it("ne compte pas les visiteurs déjà bloqués", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-02-01T12:00:00+01:00"));
    await useUpTo("11.0.0.1", DAILY_LIMIT);
    await useUpTo("11.0.0.1", 50);

    for (let i = 0; i < GLOBAL_DAILY_LIMIT - DAILY_LIMIT; i++) {
      expect((await checkRateLimit(`11.1.${Math.floor(i / 250)}.${i % 250}`)).allowed).toBe(true);
    }
  });
});

describe("limite avec Upstash", () => {
  beforeEach(() => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://upstash.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "secret");
  });

  function stubUpstash(counts: number[], ok = true) {
    const fetchMock = vi.fn().mockImplementation(
      async () => new Response(JSON.stringify([{ result: counts.shift() ?? 1 }, { result: 1 }]), { status: ok ? 200 : 500 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("envoie INCR et EXPIRE avec le jeton, d'abord pour le visiteur puis pour le global", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-16T12:00:00+01:00"));
    const fetchMock = stubUpstash([1, 1]);

    await checkRateLimit("6.6.6.6");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://upstash.example/pipeline");
    expect(options.headers.Authorization).toBe("Bearer secret");

    const [[visitorIncr, visitorExpire]] = [JSON.parse(options.body)];
    expect(visitorIncr[0]).toBe("INCR");
    expect(visitorIncr[1]).toMatch(/^ask:[0-9a-f]{32}:2026-11-16$/);
    expect(visitorExpire).toEqual(["EXPIRE", visitorIncr[1], 86400]);

    const [, globalOptions] = fetchMock.mock.calls[1];
    expect(JSON.parse(globalOptions.body)[0]).toEqual(["INCR", "ask:global:2026-11-16"]);
  });

  it("ne stocke jamais l'adresse IP en clair", async () => {
    const fetchMock = stubUpstash([1, 1]);
    await checkRateLimit("6.6.6.6");
    expect(fetchMock.mock.calls[0][1].body).not.toContain("6.6.6.6");
  });

  it("donne la même clé à un même visiteur et une clé différente à un autre", async () => {
    const keyFor = async (ip: string) => {
      const fetchMock = stubUpstash([1, 1]);
      await checkRateLimit(ip);
      return JSON.parse(fetchMock.mock.calls[0][1].body)[0][1];
    };
    expect(await keyFor("6.6.6.6")).toBe(await keyFor("6.6.6.6"));
    expect(await keyFor("6.6.6.6")).not.toBe(await keyFor("6.6.6.7"));
  });

  it("autorise tant que le compteur ne dépasse pas 12", async () => {
    stubUpstash([DAILY_LIMIT, 1]);
    expect(await checkRateLimit("7.7.7.7")).toEqual({ allowed: true, remaining: 0 });
  });

  it("refuse au-delà de 12 sans toucher au compteur global", async () => {
    const fetchMock = stubUpstash([DAILY_LIMIT + 1]);
    expect(await checkRateLimit("7.7.7.7")).toEqual({ allowed: false, remaining: 0, reason: "visitor" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refuse quand le plafond global est dépassé", async () => {
    stubUpstash([1, GLOBAL_DAILY_LIMIT + 1]);
    expect(await checkRateLimit("7.7.7.7")).toEqual({ allowed: false, remaining: 0, reason: "global" });
  });

  it("lève une erreur si Upstash échoue", async () => {
    stubUpstash([0], false);
    await expect(checkRateLimit("8.8.8.8")).rejects.toThrow("Upstash a répondu 500");
  });
});

describe("configuration en production", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
  });

  it("refuse de fonctionner sans Upstash", async () => {
    await expect(checkRateLimit("12.0.0.1")).rejects.toThrow("Upstash n'est pas configuré");
  });

  it("refuse de fonctionner sans secret", async () => {
    vi.stubEnv("RATE_LIMIT_SECRET", "");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://upstash.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "secret");
    await expect(checkRateLimit("12.0.0.2")).rejects.toThrow("RATE_LIMIT_SECRET");
  });
});

describe("messages de quota", () => {
  it("annonce le quota atteint et la remise à zéro le lendemain", () => {
    expect(QUOTA_MESSAGE).toContain("quota de 12 questions est atteint");
    expect(QUOTA_MESSAGE).toContain("réinitialisé demain");
  });

  it("annonce la limite globale et le retour le lendemain", () => {
    expect(GLOBAL_QUOTA_MESSAGE).toContain("limite de questions pour aujourd'hui");
    expect(GLOBAL_QUOTA_MESSAGE).toContain("de nouveau disponible demain");
  });
});
