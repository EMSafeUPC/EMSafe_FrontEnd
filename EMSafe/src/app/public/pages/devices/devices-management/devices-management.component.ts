import { Component } from '@angular/core';
import {DatePipe, NgClass, NgForOf, TitleCasePipe} from "@angular/common";
import {MatButton} from "@angular/material/button";
import {MatIcon} from "@angular/material/icon";
import {TranslatePipe} from "@ngx-translate/core";


@Component({
  selector: 'app-devices-management',
    standalone: true,
    imports: [
        NgForOf,
        NgClass,
        MatIcon,
        MatButton,
        TitleCasePipe,
        DatePipe,
        TranslatePipe

    ],
  templateUrl: './devices-management.component.html',
  styleUrl: './devices-management.component.css'
})
export class DevicesManagementComponent {


    displayedColumns: string[] = ['id', 'dispositivo', 'ubicacion', 'fecha', 'nivel', 'estado'];

    devicesDataSource = [
        { id: '#1001', dispositivo: 'Celular', ubicacion: 'Casa', fecha: new Date('2025-04-22T15:45:42'), nivel: 0.18, estado: 'normal' },
        { id: '#1002', dispositivo: 'Refrigerador', ubicacion: 'Casa', fecha: new Date('2025-04-22T15:45:42'), nivel: 0.22, estado: 'normal' },
        { id: '#1003', dispositivo: 'Microondas', ubicacion: 'Casa', fecha: new Date('2025-04-22T15:45:42'), nivel: 1.75, estado: 'crítico' },
        { id: '#1004', dispositivo: 'Laptop', ubicacion: 'Casa', fecha: new Date('2025-04-21T15:45:42'), nivel: 0.15, estado: 'normal' },
        { id: '#1005', dispositivo: 'Televisor', ubicacion: 'Casa', fecha: new Date('2025-04-20T15:45:42'), nivel: 0.65, estado: 'advertencia' },
    ];

    deleteDevice(device: any) {
        this.devicesDataSource = this.devicesDataSource.filter(d => d.id !== device.id);
    }

}
