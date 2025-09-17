import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path:'', loadComponent: () => import('./main-dashboard/main-dashboard.component').then(m=> m.MainDashboardComponent),
        children: [{ path: '', redirectTo: 'computer-overview', pathMatch: 'full' } ,{
            path: 'computer-overview',
            loadComponent:() => import('./computer-dashboard/computer-dashboard.component').then(m => m.ComputerDashboardComponent)
        },
        {
            path: 'resolve-applications',
            loadComponent: () => import('./resolve-applications/resolve-applications.component').then(m => m.ResolveApplicationsComponent)
        }
        ,
          { path: 'cpe-cve-search', loadComponent: () => import('./cpe-cve-search/cpe-cve-search.component').then(m => m.CpeCveSearchComponent) },
          { path: 'vulnerability-metrics/:type/:cveId', loadComponent: () => import('./computer-dashboard/vulnerability-metrics/vulnerability-metrics.component').then(m=> m.VulnerabilityMetricsComponent) },
    ]            

    },
    { path: 'vulnerability-metrics-user-report/:type/:cveId', loadComponent: () => import('./computer-dashboard/vulnerability-metrics/vulnerability-metrics.component').then(m=> m.VulnerabilityMetricsComponent) },

    { path: 'user/report/:computerUuid', loadComponent: () => import('./report/user-report-page/user-report-page.component').then(m => m.UserReportPageComponent) },
    { path: 'not-found', loadComponent: () => import('./not-found/not-found.component').then(m => m.NotFoundComponent) },
    {path: '**', redirectTo: 'not-found'},
    
];
