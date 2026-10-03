# Estado de alexperdel.com

Documento de traspaso del **13 de septiembre de 2026**. Recoge qué se hizo,
qué está en producción, qué quedó pendiente y —sobre todo— **por qué** se
decidió cada cosa, que es lo que se pierde con el tiempo.

> Esta carpeta `docs/` **no se sube por FTP**. Al servidor solo va lo que un
> navegador tiene que pedir.

---

## 1. Punto de partida

La web llevaba desde el **4 de julio** sin actualizarse. El repo iba muy por
delante del servidor, y lo más grave era que **`/hiperautomatizaciones/`
devolvía 404**: la landing del libro, a la que iban a apuntar las campañas de
correo, no existía en producción.

En Search Console, los 90 días previos daban esto:

| | |
|---|---|
| Clics | **12** |
| Impresiones | 493 |
| CTR | 2,4 % |
| Posición media | **12,2** (página 2) |

Ninguna de las 19 consultas visibles tenía un solo clic.

---

## 2. Analítica

### Lo que ya estaba bien

GA4 instalado (`G-S7FSP331TC`) con **Consent Mode v2 correctamente
implementado**: todo denegado por defecto y GA4 inyectado siempre, que es lo
que permite las conversiones modeladas. Flujo `2345014864` recibiendo tráfico.
Search Console verificado como **propiedad de dominio** desde 2021 y ya
asociado a GA4.

### Lo que faltaba

**Cero eventos clave.** GA4 no sabía qué era un éxito.

Se creó **`waitlist_signup`** con dos decisiones deliberadas:

- **Sin valor monetario.** Asignar un euro ficticio mete ingresos falsos en los
  informes, y quien los lea después los creerá.
- **Recuento una vez por sesión**, no por evento. El formulario postea en
  `no-cors` a ciegas y no puede leer la respuesta, así que un reenvío contaría
  doble.

**Se descartaron a propósito** los eventos de LinkedIn, EBIS y scroll 90 %, que
el propio Alex había pedido al principio. Motivo: la medición mejorada de GA4
**ya captura clics salientes y scroll de serie**. Convertirlos en eventos clave
no añadía ni un dato, solo configuración que mantener. Para alguien que no
vende online, **una conversión real y el resto medido de serie** es la
configuración correcta, no una más grande.

**Tampoco se montó Tag Manager**, aunque Alex lo ofreció. GA4 está puesto
directo en el código con el consentimiento bien resuelto; meter GTM sería una
capa intermedia para no ganar nada.

### Acceso por API

En Google Cloud (proyecto `scarif-automation`) se activaron **Analytics Admin,
Analytics Data, Search Console y Tag Manager**.

El login normal (`gcloud auth application-default login`) **falla**: Google
bloquea el cliente de gcloud para scopes sensibles como `analytics.edit`. No es
un fallo de la cuenta.

La vía que sí funciona es **cuenta de servicio con impersonación**:

```
analitica-alexperdel@scarif-automation.iam.gserviceaccount.com
```

Con `roles/iam.serviceAccountTokenCreator` sobre ella. **Sin fichero de clave**:
el token se pide al vuelo y caduca en una hora.

⚠️ **Queda pendiente** dar de alta ese correo como usuario en GA4 (rol Analista)
y en Search Console. Google no permite hacerlo por API: hay que entrar en cada
producto.

---

## 3. Search Console e indexación

### Diagnóstico de las «36 páginas sin indexar»

No estaba roto nada. Era **ruido histórico**:

| Motivo | Páginas | Qué era |
|---|---|---|
| Rastreada sin indexar | 13 | URLs de la web antigua de WordPress |
| Página con redirección | 8 | `www` → sin `www`, ya correcto |
| **404** | **6** | Secciones viejas sin redirección ← esto sí se arregló |
| Excluida por `noindex` | 5 | Las páginas legales, **a propósito** |
| Canónica alternativa | 4 | Correcto |

Las 9 URLs del sitemap estaban indexadas y devolvían 200.

### Las 6 redirecciones 301

