import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { NotificationService } from '../../core/services/notification.service';

interface Announcement {
  id: string;
  is_active: boolean;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'maintenance';
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-3xl font-bold text-base-content mb-2">App Announcements</h1>
          <p class="text-base-content/70">Display notices to users on the login page</p>
        </div>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex items-center justify-center h-64">
          <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Editor Card -->
          <div class="card bg-base-200 shadow">
            <div class="card-body">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-base-content">Announcement Editor</h2>
                <div class="flex items-center gap-2">
                  <span class="text-sm" [class]="announcement().is_active ? 'text-success' : 'text-base-content/50'">
                    {{ announcement().is_active ? 'Active' : 'Inactive' }}
                  </span>
                  <input
                    type="checkbox"
                    class="toggle toggle-primary"
                    [checked]="announcement().is_active"
                    (change)="updateField('is_active', $any($event.target).checked)"
                  />
                </div>
              </div>

              <div class="space-y-4">
                <!-- Type Selector -->
                <label class="form-control w-full">
                  <div class="label">
                    <span class="label-text text-base-content/70">Type</span>
                  </div>
                  <select
                    class="select select-bordered w-full"
                    [ngModel]="announcement().type"
                    (ngModelChange)="updateField('type', $event)"
                  >
                    @for (option of typeOptions; track option.value) {
                      <option [value]="option.value">{{ option.label }}</option>
                    }
                  </select>
                </label>

                <!-- Title -->
                <label class="form-control w-full">
                  <div class="label">
                    <span class="label-text text-base-content/70">Title</span>
                  </div>
                  <input
                    type="text"
                    class="input input-bordered w-full"
                    [ngModel]="announcement().title"
                    (ngModelChange)="updateField('title', $event)"
                    placeholder="e.g., Scheduled Maintenance"
                  />
                </label>

                <!-- Message -->
                <label class="form-control w-full">
                  <div class="label">
                    <span class="label-text text-base-content/70">Message</span>
                  </div>
                  <textarea
                    class="textarea textarea-bordered w-full"
                    rows="4"
                    [ngModel]="announcement().message"
                    (ngModelChange)="updateField('message', $event)"
                    placeholder="Enter the message to display to users..."
                  ></textarea>
                </label>

                <!-- Save Button -->
                <button
                  class="btn btn-primary w-full"
                  [disabled]="isSaving()"
                  (click)="saveAnnouncement()"
                >
                  @if (isSaving()) {
                    <span class="loading loading-spinner loading-sm"></span>
                  } @else {
                    <span class="material-symbols-outlined text-sm">save</span>
                  }
                  Save Announcement
                </button>
              </div>
            </div>
          </div>

          <!-- Preview Card -->
          <div class="card bg-base-200 shadow">
            <div class="card-body">
              <div class="mb-4">
                <h2 class="text-lg font-semibold text-base-content">Preview</h2>
                <p class="text-sm text-base-content/60">How it will appear on the login page</p>
              </div>

              <div class="space-y-4">
                @if (announcement().is_active) {
                  <div
                    class="p-4 rounded-lg border"
                    [ngClass]="getPreviewClasses()"
                  >
                    <div class="flex items-center gap-2 mb-2">
                      <span class="material-symbols-outlined" [class]="getPreviewIconClass()">
                        {{ getPreviewIcon() }}
                      </span>
                      <span class="font-bold text-sm">{{ announcement().title || 'Title' }}</span>
                    </div>
                    <p class="text-sm leading-relaxed">
                      {{ announcement().message || 'Message will appear here...' }}
                    </p>
                  </div>
                } @else {
                  <div class="text-center py-8 text-base-content/60">
                    <span class="material-symbols-outlined text-4xl mb-2">visibility_off</span>
                    <p>Announcement is currently inactive</p>
                    <p class="text-sm">Toggle the switch above to activate</p>
                  </div>
                }

