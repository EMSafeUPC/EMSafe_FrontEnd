import { Component, Input, OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatCardModule } from "@angular/material/card"
import { MatIconModule } from "@angular/material/icon"
import { MatButtonModule } from "@angular/material/button"
import { MatChipsModule } from "@angular/material/chips"
import { MatDividerModule } from "@angular/material/divider"
import { TranslateModule, TranslateService } from "@ngx-translate/core"

@Component({
  selector: "app-alarm-card",
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    TranslateModule,
  ],
  templateUrl: "./alarm-card.component.html",
  styleUrls: ["./alarm-card.component.css"],
})
export class AlarmCardComponent implements OnInit {
  @Input() alarm: any
  @Input() showActions = true // Control whether to show action buttons

  levelColor = ""
  typeIcon = ""

  constructor(private translateService: TranslateService) {}

  ngOnInit(): void {
    this.setLevelColor()
    this.setTypeIcon()
    console.log("Alarm data:", this.alarm) // Debug
  }

  setLevelColor(): void {
    switch (this.alarm?.level) {
      case "info":
        this.levelColor = "#2196f3"
        break
      case "warning":
        this.levelColor = "#ff9800"
        break
      case "critical":
        this.levelColor = "#f44336"
        break
      default:
        this.levelColor = "#9e9e9e"
    }
  }

  setTypeIcon(): void {
    switch (this.alarm?.type) {
      case "radiation_threshold":
        this.typeIcon = "warning"
        break
      case "system":
        this.typeIcon = "settings"
        break
      case "connectivity":
        this.typeIcon = "wifi_off"
        break
      default:
        this.typeIcon = "notifications"
    }
  }

  getTimeAgo(timestamp: string): string {
    if (!timestamp) return "N/A"

    const now = new Date()
    const alarmTime = new Date(timestamp)
    const diffMs = now.getTime() - alarmTime.getTime()

    const diffMins = Math.floor(diffMs / (1000 * 60))
    if (diffMins < 60) {
      return `${diffMins} min`
    }

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) {
      return `${diffHours} h`
    }

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} d`
  }

  getAlarmTypeTranslation(type: string): string {
    if (!type) return "Unknown"

    // Crear la clave de traducción
    const translationKey = `ALARM.TYPE.${type.toUpperCase()}`

    // Intentar obtener la traducción
    // Si no existe, devolver el tipo formateado
    return this.translateService.instant(translationKey) !== translationKey
        ? this.translateService.instant(translationKey)
        : type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }
}
