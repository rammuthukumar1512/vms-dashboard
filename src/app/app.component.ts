import { Component } from '@angular/core';
import { ComputerDashboardComponent } from './computer-dashboard/computer-dashboard.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ComputerDashboardComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']  // <-- note: it's `styleUrls`, not `styleUrl`
})
export class AppComponent {
  title = 'vms-dashboard';
}
