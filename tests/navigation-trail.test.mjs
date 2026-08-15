import assert from "node:assert/strict";
import test from "node:test";
import {
  appendNavigationTrail,
  HOME_TRAIL_ITEM,
  truncateNavigationTrail,
} from "../src/lib/navigation-trail.ts";

const projects = { href: "/projects", label: "Работы" };
const corvo = { href: "/projects/corvo", label: "Corvo" };

test("records the actual route without injecting an unvisited canonical parent", () => {
  assert.deepEqual(appendNavigationTrail([HOME_TRAIL_ITEM], corvo), [HOME_TRAIL_ITEM, corvo]);
});

test("records every page that was actually visited", () => {
  const trail = appendNavigationTrail(
    appendNavigationTrail([HOME_TRAIL_ITEM], projects),
    corvo,
  );

  assert.deepEqual(trail, [HOME_TRAIL_ITEM, projects, corvo]);
});

test("revisiting an existing item truncates the trail instead of creating a cycle", () => {
  assert.deepEqual(
    appendNavigationTrail([HOME_TRAIL_ITEM, projects, corvo], projects),
    [HOME_TRAIL_ITEM, projects],
  );
});

test("an intermediate breadcrumb truncates all following items", () => {
  assert.deepEqual(
    truncateNavigationTrail([HOME_TRAIL_ITEM, projects, corvo], "/"),
    [HOME_TRAIL_ITEM],
  );
});

test("supports another project without project-specific branching", () => {
  const anotherProject = { href: "/projects/example-project", label: "Пример проектного кейса" };

  assert.deepEqual(
    appendNavigationTrail([HOME_TRAIL_ITEM, projects], anotherProject),
    [HOME_TRAIL_ITEM, projects, anotherProject],
  );
});
