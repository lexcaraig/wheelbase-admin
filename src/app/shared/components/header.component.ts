import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { filter } from 'rxjs/operators';

// Route to title mapping
const ROUTE_TITLES: Record<string, string> = {
  'dashboard': 'Dashboard',
  'users': 'User Management',
  'moderation': 'Content Moderation',
  'moderation/reports': 'Report Review',
  'analytics': 'Analytics',
  'verification': 'Business Verification',
  'business-verifications': 'Business Verification',
  'content': 'Content Management',
  'content/new': 'Create Content',
  'content/edit': 'Edit Content',
  'admin-users': 'Admin Users',
  'audit-logs': 'Audit Logs',
  'system-settings': 'System Settings',
  'settings': 'Settings',
};

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `
    <header class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-gray-800">{{ pageTitle() }}</h2>
      </div>

      <div class="flex items-center gap-4">
        <button mat-stroked-button (click)="logout()">
          <span class="material-symbols-outlined mr-2">logout</span>
          Logout
        </button>
      </div>
    </header>
  `
})
export class HeaderComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  pageTitle = signal('Admin Panel');

  constructor() {
    // Update title on initial load
    this.updateTitle(this.router.url);

    // Update title on navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.updateTitle((event as NavigationEnd).urlAfterRedirects);
    });
  }

  private updateTitle(url: string): void {
    // Remove leading slash and query params
    const path = url.split('?')[0].replace(/^\//, '');

    // Check for exact matches first
    if (ROUTE_TITLES[path]) {
      this.pageTitle.set(ROUTE_TITLES[path]);
      return;
    }

    // Check for partial matches (e.g., 'users/123' should match 'users')
    for (const [route, title] of Object.entries(ROUTE_TITLES)) {
      if (path.startsWith(route)) {
        // Special handling for detail pages
        if (path.match(/users\/[^/]+$/)) {
          this.pageTitle.set('User Details');
          return;
        }
        if (path.match(/content\/view\/[^/]+$/)) {
          this.pageTitle.set('View Content');
          return;
        }
        if (path.match(/content\/edit\/[^/]+$/)) {
          this.pageTitle.set('Edit Content');
          return;
        }
        this.pageTitle.set(title);
        return;
      }
    }

    // Default fallback
    this.pageTitle.set('Admin Panel');
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
    } catch {
      // Silent fail - auth service handles redirect
    }
  }
}
