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
	$Traits: ['EditorPanes'],
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
		Methods: ['Planet()', 'View()', 'SetView(view)', 'At(clientX, clientY)', 'Finish()', 'Cancel()', 'Remove(index)', 'Undo()', 'Redo()', 'Render()'],
		Props: {
			Value: 'The planet: the options of ScenePlanet.Make.',
			Tool: {Options: ['look', 'land', 'sea', 'mountains', 'rift', 'river', 'climate', 'biome', 'raise', 'lower', 'flatten', 'smooth', 'rule', 'location'], Description: 'The tool in hand: a stroke of its Paint, a brush of its Edits (raise, lower, flatten, smooth: a drag paints along its path), a region of a rule of detail (rule), or a location.'},
			Overlay: {Options: ['relief', 'plates', 'wind', 'temperature', 'moisture', 'biomes'], Description: 'What is shown of the planet.'},
			Label: 'What it shows, for screen readers.'
		}
	},
	PanesKey: 'planet-editor',
	Value: null,
	Tool: 'look',
	Overlay: 'relief',
	Label: '',

	/* What the template renders. */
	Selected: -1,
	/* The location picked (Tool location): the ID of its cell (SceneLocations), '' none. */
	Place: '',
	/* The side and the kind of the passage the panel adds (PassageAdded). */
	PassageSide: 0,
	PassageKind: 'path',
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
		{ID: 'raise', Key: 'graphics.planetEditor.tools.raise'},
		{ID: 'lower', Key: 'graphics.planetEditor.tools.lower'},
		{ID: 'flatten', Key: 'graphics.planetEditor.tools.flatten'},
		{ID: 'smooth', Key: 'graphics.planetEditor.tools.smooth'},
		{ID: 'rule', Key: 'graphics.planetEditor.tools.rule'},
		{ID: 'location', Key: 'graphics.planetEditor.tools.location'}
	],
	/* The rule of detail a region drawn with the tool rule gets; the rule whose graph is open under the view ('' none). */
	RuleName: 'hills',
	RuleOpen: '',
	/* The brushes of its relief (ScenePlanet Edits): a drag paints one along its path; Brush is what the next one is. */
	Brushes: ['raise', 'lower', 'flatten', 'smooth'],
	Brush: {Radius: 150, Amount: 800, Strength: 0.8},
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
	Areas: ['land', 'sea', 'climate', 'biome', 'rule'],
	/* The kinds of passages between locations (SceneLocations). */
	PassageKinds: ['road', 'path', 'river', 'tunnel', 'gate'],

	$OnCreate: function () {
		var own = {Planet: null, Key: '', Draft: [], Past: [], Future: [], View: {Turn: this.$Service('ScenePlanet').ViewTurn(0, 0.35, 0), Zoom: 1}, Drag: null, Pass: 0, Canvas: null, Marks: null, Sizes: null, Emitted: ''};

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

		/* Drawn again when the size of its view changed: the observer tells once at the start too, of the size it has. */
		if (typeof ResizeObserver !== 'undefined') {
			own.Sizes = new ResizeObserver(function () {
				var view = self.View();
				if (own.Canvas && own.Canvas.width === Math.round(view.Width * Math.min(2, window.devicePixelRatio || 1)) && own.Canvas.height === Math.round(view.Height * Math.min(2, window.devicePixelRatio || 1))) return;

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

		window.clearTimeout(own.Later);

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

		options.BiomeList = terrain.Biomes({Biomes: options.Biomes || ['temperate', 'taiga', 'tundra', 'desert', 'savanna', 'swamp', 'rainforest', 'semidesert', 'steppe']});

		/* Its rules of detail made code here, for the workers too. */
		return this.$Service('ScenePlanet').Ruled(options);
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
		var turn = own.View.Turn;

		/* Its Yaw and Pitch are those of the middle of the view; Turn is the whole of it (any way round, over the poles too). */
		return {Yaw: Math.atan2(turn[6], turn[8]), Pitch: Math.asin(Math.max(-1, Math.min(1, turn[7]))), Roll: this.Roll(), Zoom: own.View.Zoom, Turn: turn.slice(), Width: view ? view.clientWidth || 1 : 1, Height: view ? view.clientHeight || 1 : 1};
	},

	SetView: function (view) {
		var own = this.Own();
		var given = view || {};

		own.View = {Turn: given.Turn && given.Turn.length === 9 ? given.Turn.slice() : this.$Service('ScenePlanet').ViewTurn(Number(given.Yaw) || 0, Number(given.Pitch) || 0, Number(given.Roll) || 0), Zoom: Math.max(0.4, Math.min(100000, Number(given.Zoom) || 1))};

		this.Moved();
		this.Render();
	},

	/* How far the north of the planet is turned from the top of the view (radians): what the compass shows. */
	Roll: function () {
		var turn = this.Own().View.Turn;

		return Math.atan2(turn[1], turn[4]);
	},

	/*
	 * The view turned by the screen: a turn round its vertical (a), round its horizontal (b) and round the eye (c), each in
	 * radians. The globe turns under the hand as a ball does, the same way everywhere, over its poles too.
	 */
	Turn: function (a, b, c) {
		var own = this.Own();
		var t = own.View.Turn;
		var right = [t[0], t[1], t[2]];
		var up = [t[3], t[4], t[5]];
		var ahead = [t[6], t[7], t[8]];
		var pair;

		function turned (p, q, angle) {
			var cos = Math.cos(angle);
			var sin = Math.sin(angle);

			return [[cos * p[0] + sin * q[0], cos * p[1] + sin * q[1], cos * p[2] + sin * q[2]], [-sin * p[0] + cos * q[0], -sin * p[1] + cos * q[1], -sin * p[2] + cos * q[2]]];
		}

		if (a) {
			pair = turned(right, ahead, a);
			right = pair[0];
			ahead = pair[1];
		}

		if (b) {
			pair = turned(up, ahead, b);
			up = pair[0];
			ahead = pair[1];
		}

		if (c) {
			pair = turned(right, up, c);
			right = pair[0];
			up = pair[1];
		}

		own.View.Turn = this.Orthonormal(right, up);

		this.Moved();
	},

	/* Three axes again square to each other (a turn after many keeps no drift). */
	Orthonormal: function (right, up) {
		var vectors = this.$Service('Math').Vectors;
		var x = vectors.Normalize(right);
		var z = vectors.Normalize(vectors.Cross(x, up));
		var y = vectors.Cross(z, x);

		return [x[0], x[1], x[2], y[0], y[1], y[2], -z[0], -z[1], -z[2]];
	},

	/* North up again: the same middle, its roll undone. */
	NorthUp: function () {
		var view = this.View();

		this.Own().View.Turn = this.$Service('ScenePlanet').ViewTurn(view.Yaw, view.Pitch, 0);

		this.Moved();
		this.Soon();
	},

	/*
	 * The view went: the globe drawn at once of the map of the planet (it turns as it is turned), the picture of the view
	 * of before let go (it would be in the wrong place), the marks where they are now; the picture comes again when the
	 * view rests (Soon).
	 */
	Moved: function () {
		var own = this.Own();

		own.Pass++;

		if (own.Canvas && own.Canvas.width)
			own.Canvas.getContext('2d').clearRect(0, 0, own.Canvas.width, own.Canvas.height);

		this.North = Math.round(-this.Roll() * 180 / Math.PI);

		this.Globe();
		this.Mark();
	},

	/* The globe of the map of the planet (WebGL), the picture of the view coming over it; drawn at any move. */
	Globe: function () {
		var own = this.Own();
		var canvas = this.$Ref('Globe');
		var view = this.View();
		var renderer = own.Renderer;
		var ratio = Math.min(2, window.devicePixelRatio || 1);

		if (!canvas) return;

		if (!renderer) {
			renderer = own.Renderer = this.$Service('Renderer').Create(canvas, {Alpha: true, Antialias: false});

			if (!renderer) return;

			own.Quad = renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});
			own.Program = renderer.Program(this.$Service('Renderer').Shaders.Quad, this.GlobeShader());
		}

		if (canvas.width !== Math.round(view.Width * ratio) || canvas.height !== Math.round(view.Height * ratio)) {
			canvas.width = Math.round(view.Width * ratio);
			canvas.height = Math.round(view.Height * ratio);
		}

		renderer.Resize(canvas.width, canvas.height, 1);
		renderer.Clear([0, 0, 0, 0]);

		if (!own.MapTexture) return;

		renderer.Draw(own.Quad, own.Program, {uMap: own.MapTexture, uTurn: view.Turn, uScale: [view.Width / 2 / (Math.min(view.Width, view.Height) / 2 * view.Zoom), view.Height / 2 / (Math.min(view.Width, view.Height) / 2 * view.Zoom)], uEdge: 2 / (Math.min(view.Width, view.Height) / 2 * view.Zoom * ratio)}, {Depth: false, DepthWrite: false, Blend: 'alpha', Cull: 'none'});
	},

	GlobeShader: function () {
		return [
			'#version 300 es',
			'precision highp float;',
			'in vec2 vQuad;',
			'uniform sampler2D uMap;',
			'uniform mat3 uTurn;',
			'uniform vec2 uScale;',
			'uniform float uEdge;',
			'out vec4 outColor;',
			'void main() {',
			'	vec2 p = vQuad * uScale;',
			'	float r = dot(p, p);',
			'	if (r > 1.0) discard;',
			'	vec3 d = uTurn * vec3(p, sqrt(1.0 - r));',
			'	float lat = asin(clamp(d.y, -1.0, 1.0));',
			'	float lon = atan(-d.z, d.x);',
			'	vec2 uv = vec2(lon / 6.2831853 + 0.5, 0.5 - lat / 3.1415927);',
			'	outColor = vec4(texture(uMap, uv).rgb, smoothstep(1.0, 1.0 - uEdge, sqrt(r)));',
			'}'
		].join('\n');
	},

	/*
	 * The map of all of the planet the globe is drawn of: made in the workers for the planet and what is shown, a small one
	 * first (at once), then a fine one, row by row, once the picture of the view is drawn; kept till they change.
	 */
	Mapped: function () {
		var self = this;
		var own = this.Own();
		var planets = this.$Service('ScenePlanet');
		var overlay = this.Overlay || 'relief';
		var options;
		var key;
		var sizes = [[256, 128, 1], [1024, 512, 4]];

		if (!own.Renderer)
			this.Globe();

		if (!own.Renderer) return;

		options = this.Reckoned();
		key = JSON.stringify(options) + '|' + overlay;

		if (own.MapKey === key) return;

		own.MapKey = key;
		own.MapPass = (own.MapPass || 0) + 1;
		own.MapNext = null;

		function size (index) {
			var width = sizes[index][0];
			var height = sizes[index][1];
			var bands = sizes[index][2];
			var pass = own.MapPass;
			var left = bands;
			var map = document.createElement('canvas');
			var context = map.getContext('2d');
			var band;

			map.width = width;
			map.height = height;

			/* The fine one over the small one, band by band: no row of the globe is ever empty. */
			if (own.MapCanvas)
				context.drawImage(own.MapCanvas, 0, 0, width, height);

			for (band = 0; band < bands; band++) {
				planets.Work().Run('ScenePlanet', 'Map', [options, [Math.floor(height * band / bands), Math.floor(height * (band + 1) / bands)], width, height, overlay], function (error, made) {
					var image;

					if (pass !== own.MapPass) return;

					if (!error && made && made.Height) {
						image = context.createImageData(made.Width, made.Height);

						image.data.set(made.Data);

						context.putImageData(image, 0, made.From);

						own.MapCanvas = map;

						if (own.MapTexture) own.MapTexture.Update(map);
						else own.MapTexture = own.Renderer.Texture(map, {Repeat: true});

						self.Globe();
					}

					/* The fine one waits for the picture of the view: the workers draw what is looked at first. */
					if (--left === 0 && index + 1 < sizes.length)
						own.MapNext = function () {
							size(index + 1);
						};
				});
			}
		}

		size(0);
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
		var steps = [4, 2, 1];
		var context;
		var ratio;

		if (!canvas) return;

		window.clearTimeout(own.Later);

		/* Under it the globe of the map of the planet (Mapped): its passes come over it, never over nothing. */
		this.Mapped();
		this.Globe();

		/*
		 * The canvas made again only when its size changed: that clears it, and the globe was gone till the first pass came.
		 * Regression (load): the observer drew it again at the same size after it was drawn, and it was empty.
		 */
		ratio = Math.min(2, window.devicePixelRatio || 1);

		if (canvas.width !== Math.round(view.Width * ratio) || canvas.height !== Math.round(view.Height * ratio)) {
			canvas.width = Math.round(view.Width * ratio);
			canvas.height = Math.round(view.Height * ratio);
		}

		context = canvas.getContext('2d');

		context.setTransform(ratio, 0, 0, ratio, 0, 0);

		/* The picture of the same view is kept till its passes come over it (Regression: it was cleared at once); of another view it is let go. */
		if (own.Seen !== JSON.stringify([view.Turn, view.Zoom, view.Width, view.Height]))
			context.clearRect(0, 0, view.Width, view.Height);

		own.Seen = JSON.stringify([view.Turn, view.Zoom, view.Width, view.Height]);

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
						var next;

						if (pass !== own.Pass) return;

						/* Regression: a view lower than its bands made a band of no height, and a picture of none threw. */
						if (!error && made && made.Width && made.Height) {
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

						if (index + 1 < steps.length) {
							step(index + 1);

							return;
						}

						self.$Emit('drawn', {Overlay: overlay});

						if (own.MapNext) {
							next = own.MapNext;
							own.MapNext = null;

							next();
						}
					});
				})([0, Math.floor(view.Height * band / bands / size) * size, view.Width, band === bands - 1 ? view.Height : Math.floor(view.Height * (band + 1) / bands / size) * size]);
			}
		}

		step(0);
	},

	/* The picture of the view drawn again a little after the view stopped going, the globe turning meanwhile. */
	Soon: function () {
		var own = this.Own();
		var self = this;

		this.Mark();

		window.clearTimeout(own.Later);

		own.Later = window.setTimeout(function () {
			self.Render();
		}, 200);
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

		(options.Regions || []).forEach(function (region, index) {
			parts.push('<g class="region" data-region="' + index + '">' + line(region.Points || [], true, 'rule') + '</g>');
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
	Changed: function (options, kept) {
		var own = this.Own();

		/* What it was, to go back to (Undo); an undo or a redo keeps the history as it is. */
		if (!kept) {
			own.Past.push(JSON.stringify(this.Value || {}));

			own.Future = [];

			if (own.Past.length > 100)
				own.Past.shift();
		}

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

	/* The choices of its lists (Select): what is shown over its globe; a list of names as choices. */
	OverlayOptions: function () {
		return this.Overlays.map(function (overlay) {
			return {Value: overlay.ID, Label: Elemenx.Locale.Text(overlay.Key)};
		});
	},

	Listed: function (names) {
		return (names || []).map(function (name) {
			return {Value: name, Label: String(name)};
		});
	},

	Overlaid: function (value) {
		this.Overlay = value;

		this.Render();
	},

	/* The fingers on the globe (ViewTouch): one turns it or draws, two turn it and bring it nearer (pinch). */
	Fingers: function () {
		var own = this.Own();
		var self = this;

		if (!own.Touch) {
			own.Touch = this.$Service('ViewTouch').Make({
				Edit: {Down: function (event) {
					self.Down(event);
				}, Move: function (event) {
					self.Move(event);
				}, Up: function (event) {
					self.Up(event);
				}},
				Camera: function (gesture) {
					self.Turned(gesture);
				},
				Abort: function () {
					own.Drag = null;
				}
			});
		}

		return own.Touch;
	},

	TouchDown: function (event) {
		this.Fingers().Down(event);
	},

	TouchMove: function (event) {
		this.Fingers().Move(event);
	},

	TouchUp: function (event) {
		this.Fingers().Up(event);
	},

	/* Two fingers: carried together they turn the globe, apart or together they bring it nearer or farther. */
	Turned: function (gesture) {
		var own = this.Own();
		var view = this.View();
		var scale = Math.min(view.Width, view.Height) / 2 * own.View.Zoom;

		if (gesture.Type === 'pan' && gesture.Phase !== 'end') {
			this.Turn(-gesture.MoveX / scale, -gesture.MoveY / scale, 0);
		}
		else if (gesture.Type === 'rotate' && gesture.Phase !== 'end' && gesture.Step) {
			/* Two fingers turned: the globe turns with them round the middle of the view. */
			this.Turn(0, 0, gesture.Step);
		}
		else if (gesture.Type === 'pinch' && gesture.Phase !== 'end' && gesture.Step) {
			own.View.Zoom = Math.max(0.4, Math.min(100000, own.View.Zoom * gesture.Step));

			this.Moved();
			this.Soon();
		}

		if (gesture.Phase === 'end')
			this.Render();
	},

	/* The actions of the view: in the bar over it (ViewActions) and in its context menu. */
	Actions: function () {
		var list = [];

		if (this.Tool !== 'look' && this.Tool !== 'location' && this.Brushes.indexOf(this.Tool) === -1) {
			list.push({ID: 'done', Icon: 'check', Label: Elemenx.Locale.Text('graphics.viewActions.done')});
			list.push({ID: 'cancel', Icon: 'close', Label: Elemenx.Locale.Text('graphics.viewActions.cancel')});
		}

		list.push({ID: 'delete', Icon: 'delete', Label: Elemenx.Locale.Text('graphics.viewActions.delete'), Disabled: this.Selected < 0, Danger: true});
		list.push({ID: 'undo', Icon: 'undo', Label: Elemenx.Locale.Text('graphics.viewActions.undo'), Disabled: !this.Own().Past.length});
		list.push({ID: 'redo', Icon: 'redo', Label: Elemenx.Locale.Text('graphics.viewActions.redo'), Disabled: !this.Own().Future.length});

		return list;
	},

	Acted: function (event) {
		var id = event.ID || event;

		if (id === 'undo') this.Undo();
		else if (id === 'redo') this.Redo();
		else if (id === 'done') this.Finish();
		else if (id === 'cancel') this.Cancel();
		else if (id === 'delete' && this.Selected >= 0) this.Remove(this.Selected);
	},

	/* The right button that turned the globe opens no context menu. */
	Menued: function (event) {
		if (!this.Own().Rolled) return;

		this.Own().Rolled = false;

		event.preventDefault();
		event.stopPropagation();
	},

	/* A context menu opens on what is under it: the stroke there is selected first. */
	MenuOpened: function (event) {
		this.Own().Drag = null;

		this.Choose(event.X, event.Y);
	},

	MenuPicked: function (event) {
		this.Acted({ID: event.Item.ID});
	},

	Down: function (event) {
		var own = this.Own();

		var under;
		var box = this.$Ref('View').getBoundingClientRect();

		/*
		 * The right button, the middle one or Alt turn the globe round the middle of the view (the right one opens the
		 * context menu when it did not turn it); the left one carries it under the hand.
		 */
		own.Drag = {X: event.clientX, Y: event.clientY, LastX: event.clientX, LastY: event.clientY, Moved: false, Roll: event.button === 2 || event.button === 1 || event.altKey, Centre: [box.left + box.width / 2, box.top + box.height / 2]};
		own.Rolled = false;

		if (event.button === 2) return;

		/* A brush paints along the drag (the middle button or Alt turns the globe all the same). */
		if (this.Brushes.indexOf(this.Tool) !== -1 && !own.Drag.Roll) {
			under = this.At(event.clientX, event.clientY);

			if (under) {
				own.Drag.Brush = {Points: [this.Point(under)], Height: Math.round(under.Sample.Elevation)};
				own.Draft = own.Drag.Brush.Points.slice();

				this.Mark();
			}
		}

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

		if (drag && drag.Brush) {
			this.Brushed(drag.Brush, event);

			return;
		}

		if (drag) {
			if (Math.abs(event.clientX - drag.X) + Math.abs(event.clientY - drag.Y) > 4)
				drag.Moved = true;

			if (drag.Moved && drag.Roll) {
				/* Round the middle of the view: as far as the pointer went round it. */
				this.Turn(0, 0, Math.atan2(event.clientY - drag.Centre[1], event.clientX - drag.Centre[0]) - Math.atan2(drag.LastY - drag.Centre[1], drag.LastX - drag.Centre[0]));

				own.Rolled = true;
			}
			else if (drag.Moved) {
				scale = Math.min(view.Width, view.Height) / 2 * own.View.Zoom;

				this.Turn(-(event.clientX - drag.LastX) / scale, -(event.clientY - drag.LastY) / scale, 0);
			}

			drag.LastX = event.clientX;
			drag.LastY = event.clientY;

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

		if (drag.Brush) {
			this.Brushed(drag.Brush, event);
			this.Painted(drag.Brush);

			return;
		}

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

		this.Moved();
		this.Soon();
	},

	/* A point of the globe as a stroke keeps it: [latitude, longitude], to a ten-thousandth of a degree. */
	Point: function (under) {
		return [Math.round(under.Latitude * 1e4) / 1e4, Math.round(under.Longitude * 1e4) / 1e4];
	},

	/* The path of a brush goes on under the pointer: a point each third of its radius. */
	Brushed: function (brush, event) {
		var under = this.At(event.clientX, event.clientY);
		var planets = this.$Service('ScenePlanet');
		var end = brush.Points[brush.Points.length - 1];
		var last;
		var here;
		var far;

		if (!under) return;

		last = planets.Direction(end[0], end[1]);
		here = planets.Direction(under.Latitude, under.Longitude);
		far = Math.acos(Math.max(-1, Math.min(1, last[0] * here[0] + last[1] * here[1] + last[2] * here[2]))) * (Number((this.Value || {}).Radius) || 6371);

		if (far < Math.max(1, Number(this.Brush.Radius) || 150) / 3) return;

		brush.Points.push(this.Point(under));

		this.Own().Draft = brush.Points.slice();

		this.Mark();
	},

	/* A brush lifted: its edit of the relief (ScenePlanet Edits), one step to undo. Flatten levels to the height it began at. */
	Painted: function (brush) {
		var options = this.Options();
		var edit = {Type: this.Tool, Points: brush.Points.slice(), Radius: Number(this.Brush.Radius) || 150};

		if (this.Tool === 'raise' || this.Tool === 'lower') edit.Amount = Number(this.Brush.Amount) || 0;
		else if (this.Tool === 'flatten') edit.Height = brush.Height;
		else edit.Amount = Math.max(0, Math.min(1, Number(this.Brush.Strength) || 0));

		this.Own().Draft = [];
		options.Edits = (options.Edits || []).concat([edit]);

		this.Changed(options);
	},

	/* The fields of the brush in hand: Radius (km) and how much (Amount m of raise and lower, Strength of smooth). */
	BrushFields: function () {
		var tool = this.Tool;
		var brush = this.Brush;

		if (this.Brushes.indexOf(tool) === -1) return [];

		return [{Key: 'Radius', Value: brush.Radius}].concat(tool === 'raise' || tool === 'lower' ? [{Key: 'Amount', Value: brush.Amount}] : tool === 'smooth' ? [{Key: 'Strength', Value: brush.Strength}] : []);
	},

	BrushChanged: function (key, value) {
		var next = Object.assign({}, this.Brush);

		next[key] = Number(value);
		this.Brush = next;
	},

	/*
	 * The rules of detail it may use: generated (its own relief), those of the library (ScenePlanet.Rules) and its own
	 * (Rules.Graphs), as choices of a Select.
	 */
	RuleOptions: function () {
		var own = (this.Value || {}).Rules && this.Value.Rules.Graphs || {};
		var names = Object.keys(this.$Service('ScenePlanet').Rules).concat(Object.keys(own)).filter(function (name, index, all) {
			return all.indexOf(name) === index;
		}).sort();

		return [{Value: 'generated', Label: Elemenx.Locale.Text('graphics.planetEditor.rules.generated')}].concat(names.map(function (name) {
			return {Value: name, Label: name + (own[name] ? ' *' : '')};
		}));
	},

	/* The rule of each of its biomes (Rules.Biomes), generated where none was told. */
	BiomeRules: function () {
		var options = this.Value || {};
		var mapping = options.Rules && options.Rules.Biomes || {};

		return (options.Biomes || ['temperate', 'taiga', 'tundra', 'desert', 'savanna', 'swamp', 'rainforest', 'semidesert', 'steppe']).map(function (entry) {
			var name = typeof entry === 'string' ? entry : entry.Biome || entry.Name || '';

			return {Biome: name, Rule: mapping[name] || 'generated'};
		});
	},

	/* Its rules told: a change of one of them (Biomes, Scale, Graphs), one step to undo. */
	RulesChanged: function (change) {
		var options = this.Options();

		options.Rules = Object.assign({}, options.Rules || {}, change(Object.assign({}, options.Rules || {})));

		this.Changed(options);
	},

	BiomeRuled: function (biome, rule) {
		this.RulesChanged(function (rules) {
			var mapping = Object.assign({}, rules.Biomes || {});

			if (rule === 'generated') delete mapping[biome];
			else mapping[biome] = rule;

			return {Biomes: mapping};
		});
	},

	Scaled: function (value) {
		this.RulesChanged(function () {
			return {Scale: Math.max(0.05, Number(value) || 20)};
		});
	},

	/* Its regions of rules: each its rule and its Edge (km), taken away. */
	Regions: function () {
		return ((this.Value || {}).Regions || []).map(function (region, index) {
			return {Index: index, Rule: region.Rule, Edge: region.Edge === undefined ? 30 : region.Edge};
		});
	},

	RegionChanged: function (index, key, value) {
		var options = this.Options();
		var region = Object.assign({}, options.Regions[index]);

		region[key] = key === 'Edge' ? Math.max(1, Number(value) || 30) : value;
		options.Regions = options.Regions.slice();
		options.Regions[index] = region;

		this.Changed(options);
	},

	RegionRemoved: function (index) {
		var options = this.Options();

		options.Regions = (options.Regions || []).filter(function (region, at) {
			return at !== index;
		});

		this.Changed(options);
	},

	/* The graph of a rule open under the view (Blueprint): its own of the planet, else the one of the library. */
	RuleGraph: function () {
		var name = this.RuleOpen;
		var own = (this.Value || {}).Rules && this.Value.Rules.Graphs || {};

		if (!name || name === 'generated') return null;

		return own[name] || this.$Service('ScenePlanet').Rules[name] || null;
	},

	RuleOpened: function (name) {
		this.RuleOpen = this.RuleOpen === name || name === 'generated' ? '' : name;
	},

	/*
	 * The graph of the rule open changed: the planet's own from then on (one of the library copied into it, which stays
	 * as it was). Its blocks laid out or moved alone change nothing of a rule of the library.
	 */
	RuleDrawn: function (graph) {
		var name = this.RuleOpen;
		var before = this.RuleGraph();
		var own = (this.Value || {}).Rules && this.Value.Rules.Graphs || {};

		function shape (one) {
			return JSON.stringify(one, function (key, value) {
				return ['x', 'y'].indexOf(key) === -1 ? value : undefined;
			});
		}

		if (!name || !graph || !own[name] && before && shape(before) === shape(graph)) return;

		this.RulesChanged(function (rules) {
			var graphs = Object.assign({}, rules.Graphs || {});

			graphs[name] = JSON.parse(JSON.stringify(graph));

			return {Graphs: graphs};
		});
	},

	Undo: function () {
		var own = this.Own();
		if (!own.Past.length) return;

		own.Future.push(JSON.stringify(this.Value || {}));

		this.Changed(JSON.parse(own.Past.pop()), true);
	},

	Redo: function () {
		var own = this.Own();
		if (!own.Future.length) return;

		own.Past.push(JSON.stringify(this.Value || {}));

		this.Changed(JSON.parse(own.Future.pop()), true);
	},

	Key: function (event) {
		if ((event.ctrlKey || event.metaKey) && (event.key === 'z' || event.key === 'Z')) {
			event.preventDefault();

			if (event.shiftKey) this.Redo();
			else this.Undo();

			return;
		}

		if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || event.key === 'Y')) {
			event.preventDefault();

			this.Redo();

			return;
		}

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

		/* A region of a rule of detail: in Regions, over what the planet made (its edits). */
		if (this.Tool === 'rule') {
			options.Regions = (options.Regions || []).concat([{Rule: this.RuleName, Points: own.Draft.slice(), Edge: 30}]);
			own.Draft = [];

			this.Changed(options);

			return true;
		}

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

	SettingChanged: function (key, value) {
		var options = this.Options();
		var text = String(value);

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

	LocationChanged: function (key, value) {
		var changes = {};

		if (!this.Place) return;

		changes[key] = value;

		this.Changed(this.$Service('SceneLocations').Tell(this.Options(), this.Place, changes));
	},

	/* A passage on a side of the location picked (the side of the select of the panel), to the location beside it. */
	PassageAdded: function () {
		var side = Number(this.PassageSide) || 0;
		var kind = this.PassageKind || 'path';
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

	StrokeChanged: function (key, value) {
		var options = this.Options();
		var text = String(value);
		var stroke = options.Paint[this.Selected];
		if (!stroke) return;

		stroke[key] = key === 'Biome' || isNaN(Number(text)) ? text : Number(text);

		this.Changed(options);
	}
});
