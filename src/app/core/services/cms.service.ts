import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SupabaseService } from './supabase.service';

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

  constructor(
    private http: HttpClient,
    private supabase: SupabaseService
  ) {}

  /**
   * Get content list with filters and pagination (PUBLIC - published only)
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
   * Get content list for admin panel (all statuses)
   */
  getAdminContentList(params: {
    category?: string;
    status?: string;
    limit?: number;
    offset?: number;
    search?: string;
  } = {}): Observable<PaginatedResponse<ContentPage>> {
    return from(
      this.supabase.client.auth.getSession().then(({ data: { session } }) => {
        console.log('Session exists:', !!session);
        console.log('Access token exists:', !!session?.access_token);

        if (!session) {
          throw new Error('No active session. Please log in again.');
        }

        return this.supabase.client.functions.invoke('admin-get-content-list', {
          body: params,
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
      })
    ).pipe(
      map(response => {
        console.log('Response:', response);

        if (response.error) {
          console.error('Function error:', response.error);
          throw new Error(response.error.message || 'Failed to load content list');
        }
        if (!response.data || !response.data.success) {
          throw new Error(response.data?.error?.message || 'Failed to load content list');
        }
        return response.data as PaginatedResponse<ContentPage>;
      }),
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
   * Get single content page by ID (admin only)
   * Used for editing - fetches any status (draft, published, archived)
   */
  getContentById(id: string): Observable<ContentPage> {
    return from(
      this.supabase.client.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          throw new Error('No active session');
        }
        return this.supabase.client.functions.invoke('admin-get-content', {
          body: { id },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
      })
    ).pipe(
      map(response => {
        if (response.error) {
          throw new Error(response.error.message || 'Failed to load content');
        }
        if (!response.data || !response.data.success) {
          throw new Error(response.data?.error?.message || 'Failed to load content');
        }
        return response.data.data as ContentPage;
      }),
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
    return from(
      this.supabase.client.functions.invoke('admin-create-content', {
        body: data
      })
    ).pipe(
      map(response => {
        if (response.error) {
          throw new Error(response.error.message || 'Failed to create content');
        }
        if (!response.data || !response.data.success) {
          throw new Error(response.data?.error?.message || 'Failed to create content');
        }
        return response.data.data as ContentPage;
      }),
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
    return from(
      this.supabase.client.functions.invoke('admin-create-content', {
        body: { id, ...data }
      })
    ).pipe(
      map(response => {
        if (response.error) {
          throw new Error(response.error.message || 'Failed to update content');
        }
        if (!response.data || !response.data.success) {
          throw new Error(response.data?.error?.message || 'Failed to update content');
        }
        return response.data.data as ContentPage;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Publish content page (admin only)
   */
  publishContent(id: string, action: 'publish' | 'unpublish' | 'archive'): Observable<ContentPage> {
    return from(
      this.supabase.client.functions.invoke('admin-publish-content', {
        body: { id, action }
      })
    ).pipe(
      map(response => {
        if (response.error) {
          throw new Error(response.error.message || 'Failed to publish content');
        }
        if (!response.data || !response.data.success) {
          throw new Error(response.data?.error?.message || 'Failed to publish content');
        }
        return response.data.data as ContentPage;
      }),
      catchError(this.handleError)
    );
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
