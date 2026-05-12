import { Component, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  AD_PLACEMENT_LOCATIONS,
  AD_PLACEMENT_PACKAGES,
  BUNDLE_PACKAGES,
  BUSINESS_ACCOUNT_PRICING,
  COMMITMENT_DISCOUNTS,
  CONSUMER_IAP_TIERS,
  PRICING_DOC_VERSION,
  PRICING_EFFECTIVE_DATE,
} from '../../core/models/pricing.model';

type SectionKey = 'business' | 'ads' | 'bundles' | 'iap';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink],
  template: `
    <div class="p-6 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-3xl font-bold text-base-content">Pricing Catalog</h1>
          <p class="text-sm text-base-content/60 mt-1">
            Effective {{ effectiveDate }} · Doc v{{ docVersion }} · Source of truth:
            <span class="font-mono text-xs">wheelbase-docs/partnerships/PRICING_GUIDE.md</span>
          </p>
        </div>
        <div class="badge badge-warning badge-lg">Read-only review</div>
      </div>

      <!-- Commitment ladder summary -->
      <div class="card bg-base-100 shadow-sm border border-base-300 mb-6">
        <div class="card-body p-4">
          <h3 class="font-semibold text-base-content text-sm uppercase tracking-wide mb-2">
            Commitment Discount Ladder
          </h3>
          <div class="flex flex-wrap gap-3">
            @for (c of commitmentDiscounts; track c.period) {
              <div class="flex-1 min-w-[200px] p-3 rounded-lg bg-base-200 border border-base-300">
                <div class="font-bold text-lg">{{ c.period }}</div>
                <div class="text-primary font-semibold">{{ c.discount }}</div>
                <div class="text-xs text-base-content/60 mt-1">{{ c.note }}</div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Tab navigation -->
      <div role="tablist" class="tabs tabs-boxed mb-4">
        @for (t of tabs; track t.key) {
          <button
            role="tab"
            class="tab"
            [class.tab-active]="activeSection() === t.key"
            (click)="activeSection.set(t.key)"
          >
            {{ t.label }}
          </button>
        }
      </div>

      <!-- BUSINESS ACCOUNT -->
      @if (activeSection() === 'business') {
        <section class="card bg-base-100 shadow-sm border border-base-300">
          <div class="card-body">
            <div class="flex items-start justify-between gap-4 flex-wrap mb-2">
              <div>
                <h2 class="card-title text-2xl">Business Account</h2>
                <p class="text-base-content/70 mt-1">
                  Full portal access at
                  <a href="https://business.ridewheelbase.app" target="_blank" rel="noopener" class="link link-primary">
                    business.ridewheelbase.app
                  </a>
                </p>
              </div>
              <div class="badge badge-success">B2B SaaS</div>
            </div>

            <div class="overflow-x-auto mt-4">
              <table class="table table-zebra">
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th class="text-right">Per-month Rate</th>
                    <th class="text-right">Period Total</th>
                    <th>Savings</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span class="font-semibold">Monthly</span></td>
                    <td class="text-right font-mono">{{ business.monthly | currency:'PHP':'symbol-narrow':'1.0-0' }}</td>
                    <td class="text-right font-mono">{{ business.monthly | currency:'PHP':'symbol-narrow':'1.0-0' }}/mo</td>
                    <td><span class="text-base-content/50">—</span></td>
                  </tr>
                  <tr class="bg-warning/5">
                    <td><span class="font-semibold">Quarterly</span> <span class="badge badge-sm badge-warning ml-1">NEW</span></td>
                    <td class="text-right font-mono">{{ business.quarterlyPerMonth | currency:'PHP':'symbol-narrow':'1.0-0' }}</td>
                    <td class="text-right font-mono">{{ business.quarterlyTotal | currency:'PHP':'symbol-narrow':'1.0-0' }}/qtr</td>
                    <td><span class="badge badge-warning badge-sm">10% off</span></td>
                  </tr>
                  <tr>
                    <td><span class="font-semibold">Annual</span></td>
                    <td class="text-right font-mono">{{ business.annualPerMonth | currency:'PHP':'symbol-narrow':'1.0-0' }}</td>
                    <td class="text-right font-mono">{{ business.annualTotal | currency:'PHP':'symbol-narrow':'1.0-0' }}/yr</td>
                    <td><span class="badge badge-success badge-sm">15% off</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="text-xs text-base-content/60 mt-3">{{ business.notes }}</div>

            <div class="divider my-4">Features included</div>
            <ul class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <li class="flex gap-2"><span class="text-success">✓</span> Product catalog (unlimited listings)</li>
              <li class="flex gap-2"><span class="text-success">✓</span> Order management dashboard</li>
              <li class="flex gap-2"><span class="text-success">✓</span> Payment integration (GCash, PayMaya, more)</li>
              <li class="flex gap-2"><span class="text-success">✓</span> Analytics dashboard</li>
              <li class="flex gap-2"><span class="text-success">✓</span> Team management with role-based access</li>
              <li class="flex gap-2"><span class="text-success">✓</span> Customer reviews</li>
              <li class="flex gap-2"><span class="text-success">✓</span> Multi-currency (7 SEA currencies)</li>
            </ul>
          </div>
        </section>
      }

      <!-- AD PLACEMENTS -->
      @if (activeSection() === 'ads') {
        <section class="card bg-base-100 shadow-sm border border-base-300">
          <div class="card-body">
            <div class="flex items-start justify-between gap-4 flex-wrap mb-2">
              <div>
                <h2 class="card-title text-2xl">Ad Placements</h2>
                <p class="text-base-content/70 mt-1">
                  Banner advertising across 7 high-engagement screens. Managed via
                  <a routerLink="/promotions" class="link link-primary">Promotions</a>.
                </p>
              </div>
              <div class="badge badge-info">Brand revenue</div>
            </div>

            <div class="overflow-x-auto mt-4">
              <table class="table table-zebra">
                <thead>
                  <tr>
                    <th>Package</th>
                    <th>Placements</th>
                    <th class="text-right">Monthly</th>
                    <th class="text-right">Quarterly (per mo)</th>
                    <th class="text-right">Quarterly Total</th>
                    <th class="text-right">Annual (per mo)</th>
                    <th class="text-right">Annual Total</th>
                  </tr>
                </thead>
                <tbody>
                  @for (pkg of adPackages; track pkg.key) {
                    <tr>
                      <td><span class="font-semibold">{{ pkg.label }}</span></td>
                      <td>{{ pkg.placementsLabel }}</td>
                      <td class="text-right font-mono">{{ pkg.monthly | currency:'PHP':'symbol-narrow':'1.0-0' }}</td>
                      <td class="text-right font-mono text-warning">{{ pkg.quarterlyPerMonth | currency:'PHP':'symbol-narrow':'1.0-0' }}</td>
                      <td class="text-right font-mono text-warning/80 text-xs">{{ pkg.quarterlyTotal | currency:'PHP':'symbol-narrow':'1.0-0' }}/q</td>
                      <td class="text-right font-mono text-success">{{ pkg.annualPerMonth | currency:'PHP':'symbol-narrow':'1.0-0' }}</td>
                      <td class="text-right font-mono text-success/80 text-xs">{{ pkg.annualTotal | currency:'PHP':'symbol-narrow':'1.0-0' }}/yr</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="divider my-4">Placement locations</div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              @for (loc of placementLocations; track loc.key) {
                <div class="p-3 rounded-lg bg-base-200 border border-base-300">
                  <div class="font-semibold text-base-content">{{ loc.label }}</div>
                  <div class="text-xs text-base-content/60 mt-1">{{ loc.moment }}</div>
                </div>
              }
            </div>

            <div class="alert alert-info mt-4 text-sm">
              <span>
                <strong>Ad spec:</strong> 1200×400 PNG/JPG (3:1), max 500 KB, custom CTA URL, evenly rotated if multiple ads per placement.
              </span>
            </div>
          </div>
        </section>
      }

      <!-- BUNDLES -->
      @if (activeSection() === 'bundles') {
        <section class="card bg-base-100 shadow-sm border border-base-300">
          <div class="card-body">
            <div class="flex items-start justify-between gap-4 flex-wrap mb-2">
              <div>
                <h2 class="card-title text-2xl">Bundles</h2>
                <p class="text-base-content/70 mt-1">
                  Ads + Business combined. 15% off base; quarterly stacks +5% (~19.25% off regular); annual stacks +10% (23.5% off regular).
                </p>
              </div>
              <div class="badge badge-secondary">Best value</div>
            </div>

            <div class="overflow-x-auto mt-4">
              <table class="table table-zebra">
                <thead>
                  <tr>
                    <th>Bundle</th>
                    <th>Includes</th>
                    <th class="text-right">Regular</th>
                    <th class="text-right">Monthly Bundle (–15%)</th>
                    <th class="text-right">Quarterly (per mo)</th>
                    <th class="text-right">Annual (per mo)</th>
                  </tr>
                </thead>
                <tbody>
                  @for (b of bundles; track b.key) {
                    <tr>
                      <td><span class="font-semibold">{{ b.label }}</span></td>
                      <td class="text-sm">{{ b.includes }}</td>
                      <td class="text-right font-mono text-base-content/50 line-through">{{ b.regularPrice | currency:'PHP':'symbol-narrow':'1.0-0' }}</td>
                      <td class="text-right font-mono font-semibold">{{ b.monthlyBundle | currency:'PHP':'symbol-narrow':'1.0-0' }}</td>
                      <td class="text-right font-mono text-warning">
                        {{ b.quarterlyPerMonth | currency:'PHP':'symbol-narrow':'1.0-0' }}
                        <div class="text-xs text-warning/70">{{ b.quarterlyTotal | currency:'PHP':'symbol-narrow':'1.0-0' }}/q</div>
                      </td>
                      <td class="text-right font-mono text-success">
                        {{ b.annualPerMonth | currency:'PHP':'symbol-narrow':'1.0-0' }}
                        <div class="text-xs text-success/70">{{ b.annualTotal | currency:'PHP':'symbol-narrow':'1.0-0' }}/yr</div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="alert alert-success mt-4 text-sm">
              <span>
                Annual bundle = monthly bundle × 0.9 (10% off bundle → 23.5% total off regular).
                Quarterly bundle = monthly bundle × 0.95 (5% off bundle → ~19.25% total off regular).
              </span>
            </div>
          </div>
        </section>
      }

      <!-- CONSUMER IAP -->
      @if (activeSection() === 'iap') {
        <section class="card bg-base-100 shadow-sm border border-base-300">
          <div class="card-body">
            <div class="flex items-start justify-between gap-4 flex-wrap mb-2">
              <div>
                <h2 class="card-title text-2xl">Consumer IAP (Mobile App)</h2>
                <p class="text-base-content/70 mt-1">
                  Rider subscriptions via Apple App Store + Google Play. Prices controlled in the store console; values shown are the configured PHP rates.
                </p>
              </div>
              <div class="badge badge-primary">B2C subscription</div>
            </div>

            <div class="overflow-x-auto mt-4">
              <table class="table table-zebra">
                <thead>
                  <tr>
                    <th>Tier</th>
                    <th class="text-right">Monthly</th>
                    <th class="text-right">Yearly</th>
                    <th class="text-right">Effective/mo (yearly)</th>
                    <th class="text-right">Yearly Savings</th>
                  </tr>
                </thead>
                <tbody>
                  @for (t of iapTiers; track t.tier) {
                    <tr>
                      <td>
                        <span class="font-semibold">{{ t.label }}</span>
                        <div class="text-xs text-base-content/60 mt-1">{{ t.pitch }}</div>
                      </td>
                      <td class="text-right font-mono">
                        @if (t.monthly > 0) {
                          {{ t.monthly | currency:'PHP':'symbol-narrow':'1.0-0' }}/mo
                          <div class="text-xs text-base-content/50 font-mono">{{ t.monthlyProductId }}</div>
                        } @else {
                          <span class="text-base-content/50">—</span>
                        }
                      </td>
                      <td class="text-right font-mono">
                        @if (t.yearly > 0) {
                          {{ t.yearly | currency:'PHP':'symbol-narrow':'1.0-0' }}/yr
                          <div class="text-xs text-base-content/50 font-mono">{{ t.yearlyProductId }}</div>
                        } @else {
                          <span class="text-base-content/50">—</span>
                        }
                      </td>
                      <td class="text-right font-mono">
                        @if (t.effectiveYearlyPerMonth > 0) {
                          {{ t.effectiveYearlyPerMonth | currency:'PHP':'symbol-narrow':'1.2-2' }}
                        } @else {
                          <span class="text-base-content/50">—</span>
                        }
                      </td>
                      <td class="text-right">
                        @if (t.yearlySavingsPhp > 0) {
                          <span class="badge badge-success badge-sm">{{ t.yearlySavingsPhp | currency:'PHP':'symbol-narrow':'1.0-0' }} (2mo free, ~17%)</span>
                        } @else {
                          <span class="text-base-content/50">—</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="alert alert-warning mt-4 text-sm">
              <span>
                <strong>Note:</strong> Store-side prices are FX-converted by Apple/Google for non-PH markets. PHP rates are the source of truth in
                <span class="font-mono text-xs">lib/core/constants/iap_products.dart</span>.
              </span>
            </div>
          </div>
        </section>
      }

      <!-- Footer -->
      <div class="mt-6 text-xs text-base-content/50">
        To edit pricing: update <span class="font-mono">pricing.model.ts</span> AND <span class="font-mono">wheelbase-docs/partnerships/PRICING_GUIDE.md</span> together. Drift between code and sales collateral causes invoicing errors.
      </div>
    </div>
  `,
})
export class PricingComponent {
  activeSection = signal<SectionKey>('business');

  tabs: { key: SectionKey; label: string }[] = [
    { key: 'business', label: 'Business Account' },
    { key: 'ads', label: 'Ad Placements' },
    { key: 'bundles', label: 'Bundles' },
    { key: 'iap', label: 'Consumer IAP' },
  ];

  business = BUSINESS_ACCOUNT_PRICING;
  adPackages = AD_PLACEMENT_PACKAGES;
  placementLocations = AD_PLACEMENT_LOCATIONS;
  bundles = BUNDLE_PACKAGES;
  iapTiers = CONSUMER_IAP_TIERS;
  commitmentDiscounts = COMMITMENT_DISCOUNTS;
  effectiveDate = PRICING_EFFECTIVE_DATE;
  docVersion = PRICING_DOC_VERSION;
}
