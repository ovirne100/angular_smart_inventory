import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.SmartInventory.app',
  appName: 'Smart Inventory',
  webDir: 'dist/proyecto/browser',
  server: {
    // Permitir conexiones HTTP en desarrollo
    cleartext: true,
    // Permitir navegación a URLs externas
    allowNavigation: [
      'https://laravelsmartinventory-production.up.railway.app/*',
      'https://*.railway.app/*',
      'http://127.0.0.1:8000/*',
      'http://localhost:8000/*',
      'http://10.0.2.2:8000/*'
    ],
    // Hostname para Android
    androidScheme: 'https'
  },
  android: {
    // Permitir texto claro (HTTP) en Android para desarrollo
    allowMixedContent: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
