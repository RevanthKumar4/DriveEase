import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';     

import { DriverService } from 'src/app/services/driver.service';
import { DriverRequestService } from 'src/app/services/driver-request.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { AuthService } from 'src/app/services/auth.service';

interface WeeklyActivity {
  day: string;
  requests: number;
  completed: number;
}

interface ServicePerformance {
  name: string;
  description: string;
  value: number;
  colorClass: string;
}

@Component({
  selector: 'app-admin-home',
  templateUrl: './admin-home.component.html',
  styleUrls: ['./admin-home.component.css']
})
export class AdminHomeComponent implements OnInit, OnDestroy {

  currentDate: string = '';
  currentTime: string = '';

  /*
   * Dashboard loading state
   */
  isLoading: boolean = false;

  /*
   * Dynamic driver values
   */
  totalDrivers: number = 0;
  availableDrivers: number = 0;
  busyDrivers: number = 0;
  offlineDrivers: number = 0;

  /*
   * Dynamic request and feedback values
   */
  pendingRequests: number = 0;
  totalFeedback: number = 0;
  averageRating: number = 0;

  /*
   * Dynamic progress values
   */
  driverProgress: number = 0;
  availableProgress: number = 0;
  requestProgress: number = 0;
  feedbackProgress: number = 0;

  /*
   * Dynamic weekly values
   */
  weeklyTotal: number = 0;
  weeklyGrowth: number = 0;

  /*
   * Dashboard data storage
   */
  private allDrivers: any[] = [];
  private allRequests: any[] = [];
  private allFeedbacks: any[] = [];

  private timeInterval: ReturnType<typeof setInterval> | null = null;
  private backButtonReady = false;

  weeklyActivity: WeeklyActivity[] = [
    {
      day: 'MON',
      requests: 0,
      completed: 0
    },
    {
      day: 'TUE',
      requests: 0,
      completed: 0
    },
    {
      day: 'WED',
      requests: 0,
      completed: 0
    },
    {
      day: 'THU',
      requests: 0,
      completed: 0
    },
    {
      day: 'FRI',
      requests: 0,
      completed: 0
    },
    {
      day: 'SAT',
      requests: 0,
      completed: 0
    },
    {
      day: 'SUN',
      requests: 0,
      completed: 0
    }
  ];

  servicePerformance: ServicePerformance[] = [
    {
      name: 'Driver Response',
      description: 'Driver request acceptance performance',
      value: 0,
      colorClass: 'performance-primary'
    },
    {
      name: 'Trip Completion',
      description: 'Successfully completed customer trips',
      value: 0,
      colorClass: 'performance-success'
    },
    {
      name: 'Customer Satisfaction',
      description: 'Positive customer feedback score',
      value: 0,
      colorClass: 'performance-info'
    },
    {
      name: 'Request Processing',
      description: 'Administrator request response rate',
      value: 0,
      colorClass: 'performance-warning'
    }
  ];

  constructor(
    private driverService: DriverService,
    private driverRequestService: DriverRequestService,
    private feedbackService: FeedbackService,
    private authService: AuthService
  ) {}

  /*
   * Fires on browser BACK press. Ignored during initial load
   * (backButtonReady is false) so the dashboard renders normally.
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
    this.updateDateAndTime();
    this.loadDashboardData();

    this.timeInterval = setInterval(() => {
      this.updateDateAndTime();
    }, 1000);

    // Arm the back-button trap AFTER the page has settled, so we
    // don't catch Angular's own navigation popstate during entry.
    setTimeout(() => {
      history.pushState(null, '', location.href);
      this.backButtonReady = true;
    }, 300);
  }

  ngOnDestroy(): void {
    if (this.timeInterval !== null) {
      clearInterval(this.timeInterval);
      this.timeInterval = null;
    }
  }

  /*
   * Loads drivers, requests and feedback at the same time.
   * If one API fails, the remaining dashboard data still loads.
   */
  loadDashboardData(): void {
    this.isLoading = true;

    forkJoin({
      drivers: this.driverService.getAllDrivers().pipe(
        catchError((error) => {
          console.error('Failed to load drivers:', error);
          return of([]);
        })
      ),

      requests: this.driverRequestService.getAllDriverRequests().pipe(
        catchError((error) => {
          console.error('Failed to load driver requests:', error);
          return of([]);
        })
      ),

      feedbacks: this.feedbackService.getFeedbacks().pipe(
        catchError((error) => {
          console.error('Failed to load feedbacks:', error);
          return of([]);
        })
      )
    }).subscribe({
      next: (response) => {
        this.allDrivers = response.drivers || [];
        this.allRequests = response.requests || [];
        this.allFeedbacks = response.feedbacks || [];

        this.calculateDriverStatistics();
        this.calculateRequestStatistics();
        this.calculateFeedbackStatistics();
        this.calculateWeeklyActivity();
        this.calculateServicePerformance();

        this.isLoading = false;
      },

      error: (error) => {
        console.error('Dashboard loading error:', error);
        this.isLoading = false;
      }
    });
  }

