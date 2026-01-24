import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-create-admin-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule
  ],
  template: `
    <div class="bg-base-100 rounded-lg w-full max-w-md">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-base-300">
        <h3 class="text-lg font-semibold text-base-content">Create Admin User</h3>
        <button
          class="btn btn-ghost btn-sm btn-circle"
          [disabled]="isProcessing()"
          (click)="onCancel()"
        >
          <span class="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 space-y-4">
        <!-- Email -->
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text font-medium">Email</span>
          </label>
          <input
            type="email"
            [(ngModel)]="email"
            placeholder="admin@example.com"
            class="input input-bordered w-full"
            [class.input-error]="email && !isValidEmail()"
            required
          />
          @if (email && !isValidEmail()) {
            <label class="label">
              <span class="label-text-alt text-error">Please enter a valid email address</span>
            </label>
          }
        </div>

        <!-- Role -->
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text font-medium">Role</span>
          </label>
          <select
            [(ngModel)]="role"
            class="select select-bordered w-full"
            required
          >
            @for (option of roleOptions; track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
            }
          </select>
          <label class="label">
            <span class="label-text-alt text-base-content/60">
              Super Admin role can only be assigned by editing database directly.
            </span>
          </label>
        </div>

        <!-- Info Alert -->
        <div class="alert alert-info">
          <span class="material-symbols-outlined">info</span>
          <span>A temporary password will be generated. The admin user will need to change it on first login.</span>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-end gap-2 p-4 border-t border-base-300">
        <button
          class="btn btn-ghost"
          [disabled]="isProcessing()"
          (click)="onCancel()"
        >
          Cancel
        </button>
        <button
          class="btn btn-primary"
          [disabled]="!email || !role || !isValidEmail() || isProcessing()"
          (click)="onCreate()"
        >
          @if (isProcessing()) {
            <span class="loading loading-spinner loading-sm"></span>
          }
          Create Admin
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CreateAdminDialogComponent {
  email = '';
  role = 'admin';
  isProcessing = signal(false);

  roleOptions = [
    { label: 'Admin', value: 'admin' },
    { label: 'Moderator', value: 'moderator' },
    { label: 'Support', value: 'support' }
  ];

  constructor(
    public dialogRef: MatDialogRef<CreateAdminDialogComponent>,
    private supabase: SupabaseService,
    private notificationService: NotificationService
  ) {}

  isValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onCreate(): Promise<void> {
    if (!this.email || !this.role) {
      this.notificationService.warn('Validation Error', 'Email and role are required');
      return;
    }

    if (!this.isValidEmail()) {
      this.notificationService.warn('Validation Error', 'Please enter a valid email address');
      return;
    }

    try {
      this.isProcessing.set(true);

      const { data, error } = await this.supabase.client.functions.invoke('admin-create-admin-user', {
        body: {
          email: this.email,
          role: this.role
        }
      });

      if (error) throw error;

      if (data.success) {
        this.notificationService.success(
          'Success',
          `Admin user created. Temporary password: ${data.data.temporary_password}`
        );
        this.dialogRef.close(true);
      }
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to create admin user');
      console.error('Create admin error:', error);
    } finally {
      this.isProcessing.set(false);
    }
  }
}
