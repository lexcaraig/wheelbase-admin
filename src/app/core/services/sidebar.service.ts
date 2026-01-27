import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private readonly STORAGE_KEY = 'wheelbase_sidebar_collapsed';

  // Signal for reactive state
  isCollapsed = signal(this.loadInitialState());

  private loadInitialState(): boolean {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored === 'true';
  }

  toggle(): void {
    const newState = !this.isCollapsed();
    this.isCollapsed.set(newState);
    localStorage.setItem(this.STORAGE_KEY, String(newState));
  }

  expand(): void {
    this.isCollapsed.set(false);
    localStorage.setItem(this.STORAGE_KEY, 'false');
  }

  collapse(): void {
    this.isCollapsed.set(true);
    localStorage.setItem(this.STORAGE_KEY, 'true');
  }
}
