import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, Renderer2, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Producto } from '../../interfaces/producto';
import { ProductosService } from '../../services/productos/products.service';
import { CategoriesService, Category } from '../../services/categories/categories.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-actualizar-producto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './actualizar-producto.component.html',
})
export class ActualizarProductoComponent implements OnInit {

  @Input() producto!: Producto;              // Producto recibido desde el padre
  @Output() cancelar = new EventEmitter<void>();
  @Output() actualizado = new EventEmitter<Producto>(); // Emitirá producto actualizado

  nuevaImagen: File | null = null;
  eliminarImagen: boolean = false;
  imagenOriginalUrl: string | null = null;

  // Categorías
  categorias: Category[] = [];
  categoriasFiltradas: Category[] = [];
  categoriaSeleccionada: Category | null = null;
  mostrarDropdown: boolean = false;
  mostrarModalCategoria = false;
  nuevaCategoriaNombre = '';
  creandoCategoria = false;

  constructor(
    private productosService: ProductosService,
    private categoriesService: CategoriesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Guardar la URL original de la imagen
    if (this.producto?.image_url) {
      this.imagenOriginalUrl = this.producto.image_url;
    }

    // Cargar categorías
    this.cargarCategorias();

    // Cargar categoría actual del producto después de cargar las categorías
    this.cargarCategorias();
  }

  private cargarCategorias() {
    this.categoriesService.getCategoriesSafe().subscribe((cats) => {
      this.categorias = Array.isArray(cats) ? cats : [];
      
      // Después de cargar, buscar la categoría actual del producto
      if (this.producto?.category_id) {
        const categoriaEncontrada = this.categorias.find(
          c => c.id === this.producto.category_id
        );
        if (categoriaEncontrada) {
          this.categoriaSeleccionada = categoriaEncontrada;
        }
      } else if (this.producto?.categoria?.name) {
        // Si tiene nombre de categoría pero no ID, buscar por nombre
        const categoriaEncontrada = this.categorias.find(
          c => c.name.toLowerCase() === this.producto.categoria?.name?.toLowerCase()
        );
        if (categoriaEncontrada) {
          this.categoriaSeleccionada = categoriaEncontrada;
        }
      }
    });
  }

  eliminarImagenActual() {
    this.eliminarImagen = true;
    this.nuevaImagen = null;
    // Limpiar el input de archivo
    const input = document.getElementById('image') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  restaurarImagen() {
    this.eliminarImagen = false;
    this.nuevaImagen = null;
  }

  onImagenSeleccionada(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.nuevaImagen = file;
      this.eliminarImagen = false; // Si se selecciona una nueva imagen, no eliminar
    }
  }

