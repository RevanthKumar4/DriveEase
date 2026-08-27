import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DriverRequestService } from 'src/app/services/driver-request.service';
import { DriverService } from 'src/app/services/driver.service';


@Component({
  selector: 'app-adminviewrequests',
  templateUrl: './adminviewrequests.component.html',
  styleUrls: ['./adminviewrequests.component.css']
})
export class AdminviewrequestsComponent implements OnInit {

  requests: any[] = [];
  filteredRequests: any[] = [];

  searchText: string = '';
  selectedStatus: string = '';
  selectedSort: string = 'newest';

  showDriverModal: boolean = false;
  showStageModal: boolean = false;
  showPaymentInfoModal: boolean = false;

  selectedDriver: any = null;
  selectedRequest: any = null;

  isLoading: boolean = false;
  isClosingRequest: boolean = false;

  updatingRequestId: number = 0;

  successMessage: string = '';
  errorMessage: string = '';

  // ===== PAGINATION =====
  currentPage: number = 1;
  itemsPerPage: number = 6;

  private messageTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private driverRequestService: DriverRequestService,
    private driverService: DriverService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  get totalRequests(): number {
    return this.requests.length;
  }

  get pendingRequests(): number {
    return this.getRequestCountByStatus('Pending');
  }

  get approvedRequests(): number {
    return this.getRequestCountByStatus('Approved');
  }

  get rejectedRequests(): number {
    return this.getRequestCountByStatus('Rejected');
  }

  get completedRequests(): number {
    return this.requests.filter((request) => {
      return request.status === 'Trip End' || request.status === 'Closed';
    }).length;
  }

  loadRequests(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.driverRequestService.getAllDriverRequests().subscribe({
      next: (data) => {
        this.requests = data || [];
        this.filterRequests();
        this.isLoading = false;
      },
      error: () => {
        this.requests = [];
        this.filteredRequests = [];
        this.isLoading = false;
        this.showErrorMessage('Unable to load driver requests. Please refresh the page and try again.');
      }
    });
  }

  filterRequests(): void {
    const searchValue = this.searchText.trim().toLowerCase();

    let result = this.requests.filter((request) => {
      const driverName = String(request.driver?.driverName || '').toLowerCase();
      const customerName = String(request.user?.username || '').toLowerCase();
      const requestId = String(request.driverRequestId || '').toLowerCase();
      const vehicleType = String(request.driver?.vehicleType || '').toLowerCase();

      const matchesSearch =
        searchValue === '' ||
        driverName.includes(searchValue) ||
        customerName.includes(searchValue) ||
        requestId.includes(searchValue) ||
        vehicleType.includes(searchValue);

      const matchesStatus =
        this.selectedStatus === '' || request.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });

    result = this.sortRequests(result);
    this.filteredRequests = result;

    // Reset to first page whenever filters/search/sort change
    this.currentPage = 1;
  }

  private sortRequests(requests: any[]): any[] {
    const sortedRequests = [...requests];

    switch (this.selectedSort) {
      case 'oldest':
        return sortedRequests.sort((a, b) => Number(a.driverRequestId || 0) - Number(b.driverRequestId || 0));
      case 'driverAsc':
        return sortedRequests.sort((a, b) => String(a.driver?.driverName || '').localeCompare(String(b.driver?.driverName || '')));
      case 'driverDesc':
        return sortedRequests.sort((a, b) => String(b.driver?.driverName || '').localeCompare(String(a.driver?.driverName || '')));
      case 'tripDateAsc':
        return sortedRequests.sort((a, b) => this.getDateValue(a.tripDate) - this.getDateValue(b.tripDate));
      case 'tripDateDesc':
        return sortedRequests.sort((a, b) => this.getDateValue(b.tripDate) - this.getDateValue(a.tripDate));
      case 'newest':
      default:
        return sortedRequests.sort((a, b) => Number(b.driverRequestId || 0) - Number(a.driverRequestId || 0));
    }
  }

  // ===== PAGINATION HELPERS =====
  get paginatedRequests(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredRequests.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredRequests.length / this.itemsPerPage) || 1;
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

  clearSearch(): void {
    this.searchText = '';
    this.filterRequests();
  }

  resetFilters(): void {
    this.searchText = '';
    this.selectedStatus = '';
    this.selectedSort = 'newest';
    this.filterRequests();
  }

  // ---------- DRIVER MODAL (receives whole request, fetches full driver) ----------
  showDriverDetails(request: any): void {
    const driverId =
      request?.driver?.driverId ||
      request?.driver?.id ||
      request?.driverId;

    // Already has full driver details
    if (request?.driver?.driverName) {
      this.selectedDriver = request.driver;
      this.showDriverModal = true;
      this.lockBodyScroll();
      this.cdr.detectChanges();   // 👈 force refresh
      return;
    }

    // Fetch full driver by ID
    if (driverId) {
      this.driverService.getDriverById(driverId).subscribe({
        next: (fullDriver: any) => {
          this.selectedDriver = fullDriver || null;
          this.showDriverModal = true;
          this.lockBodyScroll();
          this.cdr.detectChanges();   // 👈 force refresh after async data arrives
        },
        error: (err) => {
          console.error('Failed to fetch driver:', err);
          this.selectedDriver = request?.driver || null;
          this.showDriverModal = true;
          this.lockBodyScroll();
          this.cdr.detectChanges();   // 👈 force refresh
        }
      });
    } else {
      this.selectedDriver = null;
      this.showDriverModal = true;
      this.lockBodyScroll();
      this.cdr.detectChanges();
    }
  }

