
import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';

import { ProductosService } from '../../services/productos/products.service';
import { CategoriesService, Category } from '../../services/categories/categories.service';
import { UnitsService, Unit } from '../../services/units/units.service';
import { Producto } from '../../interfaces/producto';


@Component({
  selector: 'app-crear-producto',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './crear-producto.component.html',
  styleUrls: ['./crear-producto.component.css']
})
export class CrearProductoComponent implements OnInit {
  @Output() cancelar = new EventEmitter<void>();
  @Output() productoCreado = new EventEmitter<Producto>();

  categorias: Category[] = [];
  categoriasFiltradas: Category[] = [];
  categoriaSeleccionada: Category | null = null;
  mostrarDropdown = false;

  unidades: Unit[] = [];
  unidadesFiltradas: Unit[] = [];
  unidadSeleccionada: Unit | null = null;
  mostrarDropdownUnidad = false;

  selectedFile: File | null = null;   // Archivo seleccionado
  previewImage: string | ArrayBuffer | null = null; // Preview de imagen

  // Modal para crear categoría
  mostrarModalCategoria = false;
  nuevaCategoriaNombre = '';
  creandoCategoria = false;

  // Modal para crear unidad
  mostrarModalUnidad = false;
  nuevaUnidadNombre = '';
  nuevaUnidadAbreviatura = '';
  creandoUnidad = false;

  constructor(
    private productosService: ProductosService,
    private categoriesService: CategoriesService,
    private unitsService: UnitsService
  ) {}

  ngOnInit() {
    this.cargarCategorias();
    this.initializeCategories();
    this.cargarUnidades();
  }

  private cargarCategorias() {
    this.categoriesService.getCategoriesSafe().subscribe((cats) => {
      this.categorias = Array.isArray(cats) ? cats : [];
    });
  }

  private initializeCategories() {
    this.categoriesService.initializeCategories().subscribe({
      next: (response) => {
        if (response.success) {
          console.log('✅ Categorías sincronizadas con el backend');
        }
      },
      error: (err) => {
        // Solo mostrar error si no es un error de conexión (status 0)
        if (err.status && err.status !== 0) {
          console.warn('⚠️ No se pudo sincronizar las categorías:', err.status);
        }
      }
    });
  }

  // ====================
  // Unidades de Medida
  // ====================
  private cargarUnidades() {
    this.unitsService.getUnits().subscribe((units) => {
      this.unidades = Array.isArray(units) ? units : [];
    });
  }

  filtrarUnidades(event: any) {
    const termino = (event?.target?.value || '').trim();
    if (termino.length === 0) {
      this.unidadesFiltradas = [];
      this.mostrarDropdownUnidad = true; // Mostrar todas las unidades cuando no hay búsqueda
      return;
    }
    this.mostrarDropdownUnidad = true;
    this.unidadesFiltradas = this.unitsService.searchUnits(termino);
  }

  onFocusUnidad() {
    // Mostrar todas las unidades cuando se hace focus
    if (!this.unidadSeleccionada) {
      this.mostrarDropdownUnidad = true;
    }
  }

  onBlurUnidad() {
    // Ocultar dropdown después de un pequeño delay para permitir clicks
    setTimeout(() => {
      this.mostrarDropdownUnidad = false;
    }, 200);
  }

