import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';

import { DriverService } from '../../services/driver.service';
import { DriverRequestService } from '../../services/driver-request.service';
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'app-customerviewdriver',
  templateUrl: './customerviewdriver.component.html',
  styleUrls: ['./customerviewdriver.component.css']
})
export class CustomerviewdriverComponent implements OnInit, OnDestroy {

  drivers: any[] = [];
  filteredDriversList: any[] = [];

  searchText: string = '';

  selectedDriver: any = null;
  showModal: boolean = false;

  showLicenseModal: boolean = false;
  selectedLicenseImage: string = '';

  currentPage: number = 1;
  itemsPerPage: number = 6;

  isDarkMode: boolean = true;
  isLoading: boolean = true;

  // Custom alert popup state
  showAlertBox: boolean = false;
  alertTitle: string = '';
  alertMessage: string = '';
  alertType: 'info' | 'warning' | 'error' | 'success' = 'info';

  private themeSub?: Subscription;
  private changeSub?: Subscription;
  private pollSub?: Subscription;

  constructor(
    private driverService: DriverService,
    private driverRequestService: DriverRequestService,
    private router: Router,
    private theme: ThemeService
  ) { }

  ngOnInit(): void {
    this.themeSub = this.theme.isDarkMode$.subscribe(value => {
      this.isDarkMode = value;
    });

    this.loadDrivers();

    this.changeSub = this.driverService.driversChanged$.subscribe(() => {
      this.loadDrivers(true);
    });

    this.pollSub = interval(10000).subscribe(() => {
      this.loadDrivers(true);
    });
  }

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();
    this.changeSub?.unsubscribe();
    this.pollSub?.unsubscribe();
  }

  loadDrivers(silent: boolean = false): void {
    if (!silent) {
      this.isLoading = true;
    }

    this.driverService.getAllDrivers().subscribe({
      next: (data: any[]) => {
        this.drivers = data || [];

        if (!silent) {
          this.currentPage = 1;
        }

        this.applyDriverFilters();
        this.isLoading = false;
      },
      error: () => {
        if (!silent) {
          this.drivers = [];
          this.filteredDriversList = [];
          this.currentPage = 1;
          this.isLoading = false;
        }
      }
    });
  }

  private applyDriverFilters(): void {
    const searchValue = String(this.searchText || '')
      .trim()
      .toLowerCase();

    this.filteredDriversList = this.drivers.filter(driver => {
      const isNotDeleted =
        !driver?.deleted &&
        !driver?.isDeleted;

      const isAvailable =
        this.isActiveDriver(driver);

      const driverName =
        driver?.driverName ||
        driver?.driver_name ||
        '';

      const matchesSearch =
        !searchValue ||
        String(driverName)
          .toLowerCase()
          .includes(searchValue);

      return isNotDeleted && isAvailable && matchesSearch;
    });

    this.fixCurrentPage();
  }

  private isActiveDriver(driver: any): boolean {
    const status = String(
      driver?.availabilityStatus ||
      driver?.availability_status ||
      ''
    )
      .trim()
      .toLowerCase();

    return status === 'active' || status === 'available';
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyDriverFilters();
  }

  get totalPages(): number {
    return Math.ceil(
      this.filteredDriversList.length / this.itemsPerPage
    );
  }

  get pagesArray(): number[] {
    return Array.from(
      { length: this.totalPages },
      (_, index) => index + 1
    );
  }

  get paginatedDrivers(): any[] {
    const startIndex =
      (this.currentPage - 1) * this.itemsPerPage;

    const endIndex =
      startIndex + this.itemsPerPage;

    return this.filteredDriversList.slice(
      startIndex,
      endIndex
    );
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

  private fixCurrentPage(): void {
    if (this.totalPages === 0) {
      this.currentPage = 1;
      return;
    }

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
  }

  viewDriverDetails(driver: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (!this.isActiveDriver(driver)) {
      this.loadDrivers();
      return;
    }

    this.selectedDriver = driver;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedDriver = null;
  }

  viewLicense(image: string | undefined, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    this.selectedLicenseImage = image || '';
    this.showLicenseModal = true;
  }

  closeLicenseModal(): void {
    this.showLicenseModal = false;
    this.selectedLicenseImage = '';
  }

  requestDriver(driver: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const driverId =
      driver?.driverId ||
      driver?.driver_id;

    if (!driver || !driverId) {
      this.openAlert('Driver Not Found', 'The selected driver could not be found.', 'error');
      return;
    }

    if (!this.isActiveDriver(driver)) {
      this.openAlert(
        'Driver Unavailable',
        'This driver is no longer available. The available-driver list will now be refreshed.',
        'warning'
      );

      this.closeModal();
      this.loadDrivers();
      return;
    }

    const userId = Number(localStorage.getItem('userId'));

    if (!userId || userId === 0) {
      this.openAlert('Login Required', 'User not found. Please login again.', 'error');
      return;
    }

    this.driverRequestService
      .getDriverRequestsByUserId(userId)
      .subscribe({
        next: (requests: any[]) => {
          const hasActiveRequest =
            (requests || []).some(request =>
              this.isActiveRequest(request)
            );

          if (hasActiveRequest) {
            this.openAlert(
              'Active Booking Exists',
              'You already have an active booking. Please complete or cancel it before booking another driver.',
              'warning'
            );
            return;
          }

          this.continueToRequestForm(driver);
        },
        error: () => {
          this.continueToRequestForm(driver);
        }
      });
  }

  private isActiveRequest(request: any): boolean {
    const status = String(request?.status || '')
      .trim()
      .toLowerCase();

    if (!status) {
      return true;
    }

    return status !== 'trip end' &&
      status !== 'closed' &&
      status !== 'cancelled' &&
      status !== 'canceled';
  }

  private continueToRequestForm(driver: any): void {
    const driverId =
      driver?.driverId ||
      driver?.driver_id;

    localStorage.setItem('driverId', String(driverId));

    this.showModal = false;

    this.router.navigate([
      '/customer/request',
      driverId
    ]);
  }

  /* ================= CUSTOM ALERT ================= */

  openAlert(
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'success' = 'info'
  ): void {
    this.alertTitle = title;
    this.alertMessage = message;
    this.alertType = type;
    this.showAlertBox = true;
  }

  closeAlert(): void {
    this.showAlertBox = false;
    this.alertTitle = '';
    this.alertMessage = '';
  }
}