import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  permission?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <!-- Logo -->
      <div class="p-6 border-b border-gray-800">
        <h1 class="text-2xl font-bold text-yellow-400">Wheelbase</h1>
        <p class="text-sm text-gray-400 mt-1">Admin Panel</p>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-4 space-y-2">
        @for (item of menuItems(); track item.route) {
          @if (!item.permission || authService.hasPermission(item.permission)) {
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-yellow-400 text-gray-900"
              [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
              class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <i [class]="item.icon"></i>
              <span>{{ item.label }}</span>
            </a>
          }
        }
      </nav>

      <!-- User Info -->
      <div class="p-4 border-t border-gray-800">
        @if (authService.currentUser$ | async; as user) {
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-gray-900 font-bold">
              {{ user.email ? user.email.charAt(0).toUpperCase() : '?' }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">{{ user.email }}</p>
              <p class="text-xs text-gray-400 capitalize">{{ user.role.replace('_', ' ') }}</p>
            </div>
          </div>
        }
      </div>
    </aside>
  `
})
export class SidebarComponent {
  menuItems = signal<MenuItem[]>([
    { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard' },
    { label: 'Advanced Analytics', icon: 'pi pi-chart-bar', route: '/analytics', permission: 'analytics.view' },
    { label: 'Users', icon: 'pi pi-users', route: '/users', permission: 'users.view' },
    { label: 'Content Management', icon: 'pi pi-file-edit', route: '/content', permission: 'content.moderate' },
    { label: 'Business Verifications', icon: 'pi pi-verified', route: '/verifications', permission: 'content.moderate' },
    { label: 'Moderation', icon: 'pi pi-flag', route: '/moderation', permission: 'content.moderate' },
    { label: 'Admin Users', icon: 'pi pi-shield', route: '/admin-users', permission: 'users.view' },
    { label: 'Audit Logs', icon: 'pi pi-list', route: '/audit-logs', permission: 'users.view' },
    { label: 'System Settings', icon: 'pi pi-cog', route: '/settings', permission: 'users.view' },
  ]);

  constructor(public authService: AuthService) {}
}
