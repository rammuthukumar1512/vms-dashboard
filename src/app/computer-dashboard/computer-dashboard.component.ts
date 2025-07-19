import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environments } from '../../environments/environments';
import { SecurityReport, ComputerDetails } from '../models/computer.model';
import { Chart } from 'chart.js';
import { MatIconModule } from '@angular/material/icon';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SharedDataService } from '../core/services/shared-data.service';
import { ApplicationDashboardComponent } from './application-dashboard/application-dashboard.component';
import { MatLabel, MatOption, MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../core/services/toast.service';
import { LoaderService } from '../core/services/loader.service';
import { MatSidenav } from '@angular/material/sidenav';
@Component({
  selector: 'app-computer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, FlexLayoutModule, MatCardModule, MatIconModule, MatSlideToggleModule,
   MatTooltipModule,ApplicationDashboardComponent, MatLabel, MatOption, MatSelectModule
  ],
  templateUrl: './computer-dashboard.component.html',
  styleUrl: './computer-dashboard.component.css'
})
export class ComputerDashboardComponent implements OnInit, OnDestroy{
  @ViewChild('computerChart') computerChart: ElementRef<HTMLCanvasElement> | undefined;
  @ViewChild('severityChart') severityChart: ElementRef<HTMLCanvasElement> | undefined;
  computerChartInstance!: Chart<'doughnut'>;
  severityChartInstance!: Chart<'bar'>;
  securityData: SecurityReport = {
    totalComputers: 0,
    vulnerableComputers: 0,
    computerDetails: []
  };
  totalComputers: number = 0;
  vulnerableComputers: number = 0;
  computerDetails: ComputerDetails[] = [];
  finalComputerDetails: ComputerDetails[] = [];
  vulnerableComputersDetails: ComputerDetails[] = [];
  showVulnerableComputer: boolean = false;
  pagedComputerData: ComputerDetails[] = [];
  initialIndex: number = 0;
  pageIndex: number = 0;
  recordIndex: number = 1;
  pageSize:number = 5;
  currentPageSize:number = this.pageSize;
  totalPages: number = 0;
  totalRecords: number[] = [];
  pageSizes:Array<number> = [];
  start:number = 0;
  end:number = 0;
  private destroy$ = new Subject<void>();

  @ViewChild('computerInfo') computerInfo: ElementRef<HTMLElement> | undefined;
  @ViewChild('compTableParent') compTableParent: ElementRef<HTMLElement> | undefined;

  constructor(private http: HttpClient, private sharedDataService: SharedDataService, private toastService: ToastService
  ) {};

  ngOnInit(): void {
    this.fetchSecurityData();
  }

