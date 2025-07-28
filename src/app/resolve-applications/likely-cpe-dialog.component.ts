import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environments } from '../../environments/environments';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

// Confirm Dialog Component
@Component({
  selector: 'app-confirm-dialog',
  template: `
    <h2 mat-dialog-title class="dialog-title p-0">
      <mat-icon class="dialog-icon" color="warn">help_outline</mat-icon>
      Confirm Action
    </h2>
    <mat-dialog-content class="dialog-content">
      <p>Are you sure you want to <strong>add </strong> <span class="highlight"> {{ data.cpeName }}</span>?</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
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
  `],
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { cpeName: string }
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
    MatIconModule
  ],
  templateUrl: './likely-cpe-dialog.component.html',
  styleUrls: ['./likely-cpe-dialog.component.css']
})
export class LikelyCpeDialogComponent {
  customCpeName: string = '';
  likelyCpeNames: { cpe23Uri: string; vendor: string; product: string; version: string }[] = [];
  cpeError: boolean = false;
  private cpePattern = /^cpe:2\.3:[aho](:[^:]*){10}$/;

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
    private snackBar: MatSnackBar
  ) {
    this.fetchLikelyCpeNames();
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
        this.snackBar.open('Failed to fetch likely CPE names', 'Close', {
          duration: 5000,
          verticalPosition: 'bottom',
          horizontalPosition: 'right'
        });
      }
    });
  }

  addCpeName(cpeName: string = this.customCpeName): void {
    if (cpeName === this.customCpeName && !this.cpePattern.test(cpeName)) {
      this.cpeError = true;
      return;
    }
    this.cpeError = false;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { cpeName }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('CPE resolved successfully!', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'center'
        });

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
            this.snackBar.open('Failed to add CPE name', 'Close', {
              duration: 5000,
              verticalPosition: 'bottom',
              horizontalPosition: 'right'
            });
          }
        });
      }
    });
  }
}