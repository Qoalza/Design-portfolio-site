import { selectManagedRepositoryTarget } from "./launcher-policy.mjs";

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
