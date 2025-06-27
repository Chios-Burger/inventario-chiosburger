# 📦 Sistema de Inventario ChiosBurger - Estado del Proyecto

## 🚀 Resumen Ejecutivo

Sistema de gestión de inventarios con autenticación, conteo triple, históricos, exportación y sincronización con PostgreSQL Azure. Desarrollado en React 19.1.0 + TypeScript + Vite + Express.js.

## 🔧 Estado Actual del Proyecto

### ✅ Funcionalidades Completadas

1. **Sistema de Autenticación**
   - Login con email/PIN
   - 9 usuarios configurados (2 admin + 7 por bodega)
   - Control de acceso por bodega
   - Sesión persistente en localStorage

2. **Gestión de Inventarios**
   - Conteo triple (C1, C2, C3) con cálculo automático
   - Guardado individual de productos
   - Validación de campos vacíos
   - Alertas para productos en cero
   - Timer y métricas de productividad
   - Botón "Editar" naranja después de guardar

3. **Históricos Mejorados**
   - Vista por sesiones de conteo (no por productos)
   - Filtros: fecha, bodega, usuario, búsqueda
   - Eliminación controlada (solo registros del día actual)
   - Precisión decimal hasta 4 lugares
   - Paginación de 10 registros

4. **Exportación de Datos**
   - CSV con decimales preservados
   - Excel (XLSX) con formato profesional
   - PDF con tabla formateada
   - Respeta filtros aplicados

5. **Backend y Base de Datos**
   - API Express.js en puerto 3001
   - PostgreSQL Azure con SSL
   - 8 tablas específicas por tipo de bodega
   - Guardado en localStorage + BD
   - Manejo de offline/online

6. **Integración Airtable**
   - Sincronización de productos
   - CORS proxy incluido
   - Campos personalizados por bodega

## 🐛 Bugs Corregidos

1. **Records no se guardaban** ✅
   - Faltaba llamada a `historicoService.guardarInventario` en `ListaProductos.tsx`
   - Solucionado en líneas 179-186

2. **Botón Guardado siempre verde** ✅
   - Implementado estado "Editar" con color naranja
   - Detecta cambios después de guardar

## 📁 Estructura del Proyecto

```
inventario_foodix/
├── src/
│   ├── components/
│   │   ├── App.tsx              # Componente principal
│   │   ├── Login.tsx            # Autenticación
│   │   ├── Dashboard.tsx        # Panel principal
│   │   ├── ListaProductos.tsx   # Lista y guardado (MODIFICADO)
│   │   ├── ProductoConteo.tsx   # Conteo individual (MODIFICADO)
│   │   ├── Historico.tsx        # Vista históricos (MODIFICADO)
│   │   └── Toast.tsx            # Notificaciones
│   ├── services/
│   │   ├── airtable.ts          # API Airtable
│   │   ├── auth.ts              # Autenticación
│   │   ├── historico.ts         # Gestión históricos (MODIFICADO)
│   │   └── database.ts          # Mapeo tablas BD
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   └── config.ts                # Configuración usuarios
├── server/
│   ├── index.js                 # API Express
│   ├── package.json             # Dependencias backend
│   └── .env                     # Variables entorno (CREADO)
├── .env                         # Variables frontend (CREADO)
├── package.json                 # Dependencias frontend
├── vite.config.ts              # Configuración Vite
└── DEPLOYMENT.md               # Guía despliegue

```

## 🔑 Credenciales y Configuración

### Base de Datos PostgreSQL Azure
```
Host: chiosburguer.postgres.database.azure.com
Database: InventariosLocales
User: adminChios
Password: Burger2023
Port: 5432
SSL: Requerido
```

### Usuarios del Sistema
```
ADMINISTRADORES:
- gerencia@chiosburger.com (PIN: 9999)
- analisis@chiosburger.com (PIN: 8888)

USUARIOS POR BODEGA:
- bodegaprincipal@chiosburger.com (PIN: 1234)
- analista_calidad@chiosburger.com (PIN: 2345)
- produccion@chiosburger.com (PIN: 3456)
- realaudiencia@chiosburger.com (PIN: 4567)
- floreana@chiosburger.com (PIN: 5678)
- portugal@chiosburger.com (PIN: 6789)
- simonbolon@chiosburger.com (PIN: 7890)
- entrenador@chiosburger.com (PIN: 8901)
```

