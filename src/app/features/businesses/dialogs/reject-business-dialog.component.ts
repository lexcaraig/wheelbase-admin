import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Business } from '../../../core/models/business.model';
import { BusinessService } from '../../../core/services/business.service';
import { NotificationService } from '../../../core/services/notification.service';

export interface RejectBusinessDialogData {
  business: Business;
}

@Component({
  selector: 'app-reject-business-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Reject Business</h2>
    <mat-dialog-content class="!pt-4">
      <div class="space-y-4">
        <p class="text-gray-600">
          Are you sure you want to reject <strong>{{ data.business.business_name }}</strong>?
        </p>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Rejection Reason (required)</mat-label>
          <textarea
            matInput
            [(ngModel)]="rejectionReason"
            rows="4"
            placeholder="Please provide a reason for rejection..."
            [disabled]="isProcessing()"
          ></textarea>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [disabled]="isProcessing()" (click)="onCancel()">Cancel</button>
      <button
        mat-raised-button
        color="warn"
        [disabled]="!rejectionReason.trim() || isProcessing()"
        (click)="onReject()"
      >
        @if (isProcessing()) {
          <span class="material-symbols-outlined animate-spin mr-2">progress_activity</span>
        }
        Reject
      </button>
    </mat-dialog-actions>
  `
})
export class RejectBusinessDialogComponent {
  rejectionReason = '';
  isProcessing = signal(false);

  constructor(
    public dialogRef: MatDialogRef<RejectBusinessDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RejectBusinessDialogData,
    private businessService: BusinessService,
    private notificationService: NotificationService
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onReject(): Promise<void> {
    if (!this.rejectionReason.trim()) return;

    try {
      this.isProcessing.set(true);
      await this.businessService.rejectBusiness(this.data.business.id, this.rejectionReason.trim());
      this.notificationService.success('Success', `${this.data.business.business_name} has been rejected`);
      this.dialogRef.close(true);
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to reject business');
      console.error('Reject business error:', error);
    } finally {
      this.isProcessing.set(false);
    }
  }
}
