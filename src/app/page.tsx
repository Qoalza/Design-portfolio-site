import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

const assetRoot = "/assets/homepage";

const experience = [
  {
    duration: ["4 года", "10 месяцев"],
    company: "Eyeconweb",
    companyUrl: "https://www.eyeconweb.net",
    site: "www.eyeconweb.net",
    role: "Product Designer",
    period: "Август 2021 — Май 2026",
    text: "Проектировал высоконагруженные B2B/B2E и SaaS продукты со сложной бизнес-логикой. Формализовывал требования, выстраивал структуру и сценарии, создавал прототипы, интерфейсы и дизайн-системы, а также налаживал работу между дизайном, разработкой, аналитикой и тестированием.",
    tags: ["B2B", "Design Systems", "Wireframes", "Information Architecture", "UX Research"],
    logo: `${assetRoot}/eyeconweb.svg`,
  },
  {
    duration: ["4 года,", "2 месяца"],
    company: "Фриланс",
    companyUrl: undefined,
    site: "Сайт отсутствует",
    role: "Product Designer",
    period: "Ноябрь 2019 – Декабрь 2023",
    text: "Проектировал веб- и мобильные продукты для разных отраслей: от стартапов и SaaS до корпоративных систем. Прорабатывал бизнес-задачи и пользовательские сценарии, создавал прототипы и готовые интерфейсы, формировал визуальный язык и разрабатывал дизайн-системы.",
    tags: ["# iOS", "# Android", "# Web"],
    logo: undefined,
  },
  {
    duration: [],
    company: "Vexel",
    companyUrl: "https://vexel.com",
    site: "vexel.com",
    role: "Product Designer",
    period: "Декабрь 2020 — Июль 2021",
    text: "Работал над экосистемой криптовалютного банка, внутренними операционными системами.",
    tags: ["B2B", "Fintech", "Design Systems"],
    logo: undefined,
  },
  {
    duration: [],
    company: "Agima",
    companyUrl: "https://www.agima.ru",
    site: "www.agima.ru",
    role: "UX Designer",
    period: "Август 2020 — Октябрь 2020",
    text: "Занимался аналитикой и переработкой UX раздела «Поддержка» для МКБ Банка и внутренним продуктом.",
    tags: ["UX Research", "Enterprise"],
    logo: undefined,
  },
] as const;

function SectionHeading({
  id,
  title,
  children,
  centered = false,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  centered?: boolean;
}) {
  return (
    <div className={`${styles.sectionHeading} ${centered ? styles.centered : ""}`}>
      <h2 id={id}>
        <span aria-hidden="true">#</span>
        {title}
      </h2>
      <div className={styles.sectionLead}>{children}</div>
    </div>
  );
}

function ProjectVisual({ variant }: { variant: "corvo" | "radio" }) {
  if (variant === "corvo") {
    return (
      <div className={`${styles.projectVisual} ${styles.corvoVisual}`} aria-hidden="true">
        <Image src={`${assetRoot}/corvo-dashboard.png`} alt="" width={2960} height={2400} />
        <Image src={`${assetRoot}/corvo-product.png`} alt="" width={2960} height={2400} />
      </div>
    );
  }

  return (
    <div className={`${styles.projectVisual} ${styles.radioVisual}`} aria-hidden="true">
      <Image src={`${assetRoot}/radio-dashboard.png`} alt="" width={2880} height={2518} />
      <Image src={`${assetRoot}/radio-player.png`} alt="" width={1688} height={612} />
      <Image src={`${assetRoot}/radio-payment.png`} alt="" width={760} height={1100} />
    </div>
  );
}

