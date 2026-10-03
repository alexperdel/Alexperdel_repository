# Reel del libro (28 s)

Animación con la identidad de la cubierta: la trama se dibuja sola y la cámara
recorre un diagrama de flujo — título → subtítulo → las tres razones (Cero
humo · Cicatrices reales · No caduca) → el libro pasando páginas → cierre con
la fecha y la URL de la lista de espera.

No se sube por FTP: es una herramienta, como el resto de `tools/`.

## Ver la animación

Con la web servida en local (`http://localhost:8090/`):

- En bucle: `/tools/reel-libro/reel.html?h=1350` (4:5) o `?h=1920` (9:16)
- Congelada en un segundo: añade `&t=16.5`

## Generar los MP4

```bash
cd tools/reel-libro
npm install --ignore-scripts      # la primera vez (ver nota de ffmpeg abajo)
node render.js                    # 4:5 y 9:16 → salida/
node render.js --h 1920           # solo uno
node render.js --fotos 2,10,38    # fotogramas sueltos para revisar
node render.js --musica pista.mp3 # además, versión con música (fundidos)
```

Graba con el Chrome instalado (`puppeteer-core`) fotograma a fotograma a 30
fps, así que sale fluido aunque el ordenador vaya lento, y monta el MP4 con
`ffmpeg` (H.264, `yuv420p`, `faststart`: lo que piden LinkedIn e Instagram).

**ffmpeg**: Homebrew ya no lo compila para este Mac (Intel, macOS 15) sin
actualizar las Command Line Tools, y el instalador de `ffmpeg-static` corta a
los 30 s. Por eso va con `--ignore-scripts` y el binario se baja a mano de la
misma release que usaría él:

```bash
TAG=$(node -p 'require("./node_modules/ffmpeg-static/package.json")["ffmpeg-static"]["binary-release-tag"]')
curl -fL "https://github.com/eugeneware/ffmpeg-static/releases/download/$TAG/ffmpeg-darwin-x64.gz" | gunzip > node_modules/ffmpeg-static/ffmpeg
chmod +x node_modules/ffmpeg-static/ffmpeg
```

## Cambiar textos o tiempos

Todo está en `reel.html`: los textos en el HTML, las posiciones en `Y` y los
tiempos de cada plano en `PLANOS` y en `render(t)`. La trama es la de la web
(`assets/img/libro/trama-flujos.svg`): cuando llegue el vectorial de Rafa, el
reel la recoge solo.

## Música

`musica/sports-rock-lnplusmusic.mp3` — «Sport Sports Rock Music» de lnplusmusic, de
Pixabay Music (licencia de Pixabay: uso gratuito, sin atribución obligatoria; no
se puede redistribuir la pista suelta, por eso solo vive en este repo privado).

130,4 BPM. El reel arranca en el **puente suave (63,39 s)** y el **drop (67,99 s)**
cae en el segundo 4,6 del vídeo, justo cuando golpea el título:

```bash
node render.js --musica musica/sports-rock-lnplusmusic.mp3 --desde 63.39
```

Si se cambia de pista, hay que volver a medir tempo y drop y ajustar `PULSO`,
`COMPAS` y `D` en `reel.html`.
