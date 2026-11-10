import { describe, expect, it, beforeAll } from 'vitest';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);

/*
 * elemenx.js where there is no DOM and no storage of the browser (Node): it loads, and what needs no page works. It
 * took Node for a worker and threw as it loaded (it listened on a global with no addEventListener), and its Storage
 * read localStorage of a global that has none.
 */
describe('Elemenx without a DOM', function () {
	beforeAll(function () {
		delete globalThis.localStorage;
		delete globalThis.sessionStorage;

		require('../../elemenx.js');
	});

	it('loads, as no worker', function () {
		expect(typeof Elemenx).toBe('object');
		expect(Elemenx.Version).toMatch(/^\d+\.\d+\.\d+/);
	});

	/* A server checks a signature against the samples it keeps with the code of the page; it lays out with it too. */
	it('compares signatures and lays out items with the Services of the system Libraries', function () {
		var signatures;
		var line = function (shift, wave) {
			var points = [];

			for (var i = 0; i <= 40; i++)
				points.push({X: i * 5 + shift, Y: 40 + Math.sin(i / 3) * wave, P: 0.5, T: i * 10});

			return [points];
		};
		var reference;

		require('../../libraries/ElemenxCommon/services/Signatures/Signatures.js');
		require('../../libraries/ElemenxUI/services/Layouts/Layouts.js');

		signatures = Elemenx.Service('Signatures');
		reference = signatures.Enroll([line(0, 20), line(3, 21), line(-2, 19)]);

		expect(signatures.Match(line(40, 20), reference).Match).toBe(true);
		expect(signatures.Match([[{X: 0, Y: 0, T: 0}, {X: 0, Y: 100, T: 100}, {X: 100, Y: 100, T: 200}]], reference).Match).toBe(false);
		expect(Elemenx.Service('Layouts').Pack([{ID: 'a', Width: 2}, {ID: 'b'}], {Columns: 2}).Rows).toBe(2);
	});

	it('puts planets on their orbits and makes shapes of three dimensions with the Services of the system Libraries', function () {
		var astronomy;
		var graphics;
		var meshes;
		var quarter;

		require('../../libraries/ElemenxCommon/services/Astronomy/Astronomy.js');
		require('../../libraries/ElemenxCommon/services/Math/Math.js');
		require('../../libraries/ElemenxGraphics/services/Renderer/Renderer.js');
		require('../../libraries/ElemenxGraphics/services/Meshes/Meshes.js');

		astronomy = Elemenx.Service('Astronomy');
		graphics = Elemenx.Service('Renderer');
		meshes = Elemenx.Service('Meshes');
		quarter = astronomy.Position({Distance: 1}, 365.25 / 4, 1);

		expect(quarter[1]).toBeCloseTo(1, 6);
		expect(astronomy.Generate('node').Bodies[0].Type).toBe('star');
		expect(meshes.Sphere({Segments: 8, Rings: 4}).Positions.length).toBe(9 * 5 * 3);
		expect(graphics.Camera({Position: [0, 0, 10]}).Project([0, 0, 0], 100, 100)).toMatchObject({X: 50, Y: 50});
		expect(graphics.Create({getContext: function () {
			return null;
		}})).toBe(null);

		/* The kinds of a game and a saved one, on a server too. */
		require('../../libraries/ElemenxGraphics/services/SceneKinds/SceneKinds.js');

		var kinds = Elemenx.Service('SceneKinds');
		var made;

		kinds.Define('node-module', {Traits: {Health: {Max: 10}}});
		kinds.Define('node-station', {Parts: [{ID: 'dock', Kind: 'node-module'}]});

		made = kinds.Make('node-station', {ID: 'base', Parts: [{ID: 'dock', Traits: {Health: {Max: 20}}}]});

		expect(kinds.Diff(made)).toEqual({ID: 'base', Kind: 'node-station', Parts: [{ID: 'dock', Traits: {Health: {Max: 20}}}]});
		expect(JSON.stringify(kinds.Restore(kinds.Diff(made)))).toBe(JSON.stringify(made));
	});

	it('keeps Local and Session in memory, one store for every facade', function () {
		Elemenx.Storage.Local.Set('Theme', 'dark');
		Elemenx.Storage.Session.Set('Visit', {Count: 2});

		var application = Elemenx.Application('HeadlessStorage', {});

		expect(Elemenx.Storage.Local.Get('Theme')).toBe('dark');
		expect(Elemenx.Storage.Session.Get('Visit')).toEqual({Count: 2});
		expect(application.$Storage().Local.Get('Theme')).toBe('dark');
		expect(Elemenx.Storage.Local.Has('Theme')).toBe(true);

		Elemenx.Storage.Local.Remove('Theme');

		expect(Elemenx.Storage.Local.Has('Theme')).toBe(false);
	});

	it('runs what needs no page: events, phrases, services, templates, the state of the install', function () {
		var events = Elemenx.Events('headless');
		var got = [];

		events.On('Saved', function (event) {
			got.push(event.Data);
		});

		events.Emit('Saved', 5);

		Elemenx.Locale.Add('en', {Hello: 'Hello {Name}'});
		Elemenx.Service('HeadlessCounter', {
			Count: function (value) {
				return value + 1;
			}
		});
		Elemenx.Template('headless-row', '<li>{{Name}}</li>');

		expect(got).toEqual([5]);
		expect(Elemenx.Locale.Text('Hello', {Name: 'Ada'})).toBe('Hello Ada');
		expect(Elemenx.Template('headless-row')).toBe('<li>{{Name}}</li>');
		expect(Elemenx.Application('HeadlessServices', {}).$Service('HeadlessCounter').Count(1)).toBe(2);
		expect(Elemenx.Install.State()).toEqual({Available: false, Installed: false, Manual: false, Waiting: false, Version: null});
	});

	/* ElemenxCommon has an entry of its own for Node: the framework and every Service of the Library, nothing of a page. */
	it('loads every Service of ElemenxCommon through its entry for Node: a loop runs on timers, FPS waits in silence', function () {
		var loaded = require('../../libraries/ElemenxCommon/node.js');
		var calls = 0;
		var watch;

		expect(loaded).toBe(Elemenx);
		expect(Elemenx.Service('Random').Create(7).Next()).toBe(Elemenx.Service('Random').Create(7).Next());
		expect(Elemenx.Service('Diff').Lines('a\nb', 'a\nc').length).toBe(3);
		expect(Elemenx.Service('DataFormats').Parse('yaml', 'a: 1')).toEqual({a: 1});
		expect(Elemenx.Service('Calculations').Evaluate('2 + x * 3', {x: 2})).toBe(8);
		expect(Elemenx.Service('Archive').Crc(new Uint8Array([97]))).toBe(0xe8b7be43);

		expect(Elemenx.Service('SpatialIndex').Create({Cell: 10}).Count()).toBe(0);
		expect(Elemenx.Service('Math').Apply(Elemenx.Service('Math').Translation(1, 2, 3), [0, 0, 0])).toEqual([1, 2, 3]);
		expect(Elemenx.Service('Physics').Bounce([0, -1, 0], [0, 1, 0], 0, 1)).toEqual([0, 1, 0]);

		/* InputDevices with no page: nothing held, nothing moves, the actions still bound. */
		Elemenx.Service('InputDevices').Bind('Ahead', ['KeyW', 'LeftY-']);

		expect(Elemenx.Service('InputDevices').Down('KeyW')).toBe(false);
		expect(Elemenx.Service('InputDevices').Pads()).toEqual([]);
		expect(Elemenx.Service('InputDevices').Value('Ahead')).toBe(0);
		expect(Elemenx.Service('InputDevices').Tilt().Steer).toBe(0);
		expect(Elemenx.Service('InputDevices').MotionSupported()).toBe(false);

		/* The codes as SVG on a server (a ticket in a mail). */
		expect(Elemenx.Service('QR').Encode('Elemenx').Size).toBe(21);
		expect(Elemenx.Service('Barcodes').SVG('ean13', '4006381333931')).toMatch(/^<svg /);

		/* Blueprints alone: the graphs of code; one of shaders needs BlueprintShaders, of ElemenxUI. */
		expect(Elemenx.Service('Blueprints').Graphs()).toEqual(['generator', 'flow']);
		expect(function () {
			Elemenx.Service('Blueprints').Compile({version: 1, type: 'pass', blocks: [], links: []});
		}).toThrow(/unknown type of graph pass/);
		expect(Elemenx.Service('Seeded').Load(JSON.parse(JSON.stringify(Elemenx.Service('Seeded').Save('system', {Seed: 'node'})))).Bodies[0].Type).toBe('star');

		/* A loop with no window runs on timers. */
		var loop = Elemenx.Service('Loop').Create({});

		loop.Start();

		expect(loop.Running).toBe(true);

		loop.Stop();

		watch = Elemenx.Service('FPS').Watch(function () {
			calls++;
		});

		expect(Elemenx.Service('FPS').Watching()).toBe(true);
		expect(Elemenx.Service('FPS').Stats().Heap === null || typeof Elemenx.Service('FPS').Stats().Heap === 'number').toBe(true);

		watch.Stop();

		expect(calls).toBe(0);
	});

	it('keeps cookies in memory, and a transport without its class of the browser says so', function () {
		Elemenx.Storage.Cookie.Set('Session', 'abc');

		expect(Elemenx.Storage.Cookie.Get('Session')).toBe('abc');

		Elemenx.Storage.Cookie.Remove('Session');

		expect(Elemenx.Storage.Cookie.Has('Session')).toBe(false);

		var socket = Elemenx.Network.WebSocket('ws://127.0.0.1:1/');
		var Socket = globalThis.WebSocket;

		delete globalThis.WebSocket;

		try {
			expect(function () {
				socket.Connect();
			}).toThrow('Elemenx Network.WebSocket needs WebSocket, which this environment has not');
		}
		finally {
			globalThis.WebSocket = Socket;
		}
	});

	/* Node loads no page, so no Library loads its resources: tools/resources.js reads them from their folders. */
	it('gives Node the resources of the system Libraries read from their folders, as a page has them', function () {
		var Resources = require('../../tools/resources.js');
		var read = Resources.Reader();

		expect(read('Blueprints')).toEqual(expect.arrayContaining(['ElemenxGraphics/water', 'ElemenxGraphics/materials/lawn', 'ElemenxGraphics/effects/torch']));
		expect(read('Data', 'ElemenxGraphics/road-types/road')).toMatchObject({Title: 'Road', Speed: 90});
		expect(read('Data', 'nothing')).toBe(null);

		Resources.Define(Elemenx);

		expect(Elemenx.Resources('Data', 'ElemenxGraphics/road-surfaces/asphalt')).toMatchObject({Material: 'asphalt', Grip: 1});
	});
});

