import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SubscriptionService } from '../../core/services/subscription.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  SubscriptionStats,
  IapTransaction,
  FeatureFlag,
  ExpiringSubscription
} from '../../core/models/subscription.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { getSubscriptionTierSeverity } from '../../shared/utils/severity.utils';
import { BadgeSeverity } from '../../shared/components/status-badge/status-badge.component';
import { ChangeTierDialogComponent } from './dialogs/change-tier-dialog.component';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatDialogModule,
    MatTooltipModule,
    StatusBadgeComponent,
    AvatarComponent,
    RelativeTimePipe
  ],
  templateUrl: './subscriptions.component.html',
  styleUrl: './subscriptions.component.scss'
})
export class SubscriptionsComponent implements OnInit {
  // Dashboard stats
  stats = signal<SubscriptionStats | null>(null);
  isLoadingStats = signal(true);

  // Transactions
  transactions = signal<IapTransaction[]>([]);
  isLoadingTransactions = signal(true);
  transactionsTotal = signal(0);
  transactionsPage = signal(1);
  transactionsPageSize = 25;
  platformFilter = 'all';
  typeFilter = 'all';

  // Feature flags
  featureFlags = signal<FeatureFlag[]>([]);
  isLoadingFlags = signal(true);
  togglingFlagId = signal<string | null>(null);

  // Expiring subscriptions
  expiringUsers = signal<ExpiringSubscription[]>([]);
  isLoadingExpiring = signal(true);

  activeTab = signal(0);

  constructor(
    private subscriptionService: SubscriptionService,
    private notificationService: NotificationService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadStats();
    this.loadTransactions();
    this.loadFeatureFlags();
    this.loadExpiringSubscriptions();
  }

  async loadStats() {
    try {
      this.isLoadingStats.set(true);
      const data = await this.subscriptionService.getSubscriptionStats();
      this.stats.set(data);
    } catch (error: any) {
      this.notificationService.error('Error', error.message);
    } finally {
      this.isLoadingStats.set(false);
    }
  }

  async loadTransactions() {
    try {
      this.isLoadingTransactions.set(true);
      const result = await this.subscriptionService.getIapTransactions({
        page: this.transactionsPage(),
        pageSize: this.transactionsPageSize,
        platform: this.platformFilter,
        transactionType: this.typeFilter
      });
      this.transactions.set(result.transactions);
      this.transactionsTotal.set(result.total);
    } catch (error: any) {
      this.notificationService.error('Error', error.message);
    } finally {
      this.isLoadingTransactions.set(false);
    }
  }

  async loadFeatureFlags() {
    try {
      this.isLoadingFlags.set(true);
      const data = await this.subscriptionService.getFeatureFlags();
      this.featureFlags.set(data);
    } catch (error: any) {
      this.notificationService.error('Error', error.message);
    } finally {
      this.isLoadingFlags.set(false);
    }
  }

  async loadExpiringSubscriptions() {
    try {
      this.isLoadingExpiring.set(true);
      const data = await this.subscriptionService.getExpiringSubscriptions();
      this.expiringUsers.set(data);
    } catch (error: any) {
      this.notificationService.error('Error', error.message);
    } finally {
      this.isLoadingExpiring.set(false);
    }
  }

  async toggleFeatureFlag(flag: FeatureFlag) {
    try {
      this.togglingFlagId.set(flag.id);
      await this.subscriptionService.updateFeatureFlag(flag.id, !flag.value);
      this.notificationService.success('Updated', `${flag.key} is now ${!flag.value ? 'enabled' : 'disabled'}`);
      await this.loadFeatureFlags();
    } catch (error: any) {
      this.notificationService.error('Error', error.message);
    } finally {
      this.togglingFlagId.set(null);
    }
  }

  onTransactionFilterChange() {
    this.transactionsPage.set(1);
    this.loadTransactions();
  }

  transactionsNextPage() {
    if (this.transactionsPage() < this.getTransactionsTotalPages()) {
      this.transactionsPage.update(p => p + 1);
      this.loadTransactions();
    }
  }

  transactionsPrevPage() {
    if (this.transactionsPage() > 1) {
      this.transactionsPage.update(p => p - 1);
      this.loadTransactions();
    }
  }

  getTransactionsTotalPages(): number {
    return Math.ceil(this.transactionsTotal() / this.transactionsPageSize);
  }

  getTransactionsPageRange(): string {
    const from = (this.transactionsPage() - 1) * this.transactionsPageSize + 1;
    const to = Math.min(this.transactionsPage() * this.transactionsPageSize, this.transactionsTotal());
    return `${from}-${to} of ${this.transactionsTotal()}`;
  }

  getTierSeverity(tier: string): BadgeSeverity {
    return getSubscriptionTierSeverity(tier);
  }

  getTransactionTypeSeverity(type: string): BadgeSeverity {
    switch (type) {
      case 'purchase': return 'success';
      case 'renewal': return 'info';
      case 'upgrade': return 'success';
      case 'downgrade': return 'warning';
      case 'cancellation': return 'danger';
      case 'refund': return 'danger';
      case 'restore': return 'info';
      default: return 'secondary';
    }
  }

  getDaysUntilExpiry(expiresAt: string): number {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getExpiryUrgency(expiresAt: string): BadgeSeverity {
    const days = this.getDaysUntilExpiry(expiresAt);
    if (days <= 1) return 'danger';
    if (days <= 3) return 'warning';
    return 'info';
  }

  viewUser(userId: string) {
    this.router.navigate(['/users', userId]);
  }

  onTabChange(index: number) {
    this.activeTab.set(index);
  }

  getMrrEstimate(): string {
    const s = this.stats();
    if (!s) return '$0';
    // Approximate: Pro $4.99/mo, Premium $9.99/mo
    const mrr = (s.pro_users * 4.99) + (s.premium_users * 9.99);
    return `$${mrr.toFixed(2)}`;
  }
}
