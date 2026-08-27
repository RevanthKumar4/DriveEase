import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { DashboardStateService } from 'src/app/services/dashboard-state.service.ts.service';
import { ThemeService } from 'src/app/services/theme.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit, OnDestroy {

  currentRotation = 0;
  activeView = 'home';
  isMapExpanded = false;

  greetingMessage = '';

  shortArea = '';
  shortCity = '';

  isDarkMode = true;
  locationAllowed = false;

  currentArea = 'Detecting...';
  currentCity = 'Please allow location access';

  latitude: number | null = null;
  longitude: number | null = null;

  currentTime = '';
  currentSeconds = '';
  currentPeriod = '';
  currentDate = '';

  private clockInterval: ReturnType<typeof setInterval> | null = null;
  private backButtonReady = false;

  mapUrl: SafeResourceUrl;
  backgroundMapUrl: SafeResourceUrl;

  constructor(
    private dashboardState: DashboardStateService,
    private sanitizer: DomSanitizer,
    private http: HttpClient,
    private theme: ThemeService,
    private authService: AuthService
  ) {
    const defaultLat = 20.2961;
    const defaultLon = 85.8245;

    this.mapUrl = this.buildMapUrl(
      defaultLat,
      defaultLon,
      15
    );

    this.backgroundMapUrl = this.buildMapUrl(
      defaultLat,
      defaultLon,
      12
    );
  }

  /*
   * Fires on browser BACK press. Ignored during initial load
   * (backButtonReady is false) so home renders normally.
   * On a genuine back press: logout + full replace to /login
   * (no forward-button flash).
   */
  @HostListener('window:popstate')
  onBrowserBack(): void {
    if (!this.backButtonReady) {
      return;
    }

    this.authService.logout().subscribe({
      next: () => window.location.replace('/login'),
      error: () => window.location.replace('/login')
    });
  }

  ngOnInit(): void {

    this.dashboardState.currentRotation$.subscribe(
      (rotation) => {
        this.currentRotation = rotation;
      }
    );

    this.dashboardState.activeView$.subscribe(
      (view) => {
        this.activeView = view;
      }
    );

    this.theme.isDarkMode$.subscribe(
      (isDarkMode) => {
        this.isDarkMode = isDarkMode;
      }
    );

    this.setGreeting();
    this.getLiveLocation();
    this.updateClock();

    this.clockInterval = setInterval(
      () => this.updateClock(),
      1000
    );

    // Arm the back-button trap AFTER the page has settled, so we
    // don't catch Angular's own navigation popstate during entry.
    setTimeout(() => {
      history.pushState(null, '', location.href);
      this.backButtonReady = true;
    }, 300);
  }

  ngOnDestroy(): void {
    if (this.clockInterval !== null) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }
  }

  private buildMapUrl(
    lat: number,
    lon: number,
    zoom: number
  ): SafeResourceUrl {
  
    const url =
      `https://www.openstreetmap.org/export/embed.html?bbox=${
        lon - 0.01
      },${
        lat - 0.01
      },${
        lon + 0.01
      },${
        lat + 0.01
      }&layer=mapnik&marker=${lat},${lon}`;
  
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  updateClock(): void {

    const now = new Date();

    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    this.currentPeriod = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;

    if (hours === 0) {
      hours = 12;
    }

    this.currentTime =
      `${String(hours).padStart(2, '0')}:` +
      `${String(minutes).padStart(2, '0')}`;

    this.currentSeconds = String(seconds).padStart(2, '0');

    const days = [
      'SUN',
      'MON',
      'TUE',
      'WED',
      'THU',
      'FRI',
      'SAT'
    ];

    const months = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC'
    ];

    this.currentDate =
      `${days[now.getDay()]} • ` +
      `${String(now.getDate()).padStart(2, '0')} ` +
      `${months[now.getMonth()]} ` +
      `${now.getFullYear()}`;
  }

  setGreeting(): void {

    const hour = new Date().getHours();

    if (hour < 12) {
      this.greetingMessage = 'Good Morning';
    } else if (hour < 18) {
      this.greetingMessage = 'Good Afternoon';
    } else {
      this.greetingMessage = 'Good Evening';
    }
  }

  getLiveLocation(): void {

    if (!navigator.geolocation) {
      this.locationAllowed = false;

      this.currentArea = 'Location not supported';
      this.currentCity = 'Browser does not support Geolocation';

      this.shortArea = 'Location unavailable';
      this.shortCity = 'Geolocation not supported';

      return;
    }

    navigator.geolocation.getCurrentPosition(

      (position: GeolocationPosition) => {

        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;

        this.locationAllowed = true;

        this.mapUrl = this.buildMapUrl(
          this.latitude,
          this.longitude,
          15
        );

        this.backgroundMapUrl = this.buildMapUrl(
          this.latitude,
          this.longitude,
          12
        );

        this.reverseGeocode(
          this.latitude,
          this.longitude
        );
      },

      () => {

        this.locationAllowed = false;

        this.currentArea = 'Location denied';
        this.currentCity = 'Enable location in browser';

        this.shortArea = 'Location denied';
        this.shortCity = 'Enable browser location';
      },

      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    );
  }

  reverseGeocode(
    lat: number,
    lon: number
  ): void {
  
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  
    this.http.get<any>(
      url,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    ).subscribe({
  
      next: (response) => {
  
        const address = response?.address || {};
  
        this.currentArea =
          address.road ||
          address.suburb ||
          address.neighbourhood ||
          address.village ||
          address.town ||
          'Your Location';
  
        const cityName =
          address.city ||
          address.town ||
          address.village ||
          '';
  
        this.currentCity =
          `${cityName}${address.state ? ', ' + address.state : ''}`.trim() ||
          'Live Location';
  
        this.shortArea = this.truncate(
          this.currentArea,
          18
        );
  
        this.shortCity = this.truncate(
          address.city ||
          address.town ||
          address.village ||
          address.state ||
          'Live',
          20
        );
      },
  
      error: (error) => {
  
        console.error('Reverse geocoding failed:', error);
  
        this.currentArea = 'Live Location';
  
        this.currentCity =
          `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  
        this.shortArea = 'Live Location';
  
        this.shortCity =
          `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
      }
    });
  }

  private truncate(
    text: string,
    max: number
  ): string {

    if (!text) {
      return '';
    }

    return text.length > max
      ? text.slice(0, max - 1) + '…'
      : text;
  }

  openMap(): void {
    this.isMapExpanded = true;
  }

  closeMap(): void {
    this.isMapExpanded = false;
  }
}