export type GalleryInputOwnership = "undecided" | "horizontal" | "vertical";

export type GalleryInputDecision = {
  ownership: GalleryInputOwnership;
  blockRoot: boolean;
  galleryStep: -1 | 1 | null;
  rootDeltaY: number | null;
  stoppedRoot: boolean;
};

type WheelLike = {
  deltaX: number;
  deltaY: number;
  deltaMode: number;
  timeStamp: number;
};

type GalleryInputArbiterOptions = {
  idleMs?: number;
  threshold?: number;
  stopRootAtActual?: () => void;
};

type CachedDecision = {
  decision: GalleryInputDecision;
  rootConsumed: boolean;
};

const LINE_HEIGHT = 100 / 6;

function normalizeDelta(value: number, mode: number, viewportSize: number): number {
  if (mode === 1) return value * LINE_HEIGHT;
  if (mode === 2) return value * viewportSize;
  return value;
}

export class GalleryInputArbiter {
  private readonly idleMs: number;
  private readonly threshold: number;
  private stopRootAtActual: (() => void) | undefined;
  private ownership: GalleryInputOwnership = "undecided";
  private owner: string | null = null;
  private accumulatedX = 0;
  private accumulatedY = 0;
  private lastTimestamp = Number.NEGATIVE_INFINITY;
  private stepConsumed = false;
  private readonly decisions = new WeakMap<object, CachedDecision>();

  constructor({ idleMs = 160, threshold = 16, stopRootAtActual }: GalleryInputArbiterOptions = {}) {
    this.idleMs = idleMs;
    this.threshold = threshold;
    this.stopRootAtActual = stopRootAtActual;
  }

  setStopRootAtActual(callback: (() => void) | undefined): void {
    this.stopRootAtActual = callback;
  }

  classify(event: WheelLike, owner: string): GalleryInputDecision {
    const cached = this.decisions.get(event as object);
    if (cached) return cached.decision;

    if (this.owner !== owner || event.timeStamp - this.lastTimestamp > this.idleMs) {
      this.resetSeries();
      this.owner = owner;
    }
    this.lastTimestamp = event.timeStamp;

    const width = typeof window === "undefined" ? 1 : window.innerWidth;
    const height = typeof window === "undefined" ? 1 : window.innerHeight;
    const deltaX = normalizeDelta(event.deltaX, event.deltaMode, width);
    const deltaY = normalizeDelta(event.deltaY, event.deltaMode, height);
    let decision: GalleryInputDecision;

    if (this.ownership === "horizontal") {
      decision = this.makeDecision("horizontal", true, null, null, false);
    } else if (this.ownership === "vertical") {
      decision = this.makeDecision("vertical", false, null, deltaY, false);
    } else {
      this.accumulatedX += deltaX;
      this.accumulatedY += deltaY;
      const horizontalMagnitude = Math.abs(this.accumulatedX);
      const verticalMagnitude = Math.abs(this.accumulatedY);

      if (horizontalMagnitude >= this.threshold && horizontalMagnitude > verticalMagnitude) {
        this.ownership = "horizontal";
        this.stopRootAtActual?.();
        const step = this.stepConsumed ? null : (this.accumulatedX > 0 ? 1 : -1);
        this.stepConsumed = true;
        decision = this.makeDecision("horizontal", true, step, null, Boolean(this.stopRootAtActual));
      } else if (verticalMagnitude >= this.threshold && verticalMagnitude >= horizontalMagnitude) {
        this.ownership = "vertical";
        decision = this.makeDecision("vertical", false, null, this.accumulatedY, false);
        this.accumulatedX = 0;
        this.accumulatedY = 0;
      } else {
        decision = this.makeDecision("undecided", true, null, null, false);
      }
    }

    this.decisions.set(event as object, { decision, rootConsumed: false });
    return decision;
  }

  takeRootDelta(event: WheelLike | null): number | null {
    if (!event) return null;
    const cached = this.decisions.get(event as object);
    if (!cached || cached.rootConsumed || cached.decision.rootDeltaY === null) return null;
    cached.rootConsumed = true;
    return cached.decision.rootDeltaY;
  }

  reset(): void {
    this.resetSeries();
    this.owner = null;
    this.lastTimestamp = Number.NEGATIVE_INFINITY;
  }

  private resetSeries(): void {
    this.ownership = "undecided";
    this.accumulatedX = 0;
    this.accumulatedY = 0;
    this.stepConsumed = false;
  }

  private makeDecision(
    ownership: GalleryInputOwnership,
    blockRoot: boolean,
    galleryStep: -1 | 1 | null,
    rootDeltaY: number | null,
    stoppedRoot: boolean,
  ): GalleryInputDecision {
    return { ownership, blockRoot, galleryStep, rootDeltaY, stoppedRoot };
  }
}

export const galleryInputArbiter = new GalleryInputArbiter();
