import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuppliersService } from '../services/proveedores/suppliers.service'; // 👈 Asegúrate de la ruta correcta
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-productos-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos-panel.component.html',
  styleUrls: ['./productos-panel.component.css']
})
export class ProductosPanelComponent {
  @Input() proveedorSeleccionado: any;
  @Input() productosProveedor: any[] = [];
  @Output() eliminarProducto = new EventEmitter<any>();
  @Output() cerrar = new EventEmitter<void>();
  @Output() abrirAsociarProducto = new EventEmitter<void>();

  // ✅ Inyección del servicio
  constructor(private suppliersService: SuppliersService) {}

  onEliminar(producto: any) {
    const supplierId = this.proveedorSeleccionado?.id;
    const productId = producto?.id;

    if (!supplierId || !productId) {
      console.warn('⚠️ Faltan IDs para eliminar', { supplierId, productId });
      return;
    }

    console.log('Intentando eliminar', { supplierId, productId });

    this.suppliersService.deleteRelationship(supplierId, productId).subscribe({
      next: (response) => {
        console.log('✅ Respuesta del servidor:', response);
        this.productosProveedor = this.productosProveedor.filter(p => p.id !== productId);
      },
      error: (error) => {
        console.error('❌ Error al eliminar relación:', error);
      }
    });
  }

  onCerrar() {
    this.cerrar.emit();
  }

  onAbrirAsociar() {
    this.abrirAsociarProducto.emit();
  }

  trackByProductId(index: number, producto: any) {
    return producto.product_id;
  }
}
