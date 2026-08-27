import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardStateService } from 'src/app/services/dashboard-state.service.ts.service';
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'app-customernav',
  templateUrl: './customernav.component.html',
  styleUrls: ['./customernav.component.css']
})
export class CustomernavComponent implements OnInit {
  activeView = 'home';
  isDarkMode = true;
  userName = 'User';

  constructor(
    private router: Router,
    private dashboardState: DashboardStateService,
    private theme: ThemeService
  ) {}

  ngOnInit() {
    this.dashboardState.activeView$.subscribe(v => this.activeView = v);
    this.theme.isDarkMode$.subscribe(v => this.isDarkMode = v);

    this.loadUserName();
  }

  loadUserName() {
    const storedUserName =
      localStorage.getItem('userName') ||
      localStorage.getItem('username') ||
      localStorage.getItem('name') ||
      localStorage.getItem('customerName');

    if (storedUserName) {
      this.userName = storedUserName;
      return;
    }

    const storedUser =
      localStorage.getItem('user') ||
      localStorage.getItem('currentUser');

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);

        this.userName =
          parsedUser.userName ||
          parsedUser.username ||
          parsedUser.name ||
          parsedUser.customerName ||
          'User';
      } catch {
        this.userName = 'User';
      }
    }
  }

  toggleTheme() {
    this.theme.toggle();
  }

  goHome() {
    this.router.navigate(['/customer/home']);
  }

  goBookDriver() {
    this.router.navigate(['/customer/available-drivers']);
  }

  goMyRequests() {
    this.router.navigate(['/customer/my-requests']);
  }

  goFeedback() {
    this.router.navigate(['/customer/feedback']);
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}