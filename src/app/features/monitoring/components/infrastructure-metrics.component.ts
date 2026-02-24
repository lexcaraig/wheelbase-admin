import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfrastructureMetrics } from '../../../core/services/monitoring.service';

@Component({
  selector: 'app-infrastructure-metrics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card bg-base-200 shadow">
      <div class="card-body">
        <h2 class="text-xl font-bold text-base-content mb-6">Infrastructure Metrics</h2>

        <!-- User Stats -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-base-content mb-3">User Activity</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-info/10 rounded-lg p-4 border border-info/20">
              <p class="text-xs text-info font-medium">Total Users</p>
              <p class="text-2xl font-bold text-base-content">{{ metrics.users.total_users | number }}</p>
            </div>
            <div class="bg-success/10 rounded-lg p-4 border border-success/20">
              <p class="text-xs text-success font-medium">DAU</p>
              <p class="text-2xl font-bold text-base-content">{{ metrics.users.dau | number }}</p>
            </div>
            <div class="bg-warning/10 rounded-lg p-4 border border-warning/20">
              <p class="text-xs text-warning font-medium">MAU</p>
              <p class="text-2xl font-bold text-base-content">{{ metrics.users.mau | number }}</p>
            </div>
            <div class="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <p class="text-xs text-primary font-medium">DAU/MAU Ratio</p>
              <p class="text-2xl font-bold text-base-content">{{ metrics.users.dau_mau_ratio }}%</p>
            </div>
          </div>
        </div>

        <!-- Pro Plan Usage -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-base-content mb-3">Pro Plan Usage</h3>
          <div class="space-y-4">
            <!-- Database -->
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span class="text-base-content/80">Database</span>
                <span class="text-base-content/70">
                  {{ metrics.costs.free_tier_status.database.used_mb | number:'1.0-0' }} MB /
                  {{ metrics.costs.free_tier_status.database.limit_mb / 1024 | number:'1.0-0' }} GB
                </span>
              </div>
              <progress
                class="progress w-full"
                [ngClass]="getProgressClass(metrics.costs.free_tier_status.database.percentage)"
                [value]="metrics.costs.free_tier_status.database.percentage"
                max="100"
              ></progress>
              <p class="text-xs text-base-content/60 mt-1">
                {{ metrics.costs.free_tier_status.database.percentage | number:'1.0-0' }}% used
              </p>
            </div>

            <!-- Egress -->
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span class="text-base-content/80">Egress (Bandwidth)</span>
                <span class="text-base-content/70">
                  {{ metrics.costs.free_tier_status.egress.used_mb / 1024 | number:'1.2-2' }} GB /
                  {{ metrics.costs.free_tier_status.egress.limit_mb / 1024 | number:'1.0-0' }} GB
                </span>
              </div>
              <progress
                class="progress w-full"
                [ngClass]="getProgressClass(metrics.costs.free_tier_status.egress.percentage)"
                [value]="metrics.costs.free_tier_status.egress.percentage"
                max="100"
              ></progress>
              <p class="text-xs text-base-content/60 mt-1">
                {{ metrics.costs.free_tier_status.egress.percentage | number:'1.0-0' }}% used
              </p>
            </div>

            <!-- Storage -->
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span class="text-base-content/80">Storage</span>
                <span class="text-base-content/70">
                  {{ metrics.costs.free_tier_status.storage.used_mb | number:'1.0-0' }} MB /
                  {{ metrics.costs.free_tier_status.storage.limit_mb / 1024 | number:'1.0-0' }} GB
                </span>
              </div>
              <progress
                class="progress w-full"
                [ngClass]="getProgressClass(metrics.costs.free_tier_status.storage.percentage)"
                [value]="metrics.costs.free_tier_status.storage.percentage"
                max="100"
              ></progress>
              <p class="text-xs text-base-content/60 mt-1">
                {{ metrics.costs.free_tier_status.storage.percentage | number:'1.0-0' }}% used
              </p>
            </div>
          </div>
        </div>

        <!-- Upstash Redis Usage -->
        <div class="mb-6" *ngIf="metrics.upstash.is_configured">
          <h3 class="text-lg font-semibold text-base-content mb-3">Upstash Redis (Rate Limiting)</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Total Commands -->
            <div class="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <p class="text-xs text-primary font-medium">Estimated Commands</p>
              <p class="text-2xl font-bold text-base-content mt-1">{{ metrics.upstash.total_commands | number }}</p>
              <p class="text-xs text-base-content/60 mt-1">Estimated from active rate limit keys</p>
            </div>

            <!-- Total Keys -->
            <div class="bg-info/10 rounded-lg p-4 border border-info/20">
              <p class="text-xs text-info font-medium">Active Keys</p>
              <p class="text-2xl font-bold text-base-content mt-1">{{ metrics.upstash.total_keys | number }}</p>
              <p class="text-xs text-base-content/60 mt-1">Rate limit entries</p>
            </div>

            <!-- Memory Used -->
            <div class="bg-secondary/10 rounded-lg p-4 border border-secondary/20">
              <p class="text-xs text-secondary font-medium">Storage</p>
              <p class="text-2xl font-bold text-base-content mt-1">
                <span *ngIf="metrics.upstash.memory_used_mb > 0">~1 KB</span>
                <span *ngIf="metrics.upstash.memory_used_mb === 0">0 KB</span>
              </p>
              <p class="text-xs text-base-content/60 mt-1">Minimal (ephemeral keys)</p>
            </div>
          </div>
        </div>

        <!-- Upstash Not Configured Warning -->
        <div class="mb-6" *ngIf="!metrics.upstash.is_configured">
          <div class="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <span class="font-semibold">Upstash Redis Not Configured</span>
              <p class="text-sm">Rate limiting is currently disabled. Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Supabase environment variables.</p>
            </div>
          </div>
        </div>

        <!-- Top Tables by Size -->
        <div *ngIf="metrics.database.table_sizes && metrics.database.table_sizes.length > 0">
          <h3 class="text-lg font-semibold text-base-content mb-3">Top Tables by Size</h3>
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th class="text-base-content/80">Table</th>
                  <th class="text-right text-base-content/80">Size (MB)</th>
                  <th class="text-right text-base-content/80">Rows</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let table of metrics.database.table_sizes.slice(0, 5)">
                  <td class="text-base-content">{{ table.table_name }}</td>
                  <td class="text-right text-base-content/80">{{ table.size_mb | number:'1.2-2' }}</td>
                  <td class="text-right text-base-content/80">{{ table.row_count | number }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pro Plan Info -->
        <div class="mt-6">
          <div class="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <span class="font-semibold">📊 Supabase Pro Plan</span>
              <span class="text-sm ml-2">($25/month) - 8GB Database, 250GB Egress, 100GB Storage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class InfrastructureMetricsComponent {
  @Input() metrics!: InfrastructureMetrics;

  getProgressClass(percentage: number): string {
    if (percentage < 80) return 'progress-success';
    if (percentage < 95) return 'progress-warning';
    return 'progress-error';
  }
}
