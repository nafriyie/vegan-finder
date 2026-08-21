#!/usr/bin/env node
/**
 * Injects PWA metadata into the exported web build.
 *
 * Why this exists instead of app/+html.tsx: that file is only honoured when
 * `expo.web.output` is "static", which statically pre-renders every route. This
 * app is entirely client-driven (geolocation, localStorage, live map), so the
 * pre-rendered HTML never matches what the client renders and React fails
 * hydration with error #418. Worse, when the bundle fails to execute at all the
 * pre-rendered HTML still looks like a working app, which makes real breakage
 * very hard to spot.
 *
 * So the project uses `output: "single"` (a plain SPA shell) and adds the PWA
 * tags here. Run automatically by `npm run export:web`.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const INDEX = path.resolve('dist/index.html');

const HEAD_TAGS = `
    <meta name="description" content="Discover vegan restaurants near you." />
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#2E8B57" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="Vegan Finder" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <style>
      html, body, #root { background-color: #FFFFFF; overscroll-behavior: none; }
    </style>`;

// viewport-fit=cover lets the map reach into the safe areas around the notch /
// Dynamic Island. maximum-scale=1 stops iOS zooming the page when the location
// search input takes focus.
const VIEWPORT =
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />';

async function main() {
  if (!existsSync(INDEX)) {
    console.error(`inject-pwa-head: ${INDEX} not found — run "expo export -p web" first.`);
    process.exit(1);
  }

  let html = await readFile(INDEX, 'utf8');

  if (html.includes('rel="manifest"')) {
    console.log('inject-pwa-head: already injected, skipping.');
    return;
  }

  // Expo's SPA template ships a viewport without viewport-fit; replace it.
  const before = html;
  html = html.replace(/<meta name="viewport"[^>]*\/?>/, VIEWPORT);
  if (html === before) {
    console.warn('inject-pwa-head: no viewport tag found to replace.');
  }

  if (!html.includes('</head>')) {
    console.error('inject-pwa-head: no </head> in index.html; aborting.');
    process.exit(1);
  }
  html = html.replace('</head>', `${HEAD_TAGS}\n  </head>`);

  await writeFile(INDEX, html, 'utf8');

  for (const needle of ['rel="manifest"', 'apple-touch-icon', 'viewport-fit=cover']) {
    if (!html.includes(needle)) {
      console.error(`inject-pwa-head: verification failed, missing ${needle}`);
      process.exit(1);
    }
  }
  console.log('inject-pwa-head: PWA metadata injected into dist/index.html');
}

main();
