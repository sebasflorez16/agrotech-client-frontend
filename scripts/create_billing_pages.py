#!/usr/bin/env python3
"""
Genera las páginas de billing para el frontend estático.
Usa el mismo style.css del landing y conecta al backend via config.js
"""
import os

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'templates', 'billing')
os.makedirs(BASE, exist_ok=True)

# ═══════════════════════════════════════════════
# Shared HTML fragments
# ═══════════════════════════════════════════════

NAVBAR = '''    <!-- Navbar -->
    <nav class="navbar">
        <div class="container">
            <div class="nav-content">
                <div class="logo">
                    <img src="../../images/agrotech solo blanco.png" alt="AgroTech Digital">
                    <span>AgroTech Digital</span>
                </div>
                <div class="nav-menu">
                    <a href="../../index.html#features">Características</a>
                    <a href="pricing.html" {planes_active}>Planes</a>
                    <a href="../authentication/login.html" class="btn-primary-nav">Iniciar Sesión</a>
                </div>
            </div>
        </div>
    </nav>'''

FOOTER = '''    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-col">
                    <div class="logo">
                        <img src="../../images/agrotech solo blanco.png" alt="AgroTech Digital">
                        <span>AgroTech Digital</span>
                    </div>
                    <p>Agricultura de precisión con análisis satelital avanzado para maximizar tu producción.</p>
                </div>
                <div class="footer-col">
                    <h4>Producto</h4>
                    <a href="../../index.html#features">Características</a>
                    <a href="pricing.html">Planes</a>
                    <a href="../authentication/login.html">Iniciar Sesión</a>
                </div>
                <div class="footer-col">
                    <h4>Empresa</h4>
                    <a href="#">Sobre Nosotros</a>
                    <a href="#">Blog</a>
                    <a href="#">Contacto</a>
                </div>
                <div class="footer-col">
                    <h4>Contacto</h4>
                    <p>info@agrotechdigital.com</p>
                    <p>+57 300 123 4567</p>
                    <p>Bogotá, Colombia</p>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2026 AgroTech Digital. Todos los derechos reservados.</p>
            </div>
        </div>
    </footer>'''

HEAD_START = '''<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} - AgroTech Digital</title>
    <link rel="shortcut icon" href="../../images/agrotech solo blanco.png">
    <link rel="stylesheet" href="../../style.css">
    <link href="https://unpkg.com/@tabler/icons-webfont@latest/tabler-icons.min.css" rel="stylesheet" />
    <script src="../../js/config.js"></script>'''


# ═══════════════════════════════════════════════
# 1. PRICING PAGE
# ═══════════════════════════════════════════════

