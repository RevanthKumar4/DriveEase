import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private router: Router) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {

    const isExternalPublicApi =
      req.url.includes('nominatim.openstreetmap.org') ||
      req.url.includes('openstreetmap.org') ||
      req.url.includes('maps.google.com') ||
      req.url.includes('google.com/maps');

    const authReq = isExternalPublicApi
      ? req
      : req.clone({
          withCredentials: true
        });

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {

        // Only redirect to login if the SESSION CHECK (/api/me) fails.
        // Do NOT logout on data-endpoint 401s (prevents the bounce to login).
        const isSessionCheck = req.url.includes('/api/me');

        if (
          !isExternalPublicApi &&
          isSessionCheck &&
          (error.status === 401 || error.status === 403)
        ) {
          localStorage.removeItem('role');
          localStorage.removeItem('userId');
          localStorage.removeItem('username');
          this.router.navigate(['/login']);
        }

        return throwError(() => error);
      })
    );
  }
}