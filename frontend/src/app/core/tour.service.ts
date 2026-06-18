import { Injectable, signal } from '@angular/core';

const SEEN_KEY = 'civicdesk.tour.seen';

/** First-visit "how to explore" guide. Dismissible and replayable; role-aware copy lives in the component. */
@Injectable({ providedIn: 'root' })
export class TourService {
  readonly open = signal<boolean>(false);

  /** Open automatically on the very first authenticated visit. */
  maybeAutoStart(): void {
    if (!this.hasSeen()) this.open.set(true);
  }

  start(): void { this.open.set(true); }

  dismiss(): void {
    this.open.set(false);
    try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
  }

  private hasSeen(): boolean {
    try { return localStorage.getItem(SEEN_KEY) === '1'; } catch { return false; }
  }
}
