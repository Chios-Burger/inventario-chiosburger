import type { RegistroHistorico } from '../types/index';
import { normalizarFechaAISO, obtenerTimestampUTC } from '../utils/dateUtils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface SyncStatus {
  pendientes: number;
  sincronizados: number;
  errores: number;
  ultimaSincronizacion: Date | null;
}

class SyncService {
  private syncInProgress = false;
  private syncInterval: number | null = null;

  // Obtener registros pendientes de sincronización
  getPendingRecords(): RegistroHistorico[] {
    const historicos = this.getLocalRecords();
    return historicos.filter(registro => 
      registro.origen === 'local' && !registro.sincronizado
    );
  }

  // Obtener todos los registros locales
  private getLocalRecords(): RegistroHistorico[] {
    const data = localStorage.getItem('historicos');
    if (data) {
      try {
        return JSON.parse(data);
      } catch {
        return [];
      }
    }
    return [];
  }

  // Eliminar registro pendiente después de sincronizar exitosamente
  private markAsSynced(registroId: string): void {
    const historicos = this.getLocalRecords();
    const index = historicos.findIndex(h => h.id === registroId);
    if (index !== -1) {
      // En lugar de marcar como sincronizado, eliminar el registro pendiente
      historicos.splice(index, 1);
      localStorage.setItem('historicos', JSON.stringify(historicos));
      console.log(`🗑️ Registro pendiente ${registroId} eliminado después de sincronizar`);
    }
  }

  // Intentar sincronizar un registro
  private async syncRecord(registro: RegistroHistorico): Promise<boolean> {
    try {
      // Convertir fecha display a formato ISO si es necesario
      const registroParaBD = {
        ...registro,
        fecha: this.convertirFechaAISO(registro.fecha),
        fechaSincronizacion: obtenerTimestampUTC()
      };

      const response = await fetch(`${API_URL}/inventario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registroParaBD)
      });

      if (response.ok) {
        this.markAsSynced(registro.id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error sincronizando registro:', registro.id, error);
      return false;
    }
  }

  // Convertir fecha de formato display (DD/MM/YYYY) a ISO (YYYY-MM-DD)
  private convertirFechaAISO(fecha: string): string {
    return normalizarFechaAISO(fecha);
  }

  // Sincronizar todos los registros pendientes
  async syncPendingRecords(): Promise<SyncStatus> {
    if (this.syncInProgress) {
      return this.getStatus();
    }

    this.syncInProgress = true;
    const pendientes = this.getPendingRecords();
    let sincronizados = 0;
    let errores = 0;

    for (const registro of pendientes) {
      const success = await this.syncRecord(registro);
      if (success) {
        sincronizados++;
      } else {
        errores++;
      }
    }

    this.syncInProgress = false;
    
    // Actualizar última sincronización
    const status = this.getStatus();
    localStorage.setItem('ultimaSincronizacion', new Date().toISOString());
    
    return {
      ...status,
      sincronizados,
      errores,
      ultimaSincronizacion: new Date()
    };
  }

  // Obtener estado actual de sincronización
  getStatus(): SyncStatus {
    const pendientes = this.getPendingRecords().length;
    const ultimaSincStr = localStorage.getItem('ultimaSincronizacion');
    const ultimaSincronizacion = ultimaSincStr ? new Date(ultimaSincStr) : null;
    
    // Ya no contamos sincronizados porque se eliminan automáticamente
    return {
      pendientes,
      sincronizados: 0,
      errores: 0,
      ultimaSincronizacion
    };
  }

  // Iniciar sincronización automática
  startAutoSync(intervalMinutes: number = 5): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Sincronizar inmediatamente
    this.syncPendingRecords();

    // Configurar intervalo
    this.syncInterval = window.setInterval(() => {
      if (navigator.onLine) {
        this.syncPendingRecords();
      }
    }, intervalMinutes * 60 * 1000);

    // Sincronizar cuando se recupere la conexión
    window.addEventListener('online', () => {
      setTimeout(() => this.syncPendingRecords(), 2000);
    });
  }

  // Detener sincronización automática
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const syncService = new SyncService();