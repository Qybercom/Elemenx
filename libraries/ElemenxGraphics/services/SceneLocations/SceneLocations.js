/*
 * SceneLocations: the locations of a planet of ScenePlanet, each a cell of its surface (ScenePlanet.CellAt) that a scene
 * shows in detail, its neighbours beside it. They are told in the planet (the options of ScenePlanet.Make): LocationSize
 * (km, the side of a cell, 4), Grid (cube: squares of the faces of a cube, the usual; hex: hexagons of an icosahedron, 12
 * of them pentagons) and Locations {ID: location}, a location {ID (of its cell), Kind (generated: of the World of the
 * planet there; model: a file, Model its address), World (a World of its own, SceneWorld, when it was edited; else the one
 * of the planet there), Passages ([{Side (0 to 3: +X, +Z, -X, -Z of the location, as CellNeighbours; of a hex cell 0 to
 * 5 round it), At (0 to 1 along it), Kind (road, path, river, tunnel, gate), Width (metres), Mode (seamless: the
 * neighbour is walked into; passage: it is gone to through it), To (the ID of the neighbour)}]), Beyond (what is past a
 * side with no location told beside it, or with passages to it: cliff, wall, void, sea or far, the far ground of the
 * planet; far by default)}. A
 * cell with no location told is one of the planet as it is, generated.
 * - Location(planet, id): a location resolved: {ID, Cell, Place (CellPlace: Latitude, Longitude, Turn, Size, Points,
 *   Sides), Kind, Model, World (its own, or SceneWorld.Library of the planet there: a square ground round its outline
 *   (Extent), its step Border what is past the outline, its passages roads, rivers and gates out of it), Passages, Beyond,
 *   Sides ([{Side, To (the ID of the cell beside), Told (whether a location is told there), Passages}])}.
 * - At(planet, latitude, longitude): the ID of the location of a point.
 * - Open(planet, id): the sides where a location may be added beside it (no location told there): [{Side, To}].
 * - Tell(planet, id, changes): the planet with a location told or changed (a copy); Forget(planet, id) with it gone.
 * - Passage(planet, id, passage): the planet with a passage added on a side of a location, and the same on the neighbour's
 *   side facing it (its At the other way along it), so both lead to each other.
 * - Bake(planet, id, side, given): the planet with the ground of a location baked into it (Baked of ScenePlanet.Make): its
 *   heights, edits and all, so the globe and the surface show it as it is; Forget lets it go too.
 * The same functions run in workers and in Node: they read no page.
 */
