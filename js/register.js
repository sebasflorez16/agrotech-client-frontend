/**
 * 🍎 Register - AgroTech Digital
 * Flujo de registro en 2 pasos con validación en tiempo real
 */

const API_BASE_URL = window.AGROTECH_CONFIG ? window.AGROTECH_CONFIG.API_BASE :
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8000'
        : 'https://agrotech-digital-production.up.railway.app');

// DOM Elements
const registerForm = document.getElementById('registerForm');
const btnRegister = document.getElementById('btnRegister');
const btnText = document.getElementById('btnText');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const successMessage = document.getElementById('successMessage');

let currentStep = 1;

// ========== STEP NAVIGATION ==========

function nextStep() {
    if (!validateStep1()) return;
    
    currentStep = 2;
    document.getElementById('formStep1').style.display = 'none';
    document.getElementById('formStep2').style.display = 'block';
    
    // Update step indicators
    document.getElementById('step1').classList.remove('active');
    document.getElementById('step1').classList.add('completed');
    document.getElementById('step1').querySelector('.step-dot').innerHTML = '<i class="ti ti-check" style="font-size:14px"></i>';
    document.getElementById('stepLine1').classList.add('active');
    document.getElementById('step2').classList.add('active');
    
    hideError();
    document.getElementById('organization_name').focus();
}

function prevStep() {
    currentStep = 1;
    document.getElementById('formStep2').style.display = 'none';
    document.getElementById('formStep1').style.display = 'block';
    
    // Reset step indicators
    document.getElementById('step1').classList.add('active');
    document.getElementById('step1').classList.remove('completed');
    document.getElementById('step1').querySelector('.step-dot').textContent = '1';
    document.getElementById('stepLine1').classList.remove('active');
    document.getElementById('step2').classList.remove('active');
    
    hideError();
}

// Make functions globally accessible
window.nextStep = nextStep;
window.prevStep = prevStep;

// ========== VALIDATION ==========

function validateStep1() {
    clearFieldErrors();
    let valid = true;
    
    const name = document.getElementById('name').value.trim();
    const lastName = document.getElementById('last_name').value.trim();
    const email = document.getElementById('email').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password_confirm').value;
    
    if (!name || name.length < 2) {
        showFieldError('nameError', 'Ingresa tu nombre');
        valid = false;
    }
    
    if (!lastName || lastName.length < 2) {
        showFieldError('lastNameError', 'Ingresa tu apellido');
        valid = false;
    }
    
    if (!email || !isValidEmail(email)) {
        showFieldError('emailError', 'Ingresa un correo electrónico válido');
        valid = false;
    }
    
    if (!username || username.length < 3) {
        showFieldError('usernameError', 'Mínimo 3 caracteres');
        valid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showFieldError('usernameError', 'Solo letras, números y guión bajo');
        valid = false;
    }
    
    if (!password || password.length < 8) {
        showFieldError('passwordError', 'Mínimo 8 caracteres');
        valid = false;
    }
    
    if (password !== passwordConfirm) {
        showFieldError('passwordConfirmError', 'Las contraseñas no coinciden');
        valid = false;
    }
    
    return valid;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ========== FIELD ERRORS ==========

function showFieldError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.classList.add('show');
        // Also mark input
        const input = el.previousElementSibling;
        if (input && input.querySelector) {
            const inp = input.querySelector('.form-input') || input;
            inp.classList && inp.classList.add('error');
        }
    }
}

function clearFieldErrors() {
    document.querySelectorAll('.field-error').forEach(el => {
        el.classList.remove('show');
        el.textContent = '';
    });
    document.querySelectorAll('.form-input.error').forEach(el => {
        el.classList.remove('error');
    });
}

// ========== PASSWORD STRENGTH ==========

