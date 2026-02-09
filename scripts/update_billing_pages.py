#!/usr/bin/env python3
"""
Actualiza los archivos billing del frontend con:
1. pricing.html: Fallback estático cuando el API falla  
2. checkout.html: Campo tenant_name + llamada confirm-payment
3. success.html: Llamada a confirm-payment para crear tenant post-pago
4. config.js: Endpoints nuevos
"""
import os, re

BASE = '/Users/sebastianflorez/Documents/agrotech-digital/agrotech-client-frontend'

# ═════════════════════════════════════════════
# 1. FIX PRICING.HTML — add static fallback
# ═════════════════════════════════════════════
pricing_path = os.path.join(BASE, 'templates', 'billing', 'pricing.html')
with open(pricing_path, 'r') as f:
    content = f.read()

# Replace the fetchPlans function with one that has fallback
old_fetch = """        function fetchPlans() {
            fetch(API + '/billing/api/plans/')
                .then(function(r) { return r.json(); })
                .then(function(data) { plans = data; render(); })
                .catch(function() {
                    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 0;"><p style="color:var(--gris-400);">Error cargando planes. Recarga la página.</p></div>';
                });
        }"""

new_fetch = """        // Planes estáticos como fallback cuando el API no responde
        var FALLBACK_PLANS = [
            {tier:'free',name:'Explorador',description:'Plan gratuito',price_cop:'0.00',price_usd:'0.00',frequency:1,limits:{users:1,parcels:3,hectares:50,eosda_requests:10},features_included:['basic_analytics'],features_excluded:['advanced_analytics','api_access'],is_custom:false,trial_days:14,yearly_discount:{yearly_price_cop:0,savings_cop:0,yearly_price_usd:0,savings_usd:0,discount_percent:20}},
            {tier:'basic',name:'Agricultor',description:'Plan profesional',price_cop:'79000.00',price_usd:'20.00',frequency:1,limits:{users:3,parcels:10,hectares:300,eosda_requests:100},features_included:['basic_analytics','weather_forecast'],features_excluded:['api_access'],is_custom:false,trial_days:14,yearly_discount:{yearly_price_cop:790000,savings_cop:158000,yearly_price_usd:200,savings_usd:40,discount_percent:20}},
            {tier:'pro',name:'Empresarial',description:'Plan empresarial',price_cop:'179000.00',price_usd:'45.00',frequency:1,limits:{users:10,parcels:50,hectares:1000,eosda_requests:500},features_included:['basic_analytics','advanced_analytics','weather_forecast','api_access'],features_excluded:[],is_custom:false,trial_days:14,yearly_discount:{yearly_price_cop:1790000,savings_cop:358000,yearly_price_usd:450,savings_usd:90,discount_percent:20}}
        ];

        function fetchPlans() {
            fetch(API + '/billing/api/plans/')
                .then(function(r) {
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    return r.json();
                })
                .then(function(data) {
                    if (data && data.length > 0) { plans = data; } else { plans = FALLBACK_PLANS; }
                    render();
                })
                .catch(function() {
                    console.warn('API no disponible, usando planes estáticos');
                    plans = FALLBACK_PLANS;
                    render();
                });
        }"""

content = content.replace(old_fetch, new_fetch)

# Also change the "Plan Actual" button for free to be selectable
content = content.replace(
    """var btn = (p.tier === 'free')
                    ? '<button class="btn-plan disabled" disabled>Plan Actual</button>'
                    : '<button class="btn-plan" onclick="selectPlan(\\'' + p.tier + '\\')">Comenzar Ahora</button>';""",
    """var btn = (p.tier === 'free')
                    ? '<button class="btn-plan" onclick="selectPlan(\\'' + p.tier + '\\')">Probar Gratis</button>'
                    : '<button class="btn-plan" onclick="selectPlan(\\'' + p.tier + '\\')">Comenzar Ahora</button>';"""
)

with open(pricing_path, 'w') as f:
    f.write(content)
print(f'✅ pricing.html actualizado ({len(content)} bytes)')


# ═════════════════════════════════════════════
# 2. FIX CHECKOUT.HTML — add tenant_name field + handle free plan
# ═════════════════════════════════════════════
checkout_path = os.path.join(BASE, 'templates', 'billing', 'checkout.html')
with open(checkout_path, 'r') as f:
    content = f.read()

