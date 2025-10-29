import { CommonModule } from '@angular/common';
import { AfterViewChecked, AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MatNavList } from '@angular/material/list';
import { MatSidenav, MatSidenavContent, MatSidenavModule} from '@angular/material/sidenav';
import { MatToolbar } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ComputerDashboardComponent } from '../computer-dashboard/computer-dashboard.component';
import { SharedDataService } from '../core/services/shared-data.service';
import { AppRoutes } from '../../environments/approutes';
import { filter } from 'rxjs';

@Component({
  selector: 'app-main-dashboard',
  imports: [CommonModule, MatIconModule, MatSidenavModule, MatToolbar, MatNavList,
          RouterOutlet, RouterLink, MatTooltipModule, RouterModule],
  templateUrl: './main-dashboard.component.html',
  styleUrl: './main-dashboard.component.css'
})
export class MainDashboardComponent implements OnInit, AfterViewInit, AfterViewChecked{
    isMiniSidenav = false;
    isMobile = false;
    sidenavPosition!: 'start';
    hoverState: String = "";
    urlMatch: boolean = false;

    @ViewChild('sidenav') sidenav!: MatSidenav;
    @ViewChild('matSideNavContent') matSideNavContent!: MatSidenavContent;
    @ViewChild('computerDashboard') computerDashboard!: ComputerDashboardComponent;
    sideMenuItems = [ {title: 'Computer Overview', icon: 'dashboard', link: '/computer-overview'},
    {title: 'Resolve Applications', icon: 'app_registration', link: '/resolve-applications'},
    {title: 'Search Vulnerability', icon: 'search_insights', link: '/cpe-cve-search'}];
    
  constructor(private breakpointObserver: BreakpointObserver, private sharedDataService: SharedDataService, private router: Router){}
   ngOnInit(): void {
        let currentUrl = this.router.url;
        
     this.urlMatch = currentUrl.includes(AppRoutes.computer_dashboard) || currentUrl.includes(AppRoutes.resolve_applications);
     this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
        currentUrl = event.urlAfterRedirects;
        this.urlMatch = currentUrl.includes(AppRoutes.computer_dashboard) || currentUrl.includes(AppRoutes.resolve_applications);
     });
   }
  ngAfterViewInit(): void {
    setTimeout(()=>{
    this.setupSidenav();
    })
  }

  ngAfterViewChecked(): void {
    if(!this.isMiniSidenav && this.matSideNavContent.getElementRef().nativeElement.style.marginLeft !== '5%' && !this.isMobile) {
      this.matSideNavContent.getElementRef().nativeElement.style.marginLeft = '5%';
    }
  }

  private setupSidenav(): void {
    if (!this.sidenav) {
      console.error('Sidenav not found');
      return;
    }

    this.sidenav.mode = 'side';
    this.sidenav.open();

    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .subscribe(result => {
        this.isMobile = result.matches;
        this.sidenav.mode = this.isMobile ? 'over' : 'side';
        this.sidenav.opened = !this.isMobile;
        if(!this.isMobile) this.isMiniSidenav = false;
      });
  }

   toggleSidenavMode(): void {
    if (this.isMobile) {
      this.sidenav.toggle();
    }
  }

  closeSideNav(): void {
    this.sidenav.close()
  }

  expandSidenav(): void {
      this.isMiniSidenav = !this.isMiniSidenav;
}

public onMouseLeave() {
   if(!this.isMobile) {
     this.hoverState = "collapse";
     setTimeout(()=>{
       this.hoverState = "";
     }, 300);
   } 
}

public syncSecurityData() {
    this.sharedDataService.syncSecurityData();
}

}
