import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuppliersService } from '../../../../services/proveedores/suppliers.service';
import { Proveedor } from '../../../../interfaces/producto';

@Component({
  selector: 'app-crear-proveedor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-proveedor.component.html',
  styleUrls: ['./crear-proveedor.component.css']
})
export class CrearProveedorComponent {
  @Output() cancelar = new EventEmitter<void>();
  @Output() proveedorCreado = new EventEmitter<Proveedor>();

  form: Partial<Proveedor> = {
    name: '',
    email: '',
    phone: '',
    address: ''
  };

  constructor(private suppliersService: SuppliersService) {}

  guardarCambios() {
    if (!this.form.name) return;

    this.suppliersService.create(this.form).subscribe({
      next: (proveedor) => {
        this.proveedorCreado.emit(proveedor);
        this.cancelar.emit();
      },
      error: (err) => console.error('Error creando proveedor', err)
    });
  }

  cancelarCreacion() {
    this.cancelar.emit();
  }
}
