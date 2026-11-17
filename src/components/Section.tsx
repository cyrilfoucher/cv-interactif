import type { ReactNode } from "react";

type SectionProps = {
  operation: string;
  title: string;
  children: ReactNode;
};

export default function Section({ operation, title, children }: SectionProps) {
  return (
    <section>
      <h2 className="border-b border-line pb-3 font-mono text-sm uppercase tracking-wider text-accent">
        OP {operation} · {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}
