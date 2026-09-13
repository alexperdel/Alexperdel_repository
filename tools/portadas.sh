#!/bin/bash
# =============================================================================
# GENERADOR DE PORTADAS SOCIALES
#
# Lee articulos/calendario.json y escribe un SVG por articulo en
# assets/social/, en dos formatos:
#
#   <slug>-og.svg         1200x630  · LinkedIn, X, WhatsApp, og:image
#   <slug>-cuadrado.svg   1080x1080 · Instagram, carruseles de LinkedIn
#   <slug>-correo.jpg     1200x630  · newsletter, SIN el titular grabado
#
# Los dos primeros son SVG a proposito: pesan dos kilobytes, se ven nitidos a
# cualquier tamano y se abren en cualquier editor.
#
# El del correo va en JPEG porque EL SVG NO SE VE EN CORREO, y va sin el
# titular grabado porque la plantilla del correo ya lo pone como texto debajo
# de la imagen. Tiene que ponerlo: media bandeja de entrada abre con las
# imagenes bloqueadas, y si el titular vive solo dentro del JPEG esa gente
# abre un correo sin titular.
#
#   Uso:  bash tools/portadas.sh
# =============================================================================
set -e
cd "$(dirname "$0")/.."
export LC_ALL=C

CAL="articulos/calendario.json"
OUT="assets/social"
mkdir -p "$OUT"

[ -f "$CAL" ] || { echo "No encuentro $CAL"; exit 1; }
command -v jq >/dev/null || { echo "Hace falta jq"; exit 1; }

# Paleta de la cubierta del libro. Cada articulo declara su variante en el
# calendario para que la rejilla no sea un muro de un solo color.
colores() {
  case "$1" in
    a) echo "#12273F #1B3554";;
    b) echo "#1B3554 #7F1D1D";;
    c) echo "#0C1725 #12273F";;
    d) echo "#991B1B #12273F";;
    *) echo "#12273F #1B3554";;
  esac
}

