import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';
import titleBarSource from '../../libraries/ElemenxUI/components/TitleBar/TitleBar.js?raw';
import titleBarTemplate from '../../libraries/ElemenxUI/components/TitleBar/TitleBar.html?raw';

var calls;
var listeners;
var owned = [];

/* A program whose windows have a frame, that records the calls of the bridge and lets the test tell its events. */
function program (frame) {
	calls = [];
	listeners = {};

	window.ElemenxNative = {
		Platform: 'electron',
		Frame: frame,
		Features: ['window'],
		Call: function (name, args, callback) {
			calls.push([name, structuredClone(args)]);

			callback(null, name === 'window' ? {Maximized: args.Action === 'toggle-maximize'} : true);
		},
		On: function (name, callback) {
			(listeners[name] = listeners[name] || []).push(callback);

			return function () {};
		}
	};
}

function tell (name, value) {
	(listeners[name] || []).forEach(function (callback) {
		callback(value);
	});
}

function mount (template) {
	var component = Elemenx.Component(unique('TitleBarHost'), {$Template: template})();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

describe('Contract: the frames of the windows of a program (Native.Frame) and TitleBar', function () {
	beforeAll(async function () {
		await loadElemenx();
		await import('../../libraries/ElemenxUI/services/Theme.js');
		await import('../../libraries/ElemenxUI/services/Native.js');

		/* The TitleBar with its template inline: the page of the tests serves no Library. */
		new Function(titleBarSource.replace("$StyleURL: 'TitleBar.css',\n", '').replace("$TemplateURL: 'TitleBar.html'", function () {
			return '$Template: ' + JSON.stringify(titleBarTemplate);
		}))();
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();

		delete window.ElemenxNative;
	});

	it('names the frame of the program, web on the web, and gives the buttons of the system the colors asked', function () {
		var native = Elemenx.Service('Native');
		var answer = null;

		expect(native.Frame()).toBe('web');

		native.TitleBarOverlay({Color: '#ffffff', Symbol: '#000000'}, function (error, result) {
			answer = [error, result];
		});

		expect(answer).toEqual([null, false]);

		program('hidden');

		expect(native.Frame()).toBe('hidden');

		native.TitleBarOverlay({Color: '#202020', Symbol: '#f0f0f0', Height: 32});

		expect(calls).toEqual([['titlebar', {Color: '#202020', Symbol: '#f0f0f0', Height: 32}]]);

		/* A window of OpenWindow is the target of Window with its ID. */
		native.Window('minimize', null, 'notes');

		expect(calls[1]).toEqual(['window', {Action: 'minimize', Window: 'notes'}]);
	});

	it('gives the parts of the system in a program the scheme of the theme: its policy, or the one scheme of a theme', function () {
		var theme = Elemenx.Service('Theme');
		var policy = theme.Policy();

		program('system');

		try {
			theme.Policy('dark');

			expect(calls.filter(function (call) {
				return call[0] === 'scheme';
			}).pop()).toEqual(['scheme', {Scheme: 'dark'}]);

			theme.Policy('system');

			expect(calls.filter(function (call) {
				return call[0] === 'scheme';
			}).pop()).toEqual(['scheme', {Scheme: 'system'}]);
		}
		finally {
			theme.Policy(policy);
		}
	});

	it('opens a window of the Application with a frame of its own, the frame on its <html>', function () {
		var native = Elemenx.Service('Native');
		var frame = document.createElement('iframe');
		var open = window.open;
		var features = null;

		program('system');

		document.body.appendChild(frame);

		window.open = function (url, name, asked) {
			features = asked;

			return frame.contentWindow;
		};

		try {
			native.OpenWindow({ID: 'plain', Element: document.createElement('div'), Frame: 'none'}, function () {});

			expect(features).toContain('elemenx-frame=none');
			expect(frame.contentDocument.documentElement.getAttribute('data-elemenx-frame')).toBe('none');

			/* Its frame by its ID (for its TitleBar); the windows without one have the frame of the program. */
			expect([native.Frame('plain'), native.Frame('other'), native.Frame()]).toEqual(['none', 'system', 'system']);

			native.CloseWindow('plain');
		}
		finally {
			window.open = open;

			frame.remove();
		}
	});

	it('empties a window of the name left by a page before (reloaded), and keeps its own frame as the page changes', async function () {
		var native = Elemenx.Service('Native');
		var frame = document.createElement('iframe');
		var open = window.open;
		var first;
		var second;
		var element;

		program('hidden');

		document.body.appendChild(frame);

		window.open = function () {
			return frame.contentWindow;
		};

		try {
			/* The window of the tray opened by a page, then by the page that took its place: one content, one set of styles. */
			first = native.Spawn('elemenx-tray', {Element: document.createElement('section')}, 320, 420, 'none');

			first.Stop();

			element = document.createElement('section');
			element.className = 'second';

			second = native.Spawn('elemenx-tray', {Element: element}, 320, 420, 'none');

			expect(frame.contentDocument.body.children.length).toBe(1);
			expect(frame.contentDocument.body.firstElementChild).toBe(element);
			expect(frame.contentDocument.head.querySelectorAll('style, link').length).toBe(document.head.querySelectorAll('style, link[rel="stylesheet"]').length);

			/* The page changes its attributes: the window takes them, but not the frame of the page. */
			document.documentElement.setAttribute('data-elemenx-frame', 'hidden');
			document.documentElement.setAttribute('data-test-mirror', 'yes');

			await tick(20);

			expect(frame.contentDocument.documentElement.getAttribute('data-test-mirror')).toBe('yes');
			expect(frame.contentDocument.documentElement.getAttribute('data-elemenx-frame')).toBe('none');

			second.Stop();
		}
		finally {
			document.documentElement.removeAttribute('data-elemenx-frame');
			document.documentElement.removeAttribute('data-test-mirror');

			window.open = open;

			frame.remove();
		}
	});

	it('draws the buttons of the window where the system draws none, and they act on its window', async function () {
		var host;
		var controls;

		/* On the web: a header, no buttons of a window. */
		host = mount('<div><TitleBar Title="Notes" /></div>');

		await tick(20);

		expect(host.$Element().querySelector('.elemenx-title-bar').classList.contains('elemenx-native-drag')).toBe(true);
		expect(host.$Element().querySelector('.elemenx-title-bar-title').textContent).toBe('Notes');
		expect(host.$Element().querySelectorAll('.elemenx-title-bar-control').length).toBe(0);

		owned.pop().$Destroy();

		/* A program without a frame: minimize, maximize and close, for its own window (Window). */
		program('none');

		host = mount('<div><TitleBar Title="Notes" Window="notes" /></div>');

		await tick(20);

		controls = host.$Element().querySelectorAll('.elemenx-title-bar-control');

		expect(controls.length).toBe(3);

		controls[0].click();

		expect(calls[calls.length - 1]).toEqual(['window', {Action: 'minimize', Window: 'notes'}]);

		/* Maximized, its button restores; the state of another window does not touch it. */
		controls[1].click();

		await tick(20);

		expect(controls[1].getAttribute('aria-label')).toBe(Elemenx.Locale.Text('ui.window.restore'));

		tell('window', {Maximized: false});

		await tick(20);

		expect(controls[1].getAttribute('aria-label')).toBe(Elemenx.Locale.Text('ui.window.restore'));

		tell('window', {Maximized: false, ID: 'notes'});

		await tick(20);

		expect(controls[1].getAttribute('aria-label')).toBe(Elemenx.Locale.Text('ui.window.maximize'));

		controls[2].click();

		expect(calls[calls.length - 1]).toEqual(['window', {Action: 'close', Window: 'notes'}]);

		owned.pop().$Destroy();

		/* Controls false: none, even without a frame. */
		host = mount('<div><TitleBar Controls="false" /></div>');

		await tick(20);

		expect(host.$Element().querySelectorAll('.elemenx-title-bar-control').length).toBe(0);
	});

	it('with Frame hidden leaves the buttons to the system and gives them its colors', async function () {
		var host;

		program('hidden');

		host = mount('<div><TitleBar Title="Notes" /></div>');

		await tick(60);

		expect(host.$Element().querySelector('.elemenx-title-bar').classList.contains('overlay')).toBe(true);
		expect(host.$Element().querySelectorAll('.elemenx-title-bar-control').length).toBe(0);

		expect(calls.filter(function (call) {
			return call[0] === 'titlebar';
		})[0][1]).toMatchObject({Color: expect.stringMatching(/^#[0-9a-f]{6}$/), Symbol: expect.stringMatching(/^#[0-9a-f]{6}$/)});
	});
});
