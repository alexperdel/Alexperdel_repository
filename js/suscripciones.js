/* ==========================================================================
   SUSCRIPCIONES — las dos listas de correo
   --------------------------------------------------------------------------
   Sitio estático: no hay backend. Los formularios hablan directamente con el
   endpoint público de MailerLite, así que NO hay ninguna clave en el
   navegador. La confirmación real la da el doble opt-in.

   🔴 SON DOS LISTAS Y NO SE CRUZAN
     libro  → «te aviso el día que salga». UN correo, y se acabó.
     marca  → la newsletter mensual.

     Quien se apunta a una NO entra en la otra. Son dos promesas distintas, y
     usar el consentimiento de una para la otra no es solo antipático: es
     usar un consentimiento dado para una finalidad en otra distinta.

   DÓNDE APARECE CADA UNA
     libro · sección «Te aviso el día que salga» de la landing del libro
     libro · modal, que abre cualquier botón con data-waitlist-open
     marca · formulario del pie y de la home

   CÓMO SE ENGANCHA UN FORMULARIO NUEVO
     Basta con que tenga class="libro-form" y data-lista="libro|marca", y
     dentro un input de email, un checkbox de consentimiento, un submit y un
     .libro-form__msg. Este script hace el resto. No hay que tocar JS para
     añadir un formulario en una página nueva.

   MAILERLITE · cuenta 2631545
     Los ids salen del endpoint del formulario embebido:
     .../jsonp/2631545/forms/<FORM_ID>/subscribe
                  ^cuenta       ^formulario
   ========================================================================== */

