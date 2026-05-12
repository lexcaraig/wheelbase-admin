/**
 * Pricing catalog — single source of truth for the admin Pricing review page.
 * Mirrors `wheelbase-docs/partnerships/PRICING_GUIDE.md` (updated May 2026).
 *
 * All prices in PHP (cents-not-used here because the file is for display review,
 * not transaction processing). When wiring into Edge Functions / business_subscriptions,
 * multiply by 100 to convert to amount_cents.
 */

export type BillingPeriod = 'monthly' | 'quarterly' | 'annual';

export interface PriceRow {
  label: string;
  monthly: number;
  quarterlyPerMonth: number;
  quarterlyTotal: number;
  annualPerMonth: number;
  annualTotal: number;
  notes?: string;
}

// ---------------------------------------------------------------------------
// CONSUMER IAP (mobile app) — Free / Pro / Premium
// Source: wheelbase-app/wheelbase_app/lib/core/constants/iap_products.dart
// ---------------------------------------------------------------------------

export interface IapTier {
  tier: 'free' | 'pro' | 'premium';
  label: string;
  monthly: number;
  yearly: number;
  monthlyProductId: string | null;
  yearlyProductId: string | null;
  yearlySavingsPhp: number;
  effectiveYearlyPerMonth: number;
  pitch: string;
}

export const CONSUMER_IAP_TIERS: IapTier[] = [
  {
    tier: 'free',
    label: 'Free',
    monthly: 0,
    yearly: 0,
    monthlyProductId: null,
    yearlyProductId: null,
    yearlySavingsPhp: 0,
    effectiveYearlyPerMonth: 0,
    pitch: 'Basic ride tracking, social feed, group join, 30-day ride history.',
  },
  {
    tier: 'pro',
    label: 'Pro',
    monthly: 149,
    yearly: 1490,
    monthlyProductId: 'com.wheelbase.app.pro.monthly',
    yearlyProductId: 'com.wheelbase.app.pro.yearly',
    yearlySavingsPhp: 298,
    effectiveYearlyPerMonth: 124.17,
    pitch: 'Advanced ride analytics, unlimited history, group creation.',
  },
  {
    tier: 'premium',
    label: 'Premium',
    monthly: 299,
    yearly: 2990,
    monthlyProductId: 'com.wheelbase.app.premium.monthly',
    yearlyProductId: 'com.wheelbase.app.premium.yearly',
    yearlySavingsPhp: 598,
    effectiveYearlyPerMonth: 249.17,
    pitch: 'Everything in Pro + ride export, ride playback, lean angle & wheelie stats.',
  },
];

// ---------------------------------------------------------------------------
// BUSINESS ACCOUNT — wheelbase-business portal
// ---------------------------------------------------------------------------

export const BUSINESS_ACCOUNT_PRICING: PriceRow = {
  label: 'Business Account',
  monthly: 1100,
  quarterlyPerMonth: 990,
  quarterlyTotal: 2970,
  annualPerMonth: 935,
  annualTotal: 11220,
  notes: 'Full portal access at business.ridewheelbase.app — catalog, orders, analytics, team.',
};

// ---------------------------------------------------------------------------
// AD PLACEMENTS — promotions managed via admin
// ---------------------------------------------------------------------------

export interface AdPackage {
  key: 'starter' | 'basic' | 'standard' | 'premium';
  label: string;
  placements: number;
  placementsLabel: string;
  monthly: number;
  quarterlyPerMonth: number;
  quarterlyTotal: number;
  annualPerMonth: number;
  annualTotal: number;
}

