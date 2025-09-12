import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, ViewChild, OnInit } from '@angular/core';
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
import { ApplicationDetails, ComputerDetails } from '../../models/computer.model';
import { HttpClient } from '@angular/common/http';
import { ApiEndPoints } from '../../../environments/api-endpoints';
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
    FormsModule
  ],
  templateUrl: './user-report-page.component.html',
  styleUrls: ['./user-report-page.component.css']
})
export class UserReportPageComponent implements OnInit {
  @ViewChild('appChart') appChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('severityChart') severityChart!: ElementRef<HTMLCanvasElement>;

  computer: ComputerDetails | null = null;
  appChartInstance: Chart<'doughnut'> | undefined;
  severityChartInstance: Chart<'bar'> | undefined;
  appData: ApplicationDetails[] = [];
  pagedAppData: ApplicationDetails[] = [];
  filteredAppData: ApplicationDetails[] = [];
  allApplications: ApplicationDetails[] = [];
  computerUuid: string = '';

  // Top box fields
  machineName = 'Unknown';
  macAddress = '00:00:00:00:00:00';
  ipAddress = '0.0.0.0';
  serialNumber = 'Unknown';
  loggedInUserEmail = 'Unknown@example.com';
  loggedInUserName = 'Unknown';

  // Table properties
  displayedColumns: string[] = ['softwareName', 'softwareVersion', 'vendor'];
  pageIndex = 0;
  pageSize = 5;
  pageSizes: number[] = [5, 10, 25];
  totalPages = 0;
  totalRecords: number[] = [];
  recordIndex = 1;
  searchValue = '';
  showVulnerableOnly = false;

  constructor(
    private http: HttpClient,
    private toastService: ToastService,
    private cdRef: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute

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
      this.fetchComputerDetails();
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
        this.cdRef.detectChanges();
        this.toastService.showSuccessToast('Computer details fetched successfully!');
      },
      error: (err) => {
        this.toastService.showErrorToast('Failed to fetch computer details. Check the UUID or backend.');
        console.error(err);
        // Optional: Fallback to dummy data for UI testing
        // this.loadDummyData();
      }
    });
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

    const vulnerableCount = this.appData.filter(app => 
      app.criticalVulnerabilityCount + app.highVulnerabilityCount + app.mediumVulnerabilityCount + app.lowVulnerabilityCount > 0
    ).length;
    const nonVulnerableCount = this.appData.length - vulnerableCount;
    const isDataFetched = this.appData.length > 0;

    this.appChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: isDataFetched ? ['Vulnerable', 'Non-Vulnerable'] : [''],
        datasets: [{
          data: isDataFetched ? [vulnerableCount, nonVulnerableCount] : [1, 1],
          backgroundColor: isDataFetched ? ['#66b3ffea', '#3366ffe7'] : ['#d3d3d3'],
          borderColor: ['#ffffff', '#ffffff'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '50%',
        plugins: {
          legend: { display: isDataFetched, position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (context) => isDataFetched ? `${context.label}: ${context.parsed} applications` : 'No Data'
            }
          }
        }
      }
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
          backgroundColor: ['#dc3545', '#ff6b6b', '#ffc107', '#28a745'],
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Severity',
              color: '#000000'
            },
            ticks: { color: '#000000' },  
             grid: {
               display: false // ✅ This hides the vertical grid lines
                   }
          },
          y: {
            min: 0,
            ticks: {
              stepSize: 1,
              color: '#000000'
            },
            title: {
              display: true,
              text: 'Number of Vulnerabilities',
              color: '#000000'
            },
            grid: { display: false}
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${context.parsed.y} vulnerabilities`
            }
          }
        }
      }
    });
  }

  updatePagedData(initialIndex: number): void {
    this.filteredAppData = this.getFilteredApps();
    const totalItems = this.filteredAppData.length;
    this.totalPages = Math.ceil(totalItems / this.pageSize);
    this.totalRecords = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.pageSizes = totalItems >= 25 ? [5, 10, 25] : totalItems >= 10 ? [5, 10] : [5];
    this.pageIndex = initialIndex;
    this.recordIndex = initialIndex + 1;
    const start = initialIndex * this.pageSize;
    const end = start + this.pageSize;
    this.pagedAppData = this.filteredAppData.slice(start, end);
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
    this.pageIndex = 0;
    this.recordIndex = 1;
    this.updatePagedData(this.pageIndex);
  }

  getPage(page: number): void {
    this.pageIndex = page - 1;
    this.recordIndex = page;
    this.updatePagedData(this.pageIndex);
  }

  searchApplications(event: Event): void {
    this.searchValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.pageIndex = 0;
    this.updatePagedData(0);
  }

  viewVulnerabilities(app: ApplicationDetails): void {
    if (app.vulnerabilities && app.vulnerabilities.length > 0) {
      const cveId = app.vulnerabilities[0].cveId;
      this.router.navigate([`/vulnerability-metrics/cve/${cveId}`]);
    }
  }
}