import { CommonModule } from '@angular/common';
import { AfterViewChecked, AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environments } from '../../environments/environments';
import { SecurityReport, ComputerDetails } from '../models/computer.model';
import { Chart } from 'chart.js';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SharedDataService } from '../core/services/shared-data.service';
import { ApplicationDashboardComponent } from './application-dashboard/application-dashboard.component';
import { MatOption, MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil, timeout } from 'rxjs';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-computer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, FlexLayoutModule, MatCardModule, MatIconModule, MatSlideToggleModule,
   MatTooltipModule,ApplicationDashboardComponent, MatOption, MatSelectModule
  ],
  templateUrl: './computer-dashboard.component.html',
  styleUrl: './computer-dashboard.component.css'
})
export class ComputerDashboardComponent implements OnInit, AfterViewInit ,OnDestroy{
  @ViewChild('computerChart') computerChart: ElementRef<HTMLCanvasElement> | undefined;
  @ViewChild('severityChart') severityChart: ElementRef<HTMLCanvasElement> | undefined;
  computerChartInstance!: Chart<'doughnut'>;
  severityChartInstance!: Chart<'bar'>;
  securityData: SecurityReport = {
    totalComputers: 0,
    totalCriticalVulnerableApplications: 0,
    totalHighVulnerableApplications: 0,
    totalMediumVulnerableApplications: 0,
    totalLowVulnerableApplications: 0,
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
  selectedComputerId: number = 1;
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
 @ViewChild(ApplicationDashboardComponent) applicationDashboardComponent!: ApplicationDashboardComponent;

  constructor(private http: HttpClient, private sharedDataService: SharedDataService, private toastService: ToastService
  ) {};

  ngOnInit(): void {
    this.fetchSecurityData();
  }
  ngAfterViewInit(): void {
    this.drawVulnBasedComputerChart();
    this.drawSeverityBasedComputerChart();
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
    this.computerDetails = this.securityData.computerDetails.map((computer ,index)=> ({ ...computer, id: ++index})) ?? [];
    this.finalComputerDetails = this.computerDetails;
    this.vulnerableComputersDetails = this.computerDetails.filter(computer => computer.vulnerableSoftwareCount > 0);
    this.sendAppData(this.computerDetails[0] ?? null, 1);
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
     this.pageIndex = 0;
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
      const criticalVulnerableApplications = this.securityData.totalCriticalVulnerableApplications;
      const highVulnerableApplications = this.securityData.totalHighVulnerableApplications;
      const mediumVulnerableApplications = this.securityData.totalMediumVulnerableApplications;
      const lowVulnerableApplications = this.securityData.totalLowVulnerableApplications;

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
        data: [criticalVulnerableApplications, highVulnerableApplications, mediumVulnerableApplications, lowVulnerableApplications],
        backgroundColor: ['#F26419', '#F6AE2D', '#86BBD8', '#33658A'],   
        borderColor: ['#F26419', '#F6AE2D', '#86BBD8', '#33658A'],    
        borderWidth: 0,
        borderRadius: 3,
        barPercentage: 1,
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
            text: 'Application Count'
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
              return `${context.label}: ${context.parsed.y} applications`;
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
    const isDataFetched = this.computerDetails.length;
    const vulnerableCount = this.vulnerableComputers;
    const nonVulnerableCount = this.totalComputers - vulnerableCount;

    this.computerChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: isDataFetched ? ['Vulnerable', 'Non-Vulnerable'] : ['No Data'],
        datasets: [{
          data: isDataFetched ? [vulnerableCount, nonVulnerableCount] : [1],
          backgroundColor: isDataFetched ? ['#66b3ffea', '#3366ffe7'] : ['#d3d3d3'],
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
            display:isDataFetched ?  true : false,
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
          if(isDataFetched) {return percentage + '%';}
          else {return ''}
          },
          color: '#ffffff',
          font: {
            weight: 'bold',
            size: 12
          }
        }
        }
      }
    });
  }

  public sendAppData(data: ComputerDetails | null, computerId: number): void {
     this.selectedComputerId = computerId;
     this.applicationDashboardComponent.resetFilters();
     const appData = { machineName: data?.machineName || 'Unknown',
      loggedInUser: data?.loggedInUser || 'Unknown',
     vulnerableSoftwareCount: data?.vulnerableSoftwareCount || 0, appData: data?.applicationDetails || []};
     console.log(appData)
     this.sharedDataService.sendAppData(appData);
     this.pagedComputerData = this.pagedComputerData.map((computer) => {
        if(this.selectedComputerId === computer.id) computer.selected = true
        else computer.selected = false
        return computer
     });
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
    this.pagedComputerData = this.finalComputerDetails.slice(this.start, this.end).map((computer) => {
        if(this.selectedComputerId === computer?.id) computer.selected = true
        else computer.selected = false
        return computer
     });;
    }
   }
  public previousPage(): void {
    if(this.pageIndex > 0) {
      this.pageIndex--;
      console.log(this.pageIndex)
      this.recordIndex = this.pageIndex + 1;
      this.start = this.pageIndex * this.pageSize;
      this.end = this.start + this.pageSize;
      this.pagedComputerData = this.finalComputerDetails.slice(this.start, this.end).map((computer) => {
        if(this.selectedComputerId === computer?.id) computer.selected = true
        else computer.selected = false
        return computer
     });
    }
   }
  
  public updatePagedData(initialIndex:number): void {
    let pages = Math.ceil(this.finalComputerDetails.length / this.pageSize);
    this.totalPages = pages;
    this.totalRecords = Array.from({length: pages}, (_, i) => i + 1);
    this.start = initialIndex * this.pageSize;
    this.end = this.start + this.pageSize;
    const len = this.finalComputerDetails.length;
    this.pageSizes = len >= 100 ? [ 5,10, 25, 50, 100] : len <= 100 && len >= 50 ? [ 5,10, 25, 50] : 
    len <= 50 && len >= 25 ? [5, 10, 25] : len <= 25 && len >= 10 ? [5,10] : len <=10 && len >= 0 ? [5] : [0];
    console.log(this.selectedComputerId)
    this.pagedComputerData = this.finalComputerDetails.slice(this.start, this.end).map((computer) => {
        if(this.selectedComputerId === computer.id) computer.selected = true
        else computer.selected = false
        return computer
     });
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
     this.updatePagedData(this.initialIndex);
  } 

}  
