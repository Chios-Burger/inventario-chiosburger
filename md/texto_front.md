# GUÍA COMPLETA DE DISEÑO VISUAL Y ESTÉTICO - SISTEMA DE INVENTARIO

## 📐 ARQUITECTURA VISUAL GENERAL

### Framework y Tecnologías Base
- **React**: v19.1.0
- **Tailwind CSS**: v4.1.10
- **Lucide React**: v0.515.0 (sistema de iconos)
- **PostCSS**: v8.5.5
- **Autoprefixer**: v10.4.21

### Filosofía de Diseño
- **Estilo**: Moderno, limpio, con gradientes suaves y glassmorphism
- **Approach**: Mobile-first responsive design
- **Interacciones**: Animaciones sutiles y feedback visual inmediato
- **Accesibilidad**: Contraste alto, estados claros, indicadores visuales

## 🎨 SISTEMA DE COLORES COMPLETO

### Colores Custom en Tailwind Config
```javascript
colors: {
  'foodix-azul': '#001f3f',     // Azul oscuro corporativo
  'foodix-rojo': '#dc2626',     // Rojo principal
  'foodix-rojo-claro': '#ef4444' // Rojo claro para hover
}
```

### Paleta Principal

#### Colores Primarios
- **Purple (Principal)**
  - 50: #faf5ff
  - 100: #f3e8ff
  - 200: #e9d5ff
  - 300: #d8b4fe
  - 400: #c084fc → #a78bfa (gradient start)
  - 500: #a855f7 → #9333ea (main)
  - 600: #9333ea (gradient end)
  - 700: #7e22ce
  - 800: #6b21a8
  - 900: #581c87

- **Blue (Secundario)**
  - 50: #eff6ff
  - 100: #dbeafe
  - 200: #bfdbfe
  - 300: #93c5fd
  - 400: #60a5fa (gradient start)
  - 500: #3b82f6
  - 600: #2563eb (gradient end)
  - 700: #1d4ed8
  - 800: #1e40af
  - 900: #1e3a8a

#### Colores de Estado
- **Success**: 
  - Primary: #10b981 (green-500)
  - Dark: #059669 (green-600)
  - Light: #d1fae5 (green-100)
  - Background: from-green-50 to-green-100

- **Error/Danger**:
  - Primary: #ef4444 (red-500)
  - Dark: #dc2626 (red-600)
  - Light: #fee2e2 (red-100)
  - Background: from-red-50 to-red-100

- **Warning**:
  - Primary: #f59e0b (yellow-500)
  - Dark: #d97706 (yellow-600)
  - Light: #fef3c7 (yellow-100)
  - Background: from-yellow-50 to-yellow-100

- **Info**:
  - Primary: #3b82f6 (blue-500)
  - Dark: #2563eb (blue-600)
  - Light: #dbeafe (blue-100)
  - Background: from-blue-50 to-blue-100

#### Colores Neutros
- **Grays**:
  - 50: #f9fafb (backgrounds)
  - 100: #f3f4f6 (hover states)
  - 200: #e5e7eb (borders)
  - 300: #d1d5db (disabled borders)
  - 400: #9ca3af (disabled text)
  - 500: #6b7280 (secondary text)
  - 600: #4b5563 (icons)
  - 700: #374151 (body text)
  - 800: #1f2937 (headings)
  - 900: #111827 (dark text)

### Gradientes Principales
```css
/* Gradiente principal - usado en botones primarios */
background: linear-gradient(to right, #a855f7, #2563eb);

/* Gradiente de fondo */
background: linear-gradient(to bottom right, #faf5ff, #ffffff, #eff6ff);

/* Gradiente de texto */
background: linear-gradient(to right, #9333ea, #2563eb);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

## 📏 SISTEMA TIPOGRÁFICO

### Escala de Tamaños
```css
/* Mobile → Desktop */
.text-xs    { font-size: 0.75rem; }  /* 12px */
.text-sm    { font-size: 0.875rem; } /* 14px */
.text-base  { font-size: 1rem; }     /* 16px */
.text-lg    { font-size: 1.125rem; } /* 18px */
.text-xl    { font-size: 1.25rem; }  /* 20px */
.text-2xl   { font-size: 1.5rem; }   /* 24px */
.text-3xl   { font-size: 1.875rem; } /* 30px */
.text-4xl   { font-size: 2.25rem; }  /* 36px */