  guardarCambios() {
    if (!this.producto || !this.producto.id) {
      console.error('No se puede guardar: producto o ID no válido');
      return;
    }

    console.log('Guardando cambios...', { eliminarImagen: this.eliminarImagen, nuevaImagen: !!this.nuevaImagen });

    const formData = new FormData();

    // Campos básicos
    formData.append('name', this.producto.name);
    
    // Usar categoría seleccionada si existe, sino usar category_id del producto
    if (this.categoriaSeleccionada?.id) {
      formData.append('category_id', String(this.categoriaSeleccionada.id));
    } else if (this.producto.category_id != null) {
      formData.append('category_id', String(this.producto.category_id));
    }
    if (this.producto.codigo_de_barras) {
      formData.append('codigo_de_barras', this.producto.codigo_de_barras);
    } else if (this.producto.reference) {
      formData.append('codigo_de_barras', this.producto.reference); // Migración desde reference
    }
    if (this.producto.unit_measurement) formData.append('unit_measurement', this.producto.unit_measurement);
    if (this.producto.batch) formData.append('batch', this.producto.batch);

    // Manejo seguro de expiration_date
    const fechaStr = this.producto.expiration_date
      ? this.producto.expiration_date instanceof Date
        ? this.producto.expiration_date.toISOString().substring(0, 10)
        : String(this.producto.expiration_date)
      : null;

    if (fechaStr) {
      formData.append('expiration_date', fechaStr);
    }

    // Imagen nueva o eliminación
    if (this.eliminarImagen) {
      // Enviar un valor especial para indicar que se debe eliminar la imagen
      formData.append('eliminar_imagen', 'true');
      console.log('✅ Marcado para eliminar imagen');
    } else if (this.nuevaImagen) {
      formData.append('image', this.nuevaImagen);
      console.log('✅ Nueva imagen agregada');
    }

    // Llamada al servicio
    this.productosService.actualizarProducto(this.producto.id, formData).subscribe({
      next: (res: any) => {
        // Después de actualizar, obtenemos el producto desde la lista completa
        // que sí incluye las relaciones (categoria) correctamente
        this.productosService.getProducts({
          search: '',
          page: 1,
          perPage: 100
        }).subscribe({
          next: (response: any) => {
            const productosArray = response.data || [];
            // Buscar el producto actualizado en la lista
            const productoActualizado = productosArray.find((p: Producto) => p.id === this.producto.id);

            if (productoActualizado) {
              // Usar el producto de la lista que tiene todas las relaciones
              const productoConRelaciones: Producto = {
                ...productoActualizado,
                // Si se eliminó la imagen, asegurar que image_url sea undefined
                image_url: this.eliminarImagen
                  ? undefined
                  : (productoActualizado.image
                    ? `${environment.storageUrl}/${productoActualizado.image}?t=${Date.now()}`
                    : productoActualizado.image_url ? `${productoActualizado.image_url}?t=${Date.now()}` : undefined),
                image: this.eliminarImagen ? undefined : productoActualizado.image
              };

              // Resetear el estado de eliminación de imagen
              this.eliminarImagen = false;
              this.nuevaImagen = null;

              this.producto = productoConRelaciones;
              this.actualizado.emit(productoConRelaciones);
              console.log('✅ Producto actualizado con categoría:', productoConRelaciones);
            } else {
              // Si no se encuentra en la lista, intentar obtener individualmente
              this.productosService.getProducto(this.producto.id).subscribe({
                next: (productoCompleto: Producto) => {
                  const productoActualizado: Producto = {
                    ...productoCompleto,
                    categoria: productoCompleto.categoria || (productoCompleto.category_id ? null : { name: 'Sin categoría' }),
                    image_url: this.eliminarImagen
                      ? undefined
                      : (productoCompleto.image
                        ? `${environment.storageUrl}/${productoCompleto.image}?t=${Date.now()}`
                        : productoCompleto.image_url ? `${productoCompleto.image_url}?t=${Date.now()}` : undefined),
                    image: this.eliminarImagen ? undefined : productoCompleto.image
                  };

                  this.producto = productoActualizado;
                  this.actualizado.emit(productoActualizado);
                  console.log('✅ Producto actualizado (fallback):', productoActualizado);
                },
                error: (errGet: any) => {
                  console.error('❌ Error al obtener producto actualizado', errGet);
                // Último recurso: usar la respuesta del update
                const productoActualizado: Producto = {
                  ...res.data,
                  categoria: res.data?.categoria || (res.data?.category_id ? null : { name: 'Sin categoría' }),
                  image_url: this.eliminarImagen ? undefined : (res.data?.image ? `${environment.storageUrl}/${res.data.image}?t=${Date.now()}` : res.data?.image_url || undefined),
                  image: this.eliminarImagen ? undefined : res.data?.image
                };
                  this.producto = productoActualizado;
                  this.actualizado.emit(productoActualizado);
                }
              });
            }
          },
          error: (errList: any) => {
            console.error('❌ Error al obtener lista de productos', errList);
            // Fallback: intentar obtener individualmente
            this.productosService.getProducto(this.producto.id).subscribe({
                next: (productoCompleto: Producto) => {
                  const productoActualizado: Producto = {
                    ...productoCompleto,
                    categoria: productoCompleto.categoria || (productoCompleto.category_id ? null : { name: 'Sin categoría' }),
                    image_url: this.eliminarImagen
                      ? undefined
                      : (productoCompleto.image
                        ? `${environment.storageUrl}/${productoCompleto.image}?t=${Date.now()}`
                        : productoCompleto.image_url ? `${productoCompleto.image_url}?t=${Date.now()}` : undefined),
                    image: this.eliminarImagen ? undefined : productoCompleto.image
                  };

                this.producto = productoActualizado;
                this.actualizado.emit(productoActualizado);
              },
              error: (errGet: any) => {
                console.error('❌ Error al obtener producto actualizado', errGet);
                // Último recurso: usar la respuesta del update
                const productoActualizado: Producto = {
                  ...res.data,
                  categoria: res.data?.categoria || (res.data?.category_id ? null : { name: 'Sin categoría' }),
                  image_url: this.eliminarImagen ? undefined : (res.data?.image ? `${environment.storageUrl}/${res.data.image}?t=${Date.now()}` : res.data?.image_url || undefined),
                  image: this.eliminarImagen ? undefined : res.data?.image
                };
                this.producto = productoActualizado;
                this.actualizado.emit(productoActualizado);
              }
            });
          }
        });
      },
      error: (err: any) => {
        console.error('❌ Error al actualizar producto', err);
      }
    });
  }


