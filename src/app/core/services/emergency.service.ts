// Emergency Service
// TICKET-009: Admin Emergency Dashboard - Service layer
// Queries sos_alerts, crash_detections, and related tables for monitoring

import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Observable, from, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

// ===================================
// Interfaces
// ===================================

export interface SOSAlert {
  id: string;
  user_id: string;
  location: { lat: number; lng: number } | null;
  location_accuracy_m: number | null;
  message: string | null;
  alert_type: 'manual' | 'automatic';
  status: 'countdown' | 'active' | 'resolved' | 'cancelled';
  emergency_contacts_notified: boolean;
  help_arrived: boolean;
  triggered_at: string;
  resolved_at: string | null;
  created_at: string;
  // Joined fields
  user?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    phone: string | null;
  };
}

export interface CrashDetection {
  id: string;
  user_id: string;
  ride_id: string | null;
  location: { lat: number; lng: number } | null;
  impact_force_g: number;
  speed_before_kph: number | null;
  speed_after_kph: number | null;
  detection_confidence: number;
  manual_override: boolean;
  false_positive: boolean;
  emergency_contacts_notified: boolean;
  police_notified: boolean;
  detected_at: string;
  resolved_at: string | null;
  resolution_status: string | null;
  created_at: string;
  // Joined fields
  user?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface SOSCallAttempt {
  id: string;
  sos_alert_id: string;
  contact_id: string;
  attempt_number: number;
  call_initiated_at: string;
  call_status: 'initiated' | 'answered' | 'voicemail' | 'busy' | 'no_answer' | 'failed';
  call_duration_seconds: number | null;
  created_at: string;
  // Joined fields
  contact?: {
    id: string;
    name: string;
    phone: string;
    relationship: string | null;
  };
}

export interface EmergencyStats {
  total_sos_alerts: number;
  active_sos_alerts: number;
  resolved_sos_alerts: number;
  cancelled_sos_alerts: number;
  total_crash_detections: number;
  false_positives: number;
  true_positives: number;
  avg_response_time_seconds: number | null;
  alerts_today: number;
  alerts_this_week: number;
  alerts_this_month: number;
}

export interface EmergencyTimelineItem {
  type: 'sos' | 'crash' | 'call_attempt' | 'resolved';
  timestamp: string;
  user_name: string;
  description: string;
  alert_id: string;
  severity: 'critical' | 'high' | 'medium' | 'info';
}

// ===================================
// Service
// ===================================

@Injectable({
  providedIn: 'root'
})
export class EmergencyService {
  private supabaseService = inject(SupabaseService);

  // ===================================
  // SOS Alerts
  // ===================================

  /**
   * Get all SOS alerts with optional filtering
   */
  getSOSAlerts(options?: {
    status?: string;
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }): Observable<{ alerts: SOSAlert[]; total: number }> {
    return from(this.fetchSOSAlerts(options));
  }

  private async fetchSOSAlerts(options?: {
    status?: string;
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<{ alerts: SOSAlert[]; total: number }> {
    let query = this.supabaseService.client
      .from('sos_alerts')
      .select(`
        *,
        user:users!user_id (
          id,
          username,
          full_name,
          avatar_url,
          phone
        )
      `, { count: 'exact' })
      .order('triggered_at', { ascending: false });

    // Apply filters
    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }

    if (options?.startDate) {
      query = query.gte('triggered_at', options.startDate);
    }

    if (options?.endDate) {
      query = query.lte('triggered_at', options.endDate);
    }

    // Pagination
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to fetch SOS alerts:', error);
      throw new Error(error.message);
    }

    // Parse PostGIS location to lat/lng
    const alerts = (data || []).map(alert => ({
      ...alert,
      location: this.parsePostGISPoint(alert.location)
    })) as SOSAlert[];

    return { alerts, total: count ?? 0 };
  }

  /**
   * Get a single SOS alert by ID with call attempts
   */
  getSOSAlertDetail(alertId: string): Observable<{
    alert: SOSAlert;
    callAttempts: SOSCallAttempt[];
  }> {
    return from(this.fetchSOSAlertDetail(alertId));
  }

