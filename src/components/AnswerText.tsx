import ReactMarkdown from "react-markdown";

const ALLOWED_ELEMENTS = ["p", "strong", "em", "ul", "ol", "li", "a", "br"];

export default function AnswerText({ text }: { text: string }) {
  return (
    <ReactMarkdown
      allowedElements={ALLOWED_ELEMENTS}
      unwrapDisallowed
      components={{
        p: ({ children }) => <p className="mt-2 first:mt-0">{children}</p>,
        ul: ({ children }) => <ul className="mt-2 list-disc pl-5">{children}</ul>,
        ol: ({ children }) => <ol className="mt-2 list-decimal pl-5">{children}</ol>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline hover:text-accent-hover"
          >
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
