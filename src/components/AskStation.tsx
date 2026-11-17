"use client";

import { useState, type FormEvent } from "react";
import type { ChatMessage } from "@/lib/mistral";
import AnswerText from "./AnswerText";

const MAX_LENGTH = 300;
const FALLBACK_ERROR = "L'assistant est indisponible pour le moment. Vous pouvez contacter Cyril directement.";

export default function AskStation() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question || isLoading) return;

    const history: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? FALLBACK_ERROR);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: answer }]);
      }
    } catch (caught) {
      setMessages(messages);
      setInput(question);
      setError(caught instanceof Error ? caught.message : FALLBACK_ERROR);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {messages.length > 0 && (
        <div role="log" className="space-y-4">
          {messages.map((message, index) => {
            const isAssistant = message.role === "assistant";
            const isWriting = isLoading && index === messages.length - 1;
            return (
              <div
                key={index}
                className={`min-w-0 border border-line p-4 sm:p-6 ${isAssistant ? "bg-panel" : "bg-graphite"}`}
              >
                <p className="font-mono text-xs uppercase text-ink-3">{isAssistant ? "Assistant" : "Vous"}</p>
                <div className="mt-2 break-words text-ink-2">
                  {isAssistant ? (
                    <AnswerText text={message.content} />
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                  {isWriting && <span className="animate-pulse text-accent">█</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <form onSubmit={handleSubmit} className="border border-line bg-panel p-4 sm:p-6">
        <div className="flex items-baseline justify-between gap-4 font-mono text-xs uppercase text-ink-3">
          <label htmlFor="question">Votre question</label>
          <span>
            {input.length} / {MAX_LENGTH}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id="question"
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={MAX_LENGTH}
            disabled={isLoading}
            autoComplete="off"
            className="min-h-11 min-w-0 flex-1 border border-line bg-graphite px-3 text-ink focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="min-h-11 bg-accent px-5 font-medium text-graphite hover:bg-accent-hover disabled:opacity-50"
          >
            Envoyer
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-3 border border-accent p-3 text-ink">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
