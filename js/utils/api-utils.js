/**
 * Utilidades para generar URLs de API de forma consistente en todos los tenants
 * Agrotech - Sistema Multi-tenant
 */

/**
 * Genera la URL base del backend
 * Siempre retorna '' (vacío) porque Netlify proxy redirige /api/* al backend correcto.
 * @param {string} apiPath - Ruta de la API (ej: '/api/parcels', '/api/authentication')
 * @param {number} port - (Ignorado) Se mantiene por compatibilidad
 * @returns {string} URL relativa del backend
 */
function getBackendUrl(apiPath = '', port = 8000) {
    // Siempre usar URLs relativas - Netlify proxy se encarga del redireccionamiento
    // Local:      localhost:8080/api/* → localhost:8000/api/*
    // Producción: netlify.app/api/*    → railway.app/api/*
    const baseUrl = '';
    
    // Agregar path si se proporciona
    if (apiPath) {
        // Asegurar que el path comience con /
        const cleanPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
        return baseUrl + cleanPath;
    }
    
    return baseUrl;
}

/**
 * Genera URLs específicas para diferentes módulos de la API
 */
const ApiUrls = {
    // Parcelas
    parcels: () => getBackendUrl('/api/parcels'),
    
    // Autenticación
    auth: () => getBackendUrl('/api/authentication'),
    
    // Recursos Humanos
    rrhh: () => getBackendUrl('/api/RRHH'),
    
    // Inventario
    inventario: () => getBackendUrl('/api/inventario'),
    
    // Cultivos
    crop: () => getBackendUrl('/api/crop'),
    
    // Usuarios
    users: () => getBackendUrl('/users/api'),
    
    // EOSDA Proxy
    eosdaWmts: () => getBackendUrl('/api/parcels/eosda-wmts-tile'),
    
    // Análisis meteorológico
    weatherAnalysis: (parcelId) => getBackendUrl(`/api/parcels/parcel/${parcelId}/ndvi-weather-comparison`),
    
    // Sentinel WMTS
    sentinelWmts: () => getBackendUrl('/parcels/sentinel-wmts-urls'),
};

/**
 * Obtiene el dominio del tenant actual del usuario
 * @returns {string} Dominio del tenant (ej: 'prueba.localhost') o vacío
 */
function getTenantDomain() {
    return localStorage.getItem('tenantDomain') || '';
}

/**
 * Obtiene el token de autenticación actual
 * @returns {string} Token de acceso
 */
function getAuthToken() {
    return localStorage.getItem('accessToken') || 
           localStorage.getItem('authToken') || 
           sessionStorage.getItem('accessToken') ||
           sessionStorage.getItem('authToken') || 
           '';
}

/**
 * Crea headers estándar para peticiones autenticadas.
 * Incluye automáticamente:
 * - Authorization: Bearer {token}
 * - X-Tenant-Domain: {domain del tenant del usuario}
 * @param {Object} additionalHeaders - Headers adicionales opcionales
 * @returns {Object} Headers para fetch/axios
 */
function getAuthHeaders(additionalHeaders = {}) {
    const token = getAuthToken();
    const tenantDomain = getTenantDomain();
    const headers = {
        'Content-Type': 'application/json',
        ...additionalHeaders
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Enviar el tenant domain para que el backend resuelva el schema correcto
    if (tenantDomain) {
        headers['X-Tenant-Domain'] = tenantDomain;
    }
    
    return headers;
}

/**
 * Wrapper para fetch con autenticación automática y resolución de tenant
 * @param {string} url - URL del endpoint
 * @param {Object} options - Opciones de fetch
 * @returns {Promise} Promesa de fetch
 */
async function authenticatedFetch(url, options = {}) {
    const headers = getAuthHeaders(options.headers);
    
    return fetch(url, {
        ...options,
        headers
    });
}

// Exportar para uso global
window.getBackendUrl = getBackendUrl;
window.ApiUrls = ApiUrls;
window.getTenantDomain = getTenantDomain;
window.getAuthToken = getAuthToken;
window.getAuthHeaders = getAuthHeaders;
window.authenticatedFetch = authenticatedFetch;

// Exportar para módulos ES6
// Export comentado para compatibilidad con scripts regulares

console.log('[API-UTILS] Utilidades de API cargadas para tenant:', window.location.hostname);
