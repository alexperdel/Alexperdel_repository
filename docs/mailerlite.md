# MailerLite — la infraestructura de correo de alexperdel.com

> **Montado el 2026-09-13.** Es la herramienta de correo de la marca. Da servicio a dos cosas distintas: la **newsletter mensual** —ver [`newsletter_marca.md`](newsletter_marca.md)— y la **lista de espera del libro**, que se documenta en el repo del libro porque es suya.
>
> Cuenta gratuita mientras no pase de 1.000 suscriptores. Servidores en la UE, que es lo que hace que el RGPD no sea un problema añadido.
>
> ⚠️ **Este repo es público.** Aquí no va ninguna clave. Los identificadores de abajo ya son públicos por diseño —van dentro del JavaScript del formulario, que cualquiera puede leer—, pero **el token de la API no está aquí ni puede estarlo**.

---

## La cuenta

| | |
|---|---|
| **Cuenta** | `2631545` |
| **Remitente por defecto** | `Alex Perdel <info@alexperdel.com>` |
| **Dominio de envío** | `alexperdel.com` — ✅ **autenticado** |
| **API** | `https://connect.mailerlite.com/api` · cabecera `Authorization: Bearer` |
| **Token** | 🔒 **Fuera de este repo.** Vive en un `.env` local que no se versiona |

### Lo que hizo falta en el DNS

El dominio está en cdmon. Tres registros, y el segundo tiene trampa:

| Tipo | Nombre | Valor |
|---|---|---|
| CNAME | `litesrv._domainkey` | `litesrv._domainkey.mlsend.com` |
| TXT | `@` | `v=spf1 include:_spf.mlsend.com include:_spf.srv.cat ~all` |
| TXT | `@` | `mailerlite-domain-verification=…` |

🔴 **El SPF se EDITA, no se añade.** Ya había uno (`v=spf1 include:_spf.srv.cat ~all`, el del correo de cdmon). **Dos registros que empiecen por `v=spf1` invalidan los dos** y tiran también el correo normal de `@alexperdel.com`. El valor que da MailerLite ya viene con el `_spf.srv.cat` dentro, precisamente porque detecta el que hay.

📌 **El DMARC del dominio es `p=none` con `aspf=s`.** MailerLite envía con su propio return-path, así que la alineación la sostiene el **DKIM**, no el SPF. Por eso el CNAME no es opcional.

---

## Las dos listas

| Grupo | id | Qué promete | De quién es |
|---|---|---|---|
| **Marca · novedades y promociones** | `198500367899559057` | Un correo al mes | De la web — [`newsletter_marca.md`](newsletter_marca.md) |
| **Libro · lista de espera** | `198500367728641050` | **Un correo el día que el libro salga.** Nada más | Del libro |

🔴 **Dos listas, dos promesas, y no se cruzan.** Pasar a alguien de una a otra sin que se apunte es consentimiento dado para una finalidad y usado para otra. Es lo que hace que la gente marque como spam, y además no es legal.

📌 **Por eso los formularios son distintos y viven en sitios distintos.** El del libro, en la landing del libro. El de la newsletter, en el pie del sitio y donde haya intención de seguir leyendo.

---

## Cómo habla la web con MailerLite

**No se usa el HTML que da MailerLite.** Se usa formulario propio —[`../js/libro-waitlist.js`](../js/libro-waitlist.js)— que postea al endpoint público:

```
https://assets.mailerlite.com/jsonp/2631545/forms/<FORM_ID>/subscribe
```

Así el diseño es el del sitio y no entran 600 líneas de CSS ajeno. **No hay ninguna clave en el navegador**: el endpoint es público y la confirmación real la da el doble opt-in, que está activo en los dos formularios.

---

## Lo que la API puede y lo que no

Esto ahorra media hora buscando el endpoint que no existe:

| | API |
|---|---|
| Grupos, suscriptores, campos, campañas | ✅ CRUD completo |
| **Formularios** | ❌ se listan y se editan, **no se crean** |
| **Automatizaciones** | ❌ **solo lectura** |

