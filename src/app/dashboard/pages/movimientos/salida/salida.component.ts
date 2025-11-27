import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MovimientosService } from '../../../../services/movimientos/movimientos';
import { AlertsService } from '../../../../services/alertas/alerts.service';
import { ProductosService } from '../../../../services/productos/products.service';
import { UnitsService } from '../../../../services/units/units.service';
import { environment } from '../../../../../environments/environment';

declare var Quagga: any;

interface FormDataResponse {
  status: string;
  message: string;
  data: {
    productos: any[];
    inventarios: any[];
  };
}

interface CreateOutputResponse {
  status: string;
  message: string;
  data?: any;
}

@Component({
  selector: 'app-salida',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './salida.component.html',
  styleUrls: ['./salida.component.css']
})
export class SalidaComponent implements OnInit, OnDestroy {
  salidaForm!: FormGroup;
  showForm = false;
  saving = false;
  successMessage = '';
  errorMessage = '';
  warningMessage = '';

  productos: any[] = [];
  inventarios: any[] = [];
  lotesDisponibles: Array<{batch: string, stock: number}> = []; // Lotes disponibles de las entradas

  // Validación de inventario
  productoSeleccionado: any = null;
  validacionInventario = {
    disponible: false,
    cantidadDisponible: 0,
    mensajeError: '',
    loteValido: false
  };

