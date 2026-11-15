import type { Job } from "@/lib/profile";

// Parcours professionnel : un panneau par poste.
export default function ExperienceList({ jobs }: { jobs: Job[] }) {
  return (
    <div className="flex flex-col gap-6">
      {jobs.map((job) => (
        <article key={job.title} className="min-w-0 border border-line bg-panel p-6">
          <h3 className="text-xl font-semibold text-ink">{job.title}</h3>
          <p className="mt-1 font-mono text-sm text-ink-3">{job.period}</p>
          {job.description.map((paragraph) => (
            <p key={paragraph} className="mt-3 text-ink-2">
              {paragraph}
            </p>
          ))}
          <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-2 marker:text-accent">
            {job.items.map((item) => (
              <li key={item.text}>{item.text}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
