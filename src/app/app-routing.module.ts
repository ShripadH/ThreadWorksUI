import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';


const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'orders',
    loadComponent: () => import('./pages/order/order-list/order-list.component').then(m => m.OrderListComponent)
  },
  {
    path: 'orders/details/:id',
    loadComponent: () => import('./pages/order/order-details/order-details.component').then(m => m.OrderDetailsComponent)
  },
  {
    path: 'company',
    loadComponent: () => import('./pages/company/company-list/company-list.component').then(m => m.CompanyListComponent)
  },
  {
    path: 'measurements/:orderId',
    loadComponent: () => import('./pages/measurements/measurements.component').then(m => m.MeasurementsComponent)
  },
  {
    path: 'measurements',
    loadComponent: () => import('./pages/measurements/measurements.component').then(m => m.MeasurementsComponent)
  },
  {
    path: 'orders/:orderId/phase-measurements',
    loadComponent: () => import('./pages/measurements/phase-measurements/phase-measurements.component').then(m => m.PhaseMeasurementsComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'company/details/:id',
    loadComponent: () => import('./pages/company/company-details/company-details.component').then(m => m.CompanyDetailsComponent)
  },
  {
    path: 'admin/phase-configs',
    loadComponent: () => import('./pages/admin/phase-config-list/phase-config-list.component').then(m => m.PhaseConfigListComponent)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
