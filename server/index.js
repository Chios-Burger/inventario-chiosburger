import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://inventario-chiosburger.netlify.app',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:4173',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Permitir requests sin origin (ej: Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Origen bloqueado por CORS:', origin);
      callback(null, true); // Temporalmente permitir todos los orígenes
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

// Manejar preflight requests
app.options('*', cors());

app.use(express.json());

// Configuración de PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: {
    rejectUnauthorized: false
  }
});

// Mapeo de bodegas a tablas
const TABLA_POR_BODEGA = {
  '1': 'toma_bodega',
  '2': 'toma_materiaprima',
  '3': 'toma_planta',
  '4': 'tomasFisicas',
  '5': 'tomasFisicas',
  '6': 'tomasFisicas',
  '7': 'toma_simon_bolon',
  '8': 'toma_santo_cachon',
  '9': 'toma_bodegapulmon'
};

// Nombres de locales para Chios
const NOMBRE_LOCAL_CHIOS = {
  4: 'Real Audiencia',
  5: 'Floreana',
  6: 'Portugal'
};

// Función para generar ID único
function generarId(productoId) {
  // Si el ID ya viene con formato completo del frontend, usarlo directamente
  if (productoId && productoId.length > 30) {
    // Truncar a 50 caracteres para evitar el error de varchar(50)
    return productoId.substring(0, 50);
  }
  
  // Si no, generar uno nuevo con formato corto
  const fecha = new Date();
  // Ajustar a zona horaria de Ecuador (UTC-5)
  const offsetEcuador = -5 * 60; // UTC-5 en minutos
  const offsetLocal = fecha.getTimezoneOffset(); // Offset local en minutos
  const diferencia = offsetEcuador - offsetLocal;
  fecha.setMinutes(fecha.getMinutes() + diferencia);
  
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const año = fecha.getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  // Extraer solo el código del producto si viene en formato largo
  let codigo = productoId || 'PROD';
  if (productoId && productoId.includes('-')) {
    const partes = productoId.split('-');
    // Si hay timestamp después de +, extraer solo el código
    const ultimaParte = partes[partes.length - 1];
    codigo = ultimaParte.includes('+') ? ultimaParte.split('+')[0] : ultimaParte;
  }
  
  // Limitar código para asegurar que el ID final no exceda 50 caracteres
  const maxCodigoLength = 50 - 6 - 2 - 4 - 2; // fecha(6) + guiones(2) + random(4) + margen(2)
  codigo = codigo.substring(0, maxCodigoLength);
  
  return `${dia}${mes}${año}-${codigo.toLowerCase()}-${random}`.substring(0, 50);
}

// Función para formatear cantidades
function formatearCantidades(c1, c2, c3) {
  // Si todos los valores son -1, es un producto inactivo
  if (c1 === -1 && c2 === -1 && c3 === -1) {
    return 'INACTIVO';
  }
  
  const partes = [];
  if (c1 > 0) partes.push(c1.toString());
  else partes.push('');
  
  if (c2 > 0) partes.push(c2.toString());
  else partes.push('');
  
  if (c3 > 0) partes.push(c3.toString());
  else partes.push('');
  
  while (partes.length > 0 && partes[partes.length - 1] === '') {
    partes.pop();
  }
  
  return partes.join('+');
}

// Función para formatear fecha - acepta ambos formatos DD/MM/YYYY y YYYY-MM-DD
function formatearFecha(fecha) {
  // Si ya está en formato ISO (YYYY-MM-DD), devolverla
  if (fecha.includes('-') && fecha.split('-')[0].length === 4) {
    return fecha;
  }
  
  // Si está en formato DD/MM/YYYY, convertir
  const partes = fecha.split('/');
  if (partes.length === 3) {
    return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
  }
  
  // Si no es ninguno de los formatos esperados, usar fecha actual en UTC-5 (Ecuador)
  const ahora = new Date();
  const offsetEcuador = -5 * 60; // UTC-5 en minutos
  const offsetLocal = ahora.getTimezoneOffset(); // Offset local en minutos
  const diferencia = offsetEcuador - offsetLocal;
  ahora.setMinutes(ahora.getMinutes() + diferencia);
  
  return ahora.toISOString().split('T')[0];
}

