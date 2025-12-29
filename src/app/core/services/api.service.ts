import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

/**
 * Generic API service for calling Edge Functions
 * Wraps SupabaseService.callFunction with error handling
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private supabase: SupabaseService) {}

  /**
   * Call an admin Edge Function
   */
  async call<T = any>(functionName: string, body?: any): Promise<T> {
    try {
      return await this.supabase.callFunction<T>(functionName, body);
    } catch (error: any) {
      console.error(`API call to ${functionName} failed:`, error);
      throw new Error(error.message || `Failed to call ${functionName}`);
    }
  }

  /**
   * Handle Edge Function response
   */
  handleResponse<T>(response: any): T {
    if (!response.success) {
      throw new Error(response.error?.message || 'API call failed');
    }
    return response.data as T;
  }
}
