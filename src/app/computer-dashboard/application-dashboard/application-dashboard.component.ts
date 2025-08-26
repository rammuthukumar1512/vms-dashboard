import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { SharedDataService } from '../../core/services/shared-data.service';
import { VulnerabilityDialogComponent } from './vulnerability-dialog.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BarController, Chart, LinearScale } from 'chart.js';
 import { ApplicationDetails, ComputerDetails } from '../../models/computer.model';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../core/services/toast.service';
import { environments } from '../../../environments/environments';

// Register Chart.js components

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
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './application-dashboard.component.html',
  styleUrls: ['./application-dashboard.component.css']
})
export class ApplicationDashboardComponent implements AfterViewInit {
    private destroy$ = new Subject<void>();

  @ViewChild('appChart') appChart: ElementRef<HTMLCanvasElement> | undefined;
  @ViewChild('severityChart') severityChart: ElementRef<HTMLCanvasElement> | undefined;
 @ViewChild('notificationConfirmDialog') notificationConfirmDialog!: TemplateRef<any>; // Add template reference

  appChartInstance: Chart<'doughnut'> | undefined;
  severityChartInstance: Chart<'bar'> | undefined;
lastResolvedApp: Partial<ApplicationDetails> | null = null;
computer: ComputerDetails | null = null;

  appData: ApplicationDetails[] = [];

  vulnerableSoftwareCount = 0;
  machineName = 'Unknown';
  loggedInUser = 'Unknown';
 activeFilter: 'Critical' | 'High' | 'Medium' | 'Low' | null = null; // Track active filter
  displayedColumns: string[] = ['softwareName', 'softwareVersion', 'vendor'];

  severityFilter: 'Critical' | 'High' | 'Medium' | 'Low' | null = null;
  severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };

  pageIndex = 0;
  pageSize = 5;
  pageSizes: number[] = [];
  recordIndex = 1;
  totalPages = 0;
  totalRecords: number[] = [];
  start = 0;
  end = 0;
  initialIndex = 0;
  pagedAppData: any[] = [];
  filteredAppData: any[] = [];
  allApplications: any[] = []; // or whatever type it holds

  searchValue: string = ''; // make sure this is kept updated by your search input
dialogRef!: MatDialogRef<any>; // Add dialog reference

constructor(
  private sharedDataService: SharedDataService,
  private dialog: MatDialog,
  private http: HttpClient,
  private cdRef: ChangeDetectorRef,
  private toastService: ToastService,

) {}

