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
  private currentPoints: RadiationPoint[] = [];
  nearbyZones: RadiationZone[] = [];
  mapStats: any;
  selectedLevel: RadiationLevel = 'ALL_LEVELS';
  onlyActive: boolean = false;
  withAlerts: boolean = false;

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
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            this.loadNearbyZones(lat, lng, 5);
          },
          () => {
            this.loadNearbyZones(-12.0464, -77.0428, 5);
          }
        );
      } else {
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
        const urlParams = new URLSearchParams(window.location.search);
        const lat = parseFloat(urlParams.get('lat') || '');
        const lng = parseFloat(urlParams.get('lng') || '');
        const zoom = parseInt(urlParams.get('zoom') || '');
        if (!isNaN(lat) && !isNaN(lng) && !isNaN(zoom)) {
          this.map.setView([lat, lng], zoom);
        }
        resolve();
      } catch {
        resolve();
      }
    });
  }

  private createMap(L: any): void {
    const mapElement = document.getElementById('leaflet-map');
    if (!mapElement) return;
    if (this.map) this.map.remove();
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
        }
      })
    );
  }

  private loadPointsInView(): void {
    const bounds = this.map.getBounds();
    this.subscription.add(
      this.mapService.getPointsInBounds(
        bounds.getSouth(), bounds.getNorth(), bounds.getWest(), bounds.getEast()
      ).subscribe({
        next: (points) => {
          this.currentPoints = points;
          this.clearMarkers();
          this.addPointsToMap(points);
        }
      })
    );
  }

  private loadNearbyZones(lat: number, lng: number, radius: number): void {
    this.subscription.add(
      this.mapService.getNearbyZones(lat, lng, radius).subscribe({
        next: (zones) => {
          this.nearbyZones = zones;
        }
      })
    );
  }

  private loadMapStats(): void {
    this.subscription.add(
      this.mapService.getMapStats().subscribe({
        next: (stats) => {
          this.mapStats = stats;
        }
      })
    );
  }

  private addPointsToMap(points: RadiationPoint[]): void {
    this.clearMarkers();
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
        </div>`;
      circle.bindPopup(popupContent);
      circle.addTo(this.map);
      this.markers.push(circle);
    });
  }

  private filterPointsByLevel(points: RadiationPoint[]): RadiationPoint[] {
    if (this.selectedLevel === 'ALL_LEVELS') return points;
    const levelRanges: Record<Exclude<RadiationLevel, 'ALL_LEVELS'>, { min: number; max: number }> = {
      'NORMAL': { min: 0, max: 0.3 },
      'ELEVATED': { min: 0.3, max: 0.6 },
      'HIGH': { min: 0.6, max: 1.0 },
      'CRITICAL': { min: 1.0, max: Infinity }
    };
    return points.filter(point => {
      const value = parseFloat(point.radiationValue);
      const range = levelRanges[this.selectedLevel as Exclude<RadiationLevel, 'ALL_LEVELS'>];
      return value >= range.min && value < range.max;
    });
  }

  onLevelChange(event: any): void {
    this.selectedLevel = event.value;
    this.applyFilters();
  }

  applyFilters(): void {
    this.clearMarkers();
    let filtered = [...this.currentPoints];
    filtered = this.filterPointsByLevel(filtered);
    if (this.onlyActive) {
      filtered = filtered.filter(p => p.status === 'active');
    }
    if (this.withAlerts) {
      filtered = filtered.filter(p => parseFloat(p.radiationValue) > 0.5);
    }
    this.addPointsToMap(filtered);
  }

  private clearMarkers(): void {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
  }

  public refreshPoints(): void {
    this.loadPoints();
    const center = this.map.getCenter();
    this.loadNearbyZones(center.lat, center.lng, 5);
  }

  public viewZoneOnMap(zoneId: number): void {
    this.subscription.add(
      this.mapService.getZoneDetails(zoneId).subscribe({
        next: (zone) => {
          if (zone.points?.length > 0) {
            const bounds = this.calculateZoneBounds(zone.points);
            this.map.fitBounds(bounds);
          }
        }
      })
    );
  }

  private calculateZoneBounds(points: RadiationPoint[]): L.LatLngBounds {
    const latLngs = points.map(p => [p.latitude, p.longitude] as L.LatLngTuple);
    return L.latLngBounds(latLngs);
  }

  public showZoneOnMap(zone: RadiationZone): void {
    if (!this.map || !zone.points?.length) return;
    const bounds = this.calculateZoneBounds(zone.points);
    this.map.fitBounds(bounds, { padding: [50, 50] });
    this.clearMarkers();
    this.addPointsToMap(zone.points);
  }
}
