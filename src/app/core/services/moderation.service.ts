import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import {
  FlaggedContentResponse,
  ModerationRequest,
  ReviewReportsResponse,
  ReviewModerationRequest
} from '../models/content.model';

@Injectable({
  providedIn: 'root'
})
export class ModerationService {
  constructor(private api: ApiService) {}

  /**
   * Get flagged content queue
   */
  async getFlaggedContent(params: {
    page?: number;
    pageSize?: number;
    contentType?: 'post' | 'comment' | 'all';
  }): Promise<FlaggedContentResponse> {
    return await this.api.call<FlaggedContentResponse>('get-flagged-content', params);
  }

  /**
   * Moderate content (approve or remove)
   */
  async moderateContent(request: ModerationRequest): Promise<void> {
    await this.api.call('moderate-content', request);
  }

  /**
   * Get service provider review reports queue
   */
  async getReviewReports(params: {
    page?: number;
    pageSize?: number;
    status?: 'pending' | 'all';
  }): Promise<ReviewReportsResponse> {
    return await this.api.call<ReviewReportsResponse>('admin-get-review-reports', params);
  }

  /**
   * Moderate review report (dismiss, hide review, or ban user)
   */
  async moderateReviewReport(request: ReviewModerationRequest): Promise<void> {
    await this.api.call('admin-moderate-review-report', request);
  }
}
