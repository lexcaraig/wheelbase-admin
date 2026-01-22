import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SupabaseService } from '../../core/services/supabase.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { StatusBadgeComponent, BadgeSeverity } from '../../shared/components/status-badge/status-badge.component';
import { CreateAdminDialogComponent } from './dialogs/create-admin-dialog.component';
import { EditAdminDialogComponent } from './dialogs/edit-admin-dialog.component';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  permissions: any;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  created_by_email: string | null;
  last_login_at: string | null;
}

@Component({
  selector: 'app-admin-users-list',
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
    MatIconModule,
    MatDialogModule,
    StatusBadgeComponent
  ],
  templateUrl: './admin-users-list.component.html',
  styleUrl: './admin-users-list.component.scss'
})
export class AdminUsersListComponent implements OnInit {
  adminUsers = signal<AdminUser[]>([]);
  isLoading = signal(true);
  totalRecords = signal(0);

  page = 0;
  pageSize = 20;
  searchQuery = '';
  roleFilter = '';

  displayedColumns: string[] = ['email', 'role', 'status', 'createdBy', 'lastLogin', 'created', 'actions'];

  roleOptions = [
    { label: 'All Roles', value: '' },
    { label: 'Super Admin', value: 'super_admin' },
    { label: 'Admin', value: 'admin' },
    { label: 'Moderator', value: 'moderator' },
    { label: 'Support', value: 'support' }
  ];

  constructor(
    private supabase: SupabaseService,
    private notificationService: NotificationService,
    private confirmService: ConfirmService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadAdminUsers();
  }

  async loadAdminUsers() {
    try {
      this.isLoading.set(true);

      const { data, error } = await this.supabase.client.functions.invoke('admin-get-admin-users', {
        body: {
          page: this.page,
          limit: this.pageSize,
          search: this.searchQuery,
          role: this.roleFilter
        }
      });

      if (error) throw error;

      if (data.success) {
        this.adminUsers.set(data.data.admin_users);
        this.totalRecords.set(data.data.total);
      }
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to load admin users');
      console.error('Load admin users error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  onPageChange(event: PageEvent) {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadAdminUsers();
  }

  onSearch() {
    this.page = 0;
    this.loadAdminUsers();
  }

  onRoleFilterChange(value: string) {
    this.roleFilter = value;
    this.page = 0;
    this.loadAdminUsers();
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(CreateAdminDialogComponent, {
      width: '500px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAdminUsers();
      }
    });
  }

  openEditDialog(admin: AdminUser) {
    const dialogRef = this.dialog.open(EditAdminDialogComponent, {
      width: '500px',
      disableClose: true,
      data: { admin }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAdminUsers();
      }
    });
  }

  async deleteAdmin(admin: AdminUser) {
    const confirmed = await this.confirmService.confirm({
      title: 'Delete Admin User',
      message: `Are you sure you want to delete <strong>${admin.email}</strong>? This action cannot be undone.`,
      confirmText: 'Delete',
      confirmColor: 'warn'
    });

    if (!confirmed) return;

    try {
      const { data, error } = await this.supabase.client.functions.invoke('admin-delete-admin-user', {
        body: {
          admin_user_id: admin.id
        }
      });

      if (error) throw error;

      if (data.success) {
        this.notificationService.success('Success', 'Admin user deleted successfully');
        await this.loadAdminUsers();
      }
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to delete admin user');
      console.error('Delete admin error:', error);
    }
  }

  getRoleSeverity(role: string): BadgeSeverity {
    switch (role) {
      case 'super_admin': return 'success';
      case 'admin': return 'info';
      case 'moderator': return 'warning';
      default: return 'secondary';
    }
  }

  getStatusSeverity(isActive: boolean): BadgeSeverity {
    return isActive ? 'success' : 'danger';
  }

  formatRole(role: string): string {
    return role.toUpperCase().replace(/_/g, ' ');
  }
}
