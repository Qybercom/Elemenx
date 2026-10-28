import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

/* An instance of a Component of the Library in a box of width pixels; its events in events. */
function make (name, props, width, events) {
	var component = Elemenx.Component(name)(props);
	var box = document.createElement('div');

	box.style.width = width + 'px';

	owned.push(component);

	Object.keys(events || {}).forEach(function (event) {
		component.$On(event, events[event]);
	});

	box.appendChild(component.$Element());
	document.getElementById('mount').appendChild(box);

	return component;
}

/* A WAV file of a tone: 16-bit mono, its amplitude from 0 to 1, louder in its second half when grow is set. */
function wav (seconds, frequency, amplitude, grow) {
	var rate = 8000;
	var count = Math.round(seconds * rate);
	var buffer = new ArrayBuffer(44 + count * 2);
	var view = new DataView(buffer);
	var i;

	function text (at, value) {
		for (var k = 0; k < value.length; k++) view.setUint8(at + k, value.charCodeAt(k));
	}

	text(0, 'RIFF');

	view.setUint32(4, 36 + count * 2, true);

	text(8, 'WAVE');
	text(12, 'fmt ');

	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, 1, true);
	view.setUint32(24, rate, true);
	view.setUint32(28, rate * 2, true);
	view.setUint16(32, 2, true);
	view.setUint16(34, 16, true);

	text(36, 'data');

	view.setUint32(40, count * 2, true);

	for (i = 0; i < count; i++) {
		var level = grow && i >= count / 2 ? amplitude : grow ? amplitude / 4 : amplitude;

		view.setInt16(44 + i * 2, Math.round(Math.sin(i / rate * frequency * Math.PI * 2) * level * 32767), true);
	}

	return buffer;
}

function decode (source) {
	return new Promise(function (resolve, reject) {
		Elemenx.Service('Audio').Decode(source, function (error, buffer) {
			if (error) reject(error);
			else resolve(buffer);
		});
	});
}

/* The count of the pixels of a canvas that are drawn. */
function inked (canvas) {
	var data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
	var count = 0;
	var i;

	for (i = 3; i < data.length; i += 4) {
		if (data[i] > 0)
			count++;
	}

	return count;
}

function pointer (target, type, x, y) {
	target.dispatchEvent(new PointerEvent(type, {bubbles: true, clientX: x, clientY: y, button: 0, pointerId: 1}));
}

