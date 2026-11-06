import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];
var roles;

async function mount (model) {
	var ready = null;
	var component = Elemenx.Component(unique('RolesHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Labels="false" (ready)="Ready">' +
		'<SceneObject ID="land" Kind="ground" Size="100" Height="0.3" Water="0" Seed="flat" />' +
		'<SceneObject ID="hut" Kind="house" Model="' + model + '" X="0" Y="0" Size="4" />' +
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

/* A piece of a model of a file: its triangles (corners [x, y, z]), where it rests as it is. */
function piece (id, corners, material) {
	var positions = [];

	corners.forEach(function (corner) {
		positions.push(corner[0], corner[1], corner[2]);
	});

	return {ID: id, Skin: -1, Rest: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], Material: {Name: material}, Geometry: {Positions: positions, Indices: corners.map(function (corner, index) {
		return index;
	})}};
}

/* A model of shapes: a body and a door on its front, each a piece of its own. */
function hut (name) {
	Elemenx.Service('SceneModels').Define(name, {Type: 'building', Size: 4, Parts: [
		{ID: 'walls', Shape: 'box', Piece: 'body', At: [0, 0.4, 0], Size: [0.8, 0.8, 0.8]},
		{ID: 'leaf', Shape: 'box', Piece: 'door', At: [0.1, 0.25, 0.41], Size: [0.2, 0.5, 0.02]}
	]});
}

describe('Contract: ModelRoles, the roles of the parts of a model', function () {
	beforeAll(async function () {
		localStorage.removeItem('elemenx-model-roles');

		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:ModelRoles', 'service:SceneModels', 'service:Renderer', 'service:Meshes']);

		roles = Elemenx.Service('ModelRoles');
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('lists its kinds by group and makes a role of a kind, what the kind starts as under what is given', function () {
		var groups = roles.Kinds().map(function (group) {
			return group.ID;
		});
		var door = roles.Make('door', {ID: 'front', Parts: [{Piece: 'door'}]});

		expect(groups).toEqual(['opens', 'turns', 'drives', 'lights', 'chassis', 'flight', 'weapons', 'mechanisms', 'points']);
		expect(roles.Make('arm')).toMatchObject({Drive: 'stroke', Corner: 'FL', Length: 0.3});
		expect(roles.Make('exhaust')).toMatchObject({Effect: 'smoke', Rate: 6, Drive: 'gas'});
		expect(door).toMatchObject({ID: 'front', Kind: 'door', Parts: [{Piece: 'door'}], Motion: {Type: 'hinge', Axis: [0, 1, 0], Angle: 70}, Pace: 0.6});
		expect(roles.Make('steering').Drive).toBe('steer');
		expect(roles.Make('lamp-rear').Light).toEqual({Kind: 'rear'});
		expect(roles.Make('nothing').Kind).toBe('part');
	});

	it('keeps the roles of a model in the storage of the browser, writes them into a file and reads them back', function () {
		var name = unique('kept');
		var told = [];
		var listener = function (model) {
			told.push(model);
		};
		var version = roles.Version();
		var text;

		roles.OnChange(listener);
		roles.Set(name, [roles.Make('hatch', {ID: 'lid', Parts: [{Piece: 'top'}]})]);

		expect(roles.Get(name)[0].ID).toBe('lid');
		expect(JSON.parse(localStorage.getItem('elemenx-model-roles'))[name][0].Kind).toBe('hatch');
		expect(roles.Models()).toContain(name);
		expect(roles.Version()).toBeGreaterThan(version);

		text = roles.Export();

		roles.Remove(name);

		expect(roles.Get(name)).toEqual([]);
		expect(roles.Import('not a file')).toBe(false);
		expect(roles.Import(text)).toBe(true);
		expect(roles.Get(name)[0].ID).toBe('lid');
		expect(told).toEqual([name, name, '']);

		roles.OffChange(listener);
		roles.Remove(name);
	});

	it('gives a Scene its rig: what moves, what glows and the wheels, each of its parts', function () {
		var rig = roles.Rig([
			roles.Make('door', {ID: 'left', Parts: [{Piece: 'a'}], Motion: {Type: 'hinge', Pivot: [0.5, 0, 1], Axis: [0, 1, 0], Angle: 70}, Both: true}),
			roles.Make('window', {ID: 'glass', Parts: [{Piece: 'b'}], Follow: 'left'}),
			roles.Make('fan', {ID: 'blades', Parts: [{Piece: 'c'}]}),
			roles.Make('lamp-head', {ID: 'beam', Parts: [{Piece: 'd', Vertices: [[0, 5]]}]}),
			roles.Make('wheel', {ID: 'front-left', Parts: [{Piece: 'e'}], Corner: 'FL'}),
			roles.Make('door', {ID: 'nothing'})
		]);

		expect(rig.Openings.map(function (opening) {
			return [opening.Name, opening.Hinge || opening.Way, opening.Follow || '', opening.Spin || 0];
		})).toEqual([['role:left', [0.5, 0, 1], '', 0], ['role:glass', [0, -1, 0], 'role:left', 0], ['role:blades', [0, 0, 0], '', 2]]);
		expect(rig.Openings[0].Both).toBe(true);
		expect(rig.Lamps).toEqual([{Role: 'beam', Parts: [{Piece: 'd', Vertices: [[0, 5]]}], Both: false, Kind: 'head'}]);
		expect(rig.Wheels).toEqual([{Parts: [{Piece: 'e'}], Corner: 'FL', Held: false}]);
	});

	it('packs the vertices a brush painted into ranges and finds one in them', function () {
		var ranges = roles.Ranges([9, 3, 4, 5, 20, 10, 4]);

		expect(ranges).toEqual([[3, 5], [9, 10], [20, 20]]);
		expect([2, 3, 5, 6, 9, 10, 11, 20, 21].map(function (index) {
			return roles.Within(ranges, index);
		})).toEqual([false, true, true, false, true, true, false, true, false]);
	});

	/* The parts of a file: a whole piece, or the triangles of a piece the brush painted (the glass of a lamp in the body). */
	it('cuts what a role names out of a model of a file: a whole piece, or only the painted triangles of one', async function () {
		var scene = await mount('');
		var engine = scene.Engine();
		var body = piece('body', [[0, 0, 0], [1, 0, 0], [0, 1, 0], [2, 0, 0], [3, 0, 0], [2, 1, 0]], 'paint');
		var door = piece('door', [[0, 0, 1], [1, 0, 1], [0, 1, 1]], 'paint');
		var model = {Asset: {Nodes: []}, Pieces: [body, door]};
		var rig = roles.Rig([roles.Make('door', {ID: 'door', Parts: [{Piece: 'door'}]}), roles.Make('lamp-head', {ID: 'glass', Parts: [{Piece: 'body', Vertices: [[3, 5]]}]})]);

		engine.OpeningsOf(model, rig);

		expect(model.Pieces.map(function (each) {
			return [each.ID, each.Opening || '', each.Origin || '', each.Geometry.Indices.length];
		})).toEqual([['body', '', '', 3], ['door-role:door', 'role:door', 'door', 3], ['body-lamp-0', 'lamp-0', 'body', 3]]);
		expect(rig.LampPlaces['lamp-0'][1][0]).toBeCloseTo(7 / 3, 6);
		expect(rig.LampPlaces['lamp-0'][1][1]).toBeCloseTo(1 / 3, 6);
	});

	it('moves the door of a house as its role says: Part(id, role) sets it, it comes by degrees, the scene tells it', async function () {
		var name = unique('hut');
		var scene;
		var engine;
		var heard = [];
		var object;
		var made;
		var door;
		var moved;
		var i;

		hut(name);

		roles.Set(name, [roles.Make('door', {ID: 'front', Name: 'Front door', Parts: [{Piece: 'door'}], Motion: {Type: 'hinge', Pivot: [0, 0, 0.41], Axis: [0, 1, 0], Angle: 90}, Pace: 1})]);

		scene = await mount(name);
		engine = scene.Engine();
		object = scene.Scene().Objects.hut;

		scene.$On('part', function (detail) {
			heard.push(detail);
		});

		engine.Frame(performance.now());

		made = Elemenx.Service('SceneModels').Make(name);
		door = made.Pieces.filter(function (each) {
			return each.Opening === 'role:front';
		})[0];

		expect(door).toBeTruthy();
		expect(scene.Parts('hut')).toEqual([{ID: 'front', Kind: 'door', Name: 'Front door', Value: 0}]);
		expect(scene.Part('hut', 'nothing')).toBe(null);

		scene.Part('hut', 'front').Set(1);

		expect(heard).toEqual([{ID: 'hut', Role: 'front', Value: 1}]);

		for (i = 0; i < 5; i++)
			engine.RigsStep(0.1);

		expect(scene.Part('hut', 'front').Get()).toBeCloseTo(0.5, 5);

		for (i = 0; i < 10; i++)
			engine.RigsStep(0.1);

		moved = engine.OpeningMove(object, door);

		/* Turned a quarter round its hinge: x of the model goes to -z. */
		expect(moved[0]).toBeCloseTo(0, 5);
		expect(moved[8]).toBeCloseTo(1, 5);
		expect(scene.Part('hut', 'front').Get()).toBe(1);

		roles.Remove(name);
	});

	/*
	 * Roles beyond doors and wheels: a shock grows with the travel of its wheel, the hand of a clock goes with the time of
	 * day, a turret with the Aim of the object; a socket is a point of the model in the world, an emitter gives off its
	 * effect, a collider stops what comes to the outline of its parts.
	 */
	it('drives a shock by its wheel, a clock by the time, a turret by its aim; holds at a socket, emits, and collides', async function () {
		var name = unique('hut');
		var scene;
		var engine;
		var object;
		var made;
		var shock;
		var socket;
		var bursts = [];

		hut(name);

		roles.Set(name, [
			roles.Make('shock', {ID: 'spring', Parts: [{Piece: 'door'}], Motion: {Type: 'stretch', Pivot: [0.1, 0.5, 0.41], Way: [0, -1, 0]}, Corner: 'FL', Length: 0.25}),
			roles.Make('clock-hour', {ID: 'hand', Parts: [{Piece: 'door'}], Motion: {Type: 'hinge', Pivot: [0.1, 0.25, 0.41], Axis: [0, 0, 1], Angle: -360}}),
			roles.Make('turret', {ID: 'top', Parts: [{Piece: 'door'}]}),
			roles.Make('socket', {ID: 'grip', Name: 'Grip', Parts: [{Piece: 'body'}]}),
			roles.Make('emitter', {ID: 'chimney', Parts: [{Piece: 'body'}], Effect: 'smoke', Rate: 4}),
			roles.Make('collider', {ID: 'wall', Parts: [{Piece: 'body'}]})
		]);

		scene = await mount(name);
		engine = scene.Engine();
		object = scene.Scene().Objects.hut;
		scene.Burst = function (type, at) {
			bursts.push([type, at]);
		};

		scene.Add('sun', {ID: 'sky', Latitude: 45, Time: 15});

		engine.Frame(performance.now());
		engine.Frame(performance.now() + 30);

		object.Strokes = [0.4, 0, 0, 0];
		object.Values.Aim = {Yaw: 30, Pitch: 0};

		engine.RigsStep(1);

		/* The shock: its wheel 0.1 of the model lower, a quarter of a Length of 0.25 more: 1.4 as long along y. */
		made = Elemenx.Service('SceneModels').Make(name);
		shock = made.Pieces.filter(function (each) {
			return each.Opening === 'role:spring';
		})[0];

		expect(object.Opens['role:spring']).toBeCloseTo(0.4, 5);
		expect(engine.OpeningMove(object, shock)[5]).toBeCloseTo(1.4, 3);

		/* The hand at three: a quarter round; the turret at its aim. */
		expect(object.Opens['role:hand']).toBeCloseTo(0.25, 2);
		expect(object.Opens['role:top']).toBe(30);

		/* The socket: the middle of the body where the hut stands, as large as it is. */
		socket = scene.Socket('hut', 'Grip');

		expect(socket.At[1]).toBeCloseTo(object.World[1] + 0.4 * 4, 0);
		expect(scene.Socket('hut', 'nothing')).toBe(null);

		/* The emitter: four bursts a second of its effect. */
		expect(bursts.length).toBe(4);
		expect(bursts[0][0]).toBe('smoke');

		/* The collider: the outline of the body. */
		expect(scene.Colliders().map(function (one) {
			return one.ID;
		})).toContain('hut:wall');
		expect(scene.Engine().ColliderHit(object.World[0], object.World[2], null, 0).ID).toBe('hut:wall');

		roles.Remove(name);
	});

	it('lights a lamp of a role as far as it is set, turns a fan while it is on, and remakes the model when the roles change', async function () {
		var name = unique('hut');
		var scene;
		var engine;
		var object;
		var key;
		var lamp;
		var fan;
		var turned;

		hut(name);

		roles.Set(name, [roles.Make('light', {ID: 'porch', Parts: [{Piece: 'door'}], Light: {Kind: 'glow', Color: '#ff0000', Glow: 2}})]);

		scene = await mount(name);
		engine = scene.Engine();
		object = scene.Scene().Objects.hut;

		engine.Frame(performance.now());

		key = Elemenx.Service('SceneModels').Make(name).Key;
		lamp = Elemenx.Service('SceneModels').Make(name).Pieces.filter(function (each) {
			return each.Opening === 'lamp-0';
		})[0];

		expect(engine.LampGlow(object, lamp)).toBe(null);

		scene.Part('hut', 'porch').Set(0.5);

		expect(engine.LampGlow(object, lamp)).toEqual([1, 0, 0]);

		roles.Set(name, [roles.Make('fan', {ID: 'spin', Parts: [{Piece: 'door'}], Motion: {Type: 'spin', Pivot: [0, 0, 0], Axis: [0, 1, 0], Speed: 1}})]);

		scene.Scene().Rest = 0;

		engine.Frame(performance.now() + 50);

		expect(Elemenx.Service('SceneModels').Make(name).Key).not.toBe(key);

		fan = Elemenx.Service('SceneModels').Make(name).Pieces.filter(function (each) {
			return each.Opening === 'role:spin';
		})[0];

		expect(fan).toBeTruthy();

		engine.RigsStep(1);

		turned = object.Opens['role:spin'];

		engine.RigsStep(0.25);

		/* On (its Open, 1: a turn a second at full speed): a quarter of a turn in a quarter of a second, round its axis. */
		expect(scene.Part('hut', 'spin').Get()).toBe(1);
		expect((object.Opens['role:spin'] - turned + 1) % 1).toBeCloseTo(0.25, 5);
		expect(engine.OpeningMove(object, fan)[0]).toBeCloseTo(Math.cos(Math.PI * 2 * object.Opens['role:spin']), 5);

		roles.Remove(name);
	});
});
