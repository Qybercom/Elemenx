import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx, tick } from '../setup.js';

var native;
var calls;

/* A bridge of a program that records what the Service asks and answers null. */
function bridge () {
	calls = [];

	window.ElemenxNative = {
		Platform: 'electron',
		Features: ['window', 'tray', 'taskbar'],
		Call: function (name, args, callback) {
			calls.push([name, args]);

			callback(null, name === 'tasks' ? ['compose'] : null);
		},
		On: function () {
			return function () {};
		}
	};
}

describe('Contract: the Native Service of ElemenxUI with the taskbar and the tray of a program', function () {
	beforeAll(async function () {
		await loadElemenx();
		await import('../../libraries/ElemenxUI/services/Native.js');

		native = Elemenx.Service('Native');
	});

	afterEach(function () {
		delete window.ElemenxNative;

		native.Blink(false);
	});

	it('sends the progress with its state, a count with the picture of it, the attention, the thumbnail buttons, and reads the tasks', function () {
		var tasks = null;
		var image;

		bridge();

		native.Progress(0.4);
		native.Progress({Value: 2, State: 'error'});
		native.Progress({State: 'indeterminate'});
		native.Progress(null);
		native.Badge(7);
		native.Badge(0);
		native.Attention(true);
		native.Thumbar([{ID: 'play', Icon: 'icons/play.png', Tooltip: 'Play'}, {ID: 'next', Icon: 'icons/next.png', Disabled: true}]);
		native.Tasks(function (error, value) {
			tasks = value;
		});
		native.Window('quit');

		image = calls[4][1].Image;

		expect(calls.map(function (call) {
			return call[0] === 'badge' ? ['badge', {Count: call[1].Count, Image: call[1].Image ? 'png' : null}] : call;
		})).toEqual([
			['progress', {Value: 0.4, State: 'normal'}],
			['progress', {Value: 1, State: 'error'}],
			['progress', {Value: null, State: 'indeterminate'}],
			['progress', {Value: null, State: 'normal'}],
			['badge', {Count: 7, Image: 'png'}],
			['badge', {Count: 0, Image: null}],
			['attention', {On: true}],
			['thumbar', {Buttons: [{ID: 'play', Icon: 'icons/play.png', Tooltip: 'Play', Disabled: false}, {ID: 'next', Icon: 'icons/next.png', Tooltip: '', Disabled: true}]}],
			['tasks', {}],
			['window', {Action: 'quit'}]
		]);
		expect(image).toMatch(/^data:image\/png;base64,/);
		expect(tasks).toEqual(['compose']);
	});

	it('on the web blinks the title of a hidden page for attention, and tells that the thumbnail buttons and the tasks need a program', async function () {
		var errors = [];
		var title = document.title;
		var hidden = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState');

		Object.defineProperty(document, 'visibilityState', {configurable: true, get: function () {
			return 'hidden';
		}});

		try {
			native.Attention(true);

			expect(native.Blinking).toBeTruthy();

			native.Blink(false);

			expect(document.title).toBe(title);

			native.Thumbar([], function (error) {
				errors.push(error.message);
			});
			native.Tasks(function (error) {
				errors.push(error.message);
			});

			await tick();

			expect(errors).toEqual(['Elemenx Native thumbar needs a native program', 'Elemenx Native tasks needs a native program']);
		}
		finally {
			delete document.visibilityState;

			if (hidden)
				Object.defineProperty(Document.prototype, 'visibilityState', hidden);
		}
	});

	it('makes the window of the tray hidden in the program and sends its size only, and closes it with its icon', function () {
		var frame = document.createElement('iframe');
		var open = window.open;
		var element = document.createElement('p');
		var named = null;
		var error = 'none';

		document.body.appendChild(frame);

		bridge();

		window.open = function (url, name) {
			named = name;

			return frame.contentWindow;
		};

		try {
			native.Tray({Icon: 'icon.png', Tooltip: 'Mail', Items: [{ID: 'open', Label: 'Open'}], Window: {Element: element, Width: 300}}, function (failure) {
				error = failure;
			});

			expect(error).toBe(null);
			expect(named).toBe('elemenx-tray');
			expect(frame.contentDocument.body.contains(element)).toBe(true);
			expect(calls[0]).toEqual(['tray', {Icon: 'icon.png', Tooltip: 'Mail', Items: [{ID: 'open', Label: 'Open'}], Window: {Width: 300, Height: 420}}]);
			expect(native.Windows()).toEqual([]);

			native.TrayWindow(true);

			expect(calls[1]).toEqual(['traywindow', {Show: true}]);

			native.Tray(null);

			expect(native.TrayEntry).toBe(null);
			expect(calls[2]).toEqual(['tray', {Icon: undefined, Tooltip: undefined, Items: undefined}]);
		}
		finally {
			window.open = open;

			frame.remove();
		}
	});
});
