import { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { syncService, type SyncStatus } from '../services/syncService';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const SyncStatusComponent = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.getStatus());
  const [syncing, setSyncing] = useState(false);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    // Actualizar estado cada 5 segundos
    const interval = setInterval(() => {
      setSyncStatus(syncService.getStatus());
    }, 5000);

    // Iniciar sincronización automática
    syncService.startAutoSync();

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || syncing) return;
    
    setSyncing(true);
    const result = await syncService.syncPendingRecords();
    setSyncStatus(result);
    setSyncing(false);
  };

  const formatTime = (date: Date | null) => {
    if (!date) return 'Nunca';
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Hace un momento';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (minutes < 1440) return `Hace ${Math.floor(minutes / 60)} horas`;
    return `Hace ${Math.floor(minutes / 1440)} días`;
  };

  if (!syncStatus.pendientes && syncStatus.sincronizados === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className={`
        bg-white rounded-2xl shadow-xl border p-4 max-w-xs
        ${syncStatus.pendientes > 0 ? 'border-orange-200' : 'border-green-200'}
      `}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Cloud className="w-5 h-5 text-blue-600" />
            ) : (
              <CloudOff className="w-5 h-5 text-gray-400" />
            )}
            <h4 className="font-semibold text-gray-800">Sincronización</h4>
          </div>
          {isOnline && syncStatus.pendientes > 0 && (
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Sincronizar ahora"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${syncing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* Estado de sincronización */}
        <div className="space-y-2 text-sm">
          {syncStatus.pendientes > 0 ? (
            <div className="flex items-center gap-2 text-orange-700">
              <AlertCircle className="w-4 h-4" />
              <span>{syncStatus.pendientes} registros pendientes</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-4 h-4" />
              <span>Todo sincronizado</span>
            </div>
          )}
          
          {syncStatus.ultimaSincronizacion && (
            <p className="text-xs text-gray-500">
              Última sync: {formatTime(syncStatus.ultimaSincronizacion)}
            </p>
          )}
        </div>

        {/* Barra de progreso si está sincronizando */}
        {syncing && (
          <div className="mt-3">
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '50%' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};