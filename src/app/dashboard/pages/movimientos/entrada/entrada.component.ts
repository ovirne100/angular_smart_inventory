import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { WarehousesService } from '../../../../services/almacenes/warehouses.service';
import { MovimientosService } from '../../../../services/movimientos/movimientos';
import { AlertsService } from '../../../../services/alertas/alerts.service';
import { ProductosService } from '../../../../services/productos/products.service';
import { UnitsService } from '../../../../services/units/units.service';

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
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
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
      this.entradaForm.patchValue({ expiration_date: '' });
    }
  }

  onSubmit(): void {
    if (this.entradaForm.invalid) {
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
      delete formValue.expiration_date;
    } else if (formValue.expiration_date) {
      const fecha = formValue.expiration_date;
      if (fecha.includes('-') && fecha.length === 10) {
        formValue.expiration_date = `${fecha} 00:00:00`;
      }
    }

    this.saving = true;
    this.clearMessages();
    const headers = this.getAuthHeaders();

    this.http.post(`${this.apiUrl}/entries`, formValue, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.successMessage = '✅ Entrada creada correctamente.';
          this.resetForm();
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
    this.showForm = false;
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

    // Esperar a que el DOM se actualice y el contenedor esté disponible
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
            top: '10%',
            right: '10%',
            left: '10%',
            bottom: '10%'
          }
        },
        locator: {
          patchSize: 'medium',
          halfSample: true
        },
        numOfWorkers: 4,
        decoder: {
          readers: [
            'ean_reader',
            'ean_8_reader',
            'code_128_reader',
            'code_39_reader',
            'upc_reader',
            'upc_e_reader',
            'i2of5_reader'
          ],
          debug: {
            drawBoundingBox: true,
            showFrequency: false,
            drawScanline: true,
            showPattern: false
          }
        },
        locate: true,
        frequency: 10
      }, (err: any) => {
        if (err) {
          console.error('Error inicializando QuaggaJS:', err);
          this.errorMessage = '❌ Error al iniciar el escáner. Verifica los permisos de la cámara.';
          this.isScanning = false;
          return;
        }

        this.successMessage = '📷 Escaneando... Apunta la cámara al código de barras';

        Quagga.start();

        // Detección simplificada - acepta el código en la primera lectura válida
        const detectHandler = (result: any) => {
          try {
            if (!result || !result.codeResult) {
              return;
            }

            const code = String(result.codeResult.code || '').trim();

            if (!code || code.length < 3) {
              return;
            }

            // Ignorar códigos muy cortos (menos de 8 caracteres) que pueden ser lecturas parciales
            if (code.length < 8) {
              return;
            }

            // Ignorar si es el mismo código que ya se escaneó
            if (code === this.lastScannedCode) {
              return;
            }


            // Aceptar inmediatamente el código escaneado
            this.lastScannedCode = code;
            Quagga.offDetected(detectHandler);
            this.stopScanning();

            // Asignar el código y buscar
            setTimeout(() => {
              this.codigoBarrasInput = code;
              this.buscarProductoPorCodigo();
            }, 300);
          } catch (error) {
            console.error('❌ Error en detectHandler:', error);
          }
        };

        Quagga.onDetected(detectHandler);
      });
    }, 300);
  }

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

        // Obtener el nombre completo de la unidad de medida
        let nombreUnidad = producto.unit_measurement || '';
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
        // Asegurarse de que escaneando se resetee incluso si hay algún problema
        if (this.escaneando) {
          this.escaneando = false;
          this.cdr.detectChanges();
        }
      }
    });
  }
}

