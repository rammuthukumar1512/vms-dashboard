import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationConfirmDialogComponent } from './notification-confirm-dialog.component';

describe('NotificationConfirmDialogComponent', () => {
  let component: NotificationConfirmDialogComponent;
  let fixture: ComponentFixture<NotificationConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationConfirmDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
