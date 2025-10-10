/*
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { RolesService } from '../services/roles.service';
import { NabvarComponent } from '../nabvar/nabvar.component';
import { FooterComponent } from "../footer/footer.component";

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NabvarComponent, FooterComponent],
  templateUrl: './main-register.component.html',
  styleUrls:['./main-register.component.css']
})
export class MainRegisterComponent{

  registerForm!: FormGroup;
  errors: Record<string, string[]> = {};

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    // Inicializa el FormGroup (esto evita "formGroup expects a FormGroup instance")
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', Validators.required],
        role_id: ['', Validators.required] // Campo de rol
    });

    // Cargar roles públicos para el select
    this.rolesService.getPublicRoles().subscribe({
      next: (data) => this.roles = data,
      error: (err) => console.error('Error cargando roles', err)
    });

  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.errors = {};
    this.http.post('http://127.0.0.1:8000/api/register', this.registerForm.value)
      .subscribe({
        next: (res) => {
          console.log('Registro OK', res);
          this.router.navigate(['/login']);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error al registrar:', err);
          if (err.status === 422 && err.error?.errors) {
            this.errors = err.error.errors;
          } else {
            // manejar otros errores
          }
        }
      });
  }
}
*/

//esta funciona

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { RolesService } from '../../services/roles.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './main-register.component.html',
  styleUrls: ['./main-register.component.css']
})
export class MainRegisterComponent {
  registerForm: FormGroup;
  roles: any[] = [];
  errors: Record<string, string[]> = {};

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
private rolesService: RolesService
  ) {
    // Inicializar FormGroup
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', Validators.required],
      role_id: [''] // aqui guardamos el id del  rol
    });

    // Cargar roles públicos
    this.rolesService.getPublicRoles().subscribe({
      next: (data) => {
        console.log('Roles recibidos:', data); // <-- añade este log
        this.roles = data;
      },
      error: (err) => console.error('Error cargando roles', err)
    });
  }

  get errorKeys(): string[] {
  return Object.keys(this.errors || {});
}


  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.errors = {};
    console.log(this.registerForm.value)
    this.http.post('http://127.0.0.1:8000/api/register', this.registerForm.value)
      .subscribe({
        next: () => this.router.navigate(['/login']),
        error: (err) => {
          if (err.status === 422 && err.error?.errors) {
            this.errors = err.error.errors;
          } else {
            console.error('Error en el registro', err);
          }
        }
      });
  }
}
