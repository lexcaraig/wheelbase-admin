import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <header class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-gray-800">{{ currentPageTitle() }}</h2>
      </div>

      <div class="flex items-center gap-4">
        <p-button
          label="Logout"
          icon="pi pi-sign-out"
          severity="secondary"
          [outlined]="true"
          (onClick)="logout()"
        ></p-button>
      </div>
    </header>
  `
})
export class HeaderComponent {
  constructor(private authService: AuthService) {}

  currentPageTitle() {
    const path = window.location.pathname;
    if (path.includes('users')) return 'User Management';
    if (path.includes('moderation')) return 'Content Moderation';
    if (path.includes('dashboard')) return 'Dashboard';
    return 'Admin Panel';
  }

  async logout() {
    try {
      await this.authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
}
