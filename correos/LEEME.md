# Los correos, en HTML y en git

Aquí vive el HTML real de los correos que se importan a MailerLite. **Esto no es
documentación: es la fuente.** Lo que está en el panel salió de aquí.

## Por qué

El editor visual de MailerLite destroza el contenido al editarlo a base de clics
—fusiona bloques, se come caracteres— y además no deja rastro: no se puede
comparar, ni volver atrás, ni ver qué cambió. Escribiéndolos en HTML se versionan
como cualquier otra cosa.

## Cómo se sube uno

```
Diseñar email → Empezar desde cero → Editor HTML personalizado → Importar código HTML
```

Pide un **ZIP con un `index.html` dentro**:

```bash
mkdir -p /tmp/c && cp bienvenida-newsletter.html /tmp/c/index.html
cd /tmp/c && zip ../correo.zip index.html
```

Entra literal, sin tocar una coma.

## Cómo se ve antes de subirlo

```bash
python3 -m http.server 8800   # y abrir el fichero en el navegador
```

## Lo que no se puede quitar

`{$unsubscribe}` en el pie. MailerLite lo sustituye en el envío; sin él el correo
va sin baja, y eso no es estilo: es el artículo 21 de la LSSI.

## Qué hay aquí

| Fichero | Dónde vive | Se dispara |
|---|---|---|
| `bienvenida-newsletter.html` | Automatización `Bienvenida · newsletter de marca` | Al confirmar el alta en la lista de marca |

El número semanal no está aquí: lo genera el código, y su plantilla vive en
`Scarif/backend/app/services/templates/newsletter_article.html`.
