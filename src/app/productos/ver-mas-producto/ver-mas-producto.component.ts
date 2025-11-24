import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Producto, LoteInventario } from '../../interfaces/producto';
import { UnitsService } from '../../services/units/units.service';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-ver-mas-producto',
  templateUrl: './ver-mas-producto.component.html',
  imports: [],
  styleUrls: ['./ver-mas-producto.component.css']
})
export class VerMasProductoComponent implements OnInit {
  @Input() producto!: Producto;
  @Output() cerrar = new EventEmitter<void>();

  lotesInventario: LoteInventario[] = [];
  unidades: any[] = [];
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private unitsService: UnitsService
  ) {}

  ngOnInit(): void {
    this.cargarUnidades();
    if (this.producto?.id) {
      this.cargarLotesInventario();
    }
  }

  cargarUnidades(): void {
    this.unitsService.getUnits().subscribe((units) => {
      this.unidades = Array.isArray(units) ? units : [];
    });
  }

  obtenerNombreUnidad(unitMeasurement: string | undefined): string {
    if (!unitMeasurement) {
      return 'N/A';
    }

    // Buscar la unidad por abreviatura o nombre
    const unidad = this.unidades.find(u => 
      u.abbreviation?.toLowerCase() === unitMeasurement.toLowerCase() ||
      u.name?.toLowerCase() === unitMeasurement.toLowerCase()
    );

    // Si se encuentra, retornar el nombre completo, sino retornar el valor original
    return unidad ? unidad.name : unitMeasurement;
  }

  cerrarModal() {
    this.cerrar.emit();
  }

  /** Cargar lotes de inventario desde las entradas **/
  private cargarLotesInventario(): void {
    const headers = this.getAuthHeaders();
    
    this.http.get<any>(`${this.apiUrl}/entries`, { headers })
      .subscribe({
        next: (res: any) => {
          const entradas = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
          
          // Filtrar entradas de este producto
          const entradasProducto = entradas.filter((e: any) => 
            (e.product_id || e.product?.id) === this.producto.id
          );
          
          // Agrupar lotes
          const lotesMap = new Map<string, LoteInventario>();
          
          entradasProducto.forEach((entrada: any) => {
            const lot = String(entrada.lot || entrada.lote || entrada.batch || 'SIN_LOTE').trim().toUpperCase();
            
            if (lotesMap.has(lot)) {
              const loteExistente = lotesMap.get(lot)!;
              loteExistente.cantidad = (loteExistente.cantidad || 0) + (Number(entrada.quantity || entrada.cantidad || 0));
              
              const fechaEntrada = entrada.created_at || entrada.fecha || entrada.date;
              if (fechaEntrada) {
                const fechaEntradaActual = loteExistente.fecha_entrada 
                  ? new Date(loteExistente.fecha_entrada).getTime()
                  : 0;
                const fechaEntradaNueva = new Date(fechaEntrada).getTime();
                
                if (fechaEntradaNueva > fechaEntradaActual) {
                  loteExistente.fecha_entrada = fechaEntrada;
                }
              }
            } else {
              lotesMap.set(lot, {
                lot: lot,
                expiration_date: entrada.expiration_date || null,
                cantidad: Number(entrada.quantity || entrada.cantidad || 0),
                fecha_entrada: entrada.created_at || entrada.fecha || entrada.date || null
              });
            }
          });
          
          this.lotesInventario = Array.from(lotesMap.values()).sort((a, b) => {
            const fechaA = a.fecha_entrada ? new Date(a.fecha_entrada).getTime() : 0;
            const fechaB = b.fecha_entrada ? new Date(b.fecha_entrada).getTime() : 0;
            return fechaB - fechaA;
          });
          
          // Limpiar cantidad ya que no se muestra
          this.lotesInventario.forEach(lote => {
            delete lote.cantidad;
          });
        },
        error: (err) => {
          console.error('Error al cargar lotes de inventario:', err);
          this.lotesInventario = [];
        }
      });
  }

  /** Obtener headers de autenticación **/
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  /** Formatear fecha para mostrar **/
  formatearFecha(fecha: string | Date | null | undefined): string {
    if (!fecha) return 'N/A';
    try {
      const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
      return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
    } catch {
      return String(fecha);
    }
  }
}
