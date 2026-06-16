const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

function startServer(dir, port) {
  return new Promise(resolve => {
    const mimes = {
      '.html': 'text/html', '.js': 'application/javascript',
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.webp': 'image/webp', '.avif': 'image/avif',
      '.png': 'image/png', '.css': 'text/css',
    };
    const server = http.createServer((req, res) => {
      const url = req.url.split('?')[0];
      const file = path.join(dir, url === '/' ? 'index.html' : url);
      try {
        const data = fs.readFileSync(file);
        const ext = path.extname(file).toLowerCase();
        res.writeHead(200, { 'Content-Type': mimes[ext] || 'application/octet-stream' });
        res.end(data);
      } catch {
        console.log('404:', file);
        res.writeHead(404); res.end('Not found');
      }
    });
    server.listen(port, () => resolve(server));
  });
}

(async () => {
  const dir = __dirname;
  const port = 8765;
  const server = await startServer(dir, port);

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const logs = [];
  page.on('console', msg => logs.push(msg.type() + ': ' + msg.text()));
  page.on('pageerror', err => logs.push('PAGEERROR: ' + err.message));

  await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle0', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));

  // Check what THREE is doing
  const info = await page.evaluate(() => {
    return {
      THREE: typeof THREE,
      groups: typeof groups !== 'undefined' ? groups.length : 'undefined',
      rendererInfo: typeof renderer !== 'undefined' ? renderer.info.render : 'no renderer',
    };
  });
  console.log('Page info:', JSON.stringify(info));
  console.log('Page logs:', logs.join('\n'));

  await page.screenshot({ path: path.join(dir, 'ss_v10.png') });
  await browser.close();
  server.close();
  console.log('Screenshot saved.');
})();
