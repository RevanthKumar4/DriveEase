import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import * as L from 'leaflet';

import { DriverRequestService } from '../../services/driver-request.service';
import { DashboardStateService } from 'src/app/services/dashboard-state.service.ts.service';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-customer-request',
  templateUrl: './customer-request.component.html',
  styleUrls: ['./customer-request.component.css']
})
export class CustomerRequestComponent implements OnInit, OnDestroy {

  driverRequest: any = {
    tripDate: '',
    timeSlot: '',
    pickupLocation: '',
    dropLocation: '',
    estimatedDuration: '',
    comments: ''
  };

  isDarkMode: boolean = true;
  isSubmitting: boolean = false;

  showSuccessBox: boolean = false;
  successMessage: string = 'Request Submitted Successfully!';

  isEditMode: boolean = false;
  requestId: number | null = null;

  showPickupMap: boolean = false;
  showDropMap: boolean = false;

  pickupSuggestions: any[] = [];
  dropSuggestions: any[] = [];

  showDatePopup: boolean = false;
  showTimePopup: boolean = false;

  currentCalendarDate: Date = new Date();
  currentMonthLabel: string = '';
  weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  calendarDays: any[] = [];
  todayStr: string = '';

  // 12-hour clock picker
  hours12: string[] = ['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];
  minutes: string[] = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
  selectedHour12: string = '09';
  selectedMinute: string = '00';
  selectedPeriod: 'AM' | 'PM' = 'AM';

  displayDate: string = '';
  displayTime: string = '';

  // New validation + location rules
  currentLocationUsedBy: 'pickup' | 'drop' | null = null;
  locationError: string = '';
  durationError: string = '';

  private themeSub?: Subscription;
  private pickupMap: any = null;
  private dropMap: any = null;
  private pickupMarker: any = null;
  private dropMarker: any = null;
  private searchTimer: any = null;

  constructor(
    private driverRequestService: DriverRequestService,
    private router: Router,
    private route: ActivatedRoute,
    private dashboardState: DashboardStateService,
    private theme: ThemeService,
    private http: HttpClient,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.themeSub = this.theme.isDarkMode$.subscribe(value => {
      this.isDarkMode = value;
    });

    const now = new Date();
    this.todayStr = this.toDateString(now);

    this.buildCalendar();

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.isEditMode = true;
      this.requestId = Number(id);
      this.loadExistingRequest(this.requestId);
    }
  }

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();

    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    this.destroyPickupMap();
    this.destroyDropMap();
  }

  loadExistingRequest(id: number): void {
    this.driverRequestService.getDriverRequestById(id).subscribe({
      next: (data: any) => {
        this.driverRequest = {
          tripDate: this.formatDateForInput(data.tripDate),
          timeSlot: this.formatTimeForInput(data.timeSlot),
          pickupLocation: data.pickupLocation || '',
          dropLocation: data.dropLocation || '',
          estimatedDuration: data.estimatedDuration || '',
          comments: data.comments || ''
        };

        this.displayDate = this.formatDisplayDate(this.driverRequest.tripDate);
        this.displayTime = this.formatDisplayTime(this.driverRequest.timeSlot);

        if (this.driverRequest.tripDate) {
          this.currentCalendarDate = new Date(this.driverRequest.tripDate);
          this.buildCalendar();
        }

        if (this.driverRequest.timeSlot) {
          this.load12HourFrom24(this.driverRequest.timeSlot);
        }

        this.validateLocations();
        this.validateDuration();

        if (data.driver?.driverId) {
          localStorage.setItem('driverId', String(data.driver.driverId));
        }

        if (data.user?.userId) {
          localStorage.setItem('userId', String(data.user.userId));
        }
      },
      error: () => {
        alert('Unable to load previous request data.');
      }
    });
  }

  submitRequest(form: NgForm): void {
    if (form.invalid) {
      alert('All required fields must be filled out');
      return;
    }

    if (this.locationError) {
      alert(this.locationError);
      return;
    }

    // Re-run duration validation before submit as a final safety check
    this.validateDuration();
    if (this.durationError) {
      alert(this.durationError);
      return;
    }

    const storedUserId = localStorage.getItem('userId');
    const storedDriverId = localStorage.getItem('driverId');

    if (!storedUserId || !storedDriverId) {
      alert('Error: User ID or Driver ID is missing! Please log out and log back in.');
      return;
    }

    const requestPayload = {
      ...this.driverRequest,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      user: { userId: Number(storedUserId) },
      driver: { driverId: Number(storedDriverId) }
    };

    this.isSubmitting = true;

    if (this.isEditMode && this.requestId !== null) {
      this.driverRequestService.updateDriverRequest(this.requestId, requestPayload).subscribe({
        next: () => {
          this.isSubmitting = false;
          localStorage.removeItem('driverId');
          this.successMessage = 'Your driver request has been updated successfully!';
          this.showSuccessBox = true;
        },
        error: (error) => {
          this.isSubmitting = false;
          this.handleRequestError(error, 'update');
        }
      });

      return;
    }

    this.driverRequestService.addDriverRequest(requestPayload).subscribe({
      next: () => {
        this.isSubmitting = false;
        localStorage.removeItem('driverId');
        this.successMessage = 'Your driver request has been submitted successfully!';
        this.showSuccessBox = true;
      },
      error: (error) => {
        this.isSubmitting = false;
        this.handleRequestError(error, 'create');
      }
    });
  }

  /**
   * Centralised error handling that surfaces the real backend reason
   * and guides the user to resolve a 409 conflict.
   */
  private handleRequestError(error: any, mode: 'create' | 'update'): void {
    // Try to read the backend's actual message
    const backendMessage =
      typeof error?.error === 'string'
        ? error.error
        : (error?.error?.message || '');

    if (error?.status === 409) {
      const message =
        backendMessage ||
        'You already have an active booking, or this driver is no longer available. ' +
        'Please complete or cancel your current trip before booking another driver.';

      alert(message);

      // Send the user to My Requests so they can complete / cancel the active one
      this.router.navigate(['/customer/my-requests']);
      return;
    }

    if (error?.status === 401 || error?.status === 403) {
      alert('Your session has expired. Please log in again.');
      return;
    }

    if (error?.status === 400) {
      alert('Some details are invalid. Please review the form and try again.');
      return;
    }

    alert(
      mode === 'update'
        ? 'Something went wrong while updating request.'
        : 'Something went wrong. Please try again.'
    );
  }

  goBack(): void {
    if (this.isEditMode) {
      this.router.navigate(['/customer/my-requests']);
    } else {
      this.router.navigate(['/customer/available-drivers']);
    }
  }

  closeSuccessBox(): void {
    this.showSuccessBox = false;
    this.router.navigate(['/customer/my-requests']);
  }

  /* ================= DATE PICKER ================= */

  openDatePopup(): void {
    this.showDatePopup = true;

    if (this.driverRequest.tripDate) {
      this.currentCalendarDate = new Date(this.driverRequest.tripDate);
    } else {
      this.currentCalendarDate = new Date();
    }

    this.buildCalendar();
  }

  closeDatePopup(): void {
    this.showDatePopup = false;
  }

  buildCalendar(): void {
    const year = this.currentCalendarDate.getFullYear();
    const month = this.currentCalendarDate.getMonth();

    this.currentMonthLabel = this.currentCalendarDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });

    const firstDayOfMonth = new Date(year, month, 1);
    const calendarStartDate = new Date(firstDayOfMonth);
    calendarStartDate.setDate(calendarStartDate.getDate() - firstDayOfMonth.getDay());

    this.calendarDays = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(calendarStartDate);
      date.setDate(calendarStartDate.getDate() + i);

      const fullDate = this.toDateString(date);

      this.calendarDays.push({
        date: date.getDate(),
        fullDate: fullDate,
        currentMonth: date.getMonth() === month,
        disabled: fullDate < this.todayStr
      });
    }
  }

  previousMonth(): void {
    this.currentCalendarDate = new Date(
      this.currentCalendarDate.getFullYear(),
      this.currentCalendarDate.getMonth() - 1,
      1
    );
    this.buildCalendar();
  }

  nextMonth(): void {
    this.currentCalendarDate = new Date(
      this.currentCalendarDate.getFullYear(),
      this.currentCalendarDate.getMonth() + 1,
      1
    );
    this.buildCalendar();
  }

  selectDate(day: any): void {
    if (!day || !day.currentMonth || day.disabled) {
      return;
    }

    this.driverRequest.tripDate = day.fullDate;
    this.displayDate = this.formatDisplayDate(day.fullDate);
    this.closeDatePopup();
  }

  /* ================= TIME PICKER (12H + AM/PM) ================= */

  openTimePopup(): void {
    this.showTimePopup = true;

    if (this.driverRequest.timeSlot) {
      this.load12HourFrom24(this.driverRequest.timeSlot);
    }
  }

  closeTimePopup(): void {
    this.showTimePopup = false;
  }

  selectHour(hour: string): void {
    this.selectedHour12 = hour;
  }

  selectMinute(minute: string): void {
    this.selectedMinute = minute;
  }

  selectPeriod(period: 'AM' | 'PM'): void {
    this.selectedPeriod = period;
  }

  confirmTimeSelection(): void {
    let h = parseInt(this.selectedHour12, 10);

    if (this.selectedPeriod === 'PM' && h !== 12) {
      h += 12;
    }
    if (this.selectedPeriod === 'AM' && h === 12) {
      h = 0;
    }

    const hh = String(h).padStart(2, '0');
    this.driverRequest.timeSlot = `${hh}:${this.selectedMinute}`;
    this.displayTime = `${this.selectedHour12}:${this.selectedMinute} ${this.selectedPeriod}`;

    this.closeTimePopup();
  }

  private load12HourFrom24(time24: string): void {
    const parts = time24.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1] || '00';

    this.selectedPeriod = h >= 12 ? 'PM' : 'AM';

    let h12 = h % 12;
    if (h12 === 0) {
      h12 = 12;
    }

    this.selectedHour12 = String(h12).padStart(2, '0');
    this.selectedMinute = m;
  }

  /* ================= DURATION VALIDATION ================= */

  validateDuration(): void {
    const val = String(this.driverRequest.estimatedDuration || '').trim();

    if (!val) {
      this.durationError = '';
      return;
    }

    if (val.startsWith('-') || /-\s*\d/.test(val)) {
      this.durationError = 'Estimated duration cannot be negative.';
      return;
    }

    if (!/\d+/.test(val)) {
      this.durationError = 'Please enter a number (e.g. 3 Hours, 2 Days).';
      return;
    }

    if (!/(hours?|hrs?|days?|weeks?|minutes?|mins?)/i.test(val)) {
      this.durationError = 'Please include a valid unit (Hours, Days, Weeks, or Minutes).';
      return;
    }

    const numberMatch = val.match(/\d+(\.\d+)?/);
    if (numberMatch) {
      const num = parseFloat(numberMatch[0]);
      if (isNaN(num) || num <= 0) {
        this.durationError = 'Duration must be greater than 0.';
        return;
      }

      if (/minutes?|mins?/i.test(val) && num > 999) {
        this.durationError = 'Minutes value seems too large.';
        return;
      }
      if (/hours?|hrs?/i.test(val) && num > 720) {
        this.durationError = 'Hours cannot exceed 720 (30 days).';
        return;
      }
      if (/days?/i.test(val) && num > 60) {
        this.durationError = 'Days cannot exceed 60.';
        return;
      }
      if (/weeks?/i.test(val) && num > 12) {
        this.durationError = 'Weeks cannot exceed 12.';
        return;
      }
    }

    if (!/^[a-zA-Z0-9\s.]+$/.test(val)) {
      this.durationError = 'Only numbers, letters and spaces are allowed.';
      return;
    }

    this.durationError = '';
  }

  /* ================= LOCATION VALIDATION ================= */

  validateLocations(): void {
    const p = String(this.driverRequest.pickupLocation || '').trim().toLowerCase();
    const d = String(this.driverRequest.dropLocation || '').trim().toLowerCase();

    if (p && d && p === d) {
      this.locationError = 'Pickup and Drop location cannot be the same.';
    } else {
      this.locationError = '';
    }
  }

  /* ================= MAP POPUP ================= */

  openPickupMap(): void {
    this.showPickupMap = true;
    this.showDropMap = false;
    this.dropSuggestions = [];
    this.destroyDropMap();
    setTimeout(() => this.initPickupMap(), 250);
  }

  openDropMap(): void {
    this.showDropMap = true;
    this.showPickupMap = false;
    this.pickupSuggestions = [];
    this.destroyPickupMap();
    setTimeout(() => this.initDropMap(), 250);
  }

  closePickupMap(): void {
    this.showPickupMap = false;
    this.pickupSuggestions = [];
    this.destroyPickupMap();
  }

  closeDropMap(): void {
    this.showDropMap = false;
    this.dropSuggestions = [];
    this.destroyDropMap();
  }

  private initPickupMap(): void {
    const el = document.getElementById('pickupMap');
    if (!el || this.pickupMap) {
      if (this.pickupMap) {
        setTimeout(() => this.pickupMap.invalidateSize(), 200);
      }
      return;
    }

    this.pickupMap = L.map('pickupMap', { center: [20.5937, 78.9629], zoom: 5, zoomControl: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.pickupMap);

    setTimeout(() => { if (this.pickupMap) this.pickupMap.invalidateSize(); }, 500);

    this.pickupMap.on('click', (event: any) => {
      this.setLocationFromMap('pickup', event.latlng.lat, event.latlng.lng);
    });
  }

  private initDropMap(): void {
    const el = document.getElementById('dropMap');
    if (!el || this.dropMap) {
      if (this.dropMap) {
        setTimeout(() => this.dropMap.invalidateSize(), 200);
      }
      return;
    }

    this.dropMap = L.map('dropMap', { center: [20.5937, 78.9629], zoom: 5, zoomControl: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.dropMap);

    setTimeout(() => { if (this.dropMap) this.dropMap.invalidateSize(); }, 500);

    this.dropMap.on('click', (event: any) => {
      this.setLocationFromMap('drop', event.latlng.lat, event.latlng.lng);
    });
  }

  private setLocationFromMap(type: 'pickup' | 'drop', lat: number, lng: number): void {
    const temp = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    if (type === 'pickup') {
      this.driverRequest.pickupLocation = temp;
      if (this.pickupMarker) {
        this.pickupMarker.setLatLng([lat, lng]);
      } else if (this.pickupMap) {
        this.pickupMarker = L.circleMarker([lat, lng], {
          radius: 8, color: '#10b981', fillColor: '#10b981', fillOpacity: 0.9
        }).addTo(this.pickupMap);
      }
      this.reverseGeocode('pickup', lat, lng, true);
    } else {
      this.driverRequest.dropLocation = temp;
      if (this.dropMarker) {
        this.dropMarker.setLatLng([lat, lng]);
      } else if (this.dropMap) {
        this.dropMarker = L.circleMarker([lat, lng], {
          radius: 8, color: '#c95812', fillColor: '#c95812', fillOpacity: 0.9
        }).addTo(this.dropMap);
      }
      this.reverseGeocode('drop', lat, lng, true);
    }

    this.validateLocations();
  }

  searchLocation(type: 'pickup' | 'drop'): void {
    this.validateLocations();

    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    this.searchTimer = setTimeout(() => {
      const query = type === 'pickup'
        ? this.driverRequest.pickupLocation
        : this.driverRequest.dropLocation;

      if (!query || query.trim().length < 3) {
        if (type === 'pickup') this.pickupSuggestions = [];
        else this.dropSuggestions = [];
        return;
      }

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`;

      this.http.get<any[]>(url).subscribe({
        next: (data) => {
          if (type === 'pickup') this.pickupSuggestions = data || [];
          else this.dropSuggestions = data || [];
        },
        error: () => {
          if (type === 'pickup') this.pickupSuggestions = [];
          else this.dropSuggestions = [];
        }
      });
    }, 400);
  }

  selectLocation(type: 'pickup' | 'drop', location: any): void {
    const address = location.display_name;
    const lat = Number(location.lat);
    const lng = Number(location.lon);

    if (type === 'pickup') {
      this.driverRequest.pickupLocation = address;
      this.pickupSuggestions = [];
      if (this.pickupMap) {
        this.pickupMap.setView([lat, lng], 15);
        if (this.pickupMarker) this.pickupMarker.setLatLng([lat, lng]);
        else this.pickupMarker = L.circleMarker([lat, lng], { radius: 8, color: '#10b981', fillColor: '#10b981', fillOpacity: 0.9 }).addTo(this.pickupMap);
        this.pickupMap.invalidateSize();
      }
      this.validateLocations();
      setTimeout(() => this.closePickupMap(), 250);
    } else {
      this.driverRequest.dropLocation = address;
      this.dropSuggestions = [];
      if (this.dropMap) {
        this.dropMap.setView([lat, lng], 15);
        if (this.dropMarker) this.dropMarker.setLatLng([lat, lng]);
        else this.dropMarker = L.circleMarker([lat, lng], { radius: 8, color: '#c95812', fillColor: '#c95812', fillOpacity: 0.9 }).addTo(this.dropMap);
        this.dropMap.invalidateSize();
      }
      this.validateLocations();
      setTimeout(() => this.closeDropMap(), 250);
    }
  }

  private reverseGeocode(type: 'pickup' | 'drop', lat: number, lng: number, closeAfter = false): void {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

    this.http.get<any>(url).subscribe({
      next: (data) => {
        const address = data?.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

        if (type === 'pickup') {
          this.driverRequest.pickupLocation = address;
          if (closeAfter) setTimeout(() => this.closePickupMap(), 300);
        } else {
          this.driverRequest.dropLocation = address;
          if (closeAfter) setTimeout(() => this.closeDropMap(), 300);
        }

        this.validateLocations();
      },
      error: () => {
        if (type === 'pickup' && closeAfter) this.closePickupMap();
        if (type === 'drop' && closeAfter) this.closeDropMap();
      }
    });
  }

  useCurrentLocation(type: 'pickup' | 'drop'): void {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (type === 'pickup') {
          if (this.pickupMap) { this.pickupMap.setView([lat, lng], 15); this.pickupMap.invalidateSize(); }
          this.setLocationFromMap('pickup', lat, lng);
        } else {
          if (this.dropMap) { this.dropMap.setView([lat, lng], 15); this.dropMap.invalidateSize(); }
          this.setLocationFromMap('drop', lat, lng);
        }

        this.currentLocationUsedBy = type;
      },
      () => {
        alert('Unable to fetch current location.');
      }
    );
  }

  private destroyPickupMap(): void {
    if (this.pickupMap) {
      this.pickupMap.remove();
      this.pickupMap = null;
      this.pickupMarker = null;
    }
  }

  private destroyDropMap(): void {
    if (this.dropMap) {
      this.dropMap.remove();
      this.dropMap = null;
      this.dropMarker = null;
    }
  }

  /* ================= HELPERS ================= */

  private toDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private formatDisplayDate(value: string): string {
    if (!value) return '';
    const parts = value.split('-');
    if (parts.length !== 3) return value;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  private formatDisplayTime(time24: string): string {
    if (!time24) return '';
    const parts = time24.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1] || '00';
    const period = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return `${String(h12).padStart(2, '0')}:${m} ${period}`;
  }

  private formatDateForInput(dateValue: any): string {
    if (!dateValue) return '';
    return String(dateValue).split('T')[0];
  }

  private formatTimeForInput(timeValue: any): string {
    if (!timeValue) return '';
    return String(timeValue).substring(0, 5);
  }
}