#!/usr/bin/env node

// Script para actualizar automáticamente version.json en cada build
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generar nueva versión basada en timestamp
const timestamp = Date.now();
const date = new Date();
const version = `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}.${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;

const versionData = {
  version,
  timestamp,
  buildDate: date.toISOString()
};

// Escribir archivo en public
const publicPath = join(__dirname, '..', 'public', 'version.json');
writeFileSync(publicPath, JSON.stringify(versionData, null, 2));

// También escribir en dist si existe (para después del build)
try {
  const distPath = join(__dirname, '..', 'dist', 'version.json');
  writeFileSync(distPath, JSON.stringify(versionData, null, 2));
} catch (e) {
  // dist puede no existir aún, ignorar el error
}

console.log(`✅ Version actualizada: ${version} (${date.toISOString()})`);