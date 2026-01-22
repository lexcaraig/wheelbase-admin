import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-create-admin-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Create Admin User</h2>
    <mat-dialog-content class="!pt-4">
      <div class="space-y-4">
        <!-- Email -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Email</mat-label>
          <input matInput type="email" [(ngModel)]="email" placeholder="admin@example.com" required>
        </mat-form-field>

        <!-- Role -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Role</mat-label>
          <mat-select [(ngModel)]="role" required>
            @for (option of roleOptions; track option.value) {
              <mat-option [value]="option.value">{{ option.label }}</mat-option>
            }
          </mat-select>
          <mat-hint>Super Admin role can only be assigned by editing database directly.</mat-hint>
        </mat-form-field>

        <!-- Info -->
        <div class="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span class="material-symbols-outlined text-blue-600 mt-0.5">info</span>
          <div class="text-sm text-blue-800">
            A temporary password will be generated. The admin user will need to change it on first login.
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [disabled]="isProcessing()" (click)="onCancel()">Cancel</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!email || !role || isProcessing()"
        (click)="onCreate()"
      >
        @if (isProcessing()) {
          <span class="material-symbols-outlined animate-spin mr-2">progress_activity</span>
        }
        Create Admin
      </button>
    </mat-dialog-actions>
  `
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

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onCreate(): Promise<void> {
    if (!this.email || !this.role) {
      this.notificationService.warn('Validation Error', 'Email and role are required');
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
