// Root launcher for hosting platforms (Wispbyte, Pterodactyl, Render, VPS)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync, spawn } from 'node:child_process';

const require = createRequire(import.meta.url);
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const distServer = path.join(process.cwd(), 'dist', 'server.cjs');
const rootServer = path.join(process.cwd(), 'server.cjs');

if (fs.existsSync(distServer)) {
  require(distServer);
} else if (fs.existsSync(rootServer)) {
  require(rootServer);
} else {
  console.log('Compiled server bundle not found. Compiling backend with esbuild...');
  try {
    execSync('npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --outfile=dist/server.cjs', {
      stdio: 'inherit',
    });
    require(distServer);
  } catch (err) {
    console.log('Fast build failed, falling back to tsx with NODE_ENV=production...', err);
    const child = spawn('npx', ['tsx', 'server.ts'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' },
    });
    child.on('exit', (code) => process.exit(code || 0));
  }
}
