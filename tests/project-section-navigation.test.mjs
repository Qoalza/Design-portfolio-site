import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  NAVIGATION_ABSOLUTE_LIMIT_MS,
  NAVIGATION_WATCHDOG_MS,
  getNavigationProgressState,
} from "../src/lib/main-chapter-interactions.ts";

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
  assert.match(component, /const activationTop = Math\.max\(0, measuredHeaderHeight\)/);
  assert.doesNotMatch(component, /const activationTop[^;]+fixedHeader\?\.getBoundingClientRect\(\)\.bottom/);
  assert.doesNotMatch(component, /Результат/);
  assert.doesNotMatch(component, /documentElement\.scrollHeight/);
});

test("Corvo exposes exactly five information sections and keeps Gallery outside navigation", () => {
  const page = readFileSync(new URL("../src/app/projects/[slug]/page.tsx", import.meta.url), "utf8");
  const content = readFileSync(new URL("../content/projects/corvo.mdx", import.meta.url), "utf8");
  const headings = [...content.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1]);

  assert.deepEqual(headings, ["О проекте", "Задача", "Процесс", "Система", "Результат"]);
  assert.ok(page.indexOf("<ProjectSectionNavigation") < page.indexOf("<ProjectGallery"));
});
