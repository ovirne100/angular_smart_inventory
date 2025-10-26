import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Producto } from '../../interfaces/producto';
import { ProductosService } from '../../services/productos/products.service';

@Component({
  selector: 'app-actualizar-producto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './actualizar-producto.component.html',
})
export class ActualizarProductoComponent {

  @Input() producto!: Producto;              // Producto recibido desde el padre
  @Output() cancelar = new EventEmitter<void>();
  @Output() actualizado = new EventEmitter<Producto>(); // Emitirá producto actualizado

  nuevaImagen: File | null = null;

  constructor(private productosService: ProductosService) {}

  guardarCambios() {
    if (!this.producto || !this.producto.id) return;

    const formData = new FormData();

    // Campos básicos
    formData.append('name', this.producto.name);
    if (this.producto.category_id != null) formData.append('category_id', String(this.producto.category_id));
    if (this.producto.reference) formData.append('reference', this.producto.reference);
    if (this.producto.unit_measurement) formData.append('unit_measurement', this.producto.unit_measurement);
    if (this.producto.batch) formData.append('batch', this.producto.batch);

    // Manejo seguro de expiration_date
    const fechaStr = this.producto.expiration_date
      ? this.producto.expiration_date instanceof Date
        ? this.producto.expiration_date.toISOString().substring(0, 10)
        : String(this.producto.expiration_date)
      : null;

    if (fechaStr) {
      formData.append('expiration_date', fechaStr);
    }

    // Imagen nueva
    if (this.nuevaImagen) {
      formData.append('image', this.nuevaImagen);
    }

    // Llamada al servicio
    this.productosService.actualizarProducto(this.producto.id, formData).subscribe({
      next: (res: any) => {
        // Actualizamos el producto local y emitimos al padre
        this.producto = { ...res.data };
        this.actualizado.emit(this.producto);
        console.log('✅ Producto actualizado', this.producto);
      },
      error: (err: any) => {
        console.error('❌ Error al actualizar producto', err);
      }
    });
  }


  cancelarEdicion() {
    this.cancelar.emit();
  }
}

