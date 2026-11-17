import type { Project } from "@/lib/profile";
import ExternalLink from "./ExternalLink";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="min-w-0 border border-line bg-panel p-6">
      <div className="flex flex-wrap justify-between gap-x-4 font-mono text-sm">
        <span className="text-ink">{project.ref}</span>
        <span className="text-ink-3">{project.dates}</span>
      </div>

      <h3 className="mt-3 text-2xl font-semibold text-ink">{project.name}</h3>
      {project.description.map((paragraph) => (
        <p key={paragraph} className="mt-3 text-ink-2">
          {paragraph}
        </p>
      ))}

      <dl className="mt-5 space-y-1">
        {project.items.map((item) => (
          <div key={item.text}>
            <dt className="font-mono text-xs uppercase text-ink-3">{item.label}</dt>
            {/* Un lien fait 44 px de haut : le texte simple reçoit py-2.5 pour avoir le même espacement.
                pb-2 ajoute de l'air sous un lien qui passe sur deux lignes. */}
            <dd className={item.href ? "pb-2 text-ink-2" : "py-2.5 text-ink-2"}>
              {item.href ? <ExternalLink href={item.href}>{item.value}</ExternalLink> : item.value}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
