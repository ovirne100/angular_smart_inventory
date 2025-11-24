import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { WarehousesService } from '../../../../services/almacenes/warehouses.service';
import { MovimientosService } from '../../../../services/movimientos/movimientos';
import { AlertsService } from '../../../../services/alertas/alerts.service';
import { ProductosService } from '../../../../services/productos/products.service';
import { UnitsService } from '../../../../services/units/units.service';

// Declaración global de Quagga
declare var Quagga: any;

interface FormDataResponse {
  status: string;
  message: string;
  productos: any[];
  proveedores: any[];
  usuarios?: any[];
}

interface CreateEntryResponse {
  status: string;
  message: string;
  data?: any;
}

@Component({
  selector: 'app-entrada',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './entrada.component.html',
  styleUrls: ['./entrada.component.css']
})
export class EntradaComponent implements OnInit, OnDestroy {
  entradaForm!: FormGroup;
  warehouseForm!: FormGroup;
  showForm = false;
  mostrarModalAlmacen = false;
  saving = false;
  successMessage = '';
  errorMessage = '';
  warningMessage = '';

  currentUser: any;
  productos: any[] = [];
  proveedores: any[] = [];
  usuarios: any[] = [];
  warehouses: any[] = [];

  productoSeleccionado: any = null;
  esLotePrincipal = false;

  @ViewChild('scannerContainer') scannerContainer!: ElementRef<HTMLDivElement>;
  mostrarScanner = false;
  codigoBarrasInput = '';
  escaneando = false;
  isScanning = false;
  scannerSupported = true;
  lastScannedCode = '';

  private apiUrl = 'http://127.0.0.1:8000/api';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private warehouseService: WarehousesService,
    private movimientosService: MovimientosService,
    private alertsService: AlertsService,
    private productosService: ProductosService,
    private unitsService: UnitsService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadFormData();
    this.loadCurrentUser();
    this.loadWarehouses();
    this.checkQuaggaAvailability();

