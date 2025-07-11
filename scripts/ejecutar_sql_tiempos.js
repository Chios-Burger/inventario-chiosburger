import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de la base de datos
const client = new Client({
  host: 'chiosburguer.postgres.database.azure.com',
  port: 5432,
  user: 'adminChios',
  password: 'Burger2023',
  database: 'InventariosLocales',
  ssl: {
    rejectUnauthorized: false
  }
});

async function ejecutarSQL() {
  try {
    // Conectar a la base de datos
    await client.connect();
    console.log('✅ Conectado a la base de datos Azure PostgreSQL');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '..', 'sql', 'crear_tablas_tiempos.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Ejecutar el SQL
    console.log('📝 Ejecutando script SQL...');
    await client.query(sqlContent);
    
    console.log('✅ Script ejecutado exitosamente');
    console.log('\n📊 Tablas creadas:');
    console.log('  - sesiones_tiempo');
    console.log('  - tiempos_producto (tabla más completa con toda la información)');
    console.log('  - eventos_producto');
    
    console.log('\n👁️ Vistas creadas:');
    console.log('  - resumen_tiempos_categoria');
    console.log('  - evolucion_usuario');
    console.log('  - productos_problematicos');

    // Verificar que las tablas se crearon
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('sesiones_tiempo', 'tiempos_producto', 'eventos_producto')
      ORDER BY table_name;
    `);

    console.log('\n✅ Verificación de tablas:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name} ✓`);
    });

    // Contar columnas de la tabla más completa
    const columnsResult = await client.query(`
      SELECT COUNT(*) as total_columnas
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'tiempos_producto';
    `);

    console.log(`\n📊 La tabla tiempos_producto tiene ${columnsResult.rows[0].total_columnas} columnas con información detallada`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.detail) {
      console.error('Detalle:', error.detail);
    }
  } finally {
    await client.end();
    console.log('\n🔌 Conexión cerrada');
  }
}

// Ejecutar
ejecutarSQL();