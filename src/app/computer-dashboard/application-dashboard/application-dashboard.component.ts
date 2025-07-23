import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
// import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SharedDataService } from '../../core/services/shared-data.service';
import { ApplicationDetails, ComputerDetails, Vulnerability } from '../../models/computer.model';
import { Chart, PieController, ArcElement, Tooltip, Legend, BarController, BarElement, CategoryScale, LinearScale } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Inject } from '@angular/core';
// import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { VulnerabilityDialogComponent } from './vulnerability-dialog.component';


// Register Chart.js components
Chart.register(PieController, ArcElement, Tooltip, Legend, BarController, BarElement, CategoryScale, LinearScale, ChartDataLabels);

@Component({
  selector: 'app-application-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatDialogModule,
    FormsModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './application-dashboard.component.html',
  styleUrls: ['./application-dashboard.component.css']
})
export class ApplicationDashboardComponent implements AfterViewInit {
[x: string]: any;
  @ViewChild('appChart') appChart: ElementRef<HTMLCanvasElement> | undefined;
  @ViewChild('severityChart') severityChart: ElementRef<HTMLCanvasElement> | undefined;
  appChartInstance: Chart<'doughnut'> | undefined;
  severityChartInstance: Chart<'bar'> | undefined;
  appData: ApplicationDetails[] = [];
  vulnerableSoftwareCount: number = 0;
  machineName: string = 'Unknown';
  displayedColumns: string[] = ['softwareName', 'softwareVersion', 'vendor', 'vulnerabilityCount'];
  severityFilter: 'Critical' | 'High' | 'Medium' | 'Low' | null = null;
  severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };
  pagedAppData: ApplicationDetails[] = [];
  initialIndex: number = 0;
  pageIndex: number = 0;
  recordIndex: number = 1;
  pageSize: number = 5;
  totalPages: number = 0;
  totalRecords: number[] = [];
  pageSizes: number[] = [5, 10, 25, 50];
  start: number = 0;
  end: number = 0;
  searchValue: string = '';

  constructor(private sharedDataService: SharedDataService, private dialog: MatDialog) {
    this.sharedDataService.currentData$.subscribe(data => {
      console.log('Received appData in ApplicationDashboard:', data);
      if (data && data.appData) {
this.appData = data.appData.sort((a: ApplicationDetails, b: ApplicationDetails) => {         
   const aVulns = a.criticalVulnerabilityCount + a.highVulnerabilityCount + a.mediumVulnerabilityCount + a.lowVulnerabilityCount;
          const bVulns = b.criticalVulnerabilityCount + b.highVulnerabilityCount + b.mediumVulnerabilityCount + b.lowVulnerabilityCount;
          return bVulns - aVulns; // Sort descending
        });
        this.vulnerableSoftwareCount = data.vulnerableSoftwareCount || 0;
        this.machineName = data.machineName || 'Unknown'; // Update machineName
        this.calculateSeverityCounts();
      } else {
        this.appData = [];
        this.vulnerableSoftwareCount = 0;
        this.machineName = data?.machineName || 'Unknown'; // Update machineName
        this.severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
      }
      this.updatePagedData(this.initialIndex);
      this.drawAppChart();
      this.drawSeverityChart();
    });
  }

  ngAfterViewInit(): void {
    this.drawAppChart();
    this.drawSeverityChart();
  }

  calculateSeverityCounts(): void {
    this.severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    this.appData.forEach(app => {
      this.severityCounts.critical += app.criticalVulnerabilityCount;
      this.severityCounts.high += app.highVulnerabilityCount;
      this.severityCounts.medium += app.mediumVulnerabilityCount;
      this.severityCounts.low += app.lowVulnerabilityCount;
    });
  }

 // In computer-dashboard.component.ts
