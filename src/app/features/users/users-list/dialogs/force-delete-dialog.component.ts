import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AppUser } from '../../../../core/models/user.model';
import { UsersService } from '../../../../core/services/users.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';

export interface ForceDeleteDialogData {
  user: AppUser;
}

@Component({
  selector: 'app-force-delete-dialog',
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
    <h2 mat-dialog-title>Permanently Delete User</h2>
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
            </div>
          </div>
        </div>

        <!-- Warning Message -->
        <div class="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <span class="material-symbols-outlined text-red-600 text-xl mt-1">warning</span>
          <div class="text-sm text-red-800">
            <p class="font-semibold mb-2">⚠️ THIS ACTION IS IRREVERSIBLE</p>
            <p class="mb-2">Permanently deleting this user will remove:</p>
            <ul class="list-disc list-inside space-y-1 text-red-700">
              <li>All rides and GPS data</li>
              <li>All posts, comments, and likes</li>
              <li>All motorcycles and maintenance records</li>
              <li>All marketplace listings</li>
              <li>All group memberships</li>
              <li>All friendships and follows</li>
              <li>All emergency contacts and SOS alerts</li>
              <li>All badges and achievements</li>
              <li>Authentication account</li>
            </ul>
          </div>
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
        (click)="onForceDelete()"
      >
        @if (isDeleting()) {
          <span class="material-symbols-outlined animate-spin mr-2">progress_activity</span>
        }
        Permanently Delete
      </button>
    </mat-dialog-actions>
  `
})
export class ForceDeleteDialogComponent {
  confirmText = '';
  isDeleting = signal(false);

  constructor(
    public dialogRef: MatDialogRef<ForceDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ForceDeleteDialogData,
    private usersService: UsersService,
    private notificationService: NotificationService
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onForceDelete(): Promise<void> {
    if (this.confirmText !== 'PERMANENTLY DELETE') {
      this.notificationService.warn('Warning', 'Please type "PERMANENTLY DELETE" to confirm');
      return;
    }

    try {
      this.isDeleting.set(true);
      await this.usersService.hardDeleteUser(this.data.user.id);
      this.notificationService.success('Success', `User ${this.data.user.username} has been permanently deleted`);
      this.dialogRef.close(true);
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to delete user');
    } finally {
      this.isDeleting.set(false);
    }
  }
}
