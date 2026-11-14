import { readFileSync } from "node:fs";
import path from "node:path";

// ---------- Types ----------

export type Item = {
  text: string;
  label?: string;
  value?: string;
  href?: string;
  children: Item[];
};

export type Subsection = {
  title: string;
  paragraphs: string[];
  items: Item[];
};

export type Section = Subsection & {
  subsections: Subsection[];
};

export type Profile = {
  name: string;
  sections: Section[];
};

export type Link = { text: string; href: string };

export type Project = {
  ref: string;
  name: string;
  dates: string;
  description: string[];
  items: Item[];
  siteUrl?: string;
};

export type Job = {
  title: string;
  period: string;
  description: string[];
  items: Item[];
};

export type Cartouche = {
  name: string;
  title: string;
  summary: string;
  location: string;
  reconversionStart: string;
  notice: string;
  onlineProjects: number;
  email: Link;
  linkedin: Link;
  github: Link;
};

// ---------- Lecture du Markdown ----------

// « Site : https://x.com » → label « Site », value « https://x.com »
function parseItem(text: string): Item {
  const item: Item = { text, children: [] };
  // 1er groupe = étiquette, 2e groupe = valeur (facultative)
  const match = /^(.+?) :(?: (.*))?$/.exec(text);
  if (!match) return item;

  item.label = match[1];
  item.value = match[2];
  if (item.value?.startsWith("http")) {
    item.href = item.value;
  } else if (item.value?.includes("@")) {
    item.href = `mailto:${item.value}`;
  }
  return item;
}

// Lit le fichier ligne par ligne et range chaque ligne au bon endroit
export function parseProfile(markdown: string): Profile {
  const profile: Profile = { name: "", sections: [] };
  let section: Section | undefined;
  let subsection: Subsection | undefined;
  let lastItem = undefined;

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trimEnd();
    if (line === "") continue;

    // Le bloc où ranger les puces et paragraphes : la sous-section, sinon la section
    const target = subsection ?? section;

    if (line.startsWith("# ")) {
      profile.name = line.slice(2);
    } else if (line.startsWith("## ")) {
      section = {
        title: line.slice(3),
        paragraphs: [],
        items: [],
        subsections: [],
      };
      subsection = undefined;
      lastItem = undefined;
      profile.sections.push(section);
    } else if (line.startsWith("### ")) {
      subsection = { title: line.slice(4), paragraphs: [], items: [] };
      section?.subsections.push(subsection);
      lastItem = undefined;
    } else if (line.startsWith("  - ")) {
      lastItem?.children.push(parseItem(line.slice(4)));
    } else if (line.startsWith("- ")) {
      lastItem = parseItem(line.slice(2));
      target?.items.push(lastItem);
    } else {
      target?.paragraphs.push(line);
    }
  }

  return profile;
}

// ---------- Contenu public ----------

// Les puces « Difficulté(s) résolue(s) » sont réservées à l'assistant
function removeDifficulties(items: Item[]): Item[] {
  return items.filter((item) => !item.label?.startsWith("Difficult"));
}

// Retire ce qui est réservé à l'assistant
export function toPublicProfile(profile: Profile): Profile {
  const sections = profile.sections
    .filter((section) => section.title !== "Questions fréquentes")
    .map((section) => ({
      ...section,
      items: removeDifficulties(section.items),
      subsections: section.subsections.map((sub) => ({
        ...sub,
        items: removeDifficulties(sub.items),
      })),
    }));
  return { ...profile, sections };
}

// ---------- Chargement du fichier ----------

export function loadProfile(): Profile {
  const file = path.join(process.cwd(), "src", "content", "profile.md");
  return parseProfile(readFileSync(file, "utf8"));
}

// ---------- Accès aux données, avec erreurs claires ----------

function getSection(profile: Profile, title: string): Section {
  const section = profile.sections.find((s) => s.title === title);
  if (!section) {
    throw new Error(`profile.md : la section « ${title} » est introuvable.`);
  }
  return section;
}

function getItem(block: Subsection, label: string): Item | undefined {
  return block.items.find((item) => item.label === label);
}

function getValue(block: Subsection, label: string): string {
  const value = getItem(block, label)?.value;
  if (!value) {
    throw new Error(
      `profile.md : la puce « ${label} » est introuvable dans « ${block.title} ».`,
    );
  }
  return value;
}

function getLink(block: Subsection, label: string): Link {
  const text = getValue(block, label);
  const href = getItem(block, label)?.href;
  if (!href) {
    throw new Error(
      `profile.md : la puce « ${label} » doit contenir un lien ou un email.`,
    );
  }
  return { text, href };
}

// ---------- Dates et titres ----------

const MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

// 9 → "09"
const pad = (n: number) => String(n).padStart(2, "0");

// « septembre à novembre 2026 » → « 09 → 11 / 2026 »
export function formatDates(text: string): string {
  const match = /^(\S+) à (\S+) (\d{4})$/.exec(text); // mois à mois année
  const start = match ? MONTHS.indexOf(match[1]) + 1 : 0;
  const end = match ? MONTHS.indexOf(match[2]) + 1 : 0;
  if (!match || start === 0 || end === 0) {
    throw new Error(
      `profile.md : période illisible « ${text} » (attendu : « septembre à novembre 2026 »).`,
    );
  }
  return `${pad(start)} → ${pad(end)} / ${match[3]}`;
}

// « Nom (note) » → { name: "Nom", note: "note" }
export function splitHeading(heading: string): { name: string; note: string } {
  const match = /^(.+) \((.+)\)$/.exec(heading);
  return match
    ? { name: match[1], note: match[2] }
    : { name: heading, note: "" };
}

// ---------- Données prêtes pour la page ----------

export function getProjects(profile: Profile): Project[] {
  const projects = getSection(profile, "Projets").subsections;
  return projects.map((sub, index) => {
    const { name, note } = splitHeading(sub.title);
    return {
      // Le fichier liste le plus récent en premier : il porte le numéro le plus haut
      ref: `RÉF. ${pad(projects.length - index)}`,
      name,
      dates: formatDates(note),
      description: sub.paragraphs,
      items: sub.items,
      siteUrl: getItem(sub, "Site")?.href,
    };
  });
}

export function getJobs(profile: Profile): Job[] {
  return getSection(profile, "Parcours professionnel").subsections.map(
    (sub) => {
      const { name, note } = splitHeading(sub.title);
      return {
        title: name,
        period: note,
        description: sub.paragraphs,
        items: sub.items,
      };
    },
  );
}

export function getCartouche(profile: Profile): Cartouche {
  const brief = getSection(profile, "En bref");
  return {
    name: profile.name,
    title: getValue(brief, "Titre"),
    summary: brief.paragraphs[0] ?? "",
    location: getValue(brief, "Localisation"),
    reconversionStart: getValue(brief, "Début de la reconversion"),
    notice: getValue(brief, "Disponibilité"),
    onlineProjects: getProjects(profile).filter((p) => p.siteUrl).length,
    email: getLink(brief, "Contact"),
    linkedin: getLink(brief, "LinkedIn"),
    github: getLink(brief, "GitHub"),
  };
}
