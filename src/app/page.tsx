import Cartouche from "@/components/Cartouche";
import ExperienceList from "@/components/ExperienceList";
import InfoList from "@/components/InfoList";
import ProjectCard from "@/components/ProjectCard";
import Section from "@/components/Section";
import SkillsGrid from "@/components/SkillsGrid";
import type { Item } from "@/lib/profile";
import { getCartouche, getJobs, getProjects, loadProfile, toPublicProfile } from "@/lib/profile";

export default function Home() {
  // Profil sans ce qui est réservé à l'assistant (questions fréquentes, difficultés résolues)
  const profile = toPublicProfile(loadProfile());

  // Puces d'une section, cherchée par son titre dans profile.md
  function itemsOf(title: string): Item[] {
    const section = profile.sections.find((s) => s.title === title);
    if (!section) throw new Error(`profile.md : la section « ${title} » est introuvable.`);
    return section.items;
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 p-4 sm:p-8">
      <Cartouche data={getCartouche(profile)} />

      <Section operation="010" title="Projets">
        <div className="grid gap-6 md:grid-cols-2">
          {getProjects(profile).map((project) => (
            <ProjectCard key={project.ref} project={project} />
          ))}
        </div>
      </Section>

      <Section operation="020" title="Compétences">
        <SkillsGrid items={itemsOf("Compétences")} />
      </Section>

      <Section operation="030" title="Parcours">
        <ExperienceList jobs={getJobs(profile)} />
      </Section>

      <Section operation="040" title="Formation">
        <InfoList items={itemsOf("Formation")} />
      </Section>

      <Section operation="050" title="Points forts">
        <InfoList items={itemsOf("Points forts")} />
      </Section>

      <Section operation="060" title="Langues et divers">
        <InfoList items={itemsOf("Langues et divers")} />
      </Section>
    </main>
  );
}
