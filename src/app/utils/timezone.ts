/**
 * Utilidades para manejar timezone Colombia en toda la aplicación Angular
 */

/**
 * Convierte una fecha UTC del backend a hora de Colombia
 * @param utcDate - Fecha en formato ISO desde el backend
 * @returns Date ajustada a hora de Colombia
 */
export function convertToColombiaTime(utcDate: string | Date): Date {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  
  // Colombia está en UTC-5 (sin horario de verano)
  const colombiaOffset = -5 * 60; // en minutos
  const localOffset = date.getTimezoneOffset(); // diferencia con UTC local
  
  // Calcular la diferencia y ajustar
  const diff = (colombiaOffset - localOffset) * 60 * 1000;
  
  return new Date(date.getTime() + diff);
}

/**
 * Formatea una fecha a hora de Colombia
 * @param date - Fecha a formatear
 * @param format - Formato deseado ('datetime', 'date', 'time')
 * @returns String formateado en hora de Colombia
 */
export function formatColombiaTime(date: string | Date, format: 'datetime' | 'date' | 'time' = 'datetime'): string {
  const colombiaDate = convertToColombiaTime(date);
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  
  if (format === 'date') {
    delete options.hour;
    delete options.minute;
    delete options.second;
    delete options.hour12;
  } else if (format === 'time') {
    delete options.year;
    delete options.month;
    delete options.day;
  }
  
  const formatter = new Intl.DateTimeFormat('es-CO', options);
  return formatter.format(colombiaDate);
}

/**
 * Obtiene la fecha y hora actual de Colombia
 * @returns Date con hora de Colombia
 */
export function getCurrentColombiaTime(): Date {
  const now = new Date();
  return convertToColombiaTime(now);
}

/**
 * Obtiene la fecha y hora actual de Colombia en formato ISO
 * @returns String ISO con hora de Colombia
 */
export function getCurrentColombiaTimeISO(): string {
  return getCurrentColombiaTime().toISOString();
}

/**
 * Convierte una fecha de Colombia a UTC para enviar al backend
 * @param colombiaDate - Fecha en hora de Colombia
 * @returns String ISO en UTC
 */
export function convertColombiaToUTC(colombiaDate: Date): string {
  const colombiaOffset = -5 * 60 * 60 * 1000; // -5 horas en ms
  return new Date(colombiaDate.getTime() - colombiaOffset).toISOString();
}


