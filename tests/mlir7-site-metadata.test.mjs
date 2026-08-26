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

test("application icon files are byte-identical to the approved review sources", () => {
  assert.equal(sha256("../src/app/icon.svg"), "7df7de6c1a0f200835a4d1d644c8178dbd84c9b42ab60e7c0448f9e8cc18103a");
  assert.equal(sha256("../src/app/favicon.ico"), "72cca0d290bf0dafddad804d2ffc8b422fa7361cc12c0cbedf6024dd40c7d0b9");
  assert.equal(sha256("../src/app/apple-icon.png"), "de2db4b9711eaf0912e64e125539621ca8f3ae70edb0810579a20dbbbb4c6dcc");
});
