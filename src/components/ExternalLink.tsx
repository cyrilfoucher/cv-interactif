import type { ReactNode } from "react";

type ExternalLinkProps = {
  href: string;
  children: ReactNode;
};

// Lien orange. Un site (http…) s'ouvre dans un nouvel onglet ; un mailto: ouvre la messagerie.
export default function ExternalLink({ href, children }: ExternalLinkProps) {
  const isWebsite = href.startsWith("http");

  return (
    <a
      href={href}
      target={isWebsite ? "_blank" : undefined}
      rel={isWebsite ? "noopener noreferrer" : undefined}
      className="inline-flex min-h-11 items-center text-accent underline underline-offset-4 [overflow-wrap:anywhere] hover:text-accent-hover"
    >
      {children}
    </a>
  );
}
