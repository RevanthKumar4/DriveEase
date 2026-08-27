import { TestBed } from '@angular/core/testing';

import { DriverRequestService } from './driver-request.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('DriverRequestService', () => {
  let service: DriverRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(DriverRequestService);
  });

  fit('Frontend_should_create_driverRequest_service', () => {
    expect(service).toBeTruthy();
  });
});
