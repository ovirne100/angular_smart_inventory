// Angular 19 - ProveedoresComponent
import { Component, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';

// Servicios e interfaces
import { SuppliersService } from '../../../services/proveedores/suppliers.service';
import { Proveedor, Producto } from '../../../interfaces/producto';

// Componentes hijos
import { ProductSuppliersComponent } from '../product-suppliers/product-suppliers.component';
import { AsociarProductoComponent } from './asociar-producto/asociar-producto.component';
import { CrearProveedorComponent } from './crear-proveedor/crear-proveedor.component';
import { EditarProveedorComponent } from './editar-proveedor/editar-proveedor.component';
import { ProductosService } from '../../../services/productos/products.service';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [FormsModule, ProductSuppliersComponent, AsociarProductoComponent, CrearProveedorComponent, EditarProveedorComponent],
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.css']
})
export class ProveedoresComponent implements OnInit {

  proveedores: Proveedor[] = [];
  proveedorSeleccionado?: Proveedor;
  productosProveedor: Producto[] = [];
  mostrarAsociar = false;
  mostrarCrear = false;
  mostrarEditar = false;
  proveedorEnEdicion?: Proveedor;
  search = '';
  todosLosProductos: Producto[] = [];

  constructor(
    private suppliersService: SuppliersService,
    private productosService: ProductosService
  ) {}

  ngOnInit(): void {
    this.cargarProveedores();
    this.cargarTodosLosProductos();
  }

  cargarProveedores(): void {
    this.suppliersService.getSuppliers().subscribe({
      next: (res: { data: Proveedor[] }) => this.proveedores = res.data ?? [],
      error: (err: unknown) => console.error('Error cargando proveedores:', err)
    });
  }

  cargarTodosLosProductos(): void {
    this.productosService.getProducts({ search: '', page: 1, perPage: 1000 }).subscribe({
      next: (res: any) => {
        this.todosLosProductos = res.data || res;
      },
      error: (err) => console.error('Error cargando productos', err)
    });
  }

  verProductos(proveedor: Proveedor): void {
    // Si ya está seleccionado el mismo proveedor, primero limpiar para forzar recreación del componente
    if (this.proveedorSeleccionado?.id === proveedor.id) {
      this.proveedorSeleccionado = undefined;
      // Usar setTimeout para asegurar que el componente se destruya antes de recrearlo
      setTimeout(() => {
        this.proveedorSeleccionado = proveedor;
      }, 0);
    } else {
      this.proveedorSeleccionado = proveedor;
    }
    this.suppliersService.getSupplierProducts(proveedor.id).subscribe({
      next: (res: { data: Producto[] }) => this.productosProveedor = Array.isArray(res.data) ? res.data : [],
      error: (err: unknown) => console.error('Error cargando productos del proveedor:', err)
    });
  }

  abrirCrear(): void {
    this.mostrarCrear = true;
  }

  cancelarCrear(): void {
    this.mostrarCrear = false;
  }

  onProveedorCreado(): void {
    this.mostrarCrear = false;
    this.cargarProveedores();
  }

  abrirEditar(proveedor: Proveedor): void {
    this.proveedorEnEdicion = proveedor;
    this.mostrarEditar = true;
  }

  cancelarEditar(): void {
    this.mostrarEditar = false;
    this.proveedorEnEdicion = undefined;
  }

  onProveedorActualizado(proveedor: Proveedor): void {
    this.mostrarEditar = false;
    this.proveedorEnEdicion = undefined;
    this.cargarProveedores();
  }

  eliminarProveedor(proveedor: Proveedor): void {
    if (!confirm(`¿Seguro que quieres eliminar el proveedor "${proveedor.name}"?`)) return;

    this.suppliersService.delete(proveedor.id).subscribe({
      next: () => {
        alert('✅ Proveedor eliminado correctamente');
        this.cargarProveedores();
      },
      error: (err: any) => {
        console.error('Error eliminando proveedor', err);
        alert('⚠️ Error al eliminar el proveedor');
      }
    });
  }

  abrirAsociar(): void {
    this.mostrarAsociar = true;
  }

  cancelarAsociar(): void {
    this.mostrarAsociar = false;
  }

  onProductoAsociado(): void {
    this.cancelarAsociar();
    if (this.proveedorSeleccionado) this.verProductos(this.proveedorSeleccionado);
  }

  eliminarProducto(productoId: number): void {
    if (!this.proveedorSeleccionado || !confirm('¿Deseas eliminar este producto del proveedor?')) return;

    this.suppliersService.detachProduct(this.proveedorSeleccionado.id, productoId).subscribe({
      next: () => {
        this.productosProveedor = this.productosProveedor.filter(p => p.id !== productoId);
        console.log('Producto eliminado correctamente');
      },
      error: (err: unknown) => console.error('Error eliminando producto:', err)
    });
  }

  eliminarProductoDelProveedor(productoId: number): void {
    this.eliminarProducto(productoId);
  }

  asociarProductoDesdeModal(event: any): void {
    this.onProductoAsociado();
  }

  filter(): void {
    // Implementar lógica de filtrado si es necesario
  }
}
