import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonitoringAlert } from '../../../core/services/monitoring.service';

@Component({
  selector: 'app-alerts-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="alerts.length > 0" class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-xl font-bold text-gray-900 mb-4">Active Alerts</h2>
      <div class="space-y-3">
        <div
          *ngFor="let alert of alerts"
          [class.bg-red-50]="alert.severity === 'critical'"
          [class.bg-orange-50]="alert.severity === 'high'"
          [class.bg-yellow-50]="alert.severity === 'medium'"
          [class.bg-blue-50]="alert.severity === 'info'"
          [class.border-red-200]="alert.severity === 'critical'"
          [class.border-orange-200]="alert.severity === 'high'"
          [class.border-yellow-200]="alert.severity === 'medium'"
          [class.border-blue-200]="alert.severity === 'info'"
          class="border rounded-lg p-4"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <!-- Alert Icon and Type -->
              <div class="flex items-center gap-2 mb-2">
                <span
                  [class.text-red-600]="alert.severity === 'critical'"
                  [class.text-orange-600]="alert.severity === 'high'"
                  [class.text-yellow-600]="alert.severity === 'medium'"
                  [class.text-blue-600]="alert.severity === 'info'"
                  class="font-bold text-xs uppercase"
                >
                  {{ alert.severity }}
                </span>
                <span class="text-gray-500 text-xs">•</span>
                <span class="text-gray-600 text-xs">{{ getAlertTypeLabel(alert.alert_type) }}</span>
              </div>

              <!-- Alert Message -->
              <p
                [class.text-red-800]="alert.severity === 'critical'"
                [class.text-orange-800]="alert.severity === 'high'"
                [class.text-yellow-800]="alert.severity === 'medium'"
                [class.text-blue-800]="alert.severity === 'info'"
                class="font-medium"
              >
                {{ alert.message }}
              </p>

              <!-- Alert Details -->
              <div *ngIf="alert.details" class="mt-2 text-sm text-gray-600">
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
              <p class="text-xs text-gray-500 mt-2">
                {{ alert.created_at | date:'medium' }}
              </p>
            </div>

            <!-- Dismiss Button -->
            <button
              (click)="dismissAlert(alert.id)"
              class="ml-4 text-gray-400 hover:text-gray-600 transition"
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
    <div *ngIf="alerts.length === 0" class="bg-white rounded-lg shadow p-6 mb-6">
      <div class="flex items-center gap-3 text-green-700">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p class="font-medium">No active alerts</p>
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
