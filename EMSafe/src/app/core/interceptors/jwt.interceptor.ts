import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Obtener el token del servicio de autenticación
        const token = this.authService.getToken();

        // Si hay token y la request es a nuestra API, agregar el header Authorization
        if (token && request.url.includes('/api/')) {
            request = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
        }

        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                // Si recibimos un 401, el token probablemente expiró
                if (error.status === 401 && token) {
                    console.log('Token expirado, cerrando sesión...');
                    this.authService.logout();
                }

                return throwError(() => error);
            })
        );
    }
}