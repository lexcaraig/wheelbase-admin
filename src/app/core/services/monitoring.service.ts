import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { environment } from '../../../environments/environment';
import { Observable, from, map, catchError, of } from 'rxjs';

export interface InfrastructureMetrics {
  users: {
    total_users: number;
    auth_users: number;
    dau: number;
    wau: number;
    mau: number;
    dau_mau_ratio: number;
  };
  content: {
    total_posts: number;
    total_rides: number;
    active_rides: number;
    total_groups: number;
    active_groups: number;
  };
  database: {
    size_mb: number;
    table_sizes: Array<{
      table_name: string;
      size_mb: number;
      row_count: number;
    }>;
  };
  storage: {
    size_mb: number;
    file_count: number;
  };
  costs: {
    estimated_monthly: number;
    free_tier_status: {
      database: { used_mb: number; limit_mb: number; percentage: number };
      egress: { used_mb: number; limit_mb: number; percentage: number };
      storage: { used_mb: number; limit_mb: number; percentage: number };
    };
  };
  upstash: {
    total_commands: number;
    total_keys: number;
    memory_used_mb: number;
    daily_command_limit: number;
    is_configured: boolean;
  };
}

export interface ApiUsageMetrics {
  total_calls: number;
  avg_calls_per_day: number;
  top_endpoints: Array<{
    name: string;
    calls: number;
    percentage: number;
  }>;
  top_users: Array<{
    user_id: string;
    username: string;
    full_name: string;
    calls: number;
  }>;
  hourly_pattern: Array<{
    hour: number;
    calls: number;
  }>;
  daily_breakdown: Array<{
    date: string;
    calls: number;
  }>;
}

export interface SpikeAnalysis {
  spike_detected: boolean;
  percentage_increase: number;
  target_count: number;
  baseline_avg: number;
  timeline: Array<{
    hour: number;
    calls: number;
    normalAvg: number;
  }>;
  top_users: Array<{
    user_id: string;
    username: string;
    calls: number;
    percentage: number;
  }>;
  top_endpoints: Array<{
    name: string;
    calls: number;
    percentage: number;
  }>;
  possible_causes: Array<{
    cause: string;
    confidence: number;
    evidence: string;
  }>;
  recommendation: 'normal_activity' | 'monitor_closely' | 'investigate_abuse';
}

export interface MonitoringAlert {
  id: string;
  alert_type: 'egress_warning' | 'egress_critical' | 'api_spike' | 'rate_limit_abuse' | 'database_full' | 'user_growth_spike';
  severity: 'info' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  is_dismissed: boolean;
  dismissed_at: string | null;
  dismissed_by: string | null;
  created_at: string;
}

export interface MonitoringSnapshot {
  id: string;
  date: string;
  total_users: number;
  new_users: number;
  dau: number;
  wau: number;
  mau: number;
  dau_mau_ratio: number;
  total_posts: number;
  total_rides: number;
  active_rides: number;
  total_groups: number;
  active_groups: number;
  api_calls: number;
  egress_mb: number;
  database_size_mb: number;
  storage_size_mb: number;
  upstash_commands: number;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class MonitoringService {
  private supabaseService = inject(SupabaseService);

  /**
   * Get infrastructure metrics (users, content, database, storage, costs)
   */
  getInfrastructureMetrics(): Observable<InfrastructureMetrics> {
    return from(this.callEdgeFunction<InfrastructureMetrics>('admin-infrastructure-metrics'));
  }

  /**
   * Get API usage breakdown by endpoint, user, and time
   * @param period '7d' | '30d' | '90d'
   */
  getApiUsage(period: '7d' | '30d' | '90d' = '7d'): Observable<ApiUsageMetrics> {
    return from(this.callEdgeFunction<ApiUsageMetrics>(`admin-api-usage?period=${period}`));
  }

  /**
   * Analyze specific date for activity spikes
   * @param date Date in YYYY-MM-DD format
   * @param threshold Spike threshold percentage (default: 50%)
   */
  analyzeSpike(date: string, threshold: number = 50): Observable<SpikeAnalysis> {
    return from(
      this.callEdgeFunction<SpikeAnalysis>('admin-analyze-spike', {
        method: 'POST',
        body: JSON.stringify({ date, threshold })
      })
    );
  }

  /**
   * Get all active alerts (not dismissed)
   */
  getActiveAlerts(): Observable<MonitoringAlert[]> {
    return from(
      this.supabaseService.client
        .from('monitoring_alerts')
        .select('*')
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .then(({ data, error }: { data: any; error: any }) => {
          if (error) throw error;
          return data as MonitoringAlert[];
        })
    );
  }

  /**
   * Dismiss an alert
   */
  dismissAlert(alertId: string): Observable<void> {
    return from(
      this.supabaseService.client
        .from('monitoring_alerts')
        .update({
          is_dismissed: true,
          dismissed_at: new Date().toISOString()
        })
        .eq('id', alertId)
        .then(({ error }: { error: any }) => {
          if (error) throw error;
        })
    );
  }

  /**
   * Get monitoring snapshots (historical data)
   * @param days Number of days to retrieve (default: 30)
   */
  getSnapshots(days: number = 30): Observable<MonitoringSnapshot[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return from(
      this.supabaseService.client
        .from('monitoring_snapshots')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true })
        .then(({ data, error }: { data: any; error: any }) => {
          if (error) throw error;
          return data as MonitoringSnapshot[];
        })
    );
  }

  /**
   * Manually trigger snapshot capture
   */
  captureSnapshot(): Observable<void> {
    return from(this.callEdgeFunction<void>('capture-monitoring-snapshot', { method: 'POST' }));
  }

  /**
   * Helper: Call Edge Function with authentication
   */
  private async callEdgeFunction<T>(
    functionPath: string,
    options: RequestInit = {}
  ): Promise<T> {
    const session = await this.supabaseService.client.auth.getSession();
    const token = session.data.session?.access_token;

    if (!token) {
      throw new Error('Not authenticated');
    }

    const url = `${environment.supabaseUrl}/functions/v1/${functionPath}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Edge Function call failed');
    }

    const result = await response.json();
    return result.data as T;
  }
}
