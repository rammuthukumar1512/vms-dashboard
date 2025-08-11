import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedDataService {
  private appDataSubject = new BehaviorSubject<any>(null);
  private isMobileSubject = new BehaviorSubject<boolean>(false);

  currentData$ = this.appDataSubject.asObservable();
  isMobile$ = this.isMobileSubject.asObservable();

  sendAppData(data: any): void {
    this.appDataSubject.next(data);
  }

  setMobile(isMobile: boolean): void {
    this.isMobileSubject.next(isMobile);
  }
}
