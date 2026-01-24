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
          <p class="text-base-content/50 mt-1">Manage Quick Action Widget banner ads</p>
        </div>
        <a
          routerLink="/promotions/new"
          class="px-4 py-2 bg-yellow-400 text-base-content rounded-lg font-medium hover:bg-yellow-300 transition-colors flex items-center gap-2"
        >
          <span class="material-symbols-outlined text-xl">add</span>
          Create Promotion
        </a>
      </div>

      <!-- Analytics Summary -->
      @if (analytics()) {
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-neutral rounded-lg p-4">
            <p class="text-base-content/50 text-sm">Active Promotions</p>
            <p class="text-2xl font-bold text-white mt-1">{{ analytics()!.active_promotions }}</p>
          </div>
          <div class="bg-neutral rounded-lg p-4">
            <p class="text-base-content/50 text-sm">Total Impressions</p>
            <p class="text-2xl font-bold text-white mt-1">{{ analytics()!.total_impressions | number }}</p>
          </div>
          <div class="bg-neutral rounded-lg p-4">
            <p class="text-base-content/50 text-sm">Total Clicks</p>
            <p class="text-2xl font-bold text-white mt-1">{{ analytics()!.total_clicks | number }}</p>
          </div>
          <div class="bg-neutral rounded-lg p-4">
            <p class="text-base-content/50 text-sm">Click-Through Rate</p>
            <p class="text-2xl font-bold text-white mt-1">{{ analytics()!.click_through_rate | number:'1.1-1' }}%</p>
          </div>
        </div>
      }

      <!-- Filters -->
      <div class="flex items-center gap-4 mb-6">
        <label class="flex items-center gap-2 text-base-content/50">
          <input
            type="checkbox"
            [(ngModel)]="activeOnly"
            (ngModelChange)="loadPromotions()"
            class="rounded bg-neutral border-neutral"
          />
          Active only
        </label>
        <div class="flex-1"></div>
        <input
          type="text"
          [(ngModel)]="searchQuery"
          (ngModelChange)="filterPromotions()"
          placeholder="Search promotions..."
          class="px-4 py-2 bg-neutral border border-neutral rounded-lg text-white placeholder-base-content/50 focus:outline-none focus:border-yellow-400"
        />
      </div>

      <!-- Promotions Table -->
      <div class="bg-neutral rounded-lg overflow-hidden">
        @if (loading()) {
          <div class="p-8 text-center text-base-content/50">
            <span class="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
            <p class="mt-2">Loading promotions...</p>
          </div>
        } @else if (filteredPromotions().length === 0) {
          <div class="p-8 text-center text-base-content/50">
            <span class="material-symbols-outlined text-5xl opacity-50">campaign</span>
            <p class="mt-2">No promotions found</p>
            <a routerLink="/promotions/new" class="text-yellow-400 hover:underline mt-2 inline-block">
              Create your first promotion
            </a>
          </div>
        } @else {
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Impressions</th>
                <th>Clicks</th>
                <th>CTR</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (promo of filteredPromotions(); track promo.id) {
                <tr>
                  <td>
                    <div class="flex items-center gap-3">
                      <div
                        class="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold"
                        [style.backgroundColor]="promo.background_color"
                        [style.color]="promo.text_color"
                      >
                        {{ promo.title.charAt(0) }}
                      </div>
                      <div>
                        <p class="font-medium">{{ promo.title }}</p>
                        @if (promo.subtitle) {
                          <p class="text-base-content/70 text-sm">{{ promo.subtitle }}</p>
                        }
                      </div>
                    </div>
                  </td>
                  <td>{{ promo.priority }}</td>
                  <td>
                    <button
                      (click)="toggleActive(promo)"
                      class="badge"
                      [class.badge-success]="promo.is_active"
                      [class.badge-neutral]="!promo.is_active"
                    >
                      {{ promo.is_active ? 'Active' : 'Inactive' }}
                    </button>
                  </td>
                  <td>{{ promo.impression_count | number }}</td>
                  <td>{{ promo.click_count | number }}</td>
                  <td>
                    {{ promo.impression_count > 0 ? ((promo.click_count / promo.impression_count) * 100 | number:'1.1-1') + '%' : '0%' }}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-1">
                      <a
                        [routerLink]="'/promotions/report/' + promo.id"
                        class="btn btn-ghost btn-sm btn-square text-info"
                        title="View Report"
                      >
                        <span class="material-symbols-outlined text-xl">bar_chart</span>
                      </a>
                      <a
                        [routerLink]="'/promotions/edit/' + promo.id"
                        class="btn btn-ghost btn-sm btn-square text-warning"
                        title="Edit"
                      >
                        <span class="material-symbols-outlined text-xl">edit</span>
                      </a>
                      <button
                        (click)="deletePromotion(promo)"
                        class="btn btn-ghost btn-sm btn-square text-error"
                        title="Delete"
                      >
                        <span class="material-symbols-outlined text-xl">delete</span>
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
          <p class="text-base-content/50 text-sm">
            Showing {{ currentPage() * pageSize + 1 }} - {{ Math.min((currentPage() + 1) * pageSize, totalCount()) }} of {{ totalCount() }}
          </p>
          <div class="flex items-center gap-2">
            <button
              (click)="previousPage()"
              [disabled]="currentPage() === 0"
              class="px-3 py-1 bg-neutral text-base-content/40 rounded hover:bg-neutral disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              (click)="nextPage()"
              [disabled]="(currentPage() + 1) * pageSize >= totalCount()"
              class="px-3 py-1 bg-neutral text-base-content/40 rounded hover:bg-neutral disabled:opacity-50 disabled:cursor-not-allowed"
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
