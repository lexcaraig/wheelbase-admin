import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../core/services/analytics.service';
import { UsersService } from '../../core/services/users.service';
import { AnalyticsResponse } from '../../core/models/analytics.model';
import { AppUser } from '../../core/models/user.model';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    SkeletonModule,
    ButtonModule,
    ToastModule,
    TableModule,
    AvatarModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    RelativeTimePipe
  ],
  providers: [MessageService],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  analytics = signal<AnalyticsResponse | null>(null);
  recentUsers = signal<AppUser[]>([]);
  isLoading = signal(true);

  private charts: Map<string, Chart> = new Map();
  private refreshInterval?: any;

  constructor(
    private analyticsService: AnalyticsService,
    private usersService: UsersService,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    await this.loadAnalytics();
    await this.loadRecentUsers();
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    this.stopAutoRefresh();
    this.destroyAllCharts();
  }

  async loadAnalytics() {
    try {
      this.isLoading.set(true);
      const data = await this.analyticsService.getDashboardMetrics();
      this.analytics.set(data);

      // Render charts after data loads
      setTimeout(() => {
        this.renderSparklines();
        this.renderSubscriptionChart();
        this.renderActivityChart();
      }, 100);
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to load analytics'
      });
      console.error('Analytics load error:', error);
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

  getSubscriptionSeverity(tier: string): 'success' | 'warn' | 'info' {
    switch (tier) {
      case 'premium': return 'warn';
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

  private renderSparklines() {
    if (!this.analytics()) return;

    // Sample data for sparklines
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

  private renderSubscriptionChart() {
    const canvas = document.getElementById('subscriptionChart') as HTMLCanvasElement;
    if (!canvas || !this.analytics()) return;

    this.destroyChart('subscriptionChart');

    const tiers = this.analytics()!.subscription_tiers;
    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: ['Free', 'Pro', 'Premium'],
        datasets: [{
          data: [tiers.free, tiers.pro, tiers.premium],
          backgroundColor: ['#3B82F6', '#8B5CF6', '#F59E0B'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: {
              usePointStyle: true,
              padding: 15
            }
          }
        }
      }
    };

    this.charts.set('subscriptionChart', new Chart(canvas, config));
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
    // Refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.loadAnalytics();
      this.loadRecentUsers();
    }, 30000);
  }

  private stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}
