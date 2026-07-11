import { getAllProjects } from "../../lib/projects";

export default function ProjectsTestPage() {
  const projects = getAllProjects();

  return (
    <main>
      <ul aria-label="Технический список проектов">
        {projects.map((project) => (
          <li key={project.slug}>
            <ul>
              <li>title: {project.title}</li>
              <li>role: {project.role}</li>
              <li>year: {project.year}</li>
              <li>status: {project.status}</li>
              <li>tags: {project.tags.join(", ")}</li>
              <li>slug: {project.slug}</li>
            </ul>
          </li>
        ))}
      </ul>
    </main>
  );
}
