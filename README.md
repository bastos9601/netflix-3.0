# Netflix 3.0 — Clon Full‑Stack (Expo + Express)

Proyecto educativo que replica funcionalidades clave de Netflix con un frontend en Expo (React Native/Web) y un backend en Express. Soporta MySQL y PostgreSQL, e integra la API de TMDB para contenidos (populares, búsqueda, detalles y videos/tráilers).

## Tecnologías usadas

- Frontend: `Expo 54`, `React Native 0.81`, `React 19`, `react-native-web`, `expo-av` (reproducción de video), `expo-status-bar`
- Backend: `Node.js`, `Express 5`, `cors`, `dotenv`, `axios`
- Seguridad: `bcryptjs` (hash de contraseñas), `jsonwebtoken` (JWT)
- Base de datos: `MySQL` (`mysql2/promise`) o `PostgreSQL` (`pg`), seleccionable por env
- API externa: `TMDB` (The Movie Database)

## ¿Cómo funciona?

- Autenticación: el backend expone endpoints de registro/inicio de sesión y entrega un `JWT`. El middleware `verificarToken` protege rutas privadas (perfiles, progreso, Mi Lista).
- Perfiles: cada usuario puede crear/editar/eliminar perfiles. Se listan con el token del usuario.
- Contenidos: el backend consulta la API de TMDB para tendencias, búsqueda, detalles de series y videos. También hay fuentes locales de prueba (`data/peliculas.json` y `data/series.json`).
- Reproducción: el frontend usa `expo-av` para reproducir videos; el backend guarda/lee progreso de visualización por perfil. La vista de detalle unifica el reproductor y evita superposiciones que silencian el audio.
- Mi Lista: se agregan/quitan títulos asociados a un perfil y se guardan en la base de datos.
- Configuración de API: el frontend detecta automáticamente el host del backend en desarrollo (localhost, IP Expo, `10.0.2.2` en emulador Android) y permite override con `EXPO_PUBLIC_API_URL`.

## Requisitos

- Node.js 18+ y npm
- MySQL o PostgreSQL (con un usuario con permisos de lectura/escritura)
- Clave de API de TMDB

## Instalación y ejecución

### 1) Backend

- Ir al directorio `backend` e instalar dependencias:

  ```bash
  cd backend
  npm install
  ```

- Crear un archivo `.env` en `backend/` con variables (elige MySQL o Postgres):

  ```env
  PORT=3000
  # Selección del cliente de BD: 'mysql' | 'postgres'
  DB_CLIENT=mysql
  # Variables MySQL (si DB_CLIENT=mysql)
  MYSQL_HOST=localhost
  MYSQL_USER=root
  MYSQL_PASSWORD=tu_password
  MYSQL_DB=netflix_clon
  # Variables Postgres (si DB_CLIENT=postgres)
  PGHOST=localhost
  PGUSER=postgres
  PGPASSWORD=tu_password
  PGDATABASE=netflix_clon
  PGPORT=5432
  # Seguridad y APIs
  JWT_SECRETO=un_secreto_seguro
  TMDB_API_KEY=tu_api_key_de_tmdb
  
  # SMTP para enviar correos (obligatorio para "Olvidaste la contraseña" y "Código de inicio")
  SMTP_HOST=smtp.tu_proveedor.com
  SMTP_PORT=587
  SMTP_USER=tu_usuario
  SMTP_PASS=tu_password
  SMTP_FROM="Netflix Clon <no-reply@tu_dominio.com>"
  # Opcional: exponer códigos en respuestas para desarrollo
  DEV_EXPOSE_CODES=false
  ```

- Asegúrate de que la base de datos `netflix_clon` exista (el servidor creará tablas si no existen) en el motor que elijas.

- Iniciar el servidor:

  ```bash
  npm start
  ```

