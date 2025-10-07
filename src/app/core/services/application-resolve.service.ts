import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApplicationDetails, SecurityReport } from '../../models/computer.model';

export interface ApplicationResolveData {
  uuid: string;
  softwareName: string;
  softwareVersion: string;
  vendorName: string;
  
}

export interface DashboardState {
  pageIndex?: number;
  recordIndex?: number;
  selectedAppUuid?: string;
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
  private dashboardState: DashboardState | null = null;
  private computerDashPageIndex: number = 0;
  private computerDashPageSize: number = 0;
  private applicationDashPageIndex: number = 0;
  private applicationDashPageSize: number = 0;
  private securityReport: SecurityReport = {totalComputers: 0,
    totalCriticalVulnerableApplications: 0,
    totalHighVulnerableApplications: 0,
    totalMediumVulnerableApplications: 0,
    totalLowVulnerableApplications: 0,
    vulnerableComputers: 0,
    computerDetails: []};
  private selectedComputerId: number = 1;
  private selectedAppUuid: string | null = null;
  private selectedApplicationIndex: number = 0;

  // Update application-resolve.service.ts with the following additions (add these properties and methods)
// application-resolve.service.ts
private severityFilter: 'Critical' | 'High' | 'Medium' | 'Low' | null = null;

setSeverityFilter(filter: 'Critical' | 'High' | 'Medium' | 'Low' | null): void {
  this.severityFilter = filter;
}

getSeverityFilter(): 'Critical' | 'High' | 'Medium' | 'Low' | null {
  return this.severityFilter;
}


// Add new methods
setDashboardState(state: DashboardState): void {
  this.dashboardState = state;
}

getDashboardState(): DashboardState | null {
  return this.dashboardState;
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

  setComputerUuid(uuid: string): void {
    this.computerUuid = uuid;
  }

  getComputerUuid(): string | null {
    return this.computerUuid;
  }

  setComputerDashPageIndex(index:number):void {
    this.computerDashPageIndex = index;
  }
  getComputerDashPageIndex() {
    return this.computerDashPageIndex;
  }
  setComputerDashPageSize(size:number):void {
    this.computerDashPageSize = size;
  }
  getComputerDashPageSize() {
    return this.computerDashPageSize;
  }
  setApplicationDashPageIndex(index:number):void {
    this.applicationDashPageIndex = index;
  }
  getApplicationDashPageIndex() {
    return this.applicationDashPageIndex;
  }
  setApplicationDashPageSize(size:number):void {
    this.applicationDashPageSize = size;
  }
  getApplicationDashPageSize() {
    return this.applicationDashPageSize;
  }

  setSecurityReport(securityReport:SecurityReport): void {
     this.securityReport = securityReport;
  }

  getSecurityReport() {
     return this.securityReport;
  }

  setSelectedComputerId(id: number): void {
    this.selectedComputerId = id;
  }
  getSelectedComputerId() {
    return this.selectedComputerId;
  }
  setSelectedAppUuid(id: string): void {
    this.selectedAppUuid = id;
  }
  getSelectedAppUuid() {
    return this.selectedAppUuid;
  }
  setSelectedApplicationIndex(number: number): void {
    this.selectedApplicationIndex = number;
  }
  getSelectedApplicationIndex() {
    return this.selectedApplicationIndex;
  }
}