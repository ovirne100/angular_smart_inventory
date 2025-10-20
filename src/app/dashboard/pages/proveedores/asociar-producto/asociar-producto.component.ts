import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Producto } from '../../../../interfaces/producto';
import { SuppliersService } from '../../../../services/proveedores/suppliers.service';

@Component({
  selector: 'app-asociar-producto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asociar-producto.component.html',
  styleUrls: ['./asociar-producto.component.css']
})
export class AsociarProductoComponent implements OnChanges {
  @Input() proveedor!: any | null;
  @Input() productos: Producto[] | any = [];

  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  constructor(private suppliersService: SuppliersService) {}

  nuevoProducto = {
    product_id: null,
    unit_cost: null,
    supplier_reference: ''
  };

  ngOnChanges(changes: SimpleChanges): void {
    // Si el backend devuelve { data: [...] }
    if (this.productos && this.productos.data) {
      this.productos = this.productos.data as Producto[];
    }
  }


  guardarProducto() {
    if (!this.proveedor) {
      console.error("Proveedor no definido");
      return;
    }

    const payload = {
      supplier_id: this.proveedor.supplier_id,
      product_id: Number(this.nuevoProducto.product_id),
      unit_cost: this.nuevoProducto.unit_cost,
      supplier_reference: this.nuevoProducto.supplier_reference
    };

    console.log("Payload listo para enviar:", payload);
    this.guardar.emit(payload);
  }

}
