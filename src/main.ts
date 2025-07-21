import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
// import { ChartJSModule } from './app/core/chartjs/chartjs.module';
// ChartJSModule.initialize();


bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
