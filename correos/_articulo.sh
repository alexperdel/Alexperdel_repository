#!/usr/bin/env bash
# Una tarjeta de articulo: filo rojo a la izquierda, titulo en negrita y una
# linea de resumen. Uso: ./_articulo.sh <url> <titulo> <resumen> [ultimo]
set -euo pipefail
MB="18px"; [ "${4:-}" = "ultimo" ] && MB="0"
cat <<TARJETA
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:$MB;">
                <tr>
                  <td style="border-left:3px solid #DC2626; padding:2px 0 2px 16px;">
                    <a href="$1" style="font-size:17px; line-height:25px; font-weight:bold; color:#0F0F0F; text-decoration:none;">$2</a>
                    <div style="margin-top:4px; font-size:15px; line-height:23px; color:#6B7280;">$3</div>
                  </td>
                </tr>
              </table>
TARJETA
