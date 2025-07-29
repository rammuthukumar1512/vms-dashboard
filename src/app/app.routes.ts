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
    ]
    },
    {path: '**', redirectTo: ''}
];
