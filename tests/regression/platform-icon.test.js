import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, tick } from '../setup.js';
import { Use } from '../library.js';

var platform;
var calls;

var Green = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#00ff00"/></svg>';
var Blue = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#0000ff"/></svg>';

/* A call of Platform as a Promise, for the test. */
function call (name) {
	var args = Array.prototype.slice.call(arguments, 1);

	return new Promise(function (resolve) {
		platform[name].apply(platform, args.concat([function (error) {
			resolve(error || null);
		}]));
	});
}

/* The favicon of the page: its href, and the color of its pixel at x, y (a PNG or an SVG drawn on a canvas). */
function favicon () {
	return document.querySelector('link[rel~="icon"]');
}

function pixel (x, y) {
	return new Promise(function (resolve) {
		var picture = new Image();

		picture.onload = function () {
			var canvas = document.createElement('canvas');
			var context;

			canvas.width = 64;
			canvas.height = 64;
			context = canvas.getContext('2d');

			context.drawImage(picture, 0, 0, 64, 64);

			resolve(Array.prototype.slice.call(context.getImageData(x, y, 1, 1).data, 0, 3));
		};

		picture.src = favicon().getAttribute('href');
	});
}

/* Waits for the drawings of the icon to end (a picture loads, then the canvas is drawn). */
async function drawn () {
	await tick(80);
}

/* A bridge of a program that records what the Platform Service asks. */
function bridge () {
	calls = [];

	window.ElemenxNative = {
		Platform: 'electron',
		Features: ['window', 'tray', 'taskbar'],
		Call: function (name, args, callback) {
			calls.push([name, args]);

			callback(null, null);
		},
		On: function () {
			return function () {};
		}
	};
}

