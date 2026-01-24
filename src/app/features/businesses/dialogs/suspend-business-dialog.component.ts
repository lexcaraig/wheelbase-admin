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

export interface SuspendBusinessDialogData {
  business: Business;
}

@Component({
  selector: 'app-suspend-business-dialog',
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
    <h2 mat-dialog-title>Suspend Business</h2>
    <mat-dialog-content class="!pt-4">
      <div class="space-y-4">
        <p class="text-base-content/70">
          Are you sure you want to suspend <strong>{{ data.business.business_name }}</strong>?
        </p>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Suspension Reason (optional)</mat-label>
          <textarea
            matInput
            [(ngModel)]="suspendReason"
            rows="4"
            placeholder="Optionally provide a reason for suspension..."
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
        [disabled]="isProcessing()"
        (click)="onSuspend()"
      >
        @if (isProcessing()) {
          <span class="material-symbols-outlined animate-spin mr-2">progress_activity</span>
        }
        Suspend
      </button>
    </mat-dialog-actions>
  `
})
export class SuspendBusinessDialogComponent {
  suspendReason = '';
  isProcessing = signal(false);

  constructor(
    public dialogRef: MatDialogRef<SuspendBusinessDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SuspendBusinessDialogData,
    private businessService: BusinessService,
    private notificationService: NotificationService
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onSuspend(): Promise<void> {
    try {
      this.isProcessing.set(true);
      await this.businessService.suspendBusiness(this.data.business.id, this.suspendReason.trim() || undefined);
      this.notificationService.success('Success', `${this.data.business.business_name} has been suspended`);
      this.dialogRef.close(true);
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to suspend business');
      console.error('Suspend business error:', error);
    } finally {
      this.isProcessing.set(false);
    }
  }
}
