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
import { Location } from '@angular/common';

@Component({
  selector: 'app-nabvar',
  templateUrl: './nabvar.component.html',
  styleUrls: ['./nabvar.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class NabvarComponent implements OnInit {
  showLoginLink: boolean = false;

  // Pila de historial interno
  private routeHistory: string[] = [];

  constructor(private router: Router, private location: Location) {}

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;
        this.routeHistory.push(url);
        // Opcional: limitar la longitud de la pila para no crecer mucho
        if (this.routeHistory.length > 50) {
          this.routeHistory.shift();
        }

        // Mostrar botón INGRESAR solo en /register
        this.showLoginLink = (url === '/register');
      });
  }

  goBack() {
    // Remover la ruta actual de la pila
    this.routeHistory.pop();

    // La ruta anterior en la pila
    const previous = this.routeHistory.pop();

    if (previous) {
      // Navegar hacia la ruta anterior
      this.router.navigateByUrl(previous);
    } else {
      console.log('No hay ruta anterior en la pila');
    }
  }
}

