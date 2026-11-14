import { describe, expect, it } from "vitest";
import {
  formatDates,
  getCartouche,
  getJobs,
  getProjects,
  loadProfile,
  parseProfile,
  splitHeading,
  toPublicProfile,
} from "./profile";

// Petit Markdown d'exemple : le résultat attendu est connu à l'avance.
const SAMPLE = `# Cyril Foucher
## En bref
Un paragraphe de présentation.
- Contact : cyril@example.fr
- LinkedIn : https://linkedin.com/in/cyril
## Projets
### Projet A (septembre à novembre 2026)
Description du projet A.
- Site : https://a.example.com
- Difficultés résolues :
  - Problème 1 : une explication
  - Problème 2 : une autre explication
- Code : https://github.com/cyril/a
### Projet B (juillet à septembre 2026)
Description du projet B.
- Difficulté résolue : un problème unique
## Questions fréquentes
### Pourquoi cette reconversion ?
Réponse réservée à l'assistant.
`;

describe("découpage des sections", () => {
  const profile = parseProfile(SAMPLE);

  it("lit le nom et les sections", () => {
    expect(profile.name).toBe("Cyril Foucher");
    expect(profile.sections.map((s) => s.title)).toEqual(["En bref", "Projets", "Questions fréquentes"]);
  });

  it("range les sous-sections dans leur section", () => {
    const projets = profile.sections[1];
    expect(projets.subsections.map((s) => s.title)).toEqual([
      "Projet A (septembre à novembre 2026)",
      "Projet B (juillet à septembre 2026)",
    ]);
  });

  it("range les paragraphes et les puces dans le bon bloc", () => {
    expect(profile.sections[0].paragraphs).toEqual(["Un paragraphe de présentation."]);
    const projetA = profile.sections[1].subsections[0];
    expect(projetA.paragraphs).toEqual(["Description du projet A."]);
    expect(projetA.items.map((i) => i.label)).toEqual(["Site", "Difficultés résolues", "Code"]);
  });

  it("rattache les sous-puces à leur puce parente", () => {
    const difficultes = profile.sections[1].subsections[0].items[1];
    expect(difficultes.children).toHaveLength(2);
    expect(difficultes.children[0].label).toBe("Problème 1");
  });

  it("sépare l'étiquette, la valeur et le lien", () => {
    const [contact, linkedin] = profile.sections[0].items;
    expect(contact).toMatchObject({ label: "Contact", value: "cyril@example.fr", href: "mailto:cyril@example.fr" });
    expect(linkedin.href).toBe("https://linkedin.com/in/cyril");
  });
});

describe("contenu public", () => {
  const full = parseProfile(SAMPLE);
  const publicProfile = toPublicProfile(full);

  it("retire la section « Questions fréquentes »", () => {
    expect(publicProfile.sections.map((s) => s.title)).toEqual(["En bref", "Projets"]);
  });

  it("retire les « Difficultés résolues » des projets (singulier et pluriel)", () => {
    const [projetA, projetB] = publicProfile.sections[1].subsections;
    expect(projetA.items.map((i) => i.label)).toEqual(["Site", "Code"]);
    expect(projetB.items).toEqual([]);
  });

  it("ne modifie pas le profil complet, gardé pour l'assistant", () => {
    expect(full.sections.map((s) => s.title)).toContain("Questions fréquentes");
    expect(full.sections[1].subsections[0].items.map((i) => i.label)).toContain("Difficultés résolues");
  });
});

describe("conversion des dates", () => {
  it("convertit « septembre à novembre 2026 »", () => {
    expect(formatDates("septembre à novembre 2026")).toBe("09 → 11 / 2026");
  });

  it("gère les mois accentués", () => {
    expect(formatDates("février à août 2027")).toBe("02 → 08 / 2027");
  });

  it("lève une erreur claire si le format est mauvais", () => {
    expect(() => formatDates("2026")).toThrow("période illisible");
  });

  it("lève une erreur claire si le mois est inconnu", () => {
    expect(() => formatDates("septembr à novembre 2026")).toThrow("période illisible");
  });
});

