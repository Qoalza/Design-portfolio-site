import Image from "next/image";
import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";
import { MainProjectCard } from "../components/main-project-card";
import { ProjectPlatforms } from "../components/project-platforms";
import { ProjectDetailControl } from "../components/project-detail-control";
import { ProcessStepper } from "../components/process-stepper";
import { ControlButton, TextButton } from "../components/ui-controls";
import { HOME_TRAIL_ITEM } from "../lib/navigation-trail";
import { getCatalogProjects } from "../lib/projects";
import styles from "./page.module.css";

const assetRoot = "/assets/homepage";

function MaskIcon({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`${styles.maskIcon} ${className}`} />;
}

function SectionHeading({
  id,
  title,
  children,
  centered = false,
  width = "default",
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  centered?: boolean;
  width?: "default" | "ai";
}) {
  return (
    <div
      className={`${styles.sectionHeading} ${centered ? styles.centered : ""} ${
        width === "ai" ? styles.aiHeading : ""
      }`}
    >
      <h2 id={id}>
        <span aria-hidden="true">#</span>
        {title}
      </h2>
      <div className={styles.sectionLead}>{children}</div>
    </div>
  );
}

function HeroBackground() {
  return (
    <div className={styles.heroBackground} aria-hidden="true">
      <Image className={styles.heroOuterRing} src={`${assetRoot}/hero-ring-outer.svg`} alt="" width={1466} height={1466} priority />
      <Image className={styles.heroOuterDashedRing} src={`${assetRoot}/hero-ring-outer-dashed.svg`} alt="" width={1178} height={1178} priority />
      <Image className={styles.heroOuterAccent} src={`${assetRoot}/hero-ring-outer-accent.svg`} alt="" width={510} height={295} priority />
      <Image className={styles.heroInnerDashedRing} src={`${assetRoot}/hero-ring-inner-dashed.svg`} alt="" width={891} height={891} priority />
      <Image className={styles.heroInnerAccent} src={`${assetRoot}/hero-ring-inner-accent.svg`} alt="" width={208} height={271} priority />
      <Image className={styles.heroGlowSmall} src={`${assetRoot}/hero-glow-small.svg`} alt="" width={750} height={750} priority />
      <Image className={styles.heroGlowLarge} src={`${assetRoot}/hero-glow-large.svg`} alt="" width={1024} height={1024} priority />

      {[
        [styles.heroOrbitText, styles.heroIconStack],
        [styles.heroOrbitUser, styles.heroIconInstrument],
        [styles.heroOrbitBoolean, styles.heroIconBrush],
        [styles.heroOrbitComponent, styles.heroIconUnderline],
        [styles.heroOrbitUnderline, styles.heroIconComponent],
        [styles.heroOrbitBrush, styles.heroIconBoolean],
        [styles.heroOrbitInstrument, styles.heroIconUser],
        [styles.heroOrbitStack, styles.heroIconText],
      ].map(([positionClass, iconClass]) => (
        <span key={positionClass} className={`${styles.heroOrbitIcon} ${positionClass}`}>
          <MaskIcon className={iconClass} />
        </span>
      ))}
    </div>
  );
}

type ProjectActionsProps = {
  detailHref?: string;
  detailLabel?: string;
  figmaHref?: string;
  updatedAt?: string;
};

function ProjectActions({ detailHref, detailLabel, figmaHref, updatedAt }: ProjectActionsProps) {
  const hasFigma = Boolean(figmaHref);

  return (
    <div className={styles.projectActions}>
      <div className={styles.projectActionButtons}>
        {detailHref && detailLabel ? (
          <ProjectDetailControl
            availability="available"
            href={detailHref}
            breadcrumbLabel={detailLabel}
            className={styles.detailsButton}
          />
        ) : (
          <ProjectDetailControl availability="unavailable" className={styles.detailsButton} />
        )}
        {hasFigma ? (
          <ControlButton className={styles.figmaButton} variant="ghost" href={figmaHref} external iconRight={`${assetRoot}/project-share.svg`}>Figma</ControlButton>
        ) : (
          <ControlButton className={styles.unavailableButton} variant="ghost" disabled iconLeft={`${assetRoot}/project-info.svg`}>Файл пока недоступен</ControlButton>
        )}
      </div>
      {hasFigma && updatedAt ? (
        <>
          <span className={styles.actionDivider} />
          <span className={styles.updated}><MaskIcon className={styles.refreshIcon} />Обновлено {updatedAt}</span>
        </>
      ) : null}
    </div>
  );
}

