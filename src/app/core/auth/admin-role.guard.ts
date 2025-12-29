import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminRoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const requiredRole = route.data['role'] as string;
    const requiredPermission = route.data['permission'] as string;

    // Check role if specified
    if (requiredRole && !this.authService.hasMinimumRole(requiredRole)) {
      this.router.navigate(['/dashboard']);
      return false;
    }

    // Check permission if specified
    if (requiredPermission && !this.authService.hasPermission(requiredPermission)) {
      this.router.navigate(['/dashboard']);
      return false;
    }

    return true;
  }
}
