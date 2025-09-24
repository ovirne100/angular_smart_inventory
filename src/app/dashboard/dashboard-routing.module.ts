import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardComponent } from './dashboard.component';
import { InicioComponent } from './pages/inicio/inicio.component';
import { ProductosComponent } from './pages/productos/productos.component';
import { AlertasComponent } from './pages/alertas/alertas.component';
import { MovimientosComponent } from './pages/movimientos/movimientos.component';
import { ProveedoresComponent } from './pages/proveedores/proveedores.component';
import { InformesComponent } from './pages/informes/informes.component';

const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    children: [
      { path: 'inicio', component: InicioComponent },
      { path: 'productos', component: ProductosComponent },
      { path: 'alertas', component: AlertasComponent },
      { path: 'movimientos', component: MovimientosComponent },
      { path: 'proveedores', component: ProveedoresComponent },
      { path: 'informes', component: InformesComponent },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
