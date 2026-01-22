import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
}

export interface EditAdminDialogData {
  admin: AdminUser;
}

@Component({
  selector: 'app-edit-admin-dialog',
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
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Edit Admin User</h2>
    <mat-dialog-content class="!pt-4">
      <div class="space-y-4">
        <!-- Email (readonly) -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Email</mat-label>
          <input matInput type="email" [value]="data.admin.email" readonly disabled>
        </mat-form-field>

        <!-- Role -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Role</mat-label>
          <mat-select [(ngModel)]="role">
            @for (option of roleOptions; track option.value) {
              <mat-option [value]="option.value">{{ option.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Status -->
        <mat-checkbox [(ngModel)]="isActive" color="primary">
          Active
        </mat-checkbox>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [disabled]="isProcessing()" (click)="onCancel()">Cancel</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="isProcessing()"
        (click)="onUpdate()"
      >
        @if (isProcessing()) {
          <span class="material-symbols-outlined animate-spin mr-2">progress_activity</span>
        }
        Update
      </button>
    </mat-dialog-actions>
  `
})
export class EditAdminDialogComponent {
  role: string;
  isActive: boolean;
  isProcessing = signal(false);

  roleOptions = [
    { label: 'Super Admin', value: 'super_admin' },
    { label: 'Admin', value: 'admin' },
    { label: 'Moderator', value: 'moderator' },
    { label: 'Support', value: 'support' }
  ];

  constructor(
    public dialogRef: MatDialogRef<EditAdminDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditAdminDialogData,
    private supabase: SupabaseService,
    private notificationService: NotificationService
  ) {
    this.role = data.admin.role;
    this.isActive = data.admin.is_active;
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onUpdate(): Promise<void> {
    try {
      this.isProcessing.set(true);

      const { data, error } = await this.supabase.client.functions.invoke('admin-update-admin-user', {
        body: {
          admin_user_id: this.data.admin.id,
          role: this.role,
          is_active: this.isActive
        }
      });

      if (error) throw error;

      if (data.success) {
        this.notificationService.success('Success', 'Admin user updated successfully');
        this.dialogRef.close(true);
      }
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to update admin user');
      console.error('Update admin error:', error);
    } finally {
      this.isProcessing.set(false);
    }
  }
}
