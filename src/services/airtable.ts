import axios from 'axios';
import { AIRTABLE_CONFIG } from '../config';
import type { Producto, AirtableResponse } from '../types/index';

const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}/${AIRTABLE_CONFIG.tableId}`;
const PROXY_URL = 'https://corsproxy.io/?';

// Cache para productos
const productosCache = new Map<string, Producto[]>();

export const airtableService = {
  async obtenerProductos(bodegaId: number): Promise<Producto[]> {
    const cacheKey = `productos_${bodegaId}`;
    
    // Verificar si hay datos en cache
    if (productosCache.has(cacheKey)) {
      console.log(`🎯 Usando productos del cache para bodega ${bodegaId}`);
      return productosCache.get(cacheKey)!;
    }
    
    let allRecords: Producto[] = [];
    let offset: string | undefined = undefined;
    let useProxy = false;

    // Obtener el campo de control según la bodega
    const campoControl = this.obtenerCampoControl(bodegaId);
    if (!campoControl) return [];

    do {
      try {
        const url = useProxy ? PROXY_URL + encodeURIComponent(BASE_URL) : BASE_URL;
        
        const params: any = {
          view: AIRTABLE_CONFIG.viewId,
          pageSize: 100
        };

        if (offset) {
          params.offset = offset;
        }

        // Filtrar solo productos donde el campo de control = "Sí"
        params.filterByFormula = `{${campoControl}} = "Sí"`;
        
        // Comentar los campos específicos para que Airtable devuelva todos
        // params.fields = ['Nombre Producto', 'Categoría', 'Código', 'Codigo', 
        //                 'Unidad Conteo Bodega Principal', 'Equivalencias Inventarios',
        //                 campoControl, this.obtenerCampoUnidad(bodegaId)];

        const response = await axios.get<AirtableResponse>(url, {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}`,
            'Content-Type': 'application/json'
          },
          params
        });

        allRecords = [...allRecords, ...response.data.records];
        offset = response.data.offset;

      } catch (error) {
        if (!useProxy && axios.isAxiosError(error) && error.response?.status === 0) {
          console.log('Error de CORS detectado, intentando con proxy...');
          useProxy = true;
          offset = undefined;
          allRecords = [];
        } else {
          console.error('Error al obtener productos:', error);
          throw error;
        }
      }
    } while (offset);

    // Guardar en cache
    productosCache.set(cacheKey, allRecords);
    console.log(`💾 Productos guardados en cache para bodega ${bodegaId}`);
    
    return allRecords;
  },
  
  // Método para limpiar el cache si es necesario
  limpiarCache() {
    productosCache.clear();
    console.log('🧹 Cache de productos limpiado');
  },

  obtenerCampoControl(bodegaId: number): string | null {
    const campos: { [key: number]: string } = {
      1: 'Conteo Bodega Principal',
      2: 'Conteo Bodega Materia Prima',
      3: 'Conteo Planta Producción',
      4: 'Conteo Chios',
      5: 'Conteo Chios',
      6: 'Conteo Chios',
      7: 'Conteo Simón Bolón',
      8: 'Conteo Santo Cachón',
      9: 'Conteo Bodega Pulmon'
    };
    return campos[bodegaId] || null;
  },

  obtenerCampoUnidad(bodegaId: number): string {
    const campos: { [key: number]: string } = {
      1: 'Unidad Conteo Bodega Principal',
      2: 'Unidad Conteo Bodega Materia Prima',
      3: 'Unidad Conteo Planta Producción',
      4: 'Unidad Conteo Chios',
      5: 'Unidad Conteo Chios',
      6: 'Unidad Conteo Chios',
      7: 'Unidad Conteo Simón Bolón',
      8: 'Unidad Conteo Santo Cachón',
      9: 'Unidad Conteo Bodega Pulmon'
    };
    return campos[bodegaId] || '';
  }
};