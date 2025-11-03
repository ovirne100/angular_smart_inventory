import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertsService, AlertFilters, Alert } from '../../../services/alertas/alerts.service';
import { OrdersService } from '../../../services/orders/orders.service';
import { AuthService, User } from '../../../services/auth.service';
import { SuppliersService } from '../../../services/proveedores/suppliers.service';

@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alertas.component.html',
  styleUrls: ['./alertas.component.css']
})
export class AlertasComponent implements OnInit {
  alertas: Alert[] = [];
  cargando: boolean = false;
  error: string = '';
  filtroActivo: string = 'todas';

  // Variables para el modal de orden
  mostrarOrden: boolean = false;
  alertaSeleccionada: Alert | null = null;
  proveedorNombre: string = 'No asociado';
  proveedorId: number | null = null;
  proveedorEmail: string = '';
  cantidad: number = 1;
  usuarioLogueado: string = '';
  enviandoOrden: boolean = false;
  cargandoProveedor: boolean = false;

  constructor(
    private alertsService: AlertsService,
    private ordersService: OrdersService,
    private authService: AuthService,
    private suppliersService: SuppliersService
  ) {}

  ngOnInit(): void {
    this.obtenerAlertas();
  }

  obtenerAlertas(): void {
    this.cargando = true;
    this.error = '';
    this.filtroActivo = 'todas';
    this.alertsService.getAlerts().subscribe({
      next: (res) => {
        console.log('Alertas recibidas:', res.data);
        this.alertas = res.data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al obtener alertas:', err);
        this.error = 'Error al cargar las alertas.';
        this.cargando = false;
      }
    });
  }

  filtrarPor(tipo: string): void {
    this.cargando = true;
    this.error = '';
    this.filtroActivo = tipo;

    const filtros: AlertFilters = {};

    switch(tipo) {
      case 'bajo':
        filtros.alert_type = 'bajo_stock';
        filtros.status = 'pendiente';
        break;
      case 'sin':
        filtros.alert_type = 'sin_stock';
        filtros.status = 'pendiente';
        break;
      case 'resueltas':
        filtros.status = 'resuelta';
        break;
      case 'pendientes':
        filtros.status = 'pendiente';
        break;
    }

    console.log('Filtros aplicados:', filtros);

    this.alertsService.getAlerts(filtros).subscribe({
      next: (res) => {
        console.log('Alertas filtradas recibidas:', res);
        console.log('Total alertas:', res.data.length);
        this.alertas = res.data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al filtrar:', err);
        this.error = 'Error al filtrar las alertas.';
        this.cargando = false;
      }
    });
  }

  getAlertClass(alerta: Alert): string {
    if (alerta.status === 'resuelta') return 'alerta-resuelta';
    if (alerta.status === 'pendiente') return 'alerta-pendiente';
    if (alerta.alert_type === 'sin_stock') return 'alerta-critica';
    if (alerta.alert_type === 'bajo_stock') return 'alerta-advertencia';
    return 'alerta-pendiente';
  }

