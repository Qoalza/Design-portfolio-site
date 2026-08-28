import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  NAVIGATION_ABSOLUTE_LIMIT_MS,
  NAVIGATION_WATCHDOG_MS,
  getNavigationProgressState,
  shouldCancelProjectNavigation,
} from "../src/lib/main-chapter-interactions.ts";

test("ordinary tracking input never cancels root Lenis", () => {
  assert.equal(shouldCancelProjectNavigation("SCROLL_TRACKING"), false);
  assert.equal(shouldCancelProjectNavigation("PROGRAMMATIC_SCROLL"), true);
});

test("navigation watchdog resets only after meaningful progress", () => {
  const progress = getNavigationProgressState({
    now: 1800,
    startedAt: 0,
    lastProgressAt: 0,
    previousDistance: 1200,
    currentDistance: 900,
  });

  assert.deepEqual(progress, {
    outcome: "progress",
    lastProgressAt: 1800,
    lastDistance: 900,
  });
});

test("navigation watchdog ends a transition after 2000ms without progress", () => {
  assert.equal(NAVIGATION_WATCHDOG_MS, 2000);
  assert.equal(getNavigationProgressState({
    now: 2000,
    startedAt: 0,
    lastProgressAt: 0,
    previousDistance: 1200,
    currentDistance: 1200,
  }).outcome, "watchdog");
});

test("absolute limit ends infinite minimal progress deterministically", () => {
  assert.equal(NAVIGATION_ABSOLUTE_LIMIT_MS, 30000);
  assert.equal(getNavigationProgressState({
    now: 30000,
    startedAt: 0,
    lastProgressAt: 29990,
    previousDistance: 100,
    currentDistance: 99,
  }).outcome, "absolute-limit");
});

test("programmatic navigation replaces targets and supports explicit user cancellation", () => {
  const component = readFileSync(new URL("../src/components/project-section-navigation.tsx", import.meta.url), "utf8");

  assert.match(component, /PROGRAMMATIC_SCROLL/);
  assert.match(component, /setActiveIndex\(index\)/);
  assert.match(component, /history\.pushState\(\{ \.\.\.history\.state \}/);
  assert.match(component, /wheel/);
  assert.match(component, /touchstart/);
  assert.match(component, /keydown/);
  assert.match(component, /scrollend/);
  assert.match(component, /hasConfirmedProgress/);
  assert.match(component, /popstate/);
  assert.match(component, /hashchange/);
  assert.match(component, /prefers-reduced-motion/);
  assert.match(component, /getProjectNavigationRailHeight/);
  assert.match(component, /data-project-navigation-rail/);
  assert.match(component, /startProgrammaticScroll\(index, false, false\)/);
  assert.doesNotMatch(component, /scrollController\.scrollTo\(target,[\s\S]{0,120}offset:/);
  assert.match(component, /const activationTop = Math\.max\(0, measuredHeaderHeight\)/);
  assert.doesNotMatch(component, /const activationTop[^;]+fixedHeader\?\.getBoundingClientRect\(\)\.bottom/);
  assert.doesNotMatch(component, /Результат/);
  assert.doesNotMatch(component, /documentElement\.scrollHeight/);
});

test("Corvo exposes exactly five information sections and keeps Gallery outside navigation", () => {
  const page = readFileSync(new URL("../src/app/projects/[slug]/page.tsx", import.meta.url), "utf8");
  const content = JSON.parse(readFileSync(new URL("../content/projects/corvo.json", import.meta.url), "utf8"));
  const headings = content.content.filter((block) => block.type === "section").map((block) => block.heading);

  assert.deepEqual(headings, ["О проекте", "Задача", "Процесс", "Система", "Результат"]);
  assert.ok(page.indexOf("<ProjectSectionNavigation") < page.indexOf("<ProjectGallery"));
});
