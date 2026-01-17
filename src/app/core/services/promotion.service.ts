import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Promotion, PromotionPayload, PromotionAnalytics, PromotionReport } from '../models/promotion.model';

@Injectable({
  providedIn: 'root'
})
export class PromotionService {

  constructor(private supabase: SupabaseService) {}

  /**
   * Get all promotions with optional filters
   */
  async getPromotions(options?: {
    activeOnly?: boolean;
    limit?: number;
    offset?: number;
    orderBy?: string;
    ascending?: boolean;
  }): Promise<{ data: Promotion[]; count: number }> {
    let query = this.supabase.client
      .from('promotions')
      .select('*', { count: 'exact' });

    if (options?.activeOnly) {
      query = query.eq('is_active', true);
    }

    // Order
    const orderColumn = options?.orderBy || 'created_at';
    const ascending = options?.ascending ?? false;
    query = query.order(orderColumn, { ascending });

    // Pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options?.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching promotions:', error);
      throw new Error(error.message);
    }

    return {
      data: data as Promotion[],
      count: count || 0
    };
  }

  /**
   * Get a single promotion by ID
   */
  async getPromotion(id: string): Promise<Promotion> {
    const { data, error } = await this.supabase.client
      .from('promotions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching promotion:', error);
      throw new Error(error.message);
    }

    return data as Promotion;
  }

  /**
   * Create a new promotion
   */
  async createPromotion(payload: PromotionPayload): Promise<Promotion> {
    // Get current user's admin_users.id for created_by field
    const session = await this.supabase.getSession();
    const authId = session?.user?.id;

    // Look up admin_users.id from auth_id
    let createdBy: string | null = null;
    if (authId) {
      const { data: adminUser } = await this.supabase.client
        .from('admin_users')
        .select('id')
        .eq('auth_id', authId)
        .single();
      createdBy = adminUser?.id || null;
    }

    const { data, error } = await this.supabase.client
      .from('promotions')
      .insert({
        ...payload,
        created_by: createdBy
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating promotion:', error);
      throw new Error(error.message);
    }

    return data as Promotion;
  }

  /**
   * Update an existing promotion
   */
  async updatePromotion(id: string, payload: PromotionPayload): Promise<Promotion> {
    const { data, error } = await this.supabase.client
      .from('promotions')
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating promotion:', error);
      throw new Error(error.message);
    }

    return data as Promotion;
  }

  /**
   * Delete a promotion
   */
  async deletePromotion(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('promotions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting promotion:', error);
      throw new Error(error.message);
    }
  }

  /**
   * Toggle promotion active status
   */
  async toggleActive(id: string, isActive: boolean): Promise<Promotion> {
    const { data, error } = await this.supabase.client
      .from('promotions')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error toggling promotion status:', error);
      throw new Error(error.message);
    }

    return data as Promotion;
  }

  /**
   * Get promotion analytics summary
   */
  async getAnalytics(): Promise<PromotionAnalytics> {
    const { data, error } = await this.supabase.client
      .from('promotions')
      .select('click_count, impression_count, is_active, start_date, end_date');

    if (error) {
      console.error('Error fetching promotion analytics:', error);
      throw new Error(error.message);
    }

    const promotions = data as Promotion[];
    const now = new Date();

    const totalClicks = promotions.reduce((sum, p) => sum + p.click_count, 0);
    const totalImpressions = promotions.reduce((sum, p) => sum + p.impression_count, 0);
    const activeCount = promotions.filter(p => p.is_active).length;
    const scheduledCount = promotions.filter(p => {
      if (!p.start_date) return false;
      return new Date(p.start_date) > now;
    }).length;

    return {
      total_clicks: totalClicks,
      total_impressions: totalImpressions,
      click_through_rate: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      active_promotions: activeCount,
      scheduled_promotions: scheduledCount
    };
  }

  /**
   * Get detailed promotion report for a specific campaign
   */
  async getPromotionReport(promotionId: string): Promise<PromotionReport> {
    const { data, error } = await this.supabase.client
      .rpc('get_promotion_report', { p_promotion_id: promotionId });

    if (error) {
      console.error('Error fetching promotion report:', error);
      throw new Error(error.message);
    }

    return data as PromotionReport;
  }

  /**
   * Get daily stats for a promotion
   */
  async getDailyStats(promotionId: string): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('promotion_daily_stats')
      .select('*')
      .eq('promotion_id', promotionId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching daily stats:', error);
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * Get geographic stats for a promotion
   */
  async getGeoStats(promotionId: string): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('promotion_geo_stats')
      .select('*')
      .eq('promotion_id', promotionId);

    if (error) {
      console.error('Error fetching geo stats:', error);
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * Get tier stats for a promotion
   */
  async getTierStats(promotionId: string): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('promotion_tier_stats')
      .select('*')
      .eq('promotion_id', promotionId);

    if (error) {
      console.error('Error fetching tier stats:', error);
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * Get platform stats for a promotion
   */
  async getPlatformStats(promotionId: string): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('promotion_platform_stats')
      .select('*')
      .eq('promotion_id', promotionId);

    if (error) {
      console.error('Error fetching platform stats:', error);
      throw new Error(error.message);
    }

    return data || [];
  }
}
