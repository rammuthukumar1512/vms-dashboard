import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';  // <-- add this import
import { ComputerDashboardComponent } from './computer-dashboard/computer-dashboard.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
<<<<<<< HEAD
=======
  standalone: true,
>>>>>>> 219decf0d3acfff4cd3d7536bcad00b1f40d32fb
  imports: [RouterOutlet, ComputerDashboardComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']  // <-- note: it's `styleUrls`, not `styleUrl`
})
export class AppComponent {
  title = 'vms-dashboard';
}
