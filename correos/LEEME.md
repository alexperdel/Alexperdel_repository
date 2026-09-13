# Los correos, en HTML y en git

Aquí vive el HTML real de los correos. **Esto no es documentación: es la fuente.**
Lo que está en MailerLite salió de aquí.

## La secuencia de la newsletter

Automatización `Bienvenida · newsletter de marca`. Se dispara cuando alguien
**confirma** el alta en la lista de marca, y cuenta desde ese día — no por
calendario. Quien se apunte en marzo recibe el nº1 en marzo.

| | Fichero | Cuándo | Asunto |
|---|---|---|---|
| 1 | `1-bienvenida.html` | día 0 | Ya estás dentro |
| 2 | `2-lo-que-mas-se-rompe.html` | día 30 | Lo que más veo romperse |
| 3 | `3-el-libro.html` | día 60 | Estoy escribiendo un libro |

🔴 **Son 5 pasos de los 5 que da el plan gratuito** (tres correos y dos esperas).
**No cabe un cuarto correo.** Para alargar la secuencia hay que pagar —sube a
100 pasos— o encadenar con «Mover a grupos», que es un montaje que se entiende
regular seis meses después.

📌 **Ninguno puede hablar de actualidad.** Una persona los recibe con dos meses
de diferencia entre el primero y el último, así que todo lo que se cuente tiene
que valer igual dentro de dos años.

## El número semanal no está aquí

Lo genera el código a partir de cada artículo del blog. Su plantilla vive en
`Scarif/backend/app/services/templates/newsletter_article.html` y se manda como
**campaña**, no como parte de esta secuencia.

## Cómo se sube uno

```
Diseñar email → Empezar desde cero → Editor HTML personalizado → Importar código HTML
```

Pide un **ZIP con un `index.html` dentro**. Entra literal, sin tocar una coma:

```bash
mkdir -p /tmp/c && cp 2-lo-que-mas-se-rompe.html /tmp/c/index.html
cd /tmp/c && zip ../correo.zip index.html
```

⚠️ **Después de importar hay que rellenar a mano** el nombre, el asunto, las UTM
y el idioma —viene en inglés—. El HTML no los trae.

## Cómo se ve antes de subirlo

```bash
python3 -m http.server 8800   # y abrir el fichero en el navegador
```

## Cómo se comprueba lo que quedó GUARDADO

**El editor no es fuente de verdad**: llegó a mostrar cambios que no se habían
guardado. Lo que sirve es la captura que genera MailerLite del correo real:

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  https://connect.mailerlite.com/api/automations/198519056538535656 \
  | jq -r '.data.steps[]|select(.type=="email")|.email.screenshot_url'
```

## El generador

`_plantilla.sh` tiene el esqueleto común: la regla roja, la tipografía, el pie y
el enlace de baja. Está aparte para que los tres correos se vean como el mismo
correo; si cambia el pie, cambia una vez.

```bash
./_plantilla.sh salida.html "precabecera" "Titular" "<p>cuerpo</p>" ["Botón"] ["url"]
```

Sin botón, se pasan solo los cuatro primeros.

## Lo que no se puede quitar

`{$unsubscribe}` en el pie. MailerLite lo sustituye en el envío; sin él el correo
va sin baja, y eso no es estilo: es el artículo 21 de la LSSI.