Elemenx.Service('SceneLocations', {
	$Meta: {
		Description: 'The locations of a planet: cells of its surface, each a scene in detail, their neighbours, passages between them and what is past their sides.',
		Methods: ['Location(planet, id)', 'At(planet, latitude, longitude)', 'Open(planet, id)', 'Tell(planet, id, changes)', 'Forget(planet, id)', 'Passage(planet, id, passage)', 'Bake(planet, id, side, given)', 'Extent(place)', 'Kinds()', 'Beyonds()']
	},

	Kinds: function () {
		return ['road', 'path', 'river', 'tunnel', 'gate'];
	},

	Beyonds: function () {
		return ['far', 'cliff', 'wall', 'void', 'sea'];
	},

	/* The radius and the size of the cells of a planet, km. */
	Grid: function (planet) {
		return {Radius: Number(planet.Radius) || 6371, Size: Number(planet.LocationSize) || 4, Kind: planet.Grid === 'hex' ? 'hex' : 'cube'};
	},

	/*
	 * The rivers of the planet (Rivers of ScenePlanet) through a location as a sketch of its ground: each a line of the type
	 * river along their way there (metres of the location, its level the level of the river), as wide as it drains; undefined
	 * with none.
	 */
	Streams: function (planet, place) {
		var planets = this.$Service('ScenePlanet');
		var rivers = Array.isArray(planet.Rivers) ? planet.Rivers : planet.Rivers ? planets.RiversOf(planet.Rivers) : [];
		var site;
		var half = this.Extent(place) / 2;
		var middle = planets.Direction(place.Latitude, place.Longitude);
		var reach = (half * 3 + 30000) / ((Number(planet.Radius) || 6371) * 1000);
		var items = [];
		var self = this;

		function meander (run, width, seed) {
			return self.Meander(run, width, seed);
		}

		if (!rivers.length) return undefined;

		site = this.$Service('SceneTerrainGenerator').Site({Options: planet, Latitude: place.Latitude, Longitude: place.Longitude, Turn: place.Turn});

		rivers.forEach(function (river, number) {
			var run = [];
			var widths = [];

			/* Its way bends as a river's does: a point every 400 m, aside by waves of a kilometre and of a few hundred metres. */
			function close () {
				var width;

				if (run.length > 1) {
					width = Math.max.apply(null, widths);

					items.push({ID: 'river-' + number + '-' + items.length, Type: 'river', Points: meander(run, width, number), Width: width, Depth: 1.5, Bank: 8});
				}

				run = [];
				widths = [];
			}

			/* The segments that pass near: both their ends, one run while they go on near. */
			var taken = river.Points.map(function () {
				return false;
			});
			var k;

			for (k = 0; k + 1 < river.Points.length; k++) {
				var a = river.Points[k];
				var b = river.Points[k + 1];
				var ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
				var t = Math.max(0, Math.min(1, ((middle[0] - a[0]) * ab[0] + (middle[1] - a[1]) * ab[1] + (middle[2] - a[2]) * ab[2]) / Math.max(1e-18, planets.Dot(ab, ab))));
				var q = [a[0] + ab[0] * t - middle[0], a[1] + ab[1] * t - middle[1], a[2] + ab[2] * t - middle[2]];
				if (Math.sqrt(planets.Dot(q, q)) < reach)
					taken[k] = taken[k + 1] = true;
			}

			river.Points.forEach(function (point, index) {
				var at;

				if (!taken[index]) {
					close();

					return;
				}

				at = site.Local(point);

				run.push([Math.round(at[0] * 10) / 10, Math.round(at[1] * 10) / 10, river.Level[index]]);
				widths.push(Math.round(15 * Math.sqrt(river.Flow[index])));
			});

			close();
		});

		return items.length ? {Layers: [{ID: 'rivers', Name: 'Rivers', Items: items}]} : undefined;
	},

	/*
	 * The settlements of the planet (Settlements of ScenePlanet) in a location as a sketch of its ground: each an area of the
	 * type settlement round its point (metres of the location), as large as its kind (a city 900 m across its middle, a town
	 * 450, a village 180), within the location; undefined with none.
	 */
	Towns: function (planet, place) {
		var planets = this.$Service('ScenePlanet');
		var towns = Array.isArray(planet.Settlements) ? planet.Settlements : planet.Settlements ? planets.TownsOf(planet.Settlements) : [];
		var half = this.Extent(place) / 2;
		var middle = planets.Direction(place.Latitude, place.Longitude);
		var reach = half * 2 / ((Number(planet.Radius) || 6371) * 1000);
		var items = [];
		var site;

		towns.forEach(function (town, number) {
			var radius = town.Kind === 'city' ? 900 : town.Kind === 'town' ? 450 : 180;
			var at;
			var points = [];
			var i;

			if (Math.acos(Math.max(-1, Math.min(1, planets.Dot(town.Point, middle)))) > reach) return;

			site = site || this.$Service('SceneTerrainGenerator').Site({Options: planet, Latitude: place.Latitude, Longitude: place.Longitude, Turn: place.Turn});
			at = site.Local(town.Point);

			/* Within the location: a large one taken in, not cut by its edge. */
			radius = Math.min(radius, half - 60 - Math.max(Math.abs(at[0]), Math.abs(at[1])));

			if (radius < 60) return;

			for (i = 0; i < 12; i++)
				points.push([Math.round((at[0] + Math.cos(i / 12 * Math.PI * 2) * radius * (1 + 0.12 * Math.sin(i * 2.3 + number))) * 10) / 10, Math.round((at[1] + Math.sin(i / 12 * Math.PI * 2) * radius * (1 + 0.12 * Math.cos(i * 1.7 + number))) * 10) / 10]);

			items.push({ID: 'settlement-' + number, Type: 'settlement', Points: points, Kind: town.Kind, Density: 0.6 + town.Size * 0.3, Seed: 'town-' + number});
		}, this);

		return items.length ? {Layers: [{ID: 'settlements', Name: 'Settlements', Items: items}]} : undefined;
	},

	/*
	 * The highways of the planet (Highways of ScenePlanet: a key or the list) through a location as a sketch of its ground:
	 * each a line of the type road (Trunk: true, Class) from where it comes into the location to where it leaves it (the
	 * same points of the planet for the location beside), in metres of the location; undefined with none.
	 */
	Trunks: function (planet, place) {
		var planets = this.$Service('ScenePlanet');
		var roads = Array.isArray(planet.Highways) ? planet.Highways : planet.Highways ? planets.HighwaysOf(planet.Highways) : [];
		var half = this.Extent(place) / 2 - 1;
		var middle = planets.Direction(place.Latitude, place.Longitude);
		var near = Math.cos(400 / (Number(planet.Radius) || 6371));
		var items = [];
		var site;

		/* Where a segment of the plane goes in and out of the outline (convex, its corners Points): its part inside, or null. */
		var outline = place.Points || [[-half, -half], [half, -half], [half, half], [-half, half]];
		var turn = 0;

		outline.forEach(function (point, index) {
			var next = outline[(index + 1) % outline.length];

			turn += point[0] * next[1] - next[0] * point[1];
		});

		function clip (a, b) {
			var t0 = 0;
			var t1 = 1;
			var d = [b[0] - a[0], b[1] - a[1]];
			var k;

			for (k = 0; k < outline.length; k++) {
				var p = outline[k];
				var q = outline[(k + 1) % outline.length];
				/* The inward normal of the side. */
				var n = turn > 0 ? [-(q[1] - p[1]), q[0] - p[0]] : [q[1] - p[1], -(q[0] - p[0])];
				var num = (a[0] - p[0]) * n[0] + (a[1] - p[1]) * n[1];
				var den = d[0] * n[0] + d[1] * n[1];

				if (den === 0) {
					if (num < 0)
						return null;

					continue;
				}

				if (den > 0) t0 = Math.max(t0, -num / den);
				else t1 = Math.min(t1, -num / den);

				if (t0 > t1)
					return null;
			}

			return [[a[0] + d[0] * t0, a[1] + d[1] * t0], [a[0] + d[0] * t1, a[1] + d[1] * t1], t0 > 0, t1 < 1];
		}

		/* A point a little past the outline along a way (its margin), so the ground round it has the road too. */
		function past (from, to) {
			var length = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1;
			var reach = Math.min(200, half);

			return [to[0] + (to[0] - from[0]) / length * reach, to[1] + (to[1] - from[1]) / length * reach];
		}

		roads.forEach(function (road, number) {
			var run = [];

			function close () {
				if (run.length > 1)
					items.push({ID: 'trunk-' + number + '-' + items.length, Type: 'road', Trunk: true, Class: road.Class || 'road', Width: road.Class === 'highway' ? 14 : 9, Points: run.map(function (point) {
						return [Math.round(point[0] * 10) / 10, Math.round(point[1] * 10) / 10];
					})});

				run = [];
			}

			(road.Points || []).forEach(function (point, index) {
				var next = road.Points[index + 1];
				var part;

				if (!next || planets.Dot(point, middle) < near || planets.Dot(next, middle) < near) {
					close();

					return;
				}

				site = site || this.$Service('SceneTerrainGenerator').Site({Options: planet, Latitude: place.Latitude, Longitude: place.Longitude, Turn: place.Turn});
				part = clip(site.Local(point), site.Local(next));

				if (!part) {
					close();

					return;
				}

				/* Where it comes in: its point on the outline, and one past it. */
				if (!run.length)
					run.push.apply(run, part[2] ? [past(part[1], part[0]), part[0]] : [part[0]]);

				run.push(part[1]);

				/* It leaves: the run ends a little past the outline. */
				if (part[3]) {
					run.push(past(part[0], part[1]));

					close();
				}
			}, this);

			close();
		}, this);

		return items.length ? {Layers: [{ID: 'trunks', Name: 'Highways', Items: items}]} : undefined;
	},

	/* The sketch of the ground of a location of a planet: its rivers (Streams), its settlements (Towns) and its highways (Trunks); undefined with none. */
	Sketch: function (planet, place) {
		var layers = [this.Streams(planet, place), this.Towns(planet, place), this.Trunks(planet, place)].filter(Boolean).map(function (sketch) {
			return sketch.Layers[0];
		});

		return layers.length ? {Layers: layers} : undefined;
	},

	/* The way of a river bent: a point every 400 m along it, aside by its width and more, the same for the same river. */
	Meander: function (run, width, seed) {
		var made = [];
		var along = 0;
		var k;
		var step;

		for (k = 0; k + 1 < run.length; k++) {
			var a = run[k];
			var b = run[k + 1];
			var dx = b[0] - a[0];
			var dz = b[1] - a[1];
			var length = Math.hypot(dx, dz) || 1;
			var count = Math.max(1, Math.ceil(length / 400));

			for (step = 0; step < count; step++) {
				var t = step / count;
				var d = along + length * t;
				var aside = width * 2.5 * (Math.sin(d / 1100 + seed * 1.7) * 0.65 + Math.sin(d / 380 + seed * 3.1) * 0.35);

				made.push([Math.round((a[0] + dx * t - dz / length * aside) * 10) / 10, Math.round((a[1] + dz * t + dx / length * aside) * 10) / 10, a[2] + (b[2] - a[2]) * t]);
			}

			along += length;
		}

		made.push(run[run.length - 1]);

		return made;
	},

	/* The side of the square ground of a location: its outline and a margin round it to see what is past it, metres. */
	Extent: function (place) {
		var far = 0;

		place.Points.forEach(function (point) {
			far = Math.max(far, Math.abs(point[0]), Math.abs(point[1]));
		});

		return Math.ceil(far * 2 + this.Margin * 2);
	},

	Margin: 240,

	/* A cell of its ID (of either grid). */
	Cell: function (id) {
		return this.$Service('ScenePlanet').CellOf(id);
	},

	At: function (planet, latitude, longitude) {
		var planets = this.$Service('ScenePlanet');
		var grid = this.Grid(planet);

		return planets.CellAt(grid.Radius, grid.Size, planets.Direction(latitude, longitude), grid.Kind).ID;
	},

	Location: function (planet, id) {
		var planets = this.$Service('ScenePlanet');
		var grid = this.Grid(planet);
		var cell = this.Cell(id);
		var told = (planet.Locations || {})[id] || null;
		var place = planets.CellPlace(grid.Radius, cell);
		var options = Object.assign({}, planet);
		var passages = told && told.Passages || [];
		var neighbours = planets.CellNeighbours(grid.Radius, grid.Size, cell);
		/* The sides with a location told beside and no passage on them: past them is that location all along, not what is past the outline. */
		var open = [];

		neighbours.forEach(function (other, side) {
			var through = passages.some(function (passage) {
				return passage.Side === side;
			});
			if ((planet.Locations || {})[other.ID] && !through)
				open.push(side);
		});

		/* The ground of a location is of the planet as it is: not of the locations baked into it (its own among them). */
		delete options.Locations;
		delete options.Baked;

		return {
			ID: cell.ID,
			Cell: cell,
			Place: place,
			Kind: told && told.Kind || 'generated',
			Model: told && told.Model || '',
			Told: !!told,
			World: told && told.World || this.$Service('SceneWorld').Library({Size: this.Extent(place), Planet: {Options: options, Latitude: place.Latitude, Longitude: place.Longitude, Turn: place.Turn}, Sketch: this.Sketch(options, place), Border: {Points: place.Points, Sides: place.Sides, Beyond: told && told.Beyond || 'far', Passages: passages, Open: open}, Roads: options.LocationRoads === false ? undefined : true}),
			Passages: passages,
			Beyond: told && told.Beyond || 'far',
			Sides: neighbours.map(function (other, side) {
				return {Side: side, To: other.ID, Told: !!(planet.Locations || {})[other.ID], Passages: passages.filter(function (passage) {
					return passage.Side === side;
				})};
			})
		};
	},

	Open: function (planet, id) {
		return this.Location(planet, id).Sides.filter(function (side) {
			return !side.Told;
		}).map(function (side) {
			return {Side: side.Side, To: side.To};
		});
	},

	Tell: function (planet, id, changes) {
		var made = JSON.parse(JSON.stringify(planet || {}));

		made.Locations = made.Locations || {};
		made.Locations[id] = Object.assign({ID: id, Kind: 'generated', Passages: [], Beyond: 'far'}, made.Locations[id] || {}, changes || {});

		return made;
	},

	Forget: function (planet, id) {
		var made = JSON.parse(JSON.stringify(planet || {}));
		if (made.Locations)
			delete made.Locations[id];

		if (made.Baked)
			delete made.Baked[id];

		return made;
	},

	/*
	 * The planet with a location baked into it: the heights of its ground as its World makes it (edits and all), Side by
	 * Side over its square (64), or heights given ({Side, Heights}: of a model), so the globe, the surface seen from the air
	 * and the horizon of the locations beside show it as it is.
	 */
	Bake: function (planet, id, side, given) {
		var location = this.Location(planet, id);
		var made = JSON.parse(JSON.stringify(planet || {}));
		var count = Math.max(2, Math.round(Number(given && given.Side || side) || 64));
		var heights = given && given.Heights ? Array.prototype.slice.call(given.Heights) : [];
		var ground;
		var field;
		var size;
		var row;
		var column;

		if (!heights.length) {
			ground = this.$Service('SceneWorld').Make(location.World).Ground;
			field = this.$Service('SceneTerrainGenerator').Flat(ground);
			size = ground.Size;

			for (row = 0; row < count; row++) {
				for (column = 0; column < count; column++)
					heights.push(Math.round(field.Height(-size / 2 + column * size / (count - 1), -size / 2 + row * size / (count - 1)) * 10) / 10);
			}
		}

		made.Baked = made.Baked || {};
		made.Baked[id] = {Latitude: location.Place.Latitude, Longitude: location.Place.Longitude, Turn: location.Place.Turn, Size: given && given.Size || size || this.Extent(location.Place), Side: count, Heights: heights, Edge: this.Margin};

		return made;
	},

	Passage: function (planet, id, passage) {
		var location = this.Location(planet, id);
		var side = location.Sides[passage.Side];
		var other;
		var back;
		var made;
		var given = {Side: Number(passage.Side), At: Math.max(0, Math.min(1, Number(passage.At) || 0.5)), Kind: passage.Kind || 'path', Width: Number(passage.Width) || 4, Mode: passage.Mode === 'passage' ? 'passage' : 'seamless', To: side.To};

		made = this.Tell(planet, id, {Passages: location.Passages.concat([given])});

		/* The neighbour's side that faces this one, and the passage on it, along it the other way. */
		other = this.Location(made, side.To);
		back = other.Sides.filter(function (each) {
			return each.To === id;
		})[0];

		if (back)
			made = this.Tell(made, side.To, {Passages: other.Passages.concat([{Side: back.Side, At: 1 - given.At, Kind: given.Kind, Width: given.Width, Mode: given.Mode, To: id}])});

		return made;
	}
});
