import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModerationService } from '../../../core/services/moderation.service';
import {
  ReviewReport,
  ReviewModerationAction,
  ReviewReportStatus
} from '../../../core/models/content.model';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-review-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    RelativeTimePipe
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './review-reports.component.html',
  styleUrl: './review-reports.component.scss'
})
export class ReviewReportsComponent implements OnInit {
  reports = signal<ReviewReport[]>([]);
  isLoading = signal(true);
  totalRecords = signal(0);

  // Filters
  statusFilter = signal<'pending' | 'all'>('pending');
  statusOptions = [
    { label: 'Pending Reports', value: 'pending' },
    { label: 'All Reports', value: 'all' }
  ];

  // Pagination
  currentPage = signal(1);
  pageSize = 25;

  // Action Dialog
  showActionDialog = signal(false);
  selectedReport = signal<ReviewReport | null>(null);
  selectedAction = signal<ReviewModerationAction | null>(null);
  adminNotes = signal('');
  isProcessing = signal(false);

  actionOptions = [
    { label: 'Dismiss Report', value: 'dismiss', icon: 'pi pi-times-circle', color: 'secondary' },
    { label: 'Hide Review', value: 'hide_review', icon: 'pi pi-eye-slash', color: 'warn' },
    { label: 'Ban User', value: 'ban_user', icon: 'pi pi-ban', color: 'danger' }
  ];

  constructor(
    private moderationService: ModerationService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadReports();
  }

  async loadReports() {
    try {
      this.isLoading.set(true);
      const response = await this.moderationService.getReviewReports({
        page: this.currentPage(),
        pageSize: this.pageSize,
        status: this.statusFilter()
      });

      this.reports.set(response.reports);
      this.totalRecords.set(response.total);
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to load review reports'
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  onPageChange(event: any) {
    this.currentPage.set(event.page + 1);
    this.loadReports();
  }

  onStatusFilterChange() {
    this.currentPage.set(1);
    this.loadReports();
  }

  viewReport(report: ReviewReport) {
    this.selectedReport.set(report);
    this.selectedAction.set(null);
    this.adminNotes.set('');
    this.showActionDialog.set(true);
  }

  confirmAction() {
    const action = this.selectedAction();
    const report = this.selectedReport();

    if (!action || !report) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select an action'
      });
      return;
    }

    const actionLabel = this.getActionLabel(action);

    this.confirmationService.confirm({
      message: `Are you sure you want to ${actionLabel.toLowerCase()}? This action cannot be undone.`,
      header: actionLabel,
      icon: this.getActionIcon(action),
      acceptButtonStyleClass: `p-button-${this.getActionColor(action)}`,
      accept: () => {
        this.moderateReport(report, action);
      }
    });
  }

  async moderateReport(report: ReviewReport, action: ReviewModerationAction) {
    try {
      this.isProcessing.set(true);
      await this.moderationService.moderateReviewReport({
        report_id: report.id,
        action,
        admin_notes: this.adminNotes() || undefined
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `${this.getActionLabel(action)} completed successfully`
      });

      this.showActionDialog.set(false);
      this.loadReports();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to moderate report'
      });
    } finally {
      this.isProcessing.set(false);
    }
  }

  getReasonColor(reason: string): 'info' | 'warn' | 'danger' | 'success' {
    switch (reason) {
      case 'spam':
        return 'info';
      case 'inappropriate':
        return 'warn';
      case 'fake':
        return 'warn';
      case 'offensive':
        return 'danger';
      default:
        return 'info';
    }
  }

  getStatusColor(status: ReviewReportStatus): 'warn' | 'success' | 'info' {
    switch (status) {
      case 'pending':
        return 'warn';
      case 'reviewed':
      case 'actioned':
        return 'success';
      case 'dismissed':
        return 'info';
      default:
        return 'warn';
    }
  }

  getActionLabel(action: ReviewModerationAction): string {
    switch (action) {
      case 'dismiss':
        return 'Dismiss Report';
      case 'hide_review':
        return 'Hide Review';
      case 'ban_user':
        return 'Ban User';
      default:
        return '';
    }
  }

  getActionIcon(action: ReviewModerationAction): string {
    switch (action) {
      case 'dismiss':
        return 'pi pi-times-circle';
      case 'hide_review':
        return 'pi pi-eye-slash';
      case 'ban_user':
        return 'pi pi-ban';
      default:
        return 'pi pi-question';
    }
  }

  getActionColor(action: ReviewModerationAction): 'secondary' | 'warn' | 'danger' {
    switch (action) {
      case 'dismiss':
        return 'secondary';
      case 'hide_review':
        return 'warn';
      case 'ban_user':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getRatingStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
}
