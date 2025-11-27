import { Routes } from '@angular/router';

// Login y Register publicas
import { MainLoginComponent } from './login/main-login/main-login.component';
import { MainRegisterComponent } from './register/main-register/main-register.component';
import { ServiciosComponent } from './pages/servicios/servicios.component';
import { ContactoComponent } from './pages/contacto/contacto.component';
import { AyudaComponent } from './pages/ayuda/ayuda.component';

// 📊 Dashboard principal y sus páginas
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



// 🚚 Submódulos de movimientos
import { EntradaComponent } from './dashboard/pages/movimientos/entrada/entrada.component';
import { SalidaComponent } from './dashboard/pages/movimientos/salida/salida.component';
import { BarcodeScannerComponent } from './dashboard/pages/movimientos/barcode-scanner/barcode-scanner.component';

export const routes: Routes = [
  // ✅ Rutas públicas
  { path: 'register', component: MainRegisterComponent },
  { path: 'login', component: MainLoginComponent },
  { path: 'servicios', component: ServiciosComponent },
  { path: 'contacto', component: ContactoComponent },
  { path: 'ayuda', component: AyudaComponent },

  // Rutas del dashboard
 {
    path: 'dashboard',
    component: DashboardComponent,
    children: [
      // Página principal del dashboard
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

      // 📦 Módulo de movimientos (con hijos)
      {
        path: 'movimientos',
        component: MovimientosComponent,
        children: [
          { path: 'entradas', component: EntradaComponent },
          { path: 'salidas', component: SalidaComponent },
          { path: 'escanear', component: BarcodeScannerComponent },
          { path: '', redirectTo: 'entradas', pathMatch: 'full' } // Default
        ]
      },

      // Módulo de proveedores
      { path: 'proveedores', component: ProveedoresComponent },
      { path: 'product-suppliers', component: ProductSuppliersComponent },
      { path: 'informes', component: InformesComponent },

      // Redirección interna al inicio del dashboard
      { path: '', redirectTo: 'inicio', pathMatch: 'full' }
    ]
  },
  // Redirecciones
  // 👇 La primera pantalla es el registro
  { path: '', redirectTo: '/register', pathMatch: 'full' },
  { path: '**', redirectTo: '/register' }
];
