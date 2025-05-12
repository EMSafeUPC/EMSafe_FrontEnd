import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class LoginGuardService {
    constructor(private authService: AuthService, private router: Router) {}

    canActivate(): boolean {
        // Si el usuario ya está autenticado, redirigir al dashboard
        if (this.authService.isLoggedIn() && !this.authService.isTokenExpired()) {
            this.router.navigate(['/dashboard']);
            return false;
        }

        // Si no está autenticado, permitir acceso a la página de login
        return true;
    }
}

export const LoginGuard: CanActivateFn = () => {
    return inject(LoginGuardService).canActivate();
};