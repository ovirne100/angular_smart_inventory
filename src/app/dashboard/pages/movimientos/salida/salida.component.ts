
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MovimientosService,Salida } from '../../../../services/movimientos/movimientos';

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

  constructor(private fb: FormBuilder, private movimientosService: MovimientosService) {}

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
    this.mostrarFormulario = !this.mostrarFormulario;
  }

  cargarDatos() {
    // ✅ Ahora se usa el servicio centralizado correctamente
    this.movimientosService.getSalidaFormData().subscribe({
      next: (data) => {
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

    const salida: Salida = this.salidaForm.value;

    // ✅ Usa el servicio centralizado
    this.movimientosService.createSalida(salida).subscribe({
      next: (res) => {
        this.mensaje = res.message || 'Salida registrada correctamente';
        this.tipoMensaje = 'success';
        this.salidaForm.reset();
        this.movimientosService.refreshOutputsCount(); // 🔄 refresca contadores
      },
      error: (err) => {
        this.mensaje = err.error?.message || 'Error al registrar la salida';
        this.tipoMensaje = 'error';
        console.error('❌ Error al registrar salida:', err);
      }
    });
  }
}