ngOnInit(): void {
  this.sharedDataService.currentData$
    .pipe(takeUntil(this.destroy$))
    .subscribe(data => {
      console.log('Received appData in ApplicationDashboard:', data);

      if (data) {
        this.loggedInUser = data.loggedInUser || 'Unknown';
        this.machineName = data.machineName || 'Unknown';

        if (data?.appData && Array.isArray(data.appData)) {
     const sortedData = data.appData.sort((a: ApplicationDetails, b: ApplicationDetails) => {
            const aVulns = a.criticalVulnerabilityCount + a.highVulnerabilityCount + a.mediumVulnerabilityCount + a.lowVulnerabilityCount;
            const bVulns = b.criticalVulnerabilityCount + b.highVulnerabilityCount + b.mediumVulnerabilityCount + b.lowVulnerabilityCount;
            return bVulns - aVulns;
          });

          this.appData = sortedData;
          this.allApplications = sortedData;
          this.vulnerableSoftwareCount = data.vulnerableSoftwareCount || 0;
          this.calculateSeverityCounts();
        } else {
          console.warn('No valid appData received:', data);
          this.appData = [];
          this.vulnerableSoftwareCount = 0;
          this.loggedInUser = 'Unknown';
          this.machineName = 'Unknown';
          this.severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
        }

        this.updatePagedData(this.initialIndex);
        this.cdRef.detectChanges();

        setTimeout(() => {
          this.drawAppChart();
          this.drawSeverityChart();
          this.cdRef.detectChanges();
        }, 0);
      }
    });
}


  ngAfterViewInit(): void {
  const lastResolvedApp = localStorage.getItem('lastResolvedApp');
  if (lastResolvedApp) {
    const appData = JSON.parse(lastResolvedApp);
    const app = this.appData.find(a => a.softwareName === appData.softwareName && a.uuid === appData.uuid);
    if (app) {
      this.showVulnerabilities(app);
      localStorage.removeItem('lastResolvedApp');
    }
  }

// Restore page state
  const savedState = JSON.parse(localStorage.getItem('currentDashboardState') || '{}');
  if (savedState.pageIndex) {
    this.pageIndex = parseInt(savedState.pageIndex, 10);
    this.recordIndex = parseInt(savedState.recordIndex, 10);
    this.updatePagedData(this.pageIndex);
  }
  localStorage.removeItem('currentDashboardState'); // Clean up after restore
}


  calculateSeverityCounts(): void {
    this.severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    this.appData.forEach(app => {
      this.severityCounts.critical += app.criticalVulnerabilityCount;
      this.severityCounts.high += app.highVulnerabilityCount;
      this.severityCounts.medium += app.mediumVulnerabilityCount;
      this.severityCounts.low += app.lowVulnerabilityCount;
    });
  }

  public sendAppData(data: ComputerDetails | null , computerId: number): void {
      // this.selectedComputerId = computerId;
  this.computer = data;

  // // Reset filters in Application Dashboard
this.pageSize = 5;
this.pageIndex = 0;
this.recordIndex = 1;
this.updatePagedData(this.pageIndex);

    const appData = {
      machineName: data?.machineName || 'Unknown',
      loggedInUser: data?.loggedInUser || 'Unknown',
      vulnerableSoftwareCount: data?.vulnerableSoftwareCount || 0,
      appData: data?.applicationDetails || []
    };
    console.log('Sending appData:', appData);
    this.sharedDataService.sendAppData(appData);

  this.resetFilters();

  }

  drawAppChart(): void {
  if (!this.appChart?.nativeElement) {
    console.error('appChart element not found');
    return;
  }
  const ctx = this.appChart.nativeElement.getContext('2d');
  if (!ctx) {
    console.error('Canvas context not available');
    return;
  }
  if (this.appChartInstance) this.appChartInstance.destroy();

  if (this.appData.length === 0) {
    console.log('No data to display in appChart');
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
  console.log('Chart data:', { vulnerableCount, nonVulnerableCount });
  const vulnerablePercentage = (vulnerableCount / this.appData.length) * 100;
  const nonVulnerablePercentage = (nonVulnerableCount / this.appData.length) * 100; 
  const leaderLinePlugin = {
    id: 'leaderLinePlugin',
    afterDatasetDraw(chart: any) {
  const { ctx, chartArea: { top, bottom, left, right } } = chart;
  console.log(ctx, top, bottom, left, right, "destructure")
  const meta = chart.getDatasetMeta(0);
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;

  meta.data.forEach((arc: any, index: number) => {
    let angle = (arc.startAngle + arc.endAngle) / 2;
    const radius = arc.outerRadius;
    console.log("arc", arc)

   if (index === 0 && (vulnerablePercentage > 10 && vulnerablePercentage <= 20)) angle += 0.3;
    else if (index === 0 && (vulnerablePercentage >= 20 && vulnerablePercentage < 30)) angle += 0.2;
    else if (index === 0 && (vulnerablePercentage >= 30 && vulnerablePercentage < 40)) angle -= 0.5;
    else if (index === 0 && (vulnerablePercentage >= 40 && vulnerablePercentage < 50)) angle -= 0.7;
    else if (index === 0 && (vulnerablePercentage >= 50 && vulnerablePercentage < 100)) angle = 0.7;
    else if (index === 1 && (nonVulnerablePercentage > 10 && nonVulnerablePercentage < 20)) angle -= 0.3;
    else if (index === 1 && (nonVulnerablePercentage >= 20 && nonVulnerablePercentage < 40)) angle -= 0.1;
    else if (index === 1 && (nonVulnerablePercentage >= 40 && nonVulnerablePercentage < 50)) angle += 0.3;
    else if (index === 1 && (nonVulnerablePercentage >= 50 && nonVulnerablePercentage < 70)) angle -= 0.3;
    else if (index === 1 && (nonVulnerablePercentage >= 70 && nonVulnerablePercentage <= 90)) angle += 0.3;
    else if (index === 1 && (nonVulnerablePercentage >= 90 && nonVulnerablePercentage <= 100)) angle += 0.6;

    // Start point: slice edge
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    console.log(x,y, "xy");
    console.log(angle, "angle")
    console.log(Math.cos(angle), Math.sin(angle),"cos, sin")

    // Fixed leader line length
    const FIXED_LINE_LENGTH = 20; // distance out from slice
    const HORIZONTAL_OFFSET = 40; // horizontal length

    const lineEndX = centerX + Math.cos(angle) * (radius + FIXED_LINE_LENGTH);
    const lineEndY = centerY + Math.sin(angle) * (radius + FIXED_LINE_LENGTH);

    // fixed horizontal/vertical leader extension
    const labelX = lineEndX + (Math.cos(angle) > 0 ? HORIZONTAL_OFFSET : -HORIZONTAL_OFFSET);
    const labelY = lineEndY; // keep aligned horizontally

    // Draw line
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(lineEndX, lineEndY);
    ctx.lineTo(labelX, labelY);
    ctx.strokeStyle = 'gray';
    ctx.lineWidth = 1;
    ctx.setLineDash([7, 3]);
    ctx.stroke();

    // Label text
    const value = chart.data.datasets[0].data[index];
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#333';
    ctx.fillText(value, labelX, labelY);
  });
}

  };
  console.log(leaderLinePlugin)
  this.appChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Vulnerable', 'Non-Vulnerable'],
      datasets: [{
        data: [vulnerableCount, nonVulnerableCount],
        backgroundColor: ['#66b3ffea', '#3366ffe7'],
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
        legend: { display: true, position: 'bottom' },
        tooltip: { callbacks: { label: (context) => `${context.label}: ${context.parsed || 0} applications` } },
        datalabels: {
          formatter: (value, context) => {
            const data = context.chart.data.datasets[0].data as number[];
            const total = data.reduce((sum, val) => sum + val, 0);
            if(value) return total ? ((value / total) * 100).toFixed(0) + '%' : '0%';
            else return '';
            
          },
          color: '#ffffff',
          font: { weight: 'bold', size: 12 }
        }
      }
    },
    plugins:[leaderLinePlugin]
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

  console.log('Severity counts:', this.severityCounts); // Debug log
  this.severityChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Critical', 'High', 'Medium', 'Low'],
      datasets: [{
        label: 'Vulnerability Count',
        data: [this.severityCounts.critical, this.severityCounts.high, this.severityCounts.medium, this.severityCounts.low],
        backgroundColor: ['#F26419', '#F6AE2D', '#86BBD8', '#33658A'],
        borderRadius: 3,
        barPercentage: 0.9
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, grid: { display: false }, title: { display: true, text: 'Vulnerability Count' } },
                x: { grid: { display: false }, title: { display: true, text: 'Severity Type' } } },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (context) => `${context.label}: ${context.parsed.y} vulnerabilities` } },
        datalabels: { color: 'white', anchor: 'center', align: 'center', font: { weight: 'bold', size: 10 }, formatter: (value) => value }
      }
    }
  });
}

  filterBySeverity(severity: 'Critical' | 'High' | 'Medium' | 'Low' | null): void {
    this.severityFilter = severity;
    this.activeFilter = severity; // Set the active filter
    this.updatePagedData(0);
  }
