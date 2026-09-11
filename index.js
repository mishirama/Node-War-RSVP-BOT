// Root launcher for hosting platforms (Wispbyte, Pterodactyl, Render, VPS)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const distServer = path.join(process.cwd(), 'dist', 'server.cjs');

if (fs.existsSync(distServer)) {
  require(distServer);
} else {
  console.log('Production build not found. Running dev server via tsx...');
  const { spawn } = await import('node:child_process');
  const child = spawn('npx', ['tsx', 'server.ts'], { stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code || 0));
}
