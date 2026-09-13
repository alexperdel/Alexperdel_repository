#!/usr/bin/env bash
# Esqueleto comun de los correos de la newsletter. Uso:
#   ./_plantilla.sh <fichero> <kicker> <preheader> <titular> <cuerpo_html> [articulos_html]
#
# LA FORMA DE UN NUMERO, y es siempre la misma:
#
#   1. Una HERIDA. Algo que me paso a mi, contado en primera persona. Es lo
#      unico que no esta en la web y es la razon de abrir el correo: si el
#      correo solo lleva enlaces, es un indice y no lo abre nadie dos veces.
#   2. Los ARTICULOS relacionados, con una linea de resumen cada uno. Salen
#      del calendario y solo se enlazan los que ya estaran publicados.
#   3. El PIE con las dos salidas: LinkedIn para responder, y el libro.
#      Enlaces, no botones: dos botones iguales compiten y no gana ninguno.
#
#      🔴 EL PIE NO LLEVA FECHA NI ESTADO DEL LIBRO. Ni "sale a finales de
#      2026" ni "ya a la venta". Estos correos los recibe cada persona en una
#      fecha distinta y siguen vivos anos despues: cualquier fecha caduca sola
#      y deja el correo mintiendo. El estado lo cuenta la landing, que si se
#      puede actualizar.
#
# El esqueleto vive aqui y no en cada fichero para que los tres se vean como
# el mismo correo. Si cambia el pie o el color, cambia una vez.
set -euo pipefail
F="$1"; KICK="$2"; PRE="$3"; TIT="$4"; CUERPO="$5"; ARTS="${6:-}"

BLOQUE_ARTS=""
if [ -n "$ARTS" ]; then
BLOQUE_ARTS="
          <tr>
            <td style=\"padding:30px 40px 0 40px;\">
              <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\">
                <tr><td style=\"height:1px; line-height:1px; font-size:0; background-color:#E5E7EB;\">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style=\"padding:26px 40px 0 40px; font-family:Helvetica,Arial,sans-serif;\">
              <p style=\"margin:0 0 18px 0; font-size:12px; line-height:16px; letter-spacing:1.6px; text-transform:uppercase; font-weight:bold; color:#9CA3AF;\">Para leer</p>
$ARTS
            </td>
          </tr>"
fi

cat > "$F" <<PAGINA
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>$TIT</title>
</head>
<body style="margin:0; padding:0; background-color:#F3F4F6;">

  <div style="display:none; font-size:1px; color:#F3F4F6; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
    $PRE
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#F3F4F6;">
    <tr>
      <td align="center" style="padding:32px 12px;">

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px; max-width:600px; background-color:#FFFFFF; border-radius:10px; overflow:hidden;">

          <tr><td style="height:4px; line-height:4px; font-size:0; background-color:#DC2626;">&nbsp;</td></tr>

          <tr>
            <td style="padding:38px 40px 0 40px;">
              <p style="margin:0 0 12px 0; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; letter-spacing:1.6px; text-transform:uppercase; font-weight:bold; color:#DC2626;">
                $KICK
              </p>
              <h1 style="margin:0; font-family:Helvetica,Arial,sans-serif; font-size:28px; line-height:36px; font-weight:bold; color:#0F0F0F;">
                $TIT
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 40px 0 40px; font-family:Helvetica,Arial,sans-serif; font-size:17px; line-height:28px; color:#374151;">
$CUERPO
            </td>
          </tr>
$BLOQUE_ARTS
          <tr>
            <td style="padding:30px 40px 0 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr><td style="height:1px; line-height:1px; font-size:0; background-color:#E5E7EB;">&nbsp;</td></tr>
              </table>
              <p style="margin:20px 0 0 0; font-family:Helvetica,Arial,sans-serif; font-size:16px; line-height:26px; color:#374151;">
                Alex
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 40px 40px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#F9FAFB; border-radius:8px;">
                <tr>
                  <td style="padding:20px 22px; font-family:Helvetica,Arial,sans-serif; font-size:15px; line-height:25px; color:#4B5563;">
                    ¿Te ha pasado algo parecido? Cuéntamelo
                    <a href="https://www.linkedin.com/in/alexperdel/" style="color:#DC2626; font-weight:bold;">por LinkedIn</a>
                    o respondiendo a este correo, que lo leo yo.
                    <br><br>
                    Y hay un libro donde lo abordo entero:
                    <a href="https://alexperdel.com/hiperautomatizaciones/" style="color:#DC2626; font-weight:bold;"><em>Hiperautomatizaciones</em></a>.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px; max-width:600px;">
          <tr>
            <td align="center" style="padding:22px 24px 0 24px; font-family:Helvetica,Arial,sans-serif; font-size:13px; line-height:21px; color:#6B7280;">
              Recibes esto porque te suscribiste en
              <a href="https://alexperdel.com" style="color:#6B7280; text-decoration:underline;">alexperdel.com</a>.
              Un correo al mes y nada más.
              <br>
              <a href="{\$unsubscribe}" style="color:#6B7280; text-decoration:underline;">Darme de baja</a>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
PAGINA
echo "  escrito $F"
