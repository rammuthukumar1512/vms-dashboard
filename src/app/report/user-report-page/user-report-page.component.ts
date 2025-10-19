import { ChangeDetectorRef, Component, ElementRef, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend, BarController, BarElement } from 'chart.js';
import { ToastService } from '../../core/services/toast.service';
import { ApplicationDetails, ComputerDetails,Vulnerability } from '../../models/computer.model';
import { HttpClient } from '@angular/common/http';
import { ApiEndPoints } from '../../../environments/api-endpoints';
import { HttpHeaders, HttpResponse, HttpErrorResponse } from '@angular/common/http';  
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApplicationResolveService } from '../../core/services/application-resolve.service';
import { VulnerabilityService } from '../../core/services/vulnerabilityService';
import { ReportState } from '../../core/services/vulnerabilityService'; // Adjust path if needed

// import { DUMMY_COMPUTER_DATA } from '../../core/data/dummy-data';

@Component({
  selector: 'app-user-report-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatSelectModule,
    MatTooltipModule,
    MatIconModule,
    MatSlideToggleModule,
    FormsModule,
    MatToolbarModule,
    MatCardModule
  ],
  templateUrl: './user-report-page.component.html',
  styleUrls: ['./user-report-page.component.css']
})
export class UserReportPageComponent implements OnInit, AfterViewInit {
   private destroy$ = new Subject<void>();

  @ViewChild('appChart') appChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('severityChart') severityChart!: ElementRef<HTMLCanvasElement>;
  // @ViewChild('appSeverityChart') appSeverityChart!: ElementRef<HTMLCanvasElement>;

  computer: ComputerDetails | null = null;
  appChartInstance: Chart<'doughnut'> | undefined;
  severityChartInstance: Chart<'bar'> | undefined;
  // appSeverityChartInstance: Chart<'bar'> | undefined;
  vulnerableCount: number = 0; // Add this property
  appData: ApplicationDetails[] = [];
  pagedAppData: ApplicationDetails[] = [];
  filteredAppData: ApplicationDetails[] = [];
  allApplications: ApplicationDetails[] = [];
  computerUuid: string = '';
  selectedApp: ApplicationDetails | null = null;
  filteredVulnerabilities: Vulnerability[] = [];
  vulnDisplayedColumns: string[] = ['cveId', 'severity'] ;
selectedVuln: Vulnerability | null = null; // Track the selected vulnerability

 severitySort: 'default' | 'asc' | 'desc' = 'default';
  // Top box fields
  machineName = 'Unknown';
  macAddress = '00:00:00:00:00:00';
  ipAddress = '0.0.0.0';
  serialNumber = 'Unknown';
  loggedInUserEmail = 'Unknown@example.com';
  loggedInUserName = 'Unknown';
  createdAt = '';
  updatedAt = '';

  // Table properties
  displayedColumns: string[] = ['softwareName', 'softwareVersion', 'vendor'];
recordIndex: number = 1;
pageIndex: number = 0;
pageSize: number = 5;
start = 0;
end = 0;
currentPageSize: number = this.pageSize;
totalPages: number = 0;
totalRecords: number[] = [];
pageSizes: number[] = [];
  searchValue = '';
  showVulnerableOnly = false;