  abrirModalOrden(alerta: Alert): void {
    this.alertaSeleccionada = alerta;
    this.cantidad = 1;
    this.mostrarOrden = true;
    this.proveedorNombre = 'No asociado';
    this.proveedorId = null;
    this.proveedorEmail = '';
    this.cargandoProveedor = true;

    // Obtener información del usuario logueado
    const usuario = this.authService.getCurrentUserValue();
    if (usuario) {
      this.usuarioLogueado = `${usuario.name} ${usuario.lastname}`;
    } else {
      // Si no hay usuario en memoria, intentar cargarlo
      this.authService.getCurrentUser().subscribe({
        next: (user: User) => {
          this.usuarioLogueado = `${user.name} ${user.lastname}`;
        },
        error: () => {
          this.usuarioLogueado = 'Usuario no disponible';
        }
      });
    }

    // Obtener product_id desde diferentes fuentes
    const productId = alerta.product_id || alerta.product?.id || (alerta.product as any)?.id || null;
    
    console.log('🔍 Abriendo modal de orden para alerta:', alerta);
    console.log('📦 Datos del producto en la alerta:', alerta.product);
    console.log('🆔 Product ID obtenido:', productId);
    
    // Siempre intentar obtener el proveedor desde el API del producto si tenemos product_id
    // Primero verificar si ya viene en los datos de la alerta
    let supplierFound = false;
    
    if (alerta.product) {
      const product = alerta.product as any;
      
      // Buscar proveedor en product.suppliers (array)
      if (product.suppliers && Array.isArray(product.suppliers) && product.suppliers.length > 0) {
        console.log('✅ Proveedor encontrado en product.suppliers');
        const supplier = product.suppliers[0];
        this.proveedorNombre = supplier.name || 'No asociado';
        this.proveedorId = supplier.id || null;
        this.proveedorEmail = supplier.email || '';
        this.cargandoProveedor = false;
        supplierFound = true;
      }
      // Buscar proveedor en product.supplier (objeto único)
      else if (product.supplier) {
        console.log('✅ Proveedor encontrado en product.supplier');
        this.proveedorNombre = product.supplier.name || 'No asociado';
        this.proveedorId = product.supplier.id || null;
        this.proveedorEmail = product.supplier.email || '';
        this.cargandoProveedor = false;
        supplierFound = true;
      }
      // Buscar en pivot
      else if (product.pivot && product.pivot.supplier_id) {
        console.log('⚠️ Solo se encontró supplier_id en pivot, necesitamos obtener datos completos');
        // Solo tenemos el ID, necesitamos obtener los datos
        supplierFound = false; // Continuar para obtener datos completos
      } else {
        console.log('⚠️ No se encontró proveedor en product');
      }
    }

    // Buscar en inventory si no se encontró en product
    if (!supplierFound && alerta.inventory) {
      const inventory = alerta.inventory as any;
      if (inventory.supplier) {
        console.log('✅ Proveedor encontrado en inventory.supplier');
        this.proveedorNombre = inventory.supplier.name || 'No asociado';
        this.proveedorId = inventory.supplier.id || inventory.supplier_id || null;
        this.proveedorEmail = inventory.supplier.email || '';
        this.cargandoProveedor = false;
        supplierFound = true;
      } else {
        console.log('⚠️ No se encontró proveedor en inventory');
      }
    }

    // Si no encontramos el proveedor en los datos de la alerta, buscarlo en el API
    if (!supplierFound && productId) {
      console.log('🔍 Buscando proveedor en API para product_id:', productId);
      this.obtenerProveedoresPorProducto(productId);
    } else if (!supplierFound) {
      console.warn('⚠️ No se pudo obtener proveedor: no hay product_id');
      this.cargandoProveedor = false;
    }
  }

  obtenerProveedorPorProducto(productId: number, supplierId: number): void {
    console.log('🔍 Buscando proveedor específico:', { productId, supplierId });
    this.suppliersService.getSuppliersByProduct(productId).subscribe({
      next: (response) => {
        console.log('📦 Respuesta del API de proveedores (específico):', response);
        
        // Manejar diferentes estructuras de respuesta
        let suppliers: any[] = [];
        
        if (Array.isArray(response)) {
          suppliers = response;
        } else if (response && Array.isArray(response.data)) {
          suppliers = response.data;
        } else if (response && response.data && Array.isArray(response.data.data)) {
          suppliers = response.data.data;
        } else if (response && response.suppliers && Array.isArray(response.suppliers)) {
          suppliers = response.suppliers;
        }
        
        // Buscar el proveedor que coincida con el supplierId
        const supplier = suppliers.find((s: any) => {
          const supplierData = s.supplier || s;
          return supplierData.id === supplierId || 
                 s.id === supplierId || 
                 supplierData.supplier_id === supplierId ||
                 s.supplier_id === supplierId;
        });
        
        if (supplier) {
          const supplierData = supplier.supplier || supplier;
          this.proveedorNombre = supplierData.name || supplier.name || 'No asociado';
          this.proveedorId = supplierData.id || supplier.id || supplierData.supplier_id || supplier.supplier_id || null;
          this.proveedorEmail = supplierData.email || supplier.email || '';
          
          console.log('✅ Proveedor específico encontrado:', {
            nombre: this.proveedorNombre,
            id: this.proveedorId,
            email: this.proveedorEmail
          });
        } else {
          console.warn('⚠️ No se encontró el proveedor con ID:', supplierId);
          this.proveedorNombre = 'No asociado';
          this.proveedorId = null;
          this.proveedorEmail = '';
        }
        this.cargandoProveedor = false;
      },
      error: (err) => {
        console.error('❌ Error al obtener proveedor específico:', err);
        this.cargandoProveedor = false;
      }
    });
  }