  // Escáner de código de barras
  @ViewChild('scannerContainer') scannerContainer!: ElementRef<HTMLDivElement>;
  mostrarScanner = false;
  codigoBarrasInput = '';
  escaneando = false;
  isScanning = false;
  scannerSupported = true;
  lastScannedCode = '';
  private apiUrl = environment.apiUrl;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private movimientosService: MovimientosService,
    private alertsService: AlertsService,
    private productosService: ProductosService,
    private unitsService: UnitsService,
    private cdr: ChangeDetectorRef
  ) {}

  // Lotes disponibles desde entradas (para validación)
  lotesDesdeEntradas: Map<number, Array<{batch: string, stock: number}>> = new Map();
  
  // Cache de datos para evitar recargas innecesarias
  private inventarioCache: any[] = [];
  private lotesCache: Map<number, Array<{batch: string, stock: number}>> = new Map();
  private cacheTimestamp = 0;
  private readonly CACHE_DURATION = 30000; // 30 segundos

  ngOnInit(): void {
    this.initForm();
    this.loadFormData();
    this.checkQuaggaAvailability();
  }

  ngOnDestroy(): void {
    this.stopScanning();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Verificar disponibilidad de Quagga */
  private checkQuaggaAvailability(): void {
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      if (typeof Quagga !== 'undefined') {
        this.scannerSupported = true;
        clearInterval(checkInterval);
      } else if (attempts >= maxAttempts) {
        this.scannerSupported = false;
        clearInterval(checkInterval);
      }
    }, 200);
  }

  private initForm() {
    this.salidaForm = this.fb.group({
      product_id: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      unit: [''],
      lot: [''],
      motivo: ['']
    });
  }

  toggleForm() {
    this.showForm = !this.showForm;
    this.clearMessages();
  }

  private clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
    this.warningMessage = '';
  }

  loadFormData() {
    // Preferir inventario del backend directamente (tabla Inventory)
    this.cargarInventarioDesdeBackend();
    // Cargar lotes desde entradas para validación
    this.cargarLotesDesdeEntradas();
  }

  /** Cargar lotes disponibles desde entradas (optimizado) - SOLO CON STOCK > 0 **/
  private cargarLotesDesdeEntradas(): void {
    // Verificar cache
    const now = Date.now();
    if (this.lotesCache.size > 0 && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      this.lotesDesdeEntradas = new Map(this.lotesCache);
      return;
    }

    const headers = this.getAuthHeaders();
    
    // Obtener entradas primero
    this.http.get(`${this.apiUrl}/entries`, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (entradasRes: any) => {
          const entradas = Array.isArray(entradasRes.data) ? entradasRes.data : (Array.isArray(entradasRes) ? entradasRes : []);
          
          // Obtener salidas para calcular stock real
          this.http.get(`${this.apiUrl}/outputs`, { headers })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (salidasRes: any) => {
                const salidas = Array.isArray(salidasRes.data) ? salidasRes.data : (Array.isArray(salidasRes) ? salidasRes : []);
                
                // Agrupar lotes por product_id con cálculo de stock
                const lotesMap = new Map<number, Map<string, number>>();
                
                // Procesar entradas (sumar)
                entradas.forEach((entrada: any) => {
                  const productId = entrada.product_id || entrada.product?.id;
                  if (!productId) return;
                  
                  const lote = String(entrada.lote || entrada.lot || entrada.batch || 'SIN_LOTE').trim().toUpperCase();
                  const cantidad = Number(entrada.quantity || entrada.cantidad || 0);
                  
                  if (!lotesMap.has(productId)) {
                    lotesMap.set(productId, new Map());
                  }
                  
                  const lotesProducto = lotesMap.get(productId)!;
                  const stockActual = lotesProducto.get(lote) || 0;
                  lotesProducto.set(lote, stockActual + cantidad);
                });
                
                // Procesar salidas (restar)
                salidas.forEach((salida: any) => {
                  const productId = salida.product_id || salida.product?.id;
                  if (!productId) return;
                  
                  const lote = String(salida.lote || salida.lot || salida.batch || 'SIN_LOTE').trim().toUpperCase();
                  const cantidad = Number(salida.quantity || salida.cantidad || 0);
                  
                  if (lotesMap.has(productId)) {
                    const lotesProducto = lotesMap.get(productId)!;
                    if (lotesProducto.has(lote)) {
                      const stockActual = lotesProducto.get(lote) || 0;
                      lotesProducto.set(lote, Math.max(0, stockActual - cantidad));
                    }
                  }
                });
                
                // Convertir a estructura más simple y FILTRAR solo lotes con stock > 0
                this.lotesDesdeEntradas.clear();
                lotesMap.forEach((lotesProducto, productId) => {
                  const lotesArray = Array.from(lotesProducto.entries())
                    .filter(([batch, stock]) => stock > 0) // Solo lotes con stock > 0
                    .map(([batch, stock]) => ({
                      batch,
                      stock
                    }));
                  
                  // Solo agregar si hay lotes con stock
                  if (lotesArray.length > 0) {
                    this.lotesDesdeEntradas.set(productId, lotesArray);
                  }
                });
                
                // Guardar en cache
                this.lotesCache = new Map(this.lotesDesdeEntradas);
                this.cacheTimestamp = now;
              },
              error: (err) => {
                console.error('Error al cargar salidas para calcular stock:', err);
                // Si falla, usar solo entradas (sin restar salidas)
                this.cargarLotesSoloEntradas(entradas, now);
              }
            });
        },
        error: (err) => {
          console.error('Error al cargar entradas:', err);
          // Si falla el endpoint optimizado, intentar con el normal
          this.cargarLotesDesdeEntradasFallback();
        }
      });
  }

  /** Método auxiliar: cargar lotes solo desde entradas (fallback) **/
  private cargarLotesSoloEntradas(entradas: any[], timestamp: number): void {
    const lotesMap = new Map<number, Map<string, number>>();
    
    entradas.forEach((entrada: any) => {
      const productId = entrada.product_id || entrada.product?.id;
      if (!productId) return;
      
      const lote = String(entrada.lote || entrada.lot || entrada.batch || 'SIN_LOTE').trim().toUpperCase();
      const cantidad = Number(entrada.quantity || entrada.cantidad || 0);
      
      if (!lotesMap.has(productId)) {
        lotesMap.set(productId, new Map());
      }
      
      const lotesProducto = lotesMap.get(productId)!;
      const stockActual = lotesProducto.get(lote) || 0;
      lotesProducto.set(lote, stockActual + cantidad);
    });
    
    // Convertir a estructura más simple
    this.lotesDesdeEntradas.clear();
    lotesMap.forEach((lotesProducto, productId) => {
      const lotesArray = Array.from(lotesProducto.entries()).map(([batch, stock]) => ({
        batch,
        stock
      }));
      this.lotesDesdeEntradas.set(productId, lotesArray);
    });
    
    // Guardar en cache
    this.lotesCache = new Map(this.lotesDesdeEntradas);
    this.cacheTimestamp = timestamp;
  }

  /** Fallback: cargar lotes desde endpoint normal con límite - CON CÁLCULO DE STOCK **/
  private cargarLotesDesdeEntradasFallback(): void {
    const headers = this.getAuthHeaders();
    const now = Date.now();
    
    // Limitar a 1000 entradas recientes para no sobrecargar
    this.http.get(`${this.apiUrl}/entries?limit=1000&order_by=created_at&order=desc`, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (entradasRes: any) => {
          const entradas = Array.isArray(entradasRes.data) ? entradasRes.data : (Array.isArray(entradasRes) ? entradasRes : []);
          
          // Obtener salidas para calcular stock real
          this.http.get(`${this.apiUrl}/outputs?limit=1000&order_by=created_at&order=desc`, { headers })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (salidasRes: any) => {
                const salidas = Array.isArray(salidasRes.data) ? salidasRes.data : (Array.isArray(salidasRes) ? salidasRes : []);
                const lotesMap = new Map<number, Map<string, number>>();
                
                // Procesar entradas (sumar)
                entradas.forEach((entrada: any) => {
                  const productId = entrada.product_id || entrada.product?.id;
                  if (!productId) return;
                  
                  const lote = String(entrada.lote || entrada.lot || entrada.batch || 'SIN_LOTE').trim().toUpperCase();
                  const cantidad = Number(entrada.quantity || entrada.cantidad || 0);
                  
                  if (!lotesMap.has(productId)) {
                    lotesMap.set(productId, new Map());
                  }
                  const lotesProducto = lotesMap.get(productId)!;
                  const stockActual = lotesProducto.get(lote) || 0;
                  lotesProducto.set(lote, stockActual + cantidad);
                });
                
                // Procesar salidas (restar)
                salidas.forEach((salida: any) => {
                  const productId = salida.product_id || salida.product?.id;
                  if (!productId) return;
                  
                  const lote = String(salida.lote || salida.lot || salida.batch || 'SIN_LOTE').trim().toUpperCase();
                  const cantidad = Number(salida.quantity || salida.cantidad || 0);
                  
                  if (lotesMap.has(productId)) {
                    const lotesProducto = lotesMap.get(productId)!;
                    if (lotesProducto.has(lote)) {
                      const stockActual = lotesProducto.get(lote) || 0;
                      lotesProducto.set(lote, Math.max(0, stockActual - cantidad));
                    }
                  }
                });
                
                // Convertir a estructura más simple y FILTRAR solo lotes con stock > 0
                this.lotesDesdeEntradas.clear();
                lotesMap.forEach((lotesProducto, productId) => {
                  const lotesArray = Array.from(lotesProducto.entries())
                    .filter(([batch, stock]) => stock > 0) // Solo lotes con stock > 0
                    .map(([batch, stock]) => ({
                      batch,
                      stock
                    }));
                  
                  // Solo agregar si hay lotes con stock
                  if (lotesArray.length > 0) {
                    this.lotesDesdeEntradas.set(productId, lotesArray);
                  }
                });
                
                this.lotesCache = new Map(this.lotesDesdeEntradas);
                this.cacheTimestamp = now;
              },
              error: (err) => {
                console.error('Error cargando salidas en fallback:', err);
                // Si falla, usar solo entradas
                this.cargarLotesSoloEntradas(entradas, now);
              }
            });
        },
        error: (err) => {
          console.error('Error cargando lotes desde entradas:', err);
        }
      });
  }

  /** Cargar inventario directo desde backend (tabla inventory) - OPTIMIZADO **/
  private cargarInventarioDesdeBackend() {
    // Verificar cache
    const now = Date.now();
    if (this.inventarioCache.length > 0 && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      this.inventarios = [...this.inventarioCache];
      this.actualizarProductosDesdeInventario();
      return;
    }

    const headers = this.getAuthHeaders();
    // Solicitar solo campos necesarios y con stock > 0
    this.http.get(`${this.apiUrl}/inventories?stock_min=1&fields=id,product_id,lot,stock_actual,product`, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const data = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);

          // Esperamos campos: id, product_id, lot, stock_actual, product?.name
          const inventariosMapeados = data.map((item: any) => ({
            id: item.id,
            product_id: item.product_id || item.product?.id,
            product_name: item.product?.name || item.producto || item.name || 'Producto',
            lot: String(item.lot || item.batch || 'SIN_LOTE').trim().toUpperCase(),
            entradas: 0,
            salidas: 0,
            stock_actual: Number(item.stock_actual ?? item.stock ?? 0)
          }));

          // Solo inventarios con stock positivo
          this.inventarios = inventariosMapeados.filter((i: any) => i.product_id && i.stock_actual > 0);
          
          // Guardar en cache
          this.inventarioCache = [...this.inventarios];
          this.cacheTimestamp = now;

          this.actualizarProductosDesdeInventario();
        },
        error: err => {
          // Si el endpoint optimizado falla, usar el normal
          this.cargarInventarioNormal(headers);
        }
      });
  }

  /** Cargar inventario con endpoint normal (fallback) **/
  private cargarInventarioNormal(headers: HttpHeaders): void {
    this.http.get(`${this.apiUrl}/inventories`, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const data = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
          const inventariosMapeados = data.map((item: any) => ({
            id: item.id,
            product_id: item.product_id || item.product?.id,
            product_name: item.product?.name || item.producto || item.name || 'Producto',
            lot: String(item.lot || item.batch || 'SIN_LOTE').trim().toUpperCase(),
            entradas: 0,
            salidas: 0,
            stock_actual: Number(item.stock_actual ?? item.stock ?? 0)
          }));

          this.inventarios = inventariosMapeados.filter((i: any) => i.product_id && i.stock_actual > 0);
          this.inventarioCache = [...this.inventarios];
          this.cacheTimestamp = Date.now();
          
          this.actualizarProductosDesdeInventario();
        },
        error: err => {
          this.errorMessage = 'Error al cargar inventario.';
        }
      });
  }

  /** Actualizar lista de productos desde inventario **/
  private actualizarProductosDesdeInventario(): void {
    const productosMap = new Map<number, { id: number; name: string }>();
    this.inventarios.forEach((inv: any) => {
      if (!productosMap.has(inv.product_id)) {
        productosMap.set(inv.product_id, { id: inv.product_id, name: inv.product_name });
      }
    });
    this.productos = Array.from(productosMap.values());
  }

  /** Cargar inventario real desde las entradas (fallback) - OPTIMIZADO **/
  private cargarInventarioReal() {
    const headers = this.getAuthHeaders();

    // Obtener entradas limitadas (últimas 1000) para calcular el inventario real
    this.http.get(`${this.apiUrl}/entries?limit=1000&order_by=created_at&order=desc`, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (entradasRes: any) => {
          const entradas = entradasRes.data || [];

          // Obtener salidas limitadas (últimas 1000)
          this.http.get(`${this.apiUrl}/outputs?limit=1000&order_by=created_at&order=desc`, { headers })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (salidasRes: any) => {
                const salidas = salidasRes.data || [];
                // Calcular inventario real por producto y lote
                this.calcularInventarioReal(entradas, salidas);
              },
              error: err => {
                this.errorMessage = 'Error al cargar datos de salidas.';
              }
            });
        },
        error: err => {
          this.errorMessage = 'Error al cargar datos de entradas.';
        }
      });
  }

  /** Calcular inventario real agrupado por producto y lote (optimizado, sin logs) **/
  private calcularInventarioReal(entradas: any[], salidas: any[]) {
    const inventarioMap = new Map();

    // Procesar entradas
    entradas.forEach(entrada => {
      const productId = entrada.product_id || entrada.product?.id || null;
      if (!productId) return;
      const lotRaw = entrada.lote || entrada.batch || 'SIN_LOTE';
      const lot = String(lotRaw).trim().toUpperCase();
      const productName = entrada.producto || entrada.product?.name || entrada.name || 'Producto desconocido';
      const cantidadTexto = entrada.cantidad || entrada.quantity || '0';
      const cantidadNumerica = Number(String(cantidadTexto).replace(/[^\d.]/g, '')) || 0;
      const key = `${productId}_${lot}`;
      if (!inventarioMap.has(key)) {
        inventarioMap.set(key, {
          product_id: productId,
          product_name: productName,
          lot: lot,
          entradas: 0,
          salidas: 0,
          stock_actual: 0
        });
      }
      inventarioMap.get(key).entradas += cantidadNumerica;
    });

    // Procesar salidas
    salidas.forEach(salida => {
      const productId = salida.product_id || salida.product?.id || null;
      if (!productId) return;
      const lotRaw = salida.lot || salida.batch || 'SIN_LOTE';
      const lot = String(lotRaw).trim().toUpperCase();
      const cantidad = salida.cantidad || salida.quantity || 0;
      const key = `${productId}_${lot}`;
      if (inventarioMap.has(key)) {
        inventarioMap.get(key).salidas += Number(cantidad);
      }
    });

    // Calcular stock actual
    inventarioMap.forEach(item => {
      item.stock_actual = item.entradas - item.salidas;
    });

    // Convertir a array y filtrar solo productos con stock
    this.inventarios = Array.from(inventarioMap.values())
      .filter(item => item.stock_actual > 0);
    
    // Guardar en cache
    this.inventarioCache = [...this.inventarios];
    this.cacheTimestamp = Date.now();

    // Crear lista de productos únicos
    this.actualizarProductosDesdeInventario();
  }

  /** Validar producto seleccionado **/
  /** Cuando cambia el producto **/
  onProductoChange(): void {
    const productId = Number(this.salidaForm.get('product_id')?.value);
    const cantidad = this.salidaForm.get('quantity')?.value;

    if (productId) {
      this.productoSeleccionado = this.productos.find(p => p.id == productId);

      // Obtener lotes disponibles desde entradas para este producto
      const lotesEntradas = this.lotesDesdeEntradas.get(productId) || [];
      this.lotesDisponibles = lotesEntradas;

      // Si solo hay un lote, autocompletarlo
      if (lotesEntradas.length === 1) {
        this.salidaForm.patchValue({ lot: lotesEntradas[0].batch });
      } else {
        // Varios lotes o ninguno: limpiar y dejar que el usuario seleccione
        this.salidaForm.patchValue({ lot: '' });
        if (lotesEntradas.length === 0) {
          this.warningMessage = '⚠️ Este producto no tiene lotes registrados en entradas.';
        }
      }

      this.validarDisponibilidad(cantidad);
    } else {
      this.productoSeleccionado = null;
      this.lotesDisponibles = [];
      this.salidaForm.patchValue({ lot: '' });
      this.resetValidacionInventario();
    }
  }


  /** Validar cantidad cuando cambia **/
  onCantidadChange(): void {
    const cantidad = this.salidaForm.get('quantity')?.value;
    this.validarDisponibilidad(cantidad);
  }

  /** Validar lote cuando cambia **/
  onLoteChange(): void {
    const cantidad = this.salidaForm.get('quantity')?.value;
    this.validarDisponibilidad(cantidad);
  }

  /** Validar que el producto esté disponible en inventario **/
  private validarDisponibilidad(cantidad: number): void {
    if (!this.productoSeleccionado || !cantidad) {
      this.resetValidacionInventario();
      return;
    }

    const productId = Number(this.productoSeleccionado.id);
    const loteIngresado = (this.salidaForm.get('lot')?.value || '').toString().trim().toUpperCase();

    // PRIMERO: Validar que el lote existe en las entradas
    if (!loteIngresado || loteIngresado === '') {
      this.validacionInventario = {
        disponible: false,
        cantidadDisponible: 0,
        mensajeError: '⚠️ Debe seleccionar un lote',
        loteValido: false
      };
      return;
    }

    const lotesEntradas = this.lotesDesdeEntradas.get(productId) || [];
    const loteEncontrado = lotesEntradas.find(l => l.batch.toUpperCase() === loteIngresado);

    if (!loteEncontrado) {
      this.validacionInventario = {
        disponible: false,
        cantidadDisponible: 0,
        mensajeError: `⚠️ El lote "${loteIngresado}" no existe en las entradas. Lotes disponibles: ${lotesEntradas.map(l => l.batch).join(', ') || 'Ninguno'}`,
        loteValido: false
      };
      return;
    }

    // SEGUNDO: Validar stock disponible en inventario
    const inventarioProducto = this.inventarios.find(inv =>
      inv.product_id == productId && String(inv.lot).toUpperCase() === loteIngresado
    );

    if (!inventarioProducto) {
      this.validacionInventario = {
        disponible: false,
        cantidadDisponible: 0,
        mensajeError: `⚠️ No hay stock disponible para el lote "${loteIngresado}"`,
        loteValido: true
      };
      return;
    }

    const cantidadDisponible = inventarioProducto.stock_actual || 0;
    const disponible = cantidadDisponible >= cantidad;

    this.validacionInventario = {
      disponible,
      cantidadDisponible,
      mensajeError: disponible ? '' : `⚠️ Cantidad insuficiente. Disponible: ${cantidadDisponible}, Solicitado: ${cantidad}`,
      loteValido: true
    };

    // ✅ Guarda el inventario encontrado para el submit
    this.productoSeleccionado = {
      ...this.productoSeleccionado,
      inventario_id: inventarioProducto.id
    };

    if (!disponible) {
      this.crearAlertaProductoNoEnInventario();
    }
  }


  /** Resetear validación de inventario **/
  private resetValidacionInventario(): void {
    this.validacionInventario = {
      disponible: false,
      cantidadDisponible: 0,
      mensajeError: '',
      loteValido: false
    };
  }

  /** Crear alerta cuando el producto no está en inventario **/
  private crearAlertaProductoNoEnInventario(): void {
    const alerta = {
      product_id: this.productoSeleccionado?.id || null,
      alert_type: 'producto_no_en_inventario',
      message: `El producto "${this.productoSeleccionado?.name}" no está disponible en inventario o la cantidad solicitada excede el stock disponible`,
      status: 'pendiente'
    };

    // Aquí se enviaría la alerta al backend
    console.warn('🚨 Alerta: Producto no disponible en inventario', alerta);

    // Mostrar mensaje de advertencia
    this.warningMessage = `⚠️ El producto no está disponible en inventario o la cantidad solicitada excede el stock disponible`;
  }

  onSubmit() {
    if (this.salidaForm.invalid) {
      this.warningMessage = '⚠️ Por favor completa todos los campos obligatorios.';
      return;
    }

    // Validar que el lote existe en entradas
    const loteIngresado = (this.salidaForm.get('lot')?.value || '').toString().trim().toUpperCase();
    if (!loteIngresado || loteIngresado === '') {
      this.warningMessage = '⚠️ Debe seleccionar un lote.';
      return;
    }

    const productId = Number(this.salidaForm.get('product_id')?.value);
    const lotesEntradas = this.lotesDesdeEntradas.get(productId) || [];
    const loteExiste = lotesEntradas.some(l => l.batch.toUpperCase() === loteIngresado);

    if (!loteExiste) {
      this.warningMessage = `⚠️ El lote "${loteIngresado}" no existe en las entradas. Debe registrar una entrada con este lote primero.`;
      return;
    }

    if (!this.validacionInventario.disponible || !this.validacionInventario.loteValido) {
      this.warningMessage = this.validacionInventario.mensajeError || '⚠️ El producto no está disponible en inventario o la cantidad solicitada excede el stock disponible.';
      return;
    }

    this.saving = true;
    this.clearMessages();
    
    // Invalidar cache después de crear salida
    this.cacheTimestamp = 0;

    const lote = this.salidaForm.value.lot || null;
    // Reutilizar productId ya declarado arriba
    // const productId ya está declarado como Number

    // ✅ Buscar inventario correspondiente al producto y lote
    const inventarioSeleccionado = this.inventarios.find(inv =>
      inv.product_id == productId && (!lote || inv.lot === lote)
    );

    if (!inventarioSeleccionado) {
      this.errorMessage = '❌ No se encontró un inventario válido para este producto y lote.';
      this.saving = false;
      return;
    }

    const basePayload: any = {
      product_id: productId,
      quantity: Number(this.salidaForm.value.quantity),
      unit: this.salidaForm.value.unit || 'unidades',
      lot: lote,
      motivo: this.salidaForm.value.motivo || 'sin motivo'
    };

    // Solo incluir inventory_id si existe un id numérico válido (por si el backend lo requiere)
    if (inventarioSeleccionado && Number.isFinite(Number(inventarioSeleccionado.id))) {
      basePayload.inventory_id = Number(inventarioSeleccionado.id);
    }

    this.http.post<CreateOutputResponse>(`${this.apiUrl}/outputs`, basePayload, { headers: this.getAuthHeaders() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.successMessage = res.message || '✅ Salida registrada correctamente.';
          this.resetForm();
          this.movimientosService.refreshCounts();
          this.movimientosService.getSalidasList();
          
          // Invalidar cache y recargar lotes para actualizar stock
          this.cacheTimestamp = 0;
          this.cargarLotesDesdeEntradas();
          this.cargarInventarioDesdeBackend();
          
          setTimeout(() => this.clearMessages(), 5000);
        },
        error: err => {
          console.error('❌ Error al registrar la salida:', err);
          if (err.status === 422 && err.error?.errors) {
            this.errorMessage = Object.values(err.error.errors).flat().join(' ');
          } else if (err.error?.message) {
            this.errorMessage = err.error.message;
          } else {
            this.errorMessage = '❌ Error al registrar la salida.';
          }
        },
        complete: () => {
          this.saving = false;
        }
      });
  }


  private resetForm() {
    this.salidaForm.reset({ product_id: '', quantity: '', unit: '', lot: '', motivo: '' });
    this.salidaForm.markAsPristine();
    this.salidaForm.markAsUntouched();
    this.showForm = false;
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Accept': 'application/json' });
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  /** Toggle escáner de código de barras */
  toggleScanner(): void {
    this.mostrarScanner = !this.mostrarScanner;
    this.codigoBarrasInput = '';
    this.clearMessages();

    if (!this.mostrarScanner) {
      this.stopScanning();
    }
  }

  onCodigoInputChange(): void {
    // Cuando el usuario escribe manualmente, asegurarse de que no esté escaneando
    if (this.isScanning) {
      this.stopScanning();
    }
    // Asegurarse de que escaneando esté en false cuando el usuario escribe
    if (this.escaneando && this.codigoBarrasInput && this.codigoBarrasInput.trim().length > 0) {
      this.escaneando = false;
    }
  }

  /** Iniciar escaneo con cámara */
  startCameraScanning(): void {
    if (this.isScanning) {
      this.stopScanning();
      return;
    }

    if (typeof Quagga === 'undefined') {
      this.errorMessage = '❌ El escáner no está disponible. Por favor, recarga la página o usa el modo manual.';
      return;
    }

    // Asegurarse de que el contenedor esté visible antes de inicializar
    this.mostrarScanner = true;

    // Esperar un momento para que el DOM se actualice
    setTimeout(() => {
      if (!this.scannerContainer?.nativeElement) {
        this.errorMessage = '❌ Error: contenedor del escáner no encontrado.';
        this.isScanning = false;
        return;
      }

      // Limpiar cualquier instancia previa de Quagga
      try {
        Quagga.stop();
        Quagga.offDetected();
        Quagga.offProcessed();
      } catch (e) {
        // Ignorar errores si no hay instancia previa
      }

      this.errorMessage = '';
      this.successMessage = '📷 Iniciando escáner...';
      this.lastScannedCode = '';
      this.isScanning = true;

      Quagga.init({
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: this.scannerContainer.nativeElement,
          constraints: {
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            facingMode: 'environment'
          },
          area: {
            top: '20%',
            right: '10%',
            left: '10%',
            bottom: '20%'
          }
        },
        locator: {
          patchSize: 'medium',
          halfSample: true
        },
        numOfWorkers: 2,
        decoder: {
          readers: [
            'ean_reader',
            'ean_8_reader',
            'code_128_reader',
            'code_39_reader',
            'upc_reader',
            'upc_e_reader'
          ]
        },
        locate: true,
        frequency: 30
      }, (err: any) => {
        if (err) {
          console.error('Error inicializando QuaggaJS:', err);
          this.errorMessage = '❌ Error al iniciar el escáner. Verifica los permisos de la cámara.';
          this.isScanning = false;
          return;
        }

        this.successMessage = '📷 Escaneando... Apunta la cámara al código de barras';
        
        Quagga.start();

        // Detección rápida - acepta el código en la primera lectura válida
        const detectHandler = (result: any) => {
          const code = result.codeResult.code?.trim();
          
          if (!code || code === this.lastScannedCode) return;


          // Aceptar inmediatamente el código escaneado
          this.lastScannedCode = code;
          Quagga.offDetected(detectHandler);
          this.stopScanning();
          
          // Asignar el código y buscar después de un pequeño delay para asegurar que se actualice
          setTimeout(() => {
            this.codigoBarrasInput = code;
            this.buscarProductoPorCodigo();
          }, 100);
        };

        Quagga.onDetected(detectHandler);
      });
    }, 300);
  }

  /** Detener escaneo */
  stopScanning(): void {
    if (this.isScanning && typeof Quagga !== 'undefined') {
      try {
        Quagga.stop();
        Quagga.offDetected();
        Quagga.offProcessed();
      } catch (error) {
        console.error('Error deteniendo QuaggaJS:', error);
      }
      this.isScanning = false;
      this.successMessage = '';
    }
  }

  /** Buscar producto por código de barras en el inventario y autocompletar */
  buscarProductoPorCodigo(): void {
    // Verificar que haya un código válido
    if (!this.codigoBarrasInput || !this.codigoBarrasInput.trim()) {
      this.warningMessage = '⚠️ Ingrese un código de barras.';
      return;
    }

    const codigo = this.codigoBarrasInput.trim();
    if (!codigo || codigo.length === 0) {
      this.warningMessage = '⚠️ Ingrese un código de barras válido.';
      return;
    }

    // Si ya está buscando, no hacer nada
    if (this.escaneando) {
      return;
    }

    this.escaneando = true;
    this.clearMessages();
    this.cdr.detectChanges();

    // Buscar producto por código de barras en el catálogo
    this.productosService.buscarPorCodigoBarras(codigo).subscribe({
      next: (producto) => {
        if (!producto) {
          this.escaneando = false;
          this.errorMessage = `❌ No se encontró ningún producto con el código "${codigo}". Verifique el código o regístrelo en el catálogo primero.`;
          this.codigoBarrasInput = '';
          this.cdr.detectChanges();
          return;
        }

        // Buscar el producto en el inventario (con stock disponible)
        const inventarioProducto = this.inventarios.find(inv => 
          inv.product_id == producto.id && inv.stock_actual > 0
        );

        if (!inventarioProducto) {
          this.escaneando = false;
          this.errorMessage = `❌ El producto "${producto.name}" no tiene stock disponible en el inventario.`;
          this.codigoBarrasInput = '';
          this.cdr.detectChanges();
          return;
        }

        // Abrir el formulario si no está abierto
        if (!this.showForm) {
          this.showForm = true;
        }

        // Obtener el nombre completo de la unidad de medida desde el inventario
        let nombreUnidad = inventarioProducto.unit || producto.unit_measurement || '';
        if (nombreUnidad) {
          const unidades = this.unitsService.getUnitsSync();
          const unidadEncontrada = unidades.find(u => 
            u.abbreviation?.toLowerCase() === nombreUnidad.toLowerCase() ||
            u.name.toLowerCase() === nombreUnidad.toLowerCase()
          );
          if (unidadEncontrada) {
            nombreUnidad = unidadEncontrada.name; // Usar el nombre completo
          }
        }

        // Autocompletar campos del producto desde el inventario
        this.salidaForm.patchValue({
          product_id: producto.id,
          unit: nombreUnidad,
          lot: inventarioProducto.lot || ''
        });

        // Disparar el evento de cambio de producto para cargar lotes disponibles
        this.onProductoChange();

        // Validar disponibilidad
        const cantidad = this.salidaForm.get('quantity')?.value;
        if (cantidad) {
          this.validarDisponibilidad(cantidad);
        }

        this.successMessage = `✅ Producto "${producto.name}" encontrado en inventario. Stock disponible: ${inventarioProducto.stock_actual}.`;
        this.codigoBarrasInput = '';
        this.mostrarScanner = false;
        this.escaneando = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.escaneando = false;
        this.errorMessage = '❌ Error al buscar el producto. Intente nuevamente.';
        this.codigoBarrasInput = '';
        this.cdr.detectChanges();
      },
      complete: () => {
        // Asegurarse de que escaneando se resetee incluso si hay algún problema
        if (this.escaneando) {
          this.escaneando = false;
          this.cdr.detectChanges();
        }
      }
    });
  }

}
