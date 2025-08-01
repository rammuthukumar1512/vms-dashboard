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
  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

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
    const vulnerablePercentage = ( vulnerableCount / this.totalComputers) * 100;
    const nonVulnerablePercentage = ( nonVulnerableCount / this.totalComputers) * 100; 
    const leaderLinePlugin = {
    id: 'leaderLinePlugin',
    afterDatasetDraw(chart: any) {

      const {ctx, chartArea: {top, bottom, left, right}} = chart;
      const meta = chart.getDatasetMeta(0);
      console.log(top, bottom, left, right)
      const centerX = (left + right) / 2;
      const centerY = (top + bottom) / 2;

  meta.data.forEach((arc: any, index: number) => {
  let angle = (arc.startAngle + arc.endAngle) / 2;
  const radius = arc.outerRadius;
  console.log(nonVulnerablePercentage, index === 1 && (nonVulnerablePercentage > 95 && nonVulnerablePercentage <= 100))
  if(index === 0 && (vulnerablePercentage > 10 && vulnerablePercentage <=20)) angle += 0.3;
  else if (index === 0 && (vulnerablePercentage >= 20 && vulnerablePercentage < 30)) angle += 0.2;
  else if (index === 0 && (vulnerablePercentage >= 30 && vulnerablePercentage < 40)) angle -= 0.5;
  else if (index === 0 && (vulnerablePercentage >= 40 && vulnerablePercentage < 50)) angle -= 0.7;
  else if (index === 0 && (vulnerablePercentage >= 70 && vulnerablePercentage < 100)) angle -= 0.7;
  else if (index === 1 && (nonVulnerablePercentage > 10 && nonVulnerablePercentage < 20)) angle -= 0.3;
  else if (index === 1 && (nonVulnerablePercentage >= 20 && nonVulnerablePercentage < 30)) angle -= 0.5;
  else if (index === 1 && (nonVulnerablePercentage >= 30 && nonVulnerablePercentage < 40)) angle -= 0.5;
  else if (index === 1 && (nonVulnerablePercentage >= 40 && nonVulnerablePercentage <=50)) angle -= 0.5;  
  else if (index === 1 && (nonVulnerablePercentage >= 70 && nonVulnerablePercentage <=80)) angle += 0.1;
  else if(index === 1 && (nonVulnerablePercentage > 80 && nonVulnerablePercentage < 95)) angle += 0.3;
  else if(index === 1 && (nonVulnerablePercentage > 95 && nonVulnerablePercentage <= 100)) angle += 0.6;
  else {};
  const x = centerX + Math.cos(angle) * radius;
  const y = centerY + Math.sin(angle) * radius;
  const lineEndX = centerX + Math.cos(angle) * (radius + 15);
  let lineEndY = 0;
  if (index === 0 && vulnerablePercentage <= 10) { lineEndY = 15 }
  else if(index === 1 && nonVulnerablePercentage <= 10 ) {lineEndY = 15}
  else if(index === 0 && (vulnerablePercentage > 10 && vulnerablePercentage <= 50 )) {lineEndY = 10}
  else { lineEndY = centerY + Math.sin(angle) * (radius + 15);}

  const isTop = Math.sin(angle) < 0;
  console.log(lineEndX)
  let labelX = (index === 0 && vulnerablePercentage < 10) ? lineEndX + 60 : (index === 0 && vulnerablePercentage > 10) ? 120 : 40 ;
  let labelY = 0;
  if(index === 0 && vulnerablePercentage < 10) {labelX = 220; labelY = 20;}
  else if (index === 0 && (vulnerablePercentage >= 10 && vulnerablePercentage <= 20)) {labelX = 240; labelY = 30;}
  else if (index === 0 && (vulnerablePercentage > 20 && vulnerablePercentage <= 30)) {labelX = 250;labelY = 20;}
  else if (index === 0 && (vulnerablePercentage > 30 && vulnerablePercentage <= 40)) {labelX = 230; labelY = 20;}
  else if (index === 0 && (vulnerablePercentage > 40 && vulnerablePercentage <= 50)) {labelX = 240; labelY = 20;}
  else if (index === 0 && (vulnerablePercentage > 50 && vulnerablePercentage <= 60)) {labelX = 260; labelY = 80}
  // else if (index === 0 && (nonVulnerablePercentage > 60)) labelY = 145;
  else if (index === 0 && (vulnerablePercentage > 60 && vulnerablePercentage <= 70)) {labelX = 240; labelY = 130}
  else if (index === 0 && (vulnerablePercentage > 70)) {labelX = 260; labelY = 80}
  else {};
  if(index === 1 && nonVulnerablePercentage < 10) { labelY = 20;}
  else if (index === 1 && (nonVulnerablePercentage >= 10 && nonVulnerablePercentage <= 20)) labelY = 40;
  else if (index === 1 && (nonVulnerablePercentage > 20 && nonVulnerablePercentage <= 30)) labelY = 50;
  else if (index === 1 && (nonVulnerablePercentage > 30 && nonVulnerablePercentage <= 40)) labelY = 60;
  else if (index === 1 && (nonVulnerablePercentage > 40 && nonVulnerablePercentage <= 50)) labelY = 145;
  else if (index === 1 && (nonVulnerablePercentage > 50 && nonVulnerablePercentage <= 60)) labelY = 105;
  else if (index === 1 && (nonVulnerablePercentage > 60 && nonVulnerablePercentage <= 70)) labelY = 145;
  else if (index === 1 && (nonVulnerablePercentage > 70 && nonVulnerablePercentage <= 100)) labelY = 115;
  else {};
  console.log(centerX, lineEndY);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(lineEndX, lineEndY);
  ctx.lineTo(labelX, labelY);
  ctx.strokeStyle = index === 0 ? '#66b3ffea' : '#3366ffe7';
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 3]);
  // ctx.shadowColor = 'rgba(0,0,0,0.3)';
  // ctx.shadowBlur = 4;
  // ctx.shadowOffsetX = 1;
  ctx.stroke();

  const label = chart.data.labels[index];
  const value = chart.data.datasets[0].data[index];

  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#333';
  ctx.fillText(value, labelX, labelY);
});
    }
  };

    this.computerChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: isDataFetched ? ['Vulnerable', 'Non-Vulnerable'] : ['No Data'],
        datasets: [{
          data: isDataFetched ? [vulnerableCount, nonVulnerableCount] : [1],
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
      },
      plugins: [leaderLinePlugin]
    });
  }

  public sendAppData(data: ComputerDetails | null, computerId: number): void {
     this.selectedComputerId = computerId;
     this.applicationDashboardComponent['resetFilters']();
     const appData = { machineName: data?.machineName || 'Unknown',
      loggedInUser: data?.loggedInUser || 'Unknown',
     vulnerableSoftwareCount: data?.vulnerableSoftwareCount || 0, appData: data?.applicationDetails || []};
     console.log(appData)
     this.applicationDashboardComponent.sendAppData(data, computerId);
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
     });
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
