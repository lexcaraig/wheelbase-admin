import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { VerificationService } from '../../core/services/verification.service';
import {
  VerificationRequest,
  ClaimStatus
} from '../../core/models/verification.model';
import { NotificationService } from '../../core/services/notification.service';
import { StatusBadgeComponent, BadgeSeverity } from '../../shared/components/status-badge/status-badge.component';
import { formatDateTime } from '../../shared/utils';
import { VerificationReviewDialogComponent } from './dialogs/verification-review-dialog.component';
import { DocumentViewerDialogComponent } from './dialogs/document-viewer-dialog.component';

@Component({
  selector: 'app-verification-queue',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    StatusBadgeComponent
  ],
  templateUrl: './verification-queue.component.html',
  styleUrl: './verification-queue.component.scss'
})
export class VerificationQueueComponent implements OnInit {
  requests = signal<VerificationRequest[]>([]);
  isLoading = signal(true);
  totalRecords = signal(0);
  pendingCount = signal(0);
  approvedCount = signal(0);
  rejectedCount = signal(0);

  // Table columns
  displayedColumns: string[] = ['business', 'owner', 'contact', 'location', 'documents', 'status', 'submitted', 'actions'];

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

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex);
    this.pageSize = event.pageSize;
    this.loadVerificationQueue();
  }

  onStatusFilterChange() {
    this.currentPage.set(0);
    this.loadVerificationQueue();
  }

  onStatusFilterChanged(value: ClaimStatus | 'all') {
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
}
