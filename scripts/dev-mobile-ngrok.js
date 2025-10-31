'use strict';

const path = require('path');
const { spawn } = require('child_process');
const net = require('net');
const ngrok = require('ngrok');
let localtunnel; // cargado bajo demanda para fallback

async function wait(ms) { return new Promise(res => setTimeout(res, ms)); }
async function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host: '127.0.0.1' });
    socket.setTimeout(800);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
  });
}

async function chooseBackendPort() {
  if (await isPortOpen(3000)) return 3000;
  if (await isPortOpen(3001)) return 3001;
  return 3000;
}

async function main() {
  const raiz = path.resolve(__dirname, '..');
  const backendDir = path.join(raiz, 'backend');
  const frontendDir = path.join(raiz, 'frontend');
  // Resolver DB_CLIENT para que coincida con el entorno usado al registrar
  const fs = require('fs');
  const args = process.argv.slice(2);
  let dbClient = (process.env.DB_CLIENT || '').toLowerCase();
  const cliDb = (args.find(a => a.startsWith('--db=')) || '').split('=')[1];
  if (cliDb === 'pg') dbClient = 'postgres';
  else if (cliDb === 'mysql') dbClient = 'mysql';
  if (!dbClient) {
    try {
      const targetPath = path.join(frontendDir, '.db_target');
      const target = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8').trim() : '';
      if (target === 'pg') dbClient = 'postgres';
      else if (target === 'mysql') dbClient = 'mysql';
    } catch {}
  }
  if (!dbClient) dbClient = 'mysql';

  console.log('Iniciando backend...');
  const backend = spawn('node', ['servidor.js'], {
    cwd: backendDir,
    stdio: 'inherit',
    env: { ...process.env, DB_CLIENT: dbClient, DEV_EXPOSE_CODES: 'true' },
    shell: process.platform === 'win32',
  });

  await wait(1500);
  const port = await chooseBackendPort();
  console.log(`Detectando backend en puerto ${port}...`);

  console.log('Creando túnel público con ngrok...');
  let publicUrl;
  try {
    const token = process.env.NGROK_AUTHTOKEN || process.env.NGROK_TOKEN;
    if (token) {
      try { await ngrok.authtoken(token); } catch {}
    }
    publicUrl = await ngrok.connect({ addr: port, proto: 'http' });
    console.log(`Backend expuesto públicamente en: ${publicUrl}`);
  } catch (e) {
    console.error('Fallo al iniciar túnel ngrok, aplicando fallback a LocalTunnel...', e && e.body ? e.body : e.message || e);
    try { localtunnel = require('localtunnel'); } catch {}
    if (!localtunnel) {
      console.error('LocalTunnel no está disponible para fallback. Instálalo: npm i -D localtunnel');
      process.exit(1);
    }
    const tunnel = await localtunnel({ port, allow_invalid_cert: true });
    publicUrl = tunnel.url;
    console.log(`Backend expuesto públicamente (fallback LocalTunnel) en: ${publicUrl}`);
  }

  console.log(`Iniciando Expo (modo túnel) para móvil... (DB_CLIENT=${dbClient})`);
  const mobile = spawn('npm', ['run', 'mobile', '--', '--tunnel'], {
    cwd: frontendDir,
    env: { ...process.env, EXPO_PUBLIC_API_URL: publicUrl },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  const shutdown = async () => {
    console.log('\nCerrando procesos...');
    try { backend.kill('SIGINT'); } catch {}
    try { mobile.kill('SIGINT'); } catch {}
    try { await ngrok.disconnect(publicUrl); await ngrok.kill(); } catch {}
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  mobile.on('exit', shutdown);
}

main();

