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
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
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
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const año = fecha.getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  // Extraer solo el código del producto si viene en formato largo
  let codigo = productoId || 'PROD';
  if (productoId && productoId.includes('-')) {
    const partes = productoId.split('-');
    codigo = partes[partes.length - 1].split('+')[0]; // Obtener el código sin timestamp
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

// Función para formatear fecha
function formatearFecha(fecha) {
  const partes = fecha.split('/');
  if (partes.length === 3) {
    return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
  }
  return new Date().toISOString().split('T')[0];
}

// Endpoint para verificar conexión
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: result.rows[0].now 
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
  console.log('📥 Datos recibidos:', {
    bodegaId: registro.bodegaId,
    bodegaIdType: typeof registro.bodegaId,
    bodega: registro.bodega,
    tieneProductos: !!registro.productos,
    cantidadProductos: registro.productos?.length || 0
  });
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Convertir bodegaId a string para buscar en el objeto
    const bodegaIdStr = String(registro.bodegaId);
    
    console.log('🔍 Conversión bodegaId:', {
      original: registro.bodegaId,
      originalType: typeof registro.bodegaId,
      convertido: bodegaIdStr,
      convertidoType: typeof bodegaIdStr
    });
    
    const tabla = TABLA_POR_BODEGA[bodegaIdStr];
    if (!tabla) {
      console.error('❌ Bodega no encontrada:', bodegaIdStr, 'Tipo:', typeof bodegaIdStr);
      console.error('📋 Bodegas disponibles:', Object.keys(TABLA_POR_BODEGA));
      console.error('🔎 Buscando en objeto:', TABLA_POR_BODEGA);
      throw new Error(`No se encontró tabla para la bodega ${registro.bodegaId} (convertido a string: ${bodegaIdStr})`);
    }

    // Procesar cada producto
    for (const producto of registro.productos) {
      console.log('📦 Procesando producto:', {
        id: producto.id,
        idLength: producto.id?.length,
        nombre: producto.nombre?.substring(0, 30) + '...',
        codigo: producto.codigo,
        tieneEquivalencia: !!producto.equivalencia
      });
      
      let query;
      let values;

      // Log de valores para depuración
      console.log('📊 Valores a insertar:', {
        tabla: tabla,
        idLength: generarId(producto.id).length,
        productoNombreLength: producto.nombre?.length,
        usuarioLength: registro.usuario?.length
      });
      
      switch (tabla) {
        case 'tomasFisicas':
          query = `
            INSERT INTO public."tomasFisicas" 
            (fecha, codtomas, cod_prod, productos, unidad, cantidad, anotaciones, local, "cantidadSolicitada", uni_bod)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `;
          values = [
            registro.fecha,
            `0${producto.codigo || producto.id}`,
            producto.codigo || producto.id, // Usar código de Airtable si existe
            producto.nombre,
            producto.unidadBodega,
            producto.total.toString(),
            formatearCantidades(producto.c1, producto.c2, producto.c3),
            NOMBRE_LOCAL_CHIOS[registro.bodegaId] || '',
            producto.cantidadPedir > 0 ? producto.cantidadPedir.toString() : '',
            ''
          ];
          break;

        case 'toma_bodega':
          query = `
            INSERT INTO public.toma_bodega 
            (id, codigo, producto, fecha, usuario, cantidades, total, unidad)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `;
          values = [
            generarId(producto.id),
            producto.codigo || producto.id, // Usar código de Airtable si existe
            producto.nombre,
            registro.fecha,
            `${registro.usuario} - ${registro.usuario} - principal@chiosburger.com`,
            formatearCantidades(producto.c1, producto.c2, producto.c3) + '+',
            producto.c1 === -1 && producto.c2 === -1 && producto.c3 === -1 ? null : producto.total.toString(),
            producto.unidadBodega
          ];
          break;

        case 'toma_materiaprima':
          query = `
            INSERT INTO public.toma_materiaprima 
            (id, codigo, producto, fecha, usuario, cantidades, total, unidad)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `;
          const idGenerado = generarId(producto.id);
          const usuarioFormateado = `${registro.usuario} - materia@chiosburger.com`;
          
          console.log('🔍 Valores toma_materiaprima:', {
            id: idGenerado,
            idLength: idGenerado.length,
            codigo: producto.id,
            codigoLength: producto.id.length,
            usuarioLength: usuarioFormateado.length
          });
          
          values = [
            idGenerado,
            producto.codigo || producto.id, // Usar código de Airtable si existe
            producto.nombre,
            formatearFecha(registro.fecha),
            usuarioFormateado,
            formatearCantidades(producto.c1, producto.c2, producto.c3) + '+0',
            producto.c1 === -1 && producto.c2 === -1 && producto.c3 === -1 ? null : producto.total,
            producto.unidadBodega
          ];
          break;

        case 'toma_planta':
          query = `
            INSERT INTO public.toma_planta 
            (id, codigo, producto, fecha, usuario, cantidades, total, unidad)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `;
          values = [
            generarId(producto.id),
            producto.codigo || producto.id, // Usar código de Airtable si existe
            producto.nombre,
            formatearFecha(registro.fecha),
            `${registro.usuario} - produccion@chiosburger.com`,
            formatearCantidades(producto.c1, producto.c2, producto.c3),
            producto.c1 === -1 && producto.c2 === -1 && producto.c3 === -1 ? null : producto.total,
            producto.unidadBodega
          ];
          break;

        case 'toma_simon_bolon':
          query = `
            INSERT INTO public.toma_simon_bolon 
            (id, fecha, usuario, codigo, producto, cantidad, total, uni_local, cant_pedir, uni_bod)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `;
          values = [
            generarId(producto.id),
            formatearFecha(registro.fecha),
            `${registro.usuario} - simon@chiosburger.com`,
            producto.codigo || producto.id, // Usar código de Airtable si existe
            producto.nombre,
            formatearCantidades(producto.c1, producto.c2, producto.c3),
            producto.c1 === -1 && producto.c2 === -1 && producto.c3 === -1 ? null : producto.total,
            producto.unidadBodega,
            producto.cantidadPedir > 0 ? producto.cantidadPedir : null,
            producto.unidad
          ];
          break;

        case 'toma_santo_cachon':
          query = `
            INSERT INTO public.toma_santo_cachon 
            (id, fecha, usuario, codigo, producto, cantidad, total, uni_local, cant_pedir, uni_bod)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `;
          values = [
            generarId(producto.id),
            formatearFecha(registro.fecha),
            `${registro.usuario} - santo@chiosburger.com`,
            producto.codigo || producto.id, // Usar código de Airtable si existe
            producto.nombre,
            formatearCantidades(producto.c1, producto.c2, producto.c3),
            producto.c1 === -1 && producto.c2 === -1 && producto.c3 === -1 ? null : producto.total,
            producto.unidadBodega,
            producto.cantidadPedir > 0 ? producto.cantidadPedir : null,
            producto.unidad
          ];
          break;

        case 'toma_bodegapulmon':
          query = `
            INSERT INTO public.toma_bodegapulmon 
            (id, codigo, producto, fecha, usuario, cantidades, total, unidad)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `;
          values = [
            generarId(producto.id),
            producto.codigo || producto.id, // Usar código de Airtable si existe
            producto.nombre,
            formatearFecha(registro.fecha),
            `${registro.usuario} - pulmon@chiosburger.com`,
            formatearCantidades(producto.c1, producto.c2, producto.c3),
            producto.c1 === -1 && producto.c2 === -1 && producto.c3 === -1 ? null : producto.total,
            producto.unidadBodega
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
    await client.query('ROLLBACK');
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
                 anotaciones as cantidades, local, "cantidadSolicitada" as cant_pedir, unidad
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
          SELECT id, codigo, producto, fecha, usuario, cantidades, total, unidad
          FROM public.${tabla}
          ORDER BY fecha DESC
          LIMIT 500
        `;
        break;
        
      case 'toma_simon_bolon':
      case 'toma_santo_cachon':
        query = `
          SELECT id, fecha, usuario, codigo, producto, cantidad as cantidades, 
                 total, uni_local as unidad, cant_pedir, uni_bod
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

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});