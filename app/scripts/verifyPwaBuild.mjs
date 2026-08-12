import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const manifestPath = path.join(distDir, 'manifest.webmanifest');
const swPath = path.join(distDir, 'sw.js');

function fail(message) {
  console.error(`PWA build check failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(manifestPath)) {
  fail(`missing ${manifestPath}`);
}
if (!fs.existsSync(swPath)) {
  fail(`missing ${swPath}`);
}

/** @type {{ name?: string, icons?: unknown[], display?: string, start_url?: string }} */
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (!manifest.name) {
  fail('manifest.name is empty');
}
if (!Array.isArray(manifest.icons) || manifest.icons.length < 2) {
  fail('manifest.icons must include at least two icons');
}
if (manifest.display !== 'standalone') {
  fail(`expected display standalone, got ${manifest.display}`);
}
if (manifest.start_url !== '/') {
  fail(`expected start_url /, got ${manifest.start_url}`);
}

const sw = fs.readFileSync(swPath, 'utf8');
if (!sw.includes('workbox') && !sw.includes('precache')) {
  fail('service worker does not look like a Workbox generateSW output');
}

console.log('PWA build artifacts OK (manifest.webmanifest + sw.js)');
