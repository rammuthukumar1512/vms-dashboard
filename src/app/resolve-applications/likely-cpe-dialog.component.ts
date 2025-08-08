import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environments } from '../../environments/environments';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { ToastService } from '../core/services/toast.service';
import { Subject, debounceTime } from 'rxjs';

// Confirm Dialog Component
@Component({
  selector: 'app-confirm-dialog',
  template: `
    <h2 mat-dialog-title class="dialog-title p-0">
      <mat-icon class="dialog-icon" color="warn">help_outline</mat-icon>
      Confirm Action
    </h2>
    <mat-dialog-content class="dialog-content">
      <p>Are you sure you want to <strong>add </strong> <span class="highlight"> {{ data.cpeName }}</span> for <span class="highlight1">{{data.softwareName}}</span>?</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="p-3">
      <button mat-stroked-button color="warn" (click)="onNo()">No</button>
      <button mat-flat-button color="primary" (click)="onYes()" cdkFocusInitial>Yes</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      background-color: #f0ededff;
    }
    .dialog-icon {
      font-size: 24px;
    }
    .dialog-content p {
      font-size: 16px;
      margin: 0;
    }
    .highlight {
      font-weight: bold;
      color: #1976d2;
    }
      .highlight1 {
      font-weight: bold;
      color: #cf4522ff;
    }
  `],
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { cpeName: string ,  softwareName: string;
},
  ) {}

  onNo(): void {
    this.dialogRef.close(false);
  }

  onYes(): void {
    this.dialogRef.close(true);
  }
}

// Likely CPE Dialog Component
@Component({
  selector: 'app-likely-cpe-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    FormsModule,
    MatIconModule,
],
  templateUrl: './likely-cpe-dialog.component.html',
  styleUrls: ['./likely-cpe-dialog.component.css']
})
export class LikelyCpeDialogComponent {
  @ViewChild('cpeInput') cpeInput!: ElementRef;
  customCpeName: string = '';
  likelyCpeNames: { cpe23Uri: string; vendor: string; product: string; version: string }[] = [];
  cpeError: boolean = false;
  softwareName: string = '';
  private cpePattern =  /^cpe:2\.3:[aho]:[^:]+:[^:]+:[^:]+(?::[^:]*){7}$/;
  app: any;
  isValidCpe: boolean = false;
  private validateSubject = new Subject<string>(); // For debouncing
  constructor(
    public dialogRef: MatDialogRef<LikelyCpeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      uuid: string;
      softwareName: string;
      softwareVersion: string;
      vendor: string;
    },
    private http: HttpClient,
    private dialog: MatDialog,
    private toastService: ToastService

  ) {
    this.softwareName = this.data.softwareName;
    this.fetchLikelyCpeNames();
    this.setupDebounceValidation();
  }

  ngOnInit() {
    this.setupDebounceValidation();
  }

  setupDebounceValidation() {
    this.validateSubject.pipe(debounceTime(800)).subscribe(value => {
      this.cpeError = !this.cpePattern.test(value); // Show error only if invalid and not empty
      this.isValidCpe = !this.cpeError;
    });
  }

  fetchLikelyCpeNames(): void {
    this.http.get<{ cpe23Uri: string; vendor: string; product: string; version: string }[]>(
      `${environments.likelyCpeUrl}?vendor=${encodeURIComponent(this.data.vendor)}&product=${encodeURIComponent(this.data.softwareName)}`
    ).subscribe({
      next: (response) => {
        this.likelyCpeNames = response || [];
        console.log('Fetched likely CPEs:', this.likelyCpeNames); // Debug log
      },
      error: (error) => {
        console.error('Error fetching likely CPE names:', error);
        this.toastService.showToast('Failed to fetch likely CPE names')
      }
    });
  }

  validateCpeInput(): void {
    this.cpeError = false; // Reset error on input change
    // this.isValidCpe = this.cpePattern.test(this.customCpeName);
    this.validateSubject.next(this.customCpeName); // Trigger debounced validation
  }

  onEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.isValidCpe) {
      this.addCpeName();
    }
  }

  addCpeName(cpeName: string = this.customCpeName): void {
    this.cpeError = false; // Reset error before validation
    if (cpeName === this.customCpeName && !this.cpePattern.test(cpeName)) {
      this.cpeError = true;
      return;
    }
    this.cpeError = false;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { cpeName ,softwareName:this.data.softwareName}
    });

    dialogRef.afterClosed().subscribe(result => {
      
      if (result) {
        this.toastService.showToast('CPE resolved successfully!')
        const body = {
          uuid: this.data.uuid,
          softwareName: this.data.softwareName,
          softwareVersion: this.data.softwareVersion,
          vendorName: this.data.vendor
        };

        this.http.post(
          `${environments.addHintUrl}?cpeName=${encodeURIComponent(cpeName)}`, body
        ).subscribe({
          next: () => {
            this.dialogRef.close({ cpeName });
          },
          error: (error) => {
            console.error('Error adding CPE name:', error);
            this.toastService.showToast('Failed to add CPE Name')
          }
        });
      }
    });
  }
}