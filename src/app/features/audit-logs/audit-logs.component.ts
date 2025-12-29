import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { SupabaseService } from '../../core/services/supabase.service';

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
    CardModule,
    TableModule,
    TagModule,
    ToastModule,
    ButtonModule,
    Select,
    DatePicker
  ],
  providers: [MessageService],
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
  dateRange: Date[] | null = null;

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
    private messageService: MessageService
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

      if (this.dateRange && this.dateRange.length === 2 && this.dateRange[0] && this.dateRange[1]) {
        body.start_date = this.dateRange[0].toISOString().split('T')[0];
        body.end_date = this.dateRange[1].toISOString().split('T')[0];
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
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to load audit logs'
      });
      console.error('Load audit logs error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  onPageChange(event: any) {
    this.page = event.first / event.rows;
    this.pageSize = event.rows;
    this.loadAuditLogs();
  }

  onActionTypeFilterChange() {
    this.page = 0;
    this.loadAuditLogs();
  }

  onDateRangeChange() {
    this.page = 0;
    this.loadAuditLogs();
  }

  getActionSeverity(action: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    if (action.includes('approve') || action === 'login') return 'success';
    if (action.includes('ban') || action.includes('remove') || action.includes('flag')) return 'danger';
    if (action.includes('view')) return 'info';
    if (action.includes('settings')) return 'warn';
    return 'secondary';
  }

  getTargetTypeSeverity(type: string): 'success' | 'info' | 'warn' | 'secondary' {
    switch (type) {
      case 'user': return 'info';
      case 'post': return 'success';
      case 'comment': return 'warn';
      case 'system': return 'secondary';
      default: return 'secondary';
    }
  }

  exportToCSV() {
    if (this.auditLogs().length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No audit logs to export'
      });
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

    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: `Exported ${this.auditLogs().length} audit logs to CSV`
    });
  }

  exportToPDF() {
    this.messageService.add({
      severity: 'info',
      summary: 'Info',
      detail: 'PDF export functionality coming soon'
    });
  }
}
