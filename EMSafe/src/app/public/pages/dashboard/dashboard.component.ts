import { Component,  OnInit,  OnDestroy } from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatGridListModule } from "@angular/material/grid-list"
import { MatCardModule } from "@angular/material/card"
import { MatIconModule } from "@angular/material/icon"
import { MatButtonModule } from "@angular/material/button"
import { MatTabsModule } from "@angular/material/tabs"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { MatSnackBarModule,  MatSnackBar } from "@angular/material/snack-bar"
import { TranslateModule } from "@ngx-translate/core"
import { forkJoin, Subject, timer, EMPTY } from "rxjs"
import { takeUntil, switchMap, catchError } from "rxjs/operators"
import {  BreakpointObserver, Breakpoints } from "@angular/cdk/layout"
import  { DataService } from "../../../core/services/data.service"
import  { AuthService } from "../../../core/services/auth.service"
import { DeviceCardComponent } from "../../shared/components/device-card/device-card.component"
import { AlarmCardComponent } from "../../shared/components/alarm-card/alarm-card.component"
import { StatsCardComponent } from "../../shared/components/stats-card/stats-card.component"
import { MatTooltipModule } from "@angular/material/tooltip"

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [
    CommonModule,
    MatGridListModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    TranslateModule,
    DeviceCardComponent,
    AlarmCardComponent,
    StatsCardComponent,
  ],
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"],
})
export class DashboardComponent implements OnInit, OnDestroy {
  devices: any[] = []
  alarms: any[] = []
  dailyStats: any[] = []
  activeAlarms: any[] = []
  cols = 4
  lastUpdated = ""
  radiationTrend = 0

  // Nuevas propiedades
  isLoading = true
  error: string | null = null
  autoRefreshEnabled = true
  currentUser: any = null

  private destroy$ = new Subject<void>()

  constructor(
      private dataService: DataService,
      private authService: AuthService,
      private breakpointObserver: BreakpointObserver,
      private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser()
    this.loadData()
    this.setupResponsiveGrid()
    this.setupAutoRefresh()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  setupResponsiveGrid(): void {
    this.breakpointObserver
        .observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium, Breakpoints.Large, Breakpoints.XLarge])
        .pipe(takeUntil(this.destroy$))
        .subscribe((result) => {
          if (result.breakpoints[Breakpoints.XSmall]) {
            this.cols = 1
          } else if (result.breakpoints[Breakpoints.Small]) {
            this.cols = 2
          } else if (result.breakpoints[Breakpoints.Medium]) {
            this.cols = 3
          } else {
            this.cols = 4
          }
        })
  }

  // NUEVO: Auto-refresh
  setupAutoRefresh(): void {
    timer(30000, 30000)
        .pipe(
            switchMap(() => {
              if (this.autoRefreshEnabled && !this.isLoading) {
                return this.dataService.getDashboardData
                    ? this.dataService.getDashboardData()
                    : forkJoin({
                      devices: this.dataService.getDevices(),
                      alarms: this.dataService.getAlarms(),
                      dailyStats: this.dataService.getDailyStatistics(),
                    })
              }
              return EMPTY
            }),
            takeUntil(this.destroy$),
        )
        .subscribe({
          next: (data) => {
            this.handleDataSuccess(data, false)
            console.log("Dashboard auto-refreshed")
          },
          error: (error) => console.error("Auto-refresh error:", error),
        })
  }

  loadData(): void {
    this.isLoading = true
    this.error = null

    const dataObservable = this.dataService.getDashboardData
        ? this.dataService.getDashboardData()
        : forkJoin({
          devices: this.dataService.getDevices(),
          alarms: this.dataService.getAlarms(),
          dailyStats: this.dataService.getDailyStatistics(),
        })

    dataObservable
        .pipe(
            takeUntil(this.destroy$),
            catchError((error) => {
              this.handleDataError(error)
              return EMPTY
            }),
        )
        .subscribe({
          next: (data) => this.handleDataSuccess(data, true),
        })
  }

  private handleDataSuccess(data: any, showLoading = true): void {
    console.log("Raw data received:", data) // Debug

    this.devices = data.devices || []
    this.alarms = data.alarms || []
    this.dailyStats = data.dailyStats || data.stats || []

    console.log("Processed data:", {
      devices: this.devices.length,
      alarms: this.alarms.length,
      dailyStats: this.dailyStats.length,
    }) // Debug

    this.activeAlarms = this.alarms.filter((alarm) => !alarm.resolved)
    this.calculateRadiationTrend()
    this.updateLastUpdatedTime()

    if (showLoading) {
      this.isLoading = false
    }
    this.error = null
  }

  private handleDataError(error: any): void {
    console.error("Error loading dashboard data:", error)
    this.error = error.message || "Error al cargar los datos del dashboard"
    this.isLoading = false

    this.snackBar.open("Error al cargar los datos. Reintentando...", "Cerrar", {
      duration: 5000,
    })
  }

  updateLastUpdatedTime(): void {
    const now = new Date()
    this.lastUpdated = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`
  }

  calculateRadiationTrend(): void {
    if (this.dailyStats.length >= 2) {
      const today = this.dailyStats[this.dailyStats.length - 1].averageRadiation
      const yesterday = this.dailyStats[this.dailyStats.length - 2].averageRadiation

      if (yesterday > 0) {
        this.radiationTrend = Math.round(((today - yesterday) / yesterday) * 100)
      }
    } else {
      this.radiationTrend = 0
    }
  }

  // getActiveDevicesCount(): number {
  //   return this.devices.filter((device) => device.status === "active").length
  // }

  getTotalDevicesCount(): number {
    return this.devices.length
  }

  getDevicesWithRecentReadings(): number {
    // Ejemplo: contar dispositivos que han tenido lecturas en las últimas 24 horas
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    return this.devices.filter((device) => {
      const lastReading = new Date(device.last_read_date || device.lastReadDate)
      return lastReading > yesterday
    }).length
  }

  getCriticalAlarmsCount(): number {
    return this.activeAlarms.filter((alarm) => alarm.level === "critical").length
  }

  getLatestStats(): any {
    if (this.dailyStats.length > 0) {
      return this.dailyStats[this.dailyStats.length - 1] || this.dailyStats[0]
    }
    return { averageRadiation: 0 }
  }

  getDeviceStatusCounts(): number[] {
    const statusCounts = { active: 0, maintenance: 0, inactive: 0, alert: 0 }
    this.devices.forEach((device) => {
      if (statusCounts.hasOwnProperty(device.status)) {
        statusCounts[device.status as keyof typeof statusCounts]++
      }
    })
    return [statusCounts.active, statusCounts.maintenance, statusCounts.inactive, statusCounts.alert]
  }

  // NUEVOS MÉTODOS
  refreshData(): void {
    this.loadData()
  }

  toggleAutoRefresh(): void {
    this.autoRefreshEnabled = !this.autoRefreshEnabled
    const message = this.autoRefreshEnabled
        ? "Actualización automática activada"
        : "Actualización automática desactivada"
    this.snackBar.open(message, "Cerrar", { duration: 3000 })
  }

  getApiUrl(): string {
    return this.dataService["apiUrl"] || "API URL not available"
  }
}
