import { Component, OnInit } from '@angular/core';
import { Device, DeviceStatus, DeviceType, DeviceFrequency } from '../../interfaces/device.interface';
import { DataService } from '../../../../core/services/data.service';
import { TranslatePipe } from '@ngx-translate/core';
import {
    CommonModule,
    DatePipe,
    NgForOf,
    NgIf,
    TitleCasePipe
} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeviceCardComponent } from '../../../shared/components/device-card/device-card.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
    selector: 'app-devices-management',
    standalone: true,
    templateUrl: './devices-management.component.html',
    styleUrls: ['./devices-management.component.css'],
    imports: [
        CommonModule,
        TranslatePipe,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        FormsModule,
        DeviceCardComponent
    ]
})
export class DevicesManagementComponent implements OnInit {
    devices: Device[] = [];
    statuses: DeviceStatus[] = [];
    types: DeviceType[] = [];
    frequencies: DeviceFrequency[] = [];

    loading = false;
    error: string | null = null;
    showForm = false;

    newDevice: any = {
        name: '',
        location: '',
        currentReading: 0,
        lastReadDate: '',
        status: null,
        type: null,
        frequency: null
    };

    constructor(private dataService: DataService) {}

    ngOnInit(): void {
        this.loadDevices();
        this.loadCatalogs();
    }

    loadDevices(): void {
        this.loading = true;
        this.dataService.getDevices().subscribe({
            next: (data) => {
                this.devices = data;
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.error = err.message || 'Error cargando dispositivos';
                this.loading = false;
            }
        });
    }

    loadCatalogs(): void {
        this.dataService.getDeviceStatuses().subscribe((data) => (this.statuses = data));
        this.dataService.getDeviceTypes().subscribe((data) => (this.types = data));
        this.dataService.getDeviceFrequencies().subscribe((data) => (this.frequencies = data));
    }

    deleteDevice(id: number): void {
        if (confirm('¿Estás seguro de que deseas eliminar este dispositivo?')) {
            this.dataService.deleteDevice(id).subscribe({
                next: () => this.loadDevices(),
                error: (err) => console.error('Error al eliminar dispositivo:', err)
            });
        }
    }

    toggleForm(): void {
        this.showForm = !this.showForm;
    }

    createDevice(): void {
        // Verificación y transformación del payload
        if (!this.newDevice.status || !this.newDevice.type || !this.newDevice.frequency) {
            alert('Selecciona todos los campos: Estado, Tipo y Frecuencia');
            return;
        }

        const deviceToSend = {
            name: this.newDevice.name,
            location: this.newDevice.location,
            currentReading: this.newDevice.currentReading,
            lastReadDate: this.newDevice.lastReadDate,
            status: { id: this.newDevice.status.id, status: this.newDevice.status.status },
            type: { id: this.newDevice.type.id },
            frequency: { id: this.newDevice.frequency.id }
        };

        console.log('📤 Enviando al backend:', deviceToSend);

        this.dataService.createDevice(deviceToSend).subscribe({
            next: () => {
                this.loadDevices();
                this.toggleForm();
                this.resetNewDevice();
            },
            error: (err) => console.error('❌ Error al crear dispositivo:', err)
        });
    }

    private resetNewDevice(): void {
        this.newDevice = {
            name: '',
            location: '',
            currentReading: 0,
            lastReadDate: '',
            status: null,
            type: null,
            frequency: null
        };
    }

    compareById(a: { id: number }, b: { id: number }): boolean {
        return a?.id === b?.id;
    }
}
