import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { BehaviorSubject, type Observable, throwError } from "rxjs";
import { catchError, map, tap } from "rxjs/operators";
import { isPlatformBrowser } from "@angular/common";
import { Router } from "@angular/router";
import { PLATFORM_ID, Inject } from '@angular/core';
import { environment } from "../../environments/environment";

export interface RegisterRequest {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    email: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface User {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

@Injectable({
    providedIn: "root",
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    currentUser$ = this.currentUserSubject.asObservable();
    private readonly TOKEN_KEY = 'emsafe_token';
    private readonly USER_KEY = 'emsafe_user';
    private isBrowser: boolean;

    constructor(
        private http: HttpClient,
        private router: Router,
        @Inject(PLATFORM_ID) platformId: Object
    ) {
        this.isBrowser = isPlatformBrowser(platformId);

        // Cargar usuario desde localStorage al inicializar
        if (this.isBrowser) {
            this.loadUserFromStorage();
        }
    }

    /**
     * Login del usuario
     */
    login(username: string, password: string, rememberMe: boolean): Observable<User> {
        const loginRequest: LoginRequest = { username, password };

        console.log('Enviando login request:', loginRequest);

        return this.http.post<AuthResponse>(`${environment.apiUrl}/api/v1/auth/login`, loginRequest)
            .pipe(
                tap(response => {
                    console.log('Login response:', response);
                    if (this.isBrowser) {
                        // Guardar token
                        if (rememberMe) {
                            localStorage.setItem(this.TOKEN_KEY, response.token);
                        } else {
                            sessionStorage.setItem(this.TOKEN_KEY, response.token);
                        }

                        // Decodificar token para obtener información del usuario
                        const user = this.decodeToken(response.token);

                        // Guardar usuario
                        if (rememberMe) {
                            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
                        } else {
                            sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
                        }

                        this.currentUserSubject.next(user);
                    }
                }),
                map(response => this.decodeToken(response.token)),
                catchError(this.handleError)
            );
    }

    /**
     * Registro de usuario - CORREGIDO para usar la estructura de Swagger
     */
    register(registerData: RegisterRequest): Observable<User> {
        console.log('Enviando register request:', registerData);

        // 🔥 USAR DIRECTAMENTE LOS DATOS SIN MODIFICAR
        const registerRequest: RegisterRequest = {
            username: registerData.username,
            password: registerData.password,
            firstName: registerData.firstName,
            lastName: registerData.lastName,
            email: registerData.email
        };

        return this.http.post<AuthResponse>(`${environment.apiUrl}/api/v1/auth/register`, registerRequest)
            .pipe(
                tap(response => {
                    console.log('Register response:', response);
                    if (this.isBrowser) {
                        // Guardar token temporalmente en sessionStorage
                        sessionStorage.setItem(this.TOKEN_KEY, response.token);

                        // Decodificar token para obtener información del usuario
                        const user = this.decodeToken(response.token);
                        sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));

                        this.currentUserSubject.next(user);
                    }
                }),
                map(response => this.decodeToken(response.token)),
                catchError(this.handleError)
            );
    }

    /**
     * Logout del usuario
     */
    logout(): void {
        if (this.isBrowser) {
            // Limpiar almacenamiento
            localStorage.removeItem(this.TOKEN_KEY);
            localStorage.removeItem(this.USER_KEY);
            sessionStorage.removeItem(this.TOKEN_KEY);
            sessionStorage.removeItem(this.USER_KEY);
        }

        // Limpiar estado
        this.currentUserSubject.next(null);

        // Redirigir al login
        this.router.navigate(['/login']);
    }

    /**
     * Verificar si el usuario está logueado
     */
    isLoggedIn(): boolean {
        const token = this.getToken();
        return token !== null && !this.isTokenExpired();
    }

    /**
     * Obtener el token actual
     */
    getToken(): string | null {
        if (!this.isBrowser) return null;
        return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
    }

    /**
     * Obtener el usuario actual
     */
    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    /**
     * Verificar si el token ha expirado
     */
    isTokenExpired(): boolean {
        const token = this.getToken();
        if (!token) return true;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload.exp * 1000; // Convertir a millisegundos
            return Date.now() >= exp;
        } catch (error) {
            console.error('Error checking token expiration:', error);
            return true; // Si no se puede decodificar, considerar expirado
        }
    }

    /**
     * Cargar usuario desde el almacenamiento
     */
    private loadUserFromStorage(): void {
        const userStr = localStorage.getItem(this.USER_KEY) || sessionStorage.getItem(this.USER_KEY);
        if (userStr && this.isLoggedIn()) {
            try {
                const user = JSON.parse(userStr);
                this.currentUserSubject.next(user);
            } catch (error) {
                console.error('Error parsing user from storage:', error);
                this.logout();
            }
        }
    }

    /**
     * Decodificar token JWT (básico, sin validación de firma)
     */
    private decodeToken(token: string): User {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('Token payload:', payload);

            // El JWT del backend Spring Boot típicamente contiene información del usuario
            return {
                id: payload.userId || payload.id,
                username: payload.sub || payload.username,
                firstName: payload.firstName || '',
                lastName: payload.lastName || '',
                email: payload.email || payload.sub,
                role: payload.authorities?.[0]?.authority || payload.role || 'USER'
            };
        } catch (error) {
            console.error('Error decoding token:', error);
            throw new Error('Invalid token format');
        }
    }

    /**
     * Obtener datos completos del usuario desde el backend
     */
    private loadUserDetails(): void {
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.username) {
            // Aquí harías una llamada al backend para obtener los datos completos
            // this.http.get<User>(`${environment.apiUrl}/api/v1/users/me`)
            //   .subscribe(userDetails => {
            //     this.currentUserSubject.next(userDetails);
            //     // Actualizar también en storage
            //   });
        }
    }

    /**
     * Manejo de errores HTTP
     */
    private handleError = (error: HttpErrorResponse): Observable<never> => {
        let errorMessage = 'Ha ocurrido un error inesperado';

        console.error('Full error object:', error);

        if (error.error instanceof ErrorEvent) {
            // Error del lado del cliente
            errorMessage = `Error: ${error.error.message}`;
        } else {
            // Error del lado del servidor
            switch (error.status) {
                case 0:
                    errorMessage = 'No se puede conectar con el servidor. Verifica que esté ejecutándose.';
                    break;
                case 400:
                    errorMessage = 'Datos inválidos';
                    break;
                case 401:
                    errorMessage = 'Credenciales incorrectas';
                    break;
                case 403:
                    errorMessage = 'Acceso denegado';
                    break;
                case 404:
                    errorMessage = 'Servicio no encontrado';
                    break;
                case 409:
                    errorMessage = 'El usuario ya existe';
                    break;
                case 500:
                    errorMessage = 'Error interno del servidor';
                    break;
                default:
                    errorMessage = `Error ${error.status}: ${error.message}`;
            }
        }

        console.error('Auth Error:', error);
        return throwError(() => ({ ...error, message: errorMessage }));
    };
}
