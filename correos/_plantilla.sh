#!/usr/bin/env bash
# Genera un correo a partir del esqueleto comun. Uso:
#   ./_plantilla.sh <fichero> <preheader> <titulo> <cuerpo_html> [texto_boton] [url_boton]
#
# El esqueleto vive aqui y no en cada fichero para que los cuatro correos se
# vean como el mismo correo. Si cambia el pie o el color, cambia una vez.
set -euo pipefail
F="$1"; PRE="$2"; TIT="$3"; CUERPO="$4"; BTXT="${5:-}"; BURL="${6:-}"

BOTON=""
if [ -n "$BTXT" ]; then
BOTON=$(cat <<BLOQUE

          <tr>
            <td align="center" style="padding:32px 40px 8px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color:#DC2626; border-radius:8px;">
                    <a href="$BURL" style="display:inline-block; padding:15px 34px; font-family:Helvetica,Arial,sans-serif; font-size:16px; line-height:20px; font-weight:bold; color:#FFFFFF; text-decoration:none;">$BTXT</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
BLOQUE
)
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
            <td style="padding:40px 40px 0 40px;">
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
$BOTON
          <tr>
            <td style="padding:28px 40px 40px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr><td style="height:1px; line-height:1px; font-size:0; background-color:#E5E7EB;">&nbsp;</td></tr>
              </table>
              <p style="margin:20px 0 0 0; font-family:Helvetica,Arial,sans-serif; font-size:16px; line-height:26px; color:#374151;">
                Alex
              </p>
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
