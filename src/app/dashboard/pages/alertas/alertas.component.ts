import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AlertsService } from '../../../services/alertas/alerts.service';

@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alertas.component.html',
  styleUrls: ['./alertas.component.css']
})
export class AlertasComponent implements OnInit {
  viewAlerts: any[] = [];
  selected: 'all' | 'low_stock' | 'critical' | 'resolved' = 'all';
  loading = false;
  errorMessage = '';

  constructor(
    private alertsService: AlertsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAlerts(this.selected);
  }

  /** 🔍 Cargar alertas según filtro */
  loadAlerts(filter: 'all' | 'low_stock' | 'critical' | 'resolved'): void {
    this.selected = filter;
    this.loading = true;
    this.errorMessage = '';

    let request$;
    switch (filter) {
      case 'low_stock':
        request$ = this.alertsService.getLowStockAlerts();
        break;
      case 'critical':
        request$ = this.alertsService.getCriticalAlerts();
        break;
      case 'resolved':
        request$ = this.alertsService.getResolvedAlerts();
        break;
      default:
        request$ = this.alertsService.getAllAlerts();
    }

    request$.subscribe({
      next: (response) => {
        const list = Array.isArray(response)
          ? response
          : response?.data || [];

        this.viewAlerts = list.filter((alert: any) => {
          const type = (alert.alert_type || '').toLowerCase();
          const status = (alert.status || '').toLowerCase();

          if (filter === 'resolved') return status === 'resolved';
          if (filter === 'low_stock') return type === 'low_stock' && status === 'active';
          if (filter === 'critical') return type === 'critical' && status === 'active';
          return true;
        });

        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('❌ Error cargando alertas:', err);
        this.errorMessage = err.error?.message || 'No se pudieron cargar las alertas.';
        this.viewAlerts = [];
        this.loading = false;
      }
    });
  }

  /** 🔄 Refrescar manteniendo filtro actual */
  refresh(): void {
    this.loadAlerts(this.selected);
  }

  /** 📦 Ir al módulo de movimientos */
  goToMovements(alert: any): void {
  const productId =
    alert?.product_id ||
    alert?.inventory?.product_id ||
    alert?.inventory_id ||
    null;

  if (!productId) return;

  this.router.navigate(['/dashboard/movimientos'], {
    queryParams: { product: productId }
  });
}


  /** 🏷️ Texto de badge */
  getAlertBadgeText(alert: any): string {
    const type = (alert.alert_type || '').toLowerCase();
    const status = (alert.status || '').toLowerCase();

    if (status === 'resolved') return 'Resuelta';
    if (type === 'low_stock') return 'Stock Bajo';
    if (type === 'critical') return 'Crítica';
    return alert.message || 'Alerta';
  }

  /** ✅ Resolver alerta desde la vista */
  resolveAlert(alert: any): void {
    if (!alert?.id) return;
    this.alertsService.resolveAlert(alert.id).subscribe({
      next: () => {
        alert.status = 'resolved';
      },
      error: (err) => {
        console.error('❌ Error al resolver alerta:', err);
      }
    });
  }
}
