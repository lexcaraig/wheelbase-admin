import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ModerationService } from '../../../../core/services/moderation.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import {
  ReviewReport,
  ReviewModerationAction
} from '../../../../core/models/content.model';
import { StatusBadgeComponent, BadgeSeverity } from '../../../../shared/components/status-badge/status-badge.component';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time.pipe';

export interface ReviewReportDialogData {
  report: ReviewReport;
}

@Component({
  selector: 'app-review-report-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    StatusBadgeComponent,
    RelativeTimePipe
  ],
  template: `
    <h2 mat-dialog-title>Moderate Review Report</h2>
    <mat-dialog-content class="!pt-4">
      <div class="space-y-6">
        <!-- Report Info -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="font-semibold text-gray-900 mb-3">Report Details</h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-600">Reported by:</span>
              <span class="ml-2 font-medium">&#64;{{ data.report.reporter_username }}</span>
            </div>
            <div>
              <span class="text-gray-600">Reported at:</span>
              <span class="ml-2">{{ data.report.created_at | relativeTime }}</span>
            </div>
            <div>
              <span class="text-gray-600">Reason:</span>
              <app-status-badge class="ml-2" [severity]="getReasonSeverity(data.report.reason)">
                {{ data.report.reason }}
              </app-status-badge>
            </div>
            @if (data.report.description) {
              <div class="col-span-2">
                <span class="text-gray-600">Description:</span>
                <p class="mt-1 text-gray-900">{{ data.report.description }}</p>
              </div>
            }
          </div>
        </div>

        <!-- Review Info -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="font-semibold text-gray-900 mb-3">Reported Review</h3>
          <div class="space-y-2">
            <div class="flex items-center gap-4">
              <img
                [src]="'https://ui-avatars.com/api/?name=' + data.report.reviewer_username"
                [alt]="data.report.reviewer_username"
                class="w-10 h-10 rounded-full"
              />
              <div>
                <p class="font-medium text-gray-900">&#64;{{ data.report.reviewer_username }}</p>
                <div class="flex items-center gap-2">
                  <span class="text-yellow-500">{{ getRatingStars(data.report.review_rating) }}</span>
                  <span class="text-xs text-gray-500">{{ data.report.review_created_at | relativeTime }}</span>
                </div>
              </div>
            </div>
            <p class="text-gray-700 mt-3">{{ data.report.review_text }}</p>
            <p class="text-sm text-gray-600 mt-2">
              Service Provider: <span class="font-medium">{{ data.report.provider_name }}</span>
            </p>
          </div>
        </div>

        <!-- Action Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Select Action <span class="text-red-500">*</span>
          </label>
          <mat-radio-group [(ngModel)]="selectedAction" class="flex flex-col gap-3">
            @for (action of actionOptions; track action.value) {
              <div
                class="flex items-center p-3 border rounded-lg cursor-pointer transition-all"
                [class.border-blue-500]="selectedAction === action.value"
                [class.bg-blue-50]="selectedAction === action.value"
              >
                <mat-radio-button [value]="action.value" color="primary">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined" [class]="getActionIconClass(action.color)">
                      {{ action.icon }}
                    </span>
                    <span class="font-medium">{{ action.label }}</span>
                  </div>
                </mat-radio-button>
              </div>
            }
          </mat-radio-group>
        </div>

        <!-- Admin Notes -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Admin Notes (Optional)</mat-label>
          <textarea
            matInput
            [(ngModel)]="adminNotes"
            rows="3"
            placeholder="Add any notes about this moderation action..."
            [disabled]="isProcessing()"
          ></textarea>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [disabled]="isProcessing()" (click)="onCancel()">Cancel</button>
      <button
        mat-raised-button
        [color]="selectedAction ? getButtonColor(selectedAction) : 'primary'"
        [disabled]="!selectedAction || isProcessing()"
        (click)="onConfirm()"
      >
        @if (isProcessing()) {
          <span class="material-symbols-outlined animate-spin mr-2">progress_activity</span>
        }
        Confirm Action
      </button>
    </mat-dialog-actions>
  `
})
export class ReviewReportDialogComponent {
  selectedAction: ReviewModerationAction | null = null;
  adminNotes = '';
  isProcessing = signal(false);

  actionOptions = [
    { label: 'Dismiss Report', value: 'dismiss' as ReviewModerationAction, icon: 'cancel', color: 'secondary' },
    { label: 'Hide Review', value: 'hide_review' as ReviewModerationAction, icon: 'visibility_off', color: 'warn' },
    { label: 'Ban User', value: 'ban_user' as ReviewModerationAction, icon: 'block', color: 'danger' }
  ];

  constructor(
    public dialogRef: MatDialogRef<ReviewReportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReviewReportDialogData,
    private moderationService: ModerationService,
    private notificationService: NotificationService,
    private confirmService: ConfirmService
  ) {}

  getReasonSeverity(reason: string): BadgeSeverity {
    switch (reason) {
      case 'spam': return 'info';
      case 'inappropriate': return 'warning';
      case 'fake': return 'warning';
      case 'offensive': return 'danger';
      default: return 'info';
    }
  }

  getRatingStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  getActionIconClass(color: string): string {
    switch (color) {
      case 'secondary': return 'text-gray-600';
      case 'warn': return 'text-yellow-600';
      case 'danger': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  getButtonColor(action: ReviewModerationAction): 'primary' | 'warn' {
    return action === 'ban_user' ? 'warn' : 'primary';
  }

  getActionLabel(action: ReviewModerationAction): string {
    switch (action) {
      case 'dismiss': return 'Dismiss Report';
      case 'hide_review': return 'Hide Review';
      case 'ban_user': return 'Ban User';
      default: return '';
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onConfirm(): Promise<void> {
    if (!this.selectedAction) {
      this.notificationService.warn('Warning', 'Please select an action');
      return;
    }

    const actionLabel = this.getActionLabel(this.selectedAction);

    const confirmed = await this.confirmService.confirm({
      title: actionLabel,
      message: `Are you sure you want to ${actionLabel.toLowerCase()}? This action cannot be undone.`,
      confirmText: 'Confirm',
      confirmColor: this.selectedAction === 'ban_user' ? 'warn' : 'primary'
    });

    if (!confirmed) return;

    try {
      this.isProcessing.set(true);

      await this.moderationService.moderateReviewReport({
        report_id: this.data.report.id,
        action: this.selectedAction,
        admin_notes: this.adminNotes || undefined
      });

      this.notificationService.success('Success', `${actionLabel} completed successfully`);
      this.dialogRef.close(true);
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to moderate report');
      console.error('Moderate report error:', error);
    } finally {
      this.isProcessing.set(false);
    }
  }
}
