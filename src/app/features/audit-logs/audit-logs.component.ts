import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupabaseService } from '../../core/services/supabase.service';
import { NotificationService } from '../../core/services/notification.service';
import { StatusBadgeComponent, BadgeSeverity } from '../../shared/components/status-badge/status-badge.component';

interface AuditLog {
  id: string;
  admin_user_id: string;
  action_type: string;
  target_type: string | null;
  target_id: string | null;
  metadata: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  admin_users: {
    id: string;
    email: string;
    role: string;
  };
}

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatProgressSpinnerModule,
    StatusBadgeComponent
  ],
  templateUrl: './audit-logs.component.html',
  styleUrl: './audit-logs.component.scss'
})
export class AuditLogsComponent implements OnInit {
  auditLogs = signal<AuditLog[]>([]);
  isLoading = signal(true);
  totalRecords = signal(0);

  page = 0;
  pageSize = 50;
  actionTypeFilter = '';
  startDate: Date | null = null;
  endDate: Date | null = null;

  displayedColumns: string[] = ['timestamp', 'admin', 'action', 'targetType', 'targetId', 'details', 'ipAddress'];

  actionTypeOptions = [
    { label: 'All Actions', value: '' },
    { label: 'Login', value: 'login' },
    { label: 'Logout', value: 'logout' },
    { label: 'User View', value: 'user_view' },
    { label: 'User Ban', value: 'user_ban' },
    { label: 'User Unban', value: 'user_unban' },
    { label: 'Content Remove', value: 'content_remove' },
    { label: 'Content Approve', value: 'content_approve' },
    { label: 'Content Flag', value: 'content_flag' },
    { label: 'Hashtag Ban', value: 'hashtag_ban' },
    { label: 'Settings Change', value: 'settings_change' }
  ];

  // Expose Object for template use
  Object = Object;

  constructor(
    private supabase: SupabaseService,
    private notificationService: NotificationService
  ) {}

  async ngOnInit() {
    await this.loadAuditLogs();
  }

  async loadAuditLogs() {
    try {
      this.isLoading.set(true);

      const body: any = {
        page: this.page,
        limit: this.pageSize,
        action_type: this.actionTypeFilter
      };

      if (this.startDate && this.endDate) {
        body.start_date = this.startDate.toISOString().split('T')[0];
        body.end_date = this.endDate.toISOString().split('T')[0];
      }

      const { data, error } = await this.supabase.client.functions.invoke('admin-get-audit-logs', {
        body
      });

      if (error) throw error;

      if (data.success) {
        this.auditLogs.set(data.data.audit_logs);
        this.totalRecords.set(data.data.total);
      }
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to load audit logs');
      console.error('Load audit logs error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  onPageChange(event: PageEvent) {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadAuditLogs();
  }

  onActionTypeFilterChange(value: string) {
    this.actionTypeFilter = value;
    this.page = 0;
    this.loadAuditLogs();
  }

  onDateRangeChange() {
    this.page = 0;
    this.loadAuditLogs();
  }

  getActionSeverity(action: string): BadgeSeverity {
    if (action.includes('approve') || action === 'login') return 'success';
    if (action.includes('ban') || action.includes('remove') || action.includes('flag')) return 'danger';
    if (action.includes('view')) return 'info';
    if (action.includes('settings')) return 'warning';
    return 'secondary';
  }

  getTargetTypeSeverity(type: string): BadgeSeverity {
    switch (type) {
      case 'user': return 'info';
      case 'post': return 'success';
      case 'comment': return 'warning';
      case 'system': return 'secondary';
      default: return 'secondary';
    }
  }

  formatActionType(action: string): string {
    return action.replace(/_/g, ' ').toUpperCase();
  }

  exportToCSV() {
    if (this.auditLogs().length === 0) {
      this.notificationService.warn('Warning', 'No audit logs to export');
      return;
    }

    // Prepare CSV data
    const headers = ['Timestamp', 'Admin', 'Role', 'Action', 'Target Type', 'Target ID', 'IP Address'];
    const rows = this.auditLogs().map(log => [
      new Date(log.created_at).toLocaleString(),
      log.admin_users.email,
      log.admin_users.role,
      log.action_type,
      log.target_type || 'N/A',
      log.target_id || 'N/A',
      log.ip_address || 'N/A'
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
    link.setAttribute('download', `audit_logs_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.notificationService.success('Success', `Exported ${this.auditLogs().length} audit logs to CSV`);
  }

  exportToPDF() {
    this.notificationService.info('Info', 'PDF export functionality coming soon');
  }
}
