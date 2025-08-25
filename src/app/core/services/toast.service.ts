import { Injectable } from '@angular/core';

declare var bootstrap: any;

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  show(message: string, type: 'success' | 'error' = 'success') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    // Create toast element
    const toastEl = document.createElement('div');
    toastEl.className = `toast border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    toastEl.setAttribute('style', `background-color:${type === 'success' ? 'rgb(184, 226, 188)' : 'rgb(238, 187, 187)'}`);

    toastEl.innerHTML = `
      <div class="d-flex">
      <div class="col-2 d-flex justify-content-center p-1">
        <span style="color: ${type === 'success' ? 'rgb(3, 68, 3, 1)' : '#dc3545'};" class="material-symbols-outlined fs-1">
        ${type === 'success' ? 'check' : 'error'}
        </span>
      </div>
      <div class="col-10">
      <div style="background-color: ${type === 'success' ? 'rgb(184, 226, 188)' : 'rgb(238, 187, 187)'};" class="toast-header border-0">
        <strong style="color: ${type === 'success' ? 'rgba(3, 68, 3, 1)' : '#dc3545'};" class="me-auto">${type === 'success' ? 'Success' : 'Error'}</strong>
        <button style="background-color: ${type === 'success' ? 'rgb(184, 226, 188)' : 'rgb(238, 187, 187)'};border: none;outline: none;padding: 0;" type="button" class="btn ${type === 'success' ? 'text-success' : 'text-danger'};" data-bs-dismiss="toast">
        <span class="material-symbols-outlined">
        close
        </span></button>
      </div>
      <div style="color: ${type === 'success' ? 'rgb(1, 97, 1)' : '#dc3545'};" class="toast-body py-1">
        <p class="fnw-medium">${message}</p>
      </div>
      </div>
      </div>
      `;

    toastContainer.appendChild(toastEl);

    const bsToast = new bootstrap.Toast(toastEl, { delay: 5000 });
    bsToast.show();

    toastEl.addEventListener('hidden.bs.toast', () => {
      toastEl.remove();
    });
  }

  showSuccessToast(message: string) {
    this.show(message, 'success');
  }

  showErrorToast(message: string) {
    this.show(message, 'error');
  }
}