  constructor(
    private http: HttpClient,
    private toastService: ToastService,
    private cdRef: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private applicationResolveService: ApplicationResolveService,
    private vulnerabilityService: VulnerabilityService

  ) {
    Chart.register(DoughnutController, ArcElement, Tooltip, Legend, BarController, BarElement);
  }
  
ngOnInit(): void {
    // Get computerUuid from route params
    this.route.params.subscribe(params => {
      this.computerUuid = params['computerUuid'];
      if (!this.computerUuid) {
        this.toastService.showErrorToast('No computer UUID provided in the URL.');
        return; 
      }
      this.applicationResolveService.setComputerUuid(this.computerUuid); 
      this.fetchComputerDetails();
    });
  }

// ngAfterViewChecked(): void {
//   if (this.selectedApp && !this.appSeverityChartInstance) {
//     this.drawSelectedAppSeverityChart();
//   }
// }
ngAfterViewInit(): void {
  this.drawAppChart();
  this.drawSeverityChart();
    this.cdRef.detectChanges();
    setTimeout(() => this.scrollToSelectedVulnerability(), 0); // Ensure DOM is ready

}

public fetchSecurityData(): void {
  const headers = new HttpHeaders({
    'Accept': 'application/json'
  });

  this.http.get<any>(ApiEndPoints.unique_url, { headers, observe: 'response' })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response: HttpResponse<any>) => {
        console.log('Sync response:', response.body);
        if (!response.body) {
          console.log('No content');
          // Optional: handle no content, e.g., show a toast or UI update
        } else {
          // this.toastService.showSuccessToast('Sync successful!');
          // If you want to update your UI with new data, add that here
          // For example, refresh computer details or other data:
          this.fetchComputerDetails();
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('HTTP Error:', error.status, error.message);
        this.toastService.showErrorToast('Sync failed. Please try again.');
      }
    });
}
fetchComputerDetails(): void {
    const url = ApiEndPoints.getComputerByUuid + this.computerUuid;
    this.http.get<ComputerDetails>(url).subscribe({
      next: (data) => {
        this.computer = data;
        this.machineName = data.machineName || 'Unknown';
        this.macAddress = data.macAddress || '00:00:00:00:00:00';
        this.ipAddress = data.ipAddress || '0.0.0.0';
        this.serialNumber = data.serialNumber || 'Unknown';
        this.loggedInUserEmail = data.loggedInUserEmail || 'Unknown@example.com';
        this.loggedInUserName = data.loggedInUserName || 'Unknown';
        this.appData = data.applicationDetails || [];
        this.allApplications = this.appData;
        this.updatePagedData(0);
        this.drawAppChart();
        this.drawSeverityChart();
        this.restoreStateAndSelect();
        this.cdRef.detectChanges();
        this.toastService.showSuccessToast('Computer details fetched successfully!');
      },
    error: (err) => {
      if (err.status === 0) {
        this.toastService.showErrorToast(
          'Unable to connect to the server. Please check your network or try again later.'
        );
      } else if (err.status === 404) {
        this.toastService.showErrorToast('Computer with the specified UUID was not found.');
      } else {
        this.toastService.showErrorToast('An unexpected error occurred. Please try again later.');
      }
      console.error(err);
    }
  });
  }

  // Add this new method to the class (this handles restoring state and selecting the app)
