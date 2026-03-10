// En este archivo traeremos datos del backend para mostrarlos en el dashboard
// Aca nos aseguramos que la funcion fetchUserCount() solo se ejecute apenas de carge el DOMContentLoaded
//para que los datos se mantengan actualizados y constantes.
document.addEventListener("DOMContentLoaded", () => {
    console.log("Dashboard cargado correctamente");
    fetchUserCount(); 
});

function fetchUserCount() {
    const API_BASE = (window.AGROTECH_CONFIG && window.AGROTECH_CONFIG.API_BASE) || '';

    // Usar agAuth si está disponible (incluye refresh automático)
    if (window.agAuth) {
        window.agAuth.fetchWithAuth(`${API_BASE}/api/authentication/dashboard/`)
        .then(response => {
            if (!response) return; // null = redirigido a login
            return response.json();
        })
        .then(data => {
            if (!data) return;
            console.log("Número de usuarios registrados:", data.user_count);
            const userCountElement = document.getElementById("userCount");
            if (userCountElement) {
                userCountElement.textContent = `Usuarios registrados: ${data.user_count}`;
            }
        })
        .catch(error => {
            console.error("Error al obtener el número de usuarios:", error);
        });
        return;
    }

    // Fallback: sin agAuth
    let token = localStorage.getItem("accessToken");
    fetch(`${API_BASE}/api/authentication/dashboard/`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(response => {
        if (response.status === 401) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            window.location.href = "/templates/authentication/login.html";
            throw new Error("No autorizado, redirigiendo al login.");
        }
        return response.json();
    })
    .then(data => {
        console.log("Número de usuarios registrados:", data.user_count);
        const userCountElement = document.getElementById("userCount");
        if (userCountElement) {
            userCountElement.textContent = `Usuarios registrados: ${data.user_count}`;
        } else {
            console.error("Elemento con ID 'userCount' no encontrado en el DOM.");
        }
    })
    .catch(error => {
        console.error("Error al obtener el número de usuarios:", error);
    });
}
