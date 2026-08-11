import Image from "next/image";
import Link from "next/link";
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

function HeroOrbit() {
  return (
    <div className={styles.heroOrbit} aria-hidden="true">
      <Image className={styles.outerRing} src={`${assetRoot}/hero-ring-outer.svg`} alt="" width={1466} height={1466} priority />
      <Image className={styles.outerDashedRing} src={`${assetRoot}/hero-ring-outer-dashed.svg`} alt="" width={1177} height={1177} priority />
      <span className={styles.outerAccentRing}>
        <Image src={`${assetRoot}/hero-ring-outer-accent.svg`} alt="" fill sizes="511px" priority />
      </span>
      <Image className={styles.innerDashedRing} src={`${assetRoot}/hero-ring-inner-dashed.svg`} alt="" width={890} height={890} priority />
      <span className={styles.innerAccentRing}>
        <Image src={`${assetRoot}/hero-ring-inner-accent.svg`} alt="" fill sizes="208px" priority />
      </span>
      <Image className={styles.heroGlowSmall} src={`${assetRoot}/hero-glow-small.svg`} alt="" width={749} height={749} priority />
      <Image className={styles.heroGlowLarge} src={`${assetRoot}/hero-glow-large.svg`} alt="" width={1023} height={1023} priority />

      <span className={`${styles.orbitNode} ${styles.orbitOne}`}><MaskIcon className={styles.heroStackIcon} /></span>
      <span className={`${styles.orbitNode} ${styles.orbitTwo}`}><MaskIcon className={styles.heroInstrumentIcon} /></span>
      <span className={`${styles.orbitNode} ${styles.orbitThree}`}><MaskIcon className={styles.heroBrushIcon} /></span>
      <span className={`${styles.orbitNode} ${styles.orbitFour}`}><MaskIcon className={styles.heroUnderlineIcon} /></span>
      <span className={`${styles.orbitNode} ${styles.orbitFive}`}><MaskIcon className={styles.heroComponentIcon} /></span>
      <span className={`${styles.orbitNode} ${styles.orbitSix}`}><MaskIcon className={styles.heroBooleanIcon} /></span>
      <span className={`${styles.orbitNode} ${styles.orbitSeven}`}><MaskIcon className={styles.heroUserIcon} /></span>
      <span className={`${styles.orbitNode} ${styles.orbitEight}`}><MaskIcon className={styles.heroTextIcon} /></span>
    </div>
  );
}

