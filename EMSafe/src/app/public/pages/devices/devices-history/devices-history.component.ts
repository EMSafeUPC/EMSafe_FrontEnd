import { Component } from '@angular/core';
import {TranslatePipe} from "@ngx-translate/core";
import {MatButton} from "@angular/material/button";
import {DatePipe, NgClass, NgForOf, NgIf, TitleCasePipe} from "@angular/common";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef,
  MatTable
} from "@angular/material/table";

@Component({
  selector: 'app-devices-history',
  imports: [
    TranslatePipe,
    MatButton,
    NgClass,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatHeaderCellDef,
    MatCellDef,
    DatePipe,
    MatHeaderRow,
    MatRow,
    MatHeaderRowDef,
    MatRowDef,
    TitleCasePipe,
    NgIf,
    NgForOf
  ],
  templateUrl: './devices-history.component.html',
  styleUrl: './devices-history.component.css'
})
export class DevicesHistoryComponent {
  currentView = 'tabla'; // Inicialmente en modo tabla

  displayedColumns: string[] = ['id', 'dispositivo', 'ubicacion', 'fecha', 'nivel', 'estado'];

  dataSource = [
    { id: '#1001', dispositivo: 'Celular', ubicacion: 'Casa', fecha: new Date('2025-04-22T15:45:42'), nivel: 0.18, estado: 'normal' },
    { id: '#1002', dispositivo: 'Refrigerador', ubicacion: 'Casa', fecha: new Date('2025-04-22T15:45:42'), nivel: 0.22, estado: 'normal' },
    { id: '#1003', dispositivo: 'Microondas', ubicacion: 'Casa', fecha: new Date('2025-04-22T15:45:42'), nivel: 1.75, estado: 'crítico' },
    { id: '#1004', dispositivo: 'Laptop', ubicacion: 'Casa', fecha: new Date('2025-04-21T15:45:42'), nivel: 0.15, estado: 'normal' },
    { id: '#1005', dispositivo: 'Televisor', ubicacion: 'Casa', fecha: new Date('2025-04-20T15:45:42'), nivel: 0.65, estado: 'advertencia' },
  ];

}
