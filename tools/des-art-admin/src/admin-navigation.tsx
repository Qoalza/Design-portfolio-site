import { DragHandleDots2Icon, PlusIcon } from "@radix-ui/react-icons";
import { Badge, Button, Heading, IconButton, Text, TextField } from "@radix-ui/themes";
import { useEffect, useRef, useState } from "react";
import type { ProjectVisibility } from "../../../src/lib/project-contract";
import type { AdminProject, ChangeInventory } from "./admin-model";

export type ProjectFilter = ProjectVisibility;

const labels: Record<ProjectVisibility, string> = {
  draft: "Черновик",
  published: "Опубликован",
  deleted: "Удалён",
};

const filterLabels: Record<ProjectFilter, string> = {
  published: "Опубликованные",
  draft: "Черновики",
  deleted: "Удалённые",
};

export function ProjectNavigation({
  projects,
  inventory,
  current,
  filter,
  setFilter,
  search,
  setSearch,
  open,
  create,
  reorder,
  publishAll,
  shutdown,
}: {
  projects: AdminProject[];
  inventory: ChangeInventory;
  current?: string;
  filter: ProjectFilter;
  setFilter: (value: ProjectFilter) => void;
  search: string;
  setSearch: (value: string) => void;
  open: (slug: string) => void;
  create: () => void;
  reorder: (slugs: string[]) => void;
  publishAll: () => void;
  shutdown: () => void;
}) {
  const counts = {
    published: projects.filter((item) => item.visibility === "published").length,
    draft: projects.filter((item) => item.visibility === "draft").length,
    deleted: projects.filter((item) => item.visibility === "deleted").length,
  };
  const ordered = [...projects]
    .filter((item) => item.visibility === filter)
    .sort((first, second) => filter === "published" ? first.catalogOrder - second.catalogOrder : second.year - first.year)
    .filter((item) => item.title.toLowerCase().includes(search.toLowerCase()));
  const [dragged, setDragged] = useState<string>();
  const tabsRef = useRef<HTMLDivElement>(null);
  const selectFilter = (value: ProjectFilter) => {
    setFilter(value);
    requestAnimationFrame(() => tabsRef.current?.querySelector<HTMLElement>(`[data-filter="${value}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" }));
  };
  useEffect(() => {
    tabsRef.current?.querySelector<HTMLElement>(`[data-filter="${filter}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [filter]);
  return (
    <aside className="project-nav">
      <div className="nav-heading">
        <div>
          <Heading size="4">Проекты</Heading>
          <Text size="1" color="gray">Локальная рабочая область</Text>
        </div>
        <IconButton size="3" variant="soft" aria-label="Новый проект" onClick={create}><PlusIcon /></IconButton>
      </div>
      <div
        ref={tabsRef}
        className="nav-tabs"
        role="tablist"
        tabIndex={0}
        onWheel={(event) => {
          const element = event.currentTarget;
          if (element.scrollWidth <= element.clientWidth || event.deltaY === 0) return;
          element.scrollLeft += event.deltaY;
          event.preventDefault();
        }}
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.currentTarget.scrollBy({ left: event.key === "ArrowLeft" ? -120 : 120, behavior: "smooth" });
          event.preventDefault();
        }}
      >
        {(Object.keys(filterLabels) as ProjectFilter[]).map((item) => (
          <button role="tab" key={item} data-filter={item} aria-selected={filter === item} onClick={() => selectFilter(item)}>
            {filterLabels[item]} <span>{counts[item]}</span>
          </button>
        ))}
      </div>
      <TextField.Root size="3" placeholder="Найти проект" value={search} onChange={(event) => setSearch(event.target.value)} />
      <ol className="project-list">
        {ordered.map((project) => (
          <li
            key={project.slug}
            draggable={filter === "published"}
            onDragStart={() => setDragged(project.slug)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (!dragged || filter !== "published") return;
              const slugs = ordered.map((item) => item.slug);
              const from = slugs.indexOf(dragged);
              const to = slugs.indexOf(project.slug);
              slugs.splice(to, 0, slugs.splice(from, 1)[0]);
              reorder(slugs);
              setDragged(undefined);
            }}
          >
            <div className="project-row" data-active={current === project.slug}>
              {filter === "published" ? <DragHandleDots2Icon className="project-drag" /> : <span className="project-drag-spacer" />}
              <button onClick={() => open(project.slug)}>
                <span>{project.title}</span>
                <small>
                  <Badge color={project.visibility === "published" ? inventory.projects.some((item) => item.slug === project.slug) ? "orange" : "green" : project.visibility === "deleted" ? "red" : "gray"}>
                    {project.visibility === "published" && inventory.projects.some((item) => item.slug === project.slug) ? "Есть изменения" : labels[project.visibility]}
                  </Badge>
                  {project.year}
                </small>
              </button>
            </div>
          </li>
        ))}
      </ol>
      <div className="nav-footer">
        {inventory.count > 0 ? (
          <div className="change-summary">
            <div>
              <span className="change-dot" />
              <Text size="2" weight="medium">Есть неопубликованные изменения</Text>
            </div>
            <Text size="1" color="gray">Проектов: {inventory.count}</Text>
            <Button size="3" variant="outline" onClick={publishAll}>Опубликовать все · {inventory.count}</Button>
          </div>
        ) : null}
        <Button size="3" variant="ghost" color="gray" onClick={shutdown}>Завершить админку</Button>
      </div>
    </aside>
  );
}

export { labels as visibilityLabels };
