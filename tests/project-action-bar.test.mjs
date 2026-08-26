import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getProjectActionBarInitialState,
  getProjectActionBarScrollState,
} from "../src/lib/main-chapter-interactions.ts";

const baseGeometry = {
  informationTop: 100,
  informationBottom: 1600,
  viewportHeight: 800,
  barHeight: 88,
  dpr: 1,
};

test("initial resolver uses the same 200px visibility boundary as steady state", () => {
  assert.equal(getProjectActionBarInitialState({ ...baseGeometry, informationTop: 600.5 }).variant, "full");
  assert.equal(getProjectActionBarInitialState({ ...baseGeometry, informationTop: 600 }).variant, "adaptive");
  assert.equal(getProjectActionBarInitialState({ ...baseGeometry, informationTop: 599.5 }).variant, "adaptive");
});

test("initial resolver rejects information that already ended and invalid geometry", () => {
  assert.equal(getProjectActionBarInitialState({ ...baseGeometry, informationBottom: 712 }).variant, "full");
  assert.deepEqual(getProjectActionBarInitialState({ ...baseGeometry, informationTop: Number.NaN }), {
    valid: false,
    variant: "full",
    barTop: 712,
    barBottom: 800,
  });
});

test("scroll state uses the shared 200px geometry threshold", () => {
  assert.equal(getProjectActionBarScrollState({ ...baseGeometry, informationTop: 600.5 }).variant, "full");
  assert.equal(getProjectActionBarScrollState({ ...baseGeometry, informationTop: 600 }).variant, "adaptive");
  assert.equal(getProjectActionBarScrollState({ ...baseGeometry, informationTop: 599.5 }).variant, "adaptive");
});

test("scroll state returns to Full after information end and uses the same geometry in reverse", () => {
  assert.equal(getProjectActionBarScrollState({ ...baseGeometry, informationBottom: 712 }).variant, "full");
  assert.equal(getProjectActionBarScrollState({ ...baseGeometry, informationBottom: 700 }).variant, "full");
  assert.equal(getProjectActionBarScrollState({ ...baseGeometry, informationTop: 750 }).variant, "full");
  assert.equal(getProjectActionBarScrollState({ ...baseGeometry, informationTop: 599.5 }).variant, "adaptive");
});

test("physical-pixel normalization keeps initial and scroll boundaries deterministic", () => {
  assert.equal(getProjectActionBarInitialState({ ...baseGeometry, informationTop: 600.24, dpr: 2 }).variant, "adaptive");
  assert.equal(getProjectActionBarInitialState({ ...baseGeometry, informationTop: 600.26, dpr: 2 }).variant, "full");
  assert.equal(getProjectActionBarScrollState({ ...baseGeometry, informationTop: 600.24, dpr: 2 }).variant, "adaptive");
  assert.equal(getProjectActionBarScrollState({ ...baseGeometry, informationTop: 600.26, dpr: 2 }).variant, "full");
});

test("runtime applies the shared geometry threshold without magic scrollY", () => {
  const component = readFileSync(new URL("../src/components/project-action-bar.tsx", import.meta.url), "utf8");
  const bootstrap = readFileSync(new URL("../src/lib/project-action-bar-bootstrap.ts", import.meta.url), "utf8");
  const page = readFileSync(new URL("../src/app/projects/[slug]/page.tsx", import.meta.url), "utf8");
  const pageStyles = readFileSync(new URL("../src/app/projects/[slug]/page.module.css", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/components/project-action-bar.module.css", import.meta.url), "utf8");

  assert.match(component, /getProjectActionBarInitialState/);
  assert.match(component, /getProjectActionBarScrollState/);
  assert.doesNotMatch(component, /initialVariantRef/);
  assert.match(component, /data-project-action-transitions/);
  assert.doesNotMatch(component, /scrollY/);
  assert.doesNotMatch(component, /innerHeight-160/);
  assert.match(bootstrap, /barBottom-n\(ir\.top\)>=200/);
  assert.match(styles, /data-project-action-transitions="true"/);
  assert.match(styles, /background:\s*#fcfcfd/i);
  assert.ok(page.indexOf("data-project-action-terminal") < page.indexOf("<ProjectActionBar"));
  assert.match(pageStyles, /\.actionTerminal\s*\{\s*height:\s*136px/);
});

test("the first user-visible action variant is bootstrapped without a blank shell or transition", () => {
  const component = readFileSync(new URL("../src/components/project-action-bar.tsx", import.meta.url), "utf8");
  const rootLayout = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");
  const bootstrap = readFileSync(new URL("../src/lib/project-action-bar-bootstrap.ts", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/components/project-action-bar.module.css", import.meta.url), "utf8");

  assert.doesNotMatch(component, /<script|ACTION_BAR_BOOTSTRAP/);
  assert.match(rootLayout, /PROJECT_ACTION_BAR_BOOTSTRAP/);
  assert.match(bootstrap, /MutationObserver/);
  assert.match(bootstrap, /projectActionTransitions='false'/);
  assert.match(component, /project-action-bar-transition-ready/);
  assert.match(component, /getBoundingClientRect/);
  assert.doesNotMatch(styles, /visibility:\s*hidden/);
  const baseRule = styles.match(/\.actionBar\s*\{[^}]*\}/)?.[0] ?? "";
  assert.doesNotMatch(baseRule, /transition/);
});

test("action bar internal layout maps the current Figma component contract", () => {
  const component = readFileSync(new URL("../src/components/project-action-bar.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/components/project-action-bar.module.css", import.meta.url), "utf8");

  assert.match(styles, /height:\s*88px/);
  assert.match(styles, /padding:\s*24px/);
  assert.match(styles, /gap:\s*8px/);
  assert.match(styles, /font-family:\s*var\(--type-tech-font-family\)/);
  assert.match(styles, /font-size:\s*var\(--type-tech-m-font-size\)/);
  assert.match(styles, /line-height:\s*var\(--type-tech-m-line-height\)/);
  assert.match(styles, /font-feature-settings:\s*var\(--type-tech-m-features\)/);
  assert.match(styles, /letter-spacing:\s*var\(--type-tech-m-letter-spacing\)/);
  assert.match(component, />Обновлено \{updatedAt\}</);
  assert.match(component, />Файл пока недоступен</);
  assert.match(component, /action-bar-external-link\.svg/);
});

test("project share copies only canonical origin and pathname and uses Tooltip feedback", () => {
  const actionBar = readFileSync(new URL("../src/components/project-action-bar.tsx", import.meta.url), "utf8");
  const share = readFileSync(new URL("../src/components/project-share-button.tsx", import.meta.url), "utf8");
  const canonical = readFileSync(new URL("../src/lib/project-share.ts", import.meta.url), "utf8");
  const tooltip = readFileSync(new URL("../src/components/tooltip.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(share, /navigator\.share/);
  assert.match(share, /navigator\.clipboard\?\.writeText/);
  assert.match(canonical, /location\.origin/);
  assert.match(canonical, /location\.pathname/);
  assert.doesNotMatch(share, /window\.location\.href|navigator\.share|execCommand/);
  assert.match(share, /"Скопировано"/);
  assert.match(actionBar, /<Tooltip/);
  assert.match(actionBar, /text: "Скопировано"/);
  assert.match(actionBar, /\/assets\/projects\/check\.svg/);
  assert.match(actionBar, /restartKey=\{feedbackRevision\}/);
  assert.match(actionBar, /aria-live="polite"/);
  assert.match(tooltip, /triggerMode/);
});
