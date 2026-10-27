/* Optional web integration runner. Playwright is tooling, not an application dependency.
 * Called by ArchitectureFlowPostgresIT while the isolated HTTP services are alive.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.env.FACELIT_PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(process.env.FACELIT_ARCH_WEB_EXPORT || '../tmp/architecture-refactor/web');
const artifacts = path.resolve(process.env.FACELIT_ARCH_ARTIFACTS || '../tmp/architecture-refactor/browser');
const api = process.env.ARCH_BACKEND_URL;
assert.ok(api && new URL(api).hostname === '127.0.0.1', 'The runner only targets the isolated loopback backend');
assert.ok(fs.existsSync(path.join(root, 'index.html')), 'Export the web application before running the browser');
fs.mkdirSync(artifacts, { recursive: true });

const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };
const server = http.createServer((request, response) => {
  const relative = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  let file = path.resolve(root, '.' + relative);
  if (file !== root && !file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  else if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
  if (!fs.existsSync(file)) { response.writeHead(404).end(); return; }
  response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(response);
});

(async () => {
  await new Promise(resolve => server.listen(18081, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, channel: process.env.FACELIT_ARCH_BROWSER_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined) });
  let page;
  try {
    const context = await browser.newContext({ viewport: { width: 1360, height: 920 }, locale: 'es-CO' });
    page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:18081/auth/login', { waitUntil: 'networkidle' });
    await page.locator('input').first().fill('98765001');
    await page.locator('input[type=password]').fill('Architecture1!');
    await page.getByText('Iniciar sesión', { exact: true }).last().click();
    await page.waitForURL(url => url.pathname.startsWith('/apprentice'), { timeout: 30000 });
    await page.goto('http://127.0.0.1:18081/apprentice/facial', { waitUntil: 'networkidle' });
    await page.getByText(/Learner Fixture/).first().waitFor();
    await page.getByText(/registrad/i).first().waitFor();
    await page.screenshot({ path: path.join(artifacts, 'apprentice-registration.png'), fullPage: true });
    await context.close();
    const teacher = await browser.newContext({ viewport: { width: 1360, height: 920 }, locale: 'es-CO' });
    page = await teacher.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:18081/auth/login', { waitUntil: 'networkidle' });
    await page.locator('input').first().fill('98765002');
    await page.locator('input[type=password]').fill('Architecture1!');
    await page.getByText('Iniciar sesión', { exact: true }).last().click();
    await page.waitForURL(url => url.pathname.startsWith('/instructor'), { timeout: 30000 });
    await page.goto('http://127.0.0.1:18081/instructor/attendance/by-ficha', { waitUntil: 'networkidle' });
    await page.getByPlaceholder('Selecciona una ficha', { exact: true }).click();
    await page.getByText('Ficha 9876501', { exact: true }).first().click();
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    await page.locator('input[type=date]').nth(0).fill(today);
    await page.locator('input[type=date]').nth(1).fill(today);
    await page.getByText('Learner Fixture', { exact: true }).first().waitFor();
    await page.screenshot({ path: path.join(artifacts, 'instructor-attendance.png'), fullPage: true });
    // The same recoverable static-export Suspense fallback was reproduced on the original HEAD.
    // Require successful hydration and real interactions above; all other runtime errors fail.
    const recovered = errors.filter(message => message.startsWith('Minified React error #419;'));
    const fatal = errors.filter(message => !message.startsWith('Minified React error #419;'));
    fs.writeFileSync(path.join(artifacts, 'runtime.json'), JSON.stringify({ existingRecoverableSuspenseWarnings: recovered.length, fatal }, null, 2));
    assert.deepEqual(fatal, [], 'The reorganized web routes must render without new runtime errors');
    console.log('PASS browser: real learner/instructor login, registered-face screen and persisted attendance matrix. Existing recoverable Suspense warnings: ' + recovered.length);
    await teacher.close();
  } catch (error) {
    if (page && !page.isClosed()) {
      await page.screenshot({ path: path.join(artifacts, 'failure.png'), fullPage: true });
      fs.writeFileSync(path.join(artifacts, 'failure.txt'), await page.locator('body').innerText());
    }
    throw error;
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
