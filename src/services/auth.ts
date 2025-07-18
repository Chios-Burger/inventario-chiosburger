import { USUARIOS } from '../config';
import type { Usuario } from '../types/index';

export const authService = {
  login(email: string, pin: string): Usuario | null {
    console.log('🔐 Auth - Total usuarios:', USUARIOS.length);
    console.log('🔐 Auth - Buscando:', email, pin);
    const usuario = USUARIOS.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && u.pin === pin
    );
    console.log('🔐 Auth - Usuario encontrado:', usuario);
    
    if (usuario) {
      // Guardar en localStorage
      localStorage.setItem('usuario', JSON.stringify(usuario));
      // Guardar email específicamente para el sistema de notificaciones
      localStorage.setItem('userEmail', usuario.email);
      return usuario;
    }
    
    return null;
  },

  logout(): void {
    localStorage.removeItem('usuario');
    localStorage.removeItem('userEmail');
  },

  getUsuarioActual(): Usuario | null {
    const data = localStorage.getItem('usuario');
    if (data) {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
    return null;
  },

  tienPermisoBodega(bodegaId: number): boolean {
    const usuario = this.getUsuarioActual();
    console.log('🔍 authService.tienPermisoBodega - Usuario:', usuario);
    console.log('🔍 authService.tienPermisoBodega - BodegaId:', bodegaId);
    
    if (!usuario) {
      console.log('❌ authService.tienPermisoBodega - No hay usuario');
      return false;
    }
    
    const tienePermiso = usuario.bodegasPermitidas.includes(bodegaId);
    console.log('🔍 authService.tienPermisoBodega - Bodegas permitidas:', usuario.bodegasPermitidas);
    console.log('🔍 authService.tienPermisoBodega - Tiene permiso:', tienePermiso);
    
    return tienePermiso;
  },

  esAdmin(): boolean {
    const usuario = this.getUsuarioActual();
    return usuario?.esAdmin || false;
  },

  getUserEmail(): string | null {
    const usuario = this.getUsuarioActual();
    return usuario?.email || null;
  }
};