import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Producto } from '../../interfaces/producto';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ver-mas-producto',
  imports: [CommonModule],
  templateUrl: './ver-mas-producto.component.html',
  styleUrls: ['./ver-mas-producto.component.css']
})
export class VerMasProductoComponent {
  @Input() producto!: Producto;
  @Output() cerrar = new EventEmitter<void>();

  cerrarModal() {
    this.cerrar.emit();
  }
}
