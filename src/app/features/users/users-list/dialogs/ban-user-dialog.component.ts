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

export interface BanUserDialogData {
  user: AppUser;
}

@Component({
  selector: 'app-ban-user-dialog',
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
        <div class="p-4 bg-gray-50 rounded-lg">
          <div class="flex items-center gap-3">
            <app-avatar
              [image]="data.user.avatar_url"
              [label]="data.user.username"
              shape="circle"
              size="large"
            ></app-avatar>
            <div>
              <div class="font-semibold text-gray-900">{{ data.user.username }}</div>
              <div class="text-sm text-gray-500">{{ data.user.email }}</div>
            </div>
          </div>
        </div>

        <!-- Warning Message -->
        <div class="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <span class="material-symbols-outlined text-red-600 text-xl mt-1">warning</span>
          <div class="text-sm text-red-800">
            This user will be immediately banned from accessing the platform. This action can be reversed later.
          </div>
        </div>

        <!-- Ban Reason -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Reason for Ban</mat-label>
          <textarea
            matInput
            [(ngModel)]="banReason"
            rows="4"
            placeholder="Enter the reason for banning this user (minimum 10 characters)..."
          ></textarea>
          <mat-hint>This reason will be stored in the audit log.</mat-hint>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [disabled]="isBanning()" (click)="onCancel()">Cancel</button>
      <button
        mat-raised-button
        color="warn"
        [disabled]="!banReason.trim() || banReason.trim().length < 10 || isBanning()"
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
export class BanUserDialogComponent {
  banReason = '';
  isBanning = signal(false);

  constructor(
    public dialogRef: MatDialogRef<BanUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BanUserDialogData,
    private usersService: UsersService,
    private notificationService: NotificationService
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onBan(): Promise<void> {
    if (!this.banReason.trim() || this.banReason.trim().length < 10) {
      this.notificationService.warn('Warning', 'Ban reason is required (minimum 10 characters)');
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
