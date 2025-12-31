import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import {
  VerificationRequest,
  ReviewClaimRequest,
  VerificationQueueFilters,
  VerificationQueueResponse,
  ClaimStatus
} from '../models/verification.model';

@Injectable({
  providedIn: 'root'
})
export class VerificationService {
  private supabase: SupabaseClient;
  private adminClient: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );

    // ⚠️ Admin client with service role key - DEVELOPMENT ONLY
    // TODO: Replace with proper authentication in production
    this.adminClient = createClient(
      environment.supabaseUrl,
      (environment as any).supabaseServiceRoleKey || environment.supabaseAnonKey
    );
  }

  /**
   * Get all verification requests with optional filtering
   */
  async getVerificationQueue(
    filters: VerificationQueueFilters
  ): Promise<VerificationQueueResponse> {
    try {
      console.log('🔵 Calling admin Edge Function...');

      // Call Edge Function instead of direct database query
      // This uses service role key server-side to bypass RLS
      const { data, error } = await this.supabase.functions.invoke('admin-get-verifications', {
        body: {
          status: filters.status,
          page: filters.page,
          pageSize: filters.pageSize
        }
      });

      console.log('🔵 Edge Function response:', { data, error });

      if (error) throw error;
      if (!data || !data.success) {
        throw new Error(data?.error?.message || 'Failed to fetch verification requests');
      }

      const result = data.data;
      console.log('✅ Verification data:', result);

      return {
        requests: result.requests || [],
        total: result.total || 0,
        pending: result.pending || 0,
        approved: result.approved || 0,
        rejected: result.rejected || 0
      };
    } catch (error: any) {
      console.error('❌ Error fetching verification queue:', error);
      throw new Error(error.message || 'Failed to fetch verification requests');
    }
  }

  /**
   * Get a single verification request by ID
   */
  async getVerificationRequest(requestId: string): Promise<VerificationRequest> {
    try {
      const { data, error } = await this.supabase
        .from('provider_verification_requests')
        .select(`
          *,
          service_provider:service_providers(
            id,
            business_name,
            category,
            address,
            city,
            state_province
          )
        `)
        .eq('id', requestId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Verification request not found');

      return data as VerificationRequest;
    } catch (error: any) {
      console.error('Error fetching verification request:', error);
      throw new Error(error.message || 'Failed to fetch verification request');
    }
  }

  /**
   * Review a claim (approve or reject) via Edge Function
   * Uses admin client with service role key for authentication
   */
  async reviewClaim(request: ReviewClaimRequest): Promise<void> {
    try {
      // Use admin client with service role key
      const { data, error } = await this.adminClient.functions.invoke('review-claim', {
        body: {
          requestId: request.requestId,
          action: request.action,
          rejectionReason: request.rejectionReason,
          adminNotes: request.adminNotes
        }
      });

      if (error) throw error;

      // Check for function execution errors
      if (data?.error) {
        throw new Error(data.error.message || 'Failed to review claim');
      }
    } catch (error: any) {
      console.error('Error reviewing claim:', error);
      throw new Error(error.message || 'Failed to review claim');
    }
  }

  /**
   * Get public URL for uploaded document
   */
  getDocumentUrl(documentUrl: string | null): string | null {
    if (!documentUrl) return null;

    // If it's already a full URL, return it
    if (documentUrl.startsWith('http')) {
      return documentUrl;
    }

    // Otherwise, construct the public URL
    const { data } = this.supabase.storage
      .from('public')
      .getPublicUrl(documentUrl);

    return data.publicUrl;
  }

  /**
   * Get verification statistics for dashboard
   */
  async getVerificationStats(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  }> {
    try {
      const { count: total } = await this.supabase
        .from('provider_verification_requests')
        .select('*', { count: 'exact', head: true });

      const { count: pending } = await this.supabase
        .from('provider_verification_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: approved } = await this.supabase
        .from('provider_verification_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      const { count: rejected } = await this.supabase
        .from('provider_verification_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected');

      return {
        total: total || 0,
        pending: pending || 0,
        approved: approved || 0,
        rejected: rejected || 0
      };
    } catch (error: any) {
      console.error('Error fetching verification stats:', error);
      throw new Error(error.message || 'Failed to fetch verification stats');
    }
  }
}
