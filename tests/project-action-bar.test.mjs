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

test("initial resolver selects Adaptive at and above the final bar top", () => {
  assert.equal(getProjectActionBarInitialState({ ...baseGeometry, informationTop: 711 }).variant, "adaptive");
  assert.equal(getProjectActionBarInitialState({ ...baseGeometry, informationTop: 712 }).variant, "adaptive");
  assert.equal(getProjectActionBarInitialState({ ...baseGeometry, informationTop: 713 }).variant, "full");
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

test("initial Full uses the independent 200px scroll threshold", () => {
  assert.equal(getProjectActionBarScrollState({ ...baseGeometry, informationTop: 600.5 }, "full").variant, "full");
  assert.equal(getProjectActionBarScrollState({ ...baseGeometry, informationTop: 600 }, "full").variant, "adaptive");
  assert.equal(getProjectActionBarScrollState({ ...baseGeometry, informationTop: 599.5 }, "full").variant, "adaptive");
});

test("initial Adaptive stays Adaptive while information is active and returns after Gallery", () => {
  assert.equal(getProjectActionBarScrollState({ ...baseGeometry, informationTop: 750 }, "adaptive").variant, "adaptive");
  assert.equal(getProjectActionBarScrollState({ ...baseGeometry, informationBottom: 712 }, "adaptive").variant, "full");
  assert.equal(getProjectActionBarScrollState({ ...baseGeometry, informationBottom: 713 }, "adaptive").variant, "adaptive");
});

test("scroll state returns to Full after information end for either initial variant", () => {
  assert.equal(getProjectActionBarScrollState({ ...baseGeometry, informationBottom: 712 }, "full").variant, "full");
  assert.equal(getProjectActionBarScrollState({ ...baseGeometry, informationBottom: 700 }, "adaptive").variant, "full");
});

test("physical-pixel normalization keeps initial and scroll boundaries deterministic", () => {
  assert.equal(getProjectActionBarInitialState({ ...baseGeometry, informationTop: 712.24, dpr: 2 }).variant, "adaptive");
  assert.equal(getProjectActionBarInitialState({ ...baseGeometry, informationTop: 712.26, dpr: 2 }).variant, "full");
  assert.equal(getProjectActionBarScrollState({ ...baseGeometry, informationTop: 600.24, dpr: 2 }, "full").variant, "adaptive");
  assert.equal(getProjectActionBarScrollState({ ...baseGeometry, informationTop: 600.26, dpr: 2 }, "full").variant, "full");
});

test("runtime separates initial resolution from scroll threshold without magic scrollY", () => {
  const component = readFileSync(new URL("../src/components/project-action-bar.tsx", import.meta.url), "utf8");
  const page = readFileSync(new URL("../src/app/projects/[slug]/page.tsx", import.meta.url), "utf8");
  const pageStyles = readFileSync(new URL("../src/app/projects/[slug]/page.module.css", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/components/project-action-bar.module.css", import.meta.url), "utf8");

  assert.match(component, /getProjectActionBarInitialState/);
  assert.match(component, /getProjectActionBarScrollState/);
  assert.match(component, /data-project-action-transitions/);
  assert.doesNotMatch(component, /scrollY/);
  assert.doesNotMatch(component, /innerHeight-160/);
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
  assert.doesNotMatch(styles, /visibility:\s*hidden/);
  const baseRule = styles.match(/\.actionBar\s*\{[^}]*\}/)?.[0] ?? "";
  assert.doesNotMatch(baseRule, /transition/);
});
