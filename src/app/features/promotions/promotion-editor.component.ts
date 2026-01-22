import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PromotionService } from '../../core/services/promotion.service';
import { Promotion, PromotionPayload, LogoShape, PlacementType, PLACEMENT_LABELS, ALL_PLACEMENTS } from '../../core/models/promotion.model';

@Component({
  selector: 'app-promotion-editor',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-6">
        <a routerLink="/promotions" class="p-2 text-gray-400 hover:text-white">
          <i class="pi pi-arrow-left"></i>
        </a>
        <div>
          <h1 class="text-2xl font-bold text-white">
            {{ isEditMode() ? 'Edit Promotion' : 'Create Promotion' }}
          </h1>
          <p class="text-gray-400 mt-1">
            {{ isEditMode() ? 'Update the promotion details below' : 'Fill in the details for the new promotion' }}
          </p>
        </div>
      </div>

      @if (loading()) {
        <div class="p-8 text-center text-gray-400">
          <i class="pi pi-spin pi-spinner text-2xl"></i>
          <p class="mt-2">Loading...</p>
        </div>
      } @else {
        <form (ngSubmit)="savePromotion()" class="space-y-6">
          <!-- Preview -->
          <div class="bg-gray-800 rounded-lg p-6">
            <h2 class="text-lg font-medium text-white mb-4">Preview</h2>
            <div class="max-w-sm mx-auto">
              <!-- Banner preview -->
              <div
                class="rounded-t-xl p-3"
                [style.backgroundColor]="form.background_color"
              >
                <div class="flex items-center gap-2">
                  @if (form.logo_url) {
                    <img [src]="form.logo_url" class="w-6 h-6 rounded" alt="Logo" />
                  }
                  <div class="flex-1">
                    <p
                      class="text-sm font-semibold truncate"
                      [style.color]="form.text_color"
                    >
                      {{ form.title || 'Promotion Title' }}
                    </p>
                    @if (form.subtitle) {
                      <p
                        class="text-xs opacity-80 truncate"
                        [style.color]="form.text_color"
                      >
                        {{ form.subtitle }}
                      </p>
                    }
                  </div>
                  <i class="pi pi-arrow-right text-xs" [style.color]="form.text_color + '99'"></i>
                </div>
              </div>
              <!-- Mock stats row -->
              <div class="bg-gray-900 rounded-b-xl p-3">
                <div class="flex items-center justify-between text-gray-400 text-xs">
                  <span class="text-red-500 font-bold">SOS</span>
                  <span>123 Rides | 432.5km | 299 km/h</span>
                  <span class="text-yellow-400 font-bold">START</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Basic Info -->
          <div class="bg-gray-800 rounded-lg p-6">
            <h2 class="text-lg font-medium text-white mb-4">Basic Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-400 mb-1">Title *</label>
                <input
                  type="text"
                  [(ngModel)]="form.title"
                  name="title"
                  required
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
                  placeholder="Elevate your wardrobe with Imprint Customs"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-400 mb-1">Subtitle</label>
                <input
                  type="text"
                  [(ngModel)]="form.subtitle"
                  name="subtitle"
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
                  placeholder="Premium motorcycle apparel"
                />
              </div>
              <!-- Logo URLs -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-400 mb-1">Square Logo (1:1)</label>
                  <input
                    type="url"
                    [(ngModel)]="form.logo_url"
                    name="logo_url"
                    class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
                    placeholder="https://example.com/logo-square.png"
                  />
                  <p class="text-xs text-gray-500 mt-1">Used for circular overlays (dashboard)</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-400 mb-1">Horizontal Logo (Wide)</label>
                  <input
                    type="url"
                    [(ngModel)]="form.logo_url_horizontal"
                    name="logo_url_horizontal"
                    class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
                    placeholder="https://example.com/logo-wide.png"
                  />
                  <p class="text-xs text-gray-500 mt-1">Used for banner placements</p>
                </div>
              </div>
              <!-- Logo previews -->
              <div class="flex gap-4 items-center">
                @if (form.logo_url) {
                  <div class="text-center">
                    <img [src]="form.logo_url" class="w-12 h-12 rounded-full object-cover border-2 border-gray-600" alt="Square Logo" />
                    <p class="text-xs text-gray-500 mt-1">Square</p>
                  </div>
                }
                @if (form.logo_url_horizontal) {
                  <div class="text-center">
                    <img [src]="form.logo_url_horizontal" class="h-10 max-w-32 object-contain border-2 border-gray-600 rounded" alt="Horizontal Logo" />
                    <p class="text-xs text-gray-500 mt-1">Horizontal</p>
                  </div>
                }
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">Call-to-Action URL</label>
                <input
                  type="url"
                  [(ngModel)]="form.cta_url"
                  name="cta_url"
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          <!-- Appearance -->
          <div class="bg-gray-800 rounded-lg p-6">
            <h2 class="text-lg font-medium text-white mb-4">Appearance</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">Background Color</label>
                <div class="flex items-center gap-2">
                  <input
                    type="color"
                    [(ngModel)]="form.background_color"
                    name="background_color"
                    class="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    [(ngModel)]="form.background_color"
                    class="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white uppercase focus:outline-none focus:border-yellow-400"
                    placeholder="#FFD535"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">Text Color</label>
                <div class="flex items-center gap-2">
                  <input
                    type="color"
                    [(ngModel)]="form.text_color"
                    name="text_color"
                    class="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    [(ngModel)]="form.text_color"
                    class="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white uppercase focus:outline-none focus:border-yellow-400"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Scheduling -->
          <div class="bg-gray-800 rounded-lg p-6">
            <h2 class="text-lg font-medium text-white mb-4">Scheduling & Targeting</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">Priority</label>
                <input
                  type="number"
                  [(ngModel)]="form.priority"
                  name="priority"
                  min="0"
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                />
                <p class="text-xs text-gray-500 mt-1">Higher priority shows first</p>
              </div>
              <div class="flex items-center">
                <label class="flex items-center gap-2 text-white cursor-pointer">
                  <input
                    type="checkbox"
                    [(ngModel)]="form.is_active"
                    name="is_active"
                    class="rounded bg-gray-700 border-gray-600 text-yellow-400"
                  />
                  Active
                </label>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                <input
                  type="datetime-local"
                  [(ngModel)]="form.start_date"
                  name="start_date"
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                />
                <p class="text-xs text-gray-500 mt-1">Leave empty to start immediately</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">End Date</label>
                <input
                  type="datetime-local"
                  [(ngModel)]="form.end_date"
                  name="end_date"
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                />
                <p class="text-xs text-gray-500 mt-1">Leave empty for no end date</p>
              </div>
            </div>
          </div>

          <!-- Target Tiers -->
          <div class="bg-gray-800 rounded-lg p-6">
            <h2 class="text-lg font-medium text-white mb-4">Target Subscription Tiers</h2>
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-2 text-white cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="targetFree"
                  name="target_free"
                  class="rounded bg-gray-700 border-gray-600 text-yellow-400"
                />
                Free
              </label>
              <label class="flex items-center gap-2 text-white cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="targetPro"
                  name="target_pro"
                  class="rounded bg-gray-700 border-gray-600 text-yellow-400"
                />
                Pro
              </label>
              <label class="flex items-center gap-2 text-white cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="targetPremium"
                  name="target_premium"
                  class="rounded bg-gray-700 border-gray-600 text-yellow-400"
                />
                Premium
              </label>
            </div>
          </div>

          <!-- Placement Locations -->
          <div class="bg-gray-800 rounded-lg p-6">
            <h2 class="text-lg font-medium text-white mb-2">Ad Placements</h2>
            <p class="text-gray-400 text-sm mb-4">Select where this promotion will appear. Brands pay per placement.</p>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              @for (placement of allPlacements; track placement) {
                <label class="flex items-center gap-2 text-white cursor-pointer p-2 rounded hover:bg-gray-700 transition-colors">
                  <input
                    type="checkbox"
                    [checked]="selectedPlacements.has(placement)"
                    (change)="togglePlacement(placement)"
                    class="rounded bg-gray-700 border-gray-600 text-yellow-400"
                  />
                  <span class="text-sm">{{ getPlacementLabel(placement) }}</span>
                </label>
              }
            </div>
            <p class="text-gray-500 text-xs mt-3">
              <i class="pi pi-info-circle mr-1"></i>
              Pro+ users never see ads regardless of placement selection.
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-4">
            <a
              routerLink="/promotions"
              class="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </a>
            <button
              type="submit"
              [disabled]="saving()"
              class="px-6 py-2 bg-yellow-400 text-gray-900 rounded-lg font-medium hover:bg-yellow-300 transition-colors disabled:opacity-50"
            >
              @if (saving()) {
                <i class="pi pi-spin pi-spinner mr-2"></i>
              }
              {{ isEditMode() ? 'Update Promotion' : 'Create Promotion' }}
            </button>
          </div>

          @if (error()) {
            <div class="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
              {{ error() }}
            </div>
          }
        </form>
      }
    </div>
  `
})
export class PromotionEditorComponent implements OnInit {
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  isEditMode = signal(false);
  promotionId: string | null = null;

  form: {
    title: string;
    subtitle: string;
    logo_url: string;
    logo_url_horizontal: string;
    logo_shape: LogoShape;
    background_color: string;
    text_color: string;
    cta_url: string;
    priority: number;
    is_active: boolean;
    start_date: string;
    end_date: string;
  } = {
    title: '',
    subtitle: '',
    logo_url: '',
    logo_url_horizontal: '',
    logo_shape: 'square',
    background_color: '#FFD535',
    text_color: '#000000',
    cta_url: '',
    priority: 0,
    is_active: true,
    start_date: '',
    end_date: ''
  };

  targetFree = true;
  targetPro = true;
  targetPremium = true;

  // Placement selection
  allPlacements = ALL_PLACEMENTS;
  selectedPlacements = new Set<PlacementType>(['dashboard']); // Default to dashboard

  constructor(
    private promotionService: PromotionService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.promotionId = this.route.snapshot.paramMap.get('id');
    if (this.promotionId) {
      this.isEditMode.set(true);
      this.loadPromotion();
    }
  }

  async loadPromotion(): Promise<void> {
    if (!this.promotionId) return;

    this.loading.set(true);
    try {
      const promo = await this.promotionService.getPromotion(this.promotionId);
      this.form = {
        title: promo.title,
        subtitle: promo.subtitle || '',
        logo_url: promo.logo_url || '',
        logo_url_horizontal: promo.logo_url_horizontal || '',
        logo_shape: promo.logo_shape || 'square',
        background_color: promo.background_color,
        text_color: promo.text_color,
        cta_url: promo.cta_url || '',
        priority: promo.priority,
        is_active: promo.is_active,
        start_date: promo.start_date ? this.formatDateForInput(promo.start_date) : '',
        end_date: promo.end_date ? this.formatDateForInput(promo.end_date) : ''
      };

      this.targetFree = promo.target_tiers.includes('free');
      this.targetPro = promo.target_tiers.includes('pro');
      this.targetPremium = promo.target_tiers.includes('premium');

      // Load placements
      this.selectedPlacements = new Set(promo.placement_types || ['dashboard']);
    } catch (err: any) {
      this.error.set(err.message || 'Failed to load promotion');
    } finally {
      this.loading.set(false);
    }
  }

  async savePromotion(): Promise<void> {
    if (!this.form.title) {
      this.error.set('Title is required');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      const targetTiers: string[] = [];
      if (this.targetFree) targetTiers.push('free');
      if (this.targetPro) targetTiers.push('pro');
      if (this.targetPremium) targetTiers.push('premium');

      // Ensure at least one placement is selected
      if (this.selectedPlacements.size === 0) {
        this.selectedPlacements.add('dashboard');
      }

      const payload: PromotionPayload = {
        title: this.form.title,
        subtitle: this.form.subtitle || null,
        logo_url: this.form.logo_url || null,
        logo_url_horizontal: this.form.logo_url_horizontal || null,
        logo_shape: this.form.logo_shape,
        background_color: this.form.background_color,
        text_color: this.form.text_color,
        cta_url: this.form.cta_url || null,
        priority: this.form.priority,
        is_active: this.form.is_active,
        start_date: this.form.start_date ? new Date(this.form.start_date).toISOString() : null,
        end_date: this.form.end_date ? new Date(this.form.end_date).toISOString() : null,
        target_tiers: targetTiers,
        placement_types: Array.from(this.selectedPlacements)
      };

      if (this.isEditMode() && this.promotionId) {
        await this.promotionService.updatePromotion(this.promotionId, payload);
      } else {
        await this.promotionService.createPromotion(payload);
      }

      this.router.navigate(['/promotions']);
    } catch (err: any) {
      this.error.set(err.message || 'Failed to save promotion');
    } finally {
      this.saving.set(false);
    }
  }

  private formatDateForInput(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toISOString().slice(0, 16);
  }

  togglePlacement(placement: PlacementType): void {
    if (this.selectedPlacements.has(placement)) {
      this.selectedPlacements.delete(placement);
    } else {
      this.selectedPlacements.add(placement);
    }
  }

  getPlacementLabel(placement: PlacementType): string {
    return PLACEMENT_LABELS[placement];
  }
}
