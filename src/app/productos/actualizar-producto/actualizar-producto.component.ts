import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Producto } from '../../interfaces/producto';
import { ProductosService } from '../../services/productos/products.service';
@Component({
  selector: 'app-actualizar-producto',
  standalone: true,
  imports: [CommonModule, FormsModule],  // 🔹 FormsModule es obligatorio
  templateUrl: './actualizar-producto.component.html',
})
export class ActualizarProductoComponent {

   @Input() producto!: Producto;   // Producto que recibimos desde el componente padre
  @Output() cancelar = new EventEmitter<void>();
  @Output() actualizado = new EventEmitter<Producto>();

  constructor(private productosService: ProductosService) {}

guardarCambios() {
  if (!this.producto) return; // ⚠️ No hacer nada si producto es null

  this.productosService.actualizarProducto(this.producto).subscribe({
    next: (prodActualizado) => {
      this.actualizado.emit(prodActualizado);
      this.cancelar.emit(); // cierra el modal
    },
    error: (err) => console.error('Error al actualizar producto', err)
  });
}

}
