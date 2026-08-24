import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getProjectActionBarState } from "../src/lib/main-chapter-interactions.ts";

const baseGeometry = {
  informationTop: 100,
  informationBottom: 900,
  galleryTop: 900,
  footerTop: 1200,
  viewportHeight: 800,
  barHeight: 88,
  dpr: 1,
};

test("action bar requires the complete 88px band inside information", () => {
  assert.equal(getProjectActionBarState({ ...baseGeometry, informationTop: 713 }).variant, "full");
  assert.equal(getProjectActionBarState({ ...baseGeometry, informationTop: 712 }).variant, "adaptive");
  assert.equal(getProjectActionBarState({ ...baseGeometry, informationTop: 711 }).variant, "adaptive");
});

test("Gallery has explicit Full priority as soon as it enters the bar band", () => {
  const beforeGallery = getProjectActionBarState({ ...baseGeometry, informationBottom: 800, galleryTop: 800 });
  const inGallery = getProjectActionBarState({ ...baseGeometry, informationBottom: 799, galleryTop: 799 });

  assert.equal(beforeGallery.variant, "adaptive");
  assert.equal(inGallery.variant, "full");
});

test("footer collision raises the same 88px band instead of selecting a special variant", () => {
  const result = getProjectActionBarState({
    ...baseGeometry,
    informationBottom: 900,
    galleryTop: 900,
    footerTop: 760,
  });

  assert.equal(result.footerOffset, 40);
  assert.equal(result.barTop, 672);
  assert.equal(result.barBottom, 760);
  assert.equal(result.variant, "adaptive");
});

test("invalid geometry fails safe to visible Full without inheriting Adaptive", () => {
  const result = getProjectActionBarState({ ...baseGeometry, informationTop: Number.NaN });

  assert.deepEqual(result, {
    valid: false,
    variant: "full",
    footerOffset: 0,
    barTop: 712,
    barBottom: 800,
    visibleInformationInBarBand: 0,
  });
});

test("subpixel coordinates are normalized to physical pixels before selection", () => {
  assert.equal(getProjectActionBarState({ ...baseGeometry, informationTop: 712.24, dpr: 2 }).variant, "adaptive");
  assert.equal(getProjectActionBarState({ ...baseGeometry, informationTop: 712.26, dpr: 2 }).variant, "full");
});

test("runtime action bar measures information, Gallery and footer without magic scrollY", () => {
  const component = readFileSync(new URL("../src/components/project-action-bar.tsx", import.meta.url), "utf8");
  const page = readFileSync(new URL("../src/app/projects/[slug]/page.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/components/project-action-bar.module.css", import.meta.url), "utf8");

  assert.match(component, /data-project-information-start/);
  assert.match(component, /data-project-gallery/);
  assert.match(component, /data-project-footer/);
  assert.match(component, /getProjectActionBarState/);
  assert.doesNotMatch(component, /scrollY/);
  assert.match(styles, /background:\s*#fcfcfd/i);
  assert.doesNotMatch(styles, /\.adaptive[^}]*background:\s*#fff/is);
  assert.ok(page.indexOf("<ProjectActionBar") < page.indexOf("data-project-information-start"));
});

test("the first user-visible action variant is measured before paint", () => {
  const component = readFileSync(new URL("../src/components/project-action-bar.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/components/project-action-bar.module.css", import.meta.url), "utf8");

  assert.match(component, /useLayoutEffect/);
  assert.match(component, /"unmeasured"\s*\|\s*"valid"\s*\|\s*"invalid"/);
  assert.match(component, /inert=\{measurementStatus === "unmeasured"\}/);
  assert.match(component, /aria-hidden=\{measurementStatus === "unmeasured"\}/);
  assert.match(styles, /\.actionBar\[data-project-action-measurement="unmeasured"\][\s\S]*visibility:\s*hidden;/);
  assert.match(styles, /\.actionBar\[data-project-action-measurement="unmeasured"\][\s\S]*pointer-events:\s*none;/);
});
