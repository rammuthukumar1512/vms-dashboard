import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { ApiEndPoints } from '../../environments/api-endpoints';
import { Subject, takeUntil } from 'rxjs';
import { LikelyCpeDialogComponent } from '../resolve-applications/likely-cpe-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../core/services/toast.service';
import { ApplicationResolveService } from '../core/services/application-resolve.service';
import { Router } from '@angular/router';


interface UnresolvedApplication {
  uuid: string;
  softwareName: string;
  softwareVersion: string;
  vendorName: string;
}

@Component({
  selector: 'app-resolve-applications',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatSelectModule,
    FormsModule,
    
  ],
  templateUrl: './resolve-applications.component.html',
  styleUrls: ['./resolve-applications.component.css']
})
export class ResolveApplicationsComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['softwareName', 'softwareVersion', 'vendorName', 'action'];
  unresolvedApps: UnresolvedApplication[] = [];
  pagedApps: UnresolvedApplication[] = [];
  pageIndex = 0;
  pageSize = 5;
  pageSizes: number[] = [];
  recordIndex = 1;
  totalPages = 0;
  totalRecords: number[] = [];
  start = 0;
  end = 0;
  initialIndex = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private toastService: ToastService,
    private applicationResolveService: ApplicationResolveService, private router: Router // Added service

  ) {}

  ngOnInit(): void {
    this.fetchUnresolvedApplications();
      this.applicationResolveService.resolveData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        if (data) {
          this.openLikelyCpeDialog(data);
          this.applicationResolveService.clearResolveData(); // Clear data after opening dialog
        }
      });
      this.applicationResolveService.setPreviousUrl(this.router.url);
  }

  fetchUnresolvedApplications(): void {
    this.http.get<UnresolvedApplication[]>(ApiEndPoints.unresolvedAppsUrl)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.unresolvedApps = (data || []).map(app => ({
            uuid: app.uuid,
            softwareName: app.softwareName,
            softwareVersion: app.softwareVersion,
            vendorName: app.vendorName || app.vendorName

          }));
          this.updatePagedData(this.initialIndex);
        },
        error: (error) => {
          console.error('Error fetching unresolved applications:', error);
          this.toastService.showErrorToast('No Likely CPEs to fetch for these unresolved applications')
        }
      });
  }

  resolveApplication(app: UnresolvedApplication): void {
        this.openLikelyCpeDialog(app);
    }

     private openLikelyCpeDialog(app: UnresolvedApplication): void {
    const dialogRef = this.dialog.open(LikelyCpeDialogComponent, {
      width: '800px',
      data: {
        uuid: app.uuid,
        softwareName: app.softwareName,
        softwareVersion: app.softwareVersion,
        vendor: app.vendorName
      }
    });


    dialogRef.afterClosed().subscribe(result => {
      if (result && result.cpeName) {
        this.unresolvedApps = this.unresolvedApps.filter(a => a.uuid !== app.uuid);
        this.updatePagedData(this.pageIndex);
        this.toastService.showSuccessToast(`CPE resolved for ${app.softwareName}`);
      this.http.get(ApiEndPoints.unique_url).subscribe({
        next: () => {
          console.log('Dashboard data refreshed');
        },
        error: (error) => {
          console.error('Error refreshing dashboard:', error);
        }
        });
      }
    });
  }

  searchValue: string = '';


searchApplications(event: Event): void {
  this.searchValue = (event.target as HTMLInputElement).value.toLowerCase();
  if (this.searchValue === '') {
    this.pageIndex = 0; // Reset to first page
    this.pageSize = 5;  // Reset to initial page size
    this.recordIndex = 1; // Reset record index
  }
  this.updatePagedData(this.initialIndex);
}
updatePagedData(initialIndex: number): void {
  let filteredApps = this.unresolvedApps;
  if (this.searchValue) {
    filteredApps = filteredApps.filter(app =>
      app.softwareName?.toLowerCase().includes(this.searchValue) ||
      app.softwareVersion?.toLowerCase().includes(this.searchValue) ||
      app.vendorName?.toLowerCase().includes(this.searchValue)
    );
  }

  const totalItems = filteredApps.length;

  // Dynamically set pageSizes based on total items
  if (totalItems >= 100) {
    this.pageSizes = [5, 10, 25, 50, 100];
  } else if (totalItems >= 50) {
    this.pageSizes = [5, 10, 25, 50];
  } else if (totalItems >= 25) {
    this.pageSizes = [5, 10, 25];
  } else if (totalItems >= 10) {
    this.pageSizes = [5, 10];
  } else if (totalItems > 0) {
    this.pageSizes = [5];
  } else {
    this.pageSizes = [];
  }

  // Ensure selected pageSize is within the available sizes
  if (!this.pageSizes.includes(this.pageSize)) {
    this.pageSize = this.pageSizes.length > 0 ? this.pageSizes[0] : 5;
  }

  // Reset pagination if pageIndex is out of range
  this.totalPages = Math.ceil(totalItems / this.pageSize);
  if (this.pageIndex >= this.totalPages) {
    this.pageIndex = 0;
    this.recordIndex = 1;
  }

  this.totalRecords = Array.from({ length: this.totalPages }, (_, i) => i + 1);

  this.start = this.pageIndex * this.pageSize;
  this.end = this.start + this.pageSize;
  this.pagedApps = filteredApps.slice(this.start, this.end);
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
    this.pageIndex = page - 1;
    this.recordIndex = page;
    this.updatePagedData(this.pageIndex);
  }

  onPageSizeChange(event: number): void {
    this.pageSize = event;
    this.pageIndex = 0;
    this.recordIndex = 1;
    this.updatePagedData(this.pageIndex);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}