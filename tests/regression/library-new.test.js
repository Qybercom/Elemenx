import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('NewHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

/* The Components of ElemenxUI added in round 19: SplitButton and the others. */
describe('Contract: the new Components of ElemenxUI', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['SplitButton', 'MenuItem', 'Accordion', 'Section', 'Countdown', 'Clock', 'Consent', 'service:Consents', 'DiffView', 'service:Diff', 'SignaturePad', 'ImageCropper', 'QRCode', 'QRScanner', 'service:QR', 'FileBrowser', 'service:Format', 'MediaPlayer', 'MenuList', 'service:PictureInPicture']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('SplitButton: the main button emits click, the arrow opens the menu of Items and declared MenuItems, an item emits select', async function () {
		var events = [];
		var host = mount('<div><SplitButton Label="Save" [items]="Items" (click)="Saved" (select)="Picked"><MenuItem ID="pdf" Label="Export PDF" /></SplitButton></div>', {
			Items: [{ID: 'copy', Label: 'Save a copy'}],
			Saved: function () {
				events.push('click');
			},
			Picked: function (item) {
				events.push('select ' + item.ID);
			}
		});
		var root = host.$Element();
		var main = root.querySelector('.elemenx-split-button-main');
		var arrow = root.querySelector('.elemenx-split-button-arrow');

		expect(main.textContent.trim()).toBe('Save');
		expect(arrow.getAttribute('aria-label')).toBe('More actions');
		expect(arrow.getAttribute('aria-expanded')).toBe('false');

		main.click();

		expect(events).toEqual(['click']);

		arrow.click();

		await tick();

		expect(arrow.getAttribute('aria-expanded')).toBe('true');

		var options = Array.prototype.map.call(root.querySelectorAll('.elemenx-menu:not([hidden]) > .elemenx-menu-entry > .elemenx-option'), function (option) {
			return option.textContent.trim();
		});

		expect(options).toEqual(['Save a copy', 'Export PDF']);

		root.querySelectorAll('.elemenx-menu:not([hidden]) > .elemenx-menu-entry > .elemenx-option')[1].click();

		await tick();

		expect(events).toEqual(['click', 'select pdf']);
		expect(arrow.getAttribute('aria-expanded')).toBe('false');
	});

	it('Accordion keeps one section open: opening one folds the others, each with its toggle', function () {
		var toggles = [];
		var host = mount('<div><Accordion><Section Title="One" Collapsible="true" Collapsed="true" (toggle)="One">1</Section><Section Title="Two" Collapsible="true" Collapsed="true" (toggle)="Two">2</Section></Accordion></div>', {
			One: function (collapsed) {
				toggles.push('one ' + collapsed);
			},
			Two: function (collapsed) {
				toggles.push('two ' + collapsed);
			}
		});
		var buttons = host.$Element().querySelectorAll('.elemenx-section-toggle');

		buttons[0].click();

		expect(toggles).toEqual(['one false']);

		buttons[1].click();

		expect(toggles).toEqual(['one false', 'two false', 'one true']);
		expect(Array.prototype.map.call(host.$Element().querySelectorAll('.elemenx-section-toggle'), function (button) {
			return button.getAttribute('aria-expanded');
		})).toEqual(['false', 'true']);
	});

	it('Countdown shows the time left in its units, waits while not Running, and emits end once at 0', async function () {
		var ends = 0;
		var paused = mount('<div><Countdown Duration="5430" Running="false"></Countdown></div>');
		var parts = function (root) {
			return Array.prototype.map.call(root.querySelectorAll('.elemenx-countdown-part'), function (part) {
				return part.textContent.replace(/\s+/g, ' ').trim();
			});
		};

		expect(parts(paused.$Element())).toEqual(['1 hour', '30 minutes', '30 seconds']);

		await tick(1100);

		expect(parts(paused.$Element())).toEqual(['1 hour', '30 minutes', '30 seconds']);

		var running = mount('<div><Countdown [to]="To" Compact="true" (end)="Ended"></Countdown></div>', {
			To: Date.now() + 600,
			Ended: function () {
				ends++;
			}
		});

		expect(running.$Element().querySelector('.elemenx-countdown-line').textContent).toBe('0:01');

		await tick(1200);

		expect(running.$Element().querySelector('.elemenx-countdown-line').textContent).toBe('0:00');
		expect(running.$Element().querySelector('.elemenx-countdown').classList.contains('ended')).toBe(true);
		expect(ends).toBe(1);
	});

	it('Clock shows the time of its zone, digital or analog, and a zone the browser does not know is the one of the device', function () {
		var now = Date.now();
		var digital = mount('<div><Clock TimeZone="UTC" Hour12="false" Label="London"></Clock></div>');
		var expected = new Intl.DateTimeFormat(Elemenx.Locale.Language(), {timeZone: 'UTC', hour12: false, hour: 'numeric', minute: '2-digit'}).format(new Date(now));

		expect(digital.$Element().querySelector('.elemenx-clock-time').textContent).toBe(expected);
		expect(digital.$Element().querySelector('.elemenx-clock-label').textContent).toBe('London');

		var analog = mount('<div><Clock Mode="analog" Seconds="true" TimeZone="Nowhere/Never"></Clock></div>');

		expect(analog.$Element().querySelectorAll('.elemenx-clock-mark').length).toBe(12);
		expect(analog.$Element().querySelector('.elemenx-clock-hour').getAttribute('transform')).toMatch(/^rotate\([\d.]+ 50 50\)$/);
		expect(analog.$Element().querySelector('.elemenx-clock-second')).not.toBe(null);
	});

	it('Consent asks while no decision of its version is kept, keeps the choices in Consents and asks again for a new version', async function () {
		var key = unique('consent');
		var changes = [];
		var host = mount('<div><Consent Placement="inline" [key]="Key" [version]="Version" [purposes]="Purposes" (change)="Changed">We use cookies.</Consent></div>', {
			Key: key,
			Version: '1',
			Purposes: [{ID: 'necessary', Label: 'Necessary', Required: true}, {ID: 'analytics', Label: 'Analytics'}, {ID: 'ads', Label: 'Ads'}],
			Changed: function (decision) {
				changes.push(decision.Choices);
			}
		});
		var consents = host.$Service('Consents');
		var root = host.$Element().querySelector('.elemenx-consent');
		var press = function (label) {
			Array.prototype.filter.call(root.querySelectorAll('button'), function (button) {
				return button.textContent.trim() === label;
			})[0].click();
		};

		expect(root.hidden).toBe(false);
		expect(root.textContent).toContain('We use cookies.');

		press('Customize');

		await tick();

		var switches = root.querySelectorAll('.elemenx-consent-purpose input');

		expect(switches[0].disabled).toBe(true);
		expect(switches[0].checked).toBe(true);

		switches[1].click();

		press('Save choices');

		await tick();

		expect(changes).toEqual([{necessary: true, analytics: true, ads: false}]);
		expect(root.hidden).toBe(true);
		expect(consents.Granted(key, 'analytics')).toBe(true);
		expect(consents.Granted(key, 'ads')).toBe(false);

		host.Version = '2';

		await tick();

		expect(root.hidden).toBe(false);

		press('Reject');

		await tick();

		expect(changes[1]).toEqual({necessary: true, analytics: false, ads: false});
		expect(consents.Get(key).Version).toBe('2');

		consents.Clear(key);

		await tick();

		expect(root.hidden).toBe(false);
	});

	it('DiffView shows the lines removed and added with the words that changed, folds the unchanged runs and opens them', async function () {
		var before = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'total = 1;', 'end'].join('\n');
		var after = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'total = 2;', 'end', 'more'].join('\n');
		var host = mount('<div><DiffView [before]="Before" [after]="After" Context="1" Title="file.js" [mode]="Mode"></DiffView></div>', {Before: before, After: after, Mode: 'unified'});
		var root = host.$Element();

		expect(root.querySelector('.elemenx-diff-stats').textContent.replace(/\s+/g, ' ').trim()).toBe('+2 −1');
		expect(root.querySelector('.elemenx-diff-fold').textContent).toBe('Show 7 unchanged lines');
		expect(Array.prototype.map.call(root.querySelectorAll('.elemenx-diff-row.remove .elemenx-diff-word, .elemenx-diff-row.add .elemenx-diff-word'), function (word) {
			return word.textContent;
		})).toEqual(['1', '2']);

		root.querySelector('.elemenx-diff-fold').click();

		await tick();

		expect(root.querySelector('.elemenx-diff-fold')).toBe(null);
		expect(root.querySelectorAll('.elemenx-diff-row.same').length).toBe(9);

		host.Mode = 'split';

		await tick();

		var changed = root.querySelector('.elemenx-diff-side.remove').parentNode;

		expect(changed.querySelector('.elemenx-diff-side.add .elemenx-diff-text').textContent).toBe('total = 2;');
		expect(root.querySelector('.elemenx-diff-side.empty')).not.toBe(null);
	});

	it('SignaturePad draws a stroke of the pointer, emits change with the strokes, undoes, clears and gives a picture and an SVG', async function () {
		var changes = [];
		var host = mount('<div style="width: 300px"><SignaturePad Height="120" (change)="Changed"></SignaturePad></div>', {
			Changed: function (value) {
				changes.push(value.length);
			}
		});
		var pad = host.$Element().querySelector('.elemenx-signature-pad');
		var canvas = pad.querySelector('canvas');
		var rect = canvas.getBoundingClientRect();
		var pointer = function (type, x, y) {
			canvas.dispatchEvent(new PointerEvent(type, {bubbles: true, clientX: rect.left + x, clientY: rect.top + y, pointerId: 1, pointerType: 'mouse', button: 0}));
		};
		var undo = function () {
			return Array.prototype.filter.call(pad.querySelectorAll('button'), function (button) {
				return button.textContent.trim() === 'Undo';
			})[0];
		};

		expect(pad.classList.contains('empty')).toBe(true);
		expect(undo().disabled).toBe(true);

		pointer('pointerdown', 20, 60);
		pointer('pointermove', 60, 40);
		pointer('pointermove', 120, 80);
		pointer('pointerup', 120, 80);
		pointer('pointerdown', 150, 60);
		pointer('pointerup', 150, 60);

		await tick();

		expect(changes).toEqual([1, 2]);
		expect(pad.classList.contains('empty')).toBe(false);
		expect(canvas.width).toBeGreaterThan(0);

		var direct = Elemenx.Component('SignaturePad')({Height: 120, Value: [[{X: 10, Y: 10, P: 0.5}, {X: 40, Y: 30, P: 0.5}], [{X: 60, Y: 20, P: 0.5}]]});

		owned.push(direct);

		document.getElementById('mount').appendChild(direct.$Element());

		direct.Draw();

		expect(direct.SVG()).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"[^>]*><g [^>]*><path d="M10 10L40 30" stroke-width="[\d.]+"\/><circle cx="60" cy="20" r="[\d.]+" fill="[^"]+"\/><\/g><\/svg>$/);
		expect(direct.Image()).toMatch(/^data:image\/png;base64,/);

		direct.Clear();

		expect(direct.SVG()).toBe('');
		expect(direct.Image()).toBe('');

		undo().click();

		await tick();

		expect(changes).toEqual([1, 2, 1]);
	});

	it('ImageCropper puts a frame of its shape in the middle, moves and resizes it inside the picture, by the pointer and by the keys', async function () {
		var canvas = document.createElement('canvas');
		var changes = [];
		var loaded = null;

		canvas.width = 200;
		canvas.height = 100;

		canvas.getContext('2d').fillRect(0, 0, 200, 100);

		var host = mount('<div style="width: 400px"><ImageCropper [src]="Src" Aspect="1" Height="200" MinSize="20" (change)="Changed" (load)="Loaded"></ImageCropper></div>', {
			Src: canvas.toDataURL(),
			Changed: function (value) {
				changes.push(value);
			},
			Loaded: function (size) {
				loaded = size;
			}
		});

		await waitFor(function () {
			return loaded !== null;
		});

		await tick();

		var box = host.$Element().querySelector('.elemenx-cropper-box');
		var handle = box.querySelector('.elemenx-cropper-handle.se');
		var at = function (node) {
			var rect = node.getBoundingClientRect();

			return {X: rect.left + rect.width / 2, Y: rect.top + rect.height / 2};
		};
		var drag = function (node, dx, dy) {
			var start = at(node);

			node.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, clientX: start.X, clientY: start.Y, pointerId: 1, button: 0}));
			node.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: start.X + dx, clientY: start.Y + dy, pointerId: 1}));
			node.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, clientX: start.X + dx, clientY: start.Y + dy, pointerId: 1}));
		};

		expect(loaded).toEqual({Width: 200, Height: 100});
		expect(box.getAttribute('aria-label')).toBe('Crop: 90 × 90');

		/* The picture shows at its size (never larger): the frame moves by the pointer and stops at the side of the picture. */
		drag(box, 40, 400);

		await tick();

		expect(changes[changes.length - 1]).toEqual({X: 95, Y: 10, Width: 90, Height: 90});

		/* A corner keeps the square: the side dragged most leads. */
		drag(handle, -40, -80);

		await tick();

		expect(changes[changes.length - 1]).toEqual({X: 95, Y: 10, Width: 50, Height: 50});

		box.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowLeft', bubbles: true}));
		box.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', shiftKey: true, altKey: true, bubbles: true}));

		await tick();

		expect(changes[changes.length - 1]).toEqual({X: 94, Y: 5, Width: 60, Height: 60});
	});

	it('QRCode draws the modules of its text, and tells once that a text is too long', async function () {
		var errors = 0;
		var host = mount('<div><QRCode [value]="Text" Level="H" Size="120" (error)="Failed"></QRCode></div>', {
			Text: 'https://example.com',
			Failed: function () {
				errors++;
			}
		});
		var code = host.$Service('QR').Encode('https://example.com', 'H');
		var root = host.$Element().querySelector('.elemenx-qr-code');
		var dark = 0;

		code.Modules.forEach(function (row) {
			row.forEach(function (module) {
				if (module)
					dark++;
			});
		});

		expect(root.getAttribute('aria-label')).toBe('QR code: https://example.com');
		expect(root.querySelector('svg').getAttribute('viewBox')).toBe('0 0 ' + (code.Size + 8) + ' ' + (code.Size + 8));

		/*
		 * A square for each dark module but the ones of the three eyes (33 each: a ring of 24 and a center of 9), which
		 * are drawn whole in two paths of their own: their frames and their balls.
		 */
		var paths = root.querySelectorAll('path');

		expect(paths.length).toBe(3);
		expect(paths[0].getAttribute('d').split('z').length - 1).toBe(dark - 3 * 33);
		expect(paths[1].getAttribute('d').split('z').length - 1).toBe(6);
		expect(paths[2].getAttribute('d').split('z').length - 1).toBe(3);

		host.Text = 'x'.repeat(2000);

		await tick(20);

		host.Text = 'x'.repeat(2000) + ' ';

		await tick(20);

		expect(root.innerHTML).toBe('');
		expect(errors).toBe(2);
	});

	it('QRScanner reads a code from the camera through BarcodeDetector, and without it says so and shows its content', async function () {
		var Detector = window.BarcodeDetector;
		var media = navigator.mediaDevices.getUserMedia;
		var canvas = document.createElement('canvas');
		var scans = [];
		var errors = [];

		canvas.width = 64;
		canvas.height = 64;

		canvas.getContext('2d').fillRect(0, 0, 10, 10);

		window.BarcodeDetector = function (options) {
			this.Formats = options.formats;
		};
		window.BarcodeDetector.prototype.detect = function () {
			return Promise.resolve([{rawValue: 'ORDER-42', format: 'qr_code'}]);
		};
		navigator.mediaDevices.getUserMedia = function () {
			return Promise.resolve(canvas.captureStream());
		};

		try {
			var host = mount('<div><QRScanner (scan)="Scanned"></QRScanner></div>', {
				Scanned: function (code) {
					scans.push(code);
				}
			});

			await waitFor(function () {
				return scans.length > 0;
			});

			expect(scans).toEqual([{Value: 'ORDER-42', Format: 'qr_code'}]);
			expect(host.$Element().querySelector('.elemenx-qr-scanner').classList.contains('done')).toBe(true);
			expect(host.$Element().querySelector('video').srcObject).toBe(null);
		}
		finally {
			window.BarcodeDetector = Detector;
			navigator.mediaDevices.getUserMedia = media;
		}

		delete window.BarcodeDetector;

		try {
			var bare = mount('<div><QRScanner (error)="Failed"><input class="typed" placeholder="Code"></QRScanner></div>', {
				Failed: function (error) {
					errors.push(error.Reason);
				}
			});

			expect(errors).toEqual(['unsupported']);
			expect(bare.$Element().querySelector('.elemenx-qr-scanner-problem').textContent).toBe('This browser cannot read codes from the camera.');
			expect(bare.$Element().querySelector('.elemenx-qr-scanner-fallback .typed')).not.toBe(null);
		}
		finally {
			if (Detector)
				window.BarcodeDetector = Detector;
		}
	});

	it('FileBrowser opens folders and files, loads a folder not loaded, sorts, selects with Ctrl and Shift, and follows the keys', async function () {
		var events = [];
		var host = mount('<div><FileBrowser [items]="Items" (navigate)="Went" (open)="Opened" (load)="Load" (select)="Chose"></FileBrowser></div>', {
			Items: [
				{ID: 'b.txt', Name: 'b.txt', Size: 2048},
				{ID: 'docs', Name: 'Docs', Items: [{ID: 'cv', Name: 'cv.pdf', Size: 100}]},
				{ID: 'a.png', Name: 'a.png', Size: 4096},
				{ID: 'later', Name: 'Later', Items: null}
			],
			Went: function (event) {
				events.push('navigate ' + event.Path.join('/'));
			},
			Opened: function (item) {
				events.push('open ' + item.ID);
			},
			Load: function (event) {
				events.push('load ' + event.Folder.ID);
			},
			Chose: function (items) {
				events.push('select ' + items.map(function (item) {
					return item.ID;
				}).join(','));
			}
		});
		var root = host.$Element();
		var names = function () {
			return Array.prototype.map.call(root.querySelectorAll('.elemenx-file-browser-name'), function (node) {
				return node.textContent;
			});
		};
		var row = function (id) {
			return root.querySelector('.elemenx-file-browser-item[data-id="' + id + '"]');
		};

		expect(names()).toEqual(['Docs', 'Later', 'a.png', 'b.txt']);
		expect(row('b.txt').querySelector('.elemenx-file-browser-size').textContent).toBe('2 kB');

		root.querySelector('.elemenx-file-browser-sort.size').click();

		await tick();

		expect(names()).toEqual(['Docs', 'Later', 'b.txt', 'a.png']);

		row('b.txt').click();
		row('a.png').dispatchEvent(new MouseEvent('click', {bubbles: true, ctrlKey: true}));
		row('docs').dispatchEvent(new MouseEvent('click', {bubbles: true, shiftKey: true}));

		await tick();

		expect(events).toEqual(['select b.txt', 'select b.txt,a.png', 'select docs,later,b.txt,a.png']);
		expect(root.querySelectorAll('.elemenx-file-browser-item.selected').length).toBe(4);

		row('a.png').dispatchEvent(new MouseEvent('dblclick', {bubbles: true}));
		row('docs').dispatchEvent(new MouseEvent('dblclick', {bubbles: true}));

		await tick();

		expect(names()).toEqual(['cv.pdf']);
		expect(root.querySelector('.elemenx-file-browser-path').textContent).toContain('Docs');

		row('cv').focus();
		row('cv').dispatchEvent(new KeyboardEvent('keydown', {key: 'Backspace', bubbles: true}));

		await tick();

		row('later').dispatchEvent(new MouseEvent('dblclick', {bubbles: true}));

		await tick();

		expect(events.slice(3)).toEqual(['open a.png', 'select ', 'navigate docs', 'navigate ', 'navigate later', 'load later']);
		expect(root.querySelector('.elemenx-file-browser-empty .elemenx-spinner')).not.toBe(null);
	});

	it('MediaPlayer loads the sound, shows its time, mutes, changes the speed and follows the keys', async function () {
		var rate = 8000;
		var length = rate * 2;
		var bytes = new Uint8Array(44 + length);
		var view = new DataView(bytes.buffer);
		var text = function (at, value) {
			for (var i = 0; i < value.length; i++)
				bytes[at + i] = value.charCodeAt(i);
		};
		var volumes = [];

		text(0, 'RIFF');

		view.setUint32(4, 36 + length, true);

		text(8, 'WAVEfmt ');

		view.setUint32(16, 16, true);
		view.setUint16(20, 1, true);
		view.setUint16(22, 1, true);
		view.setUint32(24, rate, true);
		view.setUint32(28, rate, true);
		view.setUint16(32, 1, true);
		view.setUint16(34, 8, true);

		text(36, 'data');

		view.setUint32(40, length, true);

		bytes.fill(128, 44);

		var host = mount('<div><MediaPlayer Kind="audio" Title="Silence" [src]="Src" (volume)="Volumed"></MediaPlayer></div>', {
			Src: URL.createObjectURL(new Blob([bytes], {type: 'audio/wav'})),
			Volumed: function (event) {
				volumes.push(event.Muted);
			}
		});
		var root = host.$Element().querySelector('.elemenx-media-player');
		var audio = root.querySelector('audio');

		await waitFor(function () {
			return root.querySelector('.elemenx-media-time').textContent === '0:00 / 0:02';
		});

		expect(root.querySelector('.elemenx-media-title').textContent).toBe('Silence');
		expect(root.querySelector('video')).toBe(null);

		root.querySelector('[aria-label="Mute"]').click();

		await waitFor(function () {
			return volumes.length === 1;
		});

		expect(audio.muted).toBe(true);
		expect(root.querySelector('[aria-label="Unmute"]').getAttribute('aria-pressed')).toBe('true');

		root.dispatchEvent(new KeyboardEvent('keydown', {key: 'm', bubbles: true}));

		await waitFor(function () {
			return volumes.length === 2;
		});

		expect(volumes).toEqual([true, false]);

		root.querySelector('.elemenx-media-button.text').click();

		await tick();

		Array.prototype.filter.call(root.querySelectorAll('.elemenx-option'), function (option) {
			return option.textContent.trim() === '1.5×';
		})[0].click();

		await tick();

		expect(audio.playbackRate).toBe(1.5);
		expect(root.querySelector('.elemenx-media-button.text').textContent).toBe('1.5×');

		root.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true}));

		await tick();

		expect(audio.currentTime).toBe(2);
	});
});

