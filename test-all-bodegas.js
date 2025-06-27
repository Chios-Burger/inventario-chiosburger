// Script para probar el guardado en todas las bodegas
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001/api';

// Lista de todas las bodegas
const BODEGAS = [
  { id: 1, nombre: 'Bodega Principal' },
  { id: 2, nombre: 'Bodega Materia Prima' },
  { id: 3, nombre: 'Planta De Producción' },
  { id: 4, nombre: 'Chios Real Audiencia' },
  { id: 5, nombre: 'Chios Floreana' },
  { id: 6, nombre: 'Chios Portugal' },
  { id: 7, nombre: 'Chios Simón Bolón' },
  { id: 8, nombre: 'Chios Santo Cachón' }
];

// Función para generar datos de prueba
function generarDatosPrueba(bodegaId, bodegaNombre) {
  return {
    fecha: '2025-12-31',
    hora: '23:59:59',
    usuario: 'Usuario de Prueba',
    bodega: bodegaNombre,
    bodegaId: bodegaId,
    productos: [
      {
        id: 'PROD-TEST-001',
        nombre: 'aaa',
        categoria: 'aaa',
        c1: 9999,
        c2: 9999,
        c3: 9999,
        total: 29997,
        unidad: 'aaa',
        unidadBodega: 'aaa',
        cantidadPedir: 9999,
        equivalencia: 'aaa'
      },
      {
        id: 'PROD-TEST-002',
        nombre: 'aaa',
        categoria: 'aaa',
        c1: 9999,
        c2: 9999,
        c3: 9999,
        total: 29997,
        unidad: 'aaa',
        unidadBodega: 'aaa',
        cantidadPedir: 9999,
        equivalencia: 'aaa'
      }
    ],
    duracion: '00:05:00',
    productosGuardados: 2,
    totalProductos: 2,
    timestamp: Date.now()
  };
}

// Función para probar cada bodega
async function probarBodega(bodega) {
  console.log(`\n🔄 Probando bodega: ${bodega.nombre} (ID: ${bodega.id})`);
  
  const datos = generarDatosPrueba(bodega.id, bodega.nombre);
  
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

// Función principal
async function probarTodasLasBodegas() {
  console.log('🚀 Iniciando prueba de todas las bodegas...');
  console.log('📅 Fecha de prueba: 2025-12-31');
  console.log('🔢 Valores numéricos: 9999');
  console.log('📝 Valores de texto: "aaa"');
  
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

  console.log('\n📊 RESUMEN DE RESULTADOS:');
  console.log(`✅ Exitosas (${resultados.exitosas.length}):`, resultados.exitosas);
  console.log(`❌ Fallidas (${resultados.fallidas.length}):`, resultados.fallidas);
}

// Ejecutar las pruebas
probarTodasLasBodegas().catch(console.error);