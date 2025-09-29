import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApplicationDetails } from '../../models/computer.model';

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
  

  // Update application-resolve.service.ts with the following additions (add these properties and methods)


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


}