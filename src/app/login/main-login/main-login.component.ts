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
        localStorage.setItem('token', res.token); // Guardar token
        alert('Login exitoso');
        this.router.navigate(['/dashboard']); // Ajusta ruta destino
      },
      error: () => alert('Usuario o contraseña incorrectos')
    });
  }
}


