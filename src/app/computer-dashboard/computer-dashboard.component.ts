import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
import { MatSelectChange } from '@angular/material/select';
import { MatLabel, MatOption, MatSelectModule } from '@angular/material/select';
import { catchError, Observable, pipe, Subject, take, takeUntil, throwError } from 'rxjs';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-computer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, FlexLayoutModule, MatCardModule, MatIconModule, MatSlideToggleModule,
   MatTooltipModule,ApplicationDashboardComponent, MatLabel, MatOption, MatSelectModule
  ],
  templateUrl: './computer-dashboard.component.html',
  styleUrl: './computer-dashboard.component.css'
})
export class ComputerDashboardComponent implements OnInit, AfterViewInit{
  @ViewChild('computerChart') computerChart: ElementRef<HTMLCanvasElement> | undefined;
  computerChartInstance!: Chart<'doughnut'>;
  securityData: SecurityReport = {
    totalComputers: 0,
    vulnerableComputers: 0,
    computerDetails: []
  };
  totalComputers: number = 0;
  vulnerableComputers: number = 0;
  computerDetails: ComputerDetails[] = [];
  finalComputerDetails: ComputerDetails[] = [];
  showVulnerableComputer: boolean = false;
  pagedComputerData: ComputerDetails[] = [];
  initialIndex:number = 0;
  pageIndex:number = 0;
  pageSize:number = 5;
  currentPageSize:number = this.pageSize;
  totalPages:number = 0;
  pageSizes:Array<number> = [];
  start:number = 0;
  end:number = 0;
  private destroy$ = new Subject<void>();
  @ViewChild('computerInfo') computerInfo: ElementRef<HTMLElement> | undefined;
  @ViewChild('compTableParent') compTableParent: ElementRef<HTMLElement> | undefined;

  constructor(private http: HttpClient, private sharedDataService: SharedDataService, private toastService: ToastService) {};

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
    this.toastService.showSuccess('Data fetched successfully');
    this.sendAppData(this.computerDetails[0] ?? null);
    this.drawVulnBasedComputerChart();
    this.updatePagedData(this.initialIndex);
  }

  private handleErrorResponse(error: any): void {
    console.error('Error fetching security data:', error);
    if (error.status === 0) {
      this.toastService.showError(
        'Unable to connect to the server. Please check your network or try again later.'
      );
    } else {
      this.toastService.showError(
        'Error : Failed to fetch security data'
      );
    }
  }

  ngAfterViewInit(): void {
    // if(this.computerInfo?.nativeElement && this.compTableParent?.nativeElement) {
    //   this.compTableParent.nativeElement.style.height = `${ window.innerHeight - this.computerInfo?.nativeElement.offsetHeight }px`
    //   console.log(this.compTableParent.nativeElement.style.height);
    // }  
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
          backgroundColor: ['#66b3ff', '#3366ff'],
          borderColor: ['#ffffff', '#ffffff'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
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

  public nextPage(): void {
    if(this.pageIndex >= 0 && this.pageIndex < this.totalPages && this.pageIndex !== this.totalPages - 1) {
    this.pageIndex++;
    this.start = this.pageIndex * this.pageSize;
    this.end = this.start + this.pageSize;
    this.pagedComputerData = this.finalComputerDetails.slice(this.start, this.end);
    }
   }
  public previousPage(): void {
    if(this.pageIndex > 0) {
      this.pageIndex--;
      this.start = this.pageIndex * this.pageSize;
      this.end = this.start + this.pageSize;
      this.pagedComputerData = this.finalComputerDetails.slice(this.start, this.end);
    }
   }
  
  public updatePagedData(initialIndex:number): void {
    let pages = Math.ceil(this.finalComputerDetails.length / this.pageSize);
    this.totalPages = pages;
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
   this.pageIndex = 0;
   this.updatePagedData(this.pageIndex);
   }

}
