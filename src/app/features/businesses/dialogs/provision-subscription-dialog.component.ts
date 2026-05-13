import { Component, Inject, computed, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { BusinessService } from '../../../core/services/business.service';
import { NotificationService } from '../../../core/services/notification.service';
import { InvoiceGeneratorService } from '../../../core/services/invoice-generator.service';
import {
  Business,
  BillingPeriod,
  SubscriptionTier,
  ProvisionSubscriptionPayload,
} from '../../../core/models/business.model';
import {
  AD_PLACEMENT_PACKAGES,
  BUNDLE_PACKAGES,
  BUSINESS_ACCOUNT_PRICING,
} from '../../../core/models/pricing.model';

type PackageMode = 'business_only' | 'bundle_starter' | 'bundle_basic' | 'bundle_standard' | 'bundle_premium' | 'ads_starter' | 'ads_basic' | 'ads_standard' | 'ads_premium' | 'custom';

interface PackageOption {
  key: PackageMode;
  label: string;
  group: 'Business' | 'Bundle' | 'Ads' | 'Custom';
  monthly: number;
  quarterlyPerMonth: number;
  annualPerMonth: number;
  defaultTier: SubscriptionTier;
}

export interface ProvisionSubscriptionDialogData {
  business: Business;
}

@Component({
  selector: 'app-provision-subscription-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    CurrencyPipe,
  ],
  template: `
    <h2 mat-dialog-title>Provision Subscription</h2>
    <mat-dialog-content class="!pt-4" style="min-width: 540px; max-width: 720px;">
      <div class="mb-4">
        <p class="text-sm text-base-content/70">
          Provisioning for <strong>{{ data.business.business_name }}</strong>
          ({{ data.business.owner_email }})
        </p>
        @if (data.business.subscription_tier && data.business.subscription_tier !== 'free') {
          <div class="alert alert-warning mt-3 text-sm">
            <span>
              Current tier: <strong>{{ data.business.subscription_tier | uppercase }}</strong>
              @if (data.business.subscription_expires_at) {
                · expires {{ data.business.subscription_expires_at | date:'mediumDate' }}
              }
              · the previous active subscription will be marked <em>cancelled</em>.
            </span>
          </div>
        }
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Package picker -->
        <label class="form-control">
          <div class="label"><span class="label-text font-semibold">Package</span></div>
          <select
            class="select select-bordered"
            [ngModel]="packageMode()"
            (ngModelChange)="onPackageChange($event)"
            [disabled]="isProcessing()"
          >
            @for (group of packageGroups; track group) {
              <optgroup [label]="group">
                @for (p of packagesByGroup[group]; track p.key) {
                  <option [value]="p.key">{{ p.label }}</option>
                }
              </optgroup>
            }
          </select>
        </label>

        <!-- Tier (auto-set from package, but editable for custom) -->
        <label class="form-control">
          <div class="label"><span class="label-text font-semibold">Tier</span></div>
          <select
            class="select select-bordered"
            [(ngModel)]="tier"
            [disabled]="isProcessing() || packageMode() !== 'custom'"
          >
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </label>

        <!-- Billing period -->
        <label class="form-control">
          <div class="label"><span class="label-text font-semibold">Billing Period</span></div>
          <select
            class="select select-bordered"
            [(ngModel)]="billingPeriod"
            (ngModelChange)="recomputeAmount()"
            [disabled]="isProcessing()"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly (10% off)</option>
            <option value="annual">Annual (15% off)</option>
          </select>
        </label>

        <!-- Payment method -->
        <label class="form-control">
          <div class="label"><span class="label-text font-semibold">Payment Method</span></div>
          <select
            class="select select-bordered"
            [(ngModel)]="paymentMethod"
            [disabled]="isProcessing()"
          >
            <option value="bank_transfer">Bank Transfer</option>
            <option value="gcash">GCash</option>
            <option value="paymaya">PayMaya</option>
            <option value="hitpay">HitPay</option>
            <option value="other">Other</option>
          </select>
        </label>

        <!-- Amount in PHP (cents under the hood) -->
        <label class="form-control md:col-span-1">
          <div class="label">
            <span class="label-text font-semibold">Amount (PHP)</span>
            <span class="label-text-alt text-base-content/50">auto from catalog</span>
          </div>
          <input
            type="number"
            min="0"
            step="1"
            class="input input-bordered"
            [(ngModel)]="amountPhp"
            [disabled]="isProcessing() || packageMode() !== 'custom'"
          />
        </label>

        <!-- Start date override (optional) -->
        <label class="form-control">
          <div class="label">
            <span class="label-text font-semibold">Start Date</span>
            <span class="label-text-alt text-base-content/50">defaults to now</span>
          </div>
          <input
            type="date"
            class="input input-bordered"
            [(ngModel)]="startedAtLocal"
            [disabled]="isProcessing()"
          />
        </label>

        <!-- Notes / receipt ref -->
        <label class="form-control md:col-span-2">
          <div class="label"><span class="label-text font-semibold">Notes (optional)</span></div>
          <input
            type="text"
            class="input input-bordered"
            placeholder="e.g. Invoice INV-2026-001, Bank ref XXX"
            [(ngModel)]="notes"
            [disabled]="isProcessing()"
          />
        </label>

        <label class="cursor-pointer label justify-start gap-3 md:col-span-2">
          <input
            type="checkbox"
            class="checkbox checkbox-primary"
            [(ngModel)]="autoRenew"
            [disabled]="isProcessing()"
          />
          <span class="label-text">Auto-renew at period end</span>
        </label>
      </div>

      <!-- Summary card -->
      <div class="card bg-base-200 mt-4">
        <div class="card-body p-4">
          <div class="flex justify-between items-baseline gap-4 flex-wrap">
            <div>
              <div class="text-sm text-base-content/60">Total this period</div>
              <div class="text-2xl font-bold text-primary">
                {{ amountPhp() | currency:'PHP':'symbol-narrow':'1.0-0' }}
              </div>
              <div class="text-xs text-base-content/60">
                {{ tier() | uppercase }} · {{ billingPeriod() }} · {{ periodMonths() }} month(s)
              </div>
            </div>
            <div class="text-right text-xs text-base-content/60">
              <div>Access until: <strong>{{ computedExpiresAt() | date:'mediumDate' }}</strong></div>
              <div class="mt-1">Auto-renew: {{ autoRenew() ? 'Yes' : 'No' }}</div>
            </div>
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="!px-6 !pb-4">
      <button mat-button [disabled]="isProcessing()" (click)="onCancel()">Cancel</button>
      <button
        mat-stroked-button
        color="accent"
        [disabled]="amountPhp() <= 0 || tier() === 'free' || isProcessing()"
        (click)="downloadInvoice()"
        title="Generate a PDF invoice for this subscription"
      >
        <span class="material-symbols-outlined text-sm">receipt_long</span>
        Download Invoice
      </button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="amountPhp() < 0 || isProcessing()"
        (click)="onProvision()"
      >
        @if (isProcessing()) {
          <span class="material-symbols-outlined animate-spin mr-2">progress_activity</span>
        }
        Provision Subscription
      </button>
    </mat-dialog-actions>
  `,
})
export class ProvisionSubscriptionDialogComponent {
  // Form state (signals so the summary recomputes reactively)
  packageMode = signal<PackageMode>('business_only');
  tier = signal<SubscriptionTier>('pro');
  billingPeriod = signal<BillingPeriod>('monthly');
  paymentMethod = signal<string>('bank_transfer');
  amountPhp = signal<number>(BUSINESS_ACCOUNT_PRICING.monthly);
  startedAtLocal = signal<string>(this.todayIso());
  notes = signal<string>('');
  autoRenew = signal<boolean>(false);
  isProcessing = signal(false);

