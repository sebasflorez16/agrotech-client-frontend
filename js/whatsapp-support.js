/**
 * Botón flotante de soporte por WhatsApp para las páginas de la plataforma.
 *
 * - No se inyecta en la landing si ya existe .wa-float.
 * - Se eleva automáticamente cuando aparece el botón flotante de imagen del mapa
 *   para no taparlo.
 * - Responsive: 56 px en escritorio, 52 px en móvil, con safe-area para iPhone.
 * - z-index 999: encima del contenido y del mapa, debajo de modales/sidebar.
 */
(function () {
    'use strict';

    var PHONE = '573223088873';
    var BUTTON_ID = 'agrotech-whatsapp-support';

    function buildMessage() {
        var page = (document.title || '').trim().slice(0, 80);
        var where = page || window.location.pathname;
        return 'Hola, necesito ayuda con AgroTech Digital. Estoy en "' + where +
            '" y tengo un problema: ';
    }

    function injectStyles() {
        if (document.getElementById('agrotech-wa-styles')) return;
        var style = document.createElement('style');
        style.id = 'agrotech-wa-styles';
        style.textContent = [
            '#' + BUTTON_ID + ' {',
            '  position: fixed;',
            '  right: max(16px, env(safe-area-inset-right));',
            '  bottom: calc(20px + env(safe-area-inset-bottom));',
            '  width: 56px; height: 56px;',
            '  border-radius: 50%;',
            '  background: #25D366;',
            '  color: #fff;',
            '  display: flex; align-items: center; justify-content: center;',
            '  box-shadow: 0 10px 28px rgba(0,0,0,.28);',
            '  z-index: 999;',
            '  text-decoration: none;',
            '  -webkit-tap-highlight-color: transparent;',
            '  transition: transform .2s ease, box-shadow .2s ease, bottom .2s ease;',
            '}',
            '#' + BUTTON_ID + '.agrotech-wa-raised {',
            '  bottom: calc(96px + env(safe-area-inset-bottom));',
            '}',
            '#' + BUTTON_ID + ' svg { width: 30px; height: 30px; }',
            '@media (hover: hover) {',
            '  #' + BUTTON_ID + ':hover {',
            '    transform: translateY(-3px) scale(1.04);',
            '    box-shadow: 0 14px 36px rgba(0,0,0,.35);',
            '  }',
            '}',
            '#' + BUTTON_ID + ':active { transform: scale(.96); }',
            '#' + BUTTON_ID + ':focus-visible {',
            '  outline: 3px solid #fff;',
            '  outline-offset: 3px;',
            '  box-shadow: 0 0 0 6px rgba(37,211,102,.35);',
            '}',
            '@media (max-width: 640px) {',
            '  #' + BUTTON_ID + ' {',
            '    width: 52px; height: 52px;',
            '    right: max(14px, env(safe-area-inset-right));',
            '    bottom: calc(16px + env(safe-area-inset-bottom));',
            '  }',
            '  #' + BUTTON_ID + '.agrotech-wa-raised {',
            '    bottom: calc(88px + env(safe-area-inset-bottom));',
            '  }',
            '  #' + BUTTON_ID + ' svg { width: 28px; height: 28px; }',
            '}',
            '@media (prefers-reduced-motion: reduce) {',
            '  #' + BUTTON_ID + ' { transition: none; }',
            '}',
            '@media print { #' + BUTTON_ID + ' { display: none !important; } }',
        ].join('\n');
        document.head.appendChild(style);
    }

    function syncRaisedState(button) {
        // En el dashboard de parcelas, el botón de imagen flotante aparece
        // abajo a la derecha; subimos WhatsApp para no taparlo.
        var floatingImageBtn = document.getElementById('floatingImageToggleBtn');
        if (floatingImageBtn) {
            button.classList.add('agrotech-wa-raised');
        } else {
            button.classList.remove('agrotech-wa-raised');
        }
    }

    function injectButton() {
        if (document.getElementById(BUTTON_ID)) return;
        // La landing ya tiene su propio botón .wa-float; no duplicar.
        if (document.querySelector('.wa-float')) return;

        injectStyles();

        var link = document.createElement('a');
        link.id = BUTTON_ID;
        link.href = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(buildMessage());
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', 'Escribir por WhatsApp a soporte');
        link.title = '¿Necesitas ayuda? Escríbenos por WhatsApp';
        link.setAttribute('data-ga-event', 'click_whatsapp');
        link.setAttribute('data-ga-location', 'app_float');
        link.innerHTML =
            '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
            '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>' +
            '</svg>';

        link.addEventListener('click', function () {
            try {
                if (typeof window.trackEvent === 'function') {
                    window.trackEvent('click_whatsapp', { location: 'app_float' });
                }
                if (window.AgroTrack && typeof window.AgroTrack.event === 'function') {
                    window.AgroTrack.event('Contact', { content_name: 'whatsapp_support' });
                }
            } catch (e) {
                // La medición nunca debe bloquear el enlace.
            }
        });

        document.body.appendChild(link);
        syncRaisedState(link);

        // El botón de imagen del mapa se crea después de cargar una imagen.
        if (window.MutationObserver) {
            var observer = new MutationObserver(function () {
                syncRaisedState(link);
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectButton);
    } else {
        injectButton();
    }
})();