private restoreStateAndSelect(): void {
  const storedState = this.vulnerabilityService.getReportState();
  const selectedAppName = this.route.snapshot.queryParams['selectedApp'];
  const selectedVulnId = storedState?.selectedVuln; // Get the stored CVE ID
  let restored = false;

  if (storedState) {
    this.pageSize = storedState.pageSize;
    this.searchValue = storedState.searchValue;
    this.showVulnerableOnly = storedState.showVulnerableOnly;
    this.vulnerabilityService.clearReportState();
    this.updatePagedData(0); // Compute filteredAppData with restored filters

    if (selectedAppName) {
      const appIndex = this.filteredAppData.findIndex(app => app.softwareName === selectedAppName);
      if (appIndex !== -1) {
        const newPageIndex = Math.floor(appIndex / this.pageSize);
        this.pageIndex = newPageIndex;
        this.recordIndex = newPageIndex + 1;
        this.updatePagedData(newPageIndex);
        const appToSelect = this.pagedAppData.find(app => app.softwareName === selectedAppName);
        if (appToSelect) {
          this.viewSelectedVulnerableApplication(appToSelect);
          restored = true;
          // Restore the selected vulnerability if it exists
          if (selectedVulnId && appToSelect.vulnerabilities) {
            this.selectedVuln = appToSelect.vulnerabilities.find(vuln => vuln.cveId === selectedVulnId) || null;
          }
        }
      }
    }
  } else {
    this.updatePagedData(0); // Default pagination
  }

  if (!restored) {
    if (this.pagedAppData.length > 0) {
      this.viewSelectedVulnerableApplication(this.pagedAppData[0]);
    }
  }
  setTimeout(() => this.scrollToSelectedVulnerability(), 0);
}
scrollToSelectedVulnerability(): void {
  if (this.selectedVuln) {
    const tableRows = document.querySelectorAll('.vuln-table-container table tr[mat-row]');
    tableRows.forEach((row, index) => {
      const cveIdCell = row.querySelector('td:first-child span');
      if (cveIdCell && cveIdCell.textContent === this.selectedVuln?.cveId) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }
}
  // drawAppChart(): void {
  //   if (!this.appChart?.nativeElement) {
  //     return;
  //   }
  //   const ctx = this.appChart.nativeElement.getContext('2d');
  //   if (!ctx) {
  //     return;
  //   }
  //   if (this.appChartInstance) this.appChartInstance.destroy();

  //    this.vulnerableCount = this.appData.filter(app => 
  //     app.criticalVulnerabilityCount + app.highVulnerabilityCount + app.mediumVulnerabilityCount + app.lowVulnerabilityCount > 0
  //   ).length;
  //   const nonVulnerableCount = this.appData.length - this.vulnerableCount;
  //   const isDataFetched = this.appData.length > 0;

  //   this.appChartInstance = new Chart(ctx, {
  //     type: 'doughnut',
  //     data: {
  //       labels: isDataFetched ? ['Vulnerable', 'Non-Vulnerable'] : [""],
  //       datasets: [{
  //         data: isDataFetched ? [this.vulnerableCount, nonVulnerableCount] : [1, 1],
  //         backgroundColor: isDataFetched ? ['#66b3ffea', '#3366ffe7'] : ['#d3d3d3'],
  //         borderColor: ['#ffffff', '#ffffff'],
  //         borderWidth: 0
  //       }]
  //     },
  //     options: {
  //       indexAxis: 'y',
  //       responsive: true,
  //       maintainAspectRatio: false,
  //       cutout: '50%',
  //       scales: {
  //         x: {
  //           position: 'top', 
  //           beginAtZero: false,
  //           title: {
  //             display: true,
  //             // text: 'Score'
  //           },
  //           grid: {
  //             display: false
  //           },
  //           ticks: {
  //             display: false
  //           },
  //           border: {
  //             display: false
  //           }
  //         },
  //         y: {
  //           title: {
  //             display: true,
  //             // text: 'Applications'
  //           },
  //           grid: {
  //             display: false
  //           },
  //           ticks: {
  //             display: false
  //           },
  //           border: {
  //             display: false
  //           }
  //         }
  //       },
  //       plugins: {
  //         legend: { display: isDataFetched, position: 'bottom' },
  //         tooltip: {
  //           callbacks: {  title: () => "Risk Status",
  //             label: (context) => { 
  //               return isDataFetched ? `${context.label}: ${context.parsed || 0} applications` : 'No Data';
  //             }
  //           }
  //         },
  //          datalabels: {
  //         formatter: (value, context) => {
  //           if(value>0){
  //           const data = context.chart.data.datasets[0].data as number[];
  //           const total = data.reduce((sum, val) => sum + val, 0);
  //           return total > 0 ? ((value / total) * 100).toFixed(0) + '%' : '';
  //           // if(isDataFetched) return total ? ((value / total) * 100).toFixed(0) + '%' : '0%';
  //           // else return '';
  //         }
  //         return '';
  //         },
  //         color: '#ffffff',
  //         font: { weight: 'bold', size: 12 }
  //       }
  //       }
  //     }
  //   });
  // }
  drawAppChart(): void {
  if (!this.appChart?.nativeElement) {
    return;
  }
  const ctx = this.appChart.nativeElement.getContext('2d');
  if (!ctx) {
    return;
  }
  if (this.appChartInstance) this.appChartInstance.destroy();

  this.vulnerableCount = this.appData.filter(app => 
    app.criticalVulnerabilityCount + app.highVulnerabilityCount + app.mediumVulnerabilityCount + app.lowVulnerabilityCount > 0
  ).length;
  const nonVulnerableCount = this.appData.length - this.vulnerableCount;
  const isDataFetched = this.appData.length > 0;

  // Define the leader line plugin
  const leaderLinePlugin = {
    id: 'leaderLinePlugin',
    afterDatasetDraw(chart: any) {
      const {
        ctx,
        chartArea: { top, bottom, left, right },
      } = chart;

      const meta = chart.getDatasetMeta(0);
      const centerX = (left + right) / 2;
      const centerY = (top + bottom) / 2;

      const data = chart.data.datasets[0].data;
      const total = data[0] + data[1];
      const vulnerablePercentage = (data[0] / total) * 100;
      const nonVulnerablePercentage = (data[1] / total) * 100;

      meta.data.forEach((arc: any, index: number) => {
        const value = data[index];
      if (value === 0 || !chart.getDataVisibility(index)) return; // Skip hidden arcs properly

        let angle = (arc.startAngle + arc.endAngle) / 2;
        const radius = arc.outerRadius;

        // Angle adjustments
        if (index === 0) {
          if (vulnerablePercentage > 10 && vulnerablePercentage <= 20) angle += 0.3;
          else if (vulnerablePercentage >= 20 && vulnerablePercentage < 30) angle += 0.2;
          else if (vulnerablePercentage >= 30 && vulnerablePercentage < 40) angle -= 0.6;
          else if (vulnerablePercentage >= 40 && vulnerablePercentage < 50) angle -= 0.7;
          else if (vulnerablePercentage >= 50 && vulnerablePercentage < 100) angle = 0.7;
          else if (vulnerablePercentage === 100) angle -= 0.7;
          else if (vulnerablePercentage === 0) angle += 0.3;
        } else if (index === 1) {
          if (nonVulnerablePercentage > 10 && nonVulnerablePercentage < 20) angle -= 0.3;
          else if (nonVulnerablePercentage >= 20 && nonVulnerablePercentage < 40) angle -= 0.1;
          else if (nonVulnerablePercentage >= 40 && nonVulnerablePercentage < 50) angle += 0.6;
          else if (nonVulnerablePercentage >= 50 && nonVulnerablePercentage < 70) angle -= 0.6;
          else if (nonVulnerablePercentage >= 70 && nonVulnerablePercentage <= 90) angle += 0.6;
          else if (nonVulnerablePercentage >= 90 && nonVulnerablePercentage < 100) angle += 0.6;
          else if (nonVulnerablePercentage === 100) angle += 0.8;
          else if (nonVulnerablePercentage === 0) angle -= 0.3;
        }

        // Leader line start at arc edge
        const startX = centerX + Math.cos(angle) * radius;
        const startY = centerY + Math.sin(angle) * radius;

        const lineLength = 25;
        const horizOffset = 10;

        const lineEndX = centerX + Math.cos(angle) * (radius + lineLength);
        const lineEndY = centerY + Math.sin(angle) * (radius + lineLength);

        let labelX: number;
        let labelY: number;
        const isRightSide = Math.cos(angle) >= 0;

        labelX = lineEndX + (isRightSide ? horizOffset : -horizOffset);
        labelY = lineEndY;

        // Draw dashed leader line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(lineEndX, lineEndY);
        ctx.lineTo(labelX, labelY);
        ctx.strokeStyle = 'gray';
        ctx.lineWidth = 1;
        ctx.setLineDash([7, 3]);
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash for other elements

        // Draw value label
        const chartWidth = right - left;
        ctx.font = `${Math.max(10, chartWidth * 0.03)}px sans-serif`;
        ctx.fillStyle = '#333';
        ctx.textAlign = isRightSide ? 'left' : 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(value, labelX, labelY);
      });
    }
  };

  this.appChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: isDataFetched ? ['Vulnerable', 'Non-Vulnerable'] : [''],
      datasets: [{
        data: isDataFetched ? [this.vulnerableCount, nonVulnerableCount] : [1, 1],
        backgroundColor: isDataFetched ? ['#66b3ffea', '#3366ffe7'] : ['#d3d3d3'],
        borderColor: ['#ffffff', '#ffffff'],
        borderWidth: 0
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      cutout: '50%',
      scales: {
        x: {
          position: 'top',
          beginAtZero: false,
          title: {
            display: true,
            // text: 'Score'
          },
          grid: {
            display: false
          },
          ticks: {
            display: false
          },
          border: {
            display: false
          }
        },
        y: {
          title: {
            display: true,
            // text: 'Applications'
          },
          grid: {
            display: false
          },
          ticks: {
            display: false
          },
          border: {
            display: false
          }
        }
      },
      plugins: {
        legend: { display: isDataFetched, position: 'bottom' },
        tooltip: {
          callbacks: {
            title: () => 'Risk Status',
            label: (context) => {
              return isDataFetched ? `${context.label}: ${context.parsed || 0} applications` : 'No Data';
            }
          }
        },
        datalabels: {
          formatter: (value, context) => {
            if (value > 0) {
              const data = context.chart.data.datasets[0].data as number[];
              const total = data.reduce((sum, val) => sum + val, 0);
              return total > 0 ? ((value / total) * 100).toFixed(0) + '%' : '';
            }
            return '';
          },
          color: '#ffffff',
          font: { weight: 'bold', size: 12 }
        }
      }
    },
    plugins: isDataFetched ? [leaderLinePlugin] : []
  });
}

  drawSeverityChart(): void {
    if (!this.severityChart?.nativeElement) {
      console.error('severityChart element not found');
      return;
    }
    const ctx = this.severityChart.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('Canvas context not available');
      return;
    }
    if (this.severityChartInstance) this.severityChartInstance.destroy();

    const criticalCount = this.appData.reduce((sum, app) => sum + app.criticalVulnerabilityCount, 0);
    const highCount = this.appData.reduce((sum, app) => sum + app.highVulnerabilityCount, 0);
    const mediumCount = this.appData.reduce((sum, app) => sum + app.mediumVulnerabilityCount, 0);
    const lowCount = this.appData.reduce((sum, app) => sum + app.lowVulnerabilityCount, 0);

    this.severityChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Critical', 'High', 'Medium', 'Low'],
        datasets: [{
          label: 'Vulnerability Count',
          data: [criticalCount, highCount, mediumCount, lowCount],
         backgroundColor: ['#F26419', '#F6AE2D','#33658A','#86BBD8'],
          borderRadius: 3,
          barPercentage:0.9
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio:false,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Severity Type',
              color: '#4f4c4cff'
            },
            ticks: { color: '#4f4c4cff' },  
             grid: {
               display: false // ✅ This hides the vertical grid lines
                   }
          },
          y: {
            min: 0,
            ticks: {
              stepSize: 1,
              color: '#716767ff'
            },
            title: {
              display: true,
              text: 'Number of Vulnerabilities',
              color: '#4f4c4cff'
            },grace: '20%',
            grid: { display: false}
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {  title: () => "Severity",
              label: (context) => `${context.label}: ${context.parsed.y} vulnerabilities`
            }
          },
          datalabels:{
            anchor: 'end',
            align: 'end'
          }
        }
      }
    });
  }

  updatePagedData(initialIndex: number): void {
  this.filteredAppData = this.getFilteredApps();

  if (this.searchValue) {
    const keyword = this.searchValue.toLowerCase();
    this.filteredAppData = this.filteredAppData.filter(app =>
      app.softwareName?.toLowerCase().includes(keyword) ||
      app.softwareVersion?.toLowerCase().includes(keyword) ||
      app.vendor?.toLowerCase().includes(keyword)
    );
  }

  const totalItems = this.filteredAppData.length;
  console.log('Filtered apps count:', totalItems);  // <--- check this

  // Dynamically set page sizes
  this.pageSizes = totalItems >= 100 ? [5, 10, 25, 50, 100] :
                   totalItems >= 50  ? [5, 10, 25, 50] :
                   totalItems >= 25  ? [5, 10, 25] :
                   totalItems >= 10  ? [5, 10] :
                   totalItems > 0    ? [5] : [0];
                   // Ensure selected pageSize is within the available sizes
  if (!this.pageSizes.includes(this.pageSize)) {
    this.pageSize = this.pageSizes.length > 0 ? this.pageSizes[0] : 5;
  }

  this.totalPages = Math.ceil(totalItems / this.pageSize);
  this.totalRecords = Array.from({ length: this.totalPages }, (_, i) => i + 1);

  this.start = initialIndex * this.pageSize;
  this.end = this.start + this.pageSize;
  this.pagedAppData = this.filteredAppData.slice(this.start, this.end);
  console.log('Paged apps:', this.pagedAppData);  // <--- check if this has data
  this.cdRef.detectChanges();
}
  
