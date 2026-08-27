import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DashboardStateService } from './services/dashboard-state.service.ts.service';
import { ThemeService } from './services/theme.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  currentRotation: number = 0;
  activeView: string = 'home';
  isCustomerCubeRoute: boolean = false;

  isDarkMode: boolean = true;

  constructor(
    public router: Router,
    private dashboardState: DashboardStateService,
    private theme: ThemeService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }

    this.theme.isDarkMode$.subscribe(v => {
      this.isDarkMode = v;
      if (v) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    });

    this.dashboardState.currentRotation$.subscribe(rotation => {
      this.currentRotation = rotation;
    });

    this.dashboardState.activeView$.subscribe(view => {
      this.activeView = view;
    });

    /*
     * Kill the bfcache "flash": if a cached page is shown via
     * forward/back while the user is NOT logged in, force login.
     */
    window.addEventListener('pageshow', (event: any) => {
      if (event.persisted && !this.authService.isLoggedIn()) {
        window.location.replace('/login');
      }
    });

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.syncCubeWithUrl(event.urlAfterRedirects);
      });

    this.syncCubeWithUrl(this.router.url);
  }

  toggleTheme(): void {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    this.theme.toggle();
  }

  get showNavbar(): boolean {
    const currentUrl = this.router.url.split('?')[0];

    if (
      currentUrl === '/' ||
      currentUrl.includes('/login') ||
      currentUrl.includes('/signup') ||
      currentUrl.includes('/error')
    ) {
      return false;
    }

    return true;
  }

  get userRole(): string {
    return this.authService.getRole() || '';
  }

  get isAdmin(): boolean {
    return this.userRole.toLowerCase() === 'admin';
  }

  get isCustomer(): boolean {
    const role = this.userRole.toLowerCase();
    return role === 'customer' || role === 'user';
  }

  syncCubeWithUrl(url: string): void {
    this.isCustomerCubeRoute = false;

    if (!url.startsWith('/customer')) {
      return;
    }

    if (url.includes('/customer/home')) {
      this.isCustomerCubeRoute = true;
      this.dashboardState.setView('home', 0);
    } else if (url.includes('/customer/available-drivers')) {
      this.isCustomerCubeRoute = true;
      this.dashboardState.setView('drivers', -90);
    } else if (url.includes('/customer/my-requests')) {
      this.isCustomerCubeRoute = true;
      this.dashboardState.setView('requests', -180);
    } else if (url.includes('/customer/feedback')) {
      this.isCustomerCubeRoute = true;
      this.dashboardState.setView('feedback', 90);
    } else {
      this.isCustomerCubeRoute = false;
    }
  }
}