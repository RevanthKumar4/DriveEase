import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { FeedbackService } from '../../services/feedback.service';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-customerviewfeedback',
  templateUrl: './customerviewfeedback.component.html',
  styleUrls: ['./customerviewfeedback.component.css']
})
export class CustomerviewfeedbackComponent implements OnInit, OnDestroy {

  feedbacks: any[] = [];

  selectedDriver: any = null;
  showDriverModal: boolean = false;

  // ===== DELETE CONFIRMATION =====
  showDeleteModal: boolean = false;
  deleteTargetId: number | null = null;

  isDarkMode: boolean = true;
  isLoading: boolean = true;

  // ===== PAGINATION =====
  currentPage: number = 1;
  pageSize: number = 10;

  private themeSub?: Subscription;
  private feedbackSub?: Subscription;
  private deleteSub?: Subscription;

  constructor(
    private feedbackService: FeedbackService,
    private theme: ThemeService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.themeSub = this.theme.isDarkMode$.subscribe(
      (value: boolean) => {
        this.isDarkMode = value;
      }
    );

    this.loadFeedbacks();
  }

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();
    this.feedbackSub?.unsubscribe();
    this.deleteSub?.unsubscribe();
  }

  loadFeedbacks(): void {
    this.isLoading = true;
    this.feedbacks = [];

    // userId from in-memory AuthService
    const userId = Number(this.authService.getUserId());

    if (!userId) {
      console.error('User ID not found!');
      this.isLoading = false;
      return;
    }

    this.feedbackSub?.unsubscribe();

    this.feedbackSub = this.feedbackService
      .getAllFeedbacksByUserId(userId)
      .subscribe({
        next: (response: any) => {
          if (Array.isArray(response)) {
            this.feedbacks = response;
          } else if (response && Array.isArray(response.content)) {
            this.feedbacks = response.content;
          } else if (response && Array.isArray(response.data)) {
            this.feedbacks = response.data;
          } else {
            this.feedbacks = [];
          }

          // Reset to first page whenever data reloads
          this.currentPage = 1;

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching feedbacks:', error);
          this.feedbacks = [];
          this.isLoading = false;
        }
      });
  }

  // ===== PAGINATION HELPERS =====

  // Total number of pages (at least 1)
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.feedbacks.length / this.pageSize));
  }

  // Only the records for the current page (max 10)
  get pagedFeedbacks(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.feedbacks.slice(start, start + this.pageSize);
  }

  // Array like [1,2,3...] for page number buttons
  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  viewDriverInfo(feedback: any): void {
    if (feedback?.driver) {
      this.selectedDriver = feedback.driver;
    } else {
      this.selectedDriver = {
        driverName: feedback?.driverName || 'N/A',
        vehicleType: feedback?.vehicleType || 'N/A',
        experienceYears: feedback?.experienceYears || 0,
        contactNumber: feedback?.contactNumber || 'N/A',
        hourlyRate: feedback?.hourlyRate || 0
      };
    }

    this.showDriverModal = true;
  }

  closeDriverModal(): void {
    this.showDriverModal = false;
    this.selectedDriver = null;
  }

  // Open the confirmation popup instead of native confirm()
  askDelete(feedbackId: number): void {
    if (!feedbackId) {
      return;
    }
    this.deleteTargetId = feedbackId;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.deleteTargetId = null;
  }

  confirmDelete(): void {
    const feedbackId = this.deleteTargetId;
    this.showDeleteModal = false;
    this.deleteTargetId = null;

    if (!feedbackId) {
      return;
    }

    this.deleteSub?.unsubscribe();

    this.deleteSub = this.feedbackService
      .deleteFeedback(feedbackId)
      .subscribe({
        next: () => {
          // If last item on a page was deleted, step back a page
          if (this.currentPage > 1 &&
              (this.feedbacks.length - 1) <= (this.currentPage - 1) * this.pageSize) {
            this.currentPage--;
          }
          this.loadFeedbacks();
        },
        error: (error) => {
          console.error('Error deleting feedback:', error);
          alert('Failed to delete feedback. Please check the console.');
        }
      });
  }
}