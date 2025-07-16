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

@Component({
  selector: 'app-computer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, FlexLayoutModule, MatCardModule, MatIconModule, MatSlideToggleModule,
    MatTooltipModule
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
  @ViewChild('firstRow', {static: false}) firstRow: ElementRef<HTMLElement> | undefined;

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
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

  ngAfterViewInit(): void {
    console.log(this.firstRow?.nativeElement)
    if(this.firstRow?.nativeElement) {
      this.firstRow.nativeElement.style.height = `${window.innerHeight}px`
      console.log(this.firstRow.nativeElement.style.height)
    }
  }

  toggleVulnerableComputers() {
    console.log(this.showVulnerableComputer)
     if(this.showVulnerableComputer) {
          this.finalComputerDetails = this.computerDetails.filter(computer => {
                  return computer.vulnerableSoftwareCount > 0;
          });
     } else {
          this.finalComputerDetails = this.computerDetails;
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

}
