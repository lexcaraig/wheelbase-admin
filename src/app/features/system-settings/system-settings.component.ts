import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { InputNumberModule } from 'primeng/inputnumber';
import { Textarea } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { SupabaseService } from '../../core/services/supabase.service';

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
    CardModule,
    TableModule,
    ButtonModule,
    ToastModule,
    DialogModule,
    InputTextModule,
    ToggleSwitch,
    InputNumberModule,
    Textarea,
    TagModule
  ],
  providers: [MessageService],
  templateUrl: './system-settings.component.html',
  styleUrl: './system-settings.component.scss'
})
export class SystemSettingsComponent implements OnInit {
  settings = signal<SystemSetting[]>([]);
  isLoading = signal(true);

  // Edit Dialog
  showEditDialog = signal(false);
  selectedSetting = signal<SystemSetting | null>(null);
  editValue: any = null;
  isProcessing = signal(false);

  // Grouping
  groupedSettings = signal<Map<string, SystemSetting[]>>(new Map());

  constructor(
    private supabase: SupabaseService,
    private messageService: MessageService
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
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to load settings'
      });
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
    this.selectedSetting.set(setting);
    this.editValue = setting.value;
    this.showEditDialog.set(true);
  }

  async updateSetting() {
    const setting = this.selectedSetting();
    if (!setting) return;

    try {
      this.isProcessing.set(true);

      const { data, error } = await this.supabase.client.functions.invoke('admin-update-settings', {
        body: {
          setting_id: setting.id,
          value: this.editValue
        }
      });

      if (error) throw error;

      if (data.success) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Setting updated successfully'
        });
        this.showEditDialog.set(false);
        await this.loadSettings();
      }
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to update setting'
      });
      console.error('Update setting error:', error);
    } finally {
      this.isProcessing.set(false);
    }
  }

  getCategoryColor(category: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const colors: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'General': 'info',
      'Security': 'danger',
      'Features': 'success',
      'Limits': 'warn',
      'Payment': 'info',
      'Notification': 'secondary'
    };
    return colors[category] || 'secondary';
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'boolean': 'pi-check-circle',
      'number': 'pi-hashtag',
      'string': 'pi-align-left',
      'json': 'pi-code'
    };
    return icons[type] || 'pi-question';
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

  get categories(): string[] {
    return Array.from(this.groupedSettings().keys()).sort();
  }
}
