import "@radix-ui/themes/styles.css";
import "./admin.css";
import { EyeOpenIcon } from "@radix-ui/react-icons";
import { Badge, Box, Button, Callout, Dialog, DropdownMenu, Flex, Heading, Tabs, Text, TextField, Theme } from "@radix-ui/themes";
import { StrictMode, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type { ProjectImage, ProjectVisibility } from "../../../src/lib/project-contract";
import type { ProjectVisualTemplateId } from "../../../src/lib/project-visual-registry";
import { ConfirmDialog, IssueDialog, NewProjectDialog, PublishOverlay } from "./admin-dialogs";
import { CardEditor, PageEditor } from "./admin-editor";
import type { AdminProject, ChangeInventory, FieldIssue, PublishJob } from "./admin-model";
import { ApiError } from "./admin-model";
import { ProjectNavigation, type ProjectFilter, visibilityLabels } from "./admin-navigation";
import { CardSettings, PageSettings, ProjectActions } from "./admin-rail";
import { SavedMark } from "./admin-ui";

type SaveState = "saved" | "dirty" | "saving" | "restored";
const csrf = document.body.dataset.csrf ?? "";
const publishMode = document.body.dataset.publishMode === "live" ? "live" : "sandbox";
const draftKey = (slug: string) => `des-art-admin:draft:${slug}`;
const emptyInventory: ChangeInventory = { count: 0, projects: [] };
const saveLabels: Record<SaveState, string> = {
  saved: "Все изменения сохранены",
  dirty: "Есть неопубликованные изменения",
  saving: "Сохранение…",
  restored: "Восстановлен локальный черновик",
};

async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "content-type": "application/json", "x-des-art-csrf": csrf, ...options.headers },
  });
  const value = await response.json() as T & { errorTitle?: string; error?: string; issues?: FieldIssue[] };
  if (!response.ok) throw new ApiError(value.errorTitle || "Действие не выполнено", value.error || "Причину не удалось определить автоматически. Требуется ручная диагностика разработчиком.", value.issues ?? []);
  return value;
}

function safeMessage(error: unknown): string {
  return error instanceof ApiError
    ? `${error.title}. ${error.message}`
    : "Действие не выполнено. Причину не удалось определить автоматически; требуется ручная диагностика разработчиком.";
}

