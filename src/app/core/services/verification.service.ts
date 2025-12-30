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

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );
  }

  /**
   * Get all verification requests with optional filtering
   */
  async getVerificationQueue(
    filters: VerificationQueueFilters
  ): Promise<VerificationQueueResponse> {
    try {
      // Build query
      let query = this.supabase
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
        `, { count: 'exact' });

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply pagination
      const from = (filters.page - 1) * filters.pageSize;
      const to = from + filters.pageSize - 1;
      query = query.range(from, to);

      // Order by submitted_at descending (newest first)
      query = query.order('submitted_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      // Get counts by status
      const { data: stats } = await this.supabase
        .from('provider_verification_requests')
        .select('status', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { data: approvedStats } = await this.supabase
        .from('provider_verification_requests')
        .select('status', { count: 'exact', head: true })
        .eq('status', 'approved');

      const { data: rejectedStats } = await this.supabase
        .from('provider_verification_requests')
        .select('status', { count: 'exact', head: true })
        .eq('status', 'rejected');

      return {
        requests: (data as VerificationRequest[]) || [],
        total: count || 0,
        pending: (stats as any)?.count || 0,
        approved: (approvedStats as any)?.count || 0,
        rejected: (rejectedStats as any)?.count || 0
      };
    } catch (error: any) {
      console.error('Error fetching verification queue:', error);
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
   */
  async reviewClaim(request: ReviewClaimRequest): Promise<void> {
    try {
      const { data, error } = await this.supabase.functions.invoke('review-claim', {
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
