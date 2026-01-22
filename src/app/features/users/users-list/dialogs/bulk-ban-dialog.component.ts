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

export interface BulkBanDialogData {
  users: AppUser[];
}

@Component({
  selector: 'app-bulk-ban-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <h2 mat-dialog-title>Bulk Ban Users</h2>
    <mat-dialog-content>
      <div class="space-y-4">
        <!-- Selected Users Summary -->
        <div class="p-4 bg-gray-50 rounded-lg">
          <div class="font-semibold text-gray-900 mb-2">
            Selected Users ({{ data.users.length }})
          </div>
          <div class="max-h-32 overflow-y-auto space-y-1">
            @for (user of data.users; track user.id) {
              <div class="text-sm text-gray-700 flex items-center gap-2">
                <span class="material-symbols-outlined text-xs">person</span>
                <span>{{ user.username }} ({{ user.email }})</span>
              </div>
            }
          </div>
        </div>

        <!-- Warning Message -->
        <div class="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <span class="material-symbols-outlined text-red-600 text-xl mt-1">warning</span>
          <div class="text-sm text-red-800">
            All selected users will be immediately banned from accessing the platform. This action can be reversed later.
          </div>
        </div>

        <!-- Ban Reason -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Reason for Ban</mat-label>
          <textarea
            matInput
            [(ngModel)]="bulkBanReason"
            rows="4"
            placeholder="Enter the reason for banning these users (minimum 10 characters)..."
          ></textarea>
          <mat-hint>This reason will be applied to all selected users and stored in the audit log.</mat-hint>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [disabled]="isBanning()" (click)="onCancel()">Cancel</button>
      <button
        mat-raised-button
        color="warn"
        [disabled]="!bulkBanReason.trim() || bulkBanReason.trim().length < 10 || isBanning()"
        (click)="onBulkBan()"
      >
        @if (isBanning()) {
          <span class="material-symbols-outlined animate-spin mr-2">progress_activity</span>
        }
        Ban {{ data.users.length }} User(s)
      </button>
    </mat-dialog-actions>
  `
})
export class BulkBanDialogComponent {
  bulkBanReason = '';
  isBanning = signal(false);

  constructor(
    public dialogRef: MatDialogRef<BulkBanDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BulkBanDialogData,
    private usersService: UsersService,
    private notificationService: NotificationService
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onBulkBan(): Promise<void> {
    if (!this.bulkBanReason.trim() || this.bulkBanReason.trim().length < 10) {
      this.notificationService.warn('Warning', 'Ban reason is required (minimum 10 characters)');
      return;
    }

    try {
      this.isBanning.set(true);
      const userIds = this.data.users.map(u => u.id);
      const response = await this.usersService.bulkBanUsers(userIds, this.bulkBanReason);

      this.notificationService.success('Success', `Successfully banned ${response.banned_count} out of ${userIds.length} users`);

      if (response.failed_count > 0) {
        this.notificationService.warn('Partial Failure', `${response.failed_count} users could not be banned`);
      }

      this.dialogRef.close(true);
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to ban users');
    } finally {
      this.isBanning.set(false);
    }
  }
}
