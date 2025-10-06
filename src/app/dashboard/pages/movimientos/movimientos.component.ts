// src/app/dashboard/pages/movimientos/movimientos.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MovimientosService } from '../../../services/movimientos/movimientos';

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './movimientos.component.html',
  styleUrls: ['./movimientos.component.css']
})
export class MovimientosComponent implements OnInit {
  // 📊 ENTRADAS
  entriesCount = 0;
  entriesQuantity = 0;
  lastEntryDate: string | null = null;

  // 📊 SALIDAS
  outputsCount = 0;
  outputsQuantity = 0;
  lastOutputDate: string | null = null;

  // 🔎 Filtro
  productFilter: number | null = null;

  constructor(
    private movimientosService: MovimientosService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 📌 Detectar filtro por query param
    this.route.queryParams.subscribe(params => {
      if (params['product']) {
        this.productFilter = +params['product'];
        this.applyFilter(this.productFilter);
      }
    });

    // 📊 Suscripciones ENTRADAS
    this.movimientosService.entriesCount$.subscribe(v => this.entriesCount = v);
    this.movimientosService.entriesQuantity$.subscribe(v => this.entriesQuantity = v);
    this.movimientosService.lastEntryDate$.subscribe(v => this.lastEntryDate = v);

    // 📊 Suscripciones SALIDAS
    this.movimientosService.outputsCount$.subscribe(v => this.outputsCount = v);
    this.movimientosService.outputsQuantity$.subscribe(v => this.outputsQuantity = v);
    this.movimientosService.lastOutputDate$.subscribe(v => this.lastOutputDate = v);

    // 🔄 Refrescar ambos
    this.movimientosService.refreshCounts();
  }

  applyFilter(productId: number) {
    console.log("🔎 Filtrando movimientos por producto ID:", productId);
    // 👉 Aquí luego puedes traer entradas/salidas específicas
  }

  // ✅ Saber qué ruta está activa (útil para tabs/botones)
  isActive(route: string): boolean {
    return this.router.url === route;
  }
}
