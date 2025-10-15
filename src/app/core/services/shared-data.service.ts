import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedDataService {
  private appDataSubject = new BehaviorSubject<any>(null);
  currentData$ = this.appDataSubject.asObservable();

  private syncSecurityDataSubject = new Subject<void>();
  syncSecurityData$ = this.syncSecurityDataSubject.asObservable();

  syncSecurityData(): void {
    this.syncSecurityDataSubject.next();
  }

  sendAppData(data: any): void {
    this.appDataSubject.next(data);
  }
}