pricing_html = HEAD_START.format(title='Planes y Precios') + '''
    <style>
        .billing-toggle { display:flex; align-items:center; justify-content:center; gap:16px; margin:-32px 0 48px; }
        .billing-toggle span { font-size:15px; font-weight:500; color:var(--gris-600); transition:var(--transition-smooth); cursor:pointer; }
        .billing-toggle span.active { color:var(--texto-claro); font-weight:600; }
        .toggle-switch { position:relative; width:56px; height:28px; background:var(--gris-800); border-radius:14px; cursor:pointer; transition:var(--transition-smooth); border:1px solid rgba(255,255,255,0.08); }
        .toggle-switch.active { background:var(--verde-principal); border-color:var(--verde-claro); }
        .toggle-switch::after { content:''; position:absolute; top:3px; left:3px; width:20px; height:20px; background:#fff; border-radius:50%; transition:var(--transition-smooth); box-shadow:0 2px 4px rgba(0,0,0,0.3); }
        .toggle-switch.active::after { left:31px; }
        .save-badge { background:var(--naranja); color:#000; padding:4px 12px; border-radius:980px; font-size:12px; font-weight:700; }
        .price-savings { display:block; font-size:13px; color:var(--verde-claro); margin-top:8px; font-weight:500; }
        .limit-tag { margin-left:auto; background:rgba(255,255,255,0.06); padding:2px 10px; border-radius:980px; font-size:12px; font-weight:600; color:var(--gris-400); }
        .btn-plan { cursor:pointer; }
        .btn-plan:disabled,.btn-plan.disabled { background:rgba(255,255,255,0.03)!important; color:var(--gris-600)!important; border-color:rgba(255,255,255,0.04)!important; cursor:not-allowed; transform:none!important; }
        .comparison-section { margin-top:100px; padding-top:60px; border-top:1px solid rgba(255,255,255,0.06); }
        .comparison-section h3 { text-align:center; font-size:28px; font-weight:700; margin-bottom:40px; letter-spacing:-0.02em; }
        .comparison-table { width:100%; border-collapse:collapse; }
        .comparison-table th,.comparison-table td { padding:16px 20px; text-align:center; border-bottom:1px solid rgba(255,255,255,0.04); font-size:14px; }
        .comparison-table th { background:var(--gris-950); font-weight:600; font-size:15px; }
        .comparison-table td:first-child { text-align:left; font-weight:500; color:var(--gris-200); }
        .comparison-table td { color:var(--gris-400); }
        .table-check { color:var(--verde-claro); font-size:18px; }
        .table-cross { color:rgba(255,255,255,0.15); font-size:18px; }
        .faq-section { margin-top:80px; }
        .faq-section h3 { text-align:center; font-size:28px; font-weight:700; margin-bottom:40px; }
        .faq-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }
        .faq-card { background:var(--gris-950); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:24px; transition:var(--transition-smooth); }
        .faq-card:hover { border-color:rgba(255,255,255,0.12); }
        .faq-card h5 { font-size:15px; font-weight:600; margin-bottom:8px; }
        .faq-card p { font-size:14px; color:var(--gris-400); line-height:1.6; margin:0; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @media(max-width:768px) { .faq-grid{grid-template-columns:1fr;} .comparison-section{overflow-x:auto;} }
    </style>
</head>
<body>
''' + NAVBAR.replace('{planes_active}', 'style="color:#fff;font-weight:600;"') + '''

    <section class="pricing" style="padding-top:140px;">
        <div class="container">
            <h2 class="section-title">Planes para cada necesidad</h2>
            <p class="section-subtitle">Selecciona el plan perfecto para tu operación agrícola</p>

            <div class="billing-toggle">
                <span class="toggle-monthly active" onclick="setBilling(false)">Mensual</span>
                <div class="toggle-switch" id="billingToggle"></div>
                <span class="toggle-yearly" onclick="setBilling(true)">Anual</span>
                <span class="save-badge">Ahorra 20%</span>
            </div>

            <div class="pricing-grid" id="pricingCards">
                <div style="grid-column:1/-1;text-align:center;padding:60px 0;">
                    <div style="width:40px;height:40px;border:3px solid rgba(255,255,255,0.1);border-top-color:var(--verde-claro);border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px;"></div>
                    <p style="color:var(--gris-400);">Cargando planes...</p>
                </div>
            </div>

            <div class="comparison-section">
                <h3>Comparación de Características</h3>
                <div style="overflow-x:auto;">
                    <table class="comparison-table">
                        <thead><tr><th style="text-align:left;">Característica</th><th>Explorador</th><th>Agricultor</th><th>Empresarial</th></tr></thead>
                        <tbody>
                            <tr><td><i class="ti ti-map-pin" style="color:var(--verde-claro);margin-right:8px;"></i> Hectáreas</td><td>50 ha</td><td>300 ha</td><td>1,000 ha</td></tr>
                            <tr><td><i class="ti ti-satellite" style="color:var(--verde-claro);margin-right:8px;"></i> Análisis/mes</td><td>10</td><td>100</td><td>500</td></tr>
                            <tr><td><i class="ti ti-users" style="color:var(--verde-claro);margin-right:8px;"></i> Usuarios</td><td>1</td><td>3</td><td>10</td></tr>
                            <tr><td><i class="ti ti-layout-grid" style="color:var(--verde-claro);margin-right:8px;"></i> Parcelas</td><td>3</td><td>10</td><td>50</td></tr>
                            <tr><td><i class="ti ti-chart-line" style="color:var(--verde-claro);margin-right:8px;"></i> Análisis NDVI</td><td><span class="table-check">✓</span></td><td><span class="table-check">✓</span></td><td><span class="table-check">✓</span></td></tr>
                            <tr><td><i class="ti ti-droplet" style="color:var(--verde-claro);margin-right:8px;"></i> Estrés Hídrico</td><td><span class="table-cross">✗</span></td><td><span class="table-check">✓</span></td><td><span class="table-check">✓</span></td></tr>
                            <tr><td><i class="ti ti-cloud-rain" style="color:var(--verde-claro);margin-right:8px;"></i> Pronóstico Climático</td><td><span class="table-cross">✗</span></td><td><span class="table-check">✓</span></td><td><span class="table-check">✓</span></td></tr>
                            <tr><td><i class="ti ti-code" style="color:var(--verde-claro);margin-right:8px;"></i> Acceso API</td><td><span class="table-cross">✗</span></td><td><span class="table-cross">✗</span></td><td><span class="table-check">✓</span></td></tr>
                            <tr><td><i class="ti ti-headset" style="color:var(--verde-claro);margin-right:8px;"></i> Soporte Prioritario</td><td><span class="table-cross">✗</span></td><td><span class="table-check">✓</span></td><td><span class="table-check">✓</span></td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="faq-section">
                <h3>Preguntas Frecuentes</h3>
                <div class="faq-grid">
                    <div class="faq-card"><h5><i class="ti ti-credit-card" style="color:var(--verde-claro);margin-right:6px;"></i> ¿Qué métodos de pago aceptan?</h5><p>Aceptamos tarjetas de crédito/débito, PSE y otros métodos locales a través de MercadoPago para Colombia.</p></div>
                    <div class="faq-card"><h5><i class="ti ti-refresh" style="color:var(--verde-claro);margin-right:6px;"></i> ¿Puedo cambiar de plan?</h5><p>Sí, puedes mejorar tu plan en cualquier momento. El cambio se aplica inmediatamente.</p></div>
                    <div class="faq-card"><h5><i class="ti ti-arrow-back-up" style="color:var(--verde-claro);margin-right:6px;"></i> ¿Puedo cancelar en cualquier momento?</h5><p>Sí, puedes cancelar tu suscripción cuando quieras. No hay contratos ni compromisos.</p></div>
                    <div class="faq-card"><h5><i class="ti ti-gift" style="color:var(--verde-claro);margin-right:6px;"></i> ¿Hay período de prueba?</h5><p>Todos los planes pagos incluyen 14 días de prueba gratis. Cancela antes si no estás satisfecho.</p></div>
                </div>
            </div>
        </div>
    </section>

''' + FOOTER + '''

    <script>
    document.addEventListener('DOMContentLoaded', function() {
        var API = window.AGROTECH_CONFIG.API_BASE;
        var toggle = document.getElementById('billingToggle');
        var monthlyLabel = document.querySelector('.toggle-monthly');
        var yearlyLabel = document.querySelector('.toggle-yearly');
        var grid = document.getElementById('pricingCards');
        var isYearly = false;
        var plans = [];

        toggle.addEventListener('click', function() { setBilling(!isYearly); });

        window.setBilling = function(yearly) {
            isYearly = yearly;
            toggle.classList.toggle('active', isYearly);
            monthlyLabel.classList.toggle('active', !isYearly);
            yearlyLabel.classList.toggle('active', isYearly);
            render();
        };

        function fetchPlans() {
            fetch(API + '/billing/api/plans/')
                .then(function(r) { return r.json(); })
                .then(function(data) { plans = data; render(); })
                .catch(function() {
                    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 0;"><p style="color:var(--gris-400);">Error cargando planes. Recarga la página.</p></div>';
                });
        }

        function fmt(n) { return new Intl.NumberFormat('es-CO').format(n); }

        var featureMap = {
            'basic_analytics': 'Análisis básico (NDVI)',
            'advanced_analytics': 'Análisis avanzado',
            'weather_forecast': 'Pronóstico climático',
            'api_access': 'Acceso a API'
        };

        function render() {
            grid.innerHTML = plans.map(function(p) {
                var featured = p.tier === 'basic';
                var price = isYearly ? p.yearly_discount.yearly_price_cop : parseFloat(p.price_cop);
                var period = isYearly ? '/año' : '/mes';
                var savings = (isYearly && p.yearly_discount.savings_cop > 0)
                    ? '<span class="price-savings">Ahorras $' + fmt(p.yearly_discount.savings_cop) + '</span>' : '';

                var items = [
                    '<li><span class="check">✓</span> Hasta ' + p.limits.hectares + ' hectáreas <span class="limit-tag">' + p.limits.hectares + ' ha</span></li>',
                    '<li><span class="check">✓</span> ' + p.limits.eosda_requests + ' análisis/mes <span class="limit-tag">' + p.limits.eosda_requests + '</span></li>',
                    '<li><span class="check">✓</span> ' + p.limits.users + ' usuario' + (p.limits.users > 1 ? 's' : '') + '</li>',
                    '<li><span class="check">✓</span> ' + p.limits.parcels + ' parcela' + (p.limits.parcels > 1 ? 's' : '') + '</li>'
                ];
                p.features_included.forEach(function(f) {
                    items.push('<li><span class="check">✓</span> ' + (featureMap[f] || f) + '</li>');
                });
                p.features_excluded.forEach(function(f) {
                    items.push('<li><span class="cross">✗</span> <span style="color:var(--gris-600)">' + (featureMap[f] || f) + '</span></li>');
                });

                var btn = (p.tier === 'free')
                    ? '<button class="btn-plan disabled" disabled>Plan Actual</button>'
                    : '<button class="btn-plan" onclick="selectPlan(\\'' + p.tier + '\\')">Comenzar Ahora</button>';

                return '<div class="pricing-card ' + (featured ? 'featured' : '') + '">' +
                    (featured ? '<div class="badge">POPULAR</div>' : '') +
                    '<h3>' + p.name + '</h3>' +
                    '<div class="price">' +
                        (p.tier === 'free' ? '<span class="amount">Gratis</span>' :
                        '<span class="currency">$</span><span class="amount">' + fmt(price) + '</span><span class="period">' + period + '</span>') +
                    '</div>' + savings +
                    '<ul class="features-list">' + items.join('') + '</ul>' +
                    btn + '</div>';
            }).join('');
        }

        window.selectPlan = function(tier) {
            var cycle = isYearly ? 'yearly' : 'monthly';
            window.location.href = 'checkout.html?plan=' + tier + '&cycle=' + cycle;
        };

        fetchPlans();
    });
    </script>
</body>
</html>'''


