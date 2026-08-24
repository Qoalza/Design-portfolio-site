import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getProjectActionBarState } from "../src/lib/main-chapter-interactions.ts";

const baseGeometry = {
  informationTop: 100,
  viewportHeight: 800,
  barHeight: 88,
  dpr: 1,
};

test("action bar requires the complete 88px band inside information", () => {
  assert.equal(getProjectActionBarState({ ...baseGeometry, informationTop: 713 }).variant, "full");
  assert.equal(getProjectActionBarState({ ...baseGeometry, informationTop: 712 }).variant, "adaptive");
  assert.equal(getProjectActionBarState({ ...baseGeometry, informationTop: 711 }).variant, "adaptive");
});

test("Gallery and footer geometry do not change the selected action variant", () => {
  assert.equal(getProjectActionBarState({ ...baseGeometry, informationTop: 100 }).variant, "adaptive");
});

test("invalid geometry fails safe to visible Full without inheriting Adaptive", () => {
  const result = getProjectActionBarState({ ...baseGeometry, informationTop: Number.NaN });

  assert.deepEqual(result, {
    valid: false,
    variant: "full",
    barTop: 712,
    barBottom: 800,
  });
});

test("subpixel coordinates are normalized to physical pixels before selection", () => {
  assert.equal(getProjectActionBarState({ ...baseGeometry, informationTop: 712.24, dpr: 2 }).variant, "adaptive");
  assert.equal(getProjectActionBarState({ ...baseGeometry, informationTop: 712.26, dpr: 2 }).variant, "full");
});

test("runtime action bar measures information and a stable terminal slot without magic scrollY", () => {
  const component = readFileSync(new URL("../src/components/project-action-bar.tsx", import.meta.url), "utf8");
  const page = readFileSync(new URL("../src/app/projects/[slug]/page.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/components/project-action-bar.module.css", import.meta.url), "utf8");

  assert.match(component, /data-project-information-start/);
  assert.match(component, /data-project-action-terminal/);
  assert.match(component, /getProjectActionBarState/);
  assert.doesNotMatch(component, /scrollY/);
  assert.match(styles, /background:\s*#fcfcfd/i);
  assert.doesNotMatch(styles, /\.adaptive[^}]*background:\s*#fff/is);
  assert.ok(page.indexOf("data-project-action-terminal") < page.indexOf("<ProjectActionBar"));
});

test("the first user-visible action variant is bootstrapped without a blank shell", () => {
  const component = readFileSync(new URL("../src/components/project-action-bar.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/components/project-action-bar.module.css", import.meta.url), "utf8");

  assert.match(component, /useLayoutEffect/);
  assert.match(component, /ACTION_BAR_BOOTSTRAP/);
  assert.doesNotMatch(styles, /visibility:\s*hidden/);
});
