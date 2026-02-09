// 🔹 Auth utilities for AgroTech Digital

// Get base URL from config
const AUTH_BASE = window.AGROTECH_CONFIG
    ? window.AGROTECH_CONFIG.STATIC_BASE
    : 'https://agrotechcolombia.netlify.app';

// 🔹 Check if user is authenticated
export function isAuthenticated() {
    const token = localStorage.getItem("accessToken");
    return token && token !== "null" && token !== "undefined" && token.trim() !== "";
}

// 🔹 Redirect to login
export function redirectToLogin() {
    window.location.href = `${AUTH_BASE}/templates/authentication/login.html`;
}

// 🔹 Redirect to register
export function redirectToRegister() {
    window.location.href = `${AUTH_BASE}/templates/authentication/register.html`;
}

// 🔹 Redirect to dashboard after login
export function redirectToDashboard() {
    window.location.href = `${AUTH_BASE}/templates/dashboard.html`;
}

// 🔹 Logout
export function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("tenantName");
    localStorage.removeItem("tenantDomain");
    redirectToLogin();
}

// 🔹 Get access token
export function getAccessToken() {
    return localStorage.getItem("accessToken");
}

// 🔹 Authenticated fetch wrapper
export async function authFetch(url, options = {}) {
    const token = getAccessToken();
    if (!token) {
        redirectToLogin();
        return null;
    }
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {}),
    };
    
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
        // Try token refresh
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            headers['Authorization'] = `Bearer ${getAccessToken()}`;
            return fetch(url, { ...options, headers });
        } else {
            logout();
            return null;
        }
    }
    
    return response;
}

// 🔹 Refresh token
async function refreshAccessToken() {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return false;
    
    const API_BASE = window.AGROTECH_CONFIG ? window.AGROTECH_CONFIG.API_BASE : '';
    
    try {
        const response = await fetch(`${API_BASE}/api/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem("accessToken", data.access);
            return true;
        }
        return false;
    } catch {
        return false;
    }
}
