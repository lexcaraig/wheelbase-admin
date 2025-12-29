import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../../core/services/users.service';
import { AppUser } from '../../../core/models/user.model';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Select } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Textarea } from 'primeng/textarea';
import { AvatarModule } from 'primeng/avatar';
import { MessageService } from 'primeng/api';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    Textarea,
    TagModule,
    DialogModule,
    ToastModule,
    TooltipModule,
    Select,
    CardModule,
    IconFieldModule,
    InputIconModule,
    AvatarModule,
    RelativeTimePipe
  ],
  providers: [MessageService],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss'
})
export class UsersListComponent implements OnInit {
  users = signal<AppUser[]>([]);
  isLoading = signal(true);
  totalRecords = signal(0);

  // Filters - using regular properties for ngModel compatibility
  searchQuery = '';
  statusFilter: 'all' | 'active' | 'banned' = 'all';
  statusOptions = [
    { label: 'All Users', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Banned', value: 'banned' }
  ];

  // Pagination
  currentPage = signal(1);
  pageSize = 25;

  // Ban Dialog
  showBanDialog = signal(false);
  selectedUser = signal<AppUser | null>(null);
  banReason = ''; // Regular property for ngModel
  isBanning = signal(false);

  // Bulk Operations
  selectedUsers = signal<AppUser[]>([]);
  showBulkBanDialog = signal(false);
  bulkBanReason = '';
  isBulkBanning = signal(false);

  constructor(
    private usersService: UsersService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    try {
      this.isLoading.set(true);
      const response = await this.usersService.getUsers({
        page: this.currentPage(),
        pageSize: this.pageSize,
        search: this.searchQuery || undefined,
        status: this.statusFilter
      });

      this.users.set(response.users);
      this.totalRecords.set(response.total);
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to load users'
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  onPageChange(event: any) {
    // PrimeNG lazy load event structure: { first: number, rows: number }
    // Calculate page number from 'first' index
    const page = Math.floor(event.first / event.rows) + 1;
    this.currentPage.set(page);
    this.pageSize = event.rows;
    this.loadUsers();
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadUsers();
  }

  onStatusFilterChange() {
    this.currentPage.set(1);
    this.loadUsers();
  }

  viewUserDetail(user: AppUser) {
    this.router.navigate(['/users', user.id]);
  }

  openBanDialog(user: AppUser) {
    this.selectedUser.set(user);
    this.banReason = '';
    this.showBanDialog.set(true);
  }

  async banUser() {
    if (!this.selectedUser() || !this.banReason.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Ban reason is required'
      });
      return;
    }

    try {
      this.isBanning.set(true);
      await this.usersService.banUser(this.selectedUser()!.id, this.banReason);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'User has been banned'
      });

      this.showBanDialog.set(false);
      this.loadUsers();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to ban user'
      });
    } finally {
      this.isBanning.set(false);
    }
  }

  async unbanUser(user: AppUser) {
    try {
      await this.usersService.unbanUser(user.id);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'User has been unbanned'
      });

      this.loadUsers();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to unban user'
      });
    }
  }

  getSeverity(status: string): 'success' | 'danger' | 'warn' | 'info' {
    switch (status) {
      case 'premium': return 'warn';
      case 'pro': return 'info';
      case 'free': return 'success';
      default: return 'info';
    }
  }

  // Bulk Operations
  onSelectionChange(event: any) {
    this.selectedUsers.set(event);
  }

  openBulkBanDialog() {
    if (this.selectedUsers().length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select at least one user to ban'
      });
      return;
    }

    this.bulkBanReason = '';
    this.showBulkBanDialog.set(true);
  }

  async bulkBanUsers() {
    if (!this.bulkBanReason.trim() || this.bulkBanReason.trim().length < 10) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Ban reason is required (minimum 10 characters)'
      });
      return;
    }

    try {
      this.isBulkBanning.set(true);
      const userIds = this.selectedUsers().map(u => u.id);

      const response = await this.usersService.bulkBanUsers(userIds, this.bulkBanReason);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `Successfully banned ${response.banned_count} out of ${userIds.length} users`
      });

      if (response.failed_count > 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Partial Failure',
          detail: `${response.failed_count} users could not be banned`
        });
      }

      this.showBulkBanDialog.set(false);
      this.selectedUsers.set([]);
      this.loadUsers();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to ban users'
      });
    } finally {
      this.isBulkBanning.set(false);
    }
  }

  exportSelectedUsers() {
    if (this.selectedUsers().length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select at least one user to export'
      });
      return;
    }

    // Prepare CSV data
    const headers = ['Username', 'Email', 'Display Name', 'Country', 'Subscription', 'Status', 'Joined'];
    const rows = this.selectedUsers().map(user => [
      user.username,
      user.email,
      user.display_name || '',
      user.country_code || 'N/A',
      user.subscription_tier,
      user.is_banned ? 'BANNED' : 'ACTIVE',
      new Date(user.created_at).toLocaleDateString()
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `wheelbase_users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: `Exported ${this.selectedUsers().length} users to CSV`
    });
  }
}