describe("titres « Nom (note) »", () => {
  it("sépare le nom et la note", () => {
    expect(splitHeading("DevKnowledge (septembre à novembre 2026)")).toEqual({
      name: "DevKnowledge",
      note: "septembre à novembre 2026",
    });
  });

  it("renvoie une note vide s'il n'y a pas de parenthèses", () => {
    expect(splitHeading("Formation")).toEqual({ name: "Formation", note: "" });
  });
});

describe("sous-puce juste après un titre", () => {
  it("ne se rattache pas à la puce de la section précédente (titre ##)", () => {
    const profile = parseProfile("# Cyril\n## A\n- Puce A\n## B\n  - orpheline\n");
    expect(profile.sections[0].items[0].children).toEqual([]);
  });

  it("ne se rattache pas à la puce de la section précédente (titre ###)", () => {
    const profile = parseProfile("# Cyril\n## A\n- Puce A\n### Sous-section\n  - orpheline\n");
    expect(profile.sections[0].items[0].children).toEqual([]);
  });
});

describe("erreurs claires", () => {
  it("nomme la section manquante", () => {
    const profile = parseProfile("# Cyril\n## Projets\n");
    expect(() => getCartouche(profile)).toThrow("la section « En bref » est introuvable");
  });

  it("nomme la puce manquante et sa section", () => {
    const profile = parseProfile("# Cyril\n## En bref\n- Localisation : Toulouse\n## Projets\n");
    expect(() => getCartouche(profile)).toThrow("la puce « Titre » est introuvable dans « En bref »");
  });

  it("dit qu'une puce sans lien doit en contenir un", () => {
    const profile = parseProfile(
      "# Cyril\n## En bref\n- Titre : Dev\n- Localisation : Toulouse\n- Début de la reconversion : mai 2026\n- Disponibilité : un mois\n- Contact : pas un email\n## Projets\n",
    );
    expect(() => getCartouche(profile)).toThrow("doit contenir un lien ou un email");
  });

  it("refuse un projet sans période entre parenthèses", () => {
    const profile = parseProfile("# Cyril\n## Projets\n### Projet sans dates\n");
    expect(() => getProjects(profile)).toThrow("période illisible");
  });
});

describe("parcours professionnel", () => {
  it("sépare le poste et la période", () => {
    const profile = parseProfile(
      "# Cyril\n## Parcours professionnel\n### Technicien, ATR (depuis juin 2023)\nAssemblage.\n- Une puce\n",
    );
    expect(getJobs(profile)).toEqual([
      {
        title: "Technicien, ATR",
        period: "depuis juin 2023",
        description: ["Assemblage."],
        items: [{ text: "Une puce", children: [] }],
      },
    ]);
  });
});

describe("vrai fichier profile.md", () => {
  const profile = toPublicProfile(loadProfile());

  it("ne contient ni questions fréquentes ni difficultés résolues", () => {
    expect(profile.sections.map((s) => s.title)).not.toContain("Questions fréquentes");
    const labels = profile.sections.flatMap((s) => s.subsections.flatMap((sub) => sub.items.map((i) => i.label)));
    expect(labels.some((label) => label?.startsWith("Difficult"))).toBe(false);
  });

  it("donne les données du cartouche", () => {
    const cartouche = getCartouche(profile);
    expect(cartouche.name).toBe("Cyril Foucher");
    expect(cartouche.title).not.toBe("");
    expect(cartouche.email.href).toMatch(/^mailto:/);
    expect(cartouche.onlineProjects).toBeGreaterThan(0);
  });

  it("numérote les projets, le plus ancien étant RÉF. 01", () => {
    const projects = getProjects(profile);
    expect(projects[projects.length - 1].ref).toBe("RÉF. 01");
    expect(projects[0].ref).toBe(`RÉF. 0${projects.length}`);
  });
});
