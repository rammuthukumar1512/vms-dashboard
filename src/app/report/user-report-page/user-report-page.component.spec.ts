import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserReportPageComponent } from './user-report-page.component';

describe('UserReportPageComponent', () => {
  let component: UserReportPageComponent;
  let fixture: ComponentFixture<UserReportPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserReportPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserReportPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
