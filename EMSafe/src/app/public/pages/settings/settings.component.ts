import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';

interface LoginHistory {
  id: number;
  device: string;
  location: string;
  time: Date;
}

interface ActiveSession {
  id: number;
  device: string;
  browser: string;
  location: string;
  current: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  user: any = null;
  preferencesForm!: FormGroup;

  savingPreferences = false;
  terminatingAllSessions = false;

  languages = [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'English' }
  ];

  loginHistory: LoginHistory[] = [];
  activeSessions: ActiveSession[] = [];

  constructor(
      private formBuilder: FormBuilder,
      private authService: AuthService,
      private userService: UserService,
      private translateService: TranslateService,
      private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.loadUserData();
    this.loadLoginHistory();
    this.loadActiveSessions();
  }

  initForms(): void {
    // Formulario de preferencias
    this.preferencesForm = this.formBuilder.group({
      language: ['es'],
      theme: ['light'],
      emailNotifications: [true],
      pushNotifications: [true],
      smsNotifications: [false]
    });
  }

  loadUserData(): void {
    // Obtener datos del usuario actual
    this.user = this.authService.getCurrentUser();

    if (this.user) {
      // Cargar preferencias
      if (this.user.preferences) {
        this.preferencesForm.patchValue({
          language: this.user.preferences.language || 'es',
          theme: this.user.preferences.theme || 'light',
          emailNotifications: this.user.preferences.notifications?.email ?? true,
          pushNotifications: this.user.preferences.notifications?.push ?? true,
          smsNotifications: this.user.preferences.notifications?.sms ?? false
        });
      }
    }
  }

  loadLoginHistory(): void {
    // Simulamos datos de historial de inicio de sesión
    this.loginHistory = [
      {
        id: 1,
        device: 'Windows PC',
        location: 'Lima, Peru',
        time: new Date('2024-05-10T08:30:15Z')
      },
      {
        id: 2,
        device: 'iPhone',
        location: 'Lima, Peru',
        time: new Date('2024-05-08T14:22:30Z')
      },
      {
        id: 3,
        device: 'Android Tablet',
        location: 'Lima, Peru',
        time: new Date('2024-05-05T19:45:12Z')
      }
    ];
  }

  loadActiveSessions(): void {
    // Simulamos datos de sesiones activas
    this.activeSessions = [
      {
        id: 1,
        device: 'Windows PC',
        browser: 'Chrome 124.0.6367.87',
        location: 'Lima, Peru',
        current: true
      },
      {
        id: 2,
        device: 'iPhone',
        browser: 'Safari 17.4',
        location: 'Lima, Peru',
        current: false
      }
    ];
  }

  savePreferences(): void {
    if (this.preferencesForm.invalid) {
      return;
    }

    this.savingPreferences = true;
    const formData = this.preferencesForm.value;

    // Simulamos una llamada a la API con un timeout
    setTimeout(() => {
      // Actualizar preferencias del usuario
      if (this.user) {
        this.user.preferences = {
          language: formData.language,
          theme: formData.theme,
          notifications: {
            email: formData.emailNotifications,
            push: formData.pushNotifications,
            sms: formData.smsNotifications
          }
        };

        // Cambiar el idioma de la aplicación
        this.translateService.use(formData.language);

        // En un entorno real, aquí se enviarían las preferencias al servidor
        this.userService.updateUserPreferences(this.user.id, this.user.preferences)
            .subscribe({
              next: () => {
                this.savingPreferences = false;
                this.showSuccessMessage('SETTINGS.PREFERENCES_SAVED');
              },
              error: (error) => {
                this.savingPreferences = false;
                this.showErrorMessage('SETTINGS.ERROR_SAVING_PREFERENCES');
              }
            });
      } else {
        this.savingPreferences = false;
        this.showErrorMessage('SETTINGS.USER_NOT_FOUND');
      }
    }, 1500);
  }

  terminateSession(sessionId: number): void {
    // En un entorno real, aquí se enviaría la solicitud para terminar la sesión
    this.userService.terminateSession(sessionId)
        .subscribe({
          next: () => {
            // Eliminar la sesión de la lista
            this.activeSessions = this.activeSessions.filter(session => session.id !== sessionId);
            this.showSuccessMessage('SETTINGS.SESSION_TERMINATED');
          },
          error: (error) => {
            this.showErrorMessage('SETTINGS.ERROR_TERMINATING_SESSION');
          }
        });
  }

  terminateAllSessions(): void {
    this.terminatingAllSessions = true;

    // Simulamos una llamada a la API con un timeout
    setTimeout(() => {
      // En un entorno real, aquí se enviaría la solicitud para terminar todas las sesiones
      this.userService.terminateAllSessions(this.user.id)
          .subscribe({
            next: () => {
              this.terminatingAllSessions = false;
              // Mantener solo la sesión actual
              this.activeSessions = this.activeSessions.filter(session => session.current);
              this.showSuccessMessage('SETTINGS.ALL_SESSIONS_TERMINATED');
            },
            error: (error) => {
              this.terminatingAllSessions = false;
              this.showErrorMessage('SETTINGS.ERROR_TERMINATING_SESSIONS');
            }
          });
    }, 1500);
  }

  getDeviceIcon(device: string): string {
    if (device.toLowerCase().includes('windows') || device.toLowerCase().includes('pc')) {
      return 'computer';
    } else if (device.toLowerCase().includes('iphone') || device.toLowerCase().includes('ios')) {
      return 'smartphone';
    } else if (device.toLowerCase().includes('android')) {
      return 'android';
    } else if (device.toLowerCase().includes('tablet')) {
      return 'tablet';
    } else {
      return 'devices';
    }
  }

  showSuccessMessage(messageKey: string): void {
    this.translateService.get(messageKey).subscribe((message: string) => {
      this.snackBar.open(message, '', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    });
  }

  showErrorMessage(messageKey: string): void {
    this.translateService.get(messageKey).subscribe((message: string) => {
      this.snackBar.open(message, '', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    });
  }
}