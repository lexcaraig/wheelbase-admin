import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { VerificationRequest } from '../../../core/models/verification.model';
import { VerificationService } from '../../../core/services/verification.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { StatusBadgeComponent, BadgeSeverity } from '../../../shared/components/status-badge/status-badge.component';
import { formatDateTime } from '../../../shared/utils';
import { DocumentViewerDialogComponent } from './document-viewer-dialog.component';
import { MatDialog } from '@angular/material/dialog';

export interface VerificationReviewDialogData {
  request: VerificationRequest;
  verificationService: VerificationService;
}

@Component({
  selector: 'app-verification-review-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    StatusBadgeComponent
  ],
  template: `
    <h2 mat-dialog-title>Review Claim - {{ data.request.business_name }}</h2>
    <mat-dialog-content class="max-h-[70vh]">
      <div class="space-y-6">
        <!-- Business Information -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-600">Business Name</label>
              <div class="text-gray-900 mt-1">{{ data.request.business_name }}</div>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">Category</label>
              <div class="text-gray-900 mt-1">{{ data.request.service_provider?.category || 'N/A' }}</div>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">Address</label>
              <div class="text-gray-900 mt-1">{{ data.request.service_provider?.address || 'N/A' }}</div>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">City</label>
              <div class="text-gray-900 mt-1">{{ data.request.service_provider?.city || 'N/A' }}</div>
            </div>
          </div>
        </div>

        <!-- Owner Information -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Owner Information</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-600">Owner Name</label>
              <div class="text-gray-900 mt-1">{{ data.request.owner_name }}</div>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">Contact Number</label>
              <div class="text-gray-900 mt-1">{{ data.request.contact_number }}</div>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">Email</label>
              <div class="text-gray-900 mt-1">{{ data.request.email }}</div>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">Business Reg #</label>
              <div class="text-gray-900 mt-1">{{ data.request.business_registration_number || 'Not provided' }}</div>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">Tax ID</label>
              <div class="text-gray-900 mt-1">{{ data.request.tax_id || 'Not provided' }}</div>
            </div>
          </div>
        </div>

        <!-- Verification Documents -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Verification Documents</h3>
          <div class="grid grid-cols-3 gap-4">
            <!-- Business Permit -->
            <div class="border border-gray-200 rounded-lg p-4 bg-white">
              <div class="flex items-center gap-2 mb-3">
                <span class="material-symbols-outlined text-blue-600">description</span>
                <span class="font-medium text-gray-900">Business Permit</span>
              </div>
              @if (data.request.business_permit_url) {
                <button
                  mat-stroked-button
                  class="w-full mb-2"
                  (click)="viewDocument(data.request.business_permit_url, 'Business Permit')"
                >
                  <span class="material-symbols-outlined mr-2">visibility</span>
                  View Document
                </button>
                <div class="flex items-center gap-1 text-green-600 text-sm">
                  <span class="material-symbols-outlined text-sm">check_circle</span> Uploaded
                </div>
              } @else {
                <div class="flex items-center gap-1 text-gray-400 text-sm">
                  <span class="material-symbols-outlined text-sm">cancel</span> Not uploaded
                </div>
              }
            </div>

            <!-- Tax ID Document -->
            <div class="border border-gray-200 rounded-lg p-4 bg-white">
              <div class="flex items-center gap-2 mb-3">
                <span class="material-symbols-outlined text-blue-600">description</span>
                <span class="font-medium text-gray-900">Tax ID Document</span>
              </div>
              @if (data.request.tax_id_document_url) {
                <button
                  mat-stroked-button
                  class="w-full mb-2"
                  (click)="viewDocument(data.request.tax_id_document_url, 'Tax ID Document')"
                >
                  <span class="material-symbols-outlined mr-2">visibility</span>
                  View Document
                </button>
                <div class="flex items-center gap-1 text-green-600 text-sm">
                  <span class="material-symbols-outlined text-sm">check_circle</span> Uploaded
                </div>
              } @else {
                <div class="flex items-center gap-1 text-gray-400 text-sm">
                  <span class="material-symbols-outlined text-sm">cancel</span> Not uploaded
                </div>
              }
            </div>

            <!-- Proof of Ownership -->
            <div class="border border-gray-200 rounded-lg p-4 bg-white">
              <div class="flex items-center gap-2 mb-3">
                <span class="material-symbols-outlined text-blue-600">description</span>
                <span class="font-medium text-gray-900">Proof of Ownership</span>
              </div>
              @if (data.request.proof_of_ownership_url) {
                <button
                  mat-stroked-button
                  class="w-full mb-2"
                  (click)="viewDocument(data.request.proof_of_ownership_url, 'Proof of Ownership')"
                >
                  <span class="material-symbols-outlined mr-2">visibility</span>
                  View Document
                </button>
                <div class="flex items-center gap-1 text-green-600 text-sm">
                  <span class="material-symbols-outlined text-sm">check_circle</span> Uploaded
                </div>
              } @else {
                <div class="flex items-center gap-1 text-gray-400 text-sm">
                  <span class="material-symbols-outlined text-sm">cancel</span> Not uploaded
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Admin Review Section (only if pending) -->
        @if (data.request.status === 'pending') {
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Admin Review</h3>

            <!-- Decision Radio Buttons -->
            <div class="mb-4">
              <label class="text-sm font-medium text-gray-700 mb-2 block">Decision *</label>
              <mat-radio-group [(ngModel)]="reviewAction" class="flex gap-6">
                <mat-radio-button value="approve" class="text-green-600">
                  <span class="flex items-center gap-2">
                    <span class="material-symbols-outlined">check_circle</span> Approve
                  </span>
                </mat-radio-button>
                <mat-radio-button value="reject" class="text-red-600">
                  <span class="flex items-center gap-2">
                    <span class="material-symbols-outlined">cancel</span> Reject
                  </span>
                </mat-radio-button>
              </mat-radio-group>
            </div>

            <!-- Rejection Reason -->
            @if (reviewAction === 'reject') {
              <mat-form-field appearance="outline" class="w-full mb-4">
                <mat-label>Rejection Reason *</mat-label>
                <textarea
                  matInput
                  [(ngModel)]="rejectionReason"
                  rows="3"
                  placeholder="e.g., Business permit image is unclear, please resubmit"
                ></textarea>
                <mat-hint>This will be sent to the business owner</mat-hint>
              </mat-form-field>
            }

            <!-- Admin Notes -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Admin Notes (Internal)</mat-label>
              <textarea
                matInput
                [(ngModel)]="adminNotes"
                rows="2"
                placeholder="e.g., Verified with DTI database"
              ></textarea>
              <mat-hint>Internal notes, not visible to user</mat-hint>
            </mat-form-field>
          </div>
        }

        <!-- Already Reviewed Section -->
        @if (data.request.status !== 'pending') {
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Review Details</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-gray-600">Status</label>
                <div class="mt-1">
                  <app-status-badge [severity]="getStatusSeverity(data.request.status)">
                    {{ getStatusLabel(data.request.status) }}
                  </app-status-badge>
                </div>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-600">Reviewed At</label>
                <div class="text-gray-900 mt-1">{{ formatDate(data.request.reviewed_at) }}</div>
              </div>
              @if (data.request.rejection_reason) {
                <div class="col-span-2">
                  <label class="text-sm font-medium text-gray-600">Rejection Reason</label>
                  <div class="bg-red-50 border border-red-200 rounded p-3 text-red-900 mt-1">{{ data.request.rejection_reason }}</div>
                </div>
              }
              @if (data.request.admin_notes) {
                <div class="col-span-2">
                  <label class="text-sm font-medium text-gray-600">Admin Notes</label>
                  <div class="text-gray-900 mt-1">{{ data.request.admin_notes }}</div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [disabled]="isProcessing()" (click)="onClose()">Cancel</button>
      @if (data.request.status === 'pending') {
        <button
          mat-raised-button
          color="primary"
          [disabled]="!reviewAction || isProcessing()"
          (click)="submitReview()"
        >
          @if (isProcessing()) {
            <span class="material-symbols-outlined animate-spin mr-2">progress_activity</span>
          }
          Submit Review
        </button>
      }
    </mat-dialog-actions>
  `
})
export class VerificationReviewDialogComponent {
  isProcessing = signal(false);
  reviewAction: 'approve' | 'reject' | null = null;
  rejectionReason = '';
  adminNotes = '';

