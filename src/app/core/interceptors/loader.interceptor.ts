import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, catchError, finalize, throwError, timeout } from 'rxjs';
import { LoaderService } from '../services/loader.service'; 
import { ToastService } from '../services/toast.service';

@Injectable()
export class LoaderInterceptor implements HttpInterceptor {

  constructor(private loaderService: LoaderService, private toastService: ToastService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.loaderService.show();

    return next.handle(req).pipe(
      timeout(180000),
      catchError((error) => {
        if(error.name === 'TimeoutError') {
        this.toastService.showErrorToast('Request timed out. Please try again.');
        this.loaderService.hide();
        return throwError(()=> error);
        } else {
          return throwError(()=> error);
        }
      }),
      finalize(() => this.loaderService.hide())
    );
  }
}
