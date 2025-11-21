import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { Producto, Proveedor } from '../../../interfaces/producto';
import { SuppliersService } from '../../../services/proveedores/suppliers.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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
  @Input() modoModal: boolean = false; // si true, no renderiza panel, solo modal
  @Input() autoAbrir: boolean = false; // si true, abre modal al recibir proveedor
  @Output() productoEliminado = new EventEmitter<number>();
  @Output() cerrar = new EventEmitter<void>();

  productosProveedor: Producto[] = [];
  productosFiltrados: Producto[] = [];
  mostrarAsociar = false;
  mostrarProductos = false;
  productosCatalogo: Producto[] = [];
  productosCatalogoFiltrados: Producto[] = [];
  productosSeleccionados: Set<number> = new Set();
  costos: { [key: number]: number } = {};
  searchTermAsociar: string = '';

  // Límite de productos por proveedor
  readonly MAX_PRODUCTOS = 50;

  // Paginación
  currentPage = 1;
  itemsPerPage = 12;
  totalPages = 1;

  // Búsqueda y ordenamiento
  searchTerm = '';
  sortBy: 'name' | 'reference' | 'cost' | 'batch' = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  constructor(
    private suppliersService: SuppliersService,
    private http: HttpClient
  ) {}

  ngOnChanges(): void {
    if (this.proveedorId) {
      this.cargarProductos();
      if (this.modoModal && this.autoAbrir) {
        this.mostrarProductos = true;
      }
    }
  }

  cargarProductos(): void {
    if (!this.proveedorId) return;
    this.suppliersService.getSupplierProducts(this.proveedorId).subscribe({
      next: res => {
        this.productosProveedor = res.data || [];
        this.aplicarFiltrosYOrdenamiento();
        this.calcularPaginacion();
      },
      error: err => console.error(err)
    });
  }

  // Aplicar filtros y ordenamiento
  aplicarFiltrosYOrdenamiento(): void {
    let productos = [...this.productosProveedor];

    // Aplicar búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      productos = productos.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        (p.codigo_de_barras || p.reference || '')?.toLowerCase().includes(term) ||
        (p.batch || p.lote || '')?.toLowerCase().includes(term)
      );
    }

    // Aplicar ordenamiento
    productos.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortBy) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'reference':
          aValue = (a.codigo_de_barras || a.reference || '')?.toLowerCase() || '';
          bValue = (b.codigo_de_barras || b.reference || '')?.toLowerCase() || '';
          break;
        case 'cost':
          aValue = parseFloat(a.pivot?.unit_cost || '0') || 0;
          bValue = parseFloat(b.pivot?.unit_cost || '0') || 0;
          break;
        case 'batch':
          aValue = a.batch?.toLowerCase() || '';
          bValue = b.batch?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    this.productosFiltrados = productos;
    this.currentPage = 1;
    this.calcularPaginacion();
  }

  // Calcular paginación
  calcularPaginacion(): void {
    this.totalPages = Math.ceil(this.productosFiltrados.length / this.itemsPerPage);
  }

  // Obtener productos de la página actual
  get productosPagina(): Producto[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.productosFiltrados.slice(start, end);
  }

  // Cambiar página
  cambiarPagina(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Cambiar ordenamiento
  cambiarOrdenamiento(campo: 'name' | 'reference' | 'cost' | 'batch'): void {
    if (this.sortBy === campo) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = campo;
      this.sortOrder = 'asc';
    }
    this.aplicarFiltrosYOrdenamiento();
  }

  // Buscar productos
  onBuscar(): void {
    this.aplicarFiltrosYOrdenamiento();
  }

  // Limpiar búsqueda
  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.aplicarFiltrosYOrdenamiento();
  }

  eliminar(producto: Producto): void {
    if (!this.proveedorId || !producto.id) return;

    if (!confirm(`¿Eliminar ${producto.name} de este proveedor?`)) return;

    this.suppliersService.detachProduct(this.proveedorId, producto.id).subscribe({
      next: () => {
        this.productoEliminado.emit(producto.id);
        this.cargarProductos();
        alert('✅ Producto eliminado correctamente');
      },
      error: err => {
        console.error(err);
        alert('⚠️ Error al eliminar el producto');
      }
    });
  }

  onCerrar(): void {
    this.cerrar.emit();
  }

  onAbrirProductos(): void {
    this.mostrarProductos = true;
    this.cargarProductos();
  }

  onCerrarProductos(): void {
    this.mostrarProductos = false;
    this.searchTerm = '';
    this.currentPage = 1;
  }

  onAbrirAsociar(): void {
    // Validar límite de productos
    if (this.productosProveedor.length >= this.MAX_PRODUCTOS) {
      alert(`⚠️ Este proveedor ya tiene el máximo de ${this.MAX_PRODUCTOS} productos asociados. Debe eliminar productos antes de agregar más.`);
      return;
    }

    // Cerrar el modal de productos si está abierto
    if (this.mostrarProductos) {
      this.mostrarProductos = false;
    }

    this.mostrarAsociar = true;
    this.searchTermAsociar = '';
    this.productosCatalogo = this.productos.filter(p =>
      !this.productosProveedor.some(pp => pp.id === p.id)
    );

    // Cargar lotes desde entradas para cada producto
    this.cargarLotesDesdeEntradas();
    this.filtrarCatalogo();
  }

  // Cargar lotes desde entradas para los productos del catálogo
  private cargarLotesDesdeEntradas(): void {
    const headers = this.getAuthHeaders();

    this.http.get<any>(`${environment.apiUrl}/entries`, { headers }).subscribe({
      next: (res: any) => {
        const entradas = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);

        // Crear un mapa de lotes por producto
        const lotesPorProducto = new Map<number, string>();

        entradas.forEach((entrada: any) => {
          const productId = entrada.product_id || entrada.product?.id;
          if (!productId) return;

          // Si el producto ya tiene un lote mapeado, no sobrescribir (tomar el primero)
          if (!lotesPorProducto.has(productId)) {
            const lot = String(entrada.lot || entrada.lote || entrada.batch || '').trim();
            if (lot && lot !== 'SIN_LOTE') {
              lotesPorProducto.set(productId, lot);
            }
          }
        });

        // Actualizar productos con lotes desde entradas si no tienen lote
        this.productosCatalogo = this.productosCatalogo.map((p: any) => {
          // Si el producto no tiene lote, buscar en el mapa de entradas
          if (!p.batch && !p.lote && lotesPorProducto.has(p.id)) {
            return {
              ...p,
              batch: lotesPorProducto.get(p.id),
              lote: lotesPorProducto.get(p.id)
            };
          }
          return p;
        });

        this.filtrarCatalogo();
      },
      error: (err) => {
        console.error('Error cargando lotes desde entradas:', err);
        // Continuar sin los lotes de entradas
        this.filtrarCatalogo();
      }
    });
  }

  // Helper para obtener headers de autenticación
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  filtrarCatalogo(): void {
    if (!this.searchTermAsociar.trim()) {
      this.productosCatalogoFiltrados = [...this.productosCatalogo];
      return;
    }

    const term = this.searchTermAsociar.toLowerCase().trim();
    this.productosCatalogoFiltrados = this.productosCatalogo.filter(p =>
      p.name?.toLowerCase().includes(term) ||
      (p.codigo_de_barras || p.reference || '')?.toLowerCase().includes(term) ||
      (p.batch || p.lote || '')?.toLowerCase().includes(term)
    );
  }

  limpiarBusquedaAsociar(): void {
    this.searchTermAsociar = '';
    this.filtrarCatalogo();
  }

  onCerrarAsociar(): void {
    this.mostrarAsociar = false;
    this.productosSeleccionados.clear();
    this.costos = {};
    this.searchTermAsociar = '';
    this.productosCatalogoFiltrados = [];
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

    // Validar límite antes de asociar
    const productosActuales = this.productosProveedor.length;
    const productosNuevos = this.productosSeleccionados.size;
    const totalDespues = productosActuales + productosNuevos;

    if (totalDespues > this.MAX_PRODUCTOS) {
      const disponibles = this.MAX_PRODUCTOS - productosActuales;
      alert(`⚠️ No se pueden asociar ${productosNuevos} productos. Solo se pueden agregar ${disponibles} productos más (máximo ${this.MAX_PRODUCTOS} por proveedor).`);
      return;
    }

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
        // Reabrir el modal de productos para ver los nuevos productos asociados
        if (!this.modoModal) {
          this.mostrarProductos = true;
        }
      },
      error: err => {
        console.error(err);
        const errorMsg = err.error?.message || err.error?.error || 'Error al asociar productos';
        if (errorMsg.includes('50') || errorMsg.includes('máximo')) {
          alert(`⚠️ ${errorMsg}`);
        } else {
          alert('⚠️ Error al asociar productos');
        }
      }
    });
  }

  trackByProductId(index: number, producto: Producto): number {
    return producto.id || index;
  }

  // Manejar error de carga de imagen
  onImageError(event: Event): void {
    const target = event?.target as HTMLImageElement | null;
    if (target && target.src.indexOf('assets/no-image.png') === -1) {
      target.src = 'assets/no-image.png';
    }
  }
}
