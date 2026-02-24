import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ApiService } from './api.service';
import { AppUser, UserDetail, UsersListResponse } from '../models/user.model';
import { DeletedUsersLogResponse } from '../models/deleted-user-log.model';
import { environment } from '../../../environments/environment';

export interface UserStats {
  total_users: number;
  active_users: number;
  banned_users: number;
  verified_users: number;
  pro_users: number;
  premium_users: number;
  pending_deletion: number; // Users within 30-day grace period before permanent deletion
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private supabase: SupabaseClient;

  constructor(private api: ApiService) {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );
  }

  /**
   * Get user statistics (uses RPC function)
   */
  async getUserStats(): Promise<UserStats> {
    const { data, error } = await this.supabase.rpc('get_user_stats');

    if (error) {
      console.error('Error fetching user stats:', error);
      throw new Error(error.message);
    }

    // RPC returns an array, get the first row
    const stats = Array.isArray(data) ? data[0] : data;
    return stats as UserStats;
  }

  /**
   * Get paginated users list
   */
  async getUsers(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: 'all' | 'active' | 'banned';
    subscription?: 'free' | 'pro' | 'premium';
    verification?: 'verified' | 'unverified';
    accountStatus?: 'all' | 'active' | 'deleted' | 'suspended';
  }): Promise<UsersListResponse> {
    return await this.api.call<UsersListResponse>('get-users', params);
  }

  /**
   * Get detailed user information
   */
  async getUserDetail(userId: string): Promise<UserDetail> {
    return await this.api.call<UserDetail>('get-user-detail', { user_id: userId });
  }

  /**
   * Ban a user
   */
  async banUser(userId: string, reason: string): Promise<void> {
    await this.api.call('ban-user', {
      user_id: userId,
      reason
    });
  }

  /**
   * Unban a user
   */
  async unbanUser(userId: string): Promise<void> {
    await this.api.call('unban-user', { user_id: userId });
  }

  /**
   * Bulk ban multiple users
   */
  async bulkBanUsers(userIds: string[], reason: string): Promise<{
    banned_count: number;
    failed_count: number;
    success: string[];
    failed: Array<{ user_id: string; error: string }>;
  }> {
    return await this.api.call('bulk-ban-users', {
      user_ids: userIds,
      ban_reason: reason
    });
  }

  /**
   * Permanently delete a user and all their data
   * WARNING: This action is IRREVERSIBLE
   */
  async hardDeleteUser(userId: string): Promise<void> {
    await this.api.call('hard-delete-user', {
      user_id: userId
    });
  }

  /**
   * Restore a soft-deleted user account (within 30-day grace period)
   */
  async restoreUser(userId: string): Promise<void> {
    await this.api.call('restore-user', {
      user_id: userId
    });
  }

  /**
   * Get permanently deleted users log with pagination and filters
   */
  async getDeletedUsersLog(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    deleted_by?: 'all' | 'auto' | 'admin';
    date_from?: string;
    date_to?: string;
  }): Promise<DeletedUsersLogResponse> {
    return await this.api.call<DeletedUsersLogResponse>('get-deleted-users-log', params);
  }
}
