#!/usr/bin/env node
/**
 * Fetches one real, freely-licensed photograph per city into `public/cities`.
 *
 *   node scripts/city-photos.mjs <slug>:<Wikipedia article> ...
 *   node scripts/city-photos.mjs --all        (re-fetch every slug in ARTICLES)
 *
 * How the pictures in `src/lib/media/city-photos.ts` are made, so that adding a
 * city is a command rather than an afternoon of right-clicking. For each city it
 * takes the lead image of the named Wikipedia article — the city's own where
 * that article leads with a photograph, and a named landmark inside the same
 * district where it leads with a montage or a map, which is most Indian city
 * articles — reads the artist and the licence off Commons, downloads the 960px
 * thumbnail, and centre-crops it to the 16:10 the card draws.
 *
 * It prints the `CITY_PHOTOS` entries to stdout. They are pasted, not written
 * back: the map is source that gets read and argued with, and a script that
 * rewrites it would make a bad article choice invisible.
 *
 * Wikimedia throttles unidentified clients hard, hence the User-Agent and the
 * one-at-a-time pacing. Verify the result with `npm run media:check`.
 */
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/cities');
const UA = 'CampusClub-city-photos/1.0 (+https://github.com/; repository maintenance script)';

/** Card geometry: the aspect the CityCard reserves, at the width it draws at. */
const WIDTH = 960;
const HEIGHT = 600;

/**
 * Which article each city is photographed from.
 *
 * A landmark rather than the city wherever the city's own article leads with a
 * montage: a four-up collage shrunk into a card is unreadable, and the point of
 * the picture is to make one place legible, not to summarise a metropolis.
 */
const ARTICLES = {
  /* The metros. Already in the map — re-run these only to replace the file. */
  delhi: 'Delhi',
  mumbai: 'Mumbai',
  kolkata: 'Kolkata',
  chennai: 'Chennai',
  bengaluru: 'Bengaluru',
  hyderabad: 'Hyderabad',
  pune: 'Pune',
  ahmedabad: 'Ahmedabad',

  /* Tier-2. */
  jaipur: 'Hawa Mahal',
  lucknow: 'Rumi Darwaza',
  kanpur: 'Kanpur Memorial Church',
  varanasi: 'Dashashwamedh Ghat',
  agra: 'Taj Mahal',
  nagpur: 'Deekshabhoomi',
  nashik: 'Kalaram Temple',
  indore: 'Rajwada',
  bhopal: 'Taj-ul-Masajid',
  patna: 'Golghar',
  surat: 'Surat',
  vadodara: 'Lakshmi Vilas Palace, Vadodara',
  coimbatore: 'Coimbatore',
  madurai: 'Meenakshi Temple',
  kochi: 'Fort Kochi',
  thiruvananthapuram: 'Padmanabhaswamy Temple',
  visakhapatnam: 'Kailasagiri',
  vijayawada: 'Prakasam Barrage',
  mysuru: 'Mysore Palace',
  chandigarh: 'Rock Garden of Chandigarh',
  ludhiana: 'Ludhiana',
  amritsar: 'Golden Temple',
  bhubaneswar: 'Lingaraja Temple',
  guwahati: 'Kamakhya Temple',
  dehradun: 'Forest Research Institute (India)',
  raipur: 'Raipur',
  ranchi: 'Jagannath Temple, Ranchi',
  jodhpur: 'Mehrangarh',

  /* The two district towns. */
  mainpuri: 'Mainpuri district',
  etawah: 'Etawah',
};


const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** Wikimedia answers a burst with 429s, so a refusal is backed off, not fatal. */
const api = async (params, attempt = 0) => {
  const url = new URL('https://en.wikipedia.org/w/api.php');
  for (const [k, v] of Object.entries({ format: 'json', formatversion: '2', ...params })) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if ((res.status === 429 || res.status >= 500) && attempt < 5) {
    await sleep(2000 * 2 ** attempt);
    return api(params, attempt + 1);
  }
  if (!res.ok) throw new Error(`api ${res.status}`);
  return res.json();
};

/** `<a href=…>Name</a>` and friends — the credit is stored as HTML. */
const stripTags = (html) =>
  html
    ? html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").trim()
    : null;

async function fetchCity(slug, article) {
  // pageimages gives the lead image's File: title; imageinfo on that file gives
  // both a correctly-sized thumbnail and the credit the licence requires.
  const page = await api({ action: 'query', prop: 'pageimages', piprop: 'original|name', titles: article });
  const file = page.query?.pages?.[0]?.pageimage;
  if (!file) throw new Error(`no lead image on “${article}”`);

  const info = await api({
    action: 'query',
    prop: 'imageinfo',
    iiprop: 'extmetadata|url',
    iiurlwidth: String(WIDTH),
    titles: `File:${file}`,
  });
  const image = info.query?.pages?.[0]?.imageinfo?.[0];
  if (!image?.thumburl) throw new Error(`no thumbnail for File:${file}`);

  const meta = image.extmetadata ?? {};
  const source = image.thumburl;

  const res = await fetch(source, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  mkdirSync(OUT, { recursive: true });
  const out = resolve(OUT, `${slug}.jpg`);
  await sharp(buffer)
    .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(out);

  return {
    slug,
    src: `/cities/${slug}.jpg`,
    article,
    artist: stripTags(meta.Artist?.value),
    licence: stripTags(meta.LicenseShortName?.value),
    licenceUrl: stripTags(meta.LicenseUrl?.value),
    source,
    file,
  };
}

const args = process.argv.slice(2);
const jobs =
  args.length && args[0] !== '--all'
    ? args.map((a) => {
        const i = a.indexOf(':');
        return [a.slice(0, i), a.slice(i + 1)];
      })
    : Object.entries(ARTICLES);

const done = [];
const failed = [];

for (const [slug, article] of jobs) {
  try {
    const entry = await fetchCity(slug, article);
    done.push(entry);
    console.error(`  \x1b[32m✓\x1b[0m ${slug.padEnd(20)} ${entry.file}  —  ${entry.artist ?? 'no artist'} / ${entry.licence ?? 'no licence'}`);
  } catch (error) {
    failed.push([slug, article, error.message]);
    console.error(`  \x1b[31m✗\x1b[0m ${slug.padEnd(20)} ${article}: ${error.message}`);
  }
  await sleep(350);
}

console.error('');
for (const entry of done) {
  console.log(`  ${entry.slug}: {`);
  console.log(`    src: ${JSON.stringify(entry.src)},`);
  console.log(`    article: ${JSON.stringify(entry.article)},`);
  console.log(`    artist: ${entry.artist === null ? 'null' : JSON.stringify(entry.artist)},`);
  console.log(`    licence: ${entry.licence === null ? 'null' : JSON.stringify(entry.licence)},`);
  console.log(`    licenceUrl: ${entry.licenceUrl === null ? 'null' : JSON.stringify(entry.licenceUrl)},`);
  console.log(`    source: ${JSON.stringify(entry.source)},`);
  console.log(`  },`);
}

if (failed.length) process.exit(1);
