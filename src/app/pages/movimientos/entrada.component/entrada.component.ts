import { Component } from '@angular/core';
import { MovimientosService } from 'src/app/services/movimientos/movimientos.service';

@Component({
  selector: 'app-entrada',
  templateUrl: './entrada.component.html',
  styleUrls: ['./entrada.component.css']
})
export class EntradaComponent {
  entrada: any = {
    product_id: '',
    quantity: '',
    unit: '',
    lot: '',
    supplier_id: '',
    user_id: '',
    inventory_id: ''
  };

  constructor(private movimientosService: MovimientosService) {}

  guardarEntrada() {
    this.movimientosService.createEntrada(this.entrada).subscribe({
      next: res => {
        alert('✅ Entrada registrada correctamente');
        console.log(res);
      },
      error: err => {
        alert('❌ Error al registrar la entrada');
        console.error(err);
      }
    });
  }
}
