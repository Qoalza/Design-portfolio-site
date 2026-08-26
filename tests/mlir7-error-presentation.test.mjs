import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const errorScreen = readFileSync(new URL("../src/components/error-screen.tsx", import.meta.url), "utf8");
const errorStyles = readFileSync(new URL("../src/components/error-screen.module.css", import.meta.url), "utf8");
const notFoundPage = readFileSync(new URL("../src/app/not-found.tsx", import.meta.url), "utf8");
const errorPage = readFileSync(new URL("../src/app/error.tsx", import.meta.url), "utf8");

test("404 and 500 labels render through one presentation-only frame", () => {
  assert.match(errorScreen, /data-error-presentation-action/);
  assert.match(errorScreen, /<div[^>]*className=\{`\$\{styles\.presentationAction\}/);
  assert.doesNotMatch(errorScreen, /<button|<a\b|role=["'](?:button|link)["']|tabIndex/);
});

test("error routes provide labels without navigation or reset behavior", () => {
  assert.match(notFoundPage, /actionLabel="На главную"/);
  assert.doesNotMatch(notFoundPage, /next\/link|<Link|href=/);

  assert.match(errorPage, /actionLabel="Перезагрузить"/);
  assert.doesNotMatch(errorPage, /<button|onClick=|\breset\b/);
});

test("presentation frame preserves the exact shared Figma geometry", () => {
  assert.match(errorStyles, /\.presentationAction\s*\{[^}]*display:\s*inline-flex/);
  assert.match(errorStyles, /\.presentationAction\s*\{[^}]*min-width:\s*96px/);
  assert.match(errorStyles, /\.presentationAction\s*\{[^}]*height:\s*48px/);
  assert.match(errorStyles, /\.presentationAction\s*\{[^}]*padding:\s*4px 28px/);
  assert.match(errorStyles, /\.presentationAction\s*\{[^}]*border-radius:\s*12px/);
  assert.match(errorStyles, /\.presentationAction\s*\{[^}]*cursor:\s*default/);
  assert.match(errorStyles, /\.presentationAction404\s*\{[^}]*width:\s*144px/);
  assert.match(errorStyles, /\.presentationAction500\s*\{[^}]*width:\s*171px/);
});
