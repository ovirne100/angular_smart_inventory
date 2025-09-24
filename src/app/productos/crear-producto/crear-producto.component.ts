import { Component, EventEmitter, Output, Inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductosService } from '../../services/productos/products.service';   // ✅ ruta corregida
     


@Component({
  selector: 'app-crear-producto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-producto.component.html',
  styleUrls: ['./crear-producto.component.css']
})
export class CrearProductoComponent {
  @Output() cancelar = new EventEmitter<void>();

   constructor(private productosService: ProductosService) {}
 
guardarProducto(form: NgForm) {
  if (!form.valid) {
    alert('Por favor completa todos los campos requeridos');
    return;
  }

  // Obtener la fecha del formulario (tipo 'YYYY-MM-DD')
const fecha = form.value.fechaVencimiento;

// Convertirla a datetime aceptado por la DB
const fechaDatetime = fecha + ' 00:00:00';

  // Armamos el objeto con los nombres exactos que espera Laravel
  const nuevoProducto = {
  name: form.value.name,
  category_id: form.value.category_id,
  reference: form.value.reference,
  unit_measurement: form.value.unit,  // 👈 cambiar
  batch: form.value.lote,             // 👈 cambiar
  expiration_date: fechaDatetime   // ✅ usar datetime completo
  };

  this.productosService.crearProducto(nuevoProducto).subscribe({
    next: (res) => {
      console.log('✅ Producto guardado:', res);
      alert('Producto creado con éxito');
      form.resetForm(); // reset completo del formulario
    },
    error: (err) => {
      console.error('❌ Error al guardar producto:', err);
      alert('Error al guardar el producto');
    }
  });
}

  cancelarCreacion() {
    this.cancelar.emit();
  }
}

/*
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductosService } from '../../../services/productos/products.service';
import { Producto } from '../../../interfaces/producto';


@Component({
  selector: 'app-crear-producto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-producto.component.html',
  styleUrls: ['./crear-producto.component.css']
})
export class CrearProductoComponent {
  @Output() cancelar = new EventEmitter<void>();

  constructor(private productosService: ProductosService) {}

  guardarProducto(form: NgForm) {
    if (!form.valid) return;

    const nuevoProducto: Producto = {
      nombre: form.value.nombre,
      cantidad: form.value.cantidad,
      unidad: form.value.unidad || '',
      lote: form.value.lote || '',
      categoria: form.value.categoria || '',
      fechaVencimiento: form.value.fechavencimiento,
      icono1: 'fas fa-box',
      icono2: 'fas fa-box',
      icono3: 'fas fa-box'
    };

    this.productosService.crearProducto(nuevoProducto).subscribe({
      next: (res) => {
        console.log('Producto creado', res);
        this.cancelarCreacion();
      },
      error: (err) => console.error('Error al crear producto', err)
    });
  }

  cancelarCreacion() {
    this.cancelar.emit();
  }
}
*/