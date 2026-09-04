import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";

export const PUBLISH_WORKER_HEARTBEAT_MS = 5_000;
export const PUBLISH_WORKER_ORPHAN_MS = 30_000;
const JOB_LOCK_TIMEOUT_MS = 5_000;
const JOB_LOCK_STALE_MS = 30_000;

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function atomicJson(file, value) {
  const temporary = `${file}.${process.pid}.${Math.random().toString(16).slice(2)}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, file);
}

async function acquireJobLock(jobFile, { now = Date.now(), timeoutMs = JOB_LOCK_TIMEOUT_MS } = {}) {
  const lock = `${jobFile}.lock`;
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      await mkdir(lock, { mode: 0o700 });
      return async () => rm(lock, { recursive: true, force: true });
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      const lockStat = await stat(lock).catch(() => null);
      if (lockStat && now - lockStat.mtimeMs > JOB_LOCK_STALE_MS) {
        await rm(lock, { recursive: true, force: true });
        continue;
      }
      if (Date.now() >= deadline) throw new Error("Publish job state lock timed out.");
      await pause(20);
    }
  }
}

export async function mutatePublishJob(jobFile, mutation, options = {}) {
  const release = await acquireJobLock(jobFile, options);
  try {
    const current = JSON.parse(await readFile(jobFile, "utf8"));
    const next = await mutation(structuredClone(current));
    if (!next || typeof next !== "object") throw new Error("Publish job mutation returned an invalid state.");
    await atomicJson(jobFile, next);
    return next;
  } finally {
    await release();
  }
}

function leaseTimestamp(worker) {
  return Date.parse(worker?.heartbeatAt ?? worker?.claimedAt ?? "");
}

export async function claimPublishWorker(jobFile, {
  ownerId,
  pid,
  now = Date.now(),
  orphanAfterMs = PUBLISH_WORKER_ORPHAN_MS,
} = {}) {
  if (typeof ownerId !== "string" || !ownerId) throw new Error("Publish worker owner is required.");
  let claimed = false;
  const job = await mutatePublishJob(jobFile, (current) => {
    const activeAt = leaseTimestamp(current.worker);
    const active = Number.isFinite(activeAt) && now - activeAt <= orphanAfterMs;
    if (current.worker && current.worker.ownerId !== ownerId && active) return current;
    const timestamp = new Date(now).toISOString();
    claimed = true;
    return {
      ...current,
      status: current.status === "failed" ? "queued" : current.status,
      worker: {
        ownerId,
        pid: Number.isSafeInteger(pid) && pid > 0 ? pid : undefined,
        claimedAt: current.worker?.ownerId === ownerId ? current.worker.claimedAt : timestamp,
        heartbeatAt: timestamp,
      },
      updatedAt: timestamp,
    };
  });
  return { claimed, job };
}

export async function heartbeatPublishWorker(jobFile, { ownerId, pid, now = Date.now() }) {
  let accepted = false;
  await mutatePublishJob(jobFile, (current) => {
    if (current.worker?.ownerId !== ownerId) return current;
    accepted = true;
    return {
      ...current,
      worker: {
        ...current.worker,
        pid: Number.isSafeInteger(pid) && pid > 0 ? pid : current.worker.pid,
        heartbeatAt: new Date(now).toISOString(),
      },
      updatedAt: new Date(now).toISOString(),
    };
  });
  return accepted;
}

export async function releasePublishWorker(jobFile, { ownerId, now = Date.now() }) {
  let released = false;
  await mutatePublishJob(jobFile, (current) => {
    if (current.worker?.ownerId !== ownerId) return current;
    const withoutWorker = { ...current };
    delete withoutWorker.worker;
    released = true;
    return { ...withoutWorker, updatedAt: new Date(now).toISOString() };
  });
  return released;
}

export async function reconcileOrphanedPublishJob(jobFile, {
  now = Date.now(),
  orphanAfterMs = PUBLISH_WORKER_ORPHAN_MS,
  isProcessAlive = (pid) => {
    if (!Number.isSafeInteger(pid) || pid <= 0) return false;
    try { process.kill(pid, 0); return true; } catch { return false; }
  },
} = {}) {
  return mutatePublishJob(jobFile, (current) => {
    if (!["queued", "running"].includes(current.status) || !current.worker) return current;
    const heartbeatAt = leaseTimestamp(current.worker);
    if (Number.isFinite(heartbeatAt) && now - heartbeatAt <= orphanAfterMs) return current;
    const workerWasAlive = isProcessAlive(current.worker.pid);
    const withoutWorker = { ...current };
    delete withoutWorker.worker;
    return {
      ...withoutWorker,
      status: "failed",
      errorTitle: "Локальный процесс публикации остановился",
      error: workerWasAlive
        ? "Процесс перестал подтверждать работу. Публикацию можно безопасно продолжить после проверки статуса VPS."
        : "Процесс больше не работает. Публикацию можно безопасно продолжить с сохранённого этапа.",
      failedOperation: "worker.heartbeat",
      failureCode: "ORPHANED_WORKER",
      retryable: true,
      updatedAt: new Date(now).toISOString(),
    };
  });
}