`/portfolio/`, `/desarrollo-web/`, `/crecer-en-ingles/`, `/seo/`,
`/marketing-digital/` y `/tarifas/` daban 404 desde marzo.

Alex pidió «todo lo viejo a la index». **Se hizo distinto y conviene saber por
qué**: cada una va a su equivalente actual, y solo `/tarifas/` a la home por no
tener equivalente. Si alguien busca «crecer en inglés» y Google lo manda a la
home en vez de a esa página, lo trata como *soft 404* y acaba desindexando el
destino. Es además el mismo criterio que ya tenían las variantes `/en/`.

### HTTPS

Estaba **comentado** en el `.htaccess` y `http://` devolvía 200. Cada URL del
sitio existía por duplicado para Google. Corregido.

### Sitemap

Google lo había leído por última vez el **31 de enero**: siete meses. Reenviado,
y lo releyó al instante pasando de 8 a 10 URLs descubiertas.

⚠️ **La solicitud manual de indexación de `/hiperautomatizaciones/` falló** con
un error de cuota de Google, dos intentos. No es grave: el sitemap ya le dijo a
Google que la URL existe. Conviene reintentarlo.

---

## 4. Rendimiento (Core Web Vitals)

| | Antes | Después |
|---|---|---|
| Peso de imágenes | 2,9 MB | **1,6 MB** |
| Foto del hero (elemento LCP) | 683 KB PNG | **126 KB JPEG** |
| Imágenes diferidas | 1 de 47 | **46 de 47** |
| Font Awesome | 102 KB **bloqueando** el render | No bloqueante |

La foto de la home era un **PNG con canal alfa completamente opaco**: pagaba
transparencia sin usarla, y es justo el elemento que Google cronometra. La
conversión se verificó **mirándola**, no fiándose del peso.

Font Awesome se carga con `media="print"` + `onload`. Como la hoja llega
después del primer pintado, los iconos tendrían ancho cero y empujarían el
texto al aparecer, así que **se les reserva `1em` en `utilities.css`**. Sin eso
se cambia un problema de velocidad por uno de desplazamiento.

---

## 5. La trampa de la caché (dos veces)

Esto mordió **dos veces el mismo día** y merece quedar escrito.

El `.htaccess` servía el CSS con `access plus 1 month`. Al publicar la landing
del libro, `styles.css` empezó a importar `libro.css`, pero los navegadores
tenían `styles.css` cacheado **de julio**, y esa copia es anterior a que
existiera ese fichero.

Resultado: la página cargaba **sin sus estilos**. Botones naranjas en vez del
rojo del libro y el hero apilado. Prueba concluyente:

```
fetch('/css/styles.css', {cache:'no-store'})  → 589 bytes, SÍ importa libro.css
fetch('/css/styles.css')                      → 568 bytes, NO lo importa
```

**Dos medidas, que hacen cosas distintas:**

1. La caché de CSS y JS baja **de 1 mes a 1 día**, para que no vuelva a pasar.
2. Los HTML piden `styles.css?v=20260913b`, porque bajar la caché **no desaloja
   a quien ya tiene la copia vieja**: su navegador no va a preguntar hasta que
   caduque.

> **La regla que se deduce, y que costó repetir el fallo:** si cambia la
> **lista de `@import`** de `styles.css`, hay que subir la versión aunque el
> fichero «casi» no haya cambiado. Volvió a pasar al añadir `articulo.css`.

El `?v=` es un **parche de una vez**, no la forma habitual de publicar. Con la
caché en un día, cualquier cambio llega a todo el mundo como mucho al día
siguiente.

---

## 6. SEO técnico y GEO

- **`Person` con `@id` estable**, foto, biografía, Sevilla, idiomas y temas
  reales. Antes existía pero sin `@id`, sin imagen y con un solo `sameAs`, así
  que Google no tenía con qué consolidar la entidad. Esto es lo que ataca el
  problema de que **`perdel` salga en posición 7,1**: no era el primer resultado
  de su propio apellido.
- **`WebSite`** enlazado por `@id`, y **`BreadcrumbList`** en las 6 páginas de
  proyecto. Todo el JSON validado con `jq`: un schema roto es peor que ninguno.
