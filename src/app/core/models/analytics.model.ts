// ========================================
// Basic Dashboard Metrics (MVP)
// ========================================

export interface DashboardMetrics {
  total_users: number;
  dau: number; // Daily Active Users
  mau: number; // Monthly Active Users
  rides_this_month: number;
  posts_this_month: number;
  new_users_today: number;
  active_groups: number;
}

export interface UserGrowthData {
  date: string;
  new_users: number;
  total_users: number;
}

export interface RideActivityData {
  date: string;
  rides_count: number;
  total_distance_km: number;
}

export interface TopCountry {
  country_code: string;
  user_count: number;
}

export interface SubscriptionTiers {
  free: number;
  pro: number;
  premium: number;
}

export interface AnalyticsResponse {
  metrics: DashboardMetrics;
  user_growth: UserGrowthData[];
  ride_activity: RideActivityData[];
  subscription_tiers: SubscriptionTiers;
  top_countries: TopCountry[];
}

// ========================================
// Advanced Analytics (BACKOFFICE-002)
// ========================================

export interface DateRangeParams {
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
}

export interface UserRetentionCohort {
  cohort_month: string; // e.g., "2024-01"
  users: number;
  day_0: number;  // 100% (registration day)
  day_1: number;  // % retained after 1 day
  day_7: number;  // % retained after 7 days
  day_30: number; // % retained after 30 days
}

export interface GeographicDistribution {
  country_code: string;
  country_name: string;
  user_count: number;
  percentage: number;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface DeviceBreakdown {
  ios: number;
  android: number;
  web: number; // Future
}

export interface ActiveUsersByHour {
  hour: number; // 0-23
  user_count: number;
}

export interface PopularRoute {
  route_id: string;
  route_name: string;
  ride_count: number;
  avg_distance_km: number;
  avg_duration_minutes: number;
}

export interface RideParticipation {
  solo_rides: number;
  group_rides: number;
  total_rides: number;
}

export interface PostEngagement {
  date: string;
  total_posts: number;
  total_likes: number;
  total_comments: number;
  avg_engagement_rate: number; // (likes + comments) / posts
}

export interface TrendingHashtag {
  hashtag: string;
  post_count: number;
  growth_rate: number; // percentage increase vs previous period
  trending_score: number; // algorithm: 70% recency + 30% growth
}

export interface TopActiveUser {
  user_id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  post_count: number;
  ride_count: number;
  engagement_score: number;
}

export interface NetworkGrowth {
  date: string;
  new_followers: number;
  total_followers: number;
}

// ========================================
// Advanced Analytics Response
// ========================================

export interface AdvancedAnalyticsResponse {
  // User Metrics
  user_growth_detailed: UserGrowthData[];
  retention_cohorts: UserRetentionCohort[];
  geographic_distribution: GeographicDistribution[];
  device_breakdown: DeviceBreakdown;
  active_by_hour: ActiveUsersByHour[];

  // Ride Metrics
  popular_routes: PopularRoute[];
  ride_participation: RideParticipation;
  avg_ride_stats: {
    duration_minutes: number;
    distance_km: number;
  };

  // Social Metrics
  post_engagement: PostEngagement[];
  trending_hashtags: TrendingHashtag[];
  top_active_users: TopActiveUser[];
  network_growth: NetworkGrowth[];
}

// ========================================
// Export Formats
// ========================================

export type ExportFormat = 'csv' | 'json' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  dateRange?: DateRangeParams;
  includeCharts?: boolean; // For PDF export
}

export interface ExportResponse {
  downloadUrl?: string; // If server-generated
  data?: any; // If client-generated
  filename: string;
}
