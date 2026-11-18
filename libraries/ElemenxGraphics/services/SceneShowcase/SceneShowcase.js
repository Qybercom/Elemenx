/*
 * SceneShowcase: one big world made of every primitive of the generation of a Scene, district by district, as a demo of
 * what they make together and as a benchmark of a scene as large as a game has.
 * - World(options) gives the world: {Name, Seed (of its ground: a Scene of a Seed would make a star system round it),
 *   Size, Time, Weather, Objects (specs for Scene.Add, the ground first), Districts ([{ID, Name, X, Y, Radius, Shows (the
 *   primitives it shows)}]), Route (the views a tour of it goes through: [{ID, Name, Target [x, y, z], Yaw, Pitch,
 *   Distance}])}. Options: Size (of the ground, 3000 metres), Seed ('showcase'), Districts (the IDs of those wanted; all
 *   of them by default).
 * - Districts(): the districts it lays out: [{ID, Name, X, Y, Radius, Shows}].
 * The ground holds the sketch of all of them: mountains, a crater and a canyon, a river from the hills to a sea with its
 * beach and dunes, a lake and a swamp, towns of each kind with their districts, squares, walls and a landmark, farms in
 * rows, woods of each kind, the strokes and stamps of an editor, the triggers and zones of a game. Over it stand the
 * roads (motorway with its bridges and tunnels, railway, a lane over the motorway, a level crossing with its barriers down, a
 * roundabout, interchanges of every form (stack, cloverleaf, diamond, roundabout, trumpet), a country road on a viaduct, the motorway on one over the sea, a road under the big mountain with a branch ending on it in a tunnel, a race track with its barriers and a
 * paved street bending inside it, a
 * gallery of every type of road),
 * a gallery of every model of SceneModels and every class of SceneBuildingGenerator, the effects and lights, a mirror and
 * a glass, walkers, a car and a boat. Its galleries are read from the Services, so a model or a type added shows too.
 * All of it but its galleries, its car and its level crossing (code: Galleries, Car, Level) is the data of its plan
 * (resources/showcase/world.json, Plan; Scaled gives a thing of it at the scale and of the seed of a world).
 * The same functions run in Node: they read no page (World defines the buildings of its gallery in SceneModels).
 */
