import {
  Component,
  OnInit
} from '@angular/core';

import {
  FeedbackService
} from 'src/app/services/feedback.service';

@Component({
  selector: 'app-adminviewfeedback',
  templateUrl: './adminviewfeedback.component.html',
  styleUrls: ['./adminviewfeedback.component.css']
})
export class AdminviewfeedbackComponent implements OnInit {

  feedbacks: any[] = [];
  filteredFeedbacks: any[] = [];

  selectedCategory: string = '';

  showUserModal: boolean = false;
  showDriverModal: boolean = false;

  selectedUser: any = null;
  selectedDriver: any = null;

  driverImageFailed: boolean = false;

  // ===== PAGINATION =====
  currentPage: number = 1;
  itemsPerPage: number = 10;

  constructor(
    private feedbackService: FeedbackService
  ) {}

  ngOnInit(): void {
    this.loadFeedbacks();
  }

  loadFeedbacks(): void {
    this.feedbackService
      .getFeedbacks()
      .subscribe({
        next: (data) => {
          this.feedbacks = data || [];
          this.filteredFeedbacks = data || [];
          this.currentPage = 1;
        },

        error: () => {
          this.feedbacks = [];
          this.filteredFeedbacks = [];
        }
      });
  }

  filterFeedbacks(): void {
    if (this.selectedCategory === '') {
      this.filteredFeedbacks = this.feedbacks;
    } else {
      this.filteredFeedbacks =
        this.feedbacks.filter((feedback) => {
          return feedback.category === this.selectedCategory;
        });
    }

    // Reset to first page whenever the filter changes
    this.currentPage = 1;
  }

  // ===== PAGINATION HELPERS =====
  get paginatedFeedbacks(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredFeedbacks.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredFeedbacks.length / this.itemsPerPage) || 1;
  }

  get pagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  showUserProfile(feedback: any): void {
    if (feedback.user) {
      this.selectedUser = feedback.user;
    } else {
      this.selectedUser = {
        username: feedback.username || 'N/A',
        email: feedback.email || 'N/A',
        mobileNumber: feedback.mobileNumber || 'N/A'
      };
    }

    this.showUserModal = true;
    this.lockBodyScroll();
  }

  showDriverInfo(feedback: any): void {
    this.driverImageFailed = false;

    if (feedback.driver) {
      this.selectedDriver = feedback.driver;
    } else {
      this.selectedDriver = {
        driverName: feedback.driverName || 'N/A',
        licenseNumber: feedback.licenseNumber || 'N/A',
        contactNumber: feedback.contactNumber || 'N/A',
        experienceYears: feedback.experienceYears || 'N/A',
        vehicleType: feedback.vehicleType || 'N/A',
        availabilityStatus:
          feedback.availabilityStatus || 'N/A',
        image: feedback.image || ''
      };
    }

    this.showDriverModal = true;
    this.lockBodyScroll();
  }

  handleDriverImageError(): void {
    this.driverImageFailed = true;
  }

  closeUserModal(): void {
    this.showUserModal = false;
    this.selectedUser = null;
    this.unlockBodyScroll();
  }

  closeDriverModal(): void {
    this.showDriverModal = false;
    this.selectedDriver = null;
    this.driverImageFailed = false;
    this.unlockBodyScroll();
  }

  private lockBodyScroll(): void {
    document.body.style.overflow = 'hidden';
  }

  private unlockBodyScroll(): void {
    document.body.style.overflow = '';
  }
}