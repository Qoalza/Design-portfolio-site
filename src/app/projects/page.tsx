import Link from "next/link";
import { getAllProjects } from "../../lib/projects";

export default function ProjectsPage() {
  const projects = getAllProjects();

  return (
    <main>
      <ul>
        {projects.map((project) => (
          <li key={project.slug}>
            <h1>
              <Link href={`/projects/${project.slug}`}>{project.title}</Link>
            </h1>
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
          </li>
        ))}
      </ul>
    </main>
  );
}
