import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

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

export interface EditSettingDialogData {
  setting: SystemSetting;
}

@Component({
  selector: 'app-edit-setting-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    StatusBadgeComponent
  ],
  template: `
    <h2 mat-dialog-title>Edit Setting</h2>
    <mat-dialog-content class="!pt-4">
      <div class="space-y-4">
        <!-- Setting Info -->
        <div class="p-4 bg-gray-50 rounded-lg">
          <div class="flex items-center gap-2 mb-2">
            <span class="material-symbols-outlined text-gray-600">{{ getTypeIcon(data.setting.value_type) }}</span>
            <span class="font-semibold text-gray-900">{{ data.setting.key }}</span>
          </div>
          <div class="text-sm text-gray-600">{{ data.setting.description }}</div>
          <div class="flex items-center gap-2 mt-2">
            <app-status-badge severity="secondary">{{ data.setting.category }}</app-status-badge>
            <app-status-badge severity="info">{{ data.setting.value_type.toUpperCase() }}</app-status-badge>
          </div>
        </div>

        <!-- Value Input -->
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-gray-700">
            New Value <span class="text-red-500">*</span>
          </label>

          <!-- Boolean Input -->
          @if (data.setting.value_type === 'boolean') {
            <div class="flex items-center gap-3">
              <mat-slide-toggle [(ngModel)]="editValue" color="primary">
                {{ editValue ? 'Enabled' : 'Disabled' }}
              </mat-slide-toggle>
            </div>
          }

          <!-- Number Input -->
          @else if (data.setting.value_type === 'number') {
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Value</mat-label>
              <input matInput type="number" [(ngModel)]="editValue">
            </mat-form-field>
          }

          <!-- String Input -->
          @else if (data.setting.value_type === 'string') {
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Value</mat-label>
              <input matInput type="text" [(ngModel)]="editValue">
            </mat-form-field>
          }

          <!-- JSON Input -->
          @else if (data.setting.value_type === 'json') {
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>JSON Value</mat-label>
              <textarea
                matInput
                [(ngModel)]="editValueJson"
                rows="6"
                class="font-mono text-sm"
                placeholder="Enter valid JSON..."
              ></textarea>
              <mat-hint>Must be valid JSON format</mat-hint>
            </mat-form-field>
          }
        </div>

        <!-- Warning for Critical Settings -->
        @if (data.setting.category === 'Security' || data.setting.category === 'Payment') {
          <div class="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <span class="material-symbols-outlined text-yellow-600 mt-0.5">warning</span>
            <div class="text-sm text-yellow-800">
              This is a critical setting. Changes may affect system security or functionality.
            </div>
          </div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [disabled]="isProcessing()" (click)="onCancel()">Cancel</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="isProcessing()"
        (click)="onUpdate()"
      >
        @if (isProcessing()) {
          <span class="material-symbols-outlined animate-spin mr-2">progress_activity</span>
        }
        Update Setting
      </button>
    </mat-dialog-actions>
  `
})
export class EditSettingDialogComponent {
  editValue: any;
  editValueJson: string = '';
  isProcessing = signal(false);

  constructor(
    public dialogRef: MatDialogRef<EditSettingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditSettingDialogData,
    private supabase: SupabaseService,
    private notificationService: NotificationService
  ) {
    this.editValue = data.setting.value;
    if (data.setting.value_type === 'json') {
      this.editValueJson = JSON.stringify(data.setting.value, null, 2);
    }
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

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onUpdate(): Promise<void> {
    try {
      this.isProcessing.set(true);

      let valueToSave = this.editValue;

      // Parse JSON if needed
      if (this.data.setting.value_type === 'json') {
        try {
          valueToSave = JSON.parse(this.editValueJson);
        } catch {
          this.notificationService.error('Invalid JSON', 'Please enter valid JSON format');
          this.isProcessing.set(false);
          return;
        }
      }

      const { data, error } = await this.supabase.client.functions.invoke('admin-update-settings', {
        body: {
          setting_id: this.data.setting.id,
          value: valueToSave
        }
      });

      if (error) throw error;

      if (data.success) {
        this.notificationService.success('Success', 'Setting updated successfully');
        this.dialogRef.close(true);
      }
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to update setting');
      console.error('Update setting error:', error);
    } finally {
      this.isProcessing.set(false);
    }
  }
}
