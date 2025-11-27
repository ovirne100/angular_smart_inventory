import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  autoLoading = false; // Control para carga automática inicial

  // Modales
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
  ) {}

  ngOnInit(): void {
    this.autoLoading = true; // Activar carga automática al inicio
    this.cargarProductos();
    this.cargarUnidades();
  }

  cargarUnidades(): void {
    this.unitsService.getUnits().subscribe((units) => {
      this.unidades = Array.isArray(units) ? units : [];
    });
  }

  obtenerNombreUnidad(unitMeasurement: string | undefined): string {
    if (!unitMeasurement) {
      return 'N/A';
    }

    // Buscar la unidad por abreviatura o nombre
    const unidad = this.unidades.find(u => 
      u.abbreviation?.toLowerCase() === unitMeasurement.toLowerCase() ||
      u.name?.toLowerCase() === unitMeasurement.toLowerCase()
    );

    // Si se encuentra, retornar el nombre completo, sino retornar el valor original
    return unidad ? unidad.name : unitMeasurement;
  }

  // Ordenar productos por ID descendente (más recientes primero)
  private ordenarProductosPorId(): void {
    this.productos.sort((a, b) => {
      const idA = a.id || 0;
      const idB = b.id || 0;
      return idB - idA; // Orden descendente: ID más alto primero
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
          const backendBase = environment.storageUrl ? `${environment.storageUrl}/` : 'http://127.0.0.1:8000/storage/';
          const normalizedImageUrl = p.image_url || (p.image ? `${backendBase}${p.image}` : undefined);
          return { ...p, image_url: normalizedImageUrl } as Producto;
        });
        
        console.log(`📦 Página ${this.currentPage}: ${withImages.length} productos cargados`);
        console.log(`📊 Total productos en memoria: ${this.productos.length} + ${withImages.length}`);
        
        // Evitar duplicados al agregar productos
        const nuevosIds = new Set(withImages.map((p: Producto) => p.id));
        const productosSinDuplicados = this.productos.filter(p => !nuevosIds.has(p.id));
        this.productos = [...productosSinDuplicados, ...withImages];
        
        console.log(`✅ Total productos únicos después de agregar: ${this.productos.length}`);
        
        this.ordenarProductosPorId();
        
        // Actualizar lastPage desde la respuesta
        if (res.last_page !== undefined && res.last_page !== null) {
          this.lastPage = res.last_page;
          console.log(`📄 Última página detectada: ${this.lastPage}`);
        } else if (res.total && res.per_page) {
          this.lastPage = Math.ceil(res.total / res.per_page);
          console.log(`📄 Última página calculada: ${this.lastPage} (total: ${res.total}, por página: ${res.per_page})`);
        } else if (withImages.length < 20) {
          // Si recibimos menos de 20 productos, probablemente es la última página
          this.lastPage = this.currentPage;
          console.log(`📄 Última página inferida: ${this.lastPage} (menos de 20 productos recibidos)`);
        } else {
          // Si no hay información de paginación, intentar cargar más páginas
          console.warn('⚠️ No se detectó información de paginación. Intentando cargar más páginas...');
        }
        
        console.log(`🔄 Estado: Página actual ${this.currentPage} de ${this.lastPage}, Cargando: ${this.loading}`);
        
        // Cargar lotes después de un pequeño delay para asegurar que los productos estén listos
        setTimeout(() => {
          this.cargarLotesInventario(); // Cargar lotes de inventario para cada producto
        }, 100);
        
        this.loading = false;
        this.cdr.detectChanges();
        
        // Si hay más páginas, no estamos en búsqueda, y está activada la carga automática inicial
        if (this.autoLoading && this.currentPage < this.lastPage && !this.search.trim()) {
          console.log(`🔄 Cargando automáticamente página ${this.currentPage + 1} de ${this.lastPage}...`);
          setTimeout(() => {
            this.currentPage++;
            this.cargarProductos();
          }, 300);
        } else if (this.currentPage >= this.lastPage) {
          // Desactivar carga automática cuando se hayan cargado todas las páginas
          this.autoLoading = false;
          console.log(`✅ Todas las páginas cargadas. Total productos: ${this.productos.length}`);
        }
      },
      error: (err) => {
        console.error('Error al cargar productos', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }



  // Filtrar productos desde backend
  onBuscar(): void {
    this.autoLoading = false; // Desactivar carga automática cuando se busca
    this.cargarProductos(true);
  }

  // Scroll infinito mejorado
  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    // Calcular si el usuario está cerca del final de la página
    const scrollPosition = window.innerHeight + window.scrollY;
    const pageHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    const threshold = 200; // Cargar cuando falten 200px para el final

    // Verificar si hay más páginas y no está cargando
    if (scrollPosition >= pageHeight - threshold) {
      if (this.currentPage < this.lastPage && !this.loading && !this.search.trim()) {
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
    // Usamos directamente el producto actualizado que viene del backend
    // ya que ahora incluye todas las relaciones actualizadas (incluyendo categoria)
    const combinado: Producto = {
      ...productoActualizado,
      // Conservamos los lotes de inventario si existen
      lotesInventario: this.productos[index].lotesInventario || productoActualizado.lotesInventario
    };

    // Si vino un campo 'image' o 'image_url', actualizamos image_url y añadimos timestamp anti-cache
    const backendBase = environment.storageUrl ? `${environment.storageUrl}/` : 'http://127.0.0.1:8000/storage/';

    // Si image o image_url son null/undefined explícitamente, significa que se eliminó la imagen
    if (productoActualizado.image === null || productoActualizado.image === undefined || 
        productoActualizado.image === '' || productoActualizado.image_url === null) {
      // Imagen eliminada: limpiar ambos campos
      combinado.image_url = undefined;
      combinado.image = undefined;
    } else if (productoActualizado.image) {
      // Hay una imagen nueva o existente
      combinado.image_url = `${backendBase}${productoActualizado.image}?t=${Date.now()}`;
      combinado.image = productoActualizado.image;
    } else if (productoActualizado.image_url) {
      // si backend ya devolvió image_url, solo le agregamos timestamp
      const sep = productoActualizado.image_url.includes('?') ? '&' : '?';
      combinado.image_url = `${productoActualizado.image_url}${sep}t=${Date.now()}`;
      combinado.image = productoActualizado.image || this.productos[index].image;
    } else {
      // si no vino nada nuevo de imagen, conservamos la que había
      combinado.image_url = this.productos[index].image_url;
      combinado.image = this.productos[index].image;
    }

    // La categoría ya viene correctamente desde la lista completa de productos
    // Solo nos aseguramos de que no sea undefined
    if (!combinado.categoria) {
      if (combinado.category_id) {
        // Si hay category_id pero no categoria, puede ser que el backend no la haya incluido
        // En este caso, mantenemos null (se mostrará el ID o se cargará en próxima recarga)
        combinado.categoria = null;
      } else {
        // Si no hay ni categoria ni category_id, es sin categoría
        combinado.categoria = { name: 'Sin categoría' };
      }
    }

    // Reemplazamos en el array y forzamos referencia para que Angular re-renderice
    this.productos[index] = combinado;
    this.productosFiltrados = [...this.productos];
    this.ordenarProductosPorId();

    // Actualizamos la referencia en edición
    this.productoEnEdicion = { ...this.productos[index] };
    
    console.log('✅ Producto actualizado en lista:', combinado);
    console.log('✅ Categoría del producto:', combinado.categoria);
  } else {
    // Si no se encuentra el producto, lo agregamos a la lista
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
  // Limpia búsqueda para asegurar visibilidad del nuevo producto en móvil
  this.search = '';

  if (nuevoProducto) {
    // Agregar el nuevo producto
    this.productos.push(nuevoProducto);
    this.ordenarProductosPorId();
  }

  // Refresca desde backend para asegurar consistencia y paginación
  this.cargarProductos(true);

  // Fuerza render en móviles
  this.cdr.detectChanges();

  // Cierra el modal de crear
  this.cancelarCrearProducto();
}

  /** Método público para recargar lotes de inventario (llamado desde otros componentes) **/
  recargarLotesInventario(): void {
    if (this.productos.length > 0) {
      this.cargarLotesInventario();
    }
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

  /** Cargar lotes de inventario desde las entradas **/
  private cargarLotesInventario(): void {
    const headers = this.getAuthHeaders();

    // Obtener entradas
    this.http.get<any>(`${this.apiUrl}/entries`, { headers })
      .subscribe({
        next: (entradasRes: any) => {
          const entradas = Array.isArray(entradasRes.data) ? entradasRes.data : (Array.isArray(entradasRes) ? entradasRes : []);

          // Agrupar lotes por product_id con cálculo de stock
          // Declarar aquí para que esté disponible en el callback de error de salidas
          const lotesPorProducto = new Map<number, Map<string, LoteInventario>>();

          // Obtener salidas para calcular el stock real
          this.http.get<any>(`${this.apiUrl}/outputs`, { headers })
            .subscribe({
              next: (salidasRes: any) => {
                const salidas = Array.isArray(salidasRes.data) ? salidasRes.data : (Array.isArray(salidasRes) ? salidasRes : []);

                // Procesar entradas
                entradas.forEach((entrada: any) => {
                  const productId = entrada.product_id || entrada.product?.id;
                  if (!productId) return;

                  const lot = String(entrada.lot || entrada.lote || entrada.batch || 'SIN_LOTE').trim().toUpperCase();

                  // Obtener el producto para verificar si este lote es el principal
                  const producto = this.productos.find(p => p.id === productId);
                  const lotePrincipal = producto ? String(producto.batch || '').trim().toUpperCase() : '';

                  // Si el lote es el principal del catálogo, no agregarlo a los lotes de inventario
                  // porque ya se muestra en la información principal del producto
                  if (lot === lotePrincipal && lotePrincipal !== '') {
                    return; // Saltar este lote, ya está en la información principal
                  }

                  if (!lotesPorProducto.has(productId)) {
                    lotesPorProducto.set(productId, new Map());
                  }

                  const lotesProducto = lotesPorProducto.get(productId)!;

                  // Si el lote ya existe, sumar la cantidad
                  if (lotesProducto.has(lot)) {
                    const loteExistente = lotesProducto.get(lot)!;
                    const cantidadEntrada = Number(entrada.quantity || entrada.cantidad || 0);
                    loteExistente.cantidad = (loteExistente.cantidad || 0) + cantidadEntrada;

                    // Si la nueva entrada tiene fecha de vencimiento y el lote no la tiene, o si la nueva es más reciente
                    if (entrada.expiration_date) {
                      if (!loteExistente.expiration_date) {
                        loteExistente.expiration_date = entrada.expiration_date;
                      } else {
                        const fechaEntradaActual = loteExistente.fecha_entrada
                          ? new Date(loteExistente.fecha_entrada).getTime()
                          : 0;
                        const fechaEntradaNueva = entrada.created_at || entrada.fecha || entrada.date;
                        if (fechaEntradaNueva) {
                          const fechaEntradaNuevaTime = new Date(fechaEntradaNueva).getTime();
                          if (fechaEntradaNuevaTime > fechaEntradaActual) {
                            loteExistente.expiration_date = entrada.expiration_date;
                          }
                        }
                      }
                    }

                    // Actualizar fecha de entrada si es más reciente
                    const fechaEntrada = entrada.created_at || entrada.fecha || entrada.date;
                    if (fechaEntrada) {
                      const fechaEntradaActual = loteExistente.fecha_entrada
                        ? new Date(loteExistente.fecha_entrada).getTime()
                        : 0;
                      const fechaEntradaNueva = new Date(fechaEntrada).getTime();

                      if (fechaEntradaNueva > fechaEntradaActual) {
                        loteExistente.fecha_entrada = fechaEntrada;
                      }
                    }
                  } else {
                    // Crear nuevo lote
                    const nuevoLote: LoteInventario = {
                      lot: lot,
                      expiration_date: entrada.expiration_date || null,
                      cantidad: Number(entrada.quantity || entrada.cantidad || 0),
                      fecha_entrada: entrada.created_at || entrada.fecha || entrada.date || null
                    };
                    lotesProducto.set(lot, nuevoLote);
                  }
                });

                // Procesar salidas y restar del stock
                salidas.forEach((salida: any) => {
                  const productId = salida.product_id || salida.product?.id;
                  if (!productId) return;

                  const lot = String(salida.lot || salida.lote || salida.batch || 'SIN_LOTE').trim().toUpperCase();

                  // Obtener el producto para verificar si este lote es el principal
                  const producto = this.productos.find(p => p.id === productId);
                  const lotePrincipal = producto ? String(producto.batch || '').trim().toUpperCase() : '';

                  // Si el lote es el principal, no procesarlo aquí
                  if (lot === lotePrincipal && lotePrincipal !== '') {
                    return;
                  }

                  if (lotesPorProducto.has(productId)) {
                    const lotesProducto = lotesPorProducto.get(productId)!;
                    if (lotesProducto.has(lot)) {
                      const loteExistente = lotesProducto.get(lot)!;
                      const cantidadSalida = Number(salida.quantity || salida.cantidad || 0);
                      loteExistente.cantidad = Math.max(0, (loteExistente.cantidad || 0) - cantidadSalida);
                    }
                  }
                });

                // Asignar lotes a cada producto (solo los que tienen stock > 0)
                this.productos.forEach(producto => {
                  if (producto.id && lotesPorProducto.has(producto.id)) {
                    const lotesMap = lotesPorProducto.get(producto.id)!;
                    // Filtrar solo los lotes con stock > 0
                    const lotesConStock = Array.from(lotesMap.values()).filter(lote => (lote.cantidad || 0) > 0);
                    producto.lotesInventario = lotesConStock;

                    // Ordenar por fecha de entrada (más reciente primero)
                    producto.lotesInventario.sort((a, b) => {
                      const fechaA = a.fecha_entrada ? new Date(a.fecha_entrada).getTime() : 0;
                      const fechaB = b.fecha_entrada ? new Date(b.fecha_entrada).getTime() : 0;
                      return fechaB - fechaA;
                    });

                    // Limpiar cantidad ya que no se muestra en el catálogo
                    producto.lotesInventario.forEach(lote => {
                      delete lote.cantidad;
                    });
                  } else {
                    producto.lotesInventario = [];
                  }
                });

                this.productosFiltrados = [...this.productos];
                this.cdr.detectChanges();
              },
              error: (err) => {
                console.error('Error al cargar salidas:', err);
                // Si falla al cargar salidas, mostrar todos los lotes (sin restar salidas)
                this.asignarLotesSinSalidas(lotesPorProducto);
              }
            });
        },
        error: (err) => {
          console.error('Error al cargar lotes de inventario:', err);
          // Si falla, simplemente no se muestran los lotes, pero los productos siguen funcionando
          this.productos.forEach(producto => {
            producto.lotesInventario = [];
          });
        }
      });
  }

  // Método auxiliar para asignar lotes sin procesar salidas (fallback)
  private asignarLotesSinSalidas(lotesPorProducto: Map<number, Map<string, LoteInventario>>): void {
    this.productos.forEach(producto => {
      if (producto.id && lotesPorProducto.has(producto.id)) {
        const lotesMap = lotesPorProducto.get(producto.id)!;
        producto.lotesInventario = Array.from(lotesMap.values());

        // Ordenar por fecha de entrada (más reciente primero)
        producto.lotesInventario.sort((a, b) => {
          const fechaA = a.fecha_entrada ? new Date(a.fecha_entrada).getTime() : 0;
          const fechaB = b.fecha_entrada ? new Date(b.fecha_entrada).getTime() : 0;
          return fechaB - fechaA;
        });

        // Limpiar cantidad ya que no se muestra en el catálogo
        producto.lotesInventario.forEach(lote => {
          delete lote.cantidad;
        });
      } else {
        producto.lotesInventario = [];
      }
    });

    this.productosFiltrados = [...this.productos];
    this.cdr.detectChanges();
  }

  /** Obtener headers de autenticación **/
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  /** Formatear fecha para mostrar **/
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