/* Tamaños custom para elementos específicos */
.text-[8px]  { font-size: 8px; }
.text-[9px]  { font-size: 9px; }
.text-[10px] { font-size: 10px; }
```

### Jerarquía Tipográfica
1. **Título Principal**: `text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent`
2. **Subtítulos**: `text-xl sm:text-3xl font-bold text-gray-800`
3. **Encabezados de Sección**: `text-lg sm:text-xl font-bold text-gray-800`
4. **Encabezados de Card**: `text-base sm:text-lg font-semibold text-gray-800`
5. **Texto Normal**: `text-sm sm:text-base text-gray-700`
6. **Texto Secundario**: `text-xs sm:text-sm text-gray-600`
7. **Texto Pequeño**: `text-xs text-gray-500`
8. **Micro Texto**: `text-[8px] text-gray-500`

### Pesos de Fuente
- **font-medium**: 500 (textos importantes)
- **font-semibold**: 600 (subtítulos)
- **font-bold**: 700 (títulos principales)

## 📦 SISTEMA DE ESPACIADO

### Espaciado Base (rem → px)
```css
/* Padding/Margin Scale */
0:   0
0.5: 0.125rem (2px)
1:   0.25rem  (4px)
1.5: 0.375rem (6px)
2:   0.5rem   (8px)
2.5: 0.625rem (10px)
3:   0.75rem  (12px)
4:   1rem     (16px)
5:   1.25rem  (20px)
6:   1.5rem   (24px)
8:   2rem     (32px)
10:  2.5rem   (40px)
12:  3rem     (48px)
16:  4rem     (64px)
20:  5rem     (80px)
```

### Patrones de Espaciado

#### Contenedores
- **Principal**: `p-4 sm:p-8`
- **Cards**: `p-4 sm:p-6`
- **Secciones**: `py-6 sm:py-8`
- **Modales**: `p-6 sm:p-8`

#### Botones
- **Small**: `px-3 py-1.5`
- **Normal**: `px-4 py-2`
- **Medium**: `px-6 py-3`
- **Large**: `px-8 py-4`

#### Gaps y Espacios
- **Entre elementos**: `gap-3 sm:gap-4` o `space-y-4`
- **Entre secciones**: `mb-6 sm:mb-8`
- **Entre cards**: `gap-4`
- **Iconos y texto**: `gap-2`

### Contenedores Max-Width
- **Extra Large**: `max-w-7xl` (1280px)
- **Large**: `max-w-5xl` (1024px)
- **Medium**: `max-w-3xl` (768px)
- **Small**: `max-w-md` (448px)
- **Extra Small**: `max-w-sm` (384px)

## 🎯 COMPONENTES UI DETALLADOS

### Botones

#### Botón Primario
```jsx
className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
```

#### Botón Secundario
```jsx
className="bg-white border-2 border-purple-200 text-purple-600 px-6 py-3 rounded-xl font-medium hover:bg-purple-50 hover:border-purple-300 transition-all duration-300"
```

#### Botón Danger
```jsx
className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all duration-300"
```

#### Botón Disabled
```jsx
className="bg-gray-100 text-gray-400 px-6 py-3 rounded-xl font-medium cursor-not-allowed opacity-50"
```

#### Floating Action Button
```jsx
className="fixed bottom-4 right-4 bg-gradient-to-r from-purple-500 to-blue-600 text-white p-4 rounded-full shadow-lg hover:shadow-2xl hover:scale-110 transition-all duration-300"
```

### Inputs

#### Input Normal
```jsx
className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 sm:py-3 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white transition-all duration-200"
```

#### Input con Icono
```jsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
  <input className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" />
