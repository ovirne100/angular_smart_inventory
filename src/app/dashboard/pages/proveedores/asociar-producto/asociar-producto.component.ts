import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Producto } from '../../../../interfaces/producto';
import { SuppliersService } from '../../../../services/proveedores/suppliers.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-asociar-producto',
  standalone: true,
  imports: [FormsModule],
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

  constructor(
    private suppliersService: SuppliersService,
    private http: HttpClient
  ) {}

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
      // Usar código de barras en lugar de reference
      this.nuevoProducto.supplier_reference = productoSeleccionado.codigo_de_barras || productoSeleccionado.reference || '';
      
      // Si el producto tiene lote, usarlo; si no, buscar en entradas
      if (productoSeleccionado.batch || productoSeleccionado.lote) {
        this.nuevoProducto.batch = productoSeleccionado.batch || productoSeleccionado.lote || '';
      } else {
        // Buscar lote desde entradas
        this.buscarLoteDesdeEntradas(productoSeleccionado.id);
      }
    } else {
      this.nuevoProducto.supplier_reference = '';
      this.nuevoProducto.batch = '';
    }
  }

  // Buscar lote desde entradas para un producto
  private buscarLoteDesdeEntradas(productId: number): void {
    const headers = this.getAuthHeaders();
    
    this.http.get<any>(`${environment.apiUrl}/entries?product_id=${productId}`, { headers }).subscribe({
      next: (res: any) => {
        const entradas = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        
        // Buscar el primer lote válido en las entradas
        for (const entrada of entradas) {
          const lot = String(entrada.lot || entrada.lote || entrada.batch || '').trim();
          if (lot && lot !== 'SIN_LOTE') {
            this.nuevoProducto.batch = lot;
            return;
          }
        }
        
        // Si no se encontró lote, dejar vacío
        if (!this.nuevoProducto.batch) {
          this.nuevoProducto.batch = '';
        }
      },
      error: (err) => {
        console.error('Error buscando lote desde entradas:', err);
        this.nuevoProducto.batch = '';
      }
    });
  }

  // Helper para obtener headers de autenticación
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
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
