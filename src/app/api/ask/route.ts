import { z } from "zod";
import { streamAnswer } from "@/lib/mistral";
import { GLOBAL_QUOTA_MESSAGE, QUOTA_MESSAGE, checkRateLimit } from "@/lib/rateLimit";

const MAX_BODY_SIZE = 50_000;
const MAX_ASSISTANT_LENGTH = 1500;

const bodySchema = z
  .object({
    messages: z
      .array(
        z.discriminatedUnion("role", [
          z.object({ role: z.literal("user"), content: z.string().trim().min(1).max(300) }),
          z.object({
            role: z.literal("assistant"),
            content: z.string().transform((text) => text.slice(0, MAX_ASSISTANT_LENGTH)),
          }),
        ]),
      )
      .min(1)
      .max(40),
  })
  .refine((body) => body.messages.at(-1)?.role === "user");

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return jsonError("Requête invalide.", 415);
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_SIZE) {
    return jsonError("Requête trop volumineuse.", 413);
  }

  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return jsonError("Votre question est invalide ou dépasse 300 caractères.", 400);
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  try {
    const limit = await checkRateLimit(ip);
    if (!limit.allowed) {
      return jsonError(limit.reason === "global" ? GLOBAL_QUOTA_MESSAGE : QUOTA_MESSAGE, 429);
    }

    const stream = await streamAnswer(body.data.messages.slice(-9));
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error(error);
    return jsonError("L'assistant est indisponible pour le moment. Vous pouvez contacter Cyril directement.", 503);
  }
}
