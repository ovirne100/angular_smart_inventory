import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { RouterOutlet } from '@angular/router';
import { NabvarComponent } from './register/nabvar/nabvar.component';
import { FooterComponent } from './register/footer/footer.component';

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
export class AppComponent {}
