import { createHmac } from "node:crypto";

export const DAILY_LIMIT = 12;
export const GLOBAL_DAILY_LIMIT = 200;

export const QUOTA_MESSAGE = `Le quota de ${DAILY_LIMIT} questions est atteint. Il sera réinitialisé demain. Vous pouvez aussi contacter Cyril directement.`;

export const GLOBAL_QUOTA_MESSAGE =
  "L'assistant a atteint sa limite de questions pour aujourd'hui. Il sera de nouveau disponible demain. Vous pouvez aussi contacter Cyril directement.";

export type RateLimitResult = { allowed: boolean; remaining: number; reason?: "visitor" | "global" };

const memoryCounts = new Map<string, number>();

function today(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
}

function visitorPrefix(ip: string): string {
  // IPv4 écrite en IPv6 (::ffff:1.2.3.4) : on garde l'IPv4
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip);
  if (mapped) return mapped[1];
  if (!ip.includes(":")) return ip;

  const [head, tail = ""] = ip.split("::");
  const headGroups = head ? head.split(":") : [];
  const tailGroups = tail ? tail.split(":") : [];
  const missing = ip.includes("::") ? 8 - headGroups.length - tailGroups.length : 0;
  const groups = [...headGroups, ...Array<string>(missing).fill("0"), ...tailGroups];
  return groups
    .slice(0, 4)
    .map((group) => group.padStart(4, "0"))
    .join(":");
}

function hashVisitor(ip: string): string {
  const secret = process.env.RATE_LIMIT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("RATE_LIMIT_SECRET est absente en production");
  }
  return createHmac("sha256", secret ?? "dev-secret").update(visitorPrefix(ip)).digest("hex").slice(0, 32);
}

async function increment(key: string): Promise<number> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Upstash n'est pas configuré en production : la limite ne fonctionnerait pas");
    }
    const count = (memoryCounts.get(key) ?? 0) + 1;
    memoryCounts.set(key, count);
    return count;
  }

  const response = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, 86400],
    ]),
  });
  if (!response.ok) throw new Error(`Upstash a répondu ${response.status}`);
  const results = (await response.json()) as { result: number }[];
  return results[0].result;
}

export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const day = today();

  const visitorCount = await increment(`ask:${hashVisitor(ip)}:${day}`);
  if (visitorCount > DAILY_LIMIT) return { allowed: false, remaining: 0, reason: "visitor" };

  const globalCount = await increment(`ask:global:${day}`);
  if (globalCount > GLOBAL_DAILY_LIMIT) return { allowed: false, remaining: 0, reason: "global" };

  return { allowed: true, remaining: DAILY_LIMIT - visitorCount };
}
