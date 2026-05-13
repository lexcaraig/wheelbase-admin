import { Component, Inject, computed, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import {
  VerificationRequest,
  SubscriptionTier,
  BillingPeriod,
  ProvisionSubscriptionPayload,
  getRequestedSummary
} from '../../../core/models/verification.model';
import { VerificationService } from '../../../core/services/verification.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { BadgeSeverity } from '../../../shared/components/status-badge/status-badge.component';
import { formatDateTime } from '../../../shared/utils';
import { DocumentViewerDialogComponent } from './document-viewer-dialog.component';
import {
  AD_PLACEMENT_PACKAGES,
  BUNDLE_PACKAGES,
  BUSINESS_ACCOUNT_PRICING,
} from '../../../core/models/pricing.model';
import { InvoiceGeneratorService } from '../../../core/services/invoice-generator.service';

type PackageMode =
  | 'business_only'
  | 'bundle_starter' | 'bundle_basic' | 'bundle_standard' | 'bundle_premium'
  | 'ads_starter' | 'ads_basic' | 'ads_standard' | 'ads_premium'
  | 'custom';

export interface VerificationReviewDialogData {
  request: VerificationRequest;
  verificationService: VerificationService;
}

@Component({
  selector: 'app-verification-review-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    CurrencyPipe
  ],
  styles: [`
    :host {
      display: block;
    }
    /* Override Material dialog container with daisyUI theme */
    ::ng-deep .mat-mdc-dialog-container .mat-mdc-dialog-surface {
      background-color: oklch(var(--b2)) !important;
      color: oklch(var(--bc)) !important;
      border-radius: var(--rounded-box, 1rem) !important;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
    }
    ::ng-deep .cdk-overlay-dark-backdrop {
      background-color: rgba(0, 0, 0, 0.7) !important;
    }
  `],
  template: `
    <div class="p-6 max-h-[85vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-base-content">Review Claim - {{ data.request.business_name }}</h2>
        <button class="btn btn-ghost btn-sm btn-square" (click)="onClose()">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="space-y-6">
        <!-- Business Information -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-4">
            <h3 class="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">business</span>
              Business Information
            </h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-base-content/70">Business Name</label>
                <div class="text-base-content mt-1">{{ data.request.business_name }}</div>
              </div>
              <div>
                <label class="text-sm font-medium text-base-content/70">Category</label>
                <div class="text-base-content mt-1">{{ data.request.service_provider?.category || 'N/A' }}</div>
              </div>
              <div>
                <label class="text-sm font-medium text-base-content/70">Address</label>
                <div class="text-base-content mt-1">{{ data.request.service_provider?.address || 'N/A' }}</div>
              </div>
              <div>
                <label class="text-sm font-medium text-base-content/70">City</label>
                <div class="text-base-content mt-1">{{ data.request.service_provider?.city || 'N/A' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Owner Information -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-4">
            <h3 class="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">person</span>
              Owner Information
            </h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-base-content/70">Owner Name</label>
                <div class="text-base-content mt-1">{{ data.request.owner_name }}</div>
              </div>
              <div>
                <label class="text-sm font-medium text-base-content/70">Contact Number</label>
                <div class="text-base-content mt-1">{{ data.request.contact_number }}</div>
              </div>
              <div>
                <label class="text-sm font-medium text-base-content/70">Email</label>
                <div class="text-base-content mt-1">{{ data.request.email }}</div>
              </div>
              <div>
                <label class="text-sm font-medium text-base-content/70">Role</label>
                <div class="text-base-content mt-1">Business Owner</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Verification Documents -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-4">
            <h3 class="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">folder_open</span>
              Verification Documents
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Government ID -->
              <div class="card bg-base-200 shadow-sm">
                <div class="card-body p-4">
                  <div class="flex items-center gap-2 mb-3">
                    <span class="material-symbols-outlined text-info">badge</span>
                    <span class="font-medium text-base-content">Government ID</span>
                  </div>
                  @if (data.request.proof_of_ownership_url) {
                    <button
                      class="btn btn-outline btn-sm w-full mb-2"
                      (click)="viewDocument(data.request.proof_of_ownership_url, 'Government ID')"
                    >
                      <span class="material-symbols-outlined text-sm">visibility</span>
                      View Document
                    </button>
                    <div class="flex items-center gap-1 text-success text-sm">
                      <span class="material-symbols-outlined text-sm">check_circle</span> Uploaded
                    </div>
                  } @else {
                    <div class="flex items-center gap-1 text-base-content/50 text-sm">
                      <span class="material-symbols-outlined text-sm">cancel</span> Not uploaded
                    </div>
                  }
                </div>
              </div>

              <!-- Business Permit -->
              <div class="card bg-base-200 shadow-sm">
                <div class="card-body p-4">
                  <div class="flex items-center gap-2 mb-3">
                    <span class="material-symbols-outlined text-info">description</span>
                    <span class="font-medium text-base-content">Business Permit</span>
                  </div>
                  @if (data.request.business_permit_url) {
                    <button
                      class="btn btn-outline btn-sm w-full mb-2"
                      (click)="viewDocument(data.request.business_permit_url, 'Business Permit')"
                    >
                      <span class="material-symbols-outlined text-sm">visibility</span>
                      View Document
                    </button>
                    <div class="flex items-center gap-1 text-success text-sm">
                      <span class="material-symbols-outlined text-sm">check_circle</span> Uploaded
                    </div>
                  } @else {
                    <div class="flex items-center gap-1 text-base-content/50 text-sm">
                      <span class="material-symbols-outlined text-sm">cancel</span> Not uploaded
                    </div>
                  }
                </div>
              </div>

              <!-- DTI/SEC Registration -->
              <div class="card bg-base-200 shadow-sm">
                <div class="card-body p-4">
                  <div class="flex items-center gap-2 mb-3">
                    <span class="material-symbols-outlined text-info">apartment</span>
                    <span class="font-medium text-base-content">DTI/SEC Registration</span>
                  </div>
                  @if (data.request.tax_id_document_url) {
                    <button
                      class="btn btn-outline btn-sm w-full mb-2"
                      (click)="viewDocument(data.request.tax_id_document_url, 'DTI/SEC Registration')"
                    >
                      <span class="material-symbols-outlined text-sm">visibility</span>
                      View Document
                    </button>
                    <div class="flex items-center gap-1 text-success text-sm">
                      <span class="material-symbols-outlined text-sm">check_circle</span> Uploaded
                    </div>
                  } @else {
                    <div class="flex items-center gap-1 text-base-content/50 text-sm">
                      <span class="material-symbols-outlined text-sm">cancel</span> Not uploaded
                    </div>
                  }
                </div>
              </div>

              <!-- BIR Certificate -->
              <div class="card bg-base-200 shadow-sm">
                <div class="card-body p-4">
                  <div class="flex items-center gap-2 mb-3">
                    <span class="material-symbols-outlined text-info">receipt_long</span>
                    <span class="font-medium text-base-content">BIR Certificate</span>
                  </div>
                  @if (data.request.tax_id) {
                    <button
                      class="btn btn-outline btn-sm w-full mb-2"
                      (click)="viewDocument(data.request.tax_id, 'BIR Certificate')"
                    >
                      <span class="material-symbols-outlined text-sm">visibility</span>
                      View Document
                    </button>
                    <div class="flex items-center gap-1 text-success text-sm">
                      <span class="material-symbols-outlined text-sm">check_circle</span> Uploaded
                    </div>
                  } @else {
                    <div class="flex items-center gap-1 text-base-content/50 text-sm">
                      <span class="material-symbols-outlined text-sm">cancel</span> Not uploaded
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Admin Review Section (only if pending) -->
        @if (data.request.status === 'pending') {
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body p-4">
              <h3 class="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">rate_review</span>
                Admin Review
              </h3>

              <!-- Decision Radio Buttons -->
              <div class="mb-4">
                <label class="text-sm font-medium text-base-content/80 mb-3 block">Decision *</label>
                <div class="flex gap-6">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="approve"
                      class="radio radio-success"
                      [(ngModel)]="reviewAction"
                    />
                    <span class="flex items-center gap-1 text-success font-medium">
                      <span class="material-symbols-outlined">check_circle</span> Approve
                    </span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="reject"
                      class="radio radio-error"
                      [(ngModel)]="reviewAction"
                    />
                    <span class="flex items-center gap-1 text-error font-medium">
                      <span class="material-symbols-outlined">cancel</span> Reject
                    </span>
                  </label>
                </div>
              </div>

              <!-- Rejection Reason -->
              @if (reviewAction === 'reject') {
                <div class="form-control mb-4">
                  <label class="label">
                    <span class="label-text font-medium">Rejection Reason *</span>
                  </label>
                  <textarea
                    class="textarea textarea-bordered w-full"
                    [(ngModel)]="rejectionReason"
                    rows="3"
                    placeholder="e.g., Business permit image is unclear, please resubmit"
                  ></textarea>
                  <label class="label">
                    <span class="label-text-alt text-base-content/60">This will be sent to the business owner</span>
                  </label>
                </div>
              }

              <!-- Admin Notes -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Admin Notes (Internal)</span>
                </label>
                <textarea
                  class="textarea textarea-bordered w-full"
                  [(ngModel)]="adminNotes"
                  rows="2"
                  placeholder="e.g., Verified with DTI database / Invoice INV-2026-0001"
                ></textarea>
                <label class="label">
                  <span class="label-text-alt text-base-content/60">Internal notes, not visible to user</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Subscription Provisioning (only when approving) -->
          @if (reviewAction === 'approve') {
            <div class="card bg-base-100 shadow-sm">
              <div class="card-body p-4">
                <div class="flex items-start justify-between gap-4 mb-3 flex-wrap">
                  <h3 class="text-lg font-semibold text-base-content flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary">card_membership</span>
                    Subscription Provisioning
                  </h3>
                  <label class="cursor-pointer label justify-start gap-3 m-0 p-0">
                    <input
                      type="checkbox"
                      class="toggle toggle-primary"
                      [(ngModel)]="provisionEnabled"
                      (ngModelChange)="onProvisionToggle()"
                    />
                    <span class="label-text font-medium">{{ provisionEnabled() ? 'Will be provisioned' : 'Skip (free tier)' }}</span>
                  </label>
                </div>

                @if (requestedSummary(); as r) {
                  <div class="alert alert-warning mb-3 text-sm">
                    <span class="material-symbols-outlined">info</span>
                    <span>
                      Merchant requested at signup:
                      <strong>{{ r.tier === 'pro' ? 'Pro' : 'Enterprise' }}</strong>
                      ({{ r.billingPeriod }}) ·
                      <strong>{{ r.amountCents / 100 | currency:'PHP':'symbol-narrow':'1.0-0' }}</strong>
                      total — prefilled below. Edit if you negotiated different terms.
                    </span>
                  </div>
                }

                @if (provisionEnabled()) {
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label class="form-control">
                      <div class="label py-1"><span class="label-text font-medium text-sm">Package</span></div>
                      <select
                        class="select select-bordered select-sm"
                        [ngModel]="packageMode()"
                        (ngModelChange)="onPackageChange($event)"
                      >
                        <option value="business_only">Business Account</option>
                        @for (b of bundles; track b.key) {
                          <option [value]="'bundle_' + b.key">{{ b.label }} — {{ b.includes }}</option>
                        }
                        @for (a of adPackages; track a.key) {
                          <option [value]="'ads_' + a.key">Ads — {{ a.label }} ({{ a.placementsLabel }})</option>
                        }
                        <option value="custom">Custom (manual amount + tier)</option>
                      </select>
                    </label>

                    <label class="form-control">
                      <div class="label py-1"><span class="label-text font-medium text-sm">Tier</span></div>
                      <select
                        class="select select-bordered select-sm"
                        [(ngModel)]="subTier"
                        [disabled]="packageMode() !== 'custom'"
                      >
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </label>

                    <label class="form-control">
                      <div class="label py-1"><span class="label-text font-medium text-sm">Billing Period</span></div>
                      <select
                        class="select select-bordered select-sm"
                        [(ngModel)]="subPeriod"
                        (ngModelChange)="recomputeAmount()"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly (10% off)</option>
                        <option value="annual">Annual (15% off)</option>
                      </select>
                    </label>

                    <label class="form-control">
                      <div class="label py-1"><span class="label-text font-medium text-sm">Amount (PHP)</span></div>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        class="input input-bordered input-sm"
                        [(ngModel)]="subAmountPhp"
                        [disabled]="packageMode() !== 'custom'"
                      />
                    </label>

                    <label class="form-control">
                      <div class="label py-1"><span class="label-text font-medium text-sm">Payment Method</span></div>
                      <select class="select select-bordered select-sm" [(ngModel)]="subPaymentMethod">
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="gcash">GCash</option>
                        <option value="paymaya">PayMaya</option>
                        <option value="hitpay">HitPay</option>
                        <option value="other">Other</option>
                      </select>
                    </label>

                    <label class="cursor-pointer label justify-start gap-3 col-span-1 md:col-span-2">
                      <input type="checkbox" class="checkbox checkbox-sm checkbox-primary" [(ngModel)]="subAutoRenew" />
                      <span class="label-text text-sm">Auto-renew at period end</span>
                    </label>
                  </div>

                  <div class="bg-base-200 p-3 rounded-lg mt-3 text-sm flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <strong class="text-primary text-lg">{{ subAmountPhp() | currency:'PHP':'symbol-narrow':'1.0-0' }}</strong>
                      <span class="text-base-content/60 ml-2">{{ subPeriod() }} · {{ subTier() | uppercase }}</span>
                    </div>
                    <div class="text-xs text-base-content/60">
                      Access until: <strong>{{ computedExpires() | date:'mediumDate' }}</strong>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        }

        <!-- Already Reviewed Section -->
        @if (data.request.status !== 'pending') {
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body p-4">
              <h3 class="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">info</span>
                Review Details
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-base-content/70">Status</label>
                  <div class="mt-1">
                    <span class="badge" [ngClass]="getStatusBadgeClass(data.request.status)">
                      {{ getStatusLabel(data.request.status) }}
                    </span>
                  </div>
                </div>
                <div>
                  <label class="text-sm font-medium text-base-content/70">Reviewed At</label>
                  <div class="text-base-content mt-1">{{ formatDate(data.request.reviewed_at) }}</div>
                </div>
                @if (data.request.rejection_reason) {
                  <div class="col-span-2">
                    <label class="text-sm font-medium text-base-content/70">Rejection Reason</label>
                    <div class="alert alert-error mt-1">
                      <span>{{ data.request.rejection_reason }}</span>
                    </div>
                  </div>
                }
                @if (data.request.admin_notes) {
                  <div class="col-span-2">
                    <label class="text-sm font-medium text-base-content/70">Admin Notes</label>
                    <div class="text-base-content mt-1">{{ data.request.admin_notes }}</div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Footer Actions -->
      <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-base-300">
        <button class="btn btn-ghost" [disabled]="isProcessing()" (click)="onClose()">Cancel</button>
        @if (canDownloadInvoice()) {
          <button
            class="btn btn-outline btn-info"
            [disabled]="isProcessing()"
            (click)="downloadInvoice()"
            title="Generate a PDF invoice for this subscription"
          >
            <span class="material-symbols-outlined text-sm">receipt_long</span>
            Download Invoice
          </button>
        }
        @if (data.request.status === 'pending') {
          <button
            class="btn btn-primary"
            [disabled]="!reviewAction || isProcessing()"
            (click)="submitReview()"
          >
            @if (isProcessing()) {
              <span class="loading loading-spinner loading-sm"></span>
            }
            {{ submitButtonLabel() }}
          </button>
        }
      </div>
    </div>
  `
})
export class VerificationReviewDialogComponent {
  isProcessing = signal(false);
  reviewAction: 'approve' | 'reject' | null = null;
  rejectionReason = '';
  adminNotes = '';

