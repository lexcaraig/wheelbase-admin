import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { AppUser } from '../../../../core/models/user.model';
import { UsersService } from '../../../../core/services/users.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';

export interface RestoreUserDialogData {
  user: AppUser;
  daysUntilDeletion: number;
}

@Component({
  selector: 'app-restore-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    AvatarComponent
  ],
  template: `
    <h2 mat-dialog-title>Restore User Account</h2>
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

        <!-- Info Message -->
        <div class="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <span class="material-symbols-outlined text-green-600 text-xl mt-1">info</span>
          <div class="text-sm text-green-800">
            <p class="font-semibold mb-1">Restore this user account?</p>
            <p>The user will be able to log in and access the platform again. All their data has been preserved.</p>
            @if (data.daysUntilDeletion > 0) {
              <p class="mt-2 text-green-700">
                <strong>Time remaining:</strong> {{ data.daysUntilDeletion }} days until permanent deletion
              </p>
            }
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [disabled]="isRestoring()" (click)="onCancel()">Cancel</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="isRestoring()"
        (click)="onRestore()"
      >
        @if (isRestoring()) {
          <span class="material-symbols-outlined animate-spin mr-2">progress_activity</span>
        }
        Restore Account
      </button>
    </mat-dialog-actions>
  `
})
export class RestoreUserDialogComponent {
  isRestoring = signal(false);

  constructor(
    public dialogRef: MatDialogRef<RestoreUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RestoreUserDialogData,
    private usersService: UsersService,
    private notificationService: NotificationService
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onRestore(): Promise<void> {
    try {
      this.isRestoring.set(true);
      await this.usersService.restoreUser(this.data.user.id);
      this.notificationService.success('Success', `User ${this.data.user.username} has been restored`);
      this.dialogRef.close(true);
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to restore user');
    } finally {
      this.isRestoring.set(false);
    }
  }
}
