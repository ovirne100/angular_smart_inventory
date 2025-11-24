import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { routes } from './app/app.routes';
import { AuthInterceptor } from './app/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),provideHttpClient(
      withInterceptors([AuthInterceptor]) // 👈 registra aquí el interceptor
    ),
    
    // HttpClient global
    importProvidersFrom(
      FormsModule,
      ReactiveFormsModule,
      RouterModule.forRoot(routes, {bindToComponentInputs: true}) // para binding directo con standalone
    )
  ]
});
