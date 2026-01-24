import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { VerificationRequest } from '../../../core/models/verification.model';
import { VerificationService } from '../../../core/services/verification.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { BadgeSeverity } from '../../../shared/components/status-badge/status-badge.component';
import { formatDateTime } from '../../../shared/utils';
import { DocumentViewerDialogComponent } from './document-viewer-dialog.component';

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
    MatDialogModule
  ],
  template: `
    <div class="p-6 max-h-[85vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-base-content">Review Claim - {{ data.request.business_name }}</h2>
        <button class="btn btn-ghost btn-sm btn-square" (click)="onClose()">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="space-y-6">
        <!-- Business Information -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-4">
            <h3 class="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">business</span>
              Business Information
            </h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-base-content/70">Business Name</label>
                <div class="text-base-content mt-1">{{ data.request.business_name }}</div>
              </div>
              <div>
                <label class="text-sm font-medium text-base-content/70">Category</label>
                <div class="text-base-content mt-1">{{ data.request.service_provider?.category || 'N/A' }}</div>
              </div>
              <div>
                <label class="text-sm font-medium text-base-content/70">Address</label>
                <div class="text-base-content mt-1">{{ data.request.service_provider?.address || 'N/A' }}</div>
              </div>
              <div>
                <label class="text-sm font-medium text-base-content/70">City</label>
                <div class="text-base-content mt-1">{{ data.request.service_provider?.city || 'N/A' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Owner Information -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-4">
            <h3 class="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">person</span>
              Owner Information
            </h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-base-content/70">Owner Name</label>
                <div class="text-base-content mt-1">{{ data.request.owner_name }}</div>
              </div>
              <div>
                <label class="text-sm font-medium text-base-content/70">Contact Number</label>
                <div class="text-base-content mt-1">{{ data.request.contact_number }}</div>
              </div>
              <div>
                <label class="text-sm font-medium text-base-content/70">Email</label>
                <div class="text-base-content mt-1">{{ data.request.email }}</div>
              </div>
              <div>
                <label class="text-sm font-medium text-base-content/70">Business Reg #</label>
                <div class="text-base-content mt-1">{{ data.request.business_registration_number || 'Not provided' }}</div>
              </div>
              <div>
                <label class="text-sm font-medium text-base-content/70">Tax ID</label>
                <div class="text-base-content mt-1">{{ data.request.tax_id || 'Not provided' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Verification Documents -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-4">
            <h3 class="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">folder_open</span>
              Verification Documents
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Business Permit -->
              <div class="card bg-base-200 shadow-sm">
                <div class="card-body p-4">
                  <div class="flex items-center gap-2 mb-3">
                    <span class="material-symbols-outlined text-info">description</span>
                    <span class="font-medium text-base-content">Business Permit</span>
                  </div>
                  @if (data.request.business_permit_url) {
                    <button
                      class="btn btn-outline btn-sm w-full mb-2"
                      (click)="viewDocument(data.request.business_permit_url, 'Business Permit')"
                    >
                      <span class="material-symbols-outlined text-sm">visibility</span>
                      View Document
                    </button>
                    <div class="flex items-center gap-1 text-success text-sm">
                      <span class="material-symbols-outlined text-sm">check_circle</span> Uploaded
                    </div>
                  } @else {
                    <div class="flex items-center gap-1 text-base-content/50 text-sm">
                      <span class="material-symbols-outlined text-sm">cancel</span> Not uploaded
                    </div>
                  }
                </div>
              </div>

              <!-- Tax ID Document -->
              <div class="card bg-base-200 shadow-sm">
                <div class="card-body p-4">
                  <div class="flex items-center gap-2 mb-3">
                    <span class="material-symbols-outlined text-info">description</span>
                    <span class="font-medium text-base-content">Tax ID Document</span>
                  </div>
                  @if (data.request.tax_id_document_url) {
                    <button
                      class="btn btn-outline btn-sm w-full mb-2"
                      (click)="viewDocument(data.request.tax_id_document_url, 'Tax ID Document')"
                    >
                      <span class="material-symbols-outlined text-sm">visibility</span>
                      View Document
                    </button>
                    <div class="flex items-center gap-1 text-success text-sm">
                      <span class="material-symbols-outlined text-sm">check_circle</span> Uploaded
                    </div>
                  } @else {
                    <div class="flex items-center gap-1 text-base-content/50 text-sm">
                      <span class="material-symbols-outlined text-sm">cancel</span> Not uploaded
                    </div>
                  }
                </div>
              </div>

              <!-- Proof of Ownership -->
              <div class="card bg-base-200 shadow-sm">
                <div class="card-body p-4">
                  <div class="flex items-center gap-2 mb-3">
                    <span class="material-symbols-outlined text-info">description</span>
                    <span class="font-medium text-base-content">Proof of Ownership</span>
                  </div>
                  @if (data.request.proof_of_ownership_url) {
                    <button
                      class="btn btn-outline btn-sm w-full mb-2"
                      (click)="viewDocument(data.request.proof_of_ownership_url, 'Proof of Ownership')"
                    >
                      <span class="material-symbols-outlined text-sm">visibility</span>
                      View Document
                    </button>
                    <div class="flex items-center gap-1 text-success text-sm">
                      <span class="material-symbols-outlined text-sm">check_circle</span> Uploaded
                    </div>
                  } @else {
                    <div class="flex items-center gap-1 text-base-content/50 text-sm">
                      <span class="material-symbols-outlined text-sm">cancel</span> Not uploaded
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Admin Review Section (only if pending) -->
        @if (data.request.status === 'pending') {
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body p-4">
              <h3 class="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">rate_review</span>
                Admin Review
              </h3>

              <!-- Decision Radio Buttons -->
              <div class="mb-4">
                <label class="text-sm font-medium text-base-content/80 mb-3 block">Decision *</label>
                <div class="flex gap-6">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="approve"
                      class="radio radio-success"
                      [(ngModel)]="reviewAction"
                    />
                    <span class="flex items-center gap-1 text-success font-medium">
                      <span class="material-symbols-outlined">check_circle</span> Approve
                    </span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="reject"
                      class="radio radio-error"
                      [(ngModel)]="reviewAction"
                    />
                    <span class="flex items-center gap-1 text-error font-medium">
                      <span class="material-symbols-outlined">cancel</span> Reject
                    </span>
                  </label>
                </div>
              </div>

              <!-- Rejection Reason -->
              @if (reviewAction === 'reject') {
                <div class="form-control mb-4">
                  <label class="label">
                    <span class="label-text font-medium">Rejection Reason *</span>
                  </label>
                  <textarea
                    class="textarea textarea-bordered w-full"
                    [(ngModel)]="rejectionReason"
                    rows="3"
                    placeholder="e.g., Business permit image is unclear, please resubmit"
                  ></textarea>
                  <label class="label">
                    <span class="label-text-alt text-base-content/60">This will be sent to the business owner</span>
                  </label>
                </div>
              }

              <!-- Admin Notes -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Admin Notes (Internal)</span>
                </label>
                <textarea
                  class="textarea textarea-bordered w-full"
                  [(ngModel)]="adminNotes"
                  rows="2"
                  placeholder="e.g., Verified with DTI database"
                ></textarea>
                <label class="label">
                  <span class="label-text-alt text-base-content/60">Internal notes, not visible to user</span>
                </label>
              </div>
            </div>
          </div>
        }

        <!-- Already Reviewed Section -->
        @if (data.request.status !== 'pending') {
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body p-4">
              <h3 class="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">info</span>
                Review Details
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-base-content/70">Status</label>
                  <div class="mt-1">
                    <span class="badge" [ngClass]="getStatusBadgeClass(data.request.status)">
                      {{ getStatusLabel(data.request.status) }}
                    </span>
                  </div>
                </div>
                <div>
                  <label class="text-sm font-medium text-base-content/70">Reviewed At</label>
                  <div class="text-base-content mt-1">{{ formatDate(data.request.reviewed_at) }}</div>
                </div>
                @if (data.request.rejection_reason) {
                  <div class="col-span-2">
                    <label class="text-sm font-medium text-base-content/70">Rejection Reason</label>
                    <div class="alert alert-error mt-1">
                      <span>{{ data.request.rejection_reason }}</span>
                    </div>
                  </div>
                }
                @if (data.request.admin_notes) {
                  <div class="col-span-2">
                    <label class="text-sm font-medium text-base-content/70">Admin Notes</label>
                    <div class="text-base-content mt-1">{{ data.request.admin_notes }}</div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Footer Actions -->
      <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-base-300">
        <button class="btn btn-ghost" [disabled]="isProcessing()" (click)="onClose()">Cancel</button>
        @if (data.request.status === 'pending') {
          <button
            class="btn btn-primary"
            [disabled]="!reviewAction || isProcessing()"
            (click)="submitReview()"
          >
            @if (isProcessing()) {
              <span class="loading loading-spinner loading-sm"></span>
            }
            Submit Review
          </button>
        }
      </div>
    </div>
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

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'rejected':
        return 'badge-error';
      default:
        return 'badge-warning';
    }
  }

  getStatusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  formatDate(dateString: string | null): string {
    return formatDateTime(dateString);
  }
}