export default function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <a className={styles.skipLink} href="#main-content">Перейти к содержимому</a>
        <header className={styles.header}>
          <Link className={styles.brand} href="/" aria-label="На главную">
            <Image src={`${assetRoot}/logo.svg`} alt="" width={48} height={48} priority />
            <span>
              <strong>ART</strong>
              <small>Design</small>
            </span>
          </Link>

          <nav className={styles.nav} aria-label="Основная навигация">
            <Link className={styles.navActive} href="/" aria-current="page">
              <Image src={`${assetRoot}/home.svg`} alt="" width={16} height={16} /> Главная
            </Link>
            <span aria-disabled="true">Блог</span>
            <span aria-disabled="true">Лаборатория</span>
          </nav>

          <div className={styles.headerActions}>
            <span className={styles.availability}><Image src={`${assetRoot}/status.svg`} alt="" width={6} height={8} />Открыт к предложениям</span>
            <a className={styles.primaryButton} href="mailto:Qoalza01@gmail.com">
              Связаться
            </a>
          </div>
        </header>

        <main id="main-content">
          <section className={styles.hero} aria-labelledby="hero-title">
            <Image
              className={styles.heroOrbit}
              src={`${assetRoot}/hero-orbit.png`}
              alt=""
              width={1440}
              height={1431}
              priority
            />
            <div className={styles.heroContent}>
              <p className={styles.eyebrow}>PRODUCT DESIGNER</p>
              <h1 id="hero-title">Артур Арустамян</h1>
              <p className={styles.heroLead}>
                Систематизирую сложные бизнес-процессы, проектирую интерфейсы и сопровождаю решения от требований до реализации
              </p>
              <div className={styles.heroTags} aria-label="Направления работы">
                <span># Design systems</span><i>/</i><span># Data-heavy</span><span># Enterprise systems</span><span># B2B</span><span># SaaS</span>
              </div>
            </div>
            <div className={styles.heroActions}>
              <a className={styles.darkButton} href="#projects">Мои работы</a>
              <span className={styles.secondaryButton} aria-disabled="true" title="Файл CV будет добавлен позже">CV <Image src={`${assetRoot}/download.svg`} alt="" width={16} height={16} /></span>
            </div>
          </section>

          <section className={styles.projects} id="projects" aria-labelledby="projects-title">
            <div className={styles.projectsIntro}>
              <SectionHeading id="projects-title" title="То, над чем я работал" centered>
                <p>Здесь собрал рабочие проекты, тестовые задания.<br />Где можно увидеть мой подход к задаче и результат.</p>
              </SectionHeading>
              <Link className={styles.textButton} href="/projects">Все работы <Image src={`${assetRoot}/arrow-right.svg`} alt="" width={16} height={16} /></Link>
            </div>

            <article className={styles.projectRow}>
              <ProjectVisual variant="corvo" />
              <div className={styles.projectCopy}>
                <div className={styles.badges}><span>B2B SaaS</span><span>Готов частично</span></div>
                <h3>Corvo</h3>
                <p className={styles.projectSubtitle}>Система для управления партнёрской программой</p>
                <dl className={styles.projectDetails}>
                  <div><dt>Моя роль</dt><dd>Продуктовый дизайнер</dd></div>
                  <div><dt>Что делал</dt><dd>Собрал дизайн-систему, согласовал её с ключевыми стейкхолдерами и выстроил процесс с разработчиками. Спроектировал сервис с нуля и обрабатывал обращения бизнес-аналитика.</dd></div>
                </dl>
                <Link className={styles.projectLink} href="/projects/example-project">Подробнее <Image src={`${assetRoot}/arrow-right.svg`} alt="" width={16} height={16} /></Link>
                <p className={styles.updated}>Обновлено 13.05.2026</p>
              </div>
            </article>

            <article className={`${styles.projectRow} ${styles.projectRowReverse}`}>
              <div className={styles.projectCopy}>
                <div className={styles.badges}><span>B2B2C</span><span>Тестовое</span></div>
                <h3>Сараффан.Радио</h3>
                <p className={styles.projectSubtitle}>Платформа для организации мероприятий</p>
                <dl className={styles.projectDetails}>
                  <div><dt>Моя роль</dt><dd>Продуктовый дизайнер / Аналитик</dd></div>
                  <div><dt>Что делал</dt><dd>Продумал сценарии с помощью продуктовых инструментов: составлял User Flow и Job Story, изучал косвенных конкурентов. Спроектировал изолированный сценарий по собранным данным.</dd></div>
                </dl>
                <span className={`${styles.projectLink} ${styles.disabledLink}`} aria-disabled="true">Файл недоступен</span>
              </div>
              <ProjectVisual variant="radio" />
            </article>
          </section>

          <section className={styles.process} aria-labelledby="process-title">
            <SectionHeading id="process-title" title="Начинаю не с макетов">
              <p>Сначала разбираюсь в продукте, бизнесе и самой задаче. Затем выбираю подходящие методы, собираю решение в систему и довожу его до продакшена.</p>
            </SectionHeading>

            <div className={styles.processSteps}>
              <article className={`${styles.processStep} ${styles.blueStep}`}>
                <div className={styles.processCopy}><span className={styles.stepNumber}>01</span><p className={styles.stepLabel}>Аналитика</p><h3>Погружаюсь в задачу и выбираю подход</h3><p>Изучаю требования и входящие данные, исследую рынок, конкурентов и процессы пользователей. Затем выбираю только те методы, которые нужны в конкретной задаче.</p><ul><li><strong>Job Stories</strong><span>Описание задачи через ситуацию и желаемый результат</span></li><li><strong>CJM</strong><span>Путь пользователя с шагами, проблемами и ожиданиями</span></li></ul></div>
                <div className={styles.processMedia}><Image src={`${assetRoot}/process-discovery.png`} alt="Схема аналитической работы над продуктом" width={2372} height={2284} /></div>
              </article>
              <article className={`${styles.processStep} ${styles.orangeStep}`}>
                <div className={styles.processMedia}><Image src={`${assetRoot}/process-prototype.png`} alt="Схема проектирования интерфейса" width={3128} height={2166} /></div>
                <div className={styles.processCopy}><span className={styles.stepNumber}>02</span><p className={styles.stepLabel}>Проектирование</p><h3>Собираю решение в систему</h3><p>Когда задача и подход определены, перевожу решение в макеты и техническую основу продукта: создаю компоненты, состояния и токены, описываю гайдлайны и выстраиваю структуру больших файлов.</p><ul className={styles.compactList}><li>Дизайн-система</li><li>Токены (variable)</li><li>Гайдлайны</li><li>Макеты</li></ul></div>
              </article>
              <article className={`${styles.processStep} ${styles.greenStep}`}>
                <div className={styles.processCopy}><span className={styles.stepNumber}>03</span><p className={styles.stepLabel}>Финал</p><h3>Довожу решения до продакшена</h3><p>Работаю вместе с аналитиками, разработчиками и QA: уточняю логику, готовлю макеты к передаче, провожу дизайн-ревью и выстраиваю процессы так, чтобы между дизайном и готовым продуктом ничего не потерялось.</p></div>
                <div className={styles.processMedia}><Image src={`${assetRoot}/process-delivery.png`} alt="Схема передачи готового решения в разработку" width={3138} height={1944} /></div>
              </article>
            </div>
          </section>

          <section className={styles.ai} aria-labelledby="ai-title">
            <SectionHeading id="ai-title" title="AI в рабочем процессе">
              <p>AI помогает мне быстрее разбираться в задачах, проверять идеи и превращать их в рабочие решения, но выбор подхода и финальный результат остаются за мной.</p>
            </SectionHeading>
            <div className={styles.aiGrid}>
              <article><Image src={`${assetRoot}/chatgpt.svg`} alt="" width={32} height={32} /><h3>ChatGPT</h3><p>Использую его, чтобы разложить входящие данные, обсудить идею и посмотреть на решение с другой стороны. Проверяю логику сценариев, ищу слабые места, изучаю незнакомые темы, анализирую материалы и привожу в порядок тексты.</p></article>
              <article><Image src={`${assetRoot}/codex.svg`} alt="" width={32} height={32} /><h3>Codex</h3><p>Подключаю, когда идею хочется проверить не только в макете, но и в работе. С его помощью собираю прототипы, небольшие приложения, скрипты и инструменты, разбираюсь в технической части и постепенно дорабатываю результат через диалог.</p></article>
            </div>
          </section>

          <section className={styles.resume} aria-labelledby="resume-title">
            <SectionHeading id="resume-title" title="Чуть больше, чем резюме" centered>
              <div className={styles.contacts}><a href="mailto:Qoalza01@gmail.com">Qoalza01@gmail.com</a><Image src={`${assetRoot}/separator.svg`} alt="" width={6} height={10} /><span>@Coco_soul</span><Image src={`${assetRoot}/separator.svg`} alt="" width={6} height={10} /><a href="tel:+79613247899">+7 (961) 324 78 99</a></div>
            </SectionHeading>
            <span className={styles.cvButton} aria-disabled="true" title="Файл CV будет добавлен позже">Скачать полное CV <Image src={`${assetRoot}/download.svg`} alt="" width={16} height={16} /></span>
            <div className={styles.experienceList}>
              {experience.map((item) => (
                <article className={styles.experience} key={item.company}>
                  <div className={styles.duration}>{item.logo ? <Image src={item.logo} alt="" width={48} height={48} /> : null}{item.duration.map((line) => <span key={line}>{line}</span>)}</div>
                  <div className={styles.experienceCard}>
                    <div className={styles.experienceHeader}>
                      <div className={styles.company}>{item.logo ? <Image src={item.logo} alt="" width={32} height={32} /> : <span className={styles.companyMark} aria-hidden="true">{item.company.slice(0, 1)}</span>}<div><h3>{item.company}</h3>{item.companyUrl ? <a href={item.companyUrl} target="_blank" rel="noreferrer">{item.site}</a> : <span>{item.site}</span>}</div></div>
                      <div className={styles.role}><strong>{item.role}</strong><span>{item.period}</span></div>
                    </div>
                    <p>{item.text}</p>
                    <div className={styles.experienceTags}>{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>

        <footer className={styles.footer}><span><Image src={`${assetRoot}/footer-mark.svg`} alt="" width={16} height={16} />Deveploment and design Artur Arustamyan</span><span>2026</span></footer>
      </div>
    </div>
  );
}