- Endpoints principales disponibles (prefijo `http://localhost:3000`):
  - `GET /estado` — health check
  - `POST /autenticacion/registro` — registro
  - `POST /autenticacion/ingreso` — inicio sesión
  - `GET /perfiles` — listar perfiles (JWT)
  - `POST /perfiles` — crear perfil (JWT)
  - `PUT /perfiles/:id` — actualizar perfil (JWT)
  - `DELETE /perfiles/:id` — eliminar perfil (JWT)
  - `GET /contenidos/populares?tipo=movie|tv|all&periodo=day|week`
  - `GET /contenidos/buscar?q=texto&tipo=multi|movie|tv`
  - `GET /contenidos/:tipo/:id/videos`
  - `GET /contenidos/tv/:id` y `GET /contenidos/tv/:id/temporada/:n`
  - `GET /contenidos/local/pelicula` y `GET /contenidos/local/serie`
  - `GET/POST /reproduccion/progreso` (JWT)
  - `POST /mi-lista/:perfilId/agregar` — agregar a Mi Lista (JWT)
  - `DELETE /mi-lista/:perfilId/quitar/:contenidoId` — quitar de Mi Lista (JWT)
  - `GET /mi-lista/:perfilId` — obtener Mi Lista (JWT)

### 2) Frontend (Expo)

- Ir al directorio `frontend` e instalar dependencias:

  ```bash
  cd frontend
  npm install
  ```

- Iniciar en modo desarrollo:

  ```bash
  npm run start      # Expo Dev Tools
  npm run web        # Ejecutar en navegador
  npm run android    # Abrir emulador Android (si está configurado)
  npm run ios        # Abrir simulador iOS (en macOS)
  ```

- El frontend intentará conectarse al backend automáticamente:
  - Web/iOS: `http://localhost:3000`
  - Android (emulador): `http://10.0.2.2:3000`
  - Expo (en red local): detecta la IP del host; si necesitas forzar la URL, define `EXPO_PUBLIC_API_URL` antes de iniciar Expo.

  Ejemplo (Windows PowerShell) para forzar la URL del backend:
  
  ```powershell
  $env:EXPO_PUBLIC_API_URL = "http://TU_IP_LOCAL:3000"
  npm run start
  ```

## Estructura del proyecto

```
backend/
  configuracion/
    basedatos.js        # Pool con soporte MySQL/Postgres (según env)
    tmdb.js             # Cliente TMDB
  rutas/                # Definición de endpoints
  controladores/        # Lógica de negocio
  middlewares/
    autenticacion.js    # Verificación JWT
  modelos/              # Tablas/entidades (Perfil, Usuario, Progreso)
  data/                 # Fuentes locales (JSON)
  servidor.js           # App Express y bootstrapping

frontend/
  componentes/          # UI reutilizable (Banner, Fila, etc.)
  pantallas/            # Vistas (Inicio, Detalle, MiNetflix, Perfiles)
  navegacion/           # Navegador principal
  contextos/            # Contexto de autenticación
  servicios/            # `api.js` y almacenamiento
  configuracion.js      # Deducción BASE_URL y override por env
  App.js / index.js     # Entrada Expo
```

## Flujo de uso (resumen)

- Registro/inicio de sesión para obtener `token` (JWT).
- Creación/selección de perfil.
- Navegar por populares, buscar títulos, ver detalles y reproducir.
- Agregar/quitar elementos en “Mi Lista” por perfil.
- El progreso de reproducción se guarda y consulta por perfil.

## Scripts útiles

- Backend:
  - `npm start` — inicia Express en el puerto `PORT` (por defecto `3000`).
- Frontend:
  - `npm run start` — arranca Expo Dev Tools.
  - `npm run web` — corre en navegador.
  - `npm run android` / `npm run ios` — corre en emuladores.

## Notas y recomendaciones

- Asegura que MySQL esté corriendo y que el usuario tenga permisos sobre `MYSQL_DB`.
- Usa una clave segura en `JWT_SECRETO` y no la compartas.
- Obtén tu `TMDB_API_KEY` desde https://www.themoviedb.org/settings/api.
- En redes locales con Expo, verifica que el dispositivo/emulador pueda alcanzar la IP del backend.

## Limpieza de código y cambios recientes

- Se eliminaron componentes de reproductor específicos de plataformas externas que no se usan: `frontend/componentes/ReproductorYouTube.js`, `frontend/componentes/ReproductorVimeo.js` y la pantalla `frontend/pantallas/Reproductor.js` (estaba comentada).
- La pantalla `DetalleContenido` se refactorizó para usar un único componente de video y evitar overlays que causaban reproducción en silencio.
- Se añadieron comentarios detallados en archivos clave del frontend (`App.js`, `navegacion/NavegadorPrincipal.js`, `servicios/api.js`) para facilitar el entendimiento línea por línea.

---

Sugerencias, mejoras y nuevas pantallas son bienvenidas. Este proyecto sirve como base para experimentar con arquitectura y features tipo Netflix.
