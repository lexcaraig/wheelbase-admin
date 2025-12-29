import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { SupabaseService } from '../../core/services/supabase.service';

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
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    ToastModule,
    DialogModule,
    InputTextModule,
    Select
  ],
  providers: [MessageService],
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

  // Dialog states
  showCreateDialog = signal(false);
  showEditDialog = signal(false);
  showDeleteDialog = signal(false);
  selectedAdmin = signal<AdminUser | null>(null);
  isProcessing = signal(false);

  // Create form
  newAdminEmail = '';
  newAdminRole = 'admin';
  newAdminPassword = '';

  // Edit form
  editAdminRole = '';
  editAdminIsActive = true;

  roleOptions = [
    { label: 'All Roles', value: '' },
    { label: 'Super Admin', value: 'super_admin' },
    { label: 'Admin', value: 'admin' },
    { label: 'Moderator', value: 'moderator' },
    { label: 'Support', value: 'support' }
  ];

  createRoleOptions = [
    { label: 'Admin', value: 'admin' },
    { label: 'Moderator', value: 'moderator' },
    { label: 'Support', value: 'support' }
  ];

  // Computed property for edit dialog role options
  get editRoleOptions() {
    return this.roleOptions.filter(r => r.value !== '');
  }

  constructor(
    private supabase: SupabaseService,
    private messageService: MessageService,
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
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to load admin users'
      });
      console.error('Load admin users error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  onPageChange(event: any) {
    this.page = event.first / event.rows;
    this.pageSize = event.rows;
    this.loadAdminUsers();
  }

  onSearch() {
    this.page = 0;
    this.loadAdminUsers();
  }

  onRoleFilterChange() {
    this.page = 0;
    this.loadAdminUsers();
  }

  openCreateDialog() {
    this.newAdminEmail = '';
    this.newAdminRole = 'admin';
    this.newAdminPassword = '';
    this.showCreateDialog.set(true);
  }

  async createAdmin() {
    if (!this.newAdminEmail || !this.newAdminRole) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Email and role are required'
      });
      return;
    }

    try {
      this.isProcessing.set(true);

      const { data, error } = await this.supabase.client.functions.invoke('admin-create-admin-user', {
        body: {
          email: this.newAdminEmail,
          role: this.newAdminRole
        }
      });

      if (error) throw error;

      if (data.success) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Admin user created. Temporary password: ${data.data.temporary_password}`
        });
        this.showCreateDialog.set(false);
        await this.loadAdminUsers();
      }
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to create admin user'
      });
      console.error('Create admin error:', error);
    } finally {
      this.isProcessing.set(false);
    }
  }

  openEditDialog(admin: AdminUser) {
    this.selectedAdmin.set(admin);
    this.editAdminRole = admin.role;
    this.editAdminIsActive = admin.is_active;
    this.showEditDialog.set(true);
  }

  async updateAdmin() {
    const admin = this.selectedAdmin();
    if (!admin) return;

    try {
      this.isProcessing.set(true);

      const { data, error } = await this.supabase.client.functions.invoke('admin-update-admin-user', {
        body: {
          admin_user_id: admin.id,
          role: this.editAdminRole,
          is_active: this.editAdminIsActive
        }
      });

      if (error) throw error;

      if (data.success) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Admin user updated successfully'
        });
        this.showEditDialog.set(false);
        await this.loadAdminUsers();
      }
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to update admin user'
      });
      console.error('Update admin error:', error);
    } finally {
      this.isProcessing.set(false);
    }
  }

  openDeleteDialog(admin: AdminUser) {
    this.selectedAdmin.set(admin);
    this.showDeleteDialog.set(true);
  }

  async deleteAdmin() {
    const admin = this.selectedAdmin();
    if (!admin) return;

    try {
      this.isProcessing.set(true);

      const { data, error } = await this.supabase.client.functions.invoke('admin-delete-admin-user', {
        body: {
          admin_user_id: admin.id
        }
      });

      if (error) throw error;

      if (data.success) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Admin user deleted successfully'
        });
        this.showDeleteDialog.set(false);
        await this.loadAdminUsers();
      }
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to delete admin user'
      });
      console.error('Delete admin error:', error);
    } finally {
      this.isProcessing.set(false);
    }
  }

  getRoleSeverity(role: string): 'success' | 'info' | 'warn' | 'secondary' {
    switch (role) {
      case 'super_admin': return 'success';
      case 'admin': return 'info';
      case 'moderator': return 'warn';
      default: return 'secondary';
    }
  }

  getStatusSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }
}
