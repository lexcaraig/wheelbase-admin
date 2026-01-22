import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Business, BUSINESS_TYPE_LABELS, BUSINESS_STATUS_LABELS, BusinessVerificationStatus } from '../../../core/models/business.model';
import { StatusBadgeComponent, BadgeSeverity } from '../../../shared/components/status-badge/status-badge.component';

export interface ViewBusinessDialogData {
  business: Business;
}

@Component({
  selector: 'app-view-business-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    StatusBadgeComponent
  ],
  template: `
    <h2 mat-dialog-title>Business Details</h2>
    <mat-dialog-content class="!pt-4">
      <div class="space-y-4">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
            @if (data.business.logo_url) {
              <img
                [src]="data.business.logo_url"
                [alt]="data.business.business_name"
                class="w-16 h-16 rounded-full object-cover"
              />
            } @else {
              <span class="material-symbols-outlined text-gray-400 text-2xl">business</span>
            }
          </div>
          <div>
            <h3 class="text-xl font-semibold">{{ data.business.business_name }}</h3>
            <p class="text-gray-500">{{ getBusinessTypeLabel(data.business.business_type) }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-500">Email</label>
            <p>{{ data.business.owner_email }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-500">Phone</label>
            <p>{{ data.business.phone || '-' }}</p>
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-500">Address</label>
            <p>{{ data.business.address || '-' }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-500">Website</label>
            <p>
              @if (data.business.website) {
                <a [href]="data.business.website" target="_blank" class="text-blue-600 hover:underline">
                  {{ data.business.website }}
                </a>
              } @else {
                -
              }
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-500">Country</label>
            <p>{{ data.business.country_code }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-500">Status</label>
            <app-status-badge [severity]="getStatusSeverity(data.business.verification_status)">
              {{ getStatusLabel(data.business.verification_status) }}
            </app-status-badge>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-500">Subscription</label>
            <p>{{ data.business.subscription_tier | titlecase }}</p>
          </div>
          @if (data.business.rejection_reason) {
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-500">Rejection/Suspension Reason</label>
              <p class="text-red-600">{{ data.business.rejection_reason }}</p>
            </div>
          }
          <div>
            <label class="block text-sm font-medium text-gray-500">Created At</label>
            <p>{{ formatDate(data.business.created_at) }}</p>
          </div>
          @if (data.business.verified_at) {
            <div>
              <label class="block text-sm font-medium text-gray-500">Verified At</label>
              <p>{{ formatDate(data.business.verified_at) }}</p>
            </div>
          }
        </div>

        @if (data.business.description) {
          <div>
            <label class="block text-sm font-medium text-gray-500">Description</label>
            <p class="text-gray-700">{{ data.business.description }}</p>
          </div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onClose()">Close</button>
    </mat-dialog-actions>
  `
})
export class ViewBusinessDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ViewBusinessDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ViewBusinessDialogData
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  getBusinessTypeLabel(type: string): string {
    return BUSINESS_TYPE_LABELS[type as keyof typeof BUSINESS_TYPE_LABELS] || type;
  }

  getStatusLabel(status: BusinessVerificationStatus): string {
    return BUSINESS_STATUS_LABELS[status] || status;
  }

  getStatusSeverity(status: BusinessVerificationStatus): BadgeSeverity {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'suspended': return 'secondary';
      default: return 'info';
    }
  }

  formatDate(dateString?: string | null): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
