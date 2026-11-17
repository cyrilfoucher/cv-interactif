import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { streamAnswer } from "@/lib/mistral";

function sseLine(text: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`;
}

function stubMistral(chunks: string[], status = 200) {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  const fetchMock = vi.fn().mockResolvedValue(new Response(body, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function readAll(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) return text;
    text += decoder.decode(value, { stream: true });
  }
}

beforeEach(() => {
  vi.stubEnv("MISTRAL_API_KEY", "test-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("streamAnswer", () => {
  const history = [
    { role: "user" as const, content: "Bonjour" },
    { role: "assistant" as const, content: "Bonjour, que voulez-vous savoir ?" },
    { role: "user" as const, content: "Quels projets ?" },
  ];

  it("renvoie le texte de la réponse morceau par morceau", async () => {
    stubMistral([sseLine("Cyril "), sseLine("a "), sseLine("trois projets."), "data: [DONE]\n\n"]);
    expect(await readAll(await streamAnswer(history))).toBe("Cyril a trois projets.");
  });

  it("recolle une ligne coupée en deux entre deux morceaux", async () => {
    const line = sseLine("Bonjour");
    stubMistral([line.slice(0, 20), line.slice(20), "data: [DONE]\n\n"]);
    expect(await readAll(await streamAnswer(history))).toBe("Bonjour");
  });

  it("ignore les lignes sans texte", async () => {
    stubMistral([": ping\n\n", sseLine("Salut"), "data: {\"choices\":[{\"delta\":{}}]}\n\n", "data: [DONE]\n\n"]);
    expect(await readAll(await streamAnswer(history))).toBe("Salut");
  });

  it("envoie le prompt système, puis tout l'historique, en streaming", async () => {
    const fetchMock = stubMistral(["data: [DONE]\n\n"]);
    await streamAnswer(history);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.mistral.ai/v1/chat/completions");
    expect(options.headers.Authorization).toBe("Bearer test-key");

    const body = JSON.parse(options.body);
    expect(body.stream).toBe(true);
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[0].content).toContain("<profil>");
    expect(body.messages.slice(1)).toEqual(history);
  });

  it("lève une erreur si la clé est absente", async () => {
    vi.stubEnv("MISTRAL_API_KEY", "");
    await expect(streamAnswer(history)).rejects.toThrow("MISTRAL_API_KEY");
  });

  it("lève une erreur si Mistral refuse la requête", async () => {
    stubMistral([], 429);
    await expect(streamAnswer(history)).rejects.toThrow("Mistral a répondu 429");
  });
});
