/**
 * AgroTech Digital - Analítica (GA4)
 * ------------------------------------------------------------------
 * Mide el embudo: visita landing -> clic prueba -> registro -> cobro.
 * NO registra contraseñas, tokens ni datos de parcelas.
 *
 * CONFIGURACIÓN MANUAL PENDIENTE:
 *   1. Crear una propiedad GA4 en https://analytics.google.com
 *   2. Copiar el "ID de medición" (formato G-XXXXXXXXXX)
 *   3. Reemplazar el valor de `measurementId` aquí abajo.
 * Mientras siga en G-XXXXXXXXXX, el script NO carga GA (no envía datos).
 */
window.AGROTECH_ANALYTICS = window.AGROTECH_ANALYTICS || {
  measurementId: 'G-XXXXXXXXXX'
};

(function () {
  var id = window.AGROTECH_ANALYTICS.measurementId;
  var configured = !!id && id.indexOf('XXXX') === -1;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  if (configured) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);
    gtag('js', new Date());
    // anonymize_ip: no enviamos IP completa (privacidad)
    gtag('config', id, { anonymize_ip: true });
  }

  /** Helper para medir eventos de conversión. Nunca envía datos sensibles. */
  window.trackEvent = function (name, params) {
    if (!configured || !name) return;
    gtag('event', name, params || {});
  };

  // Auto-bind: cualquier elemento con [data-ga-event] dispara el evento.
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-ga-event]') : null;
    if (!el) return;
    var params = {};
    if (el.dataset.gaLocation) params.location = el.dataset.gaLocation;
    if (el.dataset.gaPlan) params.plan = el.dataset.gaPlan;
    window.trackEvent(el.dataset.gaEvent, params);
  });
})();
