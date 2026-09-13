/* ==========================================================================
   LISTA DE ESPERA - Hiperautomatizaciones
   --------------------------------------------------------------------------
   Sitio estático: no hay backend. El formulario habla directamente con el
   endpoint público del proveedor de email, así que NO hay ninguna API key
   en el navegador.

   👉 PARA ACTIVARLO: rellena WAITLIST.provider y los dos ids de abajo.
      Mientras provider esté vacío, el formulario se desactiva solo y en su
      lugar aparece el aviso por LinkedIn. No se finge que funciona.

   MAILERLITE (recomendado · free 1.000 suscriptores · servidores en la UE)
     1. mailerlite.com → crea cuenta → Forms → Embedded form
     2. En el código que te da, busca:
        .../jsonp/123456/forms/789012/subscribe
                     ^account      ^form
     3. accountId: '123456'  ·  formId: '789012'
     4. Activa el doble opt-in en Settings → Subscribe settings (RGPD)

   BREVO (alternativa · contactos ilimitados · 300 envíos/día)
     provider: 'brevo' y formUrl: 'https://sibforms.com/serve/XXXXXXXX'
   ========================================================================== */

(function () {
  'use strict';

  var WAITLIST = {
    // '' | 'mailerlite' | 'brevo' | 'formspree'
    provider: 'mailerlite',

    mailerlite: {
      accountId: '2631545',
      formId: '198500400349840797'
    },

    brevo: {
      formUrl: ''
    },

    formspree: {
      formId: '198500400349840797' // https://formspree.io/f/XXXXXXX  →  'XXXXXXX'
    },

    linkedin: 'https://www.linkedin.com/in/alexperdel/'
  };

  var MSG = {
    invalidEmail: 'Ese email no parece válido. Míralo y vuelve a darle.',
    noConsent: 'Marca la casilla para que pueda enviarte el aviso.',
    sending: 'Un segundo...',
    ok: 'Hecho. Te acabo de mandar un correo para que confirmes la suscripción — si no aparece, mira en promociones o spam.',
    error: 'No ha entrado. Vuelve a intentarlo en un minuto, o escríbeme por LinkedIn y te apunto a mano.'
  };

  var form = document.getElementById('waitlist-form');
  if (!form) return;

  var emailInput = document.getElementById('waitlist-email');
  var consentInput = document.getElementById('waitlist-consent');
  var submitBtn = document.getElementById('waitlist-submit');
  var msg = document.getElementById('waitlist-msg');

  function say(text, isError) {
    msg.textContent = text;
    msg.classList.toggle('is-error', !!isError);
  }

  function isConfigured() {
    var p = WAITLIST.provider;
    if (p === 'mailerlite') return !!(WAITLIST.mailerlite.accountId && WAITLIST.mailerlite.formId);
    if (p === 'brevo') return !!WAITLIST.brevo.formUrl;
    if (p === 'formspree') return !!WAITLIST.formspree.formId;
    return false;
  }

  /* ------------------------------------------------------------------------
     Sin proveedor configurado: se retira el formulario y se dice la verdad.
     ------------------------------------------------------------------------ */
  if (!isConfigured()) {
    var fallback = document.createElement('div');
    fallback.className = 'libro-form__fallback';
    fallback.innerHTML =
      '<a href="' + WAITLIST.linkedin + '" target="_blank" rel="noopener" ' +
      'class="btn btn--primary btn--large"><i class="fab fa-linkedin"></i> Sígueme y te aviso ahí</a>' +
      '<p class="libro-form__msg">La lista de correo abre en unos días. Hasta entonces el aviso sale por LinkedIn.</p>';

    form.parentNode.replaceChild(fallback, form);
    return;
  }

  /* ------------------------------------------------------------------------
     Envío
     ------------------------------------------------------------------------ */
  function endpointAndBody(email) {
    var body = new FormData();

    if (WAITLIST.provider === 'mailerlite') {
      body.append('fields[email]', email);
      body.append('ml-submit', '1');
      body.append('anticsrf', 'true');
      return {
        url: 'https://assets.mailerlite.com/jsonp/' + WAITLIST.mailerlite.accountId +
             '/forms/' + WAITLIST.mailerlite.formId + '/subscribe',
        body: body
      };
    }

    if (WAITLIST.provider === 'brevo') {
      body.append('EMAIL', email);
      body.append('email_address_check', '');
      body.append('locale', 'es');
      return { url: WAITLIST.brevo.formUrl, body: body };
    }

    // formspree
    body.append('email', email);
    body.append('_subject', 'Lista de espera Hiperautomatizaciones');
    return { url: 'https://formspree.io/f/' + WAITLIST.formspree.formId, body: body };
  }

  function send(email) {
    var target = endpointAndBody(email);

    // Primer intento con CORS, para poder leer el resultado.
    return fetch(target.url, { method: 'POST', body: target.body })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return true;
      })
      .catch(function () {
        // El proveedor no devuelve cabeceras CORS: se reenvía a ciegas.
        // La confirmación real la da el correo de doble opt-in.
        return fetch(target.url, { method: 'POST', mode: 'no-cors', body: target.body })
          .then(function () { return true; });
      });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var email = (emailInput.value || '').trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      say(MSG.invalidEmail, true);
      emailInput.focus();
      return;
    }

    if (!consentInput.checked) {
      say(MSG.noConsent, true);
      consentInput.focus();
      return;
    }

    submitBtn.disabled = true;
    say(MSG.sending, false);

    send(email)
      .then(function () {
        say(MSG.ok, false);
        form.reset();

        if (typeof gtag === 'function') {
          gtag('event', 'waitlist_signup', { event_category: 'libro', event_label: 'hiperautomatizaciones' });
        }
      })
      .catch(function () {
        say(MSG.error, true);
      })
      .then(function () {
        submitBtn.disabled = false;
      });
  });
})();
