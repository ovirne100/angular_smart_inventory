import { Routes } from '@angular/router';

// 🔐 Login y Registro
import { MainLoginComponent } from './login/main-login/main-login.component';
import { MainRegisterComponent } from './register/main-register/main-register.component';

// 📊 Dashboard principal y sus páginas
import { DashboardComponent } from './dashboard/dashboard.component';
import { InicioComponent } from './dashboard/pages/inicio/inicio.component';
import { ProductosComponent } from './dashboard/pages/productos/productos.component';
import { AlertasComponent } from './dashboard/pages/alertas/alertas.component';
import { MovimientosComponent } from './dashboard/pages/movimientos/movimientos.component';
import { ProveedoresComponent } from './dashboard/pages/proveedores/proveedores.component';
import { InformesComponent } from './dashboard/pages/informes/informes.component';

// 🚚 Submódulos de movimientos
import { EntradaComponent } from './dashboard/pages/movimientos/entrada/entrada.component';
import { SalidaComponent } from './dashboard/pages/movimientos/salida/salida.component';

export const routes: Routes = [
  // ✅ Rutas públicas
  { path: 'register', component: MainRegisterComponent },
  { path: 'login', component: MainLoginComponent },

  // ✅ Rutas del Dashboard (sección privada)
  {
    path: 'dashboard',
    component: DashboardComponent,
    children: [
      // Página principal del dashboard
      { path: 'inicio', component: InicioComponent },

      // Módulo de productos
      { path: 'productos', component: ProductosComponent },

      // Módulo de alertas
      { path: 'alertas', component: AlertasComponent },

      // 📦 Módulo de movimientos (con hijos)
      {
        path: 'movimientos',
        component: MovimientosComponent,
        children: [
          { path: 'entradas', component: EntradaComponent },
          { path: 'salidas', component: SalidaComponent },
          { path: '', redirectTo: 'entradas', pathMatch: 'full' } // Default
        ]
      },

      // Módulo de proveedores
      { path: 'proveedores', component: ProveedoresComponent },

      // Módulo de informes
      { path: 'informes', component: InformesComponent },

      // Redirección interna al inicio del dashboard
      { path: '', redirectTo: 'inicio', pathMatch: 'full' }
    ]
  },

  // ✅ Redirecciones globales
  { path: '', redirectTo: 'register', pathMatch: 'full' },
  { path: '**', redirectTo: 'register' }
];
