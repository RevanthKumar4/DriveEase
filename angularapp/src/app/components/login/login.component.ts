import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Login } from 'src/app/models/login.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginObj: Login = { email: '', password: '' };
  errorMessage: string = '';
  showPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Trap history so back/forward can't leave the login page
    history.pushState(null, '', location.href);
  }

  @HostListener('window:popstate')
  onPopState(): void {
    // Re-trap: stay on login
    history.pushState(null, '', location.href);
  }

  login(): void {
    this.errorMessage = '';

    this.authService.login(this.loginObj).subscribe({
      next: (response) => {
        if (response.userRole?.toLowerCase() === 'admin') {
          this.router.navigate(['/admin/home']);
        } else {
          this.router.navigate(['/customer/home']);
        }
      },
      error: () => {
        this.errorMessage = 'Invalid Email or Password';
      }
    });
  }
}