# Add tenant name field after email field
old_email_field = """                    <div class="form-group">
                        <label for="payerEmail">Correo Electrónico</label>
                        <input type="email" class="form-input" id="payerEmail" placeholder="correo@ejemplo.com" required autocomplete="email">
                    </div>
                </div>"""

new_email_field = """                    <div class="form-group">
                        <label for="payerEmail">Correo Electrónico</label>
                        <input type="email" class="form-input" id="payerEmail" placeholder="correo@ejemplo.com" required autocomplete="email">
                    </div>
                    <div class="form-group">
                        <label for="tenantName">Nombre de tu Finca o Empresa</label>
                        <input type="text" class="form-input" id="tenantName" placeholder="Ej: Finca El Roble" autocomplete="organization">
                    </div>
                </div>"""

content = content.replace(old_email_field, new_email_field)

# Update the checkout button JS to include tenant_name and handle free plan
old_checkout_js = """        btnCheckout.addEventListener('click', function() {
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
        });"""

new_checkout_js = """        btnCheckout.addEventListener('click', function() {
            btnCheckout.disabled = true;
            var overlay = document.getElementById('loadingOverlay');
            var loadingText = overlay.querySelector('.loading-text');
            overlay.classList.add('show');

            var payload = {
                plan_tier: planTier,
                billing_cycle: billingCycle,
                payer_email: emailInput.value.trim(),
                tenant_name: (document.getElementById('tenantName').value || '').trim()
            };

            // Plan gratuito: crear tenant directamente sin MercadoPago
            if (planTier === 'free') {
                loadingText.textContent = 'Creando tu espacio de trabajo...';
                fetch(API + '/billing/api/create-checkout/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    if (data.success && data.tenant_created) {
                        window.location.href = 'success.html?plan=free&cycle=monthly&tenant=' + encodeURIComponent(data.schema_name);
                    } else {
                        throw new Error(data.error || 'Error creando trial');
                    }
                })
                .catch(function(e) {
                    overlay.classList.remove('show');
                    btnCheckout.disabled = false;
                    alert('Error: ' + e.message);
                });
                return;
            }

            // Plan pago: crear checkout en MercadoPago
            loadingText.textContent = 'Redirigiendo a MercadoPago...';
            fetch(API + '/billing/api/create-checkout/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
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
                overlay.classList.remove('show');
                btnCheckout.disabled = false;
                alert('Error: ' + e.message);
            });
        });"""

content = content.replace(old_checkout_js, new_checkout_js)

# Update loading text
content = content.replace(
    '<div class="loading-text">Redirigiendo a MercadoPago...</div>',
    '<div class="loading-text">Procesando...</div>'
)

# Fix summary for free plan
old_summary_load = """        // Load plan info
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
            });"""

new_summary_load = """        // Planes estáticos como fallback
        var FALLBACK_PLANS = [
            {tier:'free',name:'Explorador',price_cop:'0.00',yearly_discount:{yearly_price_cop:0}},
            {tier:'basic',name:'Agricultor',price_cop:'79000.00',yearly_discount:{yearly_price_cop:790000}},
            {tier:'pro',name:'Empresarial',price_cop:'179000.00',yearly_discount:{yearly_price_cop:1790000}}
        ];

        function loadPlanInfo(plansData) {
            var plan = plansData.find(function(p) { return p.tier === planTier; });
            if (!plan) return;
            var isYearly = billingCycle === 'yearly';
            var price = isYearly ? (plan.yearly_discount ? plan.yearly_discount.yearly_price_cop : 0) : parseFloat(plan.price_cop);
            document.getElementById('summaryPlanName').textContent = plan.name;
            document.getElementById('summaryCycle').textContent = planTier === 'free' ? 'Trial gratuito (14 días)' : (isYearly ? 'Facturación anual' : 'Facturación mensual');
            document.getElementById('summaryPlanPrice').textContent = planTier === 'free' ? 'Gratis' : fmtCOP(price);
            document.getElementById('summaryTotal').textContent = planTier === 'free' ? 'Gratis' : fmtCOP(price);
        }

        // Intentar cargar del API, fallback a estáticos
        fetch(API + '/billing/api/plans/')
            .then(function(r) { if (!r.ok) throw new Error(); return r.json(); })
            .then(function(plans) { loadPlanInfo(plans); })
            .catch(function() { loadPlanInfo(FALLBACK_PLANS); });"""

