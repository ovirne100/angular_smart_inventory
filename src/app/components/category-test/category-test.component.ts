import { Component, OnInit } from '@angular/core';
import { CategoriesService } from '../../services/categories/categories.service';

@Component({
  selector: 'app-category-test',
  template: `
    <div class="category-test">
      <h3>🧪 Prueba de Categorías</h3>

      <div class="test-section">
        <h4>1. Categorías del Frontend</h4>
        <p>Total: {{ frontendCategories.length }}</p>
        <div class="category-list">
          <span *ngFor="let cat of frontendCategories.slice(0, 5)" class="category-tag">
            {{ cat.id }}: {{ cat.name }}
          </span>
          <span *ngIf="frontendCategories.length > 5">...</span>
        </div>
      </div>

      <div class="test-section">
        <h4>2. Estado del Backend</h4>
        <button (click)="testBackend()" [disabled]="testing">
          {{ testing ? 'Probando...' : 'Probar Backend' }}
        </button>
        <div *ngIf="backendStatus" class="status">
          <p [class.success]="backendStatus.success" [class.error]="!backendStatus.success">
            {{ backendStatus.message }}
          </p>
        </div>
      </div>

      <div class="test-section">
        <h4>3. Sincronización</h4>
        <button (click)="syncCategories()" [disabled]="syncing">
          {{ syncing ? 'Sincronizando...' : 'Sincronizar Categorías' }}
        </button>
        <div *ngIf="syncResult" class="status">
          <p [class.success]="syncResult.success" [class.error]="!syncResult.success">
            {{ syncResult.message }}
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .category-test {
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      margin: 20px;
    }
    .test-section {
      margin: 20px 0;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 5px;
    }
    .category-tag {
      display: inline-block;
      background: #007bff;
      color: white;
      padding: 2px 8px;
      margin: 2px;
      border-radius: 3px;
      font-size: 12px;
    }
    .status {
      margin-top: 10px;
    }
    .success {
      color: green;
    }
    .error {
      color: red;
    }
    button {
      background: #007bff;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
    }
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  `]
})
export class CategoryTestComponent implements OnInit {
  frontendCategories: any[] = [];
  backendStatus: any = null;
  syncResult: any = null;
  testing = false;
  syncing = false;

  constructor(private categoriesService: CategoriesService) {}

  ngOnInit() {
    this.frontendCategories = this.categoriesService.getFrontendCategories();
  }

  testBackend() {
    this.testing = true;
    this.backendStatus = null;

    this.categoriesService.checkBackendStatus().subscribe({
      next: (response) => {
        this.backendStatus = {
          success: true,
          message: '✅ Backend disponible: ' + (response.message || 'OK')
        };
        this.testing = false;
      },
      error: (error) => {
        this.backendStatus = {
          success: false,
          message: '❌ Backend no disponible: ' + (error.message || 'Error de conexión')
        };
        this.testing = false;
      }
    });
  }

  syncCategories() {
    this.syncing = true;
    this.syncResult = null;

    this.categoriesService.initializeCategories().subscribe({
      next: (response) => {
        this.syncResult = {
          success: response.success !== false,
          message: response.message || '✅ Categorías sincronizadas correctamente'
        };
        this.syncing = false;
      },
      error: (error) => {
        this.syncResult = {
          success: false,
          message: '❌ Error sincronizando: ' + (error.message || 'Error de conexión')
        };
        this.syncing = false;
      }
    });
  }
}
