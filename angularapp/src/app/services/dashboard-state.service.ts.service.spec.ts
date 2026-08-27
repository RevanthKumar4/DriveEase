import { TestBed } from '@angular/core/testing';

import { DashboardStateServiceTsService } from './dashboard-state.service.ts.service';

describe('DashboardStateServiceTsService', () => {
  let service: DashboardStateServiceTsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardStateServiceTsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