# ═══════════════════════════════════════════════
# 2. CHECKOUT PAGE
# ═══════════════════════════════════════════════

checkout_html = HEAD_START.format(title='Checkout') + '''
    <style>
        .checkout-layout { display:grid; grid-template-columns:1fr 400px; gap:32px; padding:120px 0 60px; align-items:start; }
        .checkout-main h1 { font-size:clamp(28px,4vw,40px); font-weight:800; letter-spacing:-0.03em; margin-bottom:8px; }
        .checkout-main .subtitle { color:var(--gris-400); font-size:16px; margin-bottom:40px; }
        .checkout-steps { display:flex; gap:8px; margin-bottom:40px; }
        .step { display:flex; align-items:center; gap:8px; font-size:13px; font-weight:500; color:var(--gris-600); }
        .step.active { color:var(--verde-claro); }
        .step.completed { color:var(--gris-200); }
        .step-num { width:28px; height:28px; display:flex; align-items:center; justify-content:center; border-radius:50%; background:var(--gris-800); font-size:12px; font-weight:700; border:1px solid rgba(255,255,255,0.06); }
        .step.active .step-num { background:var(--verde-claro); color:#000; border-color:var(--verde-claro); }
        .step-divider { width:32px; height:1px; background:rgba(255,255,255,0.08); align-self:center; }
        .form-card { background:var(--gris-950); border:1px solid rgba(255,255,255,0.06); border-radius:var(--radius-lg); padding:32px; margin-bottom:20px; }
        .form-card h3 { font-size:18px; font-weight:700; margin-bottom:20px; display:flex; align-items:center; gap:10px; }
        .form-card h3 i { color:var(--verde-claro); font-size:20px; }
        .form-group { margin-bottom:20px; }
        .form-group label { display:block; font-size:13px; font-weight:600; color:var(--gris-200); margin-bottom:8px; letter-spacing:0.02em; }
        .form-input { width:100%; padding:14px 16px; background:var(--gris-900); border:1px solid rgba(255,255,255,0.08); border-radius:12px; color:var(--texto-claro); font-size:15px; font-family:'Inter',sans-serif; transition:var(--transition-smooth); outline:none; box-sizing:border-box; }
        .form-input:focus { border-color:var(--verde-claro); box-shadow:0 0 0 3px rgba(52,199,89,0.15); }
        .form-input::placeholder { color:var(--gris-600); }
        .payment-method { display:flex; align-items:center; gap:16px; padding:18px 20px; background:var(--gris-900); border:1px solid rgba(52,199,89,0.2); border-radius:12px; }
        .payment-logo { height:32px; object-fit:contain; }
        .payment-info h4 { font-size:14px; font-weight:600; margin:0 0 2px; }
        .payment-info p { font-size:12px; color:var(--gris-400); margin:0; }
        .payment-check { margin-left:auto; color:var(--verde-claro); font-size:18px; }
        .terms-label { display:flex; align-items:flex-start; gap:10px; cursor:pointer; font-size:13px; color:var(--gris-400); line-height:1.5; margin-top:20px; }
        .terms-label input[type="checkbox"] { appearance:none; -webkit-appearance:none; width:20px; height:20px; min-width:20px; background:var(--gris-900); border:1px solid rgba(255,255,255,0.12); border-radius:6px; cursor:pointer; position:relative; transition:var(--transition-smooth); margin-top:1px; }
        .terms-label input[type="checkbox"]:checked { background:var(--verde-claro); border-color:var(--verde-claro); }
        .terms-label input[type="checkbox"]:checked::after { content:'✓'; position:absolute; color:#000; font-size:14px; font-weight:700; top:50%; left:50%; transform:translate(-50%,-50%); }
        .terms-label a { color:var(--verde-claro); }
        .btn-checkout { display:flex; align-items:center; justify-content:center; gap:10px; width:100%; padding:16px; background:var(--verde-claro); color:#000; border:none; border-radius:980px; font-size:16px; font-weight:700; font-family:'Inter',sans-serif; cursor:pointer; transition:var(--transition-smooth); margin-top:24px; }
        .btn-checkout:hover { background:var(--verde-accent); box-shadow:0 8px 24px rgba(52,199,89,0.3); transform:scale(1.01); }
        .btn-checkout:disabled { background:var(--gris-800); color:var(--gris-600); cursor:not-allowed; transform:none; box-shadow:none; }
        .order-summary { background:var(--gris-950); border:1px solid rgba(255,255,255,0.06); border-radius:var(--radius-xl); padding:36px; position:sticky; top:100px; }
        .order-summary h3 { font-size:16px; font-weight:700; margin-bottom:24px; }
        .order-plan { display:flex; align-items:center; gap:14px; padding-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.06); margin-bottom:20px; }
        .plan-icon { width:48px; height:48px; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,rgba(52,199,89,0.15),rgba(52,199,89,0.05)); border-radius:14px; font-size:22px; color:var(--verde-claro); }
        .plan-label h4 { font-size:16px; font-weight:700; margin:0 0 2px; }
        .plan-label span { font-size:13px; color:var(--gris-400); }
        .order-row { display:flex; justify-content:space-between; align-items:center; padding:8px 0; font-size:14px; color:var(--gris-400); }
        .order-row.total { padding-top:16px; margin-top:12px; border-top:1px solid rgba(255,255,255,0.06); font-size:18px; font-weight:800; color:var(--texto-claro); }
        .order-total-price { color:var(--verde-claro); }
        .secure-badge { display:flex; align-items:center; justify-content:center; gap:8px; margin-top:24px; font-size:12px; color:var(--gris-600); }
        .secure-badge i { color:var(--verde-claro); }
        .loading-overlay { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); backdrop-filter:blur(8px); z-index:9999; align-items:center; justify-content:center; flex-direction:column; gap:20px; }
        .loading-overlay.show { display:flex; }
        .loading-spinner { width:48px; height:48px; border:3px solid rgba(255,255,255,0.1); border-top-color:var(--verde-claro); border-radius:50%; animation:spin 0.8s linear infinite; }
        .loading-text { font-size:16px; font-weight:500; }
        @keyframes spin { to{transform:rotate(360deg);} }
        @media(max-width:860px) { .checkout-layout{grid-template-columns:1fr;} .order-summary{position:static;order:-1;} }
    </style>
</head>
<body>
    <div class="loading-overlay" id="loadingOverlay">
        <div class="loading-spinner"></div>
        <div class="loading-text">Redirigiendo a MercadoPago...</div>
    </div>

''' + NAVBAR.replace('{planes_active}', '') + '''

    <div class="container">
        <div class="checkout-layout">
            <div class="checkout-main">
                <h1>Finalizar compra</h1>
                <p class="subtitle">Estás a un paso de potenciar tu agricultura.</p>

                <div class="checkout-steps">
                    <div class="step completed"><span class="step-num">✓</span> Plan</div>
                    <div class="step-divider"></div>
                    <div class="step active"><span class="step-num">2</span> Datos</div>
                    <div class="step-divider"></div>
                    <div class="step"><span class="step-num">3</span> Pago</div>
                </div>

                <div class="form-card">
                    <h3><i class="ti ti-mail"></i> Datos de contacto</h3>
                    <div class="form-group">
                        <label for="payerEmail">Correo Electrónico</label>
                        <input type="email" class="form-input" id="payerEmail" placeholder="correo@ejemplo.com" required autocomplete="email">
                    </div>
                </div>

                <div class="form-card">
                    <h3><i class="ti ti-shield-lock"></i> Método de Pago</h3>
                    <div class="payment-method">
                        <img src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/badge.svg" alt="MercadoPago" class="payment-logo" onerror="this.style.display='none'">
                        <div class="payment-info">
                            <h4>MercadoPago</h4>
                            <p>Tarjeta de crédito, débito, PSE y más</p>
                        </div>
                        <span class="payment-check">✓</span>
                    </div>
                    <label class="terms-label">
                        <input type="checkbox" id="termsCheck">
                        <span>Acepto los <a href="#">Términos y Condiciones</a> y la <a href="#">Política de Privacidad</a> de AgroTech Digital</span>
                    </label>
                </div>

                <button class="btn-checkout" id="btnCheckout" disabled>
                    <i class="ti ti-lock"></i>
                    <span>Proceder al pago seguro</span>
                </button>
            </div>

            <aside class="order-summary">
                <h3>Resumen del Pedido</h3>
                <div class="order-plan">
                    <div class="plan-icon"><i class="ti ti-rocket"></i></div>
                    <div class="plan-label">
                        <h4 id="summaryPlanName">—</h4>
                        <span id="summaryCycle">—</span>
                    </div>
                </div>
                <div class="order-row"><span>Plan</span><span id="summaryPlanPrice">$0</span></div>
                <div class="order-row"><span>Impuestos</span><span>Incluidos</span></div>
                <div class="order-row total"><span>Total</span><span class="order-total-price" id="summaryTotal">$0</span></div>
                <div class="secure-badge"><i class="ti ti-lock"></i> Pago 100% seguro y encriptado</div>
            </aside>
        </div>
    </div>

''' + FOOTER + '''

    <script>
    document.addEventListener('DOMContentLoaded', function() {
        var API = window.AGROTECH_CONFIG.API_BASE;
        var params = new URLSearchParams(window.location.search);
        var planTier = params.get('plan') || 'basic';
        var billingCycle = params.get('cycle') || 'monthly';

        var emailInput = document.getElementById('payerEmail');
        var termsCheck = document.getElementById('termsCheck');
        var btnCheckout = document.getElementById('btnCheckout');

        function checkValid() {
            var emailOk = emailInput.value.indexOf('@') > -1 && emailInput.value.indexOf('.') > -1;
            btnCheckout.disabled = !(emailOk && termsCheck.checked);
        }
        emailInput.addEventListener('input', checkValid);
        termsCheck.addEventListener('change', checkValid);

        function fmtCOP(n) { return '$' + new Intl.NumberFormat('es-CO').format(n); }

        // Load plan info
        fetch(API + '/billing/api/plans/')
            .then(function(r) { return r.json(); })
            .then(function(plans) {
                var plan = plans.find(function(p) { return p.tier === planTier; });
                if (!plan) return;
                var isYearly = billingCycle === 'yearly';
                var price = isYearly ? plan.yearly_discount.yearly_price_cop : parseFloat(plan.price_cop);
                document.getElementById('summaryPlanName').textContent = plan.name;
                document.getElementById('summaryCycle').textContent = isYearly ? 'Facturación anual' : 'Facturación mensual';
                document.getElementById('summaryPlanPrice').textContent = fmtCOP(price);
                document.getElementById('summaryTotal').textContent = fmtCOP(price);
            });

        btnCheckout.addEventListener('click', function() {
            btnCheckout.disabled = true;
            document.getElementById('loadingOverlay').classList.add('show');

            fetch(API + '/billing/api/create-checkout/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan_tier: planTier,
                    billing_cycle: billingCycle,
                    payer_email: emailInput.value.trim()
                })
            })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.checkout_url) {
                    window.location.href = data.checkout_url;
                } else {
                    throw new Error(data.error || 'Error al crear el checkout');
                }
            })
            .catch(function(e) {
                document.getElementById('loadingOverlay').classList.remove('show');
                btnCheckout.disabled = false;
                alert('Error: ' + e.message);
            });
        });
    });
    </script>
</body>
</html>'''


