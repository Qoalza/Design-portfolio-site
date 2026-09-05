import assert from "node:assert/strict";
import test from "node:test";

import { adminToolEnvironment, selectManagedRepositoryTarget } from "../tools/des-art-admin/launcher-policy.mjs";

const publishedSha = "a".repeat(40);
const remoteMainSha = "b".repeat(40);

test("an existing live Admin stays pinned to the confirmed production SHA", () => {
  assert.deepEqual(selectManagedRepositoryTarget({
    publishMode: "live",
    hasLiveBaseline: true,
    publishedSha,
    remoteMainSha,
  }), { targetSha: publishedSha, checkout: "detached" });
});

test("the first live transition still requires production to equal origin/main", () => {
  assert.throws(() => selectManagedRepositoryTarget({
    publishMode: "live",
    hasLiveBaseline: false,
    publishedSha,
    remoteMainSha,
  }), /не совпадает с origin\/main/);

  assert.deepEqual(selectManagedRepositoryTarget({
    publishMode: "live",
    hasLiveBaseline: false,
    publishedSha,
    remoteMainSha: publishedSha,
  }), { targetSha: publishedSha, checkout: "main" });
});

test("sandbox Admin continues to follow origin/main", () => {
  assert.deepEqual(selectManagedRepositoryTarget({
    publishMode: "sandbox",
    hasLiveBaseline: false,
    remoteMainSha,
  }), { targetSha: remoteMainSha, checkout: "main" });
});

test("launcher policy rejects malformed Git identities", () => {
  assert.throws(() => selectManagedRepositoryTarget({
    publishMode: "live",
    hasLiveBaseline: true,
    publishedSha: "HEAD",
    remoteMainSha,
  }), /full Git SHA/);
});

test("packaged Admin uses the approved tool path instead of Finder's inherited PATH", () => {
  const environment = adminToolEnvironment({ PATH: "/finder-only", CUSTOM: "preserved" });
  assert.equal(environment.PATH, "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin");
  assert.equal(environment.CUSTOM, "preserved");
});
