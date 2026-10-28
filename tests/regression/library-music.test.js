import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('MusicHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

/* A WAV file of a tone: 16-bit mono at 22050 Hz. */
function wav (seconds, frequency) {
	var rate = 22050;
	var count = Math.round(seconds * rate);
	var buffer = new ArrayBuffer(44 + count * 2);
	var view = new DataView(buffer);
	var i;

	function text (at, value) {
		for (var k = 0; k < value.length; k++) view.setUint8(at + k, value.charCodeAt(k));
	}

	text(0, 'RIFF');

	view.setUint32(4, 36 + count * 2, true);

	text(8, 'WAVEfmt ');

	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, 1, true);
	view.setUint32(24, rate, true);
	view.setUint32(28, rate * 2, true);
	view.setUint16(32, 2, true);
	view.setUint16(34, 16, true);

	text(36, 'data');

	view.setUint32(40, count * 2, true);

	for (i = 0; i < count; i++) view.setInt16(44 + i * 2, Math.round(Math.sin(i / rate * frequency * Math.PI * 2) * 0.8 * 32767), true);

	return buffer;
}

/* A pointer event on target; on what is at the point, for a target of 'point'. */
function pointer (target, type, x, y, extra) {
	if (target === 'point')
		target = document.elementFromPoint(x, y);

	target.dispatchEvent(new PointerEvent(type, Object.assign({bubbles: true, clientX: x, clientY: y, button: 0, pointerId: 1}, extra || {})));
}

function key (target, name, extra) {
	target.dispatchEvent(new KeyboardEvent('keydown', Object.assign({key: name, bubbles: true, cancelable: true}, extra || {})));
}

/* The band (of 64, linear to 2000 Hz) loudest in what an analyser hears. */
async function loudest (analyser) {
	var audio = Elemenx.Service('Audio');

	return await waitFor(function () {
		var bands = audio.Bands(analyser, 64, {Scale: 'linear', MinFrequency: 1, MaxFrequency: 2001});
		var top = Math.max.apply(null, bands);

		return top > 0.4 ? bands.indexOf(top) : null;
	}, 3000);
}

