import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

/* A scene of a hilly ground, its frames made by hand. */
async function mount () {
	var ready = null;
	var component = Elemenx.Component(unique('RoadHost'), {
		$Template: '<div style="width: 320px; height: 200px"><Scene Quality="low" Labels="false" (ready)="Ready"></Scene></div>',
		Ready: function (space) {
			ready = space;
		}
	})();
	var now = performance.now() + 1000;

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready;
	}, 4000);

	ready.Scene().Loop.Stop();
	ready.Add('ground', {ID: 'land', World: Elemenx.Service('SceneWorld').Library({Size: 400, Height: 30, Water: 0, Scale: 90, Ridges: 0.3, Seed: 'roads'})});

	return {
		Scene: ready,
		Frames: function (count) {
			var i;

			for (i = 0; i < (count || 1); i++) {
				ready.Scene().Rest = 0;

				ready.Engine().Frame(now += 100);
			}
		}
	};
}

describe('Contract: the roads of a Scene: drawn as their models, the ground made level under them, what is under a point', function () {
	/* Under the load of the whole suite loading took longer than 30 s: a margin. */
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:SceneRoadGenerator']);
	}, 90000);

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('makes the ground level across a road, tells its strips and the ground off it, and its model', async function () {
		var mounted = await mount();
		var scene = mounted.Scene;
		var field;
		var road;
		var middle;
		var walk;
		var off;

		scene.Add('road', {ID: 'main', Type: 'street', Points: [[-120, -40], [0, 10], [120, 30]]});

		mounted.Frames(2);

		field = scene.Scene().Ground.Field;
		road = scene.Roads()[0];

		expect(scene.Roads().length).toBe(1);
		expect(road.ID).toBe('main');
		expect(road.TypeName).toBe('street');

		/* Level across: the ground under the middle and under the sidewalks is the level of the road, a little under it. */
		road.Points.slice(10, -10).filter(function (point, index) {
			return index % 7 === 0;
		}).forEach(function (point) {
			var across = road.Width / 2 - 1;

			[-across, 0, across].forEach(function (offset) {
				expect(field.Height(point.X + point.Way[1] * offset, point.Z - point.Way[0] * offset)).toBeCloseTo(point.Y - 0.05, 0);
			});
		});

		middle = road.Points[Math.floor(road.Points.length / 2)];
		walk = scene.SurfaceAt(middle.X + middle.Way[1] * (road.Width / 2 - 1), middle.Z - middle.Way[0] * (road.Width / 2 - 1));
		off = scene.SurfaceAt(middle.X + middle.Way[1] * 40, middle.Z - middle.Way[0] * 40);

		expect(scene.SurfaceAt(middle.X, middle.Z)).toMatchObject({Road: 'main', Strip: 'lane', Surface: 'asphalt'});
		expect(walk.Strip).toBe('sidewalk');
		expect(walk.Height).toBeCloseTo(middle.Y + 0.15, 1);
		expect(off).toMatchObject({Road: '', Surface: 'ground'});

		/* Its model is its own, at the place of the world. */
		var object = scene.Scene().Objects.main;

		expect(object.Shape.indexOf('road:main:')).toBe(0);
		expect(object.World).toEqual([0, 0, 0]);
		expect(Elemenx.Service('SceneModels').Ready(object.Shape)).toBe(true);
	}, 60000);

	/*
	 * Regression: roads and the ground were of flat colors, the same near as far. A strip is drawn by the material of its
	 * surface (SceneMaterials, the Pattern of its material made the Blueprint of it), the ground by the materials of its
	 * palettes; all of them compile. Regression too: asphalt and paving were patterns of code laid on the body of the model
	 * (paving in rows of the world, not of the road, so they ran askew where it turned): now their tiles baked (SceneTextures),
	 * by the UV of the road (across and along it), bound when the strip is drawn.
	 */
	it('draws a road by the materials of its surfaces and the ground by its own, all of them compiled', async function () {
		var mounted = await mount();
		var scene = mounted.Scene;
		var told = [];
		var tiles = [];
		var made;
		var patterns;
		var renderer = scene.Engine().Renderer;
		var draw = renderer.Draw;

		renderer.Draw = function (mesh, program, values) {
			if (values && values.uEmissiveMap)
				tiles.push(values.uEmissiveMap);

			return draw.apply(this, arguments);
		};

		scene.$On('shader', function (event) {
			told.push(event.Message);
		});
		scene.Add('road', {ID: 'paved', Type: 'street', Points: [[-110, -30], [0, 12], [110, 25]]});
		scene.SetViewpoint({Target: [0, 10, 10], Yaw: 0.5, Pitch: 0.5, Distance: 20});

		/* Its model comes of a worker; drawn, its materials are of their patterns. */
		await waitFor(function () {
			mounted.Frames(1);

			made = scene.$Service('SceneModels').Make(scene.Scene().Objects.paved.Shape);

			return made && made.Pieces.some(function (piece) {
				return piece.Material && piece.Material.Pattern === 'asphalt' && piece.Material.Blueprint;
			});
		/* Under the load of the whole suite its worker comes late (10 s were not enough): a margin. */
		}, 60000);

		patterns = made.Pieces.map(function (piece) {
			return piece.Material && piece.Material.Pattern;
		});

		expect(patterns).toContain('asphalt');
		expect(patterns).toContain('paving');
		expect(made.Pieces.some(function (piece) {
			return piece.Material.Pattern === 'asphalt' && /void blueprintSurface\(/.test(piece.Material.Blueprint || '');
		})).toBe(true);
		expect(scene.Scene().Ground.Field.Materials).toContain('lawn');

		/* By the UV of the road, the tiles of asphalt and paving (paving as it is: no hexagons to break its rows). */
		made.Pieces.forEach(function (piece) {
			if (piece.Material.Pattern === 'asphalt' || piece.Material.Pattern === 'paving') {
				expect(piece.Material.Along).toBe(true);
				expect(piece.Material.Blueprint).toContain('vec2 q = uv * 4.0;');
				expect(piece.Material.Blueprint).toContain('#define uTileColor uEmissiveMap');
			}

			if (piece.Material.Pattern === 'paving')
				expect(piece.Material.Blueprint).toContain(', -1.0, a, r, n, h, lit);');
		});

		await waitFor(function () {
			mounted.Frames(1);

			return tiles.indexOf(scene.$Service('SceneTextures').Bake(renderer, 'asphalt').Color) !== -1;
		}, 20000);

		renderer.Draw = draw;

		expect(told).toEqual([]);
	}, 120000);

	/*
	 * The furniture of a street (the Along of its type): lamps on its sidewalks, benches and bins, a bus stop, sown by the
	 * scatter wherever it goes, low as it may be; a lamp glows by itself at night, far less by day, and lights nothing.
	 */
	it('sows the furniture of a street along it, and its lamps light it at night', async function () {
		var mounted = await mount();
		var scene = mounted.Scene;
		var kinds = {};
		var road;
		var sketch;

		scene.Add('road', {ID: 'high', Type: 'street', Points: [[-120, 40], [0, 60], [120, 50]]});

		await waitFor(function () {
			mounted.Frames(2);

			return scene.SownNear(0, 60, 80).some(function (one) {
				return one.Model === 'streetlamp';
			}) && scene.Sown().Waiting === 0;
		}, 40000);

		road = scene.Roads()[0];
		sketch = scene.Scene().Ground.Field.Options.Sketch;

		expect(road.Beside.map(function (line) {
			return line.Shapes;
		})).toContain('streetlamp');
		expect(sketch.Layers[0].Items.filter(function (item) {
			return item.Type === 'row' && item.Shapes === 'streetlamp';
		})[0].MinHeight).toBe(-1000);

		scene.SownNear(0, 60, 80).forEach(function (one) {
			kinds[one.Model] = (kinds[one.Model] || 0) + 1;
		});

		expect(kinds.streetlamp).toBeGreaterThan(4);
		expect((kinds.bench || 0) + (kinds.bin || 0) + (kinds.hydrant || 0)).toBeGreaterThan(2);

		/* By night the ground tells it: what glows by itself shows all of it. */
		scene.Add('sun', {ID: 'sky', Latitude: 45, DayOfYear: 172, Time: 23.5});

		mounted.Frames(2);

		expect(scene.Scene().Ground.Night).toBe(1);

		/* Its lamps light the street at night: lights of the scene where they stand, at the height of their lanterns. */
		var lit = scene.Scene().Lamps.filter(function (lamp) {
			return lamp.Built && lamp.Settings.Night;
		});

		expect(lit.length).toBeGreaterThan(3);
		expect(lit[0].At[1] - scene.Scene().Ground.Field.Height(lit[0].At[0], lit[0].At[2])).toBeGreaterThan(3.5);
		expect(lit[0].Settings.Radius).toBeGreaterThan(15);

		scene.Change('sky', {Time: 13});

		mounted.Frames(2);

		expect(scene.Scene().Ground.Night).toBe(0);

		/* By day they are dark. */
		expect(scene.Scene().Lamps.some(function (lamp) {
			return lamp.Settings.Night;
		})).toBe(false);
	}, 60000);

	/*
	 * What is generated is edited by hand: a thing of a World changed (its override kept, made again with the World over it)
	 * or unlinked (an object of its own, saved as any other); a thing sown changed (taken away, moved, another model, the rest
	 * sown as they were) or unlinked (an object where it stood); all of it kept by Save and made again by Load.
	 */
	it('edits what is generated: its changes kept over it as it is made again, or it unlinked as an object of its own', async function () {
		var mounted = await mount();
		var scene = mounted.Scene;
		var inner = scene.Scene();
		var world = Elemenx.Service('SceneWorld').Library({Size: 400, Height: 30, Water: 0, Scale: 90, Ridges: 0.3, Seed: 'roads', Settlements: [{X: 20, Y: 10, Houses: 4}], Scatters: [{Kind: 'grove', Shapes: ['oak', 'birch'], Density: 1.2}]});
		var near;
		var other;
		var before;
		var moved;
		var id;
		var saved;

		scene.Change('land', {World: world});

		await waitFor(function () {
			mounted.Frames(2);

			return scene.Get('land-world-0') && scene.SownNear(0, 0, 200).length > 20 && scene.Sown().Waiting === 0;
		}, 30000);

		/* A thing of the World: changed, its change kept when the World is made again. */
		expect(scene.Change('land-world-0', {Houses: 2})).toBe(true);

		mounted.Frames(1);

		expect(JSON.stringify(scene.Get('land-world-0'))).toContain('"Houses":2');
		expect(JSON.stringify(scene.Save().Overrides['land-world-0'])).toContain('"Houses":2');

		/* Unlinked: an object of its own, no more of the World, saved with what was changed of it. */
		expect(scene.Unlink('land-world-0')).toBe(true);
		expect(scene.Unlink('land-world-0')).toBe(false);

		mounted.Frames(1);

		expect(scene.Get('land-world-0').Values.Generated).toBeUndefined();
		expect(JSON.stringify(scene.Save().Added.filter(function (added) {
			return added.ID === 'land-world-0';
		})[0])).toContain('"Houses":2');

		/* A thing sown: taken away, the others where they were. */
		await waitFor(function () {
			mounted.Frames(2);

			return scene.Sown().Waiting === 0 && scene.SownNear(0, 0, 200).length > 20;
		}, 30000);

		near = scene.SownNear(0, 0, 200);
		before = near.slice(1, 6).map(function (one) {
			return [one.Key, one.X, one.Z];
		});

		expect(near[0].Key).toMatch(/:/);
		expect(scene.ChangeSown(near[0].Key, {Remove: true})).toBe(true);

		await waitFor(function () {
			mounted.Frames(2);

			return scene.Sown().Waiting === 0 && scene.SownNear(0, 0, 200).length > 20;
		}, 30000);

		other = scene.SownNear(0, 0, 200);

		expect(other.some(function (one) {
			return one.Key === near[0].Key;
		})).toBe(false);

		before.forEach(function (one) {
			var same = other.filter(function (each) {
				return each.Key === one[0];
			})[0];

			expect(same.X).toBeCloseTo(one[1], 3);
			expect(same.Z).toBeCloseTo(one[2], 3);
		});

		/* Moved and made another model. */
		scene.ChangeSown(before[0][0], {X: before[0][1] + 3, Model: 'pine'});

		await waitFor(function () {
			mounted.Frames(2);

			moved = scene.SownNear(before[0][1] + 3, before[0][2], 0.5).filter(function (one) {
				return one.Key === before[0][0];
			})[0];

			return moved && scene.Sown().Waiting === 0;
		}, 30000);

		expect(moved.Model).toBe('pine');

		/* Unlinked: an object of kind thing where it stood, sown no more. */
		id = scene.UnlinkSown(before[1][0]);

		expect(scene.Get(id).Kind).toBe('thing');
		expect(scene.Get(id).Values.X).toBeCloseTo(before[1][1], 1);
		expect(scene.UnlinkSown('nothing:0:0')).toBe(null);

		/* Saved, and made again so by Load. */
		saved = scene.Save();

		expect(saved.Sown[near[0].Key]).toEqual({Remove: true});
		expect(saved.Sown[before[1][0]]).toEqual({Remove: true});

		scene.ChangeSown(near[0].Key, null);
		scene.Load(saved);

		expect(Elemenx.Instance(scene.$Element()).Engine().SownEdits()[near[0].Key]).toEqual({Remove: true});
		expect(inner.Objects[id]).toBeTruthy();
	}, 120000);

	/*
	 * Regression: where the hill over a tunnel is lower than its vault the cut opens it to the sky, and grass grew there at the
	 * height of the ground before the cut, inside the lining. Those parts are kept bare as a road is.
	 */
	it('keeps no grass where a tunnel cut the ground away under the sky', async function () {
		var mounted = await mount();
		var scene = mounted.Scene;
		var pool = Elemenx.Service('SceneTerrainGenerator').Work();
		var run = pool.Run;
		var freed = [];

		pool.Run = function (service, method, args) {
			if (method === 'Free')
				freed.push(args[2]);

			return run.apply(this, arguments);
		};

		try {
			scene.Quality = 'medium';

			scene.Add('grass', {ID: 'lawn'});
			scene.Add('road', {ID: 'low', Type: 'road', Tunnels: [[40, 140]], Points: [[-80, 20], [120, 20]]});

			await waitFor(function () {
				mounted.Frames(1);

				return freed.some(function (lines) {
					return lines.some(function (line) {
						return line.Reach > 5 && line.Points.length > 1 && line.Points.every(function (point) {
							return Math.abs(point[1] - 20) < 1;
						});
					});
				});
			}, 20000);

			var cut = scene.Engine().RoadsCarves()[0];

			expect(freed.slice(-1)[0].some(function (line) {
				return line.Reach === cut.Width / 2 + 1;
			})).toBe(true);
		}
		finally {
			pool.Run = run;
		}
	}, 60000);

	/*
	 * Regression: the squares of the volume over a tunnel stayed as coarse as the ground round them, and on a grid of metres
	 * its roof and floor broke into slabs with holes. Near the eye they are made as fine as a metre a cell.
	 */
	it('makes the squares of the ground over a tunnel near the eye as fine as a metre a cell', async function () {
		var mounted = await mount();
		var scene = mounted.Scene;
		var fine;

		scene.Add('road', {ID: 'low', Type: 'road', Tunnels: [[40, 140]], Points: [[-80, 20], [120, 20]]});

		mounted.Frames(2);

		scene.SetViewpoint({Target: [40, 10, 20], Yaw: 0, Pitch: 0.5, Distance: 150});

		fine = await waitFor(function () {
			var ground = scene.Scene().Ground;
			var volume = ground.Field.Volume;

			mounted.Frames(1);

			return volume && Object.keys(ground.Nodes).some(function (key) {
				var node = ground.Nodes[key];

				return node.Size && node.Size / 32 <= 1 && volume.Touches(node.Center[0] - node.Size / 2, node.Center[2] - node.Size / 2, node.Center[0] + node.Size / 2, node.Center[2] + node.Size / 2);
			});
		}, 30000);

		expect(fine).toBe(true);
	}, 60000);

	it('leaves the ground as it is under a bridge and over a tunnel, and gives the road its piers and portals', async function () {
		var mounted = await mount();
		var scene = mounted.Scene;
		var under;
		var over;

		mounted.Frames(1);

		under = scene.Scene().Ground.Field.Height(-20, 20);
		over = scene.Scene().Ground.Field.Height(80, 20);

		scene.Add('road', {ID: 'high', Type: 'road', Bridges: [[40, 80]], Tunnels: [[140, 180]], Points: [[-80, 20], [120, 20]]});

		mounted.Frames(2);

		expect(scene.Roads()[0].Spans.length).toBe(2);
		expect(scene.Scene().Ground.Field.Height(-20, 20)).toBeCloseTo(under, 3);

		/*
		 * Over the tunnel the ground as it was where the hill is over its vault (found in its volume now, to a few millimetres);
		 * where it is lower, its box is cut whole, no crust kept, down to the vault of its lining (7 m over the road)...
		 */
		var vault = scene.Roads()[0].Points.filter(function (point) {
			return Math.abs(point.X - 80) < 3;
		})[0].Y + 7;

		if (over > vault + 0.5) expect(Math.abs(scene.Scene().Ground.Field.Height(80, 20) - over)).toBeLessThan(0.2);
		else expect(scene.Scene().Ground.Field.Height(80, 20)).toBeLessThan(vault + 0.5);

		/* ...and under it a hole cut through the hill (Carves of the roads), its floor just under the road. */
		expect(scene.Engine().RoadsCarves().length).toBeGreaterThan(0);
		expect(scene.Scene().Ground.Field.Volume).toBeTruthy();
		expect(scene.Scene().Ground.Field.Height(80, 20, scene.Roads()[0].Points.filter(function (point) {
			return Math.abs(point.X - 80) < 3;
		})[0].Y + 0.5)).toBeLessThan(over - 2);
		/* Off them the ground is levelled under it. */
		expect(scene.Scene().Ground.Field.Height(10, 20)).toBeCloseTo(scene.SurfaceAt(10, 20).Height - 0.05, 0);
	});

	it('makes the road again as it changes, and the ground of its old line as it was', async function () {
		var mounted = await mount();
		var scene = mounted.Scene;
		var before;

		mounted.Frames(1);

		before = scene.Scene().Ground.Field.Height(0, 60);

		scene.Add('road', {ID: 'side', Type: 'country', Points: [[-100, 60], [100, 60]]});

		mounted.Frames(2);

		var first = scene.Scene().Objects.side.Shape;

		scene.Change('side', {Points: [[-100, -60], [100, -60]]});

		mounted.Frames(2);

		expect(scene.Scene().Objects.side.Shape).not.toBe(first);
		expect(scene.Roads()[0].Points[0].Z).toBeCloseTo(-60);
		expect(scene.Scene().Ground.Field.Height(0, 60)).toBeCloseTo(before, 3);

		scene.Remove('side');

		mounted.Frames(2);

		expect(scene.Roads()).toEqual([]);
	});
	/* Interchanges: found where a motorway and a road meet one over the other, their ramps roads drawn by objects of their own. */
	it('makes the interchanges of its roads, tells them in Interchanges, and draws their ramps as roads of their own', async function () {
		var mounted = await mount();
		var scene = mounted.Scene;
		var found;

		scene.Add('road', {ID: 'main', Type: 'motorway', Points: [[-600, 0], [600, 0]]});
		scene.Add('road', {ID: 'side', Type: 'road', Points: [[0, -300], [0, 300]]});

		mounted.Frames(2);

		found = scene.Interchanges();

		expect(found.map(function (one) {
			return [one.Form, one.Roads.slice().sort(), one.Ramps.length];
		})).toEqual([['diamond', ['main', 'side'], 4]]);
		expect(scene.Roads().filter(function (road) {
			return road.Ramp === found[0].ID;
		}).length).toBe(4);

		/* Their objects come after the frame, and the roads of the network are not made again of them. */
		await waitFor(function () {
			return found[0].Ramps.every(function (id) {
				return scene.Get(id);
			});
		}, 4000);

		mounted.Frames(2);

		expect(scene.Roads().length).toBe(6);
		expect(scene.Interchanges().length).toBe(1);
	});

	it('meets roads at junctions, found or of kind junction, and tells their ground', async function () {
		var mounted = await mount();
		var scene = mounted.Scene;
		var junction;
		var under;

		scene.Add('road', {ID: 'a', Type: 'road', Points: [[-100, 0], [100, 0]]});
		scene.Add('road', {ID: 'b', Type: 'road', Points: [[0, -100], [0, 100]]});
		scene.Add('junction', {ID: 'square', X: 80, Y: 0, Radius: 14, Surface: 'paving'});

		mounted.Frames(2);

		expect(scene.Junctions().map(function (one) {
			return one.ID;
		}).sort()).toEqual(['junction-1', 'square']);

		junction = scene.Junctions().filter(function (one) {
			return one.ID !== 'square';
		})[0];
		under = scene.SurfaceAt(5.2, 5.2);

		/* Out of both roads, in the corner of the junction. */
		expect(under).toMatchObject({Road: junction.ID, Strip: 'junction', Surface: 'asphalt'});
		expect(under.Height).toBeCloseTo(junction.Y);
		expect(scene.SurfaceAt(80, 12)).toMatchObject({Road: 'square', Surface: 'paving'});
		expect(scene.Scene().Ground.Field.Height(5.2, 5.2)).toBeCloseTo(junction.Y - 0.05, 1);
	});
	/* Regression (of Tracks): a corner of a car went through the barrier at speed and at an angle. */
	it('holds a car inside the barriers of a track by its corners, at any speed and at any angle', async function () {
		var mounted = await mount();
		var scene = mounted.Scene;
		var inner = scene.Scene();
		var roads = Elemenx.Service('SceneRoads');
		var track = Elemenx.Service('SceneRoadGenerator').Track('walls', {Length: 1200, Corners: 9, Gap: -9});
		var start = track.Start;
		var road;
		var wall;
		var worst = 0;
		var met = 0;
		var i;

		scene.Add('road', track.Spec);

		mounted.Frames(2);

		road = scene.Roads()[0];
		wall = road.Barriers[1].Offset;

		scene.Add('unit', {ID: 'car', Name: '', Size: 1, X: start.X, Y: start.Z, Vehicle: {Kind: 'car', Heading: start.Heading + 0.9, Long: 2.3, Wide: 1, Power: 1400000, Top: 120}});
		scene.Control('car');

		var car = inner.Objects.car;

		for (i = 0; i < 700; i++) {
			inner.Ground.Keys = i % 140 < 70 ? {KeyW: true, KeyA: true} : {KeyW: true, KeyD: true};

			mounted.Frames(1);

			var state = car.Car;
			var ahead = [Math.sin(state.Heading), Math.cos(state.Heading)];

			[[2.3, 1], [2.3, -1], [-2.3, 1], [-2.3, -1]].forEach(function (corner) {
				var x = state.X + ahead[0] * corner[0] + ahead[1] * corner[1];
				var z = state.Z + ahead[1] * corner[0] - ahead[0] * corner[1];
				var near = Math.abs(roads.Near(road, x, z).Offset);

				worst = Math.max(worst, near);
				met = near > wall - 0.3 ? met + 1 : met;
			});
		}

		expect(met).toBeGreaterThan(0);
		expect(worst).toBeLessThan(wall);
	}, 60000);
	it('stands barriers of kind barrier along a road its Road names, or on points of their own, and they stop a car', async function () {
		var mounted = await mount();
		var scene = mounted.Scene;
		var free;

		scene.Add('road', {ID: 'main', Type: 'road', Points: [[-100, 0], [100, 0]]});
		scene.Add('barrier', {ID: 'side', Road: 'main', Side: 'left', Type: 'wall', Color: '#aa2211', From: 20, To: 120});
		scene.Add('barrier', {ID: 'pen', Type: 'fence', Points: [[30, 30], [60, 30], [60, 60], [30, 60]], Closed: true});

		mounted.Frames(2);

		expect(scene.Roads()[0].Barriers).toEqual([expect.objectContaining({Kind: 'wall', Color: '#aa2211', From: 20, To: 120})]);
		expect(scene.Scene().Objects.pen.Shape.indexOf('barrier:pen:')).toBe(0);
		expect(scene.Scene().Objects.pen.World).toEqual([0, 0, 0]);
		expect(Elemenx.Service('SceneModels').Ready(scene.Scene().Objects.pen.Shape)).toBe(true);

		/* A corner past the fence of the pen, from inside it; the wall of the road, from the road. */
		free = scene.Engine().BarrierHit(45, 61, 45, 55);

		expect(free).not.toBeNull();
		expect(free.Normal[1]).toBeCloseTo(-1, 1);
		expect(scene.Engine().BarrierHit(-50, 5, -50, 2)).not.toBeNull();
		expect(scene.Engine().BarrierHit(50, 5, 50, 2)).toBeNull();

		/* Not a surface: the ground under the fence. */
		expect(scene.SurfaceAt(45, 30).Road).toBe('');

		scene.Remove('pen');
		scene.Remove('side');

		mounted.Frames(2);

		expect(scene.Roads()[0].Barriers).toEqual([]);
		expect(scene.Engine().BarrierHit(45, 61, 45, 55)).toBeNull();
	});
});
