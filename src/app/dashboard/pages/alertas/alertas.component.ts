import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertsService, AlertFilters, Alert } from '../../../services/alertas/alerts.service';

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

  constructor(private alertsService: AlertsService) {}

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
    if (alerta.alert_type === 'sin_stock') return 'alerta-critica';
    if (alerta.alert_type === 'bajo_stock') return 'alerta-advertencia';
    return 'alerta-pendiente';
  }
}
