# 🌱 AgroTech Client Frontend

Frontend Liquid Glass para AgroTech Digital SaaS Platform

## 🎨 Diseño

- **Sistema de diseño**: Apple Liquid Glass (Glassmorphism)
- **CSS**: Pure CSS con backdrop-filter y animaciones
- **JavaScript**: Vanilla JS modular
- **Framework**: Sin frameworks, HTML/CSS/JS puro

## 🏗️ Arquitectura

```
Frontend (Netlify)          Backend (Railway)
    ↓                            ↓
Static HTML/CSS/JS    ←→    Django REST API
agrotechcolombia        agrotech-digital-production
.netlify.app            .up.railway.app
```

## 📁 Estructura

```
agrotech-client-frontend/
├── templates/              # Páginas HTML
│   ├── dashboard.html     # Dashboard principal
│   ├── billing.html       # Facturación y uso
│   ├── authentication/    # Login y registro
│   ├── parcels/          # Gestión de parcelas
│   ├── crop/             # Gestión de cultivos
│   ├── employees/        # Recursos humanos
│   └── inventario/       # Inventario
├── css/
│   └── liquid-glass-system.css  # Sistema de diseño
├── js/
│   ├── config.js         # Configuración global (dev/prod)
│   ├── dashboard-liquid.js
│   ├── billing-liquid.js
│   ├── login-liquid.js
│   └── utils/            # Utilidades compartidas
├── images/               # Assets
├── fonts/                # Fuentes
├── netlify.toml         # Configuración Netlify
└── index.html           # Landing page

```

## 🌍 Configuración de Entornos

El sistema detecta automáticamente el entorno mediante `config.js`:

**Local:**
- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:8000`

**Producción:**
- Frontend: `https://agrotechcolombia.netlify.app`
- Backend API: `https://agrotech-digital-production.up.railway.app`

## 🚀 Desarrollo Local

### Opción 1: HTTP Server (Python)
```bash
python3 -m http.server 8080
```

### Opción 2: Live Server (VS Code)
Instala la extensión "Live Server" y haz clic derecho en `index.html` → "Open with Live Server"

### Opción 3: Cualquier servidor estático
```bash
# Node.js
npx http-server -p 8080

# PHP
php -S localhost:8080
```

Luego accede a: `http://localhost:8080/templates/authentication/login.html`

## 📦 Deployment a Netlify

### Automático (desde GitHub)

1. **Conecta el repo a Netlify:**
   - https://app.netlify.com → Add new site → Import an existing project
   - Conecta con GitHub
   - Selecciona este repositorio

2. **Configuración de build:**
   ```
   Build command: (vacío)
   Publish directory: .
   ```

3. **Deploy automático:**
   - Cada push a `main` desplegará automáticamente

### Manual

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

## 🔗 Endpoints del Backend

Configurados en `js/config.js`:

- **Auth**: `/api/authentication/login/`, `/api/authentication/logout/`
- **Parcelas**: `/api/parcels/`
- **Cultivos**: `/api/crop/crops/`
- **Billing**: `/billing/api/usage/dashboard/`
- **Empleados**: `/api/employees/`
- **Inventario**: `/inventario/api/`

## 🎨 Componentes Liquid Glass

### Cards
```html
<div class="glass-card">
  <!-- Contenido -->
</div>
```

### Botones
```html
<button class="btn-glass-primary">Primary</button>
<button class="btn-glass-secondary">Secondary</button>
```

### Stats Cards
```html
<div class="stat-card">
  <div class="stat-value">1,234</div>
  <div class="stat-label">Parcelas Activas</div>
</div>
```

Ver más en `FRONTEND_README.md`

## 📝 Páginas Disponibles

- `/templates/authentication/login.html` - Login
- `/templates/dashboard.html` - Dashboard principal
- `/templates/billing.html` - Facturación y métricas
- `/templates/parcels/parcels-dashboard.html` - Gestión de parcelas
- `/templates/crop/crop_list.html` - Gestión de cultivos
- `/templates/employees/RRHH-dashboard.html` - Recursos Humanos
- `/templates/inventario/dashboard_inventario.html` - Inventario

## 🔧 Configuración del Backend

Asegúrate de que el backend en Railway tenga configurado CORS:

```python
# config/settings/production.py
CORS_ALLOWED_ORIGINS = [
    "https://agrotechcolombia.netlify.app",
    "http://localhost:8080",  # Para desarrollo
]
```

## 📄 Licencia

Privado - AgroTech Digital © 2026
