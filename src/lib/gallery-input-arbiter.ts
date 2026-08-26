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
  private lockedDirection: -1 | 1 | null = null;
  private previousHorizontalMagnitude = 0;
  private horizontalTailSamples = 0;
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

    if (this.ownership === "horizontal" && this.isNewHorizontalGesture(deltaX)) {
      this.resetSeries();
    }

    if (this.ownership === "horizontal") {
      this.observeHorizontalDelta(deltaX);
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
        this.lockedDirection = step;
        this.previousHorizontalMagnitude = Math.abs(deltaX);
        this.horizontalTailSamples = 0;
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
    this.lockedDirection = null;
    this.previousHorizontalMagnitude = 0;
    this.horizontalTailSamples = 0;
  }

  private isNewHorizontalGesture(deltaX: number): boolean {
    const magnitude = Math.abs(deltaX);
    const direction = Math.sign(deltaX) as -1 | 0 | 1;
    const deliberateReverse = direction !== 0
      && this.lockedDirection !== null
      && direction !== this.lockedDirection
      && magnitude >= this.threshold / 2;
    const renewedBurst = this.horizontalTailSamples >= 2
      && magnitude >= this.threshold
      && magnitude >= this.previousHorizontalMagnitude * 1.5;

    return deliberateReverse || renewedBurst;
  }

  private observeHorizontalDelta(deltaX: number): void {
    const magnitude = Math.abs(deltaX);
    if (magnitude <= this.threshold / 2) this.horizontalTailSamples += 1;
    else if (this.horizontalTailSamples < 2) this.horizontalTailSamples = 0;
    this.previousHorizontalMagnitude = magnitude;
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