  // Package catalog
  packageGroups: PackageOption['group'][] = ['Business', 'Bundle', 'Ads', 'Custom'];

  packages: PackageOption[] = [
    {
      key: 'business_only',
      label: 'Business Account',
      group: 'Business',
      monthly: BUSINESS_ACCOUNT_PRICING.monthly,
      quarterlyPerMonth: BUSINESS_ACCOUNT_PRICING.quarterlyPerMonth,
      annualPerMonth: BUSINESS_ACCOUNT_PRICING.annualPerMonth,
      defaultTier: 'pro',
    },
    ...BUNDLE_PACKAGES.map((b) => ({
      key: ('bundle_' + b.key) as PackageMode,
      label: b.label + ' — ' + b.includes,
      group: 'Bundle' as const,
      monthly: b.monthlyBundle,
      quarterlyPerMonth: b.quarterlyPerMonth,
      annualPerMonth: b.annualPerMonth,
      defaultTier: 'pro' as SubscriptionTier,
    })),
    ...AD_PLACEMENT_PACKAGES.map((a) => ({
      key: ('ads_' + a.key) as PackageMode,
      label: 'Ads — ' + a.label + ' (' + a.placementsLabel + ')',
      group: 'Ads' as const,
      monthly: a.monthly,
      quarterlyPerMonth: a.quarterlyPerMonth,
      annualPerMonth: a.annualPerMonth,
      defaultTier: 'free' as SubscriptionTier,
    })),
    {
      key: 'custom',
      label: 'Custom (set amount + tier manually)',
      group: 'Custom',
      monthly: 0,
      quarterlyPerMonth: 0,
      annualPerMonth: 0,
      defaultTier: 'pro',
    },
  ];

