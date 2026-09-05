#!/usr/bin/env node
/**
 * Proves every configured cover photo actually resolves.
 *
 *   npm run media:check
 *
 * Covers are optional — the app draws a themed cover whenever no photo is
 * configured — so an empty PHOTO_COVERS map is a pass, not a failure. Run this
 * after adding URLs to `src/lib/media/covers.ts`, and before deploying: a 404
 * here is a card that silently falls back for every visitor.
 *
 * Reads the URLs straight out of the TypeScript source rather than importing
 * it, so the script stays dependency-free and needs no build step.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Where remote imagery is declared. Each entry names the file and the
 * declaration to read out of it, so a third list costs one line here rather
 * than a second copy of this script.
 */
const SOURCES = [
  { file: 'src/lib/media/covers.ts', declaration: 'export const PHOTO_COVERS', end: '\n};' },
  { file: 'src/lib/media/portraits.ts', declaration: 'export const PORTRAIT_IDS', end: '\n];' },
  { file: 'src/lib/media/portraits.ts', declaration: 'export const PROFESSIONAL_PORTRAIT_IDS', end: '\n];' },
];

/** Every image URL inside those blocks. */
function configuredUrls() {
  const urls = [];

  for (const { file, declaration, end: terminator } of SOURCES) {
    const source = readFileSync(resolve(ROOT, file), 'utf8');
    const start = source.indexOf(declaration);
    if (start === -1) continue;
    const end = source.indexOf(terminator, start);
    const block = source.slice(start, end === -1 ? undefined : end);

    // Portraits are stored as a bare Unsplash id plus a shared transform, so
    // they have to be expanded before they can be fetched.
    for (const match of block.matchAll(/'(photo-[^']+)'/g)) {
      urls.push(`https://images.unsplash.com/${match[1]}?w=400&h=400&fit=crop&crop=faces&q=80`);
    }
    for (const match of block.matchAll(/https:\/\/[^\s'"`]+/g)) urls.push(match[0]);
  }

  return [...new Set(urls)];
}

const TIMEOUT_MS = 15_000;

async function check(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // HEAD first — most image CDNs answer it and it saves the transfer.
    let response = await fetch(url, { method: 'HEAD', signal: controller.signal, redirect: 'follow' });
    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, { method: 'GET', signal: controller.signal, redirect: 'follow' });
    }
    const type = response.headers.get('content-type') ?? '';
    if (!response.ok) return { ok: false, note: `HTTP ${response.status}` };
    if (!type.startsWith('image/')) return { ok: false, note: `not an image (${type || 'no content-type'})` };
    return { ok: true, note: type };
  } catch (error) {
    return { ok: false, note: error.name === 'AbortError' ? `timed out after ${TIMEOUT_MS}ms` : error.message };
  } finally {
    clearTimeout(timer);
  }
}

const urls = configuredUrls();

console.log('\n\x1b[1mcover photos\x1b[0m — checking every URL in PHOTO_COVERS');

if (!urls.length) {
  console.log('\n  \x1b[33m!\x1b[0m No photo covers configured.');
  console.log('      Every meetup draws a themed cover instead — that is a supported setup,');
  console.log('      not a gap. Add URLs to PHOTO_COVERS in src/lib/media/covers.ts to use');
  console.log('      photography, remembering to allowlist the host in next.config.ts.\n');
  process.exit(0);
}

console.log('');
const results = await Promise.all(urls.map(async (url) => ({ url, ...(await check(url)) })));

for (const r of results) {
  const icon = r.ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
  console.log(`  ${icon} ${r.url}\n      ${r.note}`);
}

const broken = results.filter((r) => !r.ok);
console.log('');
if (broken.length) {
  console.log(`\x1b[31m${broken.length} of ${results.length} cover photos are unreachable.\x1b[0m`);
  console.log('Those meetups will fall back to a drawn cover for every visitor.\n');
  process.exit(1);
}
console.log(`\x1b[32mAll ${results.length} cover photos resolve.\x1b[0m\n`);
