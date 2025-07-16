import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationDashboardComponent } from './application-dashboard.component';

describe('ApplicationDashboardComponent', () => {
  let component: ApplicationDashboardComponent;
  let fixture: ComponentFixture<ApplicationDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApplicationDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
