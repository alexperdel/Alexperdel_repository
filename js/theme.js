/**
 * Dark Mode - alexperdel.com
 *
 * Funcionalidad:
 * 1. Detecta preferencia del sistema (prefers-color-scheme)
 * 2. Permite cambio manual con toggle
 * 3. Guarda preferencia en localStorage
 * 4. La preferencia manual tiene prioridad sobre el sistema
 */

(function() {
  'use strict';

  const THEME_KEY = 'theme_preference';

  /**
   * Obtener tema guardado en localStorage
   */
  function getSavedTheme() {
    return localStorage.getItem(THEME_KEY);
  }

  /**
   * Obtener preferencia del sistema
   */
  function getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  /**
   * Obtener tema actual (prioridad: guardado > sistema)
   */
  function getCurrentTheme() {
    const saved = getSavedTheme();
    if (saved) {
      return saved;
    }
    return getSystemTheme();
  }

  /**
   * Aplicar tema al documento
   */
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  /**
   * Guardar preferencia
   */
  function saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
  }

  /**
   * Toggle entre temas
   */
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';

    applyTheme(newTheme);
    saveTheme(newTheme);

    return newTheme;
  }

  /**
   * Escuchar cambios en preferencia del sistema
   */
  function watchSystemTheme() {
    if (!window.matchMedia) return;

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Solo aplicar si no hay preferencia guardada
      if (!getSavedTheme()) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  /**
   * Inicializar tema antes del render para evitar flash
   */
  function init() {
    // Aplicar tema inmediatamente
    const theme = getCurrentTheme();
    applyTheme(theme);

    // Escuchar cambios del sistema
    watchSystemTheme();
  }

  // Ejecutar inmediatamente (antes del DOM ready)
  init();

  // API pública
  window.ThemeToggle = {
    toggle: toggleTheme,
    set: function(theme) {
      applyTheme(theme);
      saveTheme(theme);
    },
    get: getCurrentTheme,
    reset: function() {
      localStorage.removeItem(THEME_KEY);
      applyTheme(getSystemTheme());
    }
  };

})();
