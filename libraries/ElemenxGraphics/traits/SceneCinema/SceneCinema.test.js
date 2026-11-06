import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

async function mount () {
	var ready = null;
	var component = Elemenx.Component(unique('CinemaHost'), {$Template: '<div style="width: 400px; height: 200px"><Scene Paused="true" Quality="low" Labels="false" (ready)="Ready">' +
		'<SceneObject ID="land" Kind="ground" Size="200" Height="0.3" Water="0" Seed="flat" />' +
	'</Scene></div>', Ready: function (space) {
		ready = space;
	}})();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready;
	}, 4000);

	ready.Scene().Loop.Stop();

	return ready;
}

describe('Contract: the cinema of a Scene: its layer of fades, bars, titles and subtitles, and its cutscenes', function () {
	var now = 0;

	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:Renderer', 'service:Meshes']);
	});

	beforeEach(function () {
		resetDOM();

		now = performance.now() + 100;
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	/* Frames of a second each third of it: 30 to a second. */
	function run (scene, seconds) {
		var i;

		for (i = 0; i < Math.round(seconds * 30); i++) {
			scene.Scene().Rest = 0;

			scene.Engine().Frame(now += 1000 / 30);
		}
	}

	function part (scene, name) {
		return scene.$Element().querySelector('.elemenx-scene-cinema-' + name);
	}

	it('lays a fade, the bars of a wide picture, a title and a subtitle over the picture by hand, and takes them away', async function () {
		var scene = await mount();

		run(scene, 0.1);

		scene.Cinema({Fade: 0.5, FadeColor: '#ff0000', Letterbox: 1, Ratio: 2.39, Title: {Text: 'The end', Kind: 'chapter'}, Subtitle: {Text: 'Hello', Speaker: 'Aria'}});

		expect(Number(part(scene, 'fade').style.opacity)).toBeCloseTo(0.5, 3);
		expect(part(scene, 'fade').style.background).toContain('255, 0, 0');
		expect(parseFloat(part(scene, 'bar').style.height)).toBeGreaterThan(5);
		expect(part(scene, 'titles').textContent).toBe('The end');
		expect(part(scene, 'titles').querySelector('[data-kind="chapter"]')).not.toBe(null);
		expect(part(scene, 'subtitles').textContent).toBe('AriaHello');
		expect(scene.$Element().querySelector('.elemenx-scene-cinema').classList.contains('shown')).toBe(true);

		scene.Cinema(null);

		expect(part(scene, 'titles').textContent).toBe('');
		expect(scene.$Element().querySelector('.elemenx-scene-cinema').classList.contains('shown')).toBe(false);
	});

	it('plays a cutscene: its cuts, what it moves along its keys, its fades, its titles typed out, its cues once; the camera of before comes back at its end', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var cues = [];
		var states = [];
		var ended = null;

		scene.Add('camera', {ID: 'a', X: 0, Y: 0, Z: 5});
		scene.Add('camera', {ID: 'b', X: 30, Y: 0, Z: 5});
		scene.Add('camera', {ID: 'before', X: -20, Y: 0, Z: 5});

		scene.Camera = 'before';

		scene.$On('cue', function (event) {
			cues.push(event.detail || event);
		});
		scene.$On('cutscene', function (event) {
			states.push((event.detail || event).State);
		});

		run(scene, 0.1);

		scene.PlayCutscene({Name: 'intro', Tracks: [
			{Type: 'camera', Keys: [{At: 0, Camera: 'a'}, {At: 2, Camera: 'b'}]},
			{Type: 'move', ID: 'a', Keys: [{At: 0, X: 0, Ease: 'linear'}, {At: 2, X: 10, Ease: 'linear'}], Path: 'linear'},
			{Type: 'fade', Keys: [{At: 0, Value: 1}, {At: 1, Value: 0}]},
			{Type: 'title', Items: [{At: 0.5, Length: 2, Text: 'Chapter one', Typing: 10, In: 0}]},
			{Type: 'cue', Items: [{At: 1, Name: 'door', Data: 7}]}
		]}, function (error, result) {
			ended = {Error: error, Result: result};
		});

		run(scene, 0.5);

		expect(scene.Camera).toBe('a');
		expect(inner.Camera.Position[0]).toBeCloseTo(2.5, 0);
		expect(Number(part(scene, 'fade').style.opacity)).toBeGreaterThan(0.2);

		run(scene, 0.4);

		/* Typed out: ten letters a second, as far as the cutscene came. */
		var typed = 'Chapter one'.slice(0, Math.floor((scene.Cutscene().Time - 0.5) * 10));

		expect(typed.length).toBeGreaterThan(2);
		expect(part(scene, 'titles').textContent).toBe(typed);

		run(scene, 0.6);

		expect(cues).toEqual([{Cutscene: 'intro', Name: 'door', Data: 7, At: 1}]);
		expect(Number(part(scene, 'fade').style.opacity)).toBeCloseTo(0, 2);

		/* It lasts 2.5 s: its last title ends then. */
		run(scene, 0.7);

		expect(scene.Camera).toBe('b');

		run(scene, 0.6);

		expect(ended).toEqual({Error: null, Result: {Name: 'intro', Stopped: false}});
		expect(scene.Camera).toBe('before');
		expect(states).toEqual(['start', 'end']);
		expect(cues.length).toBe(1);
		expect(scene.Cutscene()).toBe(null);
	});

	it('goes to a moment of it without its cues, holds it, and ends at Escape unless it cannot be skipped', async function () {
		var scene = await mount();
		var cues = 0;
		var result = null;
		var cutscene = {Name: 'talk', Tracks: [
			{Type: 'subtitle', Items: [{At: 1, Length: 2, Text: 'Who goes there?', Speaker: 'Guard'}]},
			{Type: 'cue', Items: [{At: 0.5, Name: 'early'}]}
		]};

		scene.$On('cue', function () {
			cues++;
		});

		run(scene, 0.1);

		scene.PlayCutscene(cutscene, function (error, made) {
			result = made;
		});
		scene.SeekCutscene(1.5);

		expect(part(scene, 'subtitles').textContent).toBe('GuardWho goes there?');
		expect(scene.Cutscene()).toEqual({Name: 'talk', Time: 1.5, Length: 3, Paused: false});

		scene.PauseCutscene(true);

		run(scene, 1);

		expect(scene.Cutscene().Time).toBe(1.5);
		expect(cues).toBe(0);

		scene.$Element().dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', code: 'Escape', bubbles: true}));

		expect(result).toEqual({Name: 'talk', Stopped: true});
		expect(part(scene, 'subtitles').textContent).toBe('');

		/* One that cannot be skipped goes on. */
		scene.PlayCutscene(Object.assign({}, cutscene, {Skip: false}));
		scene.$Element().dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', code: 'Escape', bubbles: true}));

		expect(scene.Cutscene().Name).toBe('talk');

		scene.StopCutscene();
	});

	it('keeps its cutscenes by name, Save and Load with them, and plays one by its name; an unknown one is told', async function () {
		var scene = await mount();
		var failed = null;

		scene.Cutscenes = {fade: {Tracks: [{Type: 'fade', Keys: [{At: 0, Value: 1}, {At: 1, Value: 0}]}]}};

		var saved = scene.Save();

		expect(saved.Cutscenes).toEqual(scene.Cutscenes);

		scene.Cutscenes = null;

		scene.Load(saved);

		expect(Object.keys(scene.Cutscenes)).toEqual(['fade']);

		scene.PlayCutscene('fade');

		run(scene, 0.1);

		expect(scene.Cutscene().Name).toBe('fade');

		scene.PlayCutscene('none', function (error) {
			failed = error;
		});

		expect(failed.message).toContain('none');
	});

	/* Frames over real time: a recorder takes them as they come. */
	async function live (scene, milliseconds) {
		var end = performance.now() + milliseconds;

		while (performance.now() < end) {
			scene.Scene().Rest = 0;

			scene.Engine().Frame(now += 1000 / 30);

			await new Promise(function (resolve) {
				setTimeout(resolve, 33);
			});
		}
	}

	it('records what it shows as a video, the titles of its layer laid in it; a cutscene recorded gives its video at its end', async function () {
		var scene = await mount();
		var video = null;
		var handle;

		await live(scene, 100);

		scene.Cinema({Title: {Text: 'REC', Kind: 'title'}, Fade: 0.3, FadeColor: '#ff0000'});

		handle = scene.Record({Fps: 30}, function (error, blob) {
			video = {Error: error, Blob: blob};
		});

		/* Under the load of a whole run the scene draws fewer frames a second: as long as it takes for a few to be recorded. */
		await live(scene, 300);

		var waited = performance.now();

		/* An encoder gives its first piece after some frames: a recording of a few has nothing yet. */
		while (handle.Frames < 24 && performance.now() - waited < 12000)
			await live(scene, 100);

		/* The picture recorded has the red of the fade of the layer over the scene. */
		var middle = handle.Canvas.getContext('2d').getImageData(Math.floor(handle.Canvas.width / 2), 2, 1, 1).data;

		expect(middle[0]).toBeGreaterThan(middle[2]);
		expect(handle.Recording()).toBe(true);

		handle.Stop();

		/* A slow encoder is asked for its piece first (up to three seconds). */
		await waitFor(function () {
			return video;
		}, 6000);

		expect(video.Error).toBe(null);
		expect(video.Blob.size).toBeGreaterThan(0);
		expect(video.Blob.type).toContain('video/');
		expect(handle.Recording()).toBe(false);

		var result = null;

		scene.Cinema(null);
		scene.PlayCutscene({Name: 'shot', Record: true, Tracks: [{Type: 'fade', Keys: [{At: 0, Value: 0}, {At: 1.5, Value: 1}]}]}, function (error, made) {
			result = made;
		});

		/* As long as it takes the scene to draw it to its end, however slowly it draws under load. */
		var started = performance.now();

		while (!result && performance.now() - started < 20000)
			await live(scene, 200);

		expect(result.Name).toBe('shot');
		expect(result.Video.size).toBeGreaterThan(0);
	}, 40000);
});
