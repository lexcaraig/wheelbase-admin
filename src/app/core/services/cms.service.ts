import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ContentPage {
  id: string;
  slug: string;
  category: 'legal' | 'updates' | 'help' | 'announcements' | 'about';
  title: string;
  content: string;
  excerpt: string | null;
  version: number;
  status: 'draft' | 'published' | 'archived';
  publishedAt: string | null;
  effectiveDate: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ContentVersion {
  id: string;
  pageId: string;
  version: number;
  title: string;
  content: string;
  excerpt: string | null;
  publishedAt: string | null;
  changeSummary: string | null;
  changeType: 'major' | 'minor' | 'patch' | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CmsService {
  private readonly baseUrl = `${environment.supabaseUrl}/functions/v1`;

  constructor(private http: HttpClient) {}

  /**
   * Get content list with filters and pagination
   */
  getContentList(params: {
    category?: string;
    limit?: number;
    offset?: number;
    search?: string;
  } = {}): Observable<PaginatedResponse<ContentPage>> {
    return this.http.post<PaginatedResponse<ContentPage>>(
      `${this.baseUrl}/get-content-list`,
      params
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get single content page by slug
   */
  getContent(slug: string, version?: number): Observable<ContentPage> {
    return this.http.post<ApiResponse<ContentPage>>(
      `${this.baseUrl}/get-content`,
      { slug, version }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Create new content page (admin only)
   */
  createContent(data: {
    slug: string;
    category: string;
    title: string;
    content: string;
    excerpt?: string;
    effectiveDate?: string;
    metadata?: Record<string, any>;
  }): Observable<ContentPage> {
    return this.http.post<ApiResponse<ContentPage>>(
      `${this.baseUrl}/admin-create-content`,
      data,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Update existing content page (admin only)
   */
  updateContent(id: string, data: {
    slug: string;
    category: string;
    title: string;
    content: string;
    excerpt?: string;
    effectiveDate?: string;
    metadata?: Record<string, any>;
    changeSummary?: string;
    changeType?: 'major' | 'minor' | 'patch';
  }): Observable<ContentPage> {
    return this.http.post<ApiResponse<ContentPage>>(
      `${this.baseUrl}/admin-create-content`,
      { id, ...data },
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Publish content page (admin only)
   */
  publishContent(id: string, action: 'publish' | 'unpublish' | 'archive'): Observable<ContentPage> {
    return this.http.post<ApiResponse<ContentPage>>(
      `${this.baseUrl}/admin-publish-content`,
      { id, action },
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Get auth headers with JWT token
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('supabase_access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): Observable<never> {
    console.error('CMS API Error:', error);
    const message = error.error?.error?.message || error.message || 'An unexpected error occurred';
    return throwError(() => new Error(message));
  }
}
