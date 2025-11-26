import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MovimientosService, Entrada, Salida } from '../../../services/movimientos/movimientos';

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './movimientos.component.html',
  styleUrls: ['./movimientos.component.css']
})
export class MovimientosComponent implements OnInit {
  // 📊 RESUMEN
  entriesCount = 0;
  entriesQuantity = 0;
  lastEntryDate: string | null = null;

  outputsCount = 0;
  outputsQuantity = 0;
  lastOutputDate: string | null = null;

  // 📦 LISTAS COMPLETAS
  entradas: Entrada[] = [];
  salidas: Salida[] = [];

  // 🔎 Filtro
  productFilter: number | null = null;

  // 📅 Fecha actual
  mesActual: string = '';
  diaActual: string = '';
  
  // 🕐 Filtro de tiempo
  filtroActivo: 'semana' | 'mes' | 'anio' | 'todos' = 'mes';
  textoFiltro: string = '';

  constructor(
    private movimientosService: MovimientosService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.actualizarFechaActual();
  }

  ngOnInit(): void {
    // Detectar filtro desde query params
    this.route.queryParams.subscribe(params => {
      if (params['product']) {
        this.productFilter = +params['product'];
        this.applyFilter(this.productFilter);
      } else {
        // Cargar datos del mes actual por defecto
        this.filtrarPorTiempo('mes');
      }
    });

    // Suscripciones a los observables de resumen
    this.movimientosService.entriesCount$.subscribe(v => this.entriesCount = v);
    this.movimientosService.entriesQuantity$.subscribe(v => this.entriesQuantity = v);
    this.movimientosService.lastEntryDate$.subscribe(v => this.lastEntryDate = v);

    this.movimientosService.outputsCount$.subscribe(v => this.outputsCount = v);
    this.movimientosService.outputsQuantity$.subscribe(v => this.outputsQuantity = v);
    this.movimientosService.lastOutputDate$.subscribe(v => this.lastOutputDate = v);

    // Suscripciones a las listas
    this.movimientosService.entradas$.subscribe(list => {
      this.entradas = list;
      console.log('📥 Entradas:', list);
    });

    this.movimientosService.salidas$.subscribe(list => {
      this.salidas = list;
      console.log('📤 Salidas:', list);
    });
  }

  // 📅 Actualizar fecha actual
  actualizarFechaActual(): void {
    const hoy = new Date();
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    this.mesActual = meses[hoy.getMonth()] + ' ' + hoy.getFullYear();
    this.diaActual = dias[hoy.getDay()] + ' ' + hoy.getDate();
  }

  // 🕐 Filtrar por tiempo
  filtrarPorTiempo(tipo: 'semana' | 'mes' | 'anio' | 'todos'): void {
    this.filtroActivo = tipo;
    const hoy = new Date();

    // Cargar todos los datos primero
    this.movimientosService.refreshCounts();
    this.movimientosService.getEntradasList();
    this.movimientosService.getSalidasList();

    // Calcular el texto del filtro
    switch (tipo) {
      case 'semana':
        const diaSemana = hoy.getDay();
        const diff = diaSemana === 0 ? 6 : diaSemana - 1;
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - diff);
        this.textoFiltro = `Semana del ${inicioSemana.getDate()}/${inicioSemana.getMonth() + 1} al ${hoy.getDate()}/${hoy.getMonth() + 1}`;
        break;
      
      case 'mes':
        this.textoFiltro = this.mesActual;
        break;
      
      case 'anio':
        this.textoFiltro = `Año ${hoy.getFullYear()}`;
        break;
      
      case 'todos':
      default:
        this.textoFiltro = 'Todos los registros';
        break;
    }

    console.log('📅 Filtro seleccionado:', tipo, this.textoFiltro);
  }

  // Obtener rango de fechas según el filtro
  getFechaRango(): { inicio: Date, fin: Date } {
    const hoy = new Date();
    let fechaInicio: Date;
    const fechaFin: Date = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);

    switch (this.filtroActivo) {
      case 'semana':
        const diaSemana = hoy.getDay();
        const diff = diaSemana === 0 ? 6 : diaSemana - 1;
        fechaInicio = new Date(hoy);
        fechaInicio.setDate(hoy.getDate() - diff);
        fechaInicio.setHours(0, 0, 0, 0);
        break;
      
      case 'mes':
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        break;
      
      case 'anio':
        fechaInicio = new Date(hoy.getFullYear(), 0, 1);
        break;
      
      default:
        fechaInicio = new Date(2000, 0, 1); // Fecha muy antigua para incluir todo
        break;
    }

    return { inicio: fechaInicio, fin: fechaFin };
  }

  cargarDatos(): void {
    // Carga general sin filtro
    this.movimientosService.refreshCounts();
    this.movimientosService.getEntradasList();
    this.movimientosService.getSalidasList();
  }

  applyFilter(productId: number): void {
    console.log('🔎 Filtrando movimientos por producto ID:', productId);

    const params = { product_id: productId.toString() };

    this.movimientosService.getEntradasList(params);
    this.movimientosService.getSalidasList(params);
  }

  limpiarFiltro(): void {
    this.productFilter = null;
    this.router.navigate([], { queryParams: {} });
    this.cargarDatos();
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }
}
