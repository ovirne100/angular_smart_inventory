import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuppliersService } from '../services/proveedores/suppliers.service';
import { Producto, Proveedor } from '../interfaces/producto';

@Component({
  selector: 'app-productos-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos-panel.component.html',
  styleUrls: ['./productos-panel.component.css']
})
export class ProductosPanelComponent {
  @Input() proveedorSeleccionado?: Proveedor;
  @Input() productosProveedor: Producto[] = [];
  @Output() eliminarProducto = new EventEmitter<Producto>();
  @Output() cerrar = new EventEmitter<void>();
  @Output() abrirAsociarProducto = new EventEmitter<void>();

  constructor(private suppliersService: SuppliersService) {}

  trackByProductId(index: number, producto: Producto) {
    return producto.id ?? producto.pivot?.product_id;
  }

  onEliminar(producto: Producto) {
    const supplierId = this.proveedorSeleccionado?.id;
    const productId = producto.id ?? producto.pivot?.product_id;

    if (!supplierId || !productId) return;

    this.suppliersService.detachProduct(supplierId, productId).subscribe({
      next: () => {
        this.eliminarProducto.emit(producto);
        this.productosProveedor = this.productosProveedor.filter(
          p => (p.id ?? p.pivot?.product_id) !== productId
        );
      },
      error: (err: any) => {
        console.error('❌ Error eliminando producto:', err);
      }
    });
  }


  onCerrar() {
    this.cerrar.emit();
  }

  onAbrirAsociar() {
    this.abrirAsociarProducto.emit();
  }
}
