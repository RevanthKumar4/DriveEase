import {
  Component,
  HostListener,
  OnInit,
  Renderer2
} from '@angular/core';

import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-adminnav',
  templateUrl: './adminnav.component.html',
  styleUrls: ['./adminnav.component.css']
})
export class AdminnavComponent implements OnInit {

  username: string = '';
  role: string = '';
  isSidebarCollapsed: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername() || 'Admin';
    this.role = this.authService.getRole() || 'ADMIN';

    const savedSidebarState =
      localStorage.getItem('adminSidebarCollapsed');

    this.isSidebarCollapsed = savedSidebarState === 'true';

    setTimeout(() => {
      this.updateSidebarLayout();
    }, 0);
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;

    localStorage.setItem(
      'adminSidebarCollapsed',
      String(this.isSidebarCollapsed)
    );

    this.updateSidebarLayout();
  }

  private updateSidebarLayout(): void {
    const mainContent =
      document.querySelector('.admin-main-content') as HTMLElement;

    const backgroundEffects =
      document.querySelector('.admin-background-effects') as HTMLElement;

    if (window.innerWidth <= 900) {
      if (mainContent) {
        this.renderer.setStyle(
          mainContent,
          'margin-left',
          '0px'
        );

        this.renderer.setStyle(
          mainContent,
          'width',
          '100%'
        );
      }

      if (backgroundEffects) {
        this.renderer.setStyle(
          backgroundEffects,
          'left',
          '0px'
        );
      }

      return;
    }

    const sidebarWidth =
      this.isSidebarCollapsed ? '88px' : '270px';

    if (mainContent) {
      this.renderer.setStyle(
        mainContent,
        'margin-left',
        sidebarWidth
      );

      this.renderer.setStyle(
        mainContent,
        'width',
        `calc(100% - ${sidebarWidth})`
      );
    }

    if (backgroundEffects) {
      this.renderer.setStyle(
        backgroundEffects,
        'left',
        sidebarWidth
      );
    }

    this.renderer.setStyle(
      document.documentElement,
      '--admin-current-sidebar-width',
      sidebarWidth
    );

    if (this.isSidebarCollapsed) {
      this.renderer.addClass(
        document.body,
        'admin-sidebar-is-collapsed'
      );
    } else {
      this.renderer.removeClass(
        document.body,
        'admin-sidebar-is-collapsed'
      );
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateSidebarLayout();
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.clearSidebarState();
        this.router.navigate(['/login']);
      },

      error: () => {
        this.clearSidebarState();
        this.router.navigate(['/login']);
      }
    });
  }

  private clearSidebarState(): void {
    localStorage.removeItem('adminSidebarCollapsed');

    this.renderer.removeClass(
      document.body,
      'admin-sidebar-is-collapsed'
    );

    this.renderer.setStyle(
      document.documentElement,
      '--admin-current-sidebar-width',
      '270px'
    );
  }
}
