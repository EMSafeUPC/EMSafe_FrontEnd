import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
  personalInfoForm!: FormGroup;
  passwordForm!: FormGroup;

  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  savingPersonalInfo = false;
  changingPassword = false;

  constructor(
      private formBuilder: FormBuilder,
      private authService: AuthService,
      private userService: UserService,
      private translateService: TranslateService,
      private snackBar: MatSnackBar,
      @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    this.initForms();
    this.loadUserData();
  }

  initForms(): void {
    // Formulario de información personal
    this.personalInfoForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      username: [{ value: '', disabled: true }]
    });

    // Formulario de cambio de contraseña
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
      return;
    }

    this.userService.getFullName().subscribe({
      next: (res) => {
        if (res?.fullName) {
          const [firstName, ...lastNameParts] = res.fullName.split(' ');
          const lastName = lastNameParts.join(' ');
          this.personalInfoForm.patchValue({ name: `${firstName} ${lastName}` });
        } else {
          this.showErrorMessage('PROFILE.ERROR_LOADING_NAME');
        }
      },
      error: () => this.showErrorMessage('PROFILE.ERROR_LOADING_NAME')
    });


    this.userService.getEmail().subscribe({
      next: (res) => {
        this.personalInfoForm.patchValue({ email: res.email });
      },
      error: () => this.showErrorMessage('PROFILE.ERROR_LOADING_EMAIL')
    });

    this.userService.getUserName().subscribe({
      next: (res) => {
        this.personalInfoForm.patchValue({ username: res.username });
      },
      error: () => this.showErrorMessage('PROFILE.ERROR_LOADING_USERNAME')
    });
  }


  savePersonalInfo(): void {
    if (this.personalInfoForm.invalid) {
      return;
    }

    this.savingPersonalInfo = true;
    const formData = this.personalInfoForm.value;

    // Simulamos una llamada a la API con un timeout
    setTimeout(() => {
      // Actualizar datos del usuario
      if (this.user) {
        this.user.name = formData.name;
        this.user.email = formData.email;

        // En un entorno real, aquí se enviarían los datos al servidor
        this.userService.updateUserProfile(this.user.id, formData)
            .subscribe({
              next: (updatedUser) => {
                this.savingPersonalInfo = false;
                this.showSuccessMessage('PROFILE.PERSONAL_INFO_SAVED');
              },
              error: (error) => {
                this.savingPersonalInfo = false;
                this.showErrorMessage('PROFILE.ERROR_SAVING');
              }
            });
      } else {
        this.savingPersonalInfo = false;
        this.showErrorMessage('PROFILE.USER_NOT_FOUND');
      }
    }, 1500);
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;

    this.changingPassword = true;
    const { newPassword, confirmPassword } = this.passwordForm.value;

    this.userService.changePassword(newPassword, confirmPassword).subscribe({
      next: () => {
        this.changingPassword = false;
        this.passwordForm.reset();
        this.hideCurrentPassword = true;
        this.hideNewPassword = true;
        this.hideConfirmPassword = true;
        this.showSuccessMessage('PROFILE.PASSWORD_CHANGED');
      },
      error: (error) => {
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