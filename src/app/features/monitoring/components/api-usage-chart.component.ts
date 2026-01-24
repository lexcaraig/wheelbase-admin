import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ApiUsageMetrics } from '../../../core/services/monitoring.service';

Chart.register(...registerables);

@Component({
  selector: 'app-api-usage-chart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card bg-base-200 shadow p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-base-content">API Usage Breakdown</h2>
        <select
          [(ngModel)]="selectedPeriod"
          (ngModelChange)="onPeriodChange($event)"
          class="border border-base-300 rounded px-3 py-1 text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div class="bg-base-300 rounded p-3">
          <p class="text-xs text-base-content/70">Total Calls</p>
          <p class="text-2xl font-bold">{{ metrics.total_calls | number }}</p>
        </div>
        <div class="bg-base-300 rounded p-3">
          <p class="text-xs text-base-content/70">Avg Calls/Day</p>
          <p class="text-2xl font-bold">{{ metrics.avg_calls_per_day | number }}</p>
        </div>
      </div>

      <!-- Chart -->
      <div class="relative" style="height: 200px;">
        <canvas #chartCanvas></canvas>
      </div>

      <!-- Top Endpoints -->
      <div class="mt-4">
        <h3 class="text-sm font-semibold text-base-content/80 mb-2">Top Endpoints</h3>
        <div class="space-y-2">
          <div
            *ngFor="let endpoint of metrics.top_endpoints.slice(0, 5)"
            class="flex justify-between items-center text-sm"
          >
            <span class="text-base-content/80">{{ endpoint.name }}</span>
            <div class="flex items-center gap-2">
              <span class="text-base-content/70">{{ endpoint.calls | number }}</span>
              <span class="text-base-content/60">({{ endpoint.percentage }}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ApiUsageChartComponent implements AfterViewInit, OnChanges {
  @Input() metrics!: ApiUsageMetrics;
  @Input() period: '7d' | '30d' | '90d' = '7d';
  @Output() periodChanged = new EventEmitter<'7d' | '30d' | '90d'>();

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  selectedPeriod: '7d' | '30d' | '90d' = '7d';
  private chart?: Chart;

  ngAfterViewInit() {
    this.selectedPeriod = this.period;
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['metrics'] && !changes['metrics'].firstChange) {
      this.renderChart();
    }
    if (changes['period']) {
      this.selectedPeriod = this.period;
    }
  }

  onPeriodChange(period: '7d' | '30d' | '90d') {
    this.periodChanged.emit(period);
  }

  private renderChart() {
    if (!this.chartCanvas || !this.metrics) {
      return;
    }

    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.metrics.hourly_pattern.map(h => `${h.hour}:00`);
    const data = this.metrics.hourly_pattern.map(h => h.calls);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'API Calls',
            data,
            backgroundColor: 'rgba(234, 179, 8, 0.7)',
            borderColor: '#EAB308',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Calls: ${context.parsed.y?.toLocaleString() || 0}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value.toLocaleString();
              }
            }
          },
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }
}
