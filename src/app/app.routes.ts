/*
import { Routes } from '@angular/router';
import { MainLoginComponent } from './login/main-login/main-login.component';
import { MainRegisterComponent } from './register/main-register/main-register.component';

export const routes: Routes = [
  { path: 'register', component: MainRegisterComponent },
  { path: 'login', component: MainLoginComponent },
  { path: '', redirectTo: 'register', pathMatch: 'full' },
  { path: '**', redirectTo: 'register' }


];
*/
import { Routes } from '@angular/router';

// Login y Register
import { MainLoginComponent } from './login/main-login/main-login.component';
import { MainRegisterComponent } from './register/main-register/main-register.component';

// Dashboard y sus páginas
import { DashboardComponent } from './dashboard/dashboard.component';
import { InicioComponent } from './dashboard/pages/inicio/inicio.component';
import { ProductosComponent } from './dashboard/pages/productos/productos.component';
import { AlertasComponent } from './dashboard/pages/alertas/alertas.component';
import { MovimientosComponent } from './dashboard/pages/movimientos/movimientos.component';
import { ProveedoresComponent } from './dashboard/pages/proveedores/proveedores.component';
import { InformesComponent } from './dashboard/pages/informes/informes.component';

// Hijos de movimientos
import { EntradaComponent } from './dashboard/pages/movimientos/entrada/entrada.component';
import { SalidaComponent } from './dashboard/pages/movimientos/salida/salida.component';

export const routes: Routes = [
  // Rutas públicas
  { path: 'register', component: MainRegisterComponent },
  { path: 'login', component: MainLoginComponent },

  // Rutas del dashboard
  {
    path: 'dashboard',
    component: DashboardComponent,
    children: [
      { path: 'inicio', component: InicioComponent },
      { path: 'productos', component: ProductosComponent },
      { path: 'alertas', component: AlertasComponent },

      {
        path: 'movimientos',
        component: MovimientosComponent,
        children: [
          { path: 'entrada', component: EntradaComponent },
          { path: 'salida', component: SalidaComponent },
          { path: '', redirectTo: 'entrada', pathMatch: 'full' } // Por defecto, muestra entradas
        ]
      },

      { path: 'proveedores', component: ProveedoresComponent },
      { path: 'informes', component: InformesComponent },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' }
    ]
  },

  // Redirecciones
  { path: '', redirectTo: 'register', pathMatch: 'full' },
  { path: '**', redirectTo: 'register' }
];
