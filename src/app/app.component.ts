import { Component } from '@angular/core';
import { ComputerDashboardComponent } from './computer-dashboard/computer-dashboard.component';

@Component({
  selector: 'app-root',
<<<<<<< HEAD
  imports: [RouterOutlet, ComputerDashboardComponent, RouterOutlet],
=======
  imports: [ ComputerDashboardComponent],
>>>>>>> cea96ca0491982306afe08bd3d4b85bd5eed66a9
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'vms-dashboard';
}