**Consecuencia**: los grupos y las campañas se crean por API en segundos; los formularios y los flujos hay que montarlos a mano en el panel. Una vez montados, **verificarlos sí se hace por API**, que es más fiable que mirar la pantalla:

```
GET /api/automations   → enabled, complete, broken, eligible_for_sending
GET /api/groups        → active_count por grupo
```

📌 **Y un tercer sitio donde no llega la API: el CONTENIDO de los formularios.** `GET /api/forms/embedded` devuelve el grupo, el estado y las métricas, pero **no el texto**. Para leer lo que de verdad está publicado sin abrir el panel, sirve la URL de vista previa, que es pública y sale en el propio JSON:

```
.share_url            → https://preview.mailerlite.io/forms/<cuenta>/<form>/share
.preview_url del email → https://preview.mailerlite.io/preview/<cuenta>/emails/<email>
```

Con eso se comprueba por `curl` que un cambio ha entrado, en vez de fiarse de una captura.

---

## 🔴 Lo que el plan actual no deja tocar

Hay dos textos que **ve todo el que se suscribe** y que no se pueden editar:

| | Qué es | Qué dice hoy |
|---|---|---|
| **Email de confirmación** | El PRIMER correo que recibe, antes que ninguna bienvenida | *«¡Gracias por tu interés en nuestra newsletter!»* |
| **Página de gracias** | Donde aterriza tras pulsar el enlace de confirmar | *«¡Te has suscripto a la newsletter!»* |

No es configuración mal puesta: en el panel los botones **Editar** salen deshabilitados y el editor de la plantilla responde **403 · «No disponible en el plan gratis»**.

⚠️ **Dónde molesta de verdad es en la lista del libro**, que promete explícitamente *«no hay newsletter detrás»* y cuyo primer correo dice lo contrario.

**Salidas, de menos a más trabajo:**

1. **Dejarlo.** Son dos pantallas de trámite y el correo de bienvenida, que sí controlamos, llega justo después y corrige la impresión.
2. **Redirigir la confirmación a una página propia.** En *Double opt-in → Página de agradecimiento* hay un campo **«O usa tu propia landing page»** que acepta una URL. Es gratis y esquiva el editor bloqueado, pero pide crear esa página en el sitio — y entonces se puede escribir una por lista, que es lo correcto.
3. **Subir de plan**, si algún día hace falta por otra cosa.

La opción 2 es la buena en cuanto haya volumen. Hoy no lo hay.

---

## Medición — el matiz que descuadra los números

La web dispara `waitlist_signup` en GA4 **al enviar el formulario**, no al confirmar. Con doble opt-in, entre una cosa y otra hay un correo de por medio.

⚠️ **GA4 mide SOLICITUDES y MailerLite mide ALTAS, y no van a cuadrar nunca.** Es normal perder entre un 20 y un 40% por el camino. Para medir confirmados de verdad hay que leer el `active_count` del grupo por API, o montar un webhook `subscriber.added_to_group` — y entonces con **otro nombre de evento**, no reutilizando este.

📌 **Segundo motivo para no fiarse**: el envío va en `no-cors` cuando el endpoint no devuelve cabeceras CORS, así que el evento se dispara aunque MailerLite rechace el alta.

### UTMs

Activadas. El tráfico de los correos llega así:

```
utm_source = mailerlite · utm_medium = email
utm_campaign = {$campaign_subject}  ← se resuelve al ASUNTO del correo
utm_term = {$campaign_date}
```

⚠️ **Que `utm_campaign` sea el asunto extraña la primera vez** y no es un error: en GA4 aparecen campañas llamadas *«Estás en la lista»*. La alternativa —un literal fijo— agrupa todos los envíos bajo el mismo nombre y pierde el detalle por correo.

---

## Pendiente

| | Qué |
|---|---|
| 🔲 | **El workflow perenne de doce meses** — plan en [`newsletter_marca.md`](newsletter_marca.md) |
| 🔲 | **Desactivar o poner en noindex el archivo público de MailerLite**, o competirá con los artículos del sitio por el mismo contenido |
| 🔲 | **Probar la cadena entera de una lista**: ningún formulario ha recibido todavía un alta real (`conversions_count: 0` en los dos) |