getFilteredApps(): ApplicationDetails[] {
  let data = this.allApplications;

  // Apply severity filter if selected
  if (this.severityFilter) {
    data = data.filter(app =>
      this.severityFilter === 'Critical' && app.criticalVulnerabilityCount > 0 ||
      this.severityFilter === 'High' && app.highVulnerabilityCount > 0 ||
      this.severityFilter === 'Medium' && app.mediumVulnerabilityCount > 0 ||
      this.severityFilter === 'Low' && app.lowVulnerabilityCount > 0
    );
  }

  // Apply search
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

resetFilters(): void {
  this.severityFilter = null;
  this.activeFilter = null;
  this.searchValue = '';
  this.updatePagedData(0);
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

  this.totalPages = Math.ceil(totalItems / this.pageSize);
  this.totalRecords = Array.from({ length: this.totalPages }, (_, i) => i + 1);

  this.start = initialIndex * this.pageSize;
  this.end = this.start + this.pageSize;
  this.pagedAppData = this.filteredAppData.slice(this.start, this.end);
    console.log('Paged apps:', this.pagedAppData);  // <--- check if this has data

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

  getPage(page: number): void {
    this.pageIndex = page - 1; // zero-based for internal logic
    this.recordIndex = page;   // one-based for UI select
    this.updatePagedData(this.pageIndex);
  }

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
    panelClass: 'vuln-dialog-panel',
    data: {
      softwareName: app.softwareName,
      vulnerabilities: app.vulnerabilities || [],
      severityCounts: {
        critical: app.criticalVulnerabilityCount,
        high: app.highVulnerabilityCount,
        medium: app.mediumVulnerabilityCount,
        low: app.lowVulnerabilityCount
      },
      cpeName: app.cpeName,
      resolved: app.resolved,
      uuid: app.uuid,
      softwareVersion: app.softwareVersion,
      vendor: app.vendor
    }
  });
}

openNotificationConfirmDialog(computerUuid: string): void {
    this.dialogRef = this.dialog.open(this.notificationConfirmDialog, {
      width: '600px'
    });

    this.dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.sendNotificationToComputer(computerUuid);
      }
    });
  }

sendNotificationToComputer(computerUuid: string) {
  const headers = new HttpHeaders({
    'Accept': 'application/json'
  });

  const url = `${environments.sendNotificationToAllComputers}/${computerUuid}`;

  this.http.get<any>(url, { headers }).subscribe({
    next: (response) => {

      this.toastService.showSuccessToast(`Mail sent successfully `);
    },
    error: (error) => {
      // const errorMessage = error.error?.message || error.message || 'Failed to send notification. Please try again.';
      const errorMessage = error.error?.message || 'Failed to send notification. Please try again later.';
      this.toastService.showErrorToast(`Error: ${errorMessage}`);
    }
  });
}

}

