import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeletionFeedbackService } from '../../core/services/deletion-feedback.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  DeletionFeedbackEntry,
  DeletionFeedbackStats,
  DELETION_REASONS
} from '../../core/models/deletion-feedback.model';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-deletion-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule, RelativeTimePipe],
  templateUrl: './deletion-feedback.component.html'
})
export class DeletionFeedbackComponent implements OnInit, OnDestroy {
  feedbackList = signal<DeletionFeedbackEntry[]>([]);
  stats = signal<DeletionFeedbackStats | null>(null);
  isLoading = signal(true);
  isLoadingStats = signal(true);
  totalRecords = signal(0);
  currentPage = signal(1);
  pageSize = 25;

  reasonFilter = 'all';
  searchQuery = '';
  deletionReasons = DELETION_REASONS;

  private reasonChart: Chart | null = null;

  constructor(
    private feedbackService: DeletionFeedbackService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadStats();
    this.loadFeedback();
  }

  ngOnDestroy() {
    this.reasonChart?.destroy();
  }

  async loadStats() {
    try {
      this.isLoadingStats.set(true);
      const data = await this.feedbackService.getStats();
      this.stats.set(data);
      setTimeout(() => this.renderChart(), 100);
    } catch (error: any) {
      this.notificationService.error('Error', error.message);
    } finally {
      this.isLoadingStats.set(false);
    }
  }

  async loadFeedback() {
    try {
      this.isLoading.set(true);
      const result = await this.feedbackService.getFeedback({
        page: this.currentPage(),
        pageSize: this.pageSize,
        reason: this.reasonFilter,
        search: this.searchQuery.trim() || undefined
      });
      this.feedbackList.set(result.entries);
      this.totalRecords.set(result.total);
    } catch (error: any) {
      this.notificationService.error('Error', error.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadFeedback();
  }

  nextPage() {
    if (this.currentPage() < this.getTotalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadFeedback();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadFeedback();
    }
  }

  getTotalPages(): number {
    return Math.max(1, Math.ceil(this.totalRecords() / this.pageSize));
  }

  getPageRange(): string {
    const from = (this.currentPage() - 1) * this.pageSize + 1;
    const to = Math.min(this.currentPage() * this.pageSize, this.totalRecords());
    return `${from}-${to} of ${this.totalRecords()}`;
  }

  getTopReason(): string {
    const s = this.stats();
    if (!s || s.reason_breakdown.length === 0) return 'N/A';
    return this.getReasonLabel(s.reason_breakdown[0].reason);
  }

  getReasonLabel(reason: string): string {
    const found = DELETION_REASONS.find(r => r.value === reason);
    return found ? found.label : reason;
  }

  getReasonBadgeClass(reason: string): string {
    const classMap: Record<string, string> = {
      'not_useful': 'badge-warning',
      'too_expensive': 'badge-error',
      'privacy_concerns': 'badge-error',
      'found_alternative': 'badge-info',
      'too_many_bugs': 'badge-warning',
      'not_enough_users': 'badge-info',
      'other': 'badge-ghost'
    };
    return classMap[reason] || 'badge-ghost';
  }

  private renderChart() {
    const s = this.stats();
    if (!s || s.reason_breakdown.length === 0) return;

    const canvas = document.getElementById('reasonChart') as HTMLCanvasElement;
    if (!canvas) return;

    this.reasonChart?.destroy();

    const colors = ['#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6', '#10B981', '#EC4899', '#6B7280'];

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: s.reason_breakdown.map(r => this.getReasonLabel(r.reason)),
        datasets: [{
          data: s.reason_breakdown.map(r => r.count),
          backgroundColor: colors.slice(0, s.reason_breakdown.length),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'right', labels: { padding: 12, font: { size: 12 } } }
        }
      }
    };

    this.reasonChart = new Chart(canvas, config);
  }
}