  cancelarEdicion() {
    this.cancelar.emit();
  }

  // ====================
  // Métodos de categorías
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
    this.producto.category_id = categoria.id;
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
    this.producto.category_id = undefined;
    // Limpiar el input de búsqueda
    const input = document.getElementById('category_search') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  crearCategoriaRapida(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('🔵 Abriendo modal de categoría...');
    this.nuevaCategoriaNombre = '';
    this.mostrarModalCategoria = true;
    this.cdr.detectChanges();
    
    // Asegurar que el modal se muestre correctamente
    setTimeout(() => {
      const modalOverlay = document.querySelector('.modal-overlay-categoria') as HTMLElement;
      if (modalOverlay) {
        modalOverlay.style.cssText = `
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          background: rgba(7, 12, 20, 0.95) !important;
          z-index: 99999 !important;
          visibility: visible !important;
          opacity: 1 !important;
        `;
        console.log('✅ Estilos aplicados al modal');
      } else {
        console.error('❌ Modal no encontrado en DOM');
      }
    }, 10);
  }

  cerrarModalCategoria() {
    this.mostrarModalCategoria = false;
    this.nuevaCategoriaNombre = '';
    this.creandoCategoria = false;
  }

  guardarNuevaCategoria() {
    const nombre = this.nuevaCategoriaNombre.trim();
    console.log('🔵 Guardando nueva categoría:', nombre);
    
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
    console.log('📤 Enviando petición al backend...');
    this.categoriesService.createCategory(nombre).subscribe({
      next: (categoriaCreada) => {
        console.log('✅ Categoría creada:', categoriaCreada);
        
        if (!categoriaCreada || typeof categoriaCreada.id === 'undefined') {
          console.error('❌ Respuesta inválida:', categoriaCreada);
          throw new Error('Respuesta inválida al crear categoría');
        }

        // Agregar la nueva categoría a la lista si no existe
        const yaExiste = this.categorias.some(c => c.id === categoriaCreada.id);
        if (!yaExiste) {
          this.categorias = [...this.categorias, categoriaCreada];
          console.log('✅ Categoría agregada a la lista');
        }

        // Seleccionar automáticamente la categoría creada
        this.seleccionarCategoria(categoriaCreada);
        console.log('✅ Categoría seleccionada automáticamente');

        // Cerrar el modal
        this.cerrarModalCategoria();

        // Refrescar categorías desde backend para asegurar consistencia
        this.cargarCategorias();
      },
      error: (err) => {
        console.error('❌ Error al crear categoría:', err);
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
}

