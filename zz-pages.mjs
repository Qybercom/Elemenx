// A page of demos (argv[3]: /gaming?demo=Orbit) on a desktop, a phone held upright and a phone on its side; screenshots.
import { chromium, devices } from 'playwright';
import { lowPriority } from './zz-lowprio.mjs';
import fs from 'fs';

const out = process.argv[2];
const url = 'http://localhost:4391/' + (process.argv[3] || 'gaming');
const wait = Number(process.argv[4] || 25000);
const browser = await chromium.launch({headless: false, channel: 'chrome', args: ['--ignore-gpu-blocklist']});

lowPriority();
fs.mkdirSync(out, {recursive: true});

const kinds = [
	['desktop', {viewport: {width: 1400, height: 900}}],
	['phone-portrait', Object.assign({}, devices['Pixel 7'])],
	['phone-landscape', Object.assign({}, devices['Pixel 7 landscape'])]
];

for (const [name, options] of kinds) {
	const context = await browser.newContext(options);
	const page = await context.newPage();

	page.on('pageerror', (error) => console.log(name, 'PAGE ERROR', error.message));
	page.on('console', (message) => {
		if (message.type() === 'error')
			console.log(name, 'CONSOLE', message.text().slice(0, 300));
	});

	await page.goto(url);
	await page.waitForTimeout(wait);
	await page.screenshot({path: out + '/' + name + '.png'});

	if (name === 'phone-landscape' && await page.locator('.demo-frame-corner button[aria-label=Controls]').count()) {
		await page.locator('.demo-frame-corner button[aria-label=Controls]').tap();
		await page.waitForTimeout(1500);
		await page.screenshot({path: out + '/' + name + '-tools.png'});
	}
	console.log(name, await page.evaluate(() => JSON.stringify({inner: window.innerHeight, scroll: document.scrollingElement.scrollHeight, corner: (() => { const r = document.querySelector('.demo-frame-corner'); return r ? JSON.stringify(r.getBoundingClientRect()) : ''; })(), frame: JSON.stringify(document.querySelector('.demo-frame').getBoundingClientRect()), html: document.documentElement.className, pad: !!document.querySelector('.elemenx-virtual-gamepad'), panel: !!document.querySelector('.demo-frame-list') && document.querySelector('.demo-frame-list').getBoundingClientRect().width})));
	await context.close();
}

await browser.close();