  obtenerProveedoresPorProducto(productId: number): void {
    console.log('🔍 Buscando proveedores para producto ID:', productId);
    this.suppliersService.getSuppliersByProduct(productId).subscribe({
      next: (response) => {
        console.log('📦 Respuesta del API de proveedores:', response);
        
        // Manejar diferentes estructuras de respuesta
        let suppliers: any[] = [];
        
        if (Array.isArray(response)) {
          suppliers = response;
        } else if (response && Array.isArray(response.data)) {
          suppliers = response.data;
        } else if (response && response.data && Array.isArray(response.data.data)) {
          suppliers = response.data.data;
        } else if (response && response.suppliers && Array.isArray(response.suppliers)) {
          suppliers = response.suppliers;
        }
        
        console.log('📋 Proveedores encontrados:', suppliers);
        
        if (suppliers.length > 0) {
          const supplier = suppliers[0] as any;
          
          // Intentar extraer los datos del proveedor de diferentes formas
          const supplierData = supplier.supplier || supplier;
          
          this.proveedorNombre = supplierData.name || supplier.name || 'No asociado';
          this.proveedorId = supplierData.id || supplier.id || supplier.supplier_id || supplier.supplier?.id || null;
          this.proveedorEmail = supplierData.email || supplier.email || '';
          
          console.log('✅ Proveedor encontrado:', {
            nombre: this.proveedorNombre,
            id: this.proveedorId,
            email: this.proveedorEmail
          });
        } else {
          console.warn('⚠️ No se encontraron proveedores para el producto');
          this.proveedorNombre = 'No asociado';
          this.proveedorId = null;
          this.proveedorEmail = '';
        }
        this.cargandoProveedor = false;
      },
      error: (err) => {
        console.error('❌ Error al obtener proveedores:', err);
        console.error('Detalles del error:', {
          status: err.status,
          message: err.message,
          error: err.error
        });
        this.cargandoProveedor = false;
        this.proveedorNombre = 'No asociado';
        this.proveedorId = null;
        this.proveedorEmail = '';
      }
    });
  }

  cerrarModalOrden(): void {
    this.mostrarOrden = false;
    this.alertaSeleccionada = null;
    this.cantidad = 1;
    this.proveedorNombre = 'No asociado';
    this.proveedorId = null;
    this.proveedorEmail = '';
    this.usuarioLogueado = '';
    this.enviandoOrden = false;
    this.cargandoProveedor = false;
  }

