/**
 * 🌍 Configuración Global - AgroTech Digital
 * ==========================================
 * Detecta automáticamente el entorno (local/producción) y configura las URLs base
 * 
 * USO:
 * - En archivos JS: const apiUrl = `${window.AGROTECH_CONFIG.API_BASE}/api/parcels/`;
 * - En archivos HTML: <script src="../js/config.js"></script> (antes de otros scripts)
 */

(function() {
    'use strict';
    
    // Detectar entorno
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    
    const isDevelopment = isLocalhost || window.location.hostname.includes('dev.');
    const isStaging = window.location.hostname.includes('staging.');
    const isProduction = !isDevelopment && !isStaging;
    
    // Configuración global
    // API_BASE apunta directamente al backend (Railway en prod, localhost en dev).
    // El proxy de Netlify sigue activo como fallback para rutas relativas /api/*.
    window.AGROTECH_CONFIG = {
        // URLs Base
        API_BASE: isLocalhost ? 'http://localhost:8000' : 'https://agrotech-digital-production.up.railway.app',
        STATIC_BASE: isLocalhost ? 'http://localhost:8080' : '',
        
        // Puertos (solo para desarrollo)
        PORTS: {
            BACKEND: 8000,
            FRONTEND: 8080
        },
        
        // Entorno actual
        ENV: {
            IS_LOCALHOST: isLocalhost,
            IS_DEVELOPMENT: isDevelopment,
            IS_STAGING: isStaging,
            IS_PRODUCTION: isProduction,
            NAME: isLocalhost ? 'local' : (isStaging ? 'staging' : 'production')
        },
        
        // Endpoints principales
        ENDPOINTS: {
            LOGIN: '/api/auth/login/',
            LOGOUT: '/api/auth/logout/',
            REGISTER: '/api/auth/register/',
            ME: '/api/auth/me/',
            TOKEN_REFRESH: '/api/token/refresh/',
            
            // Parcelas
            PARCELS: '/api/parcels/',
            PARCELS_DETAIL: (id) => `/api/parcels/parcel/${id}/`,
            
            // Cultivos
            CROPS: '/api/crop/crops/',
            
            // RRHH
            EMPLOYEES: '/api/RRHH/empleados/',
            
            // Billing
            BILLING_DASHBOARD: '/billing/api/usage/dashboard/',
            BILLING_HISTORY: '/billing/api/usage/history/',
            BILLING_INVOICE: '/billing/api/invoice/current/',
            BILLING_PLANS: '/billing/api/plans/',
            BILLING_CREATE_CHECKOUT: '/billing/api/create-checkout/',
            BILLING_CONFIRM_PAYMENT: '/billing/api/confirm-payment/',
            
            // Inventario
            INVENTORY: '/api/inventario/',
            
            // Usuario
            USER_PROFILE: '/users/api/profile-utils/'
        },
        
        // Configuración de desarrollo
        DEBUG: isLocalhost,
        LOG_LEVEL: isLocalhost ? 'debug' : 'error'
    };
    
    // Helper para construir URLs completas
    window.AGROTECH_CONFIG.buildUrl = function(endpoint) {
        return this.API_BASE + endpoint;
    };
    
    // Helper para logging condicional
    window.AGROTECH_CONFIG.log = function(...args) {
        if (this.DEBUG) {
            console.log('[AGROTECH]', ...args);
        }
    };
    
    // Mostrar configuración en consola (solo en desarrollo)
    if (isLocalhost) {
        console.log('🌱 AgroTech Digital - Configuración cargada:');
        console.log('   Entorno:', window.AGROTECH_CONFIG.ENV.NAME);
        console.log('   API Base:', window.AGROTECH_CONFIG.API_BASE);
        console.log('   Static Base:', window.AGROTECH_CONFIG.STATIC_BASE);
    }
    
    // Exponer también como variable global más corta
    window.AG = window.AGROTECH_CONFIG;
    
})();
