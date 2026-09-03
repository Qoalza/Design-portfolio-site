import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import { synchronizeManagedRepositoryCheckout } from "../tools/des-art-admin/managed-repository.mjs";

const exec = promisify(execFile);

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "des-art-managed-repo-"));
  const source = path.join(root, "source");
  const remote = path.join(root, "remote.git");
  const managed = path.join(root, "managed");
  await exec("/usr/bin/git", ["init", "-b", "main", source]);
  await exec("/usr/bin/git", ["-C", source, "config", "user.name", "Admin Test"]);
  await exec("/usr/bin/git", ["-C", source, "config", "user.email", "admin-test@example.invalid"]);
  await writeFile(path.join(source, "state.txt"), "production\n");
  await exec("/usr/bin/git", ["-C", source, "add", "state.txt"]);
  await exec("/usr/bin/git", ["-C", source, "commit", "-m", "production"]);
  const publishedSha = (await exec("/usr/bin/git", ["-C", source, "rev-parse", "HEAD"])).stdout.trim();
  await exec("/usr/bin/git", ["init", "--bare", remote]);
  await exec("/usr/bin/git", ["-C", source, "remote", "add", "origin", remote]);
  await exec("/usr/bin/git", ["-C", source, "push", "-u", "origin", "main"]);
  await exec("/usr/bin/git", ["clone", "--branch", "main", remote, managed]);
  await writeFile(path.join(source, "state.txt"), "new main\n");
  await exec("/usr/bin/git", ["-C", source, "add", "state.txt"]);
  await exec("/usr/bin/git", ["-C", source, "commit", "-m", "new main"]);
  await exec("/usr/bin/git", ["-C", source, "push", "origin", "main"]);
  const remoteMainSha = (await exec("/usr/bin/git", ["-C", source, "rev-parse", "HEAD"])).stdout.trim();
  return { managed, publishedSha, remoteMainSha };
}

test("existing live checkout remains at production while origin/main advances", async () => {
  const { managed, publishedSha, remoteMainSha } = await fixture();
  const result = await synchronizeManagedRepositoryCheckout({
    repoRoot: managed, publishMode: "live", hasLiveBaseline: true, publishedSha, execImpl: exec,
  });
  assert.deepEqual(result, { targetSha: publishedSha, remoteMainSha, checkout: "detached" });
  assert.equal((await exec("/usr/bin/git", ["-C", managed, "rev-parse", "HEAD"])).stdout.trim(), publishedSha);
  assert.equal((await exec("/usr/bin/git", ["-C", managed, "rev-parse", "origin/main"])).stdout.trim(), remoteMainSha);
  assert.equal((await exec("/usr/bin/git", ["-C", managed, "status", "--porcelain"])).stdout, "");
});

test("first live transition refuses an unpublished origin/main", async () => {
  const { managed, publishedSha } = await fixture();
  await assert.rejects(() => synchronizeManagedRepositoryCheckout({
    repoRoot: managed, publishMode: "live", hasLiveBaseline: false, publishedSha, execImpl: exec,
  }), /не совпадает с origin\/main/);
  assert.equal((await exec("/usr/bin/git", ["-C", managed, "rev-parse", "HEAD"])).stdout.trim(), publishedSha);
});
