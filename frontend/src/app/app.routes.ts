import { Routes } from '@angular/router';
import { authGuard, staffGuard } from './core/guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'services' },
  { path: 'services', loadComponent: () => import('./features/catalog/catalog.component').then(m => m.CatalogComponent) },
  { path: 'services/:slug/apply', canActivate: [authGuard], loadComponent: () => import('./features/apply/apply.component').then(m => m.ApplyComponent) },
  { path: 'applications', canActivate: [authGuard], loadComponent: () => import('./features/applications/my-applications.component').then(m => m.MyApplicationsComponent) },
  { path: 'applications/:id', canActivate: [authGuard], loadComponent: () => import('./features/applications/application-detail.component').then(m => m.ApplicationDetailComponent) },
  { path: 'officer', canActivate: [staffGuard], loadComponent: () => import('./features/officer/officer-inbox.component').then(m => m.OfficerInboxComponent) },
  { path: 'officer/:id', canActivate: [staffGuard], loadComponent: () => import('./features/officer/officer-detail.component').then(m => m.OfficerDetailComponent) },
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent) },
  { path: 'about', loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent) },
  { path: '**', redirectTo: 'services' }
];
