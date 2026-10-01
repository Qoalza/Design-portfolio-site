import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('Corvo project route uses the dedicated page and the approved responsive Hero',async()=>{
 const [main,page,home,readiness]=await Promise.all([
  readFile(path.join(root,'src/main.jsx'),'utf8'),
  readFile(path.join(root,'src/project-page/CorvoProjectPage.jsx'),'utf8'),
  readFile(path.join(root,'src/App.jsx'),'utf8'),
  readFile(path.join(root,'src/first-view-readiness.mjs'),'utf8'),
 ]);
 assert.match(main,/isCorvoProject=normalizedPath==='\/projects\/corvo'/);
 assert.match(main,/document\.title=isCorvoProject\?'Corvo — Product Designer'/);
 assert.match(main,/import App,\{CustomCursor\} from '\.\/App';/);
 assert.match(main,/\{isCorvoProject\?<FirstVisit><SmoothScroll\/><CustomCursor\/><CorvoProjectPage\/><\/FirstVisit>/);
 assert.match(main,/<CorvoProjectPage\/>/);
 assert.match(page,/<ProjectResponsiveHero definition=\{corvoResponsiveHero\}\/>/);
 assert.match(page,/className=\{styles\.page\}/);
 assert.match(page,/<a href=\{import\.meta\.env\.BASE_URL\} className=\{`nav-tab selected/);
 assert.match(home,/details:\{href:`\$\{import\.meta\.env\.BASE_URL\}projects\/corvo`\}/);
 assert.match(home,/<ControlButton href=\{project\.actions\.details\.href\}>Подробнее<\/ControlButton>/);
 assert.match(readiness,/\[data-first-view\] img/);
 assert.match(page,/data-first-view/);
 for(const heading of ['В цифрах','Контекст и задача','Проработка сценариев','Дизайн-система','Результат работы']){
  assert.match(page,new RegExp(heading));
 }
});

test('Corvo project actions use enabled design-system controls',async()=>{
 const [page,css,linkIcon,figmaIcon]=await Promise.all([
  readFile(path.join(root,'src/project-page/CorvoProjectPage.jsx'),'utf8'),
  readFile(path.join(root,'src/project-page/CorvoProjectPage.module.css'),'utf8'),
  readFile(path.join(root,'public/figma/project-corvo/action-link.svg'),'utf8'),
  readFile(path.join(root,'public/figma/project-corvo/action-figma.svg'),'utf8'),
 ]);

 assert.match(page,/import \{ControlButton\} from '\.\.\/Controls'/);
 assert.match(page,/function ProjectAction\(/);
 assert.match(page,/return <ControlButton variant=\{variant\}/);
 assert.doesNotMatch(page,/StaticAction|aria-disabled="true"/);
 assert.match(page,/<ProjectAction variant="accent"[^>]*>Связаться/);
 assert.match(page,/<CopyLinkAction\/>/);
 assert.match(page,/<ProjectAction variant="neutral" iconRight="figma" href=\{corvoFigma\} external>Figma<\/ProjectAction>/);
 assert.match(page,/variant="neutral"[^>]*iconRight="figma"[^>]*>\{metrics\[0\]\.action\}/);
 assert.match(page,/metrics\.slice\(1\).*<ProjectAction iconLeft=\{metric\.icon\} iconRight="arrow">\{metric\.action\}<\/ProjectAction>/s);
 assert.match(css,/\.projectActions\s*\{[^}]*border:\s*0/s);
 assert.match(css,/\.projectActions\s*\{[^}]*width:\s*max-content[^}]*margin-left:\s*auto[^}]*box-shadow:\s*inset 0 0 0 1px #1f2224/s);
 assert.match(css,/\.projectActions \.action\s*\{[^}]*border:\s*0/s);
 assert.match(css,/\.projectActions \.action:first-child\s*\{[^}]*width:\s*auto[^}]*justify-content:\s*flex-end/s);
 assert.match(css,/\.projectActions \.action:last-child\s*\{[^}]*width:\s*91px/s);
 assert.match(linkIcon,/width="16" height="16"/);
 assert.match(linkIcon,/Medium \/ General \/ Link-02/);
 assert.match(figmaIcon,/width="16" height="16"/);
 assert.match(figmaIcon,/Medium \/ Social logo \/ Figma/);
});

test('Corvo breadcrumbs use compact system buttons and preserve the color logo',async()=>{
 const [page,css,controls,controlCss,corvoLogo]=await Promise.all([
  readFile(path.join(root,'src/project-page/CorvoProjectPage.jsx'),'utf8'),
  readFile(path.join(root,'src/project-page/CorvoProjectPage.module.css'),'utf8'),
  readFile(path.join(root,'src/v2/Controls.jsx'),'utf8'),
  readFile(path.join(root,'src/v2/controls.css'),'utf8'),
  readFile(path.join(root,'public/figma/imgProjectCorvo.svg'),'utf8'),
 ]);

 assert.match(page,/import \{V2Button\} from '\.\.\/v2\/Controls'/);
 assert.match(page,/<V2Button variant="ghost" iconLeft="imgColor" iconOnly href=\{import\.meta\.env\.BASE_URL\}[^>]*aria-label="На главную"/);
 assert.match(page,/<V2Button variant="ghost" iconLeft="imgProjectCorvo" iconLeftMode="color"[^>]*aria-current="page">Corvo<\/V2Button>/);
 assert.match(controls,/iconOnly=false/);
 assert.match(controls,/iconOnly\?null:<span className="v2-control-label">\{children\}<\/span>/);
 assert.match(controls,/mode==='color'/);
 assert.match(controls,/className=\{`v2-icon v2-icon-color/);
 assert.match(controls,/iconLeftMode='default'/);
 assert.match(controls,/<V2Icon name=\{iconLeft\} mode=\{iconLeftMode\}/);
 assert.match(controlCss,/\.v2-icon-color\s*\{[^}]*background:transparent[^}]*mask:none/s);
 assert.match(corvoLogo,/fill="#2A6E52"/);
 assert.match(corvoLogo,/fill="#43A27A"/);
 assert.match(css,/\.crumb \.crumbHome\s*\{[^}]*width:\s*16px[^}]*height:\s*16px[^}]*padding:\s*0/s);
 assert.match(css,/\.crumb \.crumbProject\s*\{[^}]*width:\s*67px[^}]*height:\s*16px[^}]*padding:\s*0/s);
});

