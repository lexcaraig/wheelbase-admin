import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from '../../core/services/analytics.service';
import { UsersService } from '../../core/services/users.service';
import { MonitoringService, InfrastructureMetrics } from '../../core/services/monitoring.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  AnalyticsResponse,
  AdvancedAnalyticsResponse,
  DateRangeParams
} from '../../core/models/analytics.model';
import { AppUser } from '../../core/models/user.model';

// Angular Material imports removed - now using DaisyUI

// Shared components
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';

import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    // Shared components
    StatusBadgeComponent,
    AvatarComponent,
    RelativeTimePipe,
    DatePipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Overview tab data
  analytics = signal<AnalyticsResponse | null>(null);
  recentUsers = signal<AppUser[]>([]);
  isLoading = signal(true);
  loadError = signal<string | null>(null);

  // Monitoring metrics
  infrastructureMetrics = signal<InfrastructureMetrics | null>(null);
  growthPercentages = signal<{
    posts: number;
    rides: number;
    groups: number;
  }>({ posts: 0, rides: 0, groups: 0 });

  // Advanced Analytics tab data
  advancedData = signal<AdvancedAnalyticsResponse | null>(null);
  isLoadingAdvanced = signal(false);
  selectedDateRange = signal<DateRangeParams | null>(null);
  dateRangePresets: { label: string; value: DateRangeParams }[] = [];
  selectedPreset: { label: string; value: DateRangeParams } | null = null;
  customDateRange: { start: Date | null; end: Date | null } = { start: null, end: null };

  // Tab state
  activeTabIndex = signal(0);

  // Table display columns
  recentUsersColumns: string[] = ['id', 'user', 'joined', 'subscription'];
  retentionColumns: string[] = ['cohort', 'users', 'day0', 'day1', 'day7', 'day30'];
  routesColumns: string[] = ['route', 'rides', 'distance'];
  hashtagsColumns: string[] = ['hashtag', 'posts', 'growth'];
  topUsersColumns: string[] = ['user', 'posts', 'rides', 'score'];

  private charts: Map<string, Chart> = new Map();
  private refreshInterval?: ReturnType<typeof setInterval>;

  constructor(
    private analyticsService: AnalyticsService,
    private usersService: UsersService,
    private monitoringService: MonitoringService,
    private notificationService: NotificationService
  ) {}

  async ngOnInit() {
    // Initialize date range presets
    this.dateRangePresets = this.analyticsService.getDateRangePresets();
    this.selectedPreset = this.dateRangePresets[1]; // Default: Last 30 Days
    this.selectedDateRange.set(this.selectedPreset.value);

    // Load overview data
    await this.loadAnalytics();
    await this.loadRecentUsers();
    await this.loadMonitoringMetrics();
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    this.stopAutoRefresh();
    this.destroyAllCharts();
  }

  // ==========================================
  // Tab Change Handler
  // ==========================================

  onTabChange(index: number) {
    this.activeTabIndex.set(index);

    // Load advanced analytics when switching to that tab
    if (index === 1 && !this.advancedData()) {
      this.loadAdvancedAnalytics();
    }
  }

  // ==========================================
  // Overview Tab Methods
  // ==========================================

  async loadAnalytics() {
    try {
      this.isLoading.set(true);
      this.loadError.set(null);
      const data = await this.analyticsService.getDashboardMetrics();
      this.analytics.set(data);

      // Render charts after data loads
      setTimeout(() => {
        this.renderSparklines();
        this.renderActivityChart();
      }, 100);
    } catch (error: any) {
      this.loadError.set(error.message || 'Failed to load analytics');
      this.notificationService.error('Error', error.message || 'Failed to load analytics');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadRecentUsers() {
    try {
      const response = await this.usersService.getUsers({
        page: 1,
        pageSize: 5
      });
      this.recentUsers.set(response.users);
    } catch (error: any) {
      console.error('Failed to load recent users:', error);
    }
  }

  async loadMonitoringMetrics() {
    try {
      const metrics = await this.monitoringService.getInfrastructureMetrics().toPromise();
      this.infrastructureMetrics.set(metrics || null);

      const snapshots = await this.monitoringService.getSnapshots(7).toPromise();

      if (snapshots && snapshots.length >= 2 && metrics) {
        const today = snapshots[snapshots.length - 1];
        const yesterday = snapshots[snapshots.length - 2];

        const postsGrowth = yesterday.total_posts > 0
          ? ((metrics.content.total_posts - yesterday.total_posts) / yesterday.total_posts) * 100
          : 0;

        const ridesGrowth = yesterday.active_rides > 0
          ? ((metrics.content.active_rides - yesterday.active_rides) / yesterday.active_rides) * 100
          : 0;

        const groupsGrowth = yesterday.active_groups > 0
          ? ((metrics.content.active_groups - yesterday.active_groups) / yesterday.active_groups) * 100
          : 0;

        this.growthPercentages.set({
          posts: Math.round(postsGrowth * 10) / 10,
          rides: Math.round(ridesGrowth * 10) / 10,
          groups: Math.round(groupsGrowth * 10) / 10
        });
      }
    } catch (error: any) {
      console.error('Failed to load monitoring metrics:', error);
    }
  }

  getSubscriptionSeverity(tier: string): 'success' | 'warning' | 'info' {
    switch (tier) {
      case 'premium': return 'warning';
      case 'pro': return 'info';
      default: return 'success';
    }
  }

  getCountryName(countryCode: string): string {
    const countryNames: Record<string, string> = {
      'PH': 'Philippines',
      'ID': 'Indonesia',
      'TH': 'Thailand',
      'VN': 'Vietnam',
      'MY': 'Malaysia',
      'SG': 'Singapore'
    };
    return countryNames[countryCode] || countryCode;
  }

  // ==========================================
  // Advanced Analytics Tab Methods
  // ==========================================

  async loadAdvancedAnalytics() {
    try {
      this.isLoadingAdvanced.set(true);
      const dateRange = this.selectedDateRange();

      if (!dateRange) {
        throw new Error('Date range not selected');
      }

      const data = await this.analyticsService.getAdvancedAnalytics(dateRange);
      this.advancedData.set(data);

      // Update charts
      setTimeout(() => this.updateAdvancedCharts(), 100);
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to load advanced analytics');
    } finally {
      this.isLoadingAdvanced.set(false);
    }
  }

  onPresetChange(preset: { label: string; value: DateRangeParams }) {
    this.selectedPreset = preset;
    this.selectedDateRange.set(preset.value);
    this.customDateRange = { start: null, end: null };
    this.loadAdvancedAnalytics();
  }

  onCustomDateRangeChange() {
    if (this.customDateRange.start && this.customDateRange.end) {
      const dateRange: DateRangeParams = {
        startDate: this.customDateRange.start.toISOString().split('T')[0],
        endDate: this.customDateRange.end.toISOString().split('T')[0]
      };
      this.selectedDateRange.set(dateRange);
      this.selectedPreset = null;
      this.loadAdvancedAnalytics();
    }
  }

  onStartDateChange(dateString: string) {
    this.customDateRange.start = dateString ? new Date(dateString) : null;
  }

  onEndDateChange(dateString: string) {
    this.customDateRange.end = dateString ? new Date(dateString) : null;
    this.onCustomDateRangeChange();
  }

  getMobilePercentage(device: 'ios' | 'android'): string | null {
    const data = this.advancedData();
    if (!data?.device_breakdown) return null;

    const breakdown = data.device_breakdown;
    const total = (breakdown.ios ?? 0) + (breakdown.android ?? 0);

    if (total === 0) return '0';

    const value = breakdown[device] ?? 0;
    return ((value / total) * 100).toFixed(1);
  }

  getSubscriptionPercentage(tier: 'free' | 'pro' | 'premium'): string | null {
    const data = this.analytics();
    if (!data?.subscription_tiers) return null;

    const tiers = data.subscription_tiers;
    const total = (tiers.free ?? 0) + (tiers.pro ?? 0) + (tiers.premium ?? 0);

    if (total === 0) return '0';

    const value = tiers[tier] ?? 0;
    return ((value / total) * 100).toFixed(1);
  }

  getRetentionSeverity(percentage: number): 'success' | 'warning' | 'danger' | 'secondary' {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    if (percentage >= 40) return 'secondary';
    return 'danger';
  }

  // Export functions
  exportCSV() {
    const data = this.advancedData();
    if (!data) return;

    const dateRange = this.selectedDateRange();
    if (!dateRange) return;

    this.analyticsService.exportToCSV(
      data.user_growth_detailed,
      `user-growth-${dateRange.startDate}-to-${dateRange.endDate}`
    );

    this.notificationService.success('Export Successful', 'Data exported to CSV');
  }

  exportJSON() {
    const data = this.advancedData();
    if (!data) return;

    const dateRange = this.selectedDateRange();
    if (!dateRange) return;

    this.analyticsService.exportToJSON(
      data,
      `advanced-analytics-${dateRange.startDate}-to-${dateRange.endDate}`
    );

    this.notificationService.success('Export Successful', 'Data exported to JSON');
  }

  exportPDF() {
    const data = this.advancedData();
    const dateRange = this.selectedDateRange();

    if (!data || !dateRange) return;

    this.analyticsService.exportToPDF(
      data,
      dateRange,
      `wheelbase-analytics-report-${dateRange.startDate}-to-${dateRange.endDate}`
    );

    this.notificationService.success('Export Successful', 'Report exported to PDF');
  }

  // ==========================================
  // Chart Rendering - Overview
  // ==========================================

  private renderSparklines() {
    if (!this.analytics()) return;

    const sparklineData = [12, 19, 3, 5, 2, 3, 9, 15, 12, 17];

    this.renderSparkline('spark-users', sparklineData, '#3B82F6');
    this.renderSparkline('spark-posts', sparklineData.map(v => v * 1.2), '#10B981');
    this.renderSparkline('spark-rides', sparklineData.map(v => v * 0.8), '#8B5CF6');
    this.renderSparkline('spark-groups', sparklineData.map(v => v * 0.5), '#F59E0B');
  }

  private renderSparkline(canvasId: string, data: number[], color: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    this.destroyChart(canvasId);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: data.map((_, i) => i),
        datasets: [{
          data: data,
          borderColor: color,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          x: { display: false },
          y: { display: false }
        }
      }
    };

    this.charts.set(canvasId, new Chart(canvas, config));
  }

  private renderActivityChart() {
    const canvas = document.getElementById('activityChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics()) return;

    this.destroyChart('activityChart');

    const data = this.analytics()!.ride_activity.slice(-7);
    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: data.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        datasets: [{
          label: 'Rides',
          data: data.map(d => d.rides_count),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    };

    this.charts.set('activityChart', new Chart(canvas, config));
  }

  // ==========================================
  // Chart Rendering - Advanced Analytics
  // ==========================================

  private updateAdvancedCharts() {
    const data = this.advancedData();
    if (!data) return;

    // Active by Hour Chart
    const activeByHourCanvas = document.getElementById('activeByHourChart') as HTMLCanvasElement;
    if (activeByHourCanvas) {
      this.destroyChart('activeByHourChart');
      const activeByHour = data.active_by_hour || [];
      const config: ChartConfiguration = {
        type: 'line',
        data: {
          labels: activeByHour.map(h => `${h.hour}:00`),
          datasets: [{
            label: 'Active Users',
            data: activeByHour.map(h => h.user_count ?? 0),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { font: { size: 10 } }, grid: { display: true, color: 'rgba(0, 0, 0, 0.05)' } },
            x: { ticks: { font: { size: 10 }, maxRotation: 0 }, grid: { display: false } }
          }
        }
      };
      this.charts.set('activeByHourChart', new Chart(activeByHourCanvas, config));
    }

    // Ride Participation Chart
    const rideParticipationCanvas = document.getElementById('rideParticipationChart') as HTMLCanvasElement;
    if (rideParticipationCanvas) {
      this.destroyChart('rideParticipationChart');
      const rideParticipation = data.ride_participation || { solo_rides: 0, group_rides: 0 };
      const config: ChartConfiguration = {
        type: 'doughnut',
        data: {
          labels: ['Solo Rides', 'Group Rides'],
          datasets: [{
            data: [rideParticipation.solo_rides ?? 0, rideParticipation.group_rides ?? 0],
            backgroundColor: ['#F59E0B', '#8B5CF6'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: 'bottom', labels: { padding: 10, font: { size: 11 } } }
          }
        }
      };
      this.charts.set('rideParticipationChart', new Chart(rideParticipationCanvas, config));
    }

    // Engagement Chart
    const engagementCanvas = document.getElementById('engagementChart') as HTMLCanvasElement;
    if (engagementCanvas) {
      this.destroyChart('engagementChart');
      const postEngagement = data.post_engagement || [];
      const last30Days = postEngagement.slice(-30);
      const config: ChartConfiguration = {
        type: 'line',
        data: {
          labels: last30Days.map(e => {
            const date = new Date(e.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }),
          datasets: [
            {
              label: 'Posts',
              data: last30Days.map(e => e.total_posts),
              borderColor: '#3B82F6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Engagement Rate',
              data: last30Days.map(e => e.avg_engagement_rate * 100),
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.4,
              fill: true,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: 'top', labels: { padding: 10, font: { size: 11 } } }
          },
          scales: {
            y: { beginAtZero: true, ticks: { font: { size: 10 } }, grid: { display: true, color: 'rgba(0, 0, 0, 0.05)' } },
            y1: { beginAtZero: true, position: 'right', ticks: { font: { size: 10 } }, grid: { display: false } },
            x: { ticks: { font: { size: 10 }, maxRotation: 0 }, grid: { display: false } }
          }
        }
      };
      this.charts.set('engagementChart', new Chart(engagementCanvas, config));
    }
  }

  // ==========================================
  // Chart Management
  // ==========================================

  private destroyChart(chartId: string) {
    const chart = this.charts.get(chartId);
    if (chart) {
      chart.destroy();
      this.charts.delete(chartId);
    }
  }

  private destroyAllCharts() {
    this.charts.forEach(chart => chart.destroy());
    this.charts.clear();
  }

  private startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      this.loadAnalytics();
      this.loadRecentUsers();
      this.loadMonitoringMetrics();
    }, 30000);
  }

  private stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}
