export type ScrollFrameSubscriber = {
  id: string;
  priority: number;
  continuous?: boolean;
  update: (timestamp: number) => void;
};

type RequestFrame = (callback: FrameRequestCallback) => number;
type CancelFrame = (id: number) => void;

export class ScrollFrameCoordinator {
  private readonly subscribers = new Map<string, ScrollFrameSubscriber>();
  private readonly invalidated = new Set<string>();
  private frameId: number | null = null;
  private readonly requestFrame: RequestFrame;
  private readonly cancelFrame: CancelFrame;

  constructor(
    requestFrame: RequestFrame = (callback) => window.requestAnimationFrame(callback),
    cancelFrame: CancelFrame = (id) => window.cancelAnimationFrame(id),
  ) {
    this.requestFrame = requestFrame;
    this.cancelFrame = cancelFrame;
  }

  register(subscriber: ScrollFrameSubscriber): () => void {
    if (this.subscribers.has(subscriber.id)) {
      throw new Error(`Scroll frame subscriber "${subscriber.id}" is already registered`);
    }

    this.subscribers.set(subscriber.id, subscriber);
    if (subscriber.continuous) this.ensureFrame();

    return () => {
      this.subscribers.delete(subscriber.id);
      this.invalidated.delete(subscriber.id);
      if (!this.hasPendingWork() && this.frameId !== null) {
        this.cancelFrame(this.frameId);
        this.frameId = null;
      }
    };
  }

  invalidate(id: string): void {
    if (!this.subscribers.has(id)) return;
    this.invalidated.add(id);
    this.ensureFrame();
  }

  private hasPendingWork(): boolean {
    return this.invalidated.size > 0
      || [...this.subscribers.values()].some((subscriber) => subscriber.continuous);
  }

  private ensureFrame(): void {
    if (this.frameId !== null || !this.hasPendingWork()) return;
    this.frameId = this.requestFrame(this.tick);
  }

  private readonly tick: FrameRequestCallback = (timestamp) => {
    this.frameId = null;
    const orderedSubscribers = [...this.subscribers.values()]
      .sort((left, right) => left.priority - right.priority);

    orderedSubscribers.forEach((subscriber) => {
      if (!subscriber.continuous && !this.invalidated.has(subscriber.id)) return;
      this.invalidated.delete(subscriber.id);
      subscriber.update(timestamp);
    });

    this.ensureFrame();
  };
}

const sharedScrollFrameCoordinator = new ScrollFrameCoordinator();

export function registerScrollFrameSubscriber(subscriber: ScrollFrameSubscriber): () => void {
  return sharedScrollFrameCoordinator.register(subscriber);
}

export function invalidateScrollFrameSubscriber(id: string): void {
  sharedScrollFrameCoordinator.invalidate(id);
}
