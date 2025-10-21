import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsService } from '../../../services/informes/reports.service';
// @ts-ignore
import { NgChartsModule } from 'ng2-charts';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

@Component({
  selector: 'app-informes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './informes.component.html',
  styleUrls: ['./informes.component.css']
})
export class InformesComponent {
  tipo: 'productos' | 'alertas' | 'inventario' = 'productos';
  fechaInicio = '';
  fechaFin = '';
  datos: any[] = [];
  // chart
  public barChartData: any = {
    labels: [],
    datasets: [
      { label: 'Entradas', data: [], stack: 'a' },
      { label: 'Salidas', data: [], stack: 'a' }
    ]
  };
  public barChartOptions: any = {
    responsive: true,
    plugins: { legend: { position: 'top' } }
  };
constructor(private svc: ReportsService, private datePipe: DatePipe) {}


  setQuick(range: 'week' | 'month' | 'today') {
    const now = new Date();
    if (range === 'today') {
      const d = this.datePipe.transform(now, 'yyyy-MM-dd')!;
      this.fechaInicio = d;
      this.fechaFin = d;
    } else if (range === 'week') {
      const start = new Date();
      start.setDate(now.getDate() - 7);
      this.fechaInicio = this.datePipe.transform(start, 'yyyy-MM-dd')!;
      this.fechaFin = this.datePipe.transform(now, 'yyyy-MM-dd')!;
    } else if (range === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      this.fechaInicio = this.datePipe.transform(start, 'yyyy-MM-dd')!;
      this.fechaFin = this.datePipe.transform(now, 'yyyy-MM-dd')!;
    }
  }

  generar() {
    if (this.tipo === 'productos') {
      this.svc.getProductos(this.fechaInicio, this.fechaFin).subscribe(data => {
        this.datos = data;
        this.buildChart(data);
      });
    } else if (this.tipo === 'alertas') {
      this.svc.getAlertas(this.fechaInicio, this.fechaFin).subscribe(d => {
        this.datos = d;
      });
    } else {
      this.svc.getInventory().subscribe(d => {
        this.datos = d;
      });
    }
  }

  private buildChart(data: any[]) {
    this.barChartData.labels = data.map(d => d.name);
    this.barChartData.datasets[0].data = data.map(d => +d.total_entradas);
    this.barChartData.datasets[1].data = data.map(d => +d.total_salidas);
  }

  // Export CSV/Excel using SheetJS
  exportExcel() {
    if (this.tipo !== 'productos') return;
    this.svc.exportProductsExcel(this.fechaInicio, this.fechaFin).subscribe(blob => {
      saveAs(blob, `productos_movimientos_${this.fechaInicio || 'all'}_${this.fechaFin || 'all'}.csv`);
    });
  }

  // Export server-side PDF (download blob)
  exportPdf() {
    if (this.tipo !== 'productos') return;
    this.svc.exportProductsPdf(this.fechaInicio, this.fechaFin).subscribe(blob => {
      saveAs(blob, `productos_movimientos_${this.fechaInicio || 'all'}_${this.fechaFin || 'all'}.pdf`);
    });
  }

  // Client-side PDF with jsPDF (alternative)
  exportPdfClient() {
    const doc = new jsPDF();
    doc.text('Informe de movimientos', 10, 10);
    const rows = this.datos.map(d => [d.name, d.total_entradas, d.total_salidas]);
    (doc as any).autoTable({ head: [['Producto','Entradas','Salidas']], body: rows, startY: 20 });
    doc.save(`productos_movimientos_${this.fechaInicio || 'all'}_${this.fechaFin || 'all'}.pdf`);
  }
}
