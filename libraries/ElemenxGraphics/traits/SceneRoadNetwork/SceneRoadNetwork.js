/*
 * The roads of a Scene: an object of kind road (the trait Road: Type of the SceneRoads Service, Points [[x, z] or [x, z, y]]
 * through which it goes, Closed, Width, Height over its line; Bridges and Tunnels [[from, to]] in metres along it, or
 * Structures: true to find them where it goes Clear metres over the ground or Cover under it; Barriers; Along: lines of
 * things beside it) is drawn as its model, and the ground is made level under it, cut where it goes through a hill and
 * filled where it crosses a hollow: a point with no height of its own takes the one of the ground there, and the road goes
 * smoothly between them. A bridge stands on piers over the ground as it is, a tunnel goes under it between its portals,
 * through a hole cut in the ground (Carves of tunnel: RoadsCarves of the engine, SceneRoads.Carves), lit by lamps along its vault.
 * Roads that cross or end on one another meet at a junction, found by itself, or an object of kind junction (the trait
 * Junction: Radius, Surface, Form: ring for a roundabout, else found by its arms) at its X and Y; the roads come to its level
 * and their paint stops at it. An object of kind
 * barrier (the trait Barrier: Type (guardrail, wall, jersey, tyres, fence), Height, Color, Step) stands along the road its Road names (Side, Gap, From, To) or on
 * Points of its own (Closed), apart from any road.
 * SurfaceAt(x, z) tells what is under a point, a road, a junction or the ground: {Road (its ID, empty on the ground),
 * Strip, Surface, Height, Grip, Drag}; Roads() gives the roads as SceneRoads makes them, Junctions() the junctions, for
 * what follows them (a car, a train, a walker on a path); BarrierHit(x, z, fromX, fromZ) whether a point went through a
 * barrier of a road.
 * The streets of the settlements of its sketch (their plans, SceneTerrainGenerator.SettlementPlan) are roads too, made with
 * the ground at once: a city or a town has streets, a village country roads, a hamlet gravel, a fort alleys, as wide as the
 * plan has them; each is drawn by an object of kind road of its own (street-<settlement>-<n>), none for a settlement of
 * Roads false.
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
		var state = {Key: '', Made: [], Free: [], Junctions: [], Sketch: null, Given: null, Names: {}, Version: 0, Streets: [], StreetsOf: null, StreetIDs: {}, Carried: ''};
		var streetTypes = {city: 'street', town: 'street', village: 'country', hamlet: 'gravel', fort: 'alley'};

		/* The streets of the settlements of a sketch as specs of roads; they come of the sketch alone, so the same sketch gives the same ones. */
		function streetsOf (sketch) {
			var items = [];
			var made = [];

			if (state.StreetsOf === sketch) return state.Streets;

			(sketch && sketch.Layers || []).forEach(function (layer) {
				if (layer.Visible !== false && layer.Visible !== 'false')
					items = items.concat(layer.Items || []);
			});

			items.forEach(function (item) {
				if (item.Type !== 'settlement' || item.Visible === false || item.Roads === false || item.Roads === 'false' || !item.Points || item.Points.length < 3) return;

				terrain.SettlementPlan(item, items, function (name) {
					return terrain.SettlementSizes[name] || null;
				}).Streets.forEach(function (street, index) {
					if (street.Points && street.Points.length > 1)
						made.push({ID: 'street-' + item.ID + '-' + index, Type: streetTypes[item.Kind] || 'street', Width: Number(street.Width) || 0, Points: street.Points});
				});
			});

			state.StreetsOf = sketch;
			state.Streets = made;
			state.StreetIDs = {};

			made.forEach(function (street) {
				state.StreetIDs[street.ID] = true;
			});

			return made;
		}

		/* The objects that draw the streets: one of each, added after the frame (and those of streets gone taken away). */
		function carry (streets) {
			var key = JSON.stringify(streets);
			if (state.Carried === key) return;

			state.Carried = key;

			window.setTimeout(function () {
				var wanted = {};

				streets.forEach(function (street) {
					wanted[street.ID] = true;

					if (!scene.Objects[street.ID])
						self.Add('road', Object.assign({Name: ''}, street));
				});

				(state.CarriedIDs || []).forEach(function (id) {
					if (!wanted[id] && scene.Objects[id])
						self.Remove(id);
				});

				state.CarriedIDs = Object.keys(wanted);
			}, 0);
		}

		function objects () {
			return (scene.Order || []).filter(function (object) {
				return object.Traits && object.Traits.Road && (object.Traits.Road.Points || []).length > 1 && !state.StreetIDs[object.ID];
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
		function make (found, settings, sketch, key, streets) {
			var options = sketch ? Object.assign({}, settings, {Sketch: sketch}) : settings;
			var field = terrain.Flat(options);
			var ground = function (x, z) {
				return Math.max(0, field.Height(x, z));
			};
			var pool = roads.Work();
			var fences = barriers();
			var network = roads.Network(found.map(function (object) {
				var made = spec(object);

				made.Barriers = (made.Barriers || []).concat(fences.filter(function (fence) {
					return fence.Traits.Barrier.Road === object.ID;
				}).map(barrier));

				return made;
			}).concat(streets || []), junctions().map(function (object) {
				return {ID: object.ID, X: Number(object.Values.X) || 0, Z: Number(object.Values.Y) || 0, Radius: object.Traits.Junction.Radius, Surface: object.Traits.Junction.Surface, Kind: object.Traits.Junction.Form};
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

			/*
			 * A junction is drawn with the first road it holds. The model of each road is made in a worker (SceneRoads.AssetOf, the
			 * ground shared once): an empty one stands for it until it comes, and what stands still is gathered again then.
			 */
			if (!pool.Inline())
				pool.Share('roads-ground', options);

			state.Made.forEach(function (road) {
				var name = 'road:' + road.ID + ':' + hash;
				var held = state.Junctions.filter(function (junction) {
					return junction.Roads[0] === road.ID;
				});

				state.Names[road.ID] = name;

				if (models.Has(name)) return;

				if (pool.Inline()) {
					models.Define(name, {URL: name, Asset: roads.Asset([road], {Height: ground, Junctions: held}), Fit: false, Type: 'prop'});

					return;
				}

				models.Define(name, {URL: name, Asset: roads.Asset([]), Fit: false, Type: 'prop'});

				pool.Run('SceneRoads', 'AssetOf', [[road], {Ground: 'roads-ground', Junctions: held}], function (error, asset) {
					models.Define(name, {URL: name, Asset: error ? roads.Asset([road], {Height: ground, Junctions: held}) : asset, Fit: false, Type: 'prop'});

					scene.StillLists = null;
				});
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
		/* What the tunnels of the roads cut out of the ground: carves of its volume. */
		engine.RoadsCarves = function () {
			var made;

			/* Made again with the roads; the very same list while what it holds is the same, so the ground is not made again for nothing. */
			if (state.CarvedOf !== state.Made) {
				state.CarvedOf = state.Made;
				made = roads.Carves(state.Made);

				if (!state.Carved || JSON.stringify(made) !== JSON.stringify(state.Carved))
					state.Carved = made;
			}

			return state.Carved;
		};

		engine.RoadsSketch = function (settings, sketch) {
			var found;
			var key;
			var streets;
			/* Every frame asks: nothing changed in the scene, nothing to look at. */
			var quick = scene.Version + ':' + JSON.stringify(settings);
			if (state.Quick === quick && state.Given === sketch)
				return state.Made.length || state.Free.length ? state.Sketch : sketch;

			state.Quick = quick;
			state.Given = sketch;
			streets = streetsOf(sketch);
			found = objects();

			carry(streets);

			if (!found.length && !barriers().length && !streets.length) {
				if (state.Made.length || state.Free.length)
					state.Version++;

				state.Made = [];
				state.Free = [];
				state.Junctions = [];
				state.Key = '';

				return sketch;
			}

			key = JSON.stringify([settings, sketch, streets, found.map(function (object) {
				return [object.ID, object.Traits.Road];
			}), junctions().map(function (object) {
				return [object.ID, object.Values.X, object.Values.Y, object.Traits.Junction];
			}), barriers().map(function (object) {
				return [object.ID, object.Traits.Barrier];
			})]);

			if (key !== state.Key) {
				state.Key = key;

				make(found, settings, sketch, key, streets);
			}

			/* The model of a road or a barrier is its own: an object made again takes it again (a street, the object that draws it). */
			found.concat(barriers(), streets.map(function (street) {
				return scene.Objects[street.ID];
			}).filter(Boolean)).forEach(function (object) {
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
