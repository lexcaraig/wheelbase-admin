/**
 * Shared utility functions for severity/status mapping across components
 * Used with Angular Material StatusBadge components
 */

import { BadgeSeverity } from '../components/status-badge/status-badge.component';

// Legacy type alias for PrimeNG components (during migration)
export type TagSeverity = 'success' | 'danger' | 'warn' | 'info' | 'secondary' | 'contrast';

/**
 * Get severity for subscription tier badges
 */
export function getSubscriptionTierSeverity(tier: string): BadgeSeverity {
  switch (tier?.toLowerCase()) {
    case 'premium':
      return 'warning';
    case 'pro':
      return 'info';
    case 'free':
      return 'success';
    default:
      return 'info';
  }
}

/**
 * Get severity for claim/verification status badges
 */
export function getClaimStatusSeverity(status: string): BadgeSeverity {
  switch (status?.toLowerCase()) {
    case 'approved':
      return 'success';
    case 'pending':
      return 'warning';
    case 'rejected':
      return 'danger';
    default:
      return 'warning';
  }
}

/**
 * Get severity for content status badges
 */
export function getContentStatusSeverity(status: string): BadgeSeverity {
  switch (status?.toLowerCase()) {
    case 'published':
      return 'success';
    case 'draft':
      return 'warning';
    case 'archived':
      return 'secondary';
    default:
      return 'info';
  }
}

/**
 * Get severity for user account status badges
 */
export function getAccountStatusSeverity(status: string): BadgeSeverity {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'success';
    case 'banned':
      return 'danger';
    case 'suspended':
      return 'warning';
    case 'deleted':
      return 'secondary';
    default:
      return 'info';
  }
}

/**
 * Get severity for boolean active/inactive states
 */
export function getBooleanStatusSeverity(isActive: boolean): 'success' | 'danger' {
  return isActive ? 'success' : 'danger';
}

/**
 * Get severity for moderation report severity
 */
export function getReportSeveritySeverity(severity: string): BadgeSeverity {
  switch (severity?.toLowerCase()) {
    case 'high':
    case 'critical':
      return 'danger';
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
    default:
      return 'secondary';
  }
}
