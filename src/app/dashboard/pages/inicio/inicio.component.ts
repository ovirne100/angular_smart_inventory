import { Component, OnInit, ViewChild } from '@angular/core';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ChartConfiguration,
  ChartData,
  ChartType,
  Plugin,
  ScriptableContext
} from 'chart.js';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css'],
  providers: [provideCharts(withDefaultRegisterables())]
})
export class InicioComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  stats: any = {};

  private valueLabelPlugin: Plugin<'bar'> = {
    id: 'valueLabelPlugin',
    afterDatasetsDraw: (chart) => {
      const { ctx } = chart;
      ctx.save();

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        if (meta.hidden || meta.type !== 'bar') {
          return;
        }

        meta.data.forEach((element, index) => {
          const value = dataset.data[index];
          if (value === undefined || value === null || typeof value !== 'number') {
            return;
          }

          const position = element.tooltipPosition(true);
          if (
            position === undefined ||
            position === null ||
            typeof position.x !== 'number' ||
            typeof position.y !== 'number'
          ) {
            return;
          }

          ctx.fillStyle = '#2c3e50';
          ctx.font = '600 12px "Poppins", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(value.toLocaleString(), position.x, position.y - 8);
        });
      });

      ctx.restore();
    }
  };

  public comparisonPlugins = [this.valueLabelPlugin];

  // Configuración del gráfico de barras comparativo
  public barChartType: ChartType = 'bar';
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    layout: {
      padding: {
        top: 10,
        right: 20,
        bottom: 10,
        left: 10
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#2c3e50',
          font: {
            size: 15,
            weight: 700,
            family: "'Poppins', sans-serif"
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 14,
          boxHeight: 14
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        displayColors: true,
        callbacks: {
          label: function(context) {
            if (context.dataset.type === 'line' || context.dataset.yAxisID === 'yPercentage') {
              const value = context.parsed.y ?? 0;
              return `${context.dataset.label}: ${value.toFixed(0)}%`;
            }
            const value = context.parsed.y ?? 0;
            return `${context.dataset.label}: ${value.toLocaleString()} unidades`;
          }
        }
      },
      title: {
        display: true,
        text: 'Comparativa Mes Actual vs Mes Anterior',
        font: {
          size: 18,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grace: '5%',
        border: {
          display: false
        },
        ticks: {
          color: '#546a7b',
          font: {
            size: 12
          },
          callback: function(value) {
            return value.toLocaleString();
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        border: {
          display: false
        },
        ticks: {
          color: '#546a7b',
          font: {
            size: 12,
            weight: 600
          }
        },
        grid: {
          display: false
        }
      },
      yPercentage: {
        position: 'right',
        beginAtZero: true,
        suggestedMax: 100,
        ticks: {
          color: '#8e44ad',
          callback: function(value) {
            return `${value}%`;
          }
        },
        grid: {
          drawOnChartArea: false,
          drawTicks: true
        }
      }
    }
  };

  public barChartData: ChartData<'bar' | 'line'> = {
    labels: ['Entradas', 'Salidas'],
    datasets: [
      {
        type: 'bar',
        label: '📅 Mes Actual',
        data: [0, 0],
        backgroundColor: (context: ScriptableContext<'bar'>) =>
          this.getGradient(context, '#3498db', '#2980b9'),
        hoverBackgroundColor: 'rgba(52, 152, 219, 0.95)',
        borderColor: 'rgba(41, 128, 185, 1)',
        borderWidth: 3,
        borderRadius: 10,
        borderSkipped: false,
        categoryPercentage: 0.5,
        barPercentage: 0.7,
        maxBarThickness: 50
      },
      {
        type: 'bar',
        label: '📊 Mes Anterior',
        data: [0, 0],
        backgroundColor: (context: ScriptableContext<'bar'>) =>
          this.getGradient(context, '#95a5a6', '#7f8c8d'),
        hoverBackgroundColor: 'rgba(149, 165, 166, 0.9)',
        borderColor: 'rgba(127, 140, 141, 1)',
        borderWidth: 3,
        borderRadius: 10,
        borderSkipped: false,
        categoryPercentage: 0.5,
        barPercentage: 0.7,
        maxBarThickness: 50
      },
      {
        type: 'line',
        label: 'Variación %',
        data: [0, 0],
        borderColor: '#ffb03a',
        backgroundColor: 'rgba(255, 176, 58, 0.2)',
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#ffb03a',
        pointBorderColor: '#ffffff',
        yAxisID: 'yPercentage',
        tension: 0.35
      }
    ]
  };

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getDashboardData().subscribe({
      next: (data) => {
        console.log('📊 Datos del dashboard recibidos:', data);
        this.stats = data;
        this.updateChart();
      },
      error: (err) => console.error('❌ Error al obtener datos del dashboard:', err)
    });
  }

  updateChart(): void {
    if (this.stats) {
      const entradasActual = this.stats.entradasMesActual || 0;
      const salidasActual = this.stats.salidasMesActual || 0;
      const entradasAnterior = this.stats.entradasMesAnterior || 0;
      const salidasAnterior = this.stats.salidasMesAnterior || 0;

      this.barChartData.datasets[0].data = [
        entradasActual,
        salidasActual
      ];
      this.barChartData.datasets[1].data = [
        entradasAnterior,
        salidasAnterior
      ];
      this.barChartData.datasets[2].data = [
        this.calcularPorcentajeCambio(entradasActual, entradasAnterior),
        this.calcularPorcentajeCambio(salidasActual, salidasAnterior)
      ];
      this.chart?.update();
    }
  }

  // Calcular porcentaje de cambio
  calcularPorcentajeCambio(actual: number, anterior: number): number {
    if (!anterior || anterior === 0) return 0;
    return Math.round(((actual - anterior) / anterior) * 100);
  }

  // Obtener clase CSS para el indicador de tendencia
  getTendenciaClass(actual: number, anterior: number): string {
    const cambio = this.calcularPorcentajeCambio(actual, anterior);
    if (cambio > 0) return 'trend up';
    if (cambio < 0) return 'trend down';
    return 'trend neutral';
  }

  private getGradient(
    context: ScriptableContext<'bar'>,
    colorStart: string,
    colorEnd: string
  ): CanvasGradient | string {
    const chart = context.chart;
    const { ctx, chartArea } = chart;
    if (!chartArea) {
      return colorEnd;
    }
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
  }
}