describe('Contract: the icon of the Application in the Platform Service of ElemenxUI', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Platform']);

		platform = Elemenx.Service('Platform');
	});

	beforeEach(function () {
		Array.prototype.forEach.call(document.querySelectorAll('link[rel~="icon"]'), function (link) {
			link.parentNode.removeChild(link);
		});

		var link = document.createElement('link');

		link.rel = 'icon';
		link.href = '/favicon-of-the-page.png';

		document.head.appendChild(link);
	});

	afterEach(async function () {
		delete window.ElemenxNative;

		await call('ResetIcon');
	});

	it('puts an icon in the favicon, draws a count and a ring over it, and brings the icon of the page back', async function () {
		await call('Icon', Green);

		expect(favicon().getAttribute('href')).toBe('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(Green));
		expect(Elemenx.Icon()).toBe(Green);

		/* A count: a disc of the danger color in the corner over the icon; the icon stays around it. */
		await call('Badge', 3);

		expect(favicon().getAttribute('href')).toMatch(/^data:image\/png;base64,/);
		expect(favicon().getAttribute('type')).toBe('image/png');
		expect(platform.IconState()).toEqual({Icon: Green, Badge: 3, Progress: null});

		var corner = await pixel(52, 52);
		var away = await pixel(4, 4);

		expect(corner[0]).toBeGreaterThan(150);
		expect(corner[1]).toBeLessThan(120);
		expect(away).toEqual([0, 255, 0]);

		/* A ring: the icon drawn smaller inside it, the part of the ring done in the accent. */
		await call('Badge', 0);
		await call('Progress', 0.5);

		expect((await pixel(62, 32))[1]).toBeLessThan(200);
		expect(await pixel(32, 32)).toEqual([0, 255, 0]);

		await call('Progress', null);

		expect(favicon().getAttribute('href')).toBe('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(Green));
		expect(favicon().hasAttribute('type')).toBe(false);

		await call('ResetIcon');

		expect(favicon().getAttribute('href')).toBe('/favicon-of-the-page.png');
		expect(favicon().hasAttribute('type')).toBe(false);
		expect(platform.IconState()).toEqual({Icon: null, Badge: 0, Progress: null});
	});

	it('keeps the badge over an icon that changes by Elemenx.Icon or $Icon, and over the icon of the page brought back', async function () {
		await call('Badge', 'dot');

		/* The icon of the page under the dot: its href kept on the link, to bring it back. */
		expect(favicon().getAttribute('href')).toMatch(/^data:image\/png;base64,/);
		expect(favicon().getAttribute('data-elemenx-href')).toBe('/favicon-of-the-page.png');

		Elemenx.Icon(Blue);

		await drawn();

		expect(document.querySelectorAll('link[rel~="icon"]').length).toBe(1);
		expect(favicon().hasAttribute('data-elemenx-icon')).toBe(true);
		expect(favicon().getAttribute('href')).toMatch(/^data:image\/png;base64,/);
		expect(await pixel(4, 60)).toEqual([0, 0, 255]);

		Elemenx.Icon(null);

		await drawn();

		expect(favicon().hasAttribute('data-elemenx-icon')).toBe(false);
		expect(favicon().getAttribute('href')).toMatch(/^data:image\/png;base64,/);

		await call('Badge', 0);

		expect(favicon().getAttribute('href')).toBe('/favicon-of-the-page.png');
		expect(favicon().hasAttribute('data-elemenx-href')).toBe(false);
	});

	it('makes a favicon for a page that named none, takes it away on ResetIcon, and keeps an icon of each scheme', async function () {
		var scheme = platform.DarkQuery;

		Array.prototype.forEach.call(document.querySelectorAll('link[rel~="icon"]'), function (link) {
			link.parentNode.removeChild(link);
		});

		try {
			await call('Badge', 2);

			expect(document.querySelectorAll('link[rel~="icon"]').length).toBe(1);
			expect(favicon().hasAttribute('data-elemenx-badge')).toBe(true);

			await call('Badge', 0);

			expect(document.querySelectorAll('link[rel~="icon"]').length).toBe(0);

			/* The scheme of now chooses the icon under the badge. */
			platform.DarkQuery = {matches: true};

			await call('Icon', {Light: Green, Dark: Blue});
			await call('Badge', 1);

			expect(await pixel(4, 60)).toEqual([0, 0, 255]);

			platform.DarkQuery = {matches: false};

			await call('Badge', 2);

			expect(await pixel(4, 60)).toEqual([0, 255, 0]);

			await call('ResetIcon');

			expect(document.querySelectorAll('link[rel~="icon"]').length).toBe(0);
		}
		finally {
			platform.DarkQuery = scheme;
		}
	});

	it('in a program gives the windows the icon drawn into a PNG at every change of Elemenx.Icon, and the count and the progress to the system', async function () {
		bridge();

		await call('Icon', Green);
		await call('Badge', 4);
		await call('Progress', 0.25);
		await call('TrayIcon', {Icon: Blue, Tooltip: 'Online'});
		await call('TrayIcon', {Tooltip: 'Offline'});
		await call('TrayIcon', {Icon: 'icons/tray.png'});

		expect(calls.map(function (each) {
			return each[0];
		})).toEqual(['icon', 'badge', 'progress', 'trayicon', 'trayicon', 'trayicon']);
		expect(calls[0][1].Image).toMatch(/^data:image\/png;base64,/);
		expect(calls[1][1].Count).toBe(4);
		expect(calls[2][1]).toEqual({Value: 0.25, State: 'normal'});
		expect(calls[3][1].Image).toMatch(/^data:image\/png;base64,/);
		expect(calls[3][1].Tooltip).toBe('Online');
		expect(calls[4][1]).toEqual({Icon: null, Image: null, Tooltip: 'Offline'});
		expect(calls[5][1]).toEqual({Icon: 'icons/tray.png', Image: null, Tooltip: null});

		/* $Icon, Elemenx.Icon: the windows follow. */
		calls = [];

		Elemenx.Icon(Blue);

		await drawn();

		expect(calls.length).toBe(1);
		expect(calls[0][0]).toBe('icon');
		expect(calls[0][1].Image).toMatch(/^data:image\/png;base64,/);

		calls = [];

		await call('ResetIcon');

		expect(calls.map(function (each) {
			return each[0] + ' ' + JSON.stringify(each[1]);
		})).toEqual(['badge {"Count":0,"Image":null}', 'progress {"Value":null,"State":"normal"}', 'icon {"Icon":null,"Image":null}']);
	});

	it('in a program gives the windows the icon even when a badge comes before it is drawn, and only the last of two icons', async function () {
		bridge();

		platform.Icon(Green);
		platform.Badge(2);

		await drawn();

		expect(calls.map(function (each) {
			return each[0];
		})).toEqual(['badge', 'icon']);

		calls = [];

		platform.Icon(Blue);
		Elemenx.Icon(Green);

		await drawn();

		expect(calls.length).toBe(1);
		expect(calls[0][0]).toBe('icon');
	});

	it('in a program gives the windows the title of the page at every change, once for Title', async function () {
		var title = document.title;

		bridge();

		try {
			Elemenx.Title('Inbox (3)');

			await call('Title', 'Inbox (4)');

			expect(calls).toEqual([['title', {Text: 'Inbox (3)'}], ['title', {Text: 'Inbox (4)'}]]);
			expect(document.title).toBe('Inbox (4)');
		}
		finally {
			Elemenx.Title(title);
		}
	});

	it('on the web blinks the favicon and the title of a hidden page, and tells that the tray needs a program', async function () {
		var title = document.title;
		var hidden = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState');

		Object.defineProperty(document, 'visibilityState', {configurable: true, get: function () {
			return 'hidden';
		}});

		try {
			await call('Icon', Green);
			await call('Attention', true);

			expect(platform.Blinking).toBeTruthy();

			platform.Blink(false);

			await drawn();

			expect(document.title).toBe(title);
			expect(favicon().getAttribute('href')).toBe('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(Green));
			expect((await call('TrayIcon', {Icon: Green, Tooltip: 'x'})).message).toBe('Elemenx Platform trayicon needs a native program');
		}
		finally {
			delete document.visibilityState;

			if (hidden)
				Object.defineProperty(Document.prototype, 'visibilityState', hidden);
		}
	});
});
