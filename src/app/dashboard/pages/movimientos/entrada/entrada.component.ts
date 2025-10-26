import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { WarehousesService } from '../../../../services/almacenes/warehouses.service';
import { MovimientosService } from '../../../../services/movimientos/movimientos';

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
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './entrada.component.html',
  styleUrls: ['./entrada.component.css']
})
export class EntradaComponent implements OnInit, OnDestroy {
  entradaForm!: FormGroup;
  warehouseForm!: FormGroup;
  showForm = false;
  showWarehouseForm = false;
  saving = false;
  successMessage = '';
  errorMessage = '';
  warningMessage = '';

  currentUser: any;
  productos: any[] = [];
  proveedores: any[] = [];
  usuarios: any[] = [];
  warehouses: any[] = [];

  private apiUrl = 'http://localhost:8000/api';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private warehouseService: WarehousesService,
    private movimientosService: MovimientosService
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadFormData();
    this.loadCurrentUser();
    this.loadWarehouses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Inicializar formularios **/
  private initForms(): void {
    this.entradaForm = this.fb.group({
      product_id: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      unit: [''],
      lot: [''],
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

  /** Cargar almacenes **/
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

  /** Crear almacén nuevo **/
  crearWarehouse(): void {
  if (this.warehouseForm.invalid) return;

  const payload = {
    ...this.warehouseForm.value,
    capacity: String(this.warehouseForm.value.capacity) // fuerza string
  };

  this.warehouseService.createWarehouse(payload)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: res => {
        alert('✅ Almacén creado correctamente');
        this.showWarehouseForm = false;
        this.warehouseForm.reset();
        this.loadWarehouses(); // recarga select
      },
      error: err => console.error('❌ Error creando almacén', err)
    });
}


  toggleWarehouseForm(): void {
    this.showWarehouseForm = !this.showWarehouseForm;
  }

  /** Cargar usuario actual **/
  private loadCurrentUser(): void {
    const headers = this.getAuthHeaders();
    this.http.get<any>('http://smart_inventory/api/user', { headers })
      .subscribe({
        next: res => {
          this.currentUser = res;
          if (res?.id) this.entradaForm.patchValue({ user_id: res.id });
        },
        error: err => console.error('Error cargando usuario', err)
      });
  }

  /** Cargar productos y proveedores **/
  private loadFormData(): void {
    const headers = this.getAuthHeaders();
    this.http.get<FormDataResponse>(`${this.apiUrl}/entries/form-data`, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.productos = res.productos || [];
          this.proveedores = res.proveedores || [];
          this.usuarios = res.usuarios || [];
        },
        error: err => {
          console.error('Error cargando datos del formulario', err);
          this.errorMessage = 'Error al cargar productos y proveedores.';
        }
      });
  }

  /** Enviar entrada **/
  onSubmit() {
  if (this.entradaForm.invalid) {
    this.warningMessage = '⚠️ Por favor completa todos los campos obligatorios.';
    return;
  }

  this.saving = true;
  this.clearMessages();
  const headers = this.getAuthHeaders();

  this.http.post(`${this.apiUrl}/entries`, this.entradaForm.value, { headers })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: res => {
        this.successMessage = '✅ Entrada creada correctamente.';
        this.resetForm();
        // Refrescar datos de movimientos automáticamente
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


  /** Helpers **/
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


}
