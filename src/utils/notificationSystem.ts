// Sistema de notificaciones para bodega principal
interface NotificationState {
  pendingNotifications: string[];
  intervalId: number | null;
  isPlaying: boolean;
}

class NotificationSystem {
  private state: NotificationState = {
    pendingNotifications: [],
    intervalId: null,
    isPlaying: false
  };

  private audio: HTMLAudioElement;
  private notificationSound = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTcIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'; // Sonido de notificación
  
  constructor() {
    this.audio = new Audio(this.notificationSound);
    this.audio.volume = 0.5;
  }

  // Verificar si el usuario actual es bodega principal
  isBodegaPrincipal(): boolean {
    const userEmail = localStorage.getItem('userEmail');
    return userEmail === 'bodegaprincipal@chiosburger.com';
  }

  // Reproducir sonido de notificación
  playSound(): void {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.audio.play().catch(error => {
        console.error('Error al reproducir sonido:', error);
      }).finally(() => {
        this.isPlaying = false;
      });
    }
  }

  // Agregar nueva notificación
  addNotification(bodega: string): void {
    if (this.isBodegaPrincipal() && 
        (bodega === 'Chios Real Audiencia' || 
         bodega === 'Chios Floreana' || 
         bodega === 'Chios Portugal' || 
         bodega === 'Santo Cachón' || 
         bodega === 'Simón Bolón')) {
      
      this.state.pendingNotifications.push(bodega);
      this.playSound();
      
      // Si no hay intervalo activo, iniciarlo
      if (!this.state.intervalId) {
        this.startNotificationInterval();
      }
    }
  }

  // Iniciar intervalo de notificación cada minuto
  startNotificationInterval(): void {
    this.state.intervalId = window.setInterval(() => {
      if (this.state.pendingNotifications.length > 0) {
        this.playSound();
      } else {
        this.stopNotificationInterval();
      }
    }, 60000); // 60 segundos
  }

  // Detener intervalo
  stopNotificationInterval(): void {
    if (this.state.intervalId) {
      clearInterval(this.state.intervalId);
      this.state.intervalId = null;
    }
  }

  // Obtener notificaciones pendientes
  getPendingNotifications(): string[] {
    return this.state.pendingNotifications;
  }

  // Limpiar notificaciones después de revisión
  clearNotifications(): void {
    this.state.pendingNotifications = [];
    this.stopNotificationInterval();
  }

  // Verificar si hay notificaciones pendientes
  hasPendingNotifications(): boolean {
    return this.state.pendingNotifications.length > 0;
  }
}

// Instancia única del sistema de notificaciones
export const notificationSystem = new NotificationSystem();