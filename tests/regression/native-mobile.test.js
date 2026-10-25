import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import bridgeSource from '../../tools/capacitor/bridge.js?raw';

var native;
var written;

/* A Capacitor program with the plugins named, its bridge put into the page as the build does. */
function program (plugins) {
	written = [];

	delete window.ElemenxNative;

	window.Capacitor = {
		getPlatform: function () {
			return 'android';
		},
		Plugins: plugins
	};

	new Function(bridgeSource)();
}

var filesystem = {
	writeFile: function (options) {
		written.push(options);

		return Promise.resolve({uri: 'file:///storage/emulated/0/Documents/' + options.path});
	}
};

describe('Contract: the Native Service of ElemenxUI in a mobile program (Capacitor)', function () {
	beforeAll(async function () {
		await loadElemenx();
		await import('../../libraries/ElemenxUI/services/Native.js');

		native = Elemenx.Service('Native');
	});

	afterEach(function () {
		delete window.ElemenxNative;
		delete window.Capacitor;

		Array.prototype.forEach.call(document.querySelectorAll('.elemenx-native-picker'), function (input) {
			input.remove();
		});
	});

	it('opens files with the picker of its web view, the bridge having no handler for them', function () {
		var clicked = null;
		var click = HTMLInputElement.prototype.click;

		program({Filesystem: filesystem});

		HTMLInputElement.prototype.click = function () {
			clicked = this;
		};

		try {
			native.Open({Accept: ['.txt'], Multiple: true}, function () {});
		}
		finally {
			HTMLInputElement.prototype.click = click;
		}

		expect(window.ElemenxNative.Can('open')).toBe(false);
		expect(clicked).not.toBe(null);
		expect(clicked.type).toBe('file');
		expect(clicked.accept).toBe('.txt');
		expect(clicked.multiple).toBe(true);
	});

	it('saves a text or a binary file in the Documents of the device and gives its path', async function () {
		var results = [];

		program({Filesystem: filesystem});

		expect(native.Has('files')).toBe(true);

		await new Promise(function (resolve) {
			native.Save({Name: 'notes/today.txt', Text: 'Hello'}, function (error, result) {
				results.push([error, result]);

				native.Save({Name: 'a:b.bin', Data: 'AAEC'}, function (again, other) {
					results.push([again, other]);

					resolve();
				});
			});
		});

		expect(written).toEqual([
			{path: 'notes/today.txt', directory: 'DOCUMENTS', recursive: true, data: 'Hello', encoding: 'utf8'},
			{path: 'a-b.bin', directory: 'DOCUMENTS', recursive: true, data: 'AAEC'}
		]);
		expect(results).toEqual([
			[null, {Path: 'file:///storage/emulated/0/Documents/notes/today.txt'}],
			[null, {Path: 'file:///storage/emulated/0/Documents/a-b.bin'}]
		]);
	});

	it('hides the screen of the system once the page shows, with @capacitor/splash-screen', function () {
		var hidden = [];

		program({SplashScreen: {hide: function (options) {
			hidden.push(options);

			return Promise.resolve();
		}}});

		expect(hidden).toEqual([{fadeOutDuration: 0}]);
	});

	it('names the plugin to install when a program without @capacitor/filesystem saves', async function () {
		var failure = await new Promise(function (resolve) {
			program({});

			native.Save({Name: 'x.txt', Text: 'x'}, function (error) {
				resolve(error);
			});
		});

		expect(failure.message).toBe('Elemenx Native feature is off: save (install @capacitor/filesystem)');
	});
});