- **`llms.txt`**, que es lo que leen los buscadores con IA. Incluye la petición
  explícita de no redondear al alza las cifras de los proyectos.
- **6 meta descriptions** pasaban de 160 caracteres y Google las cortaba.
- **`og:image`** llevaba meses en **404**: cada vez que alguien compartía la web
  salía sin imagen. Generada de 1200×630.
- **4 títulos** no decían lo que la gente busca. Uno anunciaba «Head of AI &
  Automation», un cargo desactualizado. Ninguno se ve en la página: el
  `<title>` es la pestaña y el resultado de Google.

---

## 7. Palabras clave y nicho

### Los dos bloques que ya rankean

**Voz y agentes** (70 impresiones): «voicebot ia atención al cliente
automatización llamadas» (29, pos. 18,3), «voicebot para atención de llamadas
entrantes» (20, pos. 16,1), «máster en agentes de ia e hiperautomatización»
(12, pos. 10,6). Y un dato revelador: **«voicebot para recuperación de cartera»
en posición 1**.

**SEO project management** (50 impresiones, posiciones 27-43). Es su **pasado**
en NOATICA. Rankea porque existe esa página. No hay que matarlo —perder 50
impresiones sin ganar nada— pero **tampoco alimentarlo** con contenido nuevo.

### El nicho

> IA aplicada a operaciones de empresa, en español, contada por quien las ha
> montado y se ha equivocado montándolas.

**No competir** por «inteligencia artificial» ni «automatización»: volumen
enorme y agencias con presupuesto.

**Y no posicionarse como «experto en IA con +10 años».** Lo dice todo el mundo,
Google no premia adjetivos y es lo contrario de su voz. La autoridad se
demuestra con casos, cifras y errores propios.

### El diagnóstico incómodo

**Con 10 páginas de portfolio no se rankea.** No es un problema de
optimización: es de volumen. La web puede quedar técnicamente perfecta y
seguirá en posición 12, porque no hay materia suficiente. **La única palanca
real es escribir.**

---

## 8. La sección de artículos

`/articulos/` en producción, con índice, plantilla, `articulo.css` y 12
artículos planificados.

**Se reorientó a mitad de camino.** La primera versión eran los 12 capítulos
del libro. Alex lo rechazó: *«no quiero todo copiado del libro ni de coña»*.
Ahora son tutoriales, trucos y experiencias de **Vapi, n8n, Make, FastAPI, AWS,
Azure, datos y RAG**. Del libro queda **uno**, y no es un capítulo: por qué lo
escribe.

**El marco que resuelve lo de que no caduque:** un tutorial de Vapi caduca en
tres meses, pero *«lo que aprendí montando un voicebot que llama a cobrar»* no
caduca aunque cambie la API. Mismo contenido, otro envoltorio. Y de paso es lo
contrario del gurú: no se dice «así se hace», se dice «así lo hice y esto se me
rompió».

**El orden del índice no es el del calendario de correos**, y es deliberado:
aquel está pensado para quien recibe correos seguidos; este, para quien busca.
Arriba van los que tocan voicebots y agentes, donde están las 70 impresiones.

**Las portadas se dibujan con CSS y SVG, sin fichero de imagen.** Una foto de
banco de imágenes no dice nada del artículo, pesa cientos de kilobytes y hay
que buscarla cada vez. `tools/portadas.sh` genera 24 imágenes sociales desde el
calendario. Pesan 96 KB **las 24 juntas**.

⚠️ **El SVG no se ve en correo.** Si la plantilla de la newsletter lleva imagen,
hay que sacar PNG.

---

## 9. La guía de estilo

`tools/guia-de-estilo.md`. Es el fichero del que depende que los borradores
suenen a Alex. Sacada de **su texto real**, no inventada.

La regla dura: **si un dato, una cifra o una anécdota no salió de él, no se
escribe.** El borrador deja un hueco `[[FALTA: ...]]` y pregunta. Un hueco
visible se arregla en dos minutos; un dato inventado que se publica cuesta la
credibilidad, que es justamente el producto.

