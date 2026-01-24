import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonitoringAlert } from '../../../core/services/monitoring.service';

@Component({
  selector: 'app-alerts-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="alerts.length > 0" class="card bg-base-200 shadow mb-6">
      <div class="card-body">
        <h2 class="text-xl font-bold text-base-content mb-4">Active Alerts</h2>
        <div class="space-y-3">
          <div
            *ngFor="let alert of alerts"
            class="alert"
            [ngClass]="getAlertClass(alert.severity)"
          >
            <div class="flex-1">
              <!-- Alert Icon and Type -->
              <div class="flex items-center gap-2 mb-2">
                <span
                  class="badge"
                  [ngClass]="getBadgeClass(alert.severity)"
                >
                  {{ alert.severity | uppercase }}
                </span>
                <span class="text-base-content/60 text-xs">•</span>
                <span class="text-base-content/70 text-xs">{{ getAlertTypeLabel(alert.alert_type) }}</span>
              </div>

              <!-- Alert Message -->
              <p class="font-medium text-base-content">
                {{ alert.message }}
              </p>

              <!-- Alert Details -->
              <div *ngIf="alert.details" class="mt-2 text-sm text-base-content/70">
                <div *ngIf="alert.details.current_mb">
                  Current: {{ alert.details.current_mb | number }} MB
                </div>
                <div *ngIf="alert.details.percentage">
                  Usage: {{ alert.details.percentage }}%
                </div>
                <div *ngIf="alert.details.percentage_increase">
                  Increase: +{{ alert.details.percentage_increase }}%
                </div>
              </div>

              <!-- Timestamp -->
              <p class="text-xs text-base-content/60 mt-2">
                {{ alert.created_at | date:'medium' }}
              </p>
            </div>

            <!-- Dismiss Button -->
            <button
              (click)="dismissAlert(alert.id)"
              class="btn btn-ghost btn-sm btn-square"
              title="Dismiss alert"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- No Alerts State -->
    <div *ngIf="alerts.length === 0" class="card bg-base-200 shadow mb-6">
      <div class="card-body">
        <div class="alert alert-success">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span class="font-medium">No active alerts</span>
        </div>
      </div>
    </div>
  `
})
export class AlertsPanelComponent {
  @Input() alerts: MonitoringAlert[] = [];
  @Output() alertDismissed = new EventEmitter<string>();

  dismissAlert(alertId: string) {
    this.alertDismissed.emit(alertId);
  }

  getAlertClass(severity: string): string {
    switch (severity) {
      case 'critical': return 'alert-error';
      case 'high': return 'alert-warning';
      case 'medium': return 'alert-warning';
      case 'info': return 'alert-info';
      default: return 'alert-info';
    }
  }

  getBadgeClass(severity: string): string {
    switch (severity) {
      case 'critical': return 'badge-error';
      case 'high': return 'badge-warning';
      case 'medium': return 'badge-warning';
      case 'info': return 'badge-info';
      default: return 'badge-neutral';
    }
  }

  getAlertTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'egress_warning': 'Egress Warning',
      'egress_critical': 'Egress Critical',
      'api_spike': 'API Spike',
      'rate_limit_abuse': 'Rate Limit Abuse',
      'database_full': 'Database Full',
      'user_growth_spike': 'User Growth Spike'
    };
    return labels[type] || type;
  }
}
