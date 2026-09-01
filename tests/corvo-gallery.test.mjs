import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

async function pngSize(path) {
  const bytes = await readFile(new URL(path, root));
  assert.equal(bytes.toString("ascii", 1, 4), "PNG");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test("Corvo gallery defines three independent groups with five current assets each", async () => {
  const project = JSON.parse(await source("content/projects/corvo.json"));
  const gallery = project.content.find((block) => block.type === "gallery");

  for (const device of ["desktop", "tablet", "mobile"]) {
    const group = gallery.groups.find(({ deviceId }) => deviceId === device);
    assert.equal(group.images.length, 5);
    for (let index = 1; index <= 5; index += 1) {
      assert.equal(group.images[index - 1].src, `/assets/projects/corvo/gallery/${device}-0${index}.png`);
    }
  }
});

test("ProjectGallery keeps independent indexes and always renders disabled-capable arrows", async () => {
  const component = await source("src/components/project-gallery.tsx");

  assert.match(component, /function GalleryGroup/);
  assert.match(component, /useState\(0\)/);
  assert.match(component, /data-gallery-group=/);
  assert.match(component, /disabled=\{!previous\.available\}/);
  assert.match(component, /disabled=\{!next\.available\}/);
  assert.doesNotMatch(component, /itemCount > 1 \?/);
});

test("every Gallery input primes the idle Lenis clock before one canonical user transition", async () => {
  const component = await source("src/components/project-gallery.tsx");

  assert.match(component, /const requestGalleryStep = useCallback/);
  assert.doesNotMatch(component, /const move = useCallback/);
  assert.match(component, /const requestGalleryStep = useCallback[\s\S]{0,800}const waypoint = actual < lenis\.limit \? actual \+ 0\.001 : actual - 0\.001;[\s\S]{0,240}lenis\.scrollTo\(actual, \{ immediate: true, force: true \}\);[\s\S]{0,120}lenis\.raf\(performance\.now\(\)\);[\s\S]{0,120}setActiveIndex/);
  assert.doesNotMatch(component, /requestGalleryStep[\s\S]{0,500}lenis\.resize\(\)/);
  assert.doesNotMatch(component, /lenis\.stop\(\);[\s\S]{0,80}lenis\.start\(\);[\s\S]{0,120}lenis\.raf\(performance\.now\(\)\)/);
  assert.match(component, /onClick=\{\(\) => requestGalleryStep\(-1\)\}/);
  assert.match(component, /onClick=\{\(\) => requestGalleryStep\(1\)\}/);
  assert.match(component, /requestGalleryStep\(decision\.galleryStep\)/);
  assert.match(component, /requestGalleryStep\(gesture\.step\)/);
});

test("Gallery accepts only dominant horizontal intent and resolves every gesture to one step", async () => {
  const component = await source("src/components/project-gallery.tsx");
  const lightbox = await source("src/components/project-media-lightbox.tsx");

  assert.match(component, /Math\.abs\(event\.deltaX\) > Math\.abs\(event\.deltaY\)/);
  assert.match(component, /event\.preventDefault\(\)/);
  assert.match(component, /setPointerCapture/);
  assert.match(component, /gesture\.kind !== "horizontal-drag"[\s\S]{0,120}event\.preventDefault\(\)/);
  assert.match(component, /scrollLeft:\s*viewportRef\.current\?\.scrollLeft\s*\?\?\s*0/);
  assert.equal((component.match(/viewportRef\.current\.scrollLeft = start\.scrollLeft/g) ?? []).length, 2);
  assert.match(component, /onPointerMove/);
  assert.match(component, /getGalleryPointerGesture/);
  assert.doesNotMatch(component, /handlePointerDown[\s\S]{0,400}setPointerCapture/);
  assert.match(component, /suppressClickRef/);
  assert.match(component, /onClickCapture/);
  assert.doesNotMatch(component, /overflowX:\s*["']auto/);
  assert.match(lightbox, /<Image[^>]+draggable=\{false\}/s);
});

test("Gallery geometry matches the current Desktop, Tablet and Mobile instances", async () => {
  const css = await source("src/components/project-gallery.module.css");

  assert.match(css, /--gallery-item-width:\s*740px/);
  assert.match(css, /--gallery-item-height:\s*512px/);
  assert.match(css, /--gallery-item-width:\s*400px/);
  assert.match(css, /--gallery-item-height:\s*566px/);
  assert.match(css, /--gallery-item-width:\s*180px/);
  assert.match(css, /--gallery-item-height:\s*320px/);
  assert.match(css, /--gallery-gap:\s*24px/);
  assert.match(css, /width:\s*1176px/);
});

test("Gallery exposes only the right edge fade while a next item exists", async () => {
  const component = await source("src/components/project-gallery.tsx");
  const css = await source("src/components/project-gallery.module.css");

  assert.match(component, /next\.available\s*\?\s*<div className=\{`\$\{styles\.edgeFade\} \$\{styles\.edgeFadeRight\}`\}/);
  assert.doesNotMatch(component, /edgeFadeLeft|previous\.available\s*\?\s*<div className=\{`\$\{styles\.edgeFade\}/);
  assert.doesNotMatch(css, /\.edgeFadeLeft/);
});

test("Gallery previews serve the original high-density Figma exports without another image encode", async () => {
  const component = await source("src/components/project-media-lightbox.tsx");

  assert.equal((component.match(/unoptimized/g) ?? []).length, 2);
  assert.doesNotMatch(component, /placeholder=["']blur["']/);
});

test("Mobile Gallery exports retain two device pixels at the maximum lightbox size", async () => {
  const project = JSON.parse(await source("content/projects/corvo.json"));
  const gallery = project.content.find((block) => block.type === "gallery");
  const mobile = gallery.groups.find(({ deviceId }) => deviceId === "mobile");

  assert.equal(mobile.images.filter(({ width, height }) => width === 1080 && height === 1920).length, 5);
  for (let index = 1; index <= 5; index += 1) {
    assert.deepEqual(
      await pngSize(`public/assets/projects/corvo/gallery/mobile-0${index}.png`),
      { width: 1080, height: 1920 },
    );
  }
});

test("the Gallery is outside the information article and exposes a geometry anchor", async () => {
  const page = await source("src/app/projects/[slug]/page.tsx");
  const component = await source("src/components/project-gallery.tsx");
  const informationEnd = page.indexOf("{galleryBlocks.map");

  assert.notEqual(informationEnd, -1);
  assert.ok(page.indexOf("data-project-information-start") < informationEnd);
  assert.match(component, /data-project-gallery/);
});

test("Gallery device labels use complete 24px Figma icon frames with real strokes", async () => {
  for (const name of ["desktop", "tablet", "mobile"]) {
    const icon = await source(`public/assets/projects/corvo/${name}.svg`);
    assert.match(icon, /width="24" height="24" viewBox="0 0 24 24"/);
    assert.match(icon, /stroke="(?:currentColor|#E2E2EC)"/i);
    assert.match(icon, /stroke-width="1"|stroke-width='1'|<path[^>]+stroke=/i);
    assert.doesNotMatch(icon, /preserveAspectRatio="none"/);
  }

  const css = await source("src/components/project-gallery.module.css");
  assert.match(css, /\.deviceIcon\s*\{[\s\S]*width:\s*16px;[\s\S]*height:\s*16px;[\s\S]*mask-size:\s*16px 16px;/);
  assert.match(css, /\.deviceLabel\s*\{[\s\S]*gap:\s*8px;/);
});
