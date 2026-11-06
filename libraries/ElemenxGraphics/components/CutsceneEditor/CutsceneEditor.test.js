import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

/* A Scene and the editor of its cutscenes, the cutscenes emitted kept back in the Scene as an owner does. */
async function mount () {
	var component = Elemenx.Component(unique('CutsceneHost'), {$Template: '<div style="width: 900px; height: 520px"><Scene #Scene Paused="true" Quality="low" Labels="false" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="200" Height="0.3" Water="0" Seed="flat" /></Scene><div style="height: 260px"><CutsceneEditor #Editor [scene]="Space" [value]="Value" [target]="Target" (change)="Changed" (camera)="Asked" /></div></div>', Space: null, Value: {}, Target: '', Changes: [], Cameras: [], Ready: function (space) {
		this.Space = space;
	}, Changed: function (value) {
		this.Changes.push(value);

		this.Value = value;

		if (this.Space)
			this.Space.Cutscenes = value;
	}, Asked: function (event) {
		this.Cameras.push(event);
	}})();
	var editor;

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		editor = component.$Ref('Editor', true);

		return editor && component.Space;
	}, 6000);

	component.Space.Scene().Loop.Stop();

	return {Host: component, Editor: editor, Scene: component.Space};
}

describe('Contract: CutsceneEditor, the cutscenes of a Scene on a line of time', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'CutsceneEditor', 'Timeline', 'Button', 'service:Renderer', 'service:Meshes']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('creates a cutscene, adds what a film has at the playhead as ranges of its lanes, moves them, edits their fields, takes them away', async function () {
		var made = await mount();
		var editor = made.Editor;
		var host = made.Host;

		editor.Created();

		await tick();

		expect(Object.keys(host.Value)).toEqual(['cutscene-1']);
		expect(editor.$Element().querySelector('.elemenx-timeline')).not.toBe(null);

		editor.Time = 1.5;

		editor.Add('title');
		editor.Add('fade');

		var cutscene = host.Value['cutscene-1'];

		expect(cutscene.Tracks.map(function (track) {
			return track.Type;
		})).toEqual(['title', 'fade']);
		expect(cutscene.Tracks[0].Items[0]).toMatchObject({At: 1.5, Length: 3, Text: 'Title'});
		expect(editor.Ranges().map(function (range) {
			return [range.ID, range.Lane, range.From];
		})).toEqual([['0:0', 't0', 1.5], ['1:0', 't1', 1.5]]);

		/* A title dragged and stretched on the line. */
		editor.Moved({ID: '0:0', From: 2.02, To: 6.03});

		expect(host.Value['cutscene-1'].Tracks[0].Items[0]).toMatchObject({At: 2, Length: 4});

		/* Its fields: a number read as one, a text as it is. */
		editor.Chosen({ID: '0:0'});

		await tick();

		var text = editor.$Element().querySelector('[data-field="Text"]');

		text.value = 'Chapter one';

		text.dispatchEvent(new Event('change', {bubbles: true}));

		var typing = editor.$Element().querySelector('[data-field="Typing"]');

		typing.value = '12';

		typing.dispatchEvent(new Event('change', {bubbles: true}));

		expect(host.Value['cutscene-1'].Tracks[0].Items[0]).toMatchObject({Text: 'Chapter one', Typing: 12});

		editor.Remove();

		expect(host.Value['cutscene-1'].Tracks.map(function (track) {
			return track.Type;
		})).toEqual(['fade']);
	});

	it('shows the Scene at the moment the playhead is at, keys the move of its target where the view is, asks for a camera there', async function () {
		var made = await mount();
		var editor = made.Editor;
		var scene = made.Scene;

		scene.Add('camera', {ID: 'cam', X: 0, Y: 0, Z: 4});

		made.Host.Target = 'cam';

		scene.SetViewpoint({Target: [10, 1, 10], Yaw: 0.5, Pitch: 0.3, Distance: 12});

		editor.Created();

		editor.Time = 2;

		editor.Add('subtitle');
		editor.Keyed();

		var move = made.Host.Value['cutscene-1'].Tracks[1];
		var view = scene.Viewpoint();

		expect(move.Type).toBe('move');
		expect(move.ID).toBe('cam');
		expect(move.Keys[0].At).toBe(2);
		expect(move.Keys[0].X).toBeCloseTo(view.Eye[0], 1);
		expect(move.Keys[0].Z).toBeCloseTo(view.Eye[1], 1);

		/* The playhead pressed: the cutscene held at that moment in the Scene. */
		editor.Sought({At: 3});

		expect(scene.Cutscene()).toMatchObject({Name: 'cutscene-1', Time: 3, Paused: true});
		expect(scene.$Element().querySelector('.elemenx-scene-cinema-subtitles').textContent).toBe('…');

		editor.CameraFromView();

		expect(made.Host.Cameras.length).toBe(1);
		expect(made.Host.Cameras[0].Props.X).toBeCloseTo(view.Eye[0], 1);

		editor.Stop();

		expect(scene.Cutscene()).toBe(null);
	});
});
