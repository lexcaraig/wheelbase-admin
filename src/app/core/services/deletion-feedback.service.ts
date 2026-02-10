import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { DeletionFeedbackEntry, DeletionFeedbackStats } from '../models/deletion-feedback.model';

@Injectable({
  providedIn: 'root'
})
export class DeletionFeedbackService {
  constructor(private supabase: SupabaseService) {}

  async getFeedback(params: {
    page?: number;
    pageSize?: number;
    reason?: string;
    search?: string;
  }): Promise<{ entries: DeletionFeedbackEntry[]; total: number }> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 25;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabase.client
      .from('users')
      .select('id, username, email, deleted_at, deletion_reason, deletion_details', { count: 'exact' })
      .eq('account_status', 'deleted')
      .order('deleted_at', { ascending: false })
      .range(from, to);

    if (params.reason && params.reason !== 'all') {
      query = query.eq('deletion_reason', params.reason);
    }

    if (params.search) {
      query = query.or(`username.ilike.%${params.search}%,email.ilike.%${params.search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return { entries: (data || []) as DeletionFeedbackEntry[], total: count || 0 };
  }

  async getStats(): Promise<DeletionFeedbackStats> {
    // Get all deleted users with their reasons
    const { data: allDeleted, error: allError } = await this.supabase.client
      .from('users')
      .select('deletion_reason, deleted_at')
      .eq('account_status', 'deleted');

    if (allError) throw new Error(allError.message);

    const entries = allDeleted || [];
    const total_deleted = entries.length;
    const with_feedback = entries.filter(e => e.deletion_reason != null).length;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const last_30_days = entries.filter(e => e.deleted_at && e.deleted_at >= thirtyDaysAgo).length;

    // Group by reason
    const reasonCounts: Record<string, number> = {};
    for (const entry of entries) {
      if (entry.deletion_reason) {
        reasonCounts[entry.deletion_reason] = (reasonCounts[entry.deletion_reason] || 0) + 1;
      }
    }

    const reason_breakdown = Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    return { total_deleted, with_feedback, last_30_days, reason_breakdown };
  }
}
