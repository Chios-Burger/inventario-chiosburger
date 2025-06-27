import type { RegistroHistorico } from '../types/index';

export const exportUtils = {
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
    // Crear contenido CSV con separador de punto y coma para mejor compatibilidad con Excel
    const headers = [
      'Producto',
      'Categoría',
      'Conteo 1',
      'Conteo 2',
      'Conteo 3',
      'Total',
      'Cantidad a Pedir',
      'Unidad',
      'Unidad Bodega',
      'Equivalencias'
    ];

    const rows = registro.productos.map(p => [
      p.nombre,
      p.categoria || '',
      this.formatearNumeroParaExport(p.c1),
      this.formatearNumeroParaExport(p.c2),
      this.formatearNumeroParaExport(p.c3),
      this.formatearNumeroParaExport(p.total),
      this.formatearNumeroParaExport(p.cantidadPedir),
      p.unidad,
      p.unidadBodega,
      p.equivalencia || ''
    ]);

    // Agregar totales al final
    const totalGeneral = registro.productos.reduce((acc, p) => acc + p.total, 0);
    const totalCantidadPedir = registro.productos.reduce((acc, p) => acc + p.cantidadPedir, 0);
    
    rows.push(['', '', '', '', '', '', '', '', '', '']); // Línea vacía
    rows.push([
      'TOTALES',
      '',
      '',
      '',
      '',
      this.formatearNumeroParaExport(totalGeneral),
      this.formatearNumeroParaExport(totalCantidadPedir),
      '',
      '',
      ''
    ]);

    // Agregar información del inventario al inicio
    const info = [
      [`Inventario: ${registro.bodega}`],
      [`Fecha: ${registro.fecha}`],
      [`Hora: ${registro.hora}`],
      [`Usuario: ${registro.usuario}`],
      [`Productos guardados: ${registro.productosGuardados} de ${registro.totalProductos}`],
      [`Duración: ${registro.duracion}`],
      [`Productos en cero: ${registro.productos.filter(p => p.total === 0).length}`],
      [''], // Línea vacía
      headers
    ];

    // Usar punto y coma como separador para mejor compatibilidad con Excel
    const csvContent = [
      ...info,
      ...rows
    ].map(row => row.map(cell => {
      // Escapar comillas dobles y envolver en comillas si contiene punto y coma
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
    link.download = `inventario_${registro.bodega.replace(/\s+/g, '_')}_${registro.fecha.replace(/\//g, '-')}_${registro.hora.replace(/:/g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  async exportarPDF(registro: RegistroHistorico): Promise<void> {
    // Función auxiliar para formatear números en HTML
    const formatNum = (num: number) => this.formatearNumeroParaExport(num);
    
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
            margin-top: 20px;
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
          .totals-row {
            background-color: #e8f4e8 !important;
            font-weight: bold;
            border-top: 2px solid #333;
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

        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th class="numeric">C1</th>
              <th class="numeric">C2</th>
              <th class="numeric">C3</th>
              <th class="numeric">Total</th>
              <th class="numeric">Pedir</th>
              <th>Unidad</th>
              <th>Equivalencias</th>
            </tr>
          </thead>
          <tbody>
            ${registro.productos.map(p => `
              <tr class="${p.total === 0 ? 'zero-row' : ''}">
                <td>${p.nombre}</td>
                <td>${p.categoria || '-'}</td>
                <td class="numeric">${formatNum(p.c1)}</td>
                <td class="numeric">${formatNum(p.c2)}</td>
                <td class="numeric">${formatNum(p.c3)}</td>
                <td class="numeric"><strong>${formatNum(p.total)}</strong></td>
                <td class="numeric">${formatNum(p.cantidadPedir)}</td>
                <td>${p.unidadBodega}</td>
                <td>${p.equivalencia || '-'}</td>
              </tr>
            `).join('')}
            <tr class="totals-row">
              <td colspan="5" style="text-align: right;">TOTAL GENERAL:</td>
              <td class="numeric">${formatNum(registro.productos.reduce((acc, p) => acc + p.total, 0))}</td>
              <td class="numeric">${formatNum(registro.productos.reduce((acc, p) => acc + p.cantidadPedir, 0))}</td>
              <td colspan="2"></td>
            </tr>
          </tbody>
        </table>

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
      'Producto',
      'Categoría',
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
          p.nombre,
          p.categoria || '',
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

  // Función adicional para exportar a Excel (usando CSV con formato específico)
  exportarExcel(registro: RegistroHistorico): void {
    // Excel reconoce mejor los archivos CSV con extensión .csv y separador de punto y coma
    this.exportarCSV(registro);
  }
};