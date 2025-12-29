import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from '../../core/services/analytics.service';
import {
  AdvancedAnalyticsResponse,
  DateRangeParams,
  UserRetentionCohort,
  GeographicDistribution,
  PopularRoute,
  TrendingHashtag
} from '../../core/models/analytics.model';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-advanced-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    Select,
    DatePicker,
    ToastModule,
    SkeletonModule,
    TableModule,
    ChartModule,
    AvatarModule,
    TagModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './advanced-analytics.component.html',
  styleUrl: './advanced-analytics.component.scss'
})
export class AdvancedAnalyticsComponent implements OnInit {
  // State
  analyticsData = signal<AdvancedAnalyticsResponse | null>(null);
  isLoading = signal(true);
  selectedDateRange = signal<DateRangeParams | null>(null);

  // Date range options
  dateRangePresets: { label: string; value: DateRangeParams }[] = [];
  selectedPreset: { label: string; value: DateRangeParams } | null = null;
  customDateRange: Date[] | null = null;

  // Charts
  deviceBreakdownData: any = null;
  deviceBreakdownOptions: any = null;
  activeByHourData: any = null;
  activeByHourOptions: any = null;
  rideParticipationData: any = null;
  rideParticipationOptions: any = null;
  engagementData: any = null;
  engagementOptions: any = null;

  constructor(
    private analyticsService: AnalyticsService,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    this.dateRangePresets = this.analyticsService.getDateRangePresets();
    this.selectedPreset = this.dateRangePresets[1]; // Default: Last 30 Days
    this.selectedDateRange.set(this.selectedPreset.value);

    await this.loadAnalytics();
    this.initializeCharts();
  }

  async loadAnalytics() {
    try {
      this.isLoading.set(true);
      const dateRange = this.selectedDateRange();

      if (!dateRange) {
        throw new Error('Date range not selected');
      }

      const data = await this.analyticsService.getAdvancedAnalytics(dateRange);
      this.analyticsData.set(data);

      // Update charts
      this.updateAllCharts();

    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to load advanced analytics'
      });
      console.error('Analytics load error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  onPresetChange(preset: { label: string; value: DateRangeParams }) {
    this.selectedPreset = preset;
    this.selectedDateRange.set(preset.value);
    this.customDateRange = null;
    this.loadAnalytics();
  }

  onCustomDateRangeChange(dates: Date | Date[] | null) {
    if (Array.isArray(dates) && dates.length === 2 && dates[0] && dates[1]) {
      const dateRange: DateRangeParams = {
        startDate: dates[0].toISOString().split('T')[0],
        endDate: dates[1].toISOString().split('T')[0]
      };
      this.selectedDateRange.set(dateRange);
      this.selectedPreset = null;
      this.loadAnalytics();
    }
  }

  initializeCharts() {
    // Device Breakdown Chart Options
    this.deviceBreakdownOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 10,
          right: 10,
          bottom: 10,
          left: 10
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 10,
            font: {
              size: 11
            }
          }
        }
      }
    };

    // Active by Hour Chart Options
    this.activeByHourOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 10,
          right: 10,
          bottom: 10,
          left: 10
        }
      },
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            font: {
              size: 10
            }
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          ticks: {
            font: {
              size: 10
            },
            maxRotation: 0
          },
          grid: {
            display: false
          }
        }
      }
    };

    // Ride Participation Options
    this.rideParticipationOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 10,
          right: 10,
          bottom: 10,
          left: 10
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            padding: 10,
            font: {
              size: 11
            }
          }
        }
      }
    };

    // Engagement Options
    this.engagementOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 10,
          right: 10,
          bottom: 10,
          left: 10
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            padding: 10,
            font: {
              size: 11
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            font: {
              size: 10
            }
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          ticks: {
            font: {
              size: 10
            },
            maxRotation: 0
          },
          grid: {
            display: false
          }
        }
      }
    };
  }

  updateAllCharts() {
    const data = this.analyticsData();
    if (!data) return;

    // Device Breakdown Chart
    this.deviceBreakdownData = {
      labels: ['iOS', 'Android', 'Web'],
      datasets: [{
        data: [
          data.device_breakdown.ios,
          data.device_breakdown.android,
          data.device_breakdown.web
        ],
        backgroundColor: ['#3B82F6', '#10B981', '#8B5CF6'],
        borderWidth: 0
      }]
    };

    // Active by Hour Chart
    this.activeByHourData = {
      labels: data.active_by_hour.map(h => `${h.hour}:00`),
      datasets: [{
        label: 'Active Users',
        data: data.active_by_hour.map(h => h.user_count),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };

    // Ride Participation Chart
    this.rideParticipationData = {
      labels: ['Solo Rides', 'Group Rides'],
      datasets: [{
        data: [
          data.ride_participation.solo_rides,
          data.ride_participation.group_rides
        ],
        backgroundColor: ['#F59E0B', '#8B5CF6'],
        borderWidth: 0
      }]
    };

    // Engagement Chart
    const last30Days = data.post_engagement.slice(-30);
    this.engagementData = {
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
    };
  }

  // Export functions
  exportCSV() {
    const data = this.analyticsData();
    if (!data) return;

    const dateRange = this.selectedDateRange();
    if (!dateRange) return;

    // Export user growth
    this.analyticsService.exportToCSV(
      data.user_growth_detailed,
      `user-growth-${dateRange.startDate}-to-${dateRange.endDate}`
    );

    this.messageService.add({
      severity: 'success',
      summary: 'Export Successful',
      detail: 'Data exported to CSV'
    });
  }

  exportJSON() {
    const data = this.analyticsData();
    if (!data) return;

    const dateRange = this.selectedDateRange();
    if (!dateRange) return;

    this.analyticsService.exportToJSON(
      data,
      `advanced-analytics-${dateRange.startDate}-to-${dateRange.endDate}`
    );

    this.messageService.add({
      severity: 'success',
      summary: 'Export Successful',
      detail: 'Data exported to JSON'
    });
  }

  exportPDF() {
    const data = this.analyticsData();
    const dateRange = this.selectedDateRange();

    if (!data || !dateRange) return;

    this.analyticsService.exportToPDF(
      data,
      dateRange,
      `wheelbase-analytics-report-${dateRange.startDate}-to-${dateRange.endDate}`
    );

    this.messageService.add({
      severity: 'success',
      summary: 'Export Successful',
      detail: 'Report exported to PDF'
    });
  }

  getRetentionSeverity(percentage: number): 'success' | 'warn' | 'danger' | 'secondary' {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warn';
    if (percentage >= 40) return 'secondary';
    return 'danger';
  }
}
