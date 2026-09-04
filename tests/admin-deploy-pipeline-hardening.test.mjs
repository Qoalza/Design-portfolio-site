import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmod, mkdir, mkdtemp, readFile, readdir, rename, stat, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  claimPublishWorker,
  heartbeatPublishWorker,
  reconcileOrphanedPublishJob,
  releasePublishWorker,
} from "../tools/des-art-admin/publish-job-state.mjs";
import {
  collectPublicAssetPaths,
  createRuntimeReleaseArchive,
  parseDeployStatusV2,
  resolveFreshDeployTarget,
  verifyPublicRelease,
} from "../tools/des-art-admin/deploy-v2.mjs";

const sha = (character) => character.repeat(40);

test("two simultaneous Resume claims create exactly one worker lease", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-worker-lease-"));
  const jobFile = path.join(root, "job.json");
  await writeFile(jobFile, JSON.stringify({ id: "job", status: "failed", updatedAt: new Date().toISOString() }), { mode: 0o600 });

  const [first, second] = await Promise.all([
    claimPublishWorker(jobFile, { ownerId: "worker-a", pid: 101 }),
    claimPublishWorker(jobFile, { ownerId: "worker-b", pid: 102 }),
  ]);

  assert.equal([first.claimed, second.claimed].filter(Boolean).length, 1);
  const job = JSON.parse(await readFile(jobFile, "utf8"));
  assert.match(job.worker.ownerId, /^worker-[ab]$/);
  assert.equal(job.status, "queued");
  assert.equal((await stat(jobFile)).mode & 0o777, 0o600);
});

test("a lost worker becomes retryable ORPHANED_WORKER within the bounded lease", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-worker-orphan-"));
  const jobFile = path.join(root, "job.json");
  const now = Date.parse("2026-09-04T08:00:31.000Z");
  await writeFile(jobFile, JSON.stringify({
    id: "job",
    status: "running",
    worker: { ownerId: "lost", pid: 999999, claimedAt: "2026-09-04T08:00:00.000Z", heartbeatAt: "2026-09-04T08:00:00.000Z" },
  }), { mode: 0o600 });

  const result = await reconcileOrphanedPublishJob(jobFile, { now, orphanAfterMs: 30_000, isProcessAlive: () => false });
  assert.equal(result.status, "failed");
  assert.equal(result.failureCode, "ORPHANED_WORKER");
  assert.equal(result.retryable, true);
  assert.equal("worker" in result, false);
});

test("heartbeats and release are accepted only from the current lease owner", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-worker-heartbeat-"));
  const jobFile = path.join(root, "job.json");
  await writeFile(jobFile, JSON.stringify({ id: "job", status: "failed" }), { mode: 0o600 });
  await claimPublishWorker(jobFile, { ownerId: "owner", pid: 101 });
  assert.equal(await heartbeatPublishWorker(jobFile, { ownerId: "other", pid: 102 }), false);
  assert.equal(await heartbeatPublishWorker(jobFile, { ownerId: "owner", pid: 103 }), true);
  assert.equal(await releasePublishWorker(jobFile, { ownerId: "other" }), false);
  assert.equal(await releasePublishWorker(jobFile, { ownerId: "owner" }), true);
});

test("fresh main, not a saved merge SHA, is the only deploy target", async () => {
  const contentCommit = sha("a");
  const savedMergeSha = sha("b");
  const freshMain = sha("c");
  const productionSha = sha("d");
  const calls = [];
  const target = await resolveFreshDeployTarget({
    cwd: "/sandbox",
    contentCommit,
    savedMergeSha,
    productionSha,
    command: async (operation, command, args) => {
      calls.push({ operation, command, args });
      if (operation === "deploy-target.resolve") return { stdout: `${freshMain}\n` };
      return { stdout: "" };
    },
  });
  assert.equal(target, freshMain);
  assert.ok(calls.some((call) => call.operation === "deploy-target.fetch"));
  assert.deepEqual(calls.filter((call) => call.operation === "deploy-target.ancestry").map((call) => call.args.slice(-2)), [
    [contentCommit, freshMain],
    [savedMergeSha, freshMain],
    [productionSha, freshMain],
  ]);
});

