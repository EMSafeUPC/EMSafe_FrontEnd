import {Component, Input} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { TranslateModule } from "@ngx-translate/core";
import { Device } from "../../../pages/interfaces/device.interface";
import { EventEmitter, Output } from '@angular/core';

@Component({
  selector: "app-device-card",
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: "./device-card.component.html",
  styleUrls: ["./device-card.component.css"]
})
export class DeviceCardComponent {
  @Input() device!: Device;
  @Output() delete = new EventEmitter<number>();

  get statusColor(): string {
    const status = this.device?.status?.status?.toLowerCase();
    switch (status) {
      case "normal": return "#4CAF50";
      case "advertencia": return "#FF9800";
      case "crítico": return "#F44336";
      default: return "#2196F3";
    }
  }

  get readingColor(): string {
    const reading = this.device?.currentReading || 0;
    if (reading >= 1.0) return "#F44336";
    if (reading >= 0.8) return "#FF9800";
    return "#4CAF50";
  }

  getStatusText(): string {
    return this.device?.status?.status || "Desconocido";
  }

  getDeviceType(): string {
    return this.device?.type?.type || "Tipo desconocido";
  }

  getLastReadingDate(): string {
    if (!this.device?.lastReadDate) return "Sin fecha";
    return new Date(this.device.lastReadDate).toLocaleDateString();
  }

  onDelete(): void {
    this.delete.emit(this.device.id);
  }
}
