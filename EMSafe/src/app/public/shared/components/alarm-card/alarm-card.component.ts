import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-alarm-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    TranslateModule
  ],
  templateUrl: './alarm-card.component.html',
  styleUrls: ['./alarm-card.component.css']
})
export class AlarmCardComponent implements OnInit {
  @Input() alarm: any;
  levelColor: string = '';
  typeIcon: string = '';

  ngOnInit(): void {
    this.setLevelColor();
    this.setTypeIcon();
  }

  setLevelColor(): void {
    switch (this.alarm.level) {
      case 'info':
        this.levelColor = 'blue';
        break;
      case 'warning':
        this.levelColor = 'orange';
        break;
      case 'critical':
        this.levelColor = 'red';
        break;
      default:
        this.levelColor = 'gray';
    }
  }

  setTypeIcon(): void {
    switch (this.alarm.type) {
      case 'radiation_threshold':
        this.typeIcon = 'warning';
        break;
      case 'system':
        this.typeIcon = 'settings';
        break;
      case 'connectivity':
        this.typeIcon = 'wifi_off';
        break;
      default:
        this.typeIcon = 'notifications';
    }
  }

  getTimeAgo(timestamp: string): string {
    const now = new Date();
    const alarmTime = new Date(timestamp);
    const diffMs = now.getTime() - alarmTime.getTime();

    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) {
      return `${diffMins} min`;
    }

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours} h`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} d`;
  }
}