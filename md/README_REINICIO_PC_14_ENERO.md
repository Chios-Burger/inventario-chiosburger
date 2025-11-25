# 🔄 README REINICIO PC - 14 ENERO 2025

## 🎯 PROBLEMA ACTUAL
El usuario **contabilidad@chiosburger.com** (PIN: 1122) NO se reconoce en el login debido a caché persistente de Vite.

## ✅ CAMBIOS YA IMPLEMENTADOS (NO TOCAR):
1. **Gerencia**: Puede eliminar y exportar Excel ✅
2. **Análisis**: Botón eliminar siempre visible ✅  
3. **Simón Bolón**: Sin restricción domingos ✅
4. **Contabilidad**: Usuario creado en `src/config.ts` ✅
5. **Solo lectura**: Restricciones implementadas ✅

## 🚀 DESPUÉS DE REINICIAR:

### 1. **Navega al proyecto:**
```cmd
D:
cd proyectos\inventario_foodix\inventario_foodix
```

### 2. **Limpia todo el caché:**
```cmd
rmdir /s /q node_modules\.vite 2>nul
rmdir /s /q .vite-new 2>nul
rmdir /s /q .vite-temp 2>nul
```

### 3. **Inicia el BACKEND:**
```cmd
cd server
node start.js
```
(Déjalo corriendo en esta ventana)

### 4. **En OTRA ventana CMD, inicia el FRONTEND:**
```cmd
D:
cd proyectos\inventario_foodix\inventario_foodix
npm run dev
```

### 5. **En el NAVEGADOR:**
- Abre Chrome/Edge en **modo incógnito**
- Ve a `http://localhost:5173`
- Abre consola (F12) y ejecuta:

```javascript
// Verificar usuarios
import('/src/config.ts').then(m => {
  console.log('Total usuarios:', m.USUARIOS.length);
  console.log('Contabilidad existe:', m.USUARIOS.find(u => u.email === 'contabilidad@chiosburger.com'));
});
```

### 6. **Si muestra 11 usuarios, intenta login:**
- Email: `contabilidad@chiosburger.com`
- PIN: `1122`

---

## 🔧 SI AÚN NO FUNCIONA:

### Plan B - Cambiar puerto:
```cmd
npm run dev -- --port 3000
```
Acceder a `http://localhost:3000`

### Plan C - Build de producción:
```cmd
npm run build
npm run preview
```

### Plan D - Forzar cambio en config.ts:
1. Abre `src\config.ts` en notepad
2. Cambia el PIN de contabilidad a `'1123'`
3. Guarda
4. Espera que Vite recargue
5. Cambia de vuelta a `'1122'`
6. Guarda

---

## 📂 ARCHIVOS CLAVE:
- `src/config.ts` - Usuario contabilidad (líneas 92-97)
- `vite.config.ts` - Configuración con force y nuevo cacheDir

## 🔍 VERIFICACIÓN RÁPIDA:
```cmd
# En CMD - Ver si el usuario existe
findstr "contabilidad@chiosburger.com" src\config.ts
```

## ⚠️ IMPORTANTE:
- El usuario SÍ está en el archivo
- El problema es SOLO de caché
- Todos los permisos están implementados correctamente

---

**Última actualización**: 14 Enero 2025, 2:45 PM
**Estado**: Reiniciando PC para limpiar caché