import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfrastructureMetrics } from '../../../core/services/monitoring.service';

@Component({
  selector: 'app-infrastructure-metrics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-bold text-gray-900 mb-6">Infrastructure Metrics</h2>

      <!-- User Stats -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-3">User Activity</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-blue-50 rounded p-4">
            <p class="text-xs text-blue-600 font-medium">Total Users</p>
            <p class="text-2xl font-bold text-blue-900">{{ metrics.users.total_users | number }}</p>
          </div>
          <div class="bg-green-50 rounded p-4">
            <p class="text-xs text-green-600 font-medium">DAU</p>
            <p class="text-2xl font-bold text-green-900">{{ metrics.users.dau | number }}</p>
          </div>
          <div class="bg-yellow-50 rounded p-4">
            <p class="text-xs text-yellow-600 font-medium">MAU</p>
            <p class="text-2xl font-bold text-yellow-900">{{ metrics.users.mau | number }}</p>
          </div>
          <div class="bg-purple-50 rounded p-4">
            <p class="text-xs text-purple-600 font-medium">DAU/MAU Ratio</p>
            <p class="text-2xl font-bold text-purple-900">{{ metrics.users.dau_mau_ratio }}%</p>
          </div>
        </div>
      </div>

      <!-- Pro Plan Usage -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-3">Pro Plan Usage</h3>
        <div class="space-y-4">
          <!-- Database -->
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-700">Database</span>
              <span class="text-gray-600">
                {{ metrics.costs.free_tier_status.database.used_mb | number:'1.0-0' }} MB /
                {{ metrics.costs.free_tier_status.database.limit_mb }} MB
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                [class.bg-green-500]="metrics.costs.free_tier_status.database.percentage < 80"
                [class.bg-yellow-500]="metrics.costs.free_tier_status.database.percentage >= 80 && metrics.costs.free_tier_status.database.percentage < 95"
                [class.bg-red-500]="metrics.costs.free_tier_status.database.percentage >= 95"
                class="h-2 rounded-full transition-all duration-300"
                [style.width.%]="metrics.costs.free_tier_status.database.percentage"
              ></div>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              {{ metrics.costs.free_tier_status.database.percentage | number:'1.0-0' }}% used
            </p>
          </div>

          <!-- Egress -->
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-700">Egress (Bandwidth)</span>
              <span class="text-gray-600">
                {{ metrics.costs.free_tier_status.egress.used_mb | number:'1.0-0' }} MB /
                {{ metrics.costs.free_tier_status.egress.limit_mb }} MB
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                [class.bg-green-500]="metrics.costs.free_tier_status.egress.percentage < 80"
                [class.bg-yellow-500]="metrics.costs.free_tier_status.egress.percentage >= 80 && metrics.costs.free_tier_status.egress.percentage < 95"
                [class.bg-red-500]="metrics.costs.free_tier_status.egress.percentage >= 95"
                class="h-2 rounded-full transition-all duration-300"
                [style.width.%]="metrics.costs.free_tier_status.egress.percentage"
              ></div>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              {{ metrics.costs.free_tier_status.egress.percentage | number:'1.0-0' }}% used
            </p>
          </div>

          <!-- Storage -->
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-700">Storage</span>
              <span class="text-gray-600">
                {{ metrics.costs.free_tier_status.storage.used_mb | number:'1.0-0' }} MB /
                {{ metrics.costs.free_tier_status.storage.limit_mb }} MB
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                [class.bg-green-500]="metrics.costs.free_tier_status.storage.percentage < 80"
                [class.bg-yellow-500]="metrics.costs.free_tier_status.storage.percentage >= 80 && metrics.costs.free_tier_status.storage.percentage < 95"
                [class.bg-red-500]="metrics.costs.free_tier_status.storage.percentage >= 95"
                class="h-2 rounded-full transition-all duration-300"
                [style.width.%]="metrics.costs.free_tier_status.storage.percentage"
              ></div>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              {{ metrics.costs.free_tier_status.storage.percentage | number:'1.0-0' }}% used
            </p>
          </div>
        </div>
      </div>

      <!-- Upstash Redis Usage -->
      <div class="mb-6" *ngIf="metrics.upstash.is_configured">
        <h3 class="text-lg font-semibold text-gray-800 mb-3">Upstash Redis (Rate Limiting)</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Total Commands -->
          <div class="bg-purple-50 rounded-lg p-4">
            <p class="text-xs text-purple-600 font-medium">Estimated Commands</p>
            <p class="text-2xl font-bold text-purple-900 mt-1">{{ metrics.upstash.total_commands | number }}</p>
            <p class="text-xs text-gray-500 mt-1">Based on API usage (~2x audit logs)</p>
          </div>

          <!-- Total Keys -->
          <div class="bg-blue-50 rounded-lg p-4">
            <p class="text-xs text-blue-600 font-medium">Active Keys</p>
            <p class="text-2xl font-bold text-blue-900 mt-1">{{ metrics.upstash.total_keys | number }}</p>
            <p class="text-xs text-gray-500 mt-1">Rate limit entries</p>
          </div>

          <!-- Memory Used -->
          <div class="bg-indigo-50 rounded-lg p-4">
            <p class="text-xs text-indigo-600 font-medium">Storage</p>
            <p class="text-2xl font-bold text-indigo-900 mt-1">
              <span *ngIf="metrics.upstash.memory_used_mb > 0">~1 KB</span>
              <span *ngIf="metrics.upstash.memory_used_mb === 0">0 KB</span>
            </p>
            <p class="text-xs text-gray-500 mt-1">Minimal (ephemeral keys)</p>
          </div>
        </div>
      </div>

      <!-- Upstash Not Configured Warning -->
      <div class="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4" *ngIf="!metrics.upstash.is_configured">
        <p class="text-sm text-yellow-800">
          <span class="font-semibold">⚠️ Upstash Redis Not Configured</span><br/>
          Rate limiting is currently disabled. Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Supabase environment variables.
        </p>
      </div>

      <!-- Top Tables by Size -->
      <div *ngIf="metrics.database.table_sizes && metrics.database.table_sizes.length > 0">
        <h3 class="text-lg font-semibold text-gray-800 mb-3">Top Tables by Size</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-gray-700">Table</th>
                <th class="px-4 py-2 text-right text-gray-700">Size (MB)</th>
                <th class="px-4 py-2 text-right text-gray-700">Rows</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let table of metrics.database.table_sizes.slice(0, 5)" class="border-t">
                <td class="px-4 py-2 text-gray-900">{{ table.table_name }}</td>
                <td class="px-4 py-2 text-right text-gray-700">{{ table.size_mb | number:'1.2-2' }}</td>
                <td class="px-4 py-2 text-right text-gray-700">{{ table.row_count | number }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Estimated Costs -->
      <div class="mt-6 bg-green-50 rounded p-4">
        <p class="text-sm text-green-800">
          <span class="font-semibold">Estimated Monthly Cost:</span>
          {{ metrics.costs.estimated_monthly | number:'1.2-2' }} USD
          <span class="text-xs">(Within Free Tier)</span>
        </p>
      </div>
    </div>
  `
})
export class InfrastructureMetricsComponent {
  @Input() metrics!: InfrastructureMetrics;
}
