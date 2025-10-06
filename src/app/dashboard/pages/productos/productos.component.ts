
/*
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductosService } from '../../../services/productos/products.service';
import { Producto } from '../../../interfaces/producto';
import { CrearProductoComponent } from '../../../productos/crear-producto/crear-producto.component';
import { ActualizarProductoComponent } from '../../../productos/actualizar-producto/actualizar-producto.component';
import { VerMasProductoComponent } from '../../../productos/ver-mas-producto/ver-mas-producto.component';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CrearProductoComponent,
    ActualizarProductoComponent,
    VerMasProductoComponent
  ],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit {

  terminoBusqueda: string = '';

  // Modales
mostrarCrear = false;    // 🔹 para actualizar
mostrarVerMas = false;          // 🔹 para ver más
productoEnEdicion: Producto | null = null;
productoEnDetalle: Producto | null = null;
mostrarEditar: boolean = false;

productos: Producto[] = [
  {
    id: 1,
    category_id: 1,
    name: 'Laptop Dell',
    reference: 'LD1234',
    unit_measurement: 'unidad',
    batch: 'B001',
    expiration_date: null,
    icono1: '💻',
    icono2: '🔋',
    icono3: '🖱️'
  },
  {
    id: 2,
    category_id: 2,
    name: 'Mouse Logitech',
    reference: 'ML5678',
    unit_measurement: 'unidad',
    batch: 'B002',
    expiration_date: null,
    icono1: '🖱️',
    icono2: '⚡',
    icono3: '🔧'
  },
  {
    id: 3,
    category_id: 3,
    name: 'Teclado Mecánico',
    reference: 'TM9012',
    unit_measurement: 'unidad',
    batch: 'B003',
    expiration_date: null,
    icono1: '⌨️',
    icono2: '🎹',
    icono3: '⚡'
  },
  {
    id: 4,
    category_id: 4,
    name: 'Monitor 24"',
    reference: 'M24123',
    unit_measurement: 'unidad',
    batch: 'B004',
    expiration_date: null,
    icono1: '🖥️',
    icono2: '🔌',
    icono3: '📺'
  }
];


  constructor(private productosService: ProductosService) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  // =========================
  // Cargar productos desde API
  // =========================
cargarProductos() {
  this.productosService.getProductos().subscribe({
    next: res => {
      // aquí res ya es un array
      this.productos = Array.isArray(res) ? res : [];
    },
    error: err => console.error('Error cargando productos', err)
  });
}


  // =========================
  // Crear producto
  // =========================
  cargarCrearProducto() { this.mostrarCrear = true; }
  cancelarCrearProducto() { this.mostrarCrear = false; }

  // =========================
  // Actualizar producto
  // =========================
onProductoActualizado(producto: Producto) {
  // Llamar al servicio para actualizar en la DB
  this.productosService.actualizarProducto(producto).subscribe({
    next: (res) => {
      console.log('Producto actualizado:', res);
      this.cargarProductos();    // recargar la lista de productos
      this.cerrarEditar();       // cerrar el modal
    },
    error: (err) => console.error('Error actualizando producto', err)
  });
}


abrirEditar(producto: Producto) {
  this.productoEnEdicion = { ...producto }; // clonar para no modificar directamente la lista
  this.mostrarEditar = true;
}
cerrarEditar() {
  this.mostrarEditar = false;
  this.productoEnEdicion = null;
}



  // =========================
  // Ver más producto
  // =========================

abrirVerMas(producto: Producto) {
  this.productoEnDetalle = producto;
  this.mostrarVerMas = true;
}

cerrarVerMas() {
  this.mostrarVerMas = false;
  this.productoEnDetalle = null;
}
  // =========================
  // Eliminar producto
  // =========================
  eliminarProducto(producto: Producto) {
    if (!producto.id) return;
    if (confirm(`¿Seguro que deseas eliminar el producto "${producto.name}"?`)) {
      this.productosService.eliminarProducto(producto.id).subscribe({
        next: () => this.cargarProductos(),
        error: err => console.error('Error al eliminar', err)
      });
    }
  }

  // =========================
  // Filtrar búsqueda
  // =========================
  get productosFiltrados() {
    if (!this.terminoBusqueda) return this.productos;
    return this.productos.filter(p => p.name.toLowerCase().includes(this.terminoBusqueda.toLowerCase()));
  }
}
*/

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductosService } from '../../../services/productos/products.service';
import { Producto } from '../../../interfaces/producto';
import { CrearProductoComponent } from '../../../productos/crear-producto/crear-producto.component';
import { ActualizarProductoComponent } from '../../../productos/actualizar-producto/actualizar-producto.component';
import { VerMasProductoComponent } from '../../../productos/ver-mas-producto/ver-mas-producto.component';

@Component({
  selector: 'app-productos',
  templateUrl: './productos.component.html',
 imports: [
    CommonModule,
    FormsModule,
    CrearProductoComponent,
    ActualizarProductoComponent,
    VerMasProductoComponent
  ],

})
export class ProductosComponent implements OnInit {

  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];

  // Modales
  mostrarCrear = false;
  mostrarEditar = false;
  mostrarVerMas = false;

  productoEnEdicion: Producto | null = null;
  productoEnDetalle: Producto | null = null;

  constructor(private productosService: ProductosService) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  // Cargar productos desde la DB
  cargarProductos() {
    this.productosService.getProducts().subscribe({
      next: (res: Producto[]) => {
        this.productos = res; // ✅ Datos reales desde la API
        this.productosFiltrados = [...this.productos];
      },
      error: (err) => console.error('Error al cargar productos', err)
    });
  }

  // Abrir modal de edición
  abrirEditar(producto: Producto) {
    this.productoEnEdicion = { ...producto }; // Hacemos copia
    this.mostrarEditar = true;
  }

  cerrarEditar() {
    this.mostrarEditar = false;
    this.productoEnEdicion = null;
  }

  onProductoActualizado(producto: Producto) {
    // Actualizamos la lista local y cerramos modal
    this.cargarProductos();
    this.cerrarEditar();
  }

  // Abrir modal Ver Más
  abrirVerMas(producto: Producto) {
    this.productoEnDetalle = producto;
    this.mostrarVerMas = true;
  }

  cerrarVerMas() {
    this.mostrarVerMas = false;
    this.productoEnDetalle = null;
  }

  // Abrir modal Crear
  cargarCrearProducto() {
    this.mostrarCrear = true;
  }

  cancelarCrearProducto() {
    this.mostrarCrear = false;
  }

  // Eliminar producto
  eliminarProducto(producto: Producto) {
    if (!confirm(`¿Deseas eliminar el producto ${producto.name}?`)) return;
    this.productosService.eliminarProducto(producto.id!).subscribe({
      next: () => this.cargarProductos(),
      error: (err) => console.error(err)
    });
  }

  // TrackBy para mejorar rendimiento
  trackByProducto(index: number, producto: Producto): number {
    return producto.id || index;
  }

  // Método para manejar cuando se crea un producto
  onProductoCreado() {
    this.cargarProductos(); // Recargar la lista
    this.cancelarCrearProducto(); // Cerrar el modal
  }
}
