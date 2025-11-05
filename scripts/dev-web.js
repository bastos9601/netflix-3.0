'use strict';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

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
  // Resolver objetivo de BD desde variable de entorno o archivo de estado del frontend
  const targetPath = path.join(frontendDir, '.db_target');
  const targetRaw = (process.env.DB_TARGET || (fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8').trim() : 'pg')).toLowerCase();
  const objetivo = targetRaw === 'mysql' ? 'mysql' : 'pg';

  const PUERTOS = { pg: 3000, mysql: 3001 };
  const backendPort = PUERTOS[objetivo];
  const dbClient = objetivo === 'mysql' ? 'mysql' : 'postgres';

  console.log(`Iniciando backend (${dbClient.toUpperCase()}, puerto ${backendPort})...`);
  const backend = spawnProc('node', ['servidor.js'], {
    cwd: backendDir,
    env: { ...process.env, PORT: String(backendPort), DB_CLIENT: dbClient },
  });

  // Espera breve para que el backend arranque antes del frontend web
  setTimeout(() => {
    console.log(`Iniciando frontend web (Expo) en puerto 8082 apuntando a http://localhost:${backendPort} ...`);
    const frontend = spawnProc('npm', ['run', 'web', '--', '--port', '8082'], {
      cwd: frontendDir,
      env: { ...process.env, EXPO_PUBLIC_API_URL: `http://localhost:${backendPort}`, EXPO_PUBLIC_DB_TARGET: objetivo },
    });

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