// Crear tabla de auditoría si no existe
async function crearTablaAuditoria() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS auditoria_ediciones (
        id SERIAL PRIMARY KEY,
        registro_id VARCHAR(50) NOT NULL,
        fecha_registro TIMESTAMP NOT NULL,
        usuario_email VARCHAR(100) NOT NULL,
        usuario_nombre VARCHAR(100),
        producto_codigo VARCHAR(20),
        producto_nombre VARCHAR(100),
        campo_modificado VARCHAR(20) DEFAULT 'total',
        valor_anterior DECIMAL(10,3),
        valor_nuevo DECIMAL(10,3),
        diferencia DECIMAL(10,3),
        motivo TEXT,
        bodega_id INTEGER,
        bodega_nombre VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Crear índices
    await client.query('CREATE INDEX IF NOT EXISTS idx_auditoria_ediciones_registro_id ON auditoria_ediciones(registro_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_auditoria_ediciones_usuario_email ON auditoria_ediciones(usuario_email)');
    
    console.log('✅ Tabla auditoria_ediciones verificada/creada');
  } catch (error) {
    console.error('❌ Error al crear tabla de auditoría:', error);
  } finally {
    client.release();
  }
}

// Llamar a la función al iniciar el servidor
crearTablaAuditoria();

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Inventario ChiosBurger',
    status: 'running',
    version: '1.0.0',
    endpoints: ['/api/health', '/api/inventario', '/api/inventarios/:bodegaId']
  });
});

