import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BusinessService } from '../../core/services/business.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../core/services/confirm.service';
import {
  Business,
  BusinessVerificationStatus,
  BUSINESS_TYPE_LABELS,
  BUSINESS_STATUS_LABELS,
} from '../../core/models/business.model';
import { BadgeSeverity } from '../../shared/components/status-badge/status-badge.component';
import { ViewBusinessDialogComponent } from './dialogs/view-business-dialog.component';
import { RejectBusinessDialogComponent } from './dialogs/reject-business-dialog.component';
import { SuspendBusinessDialogComponent } from './dialogs/suspend-business-dialog.component';

@Component({
  selector: 'app-business-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule
  ],
  templateUrl: './business-list.component.html',
  styles: []
})
export class BusinessListComponent implements OnInit {
  businesses = signal<Business[]>([]);
  isLoading = signal(true);
  isProcessing = signal(false);
  totalRecords = signal(0);
  pendingCount = signal(0);
  approvedCount = signal(0);
  rejectedCount = signal(0);
  suspendedCount = signal(0);

  // Filters
  statusFilter: BusinessVerificationStatus | 'all' = 'all';
  searchQuery = '';
  page = 0;
  pageSize = 20;
  pageSizeOptions = [10, 20, 50];

  statusOptions = [
    { label: 'All', value: 'all' as const },
    { label: 'Pending', value: 'pending' as const },
    { label: 'Approved', value: 'approved' as const },
    { label: 'Rejected', value: 'rejected' as const },
    { label: 'Suspended', value: 'suspended' as const },
  ];

  constructor(
    private businessService: BusinessService,
    private notificationService: NotificationService,
    private confirmService: ConfirmService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadBusinesses();
  }

  async loadBusinesses() {
    try {
      this.isLoading.set(true);
      const response = await this.businessService.getBusinesses({
        status: this.statusFilter,
        page: this.page + 1,
        pageSize: this.pageSize,
        search: this.searchQuery || undefined,
      });

      this.businesses.set(response.businesses);
      this.totalRecords.set(response.total);
      this.pendingCount.set(response.counts.pending);
      this.approvedCount.set(response.counts.approved);
      this.rejectedCount.set(response.counts.rejected);
      this.suspendedCount.set(response.counts.suspended);
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to load businesses');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Pagination methods
  getTotalPages(): number {
    return Math.ceil(this.totalRecords() / this.pageSize);
  }

  getPageRangeLabel(): string {
    const start = this.page * this.pageSize + 1;
    const end = Math.min((this.page + 1) * this.pageSize, this.totalRecords());
    return `${start} - ${end} of ${this.totalRecords()}`;
  }

  firstPage(): void {
    this.page = 0;
    this.loadBusinesses();
  }

  previousPage(): void {
    if (this.page > 0) {
      this.page--;
      this.loadBusinesses();
    }
  }

  nextPage(): void {
    if (this.page < this.getTotalPages() - 1) {
      this.page++;
      this.loadBusinesses();
    }
  }

  lastPage(): void {
    this.page = this.getTotalPages() - 1;
    this.loadBusinesses();
  }

  onPageSizeChange(): void {
    this.page = 0;
    this.loadBusinesses();
  }

  onStatusFilterChange(value: BusinessVerificationStatus | 'all') {
    this.statusFilter = value;
    this.page = 0;
    this.loadBusinesses();
  }

  onSearch() {
    this.page = 0;
    this.loadBusinesses();
  }

  viewBusiness(business: Business) {
    this.dialog.open(ViewBusinessDialogComponent, {
      width: '600px',
      data: { business }
    });
  }

  async confirmApprove(business: Business) {
    const confirmed = await this.confirmService.confirm({
      title: 'Confirm Approval',
      message: `Are you sure you want to approve "${business.business_name}"?`,
      confirmText: 'Approve',
      confirmColor: 'primary'
    });

    if (confirmed) {
      await this.approveBusiness(business);
    }
  }

  async approveBusiness(business: Business) {
    try {
      this.isProcessing.set(true);
      await this.businessService.approveBusiness(business.id);
      this.notificationService.success('Success', `${business.business_name} has been approved`);
      this.loadBusinesses();
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to approve business');
    } finally {
      this.isProcessing.set(false);
    }
  }

  openRejectDialog(business: Business) {
    const dialogRef = this.dialog.open(RejectBusinessDialogComponent, {
      width: '450px',
      disableClose: true,
      data: { business }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadBusinesses();
      }
    });
  }

  openSuspendDialog(business: Business) {
    const dialogRef = this.dialog.open(SuspendBusinessDialogComponent, {
      width: '450px',
      disableClose: true,
      data: { business }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadBusinesses();
      }
    });
  }

  getBusinessTypeLabel(type: string): string {
    return BUSINESS_TYPE_LABELS[type as keyof typeof BUSINESS_TYPE_LABELS] || type;
  }

  getStatusLabel(status: BusinessVerificationStatus): string {
    return BUSINESS_STATUS_LABELS[status] || status;
  }

  getStatusSeverity(status: BusinessVerificationStatus): BadgeSeverity {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'suspended': return 'secondary';
      default: return 'info';
    }
  }

  getStatusBadgeClass(status: BusinessVerificationStatus): string {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'approved': return 'badge-success';
      case 'rejected': return 'badge-error';
      case 'suspended': return 'badge-neutral';
      default: return 'badge-info';
    }
  }

  formatDate(dateString?: string | null): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
