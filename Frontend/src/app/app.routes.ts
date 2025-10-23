import { Routes } from '@angular/router';
import { LayoutComponent } from './disposición/layout.component';
import { adminGuard } from './núcleos/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./páginas/autenticación/login-page.component')
        .then(m => m.LoginPageComponent)
  },

  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'inicio',
        loadComponent: () =>
          import('./páginas/inicio/inicio-page.component')
            .then(m => m.InicioPageComponent)
      },
      {
        path: 'usuarios',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./páginas/usuarios/usuarios-page.component')
            .then(m => m.UsuariosPageComponent)
      },
      {
        path: 'dashboard',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./páginas/dashboard/dashboard-page.component')
            .then(m => m.DashboardPageComponent)
      },
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
    ]
  },

  { path: '**', redirectTo: 'inicio' }
];