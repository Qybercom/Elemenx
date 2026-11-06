/*
 * An editor of a planet as a globe (ScenePlanet): what a developer draws of it, continents and oceans, ranges, rifts and
 * rivers, its climates and lands, and what the planet makes of it shown as it is, however near: each pixel is reckoned of
 * the planet in workers (Picture), coarse first and finer after, so nothing blurs when it comes close.
 * Value is the planet: the options of ScenePlanet.Make ({Seed, Radius, Ocean, Relief, Depth, Plates, Detail, Paint}).
 * change emits it after each action, select {Index} of the stroke selected.
 * Tool: look (a drag turns the globe, the wheel comes nearer, a press selects a stroke), or a kind of stroke: land, sea,
 * climate and biome are areas, mountains, rift and river lines; each press on the globe puts a point of it, a double
 * press or Enter ends it, Escape leaves it. Overlay is what is shown: relief, plates (their motions as arrows), wind (as
 * arrows), temperature, moisture or biomes. The panel beside sets the planet and the stroke selected; Delete removes it.
 * Tool location picks the location of a point (SceneLocations: a cell of LocationSize km of its Grid, cube or hex), its outline marked: its kind
 * (generated or a model of a file), what is past its sides, passages to the locations beside; Open emits location with it.
 * Methods: Planet() (ScenePlanet.Make of it), View() and SetView({Yaw, Pitch, Zoom}), At(clientX, clientY) ({Latitude,
 * Longitude, Sample} under a point, or null), Finish(), Cancel(), Remove(index), Render().
 */
