import type { ReactNode } from "react";

type ButtonProps = {
  href: string;
  children: ReactNode;
  /** Télécharge le fichier au lieu de l'ouvrir (pour le PDF). */
  download?: boolean;
};

// Bouton orange : en réalité un lien <a> mis en forme.
export default function Button({ href, children, download }: ButtonProps) {
  return (
    <a
      href={href}
      download={download}
      className="inline-flex min-h-11 w-full items-center justify-center bg-accent px-5 font-medium text-graphite hover:bg-accent-hover sm:w-auto"
    >
      {children}
    </a>
  );
}
