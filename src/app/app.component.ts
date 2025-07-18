import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';  // <-- add this import
import { ComputerDashboardComponent } from './computer-dashboard/computer-dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ComputerDashboardComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']  // <-- note: it's `styleUrls`, not `styleUrl`
})
export class AppComponent {
  title = 'vms-dashboard';
}
