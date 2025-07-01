import type { RegistroHistorico } from '../types/index';

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

  // Marcar registro como sincronizado
  private markAsSynced(registroId: string): void {
    const historicos = this.getLocalRecords();
    const index = historicos.findIndex(h => h.id === registroId);
    if (index !== -1) {
      historicos[index].sincronizado = true;
      historicos[index].fechaSincronizacion = new Date().toISOString();
      localStorage.setItem('historicos', JSON.stringify(historicos));
    }
  }

  // Intentar sincronizar un registro
  private async syncRecord(registro: RegistroHistorico): Promise<boolean> {
    try {
      // Convertir fecha display a formato ISO si es necesario
      const registroParaBD = {
        ...registro,
        fecha: this.convertirFechaAISO(registro.fecha)
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
    // Si ya está en formato ISO, devolverla tal cual
    if (fecha.includes('-') && fecha.split('-')[0].length === 4) {
      return fecha;
    }
    
    // Convertir de DD/MM/YYYY a YYYY-MM-DD
    const partes = fecha.split('/');
    if (partes.length === 3) {
      return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
    }
    
    // Si no se puede convertir, usar fecha actual
    return new Date().toISOString().split('T')[0];
  }

  // Sincronizar todos los registros pendientes
  async syncPendingRecords(): Promise<SyncStatus> {
    if (this.syncInProgress) {
      console.log('⏳ Sincronización ya en progreso...');
      return this.getStatus();
    }

    this.syncInProgress = true;
    const pendientes = this.getPendingRecords();
    let sincronizados = 0;
    let errores = 0;

    console.log(`🔄 Iniciando sincronización de ${pendientes.length} registros...`);

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
    
    console.log(`✅ Sincronización completada: ${sincronizados} exitosos, ${errores} errores`);
    
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
    const historicos = this.getLocalRecords();
    const sincronizados = historicos.filter(h => h.sincronizado).length;
    const ultimaSincStr = localStorage.getItem('ultimaSincronizacion');
    const ultimaSincronizacion = ultimaSincStr ? new Date(ultimaSincStr) : null;

    return {
      pendientes,
      sincronizados,
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
      console.log('📡 Conexión recuperada, iniciando sincronización...');
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