Elemenx.Component('PlanetEditor', {
	$TemplateURL: 'PlanetEditor.html',
	$StyleURL: 'PlanetEditor.css',
	$Meta: {
		Group: 'game',
		Icon: 'globe',
		Description: 'An editor of a planet as a globe: continents, oceans, ranges, rivers, climates and lands drawn on it, its plates, winds and climate shown sharp at any distance.',
		Events: {
			change: 'The planet changed: the options of ScenePlanet.Make.',
			select: 'The stroke selected: {Index} (-1: none).',
			location: 'A location of the planet opened: {ID, Location} (SceneLocations.Location: its World, its place, its kind).',
			drawn: 'The picture of the view is whole: {Overlay}.'
		},
		Methods: ['Planet()', 'View()', 'SetView(view)', 'At(clientX, clientY)', 'Finish()', 'Cancel()', 'Remove(index)', 'Render()'],
		Props: {
			Value: 'The planet: the options of ScenePlanet.Make.',
			Tool: {Options: ['look', 'land', 'sea', 'mountains', 'rift', 'river', 'climate', 'biome', 'location'], Description: 'The tool in hand.'},
			Overlay: {Options: ['relief', 'plates', 'wind', 'temperature', 'moisture', 'biomes'], Description: 'What is shown of the planet.'},
			Label: 'What it shows, for screen readers.'
		}
	},
	Value: null,
	Tool: 'look',
	Overlay: 'relief',
	Label: '',

	/* What the template renders. */
	Selected: -1,
	/* The location picked (Tool location): the ID of its cell (SceneLocations), '' none. */
	Place: '',
	Info: '',
	Version: 0,
	Tools: [
		{ID: 'look', Key: 'graphics.planetEditor.tools.look'},
		{ID: 'land', Key: 'graphics.planetEditor.tools.land'},
		{ID: 'sea', Key: 'graphics.planetEditor.tools.sea'},
		{ID: 'mountains', Key: 'graphics.planetEditor.tools.mountains'},
		{ID: 'rift', Key: 'graphics.planetEditor.tools.rift'},
		{ID: 'river', Key: 'graphics.planetEditor.tools.river'},
		{ID: 'climate', Key: 'graphics.planetEditor.tools.climate'},
		{ID: 'biome', Key: 'graphics.planetEditor.tools.biome'},
		{ID: 'location', Key: 'graphics.planetEditor.tools.location'}
	],
	Overlays: [
		{ID: 'relief', Key: 'graphics.planetEditor.overlays.relief'},
		{ID: 'plates', Key: 'graphics.planetEditor.overlays.plates'},
		{ID: 'wind', Key: 'graphics.planetEditor.overlays.wind'},
		{ID: 'temperature', Key: 'graphics.planetEditor.overlays.temperature'},
		{ID: 'moisture', Key: 'graphics.planetEditor.overlays.moisture'},
		{ID: 'biomes', Key: 'graphics.planetEditor.overlays.biomes'}
	],
	/* The fields of the planet, and of each kind of stroke with their first values. */
	Settings: [
		{Key: 'Seed', Value: 'planet'}, {Key: 'Radius', Value: 6371}, {Key: 'Ocean', Value: 0.65}, {Key: 'Relief', Value: 8000},
		{Key: 'Depth', Value: 6000}, {Key: 'Plates', Value: 14}, {Key: 'Detail', Value: 2}, {Key: 'LocationSize', Value: 4},
		{Key: 'Grid', Value: 'cube'}
	],
	StrokeFields: {
		land: {Edge: 200}, sea: {Edge: 200}, mountains: {Width: 150, Height: 4000}, rift: {Width: 60, Depth: 1200},
		river: {Width: 6}, climate: {Temperature: 0, Moisture: 0, Edge: 200}, biome: {Biome: 'temperate', Edge: 100}
	},
	Areas: ['land', 'sea', 'climate', 'biome'],
	/* The kinds of passages between locations (SceneLocations). */
	PassageKinds: ['road', 'path', 'river', 'tunnel', 'gate'],

	$OnCreate: function () {
		var own = {Planet: null, Key: '', Draft: [], View: {Yaw: 0, Pitch: 0.35, Zoom: 1}, Drag: null, Pass: 0, Canvas: null, Marks: null, Sizes: null, Emitted: ''};

		this.Own = function () {
			return own;
		};

		own.Emitted = JSON.stringify(this.Value || null);
	},

	$OnReady: function () {
		var self = this;
		var own = this.Own();

		own.Canvas = this.$Ref('Canvas');
		own.Marks = this.$Ref('Marks');

		if (typeof ResizeObserver !== 'undefined') {
			own.Sizes = new ResizeObserver(function () {
				self.Render();
			});

			own.Sizes.observe(this.$Ref('View'));
		}

		this.Render();
	},

	$OnProps: function (changed) {
		var own = this.Own();

		if ('Value' in changed && JSON.stringify(this.Value || null) !== own.Emitted) {
			own.Emitted = JSON.stringify(this.Value || null);
			own.Key = '';
			this.Selected = -1;
		}

		if ('Value' in changed || 'Overlay' in changed) this.Render();
		else this.Mark();
	},

	$OnDestroy: function () {
		var own = this.Own();

		own.Pass++;

		if (own.Sizes)
			own.Sizes.disconnect();
	},

	/* The options of the planet, a copy, with the strokes it has. */
	Options: function () {
		var options = JSON.parse(JSON.stringify(this.Value || {}));

		options.Paint = options.Paint || [];

		return options;
	},

	/* What is reckoned of it, in the page and in the workers alike: its lands resolved (BiomeList), so a worker needs no registry. */
	Reckoned: function () {
		var options = this.Options();
		var terrain = this.$Service('SceneTerrainGenerator');

		options.BiomeList = terrain.Biomes({Biomes: options.Biomes || ['temperate', 'taiga', 'tundra', 'desert', 'savanna', 'swamp']});

		return options;
	},

	Planet: function () {
		var own = this.Own();
		var options = this.Reckoned();
		var key = JSON.stringify(options);

		if (own.Key !== key) {
			own.Key = key;
			own.Planet = this.$Service('ScenePlanet').Planet(options);
		}

		return own.Planet;
	},

	View: function () {
		var own = this.Own();
		var view = this.$Ref('View');

		return {Yaw: own.View.Yaw, Pitch: own.View.Pitch, Zoom: own.View.Zoom, Width: view ? view.clientWidth || 1 : 1, Height: view ? view.clientHeight || 1 : 1};
	},

	SetView: function (view) {
		var own = this.Own();

		own.View = {Yaw: Number(view.Yaw) || 0, Pitch: Math.max(-1.5, Math.min(1.5, Number(view.Pitch) || 0)), Zoom: Math.max(0.4, Math.min(100000, Number(view.Zoom) || 1))};

		this.Render();
	},

	/* The point of the planet under a point of the page. */
	At: function (clientX, clientY) {
		var box = this.$Ref('View').getBoundingClientRect();
		var planets = this.$Service('ScenePlanet');
		var direction = planets.Unproject(this.View(), clientX - box.left, clientY - box.top);
		var place;

		if (!direction) return null;

		place = planets.LatLon(direction);

		return {Latitude: place[0], Longitude: place[1], Sample: this.Planet().Sample(direction)};
	},

	/*
	 * The picture of the view again: in workers, each pass of it finer (8, 4, 2 then 1 pixel), in bands; one started anew
	 * lets the old one go. drawn when the finest is whole.
	 */
	Render: function () {
		var self = this;
		var own = this.Own();
		var planets = this.$Service('ScenePlanet');
		var view = this.View();
		var canvas = own.Canvas;
		var options = this.Reckoned();
		var overlay = this.Overlay || 'relief';
		var pass = ++own.Pass;
		var steps = [8, 4, 2, 1];
		var context;
		var ratio;

		if (!canvas) return;

		ratio = Math.min(2, window.devicePixelRatio || 1);
		canvas.width = Math.round(view.Width * ratio);
		canvas.height = Math.round(view.Height * ratio);
		context = canvas.getContext('2d');

		context.setTransform(ratio, 0, 0, ratio, 0, 0);

		context.imageSmoothingEnabled = false;

		this.Mark();

		/* One step: its bands; the next when all came. */
		function step (index) {
			var size = steps[index];
			var bands = 4;
			var left = bands;
			var band;

			for (band = 0; band < bands; band++) {
				(function (rect) {
					planets.Work().Run('ScenePlanet', 'Picture', [options, view, rect, size, overlay], function (error, made) {
						var piece;
						var image;

						if (pass !== own.Pass) return;

						if (!error && made && made.Width) {
							piece = document.createElement('canvas');
							piece.width = made.Width;
							piece.height = made.Height;
							image = piece.getContext('2d').createImageData(made.Width, made.Height);

							image.data.set(made.Data);

							piece.getContext('2d').putImageData(image, 0, 0);

							context.clearRect(rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1]);
							context.drawImage(piece, rect[0], rect[1], made.Width * size, made.Height * size);
						}

						left--;

						if (left) return;

						if (index + 1 < steps.length) step(index + 1);
						else self.$Emit('drawn', {Overlay: overlay});
					});
				})([0, Math.floor(view.Height * band / bands / size) * size, view.Width, band === bands - 1 ? view.Height : Math.floor(view.Height * (band + 1) / bands / size) * size]);
			}
		}

		step(0);
	},

	/* The marks over the picture: the strokes, the one drawn, and the arrows of the winds or of the plates. */
	Mark: function () {
		var self = this;
		var own = this.Own();
		var svg = own.Marks;
		var planets = this.$Service('ScenePlanet');
		var view = this.View();
		var options = this.Options();
		var parts = [];
		var planet;
		var i;
		var j;

		if (!svg) return;

		svg.setAttribute('viewBox', '0 0 ' + view.Width + ' ' + view.Height);

		/* A line of points [latitude, longitude] as it is seen: broken where it goes round the back of the globe. */
		function line (points, closed, kind) {
			var pieces = [];
			var current = [];
			var given = closed ? points.concat([points[0]]) : points;
			var list = [];

			/* Each side along the great circle of its ends, in steps of about a degree, not straight on the screen. */
			given.forEach(function (point, index) {
				var next = given[index + 1];
				var a;
				var b;
				var span;
				var count;
				var k;

				list.push(point);

				if (!next) return;

				a = planets.Direction(point[0], point[1]);
				b = planets.Direction(next[0], next[1]);
				span = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
				count = Math.min(180, Math.ceil(span * 180 / Math.PI));

				for (k = 1; k < count; k++) {
					var t = k / count;
					var wa = Math.sin((1 - t) * span) / (Math.sin(span) || 1);
					var wb = Math.sin(t * span) / (Math.sin(span) || 1);

					list.push(planets.LatLon([a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb, a[2] * wa + b[2] * wb]));
				}
			});

			list.forEach(function (point) {
				var at = planets.Project(view, planets.Direction(point[0], point[1]));

				if (at[2] > 0) {
					current.push(at[0].toFixed(1) + ',' + at[1].toFixed(1));
				}
				else if (current.length) {
					pieces.push(current);

					current = [];
				}
			});

			if (current.length)
				pieces.push(current);

			return pieces.map(function (piece) {
				return '<polyline class="elemenx-planet-editor-stroke ' + kind + '" points="' + piece.join(' ') + '"></polyline>';
			}).join('');
		}

		options.Paint.forEach(function (stroke, index) {
			parts.push('<g class="' + (index === self.Selected ? 'selected' : '') + '" data-stroke="' + index + '">' + line(stroke.Points || [], self.Areas.indexOf(stroke.Type) !== -1, stroke.Type) + '</g>');
		});

		if (own.Draft.length)
			parts.push('<g class="draft">' + line(own.Draft, false, this.Tool) + '</g>');

		/* An arrow from a point of the globe, along east and north, size pixels long. */
		function arrow (direction, east, north, size) {
			var place = planets.LatLon(direction);
			var from = planets.Project(view, direction);
			var step = 2.5 / Math.max(1, view.Zoom);
			var length = Math.sqrt(east * east + north * north) || 1;
			var to = planets.Project(view, planets.Direction(place[0] + north / length * step, place[1] + east / length * step / Math.max(0.2, Math.cos(place[0] * Math.PI / 180))));
			var dx = to[0] - from[0];
			var dy = to[1] - from[1];
			var far = Math.sqrt(dx * dx + dy * dy) || 1;
			var tip = [from[0] + dx / far * size, from[1] + dy / far * size];

			if (from[2] <= 0) return '';

			return '<line class="elemenx-planet-editor-arrow" x1="' + from[0].toFixed(1) + '" y1="' + from[1].toFixed(1) + '" x2="' + tip[0].toFixed(1) + '" y2="' + tip[1].toFixed(1) + '"></line><circle class="elemenx-planet-editor-arrow-tip" cx="' + tip[0].toFixed(1) + '" cy="' + tip[1].toFixed(1) + '" r="2"></circle>';
		}

		/* Arrows: of the wind over a grid of the view, of each plate at its middle. */
		if (this.Overlay === 'wind' || this.Overlay === 'plates') {
			planet = this.Planet();

			if (this.Overlay === 'wind') {
				for (j = 1; j < 14; j++) {
					for (i = 1; i < 20; i++) {
						var direction = planets.Unproject(view, view.Width * i / 20, view.Height * j / 14);
						var wind;

						if (!direction) continue;

						wind = planet.Wind(direction);

						parts.push(arrow(direction, wind[0], wind[1], 6 + Math.min(12, Math.sqrt(wind[0] * wind[0] + wind[1] * wind[1]))));
					}
				}
			}
			else {
				planet.Plates.forEach(function (plate) {
					var p = plate.Middle;
					var east = Math.abs(p[1]) > 0.9999 ? [0, 0, -1] : [-p[2], 0, p[0]];
					var length = Math.sqrt(east[0] * east[0] + east[2] * east[2]) || 1;
					var e = [east[0] / length, 0, east[2] / length];
					var n = [p[1] * e[2] - p[2] * e[1], p[2] * e[0] - p[0] * e[2], p[0] * e[1] - p[1] * e[0]];

					parts.push(arrow(p, plate.Motion[0] * e[0] + plate.Motion[1] * e[1] + plate.Motion[2] * e[2], plate.Motion[0] * n[0] + plate.Motion[1] * n[1] + plate.Motion[2] * n[2], 26));
				});
			}
		}

		/* The locations told, and the one picked. */
		Object.keys(options.Locations || {}).concat(this.Place && !(options.Locations || {})[this.Place] ? [this.Place] : []).forEach(function (id) {
			var cell = self.$Service('SceneLocations').Cell(id);
			var corners = planets.CellCorners(cell).map(function (corner) {
				return planets.LatLon(corner);
			});

			parts.push('<g class="' + (id === self.Place ? 'selected' : '') + '" data-location="' + id + '">' + line(corners, true, 'location') + '</g>');
		});

		svg.innerHTML = parts.join('');
	},

	/* The planet changed: emitted, its picture again. */
	Changed: function (options) {
		var own = this.Own();

		own.Emitted = JSON.stringify(options);
		this.Value = options;
		this.Version++;

		this.$Emit('change', options);
		this.Render();
	},

	Picked: function (tool) {
		this.Cancel();

		this.Tool = tool;
	},

	Overlaid: function (event) {
		this.Overlay = event.target.value;

		this.Render();
	},

	Down: function (event) {
		var own = this.Own();

		own.Drag = {X: event.clientX, Y: event.clientY, View: Object.assign({}, own.View), Moved: false};

		if (event.target.setPointerCapture && event.pointerId !== undefined) {
			try {
				event.target.setPointerCapture(event.pointerId);
			}
			catch (error) {
				/* A synthetic event has no pointer to take. */
			}
		}
	},

	Move: function (event) {
		var own = this.Own();
		var drag = own.Drag;
		var view = this.View();
		var scale;
		var under;

		if (drag) {
			if (Math.abs(event.clientX - drag.X) + Math.abs(event.clientY - drag.Y) > 4)
				drag.Moved = true;

			if (drag.Moved) {
				scale = Math.min(view.Width, view.Height) / 2 * own.View.Zoom;
				own.View.Yaw = drag.View.Yaw + (event.clientX - drag.X) / scale;
				own.View.Pitch = Math.max(-1.5, Math.min(1.5, drag.View.Pitch + (event.clientY - drag.Y) / scale));

				this.Mark();
			}

			return;
		}

		under = this.At(event.clientX, event.clientY);

		this.Info = under ? under.Latitude.toFixed(2) + '°, ' + under.Longitude.toFixed(2) + '° · ' + Math.round(under.Sample.Elevation) + ' m · ' + under.Sample.Celsius.toFixed(0) + ' °C' + (under.Sample.Biome ? ' · ' + under.Sample.Biome : '') : '';
	},

	Up: function (event) {
		var own = this.Own();
		var drag = own.Drag;
		var under;

		own.Drag = null;

		if (!drag) return;

		if (drag.Moved) {
			this.Render();

			return;
		}

		under = this.At(event.clientX, event.clientY);

		/* A location: the cell of the point, its outline marked and its fields in the panel. */
		if (this.Tool === 'location') {
			if (under) {
				this.Place = this.$Service('SceneLocations').At(this.Options(), under.Latitude, under.Longitude);
				this.Version++;

				this.Mark();
			}

			return;
		}

		if (this.Tool === 'look') {
			this.Choose(event.clientX, event.clientY);

			return;
		}

		if (under) {
			own.Draft.push([Math.round(under.Latitude * 1e4) / 1e4, Math.round(under.Longitude * 1e4) / 1e4]);

			this.Mark();
		}
	},

	Wheeled: function (event) {
		var own = this.Own();

		event.preventDefault();

		own.View.Zoom = Math.max(0.4, Math.min(100000, own.View.Zoom * (event.deltaY < 0 ? 1.25 : 0.8)));

		this.Render();
	},

	Key: function (event) {
		if (event.key === 'Enter') this.Finish();
		else if (event.key === 'Escape') this.Cancel();
		else if ((event.key === 'Delete' || event.key === 'Backspace') && this.Selected >= 0) this.Remove(this.Selected);
	},

	/* The stroke drawn ends: one of its kind, with the first values of its fields. */
	Finish: function () {
		var own = this.Own();
		var options;
		var area = this.Areas.indexOf(this.Tool) !== -1;

		if (this.Tool === 'look' || own.Draft.length < (area ? 3 : 2)) {
			own.Draft = [];

			this.Mark();

			return false;
		}

		options = this.Options();

		options.Paint.push(Object.assign({Type: this.Tool, Points: own.Draft.slice()}, this.StrokeFields[this.Tool]));

		own.Draft = [];
		this.Selected = options.Paint.length - 1;

		this.Changed(options);
		this.$Emit('select', {Index: this.Selected});

		return true;
	},

	Cancel: function () {
		this.Own().Draft = [];

		this.Mark();
	},

	/* The stroke nearest a press, within 10 pixels of a line of it. */
	Choose: function (clientX, clientY) {
		var box = this.$Ref('View').getBoundingClientRect();
		var planets = this.$Service('ScenePlanet');
		var view = this.View();
		var x = clientX - box.left;
		var y = clientY - box.top;
		var best = -1;
		var nearest = 10;
		var self = this;

		this.Options().Paint.forEach(function (stroke, index) {
			var points = (stroke.Points || []).map(function (point) {
				return planets.Project(view, planets.Direction(point[0], point[1]));
			});
			var k;

			if (self.Areas.indexOf(stroke.Type) !== -1)
				points.push(points[0]);

			for (k = 0; k + 1 < points.length; k++) {
				var a = points[k];
				var b = points[k + 1];
				var dx = b[0] - a[0];
				var dy = b[1] - a[1];
				var t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1)));
				var far = Math.hypot(a[0] + dx * t - x, a[1] + dy * t - y);

				if (a[2] > 0 && b[2] > 0 && far < nearest) {
					nearest = far;
					best = index;
				}
			}
		});

		this.Selected = best;

		this.Mark();
		this.$Emit('select', {Index: best});
	},

	Remove: function (index) {
		var options = this.Options();
		if (index < 0 || index >= options.Paint.length) return false;

		options.Paint.splice(index, 1);

		this.Selected = -1;

		this.Changed(options);

		return true;
	},

	/* The fields of the planet as the panel shows them. */
	Fields: function () {
		var options = this.Options();

		return this.Settings.map(function (field) {
			return {Key: field.Key, Value: options[field.Key] === undefined ? field.Value : options[field.Key]};
		});
	},

	/* The fields of the stroke selected. */
	StrokeOf: function () {
		var stroke = this.Options().Paint[this.Selected];
		var fields = stroke ? this.StrokeFields[stroke.Type] || {} : {};

		return Object.keys(fields).map(function (key) {
			return {Key: key, Value: stroke[key] === undefined ? fields[key] : stroke[key]};
		});
	},

	SettingChanged: function (event) {
		var options = this.Options();
		var key = event.target.getAttribute('data-key');
		var text = event.target.value;

		options[key] = key === 'Seed' || isNaN(Number(text)) ? text : Number(text);

		this.Changed(options);
	},

	/* The location picked as SceneLocations resolves it; null with none. */
	LocationOf: function () {
		return this.Place ? this.$Service('SceneLocations').Location(this.Options(), this.Place) : null;
	},

	/* Its fields as the panel shows them. */
	LocationFields: function () {
		var location = this.LocationOf();

		return location ? [{Key: 'Kind', Value: location.Kind, Options: ['generated', 'model']}, {Key: 'Model', Value: location.Model}, {Key: 'Beyond', Value: location.Beyond, Options: this.$Service('SceneLocations').Beyonds()}] : [];
	},

	/* The sides of the location picked, for a passage: +X, +Z, -X, -Z of a square, 1 to 6 round a hexagon. */
	SidesOf: function () {
		var location = this.LocationOf();

		return location ? location.Sides.map(function (side) {
			return {Value: side.Side, Label: location.Sides.length === 4 ? ['+X', '+Z', '-X', '-Z'][side.Side] : String(side.Side + 1)};
		}) : [];
	},

	LocationChanged: function (event) {
		var changes = {};

		if (!this.Place) return;

		changes[event.target.getAttribute('data-key')] = event.target.value;

		this.Changed(this.$Service('SceneLocations').Tell(this.Options(), this.Place, changes));
	},

	/* A passage on a side of the location picked (the side of the select of the panel), to the location beside it. */
	PassageAdded: function () {
		var holder = this.$Element().querySelector('.elemenx-planet-editor-passage');
		var side = holder ? Number(holder.querySelector('[data-key="Side"]').value) : 0;
		var kind = holder ? holder.querySelector('[data-key="Kind"]').value : 'path';
		var locations = this.$Service('SceneLocations');
		var location = this.LocationOf();
		if (!location) return;

		this.Changed(locations.Passage(locations.Tell(locations.Tell(this.Options(), location.ID, {}), location.Sides[side].To, {}), location.ID, {Side: side, At: 0.5, Kind: kind}));
	},

	/* The location picked opened: location emitted with it resolved ({ID, Location}: its World, its place, its kind), told in the planet. */
	Opened: function () {
		var options;

		if (!this.Place) return;

		options = this.$Service('SceneLocations').Tell(this.Options(), this.Place, {});

		this.Changed(options);
		this.$Emit('location', {ID: this.Place, Location: this.$Service('SceneLocations').Location(options, this.Place)});
	},

	StrokeChanged: function (event) {
		var options = this.Options();
		var key = event.target.getAttribute('data-key');
		var text = event.target.value;
		var stroke = options.Paint[this.Selected];
		if (!stroke) return;

		stroke[key] = key === 'Biome' || isNaN(Number(text)) ? text : Number(text);

		this.Changed(options);
	}
});
