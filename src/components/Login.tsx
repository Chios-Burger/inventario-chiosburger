import { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle, Package2 } from 'lucide-react';
import { authService } from '../services/auth';
import { identifyUser, trackLogin, trackError } from '../services/analytics';

interface LoginProps {
  onLogin: () => void;
}

export const Login = ({ onLogin }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔍 Intentando login con:', email, pin);
      const usuario = authService.login(email, pin);
      console.log('🔍 Resultado login:', usuario);
      
      if (usuario) {
        // Identificar usuario en PostHog
        identifyUser(email, {
          nombre: usuario.nombre,
          rol: usuario.esAdmin ? 'admin' : 'user',
          bodegas_permitidas: usuario.bodegasPermitidas,
        });

        // Trackear login exitoso (la bodega se trackeará cuando la seleccione)
        trackLogin(email, 'pendiente_seleccion', 0);

        // Simular delay de autenticación
        await new Promise(resolve => setTimeout(resolve, 1000));
        onLogin();
      } else {
        setError('Credenciales incorrectas');
        trackError('login_failed', 'Credenciales incorrectas', undefined, { email });
      }
    } catch (err) {
      setError('Error al iniciar sesión');
      trackError('login_error', 'Error al iniciar sesión', undefined, { email });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-3xl shadow-lg mb-4">
            <Package2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Sistema de Inventario</h1>
          <p className="text-gray-600 mt-2">ChiosBurger</p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Iniciar Sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white transition-all"
                  placeholder="usuario@chiosburger.com"
                  required
                />
              </div>
            </div>

            {/* PIN */}
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                PIN de acceso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white transition-all"
                  placeholder="••••"
                  maxLength={4}
                  required
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>

          {/* Información de ayuda */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 text-center">
              ¿Necesitas ayuda? Contacta al administrador
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};