    this.route.queryParams.subscribe(params => {
      if (params['product_id']) {
        const productId = +params['product_id'];
        setTimeout(() => {
          this.preLlenarDesdeBarcode(productId);
        }, 500);
      }
    });
  }

  ngOnDestroy(): void {
    this.stopScanning();
    this.destroy$.next();
    this.destroy$.complete();
  }

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

  private initForms(): void {
    this.entradaForm = this.fb.group({
      product_id: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      unit: [''],
      lot: [''],
      expiration_date: [''],
      supplier_id: ['', Validators.required],
      warehouse_id: ['', Validators.required],
      ubicacion_interna: ['', Validators.required],
      min_stock: ['', [Validators.required, Validators.min(0)]],
      user_id: [null]
    });

    this.warehouseForm = this.fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
      capacity: ['', Validators.required]
    });
  }

  loadWarehouses(): void {
    this.warehouseService.getWarehouses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => this.warehouses = res,
        error: (err) => {
          console.error('Error cargando almacenes:', err);
          this.errorMessage = 'No se pudieron cargar los almacenes.';
        }
      });
  }

  abrirModalAlmacen(): void {
    this.mostrarModalAlmacen = true;
    this.warehouseForm.reset();
  }

  cerrarModalAlmacen(): void {
    this.mostrarModalAlmacen = false;
    this.warehouseForm.reset();
  }

  crearWarehouse(): void {
    if (this.warehouseForm.invalid) return;

    this.saving = true;
    const payload = {
      ...this.warehouseForm.value,
      // Asegurar que capacity se maneje como string o el tipo esperado por el backend
      capacity: String(this.warehouseForm.value.capacity)
    };

    this.warehouseService.createWarehouse(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.successMessage = '✅ Almacén creado correctamente';
          this.cerrarModalAlmacen();
          this.loadWarehouses();
          setTimeout(() => {
            const nuevoAlmacen = res.data || res;
            if (nuevoAlmacen?.id) {
              this.entradaForm.patchValue({ warehouse_id: nuevoAlmacen.id });
            }
          }, 100);
          this.saving = false;
        },
        error: err => {
          console.error('❌ Error creando almacén', err);
          this.errorMessage = err.error?.message || '❌ Error al crear el almacén';
          this.saving = false;
        }
      });
  }

  private loadCurrentUser(): void {
    const headers = this.getAuthHeaders();
    this.http.get<any>(`${this.apiUrl}/user`, { headers })
      .subscribe({
        next: res => {
          this.currentUser = res;
          if (res?.id) this.entradaForm.patchValue({ user_id: res.id });
        },
        error: err => console.error('Error cargando usuario', err)
      });
  }

  private loadFormData(): void {
    // Cargar productos usando caché (más rápido)
    this.productosService.getProducts({ perPage: 1000 }).subscribe({
      next: (res) => {
        this.productos = res.data || [];
      },
      error: (err) => {
        this.errorMessage = 'Error al cargar productos del catálogo.';
      }
    });
    const headers = this.getAuthHeaders();
    this.http.get<FormDataResponse>(`${this.apiUrl}/entries/form-data`, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.proveedores = res.proveedores || [];
          this.usuarios = res.usuarios || [];
        },
        error: err => {
          console.error('Error cargando proveedores', err);
          this.errorMessage = 'Error al cargar proveedores.';
        }
      });
  }

  onProductoChange(): void {
    const productId = this.entradaForm.get('product_id')?.value;
    if (productId) {
      this.productoSeleccionado = this.productos.find(p => p.id == productId);
      this.verificarLotePrincipal();
    } else {
      this.productoSeleccionado = null;
      this.esLotePrincipal = false;
    }
  }

  verificarLotePrincipal(): void {
    const loteIngresado = this.entradaForm.get('lot')?.value?.trim().toUpperCase();
    if (this.productoSeleccionado && loteIngresado) {
      const lotePrincipal = (this.productoSeleccionado.batch || '').toString().trim().toUpperCase();
      this.esLotePrincipal = loteIngresado === lotePrincipal;
    } else {
      this.esLotePrincipal = false;
    }
  }

  onLoteChange(): void {
    this.verificarLotePrincipal();
    if (this.esLotePrincipal) {
      // Si es lote principal, limpiar la fecha de vencimiento ya que usará la del catálogo
      this.entradaForm.patchValue({ expiration_date: '' });
    }
  }

  onSubmit(): void {
    if (this.entradaForm.invalid) {
      // Marcar todos los controles como 'touched' para mostrar los errores
      Object.keys(this.entradaForm.controls).forEach(key => {
        this.entradaForm.controls[key].markAsTouched();
      });
      this.warningMessage = '⚠️ Por favor completa todos los campos obligatorios.';
      return;
    }

    const lotValue = this.entradaForm.get('lot')?.value?.trim() || 'SIN_LOTE';
    this.entradaForm.patchValue({ lot: lotValue });

    if (!this.esLotePrincipal && !this.entradaForm.get('expiration_date')?.value) {
      this.warningMessage = '⚠️ Los lotes nuevos deben tener una fecha de vencimiento.';
      return;
    }

    const formValue = { ...this.entradaForm.value };
    if (this.esLotePrincipal) {
      // Asegurarse de no enviar fecha de vencimiento si es lote principal
      delete formValue.expiration_date;
    } else if (formValue.expiration_date) {
      // Formatear la fecha para el backend si es necesario (ej: añadir hora)
      const fecha = formValue.expiration_date;
      if (fecha.includes('-') && fecha.length === 10) {
        formValue.expiration_date = `${fecha} 00:00:00`;
      }
    }

    this.saving = true;
    this.clearMessages();
    const headers = this.getAuthHeaders();

    this.http.post<CreateEntryResponse>(`${this.apiUrl}/entries`, formValue, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.successMessage = res.message || '✅ Entrada creada correctamente.';
          this.resetForm();
          // Notificar a otros servicios de movimientos si es necesario
          this.movimientosService.refreshCounts();
          this.movimientosService.getEntradasList();
        },
        error: err => {
          console.error('Error al registrar la entrada:', err);
          this.errorMessage = err.error?.message || '❌ Error al registrar la entrada.';
        },
        complete: () => this.saving = false
      });
  }

  private resetForm(): void {
    this.entradaForm.reset();
    // Restaurar valores por defecto/usuario
    if (this.currentUser?.id) {
        this.entradaForm.patchValue({ user_id: this.currentUser.id });
    }
    this.showForm = false;
    this.productoSeleccionado = null;
    this.esLotePrincipal = false;
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.warningMessage = '';
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    this.clearMessages();
  }

  private preLlenarDesdeBarcode(productId: number): void {
    const producto = this.productos.find(p => p.id === productId);

    if (producto) {
      if (!this.showForm) {
        this.showForm = true;
      }

      this.entradaForm.patchValue({
        product_id: producto.id,
        unit: producto.unit_measurement || '',
        lot: producto.batch || ''
      });

      this.onProductoChange();
      this.successMessage = `✅ Producto "${producto.name}" cargado desde código de barras. Completa los campos restantes.`;
    }
  }

  toggleScanner(): void {
    this.mostrarScanner = !this.mostrarScanner;
    this.codigoBarrasInput = '';
    this.clearMessages();

    if (!this.mostrarScanner) {
      this.stopScanning();
    }
  }

  tieneCodigoValido(): boolean {
    return !!(this.codigoBarrasInput && this.codigoBarrasInput.trim().length > 0);
  }

  onCodigoInputChange(): void {
    // Cuando el usuario escribe manualmente, asegurarse de que no esté escaneando
    if (this.isScanning) {
      this.stopScanning();
    }
    // Asegurarse de que escaneando esté en false cuando el usuario escribe manualmente
    this.escaneando = false;
    // Forzar detección de cambios para actualizar el estado del botón
    this.cdr.detectChanges();
  }
  /**
 * 🧹 Asegura que solo se ingresen caracteres numéricos en el campo de código de barras manual.
 */