  // Subscription provisioning state
  provisionEnabled = signal<boolean>(false);
  packageMode = signal<PackageMode>('business_only');
  subTier = signal<SubscriptionTier>('pro');
  subPeriod = signal<BillingPeriod>('monthly');
  subAmountPhp = signal<number>(BUSINESS_ACCOUNT_PRICING.monthly);
  subPaymentMethod = signal<string>('bank_transfer');
  subAutoRenew = signal<boolean>(false);

  bundles = BUNDLE_PACKAGES;
  adPackages = AD_PLACEMENT_PACKAGES;
  business = BUSINESS_ACCOUNT_PRICING;

  requestedSummary = signal<ReturnType<typeof getRequestedSummary> | null>(null);

  periodMonths = computed(() => {
    switch (this.subPeriod()) {
      case 'monthly': return 1;
      case 'quarterly': return 3;
      default: return 12;
    }
  });

  computedExpires = computed(() => {
    const d = new Date();
    d.setUTCMonth(d.getUTCMonth() + this.periodMonths());
    return d;
  });

  submitButtonLabel = computed(() => {
    if (this.reviewAction === 'reject') return 'Reject Claim';
    if (this.reviewAction !== 'approve') return 'Submit Review';
    return this.provisionEnabled() ? 'Approve + Provision' : 'Approve';
  });

