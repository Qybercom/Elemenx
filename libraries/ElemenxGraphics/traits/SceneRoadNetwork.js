/*
 * The roads of a Scene: an object of kind road (the trait Road: Type of the SceneRoads Service, Points [[x, z] or [x, z, y]]
 * through which it goes, Closed, Width, Height over its line; Bridges and Tunnels [[from, to]] in metres along it, or
 * Structures: true to find them where it goes Clear metres over the ground or Cover under it; Barriers; Along: lines of
 * things beside it) is drawn as its model, and the ground is made level under it, cut where it goes through a hill and
 * filled where it crosses a hollow: a point with no height of its own takes the one of the ground there, and the road goes
 * smoothly between them. A bridge stands on piers over the ground as it is, a tunnel goes under it between its portals.
 * Roads that cross or end on one another meet at a junction, found by itself, or an object of kind junction (the trait
 * Junction: Radius, Surface) at its X and Y; the roads come to its level and their paint stops at it. An object of kind
 * barrier (the trait Barrier: Type (guardrail, wall, jersey, tyres, fence), Height, Color, Step) stands along the road its Road names (Side, Gap, From, To) or on
 * Points of its own (Closed), apart from any road.
 * SurfaceAt(x, z) tells what is under a point, a road, a junction or the ground: {Road (its ID, empty on the ground),
 * Strip, Surface, Height, Grip, Drag}; Roads() gives the roads as SceneRoads makes them, Junctions() the junctions, for
 * what follows them (a car, a train, a walker on a path); BarrierHit(x, z, fromX, fromZ) whether a point went through a
 * barrier of a road.
 */
