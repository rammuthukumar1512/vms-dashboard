import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
// import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SharedDataService } from '../../core/services/shared-data.service';
import { ApplicationDetails, Vulnerability } from '../../models/computer.model';
import { Chart, PieController, ArcElement, Tooltip, Legend, BarController, BarElement, CategoryScale, LinearScale } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Inject } from '@angular/core';
// import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';


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
  appChartInstance: Chart<'pie'> | undefined;
  severityChartInstance: Chart<'bar'> | undefined;
  appData: ApplicationDetails[] = [];
  vulnerableSoftwareCount: number = 0;
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
        this.calculateSeverityCounts();
      } else {
        this.appData = [];
        this.vulnerableSoftwareCount = 0;
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

  drawAppChart(): void {
    if (!this.appChart?.nativeElement) return;
    const ctx = this.appChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.appChartInstance) {
      this.appChartInstance.destroy();
    }

    if (this.appData.length === 0) {
      this.appChartInstance = new Chart(ctx, {
        type: 'pie',
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
              font: { size: 14, family: 'Roboto, "Helvetica Neue", sans-serif' },
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
      type: 'pie',
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
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              font: { size: 14, family: 'Roboto, "Helvetica Neue", sans-serif' }
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
              size: 14
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
            title: { display: true, text: 'Count' }
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
            font: { weight: 'bold', size: 12 },
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
      // width: '600px',
      // maxHeight: '80vh',
      panelClass: 'vuln-dialog-panel', // Custom class for styling (optional)

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

@Component({
  selector: 'app-vulnerability-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatTableModule, MatCardModule],
  template: `
<h2 mat-dialog-title>Vulnerabilities for {{ data.softwareName }}</h2>

<mat-dialog-content class="dialog-scroll">
  <!-- Sticky Buttons -->
  <div class="severity-header">
    <div class="severity-buttons">
      <button mat-raised-button class="severity-btn critical">
        Critical: {{ data.severityCounts.critical }}
      </button>
      <button mat-raised-button class="severity-btn high">
        High: {{ data.severityCounts.high }}
      </button>
      <button mat-raised-button class="severity-btn medium">
        Medium: {{ data.severityCounts.medium }}
      </button>
      <button mat-raised-button class="severity-btn low">
        Low: {{ data.severityCounts.low }}
      </button>
    </div>
  </div>

  <!-- Table -->
  <ng-container *ngIf="data.vulnerabilities.length; else noVulnerabilities">
    <table mat-table [dataSource]="data.vulnerabilities" class="comp-table">
      <ng-container matColumnDef="cveId">
        <th  mat-header-cell *matHeaderCellDef>CVE ID</th>
        <td mat-cell *matCellDef="let vuln">{{ vuln.cveId }}</td>
      </ng-container>

      <ng-container matColumnDef="description">
        <th mat-header-cell *matHeaderCellDef>Description</th>
        <td mat-cell *matCellDef="let vuln">{{ vuln.description }}</td>
      </ng-container>

      <ng-container matColumnDef="severity">
        <th class = "text-center" mat-header-cell *matHeaderCellDef>Severity</th>
        <td class = "text-center" mat-cell *matCellDef="let vuln">{{ vuln.severity }}</td>
      </ng-container>

      <ng-container matColumnDef="cvssScore">
        <th class = "text-center" mat-header-cell *matHeaderCellDef>CVSS Score</th>
        <td class = "text-center" mat-cell *matCellDef="let vuln">{{ vuln.cvssScore }}</td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="vulnDisplayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: vulnDisplayedColumns;"></tr>
    </table>
  </ng-container>

  <ng-template #noVulnerabilities>
    <p>No vulnerabilities found</p>
  </ng-template>
</mat-dialog-content>

<mat-dialog-actions>
  <button mat-button mat-dialog-close>Close</button>
</mat-dialog-actions>


  `,
  styles: [
    `
      // .comp-table {
      //   width: 100%;
      //   table-layout: fixed;
      //   border-collapse: collapse;
      // }
      // .comp-table th,
      // td {
      //   padding: 8px;
      //   font-family: Roboto, "Helvetica Neue", sans-serif;
      // }
      // .comp-table thead tr > th {
      //   text-wrap: nowrap;
      //   background-color: #007bff !important;
      //   color: white;
      //   font-weight: bold;
      //   position: sticky;
      //   top: 0;
      //   z-index: 10;
      // }
      // .comp-table td {
      //   text-align: left;
      //   word-break: break-word;
      // }
      // .comp-table tbody tr:nth-child(odd) {
      //   background-color: #eee;
      // }
      // .comp-table tr:hover {
      //   background-color: #f5f5f5;
      // }
      // .mb-2 {
      //   margin-bottom: 8px;
      // }
      // .gap-2 {
      //   gap: 8px;
      // }
      // p {
      //   text-align: center;
      //   color: #666;
      //   font-family: Roboto, "Helvetica Neue", sans-serif;
      // }
      // .severity-btn {
      //   min-width: 80px;
      //   line-height: 20px;
      //   padding: 6px 8px;
      //   font-size: 12px;
      //   font-family: Roboto, "Helvetica Neue", sans-serif;
      // }

//       .severity-header {
//   position: sticky;
//   top: 0;
//   z-index: 100;
//   border-bottom: 1px solid #ccc;
// }
// .dialog-scroll {
//   max-height: 400px;
//   min-width: 800px;
//   overflow-y: auto;
// }

// .severity-header {
//   position: sticky;
//   top: 0;
//   z-index: 10;
//   background-color: white;
//   padding: 8px;
//   border-bottom: 1px solid #ccc;
// }
// .dialog-scroll {
//   max-height: 400px;
//   min-width: 800px;
//   overflow-y: auto;
//   display: flex;
//   flex-direction: column;
// }

// .severity-header {
//   position: sticky;
//   top: 0;
//   z-index: 10;
//   background-color: white;
//   padding: 8px;
//   border-bottom: 1px solid #ccc;
// }

// .comp-table {
//   width: 100%;
//   table-layout: fixed;
//   border-collapse: collapse;
// }
// .comp-table th,
// td {
//   padding: 8px;
//   font-family: Roboto, "Helvetica Neue", sans-serif;
// }
// .comp-table thead tr > th {
//   text-wrap: nowrap;
//   background-color: #007bff !important;
//   color: white;
//   font-weight: bold;
//   position: sticky;
//   top: 56px; /* height of severity header (adjust if needed) */
//   z-index: 9;
// }

// .dialog-scroll {
//   max-height: 400px;
//   min-width: 800px;
//   overflow-y: auto;
//   display: flex;
//   flex-direction: column;
//   position: relative;
// }

// /* Sticky severity header (buttons) */
// .severity-header {
//   position: sticky;
//   top: 0;
//   z-index: 20;
//   background-color: white;
//   padding-bottom: 8px;
//   border-bottom: 1px solid #ccc;
// }

// /* Sticky table headers just below buttons */
// .comp-table thead tr > th {
//   background-color: #007bff !important;
//   color: white;
//   font-weight: bold;
//   position: sticky;
//   top: 56px; /* height of the severity buttons container */
//   z-index: 10;
// }

// /* General table styling */
// .comp-table {
//   width: 100%;
//   table-layout: fixed;
//   border-collapse: collapse;
// }
// .comp-table th, .comp-table td {
//   padding: 8px;
//   font-family: Roboto, "Helvetica Neue", sans-serif;
// }
// .comp-table tbody tr:nth-child(odd) {
//   background-color: #eee;
// }
// .comp-table tr:hover {
//   background-color: #f5f5f5;
// }

// .severity-btn {
//   min-width: 80px;
//   line-height: 20px;
//   padding: 6px 8px;
//   font-size: 12px;
//   font-family: Roboto, "Helvetica Neue", sans-serif;
// }

// p {
//   text-align: center;
//   color: #666;
//   font-family: Roboto, "Helvetica Neue", sans-serif;
// }

// .gap-2 {
//   gap: 8px;
// }
// .dialog-scroll {
//   max-height: 400px;
//   overflow-y: auto;
//   min-width: 800px;
//   display: block;
//   position: relative;
// }

// /* Sticky Buttons Container */
// .severity-header {
//   position: sticky;
//   top: 0;
//   z-index: 20;
//   background-color: #fff;
//   border-bottom: 1px solid #ccc;
// }

// /* Button Flex Layout */
// .severity-buttons {
//   display: flex;
//   gap: 8px;
//   padding: 8px;
// }

// /* Button Styling */
// .severity-btn {
//   flex: 1;
//   font-size: 12px;
//   padding: 6px 8px;
//   font-family: Roboto, "Helvetica Neue", sans-serif;
// }

// .severity-btn.critical {
//   background-color: #F26419;
//   color: white;
// }
// .severity-btn.high {
//   background-color: #F6AE2D;
//   color: black;
// }
// .severity-btn.medium {
//   background-color: #86BBD8;
//   color: black;
// }
// .severity-btn.low {
//   background-color: #33658A;
//   color: white;
// }

// /* Table Styling */
// .comp-table {
//   width: 100%;
//   table-layout: fixed;
//   border-collapse: collapse;
// }
// .comp-table th,
// .comp-table td {
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
//   background-color: #007bff;
//   color: white;
//   font-weight: bold;
//   position: sticky;
//   top: 56px; /* height of sticky button section */
//   z-index: 10;
//   text-align: left;
// }

// /* Fallback message */
// p {
//   text-align: center;
//   color: #888;
//   padding: 16px;
//   font-family: Roboto, "Helvetica Neue", sans-serif;
// }

.dialog-scroll {
  max-height: 400px;
  overflow-y: auto;
  min-width: 800px;
  display: block;
  position: relative;
}

/* Sticky Buttons at top */
.severity-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: white;
  border-bottom: 1px solid #ccc;
}

.severity-buttons {
  display: flex;
  gap: 8px;
  padding: 8px;
}

/* Buttons */
.severity-btn {
  flex: 1;
  font-size: 12px;
  padding: 6px 8px;
  font-family: Roboto, "Helvetica Neue", sans-serif;
}
.severity-btn.critical { background-color: #F26419; color: white; }
.severity-btn.high { background-color: #F6AE2D; color: black; }
.severity-btn.medium { background-color: #86BBD8; color: black; }
.severity-btn.low { background-color: #33658A; color: white; }

/* Table styling */
.comp-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}
.comp-table th, .comp-table td {
  padding: 8px;
  font-family: Roboto, "Helvetica Neue", sans-serif;
  word-break: break-word;
}
.comp-table tbody tr:nth-child(odd) {
  background-color: #f9f9f9;
}
.comp-table tr:hover {
  background-color: #f1f1f1;
}

/* Sticky Table Headers */
.comp-table th {
  background-color: #d7d7d7ff;
  color: black;
  font-weight: bold;
  position: sticky;
  top: 53px; /* Height of sticky buttons section */
  z-index: 5;
  text-align: left;
}

/* Empty message */
p {
  text-align: center;
  color: #888;
  padding: 16px;
}

    `
  ]
})
export class VulnerabilityDialogComponent {
  vulnDisplayedColumns: string[] = ['cveId', 'description', 'severity', 'cvssScore'];
  constructor(
    public dialogRef: MatDialogRef<VulnerabilityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { softwareName: string; vulnerabilities: Vulnerability[]; severityCounts: { critical: number; high: number; medium: number; low: number } }
  ) {}
}