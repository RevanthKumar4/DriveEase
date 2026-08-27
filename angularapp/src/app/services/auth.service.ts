import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { Login } from '../models/login.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public apiUrl = `${environment.apiURL}/api`;

  /*
   * =========================================================
   * IN-MEMORY STATE (the important part)
   * =========================================================
   * role, userId and username are kept in memory here.
   * Because they live in JavaScript memory (not localStorage),
   * clearing DevTools -> Application -> Local Storage does NOT
   * affect the running app. The page stays exactly as it is.
   *
   * The JWT itself is stored by the backend in an HttpOnly cookie
   * (DriveU-JWT), so it never appears in Local Storage at all.
   *
   * We still mirror these values into localStorage ONLY so that
   * a full page refresh (F5) can restore them. They are
   * non-sensitive UI values (no token).
   * =========================================================
   */
  private roleSubject = new BehaviorSubject<string | null>(localStorage.getItem('role'));
  private userIdSubject = new BehaviorSubject<string | null>(localStorage.getItem('userId'));
  private usernameSubject = new BehaviorSubject<string | null>(localStorage.getItem('username'));

  public role$ = this.roleSubject.asObservable();
  public userId$ = this.userIdSubject.asObservable();
  public username$ = this.usernameSubject.asObservable();

  constructor(private http: HttpClient) {}

  register(user: User): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user, {
      withCredentials: true
    });
  }

  login(login: Login): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, login, {
      // Lets the browser accept and store the HttpOnly cookie
      withCredentials: true
    }).pipe(
      tap((response: any) => {
        this.setState(
          response.userRole,
          response.userId?.toString(),
          response.username
        );
      })
    );
  }

  logout(): Observable<any> {
    // Ask backend to clear the HttpOnly cookie
    return this.http.post(`${this.apiUrl}/logout`, {}, {
      withCredentials: true,
      responseType: 'text'
    }).pipe(
      tap(() => this.clearState())
    );
  }

  /*
   * Stores state in memory AND mirrors to localStorage
   * (for surviving a page refresh).
   */
  private setState(role: string, userId: string, username: string): void {
    this.roleSubject.next(role);
    this.userIdSubject.next(userId);
    this.usernameSubject.next(username);

    localStorage.setItem('role', role);
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username);
  }

  private clearState(): void {
    this.roleSubject.next(null);
    this.userIdSubject.next(null);
    this.usernameSubject.next(null);

    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('theme');
  }

  /*
   * =========================================================
   * SYNCHRONOUS GETTERS
   * =========================================================
   * IMPORTANT: components should use THESE getters instead of
   * localStorage.getItem(...). They read from memory, so the UI
   * keeps working even if localStorage is cleared manually.
   * =========================================================
   */
  getRole(): string | null {
    return this.roleSubject.value;
  }

  getUserId(): string | null {
    return this.userIdSubject.value;
  }

  getUsername(): string | null {
    return this.usernameSubject.value;
  }

  isLoggedIn(): boolean {
    // Based on in-memory role. The real security check is the
    // HttpOnly cookie validated by the backend on every request.
    return !!this.roleSubject.value;
  }

  sendOtp(email: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/otp/send`,
      { email },
      { withCredentials: true, responseType: 'text' }
    );
  }

  verifyOtp(email: string, otp: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/otp/verify`,
      { email, otp },
      { withCredentials: true, responseType: 'text' }
    );
  }
}
