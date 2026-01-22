import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SOSAlert } from '../../../core/services/emergency.service';
import { StatusBadgeComponent, BadgeSeverity } from '../../../shared/components/status-badge/status-badge.component';

export interface AlertDetailDialogData {
  alert: SOSAlert;
}

@Component({
  selector: 'app-alert-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    StatusBadgeComponent
  ],
  template: `
    <h2 mat-dialog-title>SOS Alert Details</h2>
    <mat-dialog-content class="!pt-4">
      <div class="space-y-4">
        <!-- User Info -->
        <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div class="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            @if (data.alert.user?.avatar_url) {
              <img
                [src]="data.alert.user?.avatar_url"
                [alt]="data.alert.user?.full_name || 'User'"
                class="w-16 h-16 rounded-full object-cover"
              />
            } @else {
              <span class="text-2xl font-bold text-gray-500">
                {{ getInitial(data.alert.user?.full_name) }}
              </span>
            }
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">{{ data.alert.user?.full_name || 'Unknown User' }}</h3>
            <p class="text-gray-600">&#64;{{ data.alert.user?.username }}</p>
            @if (data.alert.user?.phone) {
              <p class="text-gray-600">{{ data.alert.user?.phone }}</p>
            }
          </div>
        </div>

        <!-- Alert Info Grid -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-500">Status</p>
            <app-status-badge [severity]="getStatusSeverity(data.alert.status)">
              {{ data.alert.status.toUpperCase() }}
            </app-status-badge>
          </div>
          <div>
            <p class="text-sm text-gray-500">Type</p>
            <app-status-badge [severity]="data.alert.alert_type === 'automatic' ? 'warning' : 'info'">
              {{ data.alert.alert_type === 'automatic' ? 'CRASH DETECTED' : 'MANUAL SOS' }}
            </app-status-badge>
          </div>
          <div>
            <p class="text-sm text-gray-500">Triggered At</p>
            <p class="font-medium">{{ formatDate(data.alert.triggered_at) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Contacts Notified</p>
            <p class="font-medium">{{ data.alert.emergency_contacts_notified ? 'Yes' : 'No' }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Help Arrived</p>
            <p class="font-medium">{{ data.alert.help_arrived ? 'Yes' : 'No' }}</p>
          </div>
          @if (data.alert.resolved_at) {
            <div>
              <p class="text-sm text-gray-500">Resolved At</p>
              <p class="font-medium">{{ formatDate(data.alert.resolved_at) }}</p>
            </div>
          }
        </div>

        <!-- Message -->
        @if (data.alert.message) {
          <div>
            <p class="text-sm text-gray-500">Message</p>
            <p class="font-medium bg-gray-50 p-3 rounded-lg">{{ data.alert.message }}</p>
          </div>
        }

        <!-- Location -->
        @if (data.alert.location) {
          <div>
            <p class="text-sm text-gray-500 mb-2">Location</p>
            <button
              (click)="openInMaps()"
              class="w-full p-4 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100 transition flex items-center justify-center gap-2"
            >
              <span class="material-symbols-outlined">location_on</span>
              Open in Google Maps ({{ data.alert.location.lat.toFixed(4) }}, {{ data.alert.location.lng.toFixed(4) }})
            </button>
          </div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onClose()">Close</button>
      @if (data.alert.status === 'active') {
        <button
          mat-raised-button
          color="primary"
          [disabled]="isProcessing()"
          (click)="onMarkHelpArrived()"
          class="!bg-green-600"
        >
          @if (isProcessing()) {
            <span class="material-symbols-outlined animate-spin mr-2">progress_activity</span>
          }
          Mark Help Arrived
        </button>
      }
    </mat-dialog-actions>
  `
})
export class AlertDetailDialogComponent {
  isProcessing = signal(false);

  constructor(
    public dialogRef: MatDialogRef<AlertDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AlertDetailDialogData
  ) {}

  onClose(): void {
    this.dialogRef.close(false);
  }

  onMarkHelpArrived(): void {
    this.dialogRef.close({ action: 'mark_help_arrived', alertId: this.data.alert.id });
  }

  openInMaps(): void {
    if (!this.data.alert.location) return;
    const url = `https://www.google.com/maps?q=${this.data.alert.location.lat},${this.data.alert.location.lng}`;
    window.open(url, '_blank');
  }

  getInitial(name?: string | null): string {
    return name?.charAt(0) || '?';
  }

  getStatusSeverity(status: string): BadgeSeverity {
    switch (status) {
      case 'active': return 'danger';
      case 'countdown': return 'warning';
      case 'resolved': return 'success';
      case 'cancelled': return 'secondary';
      default: return 'info';
    }
  }

  formatDate(dateString?: string | null): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