  constructor(
    public dialogRef: MatDialogRef<VerificationReviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VerificationReviewDialogData,
    private notificationService: NotificationService,
    private confirmService: ConfirmService,
    private dialog: MatDialog,
    private invoiceGenerator: InvoiceGeneratorService
  ) {
    // Pre-fill from requested plan if merchant chose one at signup
    const requested = getRequestedSummary(this.data.request);
    this.requestedSummary.set(requested);
    if (requested) {
      this.provisionEnabled.set(true);
      this.subTier.set(requested.tier);
      this.subPeriod.set(requested.billingPeriod);
      this.subAmountPhp.set(Math.round(requested.amountCents / 100));
      this.packageMode.set('custom'); // requested amount may not match a preset cleanly
    }
  }

  onClose(): void {
    this.dialogRef.close(false);
  }

  viewDocument(url: string | null, title: string) {
    if (!url) {
      this.notificationService.warn('No Document', 'This document was not uploaded');
      return;
    }

    const fullUrl = this.data.verificationService.getDocumentUrl(url);
    if (!fullUrl) {
      this.notificationService.error('Error', 'Failed to load document URL');
      return;
    }

    this.dialog.open(DocumentViewerDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      data: { url: fullUrl, title }
    });
  }

  onProvisionToggle() {
    if (!this.provisionEnabled()) return;
    if (this.packageMode() === 'business_only') this.recomputeAmount();
  }

  canDownloadInvoice(): boolean {
    // Show the button whenever the admin has dialed in a non-free subscription
    // (either prefilled from the merchant's request, or set manually).
    if (this.reviewAction === 'reject') return false;
    if (!this.provisionEnabled()) return false;
    if (this.subTier() === 'free') return false;
    return this.subAmountPhp() > 0;
  }

  downloadInvoice(): void {
    if (!this.canDownloadInvoice()) return;

    const tierLabel = this.subTier() === 'enterprise' ? 'Enterprise' : 'Pro';
    const periodLabel = this.subPeriod();
    const months = this.periodMonths();

    const start = new Date();
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + months);

    const description = this.packageDescription();

    try {
      const { invoiceNumber, filename } = this.invoiceGenerator.download({
        billTo: {
          businessName: this.data.request.business_name,
          contactName: this.data.request.owner_name,
          email: this.data.request.email,
        },
        lineItems: [
          {
            description: `${description} — ${tierLabel} tier`,
            periodLabel: `${this.formatDate(start.toISOString())} → ${this.formatDate(end.toISOString())} (${periodLabel})`,
            quantity: 1,
            amountPhp: this.subAmountPhp(),
          },
        ],
        internalNotes: this.adminNotes || undefined,
      });
      this.notificationService.success('Invoice generated', `${filename} (${invoiceNumber})`);
    } catch (error: any) {
      this.notificationService.error('Invoice failed', error?.message || 'Could not generate PDF');
      console.error('[invoice] error', error);
    }
  }

  private packageDescription(): string {
    const mode = this.packageMode();
    if (mode === 'business_only') return 'Business Account';
    if (mode === 'custom') return 'Custom Plan';
    if (mode.startsWith('bundle_')) {
      const key = mode.replace('bundle_', '');
      const pkg = this.bundles.find((b) => b.key === key);
      return pkg ? `${pkg.label} — ${pkg.includes}` : 'Bundle';
    }
    if (mode.startsWith('ads_')) {
      const key = mode.replace('ads_', '');
      const pkg = this.adPackages.find((a) => a.key === key);
      return pkg ? `Ads — ${pkg.label} (${pkg.placementsLabel})` : 'Ads';
    }
    return 'Subscription';
  }

  onPackageChange(key: PackageMode) {
    this.packageMode.set(key);
    if (key === 'custom') return;
    this.recomputeAmount();
  }

  private perMonthFor(
    period: BillingPeriod,
    rates: { monthly: number; quarterlyPerMonth: number; annualPerMonth: number }
  ): number {
    switch (period) {
      case 'monthly': return rates.monthly;
      case 'quarterly': return rates.quarterlyPerMonth;
      default: return rates.annualPerMonth;
    }
  }

  recomputeAmount() {
    const mode = this.packageMode();
    const months = this.periodMonths();
    const period = this.subPeriod();

    if (mode === 'business_only') {
      const perMonth = this.perMonthFor(period, this.business);
      this.subAmountPhp.set(perMonth * months);
      this.subTier.set('pro');
      return;
    }

    if (mode.startsWith('bundle_')) {
      const pkg = this.bundles.find(b => b.key === mode.replace('bundle_', ''));
      if (!pkg) return;
      const perMonth = this.perMonthFor(period, { monthly: pkg.monthlyBundle, quarterlyPerMonth: pkg.quarterlyPerMonth, annualPerMonth: pkg.annualPerMonth });
      this.subAmountPhp.set(perMonth * months);
      this.subTier.set('pro');
      return;
    }

    if (mode.startsWith('ads_')) {
      const pkg = this.adPackages.find(a => a.key === mode.replace('ads_', ''));
      if (!pkg) return;
      const perMonth = this.perMonthFor(period, pkg);
      this.subAmountPhp.set(perMonth * months);
      // Ads-only packages don't grant a paid Business tier
      this.subTier.set('free');
    }
  }

  private buildSubscriptionPayload(): ProvisionSubscriptionPayload | undefined {
    if (!this.provisionEnabled() || this.reviewAction !== 'approve') return undefined;
    if (this.subTier() === 'free') return undefined; // ads-only — no Business tier change
    return {
      tier: this.subTier(),
      billingPeriod: this.subPeriod(),
      amountCents: Math.round(this.subAmountPhp() * 100),
      currency: 'PHP',
      paymentMethod: this.subPaymentMethod(),
      autoRenew: this.subAutoRenew(),
      notes: this.adminNotes || undefined,
    };
  }

  async submitReview() {
    if (!this.reviewAction) return;

    if (this.reviewAction === 'reject' && !this.rejectionReason.trim()) {
      this.notificationService.warn('Validation Error', 'Please provide a rejection reason');
      return;
    }

    const subscription = this.buildSubscriptionPayload();
    const willProvision = !!subscription;
    const isApprove = this.reviewAction === 'approve';
    const businessName = this.data.request.business_name;

    let confirmTitle: string;
    let confirmMessage: string;
    let confirmText: string;
    if (!isApprove) {
      confirmTitle = 'Reject Claim';
      confirmMessage = `Are you sure you want to reject this claim for "${businessName}"?`;
      confirmText = 'Reject';
    } else if (willProvision) {
      confirmTitle = 'Approve + Provision Subscription';
      confirmMessage = `Approve "${businessName}" and provision ${subscription!.tier.toUpperCase()} (${subscription!.billingPeriod}) for ₱${this.subAmountPhp().toLocaleString()}?`;
      confirmText = 'Approve + Provision';
    } else {
      confirmTitle = 'Approve Claim';
      confirmMessage = `Approve "${businessName}" without provisioning a subscription? They'll stay on the free tier.`;
      confirmText = 'Approve';
    }

    const confirmed = await this.confirmService.confirm({
      title: confirmTitle,
      message: confirmMessage,
      confirmText,
      confirmColor: isApprove ? 'primary' : 'warn'
    });

    if (!confirmed) return;

    try {
      this.isProcessing.set(true);
      const result = await this.data.verificationService.reviewClaim({
        requestId: this.data.request.id,
        action: this.reviewAction,
        rejectionReason: this.reviewAction === 'reject' ? this.rejectionReason : undefined,
        adminNotes: this.adminNotes || undefined,
        subscription,
      });

      let successMessage: string;
      if (this.reviewAction !== 'approve') {
        successMessage = 'Claim rejected successfully';
      } else if (result?.subscription) {
        successMessage = `Claim approved and ${result.subscription.tier.toUpperCase()} subscription provisioned`;
      } else {
        successMessage = 'Claim approved successfully';
      }

      this.notificationService.success('Success', successMessage);
      this.dialogRef.close(true);
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to review claim');
    } finally {
      this.isProcessing.set(false);
    }
  }

  getStatusSeverity(status: string): BadgeSeverity {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'danger';
      default:
        return 'warning';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'rejected':
        return 'badge-error';
      default:
        return 'badge-warning';
    }
  }

  getStatusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  formatDate(dateString: string | null): string {
    return formatDateTime(dateString);
  }
}
