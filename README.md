# Anonymous Message Board

Este es un proyecto de tabla d mensajes anónima construido para FreeCodeCamp.

## Configuración para Railway

### Variables de entorno requeridas:

1. **DB**: Tu string de conexión de MongoDB de Railway
   - Ejemplo: `mongodb://mongo:password@containers-us-west-xyz.railway.app:1234/railway`

2. **PORT**: Railway lo configura automáticamente, pero puedes usar 3000 para desarrollo local

3. **NODE_ENV**: Configúralo como "test" cuando quieras ejecutar las pruebas

### Pasos para desplegar en Railway:

1. **Obtén tu URL de MongoDB:**
   - Ve a tu dashboard de Railway
   - Busca tu servicio de MongoDB
   - Copia la URL de conexión que incluye usuario, contraseña, host y puerto

2. **Configura las variables de entorno en Railway:**
   - En tu proyecto de Railway, ve a la pestaña "Variables"
   - Agrega: `DB=tu_url_de_mongodb_completa`
   - Agrega: `NODE_ENV=production` (opcional)

3. **Conecta tu repositorio:**
   - Conecta tu repositorio de GitHub a Railway
   - Railway detectará automáticamente que es un proyecto Node.js
   - Se desplegará usando `npm start`

### Desarrollo local:

1. Crea un archivo `.env` con:
```
DB=tu_url_de_mongodb_de_railway
PORT=3000
```

2. Instala dependencias: `npm install`
3. Ejecuta: `npm start`
4. Para pruebas: `npm test`

### API Endpoints:

#### Threads:
- `POST /api/threads/:board` - Crear nuevo hilo
- `GET /api/threads/:board` - Obtener hilos (máximo 10, con 3 respuestas cada uno)
- `PUT /api/threads/:board` - Reportar hilo
- `DELETE /api/threads/:board` - Eliminar hilo

#### Replies:
- `POST /api/replies/:board` - Crear nueva respuesta
- `GET /api/replies/:board` - Obtener hilo completo con todas las respuestas
- `PUT /api/replies/:board` - Reportar respuesta
- `DELETE /api/replies/:board` - Eliminar respuesta

### Ejemplo de URL de tu base de datos Railway:

Tu URL de Railway debería verse algo así:
```
mongodb://mongo:CONTRASEÑA@containers-us-west-123.railway.app:1234/railway
```

Donde:
- `mongo` es el usuario
- `CONTRASEÑA` es tu contraseña específica
- `containers-us-west-123.railway.app` es tu host
- `1234` es tu puerto
- `railway` es el nombre de la base de datos
