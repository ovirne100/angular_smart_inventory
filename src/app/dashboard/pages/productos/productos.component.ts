import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ProductosService } from '../../../services/productos/products.service';
import { UnitsService } from '../../../services/units/units.service';
import { Producto, LoteInventario } from '../../../interfaces/producto';
import { CrearProductoComponent } from '../../../productos/crear-producto/crear-producto.component';
import { ActualizarProductoComponent } from '../../../productos/actualizar-producto/actualizar-producto.component';
import { VerMasProductoComponent } from '../../../productos/ver-mas-producto/ver-mas-producto.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    FormsModule,
    CrearProductoComponent,
    ActualizarProductoComponent,
    VerMasProductoComponent
  ],
  templateUrl: './productos.component.html',
})
export class ProductosComponent implements OnInit, OnDestroy {

  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];

  loading = false;
  search = '';

  currentPage = 1;
  lastPage = 1;
  autoLoading = false;

  mostrarCrear = false;
  mostrarEditar = false;
  mostrarVerMas = false;

  productoEnEdicion: Producto | null = null;
  productoEnDetalle: Producto | null = null;

  private apiUrl = environment.apiUrl;
  unidades: any[] = [];

  constructor(
    private productosService: ProductosService,
    private unitsService: UnitsService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.autoLoading = true;
    this.cargarProductos();
    this.cargarUnidades();

    // Activar scroll infinito manual
    window.addEventListener('scroll', this.manejarScroll);
  }

  ngOnDestroy(): void {
    // Quita el listener al salir del componente
    window.removeEventListener('scroll', this.manejarScroll);
  }

  // Reemplaza el HostListener
  private manejarScroll = (): void => {
    const scrollPosition = window.innerHeight + window.scrollY;
    const pageHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    const threshold = 200;

    if (scrollPosition >= pageHeight - threshold) {
      if (this.currentPage < this.lastPage && !this.loading && !this.search.trim()) {
        this.currentPage++;
        this.cargarProductos();
      }
    }
  };

  cargarUnidades(): void {
    this.unitsService.getUnits().subscribe((units) => {
      this.unidades = Array.isArray(units) ? units : [];
    });
  }

  obtenerNombreUnidad(unitMeasurement: string | undefined): string {
    if (!unitMeasurement) return 'N/A';

    const unidad = this.unidades.find(u =>
      u.abbreviation?.toLowerCase() === unitMeasurement.toLowerCase() ||
      u.name?.toLowerCase() === unitMeasurement.toLowerCase()
    );

    return unidad ? unidad.name : unitMeasurement;
  }

  private ordenarProductosPorId(): void {
    this.productos.sort((a, b) => {
      const idA = a.id || 0;
      const idB = b.id || 0;
      return idB - idA;
    });
    this.productosFiltrados = [...this.productos];
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

        const nuevos = res.data || [];
        const withImages = (nuevos || []).map((p: any) => {
          const backendBase = 'http://127.0.0.1:8000/storage/';
          const normalizedImageUrl = p.image_url || (p.image ? `${backendBase}${p.image}` : undefined);
          return { ...p, image_url: normalizedImageUrl } as Producto;
        });

        const nuevosIds = new Set(withImages.map((p: Producto) => p.id));
        const productosSinDuplicados = this.productos.filter(p => !nuevosIds.has(p.id));
        this.productos = [...productosSinDuplicados, ...withImages];

        this.ordenarProductosPorId();

        if (res.last_page !== undefined) {
          this.lastPage = res.last_page;
        } else if (res.total && res.per_page) {
          this.lastPage = Math.ceil(res.total / res.per_page);
        } else if (withImages.length < 20) {
          this.lastPage = this.currentPage;
        }

        setTimeout(() => this.cargarLotesInventario(), 100);

        this.loading = false;
        this.cdr.detectChanges();

        if (this.autoLoading && this.currentPage < this.lastPage && !this.search.trim()) {
          this.currentPage++;
          setTimeout(() => this.cargarProductos(), 300);
        } else if (this.currentPage >= this.lastPage) {
          this.autoLoading = false;
        }
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onBuscar(): void {
    this.autoLoading = false;
    this.cargarProductos(true);
  }

  abrirEditar(producto: Producto) {
    this.productoEnEdicion = { ...producto };
    this.mostrarEditar = true;
  }

  cerrarEditar() {
    this.mostrarEditar = false;
    this.productoEnEdicion = null;
  }

  onProductoActualizado(productoActualizado: Producto) {
    const index = this.productos.findIndex(p => p.id === productoActualizado.id);

    if (index !== -1) {
      const combinado: Producto = {
        ...productoActualizado,
        lotesInventario: this.productos[index].lotesInventario || productoActualizado.lotesInventario
      };

      const backendBase = 'http://127.0.0.1:8000/storage/';

      if (productoActualizado.image === null || productoActualizado.image === '' || productoActualizado.image_url === null) {
        combinado.image_url = undefined;
        combinado.image = undefined;
      } else if (productoActualizado.image) {
        combinado.image_url = `${backendBase}${productoActualizado.image}?t=${Date.now()}`;
        combinado.image = productoActualizado.image;
      } else if (productoActualizado.image_url) {
        const sep = productoActualizado.image_url.includes('?') ? '&' : '?';
        combinado.image_url = `${productoActualizado.image_url}${sep}t=${Date.now()}`;
        combinado.image = productoActualizado.image || this.productos[index].image;
      } else {
        combinado.image_url = this.productos[index].image_url;
        combinado.image = this.productos[index].image;
      }

      if (!combinado.categoria) {
        combinado.categoria = combinado.category_id ? null : { name: 'Sin categoría' };
      }

      this.productos[index] = combinado;
      this.productosFiltrados = [...this.productos];
      this.ordenarProductosPorId();

      this.productoEnEdicion = { ...this.productos[index] };
    } else {
      this.productos.push(productoActualizado);
      this.ordenarProductosPorId();
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
    this.search = '';

    if (nuevoProducto) {
      this.productos.push(nuevoProducto);
      this.ordenarProductosPorId();
    }

    this.cargarProductos(true);
    this.cdr.detectChanges();
    this.cancelarCrearProducto();
  }

  recargarLotesInventario(): void {
    if (this.productos.length > 0) {
      this.cargarLotesInventario();
    }
  }

  eliminarProducto(producto: Producto) {
    if (confirm(`¿Seguro que quieres eliminar el producto "${producto.name}"?`)) {
      this.productosService.eliminarProducto(producto.id!).subscribe({
        next: (res: any) => {
          alert(res.message || '✔ Producto eliminado correctamente');
          this.cargarProductos(true);
        },
        error: (err) => {
          alert(err.error?.message || '⚠ Error al eliminar el producto');
        }
      });
    }
  }

  trackByProducto(index: number, producto: Producto): number {
    return producto.id || index;
  }

  // ------- LÓGICA DE LOTES (SIN CAMBIOS) --------
  private cargarLotesInventario(): void {
    const headers = this.getAuthHeaders();

    this.http.get<any>(`${this.apiUrl}/entries`, { headers })
      .subscribe({
        next: (entradasRes: any) => {
          const entradas = Array.isArray(entradasRes.data)
            ? entradasRes.data
            : (Array.isArray(entradasRes) ? entradasRes : []);

          const lotesPorProducto = new Map<number, Map<string, LoteInventario>>();

          this.http.get<any>(`${this.apiUrl}/outputs`, { headers })
            .subscribe({
              next: (salidasRes: any) => {
                const salidas = Array.isArray(salidasRes.data)
                  ? salidasRes.data
                  : (Array.isArray(salidasRes) ? salidasRes : []);

                entradas.forEach((entrada: any) => {
                  const productId = entrada.product_id || entrada.product?.id;
                  if (!productId) return;

                  const lot = String(entrada.lot || entrada.lote || entrada.batch || 'SIN_LOTE').trim().toUpperCase();

                  const producto = this.productos.find(p => p.id === productId);
                  const lotePrincipal = producto ? String(producto.batch || '').trim().toUpperCase() : '';

                  if (lot === lotePrincipal && lotePrincipal !== '') return;

                  if (!lotesPorProducto.has(productId)) {
                    lotesPorProducto.set(productId, new Map());
                  }

                  const lotesProducto = lotesPorProducto.get(productId)!;

                  if (lotesProducto.has(lot)) {
                    const loteExistente = lotesProducto.get(lot)!;
                    const cantidadEntrada = Number(entrada.quantity || entrada.cantidad || 0);
                    loteExistente.cantidad = (loteExistente.cantidad || 0) + cantidadEntrada;

                    if (entrada.expiration_date) loteExistente.expiration_date = entrada.expiration_date;

                    const fechaEntrada = entrada.created_at || entrada.fecha || entrada.date;
                    if (fechaEntrada) loteExistente.fecha_entrada = fechaEntrada;
                  } else {
                    lotesProducto.set(lot, {
                      lot,
                      expiration_date: entrada.expiration_date || null,
                      cantidad: Number(entrada.quantity || entrada.cantidad || 0),
                      fecha_entrada: entrada.created_at || entrada.fecha || entrada.date || null
                    });
                  }
                });

                salidas.forEach((salida: any) => {
                  const productId = salida.product_id || salida.product?.id;
                  if (!productId) return;

                  const lot = String(salida.lot || salida.lote || salida.batch || 'SIN_LOTE').trim().toUpperCase();

                  const producto = this.productos.find(p => p.id === productId);
                  const lotePrincipal = producto ? String(producto.batch || '').trim().toUpperCase() : '';

                  if (lot === lotePrincipal && lotePrincipal !== '') return;

                  if (lotesPorProducto.has(productId)) {
                    const lotesProducto = lotesPorProducto.get(productId)!;
                    if (lotesProducto.has(lot)) {
                      const loteExistente = lotesProducto.get(lot)!;
                      const cantidadSalida = Number(salida.quantity || salida.cantidad || 0);
                      loteExistente.cantidad = Math.max(0, (loteExistente.cantidad || 0) - cantidadSalida);
                    }
                  }
                });

                this.productos.forEach(producto => {
                  if (producto.id && lotesPorProducto.has(producto.id)) {
                    const lotesMap = lotesPorProducto.get(producto.id)!;
                    const lotesConStock = Array.from(lotesMap.values())
                      .filter(lote => (lote.cantidad || 0) > 0);

                    producto.lotesInventario = lotesConStock;

                    producto.lotesInventario.sort((a, b) => {
                      const fechaA = a.fecha_entrada ? new Date(a.fecha_entrada).getTime() : 0;
                      const fechaB = b.fecha_entrada ? new Date(b.fecha_entrada).getTime() : 0;
                      return fechaB - fechaA;
                    });

                    producto.lotesInventario.forEach(lote => delete lote.cantidad);

                  } else {
                    producto.lotesInventario = [];
                  }
                });

                this.productosFiltrados = [...this.productos];
                this.cdr.detectChanges();
              },
              error: () => {
                this.asignarLotesSinSalidas(lotesPorProducto);
              }
            });
        },
        error: () => {
          this.productos.forEach(p => p.lotesInventario = []);
        }
      });
  }

  private asignarLotesSinSalidas(lotesPorProducto: Map<number, Map<string, LoteInventario>>): void {
    this.productos.forEach(producto => {
      if (producto.id && lotesPorProducto.has(producto.id)) {
        const lotesMap = lotesPorProducto.get(producto.id)!;
        producto.lotesInventario = Array.from(lotesMap.values());

        producto.lotesInventario.sort((a, b) => {
          const fechaA = a.fecha_entrada ? new Date(a.fecha_entrada).getTime() : 0;
          const fechaB = b.fecha_entrada ? new Date(b.fecha_entrada).getTime() : 0;
          return fechaB - fechaA;
        });

        producto.lotesInventario.forEach(lote => delete lote.cantidad);

      } else {
        producto.lotesInventario = [];
      }
    });

    this.productosFiltrados = [...this.productos];
    this.cdr.detectChanges();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  formatearFecha(fecha: string | Date | null | undefined): string {
    if (!fecha) return 'N/A';
    try {
      const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return String(fecha);
    }
  }
}
