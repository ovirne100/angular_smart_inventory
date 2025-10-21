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

  constructor(
    private movimientosService: MovimientosService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Detectar filtro desde query params
    this.route.queryParams.subscribe(params => {
      if (params['product']) {
        this.productFilter = +params['product'];
        this.applyFilter(this.productFilter);
      } else {
        this.cargarDatos();
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
