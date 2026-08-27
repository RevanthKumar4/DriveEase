import { TestBed } from '@angular/core/testing';

import { DriverService } from './driver.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('DriverService', () => {
  let service: DriverService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(DriverService);
  });

  fit('Frontend_should_create_drive_service', () => {
    expect(service).toBeTruthy();
  });
});
