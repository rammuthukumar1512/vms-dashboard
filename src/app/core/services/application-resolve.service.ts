import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApplicationDetails } from '../../models/computer.model';

export interface ApplicationResolveData {
  uuid: string;
  softwareName: string;
  softwareVersion: string;
  vendorName: string;
  
}
export interface ReportState {
  pageSize: number;
  searchValue: string;
  showVulnerableOnly: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class ApplicationResolveService {
  private resolveDataSubject = new BehaviorSubject<ApplicationResolveData | null>(null);
  resolveData$: Observable<ApplicationResolveData | null> = this.resolveDataSubject.asObservable();
  private lastShowedApp: ApplicationDetails | null= null;
  private previousUrl: string | null = null;
  private computerUuid: string | null = null;
  private selectedVulnerabilityIndex: number = 0;
  private selectedVulnerabilitySeverity: string | null = null;

  // Update application-resolve.service.ts with the following additions (add these properties and methods)

private reportState: ReportState | null = null;

setReportState(state: ReportState): void {
  this.reportState = state;
}

getReportState(): ReportState | null {
  return this.reportState;
}

clearReportState(): void {
  this.reportState = null;
}
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
  setComputerUuid(uuid: string): void {
    this.computerUuid = uuid;
  }

  getComputerUuid(): string | null {
    return this.computerUuid;
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