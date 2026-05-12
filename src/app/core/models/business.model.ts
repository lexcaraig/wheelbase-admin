/**
 * Business Portal Models for Admin Panel
 */

export type BusinessType = 'shop' | 'service_provider' | 'retailer' | 'dealership';
export type BusinessVerificationStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface OperatingHours {
  [day: string]: {
    open: string;
    close: string;
  };
}

export interface Business {
  id: string;
  auth_id: string;
  owner_email: string;
  business_name: string;
  business_type: BusinessType;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  operating_hours: OperatingHours;
  subscription_tier: SubscriptionTier;
  subscription_expires_at: string | null;
  verification_status: BusinessVerificationStatus;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  country_code: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessListResponse {
  businesses: Business[];
  total: number;
  counts: {
    pending: number;
    approved: number;
    rejected: number;
    suspended: number;
  };
}

export type BillingPeriod = 'monthly' | 'quarterly' | 'annual';
export type BusinessSubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'pending';

export interface ProvisionSubscriptionPayload {
  tier: SubscriptionTier;
  billingPeriod: BillingPeriod;
  amountCents: number;
  currency?: string;
  paymentMethod?: string;
  autoRenew?: boolean;
  startedAt?: string;
  expiresAt?: string;
  notes?: string;
}

export interface BusinessSubscriptionRecord {
  id: string;
  business_id: string;
  tier: SubscriptionTier;
  payment_method: string;
  amount_cents: number;
  currency: string;
  started_at: string;
  expires_at: string;
  auto_renew: boolean;
  status: BusinessSubscriptionStatus;
  created_at: string;
}

export interface BusinessSubscriptionResult {
  business: Business;
  subscription: BusinessSubscriptionRecord;
}

export interface BusinessManageRequest {
  action:
    | 'list'
    | 'get'
    | 'approve'
    | 'reject'
    | 'suspend'
    | 'provision_subscription'
    | 'cancel_subscription';
  businessId?: string;
  reason?: string;
  status?: BusinessVerificationStatus | 'all';
  limit?: number;
  offset?: number;
  search?: string;
  subscription?: ProvisionSubscriptionPayload;
}

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  shop: 'Motorcycle Shop',
  service_provider: 'Service Provider',
  retailer: 'Parts Retailer',
  dealership: 'Dealership',
};

export const BUSINESS_STATUS_LABELS: Record<BusinessVerificationStatus, string> = {
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended',
};

export const SUBSCRIPTION_TIER_LABELS: Record<SubscriptionTier, string> = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise',
};
