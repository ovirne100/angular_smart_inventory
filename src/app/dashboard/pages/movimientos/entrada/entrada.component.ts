import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

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
  showForm = false;
  saving = false;
  successMessage = '';
  errorMessage = '';
  warningMessage = '';

  currentUser: any;
  productos: any[] = [];
  proveedores: any[] = [];
  usuarios: any[] = [];

  private apiUrl = 'http://localhost:8000/api';
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.initForm();
    this.loadFormData();
    this.loadCurrentUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCurrentUser() {
    this.http.get<any>('http://smart_inventory/api/user', { withCredentials: true })
      .subscribe({
        next: res => {
          this.currentUser = res;
          this.entradaForm.patchValue({ user_id: this.currentUser.id });
        },
        error: err => console.error('Error cargando usuario', err)
      });
  }

  initForm() {
    this.entradaForm = this.fb.group({
      product_id: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      unit: [''],
      lot: [''],
      supplier_id: ['', Validators.required],
      ubicacion_interna: ['', Validators.required],
      min_stock: ['', [Validators.required, Validators.min(0)]],
      // NO incluir user_id, se asigna automáticamente
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

  onSubmit() {
    if (this.entradaForm.invalid) {
      this.warningMessage = '⚠️ Por favor completa todos los campos obligatorios.';
      return;
    }

    this.saving = true;
    this.clearMessages();
    const headers = this.getAuthHeaders();

    this.http.post<CreateEntryResponse>(`${this.apiUrl}/entries`, this.entradaForm.value, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.successMessage = res.message || '✅ Entrada creada correctamente.';
          this.resetForm();
          setTimeout(() => this.clearMessages(), 5000);
        },
        error: err => {
          console.error('Error al registrar la entrada:', err);
          if (err.status === 401) {
            this.errorMessage = '⚠️ No estás autenticado. Inicia sesión nuevamente.';
          } else if (err.error?.message) {
            this.errorMessage = '❌ ' + err.error.message;
          } else {
            this.errorMessage = '❌ Error al registrar la entrada.';
          }
        },
        complete: () => this.saving = false
      });
  }

  private resetForm() {
    this.entradaForm.reset({
      product_id: '',
      quantity: '',
      unit: '',
      lot: '',
      supplier_id: '',
      ubicacion_interna: '',
      min_stock: ''
    });
    this.showForm = false;
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }
}
