// Emergency Dashboard Component
// TICKET-009: Admin Emergency Dashboard
// Real-time monitoring of SOS alerts and crash detections

import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, interval, takeUntil, switchMap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  EmergencyService,
  SOSAlert,
  CrashDetection,
  EmergencyStats,
  EmergencyTimelineItem
} from '../../core/services/emergency.service';
import { NotificationService } from '../../core/services/notification.service';
import { StatusBadgeComponent, BadgeSeverity } from '../../shared/components/status-badge/status-badge.component';
import { AlertDetailDialogComponent } from './dialogs/alert-detail-dialog.component';

@Component({
  selector: 'app-emergency-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    StatusBadgeComponent
  ],
  templateUrl: './emergency-dashboard.component.html',
  styleUrls: ['./emergency-dashboard.component.scss']
})
export class EmergencyDashboardComponent implements OnInit, OnDestroy {
  private emergencyService = inject(EmergencyService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  // State signals
  stats = signal<EmergencyStats | null>(null);
  alerts = signal<SOSAlert[]>([]);
  crashDetections = signal<CrashDetection[]>([]);
  timeline = signal<EmergencyTimelineItem[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  autoRefreshEnabled = signal(true);
  lastRefreshTime = signal<Date | null>(null);

  // Filter state
  statusFilter: string = 'all';
  statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Countdown', value: 'countdown' },
    { label: 'Resolved', value: 'resolved' },
    { label: 'Cancelled', value: 'cancelled' }
  ];

  // Table configuration
  displayedColumns: string[] = ['user', 'type', 'status', 'location', 'time', 'actions'];
  pageSize = 10;
  page = 0;

  ngOnInit() {
    this.loadAllData();
    this.setupAutoRefresh();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all dashboard data
   */
  loadAllData() {
    this.isLoading.set(true);
    this.error.set(null);

    // Load stats
    this.emergencyService.getEmergencyStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats.set(stats);
        },
        error: (err) => {
          console.error('Stats error:', err);
        }
      });

    // Load alerts
    this.loadAlerts();

    // Load crash detections
    this.emergencyService.getCrashDetections({ limit: 10 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.crashDetections.set(result.detections);
        },
        error: (err) => {
          console.error('Crash detections error:', err);
        }
      });

    // Load timeline
    this.emergencyService.getActivityTimeline(15)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (timeline) => {
          this.timeline.set(timeline);
          this.isLoading.set(false);
          this.lastRefreshTime.set(new Date());
        },
        error: (err) => {
          this.error.set('Failed to load emergency data');
          this.isLoading.set(false);
          console.error('Timeline error:', err);
        }
      });
  }

  /**
   * Load alerts with current filter
   */
  loadAlerts() {
    this.emergencyService.getSOSAlerts({
      status: this.statusFilter,
      limit: 50
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.alerts.set(result.alerts);
        },
        error: (err) => {
          console.error('Alerts error:', err);
        }
      });
  }

  /**
   * Setup auto-refresh every 30 seconds
   */
  setupAutoRefresh() {
    interval(30 * 1000)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => {
          if (this.autoRefreshEnabled()) {
            return this.emergencyService.getEmergencyStats();
          }
          return [];
        })
      )
      .subscribe({
        next: (stats) => {
          if (stats) {
            this.stats.set(stats);
            this.loadAlerts();
            this.lastRefreshTime.set(new Date());
          }
        },
        error: (err) => {
          console.error('Auto-refresh error:', err);
        }
      });
  }

  /**
   * Manual refresh
   */
  refresh() {
    this.loadAllData();
  }

  /**
   * Toggle auto-refresh
   */
  toggleAutoRefresh() {
    this.autoRefreshEnabled.update(enabled => !enabled);
  }

  /**
   * Change status filter
   */
  onStatusFilterChange(status: string) {
    this.statusFilter = status;
    this.page = 0;
    this.loadAlerts();
  }

  /**
   * Handle page change
   */
  onPageChange(event: PageEvent) {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  /**
   * View alert detail
   */
  viewAlertDetail(alert: SOSAlert) {
    const dialogRef = this.dialog.open(AlertDetailDialogComponent, {
      width: '600px',
      data: { alert }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.action === 'mark_help_arrived') {
        this.markHelpArrived(result.alertId);
      }
    });
  }

  /**
   * Mark help arrived for an alert
   */
  markHelpArrived(alertId: string) {
    this.emergencyService.updateSOSAlert(alertId, {
      help_arrived: true,
      status: 'resolved',
      resolved_at: new Date().toISOString()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Updated', 'Alert marked as help arrived');
          this.loadAlerts();
        },
        error: (err) => {
          this.notificationService.error('Error', 'Failed to update alert');
        }
      });
  }

  /**
   * Open Google Maps with location
   */
  openInMaps(location: { lat: number; lng: number } | null) {
    if (!location) return;
    const url = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    window.open(url, '_blank');
  }

  /**
   * Get severity tag for status
   */
  getStatusSeverity(status: string): BadgeSeverity {
    switch (status) {
      case 'active':
        return 'danger';
      case 'countdown':
        return 'warning';
      case 'resolved':
        return 'success';
      case 'cancelled':
        return 'secondary';
      default:
        return 'info';
    }
  }

  /**
   * Get alert type severity
   */
  getAlertTypeSeverity(alertType: string): BadgeSeverity {
    return alertType === 'automatic' ? 'warning' : 'info';
  }

  /**
   * Get severity tag for timeline item
   */
  getTimelineSeverity(severity: string): BadgeSeverity {
    switch (severity) {
      case 'critical':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      default:
        return 'secondary';
    }
  }

  /**
   * Get icon for timeline item type
   */
  getTimelineIcon(type: string): string {
    switch (type) {
      case 'sos':
        return 'warning';
      case 'crash':
        return 'bolt';
      case 'resolved':
        return 'check_circle';
      default:
        return 'info';
    }
  }

  /**
   * Get user initial for avatar
   */
  getInitial(name?: string | null): string {
    return name?.charAt(0) || '?';
  }

  /**
   * Format timestamp to relative time
   */
  formatRelativeTime(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  /**
   * Format date for tooltip
   */
  formatDate(timestamp: string): string {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format response time
   */
  formatResponseTime(seconds: number | null): string {
    if (seconds === null) return 'N/A';
    return this.emergencyService.formatDuration(seconds);
  }
}
