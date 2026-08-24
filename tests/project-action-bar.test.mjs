import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getProjectActionBarState } from "../src/lib/main-chapter-interactions.ts";

const baseGeometry = {
  informationTop: 100,
  informationBottom: 1600,
  viewportHeight: 800,
  barHeight: 88,
  dpr: 1,
};

test("action bar requires 160px of visible information before Adaptive", () => {
  assert.equal(getProjectActionBarState({ ...baseGeometry, informationTop: 641 }).variant, "full");
  assert.equal(getProjectActionBarState({ ...baseGeometry, informationTop: 640 }).variant, "adaptive");
  assert.equal(getProjectActionBarState({ ...baseGeometry, informationTop: 639 }).variant, "adaptive");
});

test("action bar returns to Full as information leaves above its band", () => {
  assert.equal(getProjectActionBarState({ ...baseGeometry, informationBottom: 713 }).variant, "adaptive");
  assert.equal(getProjectActionBarState({ ...baseGeometry, informationBottom: 712 }).variant, "full");
  assert.equal(getProjectActionBarState({ ...baseGeometry, informationBottom: 700 }).variant, "full");
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
  assert.equal(getProjectActionBarState({ ...baseGeometry, informationTop: 640.24, dpr: 2 }).variant, "adaptive");
  assert.equal(getProjectActionBarState({ ...baseGeometry, informationTop: 640.26, dpr: 2 }).variant, "full");
  assert.equal(getProjectActionBarState({ ...baseGeometry, informationBottom: 712.24, dpr: 2 }).variant, "full");
  assert.equal(getProjectActionBarState({ ...baseGeometry, informationBottom: 712.26, dpr: 2 }).variant, "adaptive");
});

test("runtime action bar measures information and a stable terminal slot without magic scrollY", () => {
  const component = readFileSync(new URL("../src/components/project-action-bar.tsx", import.meta.url), "utf8");
  const page = readFileSync(new URL("../src/app/projects/[slug]/page.tsx", import.meta.url), "utf8");
  const pageStyles = readFileSync(new URL("../src/app/projects/[slug]/page.module.css", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/components/project-action-bar.module.css", import.meta.url), "utf8");

  assert.match(component, /data-project-information-start/);
  assert.match(component, /data-project-action-terminal/);
  assert.match(component, /getProjectActionBarState/);
  assert.doesNotMatch(component, /scrollY/);
  assert.match(component, /informationRect\.bottom/);
  assert.match(component, /innerHeight-160/);
  assert.match(styles, /background:\s*#fcfcfd/i);
  assert.doesNotMatch(styles, /\.adaptive[^}]*background:\s*#fff/is);
  assert.ok(page.indexOf("data-project-action-terminal") < page.indexOf("<ProjectActionBar"));
  assert.match(pageStyles, /\.actionTerminal\s*\{\s*height:\s*136px/);
});

test("the first user-visible action variant is bootstrapped without a blank shell", () => {
  const component = readFileSync(new URL("../src/components/project-action-bar.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/components/project-action-bar.module.css", import.meta.url), "utf8");

  assert.match(component, /useLayoutEffect/);
  assert.match(component, /ACTION_BAR_BOOTSTRAP/);
  assert.doesNotMatch(styles, /visibility:\s*hidden/);
});
