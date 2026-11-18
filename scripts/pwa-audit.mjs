#!/usr/bin/env node
/**
 * PWA audit — memvalidasi hasil `npm run build` di dist/ tanpa browser.
 *
 * Memeriksa: manifest ter-parse & lengkap (nama, ikon 192+512, display
 * standalone), service worker hasil generateSW ada & membawa precache,
 * registerSW.js ada, ikon tersedia, dan index.html menautkan manifest.
 * Beda dari Lighthouse (dipakai repo PWA #3/#15): audit ini murni Node,
 * cepat, dan deterministik di CI — tanpa Chrome.
 *
 * Usage: npm run build && npm run pwa:audit
 * Exit 0 = lolos, 1 = ada yang gagal.
 */
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

let failures = 0;
function check(ok, label, detail = '') {
  console.log(`${ok ? '  ok ' : ' FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}

function mustExist(rel) {
  const p = join(dist, rel);
  const ok = existsSync(p) && statSync(p).size > 0;
  check(ok, `${rel} ada & tidak kosong`, ok ? `${statSync(p).size} byte` : 'hilang/kosong');
  return ok ? p : null;
}

// 1. index.html menautkan manifest + theme-color
const indexPath = mustExist('index.html');
if (indexPath) {
  const html = readFileSync(indexPath, 'utf8');
  check(html.includes('rel="manifest"'), 'index.html menautkan manifest');
  check(html.includes('name="theme-color"'), 'index.html memuat theme-color');
  check(html.includes('id="root"'), 'index.html memuat #root React');
}

// 2. Manifest valid & lengkap
const manifestPath = mustExist('manifest.webmanifest');
if (manifestPath) {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    check(true, 'manifest.webmanifest ter-parse sebagai JSON');
  } catch (e) {
    check(false, 'manifest.webmanifest ter-parse sebagai JSON', String(e));
  }
  if (manifest) {
    check(typeof manifest.name === 'string' && manifest.name.length > 0, 'manifest.name terisi', manifest.name);
    check(typeof manifest.short_name === 'string' && manifest.short_name.length > 0, 'manifest.short_name terisi', manifest.short_name);
    check(manifest.display === 'standalone', 'manifest.display = standalone', manifest.display);
    check(manifest.start_url === '/', 'manifest.start_url = /', manifest.start_url);
    const sizes = (manifest.icons || []).map((i) => i.sizes);
    check(sizes.includes('192x192'), 'manifest punya ikon 192x192', sizes.join(', '));
    check(sizes.includes('512x512'), 'manifest punya ikon 512x512', sizes.join(', '));
    check((manifest.icons || []).some((i) => (i.purpose || '').includes('maskable')), 'manifest punya ikon maskable');
  }
}

// 3. Service worker generateSW + precache
const swPath = mustExist('sw.js');
if (swPath) {
  const sw = readFileSync(swPath, 'utf8');
  check(sw.includes('precacheAndRoute'), 'sw.js memakai precacheAndRoute (Workbox)');
  const precacheCount = (sw.match(/revision:/g) || []).length;
  check(precacheCount >= 10, 'sw.js membawa precache yang substansial', `${precacheCount} entri revision`);
  check(sw.includes('registerRoute') || sw.includes('precacheAndRoute'), 'sw.js punya routing/caching');
}
// 4. registerSW + runtime Workbox + ikon (nama file workbox membawa
// hash build, jadi dicek longgar lewat readdir)
mustExist('registerSW.js');
const workboxFiles = readdirSync(dist).filter((f) => f.startsWith('workbox-') && f.endsWith('.js'));
check(workboxFiles.length === 1, 'tepat 1 file workbox-* di dist/', workboxFiles.join(', '));
mustExist('icons/icon-192.png');
mustExist('icons/icon-512.png');
mustExist('icons/apple-touch-icon.png');

// 5. Aset font self-hosted ikut ter-bundle (offline penuh)
const assets = existsSync(join(dist, 'assets')) ? readdirSync(join(dist, 'assets')) : [];
check(assets.some((f) => f.endsWith('.woff2')), 'font woff2 self-hosted ada di dist/assets');

if (failures > 0) {
  console.log(`\nPWA audit GAGAL: ${failures} pemeriksaan tidak lolos.`);
  process.exit(1);
}
console.log('\nPWA audit OK: manifest + service worker + ikon lengkap.');