  /*
   * Calculates total, available, busy and offline drivers.
   */
  private calculateDriverStatistics(): void {
    this.totalDrivers = this.allDrivers.length;

    this.availableDrivers = this.allDrivers.filter((driver) => {
      return this.normalizeStatus(driver.availabilityStatus) === 'available';
    }).length;

    this.busyDrivers = this.allDrivers.filter((driver) => {
      return this.normalizeStatus(driver.availabilityStatus) === 'busy';
    }).length;

    this.offlineDrivers = this.allDrivers.filter((driver) => {
      return this.normalizeStatus(driver.availabilityStatus) === 'offline';
    }).length;

    this.availableProgress = this.calculatePercentage(
      this.availableDrivers,
      this.totalDrivers
    );

    /*
     * Driver registration progress uses the current registered total.
     * The value reaches 100% when all registered records are counted.
     */
    this.driverProgress = this.totalDrivers > 0 ? 100 : 0;
  }

  /*
   * Calculates pending requests and request progress.
   */
  private calculateRequestStatistics(): void {
    const totalRequests = this.allRequests.length;

    this.pendingRequests = this.allRequests.filter((request) => {
      return this.normalizeStatus(request.status) === 'pending';
    }).length;

    const processedRequests = this.allRequests.filter((request) => {
      const status = this.normalizeStatus(request.status);

      return status !== '' && status !== 'pending';
    }).length;

    this.requestProgress = this.calculatePercentage(
      processedRequests,
      totalRequests
    );
  }

  /*
   * Calculates feedback count, average rating and rating percentage.
   */
  private calculateFeedbackStatistics(): void {
    this.totalFeedback = this.allFeedbacks.length;

    const validRatings = this.allFeedbacks
      .map((feedback) => Number(feedback.rating))
      .filter((rating) => {
        return Number.isFinite(rating) && rating >= 0;
      });

    if (validRatings.length === 0) {
      this.averageRating = 0;
      this.feedbackProgress = 0;
      return;
    }

    const ratingTotal = validRatings.reduce((sum, rating) => {
      return sum + rating;
    }, 0);

    this.averageRating = Number(
      (ratingTotal / validRatings.length).toFixed(1)
    );

    this.feedbackProgress = Math.round(
      (this.averageRating / 5) * 100
    );

    this.feedbackProgress = this.limitPercentage(
      this.feedbackProgress
    );
  }

  /*
   * Builds the Monday to Sunday chart from request dates.
   */
  private calculateWeeklyActivity(): void {
    const currentWeekStart = this.getStartOfWeek(new Date());
    const nextWeekStart = new Date(currentWeekStart);

    nextWeekStart.setDate(nextWeekStart.getDate() + 7);

    const previousWeekStart = new Date(currentWeekStart);

    previousWeekStart.setDate(previousWeekStart.getDate() - 7);

    const requestCounts: number[] = new Array(7).fill(0);
    const completedCounts: number[] = new Array(7).fill(0);

    let currentWeekTotal = 0;
    let previousWeekTotal = 0;

    this.allRequests.forEach((request) => {
      const requestDate = this.getRequestDate(request);

      if (!requestDate) {
        return;
      }

      if (
        requestDate >= currentWeekStart &&
        requestDate < nextWeekStart
      ) {
        const dayIndex = this.getMondayBasedDayIndex(requestDate);

        requestCounts[dayIndex] = requestCounts[dayIndex] + 1;
        currentWeekTotal = currentWeekTotal + 1;

        if (this.isCompletedStatus(request.status)) {
          completedCounts[dayIndex] =
            completedCounts[dayIndex] + 1;
        }
      }

      if (
        requestDate >= previousWeekStart &&
        requestDate < currentWeekStart
      ) {
        previousWeekTotal = previousWeekTotal + 1;
      }
    });

    this.weeklyTotal = currentWeekTotal;

    this.weeklyGrowth = this.calculateGrowthPercentage(
      currentWeekTotal,
      previousWeekTotal
    );

    const maximumCount = Math.max(
      ...requestCounts,
      ...completedCounts,
      1
    );

    const days = [
      'MON',
      'TUE',
      'WED',
      'THU',
      'FRI',
      'SAT',
      'SUN'
    ];

    this.weeklyActivity = days.map((day, index) => {
      return {
        day: day,

        requests: this.convertChartValueToPercentage(
          requestCounts[index],
          maximumCount
        ),

        completed: this.convertChartValueToPercentage(
          completedCounts[index],
          maximumCount
        )
      };
    });
  }

