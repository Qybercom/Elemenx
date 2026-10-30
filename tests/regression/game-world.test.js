import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

/* A world in a box of its size, its ready event caught: the world itself. */
async function mount (template, state) {
	var ready = null;
	var definition = {$Template: '<div style="width: 640px; height: 400px">' + template + '</div>', Ready: function (world) {
		ready = world;
	}};
	var key;
	var component;

	for (key in state || {}) {
		definition[key] = state[key];
	}

	component = Elemenx.Component(unique('WorldHost'), definition)();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready;
	});

	return {Host: component, World: ready};
}

describe('Contract: GameMaps and GameScene, the map of a strategy game', function () {
	var maps;

	beforeAll(async function () {
		await loadElemenx();

		Use(['GameScene', 'GameObject', 'GameLayer', 'GameTerrain', 'service:GameMaps']);

		maps = Elemenx.Service('GameMaps');
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('GameMaps: its own JSON with rows of text, and a map of Tiled with its tiles, their properties and its objects', function () {
		var own = maps.Normalize({Projection: 'orthogonal', Terrain: {'*': {Name: 'lava', Color: '#ff4400', Cost: 'Infinity'}}, Layers: [{Name: 'ground', Rows: ['..~', '.*.']}], Objects: [{ID: 'hut', Kind: 'building', X: 1, Y: 0}]});
		var tiled = maps.FromTiled({
			tiledversion: '1.10.2',
			orientation: 'isometric',
			width: 2,
			height: 2,
			tilewidth: 64,
			tileheight: 32,
			tilesets: [{firstgid: 1, name: 'ground', image: 'ground.png', columns: 2, tilecount: 2, tilewidth: 64, tileheight: 32, tiles: [{id: 1, properties: [{name: 'cost', type: 'float', value: 3}, {name: 'opaque', type: 'bool', value: true}]}]}],
			layers: [
				{type: 'tilelayer', name: 'ground', width: 2, height: 2, data: [1, 2, 0, 2147483649]},
				{type: 'objectgroup', name: 'units', objects: [{id: 7, name: 'Ada', class: 'unit', x: 32, y: 64, properties: [{name: 'Team', type: 'string', value: 'blue'}]}]}
			]
		}, 'https://example.test/maps/one.tmj');

		expect([own.Width, own.Height, own.Projection, own.TileWidth]).toEqual([3, 2, 'orthogonal', 32]);
		expect(own.Layers[0].Cells).toEqual(['.', '.', '~', '.', '*', '.']);
		expect(own.Terrain['*']).toMatchObject({Name: 'lava', Cost: Infinity, Opaque: false});
		expect(own.Terrain['~'].Cost).toBe(Infinity);
		expect(own.Objects[0]).toMatchObject({ID: 'hut', Kind: 'building', X: 1, Y: 0, Width: 2, Height: 2});

		/* Tiled: a key a tile, its picture in its tileset, a flipped tile the same tile, an object in cells. */
		expect([tiled.Projection, tiled.Width, tiled.Height]).toEqual(['isometric', 2, 2]);
		expect(tiled.Layers[0].Cells).toEqual(['1', '2', null, '1']);
		expect(tiled.Terrain['2']).toMatchObject({Cost: 3, Opaque: true, Image: 'https://example.test/maps/ground.png', SourceX: 64, SourceY: 0});
		expect(tiled.Objects[0]).toMatchObject({ID: '7', Kind: 'unit', Name: 'Ada', X: 1, Y: 2, Team: 'blue'});
	});

	it('GameScene: sets no timer of no function while it is made (a page that forbids eval refuses one)', async function () {
		var original = window.setTimeout;
		var bad = [];

		window.setTimeout = function (callback) {
			if (typeof callback !== 'function')
				bad.push(String(callback));

			return original.apply(window, arguments);
		};

		try {
			await mount('<GameScene Team="blue" (ready)="Ready"><GameLayer Name="ground">\n....\n....\n</GameLayer><GameObject Kind="unit" ID="scout" X="1" Y="1" Team="blue" /></GameScene>');
		}
		finally {
			window.setTimeout = original;
		}

		expect(bad).toEqual([]);
	});

	it('GameScene: the map and the objects it declares, the ways round its buildings, its methods, the order walked to the end', async function () {
		var arrived = [];
		var ordered = [];
		var selected = [];
		var mounted = await mount(
			'<GameScene Team="blue" Projection="orthogonal" (ready)="Ready" (arrive)="Arrived" (order)="Ordered" (select)="Selected">' +
				'<GameTerrain Key="*" Name="lava" Color="#ff4400" Cost="Infinity" />' +
				'<GameLayer Name="ground">\n........\n........\n..****..\n........\n</GameLayer>' +
				'<GameObject Kind="building" ID="hall" X="5" Y="0" Width="2" Height="2" Team="blue" />' +
				'<GameObject Kind="unit" ID="scout" X="0" Y="0" Team="blue" Speed="40" />' +
				'<GameObject Kind="unit" ID="raider" X="7" Y="3" Team="red" />' +
				'<GameObject ID="tree" Kind="tree" X="0" Y="3" Blocks="true" />' +
			'</GameScene>',
			{
				Arrived: function (detail) {
					arrived.push(detail);
				},
				Ordered: function (detail) {
					ordered.push(detail);
				},
				Selected: function (detail) {
					selected.push(detail.IDs);
				}
			}
		);
		var world = mounted.World;
		var route;

		expect(world.Get('scout')).toMatchObject({ID: 'scout', Kind: 'unit', X: 0, Y: 0, Team: 'blue', Moving: false});
		expect(world.Objects(function (item) {
			return item.Kind === 'unit';
		}).map(function (item) {
			return item.ID;
		})).toEqual(['scout', 'raider']);

		/* The cells: the ground declared, the lava blocked, the hall and the tree too. */
		expect(world.Cell(1, 1)).toMatchObject({Terrain: ['grass'], Cost: 1, Opaque: false});
		expect(world.Cell(3, 2)).toMatchObject({Terrain: ['lava'], Cost: Infinity});
		expect(world.Cell(5, 1).Cost).toBe(Infinity);
		expect(world.Cell(0, 3).Cost).toBe(Infinity);
		expect(world.PathGrid().Passable(6, 0)).toBe(false);

		/* A way round what blocks it, its corners only. */
		route = world.Route({X: 0, Y: 1}, {X: 7, Y: 3});

		expect(route[0]).toEqual({X: 0, Y: 1});
		expect(route[route.length - 1]).toEqual({X: 7, Y: 3});
		expect(route.every(function (cell) {
			return world.PathGrid().Passable(cell.X, cell.Y);
		})).toBe(true);

		/* The selection: of the code; an order walked to its end. */
		world.Select(['scout']);

		expect(world.Selection()).toEqual(['scout']);
		expect(selected).toEqual([['scout']]);

		world.Order(['scout'], {X: 4, Y: 3});

		expect(ordered[0]).toMatchObject({Kind: 'move', IDs: ['scout'], X: 4, Y: 3});
		expect(world.Get('scout').Moving).toBe(true);

		await waitFor(function () {
			return arrived.length;
		}, 3000);

		expect(arrived[0]).toEqual({ID: 'scout', At: [4, 3], X: 4, Y: 3});
		expect(world.Get('scout')).toMatchObject({X: 4, Y: 3, Moving: false});
		expect(world.Near(4, 3, 1.5)).toEqual(['scout']);

		/* The code adds, changes, paints and takes away. */
		world.Add({ID: 'wall', Kind: 'building', X: 2, Y: 0, Width: 1, Height: 1});

		expect(world.Cell(2, 0).Cost).toBe(Infinity);

		world.Change('wall', {X: 3});

		expect([world.Cell(2, 0).Cost, world.Cell(3, 0).Cost]).toEqual([1, Infinity]);
		expect(world.Remove('wall')).toBe(true);
		expect(world.Cell(3, 0).Cost).toBe(1);
		expect(world.Paint(1, 1, '~')).toBe(true);
		expect(world.Cell(1, 1)).toMatchObject({Terrain: ['water'], Cost: Infinity});

		/* A unit of another team is no unit of the player: it is not ordered by them. */
		world.Stop(['scout']);

		expect(ordered[ordered.length - 1]).toMatchObject({Kind: 'stop', IDs: ['scout']});
	});

	it('GameScene: a declaration changed moves its object, one taken away takes it away; a map by its URL loads', async function () {
		var loaded = [];
		var mounted = await mount(
			'<GameScene Projection="orthogonal" [map]="Map" (ready)="Ready" (load)="Loaded">' +
				'<GameObject Kind="unit" *for="unit of Units" [id]="unit.ID" [x]="unit.X" [y]="unit.Y" />' +
			'</GameScene>',
			{
				Map: {Width: 6, Height: 4, Layers: [{Rows: ['......', '......', '......', '......']}]},
				Units: [{ID: 'a', X: 1, Y: 1}, {ID: 'b', X: 2, Y: 2}],
				Loaded: function (detail) {
					loaded.push(detail);
				}
			}
		);
		var world = mounted.World;

		expect(world.Get('a')).toMatchObject({X: 1, Y: 1});

		mounted.Host.Units = [{ID: 'a', X: 4, Y: 1}];

		await waitFor(function () {
			return world.Get('a').X === 4 && !world.Get('b');
		});

		expect(world.Objects().length).toBe(1);

		/* A map of Tiled by its URL: the objects of the map, the ones declared kept. */
		mounted.Host.Map = 'data:application/json,' + encodeURIComponent(JSON.stringify({tiledversion: '1.10.2', orientation: 'orthogonal', width: 3, height: 3, tilewidth: 32, tileheight: 32, tilesets: [], layers: [{type: 'objectgroup', objects: [{id: 1, class: 'building', x: 32, y: 32, width: 64, height: 32}]}]}));

		await waitFor(function () {
			return loaded.length && loaded[loaded.length - 1].Width === 3;
		}, 3000);

		/* The first map loaded too, when the world was made. */
		expect(loaded).toEqual([{Width: 6, Height: 4}, {Width: 3, Height: 3}]);
		expect(world.Get('1')).toMatchObject({Kind: 'building', X: 1, Y: 1, Width: 2, Height: 1});
		expect(world.Get('a')).not.toBe(null);

		await tick(10);
	});
});
