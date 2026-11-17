import { loadProfile } from "./profile";
import { buildSystemPrompt } from "./prompt";

export type ChatMessage = { role: "user" | "assistant"; content: string };

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";

function extractText(line: string): string {
  const clean = line.trim();
  if (!clean.startsWith("data: ") || clean === "data: [DONE]") return "";
  const data = JSON.parse(clean.slice(6)) as {
    choices?: { delta?: { content?: string } }[];
  };
  return data.choices?.[0]?.delta?.content ?? "";
}

export async function streamAnswer(
  messages: ChatMessage[],
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY est absente de .env.local");

  const response = await fetch(MISTRAL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "ministral-14b-2512",
      messages: [
        { role: "system", content: buildSystemPrompt(loadProfile()) },
        ...messages,
      ],
      stream: true,
      temperature: 0.2,
      max_tokens: 400,
    }),
  });
  if (!response.ok || !response.body)
    throw new Error(`Mistral a répondu ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream({
    async pull(controller) {
      // Si un morceau ne contient aucun texte, pull ne serait plus rappelé : on relit jusqu'à en trouver.
      let sentText = false;
      while (!sentText) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Un morceau réseau peut couper une ligne en deux : on garde la dernière pour la compléter.
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const text = extractText(line);
          if (text) {
            controller.enqueue(encoder.encode(text));
            sentText = true;
          }
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}
