import { selectManagedRepositoryTarget } from "./launcher-policy.mjs";

export async function synchronizePreviewRepositoryCheckout({
  repoRoot,
  previewRoot,
  targetSha,
  execImpl,
}) {
  if (!/^[0-9a-f]{40}$/i.test(targetSha ?? "")) throw new Error("Preview target must be a full Git SHA.");
  await execImpl("/usr/bin/git", ["cat-file", "-e", `${targetSha}^{commit}`], { cwd: repoRoot });
  try {
    await execImpl("/usr/bin/git", ["-C", previewRoot, "rev-parse", "--git-dir"]);
  } catch {
    await execImpl("/usr/bin/git", ["worktree", "add", "--detach", previewRoot, targetSha], { cwd: repoRoot });
  }
  const status = (await execImpl("/usr/bin/git", ["status", "--porcelain", "--untracked-files=no"], { cwd: previewRoot })).stdout.trim();
  if (status) throw new Error("Preview-копия содержит изменённые tracked-файлы. Автоматическая синхронизация остановлена.");
  await execImpl("/usr/bin/git", ["switch", "--detach", targetSha], { cwd: previewRoot });
  return { targetSha: targetSha.toLowerCase(), previewRoot };
}

export async function synchronizeManagedRepositoryCheckout({
  repoRoot,
  publishMode,
  hasLiveBaseline = false,
  publishedSha,
  execImpl,
}) {
  await execImpl("/usr/bin/git", ["fetch", "origin", "main"], { cwd: repoRoot });
  const remoteMainSha = (await execImpl("/usr/bin/git", ["rev-parse", "origin/main"], { cwd: repoRoot })).stdout.trim();
  const { targetSha, checkout } = selectManagedRepositoryTarget({ publishMode, hasLiveBaseline, publishedSha, remoteMainSha });
  await execImpl("/usr/bin/git", ["cat-file", "-e", `${targetSha}^{commit}`], { cwd: repoRoot });
  if (checkout === "detached") {
    await execImpl("/usr/bin/git", ["switch", "--detach", targetSha], { cwd: repoRoot });
  } else {
    await execImpl("/usr/bin/git", ["switch", "main"], { cwd: repoRoot });
    await execImpl("/usr/bin/git", ["merge", "--ff-only", "origin/main"], { cwd: repoRoot });
  }
  return { targetSha, remoteMainSha, checkout };
}
