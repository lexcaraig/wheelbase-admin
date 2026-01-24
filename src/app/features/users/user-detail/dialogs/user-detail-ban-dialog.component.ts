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

export interface UserDetailBanDialogData {
  user: UserDetail;
}

@Component({
  selector: 'app-user-detail-ban-dialog',
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
    <h2 mat-dialog-title>Ban User</h2>
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
        <div class="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <span class="material-symbols-outlined text-orange-600 text-xl mt-1">warning</span>
          <div class="text-sm text-orange-800">
            You are about to ban this user. This will prevent them from accessing the platform. This action can be reversed later.
          </div>
        </div>

        <!-- Ban Reason -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Reason for Ban</mat-label>
          <textarea
            matInput
            [(ngModel)]="banReason"
            rows="4"
            placeholder="Enter the reason for banning this user..."
          ></textarea>
          <mat-hint>This reason will be stored and visible in the user's profile.</mat-hint>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [disabled]="isBanning()" (click)="onCancel()">Cancel</button>
      <button
        mat-raised-button
        color="warn"
        [disabled]="!banReason.trim() || isBanning()"
        (click)="onBan()"
      >
        @if (isBanning()) {
          <span class="material-symbols-outlined animate-spin mr-2">progress_activity</span>
        }
        Ban User
      </button>
    </mat-dialog-actions>
  `
})
export class UserDetailBanDialogComponent {
  banReason = '';
  isBanning = signal(false);

  constructor(
    public dialogRef: MatDialogRef<UserDetailBanDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserDetailBanDialogData,
    private usersService: UsersService,
    private notificationService: NotificationService
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onBan(): Promise<void> {
    if (!this.banReason.trim()) {
      this.notificationService.warn('Warning', 'Ban reason is required');
      return;
    }

    try {
      this.isBanning.set(true);
      await this.usersService.banUser(this.data.user.id, this.banReason);
      this.notificationService.success('Success', 'User has been banned');
      this.dialogRef.close(true);
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to ban user');
    } finally {
      this.isBanning.set(false);
    }
  }
}
