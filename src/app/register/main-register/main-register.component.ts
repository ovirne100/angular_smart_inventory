import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { RolesService } from '../../services/roles.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './main-register.component.html',
  styleUrls: ['./main-register.component.css']
})
export class MainRegisterComponent {
  registerForm: FormGroup;
  roles: any[] = [];
  errors: Record<string, string[]> = {};
  cargandoRoles: boolean = true;
  errorRoles: string = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private rolesService: RolesService
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', Validators.required],
      role_id: [{ value: '', disabled: true }, Validators.required]
    });

    this.cargarRoles();
  }

  cargarRoles(): void {
    this.cargandoRoles = true;
    this.errorRoles = '';

    this.rolesService.getPublicRoles().subscribe({
      next: (data) => {
        console.log('Roles recibidos:', data);
        this.roles = data || [];
        this.cargandoRoles = false;

        if (this.roles.length === 0) {
          this.errorRoles = 'No hay roles disponibles';
        } else {
          this.registerForm.get('role_id')?.enable();
        }
      },
      error: (err) => {
        console.error('Error cargando roles:', err);
        this.errorRoles = 'Error al cargar los roles. Por favor, recarga la página.';
        this.cargandoRoles = false;
      }
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

    const formData = this.registerForm.getRawValue();
    console.log('Datos del formulario:', formData);

    this.http.post(`${environment.apiUrl}/register`, formData)
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
