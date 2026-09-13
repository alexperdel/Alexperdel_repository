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

## Estado de la cuenta · 2026-09-13

Lo que hay montado hoy, con sus ids. Verificado por API, no de memoria.

**Grupos**

| Grupo | id | Suscriptores |
|---|---|---|
| Libro · lista de espera | `198500367728641050` | 0 |
| Marca · novedades y promociones | `198500367899559057` | 0 |

**Formularios** — 2 de los 3 que da el plan. Los dos con doble opt-in.

| Formulario | id | Grupo |
|---|---|---|
| Libro · lista de espera (web) | `198500400349840797` | Libro |
| Newsletter · marca (web) | `198505466917028909` | Marca |

📌 **La web no incrusta estos formularios**: publica su propio HTML contra el endpoint `jsonp`. Los de MailerLite existen porque son los que crean el grupo y disparan el doble opt-in, pero su diseño sólo se ve en la URL de vista previa.

**Automatizaciones** — 1 de las 3 del plan está activa.

| Automatización | id | Estado |
|---|---|---|
| Bienvenida · lista de espera del libro | `198500616499103361` | ✅ **activa**, completa, sin avisos |
| Bienvenida · newsletter de marca | `198508561423140304` | 🔴 **PAUSADA · el cuerpo del correo está a medias** |

🔴 **La bienvenida de marca no está terminada y por eso NO se ha activado.** El disparador y los ajustes están bien —grupo correcto, castellano, UTM, remitente—, pero el cuerpo del correo sigue teniendo texto del libro. Está pausada a propósito: así no le llega a nadie.

**Por qué se quedó a medias**, que es lo que importa para el siguiente que lo intente: el editor visual de MailerLite tiene dos comportamientos que destrozan el contenido si se automatiza a golpe de clic.

1. **Al escribir sobre una selección, reaplica la selección en cada pulsación.** Resultado: de un párrafo entero sólo sobreviven los dos últimos caracteres. **La vuelta: seleccionar, pulsar Borrar, y escribir después.** Con eso entra limpio.
2. **Borrar una selección fusiona el bloque con el siguiente.** Y partirlos otra vez exige clicar en una posición exacta de texto, que es donde se acaba rompiendo.

Y una tercera, más tonta: en ventana grande **las coordenadas de la captura no coinciden con las del DOM**. Las capturas vuelven a 1280, 1369 o 1421 px según el momento. Clicar calculando desde `getBoundingClientRect()` falla; hay que leer las coordenadas de la propia captura.

Terminar ese correo son diez minutos **a mano**, y es lo que recomiendo.

**Campañas**

| Campaña | id | Estado |
|---|---|---|
| Lanzamiento · Hiperautomatizaciones ya está a la venta | `198502586079250421` | Borrador. Le faltan la portada y la URL de Amazon |
| Newsletter · Por qué uso FastAPI y no Flask ni Django | `198508421041882407` | Borrador de PRUEBA. Se creó por API para validar la plantilla del número semanal. **Se puede borrar** |

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

## El número semanal: un artículo = un número

La newsletter no tiene contenido propio. **Sale de lo que ya se escribe para la web**, que es lo que hace sostenible publicar una vez al mes sin una segunda máquina de contenidos.

**Por qué es una CAMPAÑA y no una automatización.** Por dos motivos independientes, y cualquiera de los dos bastaría:

1. El plan gratuito topa las automatizaciones en **5 pasos**. Doce números son 24 (doce correos y doce esperas).
2. Las automatizaciones **no se pueden crear por API**. Las campañas sí, con CRUD completo.

📌 **Lo que se pierde y conviene saberlo**: una campaña se envía en una fecha a todos. El circuito perenne que se llegó a plantear —te apuntas hoy, número 1 el mes que viene— **necesita una automatización y no cabe en el plan gratuito**. Quien llegue nuevo no recibe los números anteriores. Si algún día compensa, la bienvenida puede mandarle al índice de artículos.

### Dónde vive el código

Está en Scarif, no aquí, porque aquí no puede haber credenciales:

    backend/app/services/mailerlite_service.py            el cliente
    backend/app/services/templates/newsletter_article.html la plantilla del correo
    backend/tests/unit/test_mailerlite_service.py          11 tests, ninguno llama a MailerLite

La frontera con el circuito de contenidos es una función:

    create_article_draft(asunto, preheader, titulo, entradilla,
                         cuerpo_html, url, tag=None, portada_url=None) -> str

Crea la campaña **en borrador** contra el grupo de marca y devuelve su id. **No envía.** Enviar lo hace Alex desde el panel, que es el gesto de aprobación.

**Por qué `asunto` va separado de `titulo`**: el título del artículo está escrito para Google y lleva la palabra clave delante —*«Por qué uso FastAPI y no Flask ni Django»*—; el asunto se lee en una bandeja llena y compite con otros cuarenta —*«Por qué no uso Django»*—. Con un solo campo hay que elegir entre posicionar y que lo abran.

### Tres trampas que ya están resueltas en el código

🔴 **El SVG no se ve en el correo.** Las portadas de los artículos se generan en SVG y ningún cliente de correo las pinta: sale un hueco. La plantilla las quiere en **PNG de 1200×630** —la misma medida que la portada de redes— y las muestra a 600 px. El servicio **rechaza** una URL `.svg` en vez de mandar un correo roto.

🔴 **Una campaña sin grupo se envía a nadie y la API responde 200.** El grupo es obligatorio y se comprueba antes de llamar. Y al leer una campaña, **el grupo vive en `c.filter`, no en `c.groups`**.

🔴 **Gmail recorta a partir de 102 KB** y mete un «ver mensaje completo» que se lleva por delante el pie y el enlace de baja. La plantilla ronda los 5 KB. Si algún día el cuerpo crece mucho, esto es lo que se rompe primero y no avisa.

---

## Pendiente

| | Qué |
|---|---|
| 🔴 | **Terminar el cuerpo de la bienvenida de marca y activarla.** Hoy está pausada con texto del libro |
| 🔲 | **El perenne de doce meses no cabe en el plan gratuito** (5 pasos). Plan en [`newsletter_marca.md`](newsletter_marca.md), pendiente de que Alex decida si compensa pagar |
| 🔲 | **Desactivar o poner en noindex el archivo público de MailerLite**, o competirá con los artículos del sitio por el mismo contenido |
| 🔲 | **Probar la cadena entera de una lista**: ningún formulario ha recibido todavía un alta real (`conversions_count: 0` en los dos) |