---

## 10. El módulo de contenidos

Planteado en **`Scarif/docs/contenidos/README.md`**. Sin implementar y **sin
prisa: después del libro**.

**No va en n8n.** n8n se desmanteló el 2026-06-28 con el pivot a FastAPI:
contenedor eliminado, puerto 5678 cerrado, `docs/n8n/` ya no existe. Volver a
levantarlo sería deshacer una migración deliberada. Y no hace falta, porque es
**el mismo patrón que la ingesta de facturas** con otra fuente.

**Las noticias se descartaron.** Caducan, las resume cualquiera, y un resumen
generado es el «contenido de valor los martes» que el propio Alex ha mandado
borrar de los textos.

La fuente es **él mismo**: nota de voz de treinta segundos al bot que ya usa
para las facturas, en el momento en que se le rompe algo. El problema nunca fue
la falta de ideas, es que se pierden.

---

## 11. Pendiente

| | Qué | Quién |
|---|---|---|
| 🔴 | Dar de alta la cuenta de servicio en GA4 y Search Console | Alex |
| 🟡 | Reintentar la indexación de `/hiperautomatizaciones/` | Cualquiera |
| 🟡 | **Repasar los textos de la web**: la home escribe como LinkedIn, el libro escribe como él | Alex decide |
| 🟡 | Borrar del servidor `articulos/_PLANTILLA.html` y los 5 PNG viejos (~2 MB) | Alex, por FTP |
| 🟢 | Escribir los 12 artículos | Alex |
| 🟢 | Implementar el módulo de contenidos | Después del libro |

### Cosas que muerden y conviene recordar

- **FileZilla oculta los ficheros que empiezan por punto.** El `.htaccess` no se
  subía y costó un rato entenderlo. `Servidor → Forzar mostrar archivos ocultos`.
- **El FTP sube pero no borra.** Los ficheros que se renombran o se eliminan
  quedan huérfanos en el servidor.
- **AdGuard corre en el NAS** (`192.168.0.27`) y bloqueaba `analytics.google.com`
  a nivel de DNS. Si se vuelve a poner ese DNS, hay que meterlo en la lista
  blanca.
- **Al FTP solo va lo que un navegador tiene que pedir.** `tools/`, `docs/`,
  `calendario.json` y las plantillas se quedan en el repo.

---

## 12. Reparto entre las dos sesiones

| Esta sesión | La otra sesión |
|---|---|
| Analítica, Search Console, rendimiento, SEO | MailerLite entero |
| `.htaccess`, `sitemap.xml`, `robots.txt` | `js/suscripciones.js` |
| `css/libro.css`, `css/articulo.css`, `css/utilities.css` | `index.html`, `hiperautomatizaciones/index.html` |
| `/articulos/` completo, portadas, guía de estilo | Correos, campañas y automatizaciones |

Ninguna de las dos toca el terreno de la otra sin avisar antes.

**Todo lo de MailerLite está en [`docs/mailerlite.md`](mailerlite.md):** cuenta,
grupos, formularios, automatizaciones, campañas, los topes del plan gratuito,
las UTMs y el contrato con el circuito semanal. Los correos del libro, en
`hiperautomatizaciones-libro/propuesta_editorial/correos_del_libro.md`.

### Lo que cruza entre las dos partes

**Portadas.** `tools/portadas.sh` genera **tres por artículo** y no son
intercambiables:

| Fichero | Para | Titular |
|---|---|---|
| `<slug>-correo.jpg` | **La newsletter** | ❌ **Sin titular grabado** |
| `<slug>-og.svg` | LinkedIn, X, WhatsApp, `og:image` | ✅ Con titular |
| `<slug>-cuadrado.svg` | Instagram | ✅ Con titular |

**El motivo de que el correo lleve una distinta**, que es lo que se olvida: en
redes la imagen va sola y tiene que explicarse sin ayuda. En el correo va
acompañada del titular en texto justo debajo, así que grabarlo dentro lo
duplica.