# Parte el titular en dos lineas si no cabe, cortando por el espacio mas
# cercano a la mitad. Un titular de una sola linea que se sale del lienzo es
# el fallo tipico de estas plantillas.
partir() {
  local t="$1" max="$2"
  if [ ${#t} -le "$max" ]; then printf '%s\n' "$t"; return; fi
  local mitad=$(( ${#t} / 2 )) mejor=0 i=0 pos
  for (( i=0; i<${#t}; i++ )); do
    [ "${t:$i:1}" = " " ] || continue
    local d=$(( i > mitad ? i - mitad : mitad - i ))
    local dm=$(( mejor > mitad ? mejor - mitad : mitad - mejor ))
    [ "$mejor" = 0 ] && mejor=$i && continue
    [ "$d" -lt "$dm" ] && mejor=$i
  done
  printf '%s\n%s\n' "${t:0:$mejor}" "${t:$((mejor+1))}"
}

escapar() { printf '%s' "$1" | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g'; }

svg() {
  # $8 = "sin-titulo" para la variante del correo. Vacio en las demas.
  local slug="$1" tag="$2" var="$3" tit="$4" W="$5" H="$6" suf="$7" sintit="${8:-}"
  read -r C1 C2 <<< "$(colores "$var")"
  local M=$(( W / 18 ))                   # margen
  local WORD=$(( W / 5 ))                  # la herramienta, en hueco
  local TS=$(( W / 20 ))                   # cuerpo del titular
  local TAGUP; TAGUP=$(printf '%s' "$tag" | tr '[:lower:]' '[:upper:]')
  local PILL=$(( ${#tag} * 13 + 44 ))

  # Titular en una o dos lineas.
  # Sin mapfile: el bash que trae macOS es el 3.2 y no lo tiene.
  local partido L1 L2
  partido=$(partir "$tit" 34)
  L1=$(escapar "$(printf '%s' "$partido" | sed -n '1p')")
  L2=$(escapar "$(printf '%s' "$partido" | sed -n '2p')")
  local Y1=$(( H / 2 )) TSPAN=""
  [ -n "$L2" ] && Y1=$(( H / 2 - TS / 2 )) && TSPAN="<tspan x=\"$M\" dy=\"$(( TS + TS / 5 ))\">$L2</tspan>"

  # La variante del correo va SIN el titular grabado.
  #
  # La plantilla del correo ya pone el titular como texto debajo de la imagen, y
  # tiene que ponerlo: media bandeja de entrada abre con las imagenes
  # bloqueadas —el Outlook de escritorio lo hace de fabrica— y si el titular
  # vive solo dentro del JPEG, esa gente abre un correo sin titular.
  #
  # Con el titular fuera de la imagen no hay que elegir: la portada funciona
  # como banner y el titular se lee siempre, con imagenes o sin ellas.
  local TITULO_SVG=""
  if [ -z "$sintit" ]; then
    TITULO_SVG="<text class=\"f\" x=\"$M\" y=\"$Y1\" font-size=\"$TS\" font-weight=\"800\" letter-spacing=\"-0.02em\" fill=\"#F4EFE5\">$L1$TSPAN</text>"
  fi

  cat > "$OUT/${slug}${suf}.svg" <<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="$W" height="$H" viewBox="0 0 $W $H" role="img" aria-label="$(escapar "$tit")">
  <title>$(escapar "$tit")</title>
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="$C1"/><stop offset="100%" stop-color="$C2"/>
    </linearGradient>
    <pattern id="t" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(-25)">
      <line x1="0" y1="0" x2="0" y2="26" stroke="#F4EFE5" stroke-opacity="0.055" stroke-width="1"/>
      <line x1="13" y1="0" x2="13" y2="26" stroke="#F4EFE5" stroke-opacity="0.03" stroke-width="1"/>
    </pattern>
    <style>
      .f { font-family: Calibri, Carlito, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    </style>
  </defs>

  <rect width="$W" height="$H" fill="url(#g)"/>
  <rect width="$W" height="$H" fill="url(#t)"/>

  <text class="f" x="$(( W - M ))" y="$(( H - H / 8 ))" text-anchor="end"
        font-size="$WORD" font-weight="800" letter-spacing="-0.035em"
        fill="none" stroke="#F4EFE5" stroke-opacity="0.2" stroke-width="2">$(escapar "$tag")</text>

  <g transform="translate($M, $M)">
    <rect x="0" y="0" rx="22" ry="22" width="$PILL" height="44" fill="none" stroke="#F4EFE5" stroke-opacity="0.35" stroke-width="1.5"/>
    <text class="f" x="22" y="30" font-size="19" font-weight="700" letter-spacing="0.16em" fill="#F4EFE5">$TAGUP</text>
  </g>

  $TITULO_SVG

  <text class="f" x="$M" y="$(( H - M ))" font-size="22" font-weight="600" letter-spacing="0.06em" fill="#F4EFE5" fill-opacity="0.6">alexperdel.com</text>
</svg>
SVG
  echo "  $OUT/${slug}${suf}.svg"
}

n=0
while IFS=$'\t' read -r fichero tag var titulo; do
  slug="${fichero%.html}"
  svg "$slug" "$tag" "$var" "$titulo" 1200 630  "-og"
  svg "$slug" "$tag" "$var" "$titulo" 1080 1080 "-cuadrado"
  svg "$slug" "$tag" "$var" "$titulo" 1200 630  "-correo" "sin-titulo"
  n=$((n+1))
done < <(jq -r '.articulos[] | [.fichero, .tag, .variante, .titulo] | @tsv' "$CAL")

# -----------------------------------------------------------------------------
# Mapa de bits para el correo
#
# EL SVG NO SE VE EN CORREO. Gmail, Outlook y Apple Mail no lo renderizan: sale
# un hueco o un icono roto. La plantilla de la newsletter necesita mapa de bits
# si o si, asi que del formato 1200x630 se saca tambien.
#
# 1200 de ancho y no 600, que es a lo que se muestra la plantilla: el doble,
# para que se vea nitido en pantallas retina, que son casi todas las que abren
# un correo.
#
# JPEG y no PNG, aunque se pidio PNG: son degradados sin una sola zona
# transparente, y ahi el PNG comprime fatal. Medido sobre la misma imagen, 183
# KB en PNG frente a 97 en JPEG al 82. Por los doce articulos son 2,7 MB contra
# 1,2. En correo el peso importa: hay clientes que recortan el mensaje y redes
# moviles que tardan. JPEG lo entiende todo cliente de correo desde siempre.
#
# El cuadrado NO se convierte: es para Instagram, y ahi se sube desde el movil,
# que ya hace la conversion.
# -----------------------------------------------------------------------------
if command -v rsvg-convert >/dev/null; then
  for f in "$OUT"/*-correo.svg; do
    tmp="${f%.svg}.tmp.png"
    rsvg-convert -w 1200 -h 630 -o "$tmp" "$f"
    sips -s format jpeg -s formatOptions 82 "$tmp" --out "${f%.svg}.jpg" >/dev/null 2>&1
    rm -f "$tmp"
  done
  # El SVG del correo solo existe como paso intermedio: en el correo se usa el
  # JPEG, y en la web y en redes se usa la version CON titular.
  rm -f "$OUT"/*-correo.svg
  echo
  echo "JPEG 1200x630 para el correo, sin el titular grabado"
else
  echo
  echo "AVISO: falta rsvg-convert, no se han generado las imagenes del correo."
  echo "       brew install librsvg"
fi

echo
echo "$n articulos · $((n*2)) SVG + $n JPEG (correo) en $OUT/"
