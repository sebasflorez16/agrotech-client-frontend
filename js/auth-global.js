/**
 * 🔐 Auth Global - AgroTech Digital
 * ===================================
 * Manejo centralizado de autenticación con refresh automático de tokens.
 * 
 * Este archivo debe cargarse DESPUÉS de config.js y ANTES de cualquier otro script.
 * Expone funciones globales que cualquier página puede usar.
 * 
 * Funciones globales disponibles:
 *   - window.agAuth.getToken()          → Devuelve el access token o null
 *   - window.agAuth.isExpired(token)    → true si el JWT ya expiró
 *   - window.agAuth.refresh()           → Intenta refrescar el token (async)
 *   - window.agAuth.fetchWithAuth(url, opts) → fetch con auth + auto-refresh (async)
 *   - window.agAuth.forceLogout()       → Limpia todo y redirige a login
 *   - window.agAuth.requireAuth()       → Verifica auth o redirige, retorna boolean (async)
 */

(function() {
    'use strict';

    const API_BASE = (window.AGROTECH_CONFIG && window.AGROTECH_CONFIG.API_BASE)
        ? window.AGROTECH_CONFIG.API_BASE
        : (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
            ? 'http://localhost:8000'
            : 'https://agrotech-digital-production.up.railway.app';
    
    // Flag para evitar múltiples redirecciones simultáneas
    let _isRedirecting = false;

    // ═══ Detectar ruta relativa al login según profundidad de la página actual ═══
    function getLoginUrl() {
        const path = window.location.pathname;
        // Contar niveles de profundidad desde /templates/
        const parts = path.split('/').filter(Boolean);
        // Buscar cuántos '../' necesitamos para llegar a la raíz
        // La mayoría de pages están en /templates/xxx.html o /templates/xxx/yyy.html
        let prefix = '';
        if (path.includes('/templates/')) {
            const afterTemplates = path.split('/templates/')[1] || '';
            const depth = afterTemplates.split('/').filter(Boolean).length;
            if (depth > 1) {
                prefix = '../'.repeat(depth - 1);
            }
            return prefix + 'authentication/login.html';
        }
        return '/templates/authentication/login.html';
    }

    // ═══ Obtener el access token actual ═══
    function getToken() {
        const token = localStorage.getItem('accessToken');
        if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
            return null;
        }
        return token;
    }

    // ═══ Verificar si un JWT está expirado ═══
    function isExpired(token) {
        if (!token) return true;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            // Dar 30 segundos de margen para evitar race conditions
            return (payload.exp * 1000) < (Date.now() + 30000);
        } catch {
            return true;
        }
    }

    // ═══ Intentar refrescar el access token ═══
    async function refreshToken() {
        const refresh = localStorage.getItem('refreshToken');
        if (!refresh || refresh === 'null' || refresh === 'undefined') {
            return false;
        }

        try {
            const response = await fetch(`${API_BASE}/api/token/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: refresh })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('accessToken', data.access);
                // ROTATE_REFRESH_TOKENS=True → el backend devuelve nuevo refresh
                if (data.refresh) {
                    localStorage.setItem('refreshToken', data.refresh);
                }
                console.log('🔄 Token refrescado automáticamente');
                return true;
            }

            // 401 en el refresh → refresh token también expiró
            console.warn('⚠️ Refresh token expirado o inválido');
            return false;
        } catch (error) {
            console.error('Error al refrescar token:', error);
            return false;
        }
    }

    // ═══ Forzar logout - limpia todo y redirige ═══
    function forceLogout() {
        if (_isRedirecting) return;
        _isRedirecting = true;

        const keys = [
            'accessToken', 'refreshToken', 'userName', 'userEmail',
            'tenantDomain', 'tenantName', 'tenantSchema', 'userTenants'
        ];
        keys.forEach(k => localStorage.removeItem(k));

        const loginUrl = getLoginUrl();
        console.log('🔒 Sesión expirada. Redirigiendo a login:', loginUrl);
        window.location.href = loginUrl;
    }

    // ═══ Verificar autenticación — redirige si no hay sesión válida ═══
    async function requireAuth() {
        const token = getToken();
        
        if (!token) {
            forceLogout();
            return false;
        }

        if (isExpired(token)) {
            console.log('🔄 Token expirado, intentando refresh automático...');
            const ok = await refreshToken();
            if (!ok) {
                forceLogout();
                return false;
            }
        }

        return true;
    }

    // ═══ Fetch con autenticación y refresh automático ═══
    async function fetchWithAuth(url, options = {}) {
        if (_isRedirecting) return null;

        let token = getToken();
        if (!token) {
            forceLogout();
            return null;
        }

        // Pre-check: si el token ya expiró, refresh antes de la petición
        if (isExpired(token)) {
            const refreshed = await refreshToken();
            if (!refreshed) {
                forceLogout();
                return null;
            }
            token = localStorage.getItem('accessToken');
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const tenantDomain = localStorage.getItem('tenantDomain');
        if (tenantDomain) {
            headers['X-Tenant-Domain'] = tenantDomain;
        }

        try {
            const response = await fetch(url, { ...options, headers });

            if (response.status === 401) {
                // Token rechazado por el backend → intentar refresh
                const refreshed = await refreshToken();
                if (refreshed) {
                    const newToken = localStorage.getItem('accessToken');
                    headers['Authorization'] = `Bearer ${newToken}`;
                    return fetch(url, { ...options, headers });
                } else {
                    forceLogout();
                    return null;
                }
            }

            return response;
        } catch (error) {
            console.error('Error en fetchWithAuth:', error);
            return null;
        }
    }

    // ═══ Exponer API global ═══
    window.agAuth = {
        getToken,
        isExpired,
        refresh: refreshToken,
        fetchWithAuth,
        forceLogout,
        requireAuth,
        getLoginUrl
    };

    // ═══ Timer para refresh proactivo ═══
    // Cada 5 minutos, verificar si el token está cerca de expirar
    setInterval(async () => {
        const token = getToken();
        if (token && isExpired(token)) {
            console.log('⏰ Auto-refresh preventivo del token...');
            const ok = await refreshToken();
            if (!ok && !_isRedirecting) {
                console.warn('⚠️ No se pudo refrescar token preventivamente');
                // No forzar logout aquí, esperar a que falle un request real
            }
        }
    }, 5 * 60 * 1000); // cada 5 minutos

})();
