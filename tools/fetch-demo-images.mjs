/**
 * Fetches demonstration photography from Pexels for the Marowa Store concept.
 * Pexels licence: https://www.pexels.com/license/
 *
 * This script is a development utility. It is not used at runtime.
 * Run: node tools/fetch-demo-images.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const outDir = path.join(root, 'assets', 'candidates');
fs.mkdirSync(outDir, { recursive: true });

const queries = {
  hero: 'hardware store tools',
  'cat-power': 'power tools workshop',
  'cat-hand': 'hand tools workbench',
  'cat-hardware': 'hardware tools assortment',
  'cat-electrical': 'electrical supplies cables',
  'cat-plumbing': 'plumbing pipes fittings',
  'cat-building': 'building materials construction',
  'cat-paint': 'paint roller painting',
  'cat-safety': 'safety equipment helmet gloves',
  'cat-fasteners': 'screws bolts fasteners',
  drill: 'cordless drill',
  grinder: 'angle grinder',
  tape: 'measuring tape',
  hammer: 'claw hammer',
  screwdriver: 'screwdriver set',
  extension: 'extension cord cable',
  switch: 'light switch socket',
  pvc: 'pvc pipe',
  fittings: 'pipe fittings',
  roller: 'paint roller',
  wrench: 'adjustable wrench',
  screws: 'construction screws',
  store: 'hardware store interior'
};

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml'
};

const manifest = [];

for (const [key, query] of Object.entries(queries)) {
  const url = `https://www.pexels.com/search/${encodeURIComponent(query)}/`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    let items = [];
    for (const block of blocks) {
      try {
        const data = JSON.parse(block[1]);
        if (data?.mainEntity?.itemListElement) {
          items = data.mainEntity.itemListElement.map((x) => x.item).filter(Boolean);
          break;
        }
      } catch {
        /* ignore malformed blocks */
      }
    }
    items = items.slice(0, 5);
    let i = 0;
    for (const item of items) {
      i += 1;
      if (!item.contentUrl) continue;
      const file = `${key}-${i}.jpg`;
      const imgRes = await fetch(`${item.contentUrl}?auto=compress&cs=tinysrgb&w=1100`, { headers });
      if (!imgRes.ok) continue;
      const buf = Buffer.from(await imgRes.arrayBuffer());
      fs.writeFileSync(path.join(outDir, file), buf);
      manifest.push({
        key,
        query,
        file,
        title: item.name,
        description: item.description,
        photographer: item.creditText,
        source: item.url,
        licence: item.license || 'https://www.pexels.com/license/'
      });
      console.log(`saved ${file} — ${item.name}`);
    }
  } catch (err) {
    console.error(`FAILED ${key}: ${err.message}`);
  }
}

fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`\n${manifest.length} images saved to ${outDir}`);
