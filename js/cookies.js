/**
 * Google Consent Mode v2 + Banner de Cookies GDPR
 * Inyección dinámica de GA4 - alexperdel.com
 *
 * Solo necesitas incluir este script en cada página:
 * <script src="js/cookies.js"></script>
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURACIÓN
  // ============================================
  const CONFIG = {
    GA_ID: 'G-S7FSP331TC',
    CONSENT_KEY: 'cookie_consent',
    CONSENT_VERSION: '2.0'
  };

  // ============================================
  // INICIALIZAR DATALAY Y GTAG
  // ============================================
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  window.gtag = gtag;

  // ============================================
  // CONSENT MODE - CONFIGURACIÓN POR DEFECTO
  // ============================================
  // Siempre se ejecuta primero: todo denegado por defecto (GDPR)
  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied',
    'functionality_storage': 'denied',
    'personalization_storage': 'denied',
    'security_storage': 'granted',
    'wait_for_update': 500
  });

  // Permitir datos modelados sin cookies (Consent Mode v2 feature)
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', true);

  // ============================================
  // INYECTAR GOOGLE ANALYTICS 4
  // ============================================
  function injectGA4() {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + CONFIG.GA_ID;
    document.head.appendChild(script);

    script.onload = function() {
      gtag('js', new Date());
      gtag('config', CONFIG.GA_ID, {
        'anonymize_ip': true,
        'cookie_flags': 'SameSite=None;Secure'
      });
    };
  }

  // ============================================
  // FUNCIONES DE CONSENTIMIENTO
  // ============================================
  function updateConsent(granted) {
    if (granted) {
      gtag('consent', 'update', {
        'ad_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted',
        'analytics_storage': 'granted',
        'functionality_storage': 'granted',
        'personalization_storage': 'granted'
      });
    }
  }

  function saveConsent(accepted) {
    const consent = {
      accepted: accepted,
      timestamp: new Date().toISOString(),
      version: CONFIG.CONSENT_VERSION
    };
    localStorage.setItem(CONFIG.CONSENT_KEY, JSON.stringify(consent));
  }

  function getStoredConsent() {
    try {
      const stored = localStorage.getItem(CONFIG.CONSENT_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  // ============================================
  // BANNER DE COOKIES
  // ============================================
  function createBanner() {
    // Calcular ruta relativa a la política de cookies
    const path = window.location.pathname;
    const isSubfolder = path.includes('/proyectos/');
    const cookiesUrl = isSubfolder ? '../politica-cookies.html' : 'politica-cookies.html';

    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.className = 'cookie-banner';
    banner.innerHTML = `
      <div class="cookie-banner__content">
        <div class="cookie-banner__text">
          <p><strong>Este sitio usa cookies</strong></p>
          <p>Uso cookies de Google Analytics para analizar el tráfico y mejorar tu experiencia.
          <a href="${cookiesUrl}">Más info</a></p>
        </div>
        <div class="cookie-banner__actions">
          <button id="cookie-reject" class="cookie-btn cookie-btn--ghost">Rechazar</button>
          <button id="cookie-accept" class="cookie-btn cookie-btn--primary">Aceptar</button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('cookie-accept').addEventListener('click', acceptCookies);
    document.getElementById('cookie-reject').addEventListener('click', rejectCookies);

    // Mostrar con animación
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        banner.classList.add('cookie-banner--visible');
      });
    });
  }

  function hideBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) {
      banner.classList.remove('cookie-banner--visible');
      setTimeout(function() { banner.remove(); }, 300);
    }
  }

  function acceptCookies() {
    saveConsent(true);
    updateConsent(true);
    hideBanner();
  }

  function rejectCookies() {
    saveConsent(false);
    hideBanner();
  }

  // ============================================
  // INICIALIZACIÓN
  // ============================================
  function init() {
    // Inyectar GA4 (siempre, respetará el consent mode)
    injectGA4();

    const stored = getStoredConsent();

    if (stored) {
      // Ya tiene preferencia guardada
      if (stored.accepted) {
        updateConsent(true);
      }
      // Si rechazó, no hacemos nada (consent ya está en denied)
    } else {
      // Primera visita: mostrar banner
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createBanner);
      } else {
        createBanner();
      }
    }
  }

  // ============================================
  // API PÚBLICA (para "Configurar cookies" link)
  // ============================================
  window.CookieConsent = {
    reset: function() {
      localStorage.removeItem(CONFIG.CONSENT_KEY);
      // Si ya hay banner visible, no recargar
      if (document.getElementById('cookie-banner')) {
        return;
      }
      // Mostrar banner sin recargar
      createBanner();
    },
    getStatus: function() {
      return getStoredConsent();
    },
    accept: acceptCookies,
    reject: rejectCookies,
    show: function() {
      if (!document.getElementById('cookie-banner')) {
        createBanner();
      }
    }
  };

  // Ejecutar
  init();

})();
