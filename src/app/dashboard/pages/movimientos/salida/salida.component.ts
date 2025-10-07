import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-salida',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './salida.component.html',
  styleUrls: ['./salida.component.css']
})
export class SalidaComponent implements OnInit {
  salidaForm!: FormGroup;
  productos: any[] = [];
  usuarios: any[] = [];
  mensaje = '';
  tipoMensaje = '';
  mostrarFormulario = false; // 👈 formulario oculto por defecto

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit() {
    this.salidaForm = this.fb.group({
      product_id: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      unit: [''],
      lot: ['', Validators.required],
      user_id: ['', Validators.required],
      inventory_id: ['', Validators.required],
    });

    this.cargarDatos();
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario; // 👈 alterna visibilidad
  }

  cargarDatos() {
    this.http.get('http://localhost:8000/api/outputs/form-data').subscribe({
      next: (data: any) => {
        this.productos = data.productos || [];
        this.usuarios = data.usuarios || [];
      },
      error: () => {
        this.mensaje = 'Error al cargar productos y usuarios';
        this.tipoMensaje = 'error';
      }
    });
  }

  registrarSalida() {
    if (this.salidaForm.invalid) return;

    this.http.post('http://localhost:8000/api/outputs', this.salidaForm.value).subscribe({
      next: (res: any) => {
        this.mensaje = res.message || 'Salida registrada correctamente';
        this.tipoMensaje = 'success';
        this.salidaForm.reset();
      },
      error: (err) => {
        this.mensaje = err.error?.message || 'Error al registrar la salida';
        this.tipoMensaje = 'error';
      }
    });
  }
}
