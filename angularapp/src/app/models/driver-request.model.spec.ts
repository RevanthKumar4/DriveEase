import { DriverRequest } from "./driver-request.model";

describe('DriverRequest Model', () => {

  fit('Frontend_DriverRequest_model_should_create_an_instance_with_defined_properties', () => {
    // Create a sample DriverRequest object
    const driverRequest: DriverRequest = {
      driverRequestId: 501,
      userId: 1,
      driverId: 301,
      requestDate: new Date('2024-01-01'),
      status: 'Pending',
      tripDate: new Date('2024-01-10'),
      timeSlot: new Date('2024-01-10T10:00:00'),
      pickupLocation: '123 Main Street, Springfield',
      dropLocation: '456 Elm Street, Shelbyville',
      estimatedDuration: '3 hours',
      paymentAmount: 50,
      comments: 'This is a test comment.',
      actualDropTime: new Date('2024-01-10T13:00:00'),
      actualDuration: '3 hours',
      actualDropDate: new Date('2024-01-10')
    };

    expect(driverRequest).toBeTruthy();
    expect(driverRequest.driverRequestId).toBe(501);
    expect(driverRequest.userId).toBe(1);
    expect(driverRequest.driverId).toBe(301);
    expect(driverRequest.requestDate).toEqual(new Date('2024-01-01'));
    expect(driverRequest.status).toBe('Pending');
    expect(driverRequest.tripDate).toEqual(new Date('2024-01-10'));
    expect(driverRequest.timeSlot).toEqual(new Date('2024-01-10T10:00:00'));
    expect(driverRequest.pickupLocation).toBe('123 Main Street, Springfield');
    expect(driverRequest.dropLocation).toBe('456 Elm Street, Shelbyville');
    expect(driverRequest.estimatedDuration).toBe('3 hours');
    expect(driverRequest.paymentAmount).toBe(50);
    expect(driverRequest.comments).toBe('This is a test comment.');
    expect(driverRequest.actualDropTime).toEqual(new Date('2024-01-10T13:00:00'));
    expect(driverRequest.actualDuration).toBe('3 hours');
    expect(driverRequest.actualDropDate).toEqual(new Date('2024-01-10'));
  });

});
