import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { VerificationService } from '../../core/services/verification.service';
import {
  VerificationRequest,
  ClaimStatus,
  getRequestedSummary
} from '../../core/models/verification.model';
import { NotificationService } from '../../core/services/notification.service';
import { BadgeSeverity } from '../../shared/components/status-badge/status-badge.component';
import { formatDateTime } from '../../shared/utils';
import { VerificationReviewDialogComponent } from './dialogs/verification-review-dialog.component';
import { DocumentViewerDialogComponent } from './dialogs/document-viewer-dialog.component';

@Component({
  selector: 'app-verification-queue',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule
  ],
  templateUrl: './verification-queue.component.html',
  styles: []
})
export class VerificationQueueComponent implements OnInit {
  requests = signal<VerificationRequest[]>([]);
  isLoading = signal(true);
  totalRecords = signal(0);
  pendingCount = signal(0);
  approvedCount = signal(0);
  rejectedCount = signal(0);

  // Filters
  statusFilter = signal<ClaimStatus | 'all'>('all');
  statusOptions = [
    { label: 'All Requests', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' }
  ];

  // Pagination
  currentPage = signal(0);
  pageSize = 20;
  pageSizeOptions = [10, 20, 50];

  constructor(
    private verificationService: VerificationService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadVerificationQueue();
  }

  async loadVerificationQueue() {
    try {
      this.isLoading.set(true);
      const response = await this.verificationService.getVerificationQueue({
        status: this.statusFilter(),
        page: this.currentPage() + 1, // API uses 1-based
        pageSize: this.pageSize
      });

      this.requests.set(response.requests);
      this.totalRecords.set(response.total);
      this.pendingCount.set(response.pending);
      this.approvedCount.set(response.approved);
      this.rejectedCount.set(response.rejected);
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to load verification requests');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Pagination methods
  getTotalPages(): number {
    return Math.ceil(this.totalRecords() / this.pageSize);
  }

  getPageRangeLabel(): string {
    const start = this.currentPage() * this.pageSize + 1;
    const end = Math.min((this.currentPage() + 1) * this.pageSize, this.totalRecords());
    return `${start} - ${end} of ${this.totalRecords()}`;
  }

  firstPage(): void {
    this.currentPage.set(0);
    this.loadVerificationQueue();
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadVerificationQueue();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.getTotalPages() - 1) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadVerificationQueue();
    }
  }

  lastPage(): void {
    this.currentPage.set(this.getTotalPages() - 1);
    this.loadVerificationQueue();
  }

  onPageSizeChange(): void {
    this.currentPage.set(0);
    this.loadVerificationQueue();
  }

  onStatusFilterChange(value: ClaimStatus | 'all') {
    this.statusFilter.set(value);
    this.currentPage.set(0);
    this.loadVerificationQueue();
  }

  openReviewDialog(request: VerificationRequest) {
    const dialogRef = this.dialog.open(VerificationReviewDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { request, verificationService: this.verificationService }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadVerificationQueue();
      }
    });
  }

  viewDocument(url: string | null, title: string) {
    if (!url) {
      this.notificationService.warn('No Document', 'This document was not uploaded');
      return;
    }

    const fullUrl = this.verificationService.getDocumentUrl(url);
    if (!fullUrl) {
      this.notificationService.error('Error', 'Failed to load document URL');
      return;
    }

    this.dialog.open(DocumentViewerDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      data: { url: fullUrl, title }
    });
  }

  getStatusSeverity(status: ClaimStatus): BadgeSeverity {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'danger';
      default:
        return 'warning';
    }
  }

  getStatusBadgeClass(status: ClaimStatus): string {
    switch (status) {
      case 'approved':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'rejected':
        return 'badge-error';
      default:
        return 'badge-warning';
    }
  }

  getStatusLabel(status: ClaimStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  hasDocuments(request: VerificationRequest): boolean {
    return !!(
      request.business_permit_url ||
      request.tax_id_document_url ||
      request.proof_of_ownership_url
    );
  }

  getDocumentCount(request: VerificationRequest): number {
    let count = 0;
    if (request.business_permit_url) count++;
    if (request.tax_id_document_url) count++;
    if (request.proof_of_ownership_url) count++;
    return count;
  }

  formatDate(dateString: string | null): string {
    return formatDateTime(dateString);
  }

  /**
   * Returns a short display label for the merchant's requested plan, or null
   * if no request was made at signup. Used by the "Requested" chip in the queue.
   */
  getRequestedLabel(request: VerificationRequest): string | null {
    const r = getRequestedSummary(request);
    if (!r) return null;
    const tier = r.tier === 'pro' ? 'Pro' : 'Enterprise';
    let periodAbbr: string;
    switch (r.billingPeriod) {
      case 'monthly': periodAbbr = 'mo'; break;
      case 'quarterly': periodAbbr = 'qtr'; break;
      default: periodAbbr = 'yr';
    }
    const amount = (r.amountCents / 100).toLocaleString('en-PH', { maximumFractionDigits: 0 });
    return `Requested: ${tier} (${r.billingPeriod}) ₱${amount}/${periodAbbr}`;
  }
}
