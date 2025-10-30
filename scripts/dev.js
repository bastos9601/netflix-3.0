'use strict';

const { spawn } = require('child_process');
const path = require('path');

function spawnProc(cmd, args, opts) {
  const child = spawn(cmd, args, {
    ...opts,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  child.on('exit', (code) => console.log(`${cmd} exited with code ${code}`));
  return child;
}

function main() {
  const raiz = path.resolve(__dirname, '..');
  const backendDir = path.join(raiz, 'backend');
  const frontendDir = path.join(raiz, 'frontend');

  console.log('Iniciando backend (PostgreSQL, puerto 3000)...');
  const backend = spawnProc('node', ['servidor.js'], { cwd: backendDir });

  // Espera breve para que el backend arranque antes del frontend
  setTimeout(() => {
    console.log('Iniciando frontend (Expo Go LAN) apuntando a Postgres...');
    const frontend = spawnProc('node', ['scripts/mobile.js', 'pg'], { cwd: frontendDir });

    const shutdown = () => {
      console.log('\nCerrando procesos...');
      try { backend.kill('SIGINT'); } catch {}
      try { frontend.kill('SIGINT'); } catch {}
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }, 1500);
}

main();

