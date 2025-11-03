import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
 templateUrl: './main-login.component.html',
  styleUrls:['./main-login.component.css']
})

export class MainLoginComponent{
  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.auth.login(this.loginForm.value).subscribe({
      next: (res: any) => {
        // El backend ya devuelve el usuario en la respuesta del login
        // No necesitamos hacer una segunda petición
        if (res.user) {
          // El usuario ya está guardado en el AuthService por el pipe tap
          this.router.navigate(['/dashboard']);
        } else {
          // Fallback: si por alguna razón no viene el usuario, cargarlo
          this.auth.loadUserInfo().subscribe({
            next: () => this.router.navigate(['/dashboard']),
            error: () => this.router.navigate(['/dashboard']) // Navegar de todos modos
          });
        }
      },
      error: () => alert('Usuario o contraseña incorrectos')
    });
  }
}


