/**
 * Logo shape options for positioning in mobile app
 */
export type LogoShape = 'square' | 'horizontal';

/**
 * Promotion model for Quick Action Widget banner ads
 * Managed via Admin Panel, displayed in mobile app
 */
export interface Promotion {
  id: string;
  title: string;
  subtitle?: string | null;
  logo_url?: string | null;
  logo_shape: LogoShape;
  background_color: string;
  text_color: string;
  cta_url?: string | null;
  priority: number;
  target_tiers: string[];
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  click_count: number;
  impression_count: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Promotion creation/update payload
 */
export interface PromotionPayload {
  title: string;
  subtitle?: string | null;
  logo_url?: string | null;
  logo_shape?: LogoShape;
  background_color?: string;
  text_color?: string;
  cta_url?: string | null;
  priority?: number;
  target_tiers?: string[];
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
}

/**
 * Promotion analytics summary
 */
export interface PromotionAnalytics {
  total_clicks: number;
  total_impressions: number;
  click_through_rate: number;
  active_promotions: number;
  scheduled_promotions: number;
}

/**
 * Daily performance stats
 */
export interface DailyStats {
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  unique_viewers: number;
  unique_clickers: number;
}

/**
 * Geographic stats
 */
export interface GeoStats {
  country_code: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

/**
 * User tier stats
 */
export interface TierStats {
  user_tier: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

/**
 * Platform stats
 */
export interface PlatformStats {
  device_platform: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

/**
 * Hourly stats
 */
export interface HourlyStats {
  hour_of_day: number;
  impressions: number;
  clicks: number;
}

/**
 * Full promotion report
 */
export interface PromotionReport {
  promotion: {
    id: string;
    title: string;
    subtitle: string | null;
    start_date: string | null;
    end_date: string | null;
    target_tiers: string[];
    cta_url: string | null;
  };
  summary: {
    total_impressions: number;
    total_clicks: number;
    unique_viewers: number;
    unique_clickers: number;
    ctr: number;
    campaign_days: number;
  };
  daily_breakdown: DailyStats[];
  geographic_breakdown: GeoStats[];
  tier_breakdown: TierStats[];
  platform_breakdown: PlatformStats[];
  hourly_breakdown: HourlyStats[];
  generated_at: string;
}
