/**
 * 🍎 Dashboard Liquid Glass - AgroTech Digital
 * Maneja la lógica del dashboard principal con diseño Apple-inspired
 */

// Configuración API - Siempre usa URLs relativas (Netlify proxy redirige al backend)
const API_BASE_URL = (window.AGROTECH_CONFIG && window.AGROTECH_CONFIG.API_BASE) || '';

// ═══ Usar auth-global.js si está disponible, sino fallback local ═══
function getAuthToken() {
    if (window.agAuth) return window.agAuth.getToken();
    const token = localStorage.getItem('accessToken');
    if (!token || token === 'null' || token === 'undefined') {
        window.location.href = '../templates/authentication/login.html';
        return null;
    }
    return token;
}

function forceLogout() {
    if (window.agAuth) { window.agAuth.forceLogout(); return; }
    localStorage.clear();
    window.location.href = '../templates/authentication/login.html';
}

async function fetchWithAuth(url, options = {}) {
    if (window.agAuth) return window.agAuth.fetchWithAuth(url, options);
    // Fallback básico si auth-global.js no se cargó
    const token = getAuthToken();
    if (!token) return null;
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    const tenantDomain = localStorage.getItem('tenantDomain');
    if (tenantDomain) headers['X-Tenant-Domain'] = tenantDomain;
    try {
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401) { forceLogout(); return null; }
        return response;
    } catch (error) {
        console.error('Error en fetch:', error);
        return null;
    }
}

// Cargar información del usuario
async function loadUserInfo() {
    try {
        const token = getAuthToken();
        if (token) {
            // Decodificar payload del JWT
            const payload = JSON.parse(atob(token.split('.')[1]));
            
            // Actualizar nombre de usuario
            const userName = document.getElementById('userName');
            const storedName = localStorage.getItem('userName');
            const displayName = storedName || payload.username || 'Usuario';
            
            if (userName) {
                userName.textContent = displayName;
            }
            
            // Actualizar avatar con inicial
            const userAvatar = document.querySelector('.user-avatar');
            if (userAvatar && displayName) {
                userAvatar.textContent = displayName.charAt(0).toUpperCase();
            }
            
            // Actualizar saludo personalizado
            const headerTitle = document.querySelector('.header-title h1');
            if (headerTitle) {
                const hour = new Date().getHours();
                let greeting = 'Bienvenido';
                if (hour < 12) greeting = 'Buenos días';
                else if (hour < 18) greeting = 'Buenas tardes';
                else greeting = 'Buenas noches';
                
                headerTitle.textContent = `${greeting}, ${displayName} 👋`;
            }
        }
    } catch (error) {
        console.error('Error cargando usuario:', error);
    }
}