test("runtime release contains only the standalone server, static files, public files and manifest", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-runtime-release-"));
  const sourceRoot = path.join(root, "source");
  const archive = path.join(root, "release.tar.gz");
  await mkdir(path.join(sourceRoot, ".next", "standalone", ".next", "server"), { recursive: true });
  await mkdir(path.join(sourceRoot, ".next", "static", "chunks"), { recursive: true });
  await mkdir(path.join(sourceRoot, "public", "assets"), { recursive: true });
  await mkdir(path.join(sourceRoot, "design-reference"), { recursive: true });
  await writeFile(path.join(sourceRoot, ".next", "standalone", "server.js"), "server");
  await writeFile(path.join(sourceRoot, ".next", "standalone", ".next", "server", "page.js"), "page");
  await writeFile(path.join(sourceRoot, ".next", "static", "chunks", "app.js"), "static");
  await writeFile(path.join(sourceRoot, "public", "assets", "image.png"), "asset");
  await writeFile(path.join(sourceRoot, "design-reference", "private.png"), "not-runtime");

  const result = await createRuntimeReleaseArchive({ archive, sourceRoot, sha: sha("a") });
  assert.equal(result.sha, sha("a"));
  assert.equal(result.bytes, (await stat(archive)).size);
  assert.match(result.artifactSha256, /^[a-f0-9]{64}$/);
  const entries = execFileSync("tar", ["-tzf", archive], { encoding: "utf8" });
  assert.match(entries, /server\.js/);
  assert.match(entries, /\.next\/static\/chunks\/app\.js/);
  assert.match(entries, /public\/assets\/image\.png/);
  assert.match(entries, /RELEASE_MANIFEST\.json/);
  assert.match(entries, /DEPLOY_SHA/);
  assert.doesNotMatch(entries, /design-reference|tools\/des-art-admin|content\/projects/);
});

test("Deploy v2 status is strict and machine-readable", () => {
  assert.deepEqual(parseDeployStatusV2(JSON.stringify({
    protocol: "art-des-deploy-v2",
    operationId: `${sha("a")}-${"b".repeat(16)}`,
    state: "running",
    phase: "activate",
    targetSha: sha("a"),
    updatedAt: "2026-09-04T08:00:00Z",
  })), {
    protocol: "art-des-deploy-v2",
    operationId: `${sha("a")}-${"b".repeat(16)}`,
    state: "running",
    phase: "activate",
    targetSha: sha("a"),
    updatedAt: "2026-09-04T08:00:00Z",
  });
  assert.throws(() => parseDeployStatusV2("deployed maybe"));
  assert.throws(() => parseDeployStatusV2(JSON.stringify({ protocol: "art-des-deploy-v2", state: "unknown" })));
});

test("public verification rejects a custom 404 that returns HTTP 200", async () => {
  await assert.rejects(() => verifyPublicRelease({
    baseUrl: "https://example.test",
    sha: sha("a"),
    project: { slug: "sarafan-radio", title: "Сараффан.Радио", assets: [] },
    fetchImpl: async (url) => ({
      ok: true,
      status: 200,
      text: async () => url.endsWith("/projects/sarafan-radio") ? "<html><title>Страница не найдена</title></html>" : `<html data-build-sha=\"${sha("a")}\"></html>`,
    }),
  }), /project marker/i);
});

test("public verification checks every asset referenced by the exact published project", async () => {
  const project = {
    slug: "sarafan-radio",
    title: "Сараффан.Радио",
    visuals: { hero: { src: "/assets/projects/sarafan-radio/hero.png" } },
    content: [{ blocks: [{ type: "image", src: "/assets/projects/sarafan-radio/screen.png" }] }],
  };
  assert.deepEqual(collectPublicAssetPaths(project), [
    "/assets/projects/sarafan-radio/hero.png",
    "/assets/projects/sarafan-radio/screen.png",
  ]);
  const requested = [];
  await verifyPublicRelease({
    baseUrl: "https://example.test",
    sha: sha("a"),
    project,
    fetchImpl: async (url) => {
      requested.push(String(url));
      return { ok: true, status: 200, text: async () => String(url).endsWith("/sarafan-radio") ? project.title : sha("a") };
    },
  });
  assert.ok(requested.some((url) => url.endsWith("/hero.png")));
  assert.ok(requested.some((url) => url.endsWith("/screen.png")));
});

