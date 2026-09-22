import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth-guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
    canActivate: [authGuard],
  },
  {
    path: 'download-vanshawali',
    loadComponent: () =>
      import('./features/download-vanshawali/download-vanshawali').then(
        (m) => m.DownloadVanshawali,
      ),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'login' },
];
