import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VerificationService } from '../../core/services/verification.service';
import {
  VerificationRequest,
  ClaimStatus
} from '../../core/models/verification.model';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { RadioButton } from 'primeng/radiobutton';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';

@Component({
  selector: 'app-verification-queue',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    DialogModule,
    ToastModule,
    Select,
    Textarea,
    RadioButton,
    ConfirmDialog
  ],
  providers: [MessageService, ConfirmationService],
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

  // Filters
  statusFilter = signal<ClaimStatus | 'all'>('all');
  statusOptions = [
    { label: 'All Requests', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' }
  ];

  // Pagination
  currentPage = signal(1);
  pageSize = 20;

  // Review Dialog
  showReviewDialog = signal(false);
  selectedRequest = signal<VerificationRequest | null>(null);
  reviewAction: 'approve' | 'reject' | null = null;  // Regular property for ngModel
  rejectionReason = '';  // Regular property for ngModel
  adminNotes = '';  // Regular property for ngModel
  isProcessing = signal(false);

  // Document Viewer Dialog
  showDocumentViewer = signal(false);
  currentDocument = signal<{ url: string; title: string } | null>(null);

  constructor(
    private verificationService: VerificationService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    console.log('🔵 VerificationQueueComponent initialized');
    this.loadVerificationQueue();
  }

  async loadVerificationQueue() {
    try {
      console.log('🔵 Loading verification queue...');
      this.isLoading.set(true);
      const response = await this.verificationService.getVerificationQueue({
        status: this.statusFilter(),
        page: this.currentPage(),
        pageSize: this.pageSize
      });

      console.log('✅ Got response:', response);
      this.requests.set(response.requests);
      this.totalRecords.set(response.total);
      this.pendingCount.set(response.pending);
      this.approvedCount.set(response.approved);
      this.rejectedCount.set(response.rejected);
      console.log('✅ Requests loaded:', response.requests.length);
    } catch (error: any) {
      console.error('❌ Error loading verification queue:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to load verification requests'
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  onPageChange(event: any) {
    this.currentPage.set(event.page + 1);
    this.loadVerificationQueue();
  }

  onStatusFilterChange() {
    this.currentPage.set(1);
    this.loadVerificationQueue();
  }

  openReviewDialog(request: VerificationRequest) {
    console.log('🔵 Opening review dialog for request:', {
      id: request.id,
      business: request.business_name,
      status: request.status,
      submittedAt: request.submitted_at
    });
    this.selectedRequest.set(request);
    this.reviewAction = null;
    this.rejectionReason = '';
    this.adminNotes = '';
    this.showReviewDialog.set(true);
  }

  viewDocument(url: string | null, title: string) {
    if (!url) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Document',
        detail: 'This document was not uploaded'
      });
      return;
    }

    const fullUrl = this.verificationService.getDocumentUrl(url);
    if (!fullUrl) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load document URL'
      });
      return;
    }

    this.currentDocument.set({ url: fullUrl, title });
    this.showDocumentViewer.set(true);
  }

  downloadDocument() {
    const doc = this.currentDocument();
    if (doc) {
      window.open(doc.url, '_blank');
    }
  }

  async submitReview() {
    const action = this.reviewAction;
    const request = this.selectedRequest();

    console.log('🔵 submitReview called:', {
      action,
      requestStatus: request?.status,
      hasRejectionReason: !!this.rejectionReason?.trim()
    });

    if (!action || !request) {
      console.log('⚠️ Missing action or request');
      return;
    }

    if (action === 'reject' && !this.rejectionReason.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please provide a rejection reason'
      });
      return;
    }

    this.confirmationService.confirm({
      message: `Are you sure you want to ${action} this claim for "${request.business_name}"?`,
      header: `Confirm ${action === 'approve' ? 'Approval' : 'Rejection'}`,
      icon: action === 'approve' ? 'pi pi-check-circle' : 'pi pi-times-circle',
      acceptButtonStyleClass: action === 'approve' ? 'p-button-success' : 'p-button-danger',
      accept: async () => {
        await this.executeReview();
      }
    });
  }

  async executeReview() {
    try {
      this.isProcessing.set(true);
      const request = this.selectedRequest();
      const action = this.reviewAction;

      if (!request || !action) return;

      await this.verificationService.reviewClaim({
        requestId: request.id,
        action,
        rejectionReason: action === 'reject' ? this.rejectionReason : undefined,
        adminNotes: this.adminNotes || undefined
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `Claim ${action === 'approve' ? 'approved' : 'rejected'} successfully`
      });

      this.showReviewDialog.set(false);
      this.loadVerificationQueue();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to review claim'
      });
    } finally {
      this.isProcessing.set(false);
    }
  }

  getStatusSeverity(status: ClaimStatus): 'success' | 'warn' | 'danger' {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warn';
      case 'rejected':
        return 'danger';
      default:
        return 'warn';
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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
