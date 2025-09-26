import { DOCUMENT } from '@angular/common';
import { Injectable } from '@angular/core';
import { MatSnackBarConfig, MatSnackBar } from '@angular/material/snack-bar';
import { Toast } from 'bootstrap';
import { timeout } from 'rxjs';
// import { SuccessToastComponent } from '../../shared/components/success-toast/success-toast.component';
// import { ErrorToastComponent } from '../../shared/components/error-toast/error-toast.component';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
   constructor(private snackBar: MatSnackBar) {};
    private defaultConfig: MatSnackBarConfig = {
    duration: 5000,
    horizontalPosition: 'right',
    verticalPosition: 'bottom'
  };
  show(message: string, type: 'success' | 'error' = 'success') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toastEl = document.createElement('div');
    toastEl.className = `toast border-0 toast-animate`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    toastEl.setAttribute('style', `background-color:${type === 'success' ? 'rgb(184, 226, 188)' : 'rgb(238, 187, 187)'};overflow: hidden;`);

    toastEl.innerHTML = `
      <div class="d-flex">
      <div class="col-2 d-flex justify-content-center p-1">
        <span style="color: ${type === 'success' ? 'rgb(3, 68, 3, 1)' : '#dc3545'};" class="material-symbols-outlined fs-1">
        ${type === 'success' ? 'check' : 'error'}
        </span>
      </div>
      <div class="col-10">
      <div style="background-color: ${type === 'success' ? 'rgb(184, 226, 188)' : 'rgb(238, 187, 187)'};" class="toast-header px-1 py-1 border-0">
        <strong style="color: ${type === 'success' ? 'rgba(3, 68, 3, 1)' : '#dc3545'};" class="me-auto">${type === 'success' ? 'Success' : 'Error'}</strong>
        <button style="background-color: ${type === 'success' ? 'rgb(184, 226, 188)' : 'rgb(238, 187, 187)'};border: none;outline: none;padding: 0;" type="button" class="btn btn-close p-1 rounded-circle me-2 mt-2  ${type === 'success' ? 'text-success' : 'text-danger'};">
        </button>
      </div>
      <div style="color: ${type === 'success' ? 'rgb(1, 97, 1)' : '#dc3545'};" class="toast-body ps-1 pt-0 pb-0 pe-0">
        <p class="fnw-medium">${message}</p>
      </div>
      </div>
      </div>
      `;
    
    toastContainer.appendChild(toastEl);

    const bsToast = new Toast(toastEl, { delay: 5000 });
    bsToast.show();

    toastEl.addEventListener('hidden.bs.toast', () => {
      toastEl.remove();
    });

    document.querySelectorAll('.btn-close').forEach(btn => btn?.addEventListener('click',  ()=> {
      let hiddenToast = btn.parentElement?.parentElement?.parentElement?.parentElement
      hiddenToast?.classList.remove('toast-animate');
      hiddenToast?.classList.add('toast-hide');
      setTimeout(()=>{
        hiddenToast?.remove();
      },200);
      // bsToast.hide();
  }));
  }

  showSuccessToast(message: string, config: MatSnackBarConfig = {}) {
    this.show(message, 'success');
    // this.snackBar.openFromComponent(SuccessToastComponent, {
    //   data: {message},
    //   ...this.defaultConfig,
    //   ...config
    // });
  }
  

  showErrorToast(message: string, config: MatSnackBarConfig = {}) {
    this.show(message, 'error');
    // this.snackBar.openFromComponent(ErrorToastComponent, {
    //   data: {message},
    //   ...this.defaultConfig,
    //   ...config
    // });
  }
 
  showToast(message: string, config: MatSnackBarConfig = {}): void {
    this.snackBar.open(message, 'OK', {
      data: {message},
      ...this.defaultConfig,
      ...config
    });
  }
}