// Endpoint para verificar conexión
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: result.rows[0].now,
      environment: process.env.NODE_ENV || 'development',
      cors: {
        origin: req.headers.origin || 'no-origin',
        allowed: true
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

// Endpoint para guardar inventario
app.post('/api/inventario', async (req, res) => {
  const registro = req.body;
  
  console.log('📥 Servidor recibió:', {
    bodegaId: registro.bodegaId,
    totalProductos: registro.productos?.length,
    primerProductoId: registro.productos?.[0]?.id
  });
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Convertir bodegaId a string para buscar en el objeto
    const bodegaIdStr = String(registro.bodegaId);
    
    const tabla = TABLA_POR_BODEGA[bodegaIdStr];
    
    if (!tabla) {
      throw new Error(`No se encontró tabla para la bodega ${registro.bodegaId} (convertido a string: ${bodegaIdStr})`);
    }
    

    // Procesar cada producto
    for (const producto of registro.productos) {
      console.log('💾 Insertando producto con ID:', producto.id);
      let query;
      let values;
      
      switch (tabla) {
        case 'tomasFisicas':
          query = `
            INSERT INTO public."tomasFisicas" 
            (fecha, codtomas, cod_prod, productos, unidad, cantidad, anotaciones, local, "cantidadSolicitada", uni_bod, categoria, "Tipo A,B o C")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `;
          values = [
            registro.fecha,
            producto.id, // Preservar el ID original con timestamp
            producto.codigo || producto.id, // Usar código de Airtable si existe
            producto.nombre,
            producto.unidadBodega,
            producto.total.toString(),
            formatearCantidades(producto.c1, producto.c2, producto.c3),
            NOMBRE_LOCAL_CHIOS[registro.bodegaId] || '',
            producto.cantidadPedir > 0 ? producto.cantidadPedir.toString() : '',
            producto.unidad || '', // Ahora guarda la unidad de bodega principal
            producto.categoria || '',
            producto.tipo || ''
          ];
          break;

        case 'toma_bodega':
          query = `
            INSERT INTO public.toma_bodega 
            (id, codigo, producto, fecha, usuario, cantidades, total, unidad, categoria, "Tipo A,B o C")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `;
          values = [
            producto.id, // Preservar el ID original con timestamp
            producto.codigo || producto.id, // Usar código de Airtable si existe
            producto.nombre,
            registro.fecha,
            `${registro.usuario} - ${registro.usuario} - principal@chiosburger.com`,
            formatearCantidades(producto.c1, producto.c2, producto.c3) + '+',
            producto.c1 === -1 && producto.c2 === -1 && producto.c3 === -1 ? null : producto.total.toString(),
            producto.unidadBodega,
            producto.categoria || '',
            producto.tipo || ''
          ];
          break;

        case 'toma_materiaprima':
          query = `
            INSERT INTO public.toma_materiaprima 
            (id, codigo, producto, fecha, usuario, cantidades, total, unidad, categoria, "Tipo A,B o C")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `;
          const idGenerado = producto.id; // Preservar el ID original con timestamp
          const usuarioFormateado = `${registro.usuario} - materia@chiosburger.com`;
          
          
          values = [
            idGenerado,
            producto.codigo || producto.id, // Usar código de Airtable si existe
            producto.nombre,
            formatearFecha(registro.fecha),
            usuarioFormateado,
            formatearCantidades(producto.c1, producto.c2, producto.c3) + '+0',
            producto.c1 === -1 && producto.c2 === -1 && producto.c3 === -1 ? null : producto.total,
            producto.unidadBodega,
            producto.categoria || '',
            producto.tipo || ''
          ];
          break;

        case 'toma_planta':
          
          query = `
            INSERT INTO public.toma_planta 
            (id, codigo, producto, fecha, usuario, cantidades, total, unidad, categoria, "Tipo A,B o C")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `;
          values = [
            producto.id, // Preservar el ID original con timestamp
            producto.codigo || producto.id, // Usar código de Airtable si existe
            producto.nombre,
            formatearFecha(registro.fecha),
            `${registro.usuario} - produccion@chiosburger.com`,
            formatearCantidades(producto.c1, producto.c2, producto.c3),
            producto.c1 === -1 && producto.c2 === -1 && producto.c3 === -1 ? null : producto.total,
            producto.unidadBodega,
            producto.categoria || '',
            producto.tipo || ''
          ];
          break;

        case 'toma_simon_bolon':
          query = `
            INSERT INTO public.toma_simon_bolon 
            (id, fecha, usuario, codigo, producto, cantidad, total, uni_local, cant_pedir, uni_bod, categoria, "Tipo A,B o C")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `;
          values = [
            producto.id, // Preservar el ID original con timestamp
            formatearFecha(registro.fecha),
            `${registro.usuario} - simon@chiosburger.com`,
            producto.codigo || producto.id, // Usar código de Airtable si existe
            producto.nombre,
            formatearCantidades(producto.c1, producto.c2, producto.c3),
            producto.c1 === -1 && producto.c2 === -1 && producto.c3 === -1 ? null : producto.total,
            producto.unidadBodega,
            producto.cantidadPedir > 0 ? producto.cantidadPedir : null,
            producto.unidad,
            producto.categoria || '',
            producto.tipo || ''
          ];
          break;

        case 'toma_santo_cachon':
          query = `
            INSERT INTO public.toma_santo_cachon 
            (id, fecha, usuario, codigo, producto, cantidad, total, uni_local, cant_pedir, uni_bod, categoria, "Tipo A,B o C")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `;
          values = [
            producto.id, // Preservar el ID original con timestamp
            formatearFecha(registro.fecha),
            `${registro.usuario} - santo@chiosburger.com`,
            producto.codigo || producto.id, // Usar código de Airtable si existe
            producto.nombre,
            formatearCantidades(producto.c1, producto.c2, producto.c3),
            producto.c1 === -1 && producto.c2 === -1 && producto.c3 === -1 ? null : producto.total,
            producto.unidadBodega,
            producto.cantidadPedir > 0 ? producto.cantidadPedir : null,
            producto.unidad,
            producto.categoria || '',
            producto.tipo || ''
          ];
          break;

        case 'toma_bodegapulmon':
          query = `
            INSERT INTO public.toma_bodegapulmon 
            (id, codigo, producto, fecha, usuario, cantidades, total, unidad, categoria, "Tipo A,B o C")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `;
          values = [
            producto.id, // Preservar el ID original con timestamp
            producto.codigo || producto.id, // Usar código de Airtable si existe
            producto.nombre,
            formatearFecha(registro.fecha),
            `${registro.usuario} - pulmon@chiosburger.com`,
            formatearCantidades(producto.c1, producto.c2, producto.c3),
            producto.c1 === -1 && producto.c2 === -1 && producto.c3 === -1 ? null : producto.total,
            producto.unidadBodega,
            producto.categoria || '',
            producto.tipo || ''
          ];
          break;

        default:
          throw new Error(`Tabla no reconocida: ${tabla}`);
      }

      await client.query(query, values);
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Inventario guardado exitosamente' });
    
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error durante ROLLBACK:', rollbackError);
    }
    
    console.error('Error al guardar inventario:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  } finally {
    client.release();
  }
});

// Endpoint para obtener históricos
app.get('/api/inventarios/:bodegaId', async (req, res) => {
  const { bodegaId } = req.params;
  const bodegaIdStr = String(bodegaId);
  const tabla = TABLA_POR_BODEGA[bodegaIdStr];
  
  if (!tabla) {
    return res.status(400).json({ 
      success: false, 
      message: 'Bodega no válida' 
    });
  }

  try {
    let query;
    
    // Adaptar la consulta según la estructura de cada tabla
    switch (tabla) {
      case 'tomasFisicas':
        query = `
          SELECT fecha, codtomas as id, cod_prod as codigo, productos as producto, cantidad as total, 
                 anotaciones as cantidades, local, "cantidadSolicitada" as cant_pedir, unidad,
                 categoria, "Tipo A,B o C" as tipo
          FROM public."tomasFisicas"
          WHERE local = $1
          ORDER BY fecha DESC
          LIMIT 500
        `;
        break;
      
      case 'toma_bodega':
      case 'toma_materiaprima':
      case 'toma_planta':
      case 'toma_bodegapulmon':
        query = `
          SELECT id, codigo, producto, fecha, usuario, cantidades, total, unidad,
                 categoria, "Tipo A,B o C" as tipo
          FROM public.${tabla}
          ORDER BY fecha DESC
          LIMIT 500
        `;
        break;
        
      case 'toma_simon_bolon':
      case 'toma_santo_cachon':
        query = `
          SELECT id, fecha, usuario, codigo, producto, cantidad as cantidades, 
                 total, uni_local as unidad, cant_pedir, uni_bod,
                 categoria, "Tipo A,B o C" as tipo
          FROM public.${tabla}
          ORDER BY fecha DESC
          LIMIT 500
        `;
        break;
        
      default:
        query = `
          SELECT * FROM public.${tabla}
          ORDER BY fecha DESC
          LIMIT 500
        `;
    }

    const result = await pool.query(query, 
      tabla === 'tomasFisicas' ? [NOMBRE_LOCAL_CHIOS[parseInt(bodegaIdStr)]] : []
    );
    
    res.json({ 
      success: true, 
      data: result.rows 
    });
    
  } catch (error) {
    console.error('Error al obtener inventarios:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Endpoint para eliminar inventario y registrar en auditoría
app.delete('/api/inventario/:registroId', async (req, res) => {
  const { registroId } = req.params;
  const { 
    usuarioEmail, 
    usuarioNombre, 
    registroData,
    eliminarDeBD 
  } = req.body;

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Registrar en auditoría
    const queryAuditoria = `
      INSERT INTO public.auditoria_eliminaciones 
      (usuario_email, usuario_nombre, registro_id, registro_fecha, 
       registro_bodega, registro_origen, registro_productos_count, detalles_completos)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    
    await client.query(queryAuditoria, [
      usuarioEmail,
      usuarioNombre,
      registroId,
      registroData.fecha,
      registroData.bodega,
      registroData.origen || 'local',
      registroData.productos?.length || 0,
      JSON.stringify(registroData)
    ]);
    
    // 2. Si es necesario, eliminar de las tablas de inventario
    if (eliminarDeBD && registroData.productos) {
      const bodegaIdStr = String(registroData.bodegaId);
      const tabla = TABLA_POR_BODEGA[bodegaIdStr];
      
      if (tabla) {
        // Eliminar cada producto del registro
        for (const producto of registroData.productos) {
          let deleteQuery;
          
          switch (tabla) {
            case 'tomasFisicas':
              deleteQuery = `DELETE FROM public."tomasFisicas" WHERE codtomas = $1`;
              break;
            default:
              deleteQuery = `DELETE FROM public.${tabla} WHERE id = $1`;
              break;
          }
          
          try {
            await client.query(deleteQuery, [producto.id]);
          } catch (err) {
            console.log(`No se pudo eliminar producto ${producto.id}:`, err.message);
          }
        }
      }
    }
    
    await client.query('COMMIT');
    res.json({ 
      success: true, 
      message: 'Registro eliminado y auditado correctamente' 
    });
    
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error durante ROLLBACK:', rollbackError);
    }
    
    console.error('Error al eliminar registro:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  } finally {
    client.release();
  }
});

// Editar un producto en un registro de inventario
app.put('/api/inventario/:registroId/editar', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { registroId } = req.params;
    const {
      productoId,
      valorAnteriorTotal,
      valorNuevoTotal,
      diferenciaTotal,
      valorAnteriorCantidad,
      valorNuevoCantidad,
      diferenciaCantidad,
      motivo,
      usuarioEmail,
      usuarioNombre,
      productoNombre,
      productoCodigo,
      bodegaId,
      bodegaNombre,
      fechaRegistro
    } = req.body;

    console.log('=== EDICIÓN DE PRODUCTO ===');
    console.log('Registro ID:', registroId);
    console.log('Producto:', productoNombre);
    console.log('Total anterior:', valorAnteriorTotal, '→ nuevo:', valorNuevoTotal);
    console.log('Cantidad anterior:', valorAnteriorCantidad, '→ nueva:', valorNuevoCantidad);
    console.log('Usuario:', usuarioEmail);
    console.log('BodegaId:', bodegaId);
    console.log('Todos los datos recibidos:', JSON.stringify(req.body, null, 2));
    
    // Validar y convertir valores
    const totalAnterior = parseFloat(valorAnteriorTotal) || 0;
    const totalNuevo = parseFloat(valorNuevoTotal) || 0;
    const cantidadAnterior = parseFloat(valorAnteriorCantidad) || 0;
    const cantidadNueva = parseFloat(valorNuevoCantidad) || 0;
    const diferenciaTotalCalc = totalNuevo - totalAnterior;
    const diferenciaCantidadCalc = cantidadNueva - cantidadAnterior;
    
    console.log('📊 Valores procesados:', {
      totalAnterior,
      totalNuevo,
      cantidadAnterior,
      cantidadNueva,
      diferenciaTotalCalc,
      diferenciaCantidadCalc
    });

    // Verificar que la tabla existe para la bodega
    const tablaInventario = TABLA_POR_BODEGA[bodegaId];
    if (!tablaInventario) {
      return res.status(400).json({ 
        success: false, 
        message: `No se encontró tabla para la bodega ${bodegaId}` 
      });
    }

    await client.query('BEGIN');

    // 1. Actualizar el registro en la tabla de inventario correspondiente
    // Extraer fecha del registroId si es posible
    let fechaExtraida = null;
    
    // Verificar si el ID es un timestamp (registros locales)
    if (registroId && registroId.match(/^\d{13}-/)) {
      // Es un timestamp, extraer la fecha de fechaRegistro
      console.log('📅 ID es un timestamp, usando fechaRegistro');
      if (fechaRegistro) {
        fechaExtraida = fechaRegistro.split('T')[0]; // Obtener solo la fecha
      }
    } else if (registroId && registroId.match(/^\d{6}-/)) {
      // Formato: YYMMDD-... (registros de base de datos)
      const fechaPart = registroId.substring(0, 6);
      const year = fechaPart.substring(0, 2);   // YY
      const month = fechaPart.substring(2, 4);   // MM
      const day = fechaPart.substring(4, 6);     // DD
      
      // Corregir el año - si es 25, es 2025
      const fullYear = parseInt(year) < 50 ? `20${year}` : `19${year}`;
      
      fechaExtraida = `${fullYear}-${month}-${day}`;
      console.log('📅 Fecha extraída del ID (YYMMDD):', fechaExtraida);
      console.log('   Año:', fullYear, 'Mes:', month, 'Día:', day);
    }
    
    // Si no se pudo extraer fecha, usar fechaRegistro
    if (!fechaExtraida && fechaRegistro) {
      fechaExtraida = fechaRegistro.split('T')[0];
      console.log('📅 Usando fechaRegistro:', fechaExtraida);
    }
    
    // Asegurar que la fecha esté en formato YYYY-MM-DD
    if (fechaExtraida) {
      fechaExtraida = formatearFecha(fechaExtraida);
      console.log('📅 Fecha final formateada:', fechaExtraida);
    } else {
      console.error('❌ No se pudo determinar la fecha para el registro');
      throw new Error('No se pudo determinar la fecha del registro');
    }

    // Construir UPDATE query según la estructura de cada tabla
    let updateQuery;
    let updateParams;
    
    switch (tablaInventario) {
      case 'toma_bodega':
      case 'toma_materiaprima':
      case 'toma_planta':
      case 'toma_bodegapulmon':
        // Estas tablas NO tienen columna cant_pedir
        updateQuery = `
          UPDATE public.${tablaInventario}
          SET total = $1
          WHERE fecha = $2
          AND (producto ILIKE $3 OR codigo = $4)
          RETURNING id, producto
        `;
        updateParams = [
          totalNuevo.toString(),
          fechaExtraida,
          `%${productoNombre}%`,
          productoCodigo || productoId
        ];
        break;
        
      case 'tomasFisicas':
        // Esta tabla usa nombres de columnas diferentes
        updateQuery = `
          UPDATE public."tomasFisicas"
          SET cantidad = $1,
              "cantidadSolicitada" = $2
          WHERE fecha = $3
          AND (productos ILIKE $4 OR cod_prod = $5)
          RETURNING codtomas as id, productos
        `;
        updateParams = [
          totalNuevo.toString(),
          cantidadNueva.toString(),
          fechaExtraida,
          `%${productoNombre}%`,
          productoCodigo || productoId
        ];
        break;
        
      case 'toma_simon_bolon':
      case 'toma_santo_cachon':
        // Estas tablas SÍ tienen columna cant_pedir
        updateQuery = `
          UPDATE public.${tablaInventario}
          SET total = $1,
              cant_pedir = $2
          WHERE fecha = $3
          AND (producto ILIKE $4 OR codigo = $5)
          RETURNING id, producto
        `;
        updateParams = [
          totalNuevo,
          cantidadNueva,
          fechaExtraida,
          `%${productoNombre}%`,
          productoCodigo || productoId
        ];
        break;
        
      default:
        throw new Error(`Tabla no reconocida para actualización: ${tablaInventario}`);
    }

    console.log('📝 Query de actualización:', updateQuery);
    console.log('📊 Parámetros:', updateParams);
    console.log('🔍 Detalles de búsqueda:');
    console.log('   - Tabla:', tablaInventario);
    console.log('   - Fecha:', fechaExtraida);
    console.log('   - Producto:', productoNombre);
    console.log('   - Código:', productoCodigo || productoId);
    
    try {
      const updateResult = await client.query(updateQuery, updateParams);
      
      if (updateResult.rows.length > 0) {
        console.log('✅ Registro actualizado en tabla:', tablaInventario);
        console.log('   Filas afectadas:', updateResult.rows.length);
      } else {
        console.log('⚠️ No se encontró registro para actualizar en tabla:', tablaInventario);
        console.log('   Continuando con auditoría de todos modos...');
      }
    } catch (updateError) {
      console.error('❌ Error al actualizar tabla:', updateError.message);
      console.log('   Continuando con auditoría de todos modos...');
    }

    // 2. Insertar registros de auditoría (uno por cada campo modificado)
    const auditorias = [];
    
    // Si cambió el total
    if (diferenciaTotalCalc !== 0 && !isNaN(diferenciaTotalCalc)) {
      auditorias.push({
        campo: 'total',
        valorAnterior: totalAnterior,
        valorNuevo: totalNuevo,
        diferencia: diferenciaTotalCalc
      });
    }
    
    // Si cambió la cantidad a pedir (solo para tablas que tienen esta columna)
    const tablasConCantPedir = ['tomasFisicas', 'toma_simon_bolon', 'toma_santo_cachon'];
    if (tablasConCantPedir.includes(tablaInventario) && diferenciaCantidadCalc !== 0 && !isNaN(diferenciaCantidadCalc)) {
      auditorias.push({
        campo: 'cantidad_pedir',
        valorAnterior: cantidadAnterior,
        valorNuevo: cantidadNueva,
        diferencia: diferenciaCantidadCalc
      });
    }
    
    // Si no hay cambios, registrar de todos modos
    if (auditorias.length === 0) {
      console.log('⚠️ No se detectaron cambios en los valores');
      auditorias.push({
        campo: 'sin_cambios',
        valorAnterior: totalAnterior,
        valorNuevo: totalNuevo,
        diferencia: 0
      });
    }
    
    // Insertar una fila de auditoría por cada campo modificado
    for (const audit of auditorias) {
      const auditQuery = `
        INSERT INTO auditoria_ediciones (
          registro_id,
          fecha_registro,
          usuario_email,
          usuario_nombre,
          producto_codigo,
          producto_nombre,
          campo_modificado,
          valor_anterior,
          valor_nuevo,
          diferencia,
          motivo,
          bodega_id,
          bodega_nombre
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `;

      await client.query(auditQuery, [
        registroId,
        fechaRegistro,
        usuarioEmail,
        usuarioNombre,
        productoCodigo || null,
        productoNombre,
        audit.campo,
        audit.valorAnterior,
        audit.valorNuevo,
        audit.diferencia,
        motivo || null,
        bodegaId,
        bodegaNombre
      ]);
    }

    console.log('✅ Auditoría registrada');

    await client.query('COMMIT');

    res.json({ 
      success: true, 
      message: 'Producto editado correctamente' 
    });

  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('❌ Error durante ROLLBACK:', rollbackError);
    }
    
    console.error('❌ Error al editar producto:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Error al editar el producto: ' + error.message,
      error: error.message,
      details: error.stack
    });
  } finally {
    client.release();
  }
});

// Endpoint para obtener auditoría de ediciones
app.get('/api/auditoria/ediciones', async (req, res) => {
  try {
    const query = `
      SELECT * FROM auditoria_ediciones 
      ORDER BY created_at DESC 
      LIMIT 100
    `;
    
    const result = await pool.query(query);
    
    res.json({ 
      success: true, 
      data: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Error al obtener auditoría:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
