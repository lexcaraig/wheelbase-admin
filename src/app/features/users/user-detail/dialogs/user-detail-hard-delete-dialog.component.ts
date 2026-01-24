import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UserDetail } from '../../../../core/models/user.model';
import { UsersService } from '../../../../core/services/users.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';

export interface UserDetailHardDeleteDialogData {
  user: UserDetail;
}

@Component({
  selector: 'app-user-detail-hard-delete-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    AvatarComponent
  ],
  template: `
    <h2 mat-dialog-title class="text-red-600">Permanently Delete User</h2>
    <mat-dialog-content>
      <div class="space-y-4">
        <!-- User Info -->
        <div class="p-4 bg-base-100 rounded-lg">
          <div class="flex items-center gap-3">
            <app-avatar
              [image]="data.user.avatar_url"
              [label]="data.user.username"
              shape="circle"
              size="large"
            ></app-avatar>
            <div>
              <div class="font-semibold text-base-content">{{ data.user.username }}</div>
              <div class="text-sm text-base-content/60">{{ data.user.email }}</div>
              <div class="text-xs text-base-content/50 mt-1">User ID: {{ data.user.id }}</div>
            </div>
          </div>
        </div>

        <!-- Danger Warning -->
        <div class="flex items-start gap-3 p-4 bg-red-50 border border-red-300 rounded-lg">
          <span class="material-symbols-outlined text-red-600 text-2xl">dangerous</span>
          <div class="text-sm text-red-800">
            <p class="font-bold mb-2">DANGER: This action CANNOT be undone!</p>
            <p>You are about to <strong>PERMANENTLY DELETE</strong> all data for this user.</p>
          </div>
        </div>

        <!-- What will be deleted -->
        <div class="p-4 bg-amber-50 border border-amber-300 rounded-lg">
          <p class="font-semibold text-amber-900 mb-2">What will be deleted:</p>
          <ul class="text-amber-800 text-sm space-y-1 ml-4 list-disc">
            <li>All rides and GPS data</li>
            <li>All posts, comments, and likes</li>
            <li>All motorcycles and maintenance records</li>
            <li>All marketplace listings</li>
            <li>All group memberships and created groups</li>
            <li>All friendships and follows</li>
            <li>All emergency contacts and SOS alerts</li>
            <li>All badges and achievements</li>
            <li>All payment transactions</li>
            <li>Authentication account</li>
            <li><strong>EVERYTHING associated with this user</strong></li>
          </ul>
        </div>

        <!-- Confirmation Input -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Type PERMANENTLY DELETE to confirm</mat-label>
          <input
            matInput
            [(ngModel)]="confirmText"
            placeholder="Type PERMANENTLY DELETE"
            class="font-mono"
          />
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [disabled]="isDeleting()" (click)="onCancel()">Cancel</button>
      <button
        mat-raised-button
        color="warn"
        [disabled]="confirmText !== 'PERMANENTLY DELETE' || isDeleting()"
        (click)="onDelete()"
      >
        @if (isDeleting()) {
          <span class="material-symbols-outlined animate-spin mr-2">progress_activity</span>
        }
        Permanently Delete
      </button>
    </mat-dialog-actions>
  `
})
export class UserDetailHardDeleteDialogComponent {
  confirmText = '';
  isDeleting = signal(false);

  constructor(
    public dialogRef: MatDialogRef<UserDetailHardDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserDetailHardDeleteDialogData,
    private usersService: UsersService,
    private notificationService: NotificationService
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onDelete(): Promise<void> {
    if (this.confirmText !== 'PERMANENTLY DELETE') {
      this.notificationService.warn('Warning', 'Please type "PERMANENTLY DELETE" exactly to confirm');
      return;
    }

    try {
      this.isDeleting.set(true);
      await this.usersService.hardDeleteUser(this.data.user.id);
      this.notificationService.success('Success', 'User permanently deleted');
      this.dialogRef.close(true);
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to delete user');
    } finally {
      this.isDeleting.set(false);
    }
  }
}
