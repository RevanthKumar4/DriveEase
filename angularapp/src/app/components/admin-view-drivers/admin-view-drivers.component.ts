import {
  Component,
  OnInit
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  Driver
} from 'src/app/models/driver.model';

import {
  DriverService
} from 'src/app/services/driver.service';

@Component({
  selector: 'app-admin-view-drivers',
  templateUrl: './admin-view-drivers.component.html',
  styleUrls: ['./admin-view-drivers.component.css']
})
export class AdminViewDriversComponent implements OnInit {

  drivers: Driver[] = [];
  filteredDrivers: Driver[] = [];

  searchText: string = '';
  selectedStatus: string = '';
  selectedSort: string = 'nameAsc';

  selectedDriverId: number = 0;

  showDeleteModal: boolean = false;
  deleteDriverId: number = 0;

  isLoading: boolean = false;
  isDeleting: boolean = false;

  successMessage: string = '';
  errorMessage: string = '';

  // ===== PAGINATION =====
  currentPage: number = 1;
  itemsPerPage: number = 6;

  constructor(
    private driverService: DriverService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDrivers();
  }

  get totalDrivers(): number {
    return this.drivers.length;
  }

  get availableDrivers(): number {
    return this.drivers.filter((driver) => {
      return driver.availabilityStatus === 'Available';
    }).length;
  }

  get busyDrivers(): number {
    return this.drivers.filter((driver) => {
      return driver.availabilityStatus === 'Busy';
    }).length;
  }

  get offlineDrivers(): number {
    return this.drivers.filter((driver) => {
      return driver.availabilityStatus === 'Offline';
    }).length;
  }