  private async fetchSOSAlertDetail(alertId: string): Promise<{
    alert: SOSAlert;
    callAttempts: SOSCallAttempt[];
  }> {
    // Fetch alert
    const { data: alertData, error: alertError } = await this.supabaseService.client
      .from('sos_alerts')
      .select(`
        *,
        user:users!user_id (
          id,
          username,
          full_name,
          avatar_url,
          phone
        )
      `)
      .eq('id', alertId)
      .single();

    if (alertError) throw new Error(alertError.message);

    // Fetch call attempts
    const { data: callData, error: callError } = await this.supabaseService.client
      .from('sos_call_attempts')
      .select(`
        *,
        contact:emergency_contacts!contact_id (
          id,
          name,
          phone,
          relationship
        )
      `)
      .eq('sos_alert_id', alertId)
      .order('attempt_number', { ascending: true });

    if (callError) throw new Error(callError.message);

    const alert = {
      ...alertData,
      location: this.parsePostGISPoint(alertData.location)
    } as SOSAlert;

    return {
      alert,
      callAttempts: (callData || []) as SOSCallAttempt[]
    };
  }

  /**
   * Update SOS alert status (e.g., mark help arrived)
   */
  updateSOSAlert(alertId: string, updates: Partial<{
    status: string;
    help_arrived: boolean;
    resolved_at: string;
    admin_notes: string;
  }>): Observable<void> {
    return from(
      this.supabaseService.client
        .from('sos_alerts')
        .update(updates)
        .eq('id', alertId)
        .then(({ error }) => {
          if (error) throw new Error(error.message);
        })
    );
  }

  // ===================================
  // Crash Detections
  // ===================================

  /**
   * Get crash detection records
   */
  getCrashDetections(options?: {
    limit?: number;
    offset?: number;
    falsePositiveOnly?: boolean;
  }): Observable<{ detections: CrashDetection[]; total: number }> {
    return from(this.fetchCrashDetections(options));
  }

  private async fetchCrashDetections(options?: {
    limit?: number;
    offset?: number;
    falsePositiveOnly?: boolean;
  }): Promise<{ detections: CrashDetection[]; total: number }> {
    let query = this.supabaseService.client
      .from('crash_detections')
      .select(`
        *,
        user:users!user_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `, { count: 'exact' })
      .order('detected_at', { ascending: false });

    if (options?.falsePositiveOnly) {
      query = query.eq('false_positive', true);
    }

    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to fetch crash detections:', error);
      throw new Error(error.message);
    }

    const detections = (data || []).map(d => ({
      ...d,
      location: this.parsePostGISPoint(d.location)
    })) as CrashDetection[];

    return { detections, total: count ?? 0 };
  }

  // ===================================
  // Statistics
  // ===================================

  /**
   * Get emergency statistics overview
   */
  getEmergencyStats(): Observable<EmergencyStats> {
    return from(this.fetchEmergencyStats());
  }

