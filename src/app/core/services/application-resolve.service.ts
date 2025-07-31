import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ApplicationResolveData {
  uuid: string;
  softwareName: string;
  softwareVersion: string;
  vendorName: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApplicationResolveService {
  private resolveDataSubject = new BehaviorSubject<ApplicationResolveData | null>(null);
  resolveData$: Observable<ApplicationResolveData | null> = this.resolveDataSubject.asObservable();

  setResolveData(data: ApplicationResolveData | null): void {
    this.resolveDataSubject.next(data);
  }

  clearResolveData(): void {
    this.resolveDataSubject.next(null);
  }
}