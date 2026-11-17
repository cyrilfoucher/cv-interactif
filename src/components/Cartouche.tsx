import Image from "next/image";
import type { Cartouche as CartoucheData } from "@/lib/profile";
import Button from "./Button";
import ExternalLink from "./ExternalLink";

const rowClass = "grid grid-cols-[7rem_1fr] gap-3 border-b border-line p-4 last:border-b-0";

export default function Cartouche({ data }: { data: CartoucheData }) {
  return (
    <header className="grid border border-line bg-panel lg:grid-cols-[1fr_26rem]">
      {/* Photo au-dessus du texte sur mobile et entre 1024 et 1279 px (colonne étroite), à gauche sinon */}
      <div className="flex min-w-0 flex-col gap-6 p-6 sm:flex-row sm:p-8 lg:flex-col xl:flex-row">
        <Image
          src="/photo-cv.jpg"
          alt={`Portrait de ${data.name}`}
          width={176}
          height={176}
          priority
          className="size-36 shrink-0 border border-line object-cover sm:size-40 xl:size-44"
        />
        <div className="min-w-0">
          <h1 className="text-4xl font-semibold text-ink sm:text-5xl">{data.name}</h1>
          <p className="mt-2 text-xl text-ink-2">{data.title}</p>
          <p className="mt-4 max-w-prose text-ink-2">{data.summary}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button href="/cv-cyril-foucher.pdf" download>
              Télécharger le CV (PDF)
            </Button>
            <Button href={data.email.href}>Contacter Cyril</Button>
          </div>
        </div>
      </div>

      <dl className="min-w-0 border-t border-line font-mono text-sm lg:border-l lg:border-t-0">
        <div className={rowClass}>
          <dt className="uppercase text-ink-3">Lieu</dt>
          <dd className="min-w-0 break-words text-ink">{data.location}</dd>
        </div>
        <div className={rowClass}>
          <dt className="uppercase text-ink-3">Reconversion</dt>
          <dd className="min-w-0 break-words text-ink">{data.reconversionStart}</dd>
        </div>
        <div className={rowClass}>
          <dt className="uppercase text-ink-3">Projets en ligne</dt>
          <dd className="min-w-0 break-words text-ink">{data.onlineProjects}</dd>
        </div>
        <div className={rowClass}>
          <dt className="uppercase text-ink-3">Préavis</dt>
          <dd className="min-w-0 break-words text-ink">{data.notice}</dd>
        </div>
        <div className={rowClass}>
          {/* pt-3 : aligne l'étiquette sur le texte du premier lien (qui fait 44 px de haut) */}
          <dt className="pt-3 uppercase text-ink-3">Liens</dt>
          <dd className="flex min-w-0 flex-col">
            <ExternalLink href={data.email.href}>Email</ExternalLink>
            <ExternalLink href={data.linkedin.href}>LinkedIn</ExternalLink>
            <ExternalLink href={data.github.href}>GitHub</ExternalLink>
          </dd>
        </div>
      </dl>
    </header>
  );
}
