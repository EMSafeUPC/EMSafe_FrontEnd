import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuardService {
    constructor(private authService: AuthService, private router: Router) {}

    canActivate(): boolean {
        if (this.authService.isLoggedIn() && !this.authService.isTokenExpired()) {
            return true;
        }

        // Redirigir al login si no está autenticado
        this.router.navigate(['/login']);
        return false;
    }
}

export const AuthGuard: CanActivateFn = () => {
    return inject(AuthGuardService).canActivate();
};