import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuppliersService, Supplier, ProductWithCategory } from '../../../services/proveedores/suppliers.service';
import { CrearProveedorComponent } from './crear-proveedor/crear-proveedor.component';
import { EditarProveedorComponent } from './editar-proveedor/editar-proveedor.component';
import { AsociarProductoComponent } from './asociar-producto/asociar-producto.component';
import { Producto } from '../../../interfaces/producto';
import { ProductosService } from '../../../services/productos/products.service';
import { ProductosPanelComponent } from '../../../productos-panel/productos-panel.component';



@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, CrearProveedorComponent, EditarProveedorComponent, AsociarProductoComponent, ProductosPanelComponent],
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.css']
})
export class ProveedoresComponent implements OnInit {
  private readonly suppliersService = inject(SuppliersService);
  private readonly productosService = inject(ProductosService);

  selectedSupplier?: Supplier; // proveedor seleccionado
  products: ProductWithCategory[] = []; // lista de productos del proveedor

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

  constructor(private cdr: ChangeDetectorRef) {}


 // llamado desde el template: (click)="abrirAsociar(proveedor)"
abrirAsociar(proveedor: Supplier) {
  if (!proveedor) {
    console.error('abrirAsociar: proveedor inválido', proveedor);
    return;
  }
  this.proveedorSeleccionado = proveedor;
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


   // TrackBy para productos
  // =========================
  trackByProductId(index: number, producto: ProductWithCategory) {
    return producto.product_id;
  }

  load(): void {
    this.suppliersService
      .list({ search: this.search, page: this.page, perPage: this.perPage })
      .subscribe((res: any) => {
        console.log('Respuesta de la API:', res);

        // 🔥 Normalizamos los datos para asegurar que todos tengan supplier_id
        const data = res.data ?? res;

        this.suppliers = data.map((s: any) => ({
          ...s,
          supplier_id: s.supplier_id ?? s.id, // usa id si no existe supplier_id
        }));

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
      next: (productos) => {
        this.productosProveedor = productos;
        console.log('Productos del proveedor:', productos);
        this.cdr.detectChanges(); // forzar actualización de la vista
      },
      error: (err) => console.error('Error cargando productos del proveedor', err)
    });
  }

  cerrarProductos(): void {
    this.proveedorSeleccionado = null;
    this.productosProveedor = [];
  }


  // Método llamado desde el panel
  eliminarProductoDelProveedor(producto: ProductWithCategory) {
    if (!this.proveedorSeleccionado || !producto.product_id) return;

    this.suppliersService.detachProduct({
      supplier_id: this.proveedorSeleccionado.supplier_id,
      product_id: producto.product_id
    }).subscribe({
      next: () => {
        console.log('Producto desvinculado correctamente');
        // Actualizamos la lista local
        this.productosProveedor = this.productosProveedor.filter(p => p.product_id !== producto.product_id);
      },
      error: (err) => {
        console.error('Error eliminando producto del proveedor', err);
      }
    });
  }

  // Método para abrir el panel con productos
  abrirPanelProductos(proveedor: any) {
    this.proveedorSeleccionado = proveedor;
    this.productosProveedor = [];
    this.suppliersService.products(proveedor.supplier_id)
      .subscribe({
        next: (productos: ProductWithCategory[]) => {
          this.productosProveedor = productos;
        },
        error: (err) => {
          console.error('Error al obtener productos del proveedor', err);
        }
      });
  }

}