toggleSeveritySort(): void {
  // Cycle through sort states: default -> asc -> desc -> default
  if (this.severitySort === 'default') {
    this.severitySort = 'asc';
  } else if (this.severitySort === 'asc') {
    this.severitySort = 'desc';
  } else {
    this.severitySort = 'default';
  }

  // Sort vulnerabilities based on severity
  if (this.severitySort !== 'default' && this.selectedApp?.vulnerabilities) {
    this.filteredVulnerabilities = [...this.selectedApp.vulnerabilities].sort((a, b) => {
      const severityOrder: { [key: string]: number } = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1
      };
      const aSeverity = severityOrder[a.severity.toLowerCase()] || 0;
      const bSeverity = severityOrder[b.severity.toLowerCase()] || 0;

      return this.severitySort === 'asc'
        ? aSeverity - bSeverity
        : bSeverity - aSeverity;
    });
  } else {
    // Reset to original order when default
    this.filteredVulnerabilities = this.selectedApp?.vulnerabilities
      ? [...this.selectedApp.vulnerabilities]
      : [];
  }

  this.cdRef.detectChanges(); // Trigger change detection
}
  getFilteredApps(): ApplicationDetails[] {
    let data = this.allApplications;
    if (this.showVulnerableOnly) {
      data = data.filter(app =>
        app.criticalVulnerabilityCount + app.highVulnerabilityCount + app.mediumVulnerabilityCount + app.lowVulnerabilityCount > 0
      );
    }
    if (this.searchValue) {
      const keyword = this.searchValue.toLowerCase();
      data = data.filter(app =>
        app.softwareName?.toLowerCase().includes(keyword) ||
        app.softwareVersion?.toLowerCase().includes(keyword) ||
        (app.vendor || '').toLowerCase().includes(keyword)
      );
    }
    return data;
  }

  toggleVulnerableOnly(): void {
    this.showVulnerableOnly = !this.showVulnerableOnly;
    this.pageIndex = 0;
    this.updatePagedData(0);
  }

  getLastSyncDate(): string {
  const lastSync = this.computer?.updatedAt ?? this.computer?.createdAt;
  if (!lastSync) return 'N/A';

  const date = new Date(lastSync);

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
  const year = date.getFullYear();

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  return `${day}-${month}-${year} | ${hours}:${minutes}:${seconds}`;
}


  getPage(page: number): void {
  this.pageIndex = page - 1;
  this.recordIndex = page;
  this.updatePagedData(this.pageIndex);
}