  private async fetchEmergencyStats(): Promise<EmergencyStats> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Fetch all counts in parallel
    const [
      totalResult,
      activeResult,
      resolvedResult,
      cancelledResult,
      crashResult,
      falsePositiveResult,
      todayResult,
      weekResult,
      monthResult
    ] = await Promise.all([
      // Total SOS alerts
      this.supabaseService.client
        .from('sos_alerts')
        .select('id', { count: 'exact', head: true }),
      // Active
      this.supabaseService.client
        .from('sos_alerts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      // Resolved
      this.supabaseService.client
        .from('sos_alerts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'resolved'),
      // Cancelled
      this.supabaseService.client
        .from('sos_alerts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'cancelled'),
      // Total crash detections
      this.supabaseService.client
        .from('crash_detections')
        .select('id', { count: 'exact', head: true }),
      // False positives
      this.supabaseService.client
        .from('crash_detections')
        .select('id', { count: 'exact', head: true })
        .eq('false_positive', true),
      // Today
      this.supabaseService.client
        .from('sos_alerts')
        .select('id', { count: 'exact', head: true })
        .gte('triggered_at', todayStart),
      // This week
      this.supabaseService.client
        .from('sos_alerts')
        .select('id', { count: 'exact', head: true })
        .gte('triggered_at', weekStart),
      // This month
      this.supabaseService.client
        .from('sos_alerts')
        .select('id', { count: 'exact', head: true })
        .gte('triggered_at', monthStart)
    ]);

    // Calculate average response time for resolved alerts
    const { data: resolvedAlerts } = await this.supabaseService.client
      .from('sos_alerts')
      .select('triggered_at, resolved_at')
      .eq('status', 'resolved')
      .not('resolved_at', 'is', null)
      .limit(100);

    let avgResponseTime: number | null = null;
    if (resolvedAlerts && resolvedAlerts.length > 0) {
      const totalSeconds = resolvedAlerts.reduce((sum, alert) => {
        const triggered = new Date(alert.triggered_at).getTime();
        const resolved = new Date(alert.resolved_at).getTime();
        return sum + (resolved - triggered) / 1000;
      }, 0);
      avgResponseTime = Math.round(totalSeconds / resolvedAlerts.length);
    }

    const totalCrash = crashResult.count ?? 0;
    const falsePositives = falsePositiveResult.count ?? 0;

    return {
      total_sos_alerts: totalResult.count ?? 0,
      active_sos_alerts: activeResult.count ?? 0,
      resolved_sos_alerts: resolvedResult.count ?? 0,
      cancelled_sos_alerts: cancelledResult.count ?? 0,
      total_crash_detections: totalCrash,
      false_positives: falsePositives,
      true_positives: totalCrash - falsePositives,
      avg_response_time_seconds: avgResponseTime,
      alerts_today: todayResult.count ?? 0,
      alerts_this_week: weekResult.count ?? 0,
      alerts_this_month: monthResult.count ?? 0
    };
  }

  /**
   * Get recent emergency activity timeline
   */
  getActivityTimeline(limit: number = 20): Observable<EmergencyTimelineItem[]> {
    return from(this.fetchActivityTimeline(limit));
  }

  private async fetchActivityTimeline(limit: number): Promise<EmergencyTimelineItem[]> {
    // Fetch recent SOS alerts
    const { data: alerts } = await this.supabaseService.client
      .from('sos_alerts')
      .select(`
        id,
        status,
        alert_type,
        triggered_at,
        resolved_at,
        user:users!user_id (full_name)
      `)
      .order('triggered_at', { ascending: false })
      .limit(limit);

    const timeline: EmergencyTimelineItem[] = [];

    if (alerts) {
      for (const alert of alerts) {
        // Handle Supabase join which may return array or object
        const userObj = Array.isArray(alert.user) ? alert.user[0] : alert.user;
        const userName = userObj?.full_name || 'Unknown User';

        // Add triggered event
        timeline.push({
          type: alert.alert_type === 'automatic' ? 'crash' : 'sos',
          timestamp: alert.triggered_at,
          user_name: userName,
          description: alert.alert_type === 'automatic'
            ? 'Crash detected - SOS triggered automatically'
            : 'Manual SOS alert triggered',
          alert_id: alert.id,
          severity: alert.status === 'active' ? 'critical' : 'high'
        });

        // Add resolved event if applicable
        if (alert.resolved_at) {
          timeline.push({
            type: 'resolved',
            timestamp: alert.resolved_at,
            user_name: userName,
            description: `SOS alert resolved (${alert.status})`,
            alert_id: alert.id,
            severity: 'info'
          });
        }
      }
    }

    // Sort by timestamp descending and limit
    return timeline
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // ===================================
  // Helpers
  // ===================================

  /**
   * Parse PostGIS POINT format to lat/lng object
   * Format: POINT(longitude latitude)
   */
  private parsePostGISPoint(point: any): { lat: number; lng: number } | null {
    if (!point) return null;

    // If it's already an object with coordinates
    if (typeof point === 'object' && point.coordinates) {
      return {
        lng: point.coordinates[0],
        lat: point.coordinates[1]
      };
    }

    // If it's a string like "POINT(longitude latitude)"
    if (typeof point === 'string') {
      const match = point.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
      if (match) {
        return {
          lng: parseFloat(match[1]),
          lat: parseFloat(match[2])
        };
      }
    }

    return null;
  }

  /**
   * Format duration in seconds to human-readable string
   */
  formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
}