// Cargar estadísticas del dashboard
async function loadDashboardStats() {
    try {
        // Cargar en paralelo para mejor rendimiento
        const [parcelsResponse, cropsResponse, employeesResponse] = await Promise.allSettled([
            fetchWithAuth(`${API_BASE_URL}/api/parcels/parcel/`),
            fetchWithAuth(`${API_BASE_URL}/api/crop/crops/`),
            fetchWithAuth(`${API_BASE_URL}/api/RRHH/empleados/`)
        ]);
        
        // Parcelas
        if (parcelsResponse.status === 'fulfilled' && parcelsResponse.value && parcelsResponse.value.ok) {
            const data = await parcelsResponse.value.json();
            const parcels = data.parcels || data.results || (Array.isArray(data) ? data : []);
            const parcelCount = document.getElementById('parcelCount');
            if (parcelCount) {
                animateNumber(parcelCount, parcels.length || 0);
            }
        } else {
            setStatDefault('parcelCount', '0');
        }
        
        // Cultivos
        if (cropsResponse.status === 'fulfilled' && cropsResponse.value && cropsResponse.value.ok) {
            const data = await cropsResponse.value.json();
            const crops = data.results || (Array.isArray(data) ? data : []);
            const cropCount = document.getElementById('cropCount');
            if (cropCount) {
                animateNumber(cropCount, crops.length || 0);
            }
        } else {
            setStatDefault('cropCount', '0');
        }
        
        // Empleados
        if (employeesResponse.status === 'fulfilled' && employeesResponse.value && employeesResponse.value.ok) {
            const data = await employeesResponse.value.json();
            const employees = data.results || (Array.isArray(data) ? data : []);
            const employeeCount = document.getElementById('employeeCount');
            if (employeeCount) {
                animateNumber(employeeCount, employees.length || 0);
            }
        } else {
            setStatDefault('employeeCount', '0');
        }
        
        // Cargar uso de EOSDA
        await loadEOSDAUsage();
        
        // Cargar actividad reciente
        loadRecentActivity();
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// Set default stat value
function setStatDefault(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// Cargar uso de EOSDA desde billing
async function loadEOSDAUsage() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/billing/api/usage/dashboard/`);
        if (response && response.ok) {
            const data = await response.json();
            const eosdaUsage = document.getElementById('eosdaUsage');
            
            if (eosdaUsage && data.current_usage && data.current_usage.eosda_requests) {
                const used = data.current_usage.eosda_requests.used || 0;
                const limit = data.current_usage.eosda_requests.limit || 100;
                eosdaUsage.textContent = `${used}/${limit}`;
            }
            
            // Actualizar información de suscripción
            displaySubscriptionInfo(data);
        } else {
            // Sin suscripción activa (404) o error — mostrar defaults
            console.warn('Billing no disponible. Mostrando defaults.');
            const eosdaUsage = document.getElementById('eosdaUsage');
            if (eosdaUsage) eosdaUsage.textContent = '0/0';
            
            displaySubscriptionInfo({
                subscription: { name: 'Sin plan activo', monthly_price: 0 },
                current_usage: { eosda_requests: { used: 0, limit: 0, percentage: 0, status: 'ok' } },
                alerts: []
            });
        }
    } catch (error) {
        console.error('Error cargando uso EOSDA:', error);
        const eosdaUsage = document.getElementById('eosdaUsage');
        if (eosdaUsage) eosdaUsage.textContent = '--';
    }
}

// Mostrar información de suscripción
function displaySubscriptionInfo(data) {
    const container = document.getElementById('subscriptionInfo');
    if (!container) return;
    
    const subscription = data.subscription || {};
    const eosdaUsage = data.current_usage?.eosda_requests || {};
    const alerts = data.alerts || [];
    
    const percentage = eosdaUsage.percentage || 0;
    const status = eosdaUsage.status || 'ok';
    
    let statusClass = 'success';
    let statusText = 'Todo bien';
    let statusIcon = '✅';
    
    if (status === 'warning') {
        statusClass = 'warning';
        statusText = 'Acercándose al límite';
        statusIcon = '⚠️';
    } else if (status === 'exceeded') {
        statusClass = 'danger';
        statusText = 'Límite excedido';
        statusIcon = '🚫';
    }
    
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); flex-wrap: wrap; gap: 8px;">
            <div>
                <h3 style="font-size: 1.125rem; margin-bottom: var(--space-xs);">${subscription.name || 'Plan Básico'}</h3>
                <p style="color: var(--text-secondary); font-size: 0.875rem;">
                    $${Number(subscription.monthly_price || 0).toLocaleString('es-CO')} COP/mes
                </p>
            </div>
            <div class="alert-badge ${statusClass}">
                ${statusIcon} ${statusText}
            </div>
        </div>
        
        <div style="margin-bottom: var(--space-sm);">
            <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-xs);">
                <span style="font-size: 0.875rem; color: var(--text-secondary);">Análisis EOSDA</span>
                <span style="font-weight: var(--font-weight-semibold);">${eosdaUsage.used || 0} / ${eosdaUsage.limit || 100}</span>
            </div>
            <div class="progress-glass">
                <div class="progress-glass-bar ${statusClass}" style="width: ${Math.min(percentage, 100)}%"></div>
            </div>
        </div>
        
        ${alerts.length > 0 ? `
            <div style="margin-top: var(--space-lg); padding: var(--space-md); background: rgba(255, 159, 10, 0.1); border-radius: var(--radius-md); border: 1px solid rgba(255, 159, 10, 0.2);">
                <p style="font-size: 0.875rem; color: #D97706; margin: 0;">
                    <i class="ti ti-alert-circle"></i> ${alerts[0].message}
                </p>
            </div>
        ` : ''}
    `;
}

// Cargar actividad reciente (genera una vista basada en los datos disponibles)
function loadRecentActivity() {
    const container = document.getElementById('recentActivity');
    if (!container) return;
    
    const activities = [];
    const now = new Date();
    
    // Generar actividad basada en datos del dashboard
    const parcelCount = document.getElementById('parcelCount')?.textContent;
    const cropCount = document.getElementById('cropCount')?.textContent;
    const eosdaUsage = document.getElementById('eosdaUsage')?.textContent;
    
    if (parcelCount && parcelCount !== '--' && parseInt(parcelCount) > 0) {
        activities.push({
            icon: 'ti-map',
            iconClass: 'green',
            title: `${parcelCount} parcela(s) registrada(s)`,
            subtitle: 'Monitoreo activo',
            time: 'Actualizado ahora'
        });
    }
    
    if (cropCount && cropCount !== '--' && parseInt(cropCount) > 0) {
        activities.push({
            icon: 'ti-plant',
            iconClass: 'blue',
            title: `${cropCount} cultivo(s) en seguimiento`,
            subtitle: 'Gestión agrícola',
            time: 'Actualizado ahora'
        });
    }
    
    if (eosdaUsage && eosdaUsage !== '--' && eosdaUsage !== '0/0') {
        activities.push({
            icon: 'ti-satellite',
            iconClass: 'green',
            title: `Uso EOSDA: ${eosdaUsage}`,
            subtitle: 'Análisis satelital',
            time: 'Este período'
        });
    }
    
    // Siempre mostrar el estado de conexión
    activities.push({
        icon: 'ti-wifi',
        iconClass: 'green',
        title: 'Sistema conectado',
        subtitle: 'Backend Railway activo',
        time: formatTime(now)
    });
    
    // Último login
    activities.push({
        icon: 'ti-login',
        iconClass: 'blue',
        title: 'Sesión iniciada',
        subtitle: localStorage.getItem('userEmail') || 'Usuario autenticado',
        time: formatTime(now)
    });
    
    if (activities.length === 0) {
        container.innerHTML = `
            <p style="color: var(--text-secondary); text-align: center; padding: var(--space-xl);">
                No hay actividad reciente para mostrar
            </p>
        `;
        return;
    }
    
    container.innerHTML = activities.map((act, i) => `
        <div class="activity-item" style="display: flex; align-items: flex-start; gap: 12px; padding: 14px 0; border-bottom: 1px solid rgba(128,128,128,0.08); animation: fadeSlideUp 0.3s ease-out ${0.1 * i}s both;">
            <div class="activity-icon ${act.iconClass}" style="width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: ${act.iconClass === 'green' ? 'rgba(53,184,53,0.12)' : act.iconClass === 'blue' ? 'rgba(74,158,255,0.12)' : 'rgba(255,159,10,0.12)'};">
                <i class="ti ${act.icon}" style="font-size: 1.15rem; color: ${act.iconClass === 'green' ? '#35B835' : act.iconClass === 'blue' ? '#4A9EFF' : '#FF9F0A'};"></i>
            </div>
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 3px; line-height: 1.3;">${act.title}</div>
                <div style="font-size: 0.8rem; opacity: 0.5; line-height: 1.2;">${act.subtitle}</div>
            </div>
            <div style="font-size: 0.72rem; opacity: 0.35; white-space: nowrap; flex-shrink: 0; padding-top: 2px;">${act.time}</div>
        </div>
    `).join('');
}

// Formatear hora
function formatTime(date) {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// Animar números (contador)
function animateNumber(element, target) {
    if (!element) return;
    
    // Si es una cadena con "/", mostrar directamente
    if (typeof target === 'string') {
        element.textContent = target;
        return;
    }
    
    const duration = 800;
    const start = 0;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);
        
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = target;
        }
    }
    
    requestAnimationFrame(update);
}

// Logout
function logout() {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        forceLogout();
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🍎 Dashboard Liquid Glass - Iniciando...');
    
    // Verificar autenticación (con refresh automático si expira)
    if (window.agAuth) {
        const ok = await window.agAuth.requireAuth();
        if (!ok) return;
    } else {
        // Fallback: verificación simple sin refresh
        if (!getAuthToken()) return;
    }
    
    // Cargar datos en paralelo para máxima velocidad
    try {
        await Promise.all([
            loadUserInfo(),
            loadDashboardStats()
        ]);
    } catch (err) {
        console.error('Error inicializando dashboard:', err);
    }
    
    // Preload de páginas frecuentes (mobile perf)
    if ('connection' in navigator && navigator.connection.saveData !== true) {
        const preloadLinks = [
            'parcels/parcels-dashboard.html',
            'crop/crop_list.html'
        ];
        preloadLinks.forEach(href => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = href;
            document.head.appendChild(link);
        });
    }
    
    // Service Worker hint para PWA futura
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
        console.log('📱 PWA ready - service worker registration available');
    }
    
    console.log('✅ Dashboard cargado correctamente');
});
