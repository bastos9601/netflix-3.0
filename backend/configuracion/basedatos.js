// Capa de base de datos con soporte para MySQL y Postgres.
// Mantiene la API pool.query(sql, params) devolviendo [rows] para compatibilidad.
require('dotenv').config();
const mysql = require('mysql2/promise');
let PgPool;
try { PgPool = require('pg').Pool; } catch (_) { /* pg puede no estar instalado */ }

const dbClient = (process.env.DB_CLIENT || 'mysql').toLowerCase();

function resolveEnv(varNames, fallback) {
  for (const name of varNames) {
    if (process.env[name]) return process.env[name];
  }
  return fallback;
}

let pool;

if (dbClient === 'postgres' && PgPool) {
  const host = resolveEnv(['PGHOST', 'DB_HOST', 'MYSQL_HOST'], 'localhost');
  const user = resolveEnv(['PGUSER', 'DB_USER', 'MYSQL_USER'], 'postgres');
  const password = resolveEnv(['PGPASSWORD', 'DB_PASSWORD', 'MYSQL_PASSWORD'], '');
  const database = resolveEnv(['PGDATABASE', 'DB_NAME', 'MYSQL_DB'], 'netflix_clon');
  const port = Number(resolveEnv(['PGPORT', 'DB_PORT'], 5432));

  const pgPool = new PgPool({ host, user, password, database, port, max: 10 });

  pool = {
    dbType: 'postgres',
    async query(sql, params = []) {
      // Transformar placeholders '?' a $1, $2, ... para Postgres
      let idx = 0;
      const transformed = params.length
        ? String(sql).replace(/\?/g, () => `$${++idx}`)
        : sql;
      const result = await pgPool.query(transformed, params);
      return [result.rows];
    },
  };
} else {
  // Configuración MySQL por defecto
  const mysqlPool = mysql.createPool({
    host: resolveEnv(['MYSQL_HOST', 'DB_HOST'], 'localhost'),
    user: resolveEnv(['MYSQL_USER', 'DB_USER'], 'root'),
    password: resolveEnv(['MYSQL_PASSWORD', 'DB_PASSWORD'], ''),
    database: resolveEnv(['MYSQL_DB', 'DB_NAME'], 'netflix_clon'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  pool = {
    dbType: 'mysql',
    async query(sql, params = []) {
      return mysqlPool.query(sql, params);
    },
  };
}

module.exports = pool;
