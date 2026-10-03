// Graba reel.html fotograma a fotograma con el Chrome instalado y lo monta en MP4.
//
//   node render.js                     → los dos formatos, 4:5 y 9:16
//   node render.js --h 1920            → solo uno
//   node render.js --fotos 2,6,10      → solo fotogramas sueltos (PNG) para revisar
//   node render.js --musica pista.mp3  → además, versión con música (fundidos de 1 y 2 s)
//
// Salida en ./salida/ (no se versiona).

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execFileSync } = require('child_process');
const puppeteer = require('puppeteer-core');
const ffmpeg = require('ffmpeg-static');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const RAIZ = path.resolve(__dirname, '../..');          // raíz de la web: el reel lee la trama de assets/
const FPS = 30, DUR = 40, W = 1080;

const arg = (n, def) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : def; };
const alturas = arg('h') ? [+arg('h')] : [1350, 1920];
const fotos = arg('fotos') ? arg('fotos').split(',').map(Number) : null;
const musica = arg('musica');
const SALIDA = path.join(__dirname, 'salida');
fs.mkdirSync(SALIDA, { recursive: true });

// Servidor estático mínimo para que el reel pueda pedir la trama con fetch()
function servir() {
  const tipos = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css', '.js': 'text/javascript' };
  return new Promise(ok => {
    const s = http.createServer((req, res) => {
      const p = path.join(RAIZ, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(RAIZ) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': tipos[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(res);
    }).listen(0, '127.0.0.1', () => ok(s));
  });
}

(async () => {
  const servidor = await servir();
  const base = `http://127.0.0.1:${servidor.address().port}/tools/reel-libro/reel.html`;
  const navegador = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars', '--force-color-profile=srgb'] });

  for (const H of alturas) {
    const pag = await navegador.newPage();
    await pag.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    await pag.goto(`${base}?h=${H}`, { waitUntil: 'networkidle0' });
    await pag.evaluate(() => window.listo);
    const nombre = H === 1920 ? '9x16' : '4x5';

    if (fotos) {
      for (const t of fotos) {
        await pag.evaluate(t => render(t), t);
        await pag.screenshot({ path: path.join(SALIDA, `foto-${nombre}-${t}s.png`) });
      }
      console.log(`fotos ${nombre}: ${fotos.join(', ')} s`);
      await pag.close();
      continue;
    }

    const dir = path.join(SALIDA, `fotogramas-${nombre}`);
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
    const total = FPS * DUR;
    for (let i = 0; i < total; i++) {
      await pag.evaluate(t => render(t), i / FPS);
      await pag.screenshot({ path: path.join(dir, `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 });
      if (i % 150 === 0) process.stdout.write(`${nombre} ${Math.round(100 * i / total)}% `);
    }
    await pag.close();

    const mp4 = path.join(SALIDA, `hiperautomatizaciones-reel-${nombre}.mp4`);
    execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, 'f%05d.jpg'),
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`\n→ ${mp4}`);

    if (musica) {
      const conMusica = mp4.replace('.mp4', '-musica.mp4');
      execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', mp4, '-i', musica,
        '-filter_complex', `[1:a]atrim=0:${DUR},afade=t=in:st=0:d=1,afade=t=out:st=${DUR - 2}:d=2,volume=0.85[a]`,
        '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', conMusica]);
      console.log(`→ ${conMusica}`);
    }
  }

  await navegador.close();
  servidor.close();
})().catch(e => { console.error(e); process.exit(1); });
