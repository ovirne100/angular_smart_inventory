import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';

import { NabvarComponent } from './register/nabvar/nabvar.component';
import { FooterComponent } from './register/footer/footer.component';

// 👉 Importa tu servicio de notificaciones
import { PushService } from './services/push.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NabvarComponent,
    FooterComponent,
    FormsModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  // 👉 Inyectamos el servicio
  constructor(private pushService: PushService) {}

  // 👉 Llamamos al servicio al iniciar la app
  ngOnInit(): void {
    this.pushService.initPush();
  }
}
