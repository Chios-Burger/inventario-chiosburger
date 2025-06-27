import { USUARIOS } from '../config';
import type { Usuario } from '../types/index';

export const authService = {
  login(email: string, pin: string): Usuario | null {
    const usuario = USUARIOS.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && u.pin === pin
    );
    
    if (usuario) {
      // Guardar en localStorage
      localStorage.setItem('usuario', JSON.stringify(usuario));
      return usuario;
    }
    
    return null;
  },

  logout(): void {
    localStorage.removeItem('usuario');
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
    if (!usuario) return false;
    return usuario.bodegasPermitidas.includes(bodegaId);
  },

  esAdmin(): boolean {
    const usuario = this.getUsuarioActual();
    return usuario?.esAdmin || false;
  }
};