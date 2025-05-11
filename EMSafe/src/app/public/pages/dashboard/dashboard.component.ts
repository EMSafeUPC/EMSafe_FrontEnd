import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import {DataService} from "../../../core/services/data.service";
import {DeviceCardComponent} from "../../shared/components/device-card/device-card.component";
import {AlarmCardComponent} from "../../shared/components/alarm-card/alarm-card.component";
import {StatsCardComponent} from "../../shared/components/stats-card/stats-card.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatGridListModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    TranslateModule,
    DeviceCardComponent,
    AlarmCardComponent,
    StatsCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  devices: any[] = [];
  alarms: any[] = [];
  dailyStats: any[] = [];
  activeAlarms: any[] = [];
  cols: number = 4;
  lastUpdated: string = '';
  radiationTrend: number = 0; // Tendencia de radiación (porcentaje)

  constructor(
      private dataService: DataService,
      private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.setupResponsiveGrid();
    this.updateLastUpdatedTime();
  }

  setupResponsiveGrid(): void {
    this.breakpointObserver.observe([
      Breakpoints.XSmall,
      Breakpoints.Small,
      Breakpoints.Medium,
      Breakpoints.Large,
      Breakpoints.XLarge
    ]).subscribe(result => {
      if (result.breakpoints[Breakpoints.XSmall]) {
        this.cols = 1;
      } else if (result.breakpoints[Breakpoints.Small]) {
        this.cols = 2;
      } else if (result.breakpoints[Breakpoints.Medium]) {
        this.cols = 3;
      } else {
        this.cols = 4;
      }
    });
  }

  updateLastUpdatedTime(): void {
    const now = new Date();
    this.lastUpdated = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
  }

  loadData(): void {
    forkJoin({
      devices: this.dataService.getDevices(),
      alarms: this.dataService.getAlarms(),
      stats: this.dataService.getDailyStatistics()
    }).subscribe(data => {
      this.devices = data.devices;
      this.alarms = data.alarms;
      this.dailyStats = data.stats;

      // Filtrar alarmas activas (no resueltas)
      this.activeAlarms = this.alarms.filter(alarm => !alarm.resolved);

      // Calcular tendencia de radiación (simulada)
      this.calculateRadiationTrend();

      // Actualizar la hora de última actualización
      this.updateLastUpdatedTime();
    });
  }

  calculateRadiationTrend(): void {
    // Simulamos un cálculo de tendencia basado en los datos de los últimos dos días
    if (this.dailyStats.length >= 2) {
      const today = this.dailyStats[0].averageRadiation;
      const yesterday = this.dailyStats[1].averageRadiation;

      if (yesterday > 0) {
        this.radiationTrend = Math.round(((today - yesterday) / yesterday) * 100);
      }
    } else {
      // Valor por defecto si no hay suficientes datos
      this.radiationTrend = 2;
    }
  }

  getActiveDevicesCount(): number {
    return this.devices.filter(device => device.status === 'active').length;
  }

  getCriticalAlarmsCount(): number {
    return this.activeAlarms.filter(alarm => alarm.level === 'critical').length;
  }

  getAverageBatteryLevel(): number {
    if (this.devices.length === 0) return 0;

    const totalBattery = this.devices.reduce((sum, device) => sum + device.batteryLevel, 0);
    return Math.round(totalBattery / this.devices.length);
  }

  getLowBatteryDevicesCount(): number {
    return this.devices.filter(device => device.batteryLevel < 20).length;
  }

  getLatestStats(): any {
    if (this.dailyStats.length > 0) {
      return this.dailyStats[0];
    }
    return {};
  }

  getDeviceStatusCounts(): number[] {
    const statusCounts = {
      active: 0,
      maintenance: 0,
      inactive: 0,
      alert: 0
    };

    this.devices.forEach(device => {
      if (statusCounts.hasOwnProperty(device.status)) {
        statusCounts[device.status as keyof typeof statusCounts]++;
      }
    });

    return [
      statusCounts.active,
      statusCounts.maintenance,
      statusCounts.inactive,
      statusCounts.alert
    ];
  }
}