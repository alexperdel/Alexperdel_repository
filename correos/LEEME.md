# Los correos, en HTML y en git

Aquí vive el HTML real de los correos. **Esto no es documentación: es la fuente.**
Lo que está en MailerLite salió de aquí.

---

## La forma de un número, y es siempre la misma

```
KICKER            Número 1
TITULAR           Lo que más veo romperse

1. LA HERIDA      Algo que me pasó a mí, en primera persona.
                  🔴 Es lo único que NO está en la web.

2. PARA LEER      Dos o tres artículos con una línea de resumen.
                  Salen del calendario. Tarjeta con filo rojo.

3. EL PIE         LinkedIn para responder + el libro.
                  Enlaces, no botones: dos botones iguales compiten
                  y no gana ninguno.
```

**Por qué la herida va primero y por qué tiene que ser propia.** Si el correo solo
lleva enlaces, es un índice: se abre una vez y a la segunda ya no. Lo que hace que
se abra el siguiente es que haya algo dentro que no esté en la web.

---

## La secuencia

Automatización `Bienvenida · newsletter de marca` (`198519056538535656`). Se dispara
cuando alguien **confirma** el alta y cuenta desde ese día — no por calendario.
Quien se apunte en marzo recibe el nº1 en marzo.

| | Fichero | Día | Asunto | La herida |
|---|---|---|---|---|
| 1 | `1-bienvenida.html` | 0 | Ya estás dentro | — (es la bienvenida) |
| 2 | `2-lo-que-mas-se-rompe.html` | 30 | Lo que más veo romperse | El flujo de 40 nodos que no entendía nadie |
| 3 | `3-elegir-mal-la-herramienta.html` | 60 | Elegí mal y tardé tres semanas en verlo | Tres semanas cambiando de modelo |

🔴 **Son 5 pasos de los 5 que da el plan gratuito** (tres correos y dos esperas).
**No cabe un cuarto.**

---

## 🔴 Los artículos enlazados TODAVÍA NO EXISTEN

Se enlazan en frío, a propósito. El primer correo que los lleva no puede salir
antes de 30 días, y para entonces ya estarán publicados.

**La cuenta, que es lo que hay que rehacer si cambia el calendario:** el correo N
sale como muy pronto a los `30 × (N−1)` días del primer alta posible. Con la
primera alta el 2026-09-13:

| Correo | Antes del | Artículo enlazado | Publica | Colchón |
|---|---|---|---|---|
| **2** | 2026-10-13 | `voicebot-recuperacion-de-cartera` | 22-sep | 21 días |
| | | `n8n-en-un-nas-de-casa` | 29-sep | 14 días |
| | | `por-que-fastapi` | 6-oct | **7 días** |
| **3** | 2026-11-12 | `n8n-o-make` | 20-oct | 23 días |
| | | `latencia-en-voicebots` | 27-oct | 16 días |
| | | `mi-rag-no-era-el-modelo` | 3-nov | **9 días** |

**Regla: no se enlaza nada con menos de 7 días de colchón.** Por eso el correo 2 no
enlaza `por-que-escribo-un-libro` (13-oct), que llegaría justo el mismo día.

⚠️ **Si el calendario se retrasa, estos enlaces dan 404.** El calendario manda:
[`../articulos/calendario.json`](../articulos/calendario.json). Si se mueve una
fecha, hay que rehacer esta tabla **antes** de que pasen 30 días desde la primera
alta. Mientras no haya suscriptores no corre prisa; con el primero, sí.

Para recalcular:

```bash
node -e '
const cal=require("./articulos/calendario.json");
const PRIMERA_ALTA=new Date("2026-09-13");   // cambiar por la real
for(const a of cal.articulos){
  const pub=new Date(a.fecha);
  for(const [n,d] of [[2,30],[3,60]]){
    const sale=new Date(PRIMERA_ALTA.getTime()+d*864e5);
    const colchon=Math.round((sale-pub)/864e5);
    if(colchon>=7) console.log(`correo ${n}: OK ${a.fichero} (${colchon} d)`);
  }
}'
```

---

## El número semanal no está aquí

Lo genera el código a partir de cada artículo del blog. Plantilla en
`Scarif/backend/app/services/templates/newsletter_article.html`, y se manda como
**campaña**, no como parte de esta secuencia.

---

## Cómo se sube uno

```
Diseñar email → Empezar desde cero → Editor HTML personalizado → Importar código HTML
```

Pide un **ZIP con un `index.html` dentro**. Entra literal, sin tocar una coma:

```bash
mkdir -p /tmp/c && cp 2-lo-que-mas-se-rompe.html /tmp/c/index.html
cd /tmp/c && zip ../correo.zip index.html
```

Para **reemplazar** el contenido de un correo que ya existe, el mismo camino: en el
editor HTML, el tercer icono de la barra izquierda abre el panel de importar.

⚠️ **Después de importar hay que rellenar a mano** el nombre, el asunto, las UTM y
el idioma —viene en inglés—. El HTML no los trae.

## Cómo se ve antes de subirlo

```bash
python3 -m http.server 8800   # y abrir el fichero en el navegador
```

## Cómo se comprueba lo que quedó GUARDADO

**El editor no es fuente de verdad**: llegó a mostrar cambios que no se habían
guardado, con la automatización activa mandando otra cosa. Lo que sirve es la
captura que genera MailerLite del correo real:

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  https://connect.mailerlite.com/api/automations/198519056538535656 \
  | jq -r '.data.steps[]|select(.type=="email")|.email.screenshot_url'
```

---

## Los generadores

`_plantilla.sh` tiene el esqueleto: regla roja, kicker, tipografía, pie con
LinkedIn y el libro, y el enlace de baja. `_articulo.sh` hace una tarjeta de
artículo. Están aparte para que los tres correos se vean como el mismo correo: si
cambia el pie, cambia una vez.

```bash
./_plantilla.sh salida.html "Kicker" "precabecera" "Titular" "<p>herida</p>" ["$ARTS"]
./_articulo.sh  "url" "Título" "Resumen en una línea" [ultimo]
```

## Lo que no se puede quitar

`{$unsubscribe}` en el pie. MailerLite lo sustituye en el envío; sin él el correo
va sin baja, y eso no es estilo: es el artículo 21 de la LSSI.
