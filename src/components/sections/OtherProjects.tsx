import Section, { Prose } from "@/components/ui/Section";
import ProjectFeature from "@/components/ProjectFeature";
import ProjectList from "@/components/ProjectList";
import { getProjects } from "@/data/projects";

export default function OtherProjects() {
  const projects = getProjects();
  const featured = projects.filter((p) => p.featured);

  return (
    <Section
      title={
        <>
          Some of my {" "}
          <span className="text-accent-2">other projects</span> :)
        </>
      }
    >
      <Prose delay={0.1} className="mt-6 max-w-xl">
        Simulators, algorithms, half-finished projects, most of it can be found on my Github!
      </Prose>

      {/* The image side alternates left / right / left down the column. The flip
          is the one arbitrary selector below — even blocks send their
          `.feature-media` to the second grid column via `order`. Same DOM at
          every width; nothing mounts or unmounts across the breakpoint. */}
      <div className="mt-16 space-y-20 md:mt-20 md:space-y-28 md:[&>*:nth-child(even)_.feature-media]:order-last">
        {featured.map((project, i) => (
          <ProjectFeature key={project.slug} project={project} index={i + 1} />
        ))}
      </div>

      <ProjectList />
    </Section>
  );
}
