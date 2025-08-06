import { Component } from '@angular/core';
import { MatDialogRef, MatDialogContent, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button'; // Import MatButtonModule for button styling
@Component({
  selector: 'app-notification-confirm-dialog',
  template: `
    <h2 mat-dialog-title>Confirm Notification</h2>
    <mat-dialog-content>
      Are you sure you want to send a notification to the user on {{ machineName }}?
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onNoClick()">No</button>
      <button mat-button [mat-dialog-close]="true" cdkFocusInitial>Yes</button>
    </mat-dialog-actions>
  `,
  styleUrls: ['./notification-confirm-dialog.component.css'],
  imports: [MatDialogContent, MatButtonModule, MatDialogModule]
})
export class NotificationConfirmDialogComponent {
  machineName: string = 'Unknown'; // Will be passed via dialog data

  constructor(public dialogRef: MatDialogRef<NotificationConfirmDialogComponent>) {}

  onNoClick(): void {
    this.dialogRef.close(false);
  }
}