import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  Business,
  BusinessListResponse,
  BusinessManageRequest,
  BusinessVerificationStatus,
  BusinessSubscriptionResult,
  ProvisionSubscriptionPayload,
} from '../models/business.model';

export interface ListBusinessesParams {
  status?: BusinessVerificationStatus | 'all';
  page?: number;
  pageSize?: number;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BusinessService {
  // SupabaseService.callFunction prefixes 'admin-' automatically,
  // so this constant intentionally omits that prefix.
  private readonly FN = 'manage-businesses';

  constructor(private supabase: SupabaseService) {}

  /**
   * Get list of businesses with optional filters
   */
  async getBusinesses(params: ListBusinessesParams = {}): Promise<BusinessListResponse> {
    const {
      status = 'all',
      page = 1,
      pageSize = 20,
      search
    } = params;

    const request: BusinessManageRequest = {
      action: 'list',
      status,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      search
    };

    return this.supabase.callFunction<BusinessListResponse>(this.FN, request);
  }

  /**
   * Get a single business by ID (includes active_subscription if present)
   */
  async getBusiness(businessId: string): Promise<Business> {
    const request: BusinessManageRequest = {
      action: 'get',
      businessId
    };

    return this.supabase.callFunction<Business>(this.FN, request);
  }

  /**
   * Approve a business
   */
  async approveBusiness(businessId: string): Promise<Business> {
    const request: BusinessManageRequest = {
      action: 'approve',
      businessId
    };

    return this.supabase.callFunction<Business>(this.FN, request);
  }

  /**
   * Reject a business
   */
  async rejectBusiness(businessId: string, reason: string): Promise<Business> {
    const request: BusinessManageRequest = {
      action: 'reject',
      businessId,
      reason
    };

    return this.supabase.callFunction<Business>(this.FN, request);
  }

  /**
   * Suspend a business
   */
  async suspendBusiness(businessId: string, reason?: string): Promise<Business> {
    const request: BusinessManageRequest = {
      action: 'suspend',
      businessId,
      reason
    };

    return this.supabase.callFunction<Business>(this.FN, request);
  }

  /**
   * Provision (or replace) a business subscription.
   * Atomically: cancels any prior active subscription, inserts a new
   * business_subscriptions row, and updates businesses.subscription_tier
   * + subscription_expires_at. Logs the action to admin_audit_logs.
   */
  async provisionSubscription(
    businessId: string,
    subscription: ProvisionSubscriptionPayload
  ): Promise<BusinessSubscriptionResult> {
    const request: BusinessManageRequest = {
      action: 'provision_subscription',
      businessId,
      subscription,
    };

    return this.supabase.callFunction<BusinessSubscriptionResult>(this.FN, request);
  }

  /**
   * Cancel the active subscription. Access continues until expires_at;
   * only auto-renewal is disabled. Tier is NOT immediately downgraded.
   */
  async cancelSubscription(businessId: string, reason?: string): Promise<BusinessSubscriptionResult> {
    const request: BusinessManageRequest = {
      action: 'cancel_subscription',
      businessId,
      reason,
    };

    return this.supabase.callFunction<BusinessSubscriptionResult>(this.FN, request);
  }
}