export const AD_PLACEMENT_PACKAGES: AdPackage[] = [
  {
    key: 'starter',
    label: 'Starter',
    placements: 1,
    placementsLabel: '1 placement',
    monthly: 500,
    quarterlyPerMonth: 450,
    quarterlyTotal: 1350,
    annualPerMonth: 425,
    annualTotal: 5100,
  },
  {
    key: 'basic',
    label: 'Basic',
    placements: 3,
    placementsLabel: '3 placements',
    monthly: 1200,
    quarterlyPerMonth: 1080,
    quarterlyTotal: 3240,
    annualPerMonth: 1020,
    annualTotal: 12240,
  },
  {
    key: 'standard',
    label: 'Standard',
    placements: 5,
    placementsLabel: '5 placements',
    monthly: 2000,
    quarterlyPerMonth: 1800,
    quarterlyTotal: 5400,
    annualPerMonth: 1700,
    annualTotal: 20400,
  },
  {
    key: 'premium',
    label: 'Premium',
    placements: 7,
    placementsLabel: 'All 7 placements',
    monthly: 3000,
    quarterlyPerMonth: 2700,
    quarterlyTotal: 8100,
    annualPerMonth: 2550,
    annualTotal: 30600,
  },
];

export const AD_PLACEMENT_LOCATIONS = [
  { key: 'dashboard', label: 'Dashboard', moment: 'First thing users see on app open' },
  { key: 'marketplace_browse', label: 'Marketplace Browse', moment: 'Shopping/browsing intent' },
  { key: 'marketplace_detail', label: 'Marketplace Detail', moment: 'Purchase consideration' },
  { key: 'post_ride', label: 'Post Ride', moment: 'High engagement after completing ride' },
  { key: 'routes', label: 'Routes', moment: 'Planning next ride' },
  { key: 'services', label: 'Services', moment: 'Looking for shops/mechanics' },
  { key: 'events', label: 'Events', moment: 'Planning rides/meetups' },
];

// ---------------------------------------------------------------------------
// BUNDLES — Ads + Business combined
// ---------------------------------------------------------------------------

export interface BundlePackage {
  key: 'starter' | 'basic' | 'standard' | 'premium';
  label: string;
  includes: string;
  regularPrice: number;
  monthlyBundle: number;
  quarterlyPerMonth: number;
  quarterlyTotal: number;
  annualPerMonth: number;
  annualTotal: number;
}

export const BUNDLE_PACKAGES: BundlePackage[] = [
  {
    key: 'starter',
    label: 'Starter Bundle',
    includes: '1 placement + Business',
    regularPrice: 1600,
    monthlyBundle: 1360,
    quarterlyPerMonth: 1292,
    quarterlyTotal: 3876,
    annualPerMonth: 1224,
    annualTotal: 14688,
  },
  {
    key: 'basic',
    label: 'Basic Bundle',
    includes: '3 placements + Business',
    regularPrice: 2300,
    monthlyBundle: 1955,
    quarterlyPerMonth: 1857,
    quarterlyTotal: 5571,
    annualPerMonth: 1760,
    annualTotal: 21114,
  },
  {
    key: 'standard',
    label: 'Standard Bundle',
    includes: '5 placements + Business',
    regularPrice: 3100,
    monthlyBundle: 2635,
    quarterlyPerMonth: 2503,
    quarterlyTotal: 7510,
    annualPerMonth: 2372,
    annualTotal: 28458,
  },
  {
    key: 'premium',
    label: 'Premium Bundle',
    includes: 'All 7 placements + Business',
    regularPrice: 4100,
    monthlyBundle: 3485,
    quarterlyPerMonth: 3311,
    quarterlyTotal: 9932,
    annualPerMonth: 3137,
    annualTotal: 37638,
  },
];

// ---------------------------------------------------------------------------
// Commitment discount metadata for display
// ---------------------------------------------------------------------------

export const COMMITMENT_DISCOUNTS = [
  { period: 'Monthly' as const, discount: '—', note: 'No commitment' },
  { period: 'Quarterly' as const, discount: '10% off', note: '3-month prepaid (5% on bundles → ~19.25% total off regular)' },
  { period: 'Annual' as const, discount: '15% off', note: '12-month prepaid (10% on bundles → 23.5% total off regular)' },
];

export const PRICING_EFFECTIVE_DATE = 'May 2026';
export const PRICING_DOC_VERSION = '2.1';
