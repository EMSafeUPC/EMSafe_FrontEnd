import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    TranslateModule
  ],
  templateUrl: './stats-card.component.html',
  styleUrls: ['./stats-card.component.css']
})
export class StatsCardComponent implements OnInit, AfterViewInit {
  @Input() title: string = '';
  @Input() icon: string = '';
  @Input() data: any[] = [];
  @Input() chartType: 'line' | 'bar' | 'pie' = 'line';
  @Input() chartLabel: string = '';
  @Input() chartLabels: string[] = [];
  @Input() chartData: number[] = [];
  @Input() chartColors: string[] = ['rgba(75, 192, 192, 0.6)'];
  @Input() summary: any = {};

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  public chart: Chart | null = null;
  public isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Preparar datos si no se proporcionan directamente
    if (this.data.length > 0 && (!this.chartLabels.length || !this.chartData.length)) {
      this.prepareChartData();
    }
  }

  ngAfterViewInit(): void {
    // Solo crear el gráfico si estamos en un navegador
    if (this.isBrowser) {
      setTimeout(() => {
        this.createChart();
      }, 0);
    }
  }

  prepareChartData(): void {
    // Ejemplo: extraer fechas y valores de radiación promedio
    if (this.data[0]?.date) { // Datos diarios
      this.chartLabels = this.data.map(item => item.date);
      this.chartData = this.data.map(item => item.averageRadiation);
    } else if (this.data[0]?.timestamp) { // Lecturas de dispositivo
      this.chartLabels = this.data.map(item => {
        const date = new Date(item.timestamp);
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      });
      this.chartData = this.data.map(item => item.value);
    }
  }

  createChart(): void {
    if (!this.isBrowser || !this.chartCanvas) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    let chartConfig: any = {
      type: this.chartType,
      data: {
        labels: this.chartLabels,
        datasets: [{
          label: this.chartLabel,
          data: this.chartData,
          backgroundColor: this.chartColors,
          borderColor: this.chartColors.map(color => color.replace('0.6', '1')),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };

    // Configuración específica para gráficos de tipo pie
    if (this.chartType === 'pie') {
      delete chartConfig.options.scales;
    }

    this.chart = new Chart(ctx, chartConfig);
  }
}