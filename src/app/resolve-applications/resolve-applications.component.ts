// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { MatTableModule } from '@angular/material/table';
// import { MatButtonModule } from '@angular/material/button';
// import { MatDialog, MatDialogModule } from '@angular/material/dialog';
// import { HttpClient } from '@angular/common/http';
// import { environments } from '../../environments/environments';
// import { MatSnackBar } from '@angular/material/snack-bar';
// import { Subject, takeUntil } from 'rxjs';
// import { LikelyCpeDialogComponent } from '../computer-dashboard/application-dashboard/likely-cpe-dialog.component';
// import { MatIconModule } from '@angular/material/icon';

// interface UnresolvedApplication {
//   uuid: string;
//   softwareName: string;
//   softwareVersion: string;
//   vendorName: string;
// }

// @Component({
//   selector: 'app-resolve-applications',
//   standalone: true,
//   imports: [
//     CommonModule,
//     MatTableModule,
//     MatButtonModule,
//     MatDialogModule,
//     MatIconModule
//   ],
//   templateUrl: './resolve-applications.component.html',
//   styleUrls: ['./resolve-applications.component.css']
// })
// export class ResolveApplicationsComponent implements OnInit, OnDestroy {
//   displayedColumns: string[] = ['softwareName', 'softwareVersion', 'vendorName', 'action'];
//   unresolvedApps: UnresolvedApplication[] = [];
//   private destroy$ = new Subject<void>();

//   constructor(
//     private http: HttpClient,
//     private dialog: MatDialog,
//     private snackBar: MatSnackBar
//   ) {}

//   ngOnInit(): void {
//     this.fetchUnresolvedApplications();
//   }

//   fetchUnresolvedApplications(): void {
//     this.http.get<UnresolvedApplication[]>(environments.unresolvedAppsUrl)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (data) => {
//           this.unresolvedApps = data || [];
//         },
//         error: (error) => {
//           console.error('Error fetching unresolved applications:', error);
//           this.snackBar.open('Failed to fetch unresolved applications', 'Close', {
//             duration: 5000,
//             verticalPosition: 'bottom',
//             horizontalPosition: 'right'
//           });
//         }
//       });
//   }

//   resolveApplication(app: UnresolvedApplication): void {
//     const dialogRef = this.dialog.open(LikelyCpeDialogComponent, {
//       width: '600px',
//       data: {
//         uuid: app.uuid,
//         softwareName: app.softwareName,
//         softwareVersion: app.softwareVersion,
//         vendorName: app.vendorName
//       }
//     });

//     dialogRef.afterClosed().subscribe(result => {
//       if (result && result.cpeName) {
//         this.unresolvedApps = this.unresolvedApps.filter(a => a.uuid !== app.uuid);
//         this.snackBar.open(`CPE resolved for ${app.softwareName}`, 'Close', {
//           duration: 3000,
//           verticalPosition: 'top',
//           horizontalPosition: 'center'
//         });
//       }
//     });
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }
// }

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { environments } from '../../environments/environments';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { LikelyCpeDialogComponent } from '../resolve-applications/likely-cpe-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

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
    FormsModule
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
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.fetchUnresolvedApplications();
  }

  fetchUnresolvedApplications(): void {
    this.http.get<UnresolvedApplication[]>(environments.unresolvedAppsUrl)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.unresolvedApps = data || [];
          this.updatePagedData(this.initialIndex);
        },
        error: (error) => {
          console.error('Error fetching unresolved applications:', error);
          this.snackBar.open('Failed to fetch unresolved applications', 'Close', {
            duration: 5000,
            verticalPosition: 'bottom',
            horizontalPosition: 'right'
          });
        }
      });
  }

  resolveApplication(app: UnresolvedApplication): void {
    const dialogRef = this.dialog.open(LikelyCpeDialogComponent, {
      width: '600px',
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
        this.snackBar.open(`CPE resolved for ${app.softwareName}`, 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'center'
        });
        // Refresh dashboard data
      this.http.get(environments.unique_url).subscribe({
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
  this.pageIndex = 0;
  this.updatePagedData(this.initialIndex);
}

updatePagedData(initialIndex: number): void {
  let filteredApps = this.unresolvedApps;
  if (this.searchValue) {
    filteredApps = filteredApps.filter(app =>
      app.softwareName.toLowerCase().includes(this.searchValue) ||
      app.softwareVersion.toLowerCase().includes(this.searchValue) ||
      app.vendorName.toLowerCase().includes(this.searchValue)
    );
  }

  const totalItems = filteredApps.length;
  this.pageSizes = totalItems >= 100 ? [5, 10, 25, 50, 100] :
                   totalItems >= 50  ? [5, 10, 25, 50] :
                   totalItems >= 25  ? [5, 10, 25] :
                   totalItems >= 10  ? [5, 10] :
                   totalItems > 0    ? [5] : [0];

  this.totalPages = Math.ceil(totalItems / this.pageSize);
  this.totalRecords = Array.from({ length: this.totalPages }, (_, i) => i + 1);

  this.start = initialIndex * this.pageSize;
  this.end = this.start + this.pageSize;
  this.pagedApps = filteredApps.slice(this.start, this.end);
}

  // updatePagedData(initialIndex: number): void {
  //   const totalItems = this.unresolvedApps.length;
  //   this.pageSizes = totalItems >= 100 ? [5, 10, 25, 50, 100] :
  //                    totalItems >= 50  ? [5, 10, 25, 50] :
  //                    totalItems >= 25  ? [5, 10, 25] :
  //                    totalItems >= 10  ? [5, 10] :
  //                    totalItems > 0    ? [5] : [0];

  //   this.totalPages = Math.ceil(totalItems / this.pageSize);
  //   this.totalRecords = Array.from({ length: this.totalPages }, (_, i) => i + 1);

  //   this.start = initialIndex * this.pageSize;
  //   this.end = this.start + this.pageSize;
  //   this.pagedApps = this.unresolvedApps.slice(this.start, this.end);
  // }

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