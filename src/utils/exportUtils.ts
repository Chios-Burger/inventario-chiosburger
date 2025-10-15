import type { RegistroHistorico } from '../types/index';
import { authService } from '../services/auth';
import * as XLSX from 'xlsx';

export const exportUtils = {
  // Verificar si el usuario puede exportar en formato específico
  puedeExportarCSV(): boolean {
    const usuario = authService.getUsuarioActual();
    return usuario?.email === 'analisis@chiosburger.com';
  },

  puedeExportarExcel(): boolean {
    const usuario = authService.getUsuarioActual();
    return usuario?.email === 'analisis@chiosburger.com';
  },

  puedeExportarPDF(): boolean {
    // Todos los usuarios pueden exportar PDF
    return true;
  },

  // Determinar si una bodega es de tipo local (Chios, Simón, Santo, Cachón)
  esBodegaLocal(nombreBodega: string): boolean {
    const locales = ['Chios', 'Simón Bolón', 'Santo Cachón', 'Bodega Santo Chios'];
    return locales.some(local => nombreBodega.includes(local));
  },
  // Función auxiliar para formatear números con decimales precisos
  formatearNumeroParaExport(num: number): string {
    // Si el número tiene decimales, mostrar hasta 4 decimales significativos
    if (num % 1 !== 0) {
      const partes = num.toString().split('.');
      const decimales = partes[1]?.length || 0;
      return num.toFixed(Math.min(decimales, 4));
    }
    return num.toString();
  },

  exportarCSV(registro: RegistroHistorico): void {
    // Verificar permisos
    if (!this.puedeExportarCSV()) {
      alert('No tiene permisos para exportar en formato CSV');
      return;
    }

    const esLocal = this.esBodegaLocal(registro.bodega);
    let headers: string[];
    let rows: string[][];

    if (esLocal) {
      // Formato para locales (Chios, Simón, Santo, Cachón)
      headers = [
        'id',
        'fecha',
        'usuario',
        'código',
        'producto',
        'cantidad',
        'total',
        'uni_local',
        'canti_pedir',
        'uni_bodega'
      ];

      rows = registro.productos.map((p, index) => [
        (index + 1).toString(),
        registro.fecha,
        registro.usuario,
        p.codigo || '',
        p.nombre,
        this.formatearNumeroParaExport(p.total), // cantidad es el total
        this.formatearNumeroParaExport(p.total), // total
        p.unidad,
        this.formatearNumeroParaExport(p.cantidadPedir),
        p.unidadBodega
      ]);
    } else {
      // Formato para bodegas (Planta, Materia Prima, Bodega Pulmón, Bodega)
      headers = [
        'id',
        'código',
        'producto',
        'fecha',
        'usuario',
        'cantidades',
        'total',
        'unidad'
      ];

      rows = registro.productos.map((p, index) => [
        (index + 1).toString(),
        p.codigo || '',
        p.nombre,
        registro.fecha,
        registro.usuario,
        `${this.formatearNumeroParaExport(p.c1)}, ${this.formatearNumeroParaExport(p.c2)}, ${this.formatearNumeroParaExport(p.c3)}`,
        this.formatearNumeroParaExport(p.total),
        p.unidad
      ]);
    }

    // Usar coma como separador para CSV estándar
    const csvContent = [
      headers,
      ...rows
    ].map(row => row.map(cell => {
      // Escapar comillas dobles y envolver en comillas si contiene coma
      const cellStr = cell.toString().replace(/"/g, '""');
      return cellStr.includes(',') || cellStr.includes('\n') 
        ? `"${cellStr}"` 
        : cellStr;
    }).join(',')).join('\n');

    // Crear blob y descargar
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventario_${registro.bodega.replace(/\s+/g, '_')}_${registro.fecha.replace(/\//g, '-')}_${registro.hora.replace(/:/g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  async exportarPDF(registro: RegistroHistorico): Promise<void> {
    // Verificar permisos (todos pueden exportar PDF)
    if (!this.puedeExportarPDF()) {
      alert('No tiene permisos para exportar en formato PDF');
      return;
    }

    // Debug: ver qué datos llegan
    console.log('📄 Exportando PDF para registro:', registro);
    console.log('📦 Productos:', registro.productos);
    if (registro.productos.length > 0) {
      console.log('🏷️ Ejemplo de producto:', registro.productos[0]);
      console.log('📂 Categorías encontradas:', [...new Set(registro.productos.map(p => p.categoria || 'Sin categoría'))]);
      console.log('🏷️ Tipos encontrados:', [...new Set(registro.productos.map(p => p.tipo || 'Sin tipo'))]);
    }

    // Función auxiliar para formatear números en HTML
    const formatNum = (num: number) => this.formatearNumeroParaExport(num);
    
    // Agrupar productos por categoría
    const productosPorCategoria = registro.productos.reduce((acc, producto) => {
      const categoria = producto.categoria || 'Sin categoría';
      console.log(`📦 Producto: ${producto.nombre}, Categoría: ${categoria}, Tipo: ${producto.tipo || 'Sin tipo'}`);
      if (!acc[categoria]) {
        acc[categoria] = [];
      }
      acc[categoria].push(producto);
      return acc;
    }, {} as Record<string, typeof registro.productos>);
    
    console.log('🗂️ Productos agrupados por categoría:', Object.keys(productosPorCategoria));
    console.log('📊 Detalle de agrupación:', productosPorCategoria);
    
    // Ordenar categorías alfabéticamente
    const categoriasOrdenadas = Object.keys(productosPorCategoria).sort();
    
    // Calcular subtotales por categoría
    const subtotalesPorCategoria = categoriasOrdenadas.reduce((acc, categoria) => {
      const productos = productosPorCategoria[categoria];
      acc[categoria] = {
        totalProductos: productos.length,
        productosEnCero: productos.filter(p => p.total === 0).length,
        productosPorTipo: productos.reduce((tipos, p) => {
          const tipo = p.tipo || 'Sin tipo';
          tipos[tipo] = (tipos[tipo] || 0) + 1;
          return tipos;
        }, {} as Record<string, number>)
      };
      return acc;
    }, {} as Record<string, any>);
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Inventario ${registro.bodega} - ${registro.fecha}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
            font-size: 14px;
          }
          .header {
            background-color: #f0f0f0;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          h1 {
            color: #6B46C1;
            margin: 0 0 10px 0;
            font-size: 24px;
          }
          h2 {
            color: #6B46C1;
            margin: 20px 0 10px 0;
            font-size: 18px;
            border-bottom: 2px solid #6B46C1;
            padding-bottom: 5px;
          }
          .info {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 20px;
          }
          .info-item {
            padding: 8px;
            background-color: #f9f9f9;
            border-radius: 4px;
            font-size: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 20px;
            font-size: 12px;
          }
          th {
            background-color: #6B46C1;
            color: white;
            padding: 8px;
            text-align: left;
            font-weight: bold;
            white-space: nowrap;
          }
          th.numeric, td.numeric {
            text-align: right;
          }
          td {
            padding: 6px 8px;
            border-bottom: 1px solid #ddd;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          tr:hover {
            background-color: #f0f0f0;
          }
          .zero-row {
            background-color: #ffe8e8 !important;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 11px;
          }
          .stats {
            margin-top: 20px;
            padding: 15px;
            background-color: #f5f5f5;
            border-radius: 8px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 10px;
          }
          .stat-item {
            text-align: center;
            padding: 10px;
            background-color: white;
            border-radius: 4px;
          }
          .stat-value {
            font-size: 20px;
            font-weight: bold;
            color: #6B46C1;
          }
          .stat-label {
            font-size: 11px;
            color: #666;
          }
          .category-summary {
            background-color: #f0f0f0;
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
            font-size: 12px;
          }
          .category-summary span {
            margin-right: 15px;
          }
          .tipo-badge {
            display: inline-block;
            padding: 2px 6px;
            margin: 0 2px;
            background-color: #e0e0e0;
            border-radius: 3px;
            font-size: 11px;
          }
          .tipo-a { background-color: #e3f2fd; color: #1976d2; }
          .tipo-b { background-color: #e8f5e9; color: #388e3c; }
          .tipo-c { background-color: #fff3e0; color: #f57c00; }
          @media print {
            body {
              margin: 10px;
            }
            .no-print {
              display: none;
            }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            h2 { page-break-after: avoid; }
            .category-summary { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Inventario ${registro.bodega}</h1>
          <div class="info">
            <div class="info-item"><strong>Fecha:</strong> ${registro.fecha}</div>
            <div class="info-item"><strong>Hora:</strong> ${registro.hora}</div>
            <div class="info-item"><strong>Usuario:</strong> ${registro.usuario}</div>
            <div class="info-item"><strong>Duración:</strong> ${registro.duracion}</div>
            <div class="info-item"><strong>Productos guardados:</strong> ${registro.productosGuardados} de ${registro.totalProductos}</div>
            <div class="info-item"><strong>Completitud:</strong> ${Math.round((registro.productosGuardados / registro.totalProductos) * 100)}%</div>
          </div>
        </div>

        ${categoriasOrdenadas.map(categoria => {
          const productos = productosPorCategoria[categoria];
          const subtotal = subtotalesPorCategoria[categoria];
          
          // Ordenar productos dentro de cada categoría por tipo (A, B, C) y luego por nombre
          const productosOrdenados = [...productos].sort((a, b) => {
            // Primero ordenar por tipo
            const tipoA = a.tipo || 'Z'; // Los sin tipo van al final
            const tipoB = b.tipo || 'Z';
            if (tipoA !== tipoB) {
              return tipoA.localeCompare(tipoB);
            }
            // Luego por nombre
            return a.nombre.localeCompare(b.nombre);
          });
          
          return `
            <h2>${categoria}</h2>
            <div class="category-summary">
              <span><strong>Total productos:</strong> ${subtotal.totalProductos}</span>
              <span><strong>En cero:</strong> ${subtotal.productosEnCero}</span>
              <span><strong>Por tipo:</strong> 
                ${Object.entries(subtotal.productosPorTipo)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([tipo, cantidad]) => 
                    `<span class="tipo-badge tipo-${tipo.toLowerCase()}">${tipo}: ${cantidad}</span>`
                  ).join(' ')}
              </span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th class="numeric">C1</th>
                  <th class="numeric">C2</th>
                  <th class="numeric">C3</th>
                  <th class="numeric">Total</th>
                  <th>Unidad Local</th>
                  <th class="numeric">Cantidad a Pedir</th>
                  <th>Unidad Bodega</th>
                </tr>
              </thead>
              <tbody>
                ${productosOrdenados.map(p => `
                  <tr class="${p.total === 0 ? 'zero-row' : ''}">
                    <td>${p.codigo || '-'}</td>
                    <td>${p.nombre}</td>
                    <td><span class="tipo-badge tipo-${(p.tipo || 'sin-tipo').toLowerCase()}">${p.tipo || '-'}</span></td>
                    <td class="numeric">${formatNum(p.c1)}</td>
                    <td class="numeric">${formatNum(p.c2)}</td>
                    <td class="numeric">${formatNum(p.c3)}</td>
                    <td class="numeric"><strong>${formatNum(p.total)}</strong></td>
                    <td>${p.unidad}</td>
                    <td class="numeric">${formatNum(p.cantidadPedir)}</td>
                    <td>${p.unidadBodega}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
        }).join('')}

        <div class="stats">
          <h3>Resumen Estadístico</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">${registro.productos.length}</div>
              <div class="stat-label">Total Productos</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${registro.productos.filter(p => p.total === 0).length}</div>
              <div class="stat-label">Productos en Cero</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${registro.productos.filter(p => p.cantidadPedir > 0).length}</div>
              <div class="stat-label">Productos a Pedir</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Generado el ${new Date().toLocaleString('es-EC')}</p>
          <p>Sistema de Inventario ChiosBurger</p>
        </div>

        <script>
          // Auto imprimir
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    // Debug: ver el HTML generado (primeros 1000 caracteres)
    console.log('📄 HTML generado (preview):', html.substring(0, 1000));
    console.log('📄 Categorías en el HTML:', categoriasOrdenadas);
    
    // Abrir en nueva ventana
    const ventana = window.open('', '_blank');
    if (ventana) {
      ventana.document.write(html);
      ventana.document.close();
    } else {
      console.error('❌ No se pudo abrir la ventana del PDF');
    }
  },

  exportarTodosCSV(registros: RegistroHistorico[]): void {
    if (registros.length === 0) return;

    // Crear contenido CSV con todos los registros - FORMATO ORIGINAL
    const headers = [
      'Fecha',
      'Hora',
      'Bodega',
      'Usuario',
      'Código',
      'Producto',
      'Categoría',
      'Tipo',
      'Conteo 1',
      'Conteo 2',
      'Conteo 3',
      'Total',
      'Cantidad a Pedir',
      'Unidad',
      'Unidad Bodega',
      'Equivalencias'
    ];

    const rows: string[][] = [];

    // Agregar resumen al inicio
    const totalProductos = registros.reduce((acc, r) => acc + r.productos.length, 0);
    const totalEnCero = registros.reduce((acc, r) => 
      acc + r.productos.filter(p => p.total === 0).length, 0
    );

    rows.push([`Total de sesiones: ${registros.length}`]);
    rows.push([`Total de productos: ${totalProductos}`]);
    rows.push([`Productos en cero: ${totalEnCero}`]);
    rows.push([`Fecha de exportación: ${new Date().toLocaleString('es-EC')}`]);
    rows.push([]); // Línea vacía

    registros.forEach(registro => {
      registro.productos.forEach(p => {
        rows.push([
          registro.fecha,
          registro.hora,
          registro.bodega,
          registro.usuario,
          p.codigo || '',
          p.nombre,
          p.categoria || 'Sin categoría',
          p.tipo || 'Sin tipo',
          this.formatearNumeroParaExport(p.c1),
          this.formatearNumeroParaExport(p.c2),
          this.formatearNumeroParaExport(p.c3),
          this.formatearNumeroParaExport(p.total),
          this.formatearNumeroParaExport(p.cantidadPedir),
          p.unidadBodega,
          p.unidad,
          p.equivalencia || ''
        ]);
      });
    });

    // Usar punto y coma como separador
    const csvContent = [
      headers,
      ...rows
    ].map(row => row.map(cell => {
      const cellStr = cell.toString().replace(/"/g, '""');
      return cellStr.includes(';') || cellStr.includes(',') || cellStr.includes('\n') 
        ? `"${cellStr}"` 
        : cellStr;
    }).join(';')).join('\n');

    // Crear blob y descargar
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historico_inventarios_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Exportar todos a Excel - FORMATO ORIGINAL
  exportarTodosExcel(registros: RegistroHistorico[]): void {
    if (registros.length === 0) return;

    // Usar el mismo formato que CSV pero exportar como XLS
    const headers = [
      'Fecha',
      'Hora',
      'Bodega',
      'Usuario',
      'Código',
      'Producto',
      'Categoría',
      'Tipo',
      'Conteo 1',
      'Conteo 2',
      'Conteo 3',
      'Total',
      'Cantidad a Pedir',
      'Unidad',
      'Unidad Bodega',
      'Equivalencias'
    ];

    const rows: string[][] = [];

    // Agregar resumen al inicio
    const totalProductos = registros.reduce((acc, r) => acc + r.productos.length, 0);
    const totalEnCero = registros.reduce((acc, r) => 
      acc + r.productos.filter(p => p.total === 0).length, 0
    );

    rows.push([`Total de sesiones: ${registros.length}`]);
    rows.push([`Total de productos: ${totalProductos}`]);
    rows.push([`Productos en cero: ${totalEnCero}`]);
    rows.push([`Fecha de exportación: ${new Date().toLocaleString('es-EC')}`]);
    rows.push([]); // Línea vacía

    registros.forEach(registro => {
      registro.productos.forEach(p => {
        rows.push([
          registro.fecha,
          registro.hora,
          registro.bodega,
          registro.usuario,
          p.codigo || '',
          p.nombre,
          p.categoria || 'Sin categoría',
          p.tipo || 'Sin tipo',
          this.formatearNumeroParaExport(p.c1),
          this.formatearNumeroParaExport(p.c2),
          this.formatearNumeroParaExport(p.c3),
          this.formatearNumeroParaExport(p.total),
          this.formatearNumeroParaExport(p.cantidadPedir),
          p.unidadBodega,
          p.unidad,
          p.equivalencia || ''
        ]);
      });
    });

    // Usar punto y coma como separador
    const csvContent = [
      headers,
      ...rows
    ].map(row => row.map(cell => {
      const cellStr = cell.toString().replace(/"/g, '""');
      return cellStr.includes(';') || cellStr.includes(',') || cellStr.includes('\n') 
        ? `"${cellStr}"` 
        : cellStr;
    }).join(';')).join('\n');

    // Crear blob y descargar como .xls
    const blob = new Blob(['\ufeff' + csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historico_inventarios_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Exportar a Excel (formato específico para usuario análisis)
  exportarExcel(registro: RegistroHistorico): void {
    // Verificar permisos
    if (!this.puedeExportarExcel()) {
      alert('No tiene permisos para exportar en formato Excel');
      return;
    }

    // Formato único para todas las bodegas en Excel
    const headers = [
      'Id',
      'fecha',
      'usuario',
      'código',
      'producto',
      'cantidades',
      'total',
      'unidad_local',
      'cantidad_pedir',
      'unidad_bodega'
    ];

    const rows = registro.productos.map((p, index) => [
      (index + 1).toString(),
      registro.fecha,
      registro.usuario,
      p.codigo || '',
      p.nombre,
      `${this.formatearNumeroParaExport(p.c1)}, ${this.formatearNumeroParaExport(p.c2)}, ${this.formatearNumeroParaExport(p.c3)}`,
      this.formatearNumeroParaExport(p.total),
      p.unidadBodega,
      this.formatearNumeroParaExport(p.cantidadPedir),
      p.unidad
    ]);

    // Usar punto y coma como separador para mejor compatibilidad con Excel
    const csvContent = [
      headers,
      ...rows
    ].map(row => row.map(cell => {
      const cellStr = cell.toString().replace(/"/g, '""');
      return cellStr.includes(';') || cellStr.includes(',') || cellStr.includes('\n') 
        ? `"${cellStr}"` 
        : cellStr;
    }).join(';')).join('\n');

    // Crear blob y descargar con extensión .xlsx
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventario_${registro.bodega.replace(/\s+/g, '_')}_${registro.fecha.replace(/\//g, '-')}_${registro.hora.replace(/:/g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  async exportarTodosPDF(registros: RegistroHistorico[]): Promise<void> {
    if (registros.length === 0) return;

    // Función auxiliar para formatear números en HTML
    const formatNum = (num: number) => this.formatearNumeroParaExport(num);
    
    // Obtener todas las fechas únicas ordenadas
    const fechasUnicas = [...new Set(registros.map(r => r.fecha))].sort();
    
    // Agrupar productos primero por bodega y luego por categoría
    const bodegas = new Map<string, Map<string, Map<string, any>>>();
    
    registros.forEach(registro => {
      const bodegaNombre = registro.bodega;
      
      // Si no existe la bodega, crearla
      if (!bodegas.has(bodegaNombre)) {
        bodegas.set(bodegaNombre, new Map());
      }
      
      const categoriasDeBodega = bodegas.get(bodegaNombre)!;
      
      registro.productos.forEach(producto => {
        const categoria = producto.categoria || 'Sin categoría';
        
        // Si no existe la categoría en esta bodega, crearla
        if (!categoriasDeBodega.has(categoria)) {
          categoriasDeBodega.set(categoria, new Map());
        }
        
        const productosDeCategoria = categoriasDeBodega.get(categoria)!;
        const key = `${producto.codigo || 'SIN-CODIGO'}_${producto.nombre}`;
        
        if (!productosDeCategoria.has(key)) {
          productosDeCategoria.set(key, {
            codigo: producto.codigo || '',
            nombre: producto.nombre,
            datos: {}
          });
        }
        
        // Guardar datos para esta fecha
        productosDeCategoria.get(key).datos[registro.fecha] = {
          conteo: formatNum(producto.total),
          unidad: producto.unidad,
          cantidadPedir: formatNum(producto.cantidadPedir),
          unidadBodega: producto.unidadBodega
        };
      });
    });
    
    // Calcular estadísticas generales
    const totalEnCero = registros.reduce((acc, r) => 
      acc + r.productos.filter(p => p.total === 0).length, 0
    );

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Histórico de Inventarios - ChiosBurger</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
            font-size: 12px;
          }
          .header {
            background-color: #f0f0f0;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
          }
          h1 {
            color: #6B46C1;
            margin: 0 0 10px 0;
            font-size: 24px;
          }
          h2 {
            color: #6B46C1;
            margin: 20px 0 10px 0;
            font-size: 18px;
            border-bottom: 2px solid #6B46C1;
            padding-bottom: 5px;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin: 20px 0;
          }
          .summary-item {
            text-align: center;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 4px;
          }
          .summary-value {
            font-size: 24px;
            font-weight: bold;
            color: #6B46C1;
          }
          .summary-label {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
          }
          .categoria-section {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }
          .categoria-header {
            background-color: #e8f4e8;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: bold;
            color: #2d5016;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11px;
          }
          th {
            background-color: #6B46C1;
            color: white;
            padding: 6px;
            text-align: left;
            font-weight: bold;
            white-space: nowrap;
          }
          th.numeric, td.numeric {
            text-align: right;
          }
          td {
            padding: 4px 6px;
            border-bottom: 1px solid #ddd;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .zero-row {
            background-color: #ffe8e8 !important;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 10px;
          }
          @media print {
            body {
              margin: 10px;
            }
            .session {
              page-break-inside: avoid;
            }
            h2 {
              page-break-before: always;
            }
            h2:first-of-type {
              page-break-before: auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Histórico de Inventarios</h1>
          <p>Sistema de Inventario ChiosBurger</p>
        </div>

        <div class="summary">
          <div class="summary-item">
            <div class="summary-value">${registros.length}</div>
            <div class="summary-label">Total Sesiones</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${bodegas.size}</div>
            <div class="summary-label">Total Bodegas</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${Array.from(bodegas.values()).reduce((total, categorias) => total + categorias.size, 0)}</div>
            <div class="summary-label">Total Categorías</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${totalEnCero}</div>
            <div class="summary-label">Productos en Cero</div>
          </div>
        </div>
        
        <p style="margin: 20px 0; font-weight: bold;">
          Rango de fechas: ${fechasUnicas[0]} - ${fechasUnicas[fechasUnicas.length - 1]}
        </p>

        ${Array.from(bodegas.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([bodega, categorias]) => {
          return `
          <h2 style="color: #059669; margin-top: 40px; background-color: #d1fae5; padding: 15px; border-radius: 8px;">
            Bodega: ${bodega}
          </h2>
          
          ${Array.from(categorias.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([categoria, productos]) => {
            // Convertir productos a array y ordenar
            const productosArray = Array.from(productos.values()).sort((a, b) => {
              const codigoA = a.codigo || a.nombre;
              const codigoB = b.codigo || b.nombre;
              return codigoA.localeCompare(codigoB);
            });
            
            return `
            <div class="categoria-section">
              <div class="categoria-header">
                ${categoria} (${productosArray.length} productos)
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    ${fechasUnicas.map(fecha => `<th class="numeric">${fecha}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${productosArray.map(producto => {
                    const filaClass = Object.values(producto.datos).some((d: any) => d.conteo === '0') ? 'zero-row' : '';
                    return `
                    <tr class="${filaClass}">
                      <td>${producto.codigo}</td>
                      <td>${producto.nombre}</td>
                      ${fechasUnicas.map(fecha => {
                        const datos = producto.datos[fecha];
                        if (datos) {
                          return `<td class="numeric">${datos.conteo} ${datos.unidad}<br><small style="color: #666;">${datos.cantidadPedir} ${datos.unidadBodega}</small></td>`;
                        } else {
                          return '<td class="numeric">-</td>';
                        }
                      }).join('')}
                    </tr>
                  `}).join('')}
                </tbody>
              </table>
            </div>
          `}).join('')}
        `}).join('')}

        <div class="footer">
          <p>Generado el ${new Date().toLocaleString('es-EC')}</p>
          <p>Total de ${registros.length} sesiones exportadas</p>
        </div>

        <script>
          // Auto imprimir
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    // Abrir en nueva ventana
    const ventana = window.open('', '_blank');
    if (ventana) {
      ventana.document.write(html);
      ventana.document.close();
    }
  },

  // Exportar pedidos del día a Excel
  exportarPedidosExcel(pedidos: any[], fecha: string): void {
    if (pedidos.length === 0) {
      alert('No hay pedidos para exportar');
      return;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(pedidos);

    // Ajustar ancho de columnas
    const columnWidths = [
      { wch: 12 }, // Código
      { wch: 30 }, // Producto
      { wch: 20 }, // Categoría
      { wch: 10 }, // Tipo
      { wch: 10 }, // Unidad
      { wch: 12 }, // Total Pedido
      { wch: 10 }, // Estado
    ];

    // Agregar anchos para cada bodega
    const numBodegas = Object.keys(pedidos[0]).filter(key => 
      !['Código', 'Producto', 'Categoría', 'Tipo', 'Unidad', 'Total Pedido', 'Estado'].includes(key)
    ).length;
    
    for (let i = 0; i < numBodegas; i++) {
      columnWidths.push({ wch: 15 });
    }

    ws['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Pedidos del Día');

    // Crear resumen por categoría
    const resumenPorCategoria = pedidos.reduce((acc: any, pedido) => {
      const categoria = pedido['Categoría'] || 'Sin categoría';
      if (!acc[categoria]) {
        acc[categoria] = {
          'Categoría': categoria,
          'Cantidad de Productos': 0,
          'Total Unidades': 0
        };
      }
      acc[categoria]['Cantidad de Productos']++;
      acc[categoria]['Total Unidades'] += pedido['Total Pedido'];
      return acc;
    }, {});

    const resumenData = Object.values(resumenPorCategoria);
    const wsResumen = XLSX.utils.json_to_sheet(resumenData);
    wsResumen['!cols'] = [
      { wch: 25 }, // Categoría
      { wch: 20 }, // Cantidad de Productos
      { wch: 15 }  // Total Unidades
    ];
    
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen por Categoría');

    // Descargar archivo
    const fechaFormato = fecha.split('-').reverse().join('-');
    XLSX.writeFile(wb, `pedidos_del_dia_${fechaFormato}.xlsx`);
  },

  // Exportar pedidos del día a PDF
  exportarPedidosPDF(pedidos: any[], fecha: string, bodegasLocales: any[], bodegaFiltrada: any | null): void {
    const [year, month, day] = fecha.split('-');
    const fechaFormato = `${day}/${month}/${year}`;
    
    const formatNum = (num: number): string => {
      if (num % 1 !== 0) {
        const partes = num.toString().split('.');
        const decimales = partes[1]?.length || 0;
        return num.toFixed(Math.min(decimales, 4));
      }
      return num.toString();
    };

    // Agrupar por categoría para el resumen
    const pedidosPorCategoria: { [key: string]: any[] } = {};
    pedidos.forEach(pedido => {
      const categoria = pedido.categoria || 'Sin categoría';
      if (!pedidosPorCategoria[categoria]) {
        pedidosPorCategoria[categoria] = [];
      }
      pedidosPorCategoria[categoria].push(pedido);
    });

    // Título según el filtro
    const titulo = bodegaFiltrada 
      ? `Pedidos del Día - ${bodegaFiltrada.nombre}`
      : 'Pedidos del Día - Todos los Locales';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Pedidos del Día - ${fechaFormato}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
      padding: 20px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #333;
    }
    
    .header h1 {
      font-size: 24px;
      margin-bottom: 5px;
      color: #333;
    }
    
    .header h2 {
      font-size: 18px;
      color: #666;
      font-weight: normal;
    }
    
    .info {
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .info-item {
      font-size: 13px;
    }
    
    .resumen {
      margin-bottom: 20px;
      padding: 10px;
      background: #f5f5f5;
      border-radius: 5px;
    }
    
    .resumen h3 {
      font-size: 14px;
      margin-bottom: 10px;
      color: #333;
    }
    
    .resumen-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    
    .resumen-item {
      background: white;
      padding: 8px;
      border-radius: 3px;
      text-align: center;
    }
    
    .resumen-item .label {
      font-size: 11px;
      color: #666;
    }
    
    .resumen-item .value {
      font-size: 18px;
      font-weight: bold;
      color: #333;
      margin-top: 2px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      background: white;
    }
    
    th {
      background: #f0f0f0;
      padding: 8px;
      text-align: left;
      font-weight: bold;
      font-size: 11px;
      border: 1px solid #ddd;
    }
    
    td {
      padding: 6px;
      border: 1px solid #ddd;
      font-size: 11px;
    }
    
    .categoria-header {
      background: #e0e0e0;
      font-weight: bold;
      font-size: 13px;
    }
    
    .text-center {
      text-align: center;
    }
    
    .text-right {
      text-align: right;
    }
    
    .total-pedido {
      font-weight: bold;
      color: #6b46c1;
    }
    
    .estado-pendiente {
      color: #d97706;
      font-weight: bold;
    }
    
    .estado-preparado {
      color: #059669;
      font-weight: bold;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      font-size: 10px;
      color: #666;
      text-align: center;
    }
    
    @media print {
      body {
        padding: 10px;
      }
      
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>ChiosBurger - Sistema de Inventario</h1>
    <h2>${titulo}</h2>
  </div>
  
  <div class="info">
    <div class="info-item">
      <strong>Fecha:</strong> ${fechaFormato}
    </div>
    <div class="info-item">
      <strong>Hora de generación:</strong> ${new Date().toLocaleTimeString('es-EC')}
    </div>
  </div>
  
  <div class="resumen">
    <h3>Resumen de Pedidos</h3>
    <div class="resumen-grid">
      <div class="resumen-item">
        <div class="label">Total Productos</div>
        <div class="value">${pedidos.length}</div>
      </div>
      <div class="resumen-item">
        <div class="label">Pendientes</div>
        <div class="value">${pedidos.filter(p => p.estado !== 'preparado').length}</div>
      </div>
      <div class="resumen-item">
        <div class="label">Preparados</div>
        <div class="value">${pedidos.filter(p => p.estado === 'preparado').length}</div>
      </div>
    </div>
  </div>
  
  ${Object.entries(pedidosPorCategoria)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([categoria, productos]) => `
      <table>
        <thead>
          <tr>
            <th colspan="${bodegaFiltrada ? 6 : (4 + bodegasLocales.length * 2)}" class="categoria-header">
              ${categoria} (${productos.length} productos)
            </th>
          </tr>
          <tr>
            <th>Código</th>
            <th>Producto</th>
            ${bodegaFiltrada ? `
              <th class="text-center">Cantidad</th>
              <th class="text-center">Movimiento</th>
            ` : bodegasLocales.map(bodega => `
              <th class="text-center">${bodega.nombre.replace('Chios ', '').replace('Santo ', '').replace('Simón ', '')}</th>
              <th class="text-center">Mov.</th>
            `).join('')}
            <th class="text-center">Total</th>
            <th class="text-center">Estado</th>
          </tr>
        </thead>
        <tbody>
          ${productos
            .sort((a, b) => a.nombre.localeCompare(b.nombre))
            .map(pedido => `
              <tr>
                <td>${pedido.codigo}</td>
                <td>${pedido.nombre}</td>
                ${bodegaFiltrada ? `
                  <td class="text-center">${pedido.pedidosPorBodega[bodegaFiltrada.id] || '-'}</td>
                  <td class="text-center">${pedido.movimientosPorBodega?.[bodegaFiltrada.id] || '-'}</td>
                ` : bodegasLocales.map(bodega => `
                  <td class="text-center">${pedido.pedidosPorBodega[bodega.id] || '-'}</td>
                  <td class="text-center">${pedido.movimientosPorBodega?.[bodega.id] || '-'}</td>
                `).join('')}
                <td class="text-center total-pedido">${formatNum(pedido.totalPedido)} ${pedido.unidad}</td>
                <td class="text-center ${pedido.estado === 'preparado' ? 'estado-preparado' : 'estado-pendiente'}">
                  ${pedido.estado === 'preparado' ? 'Preparado' : 'Pendiente'}
                </td>
              </tr>
            `).join('')}
        </tbody>
      </table>
    `).join('')}
  
  <div class="footer">
    <p>Documento generado por el Sistema de Inventario ChiosBurger</p>
    <p>Este documento es para uso interno</p>
  </div>
</body>
</html>
    `;

    const ventana = window.open('', '_blank');
    if (ventana) {
      ventana.document.write(html);
      ventana.document.close();
      
      // Esperar un momento antes de abrir el diálogo de impresión
      setTimeout(() => {
        ventana.print();
      }, 500);
    }
  }
};