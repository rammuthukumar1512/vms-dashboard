import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApplicationDetails } from '../../models/computer.model';

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
  private lastShowedApp: ApplicationDetails | null= null;
  private previousUrl: string | null = null;
  private selectedVulnerabilityIndex: number = 0;
  private selectedVulnerabilitySeverity: string | null = null;

  setResolveData(data: ApplicationResolveData | null): void {
    this.resolveDataSubject.next(data);
  }

  clearResolveData(): void {
    this.resolveDataSubject.next(null);
  }

  setLastShowedApp(app: ApplicationDetails | null): void {
    this.lastShowedApp = app;
  }

  getLastShowedApp(): ApplicationDetails | null {
    return this.lastShowedApp;
  }

  setPreviousUrl(url :string) {
    this.previousUrl = url;
  }

  getPreviousUrl(): string | null {
    return this.previousUrl;
  }

  setSelectedVulnerabilityIndex(index: number) {
    this.selectedVulnerabilityIndex = index;
  }

  getSelectedVulnerabilityIndex(): number {
    return this.selectedVulnerabilityIndex;
  }
  
  setSelectedVulnerabilitySeverity(severity: string | null) {
    this.selectedVulnerabilitySeverity = severity;
  }

  getSelectedVulnerabilitySeverity(): string | null {
    return this.selectedVulnerabilitySeverity;
  }
}