public sendAppData(data: ComputerDetails | null): void {
  const appData = {
    machineName: data?.machineName || 'Unknown', // Include machineName
    vulnerableSoftwareCount: data?.vulnerableSoftwareCount || 0,
    appData: data?.applicationDetails || []
  };
  console.log('Sending appData:', appData);
  this.sharedDataService.sendAppData(appData);
}

  drawAppChart(): void {
    if (!this.appChart?.nativeElement) return;
    const ctx = this.appChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.appChartInstance) {
      this.appChartInstance.destroy();
    }

    if (this.appData.length === 0) {
      this.appChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['No Data'],
          datasets: [{
            data: [1],
            backgroundColor: ['#d3d3d3'],
            borderColor: ['#ffffff'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
            title: {
              display: true,
              text: 'No data found',
              // font: { size: 14, family: 'Roboto, "Helvetica Neue", sans-serif' },
              color: '#666'
            },
            datalabels: { display: false }
          }
        }
      });
      return;
    }

    const vulnerableCount = this.vulnerableSoftwareCount;
    const nonVulnerableCount = this.appData.length - vulnerableCount;

    this.appChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Vulnerable', 'Non-Vulnerable'],
        datasets: [{
          data: [vulnerableCount, nonVulnerableCount],
          backgroundColor: ['#66b3ffea', '#3366ffe7'],
          borderColor: ['#ffffff', '#ffffff'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        cutout: '50%',
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              // font: { size: 14, family: 'Roboto, "Helvetica Neue", sans-serif' }
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                return `${label}: ${value} applications`;
              }
            }
          },
          datalabels: {
            formatter: (value, context) => {
              const data = context.chart.data.datasets[0].data as number[];
              const total = data.reduce((sum, val) => sum + val, 0);
              const percentage = total ? ((value / total) * 100).toFixed(0) : '0';
              return percentage + '%';
            },
            color: '#ffffff',
            font: {
              weight: 'bold',
              size: 10
            }
          }
        }
      }
    });
  }

  drawSeverityChart(): void {
    if (!this.severityChart?.nativeElement) return;
    const ctx = this.severityChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.severityChartInstance) {
      this.severityChartInstance.destroy();
    }

    this.severityChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Critical', 'High', 'Medium', 'Low'],
        datasets: [{
          label: 'Vulnerability Count',
          data: [this.severityCounts.critical, this.severityCounts.high, this.severityCounts.medium, this.severityCounts.low],
          backgroundColor: ['#F26419', '#F6AE2D', '#86BBD8', '#33658A'],
          borderColor: ['#F26419', '#F6AE2D', '#86BBD8', '#33658A'],
          borderWidth: 0,
          borderRadius: 3,
          barPercentage: 0.9
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: { display: false },
            title: { display: true, text: 'Vulnerability Count' }
          },
          x: {
            grid: { display: false },
            title: { display: true, text: 'Severity Type' }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${context.label}: ${context.parsed.y} vulnerabilities`;
              }
            }
          },
          datalabels: {
            color: 'white',
            anchor: 'center',
            align: 'center',
            font: { weight: 'bold', size: 10 },
            formatter: function (value) { return value; }
          }
        }
      }
    });
  }

  filterBySeverity(severity: 'Critical' | 'High' | 'Medium' | 'Low' | null): void {
    this.severityFilter = severity;
    this.updatePagedData(this.initialIndex);
  }

  getFilteredApps(): ApplicationDetails[] {
    if (!this.severityFilter) return this.appData;
    return this.appData.filter(app => {
      if (this.severityFilter === 'Critical') return app.criticalVulnerabilityCount > 0;
      if (this.severityFilter === 'High') return app.highVulnerabilityCount > 0;
      if (this.severityFilter === 'Medium') return app.mediumVulnerabilityCount > 0;
      if (this.severityFilter === 'Low') return app.lowVulnerabilityCount > 0;
      return true;
    });
  }

  updatePagedData(initialIndex: number): void {
    let filteredData = this.getFilteredApps();
    if (this.searchValue) {
      filteredData = filteredData.filter(app =>
        app.softwareName.toLowerCase().includes(this.searchValue.toLowerCase()) ||
        app.softwareVersion.toLowerCase().includes(this.searchValue.toLowerCase()) ||
        (app.vendor || '').toLowerCase().includes(this.searchValue.toLowerCase())
      );
    }
    let pages = Math.ceil(filteredData.length / this.pageSize);
    this.totalPages = pages;
    this.totalRecords = Array.from({ length: pages }, (_, i) => i + 1);
    this.start = initialIndex * this.pageSize;
    this.end = this.start + this.pageSize;
    this.pagedAppData = filteredData.slice(this.start, this.end);
  }

  nextPage(): void {
    if (this.pageIndex < this.totalPages - 1) {
      this.pageIndex++;
      this.recordIndex = this.pageIndex + 1;
      this.start = this.pageIndex * this.pageSize;
      this.end = this.start + this.pageSize;
      this.updatePagedData(this.pageIndex);
    }
  }

  previousPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.recordIndex = this.pageIndex + 1;
      this.start = this.pageIndex * this.pageSize;
      this.end = this.start + this.pageSize;
      this.updatePagedData(this.pageIndex);
    }
  }

  getPage(page: number): void {
  this.pageIndex = page - 1; // zero-based for internal logic
  this.recordIndex = page;   // one-based for UI select
  this.updatePagedData(this.pageIndex);
}

  // onPageSizeChange(event: number): void {
  //   this.pageSize = event;
  //   this.pageIndex = 0;
  //   this.updatePagedData(this.pageIndex);
  // }

  onPageSizeChange(event: number): void {
  this.pageSize = event;
  this.pageIndex = 0;
  this.recordIndex = 1;
  this.updatePagedData(this.pageIndex);
}


  searchApplications(event: Event): void {
    this.searchValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.pageIndex = 0;
    this.updatePagedData(this.initialIndex);
  }

  showVulnerabilities(app: ApplicationDetails): void {
    console.log('Selected vulnerabilities for', app.softwareName, ':', app.vulnerabilities);
    this.dialog.open(VulnerabilityDialogComponent, {
      panelClass: 'vuln-dialog-panel', // Custom class for styling 

      data: {
        softwareName: app.softwareName,
        vulnerabilities: app.vulnerabilities || [],
        severityCounts: {
          critical: app.criticalVulnerabilityCount,
          high: app.highVulnerabilityCount,
          medium: app.mediumVulnerabilityCount,
          low: app.lowVulnerabilityCount
        }
      }
    });
  }
}

// @Component({
//   selector: 'app-vulnerability-dialog',
//   standalone: true,
//   imports: [CommonModule, MatDialogModule, MatButtonModule, MatTableModule, MatCardModule],
//   template: `
// <mat-dialog-content class="dialog-scroll">

//   <!-- Sticky Header + Buttons -->
//   <div class="severity-header">
//     <div class="d-flex justify-content-between align-items-center px-2 pt-2">
//       <h2 class="m-0">Vulnerabilities for <span class = "vuln-software"> " {{ data.softwareName }} "</span></h2>
//       <button mat-button mat-dialog-close>Close</button>
//     </div>

//     <div class="severity-buttons">
//        <button mat-raised-button class="severity-btn critical" (click)="filterVulnerabilities('Critical')">
//             Critical: {{ data.severityCounts.critical }}
//           </button>
//           <button mat-raised-button class="severity-btn high" (click)="filterVulnerabilities('High')">
//             High: {{ data.severityCounts.high }}
//           </button>
//           <button mat-raised-button class="severity-btn medium" (click)="filterVulnerabilities('Medium')">
//             Medium: {{ data.severityCounts.medium }}
//           </button>
//           <button mat-raised-button class="severity-btn low" (click)="filterVulnerabilities('Low')">
//             Low: {{ data.severityCounts.low }}
//           </button>
//           <button mat-raised-button class="severity-btn all" (click)="filterVulnerabilities(null)">
//             All
//           </button>
//     </div>
//   </div>

//   <!-- Vulnerabilities Table -->
//    <ng-container *ngIf="filteredVulnerabilities.length; else noVulnerabilities">
//         <table mat-table [dataSource]="filteredVulnerabilities" class="comp-table">
//       <ng-container matColumnDef="cveId">
//         <th mat-header-cell *matHeaderCellDef>CVE ID</th>
//         <td mat-cell *matCellDef="let vuln">{{ vuln.cveId }}</td>
//       </ng-container>

//       <ng-container matColumnDef="description">
//         <th mat-header-cell *matHeaderCellDef>Description</th>
//         <td mat-cell *matCellDef="let vuln">{{ vuln.description }}</td>
//       </ng-container>

//       <!-- <ng-container matColumnDef="severity">
//         <th class="text-center" mat-header-cell *matHeaderCellDef>Severity</th>
//         <td class="text-center" mat-cell *matCellDef="let vuln">{{ vuln.severity }}</td>
//       </ng-container> -->

//    <ng-container matColumnDef="severity">
//   <th class="text-center" mat-header-cell *matHeaderCellDef>Severity</th>
//   <td class="text-center" mat-cell *matCellDef="let vuln">
//     <span [ngClass]="{
//       'severity-critical': vuln.severity.toLowerCase() === 'critical',
//       'severity-high': vuln.severity.toLowerCase() === 'high',
//       'severity-medium': vuln.severity.toLowerCase() === 'medium',
//       'severity-low': vuln.severity.toLowerCase() === 'low'
//     }">{{ vuln.severity }}</span>
//   </td>
// </ng-container>

//       <ng-container matColumnDef="cvssScore">
//         <th class="text-center" mat-header-cell *matHeaderCellDef>CVSS Score</th>
//         <td class="text-center" mat-cell *matCellDef="let vuln">{{ vuln.cvssScore }}</td>
//       </ng-container>

//       <tr mat-header-row *matHeaderRowDef="vulnDisplayedColumns" class=""></tr>
//       <tr mat-row *matRowDef="let row; columns: vulnDisplayedColumns;"></tr>
//     </table>
    
//   </ng-container>

//   <ng-template #noVulnerabilities>
//     <p>No vulnerabilities found</p>
//   </ng-template>
// </mat-dialog-content>
//   `,
//   styles: [`
// .dialog-scroll {
//   max-height: 500px;
//   overflow-y: auto;
//   min-width: 800px;
//   display: block;
//   position: relative;
//   padding: 0;
// }

// /* Sticky Header + Buttons */
// .severity-header {
//   position: sticky;
//   top: 0;
//   z-index: 10;
//   background-color: white;
//   border-bottom: 1px solid #ccc;
// }

// /* Top header layout */
// .severity-header > .d-flex {
//   padding: 12px;
//   border-bottom: 1px solid #e0e0e0;
// }

// /* Severity Buttons */
// .severity-buttons {
//   display: flex;
//   gap: 8px;
//   padding: 8px 12px;
// }

// .severity-btn {
//   flex: 1;
//   font-size: 12px;
//   padding: 6px 8px;
//   font-family: Roboto, "Helvetica Neue", sans-serif;
// }
// .severity-btn.critical  { background-color: #F26419; color: white; }
// .severity-btn.high    { background-color: #F6AE2D; color: black; }
// .severity-btn.medium  { background-color: #86BBD8; color: black; }
// .severity-btn.low     { background-color: #33658A; color: white; }

// // .severity-btn.critical :hover, .severity-btn.critical:focus { background-color: #F26419; color: white; }
// // .severity-btn.high    :hover, .severity-btn.high:focus { background-color: #F6AE2D; color: black; }
// // .severity-btn.medium  :hover, .severity-btn.medium:focus { background-color: #86BBD8; color: black; }
// // .severity-btn.low     :hover, .severity-btn.low:focus { background-color: #33658A; color: white; }
// .vuln-software{
//   color: #F26419;
// }

// /* Table styling */
// .comp-table {
//   width: 100%;
//   table-layout: fixed;
//   border-collapse: collapse;
// }
// .comp-table th, .comp-table td {
//   padding: 8px;
//   font-family: Roboto, "Helvetica Neue", sans-serif;
//   word-break: break-word;
// }
// .comp-table tbody tr:nth-child(odd) {
//   background-color: #f9f9f9;
// }
// .comp-table tr:hover {
//   background-color: #f1f1f1;
// }

// /* Sticky Table Headers */
// .comp-table th {
//   background-color: #d7d7d7ff;
//   color: black;
//   font-weight: bold;
//   position: sticky;
//   top: 109.5px; /* height of header (40px) + buttons (52px) */
//   z-index: 5;
//   text-align: left;
// }

// /* Empty message */
// p {
//   text-align: center;
//   color: #888;
//   padding: 16px;
// }
// .severity-critical {
//   background-color: #F26419;
//   color: white;
//   padding: 6px 12px;
//   border-radius: 3px;
// }
// .severity-high {
//   background-color: #F6AE2D;
//   color: black;
//   padding: 6px 12px;
//   border-radius: 3px;
// }
// .severity-medium {
//   background-color: #86BBD8;
//   color: black;
//   padding: 6px 12px;
//   border-radius: 3px;
// }
// .severity-low {
//   background-color: #33658A;
//   color: white;
//   padding: 6px 12px;
//   border-radius: 3px;
// }
//   `]
// })
// export class VulnerabilityDialogComponent {
//   vulnDisplayedColumns: string[] = ['cveId', 'description', 'severity', 'cvssScore'];
//     filteredVulnerabilities: Vulnerability[] = [];
//       selectedSeverity: 'Critical' | 'High' | 'Medium' | 'Low' | null = null;

//   constructor(
//     public dialogRef: MatDialogRef<VulnerabilityDialogComponent>,
//     @Inject(MAT_DIALOG_DATA) public data: { softwareName: string; vulnerabilities: Vulnerability[]; severityCounts: { critical: number; high: number; medium: number; low: number } }
//   ) {
//     this.filteredVulnerabilities = this.data.vulnerabilities; // Initialize with all vulnerabilities
//   }

  
//   filterVulnerabilities(severity: 'Critical' | 'High' | 'Medium' | 'Low' | null): void {
//     this.selectedSeverity = severity;
//     if (!severity) {
//       this.filteredVulnerabilities = this.data.vulnerabilities;
//     } else {
//       this.filteredVulnerabilities = this.data.vulnerabilities.filter(vuln =>
//         vuln.severity.toLowerCase() === severity.toLowerCase()
//       );
//     }
//     console.log('Filtered vulnerabilities:', this.filteredVulnerabilities); // Debug log
//   }
// }

