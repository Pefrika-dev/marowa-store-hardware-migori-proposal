/**
 * Build a clean static Netlify publish directory.
 *
 * Only runtime files are copied to dist/. Proposal documents, backend
 * references, source-image candidates and the local Node server are not
 * published. Run with: npm run build:netlify
 */
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = dirname(scriptDir);
const dist = join(root, 'dist');

const pages = [
  'index.html',
  'products.html',
  'product-details.html',
  'categories.html',
  'brands.html',
  'quotation.html',
  'cart.html',
  'contact.html',
  'credits.html',
  'admin.html',
  'login.html'
];

const directories = ['css', 'js', join('assets', 'img'), join('assets', 'fonts')];
const files = ['robots.txt', 'sitemap.xml', join('assets', 'favicon.svg')];

const headers = `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Content-Security-Policy: default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; img-src 'self' data:; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'sha256-BkKP2XO6WOEc3kXOiLr2ZoY83hamalKjPY9xBcbXVuw='; connect-src 'self'

/*.html
  Cache-Control: public, max-age=0, must-revalidate

/assets/*
  Cache-Control: public, max-age=86400
`;

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await Promise.all(
  pages.map((page) => cp(join(root, page), join(dist, page))),
  ...directories.map((directory) =>
    cp(join(root, directory), join(dist, directory), { recursive: true })
  ),
  ...files.map((file) => cp(join(root, file), join(dist, file)))
);

await writeFile(join(dist, '_headers'), headers, 'utf8');

console.log(`Netlify build ready: ${pages.length} pages and runtime assets in dist/`);
