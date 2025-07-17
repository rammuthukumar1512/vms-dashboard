import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { HttpClient } from '@angular/common/http';
import { environments } from '../../environments/environments';
import { SecurityReport, ComputerDetails } from '../models/computer.model';
import { Chart } from 'chart.js';
import { MatIconModule } from '@angular/material/icon';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SharedDataService } from '../core/services/shared-data.service';
import { MatSelectChange } from '@angular/material/select';
import { MatLabel, MatOption, MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-computer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, FlexLayoutModule, MatCardModule, MatIconModule, MatSlideToggleModule,
    MatTooltipModule, MatLabel, MatOption, MatSelectModule

  ],
  templateUrl: './computer-dashboard.component.html',
  styleUrl: './computer-dashboard.component.css'
})
export class ComputerDashboardComponent implements OnInit, AfterViewInit{
  @ViewChild('computerChart') computerChart: ElementRef<HTMLCanvasElement> | undefined;
  computerChartInstance!: Chart<'pie'>;
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
  @ViewChild('computerInfo') computerInfo: ElementRef<HTMLElement> | undefined;
  @ViewChild('compTableParent') compTableParent: ElementRef<HTMLElement> | undefined;

  constructor(private http: HttpClient, private sharedDataService: SharedDataService) {};

  ngOnInit(): void {
    this.http.get<any>(environments.unique_url).subscribe({
      next: (data) => {
        console.log(data);
        this.securityData = data || {};
        this.totalComputers = this.securityData.totalComputers || 0;
        this.vulnerableComputers = this.securityData.vulnerableComputers || 0;
        this.computerDetails = this.securityData.computerDetails || [];
        this.finalComputerDetails = this.computerDetails;
        this.sendAppData(this.computerDetails[0] || null);
        this.drawVulnBasedComputerChart();
        this.updatePagedData(this.initialIndex);
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

  ngAfterViewInit(): void {
    console.log(this.computerInfo?.nativeElement)
    if(this.computerInfo?.nativeElement && this.compTableParent?.nativeElement) {
      this.compTableParent.nativeElement.style.height = `${ window.innerHeight - this.computerInfo?.nativeElement.offsetHeight}px`
      console.log(this.compTableParent.nativeElement.offsetHeight);
    }  
  }

  toggleVulnerableComputers() {
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

  drawVulnBasedComputerChart(): void {
    if (!this.computerChart?.nativeElement) return;

    const ctx = this.computerChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.computerChartInstance) {
      this.computerChartInstance.destroy();
    }

    const vulnerableCount = this.vulnerableComputers;
    const nonVulnerableCount = this.totalComputers - vulnerableCount;

    this.computerChartInstance = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Vulnerable', 'Non-Vulnerable'],
        datasets: [{
          data: [vulnerableCount, nonVulnerableCount],
          backgroundColor: ['#d85351', '#50a855'],
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
          }
        }
      }
    });
  }

  sendAppData(data: ComputerDetails | null): void {
     const appData = {vulnerableSoftwareCount: data?.vulnerableSoftwareCount || 0, appData: data?.applicationDetails || []};
     console.log(appData)
     this.sharedDataService.sendAppData(appData);
  }

  nextPage(): void {
    if(this.pageIndex >= 0 && this.pageIndex < this.totalPages && this.pageIndex !== this.totalPages - 1) {
    this.pageIndex++;
    this.start = this.pageIndex * this.pageSize;
    this.end = this.start + this.pageSize;
    this.pagedComputerData = this.finalComputerDetails.slice(this.start, this.end);
    }
   }
   previousPage(): void {
    if(this.pageIndex > 0) {
      this.pageIndex--;
      this.start = this.pageIndex * this.pageSize;
      this.end = this.start + this.pageSize;
      this.pagedComputerData = this.finalComputerDetails.slice(this.start, this.end);
    }
   }
  
   updatePagedData(initialIndex:number): void {
    let pages = Math.ceil(this.finalComputerDetails.length / this.pageSize);
    this.totalPages = pages;
    this.start = initialIndex * this.pageSize;
    this.end = this.start + this.pageSize;
    const len = this.finalComputerDetails.length;
    this.pageSizes = len >= 100 ? [10, 25, 50, 100] : len <= 100 && len >= 50 ? [10, 25, 50] : 
    len <= 50 && len >= 25 ? [5, 10, 25] : len <= 25 && len >= 10 ? [5,10] : len <=10 && len >= 0 ? [5] : [0];
    this.pagedComputerData = this.finalComputerDetails.slice(this.start, this.end);
   }
   onPageSizeChange(event: number): void {
    console.log(event)
   this.pageSize = event;
   this.pageIndex = 0;
   this.updatePagedData(this.pageIndex);
   }

}
