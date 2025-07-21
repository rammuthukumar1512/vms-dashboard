import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedDataService {
  private appDataSubject = new BehaviorSubject<any>(null);

  currentData$ = this.appDataSubject.asObservable();

  sendAppData(data: any): void {
    this.appDataSubject.next(data);
  }
}
