import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AdminUser, AdminSession } from '../models/admin-user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AdminUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  public isLoading = signal(true);
  public isAuthenticated = signal(false);

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const session = await this.supabase.getSession();
      if (session) {
        await this.verifySession();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Login with email and password
   */
  async loginWithEmail(email: string, password: string): Promise<void> {
    try {
      const { data, error } = await this.supabase.signInWithPassword(email, password);

      if (error) {
        throw new Error(error.message);
      }

      if (!data.session) {
        throw new Error('No session returned');
      }

      // Verify this is an admin user
      await this.verifySession();
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * Login with Google OAuth
   */
  async loginWithGoogle(): Promise<void> {
    try {
      const { data, error } = await this.supabase.signInWithGoogle();

      if (error) {
        throw new Error(error.message);
      }

      // OAuth will redirect to callback URL
      // Session verification happens in the callback handler
    } catch (error: any) {
      console.error('Google login error:', error);
      throw new Error(error.message || 'Google login failed');
    }
  }

  /**
   * Verify session and get admin user details
   */
  async verifySession(): Promise<void> {
    try {
      const adminUser = await this.supabase.callFunction<AdminUser>('verify-session');

      if (!adminUser || !adminUser.is_active) {
        throw new Error('Invalid or inactive admin account');
      }

      this.currentUserSubject.next(adminUser);
      this.isAuthenticated.set(true);
    } catch (error: any) {
      console.error('Session verification error:', error);
      this.currentUserSubject.next(null);
      this.isAuthenticated.set(false);
      throw error;
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await this.supabase.signOut();
      this.currentUserSubject.next(null);
      this.isAuthenticated.set(false);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): AdminUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Super admin has all permissions
    if (user.role === 'super_admin') return true;

    return user.permissions.includes(permission);
  }

  /**
   * Check if user has role
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    return user.role === role;
  }

  /**
   * Check if user is at least a certain role level
   */
  hasMinimumRole(minimumRole: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    const roleHierarchy = ['support', 'moderator', 'admin', 'super_admin'];
    const userRoleLevel = roleHierarchy.indexOf(user.role);
    const minimumRoleLevel = roleHierarchy.indexOf(minimumRole);

    return userRoleLevel >= minimumRoleLevel;
  }
}
