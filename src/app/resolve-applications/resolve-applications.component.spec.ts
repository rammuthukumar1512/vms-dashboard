import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolveApplicationsComponent } from './resolve-applications.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
describe('ResolveApplicationsComponent', () => {
  let component: ResolveApplicationsComponent;
  let fixture: ComponentFixture<ResolveApplicationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolveApplicationsComponent,
        MatDialogModule,
        MatSnackBarModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResolveApplicationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