document.getElementById('password').addEventListener('input', function() {
    const bar = document.getElementById('strengthBar');
    const val = this.value;
    
    bar.className = 'password-strength-bar';
    
    if (!val) return;
    
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    
    if (score <= 1) bar.classList.add('strength-weak');
    else if (score <= 2) bar.classList.add('strength-medium');
    else bar.classList.add('strength-strong');
});

// ========== ERROR/SUCCESS MESSAGES ==========

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => errorMessage.classList.remove('show'), 8000);
}

function hideError() {
    errorMessage.classList.remove('show');
}

function showSuccess() {
    registerForm.style.display = 'none';
    document.querySelector('.steps').style.display = 'none';
    successMessage.classList.add('show');
}

function setLoading(loading) {
    btnRegister.disabled = loading;
    if (loading) {
        btnRegister.classList.add('loading');
        btnText.textContent = 'Creando cuenta...';
    } else {
        btnRegister.classList.remove('loading');
        btnText.textContent = 'Crear mi cuenta gratis';
    }
}

// ========== SUBMIT ==========

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    clearFieldErrors();
    
    const orgName = document.getElementById('organization_name').value.trim();
    if (!orgName || orgName.length < 3) {
        showFieldError('orgError', 'Ingresa el nombre de tu finca (mínimo 3 caracteres)');
        return;
    }
    
    setLoading(true);
    
    const payload = {
        email: document.getElementById('email').value.trim(),
        username: document.getElementById('username').value.trim(),
        password: document.getElementById('password').value,
        password_confirm: document.getElementById('password_confirm').value,
        name: document.getElementById('name').value.trim(),
        last_name: document.getElementById('last_name').value.trim(),
        organization_name: orgName,
        phone: document.getElementById('phone').value.trim() || undefined,
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            // Handle field-level errors from backend
            if (data.errors) {
                const fieldMap = {
                    email: 'emailError',
                    username: 'usernameError',
                    password: 'passwordError',
                    password_confirm: 'passwordConfirmError',
                    organization_name: 'orgError',
                    name: 'nameError',
                    last_name: 'lastNameError',
                };
                
                let hasFieldError = false;
                for (const [field, messages] of Object.entries(data.errors)) {
                    const errorEl = fieldMap[field];
                    if (errorEl) {
                        showFieldError(errorEl, Array.isArray(messages) ? messages[0] : messages);
                        hasFieldError = true;
                    }
                }
                
                // If error is in step 1 fields, go back
                const step1Fields = ['email', 'username', 'password', 'password_confirm', 'name', 'last_name'];
                const hasStep1Error = Object.keys(data.errors).some(f => step1Fields.includes(f));
                if (hasStep1Error && currentStep === 2) {
                    prevStep();
                }
                
                if (!hasFieldError) {
                    showError(data.error || data.detail || 'Error al crear la cuenta');
                }
            } else {
                showError(data.error || data.detail || 'Error al crear la cuenta. Intenta nuevamente.');
            }
            
            setLoading(false);
            return;
        }
        
        // Success!
        if (data.data && data.data.tokens) {
            localStorage.setItem('accessToken', data.data.tokens.access);
            localStorage.setItem('refreshToken', data.data.tokens.refresh);
            
            // Store user info
            if (data.data.user) {
                localStorage.setItem('userName', data.data.user.name);
                localStorage.setItem('userEmail', data.data.user.email);
            }
            if (data.data.tenant) {
                localStorage.setItem('tenantName', data.data.tenant.name);
                localStorage.setItem('tenantDomain', data.data.tenant.domain);
            }
        }
        
        showSuccess();
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
            window.location.href = '../dashboard.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error en registro:', error);
        showError('No se pudo conectar con el servidor. Verifica tu conexión.');
        setLoading(false);
    }
});

// ========== INIT ==========

document.addEventListener('DOMContentLoaded', () => {
    console.log('🍎 Register - AgroTech Digital');
    
    // If already authenticated, redirect
    const token = localStorage.getItem('accessToken');
    if (token && token !== 'null' && token !== 'undefined') {
        window.location.href = '../dashboard.html';
    }
});
