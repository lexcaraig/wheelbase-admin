import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subject, takeUntil, switchMap } from 'rxjs';
import { MonitoringService, InfrastructureMetrics, ApiUsageMetrics, MonitoringAlert, MonitoringSnapshot } from '../../core/services/monitoring.service';
import { AlertService } from '../../core/services/alert.service';
import { UserGrowthChartComponent } from './components/user-growth-chart.component';
import { ApiUsageChartComponent } from './components/api-usage-chart.component';
import { InfrastructureMetricsComponent } from './components/infrastructure-metrics.component';
import { AlertsPanelComponent } from './components/alerts-panel.component';

@Component({
  selector: 'app-monitoring',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UserGrowthChartComponent,
    ApiUsageChartComponent,
    InfrastructureMetricsComponent,
    AlertsPanelComponent
  ],
  templateUrl: './monitoring.component.html',
  styleUrls: ['./monitoring.component.css']
})
export class MonitoringComponent implements OnInit, OnDestroy {
  private monitoringService = inject(MonitoringService);
  private alertService = inject(AlertService);
  private destroy$ = new Subject<void>();

  // Signals
  infrastructureMetrics = signal<InfrastructureMetrics | null>(null);
  apiUsageMetrics = signal<ApiUsageMetrics | null>(null);
  activeAlerts = signal<MonitoringAlert[]>([]);
  snapshots = signal<MonitoringSnapshot[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  autoRefreshEnabled = signal(true);
  lastRefreshTime = signal<Date | null>(null);

  // Period selector
  apiUsagePeriod = signal<'7d' | '30d' | '90d'>('7d');
  snapshotDays = signal(30);

  ngOnInit() {
    this.loadData();
    this.setupAutoRefresh();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all monitoring data
   */
  loadData() {
    this.loading.set(true);
    this.error.set(null);

    // Load infrastructure metrics
    this.monitoringService.getInfrastructureMetrics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (metrics) => {
          this.infrastructureMetrics.set(metrics);
          this.checkAndCreateAlerts(metrics);
          this.loading.set(false);
          this.lastRefreshTime.set(new Date());
        },
        error: (err) => {
          this.error.set('Failed to load infrastructure metrics');
          this.loading.set(false);
          console.error('Infrastructure metrics error:', err);
        }
      });

    // Load API usage metrics
    this.monitoringService.getApiUsage(this.apiUsagePeriod())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (metrics) => {
          this.apiUsageMetrics.set(metrics);
        },
        error: (err) => {
          console.error('API usage error:', err);
        }
      });

    // Load active alerts
    this.loadAlerts();

    // Load snapshots
    this.monitoringService.getSnapshots(this.snapshotDays())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (snapshots) => {
          this.snapshots.set(snapshots);
        },
        error: (err) => {
          console.error('Snapshots error:', err);
        }
      });
  }

  /**
   * Load active alerts
   */
  loadAlerts() {
    this.monitoringService.getActiveAlerts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (alerts) => {
          this.activeAlerts.set(alerts);
        },
        error: (err) => {
          console.error('Alerts error:', err);
        }
      });
  }

  /**
   * Setup auto-refresh (every 5 minutes)
   */
  setupAutoRefresh() {
    interval(5 * 60 * 1000) // 5 minutes
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => {
          if (this.autoRefreshEnabled()) {
            return this.monitoringService.getInfrastructureMetrics();
          }
          return [];
        })
      )
      .subscribe({
        next: (metrics) => {
          if (metrics) {
            this.infrastructureMetrics.set(metrics);
            this.checkAndCreateAlerts(metrics);
            this.lastRefreshTime.set(new Date());
          }
        },
        error: (err) => {
          console.error('Auto-refresh error:', err);
        }
      });
  }

  /**
   * Check metrics and create alerts if needed
   */
  checkAndCreateAlerts(metrics: InfrastructureMetrics) {
    // Check egress warnings
    const egressAlert = this.alertService.checkEgressWarnings(
      metrics.costs.free_tier_status.egress.used_mb
    );
    if (egressAlert) {
      this.alertService.createAlert(egressAlert).subscribe();
    }

    // Check database warnings
    const dbAlert = this.alertService.checkDatabaseWarnings(
      metrics.database.size_mb
    );
    if (dbAlert) {
      this.alertService.createAlert(dbAlert).subscribe();
    }
  }

  /**
   * Manual refresh
   */
  refresh() {
    this.loadData();
  }

  /**
   * Toggle auto-refresh
   */
  toggleAutoRefresh() {
    this.autoRefreshEnabled.update(enabled => !enabled);
  }

  /**
   * Change API usage period
   */
  changeApiPeriod(period: '7d' | '30d' | '90d') {
    this.apiUsagePeriod.set(period);
    this.monitoringService.getApiUsage(period)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (metrics) => {
          this.apiUsageMetrics.set(metrics);
        },
        error: (err) => {
          console.error('API usage error:', err);
        }
      });
  }

  /**
   * Dismiss alert
   */
  onAlertDismissed(alertId: string) {
    this.monitoringService.dismissAlert(alertId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadAlerts();
        },
        error: (err) => {
          console.error('Dismiss alert error:', err);
        }
      });
  }

  /**
   * Capture manual snapshot
   */
  captureSnapshot() {
    this.monitoringService.captureSnapshot()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert('Snapshot captured successfully');
          this.loadData();
        },
        error: (err) => {
          alert('Failed to capture snapshot');
          console.error('Capture snapshot error:', err);
        }
      });
  }

  /**
   * Copy all monitoring stats to clipboard in GitHub markdown format
   */
  copyStatsToClipboard() {
    const infra = this.infrastructureMetrics();
    const api = this.apiUsageMetrics();
    const alerts = this.activeAlerts();
    const snapshots = this.snapshots();

    if (!infra) {
      alert('No data to copy');
      return;
    }

    const timestamp = new Date().toISOString();
    const markdown = `# Wheelbase Monitoring Report
**Generated:** ${timestamp}

## 📊 Infrastructure Metrics

### User Activity
| Metric | Value |
|--------|-------|
| Total Users | ${infra.users.total_users.toLocaleString()} |
| DAU (Daily Active Users) | ${infra.users.dau.toLocaleString()} |
| WAU (Weekly Active Users) | ${infra.users.wau.toLocaleString()} |
| MAU (Monthly Active Users) | ${infra.users.mau.toLocaleString()} |
| DAU/MAU Ratio | ${infra.users.dau_mau_ratio}% |

### Content Stats
| Metric | Value |
|--------|-------|
| Total Posts | ${infra.content.total_posts.toLocaleString()} |
| Total Rides | ${infra.content.total_rides.toLocaleString()} |
| Active Rides (7d) | ${infra.content.active_rides.toLocaleString()} |
| Total Groups | ${infra.content.total_groups.toLocaleString()} |
| Active Groups (30d) | ${infra.content.active_groups.toLocaleString()} |

### Pro Plan Usage
| Resource | Used | Limit | Percentage |
|----------|------|-------|------------|
| Database | ${infra.costs.free_tier_status.database.used_mb.toFixed(2)} MB | ${(infra.costs.free_tier_status.database.limit_mb / 1024).toFixed(0)} GB | ${infra.costs.free_tier_status.database.percentage.toFixed(2)}% |
| Storage | ${infra.costs.free_tier_status.storage.used_mb.toFixed(2)} MB | ${(infra.costs.free_tier_status.storage.limit_mb / 1024).toFixed(0)} GB | ${infra.costs.free_tier_status.storage.percentage.toFixed(2)}% |
| Egress | ${infra.costs.free_tier_status.egress.used_mb.toFixed(2)} MB | ${(infra.costs.free_tier_status.egress.limit_mb / 1024).toFixed(0)} GB | ${infra.costs.free_tier_status.egress.percentage.toFixed(2)}% |

### Top Tables by Size
| Table | Size (MB) | Rows |
|-------|-----------|------|
${infra.database.table_sizes.slice(0, 10).map(t => `| ${t.table_name} | ${t.size_mb} | ${t.row_count.toLocaleString()} |`).join('\n')}

${infra.upstash.is_configured ? `### Upstash Redis (Rate Limiting)
| Metric | Value |
|--------|-------|
| Estimated Commands | ${infra.upstash.total_commands.toLocaleString()} |
| Active Keys | ${infra.upstash.total_keys.toLocaleString()} |
| Storage | ${infra.upstash.memory_used_mb > 0 ? '~1 KB' : '0 KB'} (minimal, ephemeral keys) |

` : ''}
${api ? `## 📈 API Usage (Last ${this.apiUsagePeriod()})

| Metric | Value |
|--------|-------|
| Total Calls | ${api.total_calls.toLocaleString()} |
| Avg Calls/Day | ${api.avg_calls_per_day.toLocaleString()} |

### Top Endpoints
| Endpoint | Calls | Percentage |
|----------|-------|------------|
${api.top_endpoints.slice(0, 10).map(e => `| ${e.name} | ${e.calls.toLocaleString()} | ${e.percentage}% |`).join('\n')}

### Top Users
| User | Calls |
|------|-------|
${api.top_users.slice(0, 10).map(u => `| ${u.username} | ${u.calls.toLocaleString()} |`).join('\n')}
` : ''}

${alerts.length > 0 ? `## 🚨 Active Alerts (${alerts.length})

| Type | Severity | Message | Created |
|------|----------|---------|---------|
${alerts.map(a => `| ${a.alert_type} | ${a.severity} | ${a.message} | ${new Date(a.created_at).toLocaleString()} |`).join('\n')}
` : '## ✅ No Active Alerts'}

${snapshots.length > 0 ? `## 📅 Recent Snapshots (Last ${snapshots.length} days)

| Date | Users | DAU | Posts | Rides | Groups |
|------|-------|-----|-------|-------|--------|
${snapshots.slice(-7).map(s => `| ${s.date} | ${s.total_users.toLocaleString()} | ${s.dau.toLocaleString()} | ${s.total_posts.toLocaleString()} | ${s.active_rides.toLocaleString()} | ${s.active_groups.toLocaleString()} |`).join('\n')}
` : ''}

---
*Report generated from Wheelbase Admin Panel*
`;

    // Copy to clipboard
    navigator.clipboard.writeText(markdown).then(() => {
      alert('✅ Monitoring stats copied to clipboard!\n\nYou can now paste in GitHub, Notion, or any markdown editor.');
    }).catch((err) => {
      console.error('Failed to copy:', err);
      alert('❌ Failed to copy to clipboard. Please check console for details.');
    });
  }
}
