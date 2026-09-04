const PREVIEW_TARGET = "des-art-preview";

export class PreviewWindowController {
  #open;
  #target = null;
  #latestAttempt = 0;

  constructor({ open }) {
    this.#open = open;
  }

  #discardTarget() {
    if (this.#target && !this.#target.closed) {
      try { this.#target.close(); } catch { /* A browser may refuse closing a user-managed window. */ }
    }
    this.#target = null;
  }

  begin() {
    const id = ++this.#latestAttempt;
    if (this.#target && !this.#target.closed) {
      try {
        const target = this.#open("about:blank", PREVIEW_TARGET);
        if (!target) {
          this.#discardTarget();
          return { id, created: false, blocked: true };
        }
        this.#target = target;
        try { target.focus(); } catch { /* Navigating the named target remains sufficient. */ }
      } catch {
        this.#discardTarget();
        return { id, created: false, blocked: true };
      }
      return { id, created: false, blocked: false };
    }
    let target = null;
    try { target = this.#open("about:blank", PREVIEW_TARGET); } catch { /* Treat browser popup errors as blocked. */ }
    if (!target) return { id, created: false, blocked: true };
    this.#target = target;
    return { id, created: true, blocked: false };
  }

  navigate(attempt, url) {
    if (attempt.id !== this.#latestAttempt) return "stale";
    if (!this.#target || this.#target.closed) {
      this.#target = null;
      return "closed";
    }
    try {
      const target = this.#open(url, PREVIEW_TARGET);
      if (!target) return "blocked";
      this.#target = target;
      try { target.focus(); } catch { /* Navigating the named target remains sufficient. */ }
      return "navigated";
    } catch {
      return "closed";
    }
  }

  fail(attempt) {
    if (attempt.id !== this.#latestAttempt || !attempt.created) return;
    this.#discardTarget();
  }
}
