import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private defaultConfig: MatSnackBarConfig = {
    duration: 5000,
    horizontalPosition: 'right',
    verticalPosition: 'bottom'
  };

  constructor(private snackBar: MatSnackBar) {};
  showSuccess(message: string, config: MatSnackBarConfig = {}): void {
    this.snackBar.open(message, 'OK', {
      ...this.defaultConfig,
      ...config
    });
  }
  
  showError(message: string, config: MatSnackBarConfig = {}): void {
    this.snackBar.open(message, 'Close', {
      ...this.defaultConfig,
      ...config
    });
  }
}