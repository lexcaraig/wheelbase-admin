import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { getSubscriptionTierSeverity } from '../../../shared/utils/severity.utils';
import { BadgeSeverity } from '../../../shared/components/status-badge/status-badge.component';

export interface ChangeTierDialogData {
  userId: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  currentTier: 'free' | 'pro' | 'premium';
}

@Component({
  selector: 'app-change-tier-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    AvatarComponent,
    StatusBadgeComponent
  ],
  template: `
    <h2 mat-dialog-title>Change Subscription Tier</h2>
    <mat-dialog-content>
      <div class="space-y-4">
        <div class="p-4 bg-base-100 rounded-lg">
          <div class="flex items-center gap-3">
            <app-avatar [image]="data.avatarUrl" [label]="data.username"></app-avatar>
            <div>
              <div class="font-semibold">{{ data.username }}</div>
              <div class="text-sm text-base-content/60">{{ data.email }}</div>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 text-sm text-base-content/70">
          <span>Current tier:</span>
          <app-status-badge [severity]="getTierSeverity(data.currentTier)">
            {{ data.currentTier | uppercase }}
          </app-status-badge>
        </div>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>New Tier</mat-label>
          <mat-select [(value)]="selectedTier">
            <mat-option value="free">Free</mat-option>
            <mat-option value="pro">Pro</mat-option>
            <mat-option value="premium">Premium</mat-option>
          </mat-select>
        </mat-form-field>

        @if (selectedTier !== data.currentTier) {
          <div class="alert alert-warning text-sm">
            <span class="material-symbols-outlined">info</span>
            <span>
              This will manually set the user's tier to <strong>{{ selectedTier | uppercase }}</strong>.
              @if (selectedTier === 'free') {
                Their subscription expiry and source will be cleared.
              } @else {
                Source will be set to "promotional".
              }
            </span>
          </div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="selectedTier === data.currentTier || isSaving()"
        (click)="onSave()"
      >
        @if (isSaving()) {
          <span class="loading loading-spinner loading-sm"></span>
        }
        Update Tier
      </button>
    </mat-dialog-actions>
  `
})
export class ChangeTierDialogComponent {
  selectedTier: 'free' | 'pro' | 'premium';
  isSaving = signal(false);

  constructor(
    public dialogRef: MatDialogRef<ChangeTierDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ChangeTierDialogData,
    private subscriptionService: SubscriptionService,
    private notificationService: NotificationService
  ) {
    this.selectedTier = data.currentTier;
  }

  getTierSeverity(tier: string): BadgeSeverity {
    return getSubscriptionTierSeverity(tier);
  }

  async onSave(): Promise<void> {
    try {
      this.isSaving.set(true);
      await this.subscriptionService.updateUserSubscriptionTier(this.data.userId, this.selectedTier);
      this.notificationService.success('Success', `Tier updated to ${this.selectedTier}`);
      this.dialogRef.close(true);
    } catch (error: any) {
      this.notificationService.error('Error', error.message);
    } finally {
      this.isSaving.set(false);
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