content = content.replace(old_summary_load, new_summary_load)

with open(checkout_path, 'w') as f:
    f.write(content)
print(f'✅ checkout.html actualizado ({len(content)} bytes)')


# ═════════════════════════════════════════════
# 3. FIX SUCCESS.HTML — call confirm-payment to create tenant
# ═════════════════════════════════════════════
success_path = os.path.join(BASE, 'templates', 'billing', 'success.html')
with open(success_path, 'r') as f:
    content = f.read()

# Replace the simple param-reading JS with one that also calls confirm-payment
old_success_js = """    document.addEventListener('DOMContentLoaded', function() {
        var params = new URLSearchParams(window.location.search);
        var planMap = {'basic':'Agricultor','pro':'Empresarial','free':'Explorador'};
        var tier = params.get('plan') || 'basic';
        var cycle = params.get('cycle') || 'monthly';
        document.getElementById('detailPlan').textContent = planMap[tier] || tier;
        document.getElementById('detailCycle').textContent = cycle === 'yearly' ? 'Anual' : 'Mensual';
        document.getElementById('detailSubId').textContent = params.get('preapproval_id') || params.get('subscription_id') || '—';"""

new_success_js = """    document.addEventListener('DOMContentLoaded', function() {
        var API = window.AGROTECH_CONFIG.API_BASE;
        var params = new URLSearchParams(window.location.search);
        var planMap = {'basic':'Agricultor','pro':'Empresarial','free':'Explorador'};
        var tier = params.get('plan') || 'basic';
        var cycle = params.get('cycle') || 'monthly';
        var preapprovalId = params.get('preapproval_id') || params.get('subscription_id') || '';
        
        document.getElementById('detailPlan').textContent = planMap[tier] || tier;
        document.getElementById('detailCycle').textContent = tier === 'free' ? 'Trial 14 días' : (cycle === 'yearly' ? 'Anual' : 'Mensual');
        document.getElementById('detailSubId').textContent = preapprovalId || params.get('tenant') || '—';

        // Confirmar pago y crear tenant automáticamente
        // Solo para planes pagos que vienen de MercadoPago
        if (tier !== 'free' && preapprovalId) {
            fetch(API + '/billing/api/confirm-payment/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    preapproval_id: preapprovalId,
                    plan_tier: tier,
                    billing_cycle: cycle,
                    payer_email: params.get('payer_email') || ''
                })
            })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    console.log('Tenant creado/confirmado:', data);
                    if (data.schema_name) {
                        document.getElementById('detailSubId').textContent = data.schema_name;
                    }
                    // Mostrar badge de verificado
                    var badge = document.getElementById('detailStatus');
                    if (badge) badge.innerHTML = '<span style="color:var(--verde-claro)">✓</span> Activo y verificado';
                }
            })
            .catch(function(err) { console.warn('Error confirmando pago:', err); });
        }"""

content = content.replace(old_success_js, new_success_js)

with open(success_path, 'w') as f:
    f.write(content)
print(f'✅ success.html actualizado ({len(content)} bytes)')


# ═════════════════════════════════════════════
# 4. UPDATE config.js — add new endpoints
# ═════════════════════════════════════════════
config_path = os.path.join(BASE, 'js', 'config.js')
with open(config_path, 'r') as f:
    content = f.read()

if 'BILLING_CONFIRM_PAYMENT' not in content:
    content = content.replace(
        "BILLING_CREATE_CHECKOUT: '/billing/api/create-checkout/',",
        "BILLING_CREATE_CHECKOUT: '/billing/api/create-checkout/',\n            BILLING_CONFIRM_PAYMENT: '/billing/api/confirm-payment/',"
    )
    with open(config_path, 'w') as f:
        f.write(content)
    print(f'✅ config.js actualizado')
else:
    print(f'ℹ️ config.js ya tiene BILLING_CONFIRM_PAYMENT')


print(f'\n🎉 Frontend actualizado correctamente')
