import type { RegistroHistorico } from '../types/index';
import { authService } from '../services/auth';

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
    const locales = ['Chios', 'Simón Bolón', 'Santo Cachón'];
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

    // Función auxiliar para formatear números en HTML
    const formatNum = (num: number) => this.formatearNumeroParaExport(num);
    
    // Agrupar productos por categoría
    const productosPorCategoria = registro.productos.reduce((acc, producto) => {
      const categoria = producto.categoria || 'Sin categoría';
      if (!acc[categoria]) {
        acc[categoria] = [];
      }
      acc[categoria].push(producto);
      return acc;
    }, {} as Record<string, typeof registro.productos>);
    
    // Ordenar categorías alfabéticamente
    const categoriasOrdenadas = Object.keys(productosPorCategoria).sort();
    
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
          return `
            <h2>${categoria}</h2>
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
                ${productos.map(p => `
                  <tr class="${p.total === 0 ? 'zero-row' : ''}">
                    <td>${p.codigo || '-'}</td>
                    <td>${p.nombre}</td>
                    <td>${p.tipo || '-'}</td>
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

    // Abrir en nueva ventana
    const ventana = window.open('', '_blank');
    if (ventana) {
      ventana.document.write(html);
      ventana.document.close();
    }
  },

  exportarTodosCSV(registros: RegistroHistorico[]): void {
    if (registros.length === 0) return;

    // Crear contenido CSV con todos los registros
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
          p.unidad,
          p.unidadBodega,
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
      p.unidad,
      this.formatearNumeroParaExport(p.cantidadPedir),
      p.unidadBodega
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
    
    // Calcular estadísticas generales
    const totalProductos = registros.reduce((acc, r) => acc + r.productos.length, 0);
    const totalEnCero = registros.reduce((acc, r) => 
      acc + r.productos.filter(p => p.total === 0).length, 0
    );
    // const totalAPedir = registros.reduce((acc, r) => 
    //   acc + r.productos.filter(p => p.cantidadPedir > 0).length, 0
    // );

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
            grid-template-columns: repeat(3, 1fr);
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
          .session {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .session-header {
            background-color: #e8f4e8;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 10px;
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
            <div class="summary-value">${totalProductos}</div>
            <div class="summary-label">Total Productos</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${totalEnCero}</div>
            <div class="summary-label">Productos en Cero</div>
          </div>
        </div>

        ${registros.map(registro => `
          <div class="session">
            <h2>${registro.bodega} - ${registro.fecha}</h2>
            <div class="session-header">
              <strong>Usuario:</strong> ${registro.usuario} | 
              <strong>Hora:</strong> ${registro.hora} | 
              <strong>Duración:</strong> ${registro.duracion} | 
              <strong>Productos:</strong> ${registro.productosGuardados}/${registro.totalProductos}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th class="numeric">C1</th>
                  <th class="numeric">C2</th>
                  <th class="numeric">C3</th>
                  <th class="numeric">Total</th>
                  <th class="numeric">Pedir</th>
                  <th>Unidad</th>
                </tr>
              </thead>
              <tbody>
                ${registro.productos.map(p => `
                  <tr class="${p.total === 0 ? 'zero-row' : ''}">
                    <td>${p.nombre}</td>
                    <td>${p.tipo || '-'}</td>
                    <td class="numeric">${formatNum(p.c1)}</td>
                    <td class="numeric">${formatNum(p.c2)}</td>
                    <td class="numeric">${formatNum(p.c3)}</td>
                    <td class="numeric"><strong>${formatNum(p.total)}</strong></td>
                    <td class="numeric">${formatNum(p.cantidadPedir)}</td>
                    <td>${p.unidadBodega}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}

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
  }
};