nextPage(): void {
  if (this.pageIndex < this.totalPages - 1) {
    this.pageIndex++;
    this.recordIndex = this.pageIndex + 1;
    this.updatePagedData(this.pageIndex);
  }
}

previousPage(): void {
  if (this.pageIndex > 0) {
    this.pageIndex--;
    this.recordIndex = this.pageIndex + 1;
    this.updatePagedData(this.pageIndex);
  }
}

onPageSizeChange(event: number): void {
  this.pageSize = event;
  const pages = Math.ceil(this.filteredAppData.length / this.pageSize);
  this.totalPages = pages;
  this.totalRecords = Array.from({ length: pages }, (_, i) => i + 1);
  this.pageIndex = 0;
  this.recordIndex = this.pageIndex + 1;
  this.updatePagedData(this.pageIndex);
}


  searchApplications(event: Event): void {
    this.searchValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.pageIndex = 0;
    this.updatePagedData(0);
  }

  viewVulnerabilities(app: ApplicationDetails): void {
    this.viewSelectedVulnerableApplication(app);
  }

// viewSelectedVulnerableApplication(app: ApplicationDetails): void {
//   this.selectedApp = app;
//   this.cdRef.detectChanges(); 
//   setTimeout(() => this.drawSelectedAppSeverityChart(), 0);
// }
viewSelectedVulnerableApplication(app: ApplicationDetails): void {
    this.selectedApp = app;
    this.filteredVulnerabilities = app.vulnerabilities || [];
    this.selectedVuln = null;
     const severitySection = document.querySelector('.severity-section');
    if (severitySection) {
      severitySection.classList.add('blink');
      setTimeout(() => {
        severitySection.classList.remove('blink');
      }, 1000);
    }
    this.cdRef.detectChanges();
  }

showVulnerabilityMetrics(cveId: string): void {
  this.vulnerabilityService.setReportState({
  pageSize: this.pageSize,
  searchValue: this.searchValue,
  showVulnerableOnly: this.showVulnerableOnly,
  selectedVuln: cveId // Add this to store the selected CVE ID
});
    // this.router.navigate([`vulnerability/metrics/user/report/cve/${cveId}`]);
  const queryParams = this.selectedApp ? { selectedApp: this.selectedApp.softwareName } : {};
  sessionStorage.setItem('previousUrl', this.router.url);
  // sessionStorage.setItem('selectedComputerUuid', this.computerUuid);
  this.router.navigate([`/vulnerability/metrics/user/report/cve/${cveId}`], { queryParams, state: { computerUuid: this.computerUuid } });
  }

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}

}