Y **el titular tiene que seguir en texto** fuera de la imagen: media bandeja de
entrada abre con las imágenes bloqueadas —el Outlook de escritorio lo hace de
fábrica— y si viviera solo dentro del JPEG, esa gente abriría un correo sin
titular.

Va en JPEG y no en PNG: son degradados sin transparencia y ahí el PNG comprime
fatal. Medido, **183 KB en PNG frente a 97 en JPEG**. En correo el peso importa.

⚠️ **Pasar la variante equivocada al correo no canta:** el titular sale dos
veces y no se ve hasta tenerlo en la bandeja. La validación de MailerLite
protege el caso a medias —las de redes son `.svg` y las rechaza—, pero si algún
día hubiera un `-og.jpg`, pasaría.

---

## 13. 🔴 Lo que NO está probado

Conviene que esto no se pierda entre lo demás, porque es lo único que puede
estar roto ahora mismo sin que se note:

**Nadie se ha suscrito nunca.** Los dos formularios marcan
`conversions_count: 0`. La cadena entera —alta, correo de confirmación,
bienvenida— **no se ha probado con un correo real**.

Y hay una sospecha concreta: el formulario del libro **tiene casilla de
consentimiento configurada en MailerLite**, mientras que nuestro JavaScript
solo manda el email. Si el servidor la exige, las altas **fallan en silencio**:
el usuario ve «te he mandado un correo», el evento de GA4 se dispara igual
—porque el envío va en `no-cors` y no puede leer la respuesta— y no se
suscribe nadie.

**Es lo primero que hay que probar**, y son dos minutos: darse de alta con un
correo propio y comprobar que llega la confirmación y que el suscriptor aparece
en el grupo.

---

## 14. 3 de octubre: la portada definitiva, la landing nueva y el SEO del libro

### Qué cambió y por qué

- **La identidad del libro es la cubierta de Rafa**: amarillo `#F6B331`, tinta
  `#141414`, rojo `#E3262B` y la trama de flujos. La crema, el azul noche y la
  portada demo desaparecen de la landing, de la franja de la home y del modal.
  Los tokens viven en `:root` de `css/libro.css`; la landing tiene su propia
  hoja, `css/libro-landing.css`, que solo carga `/hiperautomatizaciones/`.
- **La trama** (`assets/img/libro/trama-flujos.svg`) es **provisional y
  generada**: imita la de la cubierta hasta que Rafa pase su vectorial. Se
  sustituye ese fichero y nada más. Lleva un velo blanco del 16 % por encima
  (`--libro-velo`) porque sin él la portada, que tiene la misma trama, se
  perdía contra el fondo.
- **Menú**: fuera «Artículos» (hasta que haya artículos) y el botón destacado
  pasa de LinkedIn a **El libro**. En la landing el botón es «Avísame»; el día
  del lanzamiento pasa a «Comprar ahora».
- **Pie**: una sola fila (© y nombre · LinkedIn · legales). El nombre salía
  dos veces.
- **Una sola URL por página**: los enlaces internos van a la carpeta
  (`hiperautomatizaciones/`, no `…/index.html`) y el `.htaccess` redirige con
  301 cualquier `index.html` que quede. Search Console decía que la landing
  no tenía **ninguna página de referencia**: los enlaces de la home iban a la
  otra URL.
- **Portada**: nombre nuevo (`portada-hiperautomatizaciones.png`) y 301 desde
  las dos demo. No se reutilizó el nombre porque las imágenes salen con
  `max-age` de un año: quien ya la vio seguiría viendo la demo.
- **Contenido para «hiperautomatización» en singular**, que es lo que la gente
  busca: sección «¿Qué es la hiperautomatización?» (resumen del capítulo 1, con
  los cinco tipos) y cinco preguntas frecuentes.
- **Datos estructurados**: la landing declara `Book` (autor y editor = la
  persona `#alexperdel` de la home, dos ediciones: tapa blanda 280 páginas y
  Kindle), `WebPage` con migas y `FAQPage`. La home suma el `Book` a su grafo;
  `sobre-mi.html` estrena `ProfilePage`. Descripciones de home y Sobre mí
  mencionan el libro.
