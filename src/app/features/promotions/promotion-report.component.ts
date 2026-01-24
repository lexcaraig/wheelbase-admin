import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { PromotionService } from '../../core/services/promotion.service';
import { Promotion, PromotionReport, PlacementType, PLACEMENT_LABELS } from '../../core/models/promotion.model';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-promotion-report',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [`
    @media print {
      /* Hide everything outside the report */
      :host {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: white !important;
        z-index: 99999 !important;
      }

      /* Hide navigation elements */
      .no-print {
        display: none !important;
      }

      /* Style the print container */
      .print-container {
        background: white !important;
        color: #1a1a1a !important;
        padding: 40px !important;
        max-width: 100% !important;
      }

      /* Override dark theme for print */
      .bg-neutral {
        background: #f5f5f5 !important;
        border: 1px solid #e0e0e0 !important;
      }

      .text-white {
        color: #1a1a1a !important;
      }

      .text-base-content\\/50, .text-base-content\\/60 {
        color: #666 !important;
      }

      .text-yellow-400 {
        color: #d97706 !important;
      }

      .text-green-400 {
        color: #059669 !important;
      }

      .text-blue-400 {
        color: #2563eb !important;
      }

      .border-neutral, .border-neutral\\/50 {
        border-color: #e0e0e0 !important;
      }

      /* Progress bars for print */
      .bg-neutral {
        background: #e0e0e0 !important;
      }

      .bg-yellow-400 {
        background: #fbbf24 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .bg-blue-400, .bg-green-400 {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      /* Tier badges */
      .bg-neutral, .bg-blue-600, .bg-yellow-500 {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      /* Page breaks */
      .page-break-before {
        page-break-before: always;
      }

      /* Header styling for print */
      .print-header {
        display: flex !important;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #fbbf24;
      }

      .print-logo {
        height: 40px;
      }
    }

    /* Hide print-only elements on screen */
    @media screen {
      .print-only {
        display: none !important;
      }
    }
  `],
  template: `
    <div class="print-container p-6 max-w-6xl mx-auto">
      <!-- Print Header (only shows in PDF) -->
      <div class="print-only print-header">
        <div>
          <h1 style="font-size: 24px; font-weight: bold; color: #1a1a1a; margin: 0;">
            📊 Campaign Performance Report
          </h1>
          <p style="color: #666; margin-top: 4px;">{{ promotion()?.title }}</p>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: bold; color: #1a1a1a;">WHEELBASE</div>
          <div style="font-size: 12px; color: #666;">ridewheelbase.app</div>
        </div>
      </div>

      <!-- Screen Header (hidden in print) -->
      <div class="flex items-center justify-between mb-6 no-print">
        <div class="flex items-center gap-4">
          <a routerLink="/promotions" class="p-2 text-base-content/50 hover:text-white">
            <span class="material-symbols-outlined">arrow_back</span>
          </a>
          <div>
            <h1 class="text-2xl font-bold text-white">Campaign Report</h1>
            <p class="text-base-content/50 mt-1">
              {{ promotion()?.title || 'Loading...' }}
            </p>
          </div>
        </div>
        <button
          (click)="exportReport()"
          class="px-4 py-2 bg-yellow-400 text-base-content rounded-lg font-medium hover:bg-yellow-300 transition-colors flex items-center gap-2"
        >
          <span class="material-symbols-outlined text-xl">download</span>
          Export PDF
        </button>
      </div>

      @if (loading()) {
        <div class="p-8 text-center text-base-content/50">
          <span class="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
          <p class="mt-2">Loading report...</p>
        </div>
      } @else if (error()) {
        <div class="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
          {{ error() }}
        </div>
      } @else {
        <!-- Campaign Info -->
        <div class="bg-neutral rounded-lg p-6 mb-6">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-lg font-semibold text-white">{{ promotion()?.title }}</h2>
              @if (promotion()?.subtitle) {
                <p class="text-base-content/50 mt-1">{{ promotion()?.subtitle }}</p>
              }
              @if (promotion()?.cta_url) {
                <a [href]="promotion()?.cta_url" target="_blank" class="text-yellow-400 text-sm hover:underline mt-2 inline-block">
                  {{ promotion()?.cta_url }}
                </a>
              }
            </div>
            <div class="text-right text-sm text-base-content/50">
              <p>{{ formatDateRange() }}</p>
              <p class="mt-1">Target: {{ promotion()?.target_tiers?.join(', ') || 'All' }}</p>
            </div>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-neutral rounded-lg p-4">
            <div class="text-3xl font-bold text-white">{{ formatNumber(report()?.summary?.total_impressions || 0) }}</div>
            <div class="text-base-content/50 text-sm">Total Impressions</div>
          </div>
          <div class="bg-neutral rounded-lg p-4">
            <div class="text-3xl font-bold text-yellow-400">{{ formatNumber(report()?.summary?.total_clicks || 0) }}</div>
            <div class="text-base-content/50 text-sm">Total Clicks</div>
          </div>
          <div class="bg-neutral rounded-lg p-4">
            <div class="text-3xl font-bold text-green-400">{{ report()?.summary?.ctr?.toFixed(2) || '0.00' }}%</div>
            <div class="text-base-content/50 text-sm">Click-Through Rate</div>
          </div>
          <div class="bg-neutral rounded-lg p-4">
            <div class="text-3xl font-bold text-blue-400">{{ formatNumber(report()?.summary?.unique_viewers || 0) }}</div>
            <div class="text-base-content/50 text-sm">Unique Viewers</div>
          </div>
        </div>

        <!-- Additional Metrics -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-neutral rounded-lg p-4">
            <div class="text-2xl font-bold text-white">{{ formatNumber(report()?.summary?.unique_clickers || 0) }}</div>
            <div class="text-base-content/50 text-sm">Unique Clickers</div>
          </div>
          <div class="bg-neutral rounded-lg p-4">
            <div class="text-2xl font-bold text-white">{{ report()?.summary?.campaign_days || 0 }}</div>
            <div class="text-base-content/50 text-sm">Campaign Days</div>
          </div>
          <div class="bg-neutral rounded-lg p-4">
            <div class="text-2xl font-bold text-white">
              {{ calculateAvgDaily(report()?.summary?.total_impressions || 0, report()?.summary?.campaign_days || 1) }}
            </div>
            <div class="text-base-content/50 text-sm">Avg. Daily Impressions</div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Daily Performance -->
          <div class="bg-neutral rounded-lg p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Daily Performance</h3>
            @if (report()?.daily_breakdown?.length) {
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-base-content/50 border-b border-neutral">
                      <th class="text-left py-2">Date</th>
                      <th class="text-right py-2">Impressions</th>
                      <th class="text-right py-2">Clicks</th>
                      <th class="text-right py-2">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (day of report()?.daily_breakdown?.slice(0, 10); track day.date) {
                      <tr class="border-b border-neutral/50 text-white">
                        <td class="py-2">{{ formatDate(day.date) }}</td>
                        <td class="text-right py-2">{{ formatNumber(day.impressions) }}</td>
                        <td class="text-right py-2 text-yellow-400">{{ formatNumber(day.clicks) }}</td>
                        <td class="text-right py-2">{{ day.ctr.toFixed(2) }}%</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <p class="text-base-content/60 text-center py-4">No daily data available yet</p>
            }
          </div>

          <!-- Geographic Breakdown -->
          <div class="bg-neutral rounded-lg p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Geographic Performance</h3>
            @if (report()?.geographic_breakdown?.length) {
              <div class="space-y-3">
                @for (geo of report()?.geographic_breakdown; track geo.country_code) {
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="text-xl">{{ getCountryFlag(geo.country_code) }}</span>
                      <span class="text-white">{{ getCountryName(geo.country_code) }}</span>
                    </div>
                    <div class="text-right">
                      <span class="text-white">{{ formatNumber(geo.impressions) }} views</span>
                      <span class="text-base-content/50 mx-2">|</span>
                      <span class="text-yellow-400">{{ geo.ctr.toFixed(2) }}% CTR</span>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="text-base-content/60 text-center py-4">No geographic data available yet</p>
            }
          </div>

          <!-- Platform Breakdown -->
          <div class="bg-neutral rounded-lg p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Platform Performance</h3>
            @if (report()?.platform_breakdown?.length) {
              <div class="space-y-4">
                @for (platform of report()?.platform_breakdown; track platform.device_platform) {
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-white flex items-center gap-2">
                        <span class="material-symbols-outlined text-lg">{{ platform.device_platform === 'ios' ? 'phone_iphone' : 'android' }}</span>
                        {{ platform.device_platform === 'ios' ? 'iOS' : 'Android' }}
                      </span>
                      <span class="text-base-content/50">{{ formatNumber(platform.impressions) }} impressions</span>
                    </div>
                    <div class="w-full bg-neutral rounded-full h-2">
                      <div
                        class="h-2 rounded-full"
                        [class]="platform.device_platform === 'ios' ? 'bg-blue-400' : 'bg-green-400'"
                        [style.width.%]="calculatePercentage(platform.impressions, getTotalPlatformImpressions())"
                      ></div>
                    </div>
                    <div class="text-sm text-base-content/50 mt-1">
                      {{ formatNumber(platform.clicks) }} clicks ({{ platform.ctr.toFixed(2) }}% CTR)
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="text-base-content/60 text-center py-4">No platform data available yet</p>
            }
          </div>

          <!-- User Tier Breakdown -->
          <div class="bg-neutral rounded-lg p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Audience Tier Performance</h3>
            @if (report()?.tier_breakdown?.length) {
              <div class="space-y-4">
                @for (tier of report()?.tier_breakdown; track tier.user_tier) {
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-white capitalize flex items-center gap-2">
                        <span [class]="getTierBadgeClass(tier.user_tier)">{{ tier.user_tier }}</span>
                      </span>
                      <span class="text-base-content/50">{{ formatNumber(tier.impressions) }} impressions</span>
                    </div>
                    <div class="w-full bg-neutral rounded-full h-2">
                      <div
                        class="h-2 rounded-full"
                        [class]="getTierBarClass(tier.user_tier)"
                        [style.width.%]="calculatePercentage(tier.impressions, getTotalTierImpressions())"
                      ></div>
                    </div>
                    <div class="text-sm text-base-content/50 mt-1">
                      {{ formatNumber(tier.clicks) }} clicks ({{ tier.ctr.toFixed(2) }}% CTR)
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="text-base-content/60 text-center py-4">No tier data available yet</p>
            }
          </div>
        </div>

        <!-- Placement Breakdown -->
        <div class="bg-neutral rounded-lg p-6 mt-6">
          <h3 class="text-lg font-semibold text-white mb-4">Placement Performance</h3>
          @if (report()?.placement_breakdown?.length) {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (placement of report()?.placement_breakdown; track placement.placement_type) {
                <div class="bg-neutral/50 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-white font-medium flex items-center gap-2">
                      <span class="material-symbols-outlined text-lg">{{ getPlacementIcon(placement.placement_type) }}</span>
                      {{ getPlacementLabel(placement.placement_type) }}
                    </span>
                  </div>
                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div class="text-base-content/50">Impressions</div>
                      <div class="text-white font-semibold">{{ formatNumber(placement.impressions) }}</div>
                    </div>
                    <div>
                      <div class="text-base-content/50">Clicks</div>
                      <div class="text-yellow-400 font-semibold">{{ formatNumber(placement.clicks) }}</div>
                    </div>
                    <div>
                      <div class="text-base-content/50">CTR</div>
                      <div class="text-green-400 font-semibold">{{ placement.ctr.toFixed(2) }}%</div>
                    </div>
                    <div>
                      <div class="text-base-content/50">Unique Views</div>
                      <div class="text-blue-400 font-semibold">{{ formatNumber(placement.unique_viewers) }}</div>
                    </div>
                  </div>
                  <div class="mt-3">
                    <div class="w-full bg-neutral rounded-full h-1.5">
                      <div
                        class="h-1.5 rounded-full bg-yellow-400"
                        [style.width.%]="calculatePercentage(placement.impressions, getTotalPlacementImpressions())"
                      ></div>
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <p class="text-base-content/60 text-center py-4">No placement data available yet</p>
          }
        </div>

        <!-- Hourly Performance -->
        <div class="bg-neutral rounded-lg p-6 mt-6">
          <h3 class="text-lg font-semibold text-white mb-4">Hourly Performance (Best Times to Engage)</h3>
          @if (report()?.hourly_breakdown?.length) {
            <div class="flex items-end justify-between h-32 gap-1">
              @for (hour of getHourlyData(); track hour.hour) {
                <div class="flex-1 flex flex-col items-center">
                  <div
                    class="w-full bg-yellow-400 rounded-t"
                    [style.height.%]="calculateHourlyHeight(hour.impressions)"
                    [title]="hour.hour + ':00 - ' + hour.impressions + ' impressions'"
                  ></div>
                  <span class="text-xs text-base-content/60 mt-1">{{ hour.hour }}</span>
                </div>
              }
            </div>
            <div class="flex justify-between mt-2 text-xs text-base-content/50">
              <span>12 AM</span>
              <span>6 AM</span>
              <span>12 PM</span>
              <span>6 PM</span>
              <span>11 PM</span>
            </div>
          } @else {
            <p class="text-base-content/60 text-center py-4">No hourly data available yet</p>
          }
        </div>

        <!-- Report Generated -->
        <div class="mt-6 text-center text-base-content/60 text-sm">
          Report generated: {{ formatDateTime(report()?.generated_at) }}
        </div>
      }
    </div>
  `
})
export class PromotionReportComponent implements OnInit {
  loading = signal(true);
  error = signal<string | null>(null);
  promotion = signal<Promotion | null>(null);
  report = signal<PromotionReport | null>(null);

  private promotionId: string | null = null;

  constructor(
    private promotionService: PromotionService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.promotionId = this.route.snapshot.paramMap.get('id');
    if (this.promotionId) {
      this.loadReport();
    } else {
      this.error.set('No promotion ID provided');
      this.loading.set(false);
    }
  }

  async loadReport(): Promise<void> {
    if (!this.promotionId) return;

    this.loading.set(true);
    try {
      // Load promotion details
      const promo = await this.promotionService.getPromotion(this.promotionId);
      this.promotion.set(promo);

      // Load full report
      const report = await this.promotionService.getPromotionReport(this.promotionId);
      this.report.set(report);
    } catch (err: any) {
      this.error.set(err.message || 'Failed to load report');
    } finally {
      this.loading.set(false);
    }
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(dateStr: string | undefined): string {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateRange(): string {
    const promo = this.promotion();
    if (!promo) return '';

    const start = promo.start_date
      ? new Date(promo.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Start';
    const end = promo.end_date
      ? new Date(promo.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Ongoing';

    return `${start} - ${end}`;
  }

  calculateAvgDaily(total: number, days: number): string {
    if (days === 0) return '0';
    return this.formatNumber(Math.round(total / days));
  }

  calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return (value / total) * 100;
  }

  getTotalPlatformImpressions(): number {
    return this.report()?.platform_breakdown?.reduce((sum, p) => sum + p.impressions, 0) || 0;
  }

  getTotalTierImpressions(): number {
    return this.report()?.tier_breakdown?.reduce((sum, t) => sum + t.impressions, 0) || 0;
  }

  getTotalPlacementImpressions(): number {
    return this.report()?.placement_breakdown?.reduce((sum, p) => sum + p.impressions, 0) || 0;
  }

  getPlacementLabel(placement: PlacementType): string {
    return PLACEMENT_LABELS[placement] || placement;
  }

  getPlacementIcon(placement: PlacementType): string {
    const icons: Record<PlacementType, string> = {
      dashboard: 'home',
      services: 'location_on',
      events: 'calendar_today',
      marketplace_browse: 'shopping_bag',
      marketplace_detail: 'sell',
      post_ride: 'flag',
      routes: 'map'
    };
    return icons[placement] || 'circle';
  }

  getCountryFlag(code: string): string {
    const flags: Record<string, string> = {
      'PH': '\u{1F1F5}\u{1F1ED}',
      'ID': '\u{1F1EE}\u{1F1E9}',
      'TH': '\u{1F1F9}\u{1F1ED}',
      'VN': '\u{1F1FB}\u{1F1F3}',
      'MY': '\u{1F1F2}\u{1F1FE}',
      'SG': '\u{1F1F8}\u{1F1EC}'
    };
    return flags[code] || '\u{1F30D}';
  }

  getCountryName(code: string): string {
    const names: Record<string, string> = {
      'PH': 'Philippines',
      'ID': 'Indonesia',
      'TH': 'Thailand',
      'VN': 'Vietnam',
      'MY': 'Malaysia',
      'SG': 'Singapore'
    };
    return names[code] || code;
  }

  getTierBadgeClass(tier: string): string {
    const classes: Record<string, string> = {
      'free': 'px-2 py-0.5 rounded text-xs bg-neutral text-base-content/40',
      'pro': 'px-2 py-0.5 rounded text-xs bg-blue-600 text-blue-100',
      'premium': 'px-2 py-0.5 rounded text-xs bg-yellow-500 text-yellow-900'
    };
    return classes[tier] || classes['free'];
  }

  getTierBarClass(tier: string): string {
    const classes: Record<string, string> = {
      'free': 'bg-neutral',
      'pro': 'bg-blue-400',
      'premium': 'bg-yellow-400'
    };
    return classes[tier] || 'bg-neutral';
  }

  getHourlyData(): { hour: number; impressions: number }[] {
    const hourly = this.report()?.hourly_breakdown || [];
    // Fill in missing hours with 0
    const data: { hour: number; impressions: number }[] = [];
    for (let i = 0; i < 24; i++) {
      const found = hourly.find(h => h.hour_of_day === i);
      data.push({
        hour: i,
        impressions: found?.impressions || 0
      });
    }
    return data;
  }

  calculateHourlyHeight(impressions: number): number {
    const max = Math.max(...this.getHourlyData().map(h => h.impressions));
    if (max === 0) return 0;
    return Math.max((impressions / max) * 100, 5); // Minimum 5% height for visibility
  }

  exportReport(): void {
    const promo = this.promotion();
    const reportData = this.report();
    if (!promo || !reportData) return;

    const doc = new jsPDF();
    let yOffset = 20;

    // Colors matching the app theme
    const colors = {
      background: [30, 35, 41] as [number, number, number],      // #1E2329
      cardBg: [55, 65, 81] as [number, number, number],          // gray-800 equivalent
      yellow: [251, 191, 36] as [number, number, number],        // #FBBF24
      green: [74, 222, 128] as [number, number, number],         // green-400
      blue: [96, 165, 250] as [number, number, number],          // blue-400
      white: [255, 255, 255] as [number, number, number],
      gray: [156, 163, 175] as [number, number, number],         // gray-400
      darkGray: [75, 85, 99] as [number, number, number],        // gray-600
    };

    // Set background color for the whole page
    doc.setFillColor(...colors.background);
    doc.rect(0, 0, 210, 297, 'F');

    // Header
    doc.setFontSize(24);
    doc.setTextColor(...colors.white);
    doc.text('Campaign Performance Report', 105, yOffset, { align: 'center' });
    yOffset += 8;

    // Yellow accent line
    doc.setDrawColor(...colors.yellow);
    doc.setLineWidth(0.5);
    doc.line(40, yOffset, 170, yOffset);
    yOffset += 10;

    // Campaign title
    doc.setFontSize(14);
    doc.setTextColor(...colors.gray);
    doc.text(promo.title || 'Untitled Campaign', 105, yOffset, { align: 'center' });
    yOffset += 6;

    // Date range
    doc.setFontSize(10);
    doc.text(this.formatDateRange(), 105, yOffset, { align: 'center' });
    yOffset += 15;

    // Summary Cards Section
    doc.setFontSize(14);
    doc.setTextColor(...colors.yellow);
    doc.text('Summary Metrics', 14, yOffset);
    yOffset += 8;

    // Summary table with dark theme
    autoTable(doc, {
      startY: yOffset,
      head: [['Metric', 'Value']],
      body: [
        ['Total Impressions', this.formatNumber(reportData.summary?.total_impressions || 0)],
        ['Total Clicks', this.formatNumber(reportData.summary?.total_clicks || 0)],
        ['Click-Through Rate (CTR)', `${reportData.summary?.ctr?.toFixed(2) || '0.00'}%`],
        ['Unique Viewers', this.formatNumber(reportData.summary?.unique_viewers || 0)],
        ['Unique Clickers', this.formatNumber(reportData.summary?.unique_clickers || 0)],
        ['Campaign Days', reportData.summary?.campaign_days?.toString() || '0'],
        ['Avg. Daily Impressions', this.calculateAvgDaily(reportData.summary?.total_impressions || 0, reportData.summary?.campaign_days || 1)],
      ],
      theme: 'plain',
      styles: {
        fillColor: colors.cardBg,
        textColor: colors.white,
        fontSize: 10,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: colors.darkGray,
        textColor: colors.yellow,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [45, 55, 72] as [number, number, number],
      },
    });

    yOffset = (doc as any).lastAutoTable.finalY + 15;

    // Daily Performance Section
    if (reportData.daily_breakdown?.length) {
      doc.setFontSize(14);
      doc.setTextColor(...colors.yellow);
      doc.text('Daily Performance', 14, yOffset);
      yOffset += 8;

      autoTable(doc, {
        startY: yOffset,
        head: [['Date', 'Impressions', 'Clicks', 'CTR']],
        body: reportData.daily_breakdown.slice(0, 10).map(day => [
          this.formatDate(day.date),
          this.formatNumber(day.impressions),
          this.formatNumber(day.clicks),
          `${day.ctr.toFixed(2)}%`,
        ]),
        theme: 'plain',
        styles: {
          fillColor: colors.cardBg,
          textColor: colors.white,
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: colors.darkGray,
          textColor: colors.yellow,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [45, 55, 72] as [number, number, number],
        },
      });

      yOffset = (doc as any).lastAutoTable.finalY + 15;
    }

    // Check if we need a new page
    if (yOffset > 200) {
      doc.addPage();
      doc.setFillColor(...colors.background);
      doc.rect(0, 0, 210, 297, 'F');
      yOffset = 20;
    }

    // Geographic Performance Section
    if (reportData.geographic_breakdown?.length) {
      doc.setFontSize(14);
      doc.setTextColor(...colors.yellow);
      doc.text('Geographic Performance', 14, yOffset);
      yOffset += 8;

      autoTable(doc, {
        startY: yOffset,
        head: [['Country', 'Impressions', 'Clicks', 'CTR']],
        body: reportData.geographic_breakdown.map(geo => [
          this.getCountryName(geo.country_code),
          this.formatNumber(geo.impressions),
          this.formatNumber(geo.clicks),
          `${geo.ctr.toFixed(2)}%`,
        ]),
        theme: 'plain',
        styles: {
          fillColor: colors.cardBg,
          textColor: colors.white,
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: colors.darkGray,
          textColor: colors.yellow,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [45, 55, 72] as [number, number, number],
        },
      });

      yOffset = (doc as any).lastAutoTable.finalY + 15;
    }

    // Check if we need a new page
    if (yOffset > 200) {
      doc.addPage();
      doc.setFillColor(...colors.background);
      doc.rect(0, 0, 210, 297, 'F');
      yOffset = 20;
    }

    // Platform Performance Section
    if (reportData.platform_breakdown?.length) {
      doc.setFontSize(14);
      doc.setTextColor(...colors.yellow);
      doc.text('Platform Performance', 14, yOffset);
      yOffset += 8;

      const totalPlatformImpressions = this.getTotalPlatformImpressions();
      autoTable(doc, {
        startY: yOffset,
        head: [['Platform', 'Impressions', 'Clicks', 'CTR', 'Share']],
        body: reportData.platform_breakdown.map(platform => [
          platform.device_platform === 'ios' ? 'iOS' : 'Android',
          this.formatNumber(platform.impressions),
          this.formatNumber(platform.clicks),
          `${platform.ctr.toFixed(2)}%`,
          `${this.calculatePercentage(platform.impressions, totalPlatformImpressions).toFixed(1)}%`,
        ]),
        theme: 'plain',
        styles: {
          fillColor: colors.cardBg,
          textColor: colors.white,
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: colors.darkGray,
          textColor: colors.yellow,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [45, 55, 72] as [number, number, number],
        },
      });

      yOffset = (doc as any).lastAutoTable.finalY + 15;
    }

    // Check if we need a new page
    if (yOffset > 200) {
      doc.addPage();
      doc.setFillColor(...colors.background);
      doc.rect(0, 0, 210, 297, 'F');
      yOffset = 20;
    }

    // Audience Tier Performance Section
    if (reportData.tier_breakdown?.length) {
      doc.setFontSize(14);
      doc.setTextColor(...colors.yellow);
      doc.text('Audience Tier Performance', 14, yOffset);
      yOffset += 8;

      const totalTierImpressions = this.getTotalTierImpressions();
      autoTable(doc, {
        startY: yOffset,
        head: [['Tier', 'Impressions', 'Clicks', 'CTR', 'Share']],
        body: reportData.tier_breakdown.map(tier => [
          tier.user_tier.charAt(0).toUpperCase() + tier.user_tier.slice(1),
          this.formatNumber(tier.impressions),
          this.formatNumber(tier.clicks),
          `${tier.ctr.toFixed(2)}%`,
          `${this.calculatePercentage(tier.impressions, totalTierImpressions).toFixed(1)}%`,
        ]),
        theme: 'plain',
        styles: {
          fillColor: colors.cardBg,
          textColor: colors.white,
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: colors.darkGray,
          textColor: colors.yellow,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [45, 55, 72] as [number, number, number],
        },
      });

      yOffset = (doc as any).lastAutoTable.finalY + 15;
    }

    // Check if we need a new page
    if (yOffset > 180) {
      doc.addPage();
      doc.setFillColor(...colors.background);
      doc.rect(0, 0, 210, 297, 'F');
      yOffset = 20;
    }

    // Placement Performance Section
    if (reportData.placement_breakdown?.length) {
      doc.setFontSize(14);
      doc.setTextColor(...colors.yellow);
      doc.text('Placement Performance', 14, yOffset);
      yOffset += 8;

      const totalPlacementImpressions = this.getTotalPlacementImpressions();
      autoTable(doc, {
        startY: yOffset,
        head: [['Placement', 'Impressions', 'Clicks', 'CTR', 'Unique Views']],
        body: reportData.placement_breakdown.map(placement => [
          this.getPlacementLabel(placement.placement_type),
          this.formatNumber(placement.impressions),
          this.formatNumber(placement.clicks),
          `${placement.ctr.toFixed(2)}%`,
          this.formatNumber(placement.unique_viewers),
        ]),
        theme: 'plain',
        styles: {
          fillColor: colors.cardBg,
          textColor: colors.white,
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: colors.darkGray,
          textColor: colors.yellow,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [45, 55, 72] as [number, number, number],
        },
      });

      yOffset = (doc as any).lastAutoTable.finalY + 15;
    }

    // Check if we need a new page
    if (yOffset > 220) {
      doc.addPage();
      doc.setFillColor(...colors.background);
      doc.rect(0, 0, 210, 297, 'F');
      yOffset = 20;
    }

    // Hourly Performance Section
    if (reportData.hourly_breakdown?.length) {
      doc.setFontSize(14);
      doc.setTextColor(...colors.yellow);
      doc.text('Hourly Performance (Best Times to Engage)', 14, yOffset);
      yOffset += 8;

      // Draw a simple bar chart
      const hourlyData = this.getHourlyData();
      const maxImpressions = Math.max(...hourlyData.map(h => h.impressions));
      const chartWidth = 180;
      const chartHeight = 40;
      const barWidth = chartWidth / 24;

      // Chart background
      doc.setFillColor(...colors.cardBg);
      doc.rect(14, yOffset, chartWidth, chartHeight, 'F');

      // Draw bars
      hourlyData.forEach((hour, i) => {
        const barHeight = maxImpressions > 0 ? (hour.impressions / maxImpressions) * (chartHeight - 5) : 0;
        doc.setFillColor(...colors.yellow);
        doc.rect(14 + (i * barWidth), yOffset + chartHeight - barHeight, barWidth - 1, barHeight, 'F');
      });

      // Hour labels
      doc.setFontSize(6);
      doc.setTextColor(...colors.gray);
      doc.text('12AM', 14, yOffset + chartHeight + 6);
      doc.text('6AM', 14 + (6 * barWidth), yOffset + chartHeight + 6);
      doc.text('12PM', 14 + (12 * barWidth), yOffset + chartHeight + 6);
      doc.text('6PM', 14 + (18 * barWidth), yOffset + chartHeight + 6);
      doc.text('11PM', 14 + (23 * barWidth), yOffset + chartHeight + 6);

      yOffset += chartHeight + 15;
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(...colors.gray);
    doc.text(`Report generated: ${this.formatDateTime(reportData.generated_at)}`, 105, 285, { align: 'center' });
    doc.text('Wheelbase - ridewheelbase.app', 105, 290, { align: 'center' });

    // Open PDF in new tab for preview (user can download from there)
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    window.open(blobUrl, '_blank');
  }
}
