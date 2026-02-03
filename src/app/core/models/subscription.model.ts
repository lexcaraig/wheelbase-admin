export interface SubscriptionStats {
  total_users: number;
  free_users: number;
  pro_users: number;
  premium_users: number;
  conversion_rate: number;
  expiring_soon: number;
}

export interface IapTransaction {
  id: string;
  user_id: string;
  platform: 'apple' | 'google';
  product_id: string;
  transaction_id: string;
  original_transaction_id: string | null;
  purchase_date: string;
  expires_date: string | null;
  transaction_type: 'purchase' | 'renewal' | 'upgrade' | 'downgrade' | 'cancellation' | 'refund' | 'restore';
  is_valid: boolean;
  verification_status: string | null;
  created_at: string;
  updated_at: string;
  // Joined from users table
  username?: string;
  email?: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  value: boolean;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface ExpiringSubscription {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  subscription_tier: 'pro' | 'premium';
  subscription_expires_at: string;
  subscription_source: string;
}
