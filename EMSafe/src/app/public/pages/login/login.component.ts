import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatCardModule,
    MatDividerModule,
    TranslateModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  hidePassword = true;
  isLoading = false;
  errorMessage: string | null = null;
  currentYear = new Date().getFullYear();
  isBrowser: boolean;
  isLoggedIn = false;
  currentUser: any = null;
  loggingOut = false;

  languages = [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'English' }
  ];

  constructor(
      private formBuilder: FormBuilder,
      private authService: AuthService,
      private router: Router,
      @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.initForm();
    this.checkLoginStatus();
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.currentUser = user;
    });
  }

  initForm() {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  checkLoginStatus(): void {
    // Verificar si el usuario ya está logueado
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      this.currentUser = this.authService.getCurrentUser();
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const { username, password, rememberMe } = this.loginForm.value;

    // Solo ejecutamos la lógica de login en el navegador
    if (this.isBrowser) {
      // Simulamos una llamada a la API con un timeout
      setTimeout(() => {
        this.authService.login(username, password, rememberMe)
            .subscribe({
              next: (user) => {
                this.isLoggedIn = true;
                this.currentUser = user;
                this.isLoading = false;
                // No redirigimos automáticamente, mostramos el estado de sesión iniciada
              },
              error: (error) => {
                this.isLoading = false;

                // Manejo de diferentes tipos de errores
                if (error.status === 401) {
                  this.errorMessage = 'LOGIN.ERROR.INVALID_CREDENTIALS';
                } else if (error.status === 403) {
                  this.errorMessage = 'LOGIN.ERROR.ACCOUNT_LOCKED';
                } else {
                  this.errorMessage = 'LOGIN.ERROR.GENERAL';
                }
              }
            });
      }, 1500); // Simulamos un retraso de 1.5 segundos para mostrar el spinner
    }
  }

  logout(): void {
    this.loggingOut = true;

    // Simulamos un pequeño retraso para mostrar el spinner
    setTimeout(() => {
      this.authService.logout();
      this.isLoggedIn = false;
      this.currentUser = null;
      this.loggingOut = false;
    }, 1000);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}