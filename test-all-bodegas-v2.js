// Script para probar el guardado en todas las bodegas con nuevo formato de ID
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001/api';

// Lista de todas las bodegas con sus abreviaciones
const BODEGAS = [
  { id: 1, nombre: 'Bodega Principal', abrev: 'principal' },
  { id: 2, nombre: 'Bodega Materia Prima', abrev: 'materiaprima' },
  { id: 3, nombre: 'Planta De Producción', abrev: 'planta' },
  { id: 4, nombre: 'Chios Real Audiencia', abrev: 'realaudiencia' },
  { id: 5, nombre: 'Chios Floreana', abrev: 'floreana' },
  { id: 6, nombre: 'Chios Portugal', abrev: 'portugal' },
  { id: 7, nombre: 'Chios Simón Bolón', abrev: 'simonbolon' },
  { id: 8, nombre: 'Chios Santo Cachón', abrev: 'santocachon' }
];

// Función para generar ID único con el formato simplificado
function generarIdUnico(fecha, bodegaAbrev, bodegaId, codigoProducto) {
  // Convertir fecha a formato YYMMDD
  const fechaParts = fecha.split('-');
  const fechaFormateada = fechaParts[0].substring(2) + fechaParts[1] + fechaParts[2];
  
  // Generar timestamp único (últimos 6 dígitos del timestamp actual)
  const timestamp = Date.now().toString().slice(-6);
  
  // Formato simplificado: YYMMDD-[número]codigo+timestamp
  return `${fechaFormateada}-${bodegaId}${codigoProducto}+${timestamp}`;
}

// Función para generar datos de prueba
function generarDatosPrueba(bodegaId, bodegaNombre, bodegaAbrev) {
  const fecha = '2025-06-27';
  const productos = [];
  
  // Generar productos con códigos diferentes
  const codigosProducto = ['AP001', 'AP002', 'BV001', 'CM001', 'PN001'];
  
  for (let i = 0; i < codigosProducto.length; i++) {
    const codigoProducto = codigosProducto[i];
    const idUnico = generarIdUnico(fecha, bodegaAbrev, bodegaId, codigoProducto);
    
    productos.push({
      id: idUnico,
      nombre: `Producto ${codigoProducto}`,
      categoria: 'aaa',
      c1: 9999,
      c2: 9999,
      c3: 9999,
      total: 29997,
      unidad: 'aaa',
      unidadBodega: 'aaa',
      cantidadPedir: 9999,
      equivalencia: 'aaa'
    });
  }
  
  return {
    fecha: fecha,
    hora: '23:59:59',
    usuario: 'Usuario de Prueba',
    bodega: bodegaNombre,
    bodegaId: bodegaId,
    productos: productos,
    duracion: '00:05:00',
    productosGuardados: productos.length,
    totalProductos: productos.length,
    timestamp: Date.now()
  };
}

// Función para probar cada bodega
async function probarBodega(bodega) {
  console.log(`\n🔄 Probando bodega: ${bodega.nombre} (ID: ${bodega.id})`);
  
  const datos = generarDatosPrueba(bodega.id, bodega.nombre, bodega.abrev);
  
  // Mostrar ejemplos de IDs generados
  console.log('📋 Ejemplos de IDs generados:');
  datos.productos.slice(0, 3).forEach(prod => {
    console.log(`   - ${prod.id}`);
  });
  
  try {
    const response = await fetch(`${API_URL}/inventario`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datos)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error HTTP ${response.status}: ${errorText}`);
      return false;
    }

    const result = await response.json();
    console.log(`✅ Éxito: ${result.message}`);
    return true;
  } catch (error) {
    console.error(`❌ Error de conexión: ${error.message}`);
    return false;
  }
}

// Mostrar ejemplos de formato de ID
function mostrarEjemplosFormato() {
  console.log('\n📝 FORMATO DE ID PARA CADA BODEGA:');
  console.log('================================');
  
  const fecha = '2025-06-27';
  const fechaFormateada = '250627';
  
  BODEGAS.forEach(bodega => {
    console.log(`\n${bodega.nombre}:`);
    console.log(`Formato: ${fechaFormateada}-${bodega.id}[CÓDIGO]+[timestamp]`);
    console.log('Ejemplos:');
    console.log(`  - ${generarIdUnico(fecha, bodega.abrev, bodega.id, 'AP001')}`);
    console.log(`  - ${generarIdUnico(fecha, bodega.abrev, bodega.id, 'BV001')}`);
    console.log(`  - ${generarIdUnico(fecha, bodega.abrev, bodega.id, 'CM001')}`);
  });
  
  console.log('\n💡 Si se hace otro registro el mismo día:');
  console.log('El timestamp al final garantiza que cada ID sea único');
  console.log('Ejemplo para múltiples registros del mismo producto:');
  
  // Simular múltiples registros
  setTimeout(() => {
    console.log(`  1er registro: ${generarIdUnico(fecha, 'principal', 1, 'AP001')}`);
  }, 100);
  
  setTimeout(() => {
    console.log(`  2do registro: ${generarIdUnico(fecha, 'principal', 1, 'AP001')}`);
  }, 200);
  
  setTimeout(() => {
    console.log(`  3er registro: ${generarIdUnico(fecha, 'principal', 1, 'AP001')}`);
  }, 300);
}

// Función principal
async function probarTodasLasBodegas() {
  console.log('🚀 Iniciando prueba de todas las bodegas con nuevo formato de ID...');
  console.log('📅 Fecha de prueba: 2025-06-27');
  console.log('🔢 Valores numéricos: 9999');
  console.log('📝 Valores de texto: "aaa"');
  
  // Primero mostrar ejemplos de formato
  mostrarEjemplosFormato();
  
  // Esperar un poco antes de comenzar las pruebas
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n\n🔧 INICIANDO PRUEBAS DE INSERCIÓN:');
  console.log('===================================');
  
  const resultados = {
    exitosas: [],
    fallidas: []
  };

  for (const bodega of BODEGAS) {
    const exito = await probarBodega(bodega);
    if (exito) {
      resultados.exitosas.push(bodega.nombre);
    } else {
      resultados.fallidas.push(bodega.nombre);
    }
    // Pequeña pausa entre peticiones
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n\n📊 RESUMEN DE RESULTADOS:');
  console.log('=========================');
  console.log(`✅ Exitosas (${resultados.exitosas.length}):`, resultados.exitosas);
  console.log(`❌ Fallidas (${resultados.fallidas.length}):`, resultados.fallidas);
}

// Ejecutar las pruebas
probarTodasLasBodegas().catch(console.error);