import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.inventario.app',
  appName: 'Inventario',
  "webDir": "dist/proyecto/browser",
   server: {
    cleartext: true, // CRÍTICO para HTTP
    androidScheme: 'https'
  }

};

export default config;
