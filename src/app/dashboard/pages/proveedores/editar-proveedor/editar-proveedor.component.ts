import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuppliersService } from '../../../../services/proveedores/suppliers.service';
import { Proveedor } from '../../../../interfaces/producto';

@Component({
  selector: 'app-editar-proveedor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-proveedor.component.html',
  styleUrls: ['./editar-proveedor.component.css']
})
export class EditarProveedorComponent {
  @Input() proveedor!: Proveedor; // ✅ cambiar Supplier -> Proveedor
  @Output() cancelar = new EventEmitter<void>();
  @Output() proveedorActualizado = new EventEmitter<Proveedor>(); // ✅ cambiar Supplier -> Proveedor

  form: Partial<Proveedor> = {}; // ✅ cambiar Supplier -> Proveedor

  constructor(private suppliersService: SuppliersService) {}

  ngOnChanges() {
    if (this.proveedor) {
      this.form = {
        name: this.proveedor.name,
        email: this.proveedor.email,
        phone: this.proveedor.phone,
        address: this.proveedor.address
      };
    }
  }

  guardarCambios() {
    if (!this.proveedor || !this.proveedor.id) return;

    this.suppliersService.update(this.proveedor.id, this.form).subscribe({
      next: (proveedorActualizado: Proveedor) => { // ✅ cambiar Supplier -> Proveedor
        this.proveedorActualizado.emit(proveedorActualizado);
        this.cancelar.emit();
      },
      error: (err: any) => console.error('Error actualizando proveedor', err)
    });
  }

  cancelarEdicion(): void {
    this.cancelar.emit();
  }
}
