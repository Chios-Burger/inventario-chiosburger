# 📋 RESUMEN DE USUARIOS DEL SISTEMA DE INVENTARIO

## 👥 USUARIOS ADMINISTRADORES (esAdmin: true)

### 1. GERENCIA
- **Email**: gerencia@chiosburger.com
- **PIN**: 9999
- **Bodegas**: TODAS (1,2,3,4,5,6,7,8,9)
- **Permisos especiales**:
  - ✅ Ver todas las bodegas
  - ✅ Ver todos los históricos
  - ✅ Editar productos en históricos
  - ✅ Botón de editar bodegas
  - ❌ No puede eliminar históricos

### 2. ANÁLISIS
- **Email**: analisis@chiosburger.com
- **PIN**: 8888
- **Bodegas**: TODAS (1,2,3,4,5,6,7,8,9)
- **Permisos especiales**:
  - ✅ Ver todas las bodegas
  - ✅ Ver todos los históricos
  - ✅ Editar productos en históricos
  - ✅ Eliminar cualquier histórico
  - ✅ Exportar a CSV y Excel
  - ✅ Botón de editar bodegas

---

## 🏭 USUARIOS POR BODEGA (esAdmin: false)

### 3. BODEGA PRINCIPAL
- **Email**: bodegaprincipal@chiosburger.com
- **PIN**: 4321
- **Bodegas permitidas**: 
  - Bodega Principal (ID: 1)
  - Bodega Pulmon (ID: 9)
- **Permisos**:
  - Solo puede ver/gestionar sus 2 bodegas asignadas
  - Puede editar/eliminar solo registros del día actual (hasta mediodía)

### 4. BODEGA MATERIA PRIMA
- **Email**: analista_calidad@chiosburger.com
- **PIN**: 2345
- **Bodega permitida**: Bodega Materia Prima (ID: 2)
- **Nota**: El email no coincide con el nombre del usuario

### 5. PLANTA PRODUCCIÓN
- **Email**: produccion@chiosburger.com
- **PIN**: 3456
- **Bodega permitida**: Planta De Producción (ID: 3)
- **Función especial**: Botón "Todo en 0" disponible

### 6. CHIOS REAL AUDIENCIA
- **Email**: realaudiencia@chiosburger.com
- **PIN**: 4567
- **Bodega permitida**: Chios Real Audiencia (ID: 4)

### 7. CHIOS FLOREANA
- **Email**: floreana@chiosburger.com
- **PIN**: 5678
- **Bodega permitida**: Chios Floreana (ID: 5)

### 8. CHIOS PORTUGAL
- **Email**: portugal@chiosburger.com
- **PIN**: 6789
- **Bodega permitida**: Chios Portugal (ID: 6)

### 9. SIMÓN BOLÓN
- **Email**: simonbolon@chiosburger.com
- **PIN**: 7890
- **Bodega permitida**: Simón Bolón (ID: 7)

### 10. SANTO CACHÓN
- **Email**: entrenador@chiosburger.com
- **PIN**: 8901
- **Bodega permitida**: Santo Cachón (ID: 8)
- **Nota**: El email no coincide con el nombre del usuario

---

## 🔐 FUNCIONALIDADES POR TIPO DE USUARIO

### Administradores (Gerencia y Análisis):
- ✅ Acceso a todas las bodegas
- ✅ Ver históricos de todas las bodegas
- ✅ Editar productos en cualquier momento
- ✅ Exportar reportes completos
- ✅ Ver botón de editar bodegas

### Usuario Análisis (adicional):
- ✅ Eliminar cualquier histórico
- ✅ Exportar a CSV y Excel
- ✅ Permisos de super admin

### Usuarios Normales:
- ✅ Solo ven sus bodegas asignadas
- ✅ Solo ven históricos de sus bodegas
- ✅ Pueden editar/eliminar solo hasta mediodía del día actual
- ❌ No pueden exportar a CSV/Excel (solo PDF)
- ❌ No ven botón de editar bodegas

### Usuario Planta Producción (adicional):
- ✅ Botón "Todo en 0" para marcar todos los productos con cantidad 0

---

## ⚠️ OBSERVACIONES

1. **Inconsistencias en emails**:
   - Usuario "Bodega Materia Prima" usa email: analista_calidad@
   - Usuario "Santo Cachón" usa email: entrenador@

2. **Bodega Pulmon**:
   - Solo accesible por usuario Bodega Principal
   - No tiene usuario dedicado

3. **PINs secuenciales**:
   - Los PINs siguen un patrón predecible (4321, 2345, 3456...)
   - Considerar cambiarlos por seguridad

---

**Última actualización**: 14 de Enero 2025