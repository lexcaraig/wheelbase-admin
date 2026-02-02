import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
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
    AvatarComponent
  ],
  template: `
    <div class="bg-base-100 rounded-lg w-full max-w-md">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-base-300">
        <h3 class="text-lg font-semibold text-error">Permanently Delete User</h3>
        <button
          class="btn btn-ghost btn-sm btn-circle"
          [disabled]="isDeleting()"
          (click)="onCancel()"
        >
          <span class="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 space-y-4">
        <!-- User Info -->
        <div class="p-4 bg-base-200 rounded-lg">
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
        <div class="alert alert-error">
          <span class="material-symbols-outlined">warning</span>
          <div class="text-sm">
            <p class="font-semibold mb-2">THIS ACTION IS IRREVERSIBLE</p>
            <p class="mb-2">Permanently deleting this user will remove:</p>
            <ul class="list-disc list-inside space-y-1 ml-2">
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
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text font-medium">Type PERMANENTLY DELETE to confirm</span>
          </label>
          <input
            type="text"
            [(ngModel)]="confirmText"
            placeholder="Type PERMANENTLY DELETE"
            class="input input-bordered w-full font-mono"
            [class.input-error]="confirmText && confirmText !== 'PERMANENTLY DELETE'"
          />
          @if (confirmText && confirmText !== 'PERMANENTLY DELETE') {
            <label class="label">
              <span class="label-text-alt text-error">Text must match exactly: PERMANENTLY DELETE</span>
            </label>
          }
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-end gap-2 p-4 border-t border-base-300">
        <button
          class="btn btn-ghost"
          [disabled]="isDeleting()"
          (click)="onCancel()"
        >
          Cancel
        </button>
        <button
          class="btn btn-error"
          [disabled]="confirmText !== 'PERMANENTLY DELETE' || isDeleting()"
          (click)="onForceDelete()"
        >
          @if (isDeleting()) {
            <span class="loading loading-spinner loading-sm"></span>
          }
          Permanently Delete
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
