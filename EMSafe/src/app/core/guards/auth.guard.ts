import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuardService {
    constructor(private authService: AuthService, private router: Router) {}

    canActivate(): boolean {
        // isLoggedIn() ya verifica si el token expiró internamente
        if (this.authService.isLoggedIn()) {
            return true;
        }

        // Si no está autenticado, limpiar sesión y redirigir al login
        this.authService.logout();
        return false;
    }
}

export const AuthGuard: CanActivateFn = () => {
    return inject(AuthGuardService).canActivate();
};
