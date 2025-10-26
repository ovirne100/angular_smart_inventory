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

  @Output() asociado = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  nuevoProducto = {
    product_id: null as number | null,
    unit_cost: null as number | null,
    supplier_reference: '',
    batch: ''
  };

  constructor(private suppliersService: SuppliersService) {}

 ngOnChanges(changes: SimpleChanges): void {
  if (this.productos) {
    // Aseguramos que siempre sea un array
    this.productos = Array.isArray(this.productos) ? this.productos : this.productos.data;
  }
}


  onProductoSeleccionado(): void {
    const productoSeleccionado = this.productos.find(
      (p: any) => p.id === this.nuevoProducto.product_id
    );

    if (productoSeleccionado) {
      this.nuevoProducto.supplier_reference = productoSeleccionado.reference || '';
      this.nuevoProducto.batch = productoSeleccionado.batch || '';
    } else {
      this.nuevoProducto.supplier_reference = '';
      this.nuevoProducto.batch = '';
    }
  }

 guardarProducto() {
  if (!this.nuevoProducto) return;

  const productPayload = {
    product_id: Number(this.nuevoProducto.product_id),
    unit_cost: this.nuevoProducto.unit_cost,           // lo que el usuario ingresa
    supplier_reference: this.nuevoProducto.supplier_reference,  // referencia del producto
    batch: this.nuevoProducto.batch                    // batch del producto
  };

  console.log('Payload a enviar:', productPayload);

  this.suppliersService.attachProduct(this.proveedor.id, { products: [productPayload] })
    .subscribe({
      next: (res) => console.log('✅ Asociación exitosa:', res),
      error: (err) => console.error('❌ Error al asociar producto:', err)
    });
}


        

  cancelarAsociacion(): void {
    this.cancelar.emit();
  }

  private resetFormulario(): void {
    this.nuevoProducto = {
      product_id: null,
      unit_cost: null,
      supplier_reference: '',
      batch: ''
    };
  }
}
