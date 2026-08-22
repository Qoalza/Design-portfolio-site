import assert from "node:assert/strict";
import test from "node:test";
import {
  appendNavigationTrail,
  HOME_TRAIL_ITEM,
  readNavigationTrailFromHistoryState,
  resolveNavigationTrailForRoute,
  truncateNavigationTrail,
  writeNavigationTrailToHistoryState,
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

test("a prepared trail is not committed before its destination pathname is active", () => {
  assert.deepEqual(
    resolveNavigationTrailForRoute({
      pathname: "/",
      pendingTrail: [HOME_TRAIL_ITEM, corvo],
      storedTrail: [HOME_TRAIL_ITEM],
      canonicalTrail: [HOME_TRAIL_ITEM],
    }),
    [HOME_TRAIL_ITEM],
  );
});

test("the destination commits the actual pending trail instead of its canonical parent", () => {
  assert.deepEqual(
    resolveNavigationTrailForRoute({
      pathname: "/projects/corvo",
      pendingTrail: [HOME_TRAIL_ITEM, corvo],
      storedTrail: null,
      canonicalTrail: [HOME_TRAIL_ITEM, projects, corvo],
    }),
    [HOME_TRAIL_ITEM, corvo],
  );
});

test("history entry storage preserves Next.js state fields", () => {
  const nextState = { __NA: true, tree: ["", {}], key: "entry-a" };
  const storedState = writeNavigationTrailToHistoryState(nextState, [HOME_TRAIL_ITEM, projects]);

  assert.equal(storedState.__NA, true);
  assert.deepEqual(storedState.tree, ["", {}]);
  assert.equal(storedState.key, "entry-a");
  assert.deepEqual(readNavigationTrailFromHistoryState(storedState), [HOME_TRAIL_ITEM, projects]);
});
