
/*
import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductosService } from '../../services/productos/products.service';
import { CategoriesService, Category } from '../../services/categories/categories.service';

@Component({
  selector: 'app-crear-producto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-producto.component.html',
  styleUrls: ['./crear-producto.component.css']
})
export class CrearProductoComponent implements OnInit {
  @Output() cancelar = new EventEmitter<void>();
  @Output() productoCreado = new EventEmitter<void>();

  categorias: Category[] = [];
  categoriasFiltradas: Category[] = [];
  categoriaSeleccionada: Category | null = null;
  mostrarDropdown = false;

  constructor(
    private productosService: ProductosService,
    private categoriesService: CategoriesService
  ) {}

  ngOnInit() {
    // Cargar categorías desde el servicio
    this.categorias = this.categoriesService.getFrontendCategories();

    // Opcional: Sincronizar con el backend al inicializar
    this.initializeCategories();
  }


  private initializeCategories() {
    // Intentar sincronizar las categorías con el backend
    this.categoriesService.initializeCategories().subscribe({
      next: (response) => {
        if (response.success) {
          console.log('✅ Categorías sincronizadas con el backend:', response);
        } else {
          console.log('ℹ️ Sincronización no exitosa, usando categorías locales:', response.message);
        }
      },
      error: (err) => {
        console.warn('⚠️ No se pudo sincronizar las categorías:', err);
        // No es crítico, las categorías del frontend funcionarán igual
      }
    });
  }

  // Métodos para manejar las categorías
  filtrarCategorias(event: any) {
    const termino = event.target.value.toLowerCase();
    this.mostrarDropdown = termino.length > 0;

    if (termino.length === 0) {
      this.categoriasFiltradas = [];
      return;
    }

    this.categoriasFiltradas = this.categorias.filter(categoria =>
      categoria.name.toLowerCase().includes(termino) ||
      categoria.id.toString().includes(termino)
    );
  }

  seleccionarCategoria(categoria: Category) {
    this.categoriaSeleccionada = categoria;
    this.mostrarDropdown = false;
    this.categoriasFiltradas = [];
  }

  limpiarCategoria() {
    this.categoriaSeleccionada = null;
  }

  guardarProducto(form: NgForm) {
    if (!form.valid) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    // Convertir la fecha a formato datetime para DB
 let fechaDatetime: string | null = null;

if (form.value.expiration_date) {
  const fecha = form.value.expiration_date;

  // Si viene en formato dd/mm/yyyy
  if (fecha.includes('/')) {
    const partes = fecha.split('/');
    fechaDatetime = `${partes[2]}-${partes[1]}-${partes[0]} 00:00:00`;
  } else {
    // Si ya viene en formato yyyy-mm-dd
    fechaDatetime = `${fecha} 00:00:00`;
  }
}

    // Objeto con nombres exactos del modelo
   const nuevoProducto = {
  name: form.value.name,
  category_id: form.value.category_id,
  reference: form.value.reference,
  unit_measurement: form.value.unit,
  batch: form.value.batch,
  expiration_date: fechaDatetime
};


    // Recuperar token (ejemplo: de localStorage)
    const token = localStorage.getItem('token'); // Ajusta según tu método de login

    this.productosService.crearProducto(nuevoProducto).subscribe({
      next: (res) => {
        console.log('✅ Producto guardado:', res);
        alert('Producto creado con éxito');
        form.resetForm();
        this.productoCreado.emit(); // 👈 Emite evento para actualizar la lista
        this.cancelar.emit(); // 👈 vuelve a la pantalla principal de productos
      },
      error: (err) => {
        console.error('❌ Error al guardar producto:', err.error);
        alert('Error al guardar el producto: ' + (err.error.message || 'Ver consola'));
      }
    });
  }

  cancelarCreacion() {
    this.cancelar.emit();
  }
}


/*
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductosService } from '../../../services/productos/products.service';
import { Producto } from '../../../interfaces/producto';


@Component({
  selector: 'app-crear-producto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-producto.component.html',
  styleUrls: ['./crear-producto.component.css']
})
export class CrearProductoComponent {
  @Output() cancelar = new EventEmitter<void>();

  constructor(private productosService: ProductosService) {}

  guardarProducto(form: NgForm) {
    if (!form.valid) return;

    const nuevoProducto: Producto = {
      nombre: form.value.nombre,
      cantidad: form.value.cantidad,
      unidad: form.value.unidad || '',
      lote: form.value.lote || '',
      categoria: form.value.categoria || '',
      fechaVencimiento: form.value.fechavencimiento,
      icono1: 'fas fa-box',
      icono2: 'fas fa-box',
      icono3: 'fas fa-box'
    };

    this.productosService.crearProducto(nuevoProducto).subscribe({
      next: (res) => {
        console.log('Producto creado', res);
        this.cancelarCreacion();
      },
      error: (err) => console.error('Error al crear producto', err)
    });
  }

  cancelarCreacion() {
    this.cancelar.emit();
  }
}
*/


