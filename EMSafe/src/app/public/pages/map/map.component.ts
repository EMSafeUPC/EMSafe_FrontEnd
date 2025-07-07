import { Component, OnInit, AfterViewInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatOption } from '@angular/material/core';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MatButton } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RadiationPoint } from '../interfaces/radiation-point.interface';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    MatOption,
    MatFormField,
    MatLabel,
    MatSelect,
    MatCardModule,
    MatInputModule,
    MatIconModule,
    TranslatePipe,
    MatButton
  ]
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  private map: any;
  private L: any;
  private markersLayer: any;

  // Estados del componente
  public isLoading = false;
  public errorMessage: string | null = null;

  // Datos
  public allRadiationPoints: RadiationPoint[] = [];
  public filteredNearbyZones: RadiationPoint[] = [];

  // Filtros y búsqueda
  public searchTerm: string = '';
  public selectedDataType: string = 'all';

  // Estado de eliminación
  public isDeletingPoint: number | null = null;

  constructor(
      @Inject(PLATFORM_ID) private platformId: Object,
      private http: HttpClient,
      private translate: TranslateService
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.loadLeafletAndInitMap();
      }, 500);
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private async loadLeafletAndInitMap(): Promise<void> {
    try {
      this.L = await import('leaflet');
      console.log('Leaflet cargado:', this.L);

      delete (this.L.Icon.Default.prototype as any)._getIconUrl;
      this.L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'assets/images/marker-icon-2x.png',
        iconUrl: 'assets/images/marker-icon.png',
        shadowUrl: 'assets/images/marker-shadow.png',
      });

      this.initializeMap();
    } catch (error) {
      console.error('Error cargando Leaflet:', error);
      this.errorMessage = this.translate.instant('RADIATION_MAP.DELETE_ERROR');
    }
  }

  private initializeMap(): void {
    const mapContainer = document.getElementById('leaflet-map');
    if (!mapContainer) {
      console.error('Contenedor del mapa no encontrado');
      this.errorMessage = 'Contenedor del mapa no encontrado';
      return;
    }

    this.map = this.L.map('leaflet-map', {
      center: [-12.0464, -77.0428],
      zoom: 12,
      zoomControl: true,
      attributionControl: true
    });

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
      tileSize: 256,
      zoomOffset: 0
    }).addTo(this.map);

    // Crear capa para los marcadores
    this.markersLayer = this.L.layerGroup().addTo(this.map);

    this.loadRadiationPointsFromBackend();

    setTimeout(() => {
      this.map.invalidateSize();
    }, 100);
  }

  private loadRadiationPointsFromBackend(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.http.get<RadiationPoint[]>(`${environment.apiUrl}/api/v1/map/points`)
        .pipe(
            catchError((error: HttpErrorResponse) => {
              console.error('Error al cargar puntos:', error);
              this.errorMessage = `${this.translate.instant('RADIATION_MAP.DELETE_ERROR')}: ${error.status} - ${error.message}`;
              return of([]);
            }),
            finalize(() => {
              this.isLoading = false;
            })
        )
        .subscribe({
          next: (points: RadiationPoint[]) => {
            this.allRadiationPoints = points;
            if (points && points.length > 0) {
              this.renderPoints(points);
              this.updateNearbyZones();
              console.log(`${points.length} puntos de radiación cargados`);
            } else {
              console.log('No se encontraron puntos de radiación');
            }
          }
        });
  }

  private renderPoints(points: RadiationPoint[]): void {
    // Limpiar marcadores existentes
    this.markersLayer.clearLayers();

    points.forEach(point => {
      const color = point.color || '#4caf50';
      const circle = this.L.circleMarker([point.latitude, point.longitude], {
        radius: 12,
        fillColor: color,
        color: color,
        weight: 3,
        opacity: 0.8,
        fillOpacity: 0.6
      });

      // Popup con traducciones
      const popupContent = `
        <div style="text-align: center; min-width: 150px;">
          <h4 style="margin: 0 0 8px 0; color: ${color};">${point.description}</h4>
          <p style="margin: 4px 0;"><strong>${this.translate.instant('RADIATION_MAP.LEVEL_LABEL')}:</strong> ${this.getTranslatedLevel(point.level)}</p>
          <p style="margin: 4px 0;"><strong>Radiación:</strong> ${point.radiationValue} ${point.unit || 'µSv/h'}</p>
          ${point.deviceId ? `<p style="margin: 4px 0;"><strong>Dispositivo:</strong> ${point.deviceId}</p>` : ''}
        </div>
      `;

      circle.bindPopup(popupContent);
      circle.bindTooltip(`${point.description}: ${point.radiationValue} ${point.unit || 'µSv/h'}`, {
        permanent: false,
        direction: 'top',
        offset: [0, -10]
      });

      // Agregar a la capa de marcadores
      this.markersLayer.addLayer(circle);
    });
  }

  private updateNearbyZones(): void {
    // Ordenar por nivel de peligro y luego por nombre
    const sortedPoints = [...this.allRadiationPoints].sort((a, b) => {
      const levelOrder = { 'Crítico': 4, 'Alto': 3, 'Elevado': 2, 'Normal': 1 };
      const levelA = levelOrder[a.level as keyof typeof levelOrder] || 0;
      const levelB = levelOrder[b.level as keyof typeof levelOrder] || 0;

      if (levelA !== levelB) {
        return levelB - levelA; // Orden descendente por peligro
      }
      return a.description.localeCompare(b.description); // Orden alfabético
    });

    this.filteredNearbyZones = sortedPoints;
    this.applySearch();
  }

  // Métodos de búsqueda y filtros
  onSearchChange(): void {
    this.applySearch();
  }

  private applySearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredNearbyZones = [...this.allRadiationPoints];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredNearbyZones = this.allRadiationPoints.filter(point =>
          point.description.toLowerCase().includes(searchLower) ||
          point.level.toLowerCase().includes(searchLower)
      );
    }

    // Aplicar filtro de tipo de datos si está seleccionado
    if (this.selectedDataType !== 'all') {
      this.filteredNearbyZones = this.filteredNearbyZones.filter(point =>
          point.level === this.selectedDataType
      );
    }
  }

  onDataTypeChange(): void {
    this.applySearch();
  }

  applyFilters(): void {
    console.log('Aplicando filtros...');
    this.applySearch();

    // Filtrar puntos en el mapa también
    let pointsToShow = this.allRadiationPoints;
    if (this.selectedDataType !== 'all') {
      pointsToShow = pointsToShow.filter(point => point.level === this.selectedDataType);
    }

    this.renderPoints(pointsToShow);
  }

  // Navegación al punto en el mapa
  viewOnMap(zone: RadiationPoint): void {
    if (this.map && zone.latitude && zone.longitude) {
      // Centrar el mapa en el punto seleccionado
      this.map.setView([zone.latitude, zone.longitude], 15);

      // Encontrar y abrir el popup del marcador
      this.markersLayer.eachLayer((layer: any) => {
        const latLng = layer.getLatLng();
        if (Math.abs(latLng.lat - zone.latitude) < 0.0001 &&
            Math.abs(latLng.lng - zone.longitude) < 0.0001) {
          layer.openPopup();
        }
      });

      console.log(`Navegando a: ${zone.description}`);
    }
  }

  // Método para traducir niveles de radiación
  getTranslatedLevel(level: string): string {
    const levelMap: { [key: string]: string } = {
      'Normal': 'RADIATION_MAP.LEVEL_NORMAL',
      'Elevado': 'RADIATION_MAP.LEVEL_ELEVATED',
      'Alto': 'RADIATION_MAP.LEVEL_HIGH',
      'Crítico': 'RADIATION_MAP.LEVEL_CRITICAL'
    };

    const translationKey = levelMap[level];
    return translationKey ? this.translate.instant(translationKey) : level;
  }

  // Métodos auxiliares
  getLocationName(description: string): string {
    // Extraer solo el nombre del lugar (antes del guion)
    return description.split(' - ')[0] || description;
  }

  getLevelClass(level: string): string {
    const levelClasses: { [key: string]: string } = {
      'Crítico': 'red',
      'Alto': 'orange',
      'Elevado': 'yellow',
      'Normal': 'green'
    };
    return levelClasses[level] || 'green';
  }

  updateMap(): void {
    if (this.map) {
      this.map.invalidateSize();
      this.loadRadiationPointsFromBackend();
      console.log('Mapa actualizado');
    } else {
      this.loadLeafletAndInitMap();
    }
  }

  shareMap(): void {
    console.log('Compartiendo mapa...');
    // Implementar lógica de compartir
    const shareText = this.translate.instant('RADIATION_MAP.TITLE');
    if (navigator.share) {
      navigator.share({
        title: shareText,
        text: shareText,
        url: window.location.href
      }).catch(console.error);
    } else {
      // Fallback para navegadores que no soportan Web Share API
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('URL copiada al portapapeles');
      }).catch(() => {
        alert('No se pudo compartir el mapa');
      });
    }
  }

  // Método de eliminación con traducciones completas
  deleteRadiationPoint(point: RadiationPoint): void {
    if (!point.id) {
      console.error('No se puede eliminar: punto sin ID');
      return;
    }

    // Confirmación antes de eliminar con traducciones
    const confirmMessage = `${this.translate.instant('RADIATION_MAP.CONFIRM_DELETE')} "${point.description}"?\n\n${this.translate.instant('RADIATION_MAP.CONFIRM_DELETE_WARNING')}`;

    const confirmDelete = confirm(confirmMessage);

    if (!confirmDelete) {
      return;
    }

    this.isDeletingPoint = point.id;

    this.http.delete<{success: boolean, message: string, id: number}>(`${environment.apiUrl}/api/v1/map/points/${point.id}`)
        .pipe(
            catchError((error: HttpErrorResponse) => {
              console.error('Error al eliminar punto:', error);
              let errorMessage = this.translate.instant('RADIATION_MAP.DELETE_ERROR');

              if (error.status === 404) {
                errorMessage = 'El punto ya no existe';
              } else if (error.error?.message) {
                errorMessage = error.error.message;
              }

              alert(`${errorMessage}: ${error.message}`);
              return of(null);
            }),
            finalize(() => {
              this.isDeletingPoint = null;
            })
        )
        .subscribe({
          next: (response) => {
            if (response !== null) {
              // Eliminar del array local
              this.allRadiationPoints = this.allRadiationPoints.filter(p => p.id !== point.id);

              // Actualizar la lista filtrada
              this.applySearch();

              // Actualizar el mapa
              this.renderPoints(this.allRadiationPoints);

              console.log(`Punto eliminado: ${point.description}`);

              // Mostrar mensaje de éxito traducido
              alert(`${this.translate.instant('RADIATION_MAP.DELETE_SUCCESS')}: "${point.description}"`);
            }
          }
        });
  }
}
