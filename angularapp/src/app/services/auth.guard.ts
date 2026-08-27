import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  Router
} from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {

    // 1. Must be logged in
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    // 2. Role check
    const allowedRoles = route.data?.['roles'] as string[] | undefined;
    const userRole = (this.authService.getRole() || '').toLowerCase();

    if (allowedRoles && allowedRoles.length > 0) {
      const isAllowed = allowedRoles
        .map(r => r.toLowerCase())
        .includes(userRole);

      if (!isAllowed) {
        // Wrong role trying to access another portal -> logout + login
        this.authService.logout().subscribe({
          next: () => this.router.navigate(['/login']),
          error: () => this.router.navigate(['/login'])
        });
        return false;
      }
    }

    return true;
  }
}