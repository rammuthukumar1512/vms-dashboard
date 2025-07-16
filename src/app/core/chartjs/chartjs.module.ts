import { Chart, ArcElement, Tooltip, Legend, PieController, DoughnutController, BarController, CategoryScale, LinearScale } from 'chart.js';

// Register globally used Chart.js components
Chart.register(ArcElement, Tooltip, Legend,
  PieController,
  DoughnutController,
  BarController,
  CategoryScale,
  LinearScale
);

export class ChartJSModule {
  static initialize(): void {
   
  }
}
