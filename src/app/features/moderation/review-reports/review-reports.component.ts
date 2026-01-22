import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ModerationService } from '../../../core/services/moderation.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  ReviewReport,
  ReviewReportStatus
} from '../../../core/models/content.model';
import { StatusBadgeComponent, BadgeSeverity } from '../../../shared/components/status-badge/status-badge.component';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { ReviewReportDialogComponent } from './dialogs/review-report-dialog.component';

@Component({
  selector: 'app-review-reports',
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
    MatProgressSpinnerModule,
    MatDialogModule,
    StatusBadgeComponent,
    RelativeTimePipe
  ],
  templateUrl: './review-reports.component.html',
  styleUrl: './review-reports.component.scss'
})
export class ReviewReportsComponent implements OnInit {
  reports = signal<ReviewReport[]>([]);
  isLoading = signal(true);
  totalRecords = signal(0);

  // Filters
  statusFilter: 'pending' | 'all' = 'pending';
  statusOptions = [
    { label: 'Pending Reports', value: 'pending' as const },
    { label: 'All Reports', value: 'all' as const }
  ];

  // Pagination
  page = 0;
  pageSize = 25;

  displayedColumns: string[] = ['reported', 'review', 'provider', 'reporter', 'reason', 'status', 'actions'];

  constructor(
    private moderationService: ModerationService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadReports();
  }

  async loadReports() {
    try {
      this.isLoading.set(true);
      const response = await this.moderationService.getReviewReports({
        page: this.page + 1,
        pageSize: this.pageSize,
        status: this.statusFilter
      });

      this.reports.set(response.reports);
      this.totalRecords.set(response.total);
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to load review reports');
    } finally {
      this.isLoading.set(false);
    }
  }

  onPageChange(event: PageEvent) {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadReports();
  }

  onStatusFilterChange(value: 'pending' | 'all') {
    this.statusFilter = value;
    this.page = 0;
    this.loadReports();
  }

  viewReport(report: ReviewReport) {
    const dialogRef = this.dialog.open(ReviewReportDialogComponent, {
      width: '700px',
      disableClose: true,
      data: { report }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadReports();
      }
    });
  }

  getReasonSeverity(reason: string): BadgeSeverity {
    switch (reason) {
      case 'spam': return 'info';
      case 'inappropriate': return 'warning';
      case 'fake': return 'warning';
      case 'offensive': return 'danger';
      default: return 'info';
    }
  }

  getStatusSeverity(status: ReviewReportStatus): BadgeSeverity {
    switch (status) {
      case 'pending': return 'warning';
      case 'reviewed':
      case 'actioned': return 'success';
      case 'dismissed': return 'info';
      default: return 'warning';
    }
  }

  getRatingStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
}
