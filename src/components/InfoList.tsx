import type { Item } from "@/lib/profile";

// Liste de puces dans un panneau (Formation, Points forts, Langues et divers).
// Affiche le texte complet de chaque puce : une phrase comme « Il ne lâche pas : … »
// ne doit pas être coupée en étiquette et valeur.
export default function InfoList({ items }: { items: Item[] }) {
  return (
    <div className="border border-line bg-panel p-6">
      <ul className="list-disc space-y-3 pl-5 text-ink-2 marker:text-accent">
        {items.map((item) => (
          <li key={item.text}>{item.text}</li>
        ))}
      </ul>
    </div>
  );
}
