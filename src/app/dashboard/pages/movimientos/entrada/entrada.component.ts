import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-entrada',
  imports:[CommonModule, ReactiveFormsModule],
  standalone: true,
  templateUrl: './entrada.component.html',
  styleUrls: ['./entrada.component.css']
})
export class EntradaComponent implements OnInit {
  entradaForm!: FormGroup;
  showForm = false;
  saving = false;
  successMessage = '';
  errorMessage = '';
  warningMessage = '';

  productos: any[] = [];
  usuarios: any[] = [];
  proveedores: any[] = [];

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.initForm();
    this.loadFormData();
  }

  initForm() {
    this.entradaForm = this.fb.group({
      product_id: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      unit: [''],
      lot: [''],
      supplier_id: ['', Validators.required],
      user_id: ['', Validators.required],
      inventory_id: ['', Validators.required]
    });
  }

  toggleForm() {
    this.showForm = !this.showForm;
    this.successMessage = '';
    this.errorMessage = '';
    this.warningMessage = '';
  }

  loadFormData() {
    this.http.get<any>('http://localhost:8000/api/entries/form-data').subscribe({
      next: (res) => {
        this.productos = res.productos || [];
        this.usuarios = res.usuarios || [];
        this.proveedores = res.proveedores || [];
      },
      error: (err) => {
        console.error('Error cargando datos del formulario', err);
      }
    });
  }

  onSubmit() {
    if (this.entradaForm.invalid) {
      this.warningMessage = '⚠️ Por favor completa todos los campos obligatorios.';
      return;
    }

    this.saving = true;
    this.http.post('http://localhost:8000/api/entries', this.entradaForm.value).subscribe({
      next: (res: any) => {
        this.successMessage = res.message || '✅ Entrada creada correctamente.';
        this.entradaForm.reset();
        this.showForm = false;
      },
      error: (err) => {
        this.errorMessage = '❌ Error al registrar la entrada.';
        console.error(err);
      },
      complete: () => {
        this.saving = false;
      }
    });
  }
}
