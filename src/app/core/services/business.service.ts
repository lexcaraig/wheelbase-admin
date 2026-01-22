import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  Business,
  BusinessListResponse,
  BusinessManageRequest,
  BusinessVerificationStatus,
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

    return this.supabase.callFunction<BusinessListResponse>('admin-manage-businesses', request);
  }

  /**
   * Get a single business by ID
   */
  async getBusiness(businessId: string): Promise<Business> {
    const request: BusinessManageRequest = {
      action: 'get',
      businessId
    };

    return this.supabase.callFunction<Business>('admin-manage-businesses', request);
  }

  /**
   * Approve a business
   */
  async approveBusiness(businessId: string): Promise<Business> {
    const request: BusinessManageRequest = {
      action: 'approve',
      businessId
    };

    return this.supabase.callFunction<Business>('admin-manage-businesses', request);
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

    return this.supabase.callFunction<Business>('admin-manage-businesses', request);
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

    return this.supabase.callFunction<Business>('admin-manage-businesses', request);
  }
}
