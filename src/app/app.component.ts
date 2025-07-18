import { Component } from '@angular/core';
import { ComputerDashboardComponent } from './computer-dashboard/computer-dashboard.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ComputerDashboardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'vms-dashboard';
}
