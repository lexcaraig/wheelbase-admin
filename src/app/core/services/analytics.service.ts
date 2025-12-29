import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import {
  AnalyticsResponse,
  AdvancedAnalyticsResponse,
  DateRangeParams,
  ExportOptions,
  ExportResponse,
  UserRetentionCohort,
  GeographicDistribution,
  PopularRoute,
  TrendingHashtag,
  TopActiveUser
} from '../models/analytics.model';
import * as Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  constructor(private api: ApiService) {}

  // ========================================
  // Basic Analytics (MVP)
  // ========================================

  /**
   * Get dashboard analytics metrics
   */
  async getDashboardMetrics(): Promise<AnalyticsResponse> {
    return await this.api.call<AnalyticsResponse>('analytics-dashboard');
  }

  // ========================================
  // Advanced Analytics (BACKOFFICE-002)
  // ========================================

  /**
   * Get advanced analytics with custom date range
   */
  async getAdvancedAnalytics(dateRange: DateRangeParams): Promise<AdvancedAnalyticsResponse> {
    return await this.api.call<AdvancedAnalyticsResponse>('analytics-advanced', dateRange);
  }

  /**
   * Get user retention cohort analysis
   */
  async getRetentionCohorts(dateRange: DateRangeParams): Promise<UserRetentionCohort[]> {
    return await this.api.call<UserRetentionCohort[]>('analytics-retention', dateRange);
  }

  /**
   * Get geographic distribution of users
   */
  async getGeographicDistribution(): Promise<GeographicDistribution[]> {
    return await this.api.call<GeographicDistribution[]>('analytics-geographic');
  }

  /**
   * Get popular routes
   */
  async getPopularRoutes(dateRange: DateRangeParams, limit: number = 10): Promise<PopularRoute[]> {
    return await this.api.call<PopularRoute[]>('analytics-popular-routes', { ...dateRange, limit });
  }

  /**
   * Get trending hashtags
   */
  async getTrendingHashtags(limit: number = 20): Promise<TrendingHashtag[]> {
    return await this.api.call<TrendingHashtag[]>('analytics-trending-hashtags', { limit });
  }

  /**
   * Get top active users
   */
  async getTopActiveUsers(dateRange: DateRangeParams, limit: number = 10): Promise<TopActiveUser[]> {
    return await this.api.call<TopActiveUser[]>('analytics-top-users', { ...dateRange, limit });
  }

  // ========================================
  // Export Functions (Client-Side)
  // ========================================

  /**
   * Export analytics data to CSV
   */
  exportToCSV(data: any[], filename: string): void {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Export analytics data to JSON
   */
  exportToJSON(data: any, filename: string): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Export analytics report to PDF
   */
  exportToPDF(data: AdvancedAnalyticsResponse, dateRange: DateRangeParams, filename: string): void {
    const doc = new jsPDF();
    let yOffset = 20;

    // Header
    doc.setFontSize(20);
    doc.text('Wheelbase Analytics Report', 105, yOffset, { align: 'center' });
    yOffset += 10;

    doc.setFontSize(12);
    doc.text(`Period: ${dateRange.startDate} to ${dateRange.endDate}`, 105, yOffset, { align: 'center' });
    yOffset += 15;

    // User Metrics
    doc.setFontSize(16);
    doc.text('User Metrics', 14, yOffset);
    yOffset += 10;

    autoTable(doc, {
      startY: yOffset,
      head: [['Metric', 'Value']],
      body: [
        ['Total Users', data.user_growth_detailed[data.user_growth_detailed.length - 1]?.total_users || 0],
        ['iOS Users', data.device_breakdown.ios],
        ['Android Users', data.device_breakdown.android],
      ],
    });

    yOffset = (doc as any).lastAutoTable.finalY + 15;

    // Popular Routes
    if (data.popular_routes.length > 0) {
      doc.setFontSize(16);
      doc.text('Popular Routes', 14, yOffset);
      yOffset += 10;

      autoTable(doc, {
        startY: yOffset,
        head: [['Route Name', 'Rides', 'Avg Distance (km)', 'Avg Duration (min)']],
        body: data.popular_routes.map(route => [
          route.route_name,
          route.ride_count,
          route.avg_distance_km.toFixed(1),
          route.avg_duration_minutes.toFixed(0),
        ]),
      });

      yOffset = (doc as any).lastAutoTable.finalY + 15;
    }

    // Trending Hashtags
    if (data.trending_hashtags.length > 0) {
      if (yOffset > 250) {
        doc.addPage();
        yOffset = 20;
      }

      doc.setFontSize(16);
      doc.text('Trending Hashtags', 14, yOffset);
      yOffset += 10;

      autoTable(doc, {
        startY: yOffset,
        head: [['Hashtag', 'Posts', 'Growth Rate', 'Trending Score']],
        body: data.trending_hashtags.slice(0, 10).map(tag => [
          tag.hashtag,
          tag.post_count,
          `${tag.growth_rate.toFixed(1)}%`,
          tag.trending_score.toFixed(2),
        ]),
      });
    }

    // Save PDF
    doc.save(`${filename}.pdf`);
  }

  /**
   * Helper: Get default date range (last 30 days)
   */
  getDefaultDateRange(): DateRangeParams {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  }

  /**
   * Helper: Get date range presets
   */
  getDateRangePresets(): { label: string; value: DateRangeParams }[] {
    const today = new Date();

    return [
      {
        label: 'Last 7 Days',
        value: {
          startDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        },
      },
      {
        label: 'Last 30 Days',
        value: {
          startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        },
      },
      {
        label: 'Last 90 Days',
        value: {
          startDate: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        },
      },
      {
        label: 'This Month',
        value: {
          startDate: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        },
      },
      {
        label: 'Last Month',
        value: {
          startDate: new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0],
          endDate: new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0],
        },
      },
    ];
  }
}
