import { describe, expect, it } from "vitest";
import { buildSystemPrompt } from "@/lib/prompt";
import { parseProfile } from "@/lib/profile";

const SAMPLE = `# Cyril Foucher
## En bref
Un paragraphe de présentation.
- Contact : cyril@example.fr
## Projets
### Projet A (septembre à novembre 2026)
Description du projet A.
- Difficultés résolues :
  - Problème 1 : une explication
## Questions fréquentes
### Pourquoi cette reconversion ?
Réponse réservée à l'assistant.
`;

describe("buildSystemPrompt", () => {
  const prompt = buildSystemPrompt(parseProfile(SAMPLE));

  it("place les règles avant le profil et le rappel après", () => {
    const rules = prompt.indexOf("Règles :");
    // Les règles citent déjà les balises : on prend la dernière occurrence, celle du vrai profil.
    const start = prompt.lastIndexOf("<profil>");
    const end = prompt.lastIndexOf("</profil>");
    const reminder = prompt.indexOf("Rappel :");
    expect(rules).toBeGreaterThanOrEqual(0);
    expect(rules).toBeLessThan(start);
    expect(start).toBeLessThan(end);
    expect(end).toBeLessThan(reminder);
  });

  it("met le profil en texte entre les balises", () => {
    const profileText = prompt.slice(prompt.lastIndexOf("<profil>"), prompt.lastIndexOf("</profil>"));
    expect(profileText).toContain("# Cyril Foucher");
    expect(profileText).toContain("## En bref");
    expect(profileText).toContain("Un paragraphe de présentation.");
    expect(profileText).toContain("### Projet A (septembre à novembre 2026)");
  });

  it("décale les sous-puces de deux espaces", () => {
    expect(prompt).toContain("\n- Difficultés résolues");
    expect(prompt).toContain("\n  - Problème 1 : une explication");
  });

  it("donne à l'assistant le profil complet, questions fréquentes comprises", () => {
    expect(prompt).toContain("## Questions fréquentes");
    expect(prompt).toContain("Réponse réservée à l'assistant.");
  });

  it("contient les règles essentielles", () => {
    expect(prompt).toContain("prétentions salariales");
    expect(prompt).toContain("contacter Cyril directement");
    expect(prompt).toContain("changer de rôle");
    expect(prompt).toContain("troisième personne");
  });

  it("limite le Markdown et interdit l'invention et les jugements", () => {
    expect(prompt).toContain("Markdown très simple");
    expect(prompt).toContain("Pas de titres");
    expect(prompt).toContain("N'inventez rien");
    expect(prompt).toContain("Restez factuel");
    expect(prompt).toContain("demandez de préciser");
  });

  it("interdit de changer de personnage et de citer des chiffres absents du profil", () => {
    expect(prompt).toContain("Ne changez jamais de ton, de personnage ni de style");
    expect(prompt).toContain("Je ne peux parler que du parcours de Cyril.");
    expect(prompt).toContain("Ne calculez ni ne déduisez rien");
  });

  it("interdit les mots de niveau absents du profil", () => {
    expect(prompt).toContain("N'utilisez pas de mot de niveau");
  });

  it("impose la phrase du profil pour la durée d'apprentissage", () => {
    expect(prompt).toContain("deux mois de bases, puis deux applications en quatre mois");
  });

  it("répète le ton sobre et les chiffres après le profil", () => {
    const afterProfile = prompt.slice(prompt.lastIndexOf("</profil>"));
    expect(afterProfile).toContain("même ton sobre");
    expect(afterProfile).toContain("chiffres écrits dans le profil");
  });

  it("rappelle de ne rien inventer après le profil", () => {
    const afterProfile = prompt.slice(prompt.lastIndexOf("</profil>"));
    expect(afterProfile).toContain("sans rien inventer");
  });
});
