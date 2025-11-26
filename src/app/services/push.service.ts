import { Injectable } from '@angular/core';
import { PushNotifications } from '@capacitor/push-notifications';

@Injectable({ providedIn: 'root' })
export class PushService {

  async initPush() {
    // Solicitar permisos
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      alert('Permisos de notificación denegados');
      return;
    }

    // Registrar para recibir notificaciones
    await PushNotifications.register();

    // Token (lo guardarás en tu backend)
    PushNotifications.addListener('registration', token => {
      console.log('Token Firebase:', token.value);
    });

    // Error
    PushNotifications.addListener('registrationError', err => {
      console.error('Error registrando push:', err);
    });

    // Notificación recibida
    PushNotifications.addListener('pushNotificationReceived', notif => {
      console.log('Notificación recibida:', notif);
    });

    // Tap en la notificación
    PushNotifications.addListener('pushNotificationActionPerformed', notif => {
      console.log('Acción sobre notificación:', notif);
    });
  }
}
