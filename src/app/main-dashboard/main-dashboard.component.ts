import { CommonModule } from '@angular/common';
import { AfterViewChecked, AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';
import { MatNavList } from '@angular/material/list';
import { MatSidenav, MatSidenavContainer, MatSidenavContent, MatSidenavModule} from '@angular/material/sidenav';
import { MatToolbar } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-main-dashboard',
  imports: [CommonModule, MatIconModule, MatSidenavModule, MatToolbar, MatNavList,
          RouterOutlet, RouterLink, MatTooltipModule, RouterModule],
  templateUrl: './main-dashboard.component.html',
  styleUrl: './main-dashboard.component.css'
})
export class MainDashboardComponent implements AfterViewInit, AfterViewChecked{
    isMiniSidenav = false;
    isMobile = false;
    sidenavPosition!: 'start';

    @ViewChild('sidenav') sidenav!: MatSidenav;
    @ViewChild('matSideNavContent') matSideNavContent!: MatSidenavContent;
    sideMenuItems = [ {title: 'Computer Overview', icon: 'dashboard', link: '/computer-overview'},
      {title: 'Resolve Applications', icon: 'app_registration', link: '/resolve-applications'},
    {title: 'Search Vulnerability', icon: 'search_insights', link: '/cpe-cve-search'}];
    
    constructor(private breakpointObserver: BreakpointObserver){}

    ngAfterViewInit(): void {
    this.setupSidenav();
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
        console.log(result);
        this.isMobile = result.matches;
        this.sidenav.mode = this.isMobile ? 'over' : 'side';
        this.sidenav.opened = !this.isMobile;
        if(!this.isMobile) this.isMiniSidenav = false;
      });
  }

   toggleSidenavMode(): void {
    console.log(this.isMobile)
    if (this.isMobile) {
      this.sidenav.toggle();
    }
  }

  expandSidenav(): void {
      this.isMiniSidenav = !this.isMiniSidenav;
}

}