/* The Audio Service (Web Audio) and the components that show a sound: Spectrum, live, and Waveform, of a file. */
describe('Contract: the Audio Service, Spectrum and Waveform', function () {
	var oscillator = null;

	beforeAll(async function () {
		await loadElemenx();

		Use(['Spectrum', 'Waveform', 'service:Audio']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();

		if (oscillator) {
			oscillator.stop();
			oscillator = null;
		}
	});

	function tone (frequency) {
		var context = Elemenx.Service('Audio').Context();

		oscillator = context.createOscillator();
		oscillator.frequency.value = frequency;

		oscillator.start();

		return oscillator;
	}

	it('hears a tone: its band is the loudest, its loudness is there, one node for an element for good', async function () {
		var audio = Elemenx.Service('Audio');
		var context = audio.Context();
		var analyser;
		var bands;
		var element = document.createElement('audio');

		expect(audio.Supported()).toBe(true);
		expect(audio.Context()).toBe(context);

		await context.resume();

		analyser = audio.Analyser(tone(1060), {Size: 4096, Smoothing: 0});

		/* 32 linear bands from 1 to 4001 Hz, 125 Hz each: 1060 Hz is in the ninth (from 1001 to 1126). */
		bands = await waitFor(function () {
			var now = audio.Bands(analyser, 32, {Scale: 'linear', MinFrequency: 1, MaxFrequency: 4001});

			return Math.max.apply(null, now) > 0.5 ? now : null;
		}, 3000);

		expect(bands.indexOf(Math.max.apply(null, bands))).toBe(8);
		expect(audio.Levels(analyser).Peak).toBeGreaterThan(0.5);

		/* The log scale gives the low bands more of its width: 1060 Hz past the middle of 30 to 16000 (945 to 1294). */
		var logs = audio.Bands(analyser, 20, {MinFrequency: 30, MaxFrequency: 16000});

		expect(logs.indexOf(Math.max.apply(null, logs))).toBe(11);

		audio.Release(analyser);
		audio.Release(analyser);

		expect(audio.Node(element)).toBe(audio.Node(element));
		expect(function () {
			audio.Node({});
		}).toThrow('Elemenx Audio.Node expects an AudioNode, a media element or a MediaStream');
	});

	it('reads a sound file from an ArrayBuffer, a Blob and a URL, and gives its shape', async function () {
		var audio = Elemenx.Service('Audio');
		var data = wav(1, 440, 0.8, true);
		var buffer = await decode(data);
		var url = URL.createObjectURL(new Blob([data], {type: 'audio/wav'}));
		var peaks;

		expect(buffer.duration).toBeCloseTo(1, 2);
		expect((await decode(new Blob([data]))).length).toBe(buffer.length);
		expect((await decode(url)).length).toBe(buffer.length);
		expect(await decode(buffer)).toBe(buffer);

		URL.revokeObjectURL(url);

		peaks = audio.Peaks(buffer, 4);

		expect(peaks.length).toBe(4);
		expect(peaks[0].Max).toBeCloseTo(0.2, 1);
		expect(peaks[3].Max).toBeCloseTo(0.8, 1);
		expect(peaks[3].Min).toBeCloseTo(-0.8, 1);

		/* A part of it: the second half alone. */
		expect(audio.Peaks(buffer, 1, 0.5, 1)[0].Max).toBeCloseTo(0.8, 1);

		await expect(decode(new ArrayBuffer(16))).rejects.toBeTruthy();
		await expect(decode(42)).rejects.toThrow('Elemenx Audio.Decode expects a URL, a Blob, an ArrayBuffer or an AudioBuffer');
	});

	it('Spectrum draws levels given, or hears its Source live, and stops while Paused', async function () {
		var errors = [];
		var given = make('Spectrum', {Values: [0.25, 0.5, 1, 0.1], Bands: 4, Gap: 4}, 320);
		var live = null;
		var host = Elemenx.Component(unique('SpectrumHost'), {
			$Template: '<div style="width: 320px"><Spectrum [source]="Source" [paused]="Paused" Bands="16" Scale="linear" MinFrequency="1" MaxFrequency="4001" (ready)="Ready" (error)="Failed" /></div>',
			Source: null,
			Paused: false,
			Ready: function (instance) {
				live = instance;
			},
			Failed: function (error) {
				errors.push(error);
			}
		})();
		var spectrum = given.$Element();

		owned.push(host);

		document.getElementById('mount').appendChild(host.$Element());

		var canvas = spectrum.querySelector('canvas');
		var levels;

		expect(spectrum.getAttribute('class')).toContain('mode-bars');
		expect(canvas.getAttribute('aria-label')).toBe('Spectrum');

		await waitFor(function () {
			return inked(canvas) > 0;
		});

		/* Four bars of 77 pixels: the third is the full height, the first a quarter of it. */
		var ratio = canvas.width / 320;
		var context = canvas.getContext('2d');

		expect(context.getImageData(Math.round(200 * ratio), Math.round(2 * ratio), 1, 1).data[3]).toBeGreaterThan(0);
		expect(context.getImageData(Math.round(40 * ratio), Math.round(60 * ratio), 1, 1).data[3]).toBe(0);
		expect(context.getImageData(Math.round(40 * ratio), Math.round(100 * ratio), 1, 1).data[3]).toBeGreaterThan(0);

		for (var mode of ['mirror', 'line', 'radial']) {
			given.Mode = mode;

			await tick();

			expect(spectrum.getAttribute('class')).toContain('mode-' + mode);
			expect(inked(canvas)).toBeGreaterThan(0);
		}

		await Elemenx.Service('Audio').Context().resume();

		await waitFor(function () {
			return live;
		});

		host.Source = tone(1060);

		levels = await waitFor(function () {
			var now = live.Levels();

			return now.length === 16 && Math.max.apply(null, now) > 0.5 ? now : null;
		}, 3000);

		/* 1060 Hz of 1 to 4001 in 16 bands of 250 Hz: the fifth (1001 to 1251). */
		expect(levels.indexOf(Math.max.apply(null, levels))).toBe(4);

		host.Paused = true;

		await tick();

		oscillator.frequency.value = 3120;

		await new Promise(function (resolve) {
			setTimeout(resolve, 250);
		});

		expect(live.Levels()).toEqual(levels);

		/* Heard again: 3120 Hz is in the thirteenth (3001 to 3251). */
		host.Paused = false;

		await waitFor(function () {
			var now = live.Levels();

			return now.indexOf(Math.max.apply(null, now)) === 12;
		}, 3000);

		host.Source = {};

		await waitFor(function () {
			return errors.length;
		});

		expect(errors[0].message).toBe('Elemenx Audio.Node expects an AudioNode, a media element or a MediaStream');
		expect(given.Levels()).toEqual([0.25, 0.5, 1, 0.1]);
	});

	it('Waveform reads its file, moves its playhead, selects a part by a drag and by the keys', async function () {
		var events = [];
		var url = URL.createObjectURL(new Blob([wav(2, 220, 0.9, true)], {type: 'audio/wav'}));
		var record = function (name) {
			return function (value) {
				events.push([name, value]);
			};
		};
		var wave = make('Waveform', {Src: url, Height: 80}, 400, {load: record('load'), seek: record('seek'), select: record('select')});
		var root = wave.$Element();
		var canvas;
		var rect;

		await waitFor(function () {
			return events.length;
		}, 3000);

		expect(events[0][0]).toBe('load');
		expect(events[0][1]).toMatchObject({Channels: 1});
		expect(events[0][1].Duration).toBeCloseTo(2, 2);

		await tick();

		expect(root.getAttribute('role')).toBe('slider');
		expect(root.getAttribute('aria-valuemax')).toBe('2');

		canvas = root.querySelector('canvas');
		rect = canvas.getBoundingClientRect();

		await waitFor(function () {
			return inked(canvas) > 0;
		});

		/* Its second half is louder: the bars there are taller. */
		var ratio = canvas.width / rect.width;
		var context = canvas.getContext('2d');

		expect(context.getImageData(Math.round(300 * ratio), Math.round(8 * ratio), 1, 1).data[3]).toBeGreaterThan(0);
		expect(context.getImageData(Math.round(100 * ratio), Math.round(20 * ratio), 1, 1).data[3]).toBe(0);

		/* A press moves the playhead. */
		pointer(canvas, 'pointerdown', rect.left + rect.width / 4, rect.top + 10);
		pointer(canvas, 'pointerup', rect.left + rect.width / 4, rect.top + 10);

		expect(events[1][0]).toBe('seek');
		expect(events[1][1]).toBeCloseTo(0.5, 1);

		await tick();

		expect(root.querySelector('.elemenx-waveform-time').textContent).toBe('0:00.5 / 0:02.0');

		/* A drag selects. */
		pointer(canvas, 'pointerdown', rect.left + rect.width / 2, rect.top + 10);
		pointer(canvas, 'pointermove', rect.left + rect.width * 0.75, rect.top + 10);
		pointer(canvas, 'pointerup', rect.left + rect.width * 0.75, rect.top + 10);

		expect(events[2][0]).toBe('select');
		expect(events[2][1].Start).toBeCloseTo(1, 1);
		expect(events[2][1].End).toBeCloseTo(1.5, 1);

		await tick();

		expect(root.querySelector('.elemenx-waveform-selection').textContent).toBe('0:01.0 – 0:01.5');

		/* The keys: a second on, to the end of the selection; Shift from there moves that end; Escape takes it away; End. */
		wave.Seek(0.5);

		events.length = 3;

		root.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true}));

		expect(events[3]).toEqual(['seek', 1.5]);

		root.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowLeft', shiftKey: true, bubbles: true}));

		expect(events[4][0]).toBe('select');
		expect(events[4][1].Start).toBeCloseTo(0.5, 1);
		expect(events[4][1].End).toBeCloseTo(1, 1);
		expect(events[5]).toEqual(['seek', 0.5]);

		root.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
		root.dispatchEvent(new KeyboardEvent('keydown', {key: 'End', bubbles: true}));

		expect(events.slice(6).map(function (entry) {
			return entry[0] === 'seek' ? entry[1].toFixed(2) : entry[1];
		})).toEqual([null, '2.00']);

		URL.revokeObjectURL(url);
	});

	it('Waveform draws the Peaks it is given and follows the element of Media', async function () {
		var url = URL.createObjectURL(new Blob([wav(3, 330, 0.5, false)], {type: 'audio/wav'}));
		var media = document.createElement('audio');
		var wave;
		var given;

		media.src = url;

		document.body.appendChild(media);

		await new Promise(function (resolve) {
			media.addEventListener('loadedmetadata', resolve, {once: true});
		});

		wave = make('Waveform', {Media: media, Mode: 'wave'}, 300);
		given = make('Waveform', {Peaks: [0.2, 1, {Min: -0.5, Max: 0.5}], Duration: 10, Time: 5}, 300);

		await waitFor(function () {
			return wave.Duration > 2.9 && wave.Buffer();
		}, 3000);

		await waitFor(function () {
			return inked(wave.$Element().querySelector('canvas')) > 0 && inked(given.$Element().querySelector('canvas')) > 0;
		});

		expect(given.Columns(3)).toEqual([{Min: -0.2, Max: 0.2}, {Min: -1, Max: 1}, {Min: -0.5, Max: 0.5}]);

		/* The element moves, the playhead follows; the playhead moves, the element follows. */
		media.currentTime = 1.5;

		await waitFor(function () {
			return Math.abs(wave.Time - 1.5) < 0.05;
		}, 3000);

		wave.Seek(2.25);

		expect(media.currentTime).toBeCloseTo(2.25, 1);

		media.remove();

		URL.revokeObjectURL(url);
	});
});
