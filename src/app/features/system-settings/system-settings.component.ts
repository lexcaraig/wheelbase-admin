import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SupabaseService } from '../../core/services/supabase.service';
import { NotificationService } from '../../core/services/notification.service';
import { BadgeSeverity } from '../../shared/components/status-badge/status-badge.component';
import { EditSettingDialogComponent } from './dialogs/edit-setting-dialog.component';

interface SystemSetting {
  id: string;
  category: string;
  key: string;
  value: any;
  value_type: 'string' | 'number' | 'boolean' | 'json';
  description: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule
  ],
  templateUrl: './system-settings.component.html',
  styleUrl: './system-settings.component.scss'
})
export class SystemSettingsComponent implements OnInit {
  settings = signal<SystemSetting[]>([]);
  isLoading = signal(true);

  // Grouping
  groupedSettings = signal<Map<string, SystemSetting[]>>(new Map());

  constructor(
    private supabase: SupabaseService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  async ngOnInit() {
    await this.loadSettings();
  }

  async loadSettings() {
    try {
      this.isLoading.set(true);

      const { data, error } = await this.supabase.client.functions.invoke('admin-get-settings', {
        body: {}
      });

      if (error) throw error;

      if (data.success) {
        this.settings.set(data.data.settings);
        this.groupSettingsByCategory(data.data.settings);
      }
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to load settings');
      console.error('Load settings error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  groupSettingsByCategory(settings: SystemSetting[]) {
    const grouped = new Map<string, SystemSetting[]>();

    settings.forEach(setting => {
      const category = setting.category || 'General';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(setting);
    });

    this.groupedSettings.set(grouped);
  }

  openEditDialog(setting: SystemSetting) {
    const dialogRef = this.dialog.open(EditSettingDialogComponent, {
      width: '500px',
      disableClose: true,
      data: { setting }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSettings();
      }
    });
  }

  getCategoryColor(category: string): BadgeSeverity {
    const colors: Record<string, BadgeSeverity> = {
      'General': 'info',
      'Security': 'danger',
      'Features': 'success',
      'Limits': 'warning',
      'Payment': 'info',
      'Notification': 'secondary'
    };
    return colors[category] || 'secondary';
  }

  getCategoryBadgeClass(category: string): string {
    const classes: Record<string, string> = {
      'General': 'badge-info',
      'Security': 'badge-error',
      'Features': 'badge-success',
      'Limits': 'badge-warning',
      'Payment': 'badge-info',
      'Notification': 'badge-neutral'
    };
    return classes[category] || 'badge-neutral';
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'boolean': 'check_circle',
      'number': 'tag',
      'string': 'notes',
      'json': 'code'
    };
    return icons[type] || 'help';
  }

  formatValue(value: any, type: string): string {
    if (type === 'boolean') {
      return value ? 'Enabled' : 'Disabled';
    }
    if (type === 'json') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  getValueSeverity(value: boolean): BadgeSeverity {
    return value ? 'success' : 'danger';
  }

  get categories(): string[] {
    return Array.from(this.groupedSettings().keys()).sort();
  }
}
