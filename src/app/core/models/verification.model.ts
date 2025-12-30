// Business Verification Models

export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export interface VerificationRequest {
  id: string;
  provider_id: string;
  user_id: string;
  business_name: string;
  owner_name: string;
  contact_number: string;
  email: string;
  business_registration_number: string | null;
  tax_id: string | null;
  business_permit_url: string | null;
  tax_id_document_url: string | null;
  proof_of_ownership_url: string | null;
  status: ClaimStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;

  // Joined data from service_providers
  service_provider?: {
    id: string;
    business_name: string;
    category: string;
    address: string;
    city: string;
    state_province: string | null;
  };
}

export interface ReviewClaimRequest {
  requestId: string;
  action: 'approve' | 'reject';
  rejectionReason?: string;
  adminNotes?: string;
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
