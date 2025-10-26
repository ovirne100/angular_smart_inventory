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

 // padre.component.ts
 onProductoActualizado(productoActualizado: Producto) {
  const index = this.productos.findIndex(p => p.id === productoActualizado.id);

  if (index !== -1) {
    // Mezclamos datos: conserva lo anterior y aplica los cambios nuevos
    const combinado: Producto = {
      ...this.productos[index],
      ...productoActualizado
    };

    // Si vino un campo 'image' o 'image_url', actualizamos image_url y añadimos timestamp anti-cache
    const backendBase = 'http://smart_inventory/storage/';

    if (productoActualizado.image) {
      combinado.image_url = `${backendBase}${productoActualizado.image}?t=${Date.now()}`;
    } else if (productoActualizado.image_url) {
      // si backend ya devolvió image_url, solo le agregamos timestamp
      const sep = productoActualizado.image_url.includes('?') ? '&' : '?';
      combinado.image_url = `${productoActualizado.image_url}${sep}t=${Date.now()}`;
    } else {
      // si no vino nada nuevo de imagen, conservamos la que había (ya está en this.productos[index])
      combinado.image_url = this.productos[index].image_url;
    }

    // Reemplazamos en el array y forzamos referencia para que Angular re-renderice
    this.productos[index] = combinado;
    this.productos = [...this.productos];
    this.productosFiltrados = [...this.productos];

    // Actualizamos la referencia en edición
    this.productoEnEdicion = { ...this.productos[index] };
  }

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

onProductoCreado(nuevoProducto?: Producto) {
  if (nuevoProducto) {
    // Agrega el nuevo producto al inicio de la lista
    this.productos.unshift(nuevoProducto);
    this.productosFiltrados = [...this.productos];
  } else {
    // Si no recibimos el producto, recargamos desde backend
    this.cargarProductos(true);
  }

  // Cierra el modal de crear
  this.cancelarCrearProducto();
}


eliminarProducto(producto: Producto) {
  if (confirm(`¿Seguro que quieres eliminar el producto "${producto.name}"?`)) {
    this.productosService.eliminarProducto(producto.id!).subscribe({
      next: (res: any) => {
        alert(res.message || '✅ Producto eliminado correctamente');
        this.cargarProductos(true);
      },
      error: (err) => {
        console.error('Error al eliminar:', err);
        alert(err.error?.message || '⚠️ Error al eliminar el producto');
      }
    });
  }
}


  trackByProducto(index: number, producto: Producto): number {
    return producto.id || index;
  }


}
