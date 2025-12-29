import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AppUser, UserDetail, UsersListResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  constructor(private api: ApiService) {}

  /**
   * Get paginated users list
   */
  async getUsers(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: 'all' | 'active' | 'banned';
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
}
