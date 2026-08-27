import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerviewrequestedComponent } from './customerviewrequested.component';

describe('CustomerviewrequestedComponent', () => {
  let component: CustomerviewrequestedComponent;
  let fixture: ComponentFixture<CustomerviewrequestedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomerviewrequestedComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomerviewrequestedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
