import { CommonModule } from '@angular/common';
import { AfterViewChecked, AfterViewInit, Component, ElementRef, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
import { firstValueFrom, Subject, takeUntil, timeout } from 'rxjs';
import { ToastService } from '../core/services/toast.service';
import { MatDialog, MatDialogActions, MatDialogRef } from '@angular/material/dialog';
import { MatDialogContent } from '@angular/material/dialog';

@Component({
  selector: 'app-computer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, FlexLayoutModule, MatCardModule, MatIconModule, MatSlideToggleModule,
   MatTooltipModule,ApplicationDashboardComponent, MatOption, MatSelectModule, MatDialogActions, MatDialogContent
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
  dialogRef!: MatDialogRef<any>;

  @ViewChild('computerInfo') computerInfo: ElementRef<HTMLElement> | undefined;
  @ViewChild('compTableParent') compTableParent: ElementRef<HTMLElement> | undefined;
  @ViewChild(ApplicationDashboardComponent) applicationDashboardComponent!: ApplicationDashboardComponent;
  @ViewChild('notificationConfirmDialog') notificationConfirmDialog!: TemplateRef<any>;

  constructor(private http: HttpClient, private sharedDataService: SharedDataService, private toastService: ToastService,
    private dialog: MatDialog
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
  const { ctx, chartArea: { top, bottom, left, right } } = chart;
  const meta = chart.getDatasetMeta(0);
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;

  meta.data.forEach((arc: any, index: number) => {
    let angle = (arc.startAngle + arc.endAngle) / 2;
    const radius = arc.outerRadius;

    if (index === 0 && (vulnerablePercentage > 10 && vulnerablePercentage <= 20)) angle += 0.3;
    else if (index === 0 && (vulnerablePercentage >= 20 && vulnerablePercentage < 30)) angle += 0.2;
    else if (index === 0 && (vulnerablePercentage >= 30 && vulnerablePercentage < 40)) angle -= 0.5;
    else if (index === 0 && (vulnerablePercentage >= 40 && vulnerablePercentage < 50)) angle -= 0.7;
    else if (index === 0 && (vulnerablePercentage >= 50 && vulnerablePercentage < 100)) angle = 0.7;
    else if (index === 0 && (vulnerablePercentage == 100)) angle -= 0.7;
    else if (index === 0 && (vulnerablePercentage == 0)) angle += 0.3;
    else if (index === 1 && (nonVulnerablePercentage > 10 && nonVulnerablePercentage < 20)) angle -= 0.3;
    else if (index === 1 && (nonVulnerablePercentage >= 20 && nonVulnerablePercentage < 40)) angle -= 0.1;
    else if (index === 1 && (nonVulnerablePercentage >= 40 && nonVulnerablePercentage < 50)) angle += 0.3;
    else if (index === 1 && (nonVulnerablePercentage >= 50 && nonVulnerablePercentage < 70)) angle -= 0.3;
    else if (index === 1 && (nonVulnerablePercentage >= 70 && nonVulnerablePercentage <= 90)) angle += 0.3;
    else if (index === 1 && (nonVulnerablePercentage >= 90 && nonVulnerablePercentage <= 100)) angle += 0.6;
    else if (index === 1 && (nonVulnerablePercentage == 100)) angle += 0.3;
    else if (index === 1 && (nonVulnerablePercentage == 0)) angle -= 0.3;


    // Start point on arc edge
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    // Fixed leader line lengths
    const lineLength = 20;   // radial outwards
    const horizLength = 40;  // horizontal offset

    // First segment: radial outward
    const lineEndX = centerX + Math.cos(angle) * (radius + lineLength);
    const lineEndY = centerY + Math.sin(angle) * (radius + lineLength);

    // Second segment: horizontal fixed length
    let labelX: number;
    let labelY: number;
    if (Math.cos(angle) >= 0) {
      labelX = lineEndX + horizLength;
      labelY = lineEndY;
    } else {
      labelX = lineEndX - horizLength;
      labelY = lineEndY;
    }

    // Draw leader line
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(lineEndX, lineEndY);
    ctx.lineTo(labelX, labelY);
    ctx.strokeStyle = 'gray';
    ctx.lineWidth = 1;
    ctx.setLineDash([7, 3]);
    ctx.stroke();

    // Label
    const value = chart.data.datasets[0].data[index];
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#333';
    ctx.textAlign = (Math.cos(angle) >= 0) ? "left" : "right";
    ctx.textBaseline = "middle";
    ctx.fillText(value, labelX, labelY);
  });
}

  };

    this.computerChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: isDataFetched ? ['Vulnerable', 'Non-Vulnerable'] : ['No Data'],
        datasets: [{
          data: isDataFetched ? [vulnerableCount, nonVulnerableCount] : [1, 1],
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
              // text: 'Computers'
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
          legend: {
            display:isDataFetched ?  true : false,
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                return isDataFetched ? `${label}: ${value} computers` : 'No Data';
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
      plugins: isDataFetched ? [leaderLinePlugin] : []
    });
  }

  public sendAppData(data: ComputerDetails | null, computerId: number): void {
     this.selectedComputerId = computerId;
     this.applicationDashboardComponent['resetFilters']();
     const appData = { machineName: data?.machineName || 'Unknown',
      loggedInUserName: data?.loggedInUserName || 'Unknown', loggedInUserEmail: data?.loggedInUserEmail,
      vulnerableSoftwareCount: data?.vulnerableSoftwareCount || 0, appData: data?.applicationDetails || [],
      createdAt: data?.createdAt, updatedAt: data?.updatedAt };
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
        || computer.loggedInUserName.toLocaleLowerCase().includes(searchValue)
      });
     }
     this.updatePagedData(this.initialIndex);
  } 

  public async sendNotificationToAllComputers() {
    this.dialogRef = this.dialog.open(this.notificationConfirmDialog);
    const confirm = await firstValueFrom(this.dialogRef.afterClosed());
    if(!confirm) return;
    const headers = new HttpHeaders({
    'Accept': 'application/json'
    });
      this.http.get<any>(environments.sendNotificationToAllComputers, {headers}).subscribe({
        next:(response)=>{
             this.toastService.showToast(response.Status);
        }, error: (error)=>{
             this.toastService.showToast('Send Notification Failed');
        }
      })
  }

}  
