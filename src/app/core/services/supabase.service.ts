import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private sessionSubject = new BehaviorSubject<Session | null>(null);
  public session$: Observable<Session | null> = this.sessionSubject.asObservable();

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: window.localStorage,
        storageKey: 'wheelbase-admin-auth'
      }
    });

    // Listen to auth state changes
    this.supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      this.sessionSubject.next(session);
    });

    // Initialize session
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.sessionSubject.next(session);
    });
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  get auth() {
    return this.supabase.auth;
  }

  /**
   * Call an admin Edge Function
   */
  async callFunction<T = any>(functionName: string, body?: any): Promise<T> {
    const { data, error } = await this.supabase.functions.invoke(`admin-${functionName}`, {
      body: body || {}
    });

    if (error) {
      console.error(`Function ${functionName} error:`, error);
      throw new Error(error.message || `Failed to call ${functionName}`);
    }

    if (!data.success) {
      throw new Error(data.error?.message || 'Function call failed');
    }

    return data.data as T;
  }

  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session;
  }

  /**
   * Sign in with email and password
   */
  async signInWithPassword(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({ email, password });
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle() {
    return await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: environment.redirectUrl
      }
    });
  }

  /**
   * Sign out
   */
  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    this.sessionSubject.next(null);
  }
}
