import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: any = null;
  profileImage: string | null = null;
  passwordForm!: FormGroup;

  // Datos del perfil
  profileData = {
    name: '',
    email: '',
    username: '',
    fullName: ''
  };

  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  changingPassword = false;
  loadingProfile = true;

  constructor(
      private formBuilder: FormBuilder,
      private authService: AuthService,
      private userService: UserService,
      private translateService: TranslateService,
      private snackBar: MatSnackBar,
      @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    this.initPasswordForm();
    this.loadUserData();
  }

  initPasswordForm(): void {
    // Solo formulario de cambio de contraseña
    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  loadUserData(): void {
    this.user = this.authService.getCurrentUser();

    if (!this.user) {
      this.showErrorMessage('PROFILE.USER_NOT_FOUND');
      this.loadingProfile = false;
      return;
    }

    // Usar datos del usuario autenticado como base
    this.profileData.username = this.user.username || '';
    this.profileData.email = this.user.email || '';
    this.profileData.name = `${this.user.firstName || ''} ${this.user.lastName || ''}`.trim();

    this.loadingProfile = true;

    // Intentar cargar datos adicionales del backend
    this.loadAdditionalProfileData();
  }

  private loadAdditionalProfileData(): void {
    let completedRequests = 0;
    const totalRequests = 3;

    const checkCompletion = () => {
      completedRequests++;
      if (completedRequests >= totalRequests) {
        this.loadingProfile = false;
      }
    };

    // Cargar nombre completo
    this.userService.getFullName().subscribe({
      next: (res) => {
        console.log('Full name response:', res);
        if (res?.fullName) {
          this.profileData.fullName = res.fullName;
          this.profileData.name = res.fullName;
        }
        checkCompletion();
      },
      error: (error) => {
        console.error('Error loading full name:', error);
        checkCompletion();
      }
    });

    // Cargar email
    this.userService.getEmail().subscribe({
      next: (res) => {
        console.log('Email response:', res);
        if (res?.email) {
          this.profileData.email = res.email;
        }
        checkCompletion();
      },
      error: (error) => {
        console.error('Error loading email:', error);
        checkCompletion();
      }
    });

    // Cargar username
    this.userService.getUserName().subscribe({
      next: (res) => {
        console.log('Username response:', res);
        if (res?.username) {
          this.profileData.username = res.username;
        }
        checkCompletion();
      },
      error: (error) => {
        console.error('Error loading username:', error);
        checkCompletion();
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;

    this.changingPassword = true;
    const { newPassword, confirmPassword } = this.passwordForm.value;

    this.userService.changePassword(newPassword, confirmPassword).subscribe({
      next: (response) => {
        console.log('Password change response:', response);
        this.changingPassword = false;
        this.passwordForm.reset();
        this.hideCurrentPassword = true;
        this.hideNewPassword = true;
        this.hideConfirmPassword = true;
        this.showSuccessMessage('PROFILE.PASSWORD_CHANGED');
      },
      error: (error) => {
        console.error('Error changing password:', error);
        this.changingPassword = false;
        this.showErrorMessage('PROFILE.ERROR_CHANGING_PASSWORD');
      }
    });
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