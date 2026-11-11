/**
 * AgroTech Digital - Meta Pixel + consentimiento (Ley 1581).
 *
 * - Un solo pixel para todo el funnel (1521929183273863).
 * - No carga el pixel hasta que la persona acepte cookies de marketing.
 * - Expone window.AgroTrack para disparar eventos estándar de Meta.
 * - Conserva UTMs/fbclid para atribución y CAPI.
 */
(function () {
  'use strict';

  var PIXEL_ID = '1521929183273863';
  var CONSENT_KEY = 'agrotech_cookie_consent';
  var UTM_KEY = 'agrotech_attribution';
  var initialized = false;

  function readCookie(name) {
    var match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[2]) : '';
  }

  function captureAttribution() {
    try {
      var params = new URLSearchParams(window.location.search);
      var data = {
        utm_source: params.get('utm_source') || '',
        utm_medium: params.get('utm_medium') || '',
        utm_campaign: params.get('utm_campaign') || '',
        utm_content: params.get('utm_content') || '',
        utm_term: params.get('utm_term') || '',
        fbclid: params.get('fbclid') || '',
        landing_page: window.location.pathname + window.location.search,
        captured_at: new Date().toISOString()
      };
      if (data.utm_source || data.fbclid) {
        sessionStorage.setItem(UTM_KEY, JSON.stringify(data));
      }
      return data;
    } catch (e) {
      return {};
    }
  }

  function getAttribution() {
    try {
      return JSON.parse(sessionStorage.getItem(UTM_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function getFbcFbp() {
    var attr = getAttribution();
    var fbc = readCookie('_fbc');
    if (!fbc && attr.fbclid) {
      fbc = 'fb.1.' + Date.now() + '.' + attr.fbclid;
    }
    return { fbp: readCookie('_fbp'), fbc: fbc };
  }

  function loadPixel() {
    if (initialized) return;
    initialized = true;
    /* eslint-disable */
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  function consent() {
    try {
      return localStorage.getItem(CONSENT_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function setConsent(value) {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch (e) { /* almacenamiento bloqueado */ }
    var banner = document.getElementById('agrotech-consent');
    if (banner) banner.remove();
    try {
      window.dispatchEvent(new CustomEvent('agrotech:consent', { detail: { value: value } }));
    } catch (e) { /* navegador antiguo */ }
    if (value === 'granted') {
      loadPixel();
      if (window.dataLayer && window.gtag) {
        window.gtag('event', 'consent_granted', {});
      }
    }
  }

  function event(name, params, eventId) {
    if (!name) return;
    if (consent() !== 'granted') return;
    loadPixel();
    var payload = params || {};
    var options = eventId ? { eventID: eventId } : undefined;
    if (window.fbq) {
      if (options) window.fbq('track', name, payload, options);
      else window.fbq('track', name, payload);
    }
    if (window.gtag) {
      window.gtag('event', name, payload);
    }
  }

  function showConsentBanner() {
    if (document.getElementById('agrotech-consent')) return;
    var banner = document.createElement('div');
    banner.id = 'agrotech-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Preferencias de cookies');
    banner.innerHTML =
      '<div style="max-width:1100px;margin:0 auto;display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap">' +
        '<div style="flex:1;min-width:260px;font-size:14px;line-height:1.5;color:#1D1D1F">' +
          'Usamos cookies necesarias y, con tu permiso, cookies de medición (Meta y GA4) para mejorar tu experiencia. ' +
          '<a href="/privacidad" style="color:#1a7a2e;text-decoration:underline">Política de privacidad</a>.' +
        '</div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
          '<button type="button" id="agrotech-consent-deny" style="padding:10px 18px;border-radius:980px;border:1px solid rgba(0,0,0,.15);background:#fff;color:#1D1D1F;font-weight:600;cursor:pointer">Solo necesarias</button>' +
          '<button type="button" id="agrotech-consent-accept" style="padding:10px 18px;border-radius:980px;border:0;background:#2FB344;color:#fff;font-weight:700;cursor:pointer">Aceptar</button>' +
        '</div>' +
      '</div>';
    banner.style.cssText =
      'position:fixed;left:0;right:0;bottom:0;z-index:99999;background:rgba(255,255,255,.97);' +
      'backdrop-filter:blur(12px);border-top:1px solid rgba(0,0,0,.08);padding:16px 20px;' +
      'box-shadow:0 -8px 30px rgba(0,0,0,.08);font-family:Inter,system-ui,sans-serif';
    document.body.appendChild(banner);
    document.getElementById('agrotech-consent-accept').addEventListener('click', function () { setConsent('granted'); });
    document.getElementById('agrotech-consent-deny').addEventListener('click', function () { setConsent('denied'); });
  }

  window.AgroTrack = {
    event: event,
    consent: consent,
    setConsent: setConsent,
    getAttribution: getAttribution,
    getFbcFbp: getFbcFbp,
    pageView: function () {
      if (consent() === 'granted') {
        loadPixel();
        if (window.fbq) window.fbq('track', 'PageView');
      }
    }
  };

  captureAttribution();

  // Mantener compatibilidad con el helper existente de GA4.
  var previousTrack = window.trackEvent;
  window.trackEvent = function (name, params) {
    // GA4 y Meta solo reciben eventos si la persona aceptó marketing.
    if (consent() === 'granted' && typeof previousTrack === 'function') {
      previousTrack(name, params);
    }
    var metaName = name;
    if (name === 'signup_complete') metaName = 'CompleteRegistration';
    if (name === 'begin_signup') metaName = 'Lead';
    event(metaName, params);
  };

  if (consent() === 'granted') {
    loadPixel();
  } else if (!consent()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showConsentBanner);
    } else {
      showConsentBanner();
    }
  }
})();