  seleccionarUnidad(unidad: Unit) {
    this.unidadSeleccionada = unidad;
    this.mostrarDropdownUnidad = false;
    this.unidadesFiltradas = [];
    // Limpiar el input de búsqueda
    const input = document.getElementById('unit_search') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  limpiarUnidad() {
    this.unidadSeleccionada = null;
    // Limpiar el input de búsqueda
    const input = document.getElementById('unit_search') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  crearUnidadRapida() {
    this.nuevaUnidadNombre = '';
    this.nuevaUnidadAbreviatura = '';
    this.mostrarModalUnidad = true;
  }

  cerrarModalUnidad() {
    this.mostrarModalUnidad = false;
    this.nuevaUnidadNombre = '';
    this.nuevaUnidadAbreviatura = '';
    this.creandoUnidad = false;
  }

  guardarNuevaUnidad() {
    const nombre = this.nuevaUnidadNombre.trim();
    if (!nombre) {
      alert('Por favor ingresa un nombre para la unidad de medida');
      return;
    }

    // Verificar si ya existe una unidad con ese nombre
    const existe = this.unidades.some(u =>
      u.name.toLowerCase() === nombre.toLowerCase() ||
      u.abbreviation?.toLowerCase() === (this.nuevaUnidadAbreviatura || nombre).trim().toLowerCase()
    );
    if (existe) {
      alert('Ya existe una unidad con ese nombre o abreviatura');
      return;
    }

    this.creandoUnidad = true;
    this.unitsService.createUnit(nombre, this.nuevaUnidadAbreviatura || undefined).subscribe({
      next: (unidadCreada) => {
        if (!unidadCreada || typeof unidadCreada.id === 'undefined') {
          throw new Error('Respuesta inválida al crear unidad');
        }

        // Agregar la nueva unidad a la lista si no existe
        const yaExiste = this.unidades.some(u => u.id === unidadCreada.id);
        if (!yaExiste) {
          this.unidades = [...this.unidades, unidadCreada];
        }

        // Seleccionar automáticamente la unidad creada
        this.seleccionarUnidad(unidadCreada);

        // Cerrar el modal
        this.cerrarModalUnidad();

        // Refrescar unidades
        this.cargarUnidades();
      },
      error: (err) => {
        console.error('Error al crear unidad:', err);
        this.creandoUnidad = false;

        let mensajeError = 'No se pudo crear la unidad de medida.';
        if (err?.message) {
          mensajeError = err.message;
        } else if (typeof err === 'string') {
          mensajeError = err;
        }

        alert(mensajeError);
      }
    });
  }

  // ====================
  // Categorías
  // ====================
  filtrarCategorias(event: any) {
    const termino = (event?.target?.value || '').toLowerCase();
    this.mostrarDropdown = termino.length > 0;
    if (termino.length === 0) {
      this.categoriasFiltradas = [];
      return;
    }
    this.categoriasFiltradas = (this.categorias || []).filter(c => {
      const name = (c as any)?.name ?? '';
      const idStr = (c as any)?.id != null ? String((c as any).id) : '';
      return String(name).toLowerCase().includes(termino) || idStr.includes(termino);
    });
  }

  seleccionarCategoria(categoria: Category) {
    this.categoriaSeleccionada = categoria;
    this.mostrarDropdown = false;
    this.categoriasFiltradas = [];
    // Limpiar el input de búsqueda
    const input = document.getElementById('category_search') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  limpiarCategoria() {
    this.categoriaSeleccionada = null;
    // Limpiar el input de búsqueda
    const input = document.getElementById('category_search') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  crearCategoriaRapida() {
    this.nuevaCategoriaNombre = '';
    this.mostrarModalCategoria = true;
  }

  cerrarModalCategoria() {
    this.mostrarModalCategoria = false;
    this.nuevaCategoriaNombre = '';
    this.creandoCategoria = false;
  }

  guardarNuevaCategoria() {
    const nombre = this.nuevaCategoriaNombre.trim();
    if (!nombre) {
      alert('Por favor ingresa un nombre para la categoría');
      return;
    }

    // Verificar si ya existe una categoría con ese nombre
    const existe = this.categorias.some(c => c.name.toLowerCase() === nombre.toLowerCase());
    if (existe) {
      alert('Ya existe una categoría con ese nombre');
      return;
    }

    this.creandoCategoria = true;
    this.categoriesService.createCategory(nombre).subscribe({
      next: (categoriaCreada) => {
        if (!categoriaCreada || typeof categoriaCreada.id === 'undefined') {
          throw new Error('Respuesta inválida al crear categoría');
        }

        // Agregar la nueva categoría a la lista si no existe
        const yaExiste = this.categorias.some(c => c.id === categoriaCreada.id);
        if (!yaExiste) {
          this.categorias = [...this.categorias, categoriaCreada];
        }

        // Seleccionar automáticamente la categoría creada
        this.seleccionarCategoria(categoriaCreada);

        // Cerrar el modal
        this.cerrarModalCategoria();

        // Refrescar categorías desde backend para asegurar consistencia
        this.cargarCategorias();
      },
      error: (err) => {
        // Solo mostrar error si no es un error de conexión (status 0)
        if (err.status && err.status !== 0) {
          console.error('Error al crear categoría:', err.status, err.message);
        }
        this.creandoCategoria = false;

        // Manejar diferentes tipos de errores
        let mensajeError = 'No se pudo crear la categoría.';

        if (err?.message) {
          mensajeError = err.message;
        } else if (err?.error?.message) {
          mensajeError = err.error.message;
        } else if (typeof err === 'string') {
          mensajeError = err;
        }

        // Si el error menciona que ya existe, seleccionar la existente
        if (mensajeError.includes('Ya existe') && err?.categoria) {
          this.seleccionarCategoria(err.categoria);
          this.cerrarModalCategoria();
          alert('La categoría ya existe y ha sido seleccionada.');
          return;
        }

        alert(mensajeError);
      }
    });
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

    // Validar que la categoría seleccionada existe
    if (!this.categoriaSeleccionada || !this.categoriaSeleccionada.id) {
      alert('Por favor selecciona una categoría para el producto.');
      return;
    }

    const categoriaId = this.categoriaSeleccionada.id;
    const existeCategoria = this.categorias.some(c => c.id === categoriaId);
    if (!existeCategoria) {
      alert('La categoría seleccionada no es válida. Elige una categoría existente.');
      return;
    }

    // Validar que la unidad seleccionada existe
    if (!this.unidadSeleccionada) {
      alert('Por favor selecciona una unidad de medida para el producto.');
      return;
    }

    // FormData para enviar imagen + datos
    const formData = new FormData();
    formData.append('name', form.value.name);
    formData.append('category_id', String(this.categoriaSeleccionada!.id));
    formData.append('codigo_de_barras', form.value.codigo_de_barras || '');
    // Usar la unidad seleccionada (abreviatura o nombre)
    const unidadValue = this.unidadSeleccionada.abbreviation || this.unidadSeleccionada.name;
    formData.append('unit_measurement', unidadValue);

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
        this.unidadSeleccionada = null;
        this.productoCreado.emit(res);
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


