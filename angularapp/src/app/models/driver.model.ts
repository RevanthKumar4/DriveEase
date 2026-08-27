export interface Driver {
    driverId?: number;
    driverName: string;
    licenseNumber: string;
    experienceYears: number;
    contactNumber: string;
    availabilityStatus: string; // initially, should be Active, Value should be "Active", "Inactive", or "On Leave (no other values are allowed)"
    address: string;
    vehicleType: string; // e.g., "Sedan", "SUV", "Bike"
    hourlyRate: number;
    image: string; //Base64-encoded image of the driver
}