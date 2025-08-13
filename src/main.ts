import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { ArcElement, BarController, BarElement, CategoryScale, Chart, DoughnutController, Legend, LinearScale, PieController, Tooltip } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(ArcElement, Tooltip, Legend,
  PieController,
  DoughnutController,
  BarElement,
  BarController,
  CategoryScale,
  LinearScale, ChartDataLabels
);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
