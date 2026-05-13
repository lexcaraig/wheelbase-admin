// Business Verification Models

export type ClaimStatus = 'pending' | 'approved' | 'rejected';
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type RequestedTier = 'pro' | 'enterprise';
export type BillingPeriod = 'monthly' | 'quarterly' | 'annual';

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

export interface ProvisionedSubscription {
  id: string;
  business_id: string;
  tier: SubscriptionTier;
  payment_method: string;
  amount_cents: number;
  currency: string;
  started_at: string;
  expires_at: string;
  auto_renew: boolean;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  created_at: string;
}

export interface VerificationRequest {
  id: string;
  provider_id: string;
  user_id: string;
  business_name: string;
  owner_name: string;
  contact_number: string;
  email: string;
  business_registration_number: string | null;
  tax_id: string | null;  // Also used to store BIR Certificate URL
  business_permit_url: string | null;
  tax_id_document_url: string | null;  // Used for DTI Registration
  proof_of_ownership_url: string | null;  // Used for Government ID
  status: ClaimStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;

  // Joined data from service_providers (admin-get-verifications now returns these)
  service_provider?: {
    id: string;
    business_name: string;
    category: string;
    address: string;
    city: string;
    state_province: string | null;
    subscription_tier?: SubscriptionTier | null;
    subscription_expires_at?: string | null;
    requested_tier?: RequestedTier | null;
    requested_billing_period?: BillingPeriod | null;
    requested_amount_cents?: number | null;
    requested_at?: string | null;
  };
}

export interface ReviewClaimRequest {
  requestId: string;
  action: 'approve' | 'reject';
  rejectionReason?: string;
  adminNotes?: string;
  /** Optional. Only meaningful on action='approve'. When present, the
   *  edge function auto-provisions a subscription in the same transaction. */
  subscription?: ProvisionSubscriptionPayload;
}

export interface ReviewClaimResponse {
  requestId: string;
  providerId: string;
  status: 'approved' | 'rejected';
  reviewedAt: string;
  rejectionReason?: string;
  subscription?: ProvisionedSubscription | null;
  message: string;
}

export interface VerificationQueueFilters {
  status?: ClaimStatus | 'all';
  page: number;
  pageSize: number;
}

export interface VerificationQueueResponse {
  requests: VerificationRequest[];
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

/**
 * Helper: did the merchant request a paid plan at signup?
 * Returns null if no request, else a normalized summary.
 */
export function getRequestedSummary(req: VerificationRequest): {
  tier: RequestedTier;
  billingPeriod: BillingPeriod;
  amountCents: number;
} | null {
  const sp = req.service_provider;
  if (!sp?.requested_tier || !sp.requested_billing_period || sp.requested_amount_cents == null) {
    return null;
  }
  return {
    tier: sp.requested_tier,
    billingPeriod: sp.requested_billing_period,
    amountCents: sp.requested_amount_cents,
  };
}
