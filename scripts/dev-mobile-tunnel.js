'use strict';

const path = require('path');
const { spawn } = require('child_process');
const net = require('net');

async function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

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
  // Prefer 3000; if not open, try 3001
  if (await isPortOpen(3000)) return 3000;
  if (await isPortOpen(3001)) return 3001;
  // If neither open yet, assume 3000 (default) and let it come up
  return 3000;
}

async function main() {
  const raiz = path.resolve(__dirname, '..');
  const backendDir = path.join(raiz, 'backend');
  const frontendDir = path.join(raiz, 'frontend');

  console.log('Iniciando backend...');
  const backend = spawn('node', ['servidor.js'], {
    cwd: backendDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  // Espera breve para que el backend arranque
  await wait(1500);
  const port = await chooseBackendPort();
  console.log(`Detectando backend en puerto ${port}...`);

  console.log('Creando túnel público con LocalTunnel...');
  let tunnel;
  try {
    const localtunnel = require('localtunnel');
    tunnel = await localtunnel({ port, allow_invalid_cert: true });
  } catch (e) {
    console.error('Error al crear túnel. ¿Instalaste localtunnel?', e.message || e);
    process.exit(1);
  }
  const publicUrl = tunnel.url;
  console.log(`Backend expuesto públicamente en: ${publicUrl}`);

  console.log('Iniciando Expo (modo túnel) para móvil...');
  const mobile = spawn('npm', ['run', 'mobile', '--', '--tunnel'], {
    cwd: frontendDir,
    env: { ...process.env, EXPO_PUBLIC_API_URL: publicUrl },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  const shutdown = () => {
    console.log('\nCerrando procesos...');
    try { backend.kill('SIGINT'); } catch {}
    try { mobile.kill('SIGINT'); } catch {}
    try { tunnel.close(); } catch {}
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  mobile.on('exit', shutdown);
}

main();

