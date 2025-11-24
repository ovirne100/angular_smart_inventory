import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductosService } from '../../../../services/productos/products.service';
import { Producto } from '../../../../interfaces/producto';
import { EntradaComponent } from '../entrada/entrada.component';

declare var Quagga: any;

@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './barcode-scanner.component.html',
  styleUrls: ['./barcode-scanner.component.css']
})
export class BarcodeScannerComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLDivElement>;

  // Estados
  isScanning = false;
  manualInput = '';
  productoEncontrado: Producto | null = null;
  errorMessage = '';
  successMessage = '';
  loading = false;
  scannerSupported = true; // QuaggaJS funciona en la mayoría de navegadores
  lastScannedCode = ''; // Para evitar escaneos duplicados

  constructor(
    private productosService: ProductosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Verificar que Quagga esté disponible
    this.checkQuaggaAvailability();
  }

  /** Verificar disponibilidad de Quagga */
  private checkQuaggaAvailability(): void {
    // Esperar a que Quagga se cargue desde el CDN
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      if (typeof Quagga !== 'undefined') {
        console.log('✅ QuaggaJS disponible');
        this.scannerSupported = true;
        clearInterval(checkInterval);
      } else if (attempts >= maxAttempts) {
        console.warn('⚠️ QuaggaJS no está disponible después de varios intentos. Usando modo manual.');
        this.scannerSupported = false;
        clearInterval(checkInterval);
      }
    }, 200);
  }

  ngOnDestroy(): void {
    this.stopScanning();
  }

  /** Iniciar escaneo con cámara usando QuaggaJS */
  startScanning(): void {
    if (this.isScanning) {
      return;
    }

    // Verificar que Quagga esté disponible
    if (typeof Quagga === 'undefined') {
      this.errorMessage = '❌ El escáner no está disponible. Por favor, recarga la página o usa el modo manual.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '📷 Iniciando escáner...';
    this.lastScannedCode = '';

    // Configuración de QuaggaJS
    Quagga.init({
      inputStream: {
        name: 'Live',
        type: 'LiveStream',
        target: this.videoElement.nativeElement,
        constraints: {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          facingMode: 'environment' // Cámara trasera en móviles
        },
        area: { // Área de escaneo
          top: '20%',
          right: '10%',
          left: '10%',
          bottom: '20%'
        }
      },
      locator: {
        patchSize: 'medium',
        halfSample: true
      },
      numOfWorkers: 2,
      decoder: {
        readers: [
          'ean_reader',
          'ean_8_reader',
          'code_128_reader',
          'code_39_reader',
          'upc_reader',
          'upc_e_reader'
        ]
      },
      locate: true
    }, (err: any) => {
      if (err) {
        console.error('Error inicializando QuaggaJS:', err);
        this.errorMessage = '❌ Error al iniciar el escáner. Verifica los permisos de la cámara.';
        this.isScanning = false;
        return;
      }

      this.isScanning = true;
      this.successMessage = '📷 Escaneando... Apunta la cámara al código de barras';
      
      Quagga.start();

      // Escuchar resultados de escaneo
      Quagga.onDetected((result: any) => {
        const code = result.codeResult.code;
        
        // Evitar escaneos duplicados
        if (code && code !== this.lastScannedCode) {
          this.lastScannedCode = code;
          this.stopScanning();
          this.buscarProductoPorCodigo(code);
        }
      });
    });
  }


  /** Detener escaneo */
  stopScanning(): void {
    if (this.isScanning && typeof Quagga !== 'undefined') {
      try {
        Quagga.stop();
        // Limpiar todos los listeners
        Quagga.offDetected();
        Quagga.offProcessed();
      } catch (error) {
        console.error('Error deteniendo QuaggaJS:', error);
      }
      this.isScanning = false;
      this.successMessage = '';
    }
  }

  /** Buscar producto por código de barras (manual o escaneado) */
  buscarProductoPorCodigo(codigo: string): void {
    if (!codigo || codigo.trim() === '') {
      this.errorMessage = '⚠️ Ingresa un código de barras válido';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.productoEncontrado = null;

    console.log('🔍 Buscando producto con código:', codigo.trim());

    // Buscar producto por código de barras usando el método dedicado
    this.productosService.buscarPorCodigoBarras(codigo.trim()).subscribe({
      next: (producto: Producto | null) => {
        if (producto) {
          this.productoEncontrado = producto;
          this.successMessage = `✅ Producto encontrado: ${producto.name} (Código: ${producto.reference})`;
          this.manualInput = '';
          console.log('✅ Producto encontrado:', producto);
        } else {
          this.errorMessage = `❌ No se encontró ningún producto con el código: <strong>"${codigo}"</strong>.<br>
          <strong>¿Qué hacer?</strong><br>
          1. Verifica que el producto esté registrado en el catálogo.<br>
          2. Asegúrate de que el código de barras esté en el campo "Referencia" del producto.<br>
          3. Si el producto no existe, créalo primero en el catálogo.`;
          this.productoEncontrado = null;
          console.warn('⚠️ Producto no encontrado con código:', codigo);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error buscando producto:', error);
        this.errorMessage = '❌ Error al buscar el producto. Verifica tu conexión e intenta nuevamente.';
        this.loading = false;
      }
    });
  }

  /** Buscar producto desde input manual */
  buscarManual(): void {
    if (this.manualInput.trim()) {
      this.buscarProductoPorCodigo(this.manualInput.trim());
    }
  }

  /** Registrar producto al inventario */
  registrarAlInventario(): void {
    if (!this.productoEncontrado) return;

    // Navegar a la página de entradas con el producto pre-seleccionado
    this.router.navigate(['/dashboard/movimientos/entradas'], {
      queryParams: {
        product_id: this.productoEncontrado.id,
        barcode: this.productoEncontrado.reference
      }
    });
  }

  /** Limpiar búsqueda */
  limpiar(): void {
    this.productoEncontrado = null;
    this.manualInput = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.stopScanning();
  }

  /** Manejar tecla Enter en input manual */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.buscarManual();
    }
  }

  /** Navegar al catálogo de productos */
  irACatalogo(): void {
    this.router.navigate(['/dashboard/productos']);
  }
}

