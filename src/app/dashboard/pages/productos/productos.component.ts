
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // 👈 IMPORTANTE
import { ProductosService } from '../../../services/productos/products.service';
import { Producto } from '../../../interfaces/producto';
import { CrearProductoComponent } from '../../../productos/crear-producto/crear-producto.component';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, CrearProductoComponent],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit {

  terminoBusqueda: string = '';
  mostrarCrear: boolean = false; // 👈 inicia en false para mostrar lista

  productos: Producto[] = [
  {
    id:1,
    name: 'Bolígrafo Carton Mini',
    unit_of_measure: 'pieza',
    batch: 'A001',
    expiration_date: '2025-06-29',
    icono1: 'fas fa-pen pen black',
    icono2: 'fas fa-pen pen blue',
    icono3: 'fas fa-pen pen red'
  },
  {
    id:2,
    name: 'Cuaderno Escolar',
    unit_of_measure: 'pieza',
    batch: 'B002',
    expiration_date: '2025-09-15',
    icono1: 'fas fa-book cuaderno-azul',
    icono2: 'fas fa-book-open cuaderno-verde',
    icono3: 'fas fa-journal-whills cuaderno-rojo'
  },
  {
    id:3,
    name: 'Borrador Escolar',
    unit_of_measure: 'pieza',
    batch: 'C003',
    expiration_date: '2025-06-29',
    icono1: 'fas fa-eraser borrador-rosado',
    icono2: 'fas fa-eraser borrador-gris',
    icono3: 'fas fa-eraser borrador-naranja',

  },
  {
    id:4,
    name: 'Regla Escolar',
    unit_of_measure: 'pieza',
    batch: 'D004',
    expiration_date: '2025-06-29',
    icono1: 'fas fa-ruler regla-amarilla',
    icono2: 'fas fa-ruler-horizontal regla-gris',
    icono3: 'fas fa-ruler-combined regla-verde',

  }
];


  constructor(private productosService: ProductosService) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos() {
    // De momento no tocamos this.mostrarCrear
    // Más adelante aquí se puede consumir la API:
    // this.productosService.getProductos().subscribe((res) => this.productos = res);
  }

 // 👉 llamado por el botón "Crear producto"
  cargarCrearProducto() {
    this.mostrarCrear = true;
  }

  // 👉 llamado por (cancelar) del <app-crear-producto>
  cancelarCrearProducto() {
    this.mostrarCrear = false;
    this.cargarProductos(); // refresca lista después de crear
  }
  actualizarProducto(producto: Producto) {
    console.log('Actualizar producto', producto);
  }

  eliminarProducto(producto: Producto) {
    if (confirm(`¿Seguro que deseas eliminar el producto ${producto.name}?`)) {
      if (producto.id) {
        this.productosService.eliminarProducto(producto.id).subscribe({
          next: () => {
            console.log('Producto eliminado');
            this.cargarProductos();
          },
          error: (err) => console.error('Error al eliminar', err)
        });
      }
    }
  }

  verMas(producto: Producto) {
    console.log('Ver más detalles', producto);
  }
}
/*
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductosService } from '../../../services/productos/products.service';
import { Producto } from '../../../interfaces/producto';
import { CrearProductoComponent } from '../../../productos/crear-producto/crear-producto.component';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, CrearProductoComponent],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit {
  productos: Producto[] = [];
  mostrarCrear: boolean = false;
  terminoBusqueda: string = '';

  constructor(private productosService: ProductosService) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos() {
    this.productosService.getProductos().subscribe({
      next: (data) => this.productos = data,
      error: (err) => console.error('Error al cargar productos', err)
    });
  }

  cargarCrearProducto() {
    this.mostrarCrear = true;
  }

  actualizarProducto(producto: Producto) {
    console.log('Actualizar producto', producto);
  }

  eliminarProducto(producto: Producto) {
    if (!producto.id) return;
    if (confirm(`¿Seguro que deseas eliminar ${producto.nombre}?`)) {
      this.productosService.eliminarProducto(producto.id).subscribe({
        next: () => this.cargarProductos(),
        error: (err) => console.error('Error al eliminar', err)
      });
    }
  }

  verMas(producto: Producto) {
    console.log('Ver más detalles', producto);
  }

  cancelarCrearProducto() {
    this.mostrarCrear = false;
  }
}
*/
