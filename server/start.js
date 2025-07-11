import './index.js';

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  process.exit(1);
});

// Señales de terminación
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT recibido, cerrando servidor...');
  process.exit(0);
});

console.log('🚀 Servidor iniciado con manejo de errores mejorado');