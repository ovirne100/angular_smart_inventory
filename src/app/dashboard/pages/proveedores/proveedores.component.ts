import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuppliersService, Supplier, ProductWithCategory } from '../../../services/proveedores/suppliers.service';
import { CrearProveedorComponent } from './crear-proveedor/crear-proveedor.component';
import { EditarProveedorComponent } from './editar-proveedor/editar-proveedor.component';
import { AsociarProductoComponent } from './asociar-producto/asociar-producto.component';
import { Producto } from '../../../interfaces/producto';
import { ProductosService } from '../../../services/productos/products.service';


@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, CrearProveedorComponent, EditarProveedorComponent, AsociarProductoComponent],
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.css']
})
export class ProveedoresComponent implements OnInit {
  private readonly suppliersService = inject(SuppliersService);
  private readonly productosService = inject(ProductosService);

  // list state
  suppliers: Supplier[] = [];
  page = 1;
  perPage = 10;
  total = 0;
  search = '';

  // modales
  mostrarCrear = false;
  mostrarEditar = false;
  proveedorEnEdicion: Supplier | null = null;

  // selection and details
  proveedorSeleccionado?: Supplier | null = null;
  productosProveedor: ProductWithCategory[] = [];

  //asociar producto a proveedor

  mostrarAsociar = false;
  todosLosProductos: Producto[] = []; // lista de productos disponibles
  nuevoProducto: any = {
    product_id: null,
    unit_cost: null,
    supplier_reference: ''
  };

  abrirAsociar() {
    if (!this.proveedorSeleccionado) {
      console.error('No hay proveedor seleccionado');
      return;
    }

    this.mostrarAsociar = true;

    if (this.todosLosProductos.length === 0) {
      this.productosService.getProducts().subscribe({
        next: (productos: Producto[]) => (this.todosLosProductos = productos),
        error: (err: any) => console.error('Error cargando productos', err)
      });
    }
  }



  cancelarAsociar() {
    this.mostrarAsociar = false;
    this.nuevoProducto = { product_id: null, unit_cost: null, supplier_reference: '' };
  }

  asociarProductoDesdeModal(datosProducto: any) {
    if (!this.proveedorSeleccionado) return;

    const payload = {
      supplier_id: this.proveedorSeleccionado.supplier_id,
      product_id: datosProducto.product_id,
      unit_cost: datosProducto.unit_cost,
      supplier_reference: datosProducto.supplier_reference
    };

    this.suppliersService.attachProduct(payload).subscribe({
      next: () => {
        this.mostrarAsociar = false;
        // Refrescar la lista de productos del proveedor
        if (this.proveedorSeleccionado) {
          this.verProductos(this.proveedorSeleccionado);
        }
      },
      error: (err) => console.error('Error asociando producto', err)
    });
  }
//fin de asociar producto a proveedor


  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.suppliersService.list({ search: this.search, page: this.page, perPage: this.perPage })
      .subscribe((res: any) => {
        console.log('Respuesta de la API:', res);
        this.suppliers = res.data ?? res;
        this.total = res.total ?? this.suppliers.length;
      });
  }

  filter(): void {
    this.page = 1;
    this.load();
  }

  // =========================
  // Crear proveedor
  // =========================
  abrirCrear(): void {
    this.mostrarCrear = true;
  }

  cancelarCrear(): void {
    this.mostrarCrear = false;
  }

  onProveedorCreado(): void {
    this.mostrarCrear = false;
    this.load();
  }

  // =========================
  // Editar proveedor
  // =========================
  abrirEditar(supplier: Supplier): void {
    this.proveedorEnEdicion = { ...supplier };
    this.mostrarEditar = true;
  }

  cancelarEditar(): void {
    this.mostrarEditar = false;
    this.proveedorEnEdicion = null;
  }

  onProveedorActualizado(supplier: Supplier): void {
    this.mostrarEditar = false;
    this.proveedorEnEdicion = null;
    this.load();
  }

  // =========================
  // Eliminar proveedor
  // =========================
  eliminarProveedor(supplier: Supplier): void {
    if (!supplier.supplier_id) return;
    if (confirm(`¿Seguro que deseas eliminar el proveedor "${supplier.name}"?`)) {
      this.suppliersService.delete(supplier.supplier_id).subscribe({
        next: () => {
          this.load();
          if (this.proveedorSeleccionado?.supplier_id === supplier.supplier_id) {
            this.proveedorSeleccionado = null;
            this.productosProveedor = [];
          }
        },
        error: (err) => console.error('Error eliminando proveedor', err)
      });
    }
  }

  // =========================
  // Ver productos del proveedor
  // =========================
  verProductos(supplier: Supplier): void {
    this.proveedorSeleccionado = supplier;
    this.productosProveedor = [];
    this.suppliersService.products(supplier.supplier_id).subscribe({
      next: (productos) => this.productosProveedor = productos,
      error: (err) => console.error('Error cargando productos', err)
    });
  }

  cerrarProductos(): void {
    this.proveedorSeleccionado = null;
    this.productosProveedor = [];
  }
}
