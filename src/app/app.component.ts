import { Component } from '@angular/core';
import { ComputerDashboardComponent } from './computer-dashboard/computer-dashboard.component';

@Component({
  selector: 'app-root',
  imports: [ ComputerDashboardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'vms-dashboard';
}
