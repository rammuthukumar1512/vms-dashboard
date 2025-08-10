import { Chart, ArcElement, Tooltip, Legend, BarElement, PieController, DoughnutController, BarController, CategoryScale, LinearScale } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

export class ChartJSModule {
  static initialize(): void {
  Chart.register(ArcElement, Tooltip, Legend,
  PieController,
  DoughnutController,
  BarElement,
  BarController,
  CategoryScale,
  LinearScale, ChartDataLabels
);
  }
}
