import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-base-300 flex items-center justify-center">
      <div class="text-center">
        @if (error) {
          <div class="text-error mb-4">
            <span class="material-symbols-outlined text-5xl">error</span>
          </div>
          <h1 class="text-xl font-bold text-white mb-2">Authentication Failed</h1>
          <p class="text-base-content/60 mb-4">{{ error }}</p>
          <a routerLink="/login" class="btn btn-primary">Back to Login</a>
        } @else {
          <span class="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
          <p class="text-base-content/60 mt-4">Completing sign in...</p>
        }
      </div>
    </div>
  `
})
export class AuthCallbackComponent implements OnInit {
  error: string | null = null;

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    try {
      // Supabase client with detectSessionInUrl: true should have already
      // exchanged the code for a session. We just need to verify it.
      const session = await this.supabase.getSession();

      if (session) {
        // Verify this is an admin user
        await this.authService.verifySession();
        this.router.navigate(['/dashboard']);
      } else {
        // No session - might need to wait for Supabase to process the code
        // Listen for auth state change
        const { data: { subscription } } = this.supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
              subscription.unsubscribe();
              try {
                await this.authService.verifySession();
                this.router.navigate(['/dashboard']);
              } catch (err: any) {
                this.error = err.message || 'Failed to verify admin access';
              }
            }
          }
        );

        // Timeout after 10 seconds
        setTimeout(() => {
          subscription.unsubscribe();
          if (!this.authService.isAuthenticated()) {
            this.error = 'Authentication timed out. Please try again.';
          }
        }, 10000);
      }
    } catch (err: any) {
      console.error('Auth callback error:', err);
      this.error = err.message || 'Authentication failed';
    }
  }
}
