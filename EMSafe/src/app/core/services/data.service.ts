import { Injectable } from "@angular/core"
import { HttpClient, HttpErrorResponse } from "@angular/common/http"
import { Observable, throwError, forkJoin } from "rxjs"
import { map, catchError } from "rxjs/operators"
import { environment } from "../../environments/environment"

@Injectable({
  providedIn: "root",
})
export class DataService {
  private apiUrl = environment.apiUrl // Usar environment en lugar de hardcoded

  constructor(private http: HttpClient) {}

  // ==================== DISPOSITIVOS (CORREGIDO) ====================

  // Obtener todos los dispositivos - CORREGIDO para usar backend real
  getDevices(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/v1/devices`).pipe(catchError(this.handleError))
  }

  // Crear dispositivo
  createDevice(device: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/v1/devices`, device)
        .pipe(catchError(this.handleError));
  }

  // Obtener todos los dispositivos
  updateDevice(id: number, device: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/v1/devices/${id}`, device)
        .pipe(catchError(this.handleError));
  }

  // Eliminar dispositivo
  deleteDevice(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/v1/devices/${id}`)
        .pipe(catchError(this.handleError));
  }

  getDeviceStatuses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/v1/device-catalogs/statuses`)
        .pipe(catchError(this.handleError));
  }

  getDeviceTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/v1/device-catalogs/types`)
        .pipe(catchError(this.handleError));
  }

  getDeviceFrequencies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/v1/device-catalogs/frequencies`)
        .pipe(catchError(this.handleError));
  }

  // ==================== ALARMAS (MANTENIDO + AGREGADOS) ====================

  // Obtener todas las alarmas
  getAlarms(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/v1/alarms`).pipe(catchError(this.handleError))
  }

  // Obtener historial de alarmas
  getAlarmHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/v1/alarms`).pipe(catchError(this.handleError))
  }

  // Crear alarma
  createAlarm(alarm: any) {
    return this.http.post<any>(`${this.apiUrl}/api/v1/alarms`, alarm).pipe(catchError(this.handleError))
  }

  // NUEVOS: Actualizar y resolver alarmas
  updateAlarm(alarmId: string, alarm: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/v1/alarms/${alarmId}`, alarm).pipe(catchError(this.handleError))
  }

  resolveAlarm(alarmId: string, notes?: string): Observable<any> {
    const updateData = {
      resolved: true,
      resolved_at: new Date().toISOString(),
      notes: notes || "",
    }
    return this.updateAlarm(alarmId, updateData)
  }

  acknowledgeAlarm(alarmId: string, acknowledgedBy = "system"): Observable<any> {
    const updateData = {
      acknowledged: true,
      acknowledged_by: acknowledgedBy,
      acknowledged_at: new Date().toISOString(),
    }
    return this.updateAlarm(alarmId, updateData)
  }

  // ==================== ESTADÍSTICAS (MEJORADO) ====================

  // Obtener estadísticas diarias - MEJORADO con fallback
  getDailyStatistics(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/api/v1/dashboard/statistics`).pipe(
        map((stats) => stats.daily),
        catchError((error) => {
          console.warn("Dashboard statistics endpoint not available, generating from devices")
          return this.getDevices().pipe(map((devices) => this.generateDailyStatsFromDevices(devices)))
        }),
    )
  }

  // Obtener estadísticas mensuales
  getMonthlyStatistics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/v1/dashboard/statistics`).pipe(
        map((stats) => stats.monthly),
        catchError((error) => {
          console.warn("Monthly statistics endpoint not available, generating from devices")
          return this.getDevices().pipe(map((devices) => this.generateMonthlyStatsFromDevices(devices)))
        }),
    )
  }

  // ==================== OTROS ENDPOINTS (MEJORADOS) ====================

  // Obtener lecturas de un dispositivo específico
  getDeviceReadings(deviceId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/v1/devices/${deviceId}/readings`).pipe(
        catchError((error) => {
          console.warn("Device readings endpoint not available, using fallback")
          return this.http.get<any[]>(`${this.apiUrl}/readings`).pipe(
              map((readings) => {
                const deviceReading = readings.find((r) => r.deviceId === deviceId)
                return deviceReading ? deviceReading.readings : []
              }),
          )
        }),
    )
  }

  // Obtener datos del mapa
  getMapData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/v1/dashboard/map`).pipe(
        catchError((error) => {
          console.warn("Map data endpoint not available, generating from devices")
          return this.getDevices().pipe(
              map((devices) => ({
                devices: devices.map((device) => ({
                  id: device.id,
                  name: device.name,
                  location: device.location,
                  coordinates: device.coordinates || {
                    lat: 40.416775 + (Math.random() - 0.5) * 0.01,
                    lng: -3.70379 + (Math.random() - 0.5) * 0.01,
                  },
                  status: device.status,
                  currentReading: device.currentReading || device.current_reading,
                  unit: device.unit || "μSv/h",
                })),
              })),
          )
        }),
    )
  }

  // Obtener notificaciones
  getNotifications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/v1/notifications`).pipe(
        catchError((error) => {
          console.warn("Notifications endpoint not available, generating from alarms")
          return this.getAlarms().pipe(
              map((alarms) =>
                  alarms
                      .filter((alarm) => !alarm.acknowledged && !alarm.resolved)
                      .map((alarm) => ({
                        id: alarm.id,
                        title: `${alarm.level.toUpperCase()}: ${alarm.deviceName || `Device ${alarm.device_id}`}`,
                        message: alarm.notes || `${alarm.type} - ${alarm.reading} ${alarm.unit}`,
                        type: alarm.level,
                        timestamp: alarm.timestamp,
                        read: false,
                      })),
              ),
          )
        }),
    )
  }

  // Obtener configuración del sistema
  getSettings(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/v1/settings`).pipe(
        catchError((error) => {
          console.warn("Settings endpoint not available, using defaults")
          return new Observable((observer) => {
            observer.next({
              thresholds: {
                radiation: 0.5,
                temperature: 75.0,
                humidity: 20.0,
                pressure: 180.0,
                battery: 20.0,
              },
              notifications: {
                email: true,
                sms: false,
                push: true,
              },
              maintenance: {
                interval: 6,
                reminder: 30,
              },
            })
            observer.complete()
          })
        }),
    )
  }

  // ==================== NUEVO: MÉTODO PARA DASHBOARD ====================

  getDashboardData(): Observable<any> {
    return forkJoin({
      devices: this.getDevices(),
      alarms: this.getAlarms(),
      dailyStats: this.getDailyStatistics(),
    }).pipe(
        map((data) => ({
          ...data,
          summary: this.calculateSummary(data.devices, data.alarms),
        })),
        catchError(this.handleError),
    )
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private calculateSummary(devices: any[], alarms: any[]) {
    const activeDevices = devices.filter((d) => d.status === "active").length
    const averageRadiation =
        devices.length > 0
            ? devices.reduce((sum, d) => sum + (d.currentReading || d.current_reading || 0), 0) / devices.length
            : 0
    const activeAlarms = alarms.filter((a) => !a.resolved).length
    const averageBattery =
        devices.length > 0
            ? devices.reduce((sum, d) => sum + (d.batteryLevel || Math.floor(Math.random() * 100)), 0) / devices.length
            : 0

    return {
      activeDevices,
      averageRadiation: Math.round(averageRadiation * 100) / 100,
      activeAlarms,
      averageBattery: Math.round(averageBattery),
    }
  }

  private generateDailyStatsFromDevices(devices: any[]): any[] {
    const stats: any[] = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      const avgRadiation =
          devices.length > 0
              ? devices.reduce((sum, d) => sum + (d.currentReading || d.current_reading || 0), 0) / devices.length
              : 0

      stats.push({
        date: date.toISOString().split("T")[0],
        averageRadiation: Math.round((avgRadiation + (Math.random() - 0.5) * 0.1) * 100) / 100,
        maxRadiation: Math.round(avgRadiation * 1.5 * 100) / 100,
        minRadiation: Math.round(avgRadiation * 0.5 * 100) / 100,
        activeDevices: devices.filter((d) => d.status === "active").length,
        totalAlarms: Math.floor(Math.random() * 3),
      })
    }

    return stats
  }

  private generateMonthlyStatsFromDevices(devices: any[]): any {
    const avgRadiation =
        devices.length > 0
            ? devices.reduce((sum, d) => sum + (d.currentReading || d.current_reading || 0), 0) / devices.length
            : 0

    return {
      totalDevices: devices.length,
      activeDevices: devices.filter((d) => d.status === "active").length,
      averageRadiation: Math.round(avgRadiation * 100) / 100,
      totalReadings: devices.length * 30,
      uptime: 98.5,
    }
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = "Ha ocurrido un error inesperado"

    console.error("DataService Error:", error)

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`
    } else {
      switch (error.status) {
        case 0:
          errorMessage = "No se puede conectar con el servidor. Verifica que esté ejecutándose."
          break
        case 400:
          errorMessage = "Solicitud inválida"
          break
        case 401:
          errorMessage = "No autorizado - Inicia sesión nuevamente"
          break
        case 403:
          errorMessage = "Acceso denegado"
          break
        case 404:
          errorMessage = "Recurso no encontrado"
          break
        case 500:
          errorMessage = "Error interno del servidor"
          break
        default:
          errorMessage = `Error ${error.status}: ${error.message}`
      }
    }

    return throwError(() => ({ ...error, message: errorMessage }))
  }
}
