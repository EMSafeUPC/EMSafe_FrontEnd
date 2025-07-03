import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {environment} from "../../environments/environment";

interface UserProfile {
    id?: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
}

interface UserPreferences {
    language: string;
    theme: string;
    notifications: boolean;
    emailAlerts: boolean;
}

interface PasswordChangeRequest {
    currentPassword: string;
    newPassword: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    /**
     * Actualizar perfil de usuario
     */
    updateUserProfile(userId: number, profileData: Partial<UserProfile>): Observable<any> {
        return this.http.put(`${this.apiUrl}/api/v1/users/${userId}/profile`, profileData)
            .pipe(
                catchError(this.handleError)
            );
    }

    /**
     * Actualizar preferencias de usuario
     */
    updateUserPreferences(userId: number, preferences: UserPreferences): Observable<any> {
        return this.http.put(`${this.apiUrl}/api/v1/users/${userId}/preferences`, preferences)
            .pipe(
                catchError(this.handleError)
            );
    }

    /**
     * Cambiar contraseña
     */
    changePassword(userId: number, currentPassword: string, newPassword: string): Observable<any> {
        const passwordChangeRequest: PasswordChangeRequest = {
            currentPassword,
            newPassword
        };

        return this.http.put(`${this.apiUrl}/api/v1/users/${userId}/password`, passwordChangeRequest)
            .pipe(
                catchError(this.handleError)
            );
    }

    /**
     * Obtener perfil de usuario
     */
    getUserProfile(userId: number): Observable<UserProfile> {
        return this.http.get<UserProfile>(`${this.apiUrl}/api/v1/users/${userId}/profile`)
            .pipe(
                catchError(this.handleError)
            );
    }

    /**
     * Obtener preferencias de usuario
     */
    getUserPreferences(userId: number): Observable<UserPreferences> {
        return this.http.get<UserPreferences>(`${this.apiUrl}/api/v1/users/${userId}/preferences`)
            .pipe(
                catchError(this.handleError)
            );
    }

    /**
     * Terminar sesión específica (si implementas múltiples sesiones)
     */
    terminateSession(sessionId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/api/v1/users/sessions/${sessionId}`)
            .pipe(
                catchError(this.handleError)
            );
    }

    /**
     * Terminar todas las sesiones
     */
    terminateAllSessions(userId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/api/v1/users/${userId}/sessions`)
            .pipe(
                catchError(this.handleError)
            );
    }

    /**
     * Manejo de errores HTTP
     */
    private handleError = (error: HttpErrorResponse): Observable<never> => {
        let errorMessage = 'Ha ocurrido un error inesperado';

        if (error.error instanceof ErrorEvent) {
            // Error del lado del cliente
            errorMessage = `Error: ${error.error.message}`;
        } else {
            // Error del lado del servidor
            switch (error.status) {
                case 400:
                    errorMessage = 'Datos inválidos';
                    break;
                case 401:
                    errorMessage = 'No autorizado - Inicia sesión nuevamente';
                    break;
                case 403:
                    errorMessage = 'Acceso denegado';
                    break;
                case 404:
                    errorMessage = 'Usuario no encontrado';
                    break;
                case 500:
                    errorMessage = 'Error interno del servidor';
                    break;
                default:
                    errorMessage = `Error ${error.status}: ${error.message}`;
            }
        }

        console.error('User Service Error:', error);
        return throwError(() => ({ ...error, message: errorMessage }));
    };
}
