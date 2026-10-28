import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, tick } from '../setup.js';
import { Use } from '../library.js';

var icon;
var calls;

var Green = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#00ff00"/></svg>';
var Blue = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#0000ff"/></svg>';

/* A call of AppIcon as a Promise, for the test. */
function call (name) {
	var args = Array.prototype.slice.call(arguments, 1);

	return new Promise(function (resolve) {
		icon[name].apply(icon, args.concat([function (error) {
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

/* A bridge of a program that records what the Native Service asks. */
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

describe('Contract: the AppIcon Service of ElemenxUI', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Native', 'service:AppIcon']);

		icon = Elemenx.Service('AppIcon');
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

		await call('Reset');
	});

	it('puts an icon in the favicon, draws a count and a ring over it, and brings the icon of the page back', async function () {
		await call('Set', Green);

		expect(favicon().getAttribute('href')).toBe('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(Green));
		expect(favicon().getAttribute('type')).toBe('image/svg+xml');

		/* A count: a disc of the danger color in the corner over the icon; the icon stays around it. */
		await call('Badge', 3);

		expect(favicon().getAttribute('href')).toMatch(/^data:image\/png;base64,/);
		expect(icon.Current()).toEqual({Icon: Green, Badge: 3, Progress: null});

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

		await call('Reset');

		expect(favicon().getAttribute('href')).toBe('/favicon-of-the-page.png');
		expect(favicon().hasAttribute('type')).toBe(false);
		expect(icon.Current()).toEqual({Icon: null, Badge: 0, Progress: null});
	});

	it('makes a favicon for a page that named none, takes it away on Reset, and keeps an icon of each scheme', async function () {
		Array.prototype.forEach.call(document.querySelectorAll('link[rel~="icon"]'), function (link) {
			link.parentNode.removeChild(link);
		});

		icon.Scheme = {matches: true};

		await call('Set', {Light: Green, Dark: Blue});

		expect(document.querySelectorAll('link[rel~="icon"]').length).toBe(1);
		expect(favicon().getAttribute('href')).toBe('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(Blue));

		icon.Scheme = {matches: false};

		await call('Set', {Light: Green, Dark: Blue});

		expect(favicon().getAttribute('href')).toBe('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(Green));

		await call('Reset');

		expect(document.querySelectorAll('link[rel~="icon"]').length).toBe(0);
	});

	it('in a program gives the windows and the tray the icon drawn into a PNG, and the count and the progress to the system', async function () {
		bridge();

		await call('Set', Green);
		await call('Badge', 4);
		await call('Progress', 0.25);
		await call('Tray', Blue, 'Online');
		await call('Tray', null, 'Offline');

		expect(calls.map(function (each) {
			return each[0];
		})).toEqual(['icon', 'badge', 'icon', 'progress', 'icon', 'trayicon', 'trayicon']);
		expect(calls[0][1].Image).toMatch(/^data:image\/png;base64,/);
		expect(calls[1][1].Count).toBe(4);
		expect(calls[3][1]).toEqual({Value: 0.25, State: 'normal'});
		expect(calls[5][1].Image).toMatch(/^data:image\/png;base64,/);
		expect(calls[5][1].Tooltip).toBe('Online');
		expect(calls[6][1]).toEqual({Icon: null, Image: null, Tooltip: 'Offline'});

		/* The icon of the windows stays the icon alone: the count and the ring are the ones of the system. */
		expect(calls[2][1].Image).toBe(calls[0][1].Image);

		calls = [];

		await call('Reset');

		expect(calls.map(function (each) {
			return each[0] + ' ' + JSON.stringify(each[1]);
		})).toEqual(['badge {"Count":0,"Image":null}', 'progress {"Value":null,"State":"normal"}', 'icon {"Icon":null,"Image":null}']);
	});

	it('on the web blinks the favicon and the title of a hidden page, and tells that the tray needs a program', async function () {
		var title = document.title;
		var hidden = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState');

		Object.defineProperty(document, 'visibilityState', {configurable: true, get: function () {
			return 'hidden';
		}});

		try {
			await call('Set', Green);
			await call('Attention', true);

			expect(icon.Blinking).toBeTruthy();

			icon.Blink(false);

			await tick(50);

			expect(document.title).toBe(title);
			expect(favicon().getAttribute('href')).toBe('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(Green));
			expect((await call('Tray', Green, 'x')).message).toBe('Elemenx AppIcon Tray needs a native program');
		}
		finally {
			delete document.visibilityState;

			if (hidden)
				Object.defineProperty(Document.prototype, 'visibilityState', hidden);
		}
	});
});
