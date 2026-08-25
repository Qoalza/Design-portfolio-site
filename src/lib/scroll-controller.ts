export type ScrollControllerTarget = number | HTMLElement;

export type ScrollControllerOptions = {
  offset?: number;
  immediate?: boolean;
  onComplete?: () => void;
};

export type ScrollController = {
  scrollTo: (target: ScrollControllerTarget, options?: ScrollControllerOptions) => void;
  cancel: () => void;
  stop: () => void;
  start: () => void;
};

const scrollControllers = new Map<string, ScrollController>();

export function registerScrollController(id: string, controller: ScrollController): () => void {
  if (scrollControllers.has(id)) {
    throw new Error(`Scroll controller "${id}" is already registered`);
  }
  scrollControllers.set(id, controller);
  return () => { scrollControllers.delete(id); };
}

export function getPrimaryScrollController(): ScrollController | null {
  return scrollControllers.get("root") ?? null;
}

export function stopScrollControllers(): void {
  scrollControllers.forEach((controller) => controller.stop());
}

export function startScrollControllers(): void {
  scrollControllers.forEach((controller) => controller.start());
}
