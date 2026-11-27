import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';
function hash (value) {
	var text = JSON.stringify(value);
	var h = 5381;
	var i;

	for (i = 0; i < text.length; i++)
		h = (h * 33 + text.charCodeAt(i)) >>> 0;

	return h.toString(16) + ':' + text.length;
}

function ring (x, z, r, n, wobble) {
	var points = [];
	var i;

	for (i = 0; i < (n || 12); i++)
		points.push([x + Math.cos(i / (n || 12) * Math.PI * 2) * r * (1 + (wobble || 0) * Math.sin(i * 1.7)), z + Math.sin(i / (n || 12) * Math.PI * 2) * r]);

	return points;
}

var cases = [];
['hamlet', 'village', 'town', 'city', 'fort'].forEach(function (kind, k) {
	[60, 140, 260, 520].forEach(function (r, j) {
		cases.push({Item: {ID: kind + '-' + r, Type: 'settlement', Kind: kind, Points: ring(k * 50, j * 40, r, 14, 0.2)}, Others: []});
	});
});
['grid', 'main', 'road', 'radial', 'districts'].forEach(function (layout) {
	cases.push({Item: {ID: 'l-' + layout, Type: 'settlement', Kind: 'town', Layout: layout, Seed: 'x' + layout, Points: ring(0, 0, 600, 16, 0.1)}, Others: [{Type: 'road', Points: [[-900, 30], [900, -60]], Width: 8}, {Type: 'river', Points: [[-900, -300], [900, 280]], Width: 20}, {Type: 'square', Points: ring(100, 100, 30, 6)}, {Type: 'district', Kind: 'industrial', Points: ring(300, -200, 200, 8)}]});
	cases.push({Item: {ID: 's-' + layout, Type: 'settlement', Kind: 'city', Layout: layout, Slope: 0.08, Contour: 0.7, Density: 0.6, Walls: true, Points: ring(50, -20, 380, 10, 0.3)}, Others: [{Type: 'road', Points: [[-600, -500], [0, 0], [600, 400]], Width: 6}]});
});
cases.push({Item: {ID: 'drawn', Type: 'settlement', Kind: 'village', Points: ring(0, 0, 200, 10)}, Others: [{Type: 'street', Points: [[-150, 0], [150, 10]], Width: 7, Road: 'cobbles'}, {Type: 'street', Points: [[0, -150], [5, 150]]}]});
cases.push({Item: {ID: 'tiny', Type: 'settlement', Kind: 'village', Points: [[0, 0], [10, 0]]}, Others: []});

var flat = function (x, z) {
	return Math.sin(x / 300) * 6 + Math.cos(z / 250) * 4 + 10;
};
var nets = [
	[[{ID: 'A', Type: 'motorway', Points: [[-1000, 0], [1000, 0]]}, {ID: 'B', Type: 'road', Points: [[0, -1000], [0, 1000]]}], []],
	[[{ID: 'A', Type: 'motorway', Points: [[-1000, 0], [1000, 0]]}, {ID: 'B', Type: 'highway', Points: [[0, -1000], [0, 1000]]}], []],
	[[{ID: 'A', Type: 'motorway', Points: [[-1000, 0], [1000, 0]]}, {ID: 'B', Type: 'motorway', Points: [[0, -1000], [0, 1000]]}], []],
	[[{ID: 'A', Type: 'motorway', Points: [[-1000, 0], [1000, 0]]}, {ID: 'B', Type: 'road', Points: [[0, -1000], [0, 1000]]}], [{ID: 'told', X: 0, Z: 0, Kind: 'roundabout'}]],
	[[{ID: 'A', Type: 'motorway', Points: [[-1000, 0], [1000, 0]]}, {ID: 'B', Type: 'road', Points: [[0, -1000], [0, 1000]]}], [{ID: 'told', X: 0, Z: 0, Kind: 'cloverleaf'}]],
	[[{ID: 'A', Type: 'motorway', Points: [[-1000, 0], [1000, 0]]}, {ID: 'B', Type: 'road', Points: [[0, -800], [0, 0]]}], []],
	[[{ID: 'A', Type: 'motorway', Points: [[-1200, -100], [0, 50], [1200, 0]]}, {ID: 'B', Type: 'road', Points: [[300, -1000], [-200, 1000]]}, {ID: 'C', Type: 'highway', Points: [[-1100, 600], [1100, -700]]}], []]
];

