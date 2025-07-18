import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ComputerDashboardComponent } from './computer-dashboard/computer-dashboard.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ComputerDashboardComponent, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'vms-dashboard';
}
