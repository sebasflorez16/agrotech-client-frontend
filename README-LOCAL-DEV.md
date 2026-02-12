# 🌱 Guía de Desarrollo Local - AgroTech Digital

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    ENTORNO LOCAL                             │
│                                                              │
│   Navegador                                                  │
│      │                                                       │
│      ▼                                                       │
│   localhost:8080  (Netlify Dev - Frontend)                    │
│      │                                                       │
│      │ /api/*  ──proxy──►  localhost:8000 (Django Backend)   │
│      │ /billing/*          │                                 │
│      │                     ▼                                 │
│      │               PostgreSQL local                        │
│      │               ├── public (tenant público)             │
│      │               └── prueba (tenant de prueba)           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PRODUCCIÓN                                │
│                                                              │
│   Navegador                                                  │
│      │                                                       │
│      ▼                                                       │
│   Netlify (Frontend estático)                                │
│      │                                                       │
│      │ /api/*  ──proxy──►  Railway (Django Backend)          │
│      │ /billing/*          │                                 │
│      │                     ▼                                 │
│      │               PostgreSQL (Railway)                    │
│      │               ├── public                              │
│      │               └── {tenants de clientes}               │
└─────────────────────────────────────────────────────────────┘
```

## Requisitos previos

1. **PostgreSQL** corriendo localmente con tenants configurados
2. **Python** con las dependencias del backend instaladas
3. **Node.js** con Netlify CLI: `npm install -g netlify-cli`

## Cómo iniciar desarrollo local

### 1. Cambiar frontend a modo local
```bash
cd agrotech-client-frontend
./scripts/switch-env.sh local
```

### 2. Iniciar backend
```bash
cd agrotech-digital
python manage.py runserver 0.0.0.0:8000
```

### 3. Iniciar frontend
```bash
cd agrotech-client-frontend
npx netlify dev
```

### 4. Abrir en navegador
```
http://localhost:8080/login
```

## Cómo volver a producción (antes de git push)

```bash
cd agrotech-client-frontend
./scripts/switch-env.sh prod
```

### Verificar estado actual
```bash
./scripts/switch-env.sh status
```

## Seguridad: Pre-commit hook

Hay un pre-commit hook instalado que **IMPIDE hacer commit si netlify.toml tiene config local**.

Si necesitas reinstalarlo:
```bash
cp scripts/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## Cómo funciona

### URLs relativas
Todos los archivos JS usan URLs **relativas** para las llamadas API:
```javascript
// ✅ CORRECTO - funciona en local Y producción
fetch('/api/parcels/', { headers: ... })

// ❌ INCORRECTO - ya no se usa
fetch('https://agrotech-digital-production.up.railway.app/api/parcels/', ...)
```

### Proxy de Netlify
El archivo `netlify.toml` define reglas de proxy:
- **Local**: `/api/*` → `http://localhost:8000/api/*`
- **Producción**: `/api/*` → `https://agrotech-digital-production.up.railway.app/api/*`

Esto es transparente para el JS — siempre usa la misma URL relativa.

### Archivos de configuración

| Archivo | En Git? | Propósito |
|---------|---------|-----------|
| `netlify.toml` | ✅ Sí | Config de **producción** (siempre) |
| `netlify-local.toml` | ❌ No | Config de **desarrollo local** |
| `scripts/switch-env.sh` | ✅ Sí | Script para cambiar entre entornos |
| `scripts/pre-commit.sh` | ✅ Sí | Hook de protección |

### Flujo de trabajo típico

```
1. git pull                          ← Trae cambios recientes
2. ./scripts/switch-env.sh local     ← Configura para local
3. (iniciar backend y frontend)
4. (desarrollar y probar)
5. ./scripts/switch-env.sh prod      ← Restaura producción
6. git add . && git commit && git push  ← Sube cambios
```

## Resolución de problemas

### Error de tenant / 404 en API
Verificar que `config/settings/base.py` tiene:
```python
USE_X_FORWARDED_HOST = True
```

### CSP errors en consola
Si ves errores de Content Security Policy, verifica que NO estás usando URLs absolutas en el JS. Todo debe ser relativo (`/api/...`).

### El login no funciona
1. Verificar que el backend está corriendo: `curl http://localhost:8000/api/authentication/login/`
2. Verificar que el proxy funciona: `curl http://localhost:8080/api/authentication/login/`
3. Verificar credenciales del tenant local
