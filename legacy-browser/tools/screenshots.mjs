/**
 * Lightweight smoke tool for the built game.
 *
 * Usage: `npm run screenshot`
 *    1. builds (if needed) and starts `vite preview`
 *    2. fetches the index and asserts the bundle assets load
 *    3. prints where to find the interactive capture harness
 *
 * Full visual capture (real frames of the running game) is done through the
 * browser tool in the dev harness — see tools/vision/README.md.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORT = 4987;
const BASE = process.env.VITE_BASE_PATH || './';

const children = [];

function startPreview() {
  const viteBin = join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js');
  const proc = spawn(process.execPath, [viteBin, 'preview', '--host', '127.0.0.1', '--port', String(PORT)], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let out = '';
  const collect = (d) => (out += String(d));
  proc.stdout.on('data', collect);
  proc.stderr.on('data', collect);
  children.push(proc);
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`preview timed out:\n${out}`)), 20000);
    const check = () => {
      if (/http:\/\/127\.0\.0\.1:(?:\x1b\[[0-9;]*m)*\d+(?:\x1b\[[0-9;]*m)*\//.test(out)) {
        clearTimeout(t);
        resolve(proc);
      }
    };
    proc.stdout.on('data', check);
    proc.stderr.on('data', check);
  });
}

async function main() {
  const dir = mkdtempSync(join(tmpdir(), 'kotodama-smoke-'));
  const proc = await startPreview();
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/`);
    if (!res.ok) throw new Error(`index status ${res.status}`);
    const html = await res.text();
    const assets = [...html.matchAll(/(?:src|href)="\.?(\/assets\/[^"]+)"/g)].map((m) => m[1]);
    if (!assets.length) throw new Error('no assets referenced in index.html');
    for (const asset of assets) {
      const r = await fetch(`http://127.0.0.1:${PORT}${asset}`);
      if (!r.ok) throw new Error(`${asset} -> ${r.status}`);
    }
    console.log(`✔ preview smoke passed on :${PORT} (${assets.length} assets OK)`);
    console.log('  Serve: `npm run preview` then open http://localhost:4173/');
    console.log('  Visual capture harness: read tools/vision/README.md');
  } finally {
    proc.kill();
    rmSync(dir, { recursive: true, force: true });
  }
}

main().catch((e) => {
  console.error('✖ smoke failed:', e.message);
  process.exit(1);
});