/* The Audio Service plays: notes, a synth and a sampler, a transport with its metronome; PianoRoll and Sampler. */
describe('Contract: notes, instruments and the transport of the Audio Service, PianoRoll and Sampler', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['PianoRoll', 'Sampler', 'service:Audio']);

		await Elemenx.Service('Audio').Context().resume();
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('names notes, their MIDI numbers and their pitches', function () {
		var audio = Elemenx.Service('Audio');

		expect(audio.Midi('C4')).toBe(60);
		expect(audio.Midi('A4')).toBe(69);
		expect(audio.Midi('c#4')).toBe(61);
		expect(audio.Midi('Db4')).toBe(61);
		expect(audio.Midi('C-1')).toBe(0);
		expect(audio.Midi(64)).toBe(64);
		expect(audio.NoteName(61)).toBe('C#4');
		expect(audio.NoteName(0)).toBe('C-1');
		expect(audio.Frequency('A4')).toBe(440);
		expect(audio.Frequency(60)).toBeCloseTo(261.63, 2);
		expect(function () {
			audio.Midi('H2');
		}).toThrow('Elemenx Audio: H2 is not a note (C4, F#3, Bb2 or a MIDI number)');
	});

	it('a synth plays a note at its pitch and lets it go; a sampler plays its sample faster for a higher note', async function () {
		var audio = Elemenx.Service('Audio');
		var context = audio.Context();
		var synth = audio.Instrument({Wave: 'sine', Envelope: {Attack: 0.01, Release: 0.05}, Gain: 0.8});
		var analyser = audio.Analyser(synth.Output, {Size: 8192, Smoothing: 0, MaxDb: 0});
		var sampler;
		var loaded = null;

		expect(synth.Kind).toBe('synth');
		expect(synth.Loaded).toBe(true);

		/* A4: 440 Hz, the fourteenth of 64 bands of 31.25 Hz (437.5 to 468.75). */
		synth.Play('A4', {Velocity: 1});

		expect(synth.Voices()).toBe(1);
		expect(await loudest(analyser)).toBe(14);

		synth.Release('A4');

		expect(await waitFor(function () {
			return synth.Voices() === 0;
		}, 3000)).toBe(true);

		/* A note given its Duration ends by itself. */
		synth.Play(72, {Duration: 0.05});

		expect(await waitFor(function () {
			return synth.Voices() === 0;
		}, 3000)).toBe(true);

		audio.Release(analyser);

		synth.Destroy();

		sampler = audio.Instrument({Samples: {A4: wav(1.5, 440)}, Envelope: {Attack: 0.005, Release: 0.05}, Gain: 0.8});

		expect(sampler.Kind).toBe('sampler');
		expect(sampler.Loaded).toBe(false);
		expect(sampler.Play('A4')).toBe(null);

		sampler.Load(function (error) {
			loaded = error || true;
		});

		await waitFor(function () {
			return loaded;
		}, 3000);

		expect(loaded).toBe(true);
		expect(sampler.Loaded).toBe(true);

		analyser = audio.Analyser(sampler.Output, {Size: 8192, Smoothing: 0, MaxDb: 0});

		/* A5 from the sample of A4: twice as fast, 880 Hz (the 29th band: 875 to 906.25). */
		sampler.Play('A5', {Velocity: 1, Time: context.currentTime});

		expect(await loudest(analyser)).toBe(28);

		sampler.Stop();

		audio.Release(analyser);

		sampler.Destroy();
	});

	it('a transport plays its notes and its beats on time, goes round its loop, and stops after its last note', async function () {
		var audio = Elemenx.Service('Audio');
		var synth = audio.Instrument({Gain: 0.2});
		var heard = [];
		var transport = audio.Transport({Bpm: 480, Beats: 4, Instrument: synth, Metronome: true, Notes: [{Note: 'C4', Start: 0, Length: 1}, {Note: 'E4', Start: 2, Length: 1}, {Note: 'G4', Start: 3.5, Length: 0.5}]});
		var ended = false;

		transport.On('note', function (note) {
			heard.push(['note', note.Note]);
		});

		transport.On('beat', function (beat) {
			heard.push(['beat', beat.Beat, beat.Accent]);
		});

		transport.On('end', function () {
			ended = true;
		});

		expect(transport.Seconds(1)).toBe(0.125);
		expect(transport.Position()).toBe(0);

		transport.Play();

		expect(transport.Playing).toBe(true);

		await waitFor(function () {
			return ended;
		}, 3000);

		/* Four beats (a bar: the first accented) and the notes at theirs, in their order. */
		expect(heard).toEqual([['note', 'C4'], ['beat', 0, true], ['beat', 1, false], ['note', 'E4'], ['beat', 2, false], ['beat', 3, false], ['note', 'G4']]);
		expect(transport.Playing).toBe(false);

		/* Round a loop of two beats: 0, 1, 0, 1... */
		heard = [];

		transport.Set({Loop: {Start: 0, End: 2}, Notes: [{Note: 'C4', Start: 1, Length: 0.5}]}).Stop().Play();

		await waitFor(function () {
			return heard.filter(function (entry) {
				return entry[0] === 'beat';
			}).length >= 5;
		}, 3000);

		expect(heard.slice(0, 7)).toEqual([['beat', 0, true], ['note', 'C4'], ['beat', 1, false], ['beat', 0, true], ['note', 'C4'], ['beat', 1, false], ['beat', 0, true]]);
		expect(transport.Position()).toBeLessThan(2);

		transport.Pause();

		var at = transport.Position();

		await new Promise(function (resolve) {
			setTimeout(resolve, 100);
		});

		expect(transport.Position()).toBe(at);

		transport.Seek(1.5);

		expect(transport.Position()).toBe(1.5);

		expect(function () {
			transport.On('bar', function () {});
		}).toThrow('Elemenx Audio.Transport has no event bar (beat, note, end)');

		transport.Destroy();
		synth.Destroy();
	});

	it('PianoRoll puts, moves, resizes and takes away notes by the pointer and by the keys', async function () {
		var changes = [];
		var keys = [];
		var seeks = [];
		var host = mount('<div style="width: 700px"><PianoRoll [notes]="Notes" Low="60" High="71" Bars="2" BeatWidth="40" KeyHeight="10" Height="200" [position]="Position" (change)="Changed" (key)="Keyed" (seek)="Sought" /></div>', {
			Notes: [{ID: 'a', Note: 64, Start: 1, Length: 1, Velocity: 1}],
			Position: 2.5,
			Changed: function (notes) {
				changes.push(notes);
			},
			Keyed: function (value) {
				keys.push(value);
			},
			Sought: function (value) {
				seeks.push(value);
			}
		});
		var root;
		var grid;
		var rect;
		var note;

		root = await waitFor(function () {
			return host.$Element().querySelector('.elemenx-piano-roll');
		});

		grid = root.querySelector('.elemenx-piano-roll-grid');
		rect = grid.getBoundingClientRect();

		/* Twelve keys, C4 to B4, the high one on top; the black ones marked. */
		expect(root.querySelectorAll('.elemenx-piano-roll-key').length).toBe(12);
		expect(root.querySelectorAll('.elemenx-piano-roll-key.black').length).toBe(5);
		expect(root.querySelector('.elemenx-piano-roll-key.c').textContent).toBe('C4');
		expect(grid.style.width).toBe('320px');
		expect(root.querySelector('.elemenx-piano-roll-playhead').style.left).toBe('100px');

		/* E4 at beat 1: 40 pixels in, under seven keys (B4 to F4). */
		note = root.querySelector('.elemenx-piano-roll-note');

		expect(note.style.left).toBe('40px');
		expect(note.style.top).toBe('70px');
		expect(note.style.width).toBe('39px');

		/* A press on the grid puts a note: G4 (four keys down) at beat 3 and a bit, snapped to 3. */
		pointer(grid, 'pointerdown', rect.left + 3.1 * 40, rect.top + 45);
		pointer(grid, 'pointerup', rect.left + 3.1 * 40, rect.top + 45);

		expect(keys).toEqual([67]);
		expect(changes.length).toBe(1);
		expect(changes[0].map(function (each) {
			return [each.Note, each.Start, each.Length];
		})).toEqual([[64, 1, 1], [67, 3, 1]]);

		/* A drag of the note of E4 moves it a beat on and two keys up (its time snapped). */
		host.Notes = changes[0];

		await tick();

		pointer('point', 'pointerdown', rect.left + 50, rect.top + 75);
		pointer(grid, 'pointermove', rect.left + 91, rect.top + 55);
		pointer(grid, 'pointerup', rect.left + 91, rect.top + 55);

		expect(changes[1][0]).toMatchObject({ID: 'a', Note: 66, Start: 2, Length: 1});

		/* A drag of its end makes it two beats long. */
		host.Notes = changes[1];

		await tick();

		pointer('point', 'pointerdown', rect.left + 118, rect.top + 55);
		pointer(grid, 'pointermove', rect.left + 158, rect.top + 55);
		pointer(grid, 'pointerup', rect.left + 158, rect.top + 55);

		expect(changes[2][0]).toMatchObject({ID: 'a', Start: 2, Length: 2});

		/* The keys: up a semitone, Shift and Left shorter, Delete away. */
		host.Notes = changes[2];

		await tick();

		key(root, 'ArrowUp');
		key(root, 'ArrowLeft', {shiftKey: true});

		expect(changes[3][0].Note).toBe(67);
		expect(changes[4][0].Length).toBe(1.75);

		key(root, 'Delete');

		expect(changes[5].map(function (each) {
			return each.ID;
		})).not.toContain('a');

		/* A double press takes a note away; the ruler seeks; a key of the piano emits key. */
		host.Notes = [{ID: 'x', Note: 60, Start: 0, Length: 1}];

		await tick();

		root.querySelector('.elemenx-piano-roll-note').dispatchEvent(new MouseEvent('dblclick', {bubbles: true}));

		expect(changes[6]).toEqual([]);

		var ruler = root.querySelector('.elemenx-piano-roll-ruler').getBoundingClientRect();

		pointer(root.querySelector('.elemenx-piano-roll-ruler'), 'pointerdown', ruler.left + 101, ruler.top + 5);

		expect(seeks).toEqual([2.5]);

		pointer(root.querySelector('.elemenx-piano-roll-key[data-note="62"]'), 'pointerdown', 0, 0);

		expect(keys[keys.length - 1]).toBe(62);
	});

	it('PianoRoll is as wide as its place, its grid scrolling inside it: it does not widen a column of a grid (a phone)', async function () {
		var host = mount('<div style="display: grid; grid-template-columns: 1fr; width: 200px"><div style="display: flex; flex-direction: column; align-items: flex-start"><PianoRoll Bars="4" Height="160" /></div></div>');
		var roll = await waitFor(function () {
			return host.$Element().querySelector('.elemenx-piano-roll-grid') ? host.$Element().querySelector('.elemenx-piano-roll') : null;
		});

		expect(host.$Element().firstElementChild.firstElementChild.getBoundingClientRect().width).toBe(200);
		expect(roll.getBoundingClientRect().width).toBe(200);
	});

	it('Sampler plays a pad by a press (harder near its top) and by its key, holds it in hold mode, and takes a file dropped on it', async function () {
		var audio = Elemenx.Service('Audio');
		var synth = audio.Instrument({Gain: 0.1});
		var events = [];
		var record = function (name) {
			return function (value) {
				events.push([name, value]);
			};
		};
		var host = mount('<div style="width: 400px"><Sampler [pads]="Pads" [instrument]="Synth" [mode]="Mode" (play)="Played" (release)="Released" (load)="Loaded" /></div>', {
			Pads: [{ID: 'tone', Label: 'Tone', Key: 'Q', Sample: wav(0.3, 440)}, {ID: 'note', Label: 'Note', Key: 'W', Note: 'C4'}, {ID: 'empty', Label: 'Empty'}],
			Synth: synth,
			Mode: 'oneshot',
			Played: record('play'),
			Released: record('release'),
			Loaded: record('load')
		});
		var root;
		var pads;
		var rect;

		root = await waitFor(function () {
			var element = host.$Element().querySelector('.elemenx-sampler');

			return element && !element.querySelector('[data-id="tone"]').classList.contains('empty') ? element : null;
		}, 3000);

		pads = root.querySelectorAll('.elemenx-sampler-pad');

		expect(pads.length).toBe(3);
		expect(pads[1].classList.contains('empty')).toBe(false);
		expect(pads[2].classList.contains('empty')).toBe(true);
		expect(pads[0].querySelector('.elemenx-sampler-key').textContent).toBe('Q');

		/* Near its top: loud; near its bottom: soft. */
		rect = pads[0].getBoundingClientRect();

		pointer(pads[0], 'pointerdown', rect.left + 10, rect.top + 1);

		expect(pads[0].classList.contains('active')).toBe(true);

		pointer(pads[0], 'pointerup', rect.left + 10, rect.top + 1);
		pointer(pads[0], 'pointerdown', rect.left + 10, rect.bottom - 1);
		pointer(pads[0], 'pointerup', rect.left + 10, rect.bottom - 1);

		expect(events[0][0]).toBe('play');
		expect(events[0][1].ID).toBe('tone');
		expect(events[0][1].Velocity).toBeGreaterThan(0.95);
		expect(events[2][1].Velocity).toBeLessThan(0.4);
		expect(events.map(function (entry) {
			return entry[0];
		})).toEqual(['play', 'release', 'play', 'release']);

		/* Its key; a pad of a note plays it on the Instrument; an empty one plays nothing. */
		events = [];

		key(root, 'w');

		root.dispatchEvent(new KeyboardEvent('keyup', {key: 'w', bubbles: true}));

		expect(events).toEqual([['play', {ID: 'note', Velocity: 0.8}], ['release', {ID: 'note'}]]);
		expect(host.$Element().querySelector('.elemenx-sampler').children.length).toBe(3);

		events = [];

		pointer(pads[2], 'pointerdown', 0, 0);

		expect(events).toEqual([]);

		/* Hold: lit while held. */
		host.Mode = 'hold';

		await tick();

		key(root, 'Q');

		expect(pads[0].classList.contains('active')).toBe(true);

		await new Promise(function (resolve) {
			setTimeout(resolve, 200);
		});

		expect(pads[0].classList.contains('active')).toBe(true);

		root.dispatchEvent(new KeyboardEvent('keyup', {key: 'Q', bubbles: true}));

		expect(pads[0].classList.contains('active')).toBe(false);

		/* A file dropped on the empty pad: it can play then. */
		var transfer = new DataTransfer();

		transfer.items.add(new File([wav(0.2, 220)], 'low.wav', {type: 'audio/wav'}));

		events = [];

		pads[2].dispatchEvent(new DragEvent('drop', {bubbles: true, cancelable: true, dataTransfer: transfer}));

		expect(events[0][0]).toBe('load');
		expect(events[0][1].ID).toBe('empty');
		expect(events[0][1].File.name).toBe('low.wav');

		await waitFor(function () {
			return !pads[2].classList.contains('empty');
		}, 3000);

		synth.Destroy();
	});
});
