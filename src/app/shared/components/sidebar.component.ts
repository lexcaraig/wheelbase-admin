import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SidebarService } from '../../core/services/sidebar.service';

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
    <aside
      class="bg-base-200 min-h-screen flex flex-col border-r border-base-300 transition-all duration-300"
      [class.w-64]="!sidebarService.isCollapsed()"
      [class.w-20]="sidebarService.isCollapsed()"
    >
      <!-- Logo -->
      <div class="p-4 border-b border-base-300 flex items-center justify-center"
           [class.px-6]="!sidebarService.isCollapsed()">
        @if (!sidebarService.isCollapsed()) {
          <div>
            <h1 class="text-2xl font-bold text-primary">Wheelbase</h1>
            <p class="text-sm text-base-content/60 mt-1">Admin Panel</p>
          </div>
        } @else {
          <div class="flex items-center justify-center">
            <span class="text-2xl font-bold text-primary">W</span>
          </div>
        }
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-2 overflow-y-auto" [class.p-4]="!sidebarService.isCollapsed()">
        <ul class="menu menu-sm bg-base-200 rounded-box gap-1">
          @for (item of menuItems(); track item.route) {
            @if (!item.permission || authService.hasPermission(item.permission)) {
              <li>
                <a
                  [routerLink]="item.route"
                  routerLinkActive="active bg-primary text-primary-content"
                  [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
                  class="flex items-center text-base-content hover:bg-base-300"
                  [class.gap-3]="!sidebarService.isCollapsed()"
                  [class.justify-center]="sidebarService.isCollapsed()"
                  [class.tooltip]="sidebarService.isCollapsed()"
                  [class.tooltip-right]="sidebarService.isCollapsed()"
                  [attr.data-tip]="sidebarService.isCollapsed() ? item.label : null"
                >
                  <span class="material-symbols-outlined text-xl">{{ item.icon }}</span>
                  @if (!sidebarService.isCollapsed()) {
                    <span>{{ item.label }}</span>
                  }
                </a>
              </li>
            }
          }
        </ul>
      </nav>

      <!-- User Info -->
      <div class="p-4 border-t border-base-300 bg-base-100">
        @if (authService.currentUser$ | async; as user) {
          @if (!sidebarService.isCollapsed()) {
            <div class="flex items-center gap-3">
              <div class="avatar placeholder">
                <div class="bg-primary text-primary-content rounded-full w-10 h-10 flex items-center justify-center">
                  <span class="text-lg font-bold">{{ user.email ? user.email.charAt(0).toUpperCase() : '?' }}</span>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-base-content truncate">{{ user.email }}</p>
                <p class="text-xs text-base-content/60 capitalize">{{ user.role.replace('_', ' ') }}</p>
              </div>
            </div>
          } @else {
            <div class="flex justify-center tooltip tooltip-right" [attr.data-tip]="user.email">
              <div class="avatar placeholder">
                <div class="bg-primary text-primary-content rounded-full w-10 h-10 flex items-center justify-center">
                  <span class="text-lg font-bold">{{ user.email ? user.email.charAt(0).toUpperCase() : '?' }}</span>
                </div>
              </div>
            </div>
          }
        }
      </div>
    </aside>
  `
})
export class SidebarComponent {
  authService = inject(AuthService);
  sidebarService = inject(SidebarService);

  menuItems = signal<MenuItem[]>([
    { label: 'Dashboard', icon: 'home', route: '/dashboard' },
    { label: 'Growth Monitoring', icon: 'show_chart', route: '/monitoring', permission: 'analytics.view' },
    { label: 'Users', icon: 'group', route: '/users', permission: 'users.view' },
    { label: 'Subscriptions', icon: 'card_membership', route: '/subscriptions', permission: 'users.view' },
    { label: 'Deletion Feedback', icon: 'feedback', route: '/deletion-feedback', permission: 'users.view' },
    { label: 'Deleted Users', icon: 'delete_forever', route: '/deleted-users-log', permission: 'users.view' },
    { label: 'Content Management', icon: 'edit_document', route: '/content', permission: 'content.moderate' },
    { label: 'Promotions', icon: 'campaign', route: '/promotions', permission: 'content.moderate' },
    { label: 'Business Verifications', icon: 'verified', route: '/verifications', permission: 'content.moderate' },
    { label: 'Moderation', icon: 'flag', route: '/moderation', permission: 'content.moderate' },
    { label: 'Admin Users', icon: 'shield', route: '/admin-users', permission: 'users.view' },
    { label: 'Audit Logs', icon: 'list', route: '/audit-logs', permission: 'users.view' },
    { label: 'System Settings', icon: 'settings', route: '/settings', permission: 'users.view' },
    { label: 'Announcements', icon: 'notifications', route: '/announcements', permission: 'users.view' },
  ]);
}
