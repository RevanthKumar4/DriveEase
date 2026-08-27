import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminviewrequestsComponent } from './adminviewrequests.component';

describe('AdminviewrequestsComponent', () => {
  let component: AdminviewrequestsComponent;
  let fixture: ComponentFixture<AdminviewrequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminviewrequestsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminviewrequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
