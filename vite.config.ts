import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * يحقن قائمة ملفات البناء الفعلية في عامل الخدمة.
 *
 * نكتبها بعد البناء لا قبله، لان اسماء الاصول مبصومة بتجزئة تتغيّر
 * مع كل بناء، فأي قائمة مكتوبة يدويا ستصبح قديمة بصمت وتُبقي الشاشة
 * تُقلع على نسخة سابقة.
 */
function serviceWorkerPrecache(): Plugin {
  return {
    name: 'mosque-display-sw-precache',
    apply: 'build',
    closeBundle() {
      const dist = join(process.cwd(), 'dist');
      const swPath = join(dist, 'sw.js');

      const files: string[] = [];
      const walk = (dir: string) => {
        for (const entry of readdirSync(dir)) {
          const full = join(dir, entry);
          if (statSync(full).isDirectory()) walk(full);
          else files.push(relative(dist, full).split(sep).join('/'));
        }
      };
      walk(dist);

      const precache = files
        .filter((f) => f !== 'sw.js')
        .sort();

      const version = createHash('sha256')
        .update(precache.join('|'))
        .digest('hex')
        .slice(0, 12);

      const raw = readFileSync(swPath, 'utf8');

      // نتحقق ان كل رمز يظهر مرة واحدة تماما: لو تسرّب الى تعليق
      // لاستبدل الاول وبقي الكود الحقيقي كما هو، فينهار العامل بصمت
      for (const token of ['__VERSION__', '__PRECACHE__']) {
        const hits = raw.split(token).length - 1;
        if (hits !== 1) {
          throw new Error(`sw.js: الرمز ${token} ظهر ${hits} مرة، والمتوقع مرة واحدة`);
        }
      }

      const source = raw
        .replace('__VERSION__', version)
        .replace('__PRECACHE__', JSON.stringify(precache, null, 2));

      writeFileSync(swPath, source);
      this.info?.(`service worker: ${precache.length} ملفا، النسخة ${version}`);
    },
  };
}

export default defineConfig({
  plugins: [react(), serviceWorkerPrecache()],
  base: './',
  server: { host: true, port: 5173 },
  build: { target: 'es2020', assetsInlineLimit: 0 },
});