test("restricted server command exposes durable v2 operations without server builds", async () => {
  const deploy = await readFile(new URL("../tools/des-art-admin/server/art-des-publish", import.meta.url), "utf8");
  assert.match(deploy, /upload-v2/);
  assert.match(deploy, /start-v2/);
  assert.match(deploy, /status-v2/);
  assert.match(deploy, /systemd-run/);
  assert.match(deploy, /\.start\.lock/);
  assert.doesNotMatch(deploy, /npm ci|npm run build/);
});

test("upload-v2 rejects partial bytes and start-v2 is idempotent for the exact artifact", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-server-v2-"));
  const script = fileURLToPath(new URL("../tools/des-art-admin/server/art-des-publish", import.meta.url));
  const artifact = Buffer.from("runtime artifact");
  const artifactHash = (await import("node:crypto")).createHash("sha256").update(artifact).digest("hex");
  const fakeSystemd = path.join(root, "systemd-run");
  const fakeFlock = path.join(root, "flock");
  const fakeStat = path.join(root, "stat");
  const fakeSha256sum = path.join(root, "sha256sum");
  await writeFile(fakeSystemd, "#!/bin/sh\nexit 0\n");
  await writeFile(fakeFlock, "#!/bin/sh\nexit 0\n");
  await writeFile(fakeStat, "#!/bin/sh\n[ \"$1\" = \"-c%s\" ] && exec /usr/bin/stat -f%z \"$2\"\nexec /usr/bin/stat \"$@\"\n");
  await writeFile(fakeSha256sum, "#!/bin/sh\nexec /usr/bin/shasum -a 256 \"$@\"\n");
  await chmod(fakeSystemd, 0o755);
  await chmod(fakeFlock, 0o755);
  await chmod(fakeStat, 0o755);
  await chmod(fakeSha256sum, 0o755);
  const env = {
    ...process.env,
    PATH: `${root}:/usr/bin:/bin`,
    ART_DES_DEPLOY_TEST_MODE: "1",
    ART_DES_TEST_ROOT: root,
    ART_DES_TEST_SYSTEMD_RUN: fakeSystemd,
  };

  assert.throws(() => execFileSync(script, ["upload-v2", sha("a"), artifactHash, String(artifact.length + 1)], { env, input: artifact, stdio: ["pipe", "pipe", "pipe"] }));
  const uploaded = JSON.parse(execFileSync(script, ["upload-v2", sha("a"), artifactHash, String(artifact.length)], { env, input: artifact, encoding: "utf8" }));
  assert.equal(uploaded.bytes, artifact.length);
  const first = JSON.parse(execFileSync(script, ["start-v2", sha("a"), artifactHash], { env, encoding: "utf8" }));
  const second = JSON.parse(execFileSync(script, ["start-v2", sha("a"), artifactHash], { env, encoding: "utf8" }));
  assert.equal(first.operationId, second.operationId);
  assert.equal(first.state, "queued");
});

