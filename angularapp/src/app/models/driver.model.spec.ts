import { Driver } from "./driver.model";

describe('Driver Model', () => {

  fit('Frontend_Driver_model_should_create_an_instance_with_defined_properties', () => {
    // Create a sample Driver object
    const driver: Driver = {
      driverId: 301,
      driverName: 'John Doe',
      licenseNumber: 'ABC12345',
      experienceYears: 5,
      contactNumber: '1234567890',
      availabilityStatus: 'Available',
      address: '123 Main Street, Springfield',
      vehicleType: 'SUV',
      hourlyRate: 15,
      image: 'base64EncodedImageString'
    };

    expect(driver).toBeTruthy();
    expect(driver.driverId).toBe(301);
    expect(driver.driverName).toBe('John Doe');
    expect(driver.licenseNumber).toBe('ABC12345');
    expect(driver.experienceYears).toBe(5);
    expect(driver.contactNumber).toBe('1234567890');
    expect(driver.availabilityStatus).toBe('Available');
    expect(driver.address).toBe('123 Main Street, Springfield');
    expect(driver.vehicleType).toBe('SUV');
    expect(driver.hourlyRate).toBe(15);
    expect(driver.image).toBe('base64EncodedImageString');
  });

});