function RadioSymbol() {
  return (
    <span className={styles.radioSymbol} aria-hidden="true">
      <span className={styles.radioLogoA}><Image src={`${assetRoot}/radio-logo-vector-a.svg`} alt="" fill sizes="15px" /></span>
      <span className={styles.radioLogoA}><Image src={`${assetRoot}/radio-logo-mask-a.svg`} alt="" fill sizes="15px" /></span>
      <span className={styles.radioLogoB}><Image src={`${assetRoot}/radio-logo-vector-b.svg`} alt="" fill sizes="5px" /></span>
      <span className={styles.radioLogoB}><Image src={`${assetRoot}/radio-logo-mask-b.svg`} alt="" fill sizes="5px" /></span>
      <span className={styles.radioLogoC}><Image src={`${assetRoot}/radio-logo-vector-c.svg`} alt="" fill sizes="15px" /></span>
      <span className={styles.radioLogoC}><Image src={`${assetRoot}/radio-logo-mask-c.svg`} alt="" fill sizes="15px" /></span>
      <span className={styles.radioLogoD}><Image src={`${assetRoot}/radio-logo-vector-d.svg`} alt="" fill sizes="5px" /></span>
    </span>
  );
}

function RadioVisual() {
  return (
    <div className={styles.projectVisual} aria-hidden="true">
      <Image className={styles.radioDashboard} src={`${assetRoot}/radio-dashboard.png`} alt="" width={2880} height={2518} />
      <Image className={styles.radioPlayer} src={`${assetRoot}/radio-player.png`} alt="" width={1688} height={612} />
      <Image className={styles.radioPayment} src={`${assetRoot}/radio-payment.png`} alt="" width={760} height={1100} />
    </div>
  );
}

function ProjectDetail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.projectDetail}>
      <Image src={`${assetRoot}/project-bullet.svg`} alt="" width={12} height={16} />
      <div>
        <dt>{label}</dt>
        <dd>{children}</dd>
      </div>
    </div>
  );
}

function ProjectTags({ tags }: { tags: string[] }) {
  return (
    <div className={styles.projectTags} aria-label="Теги проекта">
      {tags.map((tag, index) => (
        <span key={tag}>
          {index > 0 ? <i aria-hidden="true">/</i> : null}
          <b aria-hidden="true">#</b>
          {tag}
        </span>
      ))}
    </div>
  );
}

function MethodRow({ iconClass, title, children }: { iconClass: string; title: string; children: React.ReactNode }) {
  return (
    <li className={styles.methodRow}>
      <MaskIcon className={iconClass} />
      <span>
        <strong>{title}</strong>
        <small>{children}</small>
      </span>
    </li>
  );
}

