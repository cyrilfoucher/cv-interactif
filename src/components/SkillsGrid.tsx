import type { Item } from "@/lib/profile";

export default function SkillsGrid({ items }: { items: Item[] }) {
  return (
    <dl className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <div key={item.text} className="min-w-0 border border-line bg-panel p-4">
          <dt className="font-mono text-xs uppercase text-ink-3">{item.label}</dt>
          <dd className="mt-1 text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