test('Corvo project header and footer use their current Figma assets',async()=>{
 const [page,css,telegram]=await Promise.all([
  readFile(path.join(root,'src/project-page/CorvoProjectPage.jsx'),'utf8'),
  readFile(path.join(root,'src/project-page/CorvoProjectPage.module.css'),'utf8'),
  readFile(path.join(root,'public/figma/project-corvo/header/header-telegram.svg'),'utf8'),
 ]);

 assert.match(page,/data-header-icon="home"/);
 assert.match(page,/data-header-icon="lock"/);
 assert.match(page,/className=\{styles\.footerIcon\}/);
 assert.doesNotMatch(page,/src="\/figma\/imgColor8\.svg"/);
 assert.match(css,/header-home\.svg/);
 assert.match(css,/header-lock\.svg/);
 assert.match(css,/header-telegram\.svg/);
 assert.match(css,/footer-corrupted\.svg/);
 assert.match(css,/\.brand\s*\{[^}]*width:\s*191px/s);
 assert.match(css,/\.navigation a:nth-child\(1\)\s*\{[^}]*width:\s*97px/s);
 assert.match(css,/\.navigation button:nth-child\(2\)\s*\{[^}]*width:\s*76px/s);
 assert.match(css,/\.navigation button:nth-child\(3\)\s*\{[^}]*width:\s*133px/s);
 assert.match(css,/\.headerRight\s*\{[^}]*width:\s*378px/s);
 assert.match(css,/\.availability\s*\{[^}]*width:\s*213px/s);
 assert.match(css,/\.headerContact\s*\{[^}]*width:\s*121px/s);
 assert.doesNotMatch(css,/\.action\[data-icon-right="telegram"\]::after\s*\{/s);
 assert.match(telegram,/<svg width="16" height="16" viewBox="0 0 16 16"/);
 assert.doesNotMatch(css,/\.header\s*\{[^}]*border-bottom:/s);
 assert.match(css,/\.brand b\s*\{[^}]*font-variation-settings:\s*"GRAD" -25, "opsz" 18/s);
 assert.match(css,/\.brand small\s*\{[^}]*font-variation-settings:\s*"GRAD" -30, "opsz" 18/s);
 assert.match(css,/\.summary\s*\{[^}]*border-top:\s*1px solid #1f2224[^}]*border-bottom:\s*1px solid #1f2224/s);
 assert.match(css,/\.footerIcon\s*\{[^}]*background:\s*#788087/s);
});

test('Corvo structural separators use the current Figma Thin token',async()=>{
 const css=await readFile(path.join(root,'src/project-page/CorvoProjectPage.module.css'),'utf8');

 assert.doesNotMatch(css,/#272b2e/i);
 assert.match(css,/\.crumbRow\s*\{[^}]*border-bottom:\s*1px solid #1f2224/s);
 assert.match(css,/\.projectIntro\s*\{[^}]*border-bottom:\s*1px solid #1f2224/s);
 assert.match(css,/\.tags b\s*\{[^}]*background:\s*#323639/s);
 assert.match(css,/\.summaryInner::before,[\s\S]*?\.summaryInner::after\s*\{[^}]*repeating-linear-gradient\(to bottom, #1f2224 0 16px, transparent 16px 32px\)/s);
 assert.match(css,/\.metrics\s*\{[^}]*border-bottom:\s*1px solid #1f2224/s);
 assert.match(css,/\.contentSection\s*\{[^}]*border-bottom:\s*1px solid #1f2224/s);
 assert.match(css,/\.resultWrap\s*\{[^}]*border-top:\s*1px solid #1f2224/s);
 assert.match(css,/\.footer\s*\{[^}]*border-top:\s*1px solid #1f2224/s);
});

test('Corvo project layout preserves the measured 1280px Figma structure',async()=>{
 const [page,css,scenarioImage]=await Promise.all([
  readFile(path.join(root,'src/project-page/CorvoProjectPage.jsx'),'utf8'),
  readFile(path.join(root,'src/project-page/CorvoProjectPage.module.css'),'utf8'),
  readFile(path.join(root,'public/figma/project-corvo/media-campaign-creation.png')),
 ]);

 assert.match(page,/className=\{styles\.summaryInner\}/);
 assert.match(page,/className=\{styles\.summaryContent\}/);
 assert.match(page,/Макеты собраны в одном файле: основные сценарии, состояния и их адаптация под три размера экрана/);
 assert.ok(page.indexOf('className={`${styles.metric} ${styles.metricWide}`}') < page.indexOf('className={styles.metricRow}'), 'Figma places the wide adaptive card before the compact metric row');
 assert.match(page,/className=\{styles\.contextSection\}/);
 assert.match(page,/className=\{styles\.scenarioTextSection\}/);
 assert.match(page,/className=\{styles\.scenarioShowcase\}/);
 assert.match(page,/Один из сценариев/);
 assert.match(page,/Как создать медиа компанию\?/);
 assert.match(page,/media-campaign-creation\.png/);
 assert.match(page,/className=\{styles\.designSection\}/);
 assert.match(page,/className=\{styles\.resultWrap\}/);
 assert.doesNotMatch(page,/CorvoProjectPageFidelity/);

 assert.match(css,/\.summary\s*\{[^}]*height:\s*440px/s);
 assert.match(css,/\.summary\s*\{[^}]*background:\s*#141617/s);
 assert.match(css,/\.summaryInner\s*\{[^}]*width:\s*1280px/s);
 assert.match(css,/\.summaryInner\s*\{[^}]*height:\s*100%/s);
 assert.match(css,/\.summaryContent\s*\{[^}]*width:\s*1000px[^}]*margin-left:\s*52px/s);
 assert.match(css,/\.summaryContent > p\s*\{[^}]*width:\s*992px/s);
 assert.match(css,/\.summaryContent > p:last-of-type\s*\{[^}]*margin-bottom:\s*40px/s);
 assert.match(css,/\.metrics\s*\{[^}]*height:\s*817px/s);
 assert.match(css,/\.metricsContent\s*\{[^}]*padding:\s*0 52px/s);
 assert.match(css,/\.metricWide\s*\{[^}]*grid-template-columns:\s*843px 331px/s);
 assert.match(css,/\.metricWide\s*\{[^}]*border:\s*1px solid #1f2224/s);
 assert.match(css,/\.metricWideMain\s*\{[^}]*border-right:\s*1px solid #1f2224/s);
 assert.match(css,/\.metricWideAside\s*\{[^}]*background:\s*#141617 url\('\/figma\/dot-tile\.svg'\) repeat/s);
 assert.match(css,/\.metricRow\s*\{[^}]*grid-template-columns:\s*repeat\(3, 384px\)/s);
 assert.match(css,/\.metricRow\s*\{[^}]*margin-top:\s*12px/s);
 assert.match(css,/\.metricRow \.metric\s*\{[^}]*height:\s*294px[^}]*gap:\s*0/s);
 assert.match(css,/\.metricRow \.metric > p\s*\{[^}]*height:\s*72px[^}]*margin:\s*20px 0 0 4px[^}]*overflow:\s*hidden/s);
 assert.match(css,/\.metricRow \.metric > \.action\s*\{[^}]*margin-top:\s*32px/s);
 assert.match(css,/\.copyColumn\s*\{[^}]*width:\s*944px/s);
 assert.match(css,/\.contextSection\s*\{[^}]*height:\s*449px/s);
 assert.match(css,/\.longForm\s*\{[^}]*height:\s*1042px/s);
 assert.match(css,/\.scenarioTextSection\s*\{[^}]*height:\s*481px/s);
 assert.match(css,/\.scenarioShowcase\s*\{[^}]*height:\s*1236px/s);
 assert.doesNotMatch(css,/\.scenarioShowcase\s*\{[^}]*border-bottom:/s);
 assert.match(css,/\.scenarioShowcaseHeader\s*\{[^}]*padding:\s*8px 56px 0/s);
 assert.match(css,/\.scenarioShowcaseHeader h2\s*\{[^}]*margin:\s*0 0 24px/s);
 assert.match(css,/\.scenarioEyebrow\s*\{[^}]*font:\s*500 14px\/16px Onest/s);
 assert.match(css,/\.scenarioEyebrow\s*\{[^}]*letter-spacing:\s*-\.1px/s);
 assert.match(css,/\.scenarioMedia\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) 1176px minmax\(0, 1fr\)/s);
 assert.match(css,/\.scenarioHatch\s*\{[^}]*border-top:\s*1px solid #1f2224[^}]*border-bottom:\s*1px solid #1f2224[^}]*border-left:\s*0[^}]*border-right:\s*0/s);
 assert.match(css,/\.scenarioCanvas\s*\{[^}]*border:\s*1px solid #1f2224/s);
 assert.match(css,/\.scenarioCanvas > img\s*\{[^}]*top:\s*50px[^}]*left:\s*79\.5px[^}]*width:\s*1015px[^}]*height:\s*902px/s);
 assert.match(page,/import \{GridPattern\} from '\.\.\/GridPattern'/);
 assert.match(page,/<GridPattern\/>/);
 assert.doesNotMatch(css,/\.scenarioCanvas::before/);
 assert.doesNotMatch(css,/\.scenarioGrid\s*\{/);
 assert.equal(scenarioImage.readUInt32BE(16),2030);
 assert.equal(scenarioImage.readUInt32BE(20),1804);
 assert.equal(createHash('sha256').update(scenarioImage).digest('hex'),'07e6d96358988d3884cbd0e31ec9998db91b9b90af61d93258762ccebedc881c');
 assert.match(css,/\.designWrap\s*\{[^}]*height:\s*887px/s);
 assert.match(css,/\.designSection\s*\{[^}]*height:\s*774px/s);
 assert.match(css,/\.copyColumn h3\s*\{[^}]*margin:\s*0/s);
 assert.match(css,/\.copyColumn h3 \+ p\s*\{[^}]*margin-top:\s*-12px/s);
 assert.match(css,/\.designSection \.notice\s*\{[^}]*margin-top:\s*16px/s);
 assert.match(css,/\.result\s*\{[^}]*height:\s*500px/s);
 assert.match(css,/\.resultWrap\s*\{[^}]*height:\s*541px/s);
 assert.match(css,/\.resultWrap\s*\{[^}]*background:\s*#141617/s);
 assert.match(css,/\.footerText\s*\{[^}]*line-height:\s*14px/s);
});
