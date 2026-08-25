/**
 * sidebar-controller.js — Menú lateral único de AgroTech (autocontenido).
 *
 * NO depende de fetch/partials/ES-modules. Se carga con un <script src> normal
 * e inyecta el sidebar + overlay + botón hamburguesa directamente en el DOM.
 */
(function () {
    'use strict';

    var CSS = [
        '#left-sidebar{position:static!important;width:auto!important;height:auto!important;background:transparent!important;border:none!important;overflow:visible!important;}',
        '.agro-sidebar{font-family:Inter,Poppins,Segoe UI,sans-serif;font-size:14px;background:rgba(255,255,255,0.96);border-right:1px solid rgba(0,0,0,0.06);width:230px;height:100vh;height:100dvh;position:fixed!important;top:0!important;left:0!important;overflow-y:auto;z-index:99999!important;box-shadow:4px 0 28px rgba(0,0,0,0.08);display:flex;flex-direction:column;}',
        '.agro-sidebar .brand{padding:26px 0 18px;text-align:center;border-bottom:1px solid rgba(0,0,0,0.05);position:relative;flex-shrink:0;}',
        '.agro-sidebar .brand img{max-width:68px;margin:0 auto;display:block;}',
        '.agro-sidebar .brand .name{color:#1D1D1F;font-weight:700;font-size:0.75rem;margin-top:8px;letter-spacing:1.2px;text-transform:uppercase;}',
        '.agro-sidebar .close{display:none;position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.05);border:none;width:32px;height:32px;border-radius:50%;color:#2C3E50;font-size:16px;cursor:pointer;}',
        '.agro-sidebar .menu{list-style:none;padding:12px 0;margin:0;flex:1;overflow-y:auto;}',
        '.agro-sidebar .menu .section{font-size:0.62rem;text-transform:uppercase;letter-spacing:1.5px;color:rgba(0,0,0,0.32);padding:14px 22px 4px;font-weight:700;}',
        '.agro-sidebar .menu a{display:flex;align-items:center;gap:11px;color:rgba(44,62,80,0.78);padding:10px 16px;margin:2px 10px;border-radius:12px;text-decoration:none;font-size:13.5px;font-weight:500;transition:all .25s;}',
        '.agro-sidebar .menu a i{font-size:1.1em;color:rgba(44,62,80,0.45);width:20px;text-align:center;flex-shrink:0;}',
        '.agro-sidebar .menu a:hover{background:rgba(46,139,87,0.08);color:#1D1D1F;}',
        '.agro-sidebar .menu a.active{background:linear-gradient(135deg,rgba(46,139,87,0.14),rgba(255,159,10,0.08));color:#1D1D1F;font-weight:700;}',
        '.agro-sidebar .menu a.active i{color:#2FB344;}',
        '.agro-sidebar .foot{padding:14px 18px;border-top:1px solid rgba(0,0,0,0.05);flex-shrink:0;}',
        '.agro-sidebar .foot .v{font-size:0.65rem;color:rgba(0,0,0,0.3);text-align:center;}',
        '.agro-overlay{display:none;position:fixed;inset:0;background:rgba(44,62,80,0.3);z-index:99998;opacity:0;transition:opacity .3s;}',
        '.agro-overlay.show{opacity:1;}',
        '.agro-fab{display:none;position:fixed;top:12px;left:12px;z-index:99997;width:42px;height:42px;border-radius:12px;border:none;background:rgba(255,255,255,0.9);box-shadow:0 2px 10px rgba(0,0,0,0.15);color:#2C3E50;font-size:20px;cursor:pointer;}',
        '@media(max-width:991px){.agro-sidebar{transform:translateX(-100%);transition:transform .32s cubic-bezier(.4,0,.2,1);width:280px;max-width:84vw;}.agro-sidebar.show{transform:translateX(0);}.agro-sidebar .close{display:flex;align-items:center;justify-content:center;}.agro-overlay{display:block;}.agro-fab{display:flex;align-items:center;justify-content:center;}}',
        '@media(min-width:992px){#main-content{margin-left:230px!important;width:calc(100% - 230px)!important;}}'
    ].join('\n');

    var MENU = [
        { section: 'Principal' },
        { href: '/templates/dashboard.html', icon: 'ti ti-home', label: 'Dashboard', page: 'dashboard' },
        { href: '/templates/parcels/parcels-dashboard.html', icon: 'ti ti-map-2', label: 'Parcelas', page: 'parcels' },
        { href: '/templates/crop/crop_list.html', icon: 'ti ti-plant', label: 'Cultivos', page: 'crop' },
        { section: 'Gestión' },
        { href: '/templates/inventory/inventario-dashboard.html', icon: 'ti ti-box', label: 'Inventario', page: 'inventory' },
        { href: '/templates/employees/RRHH-dashboard.html', icon: 'ti ti-users', label: 'Empleados', page: 'employees' },
        { href: '/templates/labores/labores-dashboard.html', icon: 'ti ti-checklist', label: 'Labores', page: 'labores' },
        { section: 'Suscripción' },
        { href: '/templates/billing.html', icon: 'ti ti-credit-card', label: 'Facturación', page: 'billing' },
        { href: '/templates/billing.html', icon: 'ti ti-chart-bar', label: 'Uso & Límites', page: 'billing-usage' },
        { section: 'Cuenta' },
        { href: '/templates/pages/profile.html', icon: 'ti ti-user-circle', label: 'Perfil', page: 'profile' }
    ];

    function buildMenuHTML() {
        var html = '';
        MENU.forEach(function (item) {
            if (item.section) {
                html += '<li class="section" style="font-size:0.62rem;text-transform:uppercase;letter-spacing:1.5px;color:#9aa0a6;padding:14px 22px 4px;font-weight:700;">' + item.section + '</li>';
            } else {
                html += '<li><a href="' + item.href + '" data-page="' + item.page + '" style="display:flex;align-items:center;gap:11px;padding:10px 16px;margin:2px 10px;border-radius:12px;color:#2C3E50;text-decoration:none;font-size:13.5px;font-weight:500;"><i class="' + item.icon + '" style="font-size:1.1em;color:#4a5568;width:20px;text-align:center;flex-shrink:0;"></i> ' + item.label + '</a></li>';
            }
        });
        html += '<li><a href="#" data-page="logout" style="display:flex;align-items:center;gap:11px;padding:10px 16px;margin:2px 10px;border-radius:12px;color:#e53e3e;text-decoration:none;font-size:13.5px;font-weight:500;" onclick="if(confirm(\'¿Cerrar sesión?\')){localStorage.clear();sessionStorage.clear();window.location.href=\'/login\';}return false;"><i class="ti ti-logout" style="font-size:1.1em;color:#e53e3e;width:20px;text-align:center;flex-shrink:0;"></i> Cerrar Sesión</a></li>';
        return html;
    }

    function inject() {
        // Iconos Tabler (para los íconos del menú)
        if (!document.getElementById('agro-tabler')) {
            var lnk = document.createElement('link');
            lnk.id = 'agro-tabler';
            lnk.rel = 'stylesheet';
            lnk.href = 'https://unpkg.com/@tabler/icons-webfont@latest/tabler-icons.min.css';
            document.head.appendChild(lnk);
        }

        // CSS
        if (!document.getElementById('agro-sidebar-css')) {
            var st = document.createElement('style');
            st.id = 'agro-sidebar-css';
            st.textContent = CSS;
            document.head.appendChild(st);
        }

        // Overlay
        if (!document.getElementById('agroOverlay')) {
            var ov = document.createElement('div');
            ov.id = 'agroOverlay';
            ov.className = 'agro-overlay';
            ov.addEventListener('click', closeSidebar);
            document.body.appendChild(ov);
        }

        // Sidebar
        var container = document.getElementById('left-sidebar');
        if (container && !document.getElementById('agroSidebar')) {
            container.innerHTML =
                '<div class="agro-sidebar" id="agroSidebar" style="background:#ffffff;color:#1D1D1F;">' +
                '<div class="brand"><button class="close" id="agroClose">&times;</button>' +
                '<a href="/templates/dashboard.html"><img src="/images/agrotech-negro.png" alt="AgroTech"></a>' +
                '<div class="name" style="color:#1D1D1F;">AgroTech Digital</div></div>' +
                '<ul class="menu">' + buildMenuHTML() + '</ul>' +
                '<div class="foot"><div class="v" style="color:#9aa0a6;">v2.0 — Liquid Glass UI</div></div>' +
                '</div>';
            var closeBtn = document.getElementById('agroClose');
            if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
        }

        // Hamburger FAB
        if (!document.getElementById('agroFab')) {
            var fab = document.createElement('button');
            fab.id = 'agroFab';
            fab.className = 'agro-fab';
            fab.innerHTML = '<i class="ti ti-menu-2"></i>';
            fab.setAttribute('aria-label', 'Abrir menú');
            fab.addEventListener('click', toggleSidebar);
            document.body.appendChild(fab);
        }

        markActive();
    }

    function getSidebar() { return document.getElementById('agroSidebar'); }
    function getOverlay() { return document.getElementById('agroOverlay'); }

    function closeSidebar() {
        var s = getSidebar(); var o = getOverlay();
        if (s) s.classList.remove('show');
        if (o) o.classList.remove('show');
    }
    function toggleSidebar() {
        var s = getSidebar(); var o = getOverlay();
        if (!s) return;
        if (s.classList.contains('show')) { closeSidebar(); }
        else { s.classList.add('show'); if (o) o.classList.add('show'); }
    }

    window.toggleSidebar = toggleSidebar;
    window.closeSidebar = closeSidebar;

    document.addEventListener('click', function (e) {
        var link = e.target && e.target.closest ? e.target.closest('#agroSidebar a[href]') : null;
        if (link && window.innerWidth <= 991) closeSidebar();
    });

    function markActive() {
        var s = getSidebar();
        if (!s) return;
        var path = window.location.pathname.toLowerCase();
        s.querySelectorAll('a.active').forEach(function (a) { a.classList.remove('active'); });
        s.querySelectorAll('a[data-page]').forEach(function (link) {
            var p = link.getAttribute('data-page');
            if (
                (p === 'parcels' && path.includes('parcels')) ||
                (p === 'crop' && path.includes('crop')) ||
                (p === 'labores' && path.includes('labores')) ||
                (p === 'inventory' && path.includes('inventory')) ||
                (p === 'employees' && (path.includes('employees') || path.includes('RRHH'))) ||
                (p === 'billing' && path.includes('billing')) ||
                (p === 'billing-usage' && path.includes('billing')) ||
                (p === 'profile' && path.includes('profile')) ||
                (p === 'dashboard' && (path.includes('dashboard.html') || path === '/' || path === '/templates/'))
            ) { link.classList.add('active'); }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }
    // Reintento por si el contenedor #left-sidebar aparece tarde
    setTimeout(inject, 500);
})();
