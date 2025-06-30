import { Component } from "@angular/core"
import {FormBuilder, FormGroup, Validators, ReactiveFormsModule} from "@angular/forms"
import { Router, RouterModule } from "@angular/router"
import { TranslatePipe } from "@ngx-translate/core"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatInputModule } from "@angular/material/input"
import { MatButtonModule } from "@angular/material/button"
import { MatIconModule } from "@angular/material/icon"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { CommonModule } from "@angular/common"
import {AuthService} from "../../../core/services/auth.service";

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
  registerForm: FormGroup
  hidePassword = true
  hideConfirmPassword = true
  isLoading = false
  errorMessage = ""
  currentYear = new Date().getFullYear()

  constructor(
      private fb: FormBuilder,
      private authService: AuthService,
      private router: Router,
  ) {
    this.registerForm = this.fb.group({
      name: ["", Validators.required],
      email: ["", Validators.required],
      password: ["", Validators.required],
      confirmPassword: ["", Validators.required],
    })
  }

  onRegister(): void {
    if (this.registerForm.get('name')?.value &&
        this.registerForm.get('email')?.value &&
        this.registerForm.get('password')?.value &&
        this.registerForm.get('confirmPassword')?.value) {

      this.isLoading = true
      this.errorMessage = ""

      const registerData = {
        name: this.registerForm.get('name')?.value,
        email: this.registerForm.get('email')?.value,
        password: this.registerForm.get('password')?.value
      }

      this.authService.register(registerData).subscribe({
        next: () => {
          this.isLoading = false
          this.router.navigate(["/login"])
        },
        error: (err) => {
          this.isLoading = false
          // Use translation keys for error messages
          this.errorMessage = "REGISTER.ERROR.GENERAL"
          console.error("Registration error", err)
        },
      })
    } else {
      this.errorMessage = "REGISTER.ERROR.FILL_ALL_FIELDS"
    }
  }
}
