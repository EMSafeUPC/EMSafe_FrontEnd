import { Component, OnInit, Inject, PLATFORM_ID, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import * as L from 'leaflet';
import { MapService, RadiationPoint, RadiationZone } from '../../../core/services/map.service';
import { Subscription } from 'rxjs';

// Definir el tipo para los niveles de radiación
type RadiationLevel = 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL' | 'ALL_LEVELS';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatOptionModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
    TranslateModule
  ],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  private map: any;
  private markers: L.CircleMarker[] = [];
  private subscription: Subscription = new Subscription();
  private currentPoints: RadiationPoint[] = []; // Almacenar los puntos actuales
  nearbyZones: RadiationZone[] = [];
  mapStats: any;
  selectedLevel: RadiationLevel = 'ALL_LEVELS';
  onlyActive: boolean = false;
  withAlerts: boolean = false;

  // Definir los niveles de radiación disponibles
  radiationLevels = [
    { value: 'all', label: 'RADIATION_MAP.ALL_LEVELS' },
    { value: 'normal', label: 'RADIATION_MAP.NORMAL' },
    { value: 'elevated', label: 'RADIATION_MAP.ELEVATED' },
    { value: 'high', label: 'RADIATION_MAP.HIGH' },
    { value: 'critical', label: 'RADIATION_MAP.CRITICAL' }
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private mapService: MapService,
    private snackBar: MatSnackBar,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadMapStats();
      // Obtener la ubicación actual del usuario
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            // Cargar zonas cercanas con un radio de 5km
            this.loadNearbyZones(lat, lng, 5);
          },
          (error) => {
            console.error('Error getting location:', error);
            // Si no se puede obtener la ubicación, usar coordenadas por defecto de Lima
            this.loadNearbyZones(-12.0464, -77.0428, 5);
          }
        );
      } else {
        // Si geolocalización no está disponible, usar coordenadas por defecto de Lima
        this.loadNearbyZones(-12.0464, -77.0428, 5);
      }
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initMap().then(() => {
          this.loadPoints();
        });
      }, 100);
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
    this.subscription.unsubscribe();
  }

  private async initMap(): Promise<void> {
    return new Promise<void>(async (resolve) => {
    try {
        const L = await import('leaflet');
      this.createMap(L);
        this.setupMapEvents(L);
        
        // Verificar si hay parámetros en la URL
        const urlParams = new URLSearchParams(window.location.search);
        const lat = parseFloat(urlParams.get('lat') || '');
        const lng = parseFloat(urlParams.get('lng') || '');
        const zoom = parseInt(urlParams.get('zoom') || '');
        
        // Si hay parámetros válidos, centrar el mapa en esa ubicación
        if (!isNaN(lat) && !isNaN(lng) && !isNaN(zoom)) {
          this.map.setView([lat, lng], zoom);
        }
        
        resolve();
    } catch (error) {
      console.error('Error loading Leaflet:', error);
        resolve();
    }
    });
  }

  private createMap(L: any): void {
    const mapElement = document.getElementById('leaflet-map');
    if (!mapElement) {
      console.error('Map element not found');
      return;
    }

    if (this.map) {
      this.map.remove();
    }

    this.map = L.map('leaflet-map').setView([-12.0915285, -77.058909], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(this.map);
  }

  private setupMapEvents(L: any): void {
    this.map.on('moveend', () => {
      this.loadPointsInView();
      const center = this.map.getCenter();
      this.loadNearbyZones(center.lat, center.lng, 5);
    });

    this.map.on('zoomend', () => {
      this.loadPointsInView();
    });
  }

  private loadPoints(): void {
    this.subscription.add(
      this.mapService.getAllPoints().subscribe({
        next: (points) => {
          this.currentPoints = points;
          this.clearMarkers();
          this.addPointsToMap(points);
        },
        error: (error) => {
          console.error('Error al cargar puntos:', error);
        }
      })
    );
  }

  private loadPointsInView(): void {
    const bounds = this.map.getBounds();
    this.subscription.add(
      this.mapService.getPointsInBounds(
        bounds.getSouth(),
        bounds.getNorth(),
        bounds.getWest(),
        bounds.getEast()
      ).subscribe({
        next: (points) => {
          this.currentPoints = points;
          this.clearMarkers();
          this.addPointsToMap(points);
        },
        error: (error) => {
          console.error('Error al cargar puntos en vista:', error);
        }
      })
    );
  }

  private loadNearbyZones(lat: number, lng: number, radius: number): void {
    this.subscription.add(
      this.mapService.getNearbyZones(lat, lng, radius).subscribe({
        next: (zones) => {
          this.nearbyZones = zones;
        },
        error: (error) => {
          console.error('Error loading nearby zones:', error);
        }
      })
    );
  }

  private loadMapStats(): void {
    this.subscription.add(
      this.mapService.getMapStats().subscribe({
        next: (stats) => {
          this.mapStats = stats;
        },
        error: (error) => {
          console.error('Error al cargar estadísticas:', error);
        }
      })
    );
  }

  private calculateRadius(bounds: L.LatLngBounds): number {
    const center = bounds.getCenter();
    const corner = bounds.getNorthEast();
    return center.distanceTo(corner) / 1000; // Convert to kilometers
  }

  private addPointsToMap(points: RadiationPoint[]): void {
    // Limpiar marcadores existentes
    this.clearMarkers();

    // Filtrar puntos según el nivel seleccionado
    const filteredPoints = this.filterPointsByLevel(points);

    filteredPoints.forEach(point => {
      const circle = L.circleMarker([point.latitude, point.longitude], {
        radius: 12,
        color: point.color,
        fillColor: point.color,
        fillOpacity: 0.8,
        weight: 2
      });

      const popupContent = `
        <div class="popup-content">
          <h3>${point.description}</h3>
          <p>Nivel: ${point.level}</p>
          <p>Valor: ${point.radiationValue} ${point.unit}</p>
          ${point.timestamp ? `<p>Última actualización: ${new Date(point.timestamp).toLocaleString()}</p>` : ''}
        </div>
      `;

      circle.bindPopup(popupContent);
      circle.addTo(this.map);
      this.markers.push(circle);
    });
  }

  private filterPointsByLevel(points: RadiationPoint[]): RadiationPoint[] {
    if (this.selectedLevel === 'ALL_LEVELS') {
      return points;
    }

    // Mapeo de niveles y sus rangos de radiación
    const levelRanges: Record<Exclude<RadiationLevel, 'ALL_LEVELS'>, { min: number; max: number }> = {
      'NORMAL': { min: 0, max: 0.3 },
      'ELEVATED': { min: 0.3, max: 0.6 },
      'HIGH': { min: 0.6, max: 1.0 },
      'CRITICAL': { min: 1.0, max: Infinity }
    };

    return points.filter(point => {
      const radiationValue = parseFloat(point.radiationValue);
      if (this.selectedLevel !== 'ALL_LEVELS') {
        const range = levelRanges[this.selectedLevel];
        // Solo verificar si el valor está en el rango, sin modificar el color
        return radiationValue >= range.min && radiationValue < range.max;
      }
      return false;
    });
  }

  onLevelChange(event: any): void {
    this.selectedLevel = event.value;
    // Aplicar filtros inmediatamente cuando se cambia el nivel
    this.applyFilters();
  }

  applyFilters(): void {
    this.clearMarkers();
    let filteredPoints = [...this.currentPoints]; // Crear una copia para no modificar los originales

    // Filtrar por nivel de radiación
    filteredPoints = this.filterPointsByLevel(filteredPoints);

    // Filtrar por dispositivos activos si está seleccionado
    if (this.onlyActive) {
      filteredPoints = filteredPoints.filter(point => point.status === 'active');
    }

    // Filtrar por alertas si está seleccionado
    if (this.withAlerts) {
      filteredPoints = filteredPoints.filter(point => {
        const radiationValue = parseFloat(point.radiationValue);
        return radiationValue > 0.5;
      });
    }

    this.addPointsToMap(filteredPoints);
  }

  private clearMarkers(): void {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
  }

  // Métodos públicos para la interfaz
  public refreshPoints(): void {
    this.loadPoints();
    const center = this.map.getCenter();
    this.loadNearbyZones(center.lat, center.lng, 5);
  }

  public viewZoneOnMap(zoneId: number): void {
    this.subscription.add(
      this.mapService.getZoneDetails(zoneId).subscribe({
        next: (zone) => {
          if (zone.points && zone.points.length > 0) {
            const bounds = this.calculateZoneBounds(zone.points);
            this.map.fitBounds(bounds);
          }
        },
        error: (error) => {
          console.error('Error al cargar detalles de la zona:', error);
        }
      })
    );
  }

  private calculateZoneBounds(points: RadiationPoint[]): L.LatLngBounds {
    const latLngs = points.map(p => [p.latitude, p.longitude] as L.LatLngTuple);
    return L.latLngBounds(latLngs);
  }

  public shareMap(): void {
    if (!this.map) return;
    
    const center = this.map.getCenter();
    const zoom = this.map.getZoom();
    const date = new Date().toLocaleString();
    
    // Crear el contenido del archivo
    let fileContent = '============================================\n';
    fileContent += '         REPORTE DE RADIACIÓN - EMSafe        \n';
    fileContent += '============================================\n\n';
    
    // Información general
    fileContent += 'INFORMACIÓN GENERAL\n';
    fileContent += '-------------------\n';
    fileContent += `Fecha y hora del reporte: ${date}\n`;
    fileContent += `Ubicación central del mapa: ${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}\n`;
    fileContent += `Nivel de zoom: ${zoom}\n\n`;

    // Estadísticas del mapa si están disponibles
    if (this.mapStats) {
      fileContent += 'ESTADÍSTICAS GENERALES\n';
      fileContent += '---------------------\n';
      fileContent += `Total de puntos monitoreados: ${this.mapStats.totalPoints || 'N/A'}\n`;
      fileContent += `Nivel promedio de radiación: ${this.mapStats.averageRadiation || 'N/A'} µSv/h\n`;
      fileContent += `Nivel máximo detectado: ${this.mapStats.maxRadiation || 'N/A'} µSv/h\n`;
      fileContent += `Dispositivos activos: ${this.mapStats.activeDevices || 'N/A'}\n\n`;
    }

    // Obtener todos los puntos visibles
    const bounds = this.map.getBounds();
    const visiblePoints = this.markers
      .map(marker => {
        const latLng = marker.getLatLng();
        const popup = marker.getPopup();
        const content = popup ? popup.getContent() : '';
        
        // Extraer toda la información del popup
        const descriptionMatch = content?.toString().match(/<h3>(.*?)<\/h3>/);
        const radiationMatch = content?.toString().match(/Valor: ([\d.]+) (.*?)</);
        const levelMatch = content?.toString().match(/Nivel: (.*?)</);
        const timestampMatch = content?.toString().match(/Última actualización: (.*?)</);

        return {
          latitude: latLng.lat,
          longitude: latLng.lng,
          description: descriptionMatch ? descriptionMatch[1] : 'Sin descripción',
          radiationValue: radiationMatch ? radiationMatch[1] : '0',
          unit: radiationMatch ? radiationMatch[2] : 'µSv/h',
          level: levelMatch ? levelMatch[1] : 'Normal',
          timestamp: timestampMatch ? timestampMatch[1] : new Date().toLocaleString()
        };
      })
      .filter(point => bounds.contains([point.latitude, point.longitude]));

    // Detalles de cada punto de radiación
    fileContent += 'PUNTOS DE RADIACIÓN DETECTADOS\n';
    fileContent += '============================\n\n';

    visiblePoints.forEach((point, index) => {
      fileContent += `PUNTO DE RADIACIÓN #${index + 1}\n`;
      fileContent += '------------------------\n';
      fileContent += `Identificación: ${point.description}\n`;
      fileContent += `Coordenadas: ${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}\n`;
      fileContent += `Nivel de radiación: ${point.radiationValue} ${point.unit}\n`;
      fileContent += `Estado: ${point.level}\n`;
      fileContent += `Última actualización: ${point.timestamp}\n`;
      
      // Agregar recomendaciones basadas en el nivel
      fileContent += 'Recomendación: ';
      switch(point.level.toLowerCase()) {
        case 'crítico':
        case 'critical':
          fileContent += 'EVACUACIÓN INMEDIATA. Área de alto riesgo.\n';
          break;
        case 'alto':
        case 'high':
          fileContent += 'PRECAUCIÓN EXTREMA. Limitar exposición.\n';
          break;
        case 'elevado':
        case 'elevated':
          fileContent += 'PRECAUCIÓN. Monitorear constantemente.\n';
          break;
        default:
          fileContent += 'Niveles normales. Sin acciones requeridas.\n';
      }
      fileContent += '\n';
    });

    // Información de zonas cercanas
    if (this.nearbyZones && this.nearbyZones.length > 0) {
      fileContent += 'ZONAS CERCANAS MONITOREADAS\n';
      fileContent += '==========================\n\n';
      
      this.nearbyZones.forEach((zone, index) => {
        fileContent += `ZONA ${index + 1}: ${zone.name}\n`;
        fileContent += `Distancia: ${zone.distance} km\n`;
        fileContent += `Nivel promedio: ${zone.averageRadiation} µSv/h\n\n`;
      });
    }

    // Pie del reporte
    fileContent += '============================================\n';
    fileContent += 'NOTAS IMPORTANTES:\n';
    fileContent += '- Los niveles de radiación se miden en microsieverts por hora (µSv/h)\n';
    fileContent += '- Este reporte muestra solo los puntos visibles en la vista actual del mapa\n';
    fileContent += '- La información se actualiza en tiempo real\n';
    fileContent += '============================================\n';

    // Crear y descargar el archivo
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `emsafe_radiation_report_${new Date().toISOString().split('T')[0]}.txt`;
    
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // Mostrar notificación
    this.translateService.get('RADIATION_MAP.SHARE_SUCCESS').subscribe((msg: string) => {
      this.snackBar.open(msg || 'Reporte generado exitosamente', 'OK', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    });
  }

  public showZoneOnMap(zone: RadiationZone): void {
    if (!this.map || !zone.points || zone.points.length === 0) return;

    // Calcular el centro de la zona usando todos los puntos
    const bounds = this.calculateZoneBounds(zone.points);
    this.map.fitBounds(bounds, { padding: [50, 50] });

    // Resaltar los puntos de la zona
    this.clearMarkers();
    this.addPointsToMap(zone.points);
  }
}
