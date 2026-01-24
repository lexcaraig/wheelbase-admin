import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FlaggedContent, ModerationAction } from '../../../../core/models/content.model';
import { ModerationService } from '../../../../core/services/moderation.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time.pipe';

export interface ContentPreviewDialogData {
  content: FlaggedContent;
}

@Component({
  selector: 'app-content-preview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    StatusBadgeComponent,
    AvatarComponent,
    RelativeTimePipe
  ],
  template: `
    <h2 mat-dialog-title>Content Details</h2>
    <mat-dialog-content>
      <div class="space-y-4">
        <!-- Content Type & Author -->
        <div class="flex items-center justify-between pb-4 border-b border-base-300">
          <div class="flex items-center gap-3">
            <app-avatar
              [image]="data.content.author_avatar_url"
              [label]="data.content.author_username"
              shape="circle"
              size="large"
            ></app-avatar>
            <div>
              <p class="font-medium text-base-content">{{ data.content.author_username }}</p>
              <p class="text-sm text-base-content/70">{{ data.content.flagged_at | relativeTime }}</p>
            </div>
          </div>
          <app-status-badge [severity]="getContentTypeSeverity(data.content.content_type)">
            {{ data.content.content_type | uppercase }}
          </app-status-badge>
        </div>

        <!-- Content -->
        <div>
          <h3 class="font-medium text-base-content/80 mb-2">Content:</h3>
          <div class="p-4 bg-base-100 rounded-lg">
            <p class="text-base-content whitespace-pre-wrap">{{ data.content.content }}</p>
          </div>
        </div>

        <!-- Flag Reason -->
        <div>
          <h3 class="font-medium text-base-content/80 mb-2">Flag Reason:</h3>
          <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-red-800">{{ data.content.flag_reason }}</p>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [disabled]="isProcessing()" (click)="onClose()">Close</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="isProcessing()"
        (click)="onModerate('approve')"
      >
        @if (isProcessing()) {
          <span class="material-symbols-outlined animate-spin mr-2">progress_activity</span>
        }
        <span class="material-symbols-outlined mr-2">check</span>
        Approve
      </button>
      <button
        mat-raised-button
        color="warn"
        [disabled]="isProcessing()"
        (click)="onModerate('remove')"
      >
        @if (isProcessing()) {
          <span class="material-symbols-outlined animate-spin mr-2">progress_activity</span>
        }
        <span class="material-symbols-outlined mr-2">delete</span>
        Remove
      </button>
    </mat-dialog-actions>
  `
})
export class ContentPreviewDialogComponent {
  isProcessing = signal(false);

  constructor(
    public dialogRef: MatDialogRef<ContentPreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ContentPreviewDialogData,
    private moderationService: ModerationService,
    private notificationService: NotificationService
  ) {}

  onClose(): void {
    this.dialogRef.close(false);
  }

  async onModerate(action: ModerationAction): Promise<void> {
    try {
      this.isProcessing.set(true);
      await this.moderationService.moderateContent({
        content_id: this.data.content.content_id,
        content_type: this.data.content.content_type,
        action
      });

      this.notificationService.success(
        'Success',
        `Content ${action === 'approve' ? 'approved' : 'removed'} successfully`
      );

      this.dialogRef.close(true);
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to moderate content');
    } finally {
      this.isProcessing.set(false);
    }
  }

  getContentTypeSeverity(type: string): 'info' | 'warning' {
    return type === 'post' ? 'info' : 'warning';
  }
}
