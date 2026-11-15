import type { ReactNode } from "react";

type SectionProps = {
  /** Numéro de l'opération, par exemple « 010 ». */
  operation: string;
  /** Titre, par exemple « Projets » (affiché en majuscules). */
  title: string;
  children: ReactNode;
};

// Une section de la page, présentée comme une opération d'usinage : « OP 010 · PROJETS ».
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
