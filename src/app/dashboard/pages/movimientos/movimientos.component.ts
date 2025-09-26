import { Component } from '@angular/core';

@Component({
  selector: 'app-movimientos',
  templateUrl: './movimientos.component.html',
  styleUrls: ['./movimientos.component.css']
})
export class MovimientosComponent {
  // Puedes usar esto para cambiar dinámicamente entre "entrada" y "salida"
  activeTab: 'entrada' | 'salida' = 'entrada';

  setActive(tab: 'entrada' | 'salida') {
    this.activeTab = tab;
  }
}
