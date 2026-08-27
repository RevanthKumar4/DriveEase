export interface DriverRequest {
    driverRequestId?: number;
    userId: number;
    driverId?: number;
    requestDate: Date ; //ISO date format (YYYY-MM-DD)
    status: string // status of the request; allowed values are 'Pending', 'Approved', 'Rejected', 'Trip End', 'Closed'
    tripDate: Date; //ISO date format (YYYY-MM-DD)
    timeSlot: Date; //ISO date format (YYYY-MM-DD)
    pickupLocation: string;
    dropLocation: string;
    estimatedDuration: string; // e.g., "3 hours"
    paymentAmount?: number;
    comments?: string;
    actualDropTime?: Date;
    actualDuration?: string;
    actualDropDate?: Date;
  }
  