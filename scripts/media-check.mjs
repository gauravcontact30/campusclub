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
import { existsSync, readFileSync } from 'node:fs';
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
  { file: 'src/lib/media/slides.ts', declaration: 'export const LANDING_SLIDES', end: '\n];' },
  { file: 'src/lib/media/auth.ts', declaration: 'export const AUTH_IMAGE_IDS', end: '\n} as const;' },
];

/** Every image URL inside those blocks. */
function configuredUrls() {
  const urls = [];

  for (const { file, declaration, end: terminator, key } of SOURCES) {
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
    if (key) {
      const keyed = new RegExp(`\\b${key}:\\s*['\"\`](https://[^'\"\`]+)`, 'g');
      for (const match of block.matchAll(keyed)) urls.push(match[1]);
      continue;
    }
    for (const match of block.matchAll(/https:\/\/[^\s'"`]+/g)) urls.push(match[0]);
  }

  return [...new Set(urls)];
}

const TIMEOUT_MS = 15_000;

/*
 * Wikimedia asks that automated clients identify themselves, and throttles the
 * ones that do not far harder. Without this every city photograph comes back
 * 429 and this script reports a hundred and nineteen working images as broken.
 */
const USER_AGENT = 'CampusClub-media-check/1.0 (+https://github.com/; repository maintenance script)';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function check(url, attempt = 0) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const init = {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': USER_AGENT },
    };
    // HEAD first — most image CDNs answer it and it saves the transfer.
    let response = await fetch(url, { method: 'HEAD', ...init });
    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, { method: 'GET', ...init });
    }
    // Being throttled is not the same as being broken. Back off and ask again
    // rather than reporting a working image as a dead one.
    if ((response.status === 429 || response.status >= 500) && attempt < 4) {
      clearTimeout(timer);
      await sleep(1500 * 2 ** attempt);
      return check(url, attempt + 1);
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

/*
 * City photographs are files in `public`, not remote URLs, so what can break
 * about them is a missing file rather than a dead host. Checked first because
 * it costs nothing and a blank card is the more visible failure.
 */
function checkCityPhotos() {
  const source = readFileSync(resolve(ROOT, 'src/lib/media/city-photos.ts'), 'utf8');
  const declared = [...source.matchAll(/src: "([^"]+)"/g)].map((m) => m[1]);
  if (!declared.length) return true;

  const missing = declared.filter((src) => !existsSync(resolve(ROOT, 'public', src.replace(/^[/]/, ''))));
  console.log(`\n\x1b[1mcity photographs\x1b[0m — checking every file in CITY_PHOTOS`);
  if (missing.length) {
    console.log(`\n  \x1b[31m${missing.length} of ${declared.length} are missing from public/\x1b[0m`);
    for (const src of missing) console.log(`      ${src}`);
    return false;
  }
  console.log(`\n  \x1b[32m\u2713\x1b[0m All ${declared.length} city photographs are present.`);
  return true;
}

const cityPhotosOk = checkCityPhotos();

const urls = configuredUrls();

console.log('\n\x1b[1mcover photos\x1b[0m — checking every URL in PHOTO_COVERS');

if (!urls.length) {
  console.log('\n  \x1b[33m!\x1b[0m No photo covers configured.');
  console.log('      Every meetup draws a themed cover instead — that is a supported setup,');
  console.log('      not a gap. Add URLs to PHOTO_COVERS in src/lib/media/covers.ts to use');
  console.log('      photography, remembering to allowlist the host in next.config.ts.\n');
  process.exit(cityPhotosOk ? 0 : 1);
}

console.log('');
/*
 * Checked a few at a time rather than all at once. The city photographs live on
 * Wikimedia, which rate-limits a burst of a hundred and twenty requests from
 * one address and answers the overflow with 429s — which this script would
 * then report as broken images that are in fact fine.
 */
const CONCURRENCY = 4;
const results = [];
for (let i = 0; i < urls.length; i += CONCURRENCY) {
  const batch = urls.slice(i, i + CONCURRENCY);
  results.push(...(await Promise.all(batch.map(async (url) => ({ url, ...(await check(url)) })))));
  if (i + CONCURRENCY < urls.length) await sleep(400);
}

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
if (!cityPhotosOk) process.exit(1);