  loadDrivers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.driverService.getAllDrivers().subscribe({
      next: (data) => {
        this.drivers = (data || []).map((driver) => {
          return {
            ...driver,
            availabilityStatus:
              this.normalizeExistingStatus(
                driver.availabilityStatus
              )
          };
        });

        this.filterDrivers();
        this.isLoading = false;
      },

      error: (error) => {
        console.error(error);

        this.drivers = [];
        this.filteredDrivers = [];
        this.isLoading = false;

        this.errorMessage =
          'Unable to load drivers. Please refresh the page and try again.';
      }
    });
  }

  filterDrivers(): void {
    const normalizedSearch =
      this.searchText.trim().toLowerCase();

    let result = this.drivers.filter((driver) => {
      const driverName =
        String(driver.driverName || '').toLowerCase();

      const licenseNumber =
        String(driver.licenseNumber || '').toLowerCase();

      const contactNumber =
        String(driver.contactNumber || '').toLowerCase();

      const vehicleType =
        String(driver.vehicleType || '').toLowerCase();

      const matchesSearch =
        normalizedSearch === '' ||
        driverName.includes(normalizedSearch) ||
        licenseNumber.includes(normalizedSearch) ||
        contactNumber.includes(normalizedSearch) ||
        vehicleType.includes(normalizedSearch);

      const matchesStatus =
        this.selectedStatus === '' ||
        driver.availabilityStatus === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });

    result = this.sortDrivers(result);

    this.filteredDrivers = result;

    // Reset to first page whenever filters/search/sort change
    this.currentPage = 1;
  }

  private sortDrivers(drivers: Driver[]): Driver[] {
    const sortedDrivers = [...drivers];

    switch (this.selectedSort) {
      case 'nameDesc':
        return sortedDrivers.sort((first, second) => {
          return String(second.driverName || '').localeCompare(
            String(first.driverName || '')
          );
        });

      case 'rateLow':
        return sortedDrivers.sort((first, second) => {
          return Number(first.hourlyRate || 0) -
            Number(second.hourlyRate || 0);
        });

      case 'rateHigh':
        return sortedDrivers.sort((first, second) => {
          return Number(second.hourlyRate || 0) -
            Number(first.hourlyRate || 0);
        });

      case 'experienceHigh':
        return sortedDrivers.sort((first, second) => {
          return Number(second.experienceYears || 0) -
            Number(first.experienceYears || 0);
        });

      case 'nameAsc':
      default:
        return sortedDrivers.sort((first, second) => {
          return String(first.driverName || '').localeCompare(
            String(second.driverName || '')
          );
        });
    }
  }

  // ===== PAGINATION HELPERS =====
  get paginatedDrivers(): Driver[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredDrivers.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredDrivers.length / this.itemsPerPage) || 1;
  }

  get pagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.selectedDriverId = 0;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.selectedDriverId = 0;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.selectedDriverId = 0;
    }
  }

  clearSearch(): void {
    this.searchText = '';
    this.filterDrivers();
  }

  resetFilters(): void {
    this.searchText = '';
    this.selectedStatus = '';
    this.selectedSort = 'nameAsc';

    this.filterDrivers();
  }

  editDriver(driverId?: number): void {
    if (driverId) {
      this.router.navigate([
        '/admin/edit-driver',
        driverId
      ]);
    }
  }

  toggleDropdown(driverId?: number): void {
    if (!driverId) {
      return;
    }

    if (this.selectedDriverId === driverId) {
      this.selectedDriverId = 0;
    } else {
      this.selectedDriverId = driverId;
    }
  }

  updateStatus(
    driver: Driver,
    status: string
  ): void {
    if (!driver.driverId) {
      return;
    }

    this.closeMessage();

    const updatedDriver: Driver = {
      ...driver,
      availabilityStatus: status
    };

    this.driverService
      .updateDriver(
        driver.driverId,
        updatedDriver
      )
      .subscribe({
        next: () => {
          driver.availabilityStatus = status;
          this.selectedDriverId = 0;

          this.successMessage =
            `Driver status updated to ${status} successfully.`;

          this.filterDrivers();
          this.autoCloseMessage();
        },

        error: (error) => {
          console.error(error);

          this.errorMessage =
            'Unable to update the driver status. Please try again.';

          this.autoCloseMessage();
        }
      });
  }

  confirmDelete(driverId?: number): void {
    if (!driverId) {
      return;
    }

    this.deleteDriverId = driverId;
    this.showDeleteModal = true;
    this.selectedDriverId = 0;

    document.body.style.overflow = 'hidden';
  }

  deleteDriver(): void {
    if (!this.deleteDriverId || this.isDeleting) {
      return;
    }

    this.isDeleting = true;
    this.closeMessage();

    this.driverService
      .deleteDriver(this.deleteDriverId)
      .subscribe({
        next: () => {
          this.isDeleting = false;
          this.showDeleteModal = false;

          document.body.style.overflow = '';

          this.successMessage =
            'Driver deleted successfully.';

          this.loadDrivers();
          this.autoCloseMessage();
        },

        error: (error) => {
          console.error(error);

          this.isDeleting = false;
          this.showDeleteModal = false;

          document.body.style.overflow = '';

          if (error.status === 409) {
            this.errorMessage =
              'This driver cannot be deleted because active requests are linked to the driver.';
          } else {
            this.errorMessage =
              'Unable to delete the driver. Please try again.';
          }

          this.autoCloseMessage();
        }
      });
  }

  cancelDelete(): void {
    if (this.isDeleting) {
      return;
    }

    this.showDeleteModal = false;
    this.deleteDriverId = 0;

    document.body.style.overflow = '';
  }

  closeMessage(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  private autoCloseMessage(): void {
    setTimeout(() => {
      this.closeMessage();
    }, 4500);
  }

  private normalizeExistingStatus(
    status: string
  ): string {
    const normalizedStatus =
      String(status || '')
        .trim()
        .toLowerCase();

    if (
      normalizedStatus === 'active' ||
      normalizedStatus === 'available'
    ) {
      return 'Available';
    }

    if (
      normalizedStatus === 'on leave' ||
      normalizedStatus === 'busy'
    ) {
      return 'Busy';
    }

    if (
      normalizedStatus === 'inactive' ||
      normalizedStatus === 'offline'
    ) {
      return 'Offline';
    }

    return status || 'Offline';
  }
}