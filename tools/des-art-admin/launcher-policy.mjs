const FULL_SHA = /^[a-f0-9]{40}$/;

function fullSha(value, label) {
  if (typeof value !== "string" || !FULL_SHA.test(value)) {
    throw new Error(`${label} must be a full Git SHA.`);
  }
  return value;
}

export function selectManagedRepositoryTarget({ publishMode, hasLiveBaseline, publishedSha, remoteMainSha }) {
  const remote = fullSha(remoteMainSha, "origin/main");
  if (publishMode !== "live") return { targetSha: remote, checkout: "main" };

  const published = fullSha(publishedSha, "Published Portfolio SHA");
  if (hasLiveBaseline) return { targetSha: published, checkout: "detached" };
  if (published !== remote) {
    throw new Error("SHA опубликованного Portfolio не совпадает с origin/main. Первый перевод Admin в live остановлен.");
  }
  return { targetSha: remote, checkout: "main" };
}
