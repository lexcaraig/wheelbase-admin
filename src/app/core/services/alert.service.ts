import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Observable, from } from 'rxjs';

export interface CreateAlertParams {
  alert_type: 'egress_warning' | 'egress_critical' | 'api_spike' | 'rate_limit_abuse' | 'database_full' | 'user_growth_spike';
  severity: 'info' | 'medium' | 'high' | 'critical';
  message: string;
  details?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private supabaseService = inject(SupabaseService);

  /**
   * Create a new alert
   */
  createAlert(params: CreateAlertParams): Observable<void> {
    return from(
      this.supabaseService.client
        .from('monitoring_alerts')
        .insert({
          alert_type: params.alert_type,
          severity: params.severity,
          message: params.message,
          details: params.details || {},
          is_dismissed: false
        })
        .then(({ error }: { error: any }) => {
          if (error) throw error;
        })
    );
  }

  /**
   * Check for egress warnings based on current usage
   */
  checkEgressWarnings(egressMb: number): CreateAlertParams | null {
    const freeLimit = 5000; // 5 GB in MB
    const warningThreshold = 0.8; // 80%
    const criticalThreshold = 0.95; // 95%

    const percentage = egressMb / freeLimit;

    if (percentage >= criticalThreshold) {
      return {
        alert_type: 'egress_critical',
        severity: 'critical',
        message: `Egress usage at ${Math.round(percentage * 100)}% of free tier limit`,
        details: {
          current_mb: egressMb,
          limit_mb: freeLimit,
          percentage: Math.round(percentage * 100)
        }
      };
    }

    if (percentage >= warningThreshold) {
      return {
        alert_type: 'egress_warning',
        severity: 'high',
        message: `Egress usage at ${Math.round(percentage * 100)}% of free tier limit`,
        details: {
          current_mb: egressMb,
          limit_mb: freeLimit,
          percentage: Math.round(percentage * 100)
        }
      };
    }

    return null;
  }

  /**
   * Check for database size warnings
   */
  checkDatabaseWarnings(sizeMb: number): CreateAlertParams | null {
    const freeLimit = 500; // 500 MB
    const warningThreshold = 0.8; // 80%

    const percentage = sizeMb / freeLimit;

    if (percentage >= warningThreshold) {
      return {
        alert_type: 'database_full',
        severity: percentage >= 0.95 ? 'critical' : 'high',
        message: `Database at ${Math.round(percentage * 100)}% capacity`,
        details: {
          current_mb: sizeMb,
          limit_mb: freeLimit,
          percentage: Math.round(percentage * 100)
        }
      };
    }

    return null;
  }

  /**
   * Check for API spike warnings
   */
  checkApiSpikeWarnings(
    currentCalls: number,
    baselineAvg: number,
    spikeThreshold: number = 50
  ): CreateAlertParams | null {
    const percentageIncrease = ((currentCalls - baselineAvg) / baselineAvg) * 100;

    if (percentageIncrease > spikeThreshold) {
      return {
        alert_type: 'api_spike',
        severity: percentageIncrease > 200 ? 'critical' : percentageIncrease > 100 ? 'high' : 'medium',
        message: `API calls increased by ${Math.round(percentageIncrease)}%`,
        details: {
          current_calls: currentCalls,
          baseline_avg: Math.round(baselineAvg),
          percentage_increase: Math.round(percentageIncrease)
        }
      };
    }

    return null;
  }

  /**
   * Check for user growth spike
   */
  checkUserGrowthSpike(
    newUsers: number,
    baselineAvg: number,
    spikeThreshold: number = 100
  ): CreateAlertParams | null {
    const percentageIncrease = ((newUsers - baselineAvg) / baselineAvg) * 100;

    if (percentageIncrease > spikeThreshold) {
      return {
        alert_type: 'user_growth_spike',
        severity: percentageIncrease > 300 ? 'critical' : 'medium',
        message: `New user signups increased by ${Math.round(percentageIncrease)}%`,
        details: {
          new_users: newUsers,
          baseline_avg: Math.round(baselineAvg),
          percentage_increase: Math.round(percentageIncrease)
        }
      };
    }

    return null;
  }
}
