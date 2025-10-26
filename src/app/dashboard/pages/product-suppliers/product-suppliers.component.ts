import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { Producto, Proveedor } from '../../../interfaces/producto';
import { SuppliersService } from '../../../services/proveedores/suppliers.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-suppliers.component.html',
  styleUrls: ['./product-suppliers.component.css']
})
export class ProductSuppliersComponent implements OnChanges {
  @Input() proveedorId?: number;
  @Input() proveedorSeleccionado?: Proveedor;
  @Input() productos: Producto[] = [];
  @Output() productoEliminado = new EventEmitter<number>();
  @Output() cerrar = new EventEmitter<void>();

  productosProveedor: Producto[] = [];
  mostrarAsociar = false;
  productosCatalogo: Producto[] = [];
  productosSeleccionados: Set<number> = new Set();
  costos: { [key: number]: number } = {};

  constructor(private suppliersService: SuppliersService) {}

  ngOnChanges(): void {
    if (this.proveedorId) this.cargarProductos();
  }

  cargarProductos(): void {
    if (!this.proveedorId) return;
    this.suppliersService.getSupplierProducts(this.proveedorId).subscribe({
      next: res => (this.productosProveedor = res.data),
      error: err => console.error(err)
    });
  }

  eliminar(producto: Producto): void {
    if (!this.proveedorId || !producto.id) return;

    if (!confirm(`Eliminar ${producto.name}?`)) return;

    this.suppliersService.detachProduct(this.proveedorId, producto.id).subscribe({
      next: () => {
        this.productoEliminado.emit(producto.id);
        this.cargarProductos();
      },
      error: err => console.error(err)
    });
  }

  onCerrar(): void {
    this.cerrar.emit();
  }

  onAbrirAsociar(): void {
    this.mostrarAsociar = true;
    this.productosCatalogo = this.productos.filter(p =>
      !this.productosProveedor.some(pp => pp.id === p.id)
    );
  }

  onCerrarAsociar(): void {
    this.mostrarAsociar = false;
    this.productosSeleccionados.clear();
    this.costos = {};
  }

  isSelected(productId: number): boolean {
    return this.productosSeleccionados.has(productId);
  }

  toggleSeleccion(productId: number): void {
    if (this.productosSeleccionados.has(productId)) {
      this.productosSeleccionados.delete(productId);
      delete this.costos[productId];
    } else {
      this.productosSeleccionados.add(productId);
    }
  }

  updateCost(productId: number, value: number): void {
    this.costos[productId] = value;
  }

  onAsociar(): void {
    if (!this.proveedorId || this.productosSeleccionados.size === 0) return;

    const payload = {
      products: Array.from(this.productosSeleccionados).map(id => ({
        product_id: id,
        unit_cost: this.costos[id] || 0
      }))
    };

    this.suppliersService.attachProduct(this.proveedorId, payload).subscribe({
      next: () => {
        alert('✅ Productos asociados correctamente');
        this.onCerrarAsociar();
        this.cargarProductos();
      },
      error: err => {
        console.error(err);
        alert('⚠️ Error al asociar productos');
      }
    });
  }

  trackByProductId(index: number, producto: Producto): number {
    return producto.id || index;
  }
}
