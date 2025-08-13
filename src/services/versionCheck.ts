// Sistema silencioso de detección de nueva versión
const VERSION_CHECK_INTERVAL = 30000; // Verificar cada 30 segundos
const VERSION_ENDPOINT = '/version.json';

interface VersionInfo {
  version: string;
  timestamp: number;
}

class VersionChecker {
  private currentVersion: string | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private isChecking = false;
  private lastUserActivity = Date.now();
  private isUserActive = false;

  async initialize() {
    try {
      // Obtener versión inicial silenciosamente
      const response = await fetch(`${VERSION_ENDPOINT}?t=${Date.now()}`);
      if (response.ok) {
        const data: VersionInfo = await response.json();
        this.currentVersion = data.version;
      }
    } catch (error) {
      // Silencioso - no mostrar errores
    }

    // Configurar detectores de actividad del usuario
    this.setupActivityListeners();

    // Iniciar verificación periódica
    this.startVersionCheck();
  }

  private setupActivityListeners() {
    // Detectar cualquier actividad del usuario
    const updateActivity = () => {
      this.lastUserActivity = Date.now();
      this.isUserActive = true;
    };

    // Eventos de teclado y mouse
    document.addEventListener('keydown', updateActivity, { passive: true });
    document.addEventListener('mousedown', updateActivity, { passive: true });
    document.addEventListener('touchstart', updateActivity, { passive: true });
    
    // Detectar cuando hay un input con foco
    document.addEventListener('focusin', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        this.isUserActive = true;
      }
    }, { passive: true });

    document.addEventListener('focusout', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // Esperar un poco antes de marcar como inactivo
        setTimeout(() => {
          const activeElement = document.activeElement;
          if (!(activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement)) {
            this.isUserActive = false;
          }
        }, 100);
      }
    }, { passive: true });
  }

  private startVersionCheck() {
    // Limpiar intervalo anterior si existe
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      if (!this.isChecking) {
        await this.checkForUpdates();
      }
    }, VERSION_CHECK_INTERVAL);
  }

  private async checkForUpdates() {
    if (!this.currentVersion || this.isChecking) return;
    
    this.isChecking = true;
    
    try {
      // Agregar timestamp para evitar cache
      const response = await fetch(`${VERSION_ENDPOINT}?t=${Date.now()}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data: VersionInfo = await response.json();
        
        // Si la versión cambió, recargar silenciosamente
        if (data.version !== this.currentVersion) {
          this.scheduleReload();
        }
      }
    } catch (error) {
      // Silencioso - no mostrar errores
    } finally {
      this.isChecking = false;
    }
  }

  private scheduleReload() {
    // Si el usuario está activo o escribiendo, esperar
    if (this.isUserActive || document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) {
      // Revisar cada 5 segundos si el usuario dejó de estar activo
      setTimeout(() => {
        this.scheduleReload();
      }, 5000);
      return;
    }

    // Verificar inactividad (más de 10 segundos sin actividad)
    const inactiveTime = Date.now() - this.lastUserActivity;
    if (inactiveTime < 10000) {
      // Usuario estuvo activo recientemente, esperar más
      setTimeout(() => {
        this.scheduleReload();
      }, 10000 - inactiveTime);
      return;
    }

    // Usuario inactivo, proceder con recarga silenciosa
    this.silentReload();
  }

  private silentReload() {
    // Guardar datos críticos de sesión
    const authToken = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');
    const currentBodega = localStorage.getItem('currentBodega');
    const bodegaId = localStorage.getItem('bodegaId');
    const bodegaNombre = localStorage.getItem('bodegaNombre');
    
    // Guardar el estado actual del inventario si existe
    const inventarioActual = localStorage.getItem('inventarioActual');
    const productosGuardados = localStorage.getItem('productosGuardados');
    const conteos = localStorage.getItem('conteos');
    
    // Limpiar cache de service workers silenciosamente
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }

    // Restaurar todos los datos críticos
    if (authToken) localStorage.setItem('authToken', authToken);
    if (currentUser) localStorage.setItem('currentUser', currentUser);
    if (currentBodega) localStorage.setItem('currentBodega', currentBodega);
    if (bodegaId) localStorage.setItem('bodegaId', bodegaId);
    if (bodegaNombre) localStorage.setItem('bodegaNombre', bodegaNombre);
    
    // Restaurar estado del inventario
    if (inventarioActual) localStorage.setItem('inventarioActual', inventarioActual);
    if (productosGuardados) localStorage.setItem('productosGuardados', productosGuardados);
    if (conteos) localStorage.setItem('conteos', conteos);

    // Recarga silenciosa e imperceptible
    window.location.reload();
  }

  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// Crear instancia singleton
export const versionChecker = new VersionChecker();