limpiarEntradaNumerica(): void {
  // Elimina cualquier carácter que no sea un dígito (0-9)
  const valorLimpio = this.codigoBarrasInput.replace(/\D/g, '');

  if (this.codigoBarrasInput !== valorLimpio) {
    this.codigoBarrasInput = valorLimpio;
    // La detección de cambios ya se llama en onCodigoInputChange, pero es buena práctica
    // asegurarse de que la UI se actualice si el valor cambia.
    // this.cdr.detectChanges();
  }
}


// En entrada.component.ts:
// ... (código previo)

startCameraScanning(): void {
  if (this.isScanning) {
      this.stopScanning();
      return;
  }

  if (typeof Quagga === 'undefined') {
      this.errorMessage = '❌ El escáner no está disponible. Por favor, recarga la página o usa el modo manual.';
      return;
  }

  this.mostrarScanner = true;
  this.isScanning = true;
  this.errorMessage = '';
  this.successMessage = '📷 Iniciando escáner... Apunta al centro.';
  this.lastScannedCode = '';

  this.cdr.detectChanges();

  setTimeout(() => {
      if (!this.scannerContainer?.nativeElement) {
          this.errorMessage = '❌ Error: contenedor del escáner no encontrado.';
          this.isScanning = false;
          this.cdr.detectChanges();
          return;
      }

      try {
          Quagga.stop();
      } catch (e) {
          // Ignorar errores si no hay instancia previa
      }

      this.successMessage = '📷 Escaneando... Apunta la cámara al código de barras';

      Quagga.init({
          inputStream: {
              name: 'Live',
              type: 'LiveStream',
              target: this.scannerContainer.nativeElement,
              constraints: {
                  // OPTIMIZACIÓN 1: Resolución fija más baja para mejorar FPS/velocidad
                  width: { ideal: 640 },
                  height: { ideal: 480 },
                  facingMode: 'environment',
                  // Intento de forzar el zoom/enfoque (solo funciona en algunos dispositivos)
                  advanced: [
                      { torch: true },
                      { focusMode: 'continuous' }
                  ]
              },
              // OPTIMIZACIÓN 2: Centrar aún más el área de detección (opcional: '25%')
              area: {
                  top: '25%',
                  right: '25%',
                  left: '25%',
                  bottom: '25%'
              }
          },
          locator: {
              patchSize: 'medium', // Tolerancia media a la perspectiva
              halfSample: false,   // Mejor calidad de imagen para decodificación
              // Umbral de contraste. 0.1 a 0.2 es usualmente bueno.
              threshold: 0.15
          },
          // OPTIMIZACIÓN 3: Usar un Web Worker para procesamiento en segundo plano
          numOfWorkers: 1,
          decoder: {
              readers: [
                  'code_128_reader',
                  'ean_reader', // EAN-13
                  'ean_8_reader',
                  'upc_reader', // UPC-A
                  'upc_e_reader',
                  'code_39_reader',
                  'i2of5_reader'
              ],
              // Forzar la longitud mínima del código, 8 ya filtra códigos muy cortos
              min_pattern_length: 8,
              supplementary: true
          },
          locate: true,
          // OPTIMIZACIÓN 4: Aumentar la frecuencia de intentos de decodificación
          frequency: 15
      }, (err: any) => {
          if (err) {
              console.error('Error inicializando QuaggaJS:', err);
              this.errorMessage = '❌ Error al iniciar el escáner. Verifica los permisos de la cámara.';
              this.isScanning = false;
              this.cdr.detectChanges();
              return;
          }

          Quagga.start();

          // Opcional: Para ver los cuadros de detección
          Quagga.onProcessed((result: any) => {
              const drawingCtx = Quagga.canvas.ctx.overlay;
              const drawingCanvas = Quagga.canvas.dom.overlay;
              drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
              if (result.box) {
                  Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { color: 'blue', lineWidth: 2 });
              }
              if (result.codeResult && result.line) {
                  Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { color: 'red', lineWidth: 3 });
              }
          });

          Quagga.onDetected((result: any) => {
              try {
                  if (!result || !result.codeResult) {
                      return;
                  }

                  const code = String(result.codeResult.code || '').trim();
                  const confidence = result.codeResult.verification || 0;

                  // FILTRO DE CONFIANZA Y LONGITUD (CORRECCIÓN CLAVE)
                  // Si la confianza es baja (por debajo de 90%) o el código es demasiado corto, lo ignoramos.
                  if (confidence < 0.9 || code.length < 8) {
                      // console.warn('Código ignorado (baja confianza/longitud):', code, 'Confianza:', confidence);
                      return;
                  }

                  if (code === this.lastScannedCode) {
                      return;
                  }

                  this.lastScannedCode = code;
                  this.stopScanning();

                  this.codigoBarrasInput = code;
                  this.buscarProductoPorCodigo();
                  this.cdr.detectChanges();
              } catch (error) {
                  console.error('❌ Error en onDetected:', error);
              }
          });
      });
  }, 100);
}

  stopScanning(): void {
    if (this.isScanning && typeof Quagga !== 'undefined') {
      try {
        // Asegurarse de limpiar los event handlers antes de detener
        Quagga.offDetected();
        Quagga.offProcessed();
        Quagga.stop();
      } catch (error) {
        console.error('Error deteniendo QuaggaJS:', error);
      }
      this.isScanning = false;
      this.successMessage = '';
    }
  }

  buscarProductoPorCodigo(): void {
    // Verificar que haya un código válido
    if (!this.codigoBarrasInput || !this.codigoBarrasInput.trim()) {
      this.warningMessage = '⚠️ Ingrese un código de barras.';
      this.escaneando = false;
      return;
    }

    const codigo = this.codigoBarrasInput.trim();
    if (!codigo || codigo.length === 0) {
      this.warningMessage = '⚠️ Ingrese un código de barras válido.';
      this.escaneando = false;
      return;
    }

    // Si ya está buscando, no hacer nada
    if (this.escaneando) {
      return;
    }

    this.escaneando = true;
    this.clearMessages();
    this.cdr.detectChanges();

    this.productosService.buscarPorCodigoBarras(codigo).subscribe({
      next: (producto) => {
        this.escaneando = false;
        this.cdr.detectChanges();

        if (!producto) {
          this.errorMessage = `❌ No se encontró ningún producto con el código "${codigo}". Verifique el código o regístrelo en el catálogo primero.`;
          this.codigoBarrasInput = '';
          this.cdr.detectChanges();
          return;
        }

        if (!this.showForm) {
          this.showForm = true;
        }

        // Obtener el nombre completo de la unidad de medida (usando el servicio UnitsService de forma síncrona si es posible)
        let nombreUnidad = producto.unit_measurement || '';
        if (nombreUnidad && this.unitsService.getUnitsSync) {
          try {
             const unidades = this.unitsService.getUnitsSync();
             const unidadEncontrada = unidades.find((u: any) =>
               u.abbreviation?.toLowerCase() === nombreUnidad.toLowerCase() ||
               u.name.toLowerCase() === nombreUnidad.toLowerCase()
             );
             if (unidadEncontrada) {
               nombreUnidad = unidadEncontrada.name; // Usar el nombre completo
             }
          } catch (e) {
            console.warn('Error al obtener unidades de forma síncrona, usando el valor crudo.', e);
          }
        }

        // Autocompletar campos del producto desde el catálogo
        this.entradaForm.patchValue({
          product_id: producto.id,
          unit: nombreUnidad,
          lot: producto.batch || ''
        });

        // Disparar el evento de cambio de producto
        this.onProductoChange();

        this.successMessage = `✅ Producto "${producto.name}" encontrado y cargado. Completa los campos restantes.`;
        this.codigoBarrasInput = '';
        this.mostrarScanner = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.escaneando = false;
        this.errorMessage = `❌ Error al buscar el producto. Intente nuevamente.`;
        this.codigoBarrasInput = '';
        this.cdr.detectChanges();
      },
      complete: () => {
        // Asegurarse de que escaneando se resetee
        if (this.escaneando) {
          this.escaneando = false;
          this.cdr.detectChanges();
        }
      }
    });
  }
}