  /*
   * Calculates all moving service-performance bars.
   */
  private calculateServicePerformance(): void {
    const totalRequests = this.allRequests.length;

    const respondedRequests = this.allRequests.filter((request) => {
      const status = this.normalizeStatus(request.status);

      return status === 'approved' ||
        status === 'rejected' ||
        status === 'trip end' ||
        status === 'closed';
    }).length;

    const completedRequests = this.allRequests.filter((request) => {
      return this.isCompletedStatus(request.status);
    }).length;

    const processedRequests = this.allRequests.filter((request) => {
      const status = this.normalizeStatus(request.status);

      return status !== '' && status !== 'pending';
    }).length;

    const driverResponseValue = this.calculatePercentage(
      respondedRequests,
      totalRequests
    );

    const tripCompletionValue = this.calculatePercentage(
      completedRequests,
      totalRequests
    );

    const customerSatisfactionValue = this.feedbackProgress;

    const requestProcessingValue = this.calculatePercentage(
      processedRequests,
      totalRequests
    );

    this.servicePerformance = [
      {
        name: 'Driver Response',
        description: 'Driver request acceptance performance',
        value: driverResponseValue,
        colorClass: 'performance-primary'
      },
      {
        name: 'Trip Completion',
        description: 'Successfully completed customer trips',
        value: tripCompletionValue,
        colorClass: 'performance-success'
      },
      {
        name: 'Customer Satisfaction',
        description: 'Positive customer feedback score',
        value: customerSatisfactionValue,
        colorClass: 'performance-info'
      },
      {
        name: 'Request Processing',
        description: 'Administrator request response rate',
        value: requestProcessingValue,
        colorClass: 'performance-warning'
      }
    ];
  }

  /*
   * Calculates the circular availability-chart offset.
   */
  get availabilityStrokeOffset(): number {
    const radius = 66;
    const circumference = 2 * Math.PI * radius;

    return circumference -
      (this.availableProgress / 100) * circumference;
  }

  /*
   * Updates the live date and time.
   */
  private updateDateAndTime(): void {
    const now = new Date();

    this.currentTime = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    this.currentDate = now.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  /*
   * Gets the request date safely using possible backend fields.
   */
  private getRequestDate(request: any): Date | null {
    const rawDate =
      request.tripDate ||
      request.requestDate ||
      request.createdAt ||
      request.createdDate ||
      request.date;

    if (!rawDate) {
      return null;
    }

    const parsedDate = new Date(rawDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate;
  }

  /*
   * Returns Monday as index 0 and Sunday as index 6.
   */
  private getMondayBasedDayIndex(date: Date): number {
    const day = date.getDay();

    return day === 0 ? 6 : day - 1;
  }

  /*
   * Returns Monday at 00:00:00 for the provided week.
   */
  private getStartOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const difference = day === 0 ? -6 : 1 - day;

    result.setDate(result.getDate() + difference);
    result.setHours(0, 0, 0, 0);

    return result;
  }

  /*
   * Checks whether a request is completed.
   */
  private isCompletedStatus(status: string): boolean {
    const normalizedStatus = this.normalizeStatus(status);

    return normalizedStatus === 'trip end' ||
      normalizedStatus === 'closed' ||
      normalizedStatus === 'completed';
  }

  /*
   * Converts status values to lowercase safely.
   */
  private normalizeStatus(status: any): string {
    return String(status || '')
      .trim()
      .toLowerCase();
  }

  /*
   * Calculates a safe percentage.
   */
  private calculatePercentage(
    value: number,
    total: number
  ): number {
    if (total <= 0) {
      return 0;
    }

    const percentage = Math.round(
      (value / total) * 100
    );

    return this.limitPercentage(percentage);
  }

  /*
   * Calculates current-week growth against the previous week.
   */
  private calculateGrowthPercentage(
    currentValue: number,
    previousValue: number
  ): number {
    if (previousValue === 0) {
      return currentValue > 0 ? 100 : 0;
    }

    const growth =
      ((currentValue - previousValue) / previousValue) * 100;

    return Number(growth.toFixed(1));
  }

  /*
   * Converts real chart counts into visual bar heights.
   */
  private convertChartValueToPercentage(
    value: number,
    maximumValue: number
  ): number {
    if (value <= 0 || maximumValue <= 0) {
      return 0;
    }

    const percentage = Math.round(
      (value / maximumValue) * 100
    );

    /*
     * A minimum 12% height keeps small non-zero values visible.
     */
    return Math.max(12, this.limitPercentage(percentage));
  }

  /*
   * Keeps percentages between 0 and 100.
   */
  private limitPercentage(value: number): number {
    return Math.max(0, Math.min(100, value));
  }
}