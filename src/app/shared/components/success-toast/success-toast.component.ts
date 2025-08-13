import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

@Component({
  selector: 'app-success-toast',
  imports: [],
  templateUrl: './success-toast.component.html',
  styleUrl: './success-toast.component.css'
})
export class SuccessToastComponent {
constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any) {}
}