# ═══════════════════════════════════════════════
# 3. SUCCESS PAGE
# ═══════════════════════════════════════════════

success_html = HEAD_START.format(title='¡Pago Exitoso!') + '''
    <style>
        .success-container { text-align:center; padding:140px 0 60px; max-width:680px; margin:0 auto; }
        #confettiCanvas { position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:9999; }
        .success-icon { width:96px; height:96px; border-radius:50%; background:linear-gradient(135deg,rgba(52,199,89,0.2),rgba(52,199,89,0.05)); border:2px solid rgba(52,199,89,0.3); display:flex; align-items:center; justify-content:center; margin:0 auto 32px; animation:scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1); }
        .success-icon i { font-size:44px; color:var(--verde-claro); }
        @keyframes scaleIn { 0%{transform:scale(0);opacity:0;} 100%{transform:scale(1);opacity:1;} }
        .success-container h1 { font-size:clamp(28px,5vw,44px); font-weight:800; letter-spacing:-0.03em; margin-bottom:12px; }
        .success-container .subtitle { font-size:17px; color:var(--gris-400); margin-bottom:48px; }
        .details-card { background:var(--gris-950); border:1px solid rgba(255,255,255,0.06); border-radius:var(--radius-xl); padding:36px; text-align:left; margin-bottom:32px; }
        .details-card h3 { font-size:16px; font-weight:700; margin-bottom:20px; display:flex; align-items:center; gap:8px; }
        .details-card h3 i { color:var(--verde-claro); }
        .detail-row { display:flex; justify-content:space-between; align-items:center; padding:14px 0; border-bottom:1px solid rgba(255,255,255,0.04); font-size:14px; }
        .detail-row:last-child { border-bottom:none; }
        .detail-row .label { color:var(--gris-400); }
        .detail-row .value { font-weight:600; }
        .status-badge { display:inline-flex; align-items:center; gap:6px; background:rgba(52,199,89,0.15); color:var(--verde-claro); padding:4px 14px; border-radius:980px; font-size:13px; font-weight:600; }
        .status-badge::before { content:''; width:6px; height:6px; background:var(--verde-claro); border-radius:50%; }
        .next-steps { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:40px; }
        .step-card { background:var(--gris-950); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:24px 20px; text-align:center; transition:var(--transition-smooth); }
        .step-card:hover { border-color:rgba(255,255,255,0.12); transform:translateY(-2px); }
        .step-card .snum { width:36px; height:36px; display:flex; align-items:center; justify-content:center; margin:0 auto 12px; background:rgba(52,199,89,0.12); border-radius:10px; color:var(--verde-claro); font-size:14px; font-weight:800; }
        .step-card h4 { font-size:14px; font-weight:600; margin-bottom:6px; }
        .step-card p { font-size:13px; color:var(--gris-400); margin:0; line-height:1.5; }
        .btn-dashboard { display:inline-flex; align-items:center; gap:10px; padding:16px 40px; background:var(--verde-claro); color:#000; border:none; border-radius:980px; font-size:16px; font-weight:700; font-family:'Inter',sans-serif; cursor:pointer; transition:var(--transition-smooth); text-decoration:none; }
        .btn-dashboard:hover { background:var(--verde-accent); box-shadow:0 8px 24px rgba(52,199,89,0.3); transform:scale(1.02); color:#000; }
        .btn-secondary-link { display:inline-flex; align-items:center; gap:8px; margin-top:16px; font-size:14px; font-weight:500; color:var(--gris-400); text-decoration:none; transition:var(--transition-smooth); }
        .btn-secondary-link:hover { color:var(--verde-claro); }
        @media(max-width:640px) { .next-steps{grid-template-columns:1fr;} .success-container{padding:100px 0 40px;} }
    </style>
</head>
<body>
    <canvas id="confettiCanvas"></canvas>

''' + NAVBAR.replace('{planes_active}', '') + '''

    <div class="container">
        <div class="success-container">
            <div class="success-icon"><i class="ti ti-circle-check"></i></div>
            <h1>¡Pago realizado con éxito!</h1>
            <p class="subtitle">Bienvenido a AgroTech Digital Premium. Tu suscripción está activa.</p>

            <div class="details-card">
                <h3><i class="ti ti-receipt"></i> Detalles de tu suscripción</h3>
                <div class="detail-row"><span class="label">Plan</span><span class="value" id="detailPlan">—</span></div>
                <div class="detail-row"><span class="label">Ciclo</span><span class="value" id="detailCycle">—</span></div>
                <div class="detail-row"><span class="label">ID de suscripción</span><span class="value" id="detailSubId">—</span></div>
                <div class="detail-row"><span class="label">Estado</span><span class="status-badge" id="detailStatus">Activo</span></div>
            </div>

            <h3 style="font-size:20px;font-weight:700;margin-bottom:20px;">Próximos pasos</h3>
            <div class="next-steps">
                <div class="step-card"><div class="snum">1</div><h4>Configura tu finca</h4><p>Agrega tus parcelas y define tus cultivos.</p></div>
                <div class="step-card"><div class="snum">2</div><h4>Análisis Satelital</h4><p>Ejecuta tu primer análisis NDVI en segundos.</p></div>
                <div class="step-card"><div class="snum">3</div><h4>Optimiza</h4><p>Revisa los informes y mejora tu rendimiento.</p></div>
            </div>

            <a href="../dashboard.html" class="btn-dashboard"><i class="ti ti-layout-dashboard"></i> Ir al Dashboard</a>
            <br>
            <a href="pricing.html" class="btn-secondary-link"><i class="ti ti-arrow-left"></i> Volver a planes</a>
        </div>
    </div>

''' + FOOTER + '''

    <script>
    document.addEventListener('DOMContentLoaded', function() {
        var params = new URLSearchParams(window.location.search);
        var planMap = {'basic':'Agricultor','pro':'Empresarial','free':'Explorador'};
        var tier = params.get('plan') || 'basic';
        var cycle = params.get('cycle') || 'monthly';
        document.getElementById('detailPlan').textContent = planMap[tier] || tier;
        document.getElementById('detailCycle').textContent = cycle === 'yearly' ? 'Anual' : 'Mensual';
        document.getElementById('detailSubId').textContent = params.get('preapproval_id') || params.get('subscription_id') || '—';

        // Confetti
        var canvas = document.getElementById('confettiCanvas');
        var ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        var colors = ['#34C759','#30D158','#007A20','#FF9F0A','#f5f5f7','#86868b'];
        var particles = [];
        for (var i = 0; i < 150; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                w: Math.random() * 10 + 4,
                h: Math.random() * 6 + 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                speed: Math.random() * 3 + 2,
                angle: Math.random() * Math.PI * 2,
                spin: (Math.random() - 0.5) * 0.1,
                drift: (Math.random() - 0.5) * 1
            });
        }
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            var alive = false;
            particles.forEach(function(p) {
                if (p.y < canvas.height + 20) alive = true;
                p.y += p.speed; p.x += p.drift; p.angle += p.spin;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height);
                ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
                ctx.restore();
            });
            if (alive) requestAnimationFrame(animate);
            else canvas.remove();
        }
        animate();
        window.addEventListener('resize', function() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
    });
    </script>
</body>
</html>'''