Elemenx.Trait('SceneRoadNetwork', {
	RoadsStart: function () {
		var self = this;
		var scene = this.Scene();
		var engine = this.Engine();
		var roads = this.$Service('SceneRoads');
		var models = this.$Service('SceneModels');
		var terrain = this.$Service('SceneTerrainGenerator');
		var random = this.$Service('Random');
		var state = {Key: '', Made: [], Free: [], Junctions: [], Sketch: null, Given: null, Names: {}, Version: 0};

		function objects () {
			return (scene.Order || []).filter(function (object) {
				return object.Traits && object.Traits.Road && (object.Traits.Road.Points || []).length > 1;
			});
		}

		function junctions () {
			return (scene.Order || []).filter(function (object) {
				return object.Traits && object.Traits.Junction;
			});
		}

		function barriers () {
			return (scene.Order || []).filter(function (object) {
				return object.Traits && object.Traits.Barrier && (object.Traits.Barrier.Road || (object.Traits.Barrier.Points || []).length > 1);
			});
		}

		/* The barrier of an object, as a road has it. */
		function barrier (object) {
			var given = object.Traits.Barrier;

			return {Side: given.Side, Kind: given.Type, Height: given.Height, Gap: given.Gap, From: given.From, To: given.To, Color: given.Color, Step: given.Step};
		}

		function spec (object) {
			var given = object.Traits.Road;

			return {ID: object.ID, Type: given.Type, Points: given.Points, Closed: given.Closed === true || given.Closed === 'true', Width: given.Width, Height: given.Height, Bridges: given.Bridges, Tunnels: given.Tunnels, Structures: given.Structures, Clear: given.Clear, Cover: given.Cover, Barriers: given.Barriers, Along: given.Along, Marks: given.Marks, Straight: given.Straight, Segments: given.Segments, Radii: given.Radii};
		}

		/* The network again: the roads, their junctions, a model of each road, and the layer of the sketch under them. */
		function make (found, settings, sketch, key) {
			var field = terrain.Flat(sketch ? Object.assign({}, settings, {Sketch: sketch}) : settings);
			var ground = function (x, z) {
				return Math.max(0, field.Height(x, z));
			};
			var fences = barriers();
			var network = roads.Network(found.map(function (object) {
				var made = spec(object);

				made.Barriers = (made.Barriers || []).concat(fences.filter(function (fence) {
					return fence.Traits.Barrier.Road === object.ID;
				}).map(barrier));

				return made;
			}), junctions().map(function (object) {
				return {ID: object.ID, X: Number(object.Values.X) || 0, Z: Number(object.Values.Y) || 0, Radius: object.Traits.Junction.Radius, Surface: object.Traits.Junction.Surface};
			}), {Height: ground});
			var hash = random.Hash(key);

			state.Made = network.Roads;
			state.Junctions = network.Junctions;
			state.Version++;

			/* A barrier of a line of its own: a model of its own. */
			state.Free = fences.filter(function (fence) {
				return !fence.Traits.Barrier.Road;
			}).map(function (fence) {
				var made = roads.FreeBarrier(Object.assign(barrier(fence), {ID: fence.ID, Points: fence.Traits.Barrier.Points, Smooth: fence.Traits.Barrier.Smooth, Closed: fence.Traits.Barrier.Closed === true || fence.Traits.Barrier.Closed === 'true'}), {Height: ground});
				var name = 'barrier:' + fence.ID + ':' + hash;
				if (!models.Has(name))
					models.Define(name, {URL: name, Asset: roads.Asset([made]), Fit: false, Type: 'prop'});

				state.Names[fence.ID] = name;

				return made;
			});

			/* A junction is drawn with the first road it holds. */
			state.Made.forEach(function (road) {
				var name = 'road:' + road.ID + ':' + hash;
				if (!models.Has(name))
					models.Define(name, {URL: name, Asset: roads.Asset([road], {Height: ground, Junctions: state.Junctions.filter(function (junction) {
						return junction.Roads[0] === road.ID;
					})}), Fit: false, Type: 'prop'});

				state.Names[road.ID] = name;
			});

			state.Sketch = {Layers: (sketch && sketch.Layers || []).concat([{ID: 'roads', Name: 'roads', Visible: true, Strength: 1, Items: roads.Sketch(state.Made, state.Junctions).map(function (item, index) {
				/* A little under the road: its squares, coarser than it, never show through it. */
				return Object.assign(item, {ID: 'road-' + item.Road + '-' + index, Points: item.Points.map(function (point) {
					return item.Type === 'road' ? [point[0], point[1], point[2] - 0.05] : point;
				})}, item.Type === 'flatten' ? {Height: item.Height - 0.05} : {});
			})}])};
		}

		/*
		 * The sketch of a ground with the roads over it, a layer of their lines at the levels of the roads. The roads take their
		 * heights from the ground as it is without them, made again only when a road or the ground changes.
		 */
		engine.RoadsSketch = function (settings, sketch) {
			var found;
			var key;
			/* Every frame asks: nothing changed in the scene, nothing to look at. */
			var quick = scene.Version + ':' + JSON.stringify(settings);
			if (state.Quick === quick && state.Given === sketch)
				return state.Made.length || state.Free.length ? state.Sketch : sketch;

			state.Quick = quick;
			state.Given = sketch;
			found = objects();

			if (!found.length && !barriers().length) {
				if (state.Made.length || state.Free.length)
					state.Version++;

				state.Made = [];
				state.Free = [];
				state.Junctions = [];
				state.Key = '';

				return sketch;
			}

			key = JSON.stringify([settings, sketch, found.map(function (object) {
				return [object.ID, object.Traits.Road];
			}), junctions().map(function (object) {
				return [object.ID, object.Values.X, object.Values.Y, object.Traits.Junction];
			}), barriers().map(function (object) {
				return [object.ID, object.Traits.Barrier];
			})]);

			if (key !== state.Key) {
				state.Key = key;

				make(found, settings, sketch, key);
			}

			/* The model of a road or a barrier is its own: an object made again takes it again. */
			found.concat(barriers()).forEach(function (object) {
				object.Shape = state.Names[object.ID];
			});

			return state.Sketch;
		};

		engine.Roads = function () {
			return state.Made;
		};

		engine.Junctions = function () {
			return state.Junctions;
		};

		engine.SurfaceAt = function (x, z) {
			var under = roads.Under(state.Made, x, z);
			var junction = under ? null : roads.JunctionAt(state.Junctions, x, z);
			var field = scene.Ground && scene.Ground.Field;
			var surface;

			if (under)
				return under;

			if (junction) {
				surface = roads.Surface(junction.Surface);

				return {Road: junction.ID, Strip: 'junction', Surface: junction.Surface, Height: junction.Y, Grip: surface.Grip, Drag: surface.Drag};
			}

			return {Road: '', Strip: '', Surface: 'ground', Height: field ? Math.max(0, field.Height(x, z)) : 0, Grip: 1, Drag: 0};
		};

		engine.BarrierHit = function (x, z, fromX, fromZ, hints) {
			return state.Made.length || state.Free.length ? roads.BarrierHit(state.Made.concat(state.Free), x, z, fromX, fromZ, hints) : null;
		};

		self.RoadsState = state;
	},

	/* What is under a point of the ground, a road, a junction or the ground: {Road, Strip, Surface, Height, Grip, Drag}. */
	SurfaceAt: function (x, z) {
		return this.Engine().SurfaceAt(x, z);
	},

	/* The roads of the scene as SceneRoads makes them: [{ID, Type, Width, Strips, Points, Spans, Barriers}]. */
	Roads: function () {
		return this.Engine().Roads();
	},

	/* The junctions of the roads of the scene: [{ID, X, Y, Z, Radius, Surface, Roads}]. */
	Junctions: function () {
		return this.Engine().Junctions();
	}
});
