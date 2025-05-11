import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-device-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './device-card.component.html',
  styleUrls: ['./device-card.component.css']
})
export class DeviceCardComponent implements OnInit {
  @Input() device: any;
  statusColor: string = '';
  readingColor: string = '';

  ngOnInit(): void {
    this.setStatusColor();
    this.setReadingColor();
  }

  setStatusColor(): void {
    switch (this.device.status) {
      case 'active':
        this.statusColor = 'green';
        break;
      case 'maintenance':
        this.statusColor = 'orange';
        break;
      case 'inactive':
        this.statusColor = 'gray';
        break;
      case 'alert':
        this.statusColor = 'red';
        break;
      default:
        this.statusColor = 'blue';
    }
  }

  setReadingColor(): void {
    if (this.device.currentReading >= this.device.threshold) {
      this.readingColor = 'red';
    } else if (this.device.currentReading >= this.device.threshold * 0.8) {
      this.readingColor = 'orange';
    } else {
      this.readingColor = 'green';
    }
  }

  getBatteryColor(): string {
    if (this.device.batteryLevel < 20) {
      return 'red';
    } else if (this.device.batteryLevel < 50) {
      return 'orange';
    } else {
      return 'green';
    }
  }
}