import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PromotionService } from '../../core/services/promotion.service';
import { Promotion, PromotionAnalytics } from '../../core/models/promotion.model';

@Component({
  selector: 'app-promotions-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white">Promotions</h1>
          <p class="text-gray-400 mt-1">Manage Quick Action Widget banner ads</p>
        </div>
        <a
          routerLink="/promotions/new"
          class="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-medium hover:bg-yellow-300 transition-colors flex items-center gap-2"
        >
          <i class="pi pi-plus"></i>
          Create Promotion
        </a>
      </div>

      <!-- Analytics Summary -->
      @if (analytics()) {
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-gray-800 rounded-lg p-4">
            <p class="text-gray-400 text-sm">Active Promotions</p>
            <p class="text-2xl font-bold text-white mt-1">{{ analytics()!.active_promotions }}</p>
          </div>
          <div class="bg-gray-800 rounded-lg p-4">
            <p class="text-gray-400 text-sm">Total Impressions</p>
            <p class="text-2xl font-bold text-white mt-1">{{ analytics()!.total_impressions | number }}</p>
          </div>
          <div class="bg-gray-800 rounded-lg p-4">
            <p class="text-gray-400 text-sm">Total Clicks</p>
            <p class="text-2xl font-bold text-white mt-1">{{ analytics()!.total_clicks | number }}</p>
          </div>
          <div class="bg-gray-800 rounded-lg p-4">
            <p class="text-gray-400 text-sm">Click-Through Rate</p>
            <p class="text-2xl font-bold text-white mt-1">{{ analytics()!.click_through_rate | number:'1.1-1' }}%</p>
          </div>
        </div>
      }

      <!-- Filters -->
      <div class="flex items-center gap-4 mb-6">
        <label class="flex items-center gap-2 text-gray-400">
          <input
            type="checkbox"
            [(ngModel)]="activeOnly"
            (ngModelChange)="loadPromotions()"
            class="rounded bg-gray-700 border-gray-600"
          />
          Active only
        </label>
        <div class="flex-1"></div>
        <input
          type="text"
          [(ngModel)]="searchQuery"
          (ngModelChange)="filterPromotions()"
          placeholder="Search promotions..."
          class="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
        />
      </div>

      <!-- Promotions Table -->
      <div class="bg-gray-800 rounded-lg overflow-hidden">
        @if (loading()) {
          <div class="p-8 text-center text-gray-400">
            <i class="pi pi-spin pi-spinner text-2xl"></i>
            <p class="mt-2">Loading promotions...</p>
          </div>
        } @else if (filteredPromotions().length === 0) {
          <div class="p-8 text-center text-gray-400">
            <i class="pi pi-megaphone text-4xl opacity-50"></i>
            <p class="mt-2">No promotions found</p>
            <a routerLink="/promotions/new" class="text-yellow-400 hover:underline mt-2 inline-block">
              Create your first promotion
            </a>
          </div>
        } @else {
          <table class="w-full">
            <thead class="bg-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Title</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Priority</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Status</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Impressions</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Clicks</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">CTR</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700">
              @for (promo of filteredPromotions(); track promo.id) {
                <tr class="hover:bg-gray-750">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold"
                        [style.backgroundColor]="promo.background_color"
                        [style.color]="promo.text_color"
                      >
                        {{ promo.title.charAt(0) }}
                      </div>
                      <div>
                        <p class="text-white font-medium">{{ promo.title }}</p>
                        @if (promo.subtitle) {
                          <p class="text-gray-400 text-sm">{{ promo.subtitle }}</p>
                        }
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-gray-300">{{ promo.priority }}</td>
                  <td class="px-4 py-3">
                    <button
                      (click)="toggleActive(promo)"
                      class="px-2 py-1 rounded text-xs font-medium"
                      [class.bg-green-500]="promo.is_active"
                      [class.bg-gray-600]="!promo.is_active"
                      [class.text-white]="true"
                    >
                      {{ promo.is_active ? 'Active' : 'Inactive' }}
                    </button>
                  </td>
                  <td class="px-4 py-3 text-gray-300">{{ promo.impression_count | number }}</td>
                  <td class="px-4 py-3 text-gray-300">{{ promo.click_count | number }}</td>
                  <td class="px-4 py-3 text-gray-300">
                    {{ promo.impression_count > 0 ? ((promo.click_count / promo.impression_count) * 100 | number:'1.1-1') + '%' : '0%' }}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <a
                        [routerLink]="'/promotions/report/' + promo.id"
                        class="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                        title="View Report"
                      >
                        <i class="pi pi-chart-bar"></i>
                      </a>
                      <a
                        [routerLink]="'/promotions/edit/' + promo.id"
                        class="p-2 text-gray-400 hover:text-yellow-400 transition-colors"
                        title="Edit"
                      >
                        <i class="pi pi-pencil"></i>
                      </a>
                      <button
                        (click)="deletePromotion(promo)"
                        class="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <i class="pi pi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Pagination -->
      @if (totalCount() > pageSize) {
        <div class="flex items-center justify-between mt-4">
          <p class="text-gray-400 text-sm">
            Showing {{ currentPage() * pageSize + 1 }} - {{ Math.min((currentPage() + 1) * pageSize, totalCount()) }} of {{ totalCount() }}
          </p>
          <div class="flex items-center gap-2">
            <button
              (click)="previousPage()"
              [disabled]="currentPage() === 0"
              class="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              (click)="nextPage()"
              [disabled]="(currentPage() + 1) * pageSize >= totalCount()"
              class="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class PromotionsListComponent implements OnInit {
  promotions = signal<Promotion[]>([]);
  filteredPromotions = signal<Promotion[]>([]);
  loading = signal(true);
  analytics = signal<PromotionAnalytics | null>(null);

  activeOnly = false;
  searchQuery = '';

  totalCount = signal(0);
  currentPage = signal(0);
  pageSize = 20;

  Math = Math;

  constructor(
    private promotionService: PromotionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPromotions();
    this.loadAnalytics();
  }

  async loadPromotions(): Promise<void> {
    this.loading.set(true);
    try {
      const { data, count } = await this.promotionService.getPromotions({
        activeOnly: this.activeOnly,
        limit: this.pageSize,
        offset: this.currentPage() * this.pageSize,
        orderBy: 'priority',
        ascending: false
      });
      this.promotions.set(data);
      this.filteredPromotions.set(data);
      this.totalCount.set(count);
    } catch (error) {
      console.error('Error loading promotions:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async loadAnalytics(): Promise<void> {
    try {
      const analytics = await this.promotionService.getAnalytics();
      this.analytics.set(analytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }

  filterPromotions(): void {
    const query = this.searchQuery.toLowerCase();
    if (!query) {
      this.filteredPromotions.set(this.promotions());
      return;
    }

    this.filteredPromotions.set(
      this.promotions().filter(p =>
        p.title.toLowerCase().includes(query) ||
        (p.subtitle?.toLowerCase().includes(query) ?? false)
      )
    );
  }

  async toggleActive(promo: Promotion): Promise<void> {
    try {
      await this.promotionService.toggleActive(promo.id, !promo.is_active);
      await this.loadPromotions();
      await this.loadAnalytics();
    } catch (error) {
      console.error('Error toggling promotion status:', error);
    }
  }

  async deletePromotion(promo: Promotion): Promise<void> {
    if (!confirm(`Are you sure you want to delete "${promo.title}"?`)) {
      return;
    }

    try {
      await this.promotionService.deletePromotion(promo.id);
      await this.loadPromotions();
      await this.loadAnalytics();
    } catch (error) {
      console.error('Error deleting promotion:', error);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      this.loadPromotions();
    }
  }

  nextPage(): void {
    if ((this.currentPage() + 1) * this.pageSize < this.totalCount()) {
      this.currentPage.update(p => p + 1);
      this.loadPromotions();
    }
  }
}