                <!-- Quick Templates -->
                <div class="border-t border-base-300 pt-4 mt-4">
                  <h3 class="text-sm font-medium text-base-content/60 mb-3">Quick Templates</h3>
                  <div class="flex flex-wrap gap-2">
                    <button
                      class="btn btn-outline btn-sm"
                      (click)="applyTemplate('maintenance')"
                    >
                      Maintenance
                    </button>
                    <button
                      class="btn btn-outline btn-sm"
                      (click)="applyTemplate('issues')"
                    >
                      Server Issues
                    </button>
                    <button
                      class="btn btn-outline btn-sm"
                      (click)="applyTemplate('update')"
                    >
                      Update Available
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Last Updated Info -->
        @if (announcement().updated_at) {
          <div class="mt-4 text-sm text-base-content/60 text-right">
            Last updated: {{ formatDate(announcement().updated_at) }}
          </div>
        }
      }
    </div>
  `
})
export class AnnouncementsComponent implements OnInit {
  announcement = signal<Announcement>({
    id: '',
    is_active: false,
    title: '',
    message: '',
    type: 'maintenance',
    created_at: '',
    updated_at: ''
  });

  isLoading = signal(true);
  isSaving = signal(false);

  typeOptions = [
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Warning', value: 'warning' },
    { label: 'Info', value: 'info' }
  ];

  constructor(
    private supabase: SupabaseService,
    private notificationService: NotificationService
  ) {}

  async ngOnInit() {
    await this.loadAnnouncement();
  }

  async loadAnnouncement() {
    try {
      this.isLoading.set(true);

      // Get all announcements (there should be only one)
      const { data, error } = await this.supabase.client
        .from('app_announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is fine
        throw error;
      }

      if (data) {
        this.announcement.set(data);
      }
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to load announcement');
      console.error('Load announcement error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveAnnouncement() {
    try {
      this.isSaving.set(true);

      const current = this.announcement();

      if (current.id) {
        // Update existing
        const { error } = await this.supabase.client
          .from('app_announcements')
          .update({
            is_active: current.is_active,
            title: current.title,
            message: current.message,
            type: current.type,
            updated_at: new Date().toISOString()
          })
          .eq('id', current.id);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await this.supabase.client
          .from('app_announcements')
          .insert({
            is_active: current.is_active,
            title: current.title,
            message: current.message,
            type: current.type
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          this.announcement.set(data);
        }
      }

      this.notificationService.success(
        'Success',
        current.is_active
          ? 'Announcement is now active and visible to users'
          : 'Announcement saved (inactive)'
      );

      await this.loadAnnouncement();
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to save announcement');
      console.error('Save announcement error:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  getPreviewClasses(): Record<string, boolean> {
    const type = this.announcement().type;
    return {
      'bg-orange-900/30 border-orange-500 text-orange-200': type === 'maintenance',
      'bg-yellow-900/30 border-yellow-500 text-yellow-200': type === 'warning',
      'bg-blue-900/30 border-blue-500 text-blue-200': type === 'info'
    };
  }

  getPreviewIcon(): string {
    const type = this.announcement().type;
    switch (type) {
      case 'maintenance':
        return 'settings';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  }

  getPreviewIconClass(): string {
    const type = this.announcement().type;
    switch (type) {
      case 'maintenance':
        return 'text-orange-500';
      case 'warning':
        return 'text-yellow-500';
      default:
        return 'text-blue-500';
    }
  }

  applyTemplate(template: string) {
    const current = this.announcement();

    switch (template) {
      case 'maintenance':
        this.announcement.set({
          ...current,
          type: 'maintenance',
          title: 'Scheduled Maintenance',
          message: 'We are currently performing scheduled maintenance. Some features may be temporarily unavailable. Thank you for your patience!'
        });
        break;
      case 'issues':
        this.announcement.set({
          ...current,
          type: 'warning',
          title: 'Service Disruption',
          message: 'We are aware of issues affecting some users and are working to resolve them as quickly as possible. Thank you for your understanding.'
        });
        break;
      case 'update':
        this.announcement.set({
          ...current,
          type: 'info',
          title: 'Update Available',
          message: 'A new version of Wheelbase is available. Please update your app to enjoy the latest features and improvements.'
        });
        break;
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }

  // Properly update signal fields - required because [(ngModel)]="signal().prop" doesn't update signals correctly
  updateField<K extends keyof Announcement>(field: K, value: Announcement[K]) {
    this.announcement.update(current => ({ ...current, [field]: value }));
  }
}
