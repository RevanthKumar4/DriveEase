import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { DriverRequestService } from '../../services/driver-request.service';
import { ThemeService } from '../../services/theme.service';
import { ReceiptService } from '../../services/receipt.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-customerviewrequested',
  templateUrl: './customerviewrequested.component.html',
  styleUrls: ['./customerviewrequested.component.css']
})
export class CustomerviewrequestedComponent implements OnInit, OnDestroy {

  requests: any[] = [];
  searchText: string = '';
  selectedRequest: any = null;

  showDetailsModal: boolean = false;
  showPaymentModal: boolean = false;

  showSuccessModal: boolean = false;
  showFailureModal: boolean = false;
  paidAmount: number = 0;
  paidRequest: any = null;

  // ===== DELETE CONFIRMATION =====
  showDeleteModal: boolean = false;
  deleteTargetId: number | null = null;

  isDarkMode: boolean = true;
  isLoading: boolean = true;

  // ===== PAGINATION =====
  currentPage: number = 1;
  itemsPerPage: number = 4;

  paidRequestIds: Set<number> = new Set();
  reviewedRequestIds: Set<number> = new Set();

  // 🔑 Replace with YOUR Razorpay TEST key id
  private razorpayKey: string = 'rzp_test_TGdEC2BNe3IfTk';

  private themeSub?: Subscription;
  private requestsSub?: Subscription;
  private changeSub?: Subscription;
  private pollSub?: Subscription;

