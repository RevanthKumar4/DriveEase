import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerviewfeedbackComponent } from './customerviewfeedback.component';

describe('CustomerviewfeedbackComponent', () => {
  let component: CustomerviewfeedbackComponent;
  let fixture: ComponentFixture<CustomerviewfeedbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomerviewfeedbackComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomerviewfeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
