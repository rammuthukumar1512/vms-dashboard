import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, QueryList, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { ApiEndPoints } from '../../environments/api-endpoints';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { SecurityReport, ComputerDetails } from '../models/computer.model';
import { Chart } from 'chart.js';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SharedDataService } from '../core/services/shared-data.service';
import { ApplicationDashboardComponent } from './application-dashboard/application-dashboard.component';
import { MatOption, MatSelectModule } from '@angular/material/select';
import { firstValueFrom, Subject, Subscription, takeUntil, timer } from 'rxjs';
import { ToastService } from '../core/services/toast.service';
import { MatDialog, MatDialogActions, MatDialogRef } from '@angular/material/dialog';
import { MatDialogContent } from '@angular/material/dialog';
import { ApplicationResolveService } from '../core/services/application-resolve.service';
import { Router } from '@angular/router';
import { AppRoutes } from '../../environments/approutes';

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
  @ViewChildren('computerRow', { read: ElementRef }) computerRows!: QueryList<ElementRef>;
  @ViewChild('applicationDashboardSection') applicationDashboardSection!: ElementRef<HTMLElement>;


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
  computerSearchTearm: string = '';
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
  toDay: String = new Date().toLocaleDateString();
  previousUrl: String | null = null;
  currentTime: Date = new Date();
  timeSubscription?: Subscription;
  private destroy$ = new Subject<void>();
  dialogRef!: MatDialogRef<any>;
  syncComputerData: boolean = false;

  @ViewChild('computerInfo') computerInfo: ElementRef<HTMLElement> | undefined;
  @ViewChild('compTableParent') compTableParent: ElementRef<HTMLElement> | undefined;
  @ViewChild(ApplicationDashboardComponent) applicationDashboardComponent!: ApplicationDashboardComponent;
  @ViewChild('notificationConfirmDialog') notificationConfirmDialog!: TemplateRef<any>;

  constructor(private http: HttpClient, private sharedDataService: SharedDataService, private toastService: ToastService,
    private dialog: MatDialog, private applicationResolveService: ApplicationResolveService,private cdRef: ChangeDetectorRef, private router: Router
  ) {};

  ngOnInit(): void {
    this.sharedDataService.syncSecurityData$.pipe(takeUntil(this.destroy$)).subscribe(()=>{
        if(this.router.url.match(AppRoutes.computer_dashboard)) this.syncSecurityData();
    });
    this.previousUrl = this.applicationResolveService.getPreviousUrl();
    if(!this.previousUrl?.match('vulnerability-metrics') || ( !this.previousUrl && this.computerDetails.length == 0)) this.fetchSecurityData();
    else {
      this.pageSize = this.applicationResolveService.getComputerDashPageSize();
      this.securityData = this.applicationResolveService.getSecurityReport();
      this.showVulnerableComputer = this.applicationResolveService.getShowVulnerableComputer();
      if(!this.showVulnerableComputer) {
        this.initialIndex = this.applicationResolveService.getComputerDashPageIndex();
      }
      this.vulnerableComputers = this.securityData.vulnerableComputers ?? 0;
      this.computerDetails = this.securityData.computerDetails.length ? this.securityData.computerDetails.map((computer ,index)=> ({ ...computer, id: ++index})) : [];
      this.selectedComputerId = this.applicationResolveService.getSelectedComputerId();
      this.finalComputerDetails = this.computerDetails.map((computer) => {
        if(this.selectedComputerId === computer?.id) computer.selected = true
        else computer.selected = false
        return computer;
     });
      this.totalComputers = this.finalComputerDetails.length;
      if(this.showVulnerableComputer) {
          this.toggleVulnerableComputers();
      } else {
          this.updatePagedData(this.initialIndex);
      }
      setTimeout(()=>{
         this.drawVulnBasedComputerChart();
         this.drawSeverityBasedComputerChart();
         if (this.computerRows && this.computerRows.length > 0) {
          const selectedComputerIndex = this.applicationResolveService.getSelectedComputerIndex();
          const selectedRow = this.computerRows.toArray()[selectedComputerIndex]?.nativeElement;
          selectedRow?.scrollIntoView({ behaviour: 'smooth', block: 'center'});
        }
      },0);
      this.previousUrl = null;
    }
    let now = new Date();
    let initialDelay = (60 - now.getSeconds()) * 1000;
    this.timeSubscription = timer(initialDelay, 60000).subscribe(()=>{
        this.currentTime = new Date();
    });
  }
  ngAfterViewInit(): void {
    if(!this.computerChartInstance) this.drawVulnBasedComputerChart();
    if(!this.severityChartInstance) this.drawSeverityBasedComputerChart();
      this.cdRef.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.timeSubscription?.unsubscribe();

    if (this.computerChartInstance) {
       this.computerChartInstance.destroy();
    }
    if (this.severityChartInstance) {
       this.severityChartInstance.destroy();
    }
  }

  public fetchSecurityData(): void {
    const headers = new HttpHeaders({
    'Accept': 'application/json'
    });

    this.http.get<any>(ApiEndPoints.unique_url, { headers })
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: HttpResponse<any>) => {
    this.handleSuccessResponse(response);

    },
    error: (error: HttpErrorResponse) => {
      console.error('HTTP Error:', error.status, error.message);
      this.handleErrorResponse(error);
    }
      });
  }

  private handleNoContent(showToast: boolean = true): void {
  if (showToast) {
    this.toastService.showSuccessToast('No data available');
  }      
   // Reset all dashboard data
  this.securityData = {
    totalComputers: 0,
    totalCriticalVulnerableApplications: 0,
    totalHighVulnerableApplications: 0,
    totalMediumVulnerableApplications: 0,
    totalLowVulnerableApplications: 0,
    vulnerableComputers: 0,
    computerDetails: []
  };

  this.totalComputers = 0;
  this.vulnerableComputers = 0;
  this.computerDetails = [];
  this.finalComputerDetails = [];
  this.vulnerableComputersDetails = [];
  this.pagedComputerData = [];

  // Clear charts
  if (this.computerChartInstance) {
    this.computerChartInstance.destroy();
  }
  if (this.severityChartInstance) {
    this.severityChartInstance.destroy();
  }
  if (this.applicationDashboardComponent) {
  this.applicationDashboardComponent.resetApplicationData();
}

  // Redraw empty charts
  this.drawVulnBasedComputerChart();
  this.drawSeverityBasedComputerChart();

  // Reset pagination
  this.totalRecords = [];
  this.totalPages = 0;
  this.pageIndex = 0;
  this.recordIndex = 1;

  // Trigger UI update
  this.cdRef.detectChanges();
  }

  private handleSuccessResponse(data: any): void {
    this.securityData = data ?? {};
   
    // this.computerDetails = this.securityData.computerDetails.length ? this.securityData.computerDetails.map((computer ,index)=> ({ ...computer, id: ++index})) : [];
    //   if (!this.computerDetails.length) {
    // this.handleNoContent(); 
    // return;
    //       }
    // Safely extract computerDetails from API response
const details = this.securityData?.computerDetails;
if (!details || !Array.isArray(details) || details.length === 0) {
  this.handleNoContent(); // Show "No data available" toast
  return;
}
 this.totalComputers = this.securityData.totalComputers ?? 0;
    this.applicationResolveService.setSecurityReport(this.securityData);
    this.vulnerableComputers = this.securityData.vulnerableComputers ?? 0;
// Only process if valid data present
this.computerDetails = details.map((computer, index) => ({ ...computer, id: ++index }));

    this.finalComputerDetails = this.showVulnerableComputer ? this.computerDetails.filter(computer => {
                  return computer.vulnerableSoftwareCount > 0;
          }) : this.computerDetails;
    this.vulnerableComputersDetails = this.computerDetails.filter(computer => computer.vulnerableSoftwareCount > 0);
    this.selectedComputerId = this.applicationResolveService.getSelectedComputerId();
    if(this.syncComputerData) {
       const selectedComputer = this.computerDetails.find((value) =>{
          return this.selectedComputerId == value.id
       });
       this.sendAppData(selectedComputer ?? null, this.selectedComputerId, 0);
    } else {
       this.sendAppData(this.computerDetails[0] ?? null, 1, 0);
       this.syncComputerData = false;
    }
    this.drawVulnBasedComputerChart();
    this.drawSeverityBasedComputerChart();
    this.updatePagedData(this.initialIndex);
    this.toastService.showSuccessToast('Data fetched successfully');
  }

  private handleErrorResponse(error: any): void {
    this.syncComputerData = false; // reset flag
    if (error.status === 0) {
      this.handleNoContent(false);  
      this.toastService.showErrorToast(
        'Unable to connect to the server. Please check your network or try again later.'
      );
      return;
    }else if (error.status === 204) {  
        this.handleNoContent(true); 
    }
    else {
          this.handleNoContent(false);  
      this.toastService.showErrorToast(
        'Error : Failed to fetch security data'
      );
    }
      this.syncComputerData = false;

  }

  public toggleVulnerableComputers() {
    this.computerSearchTearm = '';
     this.pageSize = 5;
     if(this.showVulnerableComputer) {
        if(this.previousUrl?.match('vulnerability-metrics')) {
          this.initialIndex = this.applicationResolveService.getComputerDashPageIndex();
          this.pageSize = this.applicationResolveService.getComputerDashPageSize();
        }
        else {
          this.initialIndex = 0; 
          this.applicationResolveService.setComputerDashPageIndex(this.pageIndex);
          this.selectedComputerId = 0;
          };
          this.applicationResolveService.setComputerDashPageSize(this.pageSize);
          this.finalComputerDetails = this.computerDetails.filter(computer => {
                  return computer.vulnerableSoftwareCount > 0;
          });
          if(!this.previousUrl?.match('vulnerability-metrics')) this.sendAppData(null, this.selectedComputerId, 0);
          this.updatePagedData(this.initialIndex);
          this.applicationResolveService.setShowVulnerableComputer(true);
          this.previousUrl = null;
     } else {
          this.finalComputerDetails = this.computerDetails;
          if(this.previousUrl?.match('vulnerability-metrics')) { 
            this.initialIndex = this.applicationResolveService.getComputerDashPageIndex();
          } else {
            this.initialIndex = 0;
            this.selectedComputerId = 0;
            if(!this.previousUrl?.match('vulnerability-metrics')) this.sendAppData(null, this.selectedComputerId, 0);
          }
          this.updatePagedData(this.initialIndex);
          setTimeout(()=>{
          if (this.computerRows && this.computerRows.length > 0 && this.previousUrl?.match('vulnerability-metrics')) {
          const selectedComputerIndex = this.applicationResolveService.getSelectedComputerIndex();
          const selectedRow = this.computerRows.toArray()[selectedComputerIndex]?.nativeElement;
          selectedRow?.scrollIntoView({ behaviour: 'smooth', block: 'center'});
          }
          },0);
          this.applicationResolveService.setShowVulnerableComputer(false);
     }
  }


  public syncSecurityData() {
      this.initialIndex = this.applicationResolveService.getComputerDashPageIndex();
      this.syncComputerData = true;
      this.fetchSecurityData();
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
        backgroundColor: ['#F26419', '#F6AE2D', '#33658A', '#86BBD8'],   
        borderColor: ['#F26419', '#F6AE2D', '#33658A' ,'#86BBD8'],    
        borderWidth: 0,
        borderRadius: 3,
        barPercentage: 1
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
          },
          ticks: {
            stepSize: 1,
            callback: function(value) {
            if (Number.isInteger(value)) {
              return value;
            }
            return null;
            }
            },
          grace: "20%"
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
            title: () => "Severity", label: function (context) {
              return `${context.label}: ${context.parsed.y} applications`;
            }
          }
        },
         datalabels: {
         color: 'gray',      
         anchor: 'end',       
         align: 'end',
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
     this.cdRef.detectChanges();
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
    const chartValue = chart.data.datasets[0].data[index];
    //Skip if this slice has 0 chartValue
    if (!chartValue || chartValue === 0 || arc.circumference === 0) return;

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
    else if (index === 1 && (nonVulnerablePercentage >= 90 && nonVulnerablePercentage < 100)) angle += 0.6;
    else if (index === 1 && (nonVulnerablePercentage == 100)) angle += 0.7;
    else if (index === 1 && (nonVulnerablePercentage == 0)) angle -= 0.3;

    // Start point on arc edge
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    // Fixed leader line lengths
    const lineLength = 20;   // radial outwards
    const horizLength = 30;  // horizontal offset

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
        labels: isDataFetched ? ['Vulnerable', 'Non-Vulnerable'] : [''],
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
            callbacks: { title: () => "Risk Status",
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
              const percentage = total ? ((value / total) * 100).toFixed(0) : '';
              if(isDataFetched) {return +percentage > 0 ? percentage + '%' : '';}
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

  public sendAppData(data: ComputerDetails | null, computerId: number, index: number): void {
     this.applicationResolveService.setComputerDashPageIndex(this.pageIndex);
     this.applicationResolveService.setComputerDashPageSize(this.pageSize);
     this.applicationResolveService.setSelectedComputerIndex(index);
     this.selectedComputerId = computerId;
     this.applicationResolveService.setSelectedComputerId(this.selectedComputerId);
     this.applicationDashboardComponent['resetFilters']();
     const appData = { machineName: data?.machineName || 'Unknown',
      loggedInUserName: data?.loggedInUserName || 'Unknown', loggedInUserEmail: data?.loggedInUserEmail,
      vulnerableSoftwareCount: data?.vulnerableSoftwareCount || 0, appData: data?.applicationDetails || [],
      createdAt: data?.createdAt, updatedAt: data?.updatedAt };
     this.applicationDashboardComponent.sendAppData(data, computerId);
     this.pagedComputerData = this.pagedComputerData.map((computer) => {
        if(this.selectedComputerId === computer.id) computer.selected = true
        else computer.selected = false
        return computer
     }); 
    }

  public sendAppDataFromClick(data: ComputerDetails | null, computerId: number, index: number): void {
  this.sendAppData(data, computerId, index);

  setTimeout(() => {
    if (this.applicationDashboardSection) {
      this.applicationDashboardSection.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, 200);
}

  public getPage(page: number): void {
    this.recordIndex = page - 1;
    this.pageIndex = this.recordIndex;
    this.applicationResolveService.setComputerDashPageIndex(this.pageIndex);
    this.start = this.recordIndex * this.pageSize;
    this.end = this.start + this.pageSize;
    this.pagedComputerData = this.finalComputerDetails.slice(this.start, this.end);
  }

  public nextPage(): void {
    if(this.pageIndex >= 0 && this.pageIndex < this.totalPages && this.pageIndex !== this.totalPages - 1) {
    this.pageIndex++;
    this.applicationResolveService.setComputerDashPageIndex(this.pageIndex);
    this.applicationResolveService.setComputerDashPageSize(this.pageSize);
    this.recordIndex = this.pageIndex + 1;
    this.start = this.pageIndex * this.pageSize;
    this.end = this.start + this.pageSize;
    this.pagedComputerData = this.finalComputerDetails.slice(this.start, this.end).map((computer) => {
        if(this.selectedComputerId === computer?.id) computer.selected = true
        else computer.selected = false
        return computer;
     });
    }
   }
  public previousPage(): void {
    if(this.pageIndex > 0) {
      this.pageIndex--;
      this.applicationResolveService.setComputerDashPageIndex(this.pageIndex);
      this.applicationResolveService.setComputerDashPageSize(this.pageSize);
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
    this.pageIndex = initialIndex;
    this.recordIndex = this.pageIndex + 1;  
    console.log(this.pageIndex, this.recordIndex,this.start, this.end)
    this.pageSizes = len >= 100 ? [ 5,10, 25, 50, 100] : len <= 100 && len >= 50 ? [ 5,10, 25, 50] : 
    len <= 50 && len >= 25 ? [5, 10, 25] : len <= 25 && len >= 10 ? [5,10] : len <=10 && len >= 0 ? [5] : [0];
    this.pagedComputerData = this.finalComputerDetails.slice(this.start, this.end).map((computer) => {
        if(this.selectedComputerId === computer?.id) computer.selected = true
        else computer.selected = false
        return computer;
    });
   }

  public onPageSizeChange(size: number): void {
   this.pageSize = size;
   this.applicationResolveService.setComputerDashPageSize(this.pageSize);
   let pages = Math.ceil(this.finalComputerDetails.length / this.pageSize);
   this.totalPages = pages;
   this.totalRecords = Array.from({length: pages}, (_, i) => i + 1);
   this.pageIndex = 0;
   this.applicationResolveService.setComputerDashPageIndex(this.pageIndex);
   this.recordIndex = this.pageIndex + 1;
   this.updatePagedData(this.pageIndex);
   }
public searchComputer() {
     const searchValue = this.computerSearchTearm?.toLocaleLowerCase().trim() || '';
     const baseList = this.showVulnerableComputer
    ? this.computerDetails.filter(c => c.vulnerableSoftwareCount > 0)
    : this.computerDetails;
     if(searchValue === "") {
         this.pageIndex = 0;
         this.finalComputerDetails = baseList;
         this.updatePagedData(this.initialIndex);
     } else {
         this.finalComputerDetails = baseList.filter(computer => {
        return computer.macAddress?.toLocaleLowerCase().includes(searchValue) || computer.machineName?.toLocaleLowerCase().includes(searchValue)
        || computer.loggedInUserName?.toLocaleLowerCase().includes(searchValue);
      });
     }
     console.log(this.initialIndex)
     this.updatePagedData(this.initialIndex);
  } 
  
  public async sendNotificationToAllComputers() {
    this.dialogRef = this.dialog.open(this.notificationConfirmDialog);
    const confirm = await firstValueFrom(this.dialogRef.afterClosed());
    if(!confirm) return;
    const headers = new HttpHeaders({
    'Accept': 'application/json'
    });
      this.http.get<any>(ApiEndPoints.sendNotificationToAllComputers, {headers}).subscribe({
        next:(response)=>{
             this.toastService.showSuccessToast(response.message);
        }, error: (error)=>{
             this.toastService.showErrorToast('Send Notification Failed');
        }
      })
  }

}  