</div>
```

#### Input Number (Conteo)
```jsx
className="w-full px-2 py-1 text-center text-lg font-medium bg-gray-50 border-2 border-gray-200 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
```

### Cards

#### Card Base
```jsx
className="bg-white rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6"
```

#### Card Producto Guardado
```jsx
className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 ring-2 ring-green-400 bg-gradient-to-br from-green-50 to-white"
```

#### Card Producto Inactivo
```jsx
className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 ring-2 ring-gray-400 bg-gradient-to-br from-gray-100 to-gray-50 opacity-75"
```

#### Card Sin Contar
```jsx
className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 ring-2 ring-red-400"
```

### Modales

#### Estructura Base
```jsx
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-bounce-in">
    {/* Contenido */}
  </div>
</div>
```

### Toast Notifications

#### Success Toast
```jsx
className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-green-50 to-green-100 text-green-800 px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3 animate-slide-down"
```

#### Error Toast
```jsx
className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-red-50 to-red-100 text-red-800 px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3 animate-slide-down"
```

### Progress Bars

#### Multi-tipo con Categorías
```jsx
<div className="flex items-center gap-2">
  <span className="text-[9px] font-bold text-blue-600">A</span>
  <div className="flex-1 h-2 bg-blue-100 rounded overflow-hidden">
    <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: '75%' }} />
  </div>
  <span className="text-[8px] text-gray-500">75%</span>
