import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
import { StatusBadgeComponent, BadgeSeverity } from '../../shared/components/status-badge/status-badge.component';
import { ViewBusinessDialogComponent } from './dialogs/view-business-dialog.component';
import { RejectBusinessDialogComponent } from './dialogs/reject-business-dialog.component';
import { SuspendBusinessDialogComponent } from './dialogs/suspend-business-dialog.component';

@Component({
  selector: 'app-business-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    StatusBadgeComponent
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

  displayedColumns: string[] = ['business', 'type', 'contact', 'status', 'created', 'actions'];

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

  onPageChange(event: PageEvent) {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
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

  formatDate(dateString?: string | null): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
