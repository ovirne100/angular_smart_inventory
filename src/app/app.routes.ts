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

// Login y Register publicas
import { MainLoginComponent } from './login/main-login/main-login.component';
import { MainRegisterComponent } from './register/main-register/main-register.component';

// Dashboard y sus páginas
import { DashboardComponent } from './dashboard/dashboard.component';
import { InicioComponent } from './dashboard/pages/inicio/inicio.component';
import { ProductosComponent } from './dashboard/pages/productos/productos.component';
import { AlertasComponent } from './dashboard/pages/alertas/alertas.component';
import { MovimientosComponent } from './dashboard/pages/movimientos/movimientos.component';
import { ProveedoresComponent } from './dashboard/pages/proveedores/proveedores.component';
import { ProductSuppliersComponent } from './dashboard/pages/product-suppliers/product-suppliers.component';
import { InformesComponent } from './dashboard/pages/informes/informes.component';
import { CrearProductoComponent } from './productos/crear-producto/crear-producto.component';
import { ActualizarProductoComponent } from './productos/actualizar-producto/actualizar-producto.component';
import { VerMasProductoComponent } from './productos/ver-mas-producto/ver-mas-producto.component';



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
      {
        path: 'productos',
        component: ProductosComponent,
        children: [
          { path: 'crear', component: CrearProductoComponent },
          { path: 'actualizar/:id', component: ActualizarProductoComponent },
          { path: 'ver-mas/:id', component: VerMasProductoComponent }
        ]
      },
      { path: 'alertas', component: AlertasComponent },
      { path: 'movimientos', component: MovimientosComponent },
      { path: 'proveedores', component: ProveedoresComponent },
      { path: 'product-suppliers', component: ProductSuppliersComponent },
      { path: 'informes', component: InformesComponent },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' }
    ]
  },
  // Redirecciones
  // 👇 solo esta redirección
  { path: '', redirectTo: '/dashboard/inicio', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard/inicio' }
];
