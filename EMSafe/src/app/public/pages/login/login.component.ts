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

    // Suscribirse a cambios en el estado de autenticación
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.currentUser = user;
    });
  }

  initForm() {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]], // 🔥 QUITAR VALIDACIÓN DE EMAIL
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  checkLoginStatus(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      this.currentUser = this.authService.getCurrentUser();
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const { username, password, rememberMe } = this.loginForm.value;

    console.log('Intentando login con:', { username, password: '***', rememberMe });

    this.authService.login(username, password, rememberMe)
        .subscribe({
          next: (user) => {
            this.isLoggedIn = true;
            this.currentUser = user;
            this.isLoading = false;
            console.log('Login exitoso:', user);
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error de login:', error);

            // Manejo de diferentes tipos de errores
            if (error.status === 401) {
              this.errorMessage = 'LOGIN.ERROR.INVALID_CREDENTIALS';
            } else if (error.status === 403) {
              this.errorMessage = 'LOGIN.ERROR.ACCOUNT_LOCKED';
            } else if (error.status === 0) {
              this.errorMessage = 'LOGIN.ERROR.CONNECTION';
            } else {
              this.errorMessage = 'LOGIN.ERROR.GENERAL';
            }
          }
        });
  }

  logout(): void {
    this.loggingOut = true;

    setTimeout(() => {
      this.authService.logout();
      this.isLoggedIn = false;
      this.currentUser = null;
      this.loggingOut = false;
      this.loginForm.reset();
    }, 1000);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  // Getters para validación en el template
  get username() { return this.loginForm.get('username'); }
  get password() { return this.loginForm.get('password'); }
}
