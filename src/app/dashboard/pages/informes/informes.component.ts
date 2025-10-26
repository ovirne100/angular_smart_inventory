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
import 'jspdf-autotable';
import { HttpClient, HttpHeaders } from '@angular/common/http';

// Interfaz para el documento Word usando docx
declare var Docx: any;

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
  tipoInforme: 'alertas' | 'productos' | 'proveedores' | 'inventario' = 'productos';

  // Formulario de filtros
  filtrosForm!: FormGroup;

  // Datos de los informes
  datos: any[] = [];
  datosFiltrados: any[] = [];

  // Estados
  loading = false;
  mostrarFiltros = true;

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
    mostrarAgotados: false
  };

  filtrosAlertas = {
    tipo: '',
    estado: '',
    prioridad: '',
    fechaInicio: '',
    fechaFin: ''
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
    if (range === 'today') {
      const d = this.datePipe.transform(now, 'yyyy-MM-dd')!;
      this.filtrosForm.patchValue({ fechaInicio: d, fechaFin: d });
    } else if (range === 'week') {
      const start = new Date();
      start.setDate(now.getDate() - 7);
      this.filtrosForm.patchValue({
        fechaInicio: this.datePipe.transform(start, 'yyyy-MM-dd')!,
        fechaFin: this.datePipe.transform(now, 'yyyy-MM-dd')!
      });
    } else if (range === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      this.filtrosForm.patchValue({
        fechaInicio: this.datePipe.transform(start, 'yyyy-MM-dd')!,
        fechaFin: this.datePipe.transform(now, 'yyyy-MM-dd')!
      });
    } else if (range === 'year') {
      const start = new Date(now.getFullYear(), 0, 1);
      this.filtrosForm.patchValue({
        fechaInicio: this.datePipe.transform(start, 'yyyy-MM-dd')!,
        fechaFin: this.datePipe.transform(now, 'yyyy-MM-dd')!
      });
    }
  }

  // Cambiar tipo de informe
  cambiarTipoInforme(tipo: 'alertas' | 'productos' | 'proveedores' | 'inventario'): void {
    this.tipoInforme = tipo;
    this.datos = [];
    this.datosFiltrados = [];
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
      },
      error: (err) => {
        console.error('Error generando informe de alertas:', err);
        this.loading = false;
      }
    });
  }

  // Generar informe de productos
  generarInformeProductos(): void {
    this.svc.getProductos(this.filtrosProductos.fechaInicio, this.filtrosProductos.fechaFin).subscribe({
      next: (data: any) => {
        let productos = Array.isArray(data) ? data : [];

        // Aplicar filtros de búsqueda localmente
        const { search, lote, referencia } = this.filtrosProductos;

        if (search) {
          productos = productos.filter((p: any) =>
            p.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.reference?.toLowerCase().includes(search.toLowerCase())
          );
        }

        if (lote) {
          productos = productos.filter((p: any) =>
            p.batch?.toLowerCase().includes(lote.toLowerCase())
          );
        }

        if (referencia) {
          productos = productos.filter((p: any) =>
            p.reference?.toLowerCase().includes(referencia.toLowerCase())
          );
        }

        this.datos = productos;
        this.datosFiltrados = [...this.datos];
        console.log('Productos cargados:', productos);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error generando informe de productos:', err);
        this.loading = false;
      }
    });
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

        this.datos = proveedores;
        this.datosFiltrados = [...this.datos];
        console.log('Proveedores cargados:', proveedores);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error generando informe de proveedores:', err);
        this.loading = false;
      }
    });
  }

      // Generar informe de inventario
  generarInformeInventario(): void {
    // Obtener productos
    this.productosService.getProducts({ perPage: 1000 }).subscribe({
      next: (productosData: any) => {
        const productos = productosData.data || [];

        // Obtener entradas
        const headers = this.getAuthHeaders();
        this.http.get('http://smart_inventory/api/entries', { headers }).subscribe({
          next: (entradasData: any) => {
            const entradas = entradasData.data || [];

            // Obtener salidas
            this.http.get('http://smart_inventory/api/outputs', { headers }).subscribe({
              next: (salidasData: any) => {
                const salidas = salidasData.data || [];

                // Construir inventario combinando datos
                const inventario = productos.map((producto: any) => {
                  // Contar entradas y salidas por producto
                  const entradasProducto = entradas.filter((e: any) => e.product_id === producto.id);
                  const salidasProducto = salidas.filter((s: any) => s.product_id === producto.id);

                  const totalEntradas = entradasProducto.reduce((sum: number, e: any) => sum + Number(e.quantity || 0), 0);
                  const totalSalidas = salidasProducto.reduce((sum: number, s: any) => sum + Number(s.quantity || 0), 0);
                  const stockActual = totalEntradas - totalSalidas;

                  return {
                    id: producto.id,
                    name: producto.name,
                    producto: producto.name,
                    reference: producto.reference,
                    referencia: producto.reference,
                    batch: producto.batch,
                    lote: producto.batch,
                    categoria: producto.categoria?.name,
                    stock: stockActual,
                    quantity: stockActual,
                    entradas: totalEntradas,
                    salidas: totalSalidas,
                    stock_minimo: producto.min_stock || 0
                  };
                });

                // Aplicar filtros
                let inventarioFiltrado = inventario;
                const { producto, lote, mostrarAgotados } = this.filtrosInventario;

                if (producto) {
                  inventarioFiltrado = inventarioFiltrado.filter((i: any) =>
                    i.producto?.toLowerCase().includes(producto.toLowerCase()) ||
                    i.name?.toLowerCase().includes(producto.toLowerCase())
                  );
                }

                if (lote) {
                  inventarioFiltrado = inventarioFiltrado.filter((i: any) =>
                    i.lote?.toLowerCase().includes(lote.toLowerCase()) ||
                    i.batch?.toLowerCase().includes(lote.toLowerCase())
                  );
                }

                if (mostrarAgotados) {
                  inventarioFiltrado = inventarioFiltrado.filter((i: any) => Number(i.stock) <= 0 || Number(i.quantity) <= 0);
                }

                this.datos = inventarioFiltrado;
                this.datosFiltrados = [...this.datos];
                console.log('Inventario cargado:', inventarioFiltrado);
                this.loading = false;
              },
              error: (err) => {
                console.error('Error cargando salidas:', err);
                this.loading = false;
              }
            });
          },
          error: (err) => {
            console.error('Error cargando entradas:', err);
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error cargando productos:', err);
        this.loading = false;
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
    const doc = new jsPDF();

    // Título
    doc.setFontSize(16);
    doc.text(`Informe de ${this.getTituloInforme()}`, 14, 15);

    // Fecha de generación
    doc.setFontSize(10);
    const fecha = this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm');
    doc.text(`Generado el: ${fecha}`, 14, 25);

    // Datos
    let y = 35;
    const rows: any[] = [];

    switch (this.tipoInforme) {
      case 'alertas':
        rows.push(['Tipo', 'Producto', 'Mensaje', 'Estado', 'Fecha']);
        this.datosFiltrados.forEach((a: any) => {
          rows.push([
            a.alert_type || '',
            a.product?.name || '',
            a.message || '',
            a.status || '',
            a.created_at || ''
          ]);
        });
        break;

      case 'productos':
        rows.push(['ID', 'Nombre', 'Referencia', 'Lote', 'Categoría']);
        this.datosFiltrados.forEach((p: any) => {
          rows.push([
            p.id || '',
            p.name || '',
            p.reference || '',
            p.batch || '',
            p.categoria?.name || ''
          ]);
        });
        break;

      case 'proveedores':
        rows.push(['ID', 'Nombre', 'Email', 'Teléfono']);
        this.datosFiltrados.forEach((p: any) => {
          rows.push([
            p.id || '',
            p.name || '',
            p.email || '',
            p.phone || ''
          ]);
        });
        break;

      case 'inventario':
        rows.push(['Producto', 'Referencia', 'Lote/Batch', 'Entradas', 'Salidas', 'Stock Actual', 'Stock Mínimo']);
        this.datosFiltrados.forEach((i: any) => {
          rows.push([
            i.name || i.producto || '',
            i.reference || i.referencia || '',
            i.batch || i.lote || '',
            i.entradas || 0,
            i.salidas || 0,
            i.quantity || i.stock || 0,
            i.stock_minimo || 0
          ]);
        });
        break;
    }

    (doc as any).autoTable({
      head: [rows[0]],
      body: rows.slice(1),
      startY: y,
      styles: { fontSize: 8 }
    });

    doc.save(`informe_${this.tipoInforme}_${Date.now()}.pdf`);
  }

  // Exportar a Excel
  exportarExcel(): void {
    const worksheet = XLSX.utils.json_to_sheet(this.datosFiltrados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
    XLSX.writeFile(workbook, `informe_${this.tipoInforme}_${Date.now()}.xlsx`);
  }

  // Exportar a Word (CSV como Word)
  exportarWord(): void {
    // Crear contenido HTML
    let html = '<html><head><meta charset="UTF-8"><title>Informe</title></head><body>';
    html += `<h1>Informe de ${this.getTituloInforme()}</h1>`;
    html += `<p>Generado el: ${this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm')}</p>`;
    html += '<table border="1">';

    // Headers
    html += '<tr>';
    const headers = this.getHeadersInforme();
    headers.forEach(h => html += `<th>${h}</th>`);
    html += '</tr>';

    // Rows
    this.datosFiltrados.forEach((row: any) => {
      html += '<tr>';
      this.getRowData(row).forEach((cell: any) => {
        html += `<td>${cell || ''}</td>`;
      });
      html += '</tr>';
    });

    html += '</table></body></html>';

    // Descargar como .doc
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    saveAs(blob, `informe_${this.tipoInforme}_${Date.now()}.doc`);
  }

  // Helpers
  getTituloInforme(): string {
    const titulos: any = {
      alertas: 'Alertas',
      productos: 'Productos',
      proveedores: 'Proveedores',
      inventario: 'Inventario'
    };
    return titulos[this.tipoInforme] || '';
  }

  getHeadersInforme(): string[] {
    switch (this.tipoInforme) {
      case 'alertas':
        return ['Tipo', 'Producto', 'Mensaje', 'Estado', 'Fecha'];
      case 'productos':
        return ['ID', 'Nombre', 'Referencia', 'Lote', 'Categoría'];
      case 'proveedores':
        return ['ID', 'Nombre', 'Email', 'Teléfono', 'Dirección'];
      case 'inventario':
        return ['Producto', 'Referencia', 'Lote/Batch', 'Entradas', 'Salidas', 'Stock Actual', 'Stock Mínimo'];
      default:
        return [];
    }
  }

  getRowData(row: any): any[] {
    switch (this.tipoInforme) {
      case 'alertas':
        return [row.alert_type, row.product?.name, row.message, row.status, row.created_at];
      case 'productos':
        return [row.id, row.name, row.reference, row.batch, row.categoria?.name];
      case 'proveedores':
        return [row.id, row.name, row.email, row.phone, row.address];
      case 'inventario':
        return [
          row.name || row.producto,
          row.reference || row.referencia,
          row.batch || row.lote,
          row.entradas || 0,
          row.salidas || 0,
          row.quantity || row.stock,
          row.stock_minimo || 0
        ];
      default:
        return [];
    }
  }
}
