import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class DataService {
    private apiUrl = 'http://localhost:3000'; // URL de json-server

    constructor(private http: HttpClient) { }

    // Obtener todos los dispositivos
    getDevices(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/devices`);
    }

    // Obtener todas las alarmas
    getAlarms(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/alarms`);
    }

    // Obtener estadísticas diarias
    getDailyStatistics(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/statistics`).pipe(
            map(stats => stats.daily)
        );
    }

    // Obtener estadísticas mensuales
    getMonthlyStatistics(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/statistics`).pipe(
            map(stats => stats.monthly)
        );
    }

    // Obtener lecturas de un dispositivo específico
    getDeviceReadings(deviceId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/readings`).pipe(
            map(readings => {
                const deviceReading = readings.find(r => r.deviceId === deviceId);
                return deviceReading ? deviceReading.readings : [];
            })
        );
    }

    // Obtener datos del mapa
    getMapData(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/mapData`);
    }

    // Obtener notificaciones
    getNotifications(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/notifications`);
    }

    // Obtener configuración del sistema
    getSettings(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/settings`);
    }
}