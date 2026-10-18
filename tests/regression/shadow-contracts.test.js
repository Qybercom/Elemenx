import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';

var running = [];

function language (code) {
	return new Promise(function (resolve) {
		Elemenx.Locale.Language(code, resolve);
	});
}

/* An Application in a shadow root on a new host element. */
function boot (template, extra) {
	var host = document.createElement('section');
	var root = unique('ShadowRoot');
	var app;

	host.id = unique('shadow-host');

	document.body.appendChild(host);

	Elemenx.Component(root, Object.assign({$Template: template}, extra || {}));

	app = Elemenx.Application(unique('ShadowApp'), Object.assign({$Component: root, $Mount: host, $Shadow: true}, (extra && extra.$Application) || {}));

	running.push(app);

	return {Host: host, App: app};
}

describe('Regression: Applications in a shadow root', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	afterEach(function () {
		while (running.length)
			running.pop().$Destroy();

		resetDOM();
	});

	it('renders the root in a shadow root of the mount, out of reach of the selectors of the page', async function () {
		var x = boot('<p class="shadow-text">Inside</p>');

		await tick(20);

		expect(x.Host.shadowRoot).not.toBeNull();
		expect(x.Host.shadowRoot.querySelector('.shadow-text').textContent).toBe('Inside');
		expect(document.querySelector('.shadow-text')).toBeNull();
		expect(x.App.$Mount()).toBe(x.Host);
	});

	it('keeps the styles of the page out and gives the shadow root the stylesheets of the framework, the later ones too', async function () {
		var page = document.createElement('style');
		var name = unique('shadow-sheet');
		var x;
		var text;

		page.textContent = '.shadow-leak { color: rgb(255, 0, 0); }';

		document.head.appendChild(page);

		x = boot('<p class="shadow-leak shadow-styled">Styled</p>', {$Style: '.shadow-styled { font-weight: 700; }'});

		await tick(20);

		text = x.Host.shadowRoot.querySelector('.shadow-leak');

		expect(getComputedStyle(text).color).not.toBe('rgb(255, 0, 0)');
		expect(getComputedStyle(text).fontWeight).toBe('700');

		Elemenx.Style(name, '.shadow-styled { letter-spacing: 3px; }');

		await tick(20);

		expect(getComputedStyle(text).letterSpacing).toBe('3px');
		expect(Array.from(document.head.querySelectorAll('style')).some(function (style) {
			return style.textContent === '.shadow-styled { letter-spacing: 3px; }';
		})).toBe(true);

		page.remove();
	});

	it('reads html, body and :root of a stylesheet as the host in a shadow root', async function () {
		var x = boot('<p class="shadow-themed">Themed</p>');
		var css;

		Elemenx.Style(unique('shadow-host-sheet'), ":root { --shadow-size: 13px; }\nhtml, body { margin: 0; }\nbody[data-theme='dark'] .shadow-themed { color: rgb(0, 128, 0); }\n@media (min-width: 1px) { body .shadow-themed { font-size: var(--shadow-size); } }");

		await tick(20);

		css = Array.from(x.Host.shadowRoot.querySelectorAll('style')).map(function (style) {
			return style.textContent;
		}).join('\n');

		expect(css).toContain(':host { --shadow-size: 13px; }');
		expect(css).toContain(':host, :host { margin: 0; }');
		expect(css).toContain(":host([data-theme='dark']) .shadow-themed {");
		expect(css).toContain(':host .shadow-themed { font-size: var(--shadow-size); }');

		x.Host.setAttribute('data-theme', 'dark');

		expect(getComputedStyle(x.Host.shadowRoot.querySelector('.shadow-themed')).color).toBe('rgb(0, 128, 0)');
		expect(getComputedStyle(x.Host.shadowRoot.querySelector('.shadow-themed')).fontSize).toBe('13px');
	});

	it('routes the links of the shadow root', async function () {
		var page = unique('ShadowPage');
		var x;
		var link;

		Elemenx.Component(page, {$Template: '<div class="shadow-routed">{{$Path}}</div>'});

		x = boot('<main><a class="shadow-link" href="/shadow-target">Go</a><div *outlet="Content"></div></main>', {
			$Application: {$Router: {Routes: [{Path: '/', Component: page}, {Path: '/shadow-target', Component: page}]}}
		});

		await waitFor(function () {
			return !!(x.Host.shadowRoot && x.Host.shadowRoot.querySelector('.shadow-routed'));
		}, 2000);

		link = x.Host.shadowRoot.querySelector('.shadow-link');

		link.click();

		await waitFor(function () {
			return x.Host.shadowRoot.querySelector('.shadow-routed').textContent === '/shadow-target';
		}, 2000);

		expect(location.pathname).toBe('/shadow-target');
	});

	it('gives the host the language and the direction of Elemenx.Locale', async function () {
		var x = boot('<p>{{$T(\'shadow.phrase\')}}</p>');

		await tick(20);

		await language('ar');

		expect(x.Host.lang).toBe('ar');
		expect(x.Host.dir).toBe('rtl');

		await language('en');

		expect(x.Host.dir).toBe('ltr');
	});
});
