#!/bin/sh
# Genera assets/img/libro/og-hiperautomatizaciones.jpg (1200×627) a partir de
# tools/og-libro.html con Chrome sin ventana. Lanzar desde la raíz del repo
# cada vez que cambie la portada.
set -e
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TMP="$(mktemp -d)"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=4000 \
  --window-size=1200,627 --screenshot="$TMP/og.png" "file://$PWD/tools/og-libro.html" >/dev/null 2>&1
sips -s format jpeg -s formatOptions 85 "$TMP/og.png" --out assets/img/libro/og-hiperautomatizaciones.jpg >/dev/null
rm -rf "$TMP"
sips -g pixelWidth -g pixelHeight assets/img/libro/og-hiperautomatizaciones.jpg | grep pixel
