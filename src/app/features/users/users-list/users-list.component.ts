import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { UsersService, UserStats } from '../../../core/services/users.service';
import { AppUser } from '../../../core/models/user.model';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../core/services/confirm.service';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

// Shared components
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';

// Dialog Components
import { BanUserDialogComponent } from './dialogs/ban-user-dialog.component';
import { BulkBanDialogComponent } from './dialogs/bulk-ban-dialog.component';
import { RestoreUserDialogComponent } from './dialogs/restore-user-dialog.component';
import { ForceDeleteDialogComponent } from './dialogs/force-delete-dialog.component';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    // Angular Material
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatDialogModule,
    // Shared components
    StatusBadgeComponent,
    AvatarComponent,
    RelativeTimePipe
  ],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss'
})
export class UsersListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  users = signal<AppUser[]>([]);
  isLoading = signal(true);
  totalRecords = signal(0);

  // User Stats
  stats = signal<UserStats | null>(null);
  isLoadingStats = signal(true);

  // Selection
  selection = new SelectionModel<AppUser>(true, []);

  // Table columns
  displayedColumns: string[] = ['select', 'user', 'email', 'country', 'subscription', 'verification', 'status', 'joined', 'actions'];

  // Filters
  searchQuery = '';
  statusFilter: 'all' | 'active' | 'banned' = 'all';
  subscriptionFilter: 'all' | 'free' | 'pro' | 'premium' = 'all';
  verificationFilter: 'all' | 'verified' | 'unverified' = 'all';
  accountStatusFilter: 'all' | 'active' | 'deleted' | 'suspended' = 'all';

  statusOptions = [
    { label: 'All Ban Status', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Banned', value: 'banned' }
  ];

  subscriptionOptions = [
    { label: 'All Tiers', value: 'all' },
    { label: 'Free', value: 'free' },
    { label: 'Pro', value: 'pro' },
    { label: 'Premium', value: 'premium' }
  ];

  verificationOptions = [
    { label: 'All Verification', value: 'all' },
    { label: 'Verified', value: 'verified' },
    { label: 'Unverified', value: 'unverified' }
  ];

  accountStatusOptions = [
    { label: 'All Account Status', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Deleted', value: 'deleted' },
    { label: 'Suspended', value: 'suspended' }
  ];

  // Pagination
  currentPage = signal(1);
  pageSize = 25;
  pageSizeOptions = [10, 25, 50];

  constructor(
    private usersService: UsersService,
    private router: Router,
    private notificationService: NotificationService,
    private confirmService: ConfirmService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadStats();
    this.loadUsers();
  }

  async loadStats() {
    try {
      this.isLoadingStats.set(true);
      const stats = await this.usersService.getUserStats();
      this.stats.set(stats);
    } catch (error: any) {
      console.error('Failed to load user stats:', error);
    } finally {
      this.isLoadingStats.set(false);
    }
  }

  async loadUsers() {
    try {
      this.isLoading.set(true);
      const response = await this.usersService.getUsers({
        page: this.currentPage(),
        pageSize: this.pageSize,
        search: this.searchQuery || undefined,
        status: this.statusFilter,
        subscription: this.subscriptionFilter !== 'all' ? this.subscriptionFilter : undefined,
        verification: this.verificationFilter !== 'all' ? this.verificationFilter : undefined,
        accountStatus: this.accountStatusFilter !== 'all' ? this.accountStatusFilter : undefined
      });

      this.users.set(response.users);
      this.totalRecords.set(response.total);
      this.selection.clear();
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to load users');
    } finally {
      this.isLoading.set(false);
    }
  }

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  onSearch() {
    this.currentPage.set(1);
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.loadUsers();
  }

  onFilterChange() {
    this.currentPage.set(1);
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.loadUsers();
  }

  clearFilters() {
    this.searchQuery = '';
    this.statusFilter = 'all';
    this.subscriptionFilter = 'all';
    this.verificationFilter = 'all';
    this.accountStatusFilter = 'all';
    this.currentPage.set(1);
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.loadUsers();
  }

  hasActiveFilters(): boolean {
    return this.searchQuery !== '' ||
      this.statusFilter !== 'all' ||
      this.subscriptionFilter !== 'all' ||
      this.verificationFilter !== 'all' ||
      this.accountStatusFilter !== 'all';
  }

  // Selection
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.users().length;
    return numSelected === numRows && numRows > 0;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.users().forEach(row => this.selection.select(row));
    }
  }

  viewUserDetail(user: AppUser) {
    this.router.navigate(['/users', user.id]);
  }

  // Ban/Unban Operations
  openBanDialog(user: AppUser) {
    const dialogRef = this.dialog.open(BanUserDialogComponent, {
      width: '500px',
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  async unbanUser(user: AppUser) {
    const confirmed = await this.confirmService.confirmRestore(user.username);
    if (!confirmed) return;

    try {
      await this.usersService.unbanUser(user.id);
      this.notificationService.success('Success', 'User has been unbanned');
      this.loadUsers();
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to unban user');
    }
  }

  // Bulk Operations
  openBulkBanDialog() {
    if (this.selection.selected.length === 0) {
      this.notificationService.warn('Warning', 'Please select at least one user to ban');
      return;
    }

    const dialogRef = this.dialog.open(BulkBanDialogComponent, {
      width: '600px',
      data: { users: this.selection.selected }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.selection.clear();
        this.loadUsers();
      }
    });
  }

  exportSelectedUsers() {
    if (this.selection.selected.length === 0) {
      this.notificationService.warn('Warning', 'Please select at least one user to export');
      return;
    }

    const headers = ['Username', 'Email', 'Display Name', 'Country', 'Subscription', 'Status', 'Joined'];
    const rows = this.selection.selected.map(user => [
      user.username,
      user.email,
      user.display_name || '',
      user.country_code || 'N/A',
      user.subscription_tier,
      user.is_banned ? 'BANNED' : 'ACTIVE',
      new Date(user.created_at).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `wheelbase_users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.notificationService.success('Success', `Exported ${this.selection.selected.length} users to CSV`);
  }

  // Deleted User Management
  getDaysUntilDeletion(deletedAt: string | null): number {
    if (!deletedAt) return 0;
    const deleted = new Date(deletedAt);
    const now = new Date();
    const daysSince = (now.getTime() - deleted.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(7 - daysSince));
  }

  isWithinRecoveryWindow(deletedAt: string | null): boolean {
    return this.getDaysUntilDeletion(deletedAt) > 0;
  }

  openRestoreDialog(user: AppUser) {
    const dialogRef = this.dialog.open(RestoreUserDialogComponent, {
      width: '500px',
      data: { user, daysUntilDeletion: this.getDaysUntilDeletion(user.deleted_at) }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
        this.loadStats();
      }
    });
  }

  openForceDeleteDialog(user: AppUser) {
    const dialogRef = this.dialog.open(ForceDeleteDialogComponent, {
      width: '600px',
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
        this.loadStats();
      }
    });
  }

  exportDeletedUsers() {
    const deletedUsers = this.users().filter(u => u.account_status === 'deleted');

    if (deletedUsers.length === 0) {
      this.notificationService.warn('Warning', 'No deleted users to export. Try filtering by "Deleted" account status first.');
      return;
    }

    const headers = ['Username', 'Email', 'Display Name', 'Country', 'Deleted At', 'Days Until Permanent Deletion'];
    const rows = deletedUsers.map(user => [
      user.username,
      user.email,
      user.display_name || '',
      user.country_code || 'N/A',
      user.deleted_at ? new Date(user.deleted_at).toLocaleDateString() : 'N/A',
      user.deleted_at ? this.getDaysUntilDeletion(user.deleted_at).toString() : 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `wheelbase_deleted_users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.notificationService.success('Success', `Exported ${deletedUsers.length} deleted users to CSV`);
  }

  // Badge severity helpers
  getSubscriptionSeverity(tier: string): 'success' | 'info' | 'warning' | 'secondary' {
    switch (tier.toLowerCase()) {
      case 'premium': return 'warning';
      case 'pro': return 'info';
      default: return 'success';
    }
  }

  getAccountStatusSeverity(status: string): 'success' | 'secondary' | 'warning' | 'danger' {
    switch (status) {
      case 'active': return 'success';
      case 'deleted': return 'secondary';
      case 'suspended': return 'warning';
      default: return 'success';
    }
  }
}
