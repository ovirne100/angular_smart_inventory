import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Producto } from '../../interfaces/producto';
import { ProductosService } from '../../services/productos/products.service';

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

  constructor(private productosService: ProductosService) {}

  ngOnInit() {
    // Guardar la URL original de la imagen
    if (this.producto?.image_url) {
      this.imagenOriginalUrl = this.producto.image_url;
    }
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
    if (this.producto.category_id != null) formData.append('category_id', String(this.producto.category_id));
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
                    ? `http://127.0.0.1:8000/storage/${productoActualizado.image}?t=${Date.now()}`
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
                        ? `http://127.0.0.1:8000/storage/${productoCompleto.image}?t=${Date.now()}`
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
                  image_url: this.eliminarImagen ? undefined : (res.data?.image ? `http://127.0.0.1:8000/storage/${res.data.image}?t=${Date.now()}` : res.data?.image_url || undefined),
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
                        ? `http://127.0.0.1:8000/storage/${productoCompleto.image}?t=${Date.now()}`
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
                  image_url: this.eliminarImagen ? undefined : (res.data?.image ? `http://127.0.0.1:8000/storage/${res.data.image}?t=${Date.now()}` : res.data?.image_url || undefined),
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
}

