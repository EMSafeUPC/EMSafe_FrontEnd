import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

interface User {
    id: number;
    username: string;
    password?: string;
    name: string;
    email: string;
    role: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    currentUser$ = this.currentUserSubject.asObservable();
    private apiUrl = 'http://localhost:3000'; // URL de json-server
    private isBrowser: boolean;

    constructor(
        private http: HttpClient,
        private router: Router,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
        this.isBrowser = isPlatformBrowser(this.platformId);

        // Verificar si hay un usuario almacenado en localStorage solo si estamos en el navegador
        if (this.isBrowser) {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                try {
                    const user = JSON.parse(storedUser);
                    // Eliminar la contraseña del objeto de usuario almacenado
                    delete user.password;
                    this.currentUserSubject.next(user);
                } catch (e) {
                    console.error('Error parsing stored user:', e);
                    localStorage.removeItem('currentUser');
                }
            }
        }
    }

    login(username: string, password: string, rememberMe: boolean): Observable<User> {
        // En un entorno real, esto sería una llamada a la API con la contraseña hasheada
        return this.http.get<User[]>(`${this.apiUrl}/users?username=${username}`)
            .pipe(
                map(users => {
                    if (users.length === 0) {
                        throw { status: 401, message: 'Invalid credentials' };
                    }

                    const user = users[0];

                    // Verificar la contraseña si existe
                    if (user.password && user.password !== password) {
                        throw { status: 401, message: 'Invalid credentials' };
                    }

                    // Crear una copia del usuario sin la contraseña para almacenar
                    const userToStore = { ...user };
                    delete userToStore.password;

                    // Almacenar el usuario en localStorage si rememberMe está activado y estamos en el navegador
                    if (this.isBrowser) {
                        if (rememberMe) {
                            localStorage.setItem('currentUser', JSON.stringify(userToStore));
                        } else {
                            sessionStorage.setItem('currentUser', JSON.stringify(userToStore));
                        }
                    }

                    this.currentUserSubject.next(userToStore);
                    return userToStore;
                }),
                catchError(error => {
                    return throwError(() => error);
                })
            );
    }

    logout() {
        // Elimina token y usuario
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null); // Si usas BehaviorSubject
    }

    isLoggedIn(): boolean {
        return this.currentUserSubject.value !== null;
    }

    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    // Método para verificar si el token está expirado (simulado)
    isTokenExpired(): boolean {
        // En un entorno real, verificaríamos la expiración del token JWT
        return false;
    }
}