  private fetchSecurityData(): void {
    const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
    });

    this.http.get<any>(environments.unique_url, { headers })
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data: any) => this.handleSuccessResponse(data),
        error: (error: any) => this.handleErrorResponse(error)
      });
  }

  private handleSuccessResponse(data: any): void {
    console.log(data)
    this.securityData = data ?? {};
    this.totalComputers = this.securityData.totalComputers ?? 0;
    this.vulnerableComputers = this.securityData.vulnerableComputers ?? 0;
    this.computerDetails = this.securityData.computerDetails ?? [];
    this.finalComputerDetails = this.computerDetails;
    this.vulnerableComputersDetails = this.computerDetails.filter(computer => computer.vulnerableSoftwareCount > 0);
    this.sendAppData(this.computerDetails[0] ?? null);
    this.drawVulnBasedComputerChart();
    this.drawSeverityBasedComputerChart();
    this.updatePagedData(this.initialIndex);
    this.toastService.showToast('Data fetched successfully');
  }

  private handleErrorResponse(error: any): void {
    console.error('Error fetching security data:', error);
    if (error.status === 0) {
      this.toastService.showToast(
        'Unable to connect to the server. Please check your network or try again later.'
      );
    } else {
      this.toastService.showToast(
        'Error : Failed to fetch security data'
      );
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.computerChartInstance) {
       this.computerChartInstance.destroy();
    }
    if (this.severityChartInstance) {
       this.severityChartInstance.destroy();
    }
  }

  public toggleVulnerableComputers() {
     this.pageSize = 5;
     if(this.showVulnerableComputer) {
          this.finalComputerDetails = this.computerDetails.filter(computer => {
                  return computer.vulnerableSoftwareCount > 0;
          });
          this.updatePagedData(this.initialIndex);
     } else {
          this.finalComputerDetails = this.computerDetails;
          this.updatePagedData(this.initialIndex);
     }
  }

  public drawSeverityBasedComputerChart() {
     const criticalVulnerableComputers = this.vulnerableComputersDetails.reduce((count, computer) => count + computer.criticalVulnerabilityCount ,0);
     const highVulnerableComputers = this.vulnerableComputersDetails.reduce((count, computer) => count + computer.highVulnerabilityCount ,0);
     const mediumVulnerableComputers = this.vulnerableComputersDetails.reduce((count, computer) => count + computer.mediumVulnerabilityCount ,0);
     const lowVulnerableComputers = this.vulnerableComputersDetails.reduce((count, computer) => count + computer.lowVulnerabilityCount ,0);

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
        label: 'Computer Count',
        data: [criticalVulnerableComputers, highVulnerableComputers, mediumVulnerableComputers, lowVulnerableComputers],
        backgroundColor: ['#F26419', '#F6AE2D', '#86BBD8', '#33658A'],   
        borderColor: ['#F26419', '#F6AE2D', '#86BBD8', '#33658A'],    
        borderWidth: 0,
        borderRadius: 3,
        barPercentage: 0.9,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
          display: false
          },
          title: {
            display: true,
            text: 'Count'
          }
        },
        x: {
          grid: {           
           display: false
          },
          title: {
            display: true,
            text: 'Severity Type'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.label}: ${context.parsed.y} computers`;
            }
          }
        },
         datalabels: {
         color: 'white',      
         anchor: 'center',       
         align: 'center',
         font: {
            weight: 'bold',
            size: 12
          },
          formatter: function (value) {
            return value;        
          }
        }
      },
      
    }
  });

  }

  public drawVulnBasedComputerChart(): void {
    if (!this.computerChart?.nativeElement) return;

    const ctx = this.computerChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.computerChartInstance) {
      this.computerChartInstance.destroy();
    }

    const vulnerableCount = this.vulnerableComputers;
    const nonVulnerableCount = this.totalComputers - vulnerableCount;

    this.computerChartInstance = new Chart(ctx, {
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
        maintainAspectRatio: false,
        cutout: '50%',
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                return `${label}: ${value} computers`;
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

  public sendAppData(data: ComputerDetails | null): void {
     const appData = {vulnerableSoftwareCount: data?.vulnerableSoftwareCount || 0, appData: data?.applicationDetails || []};
     console.log(appData)
     this.sharedDataService.sendAppData(appData);
  }

  public getPage(page: number): void {
    console.log(page)
    this.recordIndex = page - 1;
    this.pageIndex = this.recordIndex;
    this.start = this.recordIndex * this.pageSize;
    this.end = this.start + this.pageSize;
    this.pagedComputerData = this.finalComputerDetails.slice(this.start, this.end);
  }

  public nextPage(): void {
    if(this.pageIndex >= 0 && this.pageIndex < this.totalPages && this.pageIndex !== this.totalPages - 1) {
    this.pageIndex++;
    this.recordIndex = this.pageIndex + 1;
    this.start = this.pageIndex * this.pageSize;
    this.end = this.start + this.pageSize;
    this.pagedComputerData = this.finalComputerDetails.slice(this.start, this.end);
    }
   }
  public previousPage(): void {
    if(this.pageIndex > 0) {
      this.pageIndex--;
      console.log(this.pageIndex)
      this.recordIndex = this.pageIndex + 1;
      this.start = this.pageIndex * this.pageSize;
      this.end = this.start + this.pageSize;
      this.pagedComputerData = this.finalComputerDetails.slice(this.start, this.end);
    }
   }
  
  public updatePagedData(initialIndex:number): void {
    let pages = Math.ceil(this.finalComputerDetails.length / this.pageSize);
    this.totalPages = pages;
    this.totalRecords = Array.from({length: pages}, (_, i) => i + 1);
    this.start = initialIndex * this.pageSize;
    this.end = this.start + this.pageSize;
    const len = this.finalComputerDetails.length;
    this.pageSizes = len >= 100 ? [10, 25, 50, 100] : len <= 100 && len >= 50 ? [10, 25, 50] : 
    len <= 50 && len >= 25 ? [5, 10, 25] : len <= 25 && len >= 10 ? [5,10] : len <=10 && len >= 0 ? [5] : [0];
    this.pagedComputerData = this.finalComputerDetails.slice(this.start, this.end);
   }

  public onPageSizeChange(event: number): void {
    console.log(event)
   this.pageSize = event;
   let pages = Math.ceil(this.finalComputerDetails.length / this.pageSize);
   this.totalPages = pages;
   this.totalRecords = Array.from({length: pages}, (_, i) => i + 1);
   this.pageIndex = 0;
   this.recordIndex = this.pageIndex + 1;
   this.updatePagedData(this.pageIndex);
   }

  public searchComputer(event: Event) {
     let searchValue = (event.target as HTMLInputElement).value.toLocaleLowerCase();
     if(searchValue === "") {
         this.pageIndex = 0;
         this.finalComputerDetails = this.computerDetails;
         this.updatePagedData(this.initialIndex);
     } else {
      this.finalComputerDetails = this.computerDetails.filter(computer => {
        return computer.ipAddress.includes(searchValue) || computer.machineName.toLocaleLowerCase().includes(searchValue)
        || computer.loggedInUser.toLocaleLowerCase().includes(searchValue)
      });
     }
     console.log(this.pagedComputerData)
     this.updatePagedData(this.initialIndex);
  } 

}
