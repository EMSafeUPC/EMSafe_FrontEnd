import { Component, Input, OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatCardModule } from "@angular/material/card"
import { MatIconModule } from "@angular/material/icon"
import { MatButtonModule } from "@angular/material/button"
import { MatTooltipModule } from "@angular/material/tooltip"
import { TranslateModule } from "@ngx-translate/core"

@Component({
  selector: "app-device-card",
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatTooltipModule, TranslateModule],
  templateUrl: "./device-card.component.html",
  styleUrls: ["./device-card.component.css"],
})
export class DeviceCardComponent implements OnInit {
  @Input() device: any
  statusColor = ""
  readingColor = ""

  ngOnInit(): void {
    this.setStatusColor()
    this.setReadingColor()
    console.log("Device data:", this.device) // Debug
  }

  setStatusColor(): void {
    // Map status_id to colors (adjust based on your status mapping)
    switch (this.device?.status_id || this.device?.status) {
      case 1:
      case "active":
        this.statusColor = "#4CAF50" // Green
        break
      case 2:
      case "maintenance":
        this.statusColor = "#FF9800" // Orange
        break
      case 3:
      case "inactive":
        this.statusColor = "#9E9E9E" // Gray
        break
      case 4:
      case "alert":
        this.statusColor = "#F44336" // Red
        break
      default:
        this.statusColor = "#2196F3" // Blue
    }
  }

  setReadingColor(): void {
    const reading = this.device?.current_reading || this.device?.currentReading || 0
    const threshold = this.device?.threshold || 1.0 // Default threshold

    if (reading >= threshold) {
      this.readingColor = "#F44336" // Red
    } else if (reading >= threshold * 0.8) {
      this.readingColor = "#FF9800" // Orange
    } else {
      this.readingColor = "#4CAF50" // Green
    }
  }

  getStatusText(): string {
    switch (this.device?.status_id || this.device?.status) {
      case 1:
      case "active":
        return "Activo"
      case 2:
      case "maintenance":
        return "Mantenimiento"
      case 3:
      case "inactive":
        return "Inactivo"
      case 4:
      case "alert":
        return "Alerta"
      default:
        return "Desconocido"
    }
  }

  getDeviceType(): string {
    // Map type_id to device types (adjust based on your type mapping)
    switch (this.device?.type_id) {
      case 1:
        return "Detector Gamma"
      case 2:
        return "Detector Beta"
      case 3:
        return "Detector Epsilon"
      default:
        return "Detector"
    }
  }

  getLastReadingTime(): string {
    const lastReading = this.device?.last_reading
    if (!lastReading) return "N/A"

    const date = new Date(lastReading)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffMins < 60) {
      return `${diffMins} min ago`
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)} h ago`
    } else {
      return date.toLocaleDateString()
    }
  }
}
