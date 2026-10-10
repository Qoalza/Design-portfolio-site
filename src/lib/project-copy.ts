// Browser-safe compatibility adapter. No persistence or asset access.
function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
export function independentProjectCopy<T>(document: T): T {
  if (!record(document) || !record(document.redesign) || !record(document.redesign.page)) return document;
  const page = document.redesign.page;
  // Unknown versions remain intact so the contract rejects them instead of downgrading.
  if (page.copyVersion !== undefined || !Array.isArray(page.summary)) return document;
  if (!["corvo-redesign-v1", "sarafan-redesign-v1"].includes(String(page.templateId))) return document;
  if (page.templateId === "corvo-redesign-v1" && typeof document.description !== "string") return document;
  const summary = page.templateId === "corvo-redesign-v1"
    ? [[{ type: "text", text: document.description }], ...page.summary]
    : page.summary;
  return { ...document, redesign: { ...document.redesign, page: { ...page, copyVersion: 1, summary } } } as T;
}