  packagesByGroup: Record<PackageOption['group'], PackageOption[]> = {
    Business: this.packages.filter((p) => p.group === 'Business'),
    Bundle: this.packages.filter((p) => p.group === 'Bundle'),
    Ads: this.packages.filter((p) => p.group === 'Ads'),
    Custom: this.packages.filter((p) => p.group === 'Custom'),
  };

  periodMonths = computed(() => {
    const p = this.billingPeriod();
    return p === 'monthly' ? 1 : p === 'quarterly' ? 3 : 12;
  });

  computedExpiresAt = computed(() => {
    const months = this.periodMonths();
    const start = new Date(this.startedAtLocal() || this.todayIso());
    const d = new Date(start);
    d.setUTCMonth(d.getUTCMonth() + months);
    return d;
  });

  constructor(
    public dialogRef: MatDialogRef<ProvisionSubscriptionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProvisionSubscriptionDialogData,
    private businessService: BusinessService,
    private notificationService: NotificationService,
    private invoiceGenerator: InvoiceGeneratorService
  ) {}

  downloadInvoice(): void {
    if (this.amountPhp() <= 0 || this.tier() === 'free') return;
    const pkg = this.packages.find((p) => p.key === this.packageMode());
    const months = this.periodMonths();
    const start = new Date(this.startedAtLocal() || new Date().toISOString().slice(0, 10));
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + months);

    const tierLabel = this.tier() === 'enterprise' ? 'Enterprise' : 'Pro';
    const description = pkg ? pkg.label : 'Subscription';
    const fmt = (d: Date) => d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

    try {
      const { invoiceNumber, filename } = this.invoiceGenerator.download({
        billTo: {
          businessName: this.data.business.business_name,
          contactName: undefined,
          email: this.data.business.owner_email,
        },
        lineItems: [
          {
            description: `${description} — ${tierLabel} tier`,
            periodLabel: `${fmt(start)} → ${fmt(end)} (${this.billingPeriod()})`,
            quantity: 1,
            amountPhp: this.amountPhp(),
          },
        ],
        internalNotes: this.notes() || undefined,
        issuedAt: start,
      });
      this.notificationService.success('Invoice generated', `${filename} (${invoiceNumber})`);
    } catch (error: any) {
      this.notificationService.error('Invoice failed', error?.message || 'Could not generate PDF');
      console.error('[invoice] error', error);
    }
  }

  onPackageChange(key: PackageMode): void {
    this.packageMode.set(key);
    const pkg = this.packages.find((p) => p.key === key);
    if (!pkg) return;

    this.tier.set(pkg.defaultTier);
    this.recomputeAmount();
  }

  recomputeAmount(): void {
    const pkg = this.packages.find((p) => p.key === this.packageMode());
    if (!pkg || pkg.key === 'custom') return;

    const months = this.periodMonths();
    const perMonth =
      this.billingPeriod() === 'monthly'
        ? pkg.monthly
        : this.billingPeriod() === 'quarterly'
        ? pkg.quarterlyPerMonth
        : pkg.annualPerMonth;
    this.amountPhp.set(perMonth * months);
  }

  private todayIso(): string {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onProvision(): Promise<void> {
    try {
      this.isProcessing.set(true);

      const payload: ProvisionSubscriptionPayload = {
        tier: this.tier(),
        billingPeriod: this.billingPeriod(),
        amountCents: Math.round(this.amountPhp() * 100),
        currency: 'PHP',
        paymentMethod: this.paymentMethod(),
        autoRenew: this.autoRenew(),
        startedAt: new Date(this.startedAtLocal()).toISOString(),
        notes: this.notes().trim() || undefined,
      };

      await this.businessService.provisionSubscription(this.data.business.id, payload);

      this.notificationService.success(
        'Subscription provisioned',
        `${this.data.business.business_name} is now on ${this.tier().toUpperCase()} (${this.billingPeriod()}).`
      );
      this.dialogRef.close(true);
    } catch (error: any) {
      this.notificationService.error(
        'Provisioning failed',
        error?.message || 'Could not provision subscription'
      );
      console.error('[provision-subscription] error:', error);
    } finally {
      this.isProcessing.set(false);
    }
  }
}