# ═══════════════════════════════════════════════
# 4. CANCEL PAGE
# ═══════════════════════════════════════════════

cancel_html = HEAD_START.format(title='Pago Cancelado') + '''
    <style>
        .cancel-container { text-align:center; padding:140px 0 60px; max-width:640px; margin:0 auto; }
        .cancel-icon { width:96px; height:96px; border-radius:50%; background:linear-gradient(135deg,rgba(255,159,10,0.2),rgba(255,159,10,0.05)); border:2px solid rgba(255,159,10,0.3); display:flex; align-items:center; justify-content:center; margin:0 auto 32px; animation:bounceIn 0.6s cubic-bezier(0.34,1.56,0.64,1); }
        .cancel-icon i { font-size:44px; color:var(--naranja); }
        @keyframes bounceIn { 0%{transform:scale(0) rotate(-10deg);opacity:0;} 60%{transform:scale(1.1) rotate(2deg);} 100%{transform:scale(1) rotate(0);opacity:1;} }
        .cancel-container h1 { font-size:clamp(28px,5vw,40px); font-weight:800; letter-spacing:-0.03em; margin-bottom:12px; }
        .cancel-container .subtitle { font-size:17px; color:var(--gris-400); margin-bottom:48px; line-height:1.6; }
        .help-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:40px; }
        .help-card { background:var(--gris-950); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:28px 20px; text-align:center; transition:var(--transition-smooth); text-decoration:none; cursor:pointer; display:block; }
        .help-card:hover { border-color:rgba(255,255,255,0.12); transform:translateY(-3px); box-shadow:0 16px 48px rgba(0,0,0,0.3); }
        .help-card-icon { width:48px; height:48px; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; background:rgba(255,255,255,0.04); border-radius:14px; font-size:22px; transition:var(--transition-smooth); }
        .help-card:nth-child(1) .help-card-icon { color:var(--verde-claro); }
        .help-card:nth-child(2) .help-card-icon { color:#25D366; }
        .help-card:nth-child(3) .help-card-icon { color:var(--naranja); }
        .help-card h4 { font-size:15px; font-weight:600; margin-bottom:6px; color:var(--texto-claro); }
        .help-card p { font-size:13px; color:var(--gris-400); margin:0; line-height:1.5; }
        .cta-group { display:flex; flex-direction:column; align-items:center; gap:16px; margin-bottom:48px; }
        .btn-retry { display:inline-flex; align-items:center; gap:10px; padding:16px 40px; background:var(--verde-claro); color:#000; border:none; border-radius:980px; font-size:16px; font-weight:700; font-family:'Inter',sans-serif; cursor:pointer; transition:var(--transition-smooth); text-decoration:none; }
        .btn-retry:hover { background:var(--verde-accent); box-shadow:0 8px 24px rgba(52,199,89,0.3); transform:scale(1.02); color:#000; }
        .btn-outline { display:inline-flex; align-items:center; gap:8px; padding:14px 32px; background:transparent; color:var(--texto-claro); border:1px solid rgba(255,255,255,0.12); border-radius:980px; font-size:15px; font-weight:600; font-family:'Inter',sans-serif; cursor:pointer; transition:var(--transition-smooth); text-decoration:none; }
        .btn-outline:hover { background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.2); color:var(--texto-claro); }
        .trial-banner { background:linear-gradient(165deg,rgba(52,199,89,0.08) 0%,var(--gris-950) 60%); border:1px solid rgba(52,199,89,0.15); border-radius:var(--radius-xl); padding:36px; display:flex; align-items:center; gap:24px; }
        .trial-icon { width:56px; height:56px; min-width:56px; display:flex; align-items:center; justify-content:center; background:rgba(52,199,89,0.12); border-radius:16px; font-size:26px; color:var(--verde-claro); }
        .trial-content { flex:1; text-align:left; }
        .trial-content h4 { font-size:17px; font-weight:700; margin-bottom:4px; }
        .trial-content p { font-size:14px; color:var(--gris-400); margin:0; }
        .btn-trial { display:inline-flex; align-items:center; gap:6px; padding:12px 24px; background:rgba(52,199,89,0.15); color:var(--verde-claro); border:1px solid rgba(52,199,89,0.2); border-radius:980px; font-size:14px; font-weight:600; font-family:'Inter',sans-serif; cursor:pointer; transition:var(--transition-smooth); text-decoration:none; white-space:nowrap; }
        .btn-trial:hover { background:var(--verde-claro); color:#000; }
        @media(max-width:640px) { .help-grid{grid-template-columns:1fr;} .cancel-container{padding:100px 0 40px;} .trial-banner{flex-direction:column;text-align:center;} .trial-content{text-align:center;} }
    </style>
</head>
<body>
''' + NAVBAR.replace('{planes_active}', '') + '''

    <div class="container">
        <div class="cancel-container">
            <div class="cancel-icon"><i class="ti ti-x"></i></div>
            <h1>Pago no completado</h1>
            <p class="subtitle">Tu proceso de pago fue cancelado. No se realizó ningún cargo.<br>Puedes intentarlo de nuevo o explorar otras opciones.</p>

            <div class="help-grid">
                <div class="help-card" onclick="window.location.href='pricing.html'">
                    <div class="help-card-icon"><i class="ti ti-arrows-exchange"></i></div>
                    <h4>Cambiar de plan</h4>
                    <p>Explora otros planes que se ajusten a tu presupuesto.</p>
                </div>
                <a href="https://wa.me/573001234567?text=Hola%2C%20necesito%20ayuda%20con%20mi%20suscripción" class="help-card" target="_blank">
                    <div class="help-card-icon"><i class="ti ti-brand-whatsapp"></i></div>
                    <h4>WhatsApp</h4>
                    <p>Habla con nuestro equipo de soporte en tiempo real.</p>
                </a>
                <a href="mailto:soporte@agrotechdigital.co" class="help-card">
                    <div class="help-card-icon"><i class="ti ti-mail"></i></div>
                    <h4>Email</h4>
                    <p>Escríbenos y te respondemos en menos de 24 horas.</p>
                </a>
            </div>

            <div class="cta-group">
                <a href="pricing.html" class="btn-retry"><i class="ti ti-refresh"></i> Intentar de nuevo</a>
                <a href="../../index.html" class="btn-outline"><i class="ti ti-home"></i> Volver al inicio</a>
            </div>

            <div class="trial-banner">
                <div class="trial-icon"><i class="ti ti-gift"></i></div>
                <div class="trial-content">
                    <h4>¿Aún no estás seguro?</h4>
                    <p>Comienza con nuestro plan gratuito y descubre todas las funcionalidades sin compromiso.</p>
                </div>
                <a href="../authentication/login.html" class="btn-trial">Probar gratis <i class="ti ti-arrow-right"></i></a>
            </div>
        </div>
    </div>

''' + FOOTER + '''
</body>
</html>'''


# ═══════════════════════════════════════════════
# Write all files
# ═══════════════════════════════════════════════

files = {
    'pricing.html': pricing_html,
    'checkout.html': checkout_html,
    'success.html': success_html,
    'cancel.html': cancel_html,
}

for name, content in files.items():
    path = os.path.join(BASE, name)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'✅ {name} ({len(content)} bytes)')

print(f'\n🎉 {len(files)} archivos creados en {BASE}')