export default function Home() {
  const corvo = getCatalogProjects().find((project) => project.slug === "corvo");

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <a className={styles.skipLink} href="#main-content">Перейти к содержимому</a>

        <SiteHeader
          homeActive
          navigationPage={{ item: HOME_TRAIL_ITEM, canonicalTrail: [HOME_TRAIL_ITEM] }}
          showBreadcrumbs={false}
        />

        <main id="main-content">
          <section className={styles.hero} aria-labelledby="hero-title">
            <HeroBackground />
            <div className={styles.heroBody}>
              <div className={styles.heroText}>
                <div className={styles.heroTitleGroup}>
                  <p className={styles.eyebrow}>PRODUCT DESIGNER</p>
                  <h1 id="hero-title">Привет, я Артур!</h1>
                </div>
                <p className={styles.heroLead}>Я продуктовый дизайнер: разбираюсь в сложных бизнес-процессах, превращаю их в понятные интерфейсы и довожу решения до реализации</p>
                <div className={styles.heroTags} aria-label="Направления работы">
                  <span><b>#</b> Design systems</span><i>/</i>
                  <span><b>#</b> Data-heavy</span><i>/</i>
                  <span><b>#</b> Enterprise systems</span><i>/</i>
                  <span><b>#</b> B2B</span><i>/</i>
                  <span><b>#</b> SaaS</span>
                </div>
              </div>
              <div className={styles.heroActions}>
                <ControlButton className={styles.darkButton} variant="neutral" href="#projects">Мои работы</ControlButton>
                <ControlButton className={styles.secondaryButton} variant="ghost" href="https://disk.yandex.ru/i/iZ1UWgbO1LAOPw" external iconRight={`${assetRoot}/download.svg`}>CV</ControlButton>
              </div>
            </div>
          </section>

          <section className={styles.projects} id="projects" aria-labelledby="projects-title">
            <div className={styles.projectsIntro}>
              <SectionHeading id="projects-title" title="То, над чем я работал" centered>
                <p>Здесь собрал рабочие проекты, тестовые задания.<br />Где можно увидеть мой подход к задаче и результат.</p>
              </SectionHeading>
              <ControlButton className={styles.textButton} variant="ghost" href="/projects" breadcrumbLabel="Работы" iconRight={`${assetRoot}/arrow-right.svg`}>Все работы</ControlButton>
            </div>

            {corvo ? <MainProjectCard project={corvo} headingLevel="h3" /> : null}

            <div className={styles.projectDivider} />

            <article className={`${styles.projectRow} ${styles.projectRowReverse}`}>
              <div className={styles.projectCopy}>
                <div className={styles.projectHeader}>
                  <div className={styles.projectTitle}>
                    <div><h3>Сараффан.Радио</h3><RadioSymbol /></div>
                    <p>Платформа для организации мероприятий</p>
                  </div>
                  <ProjectTags tags={["B2B2C", "Тестовое"]} />
                </div>
                <dl className={styles.projectDetails}>
                  <ProjectDetail label="Моя роль">Product designer / Product Analyst</ProjectDetail>
                  <ProjectDetail label="Что делал">Подробно продумал сценарии используя продуктовые инструменты: составлял User-Flow, Job Story, изучал косвенных конкурентов. Проектировал изолированный сценарий исходя из полученных данных и составленного флоу.</ProjectDetail>
                </dl>
                <ProjectPlatforms platforms={["Desktop"]} desktopOnlyLabel />
                <ProjectActions />
              </div>
              <RadioVisual />
            </article>
          </section>

          <section className={styles.process} aria-labelledby="process-title">
            <SectionHeading id="process-title" title="Начинаю не с макетов">
              <p>Сначала разбираюсь в продукте, бизнесе и самой задаче. Затем выбираю подходящие методы, собираю решение в систему и довожу его до продакшена.</p>
            </SectionHeading>

            <ProcessStepper>
              <article className={`${styles.processRow} ${styles.analyticsRow}`}>
                <div className={styles.processCopy}>
                  <span className={styles.processEyebrow}><b>01</b>Аналитика</span>
                  <div className={styles.processDescription}>
                    <h3>Погружаюсь в задачу и выбираю подход</h3>
                    <p>Изучаю требования и входящие данные, исследую рынок, конкурентов и процессы пользователей. Затем выбираю только те методы, которые требуются и/или есть запрос бизнеса в конкретной задаче.</p>
                  </div>
                  <div className={styles.methods}>
                    <ul>
                      <MethodRow iconClass={styles.jobStoriesIcon} title="Job Stories">Описание задачи пользователя через ситуацию и желаемый результат</MethodRow>
                      <MethodRow iconClass={styles.userFlowIcon} title="User Flow">Последовательность действий пользователя для достижения цели</MethodRow>
                      <MethodRow iconClass={styles.cjmIcon} title="CJM">Путь пользователя с шагами, проблемами и ожиданиями</MethodRow>
                    </ul>
                    <p className={styles.moreTools}>И еще множество инструментов...</p>
                  </div>
                </div>
                <div className={styles.analyticsMedia}>
                  <Image src={`${assetRoot}/process-discovery-515-30749.png`} alt="Схема аналитической работы над продуктом" width={2372} height={2284} unoptimized />
                </div>
              </article>

              <article className={`${styles.processRow} ${styles.designRow}`}>
                <div className={styles.designMedia}>
                  <Image src={`${assetRoot}/process-prototype-515-30751.png`} alt="Схема проектирования интерфейса" width={3128} height={2166} unoptimized />
                </div>
                <div className={styles.processCopy}>
                  <span className={styles.processEyebrow}><b>02</b>Проектирование</span>
                  <div className={styles.processDescription}>
                    <h3>Собираю решение в систему</h3>
                    <p>Когда задача и подход определены, перевожу решение в макеты и техническую основу продукта: создаю компоненты, состояния и токены, описываю гайдлайны и выстраиваю понятную структуру больших файлов</p>
                  </div>
                  <div className={styles.toolTags}><span>Дизайн система</span><span>Токены (variable)</span><span>Гайдлайны</span><span>Описание и поведение блоков</span><span>Макеты</span></div>
                </div>
              </article>

              <article className={`${styles.processRow} ${styles.deliveryRow}`}>
                <div className={styles.processCopy}>
                  <span className={styles.processEyebrow}><b>03</b>Финал</span>
                  <div className={styles.processDescription}>
                    <h3>Довожу решения до продакшена</h3>
                    <p>Работаю вместе с аналитиками, разработчиками и QA: уточняю логику, готовлю макеты к передаче, провожу дизайн-ревью и выстраиваю процессы так, чтобы между дизайном и готовым продуктом ничего не потерялось</p>
                  </div>
                </div>
                <div className={styles.deliveryMedia}>
                  <Image src={`${assetRoot}/process-delivery-515-30778.png`} alt="Схема передачи готового решения в разработку" width={3138} height={1944} unoptimized />
                </div>
              </article>
            </ProcessStepper>
          </section>

          <section className={styles.ai} aria-labelledby="ai-title">
            <SectionHeading id="ai-title" title="AI в рабочем процессе" width="ai">
              <p>AI помогает мне быстрее разбираться в задачах, проверять идеи и превращать их в рабочие решения, но выбор подхода и финальный результат остаются за мной</p>
            </SectionHeading>
            <div className={styles.aiGrid}>
              <article><Image src={`${assetRoot}/chatgpt.svg`} alt="" width={32} height={32} /><div><h3>ChatGPT</h3><p>Использую его, чтобы разложить входящие данные, обсудить идею и посмотреть на решение с другой стороны. Проверяю логику сценариев, ищу слабые места, изучаю незнакомые темы, анализирую материалы и привожу в порядок тексты.</p></div></article>
              <article><Image src={`${assetRoot}/codex.svg`} alt="" width={32} height={32} /><div><h3>Codex</h3><p>Подключаю, когда идею хочется проверить не только в макете, но и в работе. С его помощью собираю прототипы, небольшие приложения, скрипты и инструменты, разбираюсь в технической части и постепенно дорабатываю результат через диалог.</p></div></article>
            </div>
            <aside className={styles.aiFact} aria-label="О разработке сайта">
              <span className={styles.aiFactIcon} aria-hidden="true" />
              <p>Вся разработка данного сайта, была полностью выполнена мной в Codex, с нуля. Дизайн был разработан отдельно.</p>
              <span className={styles.aiFactDivider} aria-hidden="true" />
              <TextButton
                external
                href="https://www.figma.com/design/5ZzspE0OrqesDcTP0RRPHr/Концепт?node-id=510-28120"
                iconRight={`${assetRoot}/project-share.svg`}
                size="large"
                variant="neutralAccent"
              >
                Figma
              </TextButton>
            </aside>
          </section>

          <section className={styles.resume} aria-labelledby="resume-title">
            <div className={styles.resumeIntro}>
              <SectionHeading id="resume-title" title="Резюме" centered>
                <div className={styles.contacts}>
                  <a href="mailto:Qoalza01@gmail.com">Qoalza01@gmail.com</a>
                  <span aria-hidden="true">/</span>
                  <a href="https://t.me/Coco_soul" target="_blank" rel="noreferrer">@Coco_soul</a>
                </div>
              </SectionHeading>
              <ControlButton className={styles.cvButton} variant="light" href="https://disk.yandex.ru/i/iZ1UWgbO1LAOPw" external iconRight={`${assetRoot}/download.svg`}>Полное CV</ControlButton>
            </div>

            <div className={styles.experienceList}>
              <article className={styles.eyeconExperience}>
                <div className={styles.tenure}>
                  <span className={styles.tenureIcon}><Image src={`${assetRoot}/experience-crest.svg`} alt="" width={44} height={44} /></span>
                  <div><strong>4 года</strong><span>10 месяцев</span></div>
                </div>
                <div className={styles.eyeconContent}>
                  <div className={styles.eyeconDetails}>
                    <div><h3>Eyeconweb</h3><a href="https://eyeconweb.net/" target="_blank" rel="noreferrer">www.eyeconweb.net</a></div>
                    <p className={styles.inlineRole}><strong>Product Designer</strong><Image src={`${assetRoot}/experience-meta-separator.svg`} alt="" width={4} height={7} /><span>Август 2021 — Май 2026</span></p>
                    <p>Проектировал высоконагруженные B2B/B2E и SaaS продукты со сложной бизнес-логикой. Формализовывал требования, выстраивал структуру и сценарии, создавал прототипы, интерфейсы и дизайн-системы, а также налаживал работу между дизайном, разработкой, аналитикой и тестированием.</p>
                  </div>
                  <div className={styles.eyeconTags}><span>B2B</span><span>Design Systems</span><span>User Flow</span><span>CJM</span><span>Wireframes</span><span>UX Research</span></div>
                </div>
                <Image className={styles.experienceStar} src={`${assetRoot}/experience-star.svg`} alt="" width={32} height={32} />
              </article>

              <div className={styles.experienceDivider} />

              <div className={styles.earlierExperience}>
                <article className={styles.freelanceExperience}>
                  <div className={styles.freelanceTitle}>
                    <span><MaskIcon className={styles.briefcaseIcon} /></span>
                    <div><h3>Фриланс</h3><p>Сайт отсутствует</p></div>
                  </div>
                  <p className={styles.inlineRole}><strong>Product Designer</strong><Image src={`${assetRoot}/experience-meta-separator.svg`} alt="" width={4} height={7} /><span>Ноябрь 2019 – Декабрь 2023</span></p>
                  <p>Проектировал веб и мобильные продукты для разных отраслей: от стартапов и SaaS до корпоративных систем. Прорабатывал бизнес-задачи и пользовательские сценарии, создавал прототипы и готовые интерфейсы, формировал визуальный язык и разрабатывал дизайн-системы.</p>
                  <div className={styles.freelanceTags}><span><b>#</b> iOS</span><i>/</i><span><b>#</b> Andoid</span><i>/</i><span><b>#</b> Web</span></div>
                  <strong className={styles.freelanceTenure}>4 года, 2 месяца</strong>
                </article>

                <div className={styles.shortExperiences}>
                  <article>
                    <div className={styles.shortHeader}>
                      <div><h3>Vexel</h3><a href="https://vexel.com/ru/" target="_blank" rel="noreferrer">vexel.com</a></div>
                      <p><strong>Product Designer</strong><span>Декабрь 2020 — Июль 2021</span></p>
                    </div>
                    <p>Работал над экосистемой криптовалютного банка, внутренними операционными системами</p>
                  </article>
                  <article>
                    <div className={styles.shortHeader}>
                      <div><h3>Agima</h3><a href="https://www.agima.ru/" target="_blank" rel="noreferrer">www.agima.ru</a></div>
                      <p><strong>UX Designer</strong><span>Август 2020 — Октябрь 2020</span></p>
                    </div>
                    <p>Занимался аналитикой и переработкой UX, раздела “Поддержки” для <strong>МКБ Банка</strong> и внутренним продуктом</p>
                  </article>
                </div>
              </div>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