function App() {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [inventory, setInventory] = useState<ChangeInventory>(emptyInventory);
  const [current, setCurrent] = useState<AdminProject | null>(null);
  const [filter, setFilter] = useState<ProjectFilter>("published");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("card");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [message, setMessage] = useState("");
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>();
  const [job, setJob] = useState<PublishJob | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<"project" | "all" | "delete" | "shutdown">();
  const [reviewIssues, setReviewIssues] = useState<FieldIssue[]>([]);
  const [figmaConnected, setFigmaConnected] = useState(false);
  const [figmaOpen, setFigmaOpen] = useState(false);
  const [figmaToken, setFigmaToken] = useState("");
  const dirty = useRef(false);
  const latest = useRef<AdminProject | null>(null);

  const refresh = async () => {
    const [nextProjects, nextInventory] = await Promise.all([
      api<AdminProject[]>("/api/projects"),
      api<ChangeInventory>("/api/changes"),
    ]);
    setProjects(nextProjects);
    setInventory(nextInventory);
  };

  useEffect(() => {
    let active = true;
    Promise.all([api<AdminProject[]>("/api/projects"), api<ChangeInventory>("/api/changes"), api<{ connected: boolean }>("/api/figma/status")])
      .then(([nextProjects, nextInventory, figma]) => {
        if (!active) return;
        setProjects(nextProjects);
        setInventory(nextInventory);
        setFigmaConnected(figma.connected);
      })
      .catch((error) => { if (active) setMessage(safeMessage(error)); });
    return () => { active = false; };
  }, []);

  useEffect(() => { latest.current = current; }, [current]);
  useEffect(() => {
    if (!current || !dirty.current) return;
    localStorage.setItem(draftKey(current.slug), JSON.stringify({ savedAt: Date.now(), project: current }));
    setSaveState("dirty");
    const timeout = window.setTimeout(async () => {
      setSaveState("saving");
      try {
        await api(`/api/drafts/${current.slug}`, { method: "PUT", body: JSON.stringify(current) });
        dirty.current = false;
        localStorage.removeItem(draftKey(current.slug));
        setSaveState("saved");
        await refresh();
        const validation = await api<{ valid: boolean; issues: FieldIssue[] }>("/api/validate", { method: "POST", body: JSON.stringify({ scope: "project", slug: current.slug }) });
        setIssues(validation.issues);
      } catch (error) {
        setMessage(safeMessage(error));
        setSaveState("dirty");
      }
    }, 450);
    return () => clearTimeout(timeout);
  }, [current]);

  const flush = async () => {
    if (!dirty.current || !latest.current) return;
    const project = latest.current;
    await api(`/api/drafts/${project.slug}`, { method: "PUT", body: JSON.stringify(project) });
    dirty.current = false;
    localStorage.removeItem(draftKey(project.slug));
    setSaveState("saved");
    await refresh();
  };

  const openProject = async (slug: string) => {
    await flush();
    setMessage("");
    setIssues([]);
    const server = await api<AdminProject>(`/api/projects/${slug}`);
    const backup = localStorage.getItem(draftKey(slug));
    if (backup) {
      try {
        const value = JSON.parse(backup).project as AdminProject;
        if (value.slug === slug) {
          setCurrent(value);
          dirty.current = true;
          setSaveState("restored");
          setSelectedSection(value.content.find((block) => block.type === "section")?.adminId);
          return;
        }
      } catch {
        localStorage.removeItem(draftKey(slug));
      }
    }
    setCurrent(server);
    dirty.current = false;
    setSaveState("saved");
    setSelectedSection(server.content.find((block) => block.type === "section")?.adminId);
  };

  const update = (patch: Partial<AdminProject>) => {
    dirty.current = true;
    setIssues([]);
    setCurrent((value) => value ? { ...value, ...patch } : null);
  };

  const upload = async (file: File, context: string, policy: { templateId: string; slot: string; operation: "replace" | "add" }) => {
    if (!current) throw new ApiError("Проект не выбран", "Сначала выберите проект и повторите загрузку.");
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.onerror = () => reject(new ApiError("Изображение не удалось открыть", "Выберите файл ещё раз. Если ошибка повторится, экспортируйте изображение заново и загрузите новую копию."));
      reader.readAsDataURL(file);
    });
    return api<ProjectImage>(`/api/projects/${current.slug}/upload`, {
      method: "POST",
      body: JSON.stringify({ name: file.name, mime: file.type, data, alt: context, ...policy }),
    });
  };
  const uploadLogo = async (file: File) => {
    if (!current) throw new ApiError("Проект не выбран", "Сначала выберите проект и повторите загрузку.");
    const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.onerror = () => reject(new ApiError("SVG не удалось открыть", "Выберите файл ещё раз. Если ошибка повторится, экспортируйте SVG заново и загрузите новую копию.")); reader.readAsDataURL(file); });
    return api<AdminProject["logo"]>(`/api/projects/${current.slug}/logo`, { method: "POST", body: JSON.stringify({ name: file.name, data }) });
  };
  const importFigma = async (surface: "catalog" | "hero" | "section", templateId: ProjectVisualTemplateId | undefined, url: string, sectionId?: string) => {
    if (!current) throw new ApiError("Проект не выбран", "Сначала выберите проект и повторите импорт.");
    await flush();
    const next = await api<AdminProject>(`/api/projects/${current.slug}/figma-template`, {
      method: "POST",
      body: JSON.stringify({ surface, templateId, url, sectionId }),
    });
    dirty.current = false;
    localStorage.removeItem(draftKey(next.slug));
    setCurrent(next);
    setSaveState("saved");
    await refresh();
  };
  const preview = (route: "home" | "catalog" | "project" = "project") => {
    if (!current) return;
    const popup = window.open("about:blank", "des-art-preview");
    if (popup) popup.document.title = "Подготовка предпросмотра…";
    void (async () => {
      try {
        await flush();
        const result = await api<{ ready: true; url: string }>(`/api/preview/${current.slug}`, {
          method: "POST",
          body: JSON.stringify({ route }),
        });
        if (popup) popup.location.href = result.url;
        else window.open(result.url, "des-art-preview");
      } catch (error) {
        popup?.close();
        const nextIssues = error instanceof ApiError ? error.issues : [];
        setIssues(nextIssues);
        if (nextIssues.length) setReviewIssues(nextIssues);
        setMessage(safeMessage(error));
      }
    })();
  };

  const setVisibility = async (visibility: ProjectVisibility) => {
    if (!current) return;
    await flush();
    const next = await api<AdminProject>(`/api/projects/${current.slug}/visibility`, {
      method: "POST",
      body: JSON.stringify({ visibility }),
    });
    setCurrent(next);
    setFilter(visibility);
    await refresh();
  };

  const requestHome = (enabled: boolean) => {
    if (!current) return;
    if (!enabled) {
      update({ homePlacement: undefined });
      return;
    }
    const placement = current.designProfile === "corvo-v1" ? "primary" : current.designProfile === "sarafan-v1" ? "secondary" : undefined;
    if (!placement) { setMessage("Для этого code-owned профиля позиция на главной не предусмотрена."); return; }
    const occupied = projects.find((item) => item.slug !== current.slug && item.homePlacement === placement && item.visibility === "published");
    if (occupied) { setMessage(`Позиция ${placement} уже занята проектом «${occupied.title}». Изменение размещения требует правки кода.`); return; }
    update({ homePlacement: placement });
  };

  const createProject = async (title: string, slug?: string) => {
    const project = await api<AdminProject>("/api/projects", { method: "POST", body: JSON.stringify({ title, slug }) });
    setCreateOpen(false);
    setFilter("draft");
    await refresh();
    await openProject(project.slug);
  };

  const startPublish = async (scope: "project" | "all", confirmed = false) => {
    await flush();
    const validation = await api<{ valid: boolean; issues?: FieldIssue[]; projects?: ChangeInventory["projects"] }>("/api/validate", { method: "POST", body: JSON.stringify({ scope, slug: current?.slug }) });
    const invalidIssues = validation.issues ?? validation.projects?.flatMap((item) => item.valid ? [] : item.issues.map((issue) => ({ ...issue, projectSlug: item.slug, projectTitle: item.title }))) ?? [];
    if (!validation.valid) { setReviewIssues(invalidIssues); return; }
    if (!confirmed) { setConfirmation(scope); return; }
    setConfirmation(undefined);
    const started = await api<PublishJob>("/api/publish/start", {
      method: "POST",
      body: JSON.stringify({ scope, slug: current?.slug }),
    });
    setJob(started);
  };

  useEffect(() => {
    if (!job || job.status === "complete" || job.status === "failed") return;
    const timer = window.setInterval(() => {
      api<PublishJob | null>("/api/publish/status")
        .then((value) => { if (value) setJob(value); })
        .catch(() => undefined);
    }, 600);
    return () => clearInterval(timer);
  }, [job]);

  useEffect(() => {
    if (job?.status !== "complete") return;
    void (async () => {
      await refresh();
      const project = latest.current;
      if (project) {
        const next = await api<AdminProject>(`/api/projects/${project.slug}`);
        setCurrent(next);
      }
    })().catch((error) => setMessage(safeMessage(error)));
  }, [job?.status]);

  const currentChange = useMemo(
    () => current ? inventory.projects.find((item) => item.slug === current.slug) : undefined,
    [current, inventory],
  );

  const permanentDelete = async () => {
    if (!current) return;
    await api(`/api/projects/${current.slug}/permanent`, { method: "DELETE" });
    setCurrent(null);
    await refresh();
  };

  return (
    <Theme accentColor="blue" grayColor="sand" radius="medium">
      <div className="admin-shell">
        <header className="admin-topbar">
          <div className="brand-lockup"><Heading size="4">Des-art Admin</Heading><Badge variant="soft" color={publishMode === "live" ? "green" : "gray"}>{publishMode === "live" ? "Связано с art-des.ru" : "Тестовый контур"}</Badge></div>
          <Text color="gray">{current?.title ?? "Проекты портфолио"}</Text>
          <Flex gap="3" align="center">
            <Text className="save-state" size="2" color={saveState === "dirty" || saveState === "restored" ? "orange" : "green"}>
              {saveState === "saved" ? <SavedMark>{saveLabels[saveState]}</SavedMark> : saveLabels[saveState]}
            </Text>
            <Button type="button" size="3" variant="soft" color={figmaConnected ? "green" : "gray"} onClick={() => setFigmaOpen(true)}>Figma · {figmaConnected ? "подключена" : "подключить"}</Button>
            {current ? <DropdownMenu.Root><DropdownMenu.Trigger><Button size="3" variant="soft" color="gray"><EyeOpenIcon />Предпросмотр</Button></DropdownMenu.Trigger><DropdownMenu.Content><DropdownMenu.Item onSelect={() => preview("home")}>Главная</DropdownMenu.Item><DropdownMenu.Item onSelect={() => preview("catalog")}>Все работы</DropdownMenu.Item><DropdownMenu.Item onSelect={() => preview("project")}>Страница проекта</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Root> : null}
          </Flex>
        </header>
        <main className="admin-workspace">
          <ProjectNavigation
            projects={projects}
            inventory={inventory}
            current={current?.slug}
            filter={filter}
            setFilter={setFilter}
            search={search}
            setSearch={setSearch}
            open={(slug) => void openProject(slug).catch((error) => setMessage(safeMessage(error)))}
            create={() => setCreateOpen(true)}
            reorder={(slugs) => void api<AdminProject[]>("/api/projects/reorder", { method: "POST", body: JSON.stringify({ slugs }) })
              .then(async (value) => { setProjects(value); setInventory(await api("/api/changes")); })
              .catch((error) => setMessage(safeMessage(error)))}
            publishAll={() => void startPublish("all").catch((error) => setMessage(safeMessage(error)))}
            shutdown={() => setConfirmation("shutdown")}
          />
          <section className="editor-area">
            {current ? (
              <div className="editor-inner">
                <div className="editor-title">
                  <div>
                    <Flex align="center" gap="3"><Heading size="7">{current.title}</Heading><Badge color={current.visibility === "published" ? currentChange ? "orange" : "green" : current.visibility === "deleted" ? "red" : "gray"}>{current.visibility === "published" && currentChange ? "Есть изменения" : visibilityLabels[current.visibility]}</Badge></Flex>
                    <Text size="2" color="gray">{publishMode === "live" ? "Черновик реального проекта" : "Редактирование локального черновика"}</Text>
                  </div>
                </div>
                {message ? <Callout.Root mb="4" color="orange"><Callout.Text>{message}</Callout.Text></Callout.Root> : null}
                <Tabs.Root value={tab} onValueChange={setTab}>
                  <Tabs.List><Tabs.Trigger value="card">Карточка</Tabs.Trigger><Tabs.Trigger value="page">Страница проекта</Tabs.Trigger></Tabs.List>
                  <Box pt="5">
                    <Tabs.Content value="card"><CardEditor project={current} update={update} uploadLogo={uploadLogo} importFigma={importFigma} issues={issues.length ? issues : currentChange?.issues ?? []} /></Tabs.Content>
                    <Tabs.Content value="page"><PageEditor project={current} update={update} upload={upload} importFigma={importFigma} selectedSection={selectedSection} selectSection={setSelectedSection} issues={issues.length ? issues : currentChange?.issues ?? []} /></Tabs.Content>
                  </Box>
                </Tabs.Root>
              </div>
            ) : (
              <div className="empty-state"><div><Heading size="5">Выберите проект</Heading><Text color="gray">Редактор откроется в центральной области.</Text></div></div>
            )}
          </section>
          <aside className="project-rail">
            {current ? (
              <div className="rail-stack">
                <ProjectActions
                  project={current}
                  changed={Boolean(currentChange)}
                  preview={() => preview("project")}
                  publish={() => void startPublish("project").catch((error) => setMessage(safeMessage(error)))}
                  setVisibility={(visibility) => void setVisibility(visibility).catch((error) => setMessage(safeMessage(error)))}
                  permanentDelete={() => setConfirmation("delete")}
                  issues={issues.length ? issues : currentChange?.issues ?? []}
                  reviewIssues={() => setReviewIssues(issues.length ? issues : currentChange?.issues ?? [])}
                />
                {tab === "card" ? (
                  <CardSettings project={current} update={update} home={requestHome} />
                ) : (
                      <PageSettings project={current} update={update} issues={issues.length ? issues : currentChange?.issues ?? []} />
                )}
              </div>
            ) : null}
          </aside>
        </main>
        <NewProjectDialog key={createOpen ? "open" : "closed"} open={createOpen} existingSlugs={projects.map((project) => project.slug)} close={() => setCreateOpen(false)} create={(title, slug) => void createProject(title, slug).catch((error) => setMessage(safeMessage(error)))} />
        <IssueDialog open={reviewIssues.length > 0} title="Что нужно исправить" issues={reviewIssues} close={() => setReviewIssues([])} navigate={(issue) => { void (async () => {
          setReviewIssues([]);
          if (issue.projectSlug && issue.projectSlug !== current?.slug) await openProject(issue.projectSlug);
          setTab(issue.tab ?? "card");
          if (issue.sectionId) setSelectedSection(issue.sectionId);
          requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-field="${CSS.escape(issue.field)}"]`)?.focus());
        })(); }} />
        <ConfirmDialog open={confirmation === "project" || confirmation === "all"} title={publishMode === "live" ? "Опубликовать на art-des.ru?" : "Запустить тестовую публикацию?"} description={publishMode === "live" ? "Админка проверит изменения, создаст Pull Request, выполнит merge и безопасно развернёт точный commit на production." : "Админка проверит файлы и покажет весь процесс. Production и публичный сайт не изменятся."} confirmLabel={publishMode === "live" ? "Опубликовать" : "Запустить"} close={() => setConfirmation(undefined)} confirm={() => void startPublish(confirmation as "project" | "all", true).catch((error) => setMessage(safeMessage(error)))} />
        <ConfirmDialog open={confirmation === "delete"} title={`Удалить «${current?.title ?? "проект"}» навсегда?`} description="Будут удалены локальный черновик и его локальные ассеты. Действие нельзя отменить." confirmLabel="Удалить навсегда" danger close={() => setConfirmation(undefined)} confirm={() => { setConfirmation(undefined); void permanentDelete().catch((error) => setMessage(safeMessage(error))); }} />
        <ConfirmDialog open={confirmation === "shutdown"} title="Завершить админку?" description="Все сохранённые черновики останутся на Mac и будут доступны при следующем запуске." confirmLabel="Завершить" close={() => setConfirmation(undefined)} confirm={() => void api("/api/shutdown", { method: "POST" })} />
        <Dialog.Root open={figmaOpen} onOpenChange={setFigmaOpen}>
          <Dialog.Content maxWidth="520px">
            <Dialog.Title>Подключить Figma</Dialog.Title>
            <Dialog.Description size="2" mb="4">Токен нужен только локальной Admin для чтения Frame. Он хранится в macOS Keychain и не попадает в проект или Git.</Dialog.Description>
            <TextField.Root type="password" size="3" placeholder="Personal access token" value={figmaToken} onChange={(event) => setFigmaToken(event.target.value)} />
            <Flex justify="end" gap="3" mt="5"><Dialog.Close><Button variant="soft" color="gray">Отмена</Button></Dialog.Close><Button disabled={!figmaToken.trim()} onClick={() => void api<{ connected: boolean }>("/api/figma/token", { method: "POST", body: JSON.stringify({ token: figmaToken }) }).then((value) => { setFigmaConnected(value.connected); setFigmaToken(""); setFigmaOpen(false); }).catch((error) => setMessage(safeMessage(error)))}>Сохранить подключение</Button></Flex>
          </Dialog.Content>
        </Dialog.Root>
        <PublishOverlay job={job} mode={publishMode} close={() => setJob(null)} />
      </div>
    </Theme>
  );
}

const root = document.querySelector("#admin-root");
if (!root) throw new Error("Не найден корневой элемент админки.");
createRoot(root).render(<StrictMode><App /></StrictMode>);
