import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ReportsService } from '../../../services/informes/reports.service';
import { AlertsService, Alert } from '../../../services/alertas/alerts.service';
import { ProductosService } from '../../../services/productos/products.service';
import { SuppliersService } from '../../../services/proveedores/suppliers.service';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { forkJoin } from 'rxjs';

// Importar jspdf-autotable
import 'jspdf-autotable';

// Extender el tipo de jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Interfaz para el documento Word usando docx
declare var Docx: any;

type ReportType = 'alertas' | 'productos' | 'proveedores' | 'inventario';

interface ReportColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  type?: 'text' | 'badge' | 'date' | 'number' | 'detailToggle';
  valueAccessor?: (row: any) => any;
  badgeVariants?: Record<string, string>;
  badgeLabels?: Record<string, string>;
  export?: boolean;
}

interface ReportMeta {
  type: ReportType;
  title: string;
  icon: string;
  description: string;
  columns: ReportColumn[];
}

interface SummaryMetric {
  label: string;
  value: string;
  icon: string;
  accent: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  helper?: string;
}

@Component({
  selector: 'app-informes',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './informes.component.html',
  styleUrls: ['./informes.component.css']
})
export class InformesComponent implements OnInit {
  // Tipos de informe
  tipoInforme: ReportType = 'productos';

  // Formulario de filtros
  filtrosForm!: FormGroup;

  // Datos de los informes
  datos: any[] = [];
  datosFiltrados: any[] = [];

  // Estados
  loading = false;
  mostrarFiltros = true;
  historialExpandido: { [key: string]: boolean } = {}; // Para controlar qué filas tienen el historial expandido

  currentColumns: ReportColumn[] = [];
  currentReportMeta!: ReportMeta;
  summaryMetrics: SummaryMetric[] = [];

  // Modal de confirmación para PDF de inventario
  mostrarModalPDF: boolean = false;
  tipoExportacionPDF: string = ''; // 'normal' o 'inventario'

  // Estado para modal de detalles de producto
  mostrarModalDetalleProducto: boolean = false;
  productoSeleccionado: any = null;

  // Filtros por tipo de informe
  filtrosProductos = {
    search: '',
    categoria: '',
    lote: '',
    referencia: '',
    fechaInicio: '',
    fechaFin: ''
  };

  filtrosProveedores = {
    search: '',
    fechaInicio: '',
    fechaFin: ''
  };

  filtrosInventario = {
    producto: '',
    almacen: '',
    lote: '',
    stockMinimo: '',
    mostrarAgotados: false,
    fechaInicio: '',
    fechaFin: ''
  };

  filtrosAlertas = {
    tipo: '',
    estado: '',
    prioridad: '',
    fechaInicio: '',
    fechaFin: ''
  };

  readonly reportConfigs: Record<ReportType, ReportMeta> = {
    productos: {
      type: 'productos',
      title: 'Informe de Productos en Inventario',
      icon: 'fa-boxes',
      description: 'Consulta el detalle de productos que están en inventario con stock disponible, incluyendo código de barras, proveedor, lote y stock actual.',
      columns: [
        { key: 'id', label: 'ID', align: 'center', type: 'number' },
        { key: 'name', label: 'Nombre' },
        {
          key: 'proveedor',
          label: 'Proveedor',
          valueAccessor: (row) => row.proveedor || 'Sin proveedor'
        },
        {
          key: 'codigo_de_barras',
          label: 'Código de Barras',
          valueAccessor: (row) => row.codigo_de_barras || row.reference || 'N/A'
        },
        {
          key: 'batch',
          label: 'Lote',
          valueAccessor: (row) => {
            // Buscar el lote en diferentes lugares posibles
            if (row.batch) return row.batch;
            if (row.lote) return row.lote;
            // Si hay inventarios, tomar el primer lote
            if (row.inventories && Array.isArray(row.inventories) && row.inventories.length > 0) {
              const firstInventory = row.inventories[0];
              return firstInventory.lot || firstInventory.batch || firstInventory.lote || '—';
            }
            // Si hay lotes como relación
            if (row.lotes && Array.isArray(row.lotes) && row.lotes.length > 0) {
              return row.lotes[0].batch || row.lotes[0].lot || row.lotes[0].lote || '—';
            }
            return '—';
          }
        },
        {
          key: 'stock',
          label: 'Stock',
          type: 'number',
          align: 'right',
          valueAccessor: (row) => row.stock ?? 0
        },
        {
          key: 'categoria',
          label: 'Categoría',
          valueAccessor: (row) => row.categoria?.name || 'Sin categoría'
        },
        {
          key: 'updated_at',
          label: 'Última actualización',
          type: 'date',
          valueAccessor: (row) => row.updated_at || row.created_at || row.updatedAt || row.createdAt || null
        }
      ]
    },
    proveedores: {
      type: 'proveedores',
      title: 'Informe de Proveedores',
      icon: 'fa-truck',
      description: 'Visualiza los proveedores registrados y su información de contacto.',
      columns: [
        { key: 'id', label: 'ID', align: 'center', type: 'number' },
        { key: 'name', label: 'Nombre' },
        {
          key: 'email',
          label: 'Email',
          valueAccessor: (row) => row.email || 'Sin correo'
        },
        {
          key: 'phone',
          label: 'Teléfono',
          valueAccessor: (row) => row.phone || 'Sin teléfono'
        },
        {
          key: 'address',
          label: 'Dirección',
          valueAccessor: (row) => row.address || '—'
        },
        {
          key: 'created_at',
          label: 'Fecha de registro',
          type: 'date',
          valueAccessor: (row) => row.created_at || row.createdAt || null
        }
      ]
    },
    alertas: {
      type: 'alertas',
      title: 'Informe de Alertas',
      icon: 'fa-bell',
      description: 'Monitorea las alertas del inventario, sus estados y prioridades.',
      columns: [
        {
          key: 'alert_type',
          label: 'Tipo',
          type: 'badge',
          badgeVariants: {
            bajo_stock: 'badge-warning',
            sin_stock: 'badge-danger'
          },
          badgeLabels: {
            bajo_stock: 'Bajo stock',
            sin_stock: 'Sin stock'
          },
          valueAccessor: (row) => row.alert_type || 'N/A'
        },
        {
          key: 'product',
          label: 'Producto',
          valueAccessor: (row) => row.product?.name || row.product_name || '—'
        },
        {
          key: 'message',
          label: 'Mensaje',
          valueAccessor: (row) => row.message || row.descripcion || '—'
        },
        {
          key: 'priority',
          label: 'Prioridad',
          type: 'badge',
          badgeVariants: {
            alta: 'badge-danger',
            media: 'badge-warning',
            baja: 'badge-info'
          },
          badgeLabels: {
            alta: 'Alta',
            media: 'Media',
            baja: 'Baja'
          },
          valueAccessor: (row) => row.priority || 'Sin prioridad'
        },
        {
          key: 'status',
          label: 'Estado',
          type: 'badge',
          badgeVariants: {
            pendiente: 'badge-info',
            resuelta: 'badge-success'
          },
          badgeLabels: {
            pendiente: 'Pendiente',
            resuelta: 'Resuelta'
          },
          valueAccessor: (row) => row.status || 'N/A'
        },
        {
          key: 'created_at',
          label: 'Fecha',
          type: 'date',
          valueAccessor: (row) => row.created_at || row.date || row.fecha || null
        }
      ]
    },
    inventario: {
      type: 'inventario',
      title: 'Informe de Inventario',
      icon: 'fa-warehouse',
      description: 'Analiza el inventario disponible, sus lotes y movimiento histórico agrupados por código de barras.',
      columns: [
        {
          key: 'name',
          label: 'Producto',
          valueAccessor: (row) => row.name || row.producto || '—'
        },
        {
          key: 'codigo_de_barras',
          label: 'Código de Barras',
          valueAccessor: (row) => row.codigo_de_barras || row.reference || 'N/A'
        },
        {
          key: 'proveedor',
          label: 'Proveedor',
          valueAccessor: (row) => row.proveedor || 'Sin proveedor'
        },
        {
          key: 'entradas',
          label: 'Total entradas',
          type: 'number',
          align: 'right',
          valueAccessor: (row) => row.entradas ?? 0
        },
        {
          key: 'salidas',
          label: 'Total salidas',
          type: 'number',
          align: 'right',
          valueAccessor: (row) => row.salidas ?? 0
        },
        {
          key: 'stock',
          label: 'Stock actual',
          type: 'number',
          align: 'right',
          valueAccessor: (row) => row.stock ?? row.quantity ?? 0
        },
        {
          key: 'stock_minimo',
          label: 'Stock mínimo',
          type: 'number',
          align: 'right',
          valueAccessor: (row) => row.stock_minimo ?? 0
        },
        {
          key: 'estado',
          label: 'Estado',
          type: 'badge',
          badgeVariants: {
            Disponible: 'badge-success',
            Bajo: 'badge-warning',
            Crítico: 'badge-danger'
          },
          valueAccessor: (row) => row.estado || 'N/A'
        },
        {
          key: 'lotes',
          label: 'Lotes',
          type: 'detailToggle',
          export: false,
          valueAccessor: (row) => (row.lotes?.length ?? 0)
        }
      ]
    }
  };

