export interface RadiationPoint {
    id?: number;
    latitude: number;
    longitude: number;
    level: string;
    color: string;
    description: string;
    radiationValue: number;
    unit?: string;
    deviceId?: number;
}