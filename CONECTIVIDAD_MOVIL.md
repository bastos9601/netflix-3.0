# Configuración de Conectividad Móvil

## Problema
Por defecto, Expo solo permite conectar dispositivos móviles que estén en la misma red WiFi. Esto limita el desarrollo y testing.

## Soluciones

### 1. Configuración con IP Local (misma red WiFi)
```bash
# En frontend/, crea un archivo .env
cd frontend
cp .env.example .env

# Edita .env y configura tu IP local:
EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:3000
```

Para encontrar tu IP local:
- **Windows**: `ipconfig` (busca IPv4 de tu adaptador WiFi)
- **macOS/Linux**: `ifconfig` o `ip addr show`

### 2. Configuración con Túnel (cualquier red)
Usa herramientas como ngrok para crear un túnel público:

```bash
# Instalar ngrok
npm install -g ngrok

# En una terminal, exponer el backend:
ngrok http 3000

# Copiar la URL https generada (ej: https://abc123.ngrok.io)
# En frontend/.env:
EXPO_PUBLIC_API_URL=https://abc123.ngrok.io
```

### 3. Alternativas a ngrok
- **localtunnel**: `npx localtunnel --port 3000`
- **serveo**: `ssh -R 80:localhost:3000 serveo.net`
- **cloudflared**: Cloudflare Tunnel

### 4. Configuración de Producción
Para un servidor real:
```bash
# En frontend/.env:
EXPO_PUBLIC_API_URL=https://tu-dominio.com:3000
```

## Verificación
1. Configura la variable `EXPO_PUBLIC_API_URL`
2. Reinicia Expo: `npm run mobile` o `expo start`
3. Conecta tu móvil escaneando el QR
4. La app debería conectar al backend sin importar la red WiFi

## Notas de Seguridad
- En producción, usa HTTPS siempre
- Configura CORS en el backend para las URLs permitidas
- No expongas túneles de desarrollo en producción