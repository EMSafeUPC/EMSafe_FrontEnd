import { Component } from "@angular/core";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { TranslatePipe } from "@ngx-translate/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { CommonModule } from "@angular/common";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: "app-register",
  standalone: true,
  templateUrl: "./register.component.html",
  styleUrls: ['./register.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslatePipe
  ],
})
export class RegisterComponent {
  registerForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading = false;
  errorMessage = "";
  currentYear = new Date().getFullYear();

  constructor(
      private fb: FormBuilder,
      private authService: AuthService,
      private router: Router,
  ) {
    this.registerForm = this.fb.group({
      username: ["", [Validators.required, Validators.minLength(3)]],
      firstName: ["", [Validators.required, Validators.minLength(2)]],
      lastName: ["", [Validators.required, Validators.minLength(2)]],
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
      confirmPassword: ["", [Validators.required]],
    }, { validators: this.passwordMatchValidator });
  }

  // Validador personalizado para confirmar contraseña
  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched();
      this.errorMessage = "REGISTER.ERROR.FILL_ALL_FIELDS";
      return;
    }

    // Verificar que las contraseñas coincidan
    if (this.registerForm.hasError('passwordMismatch')) {
      this.errorMessage = "REGISTER.ERROR.PASSWORD_MISMATCH";
      return;
    }

    this.isLoading = true;
    this.errorMessage = "";

    // 🔥 ESTRUCTURA ACTUALIZADA PARA COINCIDIR CON SWAGGER
    const registerData = {
      username: this.registerForm.get('username')?.value.trim(),
      password: this.registerForm.get('password')?.value,
      firstName: this.registerForm.get('firstName')?.value.trim(),
      lastName: this.registerForm.get('lastName')?.value.trim(),
      email: this.registerForm.get('email')?.value.trim().toLowerCase()
    };

    console.log('Enviando datos de registro (formato Swagger):', registerData);

    this.authService.register(registerData).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Registro exitoso:', response);
        // Redirigir al login con mensaje de éxito
        this.router.navigate(["/login"], {
          queryParams: { registered: 'true' }
        });
      },
      error: (error) => {
        this.isLoading = false;
        console.error("Registration error:", error);

        // Manejo específico de errores
        if (error.status === 400) {
          this.errorMessage = "REGISTER.ERROR.INVALID_DATA";
        } else if (error.status === 409) {
          this.errorMessage = "REGISTER.ERROR.USER_EXISTS";
        } else if (error.status === 0) {
          this.errorMessage = "REGISTER.ERROR.CONNECTION";
        } else {
          this.errorMessage = "REGISTER.ERROR.GENERAL";
        }
      },
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  // Getters para validación en el template
  get username() {
    return this.registerForm.get('username');
  }

  get firstName() {
    return this.registerForm.get('firstName');
  }

  get lastName() {
    return this.registerForm.get('lastName');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }
}