  constructor(
    public dialogRef: MatDialogRef<VerificationReviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VerificationReviewDialogData,
    private notificationService: NotificationService,
    private confirmService: ConfirmService,
    private dialog: MatDialog
  ) {}

  onClose(): void {
    this.dialogRef.close(false);
  }

  viewDocument(url: string | null, title: string) {
    if (!url) {
      this.notificationService.warn('No Document', 'This document was not uploaded');
      return;
    }

    const fullUrl = this.data.verificationService.getDocumentUrl(url);
    if (!fullUrl) {
      this.notificationService.error('Error', 'Failed to load document URL');
      return;
    }

    this.dialog.open(DocumentViewerDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      data: { url: fullUrl, title }
    });
  }

  async submitReview() {
    if (!this.reviewAction) return;

    if (this.reviewAction === 'reject' && !this.rejectionReason.trim()) {
      this.notificationService.warn('Validation Error', 'Please provide a rejection reason');
      return;
    }

    const confirmed = await this.confirmService.confirm({
      title: `Confirm ${this.reviewAction === 'approve' ? 'Approval' : 'Rejection'}`,
      message: `Are you sure you want to ${this.reviewAction} this claim for "${this.data.request.business_name}"?`,
      confirmText: this.reviewAction === 'approve' ? 'Approve' : 'Reject',
      confirmColor: this.reviewAction === 'approve' ? 'primary' : 'warn'
    });

    if (!confirmed) return;

    try {
      this.isProcessing.set(true);
      await this.data.verificationService.reviewClaim({
        requestId: this.data.request.id,
        action: this.reviewAction,
        rejectionReason: this.reviewAction === 'reject' ? this.rejectionReason : undefined,
        adminNotes: this.adminNotes || undefined
      });

      this.notificationService.success(
        'Success',
        `Claim ${this.reviewAction === 'approve' ? 'approved' : 'rejected'} successfully`
      );

      this.dialogRef.close(true);
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to review claim');
    } finally {
      this.isProcessing.set(false);
    }
  }

  getStatusSeverity(status: string): BadgeSeverity {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'danger';
      default:
        return 'warning';
    }
  }

  getStatusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  formatDate(dateString: string | null): string {
    return formatDateTime(dateString);
  }
}
