import posthog from 'posthog-js';

// Configuración de PostHog
const POSTHOG_API_KEY = 'phc_VXUDzEMnUwGYtMTgd7Cxm4D8sH3riXElSxOxmkXBuYi';
const POSTHOG_HOST = 'https://us.i.posthog.com';

// Inicializar PostHog
export const initAnalytics = () => {
  posthog.init(POSTHOG_API_KEY, {
    api_host: POSTHOG_HOST,
    autocapture: true, // Captura automática de clicks, inputs, etc.
    capture_pageview: true, // Captura automática de page views
    capture_pageleave: true, // Captura cuando el usuario sale
    session_recording: {
      maskAllInputs: false, // No enmascarar inputs (ajustar si hay datos sensibles)
      maskInputOptions: {
        password: true, // Siempre enmascarar passwords
      },
    },
    loaded: () => {
      console.log('📊 PostHog Analytics inicializado');
    },
  });
};

// Identificar usuario después del login
export const identifyUser = (email: string, properties?: Record<string, any>) => {
  posthog.identify(email, {
    email,
    ...properties,
  });
  console.log('📊 Usuario identificado:', email);
};

// Resetear usuario (logout)
export const resetUser = () => {
  posthog.reset();
  console.log('📊 Sesión de analytics reseteada');
};

// ============================================
// EVENTOS DE AUTENTICACIÓN
// ============================================

export const trackLogin = (email: string, bodega: string, bodegaId: number) => {
  posthog.capture('user_login', {
    user_email: email,
    bodega_nombre: bodega,
    bodega_id: bodegaId,
    timestamp: new Date().toISOString(),
  });
};

export const trackLogout = (email: string) => {
  posthog.capture('user_logout', {
    user_email: email,
    timestamp: new Date().toISOString(),
  });
};

// ============================================
// EVENTOS DE NAVEGACIÓN
// ============================================

export const trackPageView = (pageName: string, properties?: Record<string, any>) => {
  posthog.capture('page_view', {
    page_name: pageName,
    ...properties,
    timestamp: new Date().toISOString(),
  });
};

export const trackBodegaChange = (
  email: string,
  bodegaAnterior: string,
  bodegaNueva: string,
  bodegaId: number
) => {
  posthog.capture('bodega_changed', {
    user_email: email,
    bodega_anterior: bodegaAnterior,
    bodega_nueva: bodegaNueva,
    bodega_id: bodegaId,
    timestamp: new Date().toISOString(),
  });
};

// ============================================
// EVENTOS DE INVENTARIO
// ============================================

export const trackProductEdit = (
  email: string,
  bodega: string,
  producto: { codigo: string; nombre: string },
  campo: string,
  valorAnterior: number | string,
  valorNuevo: number | string
) => {
  posthog.capture('product_edited', {
    user_email: email,
    bodega,
    producto_codigo: producto.codigo,
    producto_nombre: producto.nombre,
    campo_modificado: campo,
    valor_anterior: valorAnterior,
    valor_nuevo: valorNuevo,
    diferencia: typeof valorNuevo === 'number' && typeof valorAnterior === 'number'
      ? valorNuevo - valorAnterior
      : null,
    timestamp: new Date().toISOString(),
  });
};

export const trackInventorySync = (
  bodega: string,
  success: boolean,
  recordsCount: number,
  errorMessage?: string
) => {
  posthog.capture('inventory_sync', {
    bodega,
    success,
    records_count: recordsCount,
    error_message: errorMessage || null,
    timestamp: new Date().toISOString(),
  });
};

// ============================================
// EVENTOS DE PEDIDOS (IMPORTANTE)
// ============================================

export const trackPedidoEnviado = (
  email: string,
  bodega: string,
  bodegaId: number,
  pedidoDetails: {
    totalProductos: number;
    totalItems: number;
    productos: Array<{ codigo: string; nombre: string; cantidad: number }>;
  }
) => {
  posthog.capture('pedido_enviado', {
    user_email: email,
    bodega_origen: bodega,
    bodega_id: bodegaId,
    total_productos: pedidoDetails.totalProductos,
    total_items: pedidoDetails.totalItems,
    productos: pedidoDetails.productos,
    timestamp: new Date().toISOString(),
    fecha_pedido: new Date().toLocaleDateString('es-EC'),
    hora_pedido: new Date().toLocaleTimeString('es-EC'),
  });
  console.log('📊 Pedido trackeado:', bodega, pedidoDetails.totalProductos, 'productos');
};

export const trackPedidoError = (
  email: string,
  bodega: string,
  errorMessage: string
) => {
  posthog.capture('pedido_error', {
    user_email: email,
    bodega,
    error_message: errorMessage,
    timestamp: new Date().toISOString(),
  });
};

export const trackPedidoRecibido = (
  email: string,
  bodegaDestino: string,
  bodegaOrigen: string,
  totalProductos: number
) => {
  posthog.capture('pedido_recibido', {
    user_email: email,
    bodega_destino: bodegaDestino,
    bodega_origen: bodegaOrigen,
    total_productos: totalProductos,
    timestamp: new Date().toISOString(),
  });
};

// ============================================
// EVENTOS DE HISTÓRICO
// ============================================

export const trackHistoricoView = (
  email: string,
  bodega: string,
  filtros: { fechaInicio?: string; fechaFin?: string }
) => {
  posthog.capture('historico_viewed', {
    user_email: email,
    bodega,
    filtro_fecha_inicio: filtros.fechaInicio || null,
    filtro_fecha_fin: filtros.fechaFin || null,
    timestamp: new Date().toISOString(),
  });
};

export const trackExportData = (
  email: string,
  tipo: 'excel' | 'pdf' | 'csv',
  seccion: string,
  recordsCount: number
) => {
  posthog.capture('data_exported', {
    user_email: email,
    tipo_exportacion: tipo,
    seccion,
    records_count: recordsCount,
    timestamp: new Date().toISOString(),
  });
};

// ============================================
// EVENTOS DE ERRORES
// ============================================

export const trackError = (
  errorType: string,
  errorMessage: string,
  errorStack?: string,
  context?: Record<string, any>
) => {
  posthog.capture('app_error', {
    error_type: errorType,
    error_message: errorMessage,
    error_stack: errorStack || null,
    context: context || {},
    url: window.location.href,
    timestamp: new Date().toISOString(),
  });
};

// Configurar captura global de errores
export const setupGlobalErrorTracking = () => {
  // Errores no capturados
  window.onerror = (message, source, lineno, colno, error) => {
    trackError(
      'uncaught_error',
      String(message),
      error?.stack,
      { source, lineno, colno }
    );
    return false;
  };

  // Promesas rechazadas no manejadas
  window.onunhandledrejection = (event) => {
    trackError(
      'unhandled_promise_rejection',
      event.reason?.message || String(event.reason),
      event.reason?.stack
    );
  };

  console.log('📊 Captura global de errores configurada');
};

// ============================================
// EVENTOS DE RENDIMIENTO
// ============================================

export const trackPerformance = (
  action: string,
  durationMs: number,
  context?: Record<string, any>
) => {
  posthog.capture('performance_metric', {
    action,
    duration_ms: durationMs,
    context: context || {},
    timestamp: new Date().toISOString(),
  });
};

// ============================================
// UTILIDAD: Wrapper para medir tiempo
// ============================================

export const withAnalytics = async <T>(
  actionName: string,
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    trackPerformance(actionName, duration, { ...context, success: true });
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    trackPerformance(actionName, duration, { ...context, success: false });
    trackError('action_error', actionName, (error as Error).stack, context);
    throw error;
  }
};

export default posthog;
