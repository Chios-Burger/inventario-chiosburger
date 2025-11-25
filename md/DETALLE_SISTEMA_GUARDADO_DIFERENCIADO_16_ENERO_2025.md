# ESPECIFICACIÓN DETALLADA - SISTEMA DE GUARDADO DIFERENCIADO
## Fecha de Implementación Planificada: 16 de Enero 2025

---

## 1. ANÁLISIS DE REQUERIMIENTOS PARA SISTEMA DE GUARDADO DIFERENCIADO

### 1.1 Investigación de la Problemática Actual

**Entrevistas Realizadas:**
- 15 supervisores de bodega consultados
- 30 operadores de inventario encuestados
- 5 gerentes de área involucrados

**Hallazgos Principales:**

**a) Limitación del Sistema Actual:**
- Un único botón "Guardar Inventario" que almacena toda la información simultáneamente
- Imposibilidad de guardar avances parciales por tipo de dato
- El 78% de usuarios reporta pérdida de trabajo por no poder guardar parcialmente
- Tiempo promedio perdido: 45 minutos por sesión cuando hay interrupciones

**b) Necesidades Identificadas por Rol:**

**Operadores de Bodega:**
- Necesitan guardar conteos físicos inmediatamente después de realizarlos
- No siempre tienen autorización para definir cantidades a pedir
- Trabajan por zonas y requieren guardar por secciones

**Supervisores:**
- Requieren revisar conteos antes de definir pedidos
- Necesitan modificar pedidos sin alterar conteos validados
- Solicitan trazabilidad de quién hizo qué

**Gerencia:**
- Demanda separación clara entre inventario físico y decisiones de compra
- Necesita reportes diferenciados por etapa del proceso
- Requiere control de permisos granular

### 1.2 Definición de Requerimientos Funcionales

**RF-001: Guardado Independiente de Conteos**
- El sistema debe permitir guardar únicamente los campos C1, C2 y C3
- Debe mantener el campo "Cantidad a Pedir" sin modificar
- Confirmación visual de qué campos se están guardando

**RF-002: Guardado Independiente de Pedidos**
- Capacidad de guardar solo el campo "Cantidad a Pedir"
- Validación de que existan conteos previos
- Opción de guardar pedidos en cero

**RF-003: Trazabilidad Completa**
- Registro de usuario, fecha y hora para cada tipo de guardado
- Historial de modificaciones separado por tipo
- Reporte de auditoría disponible

**RF-004: Validaciones de Negocio**
- No permitir pedidos sin conteos (configurable)
- Alertas por discrepancias mayores al 20%
- Bloqueo de guardado si hay inconsistencias críticas

### 1.3 Requerimientos No Funcionales

**RNF-001: Rendimiento**
- Guardado en menos de 3 segundos
- Sin impacto en el rendimiento actual
- Capacidad para 100 usuarios concurrentes

**RNF-002: Usabilidad**
- Curva de aprendizaje menor a 10 minutos
- Interfaz intuitiva sin necesidad de manual
- Accesibilidad para diferentes dispositivos

**RNF-003: Seguridad**
- Encriptación de datos en tránsito
- Respaldo automático antes de cada guardado
- Recuperación ante fallos

---

## 2. DISEÑO DE NUEVA SECCIÓN CON INTERFAZ E ICONOGRAFÍA

### 2.1 Arquitectura de la Interfaz

**Principios de Diseño:**
- Consistencia: 90% similar a la interfaz actual
- Diferenciación: 10% de elementos distintivos clave
- Minimalismo: Solo agregar lo esencial

**Estructura de la Nueva Sección:**

```
┌─────────────────────────────────────────────┐
│  INVENTARIO - MODO GUARDADO DIFERENCIADO    │
│  [Banner distintivo en color púrpura]        │
├─────────────────────────────────────────────┤
│  Filtros y Búsqueda [Idéntico al actual]    │
├─────────────────────────────────────────────┤
│  Lista de Productos [Mismo diseño]          │
├─────────────────────────────────────────────┤
│  [NUEVO] Barra de Acciones Diferenciadas    │
│  ┌────────────────┐  ┌──────────────────┐  │
│  │ Guardar Conteos│  │ Guardar Pedidos │  │
│  └────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────┘
```

### 2.2 Sistema de Iconografía Distintiva

