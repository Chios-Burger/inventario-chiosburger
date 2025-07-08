/**
 * Utilidades para manejo consistente de fechas y horas
 * Todas las fechas se manejan en UTC y se convierten a zona horaria local para display
 */

// Zona horaria de Ecuador
const TIMEZONE = 'America/Guayaquil';

/**
 * Obtiene la fecha/hora actual en la zona horaria de Ecuador
 */
export function obtenerFechaActual(): Date {
  return new Date();
}

/**
 * Convierte una fecha a string en formato ISO (YYYY-MM-DD)
 */
export function fechaAISO(fecha: Date | string): string {
  // Si es string, verificar si ya está en formato ISO
  if (typeof fecha === 'string') {
    // Si ya está en formato ISO (YYYY-MM-DD), devolverlo
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return fecha;
    }
    // Si está en formato display (DD/MM/YYYY), convertirlo
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
      return normalizarFechaAISO(fecha);
    }
    // Intentar parsear como fecha
    fecha = new Date(fecha);
  }
  
  // Validar que la fecha sea válida
  if (!(fecha instanceof Date) || isNaN(fecha.getTime())) {
    // No mostrar error en consola para evitar spam
    return ''; // Retornar string vacío para indicar fecha inválida
  }
  
  // Usar la fecha local de Ecuador
  const opciones: Intl.DateTimeFormatOptions = {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  
  const partes = new Intl.DateTimeFormat('en-CA', opciones).formatToParts(fecha);
  const año = partes.find(p => p.type === 'year')?.value || '';
  const mes = partes.find(p => p.type === 'month')?.value || '';
  const dia = partes.find(p => p.type === 'day')?.value || '';
  
  return `${año}-${mes}-${dia}`;
}

/**
 * Convierte una fecha a string en formato display (DD/MM/YYYY)
 */
export function fechaADisplay(fecha: Date): string {
  const opciones: Intl.DateTimeFormatOptions = {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  
  return fecha.toLocaleDateString('es-EC', opciones);
}

/**
 * Obtiene la hora en formato display (HH:MM:SS)
 */
export function horaADisplay(fecha: Date): string {
  const opciones: Intl.DateTimeFormatOptions = {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  
  return fecha.toLocaleTimeString('es-EC', opciones);
}

/**
 * Convierte fecha y hora a string completo para display
 */
export function fechaHoraADisplay(fecha: Date): string {
  return `${fechaADisplay(fecha)} ${horaADisplay(fecha)}`;
}

/**
 * Parsea una fecha en formato DD/MM/YYYY a Date
 */
export function parsearFechaDisplay(fechaStr: string): Date {
  const [dia, mes, año] = fechaStr.split('/').map(Number);
  // Crear fecha en UTC medianoche y ajustar a zona horaria local
  return new Date(año, mes - 1, dia);
}

/**
 * Parsea una fecha en formato YYYY-MM-DD a Date
 */
export function parsearFechaISO(fechaStr: string): Date {
  const [año, mes, dia] = fechaStr.split('-').map(Number);
  return new Date(año, mes - 1, dia);
}

/**
 * Normaliza una fecha string a formato ISO
 * Acepta DD/MM/YYYY o YYYY-MM-DD
 */
export function normalizarFechaAISO(fecha: string): string {
  if (fecha.includes('-') && fecha.split('-')[0].length === 4) {
    return fecha; // Ya está en ISO
  }
  
  if (fecha.includes('/')) {
    const [d, m, y] = fecha.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  
  return fecha;
}

/**
 * Genera un ID único basado en timestamp
 */
export function generarIdUnico(): string {
  const ahora = obtenerFechaActual();
  const fecha = fechaAISO(ahora).replace(/-/g, '').substring(2); // YYMMDD
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${fecha}-${timestamp}-${random}`;
}

/**
 * Obtiene la fecha de hoy a medianoche en la zona horaria local
 */
export function obtenerInicioDelDia(): Date {
  const ahora = new Date();
  const opciones: Intl.DateTimeFormatOptions = {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  };
  
  const partes = new Intl.DateTimeFormat('en-US', opciones).formatToParts(ahora);
  const año = parseInt(partes.find(p => p.type === 'year')?.value || '0');
  const mes = parseInt(partes.find(p => p.type === 'month')?.value || '0') - 1;
  const dia = parseInt(partes.find(p => p.type === 'day')?.value || '0');
  
  return new Date(año, mes, dia, 0, 0, 0, 0);
}

/**
 * Compara si dos fechas son del mismo día (ignorando hora)
 */
export function sonMismoDia(fecha1: Date, fecha2: Date): boolean {
  const f1 = fechaAISO(fecha1);
  const f2 = fechaAISO(fecha2);
  return f1 === f2;
}

/**
 * Obtiene timestamp para guardar en BD (siempre en UTC)
 */
export function obtenerTimestampUTC(): string {
  return new Date().toISOString();
}

/**
 * Convierte timestamp UTC a fecha local para display
 */
export function timestampUTCALocal(timestamp: string): Date {
  return new Date(timestamp);
}