test("server activation switches atomically, passes readiness and retains current plus two rollbacks", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-server-activation-"));
  const source = path.join(root, "source");
  const shaTarget = sha("d");
  await mkdir(path.join(source, ".next", "standalone"), { recursive: true });
  await mkdir(path.join(source, ".next", "static"), { recursive: true });
  await mkdir(path.join(source, "public"), { recursive: true });
  await writeFile(path.join(source, ".next", "standalone", "server.js"), "server");
  await writeFile(path.join(source, ".next", "static", "app.js"), "static");
  await writeFile(path.join(source, "public", "index.txt"), "public");
  const stagedArchive = path.join(root, "staged.tar.gz");
  const artifact = await createRuntimeReleaseArchive({ archive: stagedArchive, sourceRoot: source, sha: shaTarget });
  await mkdir(path.join(root, "incoming"), { recursive: true });
  await mkdir(path.join(root, "releases"), { recursive: true });
  await mkdir(path.join(root, "deploy-jobs"), { recursive: true });
  await rename(stagedArchive, path.join(root, "incoming", `${shaTarget}.${artifact.artifactSha256}.tar.gz`));
  const oldShas = [sha("a"), sha("b"), sha("c")];
  for (const oldSha of oldShas) {
    const release = path.join(root, "releases", oldSha);
    await mkdir(release);
    await writeFile(path.join(release, "DEPLOY_SHA"), `${oldSha}\n`);
  }
  await symlink(path.join(root, "releases", oldShas[2]), path.join(root, "current"));
  const bin = path.join(root, "bin");
  await mkdir(bin);
  await writeFile(path.join(bin, "systemctl"), "#!/bin/sh\nexit 0\n");
  await writeFile(path.join(bin, "curl"), `#!/bin/sh\nprintf '%s\\n' '${shaTarget}'\n`);
  await writeFile(path.join(bin, "flock"), "#!/bin/sh\nexit 0\n");
  await writeFile(path.join(bin, "chown"), "#!/bin/sh\nexit 0\n");
  await writeFile(path.join(bin, "stat"), "#!/bin/sh\n[ \"$1\" = \"-c%s\" ] && exec /usr/bin/stat -f%z \"$2\"\nexec /usr/bin/stat \"$@\"\n");
  await writeFile(path.join(bin, "sha256sum"), "#!/bin/sh\nexec /usr/bin/shasum -a 256 \"$@\"\n");
  await writeFile(path.join(bin, "find"), `#!/bin/sh\ncase \"$*\" in *\"-type l\"*) exec /usr/bin/find \"$@\" ;; *%T@*) for d in '${root}'/releases/*; do [ -d \"$d\" ] && printf '0 %s\\n' \"$d\"; done ;; *) for d in '${root}'/releases/*; do [ -d \"$d\" ] && printf '%s\\n' \"$d\"; done ;; esac\n`);
  await writeFile(path.join(bin, "mv"), "#!/bin/sh\nif [ \"$1\" = \"-Tf\" ]; then shift; source=$1; target=$2; /bin/rm -f \"$target\"; exec /bin/mv -f \"$source\" \"$target\"; fi\nexec /bin/mv \"$@\"\n");
  await chmod(path.join(bin, "systemctl"), 0o755);
  await chmod(path.join(bin, "curl"), 0o755);
  await chmod(path.join(bin, "flock"), 0o755);
  await chmod(path.join(bin, "chown"), 0o755);
  await chmod(path.join(bin, "stat"), 0o755);
  await chmod(path.join(bin, "sha256sum"), 0o755);
  await chmod(path.join(bin, "find"), 0o755);
  await chmod(path.join(bin, "mv"), 0o755);
  const script = fileURLToPath(new URL("../tools/des-art-admin/server/art-des-publish", import.meta.url));
  const operationId = `${shaTarget}-${artifact.artifactSha256.slice(0, 16)}`;
  execFileSync(script, ["__internal-v2", shaTarget, artifact.artifactSha256, operationId], {
    env: {
      ...process.env,
      PATH: `${bin}:${path.dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
      ART_DES_DEPLOY_TEST_MODE: "1",
      ART_DES_TEST_ROOT: root,
      ART_DES_TEST_SYSTEMCTL: path.join(bin, "systemctl"),
      ART_DES_TEST_RUN_USER: process.env.USER,
    },
  });
  assert.equal(path.basename(await (await import("node:fs/promises")).readlink(path.join(root, "current"))), shaTarget);
  const releases = (await readdir(path.join(root, "releases"))).filter((name) => /^[a-f0-9]{40}$/.test(name));
  assert.equal(releases.length, 3);
  const status = JSON.parse(await readFile(path.join(root, "deploy-jobs", `${operationId}.json`), "utf8"));
  assert.equal(status.state, "complete");
});
