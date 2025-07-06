export interface DeviceStatus {
    id: number;
    status: string;
}

export interface DeviceType {
    id: number;
    type: string;
}

export interface DeviceFrequency {
    id: number;
    frequency: string;
}

export interface Device {
    id?: number;
    name: string;
    location: string;
    currentReading: number;
    lastReadDate: string;
    status: DeviceStatus;
    type: DeviceType;
    frequency: DeviceFrequency;
}