Elemenx.Service('SceneShowcase', {
	$Meta: {
		Description: 'One big world made of every primitive of the generation of a Scene: a demo and a benchmark.',
		Methods: ['World(options)', 'Districts()', 'Plan()', 'Scaled(entry, scale, seed)']
	},

	/* The effects of the plaza: every type that stands by itself (glow, mana, wake and spray go with what moves). */
	Effects: ['campfire', 'torch', 'spark', 'smoke', 'steam', 'dust', 'exhaust', 'fumes', 'backfire', 'explosion', 'aura', 'circle', 'portal', 'shield', 'lightning', 'healing', 'frost', 'poison', 'beam', 'fireball', 'teleport', 'pillar'],

	Districts: function () {
		return this.Plan().Districts;
	},

	/*
	 * The plan of the world (resources/showcase/world.json), in metres of a ground of 3000: its Districts; the options of its
	 * Ground; the layers of its sketch, its Passages and its Objects, each with When (the districts it comes with; none: it
	 * always does) and Scaled (the paths of what grows with the ground: a number, the x and z of a point or of the points of a
	 * list; [] the items of a list) and Seeded (the keys of a word of the seed of the world: the seed and the word); its Models, defined for what stands on them. An object of Code is made here: galleries
	 * (Galleries), car (Car), level (the lane over the railway, found on its line: Level).
	 */
	Plan: function () {
		return Elemenx.Resources('Data', 'ElemenxGraphics/showcase/world') || {Districts: [], Ground: {}, Passages: {Items: []}, Layers: [], Objects: [], Models: {}};
	},

	/* A thing of the plan at the scale of the ground and of its seed: what its Scaled tells grown by it, its Seeded of the seed; When, Scaled and Seeded gone. */
	Scaled: function (entry, scale, seed) {
		var made = {};

		function grow (value) {
			if (typeof value === 'number') return value * scale;

			if (Array.isArray(value) && typeof value[0] === 'number')
				return [value[0] * scale, value[1] * scale].concat(value.slice(2));

			return value.map(grow);
		}

		/* What one item of a list does not have (the points of one way) is left as it is. */
		function apply (holder, keys) {
			if (!holder || holder[keys[0]] === undefined) return;

			if (keys.length === 1) {
				holder[keys[0]] = grow(holder[keys[0]]);

				return;
			}

			if (keys[1] === '[]') {
				holder[keys[0]].forEach(function (one) {
					apply({One: one}, ['One'].concat(keys.slice(2)));
				});

				return;
			}

			apply(holder[keys[0]], keys.slice(1));
		}

		Object.keys(entry).forEach(function (key) {
			if (['When', 'Scaled', 'Seeded'].indexOf(key) === -1)
				made[key] = JSON.parse(JSON.stringify(entry[key]));
		});

		(entry.Seeded || []).forEach(function (key) {
			made[key] = seed + made[key];
		});

		(entry.Scaled || []).forEach(function (path) {
			apply(made, path.replace(/\[\]/g, '.[]').split('.'));
		});

		return made;
	},

	World: function (options) {
		var self = this;
		var settings = options || {};
		var size = Number(settings.Size) || 3000;
		var seed = settings.Seed === undefined ? 'showcase' : String(settings.Seed);
		var wanted = settings.Districts || null;
		var scale = size / 3000;
		var models = this.$Service('SceneModels');
		var plan = this.Plan();
		var objects = [];
		var districts = this.Districts().filter(function (district) {
			return !wanted || wanted.indexOf(district.ID) !== -1;
		});
		var on = {};
		var layers;
		var passages;
		var route;

		districts.forEach(function (district) {
			on[district.ID] = true;
		});

		/* A point of the plan, at the scale of the ground. */
		function at (x, z, y) {
			return y === undefined ? [x * scale, z * scale] : [x * scale, z * scale, y];
		}

		function add (spec) {
			objects.push(spec);
		}

		/* What of the plan comes: all that tells no districts, and what one of those wanted. */
		function comes (entry) {
			return !entry.When || entry.When.some(function (id) {
				return on[id];
			});
		}

		layers = plan.Layers.filter(comes).map(function (layer) {
			return {ID: layer.ID, Name: layer.ID, Visible: true, Strength: 1, Items: layer.Items.map(function (item) {
				return self.Scaled(item, scale, seed);
			})};
		});

		passages = comes(plan.Passages) ? plan.Passages.Items.map(function (passage) {
			return self.Scaled(passage, scale, seed);
		}) : [];

		plan.Objects.filter(comes).forEach(function (entry) {
			var spec = entry.Code ? null : self.Scaled(entry, scale, seed);

			if (entry.Code === 'galleries')
				self.Galleries(at, add);

			if (entry.Code === 'car')
				self.Car(at, add);

			if (entry.Code === 'level')
				self.Level(objects, scale, add);

			if (!spec) return;

			/* Its model, of the plan when the library has none of its name (a ball, a crate). */
			if (spec.Model && plan.Models[spec.Model] && !models.Has(spec.Model))
				models.Define(spec.Model, plan.Models[spec.Model]);

			add(spec);
		});

		objects.unshift({ID: 'land', Kind: 'ground', Name: '', Swell: 0.5, World: this.$Service('SceneWorld').Library(Object.assign({Size: size}, plan.Ground, {Seed: seed, Sketch: {Layers: layers}, Passages: passages}))});

		route = districts.map(function (district) {
			return {ID: district.ID, Name: district.Name, Target: [district.X * scale, 0, district.Y * scale], Yaw: 0.6, Pitch: 0.5, Distance: district.Radius * scale * (district.Near || 1.6)};
		});

		return {
			Name: 'Showcase',
			Seed: seed,
			Size: size,
			Time: 10.5,
			Weather: '',
			Objects: objects,
			Districts: districts.map(function (district) {
				return Object.assign({}, district, {X: district.X * scale, Y: district.Y * scale, Radius: district.Radius * scale});
			}),
			Route: route
		};
	},

	/*
	 * A lane over the railway west of the city: a level crossing, its barriers down. Where the line of the railway is at
	 * x = -800 (its curve, as SceneRoads makes it; on the ground there), the lane straight across it.
	 */
	Level: function (objects, scale, add) {
		var railway = objects.filter(function (spec) {
			return spec.ID === 'railway';
		})[0];
		var rail;

		if (!railway) return;

		rail = this.$Service('SceneRoads').Line(railway.Points, {}).reduce(function (best, point) {
			return Math.abs(point.X + 800 * scale) < Math.abs(best.X + 800 * scale) ? point : best;
		});

		add({ID: 'level-lane', Kind: 'road', Name: 'Lane over the railway', Type: 'country', Points: [[rail.X, rail.Z - 140 * scale], [rail.X, rail.Z + 140 * scale]]});
		add({ID: 'level-crossing', Kind: 'junction', X: rail.X, Y: rail.Z, Closed: true});
	},

	/* The heights of a stamp: a ring of hills round a hollow, side by side points from 0 to 1. */
	Stamp: function (side) {
		var heights = [];
		var x;
		var z;
		var d;

		for (z = 0; z < side; z++) {
			for (x = 0; x < side; x++) {
				d = Math.sqrt(Math.pow(x / (side - 1) * 2 - 1, 2) + Math.pow(z / (side - 1) * 2 - 1, 2));

				heights.push(Math.round(Math.max(0, Math.cos((d - 0.6) * Math.PI * 1.6)) * (d < 1 ? 1 : 0) * 100) / 100);
			}
		}

		return {Side: side, Heights: heights};
	},

	/* The galleries: rows of every model, every class of building, every type of road, every effect, lights, a mirror and a glass. */
	Galleries: function (at, add) {
		var models = this.$Service('SceneModels');
		var buildings = this.$Service('SceneBuildingGenerator');
		var roads = this.$Service('SceneRoads');
		var x;
		var z;

		/* Every model, a row of them, each its own size. */
		x = -1060;

		models.Names().forEach(function (name) {
			var info = models.Info(name) || {};
			var size = Math.min(40, Number(info.Size) || 2);

			add({ID: 'model-' + name, Kind: 'thing', Name: name, Model: name, Size: size, X: at(x, 0)[0], Y: at(0, 860)[1]});

			x += Math.max(6, size * 1.4);

			if (x > -320)
				x = -1060;
		});

		/* Every class of building, defined as a model of its own. */
		x = -1060;

		buildings.Classes().forEach(function (name) {
			var model = 'showcase-' + name;
			var made = buildings.Define(model, {Class: name, Seed: 'showcase'});

			add({ID: 'building-' + name, Kind: 'house', Name: name, Model: model, Size: made.Height, X: at(x + made.Width / 2, 0)[0], Y: at(0, 990)[1]});

			x += Math.max(made.Width, made.Depth) + 14;
		});

		/* Every type of road: a short straight of each, side by side, as far apart as they are wide (no junction between them). */
		x = -1060;
		z = 1100;

		roads.Types().forEach(function (name) {
			var width = roads.Road({Type: name, Points: [[0, 0], [0, 10]]}).Width || 10;

			if (x + width > -320) {
				x = -1060;
				z += 140;
			}

			x += width / 2;

			add({ID: 'road-' + name, Kind: 'road', Name: name, Type: name, Points: [at(x, z), at(x, z + 80)]});

			x += width / 2 + 30;
		});

		/* Every effect that stands by itself, with a light between each two. */
		x = -1060;

		this.Effects.forEach(function (type, index) {
			add({ID: 'effect-' + type, Kind: 'effect', Name: type, Type: type, X: at(x, 0)[0], Y: at(0, 1400)[1]});

			if (index % 2)
				add({ID: 'light-' + type, Kind: 'light', X: at(x - 15, 0)[0], Y: at(0, 1420)[1], Color: index % 4 === 1 ? '#ffd39a' : '#9ad0ff', Radius: 18});

			x += 30;
		});

		add({ID: 'mirror', Kind: 'mirror', Name: 'Mirror', X: at(-420, 0)[0], Y: at(0, 1450)[1], Width: 8, Height: 5, Lift: 2.6, Yaw: 200});
		add({ID: 'glass', Kind: 'glass', Name: 'Glass', X: at(-360, 0)[0], Y: at(0, 1450)[1], Width: 6, Height: 4, Lift: 2, Yaw: 160, Frost: 0.2});
	},

	/* A car of the models of SceneModels on the race track. */
	Car: function (at, add) {
		var models = this.$Service('SceneModels');
		var cars = models.Names({Type: 'vehicle'});
		var name = cars.indexOf('car') !== -1 ? 'car' : cars[0];
		if (!name) return;

		add({ID: 'car', Kind: 'unit', Name: 'Car', Model: name, Size: Number((models.Info(name) || {}).Size) || 4.5, X: at(1250, 0)[0], Y: at(0, 1000)[1], Vehicle: {Kind: 'car', Heading: 0}});
	}
});
