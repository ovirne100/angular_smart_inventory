import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductSupplierService, ProductSupplier } from '../../../services/product-supplier/product-supplier.service';
import { ProductosService } from '../../../services/productos/products.service';
import { SuppliersService, Supplier } from '../../../services/proveedores/suppliers.service';
import { Producto } from '../../../interfaces/producto';

@Component({
  selector: 'app-product-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-suppliers.component.html',
  styleUrls: ['./product-suppliers.component.css']
})
export class ProductSuppliersComponent implements OnInit {
  relationships: ProductSupplier[] = [];
  products: Producto[] = [];
  suppliers: Supplier[] = [];

  // Form data
  form: Partial<ProductSupplier> = {
    supplier_id: 0,
    product_id: 0,
    unit_cost: null,
    supplier_reference: ''
  };

  editingId?: number;

  constructor(
    private productSupplierService: ProductSupplierService,
    private productosService: ProductosService,
    private suppliersService: SuppliersService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    // Cargar relaciones
    this.productSupplierService.getRelationships().subscribe({
      next: (rels) => this.relationships = rels,
      error: (err) => console.error('Error cargando relaciones', err)
    });

    // Cargar productos
    this.productosService.getProducts().subscribe({
      next: (products: Producto[]) => this.products = products,
      error: (err: any) => console.error('Error cargando productos', err)
    });

    // Cargar proveedores
    this.suppliersService.list().subscribe({
      next: (res: any) => this.suppliers = res.data ?? res,
      error: (err) => console.error('Error cargando proveedores', err)
    });
  }

  submit(): void {
    if (this.editingId) {
      this.productSupplierService.updateRelationship(this.editingId, this.form).subscribe({
        next: () => {
          this.resetForm();
          this.loadData();
        },
        error: (err) => console.error('Error actualizando relación', err)
      });
    } else {
      this.productSupplierService.createRelationship(this.form).subscribe({
        next: () => {
          this.resetForm();
          this.loadData();
        },
        error: (err) => console.error('Error creando relación', err)
      });
    }
  }

  edit(relationship: ProductSupplier): void {
    this.form = {
      supplier_id: relationship.supplier_id,
      product_id: relationship.product_id,
      unit_cost: relationship.unit_cost,
      supplier_reference: relationship.supplier_reference
    };
    this.editingId = relationship.id;
  }

 /* delete(id: number): void {
    if (confirm('¿Eliminar esta relación?')) {
      this.productSupplierService.deleteRelationship(id).subscribe({
        next: () => this.loadData(),
        error: (err) => console.error('Error eliminando relación', err)
      });
    }
  }*/
deleteRelationship(rel: any): void {
  console.log('🟢 Click detectado', rel);

  const supplier_id = rel.supplier_id;
  const product_id = rel.product_id;

  if (!supplier_id || !product_id) {
    console.warn('⚠️ Faltan IDs', rel);
    return;
  }

  this.suppliersService.detachProduct({ supplier_id, product_id }).subscribe({
    next: (res: any) => {
      console.log('✅ Eliminado correctamente', res);
      this.loadData();
    },
    error: (err) => console.error('❌ Error eliminando relación', err)
  });
}

  resetForm(): void {
    this.form = {
      supplier_id: 0,
      product_id: 0,
      unit_cost: null,
      supplier_reference: ''
    };
    this.editingId = undefined;
  }

  getProductName(id: number): string {
    const product = this.products.find(p => p.id === id);
    return product ? product.name : 'N/A';
  }

  getSupplierName(id: number): string {
    const supplier = this.suppliers.find(s => s.supplier_id === id);
    return supplier ? supplier.name : 'N/A';
  }

  
}
