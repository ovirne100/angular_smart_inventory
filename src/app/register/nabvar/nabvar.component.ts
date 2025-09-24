/*
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-nabvar',
  imports: [RouterLink],
  templateUrl: './nabvar.component.html',
  styleUrl: './nabvar.component.css'
})
export class NabvarComponent {

}
*/
// src/app/nabvar/nabvar.component.ts

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-nabvar',
  templateUrl: './nabvar.component.html',
  styleUrls: ['./nabvar.component.css'],
  standalone:true,
  imports: [CommonModule, RouterLink] // esto me sirve para que la ruta de ingresar en register no aparesca en login
})
export class NabvarComponent implements OnInit {
  showLoginLink: boolean = true; // El valor inicial, por defecto se muestra

  constructor(private router: Router) {}

  ngOnInit() {
    // Suscríbete a los eventos del router para saber cuándo cambia la URL
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Si la URL actual es '/login', oculta el enlace
      this.showLoginLink = this.router.url !== '/login';
    });
  }
}