(function () {
  'use strict';

  var CUENTA = '2631545';

  var LISTAS = {
    libro: {
      formId: '198500400349840797',
      evento: 'waitlist_signup',
      ok: 'Hecho. Te acabo de mandar un correo para que confirmes la suscripción — si no aparece, mira en promociones o spam.'
    },
    marca: {
      formId: '198505466917028909',
      evento: 'newsletter_signup',
      ok: 'Hecho. Revisa tu correo y confirma la suscripción — si no aparece, mira en promociones o spam.'
    }
  };

  var MSG = {
    invalidEmail: 'Ese email no parece válido. Míralo y vuelve a darle.',
    noConsent: 'Marca la casilla para que pueda escribirte.',
    sending: 'Un segundo...',
    error: 'No ha entrado. Vuelve a intentarlo en un minuto, o escríbeme por LinkedIn y te apunto a mano.'
  };

  var MODAL = {
    title: 'Te aviso el día que salga',
    text: 'Un correo. El día que salga. No hay newsletter detrás, ni secuencia de bienvenida, ni nada que no hayas pedido — y te puedes borrar de un clic.',
    fine: 'Sin seguimiento comercial, sin cesión a terceros y sin correos semanales que nadie pidió.'
  };

  var LINKEDIN = 'https://www.linkedin.com/in/alexperdel/';

  // La política de privacidad cuelga de la raíz, y la landing del libro está
  // un nivel por debajo. Se calcula en vez de dejarlo fijo para que funcione
  // también abriendo los ficheros en local.
  function rutaPrivacidad() {
    return /\/hiperautomatizaciones\/|\/proyectos\/|\/articulos\//.test(window.location.pathname)
      ? '../politica-privacidad.html'
      : 'politica-privacidad.html';
  }

  /* ------------------------------------------------------------------------
     Envío
     ------------------------------------------------------------------------ */
  function enviar(lista, email) {
    var body = new FormData();
    body.append('fields[email]', email);
    body.append('ml-submit', '1');
    body.append('anticsrf', 'true');

    var url = 'https://assets.mailerlite.com/jsonp/' + CUENTA +
              '/forms/' + lista.formId + '/subscribe';

    // Primer intento con CORS, para poder leer el resultado.
    return fetch(url, { method: 'POST', body: body })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return true;
      })
      .catch(function () {
        // MailerLite no devuelve cabeceras CORS: se reenvía a ciegas.
        // Por eso el evento de GA4 mide SOLICITUDES y no altas.
        return fetch(url, { method: 'POST', mode: 'no-cors', body: body })
          .then(function () { return true; });
      });
  }

  /* ------------------------------------------------------------------------
     Engancha un formulario cualquiera
     ------------------------------------------------------------------------ */
  function enganchar(form, origen) {
    var clave = form.getAttribute('data-lista') || 'libro';
    var lista = LISTAS[clave];
    if (!lista) return;

    var email = form.querySelector('input[type="email"]');
    var consent = form.querySelector('input[type="checkbox"]');
    var submit = form.querySelector('button[type="submit"]');
    var msg = form.querySelector('.libro-form__msg');
    if (!email || !consent || !submit || !msg) return;

    function di(texto, error) {
      msg.textContent = texto;
      msg.classList.toggle('is-error', !!error);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var valor = (email.value || '').trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor)) {
        di(MSG.invalidEmail, true);
        email.focus();
        return;
      }

      if (!consent.checked) {
        di(MSG.noConsent, true);
        consent.focus();
        return;
      }

      submit.disabled = true;
      di(MSG.sending, false);

      enviar(lista, valor)
        .then(function () {
          di(lista.ok, false);
          form.reset();

          // Mide SOLICITUDES, no altas: con doble opt-in el alta llega cuando
          // el suscriptor confirma, y eso pasa fuera de esta página.
          if (typeof gtag === 'function') {
            gtag('event', lista.evento, {
              event_category: clave === 'libro' ? 'libro' : 'marca',
              event_label: clave === 'libro' ? 'hiperautomatizaciones' : 'newsletter',
              method: origen || 'inline'
            });
          }
        })
        .catch(function () {
          di(MSG.error, true);
        })
        .then(function () {
          submit.disabled = false;
        });
    });
  }

  /* ------------------------------------------------------------------------
     El modal — solo para la lista del libro
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
        '<form class="libro-form" data-lista="libro" novalidate>' +
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

    enganchar(dialog.querySelector('form'), 'modal');
    return dialog;
  }

  function abrirModal() {
    var d = construirModal();
    if (typeof d.showModal === 'function') d.showModal();
    else d.setAttribute('open', '');
    var input = d.querySelector('input[type="email"]');
    if (input) input.focus();
  }

  /* ------------------------------------------------------------------------
     Arranque
     ------------------------------------------------------------------------ */
  Array.prototype.forEach.call(
    document.querySelectorAll('form.libro-form'),
    function (form) { enganchar(form, 'inline'); }
  );

  Array.prototype.forEach.call(
    document.querySelectorAll('[data-waitlist-open]'),
    function (btn) {
      btn.addEventListener('click', function (e) {
        /* Sin <dialog> no hay modal, y entonces el clic tiene que llevar igual
           a la sección de la landing, que sigue en la página con su formulario.

           Cómo se llega depende de qué es el elemento:
             <a> con href  → se deja pasar. En la home eso es navegación de
                             verdad a la landing.
             <button>      → se baja a #lista-de-espera a mano. Sin esto el
                             botón se quedaría muerto, que es peor que no
                             tener botón. */
        if (typeof HTMLDialogElement === 'undefined') {
          if (btn.tagName === 'A' && btn.getAttribute('href')) return;
          e.preventDefault();
          /* Las dos cosas, y no es redundancia: el hash deja la URL
             compartible, y scrollIntoView() SIN opciones es lo que mueve la
             página de verdad. Sin argumentos a propósito: la versión con
             {behavior} no existe en los navegadores viejos, que son justo los
             que llegan aquí. Comprobado que el hash solo no arrastra. */
          var seccion = document.getElementById('lista-de-espera');
          window.location.hash = 'lista-de-espera';
          if (seccion && seccion.scrollIntoView) {
            try { seccion.scrollIntoView(); } catch (err) { /* ya está el hash */ }
          }
          return;
        }
        e.preventDefault();
        abrirModal();
      });
    }
  );

  // Por si alguna vez hace falta el enlace a LinkedIn desde fuera.
  window.ALEXPERDEL_LINKEDIN = LINKEDIN;
})();
