import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { SuccessToastComponent } from '../../shared/components/success-toast/success-toast.component';
import { ErrorToastComponent } from '../../shared/components/error-toast/error-toast.component';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private defaultConfig: MatSnackBarConfig = {
    duration: 5000,
    horizontalPosition: 'right',
    verticalPosition: 'bottom'
  };

  constructor(private snackBar: MatSnackBar, ) {};
  showSuccessToast(message: string): void {
    this.snackBar.openFromComponent(SuccessToastComponent, {
      ...this.defaultConfig,
      data : {message}
    });
  }

  showErrorToast(message: string): void {
    this.snackBar.openFromComponent(ErrorToastComponent, {
      ...this.defaultConfig,
      data : {message}
    });
  }
}