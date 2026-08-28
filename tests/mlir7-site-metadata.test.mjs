import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const sha256 = (path) => createHash("sha256").update(readFileSync(new URL(path, import.meta.url))).digest("hex");

test("route metadata uses the Artur Designer absolute-title contract", () => {
  assert.match(read("../src/app/layout.tsx"), /title:\s*\{\s*absolute:\s*"Страница не найдена — Artur Designer"\s*\}/);
  assert.match(read("../src/app/page.tsx"), /title:\s*\{\s*absolute:\s*"Artur Designer"\s*\}/);
  assert.match(read("../src/app/projects/page.tsx"), /title:\s*\{\s*absolute:\s*"Мои работы — Artur Designer"\s*\}/);
  assert.match(read("../src/app/projects\/\[slug\]\/page.tsx"), /title:\s*\{\s*absolute:\s*`\$\{project\.title\} — Artur Designer`\s*\}/);
  assert.match(read("../src/app/error-test/layout.tsx"), /title:\s*\{\s*absolute:\s*"Ошибка — Artur Designer"\s*\}/);
});

test("active metadata code no longer contains superseded site titles", () => {
  const metadataSources = [
    "../src/app/layout.tsx",
    "../src/app/page.tsx",
    "../src/app/projects/page.tsx",
    "../src/app/projects/[slug]/page.tsx",
    "../src/app/error-test/layout.tsx",
  ].filter((path) => existsSync(new URL(path, import.meta.url))).map(read).join("\n");
  assert.doesNotMatch(metadataSources, /Artur Product|Des-art|Арустамян/);
});

test("root metadata exposes one exact SVG browser favicon", () => {
  const layout = read("../src/app/layout.tsx");
  const faviconHash = "9b98eb23b20522856670e92d45a19d0dea0f370726b122b0946bae0a8b4b420b";

  assert.equal(sha256("../public/artur-designer-favicon.svg"), faviconHash);
  assert.equal(sha256("../design-reference/favicon-review/source/Symbol.svg"), faviconHash);
  assert.match(layout, /url:\s*"\/artur-designer-favicon\.svg"/);
  assert.match(layout, /type:\s*"image\/svg\+xml"/);
  assert.match(layout, /sizes:\s*"any"/);
  assert.equal(existsSync(new URL("../src/app/icon.svg", import.meta.url)), false);
  assert.equal(existsSync(new URL("../src/app/favicon.ico", import.meta.url)), false);
  assert.equal(sha256("../src/app/apple-icon.png"), "de2db4b9711eaf0912e64e125539621ca8f3ae70edb0810579a20dbbbb4c6dcc");
});

test("all site routes expose one shared social preview", () => {
  const layout = read("../src/app/layout.tsx");
  const home = read("../src/app/page.tsx");
  const projects = read("../src/app/projects/page.tsx");
  const project = read("../src/app/projects/[slug]/page.tsx");
  const socialMetadata = read("../src/lib/site-metadata.ts");

  assert.match(layout, /metadataBase:\s*new URL\("https:\/\/art-des\.ru"\)/);
  assert.match(socialMetadata, /url:\s*"\/artur-designer-social-preview\.png"/);
  assert.match(socialMetadata, /width:\s*1800/);
  assert.match(socialMetadata, /height:\s*945/);
  assert.match(socialMetadata, /card:\s*"summary_large_image"/);
  assert.match(socialMetadata, /title:\s*"Артур А\."/);
  assert.match(socialMetadata, /description:\s*"PRODUCT DESIGNER"/);
  assert.equal(existsSync(new URL("../public/artur-designer-social-preview.png", import.meta.url)), true);
  assert.match(home, /createSocialMetadata\("\/"\)/);
  assert.match(projects, /createSocialMetadata\("\/projects"\)/);
  assert.match(project, /createSocialMetadata\(`\/projects\/\$\{project\.slug\}`\)/);
});