  constructor(
    private fb: FormBuilder,
    private svc: ReportsService,
    private alertsService: AlertsService,
    private productosService: ProductosService,
    private suppliersService: SuppliersService,
    private http: HttpClient,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.initFiltrosForm();
    this.applyReportConfig();
  }

  initFiltrosForm(): void {
    this.filtrosForm = this.fb.group({
      // Filtros comunes
      fechaInicio: [''],
      fechaFin: [''],
      search: ['']
    });
  }

  // Métodos de selección rápida de fechas
  setQuick(range: 'today' | 'week' | 'month' | 'year') {
    const now = new Date();
    let start: Date;
    switch (range) {
      case 'today':
        start = now;
        break;
      case 'week':
        start = new Date();
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const from = this.datePipe.transform(start!, 'yyyy-MM-dd')!;
    const to = this.datePipe.transform(now, 'yyyy-MM-dd')!;

    // Mantener en filtrosForm (si se usa en el futuro)
    this.filtrosForm.patchValue({ fechaInicio: from, fechaFin: to });

    // Aplicar al filtro del tipo activo
    if (this.tipoInforme === 'productos') {
      this.filtrosProductos.fechaInicio = from;
      this.filtrosProductos.fechaFin = to;
    } else if (this.tipoInforme === 'proveedores') {
      this.filtrosProveedores.fechaInicio = from;
      this.filtrosProveedores.fechaFin = to;
    } else if (this.tipoInforme === 'alertas') {
      this.filtrosAlertas.fechaInicio = from;
      this.filtrosAlertas.fechaFin = to;
    } else if (this.tipoInforme === 'inventario') {
      // Inventario: usaremos estas fechas al consultar el backend
      // Agregamos propiedades temporales en el objeto de filtros si no existen
      (this.filtrosInventario as any).fechaInicio = from;
      (this.filtrosInventario as any).fechaFin = to;
    }
  }

  // Cambiar tipo de informe
  cambiarTipoInforme(tipo: ReportType): void {
    this.tipoInforme = tipo;
    this.datos = [];
    this.datosFiltrados = [];
    this.applyReportConfig();
    this.summaryMetrics = [];
  }

  // Generar informe
  generarInforme(): void {
    this.loading = true;
    this.datos = [];
    this.datosFiltrados = [];

    switch (this.tipoInforme) {
      case 'alertas':
        this.generarInformeAlertas();
        break;
      case 'productos':
        this.generarInformeProductos();
        break;
      case 'proveedores':
        this.generarInformeProveedores();
        break;
      case 'inventario':
        this.generarInformeInventario();
        break;
    }
  }

  // Generar informe de alertas
  generarInformeAlertas(): void {
    const { tipo, estado, prioridad, fechaInicio, fechaFin } = this.filtrosAlertas;
    const params: any = {};

    if (tipo) params.alert_type = tipo;
    if (estado) params.status = estado;
    if (prioridad) params.priority = prioridad;
    if (fechaInicio) params.from = fechaInicio;
    if (fechaFin) params.to = fechaFin;

    this.alertsService.getAlerts(params).subscribe({
      next: (data: any) => {
        this.datos = data.data || data;
        this.datosFiltrados = [...this.datos];
        this.loading = false;
        this.updateSummaryMetrics();
      },
      error: (err) => {
        console.error('Error generando informe de alertas:', err);
        this.loading = false;
      }
    });
  }

  // Generar informe de productos - Solo productos en inventario
  generarInformeProductos(): void {
    const headers = this.getAuthHeaders();

    // Obtener inventarios para filtrar solo productos con stock
    // Incluir relaciones con productos y proveedores
    this.http.get(`${environment.apiUrl}/inventories?include=product.suppliers,product.supplier`, { headers }).subscribe({
      next: (inventariosRes: any) => {
        const inventarios = Array.isArray(inventariosRes?.data)
          ? inventariosRes.data
          : Array.isArray(inventariosRes)
            ? inventariosRes
            : [];

        // Crear un Set de IDs de productos que tienen stock en inventario
        const productosConStock = new Set<number>();
        inventarios.forEach((inv: any) => {
          const productId = inv.product_id || inv.product?.id;
          const stock = Number(inv.stock_actual ?? inv.stock ?? 0);
          if (productId && stock > 0) {
            productosConStock.add(productId);
          }
        });

        console.log(`✅ Productos con stock en inventario: ${productosConStock.size}`);

        // Si no hay productos con stock, mostrar mensaje
        if (productosConStock.size === 0) {
          this.datos = [];
          this.datosFiltrados = [];
          this.loading = false;
          this.updateSummaryMetrics();
          return;
        }

        // Obtener TODOS los productos sin límite de paginación
        // Incluir relaciones con proveedores en la petición
        // Obtener directamente desde la API con todas las relaciones
        this.http.get<any>(`${environment.apiUrl}/products?perPage=10000&include=suppliers,categoria`, { headers }).subscribe({
          next: (res: any) => {
            // Obtener productos desde la respuesta
            let productos = Array.isArray(res.data)
              ? res.data
              : Array.isArray(res.data?.data)
                ? res.data.data
                : Array.isArray(res)
                  ? res
                  : [];

            // Si hay paginación, cargar todas las páginas
            if (res.last_page && res.last_page > 1) {
              const requests = [];
              for (let page = 2; page <= res.last_page; page++) {
                requests.push(
                  this.http.get<any>(`${environment.apiUrl}/products?page=${page}&perPage=10000&include=suppliers,categoria`, { headers })
                );
              }

              // Esperar todas las peticiones usando forkJoin
              forkJoin(requests).subscribe({
                next: (responses: any[]) => {
                  responses.forEach((response: any) => {
                    const nuevos = Array.isArray(response.data)
                      ? response.data
                      : Array.isArray(response.data?.data)
                        ? response.data.data
                        : [];
                    productos = [...productos, ...nuevos];
                  });

                  // Filtrar solo productos que están en inventario
                  productos = productos.filter((p: any) => productosConStock.has(p.id));

                  console.log(`✅ Total productos en inventario cargados: ${productos.length}`);
                  console.log('📦 Productos con datos completos:', productos);
                  this.procesarProductos(productos, headers, inventarios);
                },
                error: (err) => {
                  console.error('Error cargando páginas adicionales:', err);
                  // Filtrar solo productos que están en inventario
                  productos = productos.filter((p: any) => productosConStock.has(p.id));
                  this.procesarProductos(productos, headers, inventarios);
                }
              });
            } else {
              // Filtrar solo productos que están en inventario
              productos = productos.filter((p: any) => productosConStock.has(p.id));
              console.log(`✅ Total productos en inventario cargados: ${productos.length}`);
              console.log('📦 Productos con datos completos:', productos);
              this.procesarProductos(productos, headers, inventarios);
            }
          },
          error: (err) => {
            console.error('Error generando informe de productos:', err);
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error obteniendo inventarios:', err);
        this.loading = false;
      }
    });
  }

  // Procesar productos (extraído para reutilizar)
  private procesarProductos(productos: any[], headers: HttpHeaders, inventarios: any[] = []): void {
    // ✅ Añadir proveedor sin alterar la lógica existente
    productos = productos.map((p: any) => ({
      ...p,
      proveedor:
        p.proveedor?.name ||
        p.supplier?.name ||
        (Array.isArray(p.suppliers) && p.suppliers.length > 0 ? p.suppliers[0]?.name : null) ||
        p.supplier_name ||
        p.provider?.name ||
        p.proveedor || // si viene como string
        'Sin proveedor'
    }));

    // Crear mapa de inventarios por producto para obtener stock, lotes y proveedores
    const inventariosPorProducto = new Map<number, any[]>();
    const proveedoresPorProducto = new Map<number, string>();

    inventarios.forEach((inv: any) => {
      const productId = inv.product_id || inv.product?.id;
      if (productId) {
        if (!inventariosPorProducto.has(productId)) {
          inventariosPorProducto.set(productId, []);
        }
        inventariosPorProducto.get(productId)!.push(inv);

        // Buscar proveedor en el inventario
        if (!proveedoresPorProducto.has(productId)) {
          const proveedorDesdeInv =
            inv.product?.supplier?.name ||
            (Array.isArray(inv.product?.suppliers) && inv.product.suppliers.length > 0 ? inv.product.suppliers[0]?.name : null) ||
            inv.supplier?.name ||
            inv.proveedor?.name ||
            (typeof inv.proveedor === 'string' ? inv.proveedor : null);

          if (proveedorDesdeInv) {
            proveedoresPorProducto.set(productId, proveedorDesdeInv);
          }
        }
      }
    });

    // Obtener entradas para mapear lotes y proveedores
    this.http.get<any>(`${environment.apiUrl}/entries`, { headers }).subscribe({
      next: (entradasRes: any) => {
        const entradas = Array.isArray(entradasRes?.data)
          ? entradasRes.data
          : Array.isArray(entradasRes)
            ? entradasRes
            : [];

        // Crear un mapa de lotes por producto (usar el primer lote encontrado)
        const lotesPorProducto = new Map<number, string>();
        entradas.forEach((entrada: any) => {
          const productId = entrada.product_id || entrada.product?.id;
          if (!productId) return;

          // Si el producto ya tiene un lote mapeado, no sobrescribir
          if (!lotesPorProducto.has(productId)) {
            const lot = String(entrada.lot || entrada.lote || entrada.batch || '').trim();
            if (lot && lot !== 'SIN_LOTE') {
              lotesPorProducto.set(productId, lot);
            }
          }

          // Buscar proveedor en las entradas si no se encontró antes
          if (!proveedoresPorProducto.has(productId)) {
            const proveedorDesdeEntrada =
              entrada.supplier?.name ||
              entrada.proveedor?.name ||
              (typeof entrada.proveedor === 'string' ? entrada.proveedor : null) ||
              entrada.product?.supplier?.name ||
              (Array.isArray(entrada.product?.suppliers) && entrada.product.suppliers.length > 0 ? entrada.product.suppliers[0]?.name : null);

            if (proveedorDesdeEntrada) {
              proveedoresPorProducto.set(productId, proveedorDesdeEntrada);
            }
          }
        });

        // ✅ Añadir proveedor, lote y stock desde inventario
        productos = productos.map((p: any) => {
          // Función auxiliar para limpiar texto
          const limpiar = (texto: any): string => {
            if (!texto) return '';
            let limpio = String(texto);
            limpio = limpio.replace(/>>>>>>>[^\n]*/g, '').replace(/<<<<<<<[^\n]*/g, '').replace(/=======[^\n]*/g, '');
            return limpio.trim().replace(/\s+/g, ' ');
          };

          // Mapear proveedor - buscar en múltiples fuentes
          let proveedorNombre =
            p.proveedor?.name ||
            p.supplier?.name ||
            (Array.isArray(p.suppliers) && p.suppliers.length > 0 ? p.suppliers[0]?.name : null) ||
            p.supplier_name ||
            p.provider?.name ||
            (typeof p.proveedor === 'string' ? p.proveedor : null);

          // Si no se encontró en el producto, buscar en el mapa de proveedores (desde inventarios/entradas)
          if (!proveedorNombre && proveedoresPorProducto.has(p.id)) {
            proveedorNombre = proveedoresPorProducto.get(p.id);
          }

          // Si aún no se encontró, buscar en inventarios del objeto producto
          if (!proveedorNombre && p.inventories && Array.isArray(p.inventories) && p.inventories.length > 0) {
            const firstInv = p.inventories[0];
            proveedorNombre =
              firstInv.product?.supplier?.name ||
              (Array.isArray(firstInv.product?.suppliers) && firstInv.product.suppliers.length > 0 ? firstInv.product.suppliers[0]?.name : null) ||
              firstInv.supplier?.name ||
              firstInv.proveedor?.name;
          }

          const proveedor = limpiar(proveedorNombre || 'Sin proveedor');

          // Obtener stock total desde inventarios
          const invsDelProducto = inventariosPorProducto.get(p.id) || [];
          const stockTotal = invsDelProducto.reduce((sum: number, inv: any) => {
            return sum + (Number(inv.stock_actual ?? inv.stock ?? 0) || 0);
          }, 0);

          // Mapear lote - buscar en diferentes lugares posibles
          let batch = p.batch || p.lote || null;
          if (batch) batch = limpiar(batch);

          // Si no hay lote en el producto, buscar en inventarios
          if (!batch && invsDelProducto.length > 0) {
            const firstInv = invsDelProducto[0];
            batch = limpiar(firstInv.lot || firstInv.batch || firstInv.lote || null);
          }

          // Si no hay lote en el producto, buscar en inventarios del objeto
          if (!batch) {
            // Si hay inventarios, tomar el primer lote
            if (p.inventories && Array.isArray(p.inventories) && p.inventories.length > 0) {
              const firstInventory = p.inventories[0];
              batch = limpiar(firstInventory.lot || firstInventory.batch || firstInventory.lote || null);
            }
            // Si hay lotes como relación
            if (!batch && p.lotes && Array.isArray(p.lotes) && p.lotes.length > 0) {
              batch = limpiar(p.lotes[0].batch || p.lotes[0].lot || p.lotes[0].lote || null);
            }
            // Si aún no hay lote, buscar en el mapa de entradas
            if (!batch && p.id && lotesPorProducto.has(p.id)) {
              batch = limpiar(lotesPorProducto.get(p.id) || null);
            }
          }

          return {
            ...p, // Incluir TODOS los datos del producto
            name: limpiar(p.name),
            codigo_de_barras: limpiar(p.codigo_de_barras || p.reference || ''),
            reference: limpiar(p.codigo_de_barras || p.reference || ''), // Mantener por compatibilidad
            proveedor,
            batch: batch || undefined, // Mantener undefined si no hay lote para que el valueAccessor lo maneje
            lote: batch || undefined,
            stock: stockTotal, // Agregar stock total
            categoria: p.categoria ? { ...p.categoria, name: limpiar(p.categoria.name) } : p.categoria
          };
        });

        // Aplicar filtros de búsqueda localmente
        const { search, lote, referencia } = this.filtrosProductos;

        if (search) {
          productos = productos.filter((p: any) =>
            p.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.reference?.toLowerCase().includes(search.toLowerCase())
          );
        }

        if (lote) {
          productos = productos.filter((p: any) => {
            const batchValue = p.batch || p.lote || '';
            return batchValue.toString().toLowerCase().includes(lote.toLowerCase());
          });
        }

        if (referencia) {
          productos = productos.filter((p: any) =>
            (p.codigo_de_barras || p.reference || '').toLowerCase().includes(referencia.toLowerCase())
          );
        }

        this.datos = productos;
        this.datosFiltrados = [...this.datos];
        console.log('Productos en inventario cargados:', productos);
        this.loading = false;
        this.updateSummaryMetrics();
      },
      error: (err) => {
        console.error('Error obteniendo entradas para lotes:', err);
        // Continuar sin los lotes de entradas
        this.procesarProductosSinLotes(productos);
      }
    });
  }

  // Procesar productos sin obtener lotes de entradas (fallback)
  private procesarProductosSinLotes(productos: any[]): void {
    productos = productos.map((p: any) => {
      // Función auxiliar para limpiar texto
      const limpiar = (texto: any): string => {
        if (!texto) return '';
        let limpio = String(texto);
        limpio = limpio.replace(/>>>>>>>[^\n]*/g, '').replace(/<<<<<<<[^\n]*/g, '').replace(/=======[^\n]*/g, '');
        return limpio.trim().replace(/\s+/g, ' ');
      };

      // Buscar proveedor en múltiples fuentes
      let proveedorNombre =
        p.proveedor?.name ||
        p.supplier?.name ||
        (Array.isArray(p.suppliers) && p.suppliers.length > 0 ? p.suppliers[0]?.name : null) ||
        p.supplier_name ||
        p.provider?.name ||
        (typeof p.proveedor === 'string' ? p.proveedor : null);

      // Si no se encontró, buscar en inventarios del objeto producto
      if (!proveedorNombre && p.inventories && Array.isArray(p.inventories) && p.inventories.length > 0) {
        const firstInv = p.inventories[0];
        proveedorNombre =
          firstInv.product?.supplier?.name ||
          (Array.isArray(firstInv.product?.suppliers) && firstInv.product.suppliers.length > 0 ? firstInv.product.suppliers[0]?.name : null) ||
          firstInv.supplier?.name ||
          firstInv.proveedor?.name;
      }

      const proveedor = limpiar(proveedorNombre || 'Sin proveedor');

      const batch = p.batch || p.lote || null;

      // Obtener stock desde inventarios si está disponible
      let stock = 0;
      if (p.inventories && Array.isArray(p.inventories)) {
        stock = p.inventories.reduce((sum: number, inv: any) => {
          return sum + (Number(inv.stock_actual ?? inv.stock ?? 0) || 0);
        }, 0);
      } else if (p.stock !== undefined) {
        stock = Number(p.stock) || 0;
      }

      return {
        ...p,
        proveedor,
        batch: batch || undefined,
        lote: batch || undefined,
        stock: stock
      };
    });

    this.datos = productos;
    this.datosFiltrados = [...this.datos];
    this.loading = false;
    this.updateSummaryMetrics();
  }

  // Generar informe de proveedores
  generarInformeProveedores(): void {
    this.suppliersService.getSuppliers().subscribe({
      next: (data: any) => {
        let proveedores = data.data || data;

        // Filtrar por búsqueda
        const search = this.filtrosProveedores.search.toLowerCase();
        if (search) {
          proveedores = proveedores.filter((p: any) =>
            p.name?.toLowerCase().includes(search) ||
            p.email?.toLowerCase().includes(search) ||
            p.phone?.includes(search)
          );
        }

        // Filtrar por fecha si existe created_at y hay rango
        const { fechaInicio, fechaFin } = this.filtrosProveedores;
        if (fechaInicio && fechaFin) {
          const from = new Date(fechaInicio);
          const to = new Date(fechaFin + 'T23:59:59');
          proveedores = proveedores.filter((p: any) => {
            const created = p.created_at ? new Date(p.created_at) : null;
            return created ? created >= from && created <= to : true;
          });
        }

        this.datos = proveedores;
        this.datosFiltrados = [...this.datos];
        console.log('Proveedores cargados:', proveedores);
        this.loading = false;
        this.updateSummaryMetrics();
      },
      error: (err) => {
        console.error('Error generando informe de proveedores:', err);
        this.loading = false;
      }
    });
  }

  // Generar informe de inventario
  // ✅ Generar informe de inventario con proveedor incluido
  generarInformeInventario(): void {
  const headers = this.getAuthHeaders();
  const { fechaInicio, fechaFin, lote: filtroLote } = (this.filtrosInventario as any) || {};
  // ✅ NO enviar filtros de fecha si no están especificados para obtener TODAS las entradas
  const params: any = {};
  // Solo agregar filtros si están definidos y no están vacíos
  if (fechaInicio && fechaInicio.trim() !== '') params.from = fechaInicio;
  if (fechaFin && fechaFin.trim() !== '') params.to = fechaFin;
  if (filtroLote && filtroLote.trim() !== '') params.lot = String(filtroLote).trim();

  // ======== 1️⃣ Obtener TODOS los inventarios sin límite ========
  // Primero obtener todos los inventarios sin paginación
  const paramsAll: any = {};
  if (fechaInicio && fechaInicio.trim() !== '') paramsAll.from = fechaInicio;
  if (fechaFin && fechaFin.trim() !== '') paramsAll.to = fechaFin;

  this.http.get(`${environment.apiUrl}/inventories`, { headers, params: paramsAll }).subscribe({
    next: (inventariosRes: any) => {
      const inventarios = Array.isArray(inventariosRes?.data)
        ? inventariosRes.data
        : Array.isArray(inventariosRes)
        ? inventariosRes
        : [];

      const rows = inventarios.map((inv: any) => {
        const name = inv.product?.name || inv.name || inv.producto || '';
        const codigoBarras = inv.product?.codigo_de_barras || inv.product?.reference || inv.codigo_de_barras || inv.reference || '';
        const reference = codigoBarras; // Mantener por compatibilidad
        const lote = String(inv.lot || inv.batch || 'SIN_LOTE').trim().toUpperCase();

        const proveedor =
          inv.product?.supplier?.name ||
          inv.proveedor ||
          inv.supplier?.name ||
          (inv.product?.suppliers?.length ? inv.product.suppliers[0].name : 'Sin proveedor');

        const entradas = Number(inv.total_entries ?? 0);
        const salidas = Number(inv.total_outputs ?? 0);
        let stockActual = Number(inv.stock_actual ?? inv.stock ?? entradas - salidas);
        if (isNaN(stockActual) || stockActual < 0) stockActual = 0;

        const stockMin = Number(inv.min_stock ?? inv.stock_minimo ?? 0);
        const createdAt = inv.created_at || inv.updated_at || null;

        return {
          id: inv.id,
          product_id: inv.product_id || inv.product?.id,
          name,
          codigo_de_barras: codigoBarras,
          reference,
          batch: lote,
          proveedor,
          entradas,
          salidas,
          stock: stockActual,
          quantity: stockActual,
          stock_minimo: stockMin,
          created_at: createdAt
        };
      });

      // ======== 2️⃣ Obtener TODAS las ENTRADAS ========
      this.http.get(`${environment.apiUrl}/entries`, { headers, params: paramsAll }).subscribe({
        next: (entradasRes: any) => {
          const entradasList = Array.isArray(entradasRes?.data)
            ? entradasRes.data
            : Array.isArray(entradasRes)
            ? entradasRes
            : [];

          const cleanCantidad = (val: any): number => {
            if (!val) return 0;
            const num = parseFloat(String(val).replace(/[^\d.,-]/g, '').replace(',', '.'));
            return isNaN(num) ? 0 : num;
          };

          const entradasMap = new Map<string, { cantidad: number; proveedor: string; historial: any[] }>();
          console.log('📥 Total de entradas recibidas:', entradasList.length);
          entradasList.forEach((e: any) => {
            const pid = e.product_id ?? e.product?.id ?? e.id ?? e.inventory?.product_id ?? 0;
            const lote = String(e.lote || e.lot || e.batch || 'SIN_LOTE').trim().toUpperCase();
            const key = `${pid}__${lote}`;
            const qty = cleanCantidad(e.cantidad ?? e.quantity ?? 0);
            const proveedor = e.supplier?.name || e.proveedor?.name || e.proveedor || e.supplier_name || 'Sin proveedor';
            const current = entradasMap.get(key);

            // Extraer fecha y usuario correctamente
            const fecha = e.created_at || e.date || e.fecha || e.entry_date || '';
            let usuario = 'N/A';
            if (e.user) {
              if (e.user.name && e.user.lastname) {
                usuario = `${e.user.name} ${e.user.lastname}`;
              } else if (e.user.name) {
                usuario = e.user.name;
              }
            } else if (e.usuario) {
              usuario = e.usuario;
            } else if (e.user_name) {
              usuario = e.user_name;
            }

            console.log(`📦 Entrada - Producto ID: ${pid}, Lote: ${lote}, Cantidad: ${qty}, Fecha: ${fecha}, Usuario: ${usuario}`);

            // Agregar al historial
            const historialEntry = {
              fecha: fecha,
              cantidad: qty,
              proveedor: proveedor,
              usuario: usuario
            };

            entradasMap.set(key, {
              cantidad: (current?.cantidad || 0) + qty,
              proveedor: proveedor || current?.proveedor || 'Sin proveedor',
              historial: [...(current?.historial || []), historialEntry]
            });
          });

          console.log('📊 Entradas agrupadas por producto+lote:', Array.from(entradasMap.entries()).map(([k, v]) => ({ key: k, total: v.cantidad, historial: v.historial.length })));

          // ======== 3️⃣ Obtener TODAS las SALIDAS ========
          this.http.get(`${environment.apiUrl}/outputs`, { headers, params: paramsAll }).subscribe({
            next: (salidasRes: any) => {
              const salidasList = Array.isArray(salidasRes?.data)
                ? salidasRes.data
                : Array.isArray(salidasRes)
                ? salidasRes
                : [];

              const salidasMap = new Map<string, { cantidad: number; historial: any[] }>();
              salidasList.forEach((s: any) => {
                const pid = s.product_id ?? s.product?.id ?? s.id ?? s.inventory?.product_id ?? 0;
                const lote = String(s.lote || s.lot || s.batch || 'SIN_LOTE').trim().toUpperCase();
                const key = `${pid}__${lote}`;
                const qty = cleanCantidad(s.cantidad ?? s.quantity ?? 0);
                const current = salidasMap.get(key);

                // Extraer fecha y usuario correctamente
                const fecha = s.created_at || s.date || s.fecha || s.output_date || '';
                let usuario = 'N/A';
                if (s.user) {
                  if (s.user.name && s.user.lastname) {
                    usuario = `${s.user.name} ${s.user.lastname}`;
                  } else if (s.user.name) {
                    usuario = s.user.name;
                  }
                } else if (s.usuario) {
                  usuario = s.usuario;
                } else if (s.user_name) {
                  usuario = s.user_name;
                }

                // Agregar al historial
                const historialSalida = {
                  fecha: fecha,
                  cantidad: qty,
                  motivo: s.motivo || s.reason || 'N/A',
                  usuario: usuario
                };

                salidasMap.set(key, {
                  cantidad: (current?.cantidad || 0) + qty,
                  historial: [...(current?.historial || []), historialSalida]
                });
              });

              // ======== 4️⃣ Agrupar por código de barras y procesar lotes ========
              // Primero, crear un mapa de productos agrupados por código de barras
              const productosMap = new Map<string, {
                product_id: number;
                name: string;
                codigo_de_barras: string;
                reference: string;
                proveedor: string;
                stock_minimo: number;
                lotes: Array<{
                  batch: string;
                  entradas: number;
                  salidas: number;
                  stock: number;
                  fecha: string;
                  historialEntradas: any[];
                  historialSalidas: any[];
                }>;
              }>();

              // Procesar cada fila de inventario
              rows.forEach((r: any) => {
                const key = `${r.product_id}__${r.batch}`;
                const entradaData = entradasMap.get(key);
                const salidaData = salidasMap.get(key);

                const entradas = entradaData?.cantidad ?? 0;
                const salidas = salidaData?.cantidad ?? 0;
                const proveedor = entradaData?.proveedor ?? r.proveedor ?? 'Sin proveedor';

                const historialEntradas = entradaData?.historial || [];
                const historialSalidas = salidaData?.historial || [];

                // Obtener la fecha más reciente de entrada para este lote
                const fechaEntrada = historialEntradas.length > 0
                  ? historialEntradas.sort((a: any, b: any) =>
                      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
                    )[0].fecha
                  : r.created_at || 'N/A';

                let stock = Number(r.stock ?? 0);
                if (!Number.isFinite(stock) || stock <= 0) {
                  stock = entradas - salidas;
                }
                if (stock < 0) stock = 0;

                const stockMin = Number(r.stock_minimo ?? 0);

                // Usar código de barras como clave de agrupación, si no hay usar product_id
                const codigoBarras = r.codigo_de_barras || r.reference || `PROD_${r.product_id}`;
                const agrupacionKey = codigoBarras || `PROD_${r.product_id}`;

                // Si el producto no existe en el mapa, crearlo
                if (!productosMap.has(agrupacionKey)) {
                  productosMap.set(agrupacionKey, {
                    product_id: r.product_id,
                    name: r.name,
                    codigo_de_barras: codigoBarras,
                    reference: r.reference || codigoBarras,
                    proveedor: proveedor,
                    stock_minimo: stockMin,
                    lotes: []
                  });
                }

                const producto = productosMap.get(agrupacionKey)!;

                // Agregar el lote a este producto
                producto.lotes.push({
                  batch: r.batch,
                  entradas: Math.round(entradas),
                  salidas: Math.round(salidas),
                  stock: Math.round(stock),
                  fecha: fechaEntrada,
                  historialEntradas: historialEntradas.sort((a: any, b: any) =>
                    new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
                  ),
                  historialSalidas: historialSalidas.sort((a: any, b: any) =>
                    new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
                  )
                });
              });

              // Convertir el mapa a array y calcular totales
              const merged = Array.from(productosMap.values()).map((producto: any) => {
                // Calcular totales del producto
                const totalEntradas = producto.lotes.reduce((sum: number, lote: any) => sum + lote.entradas, 0);
                const totalSalidas = producto.lotes.reduce((sum: number, lote: any) => sum + lote.salidas, 0);
                const totalStock = producto.lotes.reduce((sum: number, lote: any) => sum + lote.stock, 0);

                // Calcular el estado del producto basado en el stock total
                let estado = 'Disponible';
                if (totalStock === 0) {
                  estado = 'Crítico';
                } else if (producto.stock_minimo > 0 && totalStock < producto.stock_minimo) {
                  estado = 'Bajo';
                } else {
                  estado = 'Disponible';
                }

                // Ordenar lotes por fecha (más reciente primero)
                producto.lotes.sort((a: any, b: any) =>
                  new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
                );

                return {
                  ...producto,
                  entradas: totalEntradas,
                  salidas: totalSalidas,
                  stock: totalStock,
                  quantity: totalStock,
                  estado: estado,
                  isGrouped: true // Flag para identificar que es un producto agrupado
                };
              });

              // ======== 5️⃣ Aplicar filtros ========
              let inventarioFiltrado = merged;
              const { producto, lote, stockMinimo, mostrarAgotados } = this.filtrosInventario as any;

              if (producto) {
                const q = producto.toLowerCase();
                inventarioFiltrado = inventarioFiltrado.filter((i: any) =>
                  (i.name || '').toLowerCase().includes(q)
                );
              }
              if (lote) {
                const ql = lote.trim().toUpperCase();
                // Filtrar por lote en los lotes del producto
                inventarioFiltrado = inventarioFiltrado.filter((i: any) => {
                  if (i.lotes && Array.isArray(i.lotes)) {
                    return i.lotes.some((l: any) =>
                      String(l.batch || '').toUpperCase().includes(ql)
                    );
                  }
                  return false;
                });
              }
              if (stockMinimo) {
                const min = Number(stockMinimo);
                inventarioFiltrado = inventarioFiltrado.filter((i: any) => i.stock <= min);
              }
              if (mostrarAgotados) {
                inventarioFiltrado = inventarioFiltrado.filter((i: any) => i.stock <= 0);
              }

              // ======== 6️⃣ Asignar resultados ========
              this.datos = inventarioFiltrado;
              this.datosFiltrados = [...inventarioFiltrado];
              console.log('✅ Inventario fusionado con proveedor:', inventarioFiltrado);
              this.loading = false;
              this.updateSummaryMetrics();
            },
            error: (err) => {
              console.error('Error cargando salidas:', err);
              this.datos = rows;
              this.datosFiltrados = [...rows];
              this.loading = false;
              this.updateSummaryMetrics();
            }
          });
        },
        error: (err) => {
          console.error('Error cargando entradas:', err);
          this.datos = rows;
          this.datosFiltrados = [...rows];
          this.loading = false;
          this.updateSummaryMetrics();
        }
      });
    },
    error: (err) => {
      console.error('Error cargando inventarios:', err);
      this.loading = false;
      this.updateSummaryMetrics();
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

  // Exportar a PDF
  exportarPDF(): void {
    // Si es inventario, mostrar modal de confirmación
    if (this.tipoInforme === 'inventario') {
      this.mostrarModalPDF = true;
      this.tipoExportacionPDF = 'inventario';
      return;
    }

    // Para otros tipos de informe, generar PDF normal directamente
    this.generarPDFNormal();
  }

  // Confirmar exportación PDF con historial
  confirmarPDFConHistorial(): void {
    this.mostrarModalPDF = false;
    this.generarPDFInventario(true);
  }

  // Confirmar exportación PDF sin historial
  confirmarPDFSinHistorial(): void {
    this.mostrarModalPDF = false;
    this.generarPDFInventario(false);
  }

  // Cancelar exportación PDF
  cancelarPDF(): void {
    this.mostrarModalPDF = false;
    this.tipoExportacionPDF = '';
  }

  // Generar PDF normal (sin historial)
  private generarPDFNormal(): void {
    try {
      const doc = new jsPDF();

      // Si es productos, usar formato mejorado
      if (this.tipoInforme === 'productos') {
        this.generarPDFProductos(doc);
        return;
      }

      // Título
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Informe de ${this.getTituloInforme()}`, 14, 15);

      // Fecha de generación
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const fecha = this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm');
      doc.text(`Generado el: ${fecha}`, 14, 25);

      const { headers, rows } = this.generateTabularData();
      const startY = 35;

      // Verificar que autoTable esté disponible
      if (typeof (doc as any).autoTable === 'function') {
        (doc as any).autoTable({
          head: [headers],
          body: rows,
          startY,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] },
          alternateRowStyles: { fillColor: [248, 250, 252] }
        });
      } else {
        // Fallback: crear tabla manualmente si autoTable no está disponible
        console.warn('autoTable no está disponible, creando tabla manualmente');
        this.crearTablaPDFManual(doc, [headers, ...rows], startY);
      }

      doc.save(`informe_${this.tipoInforme}_${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor, verifica la consola para más detalles.');
    }
  }

  // Generar PDF mejorado para productos
  private generarPDFProductos(doc: jsPDF): void {
    // Encabezado con estilo profesional
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 210, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORME DE PRODUCTOS EN INVENTARIO', 105, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const fecha = this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm');
    doc.text(`Generado el: ${fecha}`, 105, 22, { align: 'center' });

    // Información del informe
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text(`Total de productos: ${this.datosFiltrados.length}`, 14, 38);

    const { headers, rows } = this.generateTabularData();
    const startY = 45;

    // Tabla profesional con autoTable
    if (typeof (doc as any).autoTable === 'function') {
      (doc as any).autoTable({
        head: [headers],
        body: rows,
        startY,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' }, // ID
          1: { cellWidth: 50 }, // Nombre
          2: { cellWidth: 40 }, // Proveedor
          3: { cellWidth: 35 }, // Código de barras
          4: { cellWidth: 25, halign: 'center' }, // Lote
          5: { cellWidth: 30 }, // Categoría
          6: { cellWidth: 40, halign: 'center' } // Fecha
        },
        margin: { top: startY, left: 14, right: 14 },
        tableWidth: 'wrap'
      });

      // Pie de página
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('Este informe contiene únicamente productos con stock disponible en inventario.', 105, finalY, { align: 'center' });
    } else {
      this.crearTablaPDFManual(doc, [headers, ...rows], startY);
    }

    doc.save(`informe_productos_inventario_${Date.now()}.pdf`);
  }

  // Generar PDF de inventario con o sin historial
  private generarPDFInventario(incluirHistorial: boolean): void {
    try {
      const doc = new jsPDF();

      // Título
      doc.setFontSize(16);
      doc.text(`Informe de Inventario${incluirHistorial ? ' con Historial' : ''}`, 14, 15);

      // Fecha de generación
      doc.setFontSize(10);
      const fecha = this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm');
      doc.text(`Generado el: ${fecha}`, 14, 25);

      let y = 35;

      if (!incluirHistorial) {
        // PDF sin historial - solo tabla resumida
        const rows: any[] = [];
        rows.push(['Producto', 'Proveedor', 'Referencia', 'Lote/Batch', 'Entradas', 'Salidas', 'Stock Actual', 'Stock Mínimo', 'Estado']);

        this.datosFiltrados.forEach((i: any) => {
          rows.push([
            i.name || i.producto || '',
            i.proveedor || 'Sin proveedor',
            i.reference || i.referencia || '',
            i.batch || i.lote || '',
            i.entradas || 0,
            i.salidas || 0,
            i.quantity || i.stock || 0,
            i.stock_minimo || 0,
            i.estado || 'N/A'
          ]);
        });

        if (typeof (doc as any).autoTable === 'function') {
          (doc as any).autoTable({
            head: [rows[0]],
            body: rows.slice(1),
            startY: y,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [59, 130, 246] },
            alternateRowStyles: { fillColor: [248, 250, 252] }
          });
        } else {
          this.crearTablaPDFManual(doc, rows, y);
        }
      } else {
        // PDF con historial completo (agrupado por producto y detallado por lote)
        this.datosFiltrados.forEach((item: any, index: number) => {
          // Verificar si necesitamos nueva página
          if (y > 250) {
            doc.addPage();
            y = 20;
          }

          // Información del producto
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(`${item.name || item.producto || 'Producto'}`, 14, y);
          y += 8;

          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(`Proveedor: ${item.proveedor || 'Sin proveedor'} | Referencia: ${item.reference || item.referencia || 'N/A'} | Stock Total: ${item.stock || item.quantity || 0} | Estado: ${item.estado || 'N/A'}`, 14, y);
          y += 10;

          // Listado de lotes del producto
          if (item.lotes && item.lotes.length > 0) {
            // Tabla resumen de lotes
            const lotesRows: any[] = [['Lote/Batch', 'Entradas', 'Salidas', 'Stock', 'Fecha última entrada']];
            item.lotes.forEach((lote: any) => {
              lotesRows.push([
                lote.batch || 'SIN_LOTE',
                lote.entradas?.toString() || '0',
                lote.salidas?.toString() || '0',
                lote.stock?.toString() || '0',
                this.formatearFecha(lote.fecha)
              ]);
            });

            if (typeof (doc as any).autoTable === 'function') {
              (doc as any).autoTable({
                head: [lotesRows[0]],
                body: lotesRows.slice(1),
                startY: y,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [59, 130, 246] },
                alternateRowStyles: { fillColor: [248, 250, 252] }
              });
              y = (doc as any).lastAutoTable.finalY + 8;
            } else {
              y = this.crearTablaPDFManual(doc, lotesRows, y) + 8;
            }

            // Detalle por cada lote con historial
            item.lotes.forEach((lote: any) => {
              if (y > 250) {
                doc.addPage();
                y = 20;
              }
              doc.setFont('helvetica', 'bold');
              doc.text(`Lote: ${lote.batch || 'SIN_LOTE'}`, 14, y);
              y += 6;

              // Historial de entradas del lote
              if (lote.historialEntradas && lote.historialEntradas.length > 0) {
                const entradasRows: any[] = [['Fecha', 'Cantidad', 'Proveedor', 'Usuario']];
                lote.historialEntradas.forEach((entrada: any) => {
                  entradasRows.push([
                    this.formatearFecha(entrada.fecha),
                    entrada.cantidad.toString(),
                    entrada.proveedor || 'N/A',
                    entrada.usuario || 'N/A'
                  ]);
                });
                if (typeof (doc as any).autoTable === 'function') {
                  (doc as any).autoTable({
                    head: [entradasRows[0]],
                    body: entradasRows.slice(1),
                    startY: y,
                    margin: { left: 14, right: 14 },
                    styles: { fontSize: 7, cellPadding: 1 },
                    headStyles: { fillColor: [34, 197, 94] },
                    alternateRowStyles: { fillColor: [248, 250, 252] }
                  });
                  y = (doc as any).lastAutoTable.finalY + 6;
                } else {
                  y = this.crearTablaPDFManual(doc, entradasRows, y) + 6;
                }
              }

              // Historial de salidas del lote
              if (lote.historialSalidas && lote.historialSalidas.length > 0) {
                const salidasRows: any[] = [['Fecha', 'Cantidad', 'Motivo', 'Usuario']];
                lote.historialSalidas.forEach((salida: any) => {
                  salidasRows.push([
                    this.formatearFecha(salida.fecha),
                    salida.cantidad.toString(),
                    salida.motivo || 'N/A',
                    salida.usuario || 'N/A'
                  ]);
                });
                if (typeof (doc as any).autoTable === 'function') {
                  (doc as any).autoTable({
                    head: [salidasRows[0]],
                    body: salidasRows.slice(1),
                    startY: y,
                    margin: { left: 14, right: 14 },
                    styles: { fontSize: 7, cellPadding: 1 },
                    headStyles: { fillColor: [239, 68, 68] },
                    alternateRowStyles: { fillColor: [248, 250, 252] }
                  });
                  y = (doc as any).lastAutoTable.finalY + 10;
                } else {
                  y = this.crearTablaPDFManual(doc, salidasRows, y) + 10;
                }
              }
            });
          } else {
            doc.setFont('helvetica', 'italic');
            doc.text('No hay lotes registrados para este producto.', 14, y);
            y += 10;
          }

          // Separador entre productos
          if (index < this.datosFiltrados.length - 1) {
            doc.setDrawColor(200, 200, 200);
            doc.line(14, y, 196, y);
            y += 10;
          }
        });
      }

      doc.save(`informe_inventario${incluirHistorial ? '_con_historial' : ''}_${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF de inventario:', error);
      alert('Error al generar el PDF. Por favor, verifica la consola para más detalles.');
    }
  }

  // Método auxiliar para crear tabla PDF manualmente si autoTable falla
  private crearTablaPDFManual(doc: jsPDF, rows: any[], startY: number): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const tableWidth = pageWidth - (margin * 2);
    const colCount = rows[0].length;
    const colWidth = tableWidth / colCount;
    let currentY = startY;

    // Encabezados
    doc.setFillColor(59, 130, 246);
    doc.rect(margin, currentY, tableWidth, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    rows[0].forEach((header: string, index: number) => {
      doc.text(header.toString(), margin + (index * colWidth) + 2, currentY + 7);
    });

currentY += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    // Filas de datos
    rows.slice(1).forEach((row: any[], rowIndex: number) => {
      if (currentY > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        currentY = 20;
      }

      const fillColor = rowIndex % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
      doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
      doc.rect(margin, currentY, tableWidth, 8, 'F');

      row.forEach((cell: any, colIndex: number) => {
        doc.text(cell?.toString() || '', margin + (colIndex * colWidth) + 2, currentY + 6);
      });

      currentY += 8;
    });

    return currentY;
  }

  // Exportar a Excel
  exportarExcel(): void {
    const columns = this.currentColumns.filter((col) => col.export !== false);

    // Si es productos, crear formato mejorado
    if (this.tipoInforme === 'productos') {
      this.exportarExcelProductos(columns);
      return;
    }

    // Si es inventario, crear formato mejorado con historial
    if (this.tipoInforme === 'inventario') {
      this.exportarExcelInventario(columns);
      return;
    }

    const dataset = this.datosFiltrados.map((row) => {
      const record: any = {};
      columns.forEach((col) => {
        record[col.label] = this.getExportValue(col, row);
      });
      return record;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataset);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
    XLSX.writeFile(workbook, `informe_${this.tipoInforme}_${Date.now()}.xlsx`);
  }

  // Exportar Excel mejorado para productos
  private exportarExcelProductos(columns: ReportColumn[]): void {
    const workbook = XLSX.utils.book_new();

    // Crear hoja de datos
    const dataset = this.datosFiltrados.map((row) => {
      const record: any = {};
      columns.forEach((col) => {
        record[col.label] = this.getExportValue(col, row);
      });
      return record;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataset);

    // Ajustar ancho de columnas
    const colWidths = columns.map((col, index) => {
      const maxLength = Math.max(
        col.label.length,
        ...this.datosFiltrados.map(row => {
          const value = this.getExportValue(col, row);
          return value ? value.toString().length : 0;
        })
      );
      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
    });
    worksheet['!cols'] = colWidths;

    // Agregar información del informe en la primera fila
    const fecha = this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm');
    XLSX.utils.sheet_add_aoa(worksheet, [
      ['INFORME DE PRODUCTOS EN INVENTARIO'],
      [`Generado el: ${fecha}`],
      [`Total de productos: ${this.datosFiltrados.length}`],
      [] // Fila vacía
    ], { origin: 'A1' });

    // Mover los datos hacia abajo
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    range.s.r = 3; // Empezar desde la fila 4
    worksheet['!ref'] = XLSX.utils.encode_range(range);

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');
    XLSX.writeFile(workbook, `informe_productos_inventario_${Date.now()}.xlsx`);
  }

  // Exportar a Word (CSV como Word)
  exportarWord(): void {
    // Si es productos, crear formato mejorado
    if (this.tipoInforme === 'productos') {
      this.exportarWordProductos();
      return;
    }

    // Si es inventario, crear formato mejorado con historial
    if (this.tipoInforme === 'inventario') {
      this.exportarWordInventario();
      return;
    }

    // Crear contenido HTML
    let html = '<html><head><meta charset="UTF-8"><title>Informe</title></head><body>';
    html += `<h1>Informe de ${this.getTituloInforme()}</h1>`;
    html += `<p>Generado el: ${this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm')}</p>`;
    html += '<table border="1">';

    // Headers
    html += '<tr>';
    const headers = this.currentColumns.filter((col) => col.export !== false).map((col) => col.label);
    headers.forEach(h => html += `<th>${h}</th>`);
    html += '</tr>';

    // Rows
    this.datosFiltrados.forEach((row: any) => {
      html += '<tr>';
      this.currentColumns.filter((col) => col.export !== false).forEach((col) => {
        html += `<td>${this.getExportValue(col, row) || ''}</td>`;
      });
      html += '</tr>';
    });

    html += '</table></body></html>';

    // Descargar como .doc
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    saveAs(blob, `informe_${this.tipoInforme}_${Date.now()}.doc`);
  }

  // Exportar Word mejorado para productos
  private exportarWordProductos(): void {
    const fecha = this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm');
    const columns = this.currentColumns.filter((col) => col.export !== false);

    // Crear contenido HTML profesional
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Informe de Productos en Inventario</title>
      <style>
        body {
          font-family: 'Calibri', Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          background-color: #3b82f6;
          color: white;
          padding: 20px;
          text-align: center;
          margin-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .info {
          margin-bottom: 20px;
          padding: 10px;
          background-color: #f3f4f6;
          border-left: 4px solid #3b82f6;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 11px;
        }
        th {
          background-color: #1e40af;
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-weight: bold;
          border: 1px solid #1e3a8a;
        }
        td {
          padding: 10px 8px;
          border: 1px solid #d1d5db;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        tr:hover {
          background-color: #f3f4f6;
        }
        .footer {
          margin-top: 30px;
          padding: 10px;
          font-size: 10px;
          color: #6b7280;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>INFORME DE PRODUCTOS EN INVENTARIO</h1>
      </div>
      <div class="info">
        <strong>Generado el:</strong> ${fecha}<br>
        <strong>Total de productos:</strong> ${this.datosFiltrados.length}
      </div>
      <table>
        <thead>
          <tr>
    `;

    // Headers
    columns.forEach(col => {
      html += `<th>${col.label}</th>`;
    });
    html += `</tr></thead><tbody>`;

    // Rows
    this.datosFiltrados.forEach((row: any, index: number) => {
      html += '<tr>';
      columns.forEach((col) => {
        const value = this.getExportValue(col, row) || '';
        html += `<td>${this.escapeHtml(value.toString())}</td>`;
      });
      html += '</tr>';
    });

    html += `
        </tbody>
      </table>
      <div class="footer">
        Este informe contiene únicamente productos con stock disponible en inventario.
      </div>
    </body>
    </html>`;

    // Descargar como .doc
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    saveAs(blob, `informe_productos_inventario_${Date.now()}.doc`);
  }

  // Helper para escapar HTML
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  // Helpers
  getTituloInforme(): string {
    return this.currentReportMeta?.title || '';
  }

  // Normalizar fecha para DatePipe
  normalizarFecha(fecha: any): Date | null {
    if (!fecha) return null;

    // Si ya es un objeto Date
    if (fecha instanceof Date) return fecha;

    // Si es un string, intentar parsearlo
    if (typeof fecha === 'string') {
      // Si viene en formato dd/MM/yyyy o dd/MM/yyyy HH:mm
      if (fecha.includes('/')) {
        const partes = fecha.split(' ');
        const fechaPart = partes[0].split('/');
        if (fechaPart.length === 3) {
          const dia = parseInt(fechaPart[0], 10);
          const mes = parseInt(fechaPart[1], 10) - 1; // Los meses son 0-indexed
          const año = parseInt(fechaPart[2], 10);

          if (partes[1]) {
            // Tiene hora
            const horaPart = partes[1].split(':');
            const hora = parseInt(horaPart[0], 10) || 0;
            const minuto = parseInt(horaPart[1], 10) || 0;
            return new Date(año, mes, dia, hora, minuto);
          } else {
            return new Date(año, mes, dia);
          }
        }
      }

      // Intentar parsear como ISO o formato estándar
      const parsed = new Date(fecha);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return null;
  }

  // Formatear fecha para mostrar
  formatearFecha(fecha: any): string {
    const fechaNormalizada = this.normalizarFecha(fecha);
    if (!fechaNormalizada) return fecha || 'N/A';
    return this.datePipe.transform(fechaNormalizada, 'dd/MM/yyyy HH:mm') || fecha || 'N/A';
  }

  // Toggle historial expandido
  toggleHistorial(productId: number, batch: string): void {
    const key = `${productId}_${batch}`;
    this.historialExpandido[key] = !this.historialExpandido[key];
  }

  isHistorialExpandido(productId: number, batch: string): boolean {
    const key = `${productId}_${batch}`;
    return this.historialExpandido[key] || false;
  }

  // Abrir modal de detalles del producto
  abrirModalDetalleProducto(producto: any): void {
    this.productoSeleccionado = producto;
    this.mostrarModalDetalleProducto = true;
  }

  // Cerrar modal de detalles del producto
  cerrarModalDetalleProducto(): void {
    this.mostrarModalDetalleProducto = false;
    this.productoSeleccionado = null;
  }

  // Verificar si el producto tiene historial
  tieneHistorial(producto: any): boolean {
    if (!producto.lotes || !Array.isArray(producto.lotes)) return false;
    return producto.lotes.some((lote: any) =>
      lote.historial && Array.isArray(lote.historial) && lote.historial.length > 0
    );
  }

  getRowData(row: any): any[] {
    return this.currentColumns
      .filter((col) => col.export !== false)
      .map((col) => this.getExportValue(col, row));
  }

  private applyReportConfig(): void {
    const config = this.reportConfigs[this.tipoInforme];
    if (config) {
      this.currentReportMeta = config;
      this.currentColumns = [...config.columns];
    }
  }

  private getColumnRawValue(column: ReportColumn, row: any): any {
    if (column.valueAccessor) {
      return column.valueAccessor(row);
    }

    if (!column.key) {
      return '';
    }

    if (column.key.includes('.')) {
      return column.key.split('.').reduce((acc: any, part: string) => (acc ? acc[part] : undefined), row);
    }

    return row[column.key];
  }

  // Limpiar texto de conflictos de Git y otros caracteres no deseados
  private limpiarTexto(texto: any): string {
    if (!texto) return '';
    let textoLimpio = String(texto);

    // Eliminar marcadores de conflicto de Git
    textoLimpio = textoLimpio.replace(/>>>>>>>[^\n]*/g, '');
    textoLimpio = textoLimpio.replace(/<<<<<<<[^\n]*/g, '');
    textoLimpio = textoLimpio.replace(/=======[^\n]*/g, '');

    // Eliminar espacios múltiples y saltos de línea al inicio/final
    textoLimpio = textoLimpio.trim();

    // Eliminar espacios múltiples
    textoLimpio = textoLimpio.replace(/\s+/g, ' ');

    return textoLimpio;
  }

  getCellDisplayValue(column: ReportColumn, row: any): string {
    const raw = this.getColumnRawValue(column, row);

    if (raw === null || raw === undefined || raw === '') {
      return '—';
    }

    let valor: string;
    switch (column.type) {
      case 'date':
        valor = this.formatearFecha(raw);
        break;
      case 'number':
        valor = Number(raw).toLocaleString();
        break;
      case 'badge':
        if (column.badgeLabels && column.badgeLabels[raw]) {
          valor = column.badgeLabels[raw];
        } else {
          valor = raw.toString();
        }
        break;
      default:
        valor = raw.toString();
    }

    // Limpiar el valor antes de retornarlo
    return this.limpiarTexto(valor);
  }

  private getExportValue(column: ReportColumn, row: any): string {
    const raw = this.getColumnRawValue(column, row);
    if (raw === null || raw === undefined || raw === '') {
      return '';
    }
    let valor: string;
    switch (column.type) {
      case 'date':
        valor = this.formatearFecha(raw);
        break;
      case 'number':
        valor = Number(raw).toLocaleString();
        break;
      default:
        valor = raw.toString();
    }

    // Limpiar el valor antes de retornarlo para exportación
    return this.limpiarTexto(valor);
  }

  getColumnAlignment(column: ReportColumn): string {
    switch (column.align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  }

  getBadgeClass(column: ReportColumn, row: any): string {
    const raw = this.getColumnRawValue(column, row);
    if (!column.badgeVariants || raw === undefined || raw === null) {
      return 'badge';
    }

    const key = raw.toString();
    const variantClass = column.badgeVariants[key];
    return variantClass ? `badge ${variantClass}` : 'badge';
  }

  private generateTabularData(columns: ReportColumn[] = this.currentColumns.filter((col) => col.export !== false)) {
    const headers = columns.map((col) => col.label);
    const rows = this.datosFiltrados.map((row) =>
      columns.map((col) => this.getExportValue(col, row))
    );
    return { headers, rows };
  }

  private updateSummaryMetrics(): void {
    const data = this.datosFiltrados || [];
    if (!data.length) {
      this.summaryMetrics = [];
      return;
    }

    switch (this.tipoInforme) {
      case 'productos': {
        const total = data.length;
        const conProveedor = data.filter((item: any) => !!(item.proveedor && item.proveedor !== 'Sin proveedor')).length;
        const sinCategoria = data.filter((item: any) => !item.categoria?.name).length;
        const expirados = data.filter((item: any) => {
          if (!item.expiration_date) return false;
          const fecha = this.normalizarFecha(item.expiration_date);
          return fecha ? fecha < new Date() : false;
        }).length;

        this.summaryMetrics = [
          {
            label: 'Productos listados',
            value: total.toLocaleString(),
            icon: 'fa-layer-group',
            accent: 'primary',
            helper: `${conProveedor} con proveedor asignado`
          },
          {
            label: 'Sin categoría',
            value: sinCategoria.toLocaleString(),
            icon: 'fa-tags',
            accent: 'warning',
            helper: sinCategoria > 0 ? 'Revisa y categoriza estos productos' : 'Todos los productos tienen categoría'
          },
          {
            label: 'Caducados',
            value: expirados.toLocaleString(),
            icon: 'fa-hourglass-end',
            accent: 'danger',
            helper: expirados > 0 ? 'Productos con fecha vencida' : 'No hay productos vencidos'
          }
        ];
        break;
      }
      case 'proveedores': {
        const total = data.length;
        const conEmail = data.filter((item: any) => !!item.email).length;
        const conTelefono = data.filter((item: any) => !!item.phone).length;

        this.summaryMetrics = [
          {
            label: 'Proveedores activos',
            value: total.toLocaleString(),
            icon: 'fa-people-carry-box',
            accent: 'primary',
            helper: `${conEmail} con correo electrónico`
          },
          {
            label: 'Contacto telefónico',
            value: conTelefono.toLocaleString(),
            icon: 'fa-square-phone',
            accent: 'success',
            helper: conTelefono > 0 ? 'Disponibles para contacto directo' : 'Agrega teléfonos para agilizar seguimiento'
          },
          {
            label: 'Sin correo',
            value: (total - conEmail).toLocaleString(),
            icon: 'fa-envelope-open-text',
            accent: 'warning',
            helper: 'Considera solicitar información de contacto'
          }
        ];
        break;
      }
      case 'alertas': {
        const total = data.length;
        const pendientes = data.filter((item: any) => item.status === 'pendiente').length;
        const resueltas = data.filter((item: any) => item.status === 'resuelta').length;
        const altas = data.filter((item: any) => item.priority === 'alta').length;

        this.summaryMetrics = [
          {
            label: 'Alertas activas',
            value: pendientes.toLocaleString(),
            icon: 'fa-bell',
            accent: 'danger',
            helper: `${total.toLocaleString()} alertas en total`
          },
          {
            label: 'Resueltas',
            value: resueltas.toLocaleString(),
            icon: 'fa-circle-check',
            accent: 'success',
            helper: resueltas > 0 ? 'Buen trabajo resolviendo incidencias' : 'Aún no hay alertas resueltas'
          },
          {
            label: 'Prioridad alta',
            value: altas.toLocaleString(),
            icon: 'fa-triangle-exclamation',
            accent: 'warning',
            helper: 'Atiende estas alertas primero'
          }
        ];
        break;
      }
      case 'inventario': {
        const totalProductos = data.length;
        const stockTotal = data.reduce((acc: number, item: any) => acc + (Number(item.stock ?? item.quantity ?? 0) || 0), 0);
        const criticos = data.filter((item: any) => item.estado === 'Crítico' || Number(item.stock ?? 0) <= 0).length;
        const lotes = data.reduce((acc: number, item: any) => acc + (Array.isArray(item.lotes) ? item.lotes.length : 0), 0);

        this.summaryMetrics = [
          {
            label: 'Productos monitoreados',
            value: totalProductos.toLocaleString(),
            icon: 'fa-warehouse',
            accent: 'primary',
            helper: `${lotes.toLocaleString()} lotes vinculados`
          },
          {
            label: 'Stock disponible',
            value: stockTotal.toLocaleString(),
            icon: 'fa-box-open',
            accent: 'success',
            helper: 'Inventario total sumando todas las unidades'
          },
          {
            label: 'Productos críticos',
            value: criticos.toLocaleString(),
            icon: 'fa-temperature-arrow-down',
            accent: 'danger',
            helper: criticos > 0 ? 'Reabastece o revisa estos ítems' : 'Sin productos críticos'
          }
        ];
        break;
      }
      default:
        this.summaryMetrics = [];
    }
  }

  // Exportar Excel mejorado para inventario con historial
  private exportarExcelInventario(columns: ReportColumn[]): void {
    const workbook = XLSX.utils.book_new();

    // Crear hoja principal de inventario
    const datosInventario: any[][] = [];

    // Encabezados
    const headers = ['Producto', 'Lote', 'Stock', 'Stock Mínimo', 'Ubicación', 'Estado'];
    datosInventario.push(headers);

    // Datos de productos y lotes
    this.datosFiltrados.forEach((producto: any) => {
      if (Array.isArray(producto.lotes) && producto.lotes.length > 0) {
        producto.lotes.forEach((lote: any) => {
          datosInventario.push([
            producto.name || 'N/A',
            lote.batch || 'N/A',
            lote.stock || 0,
            producto.min_stock || 0,
            producto.ubicacion_interna || 'N/A',
            lote.estado || 'Normal'
          ]);
        });
      } else {
        datosInventario.push([
          producto.name || 'N/A',
          'Sin lote',
          producto.stock || 0,
          producto.min_stock || 0,
          producto.ubicacion_interna || 'N/A',
          producto.estado || 'Normal'
        ]);
      }
    });

    const wsInventario = XLSX.utils.aoa_to_sheet(datosInventario);

    // Ajustar ancho de columnas
    wsInventario['!cols'] = [
      { wch: 30 }, // Producto
      { wch: 15 }, // Lote
      { wch: 10 }, // Stock
      { wch: 12 }, // Stock Mínimo
      { wch: 20 }, // Ubicación
      { wch: 12 }  // Estado
    ];

    XLSX.utils.book_append_sheet(workbook, wsInventario, 'Inventario');

    // Crear hoja de historial detallado
    const datosHistorial: any[][] = [];
    datosHistorial.push(['Producto', 'Lote', 'Tipo', 'Cantidad', 'Fecha', 'Usuario']);

    this.datosFiltrados.forEach((producto: any) => {
      if (Array.isArray(producto.lotes)) {
        producto.lotes.forEach((lote: any) => {
          if (Array.isArray(lote.historial) && lote.historial.length > 0) {
            lote.historial.forEach((h: any) => {
              datosHistorial.push([
                producto.name || 'N/A',
                lote.batch || 'N/A',
                h.type === 'entry' ? 'Entrada' : 'Salida',
                h.quantity || 0,
                this.formatearFecha(h.date),
                h.user || 'N/A'
              ]);
            });
          }
        });
      }
    });

    if (datosHistorial.length > 1) {
      const wsHistorial = XLSX.utils.aoa_to_sheet(datosHistorial);
      wsHistorial['!cols'] = [
        { wch: 30 }, // Producto
        { wch: 15 }, // Lote
        { wch: 10 }, // Tipo
        { wch: 10 }, // Cantidad
        { wch: 18 }, // Fecha
        { wch: 20 }  // Usuario
      ];
      XLSX.utils.book_append_sheet(workbook, wsHistorial, 'Historial');
    }

    const fecha = this.datePipe.transform(new Date(), 'yyyyMMdd_HHmmss');
    XLSX.writeFile(workbook, `Inventario_Completo_${fecha}.xlsx`);
  }

  // Exportar Word mejorado para inventario con historial
  private exportarWordInventario(): void {
    const fecha = this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm');

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
          h2 { color: #34495e; margin-top: 30px; border-bottom: 2px solid #95a5a6; padding-bottom: 5px; }
          .meta { color: #7f8c8d; font-size: 14px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #3498db; color: white; padding: 12px; text-align: left; border: 1px solid #2980b9; }
          td { padding: 10px; border: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .producto-header { background-color: #ecf0f1; font-weight: bold; }
          .lote-row { background-color: #f8f9fa; }
          .historial-row { background-color: #e8f4f8; font-size: 12px; }
          .entrada { color: #27ae60; font-weight: bold; }
          .salida { color: #e74c3c; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>📦 Informe de Inventario Completo</h1>
        <p class="meta">Generado el: ${fecha}</p>

        <h2>Resumen de Inventario</h2>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Lote</th>
              <th>Stock</th>
              <th>Stock Mínimo</th>
              <th>Ubicación</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>`;

    this.datosFiltrados.forEach((producto: any) => {
      if (Array.isArray(producto.lotes) && producto.lotes.length > 0) {
        producto.lotes.forEach((lote: any, index: number) => {
          html += `
            <tr class="${index === 0 ? 'producto-header' : 'lote-row'}">
              <td>${index === 0 ? producto.name || 'N/A' : ''}</td>
              <td>${lote.batch || 'N/A'}</td>
              <td>${lote.stock || 0}</td>
              <td>${index === 0 ? producto.min_stock || 0 : ''}</td>
              <td>${index === 0 ? producto.ubicacion_interna || 'N/A' : ''}</td>
              <td>${lote.estado || 'Normal'}</td>
            </tr>`;
        });
      } else {
        html += `
          <tr class="producto-header">
            <td>${producto.name || 'N/A'}</td>
            <td>Sin lote</td>
            <td>${producto.stock || 0}</td>
            <td>${producto.min_stock || 0}</td>
            <td>${producto.ubicacion_interna || 'N/A'}</td>
            <td>${producto.estado || 'Normal'}</td>
          </tr>`;
      }
    });

    html += `
          </tbody>
        </table>

        <h2>Historial Detallado de Movimientos</h2>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Lote</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Fecha</th>
              <th>Usuario</th>
            </tr>
          </thead>
          <tbody>`;

    this.datosFiltrados.forEach((producto: any) => {
      if (Array.isArray(producto.lotes)) {
        producto.lotes.forEach((lote: any) => {
          if (Array.isArray(lote.historial) && lote.historial.length > 0) {
            lote.historial.forEach((h: any) => {
              const tipoClass = h.type === 'entry' ? 'entrada' : 'salida';
              const tipoTexto = h.type === 'entry' ? '📥 Entrada' : '📤 Salida';
              html += `
                <tr class="historial-row">
                  <td>${producto.name || 'N/A'}</td>
                  <td>${lote.batch || 'N/A'}</td>
                  <td class="${tipoClass}">${tipoTexto}</td>
                  <td>${h.quantity || 0}</td>
                  <td>${this.formatearFecha(h.date)}</td>
                  <td>${h.user || 'N/A'}</td>
                </tr>`;
            });
          }
        });
      }
    });

    html += `
          </tbody>
        </table>
      </body>
      </html>`;

    const blob = new Blob([html], { type: 'application/msword' });
    const fechaArchivo = this.datePipe.transform(new Date(), 'yyyyMMdd_HHmmss');
    saveAs(blob, `Inventario_Completo_${fechaArchivo}.doc`);
  }
}