  enviarOrden(): void {
    if (!this.alertaSeleccionada) {
      alert('Error: No hay alerta seleccionada');
      return;
    }

    if (!this.cantidad || this.cantidad < 1) {
      alert('Por favor ingresa una cantidad válida mayor a 0');
      return;
    }

    const usuario = this.authService.getCurrentUserValue();
    if (!usuario) {
      alert('Error: No se pudo obtener el usuario logueado. Por favor, recarga la página.');
      return;
    }

    // Obtener product_id desde diferentes fuentes
    const productId = this.alertaSeleccionada.product_id || 
                     this.alertaSeleccionada.product?.id || 
                     (this.alertaSeleccionada.product as any)?.id || null;

    // Obtener inventory_id desde diferentes fuentes
    const inventoryId = this.alertaSeleccionada.inventory_id || 
                       (this.alertaSeleccionada.inventory as any)?.id || null;

    // Validar que al menos product_id esté presente
    if (!productId) {
      alert('Error: No se pudo obtener el ID del producto. Por favor, recarga la página.');
      console.error('Alerta seleccionada:', this.alertaSeleccionada);
      return;
    }

    this.enviandoOrden = true;

    // Preparar los datos para la orden
    // Asegurarse de que todos los IDs sean números
    const orderData: any = {
      product_id: Number(productId),
      quantity: Number(this.cantidad),
      alert_id: Number(this.alertaSeleccionada.id),
      user_id: Number(usuario.id) // IMPORTANTE: El backend debe procesar este campo
    };

    // Agregar inventory_id solo si existe (como número)
    if (inventoryId) {
      orderData.inventory_id = Number(inventoryId);
    }

    // Agregar supplier_id solo si existe (como número)
    if (this.proveedorId) {
      orderData.supplier_id = Number(this.proveedorId);
    }

    // Agregar supplier_email solo si existe
    if (this.proveedorEmail) {
      orderData.supplier_email = this.proveedorEmail.trim();
    }

    console.log('Enviando orden:', orderData);
    console.log('Alerta seleccionada completa:', this.alertaSeleccionada);

    this.ordersService.createOrder(orderData).subscribe({
      next: (response) => {
        console.log('Orden creada exitosamente:', response);
        
        // Marcar la alerta como pendiente después de crear la orden
        if (this.alertaSeleccionada?.id) {
          this.alertsService.updateAlertStatus(this.alertaSeleccionada.id, 'pendiente').subscribe({
            next: () => {
              console.log('✅ Alerta marcada como pendiente');
            },
            error: (err) => {
              console.error('⚠️ Error al marcar alerta como pendiente:', err);
              // No mostramos error al usuario, solo en consola
            }
          });
        }
        
        const mensaje = this.proveedorEmail 
          ? `Orden de reabastecimiento creada exitosamente. Se enviará un correo a ${this.proveedorEmail}`
          : 'Orden de reabastecimiento creada exitosamente.';
        alert(mensaje);
        this.cerrarModalOrden();
        // Recargar las alertas para actualizar el estado
        this.obtenerAlertas();
      },
      error: (err) => {
        console.error('❌ Error al crear la orden:', err);
        console.error('📤 Datos enviados:', JSON.stringify(orderData, null, 2));
        console.error('📥 Respuesta del servidor completa:', err.error);
        console.error('📋 Detalles completos del error:', {
          status: err.status,
          statusText: err.statusText,
          error: err.error,
          message: err.message
        });
        
        let mensajeError = 'Error al crear la orden.';
        
        // Si es error 422, mostrar los errores de validación
        if (err.status === 422 && err.error?.errors) {
          const errores = err.error.errors;
          const mensajes = Object.keys(errores).map(campo => {
            const erroresCampo = Array.isArray(errores[campo]) ? errores[campo] : [errores[campo]];
            return `${campo}: ${erroresCampo.join(', ')}`;
          });
          mensajeError = 'Error de validación:\n' + mensajes.join('\n');
        } 
        // Si es error 500, mostrar el mensaje del servidor
        else if (err.status === 500) {
          const errorMsg = err.error?.error || err.error?.message || '';
          
          // Extraer el mensaje de error SQL si está disponible
          if (errorMsg.includes("Field 'user_")) {
            mensajeError = 'Error: El campo user_id es requerido pero no se está enviando correctamente al backend. Por favor, revisa la configuración del backend.';
          } else if (err.error?.message) {
            mensajeError = `Error del servidor: ${err.error.message}`;
          } else if (err.error?.error) {
            mensajeError = `Error del servidor: ${err.error.error}`;
          } else {
            mensajeError = 'Error interno del servidor. Revisa los logs del backend (storage/logs/laravel.log) para más detalles.';
          }
        } 
        else if (err.error?.message) {
          mensajeError = err.error.message;
        } 
        else if (typeof err.error === 'string') {
          mensajeError = err.error;
        }
        
        alert(mensajeError + '\n\nVer la consola (F12) para más detalles.');
        this.enviandoOrden = false;
      }
    });
  }
}
