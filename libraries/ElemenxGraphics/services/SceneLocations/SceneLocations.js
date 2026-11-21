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
 *   Where its ground rises steep and high its sketch has caves (Caverns: up to two, a way into the rock and a hall) and its
 *   World sows what grows in them (dripstones, cave-floor, cave-crystals); a planet of Caves false has none.
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
		return {Radius: Number(planet.Radius) || this.$Service('ScenePlanet').Defaults.Radius, Size: Number(planet.LocationSize) || 4, Kind: planet.Grid === 'hex' ? 'hex' : 'cube'};
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
		var reach = (half * 3 + 30000) / (this.Grid(planet).Radius * 1000);
		var items = [];
		var courses;
		/* The cosine of how far from its middle a point of a river is kept: the location, half of it again and 2 km. */
		var near = Math.cos((half * 1.5 + 2000) / (this.Grid(planet).Radius * 1000));

		if (!rivers.length) return undefined;

		site = this.$Service('SceneTerrainGenerator').Site({Options: planet, Latitude: place.Latitude, Longitude: place.Longitude, Turn: place.Turn});
		courses = site.Planet.Courses();

		courses.forEach(function (river, number) {
			var run = [];
			var widths = [];

			function close () {
				if (run.length > 1)
					items.push({ID: 'river-' + number + '-' + items.length, Type: 'river', Points: run, Width: Math.max.apply(null, widths), Depth: 1.5, Bank: 8});

				run = [];
				widths = [];
			}

			/* A point of its way as the planet bends it (RiverAt): the same in every location it crosses and on its globe. */
			function add (k, t) {
				var made = site.Planet.RiverAt(number, k, t);
				var at;

				/* Only as far as the location and some past it (its points are many: a run there and ended). */
				if (planets.Dot(made.Direction, middle) < near) {
					close();

					return;
				}

				at = site.Local(made.Direction);

				run.push([Math.round(at[0] * 10) / 10, Math.round(at[1] * 10) / 10, made.Level]);
				widths.push(Math.round(planets.RiverWidth(made.Flow) * 1000));
			}

			/* The segments that pass near, each a point a tenth of a bend apart (a bend: eleven times its width); one run while they go on near. */
			var k;

			for (k = 0; k + 1 < river.Points.length; k++) {
				var a = river.Points[k];
				var b = river.Points[k + 1];
				var ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
				var t = Math.max(0, Math.min(1, ((middle[0] - a[0]) * ab[0] + (middle[1] - a[1]) * ab[1] + (middle[2] - a[2]) * ab[2]) / Math.max(1e-18, planets.Dot(ab, ab))));
				var q = [a[0] + ab[0] * t - middle[0], a[1] + ab[1] * t - middle[1], a[2] + ab[2] * t - middle[2]];
				var step;
				var count;
				var s;

				if (Math.sqrt(planets.Dot(q, q)) >= reach) {
					close();

					continue;
				}

				step = Math.max(0.03, planets.Rivers.Bend * planets.RiverWidth(Math.min(river.Flow[k], river.Flow[k + 1])) / 10);
				count = Math.max(1, Math.ceil((river.Along[k + 1] - river.Along[k]) / step));

				for (s = run.length ? 1 : 0; s <= count; s++)
					add(k, s / count);
			}

			close();
		});

		return items.length ? {Layers: [{ID: 'rivers', Name: 'Rivers', Items: items}]} : undefined;
	},

	/*
	 * The settlements of the planet (Settlements of ScenePlanet) in a location as a sketch of its ground: each an area of the
	 * type settlement round its point (metres of the location), as large as its kind (a city 900 m across its middle, a town
	 * 450, a village 180), within the location; undefined with none. Its outline by its ground: out of its middle every way
	 * as far as the land is not under the sea, nor far over or under its middle (30 m and 6% of the way), nor steeper than
	 * 25% (on a coast, in a valley), and farther along a road through it (trunks: the sketch of Trunks), as a village along
	 * its road is; Slope (the rise of its ground over a metre) and Contour (radians: the way along the level of it) for its
	 * streets to go along a hillside.
	 */
	Towns: function (planet, place, trunks) {
		var planets = this.$Service('ScenePlanet');
		var towns = Array.isArray(planet.Settlements) ? planet.Settlements : planet.Settlements ? planets.TownsOf(planet.Settlements) : [];
		var half = this.Extent(place) / 2;
		var middle = planets.Direction(place.Latitude, place.Longitude);
		var reach = half * 2 / (this.Grid(planet).Radius * 1000);
		var roads = trunks && trunks.Layers ? trunks.Layers[0].Items : [];
		var items = [];
		var site;

		/* The ways of the roads near a point (radians), of each segment of them within so many metres of it. */
		function ways (at, within) {
			var found = [];

			roads.forEach(function (road) {
				var line = road.Points || [];
				var k;

				for (k = 0; k + 1 < line.length; k++) {
					var dx = line[k + 1][0] - line[k][0];
					var dz = line[k + 1][1] - line[k][1];
					var t = Math.max(0, Math.min(1, ((at[0] - line[k][0]) * dx + (at[1] - line[k][1]) * dz) / (dx * dx + dz * dz || 1)));
					if (Math.hypot(line[k][0] + dx * t - at[0], line[k][1] + dz * t - at[1]) < within)
						found.push(Math.atan2(dz, dx));
				}
			});

			return found;
		}

		towns.forEach(function (town, number) {
			var radius = planets.Kind(town.Kind).Core * 1000;
			var count = 24;
			var at;
			var points = [];
			var far = [];
			var i;

			if (Math.acos(Math.max(-1, Math.min(1, planets.Dot(town.Point, middle)))) > reach) return;

			site = site || this.$Service('SceneTerrainGenerator').Site({Options: planet, Latitude: place.Latitude, Longitude: place.Longitude, Turn: place.Turn});
			at = site.Local(town.Point);

			/* Within the location: a large one taken in, not cut by its edge. */
			var room = half - 60 - Math.max(Math.abs(at[0]), Math.abs(at[1]));

			radius = Math.min(radius, room);

			if (radius < 60) return;

			var height = function (x, z) {
				return site.Elevation(at[0] + x, at[1] + z);
			};
			var reachOf = radius * 0.5;
			var gx = (height(reachOf, 0) - height(-reachOf, 0)) / (2 * reachOf);
			var gz = (height(0, reachOf) - height(0, -reachOf)) / (2 * reachOf);
			var roadWays = ways(at, radius);
			var step = radius / 10;
			var ground = height(0, 0);

			for (i = 0; i < count; i++) {
				var turn = i / count * Math.PI * 2;
				var way = [Math.cos(turn), Math.sin(turn)];
				/* Along a road, half as far again: the houses go on along it. */
				var stretch = 1 + 0.6 * roadWays.reduce(function (most, one) {
					return Math.max(most, Math.pow(Math.abs(Math.cos(turn - one)), 8));
				}, 0);
				var limit = Math.min(room, radius * (1 + 0.12 * Math.sin(i * 2.3 + number)) * stretch);
				var stop = limit;
				var passed = [ground, ground];
				var r;

				for (r = step; r <= limit; r += step) {
					var here = height(way[0] * r, way[1] * r);

					if (here <= 0.5) {
						stop = r - step * 0.5;

						break;
					}

					/* Up a hillside or down into a valley: far over or under its middle, or steep over two steps. */
					if (Math.abs(here - ground) > 30 + r * 0.06 || Math.abs(here - passed[0]) / (2 * step) > 0.25) {
						stop = r - step;

						break;
					}

					passed = [passed[1], here];
				}

				far.push(Math.max(radius * 0.3, stop));
			}

			for (i = 0; i < count; i++) {
				var smoothed = far[(i + count - 1) % count] * 0.25 + far[i] * 0.5 + far[(i + 1) % count] * 0.25;
				var angle = i / count * Math.PI * 2;

				points.push([Math.round((at[0] + Math.cos(angle) * smoothed) * 10) / 10, Math.round((at[1] + Math.sin(angle) * smoothed) * 10) / 10]);
			}

			items.push({ID: 'settlement-' + number, Type: 'settlement', Points: points, Kind: town.Kind, Density: 0.6 + town.Size * 0.3, Seed: 'town-' + number, Slope: Math.round(Math.hypot(gx, gz) * 1000) / 1000, Contour: Math.round((Math.atan2(gz, gx) + Math.PI / 2) * 1000) / 1000});
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
		var near = Math.cos(400 / this.Grid(planet).Radius);
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

	/*
	 * The caves of a location where its ground rises steep and high (hills, mountains), the same for the same place: up to two,
	 * each a mouth on a slope over 0.3 with 40 m of rise over it, a way of 120 to 260 m into the rock, level and a little down,
	 * bent, and a hall at its end (sketch items cave and hall); undefined with none. Planet Caves false: none.
	 */
	Caverns: function (planet, place) {
		var half = this.Extent(place) / 2;
		var site = this.$Service('SceneTerrainGenerator').Site({Options: planet, Latitude: place.Latitude, Longitude: place.Longitude, Turn: place.Turn});
		var seed = this.$Service('Math').PlaceRandom(place.Latitude, place.Longitude);
		var found = [];
		var items = [];
		var step = half * 1.4 / 8;
		var i;
		var k;

		if (planet.Caves === false) return undefined;

		function random (n) {
			return Math.abs(Math.sin((seed + n) * 91.345) * 47453.5453) % 1;
		}

		for (i = 0; i <= 8; i++) {
			for (k = 0; k <= 8; k++) {
				var x = -half * 0.7 + i * step + (random(i * 9 + k) - 0.5) * step * 0.6;
				var z = -half * 0.7 + k * step + (random(k * 9 + i + 100) - 0.5) * step * 0.6;
				var ground = site.Elevation(x, z);
				var gx = (site.Elevation(x + 30, z) - site.Elevation(x - 30, z)) / 60;
				var gz = (site.Elevation(x, z + 30) - site.Elevation(x, z - 30)) / 60;
				var slope = Math.hypot(gx, gz);
				var rise = slope > 0 ? site.Elevation(x + gx / slope * 120, z + gz / slope * 120) - ground : 0;
				if (ground > 2 && slope > 0.3 && rise > 40)
					found.push({X: x, Z: z, Y: ground, Way: [gx / slope, gz / slope], Score: rise * (0.6 + random(i * 31 + k * 7))});
			}
		}

		found.sort(function (a, b) {
			return b.Score - a.Score;
		});

		found.filter(function (one, index) {
			return !found.slice(0, index).some(function (other) {
				return Math.hypot(other.X - one.X, other.Z - one.Z) < 400;
			});
		}).slice(0, 2).forEach(function (one, number) {
			var length = 120 + random(number * 13 + 5) * 140;
			var bend = (random(number * 17 + 3) - 0.5) * 0.9;
			var floor = one.Y - 1.5;
			var side = [-one.Way[1], one.Way[0]];
			var points = [[one.X, one.Z, floor]];
			var n;

			for (n = 1; n <= 4; n++) {
				var t = n / 4;
				var aside = Math.sin(t * Math.PI) * bend * length * 0.35;

				points.push([one.X + one.Way[0] * length * t + side[0] * aside, one.Z + one.Way[1] * length * t + side[1] * aside, floor - t * length * 0.04]);
			}

			var end = points[points.length - 1];
			var radius = 9 + random(number + 50) * 6;
			var depth = site.Elevation(end[0], end[1]) - end[2] - 3;

			items.push({ID: 'cave-' + number, Type: 'cave', Points: points, Width: 5 + random(number + 40) * 2, Rough: 0.6, Mouth: 0});

			/* Its hall only where the rock over it is thick enough to hold it. */
			if (depth > radius + 4)
				items.push({ID: 'cave-hall-' + number, Type: 'hall', At: [end[0], end[1]], Radius: radius, Depth: depth});
		});

		return items.length ? {Layers: [{ID: 'caves', Name: 'Caves', Items: items}]} : undefined;
	},

	/* The sketch of the ground of a location of a planet: its rivers (Streams), its settlements (Towns), its highways (Trunks) and its caves (Caverns); undefined with none. */
	Sketch: function (planet, place) {
		var trunks = this.Trunks(planet, place);
		var layers = [this.Streams(planet, place), this.Towns(planet, place, trunks), trunks, this.Caverns(planet, place)].filter(Boolean).map(function (sketch) {
			return sketch.Layers[0];
		});

		return layers.length ? {Layers: layers} : undefined;
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

		/* Its sketch (of a World not told), and with caves in it what grows in them. */
		var sketch = told && told.World ? null : this.Sketch(options, place);
		var caved = !!sketch && sketch.Layers.some(function (layer) {
			return layer.ID === 'caves';
		});

		return {
			ID: cell.ID,
			Cell: cell,
			Place: place,
			Kind: told && told.Kind || 'generated',
			Model: told && told.Model || '',
			Told: !!told,
			World: told && told.World || this.$Service('SceneWorld').Library({Size: this.Extent(place), Planet: {Options: options, Latitude: place.Latitude, Longitude: place.Longitude, Turn: place.Turn}, Sketch: sketch, Scatters: caved ? [{Kind: 'dripstones'}, {Kind: 'cave-floor'}, {Kind: 'cave-crystals'}] : undefined, Border: {Points: place.Points, Sides: place.Sides, Beyond: told && told.Beyond || 'far', Passages: passages, Open: open}, Roads: options.LocationRoads === false ? undefined : true}),
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
