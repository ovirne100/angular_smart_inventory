import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe para formatear fechas a hora de Colombia en toda la aplicación
 * 
 * Uso:
 * {{ fecha | colombiaDate }}  → '21/11/2025 15:30:45'
 * {{ fecha | colombiaDate:'date' }}  → '21/11/2025'
 * {{ fecha | colombiaDate:'time' }}  → '15:30:45'
 * {{ fecha | colombiaDate:'datetime-short' }}  → '21/11/2025 15:30'
 */
@Pipe({
  name: 'colombiaDate',
  standalone: true
})
export class ColombiaDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, format: string = 'datetime'): string {
    if (!value) return 'N/D';
    
    try {
      const date = typeof value === 'string' ? new Date(value) : value;
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'America/Bogota'
      };
      
      switch (format) {
        case 'date':
          options.year = 'numeric';
          options.month = '2-digit';
          options.day = '2-digit';
          break;
          
        case 'time':
          options.hour = '2-digit';
          options.minute = '2-digit';
          options.second = '2-digit';
          options.hour12 = false;
          break;
          
        case 'datetime-short':
          options.year = 'numeric';
          options.month = '2-digit';
          options.day = '2-digit';
          options.hour = '2-digit';
          options.minute = '2-digit';
          options.hour12 = false;
          break;
          
        case 'datetime':
        default:
          options.year = 'numeric';
          options.month = '2-digit';
          options.day = '2-digit';
          options.hour = '2-digit';
          options.minute = '2-digit';
          options.second = '2-digit';
          options.hour12 = false;
          break;
      }
      
      const formatter = new Intl.DateTimeFormat('es-CO', options);
      return formatter.format(date);
      
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Error en fecha';
    }
  }
}


