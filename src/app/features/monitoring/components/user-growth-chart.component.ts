import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { MonitoringSnapshot } from '../../../core/services/monitoring.service';

Chart.register(...registerables);

@Component({
  selector: 'app-user-growth-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card bg-base-200 shadow p-6">
      <h2 class="text-xl font-bold text-base-content mb-4">User Growth Trends</h2>
      <div class="relative" style="height: 300px;">
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `
})
export class UserGrowthChartComponent implements AfterViewInit, OnChanges {
  @Input() snapshots: MonitoringSnapshot[] = [];
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;

  ngAfterViewInit() {
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['snapshots'] && !changes['snapshots'].firstChange) {
      this.renderChart();
    }
  }

  private renderChart() {
    if (!this.chartCanvas || this.snapshots.length === 0) {
      return;
    }

    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.snapshots.map(s => new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const totalUsers = this.snapshots.map(s => s.total_users);
    const dau = this.snapshots.map(s => s.dau);
    const mau = this.snapshots.map(s => s.mau);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Total Users',
            data: totalUsers,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'DAU',
            data: dau,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'MAU',
            data: mau,
            borderColor: '#F59E0B',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
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
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }
}
