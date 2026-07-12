import { evaluate } from "@mdx-js/mdx";
import { notFound } from "next/navigation";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { getProjectBySlug } from "../../../lib/projects";

type ProjectPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const { default: ProjectContent } = await evaluate(project.content, {
    Fragment,
    jsx,
    jsxs,
  });

  return (
    <main>
      <h1>{project.title}</h1>
      <p>{project.description}</p>
      <dl>
        <div>
          <dt>role</dt>
          <dd>{project.role}</dd>
        </div>
        <div>
          <dt>year</dt>
          <dd>{project.year}</dd>
        </div>
        <div>
          <dt>status</dt>
          <dd>{project.status}</dd>
        </div>
        <div>
          <dt>tags</dt>
          <dd>{project.tags.join(", ")}</dd>
        </div>
      </dl>
      <ProjectContent />
    </main>
  );
}
