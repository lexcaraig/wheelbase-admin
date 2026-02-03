import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  SubscriptionStats,
  IapTransaction,
  FeatureFlag,
  ExpiringSubscription
} from '../models/subscription.model';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  constructor(private supabase: SupabaseService) {}

  async getSubscriptionStats(): Promise<SubscriptionStats> {
    const { data, error } = await this.supabase.client.rpc('get_subscription_stats');
    if (error) throw new Error(error.message);
    const stats = Array.isArray(data) ? data[0] : data;
    return stats as SubscriptionStats;
  }

  async getIapTransactions(params: {
    page?: number;
    pageSize?: number;
    platform?: string;
    transactionType?: string;
    userId?: string;
  }): Promise<{ transactions: IapTransaction[]; total: number }> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 25;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabase.client
      .from('iap_transactions')
      .select(`
        id, user_id, platform, product_id, transaction_id,
        original_transaction_id, purchase_date, expires_date,
        transaction_type, is_valid, verification_status,
        created_at, updated_at,
        users!inner(username, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (params.platform && params.platform !== 'all') {
      query = query.eq('platform', params.platform);
    }
    if (params.transactionType && params.transactionType !== 'all') {
      query = query.eq('transaction_type', params.transactionType);
    }
    if (params.userId) {
      query = query.eq('user_id', params.userId);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    const transactions = (data || []).map((t: any) => ({
      ...t,
      username: t.users?.username,
      email: t.users?.email,
      users: undefined
    }));

    return { transactions, total: count || 0 };
  }

  async getFeatureFlags(): Promise<FeatureFlag[]> {
    const { data, error } = await this.supabase.client
      .from('feature_flags')
      .select('id, key, value, description, updated_at, updated_by')
      .order('key');
    if (error) throw new Error(error.message);
    return data as FeatureFlag[];
  }

  async updateFeatureFlag(id: string, value: boolean): Promise<void> {
    const { error } = await this.supabase.client
      .from('feature_flags')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getExpiringSubscriptions(): Promise<ExpiringSubscription[]> {
    const now = new Date().toISOString();
    const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await this.supabase.client
      .from('users')
      .select('id, username, email, avatar_url, subscription_tier, subscription_expires_at, subscription_source')
      .neq('subscription_tier', 'free')
      .not('subscription_expires_at', 'is', null)
      .gte('subscription_expires_at', now)
      .lte('subscription_expires_at', sevenDaysLater)
      .order('subscription_expires_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data as ExpiringSubscription[];
  }

  async updateUserSubscriptionTier(userId: string, tier: 'free' | 'pro' | 'premium'): Promise<void> {
    const updateData: any = { subscription_tier: tier };
    if (tier === 'free') {
      updateData.subscription_expires_at = null;
      updateData.subscription_source = 'free';
    } else {
      updateData.subscription_source = 'promotional';
    }

    const { error } = await this.supabase.client
      .from('users')
      .update(updateData)
      .eq('id', userId);
    if (error) throw new Error(error.message);
  }
}
