/* ==========================================================================
   LISTA DE ESPERA - Hiperautomatizaciones
   --------------------------------------------------------------------------
   Sitio estático: no hay backend. El formulario habla directamente con el
   endpoint público del proveedor de email, así que NO hay ninguna API key
   en el navegador.

   DÓNDE APARECE
     1. La sección «Te aviso el día que salga» de la landing del libro, que
        lleva el formulario escrito en el HTML.
     2. Un modal, que abre cualquier botón con data-waitlist-open. Lo usan los
        «Avísame cuando salga» de la home y de la landing. El formulario del
        modal lo monta este script, porque la home no tiene ninguno.

     Los dos comparten validación, envío y mensajes: hay un solo camino de
     código y un solo sitio donde cambiar el texto.

   PROGRESIVO
     Los botones conservan su href a #lista-de-espera (o a la landing desde la
     home). Si el JS no carga, siguen llevando a la sección. El modal solo
     intercepta el clic cuando está todo en pie.

   👉 CONFIGURACIÓN: WAITLIST.provider y los ids de abajo. Con provider vacío
      el formulario se retira solo y aparece el aviso por LinkedIn, para no
      fingir que funciona.

   MAILERLITE · cuenta 2631545 · formulario 198500400349840797
     Los dos números salen del endpoint del formulario embebido:
     .../jsonp/2631545/forms/198500400349840797/subscribe
                  ^cuenta      ^formulario
     Doble opt-in ACTIVO, y al confirmar entra en el grupo «Libro · lista de
     espera», que dispara la automatización de bienvenida.
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
      formId: '' // https://formspree.io/f/XXXXXXX  →  'XXXXXXX'
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

  var MODAL = {
    title: 'Te aviso el día que salga',
    text: 'Un correo. El día que salga. No hay newsletter detrás, ni secuencia de bienvenida, ni nada que no hayas pedido — y te puedes borrar de un clic.',
    fine: 'Sin seguimiento comercial, sin cesión a terceros y sin correos semanales que nadie pidió.'
  };

  function isConfigured() {
    var p = WAITLIST.provider;
    if (p === 'mailerlite') return !!(WAITLIST.mailerlite.accountId && WAITLIST.mailerlite.formId);
    if (p === 'brevo') return !!WAITLIST.brevo.formUrl;
    if (p === 'formspree') return !!WAITLIST.formspree.formId;
    return false;
  }

  // La política de privacidad cuelga de la raíz, y la landing del libro está
  // un nivel por debajo. Se calcula en vez de dejarlo fijo para que funcione
  // también abriendo los ficheros en local.
  function rutaPrivacidad() {
    return /\/hiperautomatizaciones\//.test(window.location.pathname)
      ? '../politica-privacidad.html'
      : 'politica-privacidad.html';
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

  /* ------------------------------------------------------------------------
     Un formulario cualquiera: el de la sección o el del modal
     ------------------------------------------------------------------------ */
  function wire(form, origen) {
    var emailInput = form.querySelector('input[type="email"]');
    var consentInput = form.querySelector('input[type="checkbox"]');
    var submitBtn = form.querySelector('button[type="submit"]');
    var msg = form.querySelector('.libro-form__msg');
    if (!emailInput || !consentInput || !submitBtn || !msg) return;

    function say(text, isError) {
      msg.textContent = text;
      msg.classList.toggle('is-error', !!isError);
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

          // El evento mide SOLICITUDES, no altas: con doble opt-in el alta
          // real llega cuando el suscriptor confirma, y eso pasa fuera de
          // esta página. GA4 va a marcar más de las que cuenta MailerLite.
          if (typeof gtag === 'function') {
            gtag('event', 'waitlist_signup', {
              event_category: 'libro',
              event_label: 'hiperautomatizaciones',
              method: origen || 'inline'
            });
          }
        })
        .catch(function () {
          say(MSG.error, true);
        })
        .then(function () {
          submitBtn.disabled = false;
        });
    });
  }

  /* ------------------------------------------------------------------------
     El modal
     ------------------------------------------------------------------------ */
  var dialog = null;

  function construirModal() {
    if (dialog) return dialog;

    dialog = document.createElement('dialog');
    dialog.className = 'waitlist-modal';
    dialog.setAttribute('aria-labelledby', 'waitlist-modal-title');
    dialog.innerHTML =
      '<div class="waitlist-modal__inner">' +
        '<button type="button" class="waitlist-modal__close" aria-label="Cerrar">&times;</button>' +
        '<h2 class="waitlist-modal__title" id="waitlist-modal-title">' + MODAL.title + '</h2>' +
        '<p class="waitlist-modal__text">' + MODAL.text + '</p>' +
        '<form class="libro-form" id="waitlist-form-modal" novalidate>' +
          '<div class="libro-form__row">' +
            '<label for="waitlist-email-modal" class="visually-hidden">Tu email</label>' +
            '<input type="email" id="waitlist-email-modal" name="email" placeholder="tu@email.com" autocomplete="email" required>' +
            '<button type="submit" class="btn btn--primary btn--large">' +
              '<i class="fas fa-bell"></i> Avísame' +
            '</button>' +
          '</div>' +
          '<label class="libro-form__consent">' +
            '<input type="checkbox" id="waitlist-consent-modal" name="consent" required>' +
            '<span>Acepto recibir el aviso de lanzamiento de <em>Hiperautomatizaciones</em> y he leído la ' +
            '<a href="' + rutaPrivacidad() + '">política de privacidad</a>.</span>' +
          '</label>' +
          '<p class="libro-form__msg" role="status" aria-live="polite"></p>' +
        '</form>' +
        '<p class="libro-form__fine">' + MODAL.fine + '</p>' +
      '</div>';

    document.body.appendChild(dialog);

    dialog.querySelector('.waitlist-modal__close')
      .addEventListener('click', function () { dialog.close(); });

    // Clic en el fondo: el backdrop es el propio <dialog>, así que basta con
    // comprobar que el clic no cayó dentro del panel.
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) dialog.close();
    });

    wire(dialog.querySelector('form'), 'modal');
    return dialog;
  }

  function abrirModal() {
    var d = construirModal();
    if (typeof d.showModal === 'function') {
      d.showModal();
    } else {
      d.setAttribute('open', '');
    }
    var input = d.querySelector('input[type="email"]');
    if (input) input.focus();
  }

  /* ------------------------------------------------------------------------
     Arranque
     ------------------------------------------------------------------------ */
  var inline = document.getElementById('waitlist-form');
  var abridores = document.querySelectorAll('[data-waitlist-open]');

  /* Sin proveedor configurado: se retira el formulario, se desactivan los
     botones del modal y se dice la verdad. */
  if (!isConfigured()) {
    if (inline) {
      var fallback = document.createElement('div');
      fallback.className = 'libro-form__fallback';
      fallback.innerHTML =
        '<a href="' + WAITLIST.linkedin + '" target="_blank" rel="noopener" ' +
        'class="btn btn--primary btn--large"><i class="fab fa-linkedin"></i> Sígueme y te aviso ahí</a>' +
        '<p class="libro-form__msg">La lista de correo abre en unos días. Hasta entonces el aviso sale por LinkedIn.</p>';
      inline.parentNode.replaceChild(fallback, inline);
    }
    return; // los botones se quedan como anclas, que es lo que eran
  }

  if (inline) wire(inline, 'inline');

  Array.prototype.forEach.call(abridores, function (btn) {
    btn.addEventListener('click', function (e) {
      // Sin <dialog> (navegador viejo) se deja pasar el clic: el href lleva
      // a la sección de la landing, que sigue funcionando.
      if (typeof HTMLDialogElement === 'undefined') return;
      e.preventDefault();
      abrirModal();
    });
  });
})();