### Airtable API
```
Base ID: app5zYXr1GmF2bmVF
Table ID: tbl8hyvwwfSnrspAt
API Key: patTAcuJ2tPjECEQM.1a60d9818fadd363088d86e405f30bd0bf7ab0ae443490efe17957102b7c0b2b
View ID: viwTQXKzHMDwwCHwO
```

## 🚦 Cómo Iniciar el Proyecto

### 1. Instalar dependencias (solo primera vez)
```bash
cd /mnt/d/proyectos/inventario_foodix/inventario_foodix
npm install
npm run server:install
```

### 2. Iniciar Backend
```bash
# Terminal 1
cd /mnt/d/proyectos/inventario_foodix/inventario_foodix/server
npm start
```

### 3. Iniciar Frontend
```bash
# Terminal 2
cd /mnt/d/proyectos/inventario_foodix/inventario_foodix
npm run dev
```

### 4. Acceder a la aplicación
```
http://localhost:5173
```

## 🔍 Verificación de Funcionamiento

1. **Login**: Usar cualquier email/PIN de la lista
2. **Conteo**: Ingresar valores en C1, C2, C3
3. **Guardar**: Click en "Guardar" por producto
4. **Editar**: Verificar botón naranja después de guardar
5. **Finalizar**: "Guardar Inventario" cuando todos estén listos
6. **Consola F12**: Ver logs de debugging:
   - 🔄 Iniciando guardado de inventario...
   - ✅ Guardado en localStorage
   - 📡 Enviando a base de datos...
   - ✅ Inventario guardado en base de datos

## 📊 Tablas en Base de Datos

```sql
1. registro_bodega_principal
2. registro_bodega_materia_prima
3. registro_planta_produccion
4. registro_chios (compartida por 3 locales)
5. registro_simon_bolon
6. registro_santo_cachon
```

## 🔄 Logs y Debugging

Los logs agregados están en:
- `src/services/historico.ts` - Logs de guardado
- `src/components/ListaProductos.tsx` - Llamada a servicio
- Consola del navegador (F12) - Ver todos los logs

## 📋 Tareas Pendientes

### Alta Prioridad
- [ ] Sincronización offline automática
- [ ] Recuperación de sesiones interrumpidas
- [ ] Validación de permisos por rol

### Media Prioridad
- [ ] Dashboard con métricas globales
- [ ] Gráficos de tendencias
- [ ] Comparación entre bodegas
- [ ] Alertas de stock bajo

### Baja Prioridad
- [ ] Modo oscuro
- [ ] PWA para móviles
- [ ] Notificaciones push
- [ ] Multi-idioma

## 🚨 Problemas Conocidos

1. **CORS en producción**: Configurar proxy o whitelist
2. **Timeout en Azure**: Aumentar límite de conexión
3. **Cache del navegador**: Limpiar si no se ven cambios

## 📝 Notas Importantes

1. **NO COMMITEAR** archivos .env
2. **Backup diario** de base de datos recomendado
3. **SSL requerido** para Azure PostgreSQL
4. **localStorage** como respaldo offline
5. **Decimales** preservados hasta 4 lugares

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm run dev                  # Frontend
npm run server:dev          # Backend con nodemon
npm run dev:all             # Ambos en paralelo

# Producción
npm run build               # Build frontend
npm run preview             # Preview build
npm run deploy:frontend     # Deploy a Vercel

# Utilidades
npm run lint                # Linter
npm run type-check          # TypeScript check
```

## 📞 Soporte

Para continuar el desarrollo:
1. Revisar este README
2. Verificar logs en consola
3. Comprobar conexión a BD
4. Testear flujo completo

---

**Última actualización**: 26/01/2025
**Estado**: Funcional con mejoras pendientes
**Próxima sesión**: Implementar sincronización offline automática