'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function obtenerIpLocal() {
  const interfaces = os.networkInterfaces();
  const preferidas = ['Wi-Fi', 'Ethernet', 'en0', 'wlan0', 'eth0'];
  const direcciones = [];

  for (const [nombre, lista] of Object.entries(interfaces)) {
    for (const detalle of lista || []) {
      if (detalle.family === 'IPv4' && !detalle.internal) {
        direcciones.push({ nombre, direccion: detalle.address });
      }
    }
  }

  if (direcciones.length === 0) {
    console.error('No se encontró una IP IPv4 externa. Verifica tu conexión de red.');
    process.exit(1);
  }

  const preferida = direcciones.find(d => preferidas.includes(d.nombre));
  return (preferida || direcciones[0]).direccion;
}

function resolverObjetivoBD(argv, rutaEstado) {
  const directo = argv.find(a => a === 'pg' || a === 'mysql');
  const conFlag = argv.find(a => a.startsWith('--db='));
  let objetivo;

  if (directo) {
    objetivo = directo;
  } else if (conFlag) {
    objetivo = conFlag.split('=')[1];
  } else {
    const actual = fs.existsSync(rutaEstado) ? fs.readFileSync(rutaEstado, 'utf8').trim() : 'pg';
    objetivo = actual === 'pg' ? 'mysql' : 'pg';
  }

  if (!['pg', 'mysql'].includes(objetivo)) {
    console.error('Valor de BD no válido. Usa "pg" o "mysql".');
    process.exit(1);
  }

  fs.writeFileSync(rutaEstado, objetivo, 'utf8');
  return objetivo;
}

function main() {
  const raiz = path.resolve(__dirname, '..');
  const rutaEstado = path.join(raiz, '.db_target');
  const objetivo = resolverObjetivoBD(process.argv.slice(2), rutaEstado);

  const PUERTOS = { pg: 3000, mysql: 3001 };
  const ip = obtenerIpLocal();
  const apiUrl = `http://${ip}:${PUERTOS[objetivo]}`;

  console.log(`Usando base de datos: ${objetivo.toUpperCase()} -> ${apiUrl}`);
  console.log('Arrancando Expo en modo LAN para uso con Expo Go...');

  const child = spawn('npm', ['run', 'start', '--', '--lan'], {
    cwd: raiz,
    env: { ...process.env, EXPO_PUBLIC_API_URL: apiUrl },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  child.on('exit', code => process.exit(code));
}

main();

