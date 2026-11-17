import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AnswerText from "@/components/AnswerText";

function render(text: string): string {
  return renderToStaticMarkup(createElement(AnswerText, { text }));
}

describe("AnswerText", () => {
  it("affiche le gras, l'italique et les listes", () => {
    const html = render("**DevKnowledge** et *Autour du Monde*\n\n- un\n- deux");
    expect(html).toContain("<strong>DevKnowledge</strong>");
    expect(html).toContain("<em>Autour du Monde</em>");
    expect(html).toContain("<li>un</li>");
  });

  it("ouvre les liens dans un nouvel onglet, sans accès à la page d'origine", () => {
    const html = render("[Site](https://example.com)");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("neutralise les adresses javascript:", () => {
    expect(render("[clic](javascript:alert(1))")).not.toContain("javascript:");
  });

  it("n'affiche aucune image", () => {
    expect(render("![logo](https://example.com/pixel.png)")).not.toContain("<img");
  });

  it("n'exécute pas le HTML brut", () => {
    const html = render('<script>alert(1)</script> <b onclick="x()">texte</b>');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<b ");
  });

  it("retire les titres mais garde leur texte", () => {
    const html = render("# Titre\n\nTexte");
    expect(html).not.toContain("<h1");
    expect(html).toContain("Titre");
  });
});
