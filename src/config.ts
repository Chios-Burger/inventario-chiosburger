export const AIRTABLE_CONFIG = {
  baseId: 'app5zYXr1GmF2bmVF',
  tableId: 'tbl8hyvwwfSnrspAt',
  apiKey: 'patTAcuJ2tPjECEQM.1a60d9818fadd363088d86e405f30bd0bf7ab0ae443490efe17957102b7c0b2b',
  viewId: 'viwTQXKzHMDwwCHwO'
};

export const BODEGAS = [
  { id: 1, nombre: 'Bodega Principal', campo: 'Conteo Bodega Principal', unidad: 'Unidad Conteo Bodega Principal' },
  { id: 2, nombre: 'Bodega Materia Prima', campo: 'Conteo Bodega Materia Prima', unidad: 'Unidad Conteo Bodega Materia Prima' },
  { id: 3, nombre: 'Planta De Producción', campo: 'Conteo Planta Producción', unidad: 'Unidad Conteo Planta Producción' },
  { id: 4, nombre: 'Chios Real Audiencia', campo: 'Conteo Chios', unidad: 'Unidad Conteo Chios' },
  { id: 5, nombre: 'Chios Floreana', campo: 'Conteo Chios', unidad: 'Unidad Conteo Chios' },
  { id: 6, nombre: 'Chios Portugal', campo: 'Conteo Chios', unidad: 'Unidad Conteo Chios' },
  { id: 7, nombre: 'Simón Bolón', campo: 'Conteo Simón Bolón', unidad: 'Unidad Conteo Simón Bolón' },
  { id: 8, nombre: 'Santo Cachón', campo: 'Conteo Santo Cachón', unidad: 'Unidad Conteo Santo Cachón' },
  { id: 9, nombre: 'Bodega Pulmon', campo: 'Conteo Bodega Pulmon', unidad: 'Unidad Conteo Bodega Pulmon' }
];

export const USUARIOS = [
  {
    email: 'gerencia@chiosburger.com',
    pin: '9999',
    nombre: 'Gerencia',
    bodegasPermitidas: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    esAdmin: true
  },
  {
    email: 'analisis@chiosburger.com',
    pin: '8888',
    nombre: 'Análisis',
    bodegasPermitidas: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    esAdmin: true
  },
  {
    email: 'bodegaprincipal@chiosburger.com',
    pin: '4321',
    nombre: 'Bodega Principal',
    bodegasPermitidas: [1, 9],
    esAdmin: false
  },
  {
    email: 'analista_calidad@chiosburger.com',
    pin: '2345',
    nombre: 'Bodega Materia Prima',
    bodegasPermitidas: [2],
    esAdmin: false
  },
  {
    email: 'produccion@chiosburger.com',
    pin: '3456',
    nombre: 'Planta Producción',
    bodegasPermitidas: [3],
    esAdmin: false
  },
  {
    email: 'realaudiencia@chiosburger.com',
    pin: '4567',
    nombre: 'Chios Real Audiencia',
    bodegasPermitidas: [4],
    esAdmin: false
  },
  {
    email: 'floreana@chiosburger.com',
    pin: '5678',
    nombre: 'Chios Floreana',
    bodegasPermitidas: [5],
    esAdmin: false
  },
  {
    email: 'portugal@chiosburger.com',
    pin: '6789',
    nombre: 'Chios Portugal',
    bodegasPermitidas: [6],
    esAdmin: false
  },
  {
    email: 'simonbolon@chiosburger.com',
    pin: '7890',
    nombre: 'Simón Bolón',
    bodegasPermitidas: [7],
    esAdmin: false
  },
  {
    email: 'entrenador@chiosburger.com',
    pin: '8901',
    nombre: 'Santo Cachón',
    bodegasPermitidas: [8],
    esAdmin: false
  }
];