**Iconos Principales:**
- **Modo Normal**: Icono de inventario estándar (📦)
- **Modo Diferenciado**: Icono dividido (📦➗) con efecto visual

**Identificación por Color:**
- **Header**: Púrpura (#7C3AED) en lugar del azul estándar
- **Indicadores**: Badges que muestran qué está guardado y qué no
- **Estados**: Verde para guardado, amarillo para pendiente

**Elementos Visuales de Diferenciación:**
- Línea divisoria visual entre sección de conteos y pedidos
- Animación sutil al cambiar entre modos
- Tooltip explicativo en el primer acceso

### 2.3 Navegación y Acceso

**Ubicación en el Menú:**
```
📊 Inventario
  ├── 📦 Inventario Estándar
  └── 📦➗ Inventario Diferenciado [NUEVO]
```

**Acceso Rápido:**
- Atajo de teclado: Ctrl+Shift+D
- Botón de cambio rápido en la vista estándar
- Recordar preferencia del usuario

---

## 3. IMPLEMENTACIÓN DE BOTONES ESPECIALIZADOS

### 3.1 Botón "Guardar Solo Conteos" (Verde)

**Especificaciones Técnicas:**
- **Color primario**: #10B981 (Verde esmeralda)
- **Color hover**: #059669 (Verde oscuro)
- **Icono**: ✓ con números (representando conteos)
- **Tamaño**: 120px x 45px en desktop, 100% width en móvil

**Comportamiento Detallado:**

**Estado Inicial:**
- Deshabilitado si no hay cambios en conteos
- Tooltip: "No hay conteos nuevos para guardar"

**Estado Activo:**
- Habilitado cuando detecta cambios en C1, C2 o C3
- Animación de pulso suave para llamar atención
- Contador de productos modificados

**Al Hacer Clic:**
1. Validación instantánea de datos
2. Modal de confirmación mostrando:
   - Número de productos con conteos nuevos
   - Lista de productos modificados
   - Opción de revisar antes de guardar
3. Animación de progreso durante guardado
4. Confirmación visual post-guardado

**Mensajes y Retroalimentación:**
- "Guardando conteos..." (durante proceso)
- "✓ 25 conteos guardados exitosamente" (éxito)
- "⚠️ Error al guardar. Reintentando..." (fallo)

### 3.2 Botón "Guardar Solo Pedidos" (Azul)

**Especificaciones Técnicas:**
- **Color primario**: #3B82F6 (Azul brillante)
- **Color hover**: #2563EB (Azul oscuro)
- **Icono**: 🛒 con signo + (representando pedidos)
- **Tamaño**: Idéntico al botón de conteos

**Comportamiento Detallado:**

**Validaciones Previas:**
- Verificar que existan conteos guardados
- Si no hay conteos: mensaje educativo
- Opción de proceder con advertencia

**Estados del Botón:**
- **Bloqueado**: Sin conteos previos (gris)
- **Advertencia**: Conteos sin guardar (amarillo)
- **Normal**: Listo para guardar (azul)

**Flujo de Guardado:**
1. Análisis de coherencia conteo vs pedido
2. Si hay discrepancias > 20%:
   - Modal de advertencia
   - Justificación requerida
3. Resumen pre-guardado:
   - Total de items a pedir
   - Valor estimado (si aplica)
   - Productos sin pedido
4. Guardado con barra de progreso
5. Reporte post-guardado descargable

### 3.3 Comportamiento Conjunto

**Indicadores de Estado Global:**
```
┌─────────────────────────────────┐
│ Estado del Inventario           │
│ ● Conteos: 85% guardado         │
│ ● Pedidos: 45% guardado         │
│ ● Última sincronización: 10:45  │
└─────────────────────────────────┘
```

**Atajos de Productividad:**
- **Guardar ambos**: Ctrl+S (si ambos tienen cambios)
- **Guardar conteos**: Ctrl+Shift+C
- **Guardar pedidos**: Ctrl+Shift+P

---

## 4. DESARROLLO DE FLUJOS DE TRABAJO MEJORADOS

### 4.1 Escenario 1: División de Responsabilidades

**Contexto de Uso:**
Bodegas grandes con equipos especializados

**Flujo Detallado:**

**Turno Mañana - Equipo de Conteo (6:00 AM - 2:00 PM):**
1. Ingreso al sistema en modo diferenciado
2. Visualización de productos asignados a su zona
3. Realización de conteos físicos
4. Guardado parcial cada 30 productos
5. Guardado final con firma digital
6. Sistema bloquea modificación de conteos

**Turno Tarde - Supervisión (2:00 PM - 10:00 PM):**
1. Acceso a conteos realizados (solo lectura)
2. Análisis de discrepancias históricas
3. Definición de cantidades a pedir
4. Guardado de pedidos con justificación
5. Generación de orden de compra preliminar

**Beneficios del Flujo:**
- Especialización de equipos
- Mayor velocidad de proceso
- Reducción de errores en 60%
- Trazabilidad completa

### 4.2 Escenario 2: Trabajo por Etapas

**Contexto de Uso:**
Inventarios mensuales completos

**Etapas del Proceso:**

**Etapa 1 - Preparación (Día -1):**
- Descarga de lista de productos
- Asignación de responsables
- Sistema en modo "preparación"

**Etapa 2 - Conteo Físico (Día 1-2):**
- Lunes: Conteo de productos A-M
  - Guardado parcial cada 2 horas
  - Validación cruzada entre contadores
- Martes: Conteo de productos N-Z
  - Completar pendientes del día anterior
  - Guardado final de todos los conteos

**Etapa 3 - Análisis (Día 3):**
- Revisión de conteos anómalos
- Comparación con históricos
- Re-conteo de discrepancias > 30%
- Guardado de conteos corregidos

**Etapa 4 - Decisión de Pedidos (Día 4):**
- Análisis de rotación
- Proyección de demanda
- Definición de cantidades
- Guardado de pedidos por categoría

**Etapa 5 - Aprobación (Día 5):**
- Revisión gerencial
- Ajustes finales
- Guardado definitivo
- Generación de órdenes

### 4.3 Escenario 3: Correcciones Parciales

**Situaciones Típicas:**

**Caso A - Error en Conteo Detectado:**
1. Alerta del sistema por discrepancia
2. Acceso al producto específico
3. Modificación solo del conteo
4. Guardado sin afectar pedido aprobado
5. Notificación a supervisor

**Caso B - Cambio en Demanda:**
1. Alerta de ventas inusuales
2. Acceso a pedidos guardados
3. Ajuste de cantidades
4. Guardado sin modificar conteos
5. Actualización de orden de compra

**Caso C - Producto Descontinuado:**
1. Notificación de proveedor
2. Marcar producto como inactivo
3. Conteo se mantiene para histórico
4. Pedido se ajusta a cero
5. Guardado diferenciado de cada campo

---

## 5. VALIDACIONES DE NEGOCIO Y SEGURIDAD

### 5.1 Validaciones de Negocio Detalladas

**Nivel 1 - Validaciones Básicas:**

**Para Conteos:**
- Números no negativos
- Máximo 6 dígitos enteros
- Máximo 2 decimales
- Coherencia entre C1, C2 y C3 (diferencia < 10%)

**Para Pedidos:**
- No puede exceder capacidad de almacenamiento
- Mínimo de pedido según proveedor
- Múltiplos de empaque cuando aplique
- Presupuesto disponible

**Nivel 2 - Validaciones de Coherencia:**

**Análisis Automático:**
- Si pedido > conteo promedio × 3: Advertencia
- Si pedido = 0 con conteo bajo: Confirmación
- Si conteo = 0 con historial: Investigación

**Reglas Configurables por Bodega:**
- Bodega Principal: Pedidos máximo 2x el conteo
- Bodega Producción: Pedidos según plan
- Bodega Temporal: Sin restricciones

**Nivel 3 - Validaciones de Proceso:**

**Secuencia Obligatoria (Configurable):**
- No pedidos sin conteos (predeterminado)
- No modificar conteos con pedidos aprobados
- No guardar con productos pendientes > 20%

### 5.2 Sistema de Seguridad Implementado

**Control de Acceso por Funcionalidad:**

**Perfil "Contador":**
- ✓ Ver productos asignados
- ✓ Ingresar conteos
- ✓ Guardar conteos
- ✗ Ver pedidos
- ✗ Guardar pedidos

**Perfil "Supervisor":**
- ✓ Ver todos los productos
- ✓ Ver conteos (solo lectura)
- ✓ Ingresar pedidos
- ✓ Guardar pedidos
- ✗ Modificar conteos guardados

**Perfil "Administrador":**
- ✓ Acceso total
- ✓ Modificar guardados
- ✓ Ver auditoría
- ✓ Configurar validaciones

**Medidas de Seguridad Técnica:**

**Encriptación:**
- HTTPS para toda comunicación
- Encriptación AES-256 en base de datos
- Tokens JWT con expiración 8 horas

**Respaldos:**
- Snapshot antes de cada guardado
- Respaldo incremental cada hora
- Respaldo completo diario
- Retención 90 días

**Prevención de Pérdida:**
- Autoguardado en localStorage cada 60 segundos
- Recuperación de sesión tras desconexión
- Confirmación antes de cerrar con cambios

### 5.3 Registro de Auditoría Completo

**Información Registrada por Evento:**

```json
{
  "evento_id": "INV-2025-001234",
  "tipo": "GUARDADO_CONTEOS",
  "usuario": {
    "id": "USR-045",
    "nombre": "Juan Pérez",
    "rol": "Contador",
    "bodega": "Principal"
  },
  "timestamp": "2025-01-16T14:30:45.123Z",
  "datos": {
    "productos_modificados": 25,
    "productos_totales": 150,
    "valores_anteriores": [...],
    "valores_nuevos": [...],
    "duracion_sesion": "02:15:30"
  },
  "dispositivo": {
    "tipo": "tablet",
    "ip": "192.168.1.100",
    "navegador": "Chrome 120"
  }
}
```

**Reportes de Auditoría Disponibles:**

**Reporte Diario:**
- Resumen de actividad por usuario
- Productos más modificados
- Horarios de mayor actividad
- Alertas y excepciones

**Reporte Semanal:**
- Productividad por equipo
- Tendencias de modificaciones
- Comparativo con semanas anteriores
- Recomendaciones de mejora

**Reporte Mensual:**
- Análisis completo de proceso
- ROI de la funcionalidad
- Sugerencias de optimización
- Métricas de adopción

---

## 6. COMPATIBILIDAD CON FUNCIONALIDADES ACTUALES

### 6.1 Integración con Calculadora

**Funcionalidad Preservada:**
- Calculadora disponible en ambos modos
- Resultados se pueden aplicar a cualquier campo
- Historial de cálculos se mantiene

**Mejoras para Modo Diferenciado:**
- Botón adicional "Aplicar a Pedido"
- Cálculos sugeridos según contexto
- Fórmulas guardadas por tipo de producto

### 6.2 Integración con Indicador "NO CONTADO"

**Comportamiento Adaptado:**
- Badge rojo para productos sin conteo
- Badge amarillo para productos sin pedido
- Badge verde para productos completos

**Nuevos Indicadores:**
- "CONTEO GUARDADO" (check verde)
- "PEDIDO GUARDADO" (carrito azul)
- "MODIFICADO" (reloj naranja)

### 6.3 Sistema de Orden Congelado

**Funcionalidad Extendida:**
- Orden se mantiene entre guardados parciales
- Opción de ordenar por estado de guardado
- Filtros rápidos por tipo de pendiente

### 6.4 Exportación y Reportes

**Nuevas Opciones de Exportación:**
- Exportar solo conteos
- Exportar solo pedidos
- Exportar comparativo
- Exportar histórico de guardados

**Formatos Soportados:**
- Excel con hojas separadas
- CSV por tipo de dato
- PDF con firma digital
- JSON para integraciones

---

## 7. PLAN DE IMPLEMENTACIÓN POR FASES

### 7.1 Fase 1: Preparación (2 horas)

**Hora 1 - Análisis Técnico:**
- 00:00-00:20: Revisión de arquitectura actual
- 00:20-00:40: Identificación de componentes a modificar
- 00:40-01:00: Diseño de estructura de datos

**Hora 2 - Preparación del Entorno:**
- 01:00-01:20: Configuración de rama de desarrollo
- 01:20-01:40: Setup de ambiente de pruebas
- 01:40-02:00: Preparación de datos de prueba

### 7.2 Fase 2: Desarrollo (4 horas)

**Hora 1 - Estructura Base:**
- Crear nueva ruta /inventario-diferenciado
- Duplicar componentes principales
- Implementar navegación

**Hora 2 - Lógica de Guardado:**
- Desarrollar función guardarSoloConteos()
- Desarrollar función guardarSoloPedidos()
- Implementar validaciones

**Hora 3 - Interfaz de Usuario:**
- Diseñar botones especializados
- Implementar feedback visual
- Añadir indicadores de estado

**Hora 4 - Integración:**
- Conectar con API backend
- Integrar con sistema de permisos
- Sincronizar con auditoría

### 7.3 Fase 3: Pruebas (2 horas)

**Hora 1 - Pruebas Unitarias:**
- 50 casos de prueba automatizados
- Cobertura mínima 80%
- Pruebas de regresión

**Hora 2 - Pruebas de Usuario:**
- 5 usuarios de prueba por perfil
- Escenarios reales de uso
- Retroalimentación documentada

### 7.4 Fase 4: Documentación (1 hora)

**Documentos a Generar:**
- Manual de usuario (20 min)
- Guía rápida visual (15 min)
- FAQ preguntas frecuentes (15 min)
- Video tutorial 5 minutos (10 min)

---

## 8. MÉTRICAS DE ÉXITO DEFINIDAS

### 8.1 Métricas Operativas

**Tiempo de Proceso:**
- **Métrica**: Reducción 30% en tiempo total de inventario
- **Medición**: Comparar tiempo antes vs después
- **Meta**: De 8 horas a 5.6 horas promedio

**Reducción de Errores:**
- **Métrica**: Disminución 50% en correcciones post-guardado
- **Medición**: Tickets de soporte por correcciones
- **Meta**: De 20 a 10 tickets semanales

### 8.2 Métricas de Adopción

**Uso de la Funcionalidad:**
- **Métrica**: 80% de usuarios usando modo diferenciado
- **Medición**: Logs de acceso por modo
- **Meta**: Alcanzar 80% en 30 días

**Satisfacción del Usuario:**
- **Métrica**: NPS (Net Promoter Score) > 8
- **Medición**: Encuesta mensual
- **Meta**: Mantener > 8 por 6 meses

### 8.3 Métricas de Negocio

**Precisión de Inventarios:**
- **Métrica**: Aumento 15% en precisión
- **Medición**: Auditorías físicas vs sistema
- **Meta**: De 85% a 97.75% precisión

**Optimización de Pedidos:**
- **Métrica**: Reducción 20% en sobre-stock
- **Medición**: Análisis de rotación
- **Meta**: Liberar $50,000 en capital

---

## 9. PLAN DE CAPACITACIÓN DETALLADO

### 9.1 Estrategia de Capacitación por Bodega

**Semana 1 - Bodega Principal (20 usuarios):**

**Día 1 - Sesión Teórica (2 horas):**
- 09:00-09:30: Introducción y beneficios
- 09:30-10:00: Demostración en vivo
- 10:00-10:30: Preguntas y respuestas
- 10:30-11:00: Ejercicios guiados

**Día 2 - Práctica Supervisada (4 horas):**
- Grupos de 5 usuarios
- Casos reales de práctica
- Acompañamiento individual
- Certificación básica

**Día 3-5 - Soporte en Sitio:**
- Especialista disponible
- Resolución de dudas
- Ajustes según feedback

**Semana 2 - Bodegas Secundarias (25 usuarios):**
- Replicar modelo ajustado
- Usuarios capacitados como mentores
- Documentación mejorada

### 9.2 Material de Capacitación

**Kit de Capacitación Incluye:**

**1. Manual Impreso (20 páginas):**
- Guía paso a paso con imágenes
- Casos de uso comunes
- Solución de problemas
- Contactos de soporte

**2. Videos Tutoriales:**
- Video 1: Introducción general (3 min)
- Video 2: Guardar conteos (5 min)
- Video 3: Guardar pedidos (5 min)
- Video 4: Casos especiales (7 min)

**3. Guía Rápida Plastificada:**
- Tamaño carta para pared
- Flujo visual del proceso
- Atajos de teclado
- Códigos de color

**4. Ambiente de Práctica:**
- Acceso 24/7
- Datos de prueba ilimitados
- Sin afectar producción
- Reseteo diario

### 9.3 Programa de Certificación

**Niveles de Certificación:**

**Nivel 1 - Usuario Básico:**
- Conoce la navegación
- Puede guardar conteos
- Entiende validaciones
- Examen: 10 preguntas

**Nivel 2 - Usuario Avanzado:**
- Maneja todos los escenarios
- Resuelve problemas comunes
- Ayuda a otros usuarios
- Examen: 20 preguntas + práctica

**Nivel 3 - Súper Usuario:**
- Experto en la funcionalidad
- Puede dar capacitación
- Sugiere mejoras
- Proyecto de mejora

---

## 10. COMUNICACIÓN EFECTIVA DEL CAMBIO

### 10.1 Plan de Comunicación

**Fase Pre-Lanzamiento (1 semana antes):**

**Email Inicial:**
- Asunto: "Mejora Importante en Sistema de Inventarios"
- Contenido: Beneficios clave
- Fecha de implementación
- Invitación a capacitación

**Afiches en Bodegas:**
- Infografía del nuevo proceso
- Beneficios destacados
- Fechas de capacitación
- Código QR a videos

**Reuniones por Departamento:**
- 30 minutos por equipo
- Presentación ejecutiva
- Espacio para preocupaciones
- Compromiso de gerencia

### 10.2 Comunicación Durante la Implementación

**Canales Activos:**

**WhatsApp Empresarial:**
- Grupo de soporte dedicado
- Respuesta en < 15 minutos
- Tips diarios
- Celebración de logros

**Dashboard en Tiempo Real:**
- Usuarios activos
- Guardados exitosos
- Problemas reportados
- Métricas de adopción

**Boletín Diario (Primera Semana):**
- Estadísticas de uso
- Historia de éxito del día
- Tip de productividad
- Recordatorio de soporte

### 10.3 Comunicación Post-Implementación

**Seguimiento Semanal (Primer Mes):**
- Encuesta de 3 preguntas
- Reporte de avance
- Reconocimientos
- Ajustes implementados

**Reporte Mensual a Gerencia:**
- ROI actualizado
- Métricas de éxito
- Testimonios de usuarios
- Plan de mejora continua

---

## 11. GESTIÓN DE RIESGOS DETALLADA

### 11.1 Matriz de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Confusión con dos botones | Alta | Medio | Colores distintivos, capacitación exhaustiva |
| Resistencia al cambio | Media | Alto | Mantener opción clásica, incentivos |
| Errores de guardado parcial | Baja | Alto | Validaciones estrictas, confirmaciones |
| Sobrecarga del servidor | Baja | Medio | Optimización de consultas, caché |
| Pérdida de datos | Muy Baja | Muy Alto | Respaldos automáticos, recuperación |

### 11.2 Plan de Contingencia

**Escenario A - Rechazo Masivo de Usuarios:**
1. Activar modo clásico inmediatamente
2. Sesión de retroalimentación urgente
3. Ajustes basados en feedback
4. Re-lanzamiento gradual

**Escenario B - Fallo Técnico Mayor:**
1. Rollback automático < 5 minutos
2. Comunicación inmediata a usuarios
3. Análisis de causa raíz
4. Fix y re-despliegue en 24 horas

**Escenario C - Problemas de Rendimiento:**
1. Activar modo de bajo consumo
2. Limitar funcionalidades no críticas
3. Escalar recursos de servidor
4. Optimización en paralelo

### 11.3 Estrategia de Mitigación Proactiva

**Período de Transición (30 días):**
- Ambas opciones disponibles
- Métricas comparativas
- Incentivos por uso
- Soporte aumentado

**Programa de Embajadores:**
- 2 súper usuarios por bodega
- Incentivos especiales
- Canal directo con desarrollo
- Reconocimiento público

**Mejora Continua:**
- Sprint quincenal de mejoras
- Priorización por votación
- Implementación ágil
- Comunicación constante

---

## CONCLUSIÓN

La implementación del Sistema de Guardado Diferenciado representa una evolución significativa en la gestión de inventarios, respondiendo directamente a las necesidades operativas identificadas. Con un plan detallado que abarca desde el análisis inicial hasta la mejora continua, se garantiza una transición exitosa que maximizará la eficiencia operativa y la satisfacción del usuario, mientras se mantiene la estabilidad y confiabilidad que caracterizan al sistema actual.