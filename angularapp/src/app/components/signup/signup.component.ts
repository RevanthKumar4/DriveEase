import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from 'src/app/models/user.model';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {

  showRegPassword: boolean = false;
  showConfirmPassword: boolean = false;

  user: User = {
    username: '',
    email: '',
    password: '',
    mobileNumber: '',
    userRole: ''
  };

  confirmPassword: string = '';

  errorMessage: string = '';
  successMessage: string = '';
  showSuccessModal: boolean = false;

  // OTP state
  otp: string = '';
  otpSent: boolean = false;
  otpVerified: boolean = false;
  otpMessage: string = '';
  sendingOtp: boolean = false;
  verifyingOtp: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  sendOtp(): void {
    this.otpMessage = '';
    this.errorMessage = '';

    const emailPattern =
      /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

    if (!this.user.email || !emailPattern.test(this.user.email)) {
      this.otpMessage = 'Enter a valid email before sending OTP';
      return;
    }

    this.sendingOtp = true;

    this.authService.sendOtp(this.user.email).subscribe({
      next: (response: any) => {
        this.sendingOtp = false;
        this.otpSent = true;
        this.otpVerified = false;
        try {
          const data = typeof response === 'string' ? JSON.parse(response) : response;
          if (data && data.otp) {
            this.otp = data.otp;
            this.otpMessage = `OTP generated successfully: ${data.otp}`;
          } else {
            this.otpMessage = data?.message || 'OTP sent to your email.';
          }
        } catch {
          this.otpMessage = 'OTP sent to your email.';
        }
      },
      error: (error) => {
        this.sendingOtp = false;
        if (error.status === 409) {
          this.otpMessage = 'A user with this email already exists';
        } else {
          this.otpMessage = 'Failed to send OTP. Please try again.';
        }
      }
    });
  }

  verifyOtp(): void {
    this.otpMessage = '';
    this.errorMessage = '';

    if (!this.otp || this.otp.trim().length === 0) {
      this.otpMessage = 'Enter the OTP sent to your email';
      return;
    }

    this.verifyingOtp = true;

    this.authService.verifyOtp(this.user.email, this.otp).subscribe({
      next: () => {
        this.verifyingOtp = false;
        this.otpVerified = true;
        this.otpMessage = 'Email verified successfully.';
      },
      error: () => {
        this.verifyingOtp = false;
        this.otpVerified = false;
        this.otpMessage = 'Invalid or expired OTP';
      }
    });
  }

  register(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (
      this.user.username === '' ||
      this.user.email === '' ||
      this.user.mobileNumber === '' ||
      this.user.userRole === '' ||
      this.user.password === '' ||
      this.confirmPassword === ''
    ) {
      this.errorMessage = 'All fields are required';
      return;
    }

    if (this.user.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    if (!this.otpVerified) {
      this.errorMessage = 'Please verify your email with OTP first';
      return;
    }

    this.authService.register(this.user).subscribe({
      next: () => {
        this.showSuccessModal = true;
      },
      error: (error) => {
        if (error.status === 409) {
          this.errorMessage = 'A user with this email already exists';
        } else {
          this.errorMessage = 'Registration failed. Please try again';
        }
      }
    });
  }

  goToLogin(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/login']);
  }
}