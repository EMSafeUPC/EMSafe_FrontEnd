import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatOption } from '@angular/material/core';
import { MatFormField, MatLabel } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import * as L from 'leaflet';


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  imports: [
    MatOption,
    MatCheckbox,
    MatFormField,
    MatLabel,
    MatSelect,
    MatCardModule
  ],
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {
  private map: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initMap();
    }
  }

  private async initMap(): Promise<void> {
    try {
      const L = await import('leaflet'); // Carga dinámica para evitar errores en SSR
      this.createMap(L);
    } catch (error) {
      console.error('Error loading Leaflet:', error);
    }
  }

  private createMap(L: any): void {
    this.map = L.map('leaflet-map').setView([-12.0915285, -77.058909], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);


    /*
    const radiationLegend = L.control({ position: 'bottomright' });

    radiationLegend.onAdd = function () {
      const div = L.DomUtil.create('div', 'info legend-radiation');
      div.innerHTML += `
    <h4>Niveles de Radiación</h4>
    <i style="background: #4caf50;"></i> Normal (0.05 - 0.30 µSv/h)<br>
    <i style="background: #ffeb3b;"></i> Elevado (0.31 - 0.70 µSv/h)<br>
    <i style="background: #ff9800;"></i> Alto (0.71 - 1.00 µSv/h)<br>
    <i style="background: #f44336;"></i> Crítico (>1.00 µSv/h)<br>
  `;
      return div;
    };

    radiationLegend.addTo(this.map); */

    // Marcadores de ejemplo
    const radiationPoints = [
      { lat: -12.0653, lon: -77.1501, nivel: 'Crítico', color: '#f44336', texto: 'Callao' },
      { lat: -12.0732, lon: -77.0937, nivel: 'Alto', color: '#ff9800', texto: 'Jesús María' },
      { lat: -12.1228, lon: -77.0300, nivel: 'Normal', color: '#4caf50', texto: 'Miraflores' },
      { lat: -12.1291, lon: -77.0042, nivel: 'Elevado', color: '#ffeb3b', texto: 'Barranco' },
      { lat: -12.0464, lon: -77.0428, nivel: 'Normal', color: '#4caf50', texto: 'Centro de Lima' }
    ];

    radiationPoints.forEach(p => {
      const circle = L.circleMarker([p.lat, p.lon], {
        radius: 10,
        color: p.color,
        fillColor: p.color,
        fillOpacity: 0.8,
      }).addTo(this.map);

      circle.bindPopup(<strong>${p.texto}</strong><br/>Nivel: ${p.nivel});
    });
  }
}
