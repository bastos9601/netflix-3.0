require('dotenv').config();
const express = require('express');
const cors = require('cors');

const rutasContenidos = require('./rutas/contenidos');
const rutasAuth = require('./rutas/autenticacion');
const rutasPerfiles = require('./rutas/perfiles');
const rutasReproduccion = require('./rutas/reproduccion');
const rutasMiLista = require('./rutas/miLista');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Inicializar BD (crear tablas si no existen)
const pool = require('./configuracion/basedatos');
async function inicializarBD() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        correo VARCHAR(255) NOT NULL,
        clave_hash VARCHAR(255) NOT NULL,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_correo (correo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS perfiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        avatar VARCHAR(16) NULL,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS progreso_visualizacion (
        perfil_id INT NOT NULL,
        tipo VARCHAR(16) NOT NULL,
        contenido_id VARCHAR(32) NOT NULL,
        segundo INT NOT NULL,
        PRIMARY KEY (perfil_id, tipo, contenido_id),
        FOREIGN KEY (perfil_id) REFERENCES perfiles(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mi_lista (
        perfil_id INT NOT NULL,
        tipo VARCHAR(16) NOT NULL,
        contenido_id VARCHAR(32) NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        poster VARCHAR(500) NULL,
        agregado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (perfil_id, tipo, contenido_id),
        FOREIGN KEY (perfil_id) REFERENCES perfiles(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    // Asegurar columnas/índices en instalaciones previas
    try { await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS clave_hash VARCHAR(255) NOT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE usuarios ADD UNIQUE KEY IF NOT EXISTS uniq_correo (correo)`); } catch (e) {}
    console.log('Tabla usuarios verificada/creada.');
  } catch (e) {
    console.error('Error inicializando BD:', e.message);
  }
}

app.get('/estado', (req, res) => {
  res.json({ ok: true });
});

// Rutas
app.use('/autenticacion', rutasAuth);
app.use('/perfiles', rutasPerfiles);
app.use('/contenidos', rutasContenidos);
app.use('/reproduccion', rutasReproduccion);
app.use('/mi-lista', rutasMiLista);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await inicializarBD();
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});