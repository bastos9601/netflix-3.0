// Este archivo configura y exporta un pool de conexiones a MySQL
// para ser reutilizado por el backend (controladores y modelos).

// 1) Carga variables de entorno desde .env en process.env
require('dotenv').config();

// 2) Usa la versión basada en promesas de mysql2
const mysql = require('mysql2/promise');

// 3) Crea un pool de conexiones para manejar eficientemente múltiples consultas
//    - Las credenciales se toman de variables de entorno con valores por defecto
//    - waitForConnections: hace que las solicitudes esperen si no hay conexiones libres
//    - connectionLimit: número máximo de conexiones simultáneas en el pool
//    - queueLimit: 0 significa cola ilimitada para solicitudes en espera
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DB || 'netflix_clon',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 4) Exporta el pool para que otras partes del backend lo utilicen
module.exports = pool;