</div>
```

### Badges/Pills

#### Badge Normal
```jsx
className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700"
```

#### Badge con Icono
```jsx
className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700"
```

## 🎭 ANIMACIONES Y TRANSICIONES

### Animaciones CSS Personalizadas

```css
/* Slide In desde izquierda */
@keyframes slide-in {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Slide Down desde arriba */
@keyframes slide-down {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Bounce In con escala */
@keyframes bounce-in {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Float continuo */
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Shimmer para skeleton loading */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Pulse Ring */
@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

/* Logo Spin */
@keyframes logo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

### Clases de Animación
```css
.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}

.animate-slide-down {
  animation: slide-down 0.3s ease-out;
}

.animate-bounce-in {
  animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    #f0f0f0 0%,
    #f8f8f8 50%,
    #f0f0f0 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.animate-pulse-ring {
  animation: pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-logo-spin {
  animation: logo-spin 20s linear infinite;
}
```

### Transiciones Comunes
- **Global**: `transition-all duration-300`
- **Colores**: `transition-colors duration-200`
- **Transform**: `transition-transform duration-300`
- **Opacity**: `transition-opacity duration-200`
- **Shadow**: `transition-shadow duration-300`

### Estados Hover
```css
/* Botones */
hover:scale-105
hover:shadow-lg

/* Cards */
hover:shadow-xl
hover:scale-[1.02]
hover:translateY(-2px)

/* Links */
hover:text-purple-600
hover:underline

/* Inputs */
hover:border-purple-300
focus:scale-[1.02]
```

## 🖼️ ICONOS LUCIDE REACT

### Iconos por Categoría

#### Navegación
- `Home` - Inicio
- `History` - Histórico
- `Menu` - Menú móvil
- `ChevronDown/Up` - Expandir/Colapsar
- `ArrowLeft` - Volver

#### Productos
- `Package2` - Producto principal
- `Package` - Producto secundario
- `Box` - Inventario

#### Acciones
- `Search` - Buscar
- `X` - Cerrar/Cancelar
- `Check` - Confirmar
- `Edit3` - Editar
- `Trash2` - Eliminar
- `Save` - Guardar
- `Download` - Descargar
- `Ban` - Desactivar
- `RefreshCw` - Actualizar

#### Estados
- `AlertCircle` - Alerta
- `Info` - Información
- `AlertTriangle` - Advertencia
- `CheckCircle` - Éxito
- `XCircle` - Error
- `Loader2` - Cargando (con animate-spin)

#### Datos
- `Calendar` - Fecha
- `Clock` - Tiempo
- `User` - Usuario
- `Mail` - Email
- `Hash` - Número/Código
- `Tag` - Categoría

#### Conectividad
- `Wifi` - En línea
- `WifiOff` - Sin conexión
- `CloudOff` - Sin sincronización
- `Database` - Base de datos

#### Métricas
- `TrendingUp` - Tendencia
- `BarChart3` - Gráfico
- `Award` - Logro
- `Sparkles` - Destacado

#### Archivos
- `FileText` - PDF
- `FileSpreadsheet` - Excel/CSV

#### Autenticación
- `Lock` - Seguridad
- `LogIn` - Iniciar sesión
- `LogOut` - Cerrar sesión

### Tamaños de Iconos
- **Extra Small**: `w-3 h-3` (12px)
- **Small**: `w-4 h-4` (16px)
- **Normal**: `w-5 h-5` (20px)
- **Medium**: `w-6 h-6` (24px)
- **Large**: `w-8 h-8` (32px)
- **Extra Large**: `w-10 h-10` (40px)

## 🎨 EFECTOS ESPECIALES

### Glassmorphism
```css
.glass-effect {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

### Sombras Personalizadas
```css
/* Sombra suave */
.shadow-soft {
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.1);
}

/* Sombra coloreada */
.shadow-colored {
  box-shadow: 0 10px 40px -10px rgba(102, 126, 234, 0.2);
}

/* Sombra elevada */
.shadow-elevated {
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
```

### Skeleton Loading
```jsx
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>
```

### Bordes Gradient
```css
.gradient-border {
  background: linear-gradient(white, white) padding-box,
              linear-gradient(to right, #a855f7, #2563eb) border-box;
  border: 2px solid transparent;
}
```

## 📱 RESPONSIVE DESIGN

### Breakpoints
- **Mobile**: < 640px (default)
- **Small (sm)**: ≥ 640px
- **Medium (md)**: ≥ 768px
- **Large (lg)**: ≥ 1024px
- **Extra Large (xl)**: ≥ 1280px

### Patrones Responsivos Comunes

#### Texto
```css
/* Mobile → Desktop */
text-xs sm:text-sm
text-sm sm:text-base
text-base sm:text-lg
text-lg sm:text-xl
text-xl sm:text-2xl
text-2xl sm:text-3xl
text-3xl sm:text-4xl
```

#### Espaciado
```css
/* Padding */
p-4 sm:p-6
p-6 sm:p-8
px-3 sm:px-4
py-2 sm:py-3

/* Margin */
mb-4 sm:mb-6
mt-4 sm:mt-8

/* Gap */
gap-2 sm:gap-4
gap-3 sm:gap-6
```

#### Grid
```css
/* Una columna en móvil, múltiples en desktop */
grid-cols-1 sm:grid-cols-2
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
```

#### Visibility
```css
/* Ocultar en móvil */
hidden sm:block
hidden sm:flex

/* Ocultar en desktop */
block sm:hidden
flex sm:hidden
```

### Mobile-First Classes
```css
/* Clase especial para móvil */
.mobile-full {
  width: 100%;
  margin: 0;
  border-radius: 0;
}

/* Ajustes para teclado móvil */
.mobile-input {
  font-size: 16px; /* Evita zoom en iOS */
  -webkit-appearance: none;
}
```

## 🔧 UTILIDADES CUSTOM

### Scrollbar Personalizado
```css
/* Scrollbar styling */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #a855f7, #2563eb);
  border-radius: 10px;
  border: 2px solid #f1f1f1;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #9333ea, #1d4ed8);
}
```

### Focus Visible
```css
/* Focus mejorado para accesibilidad */
.focus-visible:focus {
  outline: 2px solid #a855f7;
  outline-offset: 2px;
}

/* Remove focus en click */
.focus-visible:focus:not(:focus-visible) {
  outline: none;
}
```

### Truncate Multi-línea
```css
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

### Aspect Ratios
```css
.aspect-square { aspect-ratio: 1 / 1; }
.aspect-video { aspect-ratio: 16 / 9; }
.aspect-card { aspect-ratio: 3 / 4; }
```

## 🏗️ ESTRUCTURA DE COMPONENTES

### Layout Principal
```jsx
<div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
  {/* Header */}
  <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-gray-200">
    {/* Contenido header */}
  </header>

  {/* Main Content */}
  <main className="container mx-auto px-4 py-6 sm:py-8 max-w-5xl">
    {/* Contenido principal */}
  </main>

  {/* Floating Actions */}
  <div className="fixed bottom-4 right-4 z-50">
    {/* Botones flotantes */}
  </div>
</div>
```

### Card de Producto
```jsx
<div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all duration-300">
  {/* Header */}
  <div className="flex items-start justify-between mb-4">
    <div className="flex-1">
      <h3 className="text-base sm:text-lg font-semibold text-gray-800">{nombre}</h3>
      <p className="text-xs sm:text-sm text-gray-600">{codigo}</p>
    </div>
    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
      {categoria}
    </span>
  </div>

  {/* Contadores */}
  <div className="grid grid-cols-3 gap-2 mb-4">
    {/* Inputs de conteo */}
  </div>

  {/* Acciones */}
  <div className="flex gap-2">
    {/* Botones de acción */}
  </div>
</div>
```

## 🎯 ESTADOS INTERACTIVOS

### Estados de Componentes

#### Default
- Background: `bg-white`
- Border: `border-gray-200`
- Text: `text-gray-800`

#### Hover
- Background: `hover:bg-gray-50` o `hover:bg-purple-50`
- Border: `hover:border-purple-300`
- Shadow: `hover:shadow-lg`
- Transform: `hover:scale-105`

#### Focus
- Ring: `focus:ring-2 focus:ring-purple-400`
- Border: `focus:border-purple-400`
- Background: `focus:bg-white`

#### Active
- Transform: `active:scale-95`
- Background: Darker shade

#### Disabled
- Opacity: `disabled:opacity-50`
- Cursor: `disabled:cursor-not-allowed`
- Background: `disabled:bg-gray-100`
- Text: `disabled:text-gray-400`

### Estados de Formulario

#### Valid
- Border: `border-green-400`
- Background: `bg-green-50`
- Icon: `CheckCircle` verde

#### Invalid
- Border: `border-red-400`
- Background: `bg-red-50`
- Icon: `XCircle` rojo

#### Loading
- Opacity: `opacity-75`
- Cursor: `cursor-wait`
- Icon: `Loader2` con `animate-spin`

## 📊 Z-INDEX HIERARCHY

```css
z-0:  Base content
z-10: Elementos flotantes básicos
z-20: Dropdowns y tooltips
z-30: Progress bars sticky
z-40: Sidebars y drawers
z-50: Modales, overlays, headers sticky, toasts
```

## 🚀 OPTIMIZACIONES DE RENDIMIENTO

### Lazy Loading
- Componentes pesados con `React.lazy()`
- Imágenes con `loading="lazy"`

### Memoización
- Componentes con `React.memo()`
- Valores computados con `useMemo()`
- Callbacks con `useCallback()`

### CSS Optimizations
- Usar `will-change` para animaciones complejas
- GPU acceleration con `transform: translateZ(0)`
- Reducir repaints con `contain: layout style paint`

### Bundle Size
- Tree shaking de Tailwind CSS
- Purge de clases no utilizadas
- Import específico de iconos Lucide

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Setup Inicial
- [ ] Instalar Tailwind CSS v4.1.10
- [ ] Instalar Lucide React v0.515.0
- [ ] Configurar PostCSS y Autoprefixer
- [ ] Agregar colores custom al config
- [ ] Importar fuente del sistema

### Estilos Base
- [ ] Reset CSS y normalización
- [ ] Variables CSS para colores
- [ ] Clases de utilidad custom
- [ ] Animaciones keyframes
- [ ] Scrollbar personalizado

### Componentes
- [ ] Sistema de botones
- [ ] Inputs y formularios
- [ ] Cards y contenedores
- [ ] Modales y overlays
- [ ] Toast notifications
- [ ] Navigation components
- [ ] Loading states
- [ ] Empty states

### Responsive
- [ ] Mobile-first approach
- [ ] Breakpoints consistentes
- [ ] Touch-friendly interfaces
- [ ] Viewport meta tag
- [ ] Orientation handling

### Accesibilidad
- [ ] Contrast ratios WCAG AA
- [ ] Focus indicators
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Screen reader support

### Performance
- [ ] Lazy loading
- [ ] Code splitting
- [ ] Image optimization
- [ ] CSS minification
- [ ] Critical CSS inline

---

Esta guía contiene TODAS las especificaciones visuales y estéticas necesarias para replicar exactamente el diseño del sistema de inventario en cualquier otra aplicación.