import { Component } from '@angular/core';
import { MovimientosService } from 'src/app/services/movimientos/movimientos.service';

@Component({
  selector: 'app-salida',
  templateUrl: './salida.component.html',
  styleUrls: ['./salida.component.css']
})
export class SalidaComponent {
  salida: any = {
    product_id: '',
    quantity: '',
    unit: '',
    lot: '',
    user_id: '',
    inventory_id: ''
  };

  constructor(private movimientosService: MovimientosService) {}

  guardarSalida() {
    this.movimientosService.createSalida(this.salida).subscribe({
      next: res => {
        alert('✅ Salida registrada correctamente');
        console.log(res);
      },
      error: err => {
        alert('❌ Error al registrar la salida');
        console.error(err);
      }
    });
  }
}