function CorvoVisual() {
  return (
    <div className={styles.projectVisual} aria-hidden="true">
      <Image className={styles.corvoBack} src={`${assetRoot}/corvo-dashboard.png`} alt="" width={2960} height={2400} />
      <Image className={styles.corvoFront} src={`${assetRoot}/corvo-product.png`} alt="" width={2960} height={2400} />
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

function Timeline({ number, tone }: { number: string; tone: "blue" | "orange" | "green" }) {
  return (
    <div className={`${styles.timeline} ${styles[`${tone}Timeline`]}`} aria-hidden="true">
      <span className={styles.timelineLead} />
      <span className={styles.timelineDot} />
      <span className={styles.timelineNumber}>{number}</span>
      <span className={styles.timelineTail} />
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
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <a className={styles.skipLink} href="#main-content">Перейти к содержимому</a>

        <header className={styles.header}>
          <Link className={styles.brand} href="/" aria-label="На главную">
            <Image src={`${assetRoot}/logo.svg`} alt="" width={48} height={48} priority />
            <span><strong>ART</strong><small>Design</small></span>
          </Link>

          <nav className={styles.nav} aria-label="Основная навигация">
            <Link className={styles.navActive} href="/" aria-current="page">
              <MaskIcon className={styles.homeIcon} />
              Главная
            </Link>
            <span aria-disabled="true"><MaskIcon className={styles.lockIcon} />Блог</span>
            <span aria-disabled="true"><MaskIcon className={styles.lockIcon} />Лаборатория</span>
          </nav>

          <div className={styles.headerActions}>
            <span className={styles.availability}>
              <Image src={`${assetRoot}/status.svg`} alt="" width={6} height={8} />
              Открыт к предложениям
            </span>
            <span className={styles.primaryButton} aria-disabled="true">Связаться</span>
          </div>
        </header>

        <main id="main-content">
          <section className={styles.hero} aria-labelledby="hero-title">
            <HeroOrbit />
            <div className={styles.heroBody}>
              <div className={styles.heroText}>
                <div className={styles.heroTitleGroup}>
                  <p className={styles.eyebrow}><span>PRODUCT DESIGNER</span></p>
                  <h1 id="hero-title">Артур Арустамян</h1>
                </div>
                <p className={styles.heroLead}>Систематизирую сложные бизнес-процессы, проектирую интерфейсы и сопровождаю решения от требований до реализации</p>
                <div className={styles.heroTags} aria-label="Направления работы">
                  <span><b>#</b> Design systems</span><i>/</i>
                  <span><b>#</b> Data-heavy</span><i>/</i>
                  <span><b>#</b> Enterprise systems</span><i>/</i>
                  <span><b>#</b> B2B</span><i>/</i>
                  <span><b>#</b> SaaS</span>
                </div>
              </div>
              <div className={styles.heroActions}>
                <a className={styles.darkButton} href="#projects">Мои работы</a>
                <span className={styles.secondaryButton} aria-disabled="true">CV <MaskIcon className={styles.downloadIcon} /></span>
              </div>
            </div>
          </section>

          <section className={styles.projects} id="projects" aria-labelledby="projects-title">
            <div className={styles.projectsIntro}>
              <SectionHeading id="projects-title" title="То, над чем я работал" centered>
                <p>Здесь собрал рабочие проекты, тестовые задания.<br />Где можно увидеть мой подход к задаче и результат.</p>
              </SectionHeading>
              <Link className={styles.textButton} href="/projects">Все работы <MaskIcon className={styles.chevronRightIcon} /></Link>
            </div>

            <article className={styles.projectRow}>
              <CorvoVisual />
              <div className={styles.projectCopy}>
                <div className={styles.badges}><span className={styles.blueBadge}>B2B SaaS</span><span className={styles.grayBadge}>Готов частично</span></div>
                <div className={styles.projectTitle}>
                  <div><h3>Corvo</h3><Image src={`${assetRoot}/corvo-symbol.svg`} alt="" width={28} height={28} /></div>
                  <p>Система для управления партнёрской программой</p>
                </div>
                <dl className={styles.projectDetails}>
                  <ProjectDetail label="Моя роль">Продуктовый дизайнер</ProjectDetail>
                  <ProjectDetail label="Что делал">Полностью собрал дизайн систему, согласовал с главными стейкхолдерами, выстроил процесс с разработчиками, чтобы они могли спроектировать все это. Еще и весь сервис собрал с 0. Обрабатывал обращения бизнесс-аналитика.</ProjectDetail>
                </dl>
                <div className={styles.projectActions}>
                  <div className={styles.projectActionButtons}>
                    <Link className={styles.detailsButton} href="/projects/example-project">Подробнее</Link>
                    <span className={styles.figmaButton} aria-disabled="true">Figma <MaskIcon className={styles.shareIcon} /></span>
                  </div>
                  <span className={styles.actionDivider} />
                  <span className={styles.updated}><MaskIcon className={styles.refreshIcon} />Обновлено 13.05.2026</span>
                </div>
              </div>
            </article>

            <div className={styles.projectDivider} />

            <article className={`${styles.projectRow} ${styles.projectRowReverse}`}>
              <div className={styles.projectCopy}>
                <div className={styles.badges}><span className={styles.blueBadge}>B2B2C</span><span className={styles.orangeBadge}>Тестовое</span></div>
                <div className={styles.projectTitle}>
                  <div><h3>Сараффан.Радио</h3><RadioSymbol /></div>
                  <p>Платформа для организации мероприятий</p>
                </div>
                <dl className={styles.projectDetails}>
                  <ProjectDetail label="Моя роль">Продуктовый дизайнер / Аналитик</ProjectDetail>
                  <ProjectDetail label="Что делал">Подробно продумал сценарии используя продуктовые инструменты: составлял User-Flow, Job Story, изучал косвенных конкурентов. Проектировал изолированный сценарий исходя из полученных данных и составленного флоу.</ProjectDetail>
                </dl>
                <div className={styles.projectActions}>
                  <div className={styles.projectActionButtons}>
                    <span className={styles.detailsButton} aria-disabled="true">Подробнее</span>
                    <span className={styles.unavailableButton} aria-disabled="true">Файл недоступен <MaskIcon className={styles.infoIcon} /></span>
                  </div>
                  <span className={styles.actionDivider} />
                  <span className={styles.updated}><MaskIcon className={styles.refreshIcon} />Обновлено 13.05.2026</span>
                </div>
              </div>
              <RadioVisual />
            </article>
          </section>

          <section className={styles.process} aria-labelledby="process-title">
            <SectionHeading id="process-title" title="Начинаю не с макетов">
              <p>Сначала разбираюсь в продукте, бизнесе и самой задаче. Затем выбираю подходящие методы, собираю решение в систему и довожу его до продакшена.</p>
            </SectionHeading>

            <div className={styles.processRows}>
              <article className={`${styles.processRow} ${styles.analyticsRow}`}>
                <Timeline number="01" tone="blue" />
                <div className={styles.processCopy}>
                  <span className={`${styles.processBadge} ${styles.analyticsBadge}`}>Аналитика</span>
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
                    <span className={styles.showMore} aria-disabled="true">Показать еще (3) <MaskIcon className={styles.chevronDownIcon} /></span>
                  </div>
                </div>
                <div className={styles.analyticsMedia}>
                  <Image src={`${assetRoot}/process-discovery.png`} alt="Схема аналитической работы над продуктом" width={2372} height={2284} />
                </div>
              </article>

              <article className={`${styles.processRow} ${styles.designRow}`}>
                <div className={styles.designMedia}>
                  <Image src={`${assetRoot}/process-prototype.png`} alt="Схема проектирования интерфейса" width={3128} height={2166} />
                </div>
                <Timeline number="02" tone="orange" />
                <div className={styles.processCopy}>
                  <span className={`${styles.processBadge} ${styles.designBadge}`}>Проектирование</span>
                  <div className={styles.processDescription}>
                    <h3>Собираю решение в систему</h3>
                    <p>Когда задача и подход определены, перевожу решение в макеты и техническую основу продукта: создаю компоненты, состояния и токены, описываю гайдлайны и выстраиваю понятную структуру больших файлов</p>
                  </div>
                  <div className={styles.toolTags}><span>Дизайн система</span><span>Токены (variable)</span><span>Гайдлайны</span><span>Описание и поведение блоков</span><span>Макеты</span></div>
                </div>
              </article>

              <article className={`${styles.processRow} ${styles.deliveryRow}`}>
                <Timeline number="03" tone="green" />
                <div className={styles.processCopy}>
                  <span className={`${styles.processBadge} ${styles.deliveryBadge}`}>Финал</span>
                  <div className={styles.processDescription}>
                    <h3>Довожу решения до продакшена</h3>
                    <p>Работаю вместе с аналитиками, разработчиками и QA: уточняю логику, готовлю макеты к передаче, провожу дизайн-ревью и выстраиваю процессы так, чтобы между дизайном и готовым продуктом ничего не потерялось</p>
                  </div>
                </div>
                <div className={styles.deliveryMedia}>
                  <Image src={`${assetRoot}/process-delivery.png`} alt="Схема передачи готового решения в разработку" width={3138} height={1944} />
                </div>
              </article>
            </div>
          </section>

          <section className={styles.ai} aria-labelledby="ai-title">
            <SectionHeading id="ai-title" title="AI в рабочем процессе" width="ai">
              <p>AI помогает мне быстрее разбираться в задачах, проверять идеи и превращать их в рабочие решения, но выбор подхода и финальный результат остаются за мной</p>
            </SectionHeading>
            <div className={styles.aiGrid}>
              <article><Image src={`${assetRoot}/chatgpt.svg`} alt="" width={32} height={32} /><div><h3>ChatGPT</h3><p>Использую его, чтобы разложить входящие данные, обсудить идею и посмотреть на решение с другой стороны. Проверяю логику сценариев, ищу слабые места, изучаю незнакомые темы, анализирую материалы и привожу в порядок тексты.</p></div></article>
              <article><Image src={`${assetRoot}/codex.svg`} alt="" width={32} height={32} /><div><h3>Codex</h3><p>Подключаю, когда идею хочется проверить не только в макете, но и в работе. С его помощью собираю прототипы, небольшие приложения, скрипты и инструменты, разбираюсь в технической части и постепенно дорабатываю результат через диалог.</p></div></article>
            </div>
          </section>

          <section className={styles.resume} aria-labelledby="resume-title">
            <div className={styles.resumeIntro}>
              <SectionHeading id="resume-title" title="Чуть больше, чем резюме" centered>
                <div className={styles.contacts}>
                  <a href="mailto:Qoalza01@gmail.com">Qoalza01@gmail.com</a>
                  <Image src={`${assetRoot}/separator.svg`} alt="" width={6} height={10} />
                  <span>@Coco_soul</span>
                  <Image src={`${assetRoot}/separator.svg`} alt="" width={6} height={10} />
                  <a href="tel:+79613247899">+7 (961) 324 78 99</a>
                </div>
              </SectionHeading>
              <span className={styles.cvButton} aria-disabled="true">Скачать полное CV <MaskIcon className={styles.downloadIcon} /></span>
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
                  <div className={styles.eyeconTags}><span>B2B</span><span>Design Systems</span><span>User Flow</span><span>CJM</span><span>Wireframes</span><span>Information Architecture</span><span>UX Research</span></div>
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
                  <p>Проектировал веб- и мобильные продукты для разных отраслей: от стартапов и SaaS до корпоративных систем. Прорабатывал бизнес-задачи и пользовательские сценарии, создавал прототипы и готовые интерфейсы, формировал визуальный язык и разрабатывал дизайн-системы.</p>
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

        <footer className={styles.footer}>
          <span><Image src={`${assetRoot}/footer-mark.svg`} alt="" width={16} height={16} />Deveploment and design Artur Arustamyan</span>
          <span>2026</span>
        </footer>
      </div>
    </div>
  );
}
