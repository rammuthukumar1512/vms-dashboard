import { Component } from '@angular/core';
import { ComputerDashboardComponent } from './computer-dashboard/computer-dashboard.component';
import { RouterOutlet } from '@angular/router';
import { LoaderComponent } from './shared/components/loader/loader.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']  // <-- note: it's `styleUrls`, not `styleUrl`
})
export class AppComponent {
  title = 'vms-dashboard';
}