- **Sitemap con imágenes** (portada y foto) y `lastmod` al día. `llms.txt` con
  280 páginas y la definición de hiperautomatización del libro.
- **Datos corregidos contra el manuscrito**: 280 páginas (no 336), el epílogo
  (no va «del hacedor al líder», enfoque descartado el 31 de agosto), los
  títulos de los apéndices y el del capítulo 9.

### Por qué la portada demo desapareció de Google Imágenes

No fue un error. La landing nació el 13 de septiembre, Google la rastreó **una
sola vez** ese día y no la ha vuelto a visitar. La imagen tuvo 7 impresiones
en Imágenes (posición media 31,6), la última el 25 de septiembre, y salió del
índice. Con una página vista una vez, sin enlaces detectados y con «portada
provisional» en el texto alternativo, es lo normal. `site:alexperdel.com` en
Imágenes solo muestra 8 imágenes, y ni la portada ni la foto están entre ellas.

### Subida por FTP (cdmon)

**Subir:**

```
.htaccess                         (forzar mostrar ocultos en FileZilla)
index.html  sobre-mi.html  aviso-legal.html  politica-privacidad.html  politica-cookies.html
sitemap.xml  llms.txt
hiperautomatizaciones/index.html
articulos/index.html
proyectos/index.html  proyectos/copilot-interno.html  proyectos/crecer-en-ingles.html
proyectos/docencia-ia.html  proyectos/gestion-proyectos-seo.html
proyectos/perito-guai.html  proyectos/voicebot-ia.html
css/libro.css  css/libro-landing.css  css/footer.css
assets/img/libro/portada-hiperautomatizaciones.png   ← el PNG BUENO de Rafa
assets/img/libro/trama-flujos.svg
```

**Borrar del servidor:** `assets/img/libro/portada-hiperautomatizaciones-demo.png`
y `…-demo-sm.png` (el 301 ya responde por ellas).

⚠️ **No subir la portada hasta tener el PNG definitivo.** Con caché de un año,
si sube la captura provisional y luego se cambia con el mismo nombre, los que
ya la hayan visto seguirán viendo la captura.

### Después de subir

1. `curl -sI https://alexperdel.com/hiperautomatizaciones/index.html` → 301 a
   `/hiperautomatizaciones/`; la demo → 301 a la portada nueva.
2. Search Console: **Solicitar indexación** de `/hiperautomatizaciones/`, `/` y
   `/sobre-mi.html`, y volver a enviar `sitemap.xml`.
3. LinkedIn Post Inspector con la URL del libro, para que la vista previa coja
   la portada nueva.
4. Prueba de resultados enriquecidos de Google sobre la landing (Book, FAQ,
   migas).

### Queda pendiente

| | Qué | Quién |
|---|---|---|
| 🔴 | PNG definitivo de la portada (y mockups) | Rafa |
| 🟡 | Vectorial de la trama, para sustituir el SVG generado | Rafa |
| 🟡 | Foto nueva del autor (contra definitiva) | Alex / Rafa |
| 🟡 | Confirmar las 280 páginas al cerrar el interior: van en la landing (×2), su JSON-LD y `llms.txt` | Alex |
| 🟡 | Dar de alta `analitica-alexperdel@scarif-automation.iam.gserviceaccount.com` en GA4 y Search Console (sigue pendiente de la sección 11) | Alex |
| 🟡 | Decidir si `/articulos/` sale del sitemap mientras no haya artículos | Alex |
| 🟢 | Con ISBN: `isbn`, `datePublished` y `offers` (Amazon) en cada `workExample` | Al publicar |
| 🟢 | Google Books (Play Libros), Amazon Author Central y Goodreads; sus URLs al `sameAs` de la persona | Al publicar |
| 🟢 | Pedir a EBIS un enlace a la landing desde el máster | Alex |

En local, los enlaces a carpeta (`hiperautomatizaciones/`) **no abren con
`file://`**: hay que servir la web (`npx serve` o similar) para previsualizarla.