// crear-producto.component.ts
import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductosService } from '../../services/productos/products.service';
import { CategoriesService, Category } from '../../services/categories/categories.service';

@Component({
  selector: 'app-crear-producto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-producto.component.html',
  styleUrls: ['./crear-producto.component.css']
})
export class CrearProductoComponent implements OnInit {
  @Output() cancelar = new EventEmitter<void>();
  @Output() productoCreado = new EventEmitter<void>();

  categorias: Category[] = [];
  categoriasFiltradas: Category[] = [];
  categoriaSeleccionada: Category | null = null;
  mostrarDropdown = false;

  selectedFile: File | null = null;   // Archivo seleccionado
  previewImage: string | ArrayBuffer | null = null; // Preview de imagen

  constructor(
    private productosService: ProductosService,
    private categoriesService: CategoriesService
  ) {}

  ngOnInit() {
    // Cargar categorías del frontend
    this.categorias = this.categoriesService.getFrontendCategories();
    this.initializeCategories();
  }

  private initializeCategories() {
    this.categoriesService.initializeCategories().subscribe({
      next: (response) => {
        if (response.success) {
          console.log('✅ Categorías sincronizadas con el backend:', response);
        }
      },
      error: (err) => {
        console.warn('⚠️ No se pudo sincronizar las categorías:', err);
      }
    });
  }

  // ====================
  // Categorías
  // ====================
  filtrarCategorias(event: any) {
    const termino = event.target.value.toLowerCase();
    this.mostrarDropdown = termino.length > 0;
    if (termino.length === 0) {
      this.categoriasFiltradas = [];
      return;
    }
    this.categoriasFiltradas = this.categorias.filter(c =>
      c.name.toLowerCase().includes(termino) || c.id.toString().includes(termino)
    );
  }

  seleccionarCategoria(categoria: Category) {
    this.categoriaSeleccionada = categoria;
    this.mostrarDropdown = false;
    this.categoriasFiltradas = [];
  }

  limpiarCategoria() {
    this.categoriaSeleccionada = null;
  }

  // ====================
  // Imagen
  // ====================
  onFileSelected(event: any) {
    if (event.target.files && event.target.files[0]) {
      this.selectedFile = event.target.files[0];

      // Preview de imagen
      const reader = new FileReader();
      reader.onload = e => this.previewImage = reader.result;
      if (this.selectedFile) {
        reader.readAsDataURL(this.selectedFile);
      }
    }
  }

  // ====================
  // Guardar Producto
  // ====================
  guardarProducto(form: NgForm) {
    if (!form.valid) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    // Convertir fecha
    let fechaDatetime: string | null = null;
    if (form.value.expiration_date) {
      const fecha = form.value.expiration_date;
      if (fecha.includes('/')) {
        const partes = fecha.split('/');
        fechaDatetime = `${partes[2]}-${partes[1]}-${partes[0]} 00:00:00`;
      } else {
        fechaDatetime = `${fecha} 00:00:00`;
      }
    }

    // FormData para enviar imagen + datos
    const formData = new FormData();
    formData.append('name', form.value.name);
    formData.append('category_id', String(this.categoriaSeleccionada?.id ?? ''));
    formData.append('reference', form.value.reference || '');
    formData.append('unit_measurement', form.value.unit || '');
    formData.append('batch', form.value.batch || '');
    if (fechaDatetime) formData.append('expiration_date', fechaDatetime);

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.productosService.crearProducto(formData as any).subscribe({
      next: (res) => {
        console.log('✅ Producto guardado:', res);
        alert('Producto creado con éxito');
        form.resetForm();
        this.selectedFile = null;
        this.previewImage = null;
        this.categoriaSeleccionada = null;
        this.productoCreado.emit();
        this.cancelar.emit();
      },
      error: (err) => {
        console.error('❌ Error al guardar producto:', err.error);
        alert('Error al guardar el producto: ' + (err.error.message || 'Ver consola'));
      }
    });
  }

  cancelarCreacion() {
    this.cancelar.emit();
  }
}


