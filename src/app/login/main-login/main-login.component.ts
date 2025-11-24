import { Component, OnInit } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-main-login',
  standalone: true,
  imports: [ReactiveFormsModule],
 templateUrl: './main-login.component.html',
  styleUrls:['./main-login.component.css']
})

export class MainLoginComponent implements OnInit {
  loginForm: FormGroup;
  returnUrl: string = '/dashboard/inicio';

  constructor(
    private fb: FormBuilder, 
    private auth: AuthService, 
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Obtener la URL de retorno de los query params o localStorage
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] 
      || localStorage.getItem('returnUrl') 
      || '/dashboard/inicio';
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.auth.login(this.loginForm.value).subscribe({
      next: (res: any) => {
        // Limpiar returnUrl del localStorage
        localStorage.removeItem('returnUrl');
        
        // El backend ya devuelve el usuario en la respuesta del login
        // No necesitamos hacer una segunda petición
        if (res.user) {
          // Redirigir a la URL guardada o al dashboard por defecto
          console.log('🔗 Redirigiendo a:', this.returnUrl);
          this.router.navigateByUrl(this.returnUrl);
        } else {
          // Fallback: si por alguna razón no viene el usuario, cargarlo
          this.auth.loadUserInfo().subscribe({
            next: () => this.router.navigateByUrl(this.returnUrl),
            error: () => this.router.navigateByUrl(this.returnUrl)
          });
        }
      },
      error: () => alert('Usuario o contraseña incorrectos')
    });
  }
}