/* The hashes of the plans the code of SettlementPlan made of each, in their order. */
var made = ['33b60f18:5874', 'febfcb5:16204', '846af689:31671', '471e41c4:63585', '2e131093:6316', 'afd5ab22:16825', '39ecb092:29299', '9b1f7087:64498', '8b9d5ca:4506', 'ae906966:20535', '8221f6af:86019', '16c1dbf0:291938', '5a468ebe:1766', '5da3e11d:6907', '63758055:39356', '10066605:113719', '31d3312e:6403', '39c2e4ca:27695', '5fffdd67:92709', 'bc48f3c4:368065', '79547:369502', '3a1363c6:37160', '85d6a5e5:47410', '656facd:10287', 'd79d1949:62003', 'e4ab6b88:18482', 'f4cc2ec6:375643', 'cc91aee0:61896', 'a170dac0:366158', '36979e85:52214', 'cf899141:10434', 'e9a30959:87'];

/*
 * Regression: the plan of a settlement (its streets of five layouts, its lots, its walls and gates) was made in the code
 * alone, 710 lines of it, its numbers there. It is a graph of a layout of the library now (blueprints/layout: grid, main,
 * road, radial, districts), each stage a block of LayoutBlueprints and its numbers their properties, and each plan the
 * very one the code made: of each kind and size, each layout with roads, a river, a square and a district through it, on
 * a hillside, walled, of streets drawn in it, and of too few points.
 */
describe('Regression: the plans of settlements, graphs of layouts of the library', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneTerrainGenerator', 'service:LayoutBlueprints', 'service:SceneBiomes', 'service:SceneRoads']);
	}, 60000);

	it('lays each settlement out as the code did', function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');

		expect(cases.length).toBe(made.length);

		cases.forEach(function (one, index) {
			expect(hash(terrain.SettlementPlan(one.Item, one.Others.concat([one.Item]), function (name) {
				return terrain.SettlementSizes[name] || null;
			}))).toBe(made[index]);
		});
	});

	/* Regression: a village of SceneBiomes was laid out in the code alone; it is the graph layout/village now. */
	it('lays a village on a ground as the code did', function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var biomes = Elemenx.Service('SceneBiomes');
		var wanted = ['93387fd9:919', '4b6569c5:1382', '1cfbfc62:655', 'f1573dff:2181', '6317c93c:916', '6043301b:1804', 'ba3d3285:657', '71349c74:2176'];
		var fields = [terrain.Flat({Size: 600, Height: 30, Water: 0.1, Seed: 'v1'}), terrain.Flat({Size: 800, Height: 90, Water: 0.3, Seed: 'hills'})];
		var cases = [{}, {X: 80, Y: -60, Houses: 12, Radius: 45, Seed: 'a'}, {X: -150, Y: 120, Houses: 5, Seed: 7, Shapes: ['house', 'tower']}, {Houses: 20, Radius: 60, Seed: 'big'}];
		var made = [];

		fields.forEach(function (field) {
			cases.forEach(function (options) {
				made.push(hash(biomes.Village(field, options)));
			});
		});

		expect(made).toEqual(wanted);
	});

	/*
	 * Regression: the ramps of the interchanges of a network of roads (diamond, roundabout, cloverleaf, stack, trumpet) were laid
	 * out in the code alone; each form is a graph of a layout now (blueprints/layout/<form>), its numbers the properties of
	 * its block, and the network the very one the code made.
	 */
	it('lays out the interchanges of a network of roads as the code did', function () {
		var roads = Elemenx.Service('SceneRoads');
		var wanted = ['9832e477:298482', 'f9d6fb99:415810', '59afe3ae:427387', '7db7cab0:298627', 'e4952f4e:414341', 'eeab76d5:265133', '2be25400:1093159'];

		expect(nets.map(function (net) {
			var made = roads.Network(JSON.parse(JSON.stringify(net[0])), JSON.parse(JSON.stringify(net[1])), {Height: flat});

			return hash([made.Roads, made.Junctions, made.Interchanges]);
		})).toEqual(wanted);
		expect(roads.InterchangePlaces('stack')).toEqual([-430, -320, 320, 430]);
	});

	it('runs the layouts of the library as code, carried to the workers', function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');

		terrain.LayoutNames.forEach(function (name) {
			expect(typeof terrain.LayoutRun(name)).toBe('function');
			expect(typeof terrain.LayoutCode[name]).toBe('string');
		});

		expect(terrain.Carried).toEqual(expect.arrayContaining(['LayoutNames', 'LayoutCode']));
	});
});
