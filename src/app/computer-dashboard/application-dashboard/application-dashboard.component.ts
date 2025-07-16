import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SharedDataService } from '../../core/services/shared-data.service';
import { ApplicationDetails, Vulnerability } from '../../models/computer.model';

@Component({
  selector: 'app-application-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, MatTooltipModule],
  templateUrl: './application-dashboard.component.html',
  styleUrls: ['./application-dashboard.component.css']
})
export class ApplicationDashboardComponent {
  // Signal to store application data
  appData = signal<{ vulnerableSoftwareCount: number; appData: ApplicationDetails[] } | null>(null);
  // Signal to store selected application's vulnerabilities
  selectedVulnerabilities = signal<Vulnerability[] | null>(null);
  // Define table columns for applications
  displayedColumns: string[] = ['softwareName', 'softwareVersion', 'vendor', 'vulnerabilityCount', 'action'];
  // Define table columns for vulnerabilities
  vulnDisplayedColumns: string[] = ['cveId', 'description', 'severity', 'cvssScore'];

  constructor(private sharedDataService: SharedDataService) {
    // Subscribe to the SharedDataService to receive application data
    this.sharedDataService.currentData$.subscribe(data => {
      this.appData.set(data);
      // Reset vulnerabilities when new app data is received
      this.selectedVulnerabilities.set(null);
    });
  }

  // Method to handle clicking the visibility icon
  showVulnerabilities(app: ApplicationDetails): void {
    this.selectedVulnerabilities.set(app.vulnerabilities);
  }
}