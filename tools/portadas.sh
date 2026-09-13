#!/bin/bash
# =============================================================================
# GENERADOR DE PORTADAS SOCIALES
#
# Lee articulos/calendario.json y escribe un SVG por articulo en
# assets/social/, en dos formatos:
#
#   <slug>-og.svg        1200x630  · LinkedIn, X, WhatsApp, og:image
#   <slug>-cuadrado.svg  1080x1080 · Instagram, carruseles de LinkedIn
#
# Son SVG a proposito: pesan dos kilobytes, se ven nitidos a cualquier tamano
# y se pueden abrir y retocar en cualquier editor. Si una red no admite SVG
# —Instagram y LinkedIn piden mapa de bits para subir imagen—, se abre el SVG
# en el navegador y se exporta a PNG, o se usa tools/portadas-png.html.
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
  local slug="$1" tag="$2" var="$3" tit="$4" W="$5" H="$6" suf="$7"
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

  <text class="f" x="$M" y="$Y1" font-size="$TS" font-weight="800" letter-spacing="-0.02em" fill="#F4EFE5">$L1$TSPAN</text>

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
  n=$((n+1))
done < <(jq -r '.articulos[] | [.fichero, .tag, .variante, .titulo] | @tsv' "$CAL")

echo
echo "$n articulos · $((n*2)) imagenes en $OUT/"
