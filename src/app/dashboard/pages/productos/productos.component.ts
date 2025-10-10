import { Component, OnInit, HostListener } from '@angular/core';
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
})
export class ProductosComponent implements OnInit {

  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];

  loading = false;
  search = '';

  // Paginación
  currentPage = 1;
  lastPage = 1;

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

  cargarProductos(reset: boolean = false): void {
    if (this.loading) return;
    this.loading = true;

    if (reset) {
      this.currentPage = 1;
      this.productos = [];
      this.productosFiltrados = [];
    }

    this.productosService.getProducts({
      search: this.search,
      page: this.currentPage,
      perPage: 20
    }).subscribe({
      next: (res: any) => {
        const nuevos = res.data || res; // por si tu backend no usa paginate
        this.productos = [...this.productos, ...nuevos];
        this.productosFiltrados = [...this.productos];
        this.lastPage = res.last_page ?? 1;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar productos', err);
        this.loading = false;
      }
    });
  }

  

  // Filtrar productos desde backend
  onBuscar(): void {
    this.cargarProductos(true);
  }

  // Scroll infinito
  @HostListener('window:scroll', [])
  onScroll(): void {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
      if (this.currentPage < this.lastPage && !this.loading) {
        this.currentPage++;
        this.cargarProductos();
      }
    }
  }

  // Modales
  abrirEditar(producto: Producto) {
    this.productoEnEdicion = { ...producto };
    this.mostrarEditar = true;
  }

  cerrarEditar() {
    this.mostrarEditar = false;
    this.productoEnEdicion = null;
  }

  onProductoActualizado() {
    this.cargarProductos(true);
    this.cerrarEditar();
  }

  abrirVerMas(producto: Producto) {
    this.productoEnDetalle = producto;
    this.mostrarVerMas = true;
  }

  cerrarVerMas() {
    this.mostrarVerMas = false;
    this.productoEnDetalle = null;
  }

  cargarCrearProducto() {
    this.mostrarCrear = true;
  }

  cancelarCrearProducto() {
    this.mostrarCrear = false;
  }

  onProductoCreado() {
    this.cargarProductos(true);
    this.cancelarCrearProducto();
  }

  eliminarProducto(producto: Producto) {
    if (!confirm(`¿Deseas eliminar el producto ${producto.name}?`)) return;
    this.productosService.eliminarProducto(producto.id!).subscribe({
      next: () => this.cargarProductos(true),
      error: (err) => console.error(err)
    });
  }

  trackByProducto(index: number, producto: Producto): number {
    return producto.id || index;
  }
}