  constructor(
    private driverRequestService: DriverRequestService,
    private router: Router,
    private theme: ThemeService,
    private receiptService: ReceiptService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.themeSub = this.theme.isDarkMode$.subscribe(value => {
      this.isDarkMode = value;
    });

    this.restoreState();
    this.loadRequests();

    this.changeSub = this.driverRequestService.requestsChanged$.subscribe(() => {
      this.loadRequests(true);
    });

    this.pollSub = interval(8000).subscribe(() => {
      this.restoreState();
      this.loadRequests(true);
    });
  }

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();
    this.requestsSub?.unsubscribe();
    this.changeSub?.unsubscribe();
    this.pollSub?.unsubscribe();
  }

  // ---------- state ----------
  private restoreState(): void {
    const paid = localStorage.getItem('paidRequestIds');
    const reviewed = localStorage.getItem('reviewedRequestIds');
    if (paid) this.paidRequestIds = new Set(JSON.parse(paid));
    if (reviewed) this.reviewedRequestIds = new Set(JSON.parse(reviewed));
  }

  private saveState(): void {
    localStorage.setItem('paidRequestIds', JSON.stringify([...this.paidRequestIds]));
    localStorage.setItem('reviewedRequestIds', JSON.stringify([...this.reviewedRequestIds]));
  }

  private getId(request: any): number {
    return request?.driverRequestId || request?.requestId || request?.id;
  }

  isPaid(request: any): boolean {
    const id = this.getId(request);
    return this.paidRequestIds.has(id)
      || request?.status === 'Paid'
      || request?.status === 'Completed'
      || request?.status === 'Closed';
  }

  isReviewed(request: any): boolean {
    return this.reviewedRequestIds.has(this.getId(request));
  }

  // ---------- data ----------
  loadRequests(silent: boolean = false): void {
    if (!silent) {
      this.isLoading = true;
    }

    const userId = Number(localStorage.getItem('userId'));

    if (!userId) {
      if (!silent) {
        console.error('User ID not found in local storage.');
        this.requests = [];
        this.isLoading = false;
      }
      return;
    }

    this.requestsSub?.unsubscribe();

    this.requestsSub = this.driverRequestService
      .getDriverRequestsByUserId(userId)
      .subscribe({
        next: (response: any) => {
          if (Array.isArray(response)) {
            this.requests = response;
          } else if (response && Array.isArray(response.content)) {
            this.requests = response.content;
          } else if (response && Array.isArray(response.data)) {
            this.requests = response.data;
          } else {
            this.requests = [];
          }

          this.clampCurrentPage();
          this.isLoading = false;
        },
        error: (error) => {
          if (!silent) {
            console.error('Error loading requests:', error);
            this.requests = [];
            this.isLoading = false;
          }
        }
      });
  }

  filteredRequests(): any[] {
    const search = this.searchText.toLowerCase().trim();
    if (!search) {
      return this.requests;
    }
    return this.requests.filter(request => {
      const driverName = request?.driver?.driverName || request?.driverName || '';
      return driverName.toLowerCase().includes(search);
    });
  }

  // ---------- PAGINATION ----------
  get paginatedRequests(): any[] {
    const list = this.filteredRequests();
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return list.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredRequests().length / this.itemsPerPage) || 1;
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

  onSearchChange(): void {
    this.currentPage = 1;
  }

  private clampCurrentPage(): void {
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }

  // ---------- details ----------
  showMore(request: any): void {
    this.selectedRequest = request;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedRequest = null;
  }

  // ---------- edit / delete ----------
  editRequest(request: any): void {
    const requestId = this.getId(request);
    if (!requestId) {
      alert('Request ID not found. Cannot edit this request.');
      return;
    }
    const driverId = request?.driver?.driverId || request?.driverId;
    if (driverId) {
      localStorage.setItem('driverId', String(driverId));
    }
    localStorage.setItem('editRequest', JSON.stringify(request));
    this.router.navigate(['/customer/edit-request', requestId]);
  }

  // Open the confirmation popup instead of native confirm()
  askDelete(id: number): void {
    if (!id) {
      alert('Request ID not found.');
      return;
    }
    this.deleteTargetId = id;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.deleteTargetId = null;
  }

  confirmDelete(): void {
    const id = this.deleteTargetId;
    this.showDeleteModal = false;
    this.deleteTargetId = null;

    if (!id) {
      return;
    }

    this.driverRequestService.deleteDriverRequest(id).subscribe({
      next: () => {
        this.driverRequestService.notifyRequestsChanged();
        this.loadRequests(true);
      },
      error: (error) => {
        console.error('Error deleting request:', error);
        alert('Failed to delete request.');
      }
    });
  }

  // ---------- END TRIP ----------
  tripEnd(request: any): void {
    const requestId = this.getId(request);
    if (!requestId) {
      alert('Request ID not found.');
      return;
    }

    const now = new Date();
    const actualDropDate = now.toISOString().split('T')[0];
    const actualDropTime = now.toTimeString().split(' ')[0];
    const estimatedDuration = request?.estimatedDuration || '1 hour';
    const hourlyRate = Number(request?.driver?.hourlyRate) || Number(request?.hourlyRate) || 0;

    let durationInHours = 1;
    const durationMatch = String(estimatedDuration).match(/\d+(\.\d+)?/);
    if (durationMatch) {
      durationInHours = Number(durationMatch[0]);
    }

    const paymentAmount = hourlyRate * durationInHours;

    const updatedRequest: any = {
      ...request,
      status: 'Trip End',
      actualDropDate,
      actualDropTime,
      actualDuration: estimatedDuration,
      paymentAmount
    };
    delete updatedRequest.driver;
    delete updatedRequest.user;

    this.driverRequestService.updateDriverRequest(requestId, updatedRequest).subscribe({
      next: () => {
        request.status = 'Trip End';
        request.paymentAmount = paymentAmount;
        request.actualDropDate = actualDropDate;
        request.actualDropTime = actualDropTime;
        request.actualDuration = estimatedDuration;

        this.driverRequestService.notifyRequestsChanged();
        this.loadRequests(true);
      },
      error: (error) => {
        console.error('Error ending trip:', error);
        alert('Failed to end trip.');
      }
    });
  }

  // ---------- payment modal ----------
  fetchPayAmount(request: any): void {
    this.selectedRequest = request;
    this.showPaymentModal = true;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.selectedRequest = null;
  }

  // ---------- RAZORPAY ----------
  payNow(request: any): void {
    if (this.isPaid(request)) {
      return;
    }

    const amount = Number(request?.paymentAmount) || 0;
    if (amount <= 0) {
      alert('Invalid payment amount.');
      return;
    }

    if (!(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => this.openRazorpay(request, amount);
      script.onerror = () => this.onPaymentFailure();
      document.body.appendChild(script);
    } else {
      this.openRazorpay(request, amount);
    }
  }

  private openRazorpay(request: any, amount: number): void {
    const options: any = {
      key: this.razorpayKey,
      amount: amount * 100,
      currency: 'INR',
      name: 'DriveU',
      description: 'Trip Payment',
      handler: (response: any) => {
        this.onPaymentSuccess(request, response.razorpay_payment_id);
      },
      prefill: {
        name: localStorage.getItem('username') || ''
      },
      theme: { color: '#dc2626' },
      modal: {
        ondismiss: () => this.onPaymentFailure()
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on('payment.failed', () => this.onPaymentFailure());
    rzp.open();
  }

  private onPaymentSuccess(request: any, paymentId: string): void {
    const userId = Number(localStorage.getItem('userId'));
    const requestId = this.getId(request);

    this.paidRequestIds.add(requestId);
    this.saveState();
    request.status = 'Closed';
    request.paymentId = paymentId;

    const updatedRequest: any = {
      ...request,
      status: 'Closed',
      paymentId: paymentId
    };
    delete updatedRequest.driver;
    delete updatedRequest.user;

    this.driverRequestService.updateDriverRequest(requestId, updatedRequest).subscribe({
      next: () => {
        this.driverRequestService.notifyRequestsChanged();
        this.loadRequests(true);
      },
      error: (err) => console.error('Status update failed:', err)
    });

    const emailPayload = {
      userId: userId,
      paymentId: paymentId,
      amount: request?.paymentAmount || 0,
      driverName: request?.driver?.driverName || request?.driverName || 'Assigned Driver',
      pickupLocation: request?.pickupLocation || 'N/A',
      dropLocation: request?.dropLocation || 'N/A'
    };

    this.http.post(
      `${environment.apiURL}/api/payment/send-confirmation`,
      emailPayload,
      { responseType: 'text' }
    ).subscribe();

    this.paidAmount = request?.paymentAmount || 0;
    this.paidRequest = request;
    this.showPaymentModal = false;
    this.showSuccessModal = true;
  }

  private onPaymentFailure(): void {
    this.showPaymentModal = false;
    this.showFailureModal = true;
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
    this.paidRequest = null;
  }

  closeFailureModal(): void {
    this.showFailureModal = false;
  }

  // ---------- feedback ----------
  writeReview(request: any): void {
    const requestId = this.getId(request);
    const driverId = request?.driver?.driverId || request?.driverId;

    if (driverId) {
      localStorage.setItem('driverId', driverId.toString());
    }

    localStorage.setItem('reviewingRequestId', String(requestId));

    this.router.navigate(['/customer/submit-feedback']);
  }

  skipReview(): void {
    // Skip = feedback not required, do nothing
  }

  // ---------- receipt ----------
  downloadReceipt(request: any): void {
    this.receiptService.generateReceipt(request);
  }

  downloadReceiptFromSuccess(): void {
    if (this.paidRequest) {
      this.receiptService.generateReceipt(this.paidRequest);
    }
  }
}