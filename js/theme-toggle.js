/* theme-toggle.js — Light/Dark toggle con persistencia y respeto a OS */
(function () {
  'use strict';

  var STORAGE_KEY = 'agrotech-theme';
  var root = document.documentElement;

  function getStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function setStored(v) {
    try { localStorage.setItem(STORAGE_KEY, v); } catch (e) {}
  }
  function systemPref() {
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches)
      ? 'light' : 'dark';
  }
  function apply(theme) {
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f7f5f0' : '#1a1a1a');
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
      btn.setAttribute('aria-label', theme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
      btn.setAttribute('title', theme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
    });
  }
  function current() {
    return root.getAttribute('data-theme') || getStored() || systemPref();
  }
  function toggle() {
    var next = current() === 'light' ? 'dark' : 'light';
    setStored(next);
    apply(next);
  }

  // Init temprano (idempotente con el snippet inline del <head>)
  apply(current());

  // Listener system change (solo si el user no eligió manualmente)
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: light)');
    var onChange = function (e) {
      if (!getStored()) apply(e.matches ? 'light' : 'dark');
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  // Hook al DOM listo
  function bind() {
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', toggle);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }

  // Expose mínimo
  window.AgrotechTheme = { toggle: toggle, apply: apply, current: current };
})();
