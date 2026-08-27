import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FeedbackService } from '../../services/feedback.service';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-customerpostfeedback',
  templateUrl: './customerpostfeedback.component.html',
  styleUrls: ['./customerpostfeedback.component.css']
})
export class CustomerpostfeedbackComponent implements OnInit, OnDestroy {

  feedback: any = {
    feedbackText: '',
    category: '',
    rating: ''
  };

  isDarkMode: boolean = true;
  showSuccessBox: boolean = false;
  successMessage: string = 'Thank you for your feedback!';

  private themeSub?: Subscription;

  constructor(
    private feedbackService: FeedbackService,
    private router: Router,
    private theme: ThemeService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.themeSub = this.theme.isDarkMode$.subscribe(value => {
      this.isDarkMode = value;
    });
  }

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();
  }

  submitFeedback(form: NgForm): void {

    if (form.invalid) {
      alert('All fields are required');
      return;
    }

    const userId = Number(this.authService.getUserId());
    const driverId = Number(localStorage.getItem('driverId'));

    if (!userId || userId === 0) {
      alert('User not found. Please login again.');
      return;
    }

    if (!driverId || driverId === 0) {
      alert('Driver not found.');
      this.goBack();
      return;
    }

    const feedbackPayload = {
      feedbackText: this.feedback.feedbackText,
      category: this.feedback.category,
      rating: Number(this.feedback.rating),
      date: new Date().toISOString().split('T')[0],
      user: {
        userId: userId
      },
      driver: {
        driverId: driverId
      }
    };

    this.feedbackService.sendFeedback(feedbackPayload).subscribe({
      next: () => {
        // ✅ Mark the request as reviewed (so "Give Feedback" disables in My Requests)
        this.markRequestReviewed();

        localStorage.removeItem('driverId');
        form.resetForm();

        this.successMessage = 'Your review has been submitted successfully!';
        this.showSuccessBox = true;
      },
      error: (error) => {
        if (error.status === 409) {
          // Already submitted -> still mark reviewed so button disables
          this.markRequestReviewed();
          alert('Feedback already submitted or conflict occurred.');
          this.goBack();
        } else if (error.status === 401 || error.status === 403) {
          alert('Unauthorized. Please log out and log back in.');
        } else if (error.status === 400) {
          alert('Invalid data submitted. Please check the form and try again.');
        } else {
          alert('Something Went Wrong. Check console.');
        }
      }
    });
  }

  // Marks the request (that was being reviewed) as reviewed in localStorage
  private markRequestReviewed(): void {
    const reviewingId = localStorage.getItem('reviewingRequestId');
    if (reviewingId) {
      const reviewed = JSON.parse(localStorage.getItem('reviewedRequestIds') || '[]');
      if (!reviewed.includes(Number(reviewingId))) {
        reviewed.push(Number(reviewingId));
        localStorage.setItem('reviewedRequestIds', JSON.stringify(reviewed));
      }
      localStorage.removeItem('reviewingRequestId');
    }
  }

  closeSuccessBox(): void {
    this.showSuccessBox = false;
    this.router.navigate(['/customer/feedback']);
  }

  goBack(): void {
    this.router.navigate(['/customer/my-requests']);
  }
}