  closeDriverModal(): void {
    this.showDriverModal = false;
    this.selectedDriver = null;
    this.unlockBodyScroll();
  }

  // ---------- PAYMENT INFO MODAL ----------
  showPaymentInfo(request: any): void {
    this.selectedRequest = request;
    this.showPaymentInfoModal = true;
    this.lockBodyScroll();
  }

  closePaymentInfo(): void {
    this.showPaymentInfoModal = false;
    this.selectedRequest = null;
    this.unlockBodyScroll();
  }

  // ---------- APPROVE / REJECT ----------
  approveRequest(request: any): void {
    if (!request?.driverRequestId || this.isUpdatingRequest(request.driverRequestId)) {
      return;
    }
    this.updateRequestStatus(request, 'Approved', 'Driver request approved successfully.');
  }

  rejectRequest(request: any): void {
    if (!request?.driverRequestId || this.isUpdatingRequest(request.driverRequestId)) {
      return;
    }
    this.updateRequestStatus(request, 'Rejected', 'Driver request rejected successfully.');
  }

  private updateRequestStatus(request: any, newStatus: string, successText: string): void {
    const previousStatus = request.status;
    this.updatingRequestId = request.driverRequestId;
    this.closeMessage();

    const updatedRequest = { ...request, status: newStatus };
    delete updatedRequest.driver;
    delete updatedRequest.user;

    this.driverRequestService.updateDriverRequest(request.driverRequestId, updatedRequest).subscribe({
      next: () => {
        request.status = newStatus;
        this.updatingRequestId = 0;
        this.showSuccessMessage(successText);
        this.loadRequests();
      },
      error: () => {
        request.status = previousStatus;
        this.updatingRequestId = 0;
        this.showErrorMessage(`Unable to change the request status to ${newStatus}. Please try again.`);
      }
    });
  }

  isUpdatingRequest(requestId: number): boolean {
    return this.updatingRequestId === requestId;
  }

  // ---------- STAGE MODAL ----------
  viewStage(request: any): void {
    this.selectedRequest = request;
    this.showStageModal = true;
    this.lockBodyScroll();
  }

  closeStageModal(): void {
    if (this.isClosingRequest) {
      return;
    }
    this.showStageModal = false;
    this.selectedRequest = null;
    this.unlockBodyScroll();
  }

  closeRequest(request: any): void {
    if (request.status !== 'Trip End' || this.isClosingRequest) {
      return;
    }

    this.isClosingRequest = true;
    this.closeMessage();

    const updatedRequest = { ...request, status: 'Closed' };
    delete updatedRequest.driver;
    delete updatedRequest.user;

    this.driverRequestService.updateDriverRequest(request.driverRequestId, updatedRequest).subscribe({
      next: () => {
        request.status = 'Closed';
        this.isClosingRequest = false;
        this.showStageModal = false;
        this.selectedRequest = null;
        this.unlockBodyScroll();
        this.showSuccessMessage('Driver request closed successfully.');
        this.loadRequests();
      },
      error: () => {
        this.isClosingRequest = false;
        this.showErrorMessage('Unable to close the request. Please try again.');
      }
    });
  }

  // ---------- STYLE HELPERS ----------
  getRequestCardClass(status: string): string {
    switch (status) {
      case 'Approved': return 'approved-request-card';
      case 'Rejected': return 'rejected-request-card';
      case 'Trip End': return 'trip-end-request-card';
      case 'Closed': return 'closed-request-card';
      case 'Pending':
      default: return 'pending-request-card';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Approved': return 'request-status-approved';
      case 'Rejected': return 'request-status-rejected';
      case 'Trip End': return 'request-status-trip-end';
      case 'Closed': return 'request-status-closed';
      case 'Pending':
      default: return 'request-status-pending';
    }
  }

  getProgressClass(status: string): string {
    switch (status) {
      case 'Approved': return 'progress-approved';
      case 'Rejected': return 'progress-rejected';
      case 'Trip End': return 'progress-trip-end';
      case 'Closed': return 'progress-closed';
      case 'Pending':
      default: return 'progress-pending';
    }
  }

  getProgressPercentage(status: string): number {
    switch (status) {
      case 'Approved': return 50;
      case 'Rejected': return 50;
      case 'Trip End': return 75;
      case 'Closed': return 100;
      case 'Pending':
      default: return 25;
    }
  }

  formatTripDate(tripDate: any): string {
    if (!tripDate) {
      return 'Not Available';
    }
    const parsedDate = new Date(tripDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return String(tripDate);
    }
    return parsedDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  private getRequestCountByStatus(status: string): number {
    return this.requests.filter((request) => request.status === status).length;
  }

  private getDateValue(dateValue: any): number {
    const parsedDate = new Date(dateValue);
    return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
  }

  showSuccessMessage(message: string): void {
    this.closeMessage();
    this.successMessage = message;
    this.messageTimeout = setTimeout(() => this.closeMessage(), 4500);
  }

  showErrorMessage(message: string): void {
    this.closeMessage();
    this.errorMessage = message;
    this.messageTimeout = setTimeout(() => this.closeMessage(), 6000);
  }

  closeMessage(): void {
    this.successMessage = '';
    this.errorMessage = '';
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
      this.messageTimeout = null;
    }
  }

  private lockBodyScroll(): void {
    document.body.style.overflow = 'hidden';
  }

  private unlockBodyScroll(): void {
    document.body.style.overflow = '';
  }
}