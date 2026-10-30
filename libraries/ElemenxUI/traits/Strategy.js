/*
 * Strategy: a GameScene that shows a map of cells. Map (its JSON, or the URL of a JSON of its own or of Tiled, .tmj: see
 * the GameMaps Service) and GameTerrain and GameLayer declared inside it make the ground; every other GameObject stands
 * on a cell (X, Y, Width, Height). It is seen from above (Projection orthogonal) or at an angle (isometric), drawn by the
 * scene in parallel rays with the models of its objects (a Model or a Type that names one, or the one of their kind),
 * their shadows and their clips; the marks and the fog lie over it on a canvas. A map or an object of pictures (Image),
 * and a browser with no WebGL2, are drawn on that canvas alone.
 *
 * Team is the team of the player: its units (what has a Walker) are selected (a click, Shift for more, a frame drawn
 * with the mouse, a double click for all of their Type, Ctrl+A for all) and ordered (a right click, or a tap on a touch
 * screen: they find their way, A*, and spread round the goal); what Blocks and can be selected is a building. Fog hides
 * what they do not see, and keeps what was explored. The view moves as the one of Board (X, Y, Zoom, MinZoom, MaxZoom;
 * the wheel zooms at the pointer, a drag with the middle button or with Space held moves it, so do the arrows; + and -
 * zoom), Grid draws the lines of the cells, Minimap the whole map in a corner.
 *
 * Events of the scene with a map: load ({Width, Height}), order ({Kind: move, attack or stop, IDs, X, Y, Target}), cell
 * ({X, Y, Button, Object}: a press that is not a selection nor an order), view ({X, Y, Zoom}).
 * Methods: Selection(), Order(ids, target, kind), Stop(ids), Cell(x, y), Paint(x, y, key, layer), Near(x, y, radius,
 * filter), Route(from, to), PathGrid(), FogOfWar(), CenterOn(x, y), ToCell(clientX, clientY); the rest are the ones of
 * every scene: Add, Change, Remove, Get, Objects, Select(id or ids), Move(id or ids, target), ToScreen(id, or x and y),
 * Load (a saved game, or a map).
 */
Elemenx.Trait('Strategy', {
	Map: null,
	Projection: '',
	Fog: false,
	Grid: true,
	Minimap: false,
	X: null,
	Y: null,
	Zoom: 1,
	MinZoom: 0.25,
	MaxZoom: 4,
	Panning: false,
	Cells: false,
	Flat: false,

	StrategyStart: function () {
		var self = this;
		var element = this.$Element();
		var canvas = element.querySelector('.elemenx-game-scene-marks');
		var context = canvas.getContext('2d');
		var maps = this.$Service('GameMaps');
		var paths = this.$Service('Pathfinding');
		var visibility = this.$Service('Visibility');
		var spatial = this.$Service('Spatial');
		var random = this.$Service('Random');
		var library = this.$Service('Models');
		var terrain = this.$Service('Terrain');
		var registry = this.$Service('Kinds');
		var view = element.ownerDocument.defaultView || window;
		var engine = {};
		var world = {
			Map: maps.Normalize({Width: 1, Height: 1}),
			Loaded: null,
			Declared: {Terrain: {}, Layers: []},
			Objects: {},
			Order: [],
			Selection: [],
			Index: spatial.Create({Cell: 4}),
			Ways: null,
			Hidden: null,
			Fog: null,
			FogTime: 0,
			Markers: [],
			Images: {},
			Pointers: {},
			Drag: null,
			Pinch: null,
			Space: false,
			Dirty: true,
			Width: 0,
			Height: 0,
			Ratio: 1,
			Camera: {X: 0, Y: 0, Zoom: 1},
			Centered: false,
			MiniTime: 0,
			MiniGround: null,
			Mini: null,
			Field: null,
			Revision: 0,
			Painted: null
		};
		var teams = {blue: '#3d7be0', red: '#d8453c', green: '#3fa34d', yellow: '#e2a915', purple: '#8f5bd6', orange: '#ec7a2c', teal: '#22a39a', gray: '#8a8f98'};

		/* The state of the world out of the reactive state of the Component: the loop reads it sixty times a second. */
		this.Strategy = function () {
			return engine;
		};

		this.World = function () {
			return world;
		};

		/* The color of a team: its name a color of the palette, or a CSS color of its own; a color of its name else. */
		function teamColor (team) {
			var names = Object.keys(teams);

			if (!team)
				return teams.gray;

			if (teams[team])
				return teams[team];

			if (/^#|^rgb|^hsl/.test(team)) return team;

			return teams[names[random.Hash(team) % names.length]];
		}

		function image (url) {
			var picture = world.Images[url];

			if (!url)
				return null;

			if (!picture) {
				picture = world.Images[url] = new view.Image();

				picture.onload = function () {
					world.Dirty = true;
					world.MiniGround = null;
				};

				picture.src = url;
			}

			return picture.complete && picture.naturalWidth ? picture : null;
		}

		/* Projections: cells to pixels of the world (the corner of a cell, at zoom 1), and back. */
		function project (x, y) {
			var map = world.Map;
			if (map.Projection === 'isometric')
				return {X: (x - y) * map.TileWidth / 2, Y: (x + y) * map.TileHeight / 2};

			return {X: x * map.TileWidth, Y: y * map.TileHeight};
		}

		function unproject (px, py) {
			var map = world.Map;
			var a;
			var b;

			if (map.Projection !== 'isometric')
				return {X: px / map.TileWidth, Y: py / map.TileHeight};

			a = px / (map.TileWidth / 2);
			b = py / (map.TileHeight / 2);

			return {X: (a + b) / 2, Y: (b - a) / 2};
		}

		function toScreen (x, y) {
			var point = project(x, y);
			var camera = world.Camera;

			return {X: (point.X - camera.X) * camera.Zoom, Y: (point.Y - camera.Y) * camera.Zoom};
		}

		function toCell (sx, sy) {
			var camera = world.Camera;

			return unproject(sx / camera.Zoom + camera.X, sy / camera.Zoom + camera.Y);
		}

		/* The view: told by the props and by the view event. */
		function setView (x, y, zoom, quiet) {
			var camera = world.Camera;
			var bounded = Math.max(Number(self.MinZoom) || 0.25, Math.min(Number(self.MaxZoom) || 4, zoom));
			if (camera.X === x && camera.Y === y && camera.Zoom === bounded) return;

			camera.X = x;
			camera.Y = y;
			camera.Zoom = bounded;
			world.Dirty = true;

			if (quiet) return;

			self.X = x;
			self.Y = y;
			self.Zoom = bounded;

			self.$Emit('view', {X: x, Y: y, Zoom: bounded});
		}

		function zoomAt (zoom, sx, sy) {
			var camera = world.Camera;
			var bounded = Math.max(Number(self.MinZoom) || 0.25, Math.min(Number(self.MaxZoom) || 4, zoom));
			var wx = sx / camera.Zoom + camera.X;
			var wy = sy / camera.Zoom + camera.Y;

			setView(wx - sx / bounded, wy - sy / bounded, bounded);
		}

		function centerOn (x, y) {
			var point = project(x, y);
			var camera = world.Camera;

			setView(point.X - world.Width / 2 / camera.Zoom, point.Y - world.Height / 2 / camera.Zoom, camera.Zoom);
		}

		/* The map: the one given, with what is declared in the world over it. */
		function compose () {
			var base = world.Loaded || maps.Normalize({Width: 1, Height: 1});
			var declared = world.Declared;
			var width = base.Width;
			var height = base.Height;
			var terrain = {};
			var layers;
			var middle;
			var before;
			var key;

			/* The rows declared make the map as large as they are: wider than a map given, or the whole of it. */
			declared.Layers.forEach(function (layer, index) {
				var wide = layer.Rows.reduce(function (most, row) {
					return Math.max(most, row.length);
				}, 0);

				width = world.Loaded || index ? Math.max(width, wide) : wide;
				height = world.Loaded || index ? Math.max(height, layer.Rows.length) : layer.Rows.length;
			});

			for (key in base.Terrain) {
				terrain[key] = base.Terrain[key];
			}

			for (key in declared.Terrain) {
				terrain[key] = declared.Terrain[key];
			}

			layers = (world.Loaded ? base.Layers : []).map(function (layer) {
				return maps.Normalize({Width: width, Height: height, Layers: [{Name: layer.Name, Visible: layer.Visible, Data: grow(layer.Cells, base.Width, width, height)}]}).Layers[0];
			}).concat(declared.Layers.map(function (layer) {
				return maps.Normalize({Width: width, Height: height, Layers: [{Name: layer.Name, Rows: layer.Rows}]}).Layers[0];
			}));

			/* The cell in the middle of the view, to keep it there when the projection changes. */
			middle = world.Width && world.Centered ? toCell(world.Width / 2, world.Height / 2) : null;
			before = world.Map;

			world.Map = {
				Width: width,
				Height: height,
				Projection: self.Projection === 'orthogonal' || self.Projection === 'isometric' ? self.Projection : base.Projection,
				TileWidth: base.TileWidth,
				TileHeight: base.TileHeight,
				Terrain: terrain,
				Layers: layers
			};

			if (world.Map.Projection !== base.Projection)
				world.Map.TileWidth = world.Map.Projection === 'isometric' ? world.Map.TileHeight * 2 : world.Map.TileHeight;

			/* The fog of a map of the same size stays: what was explored is still known. */
			if (!world.Fog || world.Fog.Width !== width || world.Fog.Height !== height)
				world.Fog = visibility.Fog(width, height);

			world.FogTime = 0;
			world.MiniGround = null;
			world.Revision++;

			rebuild();

			if (middle && before.Projection !== world.Map.Projection)
				centerOn(middle.X, middle.Y);
		}

		/* The cells of a layer of one width put in a wider map. */
		function grow (cells, from, width, height) {
			var result = [];
			var x;
			var y;

			for (y = 0; y < height; y++) {
				for (x = 0; x < width; x++) {
					result.push(x < from && y * from + x < cells.length ? cells[y * from + x] : null);
				}
			}

			return result;
		}

		/* The kinds of the ground of a cell, from the lowest layer up. */
		function kinds (x, y) {
			var map = world.Map;
			var result = [];

			if (x < 0 || y < 0 || x >= map.Width || y >= map.Height) return result;

			map.Layers.forEach(function (layer) {
				var key = layer.Cells[y * map.Width + x];
				if (key !== null && key !== undefined && map.Terrain[key])
					result.push(map.Terrain[key]);
			});

			return result;
		}

		/* The costs of the ways and what hides: the ground, then the buildings and the things that block. */
		function rebuild () {
			var map = world.Map;
			var ways = paths.Grid(map.Width, map.Height, 1);
			var hidden = new Uint8Array(map.Width * map.Height);
			var x;
			var y;

			for (y = 0; y < map.Height; y++) {
				for (x = 0; x < map.Width; x++) {
					kinds(x, y).forEach(function (kind) {
						if (kind.Cost === Infinity || kind.Cost > ways.Get(x, y) || ways.Get(x, y) === 1)
							ways.Set(x, y, kind.Cost);

						if (kind.Opaque)
							hidden[y * map.Width + x] = 1;
					});
				}
			}

			world.Order.forEach(function (id) {
				var item = world.Objects[id];
				var blocks = item.Class === 'building' ? item.Blocks !== false : item.Blocks === true || item.Blocks === 'true';
				var opaque = item.Class === 'building' || item.Opaque === true || item.Opaque === 'true';
				var cx;
				var cy;

				if (item.Class === 'unit' || (!blocks && !opaque)) return;

				for (cy = Math.floor(item.Y); cy < Math.floor(item.Y) + item.Height; cy++) {
					for (cx = Math.floor(item.X); cx < Math.floor(item.X) + item.Width; cx++) {
						if (blocks)
							ways.Block(cx, cy);

						if (opaque && cx >= 0 && cy >= 0 && cx < map.Width && cy < map.Height)
							hidden[cy * map.Width + cx] = 1;
					}
				}
			});

			world.Ways = ways;
			world.Hidden = hidden;
			world.FogTime = 0;
			world.Dirty = true;
		}

		function opaque (x, y) {
			var map = world.Map;

			return x < 0 || y < 0 || x >= map.Width || y >= map.Height || world.Hidden[y * map.Width + x] === 1;
		}

		/* An object of the world, its fields of the declaration or of the code: defaults by its kind. */
		/* How a kind stands on a map: a walker goes, what blocks and can be selected is a building, the rest are things. */
		function classOf (object) {
			if (object.Traits.Walker) return 'unit';

			return object.Values.Blocks && object.Traits.Selectable ? 'building' : 'thing';
		}

		/* What a map keeps of an object of the scene. */
		function shape (object) {
			var type = classOf(object);
			var walker = object.Traits.Walker;
			var given = object.Kind && registry.Has(object.Kind) ? registry.Resolve(object.Kind).Traits.Walker : null;
			var item = maps.Normalize({Width: 1, Height: 1, Objects: [Object.assign({}, object.Values, {ID: object.ID, Kind: type})]}).Objects[0];

			item.Class = type;
			item.Kind = object.Kind;

			/* The speed of a kind is of a world of its own; on a map only one that was given counts. */
			if (item.Speed === undefined && walker && (!given || given.Speed !== walker.Speed))
				item.Speed = walker.Speed;

			if (item.Class === 'unit') {
				item.Width = 1;
				item.Height = 1;
				item.Speed = maps.Value(item.Speed, 2);
				item.Sight = maps.Value(item.Sight, 5);
			}

			if (item.Class === 'building') {
				item.Sight = maps.Value(item.Sight, 4);
				item.Tall = maps.Value(item.Tall, 1);
			}

			item.Health = maps.Value(item.Health, null);
			item.MaxHealth = maps.Value(item.MaxHealth, item.Health);
			item.Path = [];

			return item;
		}

		function place (item) {
			if (item.Class === 'unit') world.Index.Set(item.ID, item.X, item.Y, 1, 1);
			else world.Index.Set(item.ID, item.X, item.Y, item.Width, item.Height);
		}

		function add (object) {
			var item = shape(object);

			world.Objects[item.ID] = item;

			world.Order.push(item.ID);

			place(item);

			return item;
		}

		function remove (id) {
			var item = world.Objects[id];
			var at = world.Selection.indexOf(id);

			if (!item) return;

			delete world.Objects[id];

			world.Order.splice(world.Order.indexOf(id), 1);
			world.Index.Remove(id);

			if (at !== -1)
				select(world.Selection);
		}

		/* What an object became: only a place that was really given again moves it, the rest of its walk stays. */
		function refresh (item, object) {
			var fresh = shape(object);
			var path = item.Path;
			var x = item.X;
			var y = item.Y;
			var moved = fresh.X !== item.GivenX || fresh.Y !== item.GivenY;

			Object.assign(item, fresh);

			item.Path = moved ? [] : path;
			item.X = moved ? fresh.X : x;
			item.Y = moved ? fresh.Y : y;

			place(item);
		}

		/* The model of an object: the one it names, the one of its Type, the one that fits its kind. */
		function modelOf (item, object) {
			var aliases = {worker: 'villager', peon: 'villager', footman: 'knight', hall: 'castle', keep: 'castle', mine: 'silo', factory: 'hangar'};
			var names = [item.Model, item.Type, aliases[item.Type]];

			self.Engine().Known(item.Model);

			if (item.Kind !== 'unit' && item.Kind !== 'building')
				names.push(item.Kind);

			if (item.Kind === 'tree')
				names.unshift(random.Hash(item.ID) % 3 ? 'pine' : 'oak');

			names.push(item.Class === 'unit' ? 'soldier' : item.Class === 'building' ? 'house' : object.Traits.Model ? object.Traits.Model.Shape : 'crystal');

			return names.filter(function (name) {
				return name && library.Has(name) && library.Info(name).Type !== 'ship';
			})[0];
		}

		/* What an object looks like on a map: of one cell as a unit, as wide as its cells as a building. */
		function fit (item, object) {
			var model = modelOf(item, object);
			var flat = item.Width * item.Height;
			var tall = (Number(item.Tall) || 1) * Math.sqrt(flat);
			var size = item.Class === 'unit' ? (library.Info(model).Type !== 'vehicle' ? 0.9 : 0.8) : item.Kind === 'tree' ? 1.5 : Math.max(item.Width, item.Height);

			object.Shape = model;
			object.Size = size;
			object.Scaled = item.Class === 'building' ? [item.Width, tall, item.Height * cellDepth()] : [size, size, size];
			object.Footprint = [item.Width, item.Height];
		}

		/* The objects of the scene, after it was made again: the ones that came, changed or went. */
		function reconcile () {
			var scene = self.Scene();
			var seen = {};

			if (!self.Cells) return;

			scene.Roots.forEach(function (object) {
				var item = world.Objects[object.ID];

				if (object.Traits.Terrain || object.Traits.Sun) return;

				seen[object.ID] = true;

				/* An object that stayed the same keeps where it walked to. */
				if (item && item.Source === object) return;

				if (item) refresh(item, object);
				else item = add(object);

				item.Source = object;
				item.GivenX = Number(object.Values.X) || 0;
				item.GivenY = Number(object.Values.Y) || 0;

				fit(item, object);
			});

			world.Order.slice().forEach(function (id) {
				if (!seen[id])
					remove(id);
			});

			rebuild();

			world.Dirty = true;
		}

		function outward (item) {
			var object = self.Scene().Objects[item.ID];
			var result = {};
			var key;

			for (key in item) {
				if (key !== 'Path' && key !== 'Shown' && key !== 'Class' && key !== 'GivenX' && key !== 'GivenY' && key !== 'Source')
					result[key] = item[key];
			}

			result.Moving = item.Path.length > 0;

			if (object) {
				result.Values = object.Values;
				result.Traits = object.Traits;
				result.Parts = object.Parts;
			}

			return result;
		}

		function own (item) {
			return !!item && item.Class === 'unit' && !!self.Team && String(item.Team) === String(self.Team);
		}

		function select (ids, quiet) {
			var next = [];

			(ids || []).forEach(function (id) {
				var key = String(id);
				if (world.Objects[key] && next.indexOf(key) === -1)
					next.push(key);
			});

			if (next.join('|') === world.Selection.join('|')) return;

			world.Selection = next;
			world.Dirty = true;

			window.setTimeout(function () {
				self.Status = next.length ? Elemenx.Locale.Text('ui.gameScene.selected', {count: next.length}) : '';
			}, 0);

			if (!quiet) {
				self.$Emit('select', {ID: next[0] || '', IDs: next.slice(), Object: next.length ? outward(world.Objects[next[0]]) : null, Objects: next.map(function (id) {
					return outward(world.Objects[id]);
				})});
			}
		}

		/* The free cells round a goal, the nearest first: a place for each unit of a group. */
		function around (gx, gy, count) {
			var cells = [];
			var ways = world.Ways;
			var radius = 0;
			var x;
			var y;

			while (cells.length < count && radius < 12) {
				for (y = gy - radius; y <= gy + radius; y++) {
					for (x = gx - radius; x <= gx + radius; x++) {
						if (Math.max(Math.abs(x - gx), Math.abs(y - gy)) === radius && ways.Passable(x, y))
							cells.push({X: x, Y: y, D: (x - gx) * (x - gx) + (y - gy) * (y - gy)});
					}
				}

				radius++;
			}

			return cells.sort(function (a, b) {
				return a.D - b.D;
			});
		}

		function route (from, to) {
			var way = paths.Path(world.Ways, {X: Math.round(from.X), Y: Math.round(from.Y)}, {X: Math.floor(to.X), Y: Math.floor(to.Y)}, {Nearest: true});

			return way ? paths.Smooth(world.Ways, way) : null;
		}

		function order (ids, target, kind) {
			var units = (ids || []).map(function (id) {
				return world.Objects[String(id)];
			}).filter(function (item) {
				return item && item.Class === 'unit';
			});
			var gx = Math.floor(target.X);
			var gy = Math.floor(target.Y);
			var spots;

			if (!units.length) return;

			spots = around(gx, gy, units.length);

			units.sort(function (a, b) {
				return Math.abs(a.X - gx) + Math.abs(a.Y - gy) - Math.abs(b.X - gx) - Math.abs(b.Y - gy);
			});

			units.forEach(function (item, index) {
				var spot = spots[index] || {X: gx, Y: gy};
				var way = route(item, spot);

				/* The start is where it stands: the way goes on from the next cell. */
				item.Path = way ? way.slice(1) : [];
			});

			world.Markers.push({X: target.X, Y: target.Y, Time: 0, Kind: kind || 'move'});

			world.Dirty = true;

			self.$Emit('order', {Kind: kind || 'move', IDs: units.map(function (item) {
				return item.ID;
			}), X: gx, Y: gy, Target: target.Target || null});
		}

		function stop (ids) {
			var stopped = [];

			(ids || world.Selection).forEach(function (id) {
				var item = world.Objects[String(id)];

				if (item && item.Class === 'unit') {
					item.Path = [];
					item.X = Math.round(item.X);
					item.Y = Math.round(item.Y);

					place(item);

					stopped.push(item.ID);
				}
			});

			world.Dirty = true;

			if (stopped.length)
				self.$Emit('order', {Kind: 'stop', IDs: stopped, X: null, Y: null, Target: null});
		}

		/* The time of the game: the units walk their ways, the fog follows them. */
		function update (step) {
			var seconds = step / 1000;
			var moving = false;

			world.Order.forEach(function (id) {
				var item = world.Objects[id];
				var left;
				var next;
				var dx;
				var dy;
				var distance;

				if (item.Class !== 'unit' || !item.Path.length) return;

				moving = true;
				left = Math.max(0, Number(item.Speed) || 0) * seconds;

				while (left > 0 && item.Path.length) {
					next = item.Path[0];
					dx = next.X - item.X;
					dy = next.Y - item.Y;
					distance = Math.sqrt(dx * dx + dy * dy);

					if (distance <= left) {
						item.X = next.X;
						item.Y = next.Y;
						left -= distance;

						item.Path.shift();
					}
					else {
						item.X += dx / distance * left;
						item.Y += dy / distance * left;
						left = 0;
					}
				}

				place(item);

				if (!item.Path.length)
					self.$Emit('arrive', {ID: item.ID, At: [item.X, item.Y], X: item.X, Y: item.Y});
			});

			world.Markers = world.Markers.filter(function (marker) {
				marker.Time += step;

				return marker.Time < 700;
			});

			if (moving || world.Markers.length)
				world.Dirty = true;

			world.FogTime -= step;

			if (world.FogTime <= 0 && self.Fog && self.Team) {
				world.FogTime = 150;

				fog();
			}
		}

		function fog () {
			world.Fog.Hide();

			world.Order.forEach(function (id) {
				var item = world.Objects[id];
				if (String(item.Team) !== String(self.Team) || (item.Class !== 'unit' && item.Class !== 'building')) return;

				world.Fog.Reveal(opaque, Math.round(item.X + (item.Class === 'building' ? item.Width / 2 : 0)), Math.round(item.Y + (item.Class === 'building' ? item.Height / 2 : 0)), Number(item.Sight) || 0);
			});

			world.Dirty = true;
		}

		/* Whether the player sees an object: theirs, or in a cell they see now (a building, a thing: explored). */
		function shown (item) {
			var cx = Math.round(item.X);
			var cy = Math.round(item.Y);

			if (!self.Fog || !self.Team) return true;
			if (String(item.Team) === String(self.Team)) return true;

			if (item.Class === 'unit')
				return world.Fog.Seen(cx, cy);

			return world.Fog.Explored(Math.floor(item.X), Math.floor(item.Y));
		}

		/* The path of the corners of a cell on the screen. */
		function cellPath (x, y, width, height) {
			var a = toScreen(x, y);
			var b = toScreen(x + width, y);
			var c = toScreen(x + width, y + height);
			var d = toScreen(x, y + height);

			context.beginPath();
			context.moveTo(a.X, a.Y);
			context.lineTo(b.X, b.Y);
			context.lineTo(c.X, c.Y);
			context.lineTo(d.X, d.Y);
			context.closePath();
		}

		/* The cells in view: the corners of the screen in cells, a cell more round them. */
		function inView () {
			var map = world.Map;
			var corners = [toCell(0, 0), toCell(world.Width, 0), toCell(0, world.Height), toCell(world.Width, world.Height)];

			return {
				Left: Math.max(0, Math.floor(Math.min.apply(null, corners.map(function (corner) {
					return corner.X;
				}))) - 1),
				Top: Math.max(0, Math.floor(Math.min.apply(null, corners.map(function (corner) {
					return corner.Y;
				}))) - 1),
				Right: Math.min(map.Width - 1, Math.ceil(Math.max.apply(null, corners.map(function (corner) {
					return corner.X;
				}))) + 1),
				Bottom: Math.min(map.Height - 1, Math.ceil(Math.max.apply(null, corners.map(function (corner) {
					return corner.Y;
				}))) + 2)
			};
		}

		function drawTile (kind, x, y) {
			var map = world.Map;
			var picture = image(kind.Image);
			var zoom = world.Camera.Zoom;
			var corner;
			var width;
			var height;

			if (picture) {
				width = map.TileWidth * zoom;
				height = (kind.SourceHeight || picture.naturalHeight) * width / (kind.SourceWidth || picture.naturalWidth);

				/* A tile stands on the bottom of its cell, as Tiled draws it. */
				if (map.Projection === 'isometric') {
					corner = toScreen(x + 1, y + 1);

					context.drawImage(picture, kind.SourceX || 0, kind.SourceY || 0, kind.SourceWidth || picture.naturalWidth, kind.SourceHeight || picture.naturalHeight, corner.X - width / 2, corner.Y - height, width, height);
				}
				else {
					corner = toScreen(x, y + 1);

					context.drawImage(picture, kind.SourceX || 0, kind.SourceY || 0, kind.SourceWidth || picture.naturalWidth, kind.SourceHeight || picture.naturalHeight, corner.X, corner.Y - height, width, height);
				}

				return;
			}

			cellPath(x, y, 1, 1);

			/* Stroked in its own color too: no seam between two cells. */
			context.fillStyle = kind.Color || '#5c9a3c';
			context.strokeStyle = context.fillStyle;
			context.lineWidth = 1;

			context.fill();
			context.stroke();

			/* A light or a shade of its own for each cell: the ground does not look flat. */
			context.fillStyle = (x * 7 + y * 13) % 3 === 0 ? 'rgba(255, 255, 255, 0.05)' : (x * 5 + y * 3) % 4 === 0 ? 'rgba(0, 0, 0, 0.06)' : 'transparent';

			context.fill();

			if (kind.Name === 'water') {
				context.strokeStyle = 'rgba(255, 255, 255, 0.18)';
				context.lineWidth = Math.max(1, zoom);

				corner = toScreen(x + 0.5, y + 0.5);

				context.beginPath();
				context.moveTo(corner.X - 8 * zoom, corner.Y);
				context.quadraticCurveTo(corner.X - 4 * zoom, corner.Y - 3 * zoom, corner.X, corner.Y);
				context.quadraticCurveTo(corner.X + 4 * zoom, corner.Y + 3 * zoom, corner.X + 8 * zoom, corner.Y);
				context.stroke();
			}
		}

		function drawGround (bounds) {
			var map = world.Map;
			var x;
			var y;

			map.Layers.forEach(function (layer) {
				if (layer.Visible === false || live()) return;

				for (y = bounds.Top; y <= bounds.Bottom; y++) {
					for (x = bounds.Left; x <= bounds.Right; x++) {
						var key = layer.Cells[y * map.Width + x];
						if (key !== null && key !== undefined && map.Terrain[key])
							drawTile(map.Terrain[key], x, y);
					}
				}
			});

			if (!self.Grid || self.Grid === 'false') return;

			context.strokeStyle = 'rgba(0, 0, 0, 0.12)';
			context.lineWidth = 1;

			for (y = bounds.Top; y <= bounds.Bottom; y++) {
				for (x = bounds.Left; x <= bounds.Right; x++) {
					cellPath(x, y, 1, 1);

					context.stroke();
				}
			}
		}

		function shade (color, amount) {
			var value = String(color || '').replace('#', '');
			var parts;

			if (value.length === 3)
				value = value.charAt(0) + value.charAt(0) + value.charAt(1) + value.charAt(1) + value.charAt(2) + value.charAt(2);

			if (!/^[0-9a-f]{6}$/i.test(value)) return color;

			parts = [0, 2, 4].map(function (at) {
				var channel = parseInt(value.substr(at, 2), 16);

				return Math.max(0, Math.min(255, Math.round(amount < 0 ? channel * (1 + amount) : channel + (255 - channel) * amount)));
			});

			return 'rgb(' + parts.join(', ') + ')';
		}

		function polygon (points, fill, stroke) {
			context.beginPath();
			context.moveTo(points[0].X, points[0].Y);

			points.slice(1).forEach(function (point) {
				context.lineTo(point.X, point.Y);
			});

			context.closePath();

			context.fillStyle = fill;

			context.fill();

			if (stroke) {
				context.strokeStyle = stroke;
				context.lineWidth = 1;

				context.stroke();
			}
		}

		function up (point, height) {
			return {X: point.X, Y: point.Y - height};
		}

		function middle (a, b) {
			return {X: (a.X + b.X) / 2, Y: (a.Y + b.Y) / 2};
		}

		function bar (x, y, width, value) {
			var zoom = world.Camera.Zoom;
			var height = Math.max(3, 4 * zoom);

			context.fillStyle = 'rgba(0, 0, 0, 0.55)';

			context.fillRect(x - width / 2 - 1, y - 1, width + 2, height + 2);

			context.fillStyle = value > 0.5 ? '#5fc84a' : value > 0.25 ? '#e2a915' : '#d8453c';

			context.fillRect(x - width / 2, y, width * Math.max(0, Math.min(1, value)), height);
		}

		/* The scene draws the map, unless it cannot or the map is of pictures. */
		function live () {
			return !self.Flat;
		}

		function pictures () {
			var map = world.Map;

			return Object.keys(map.Terrain).some(function (key) {
				return map.Terrain[key].Image;
			}) || world.Order.some(function (id) {
				return world.Objects[id].Image;
			});
		}

		/* The length of a cell along Z, in widths of a cell: 1 at an angle, whatever the proportion of its picture. */
		function cellDepth () {
			var map = world.Map;

			return map.Projection === 'isometric' ? 1 : map.TileHeight / map.TileWidth;
		}

		/* The cells of the ground, each of the color of the last layer that has it, lighter or darker as it was drawn. */
		function sceneGround () {
			var map = world.Map;
			var layers = map.Layers.filter(function (layer) {
				return layer.Visible !== false;
			});

			return terrain.Cells({Width: map.Width, Height: map.Height, Depth: cellDepth(), Color: function (x, y) {
				var found = '#5c9a3c';
				var tone = (x * 7 + y * 13) % 3 === 0 ? 1.06 : (x * 5 + y * 3) % 4 === 0 ? 0.94 : 1;

				layers.forEach(function (layer) {
					var key = layer.Cells[y * map.Width + x];
					if (key !== null && key !== undefined && map.Terrain[key])
						found = map.Terrain[key].Color || found;
				});

				return self.Engine().Paint(found).slice(0, 3).map(function (value) {
					return value * tone;
				});
			}});
		}

		/* The scene as the map is now: its ground, where each object stands, the view. */
		function syncScene () {
			var map = world.Map;
			var camera = world.Camera;
			var isometric = map.Projection === 'isometric';
			var depth = cellDepth();
			var middle = toCell(world.Width / 2, world.Height / 2);
			var scale = (isometric ? map.TileWidth / Math.SQRT2 : map.TileWidth) * camera.Zoom;

			if (world.Revision !== world.Painted) {
				world.Painted = world.Revision;
				world.Field = sceneGround();
			}

			self.Engine().Drive({Key: 'cells:' + world.Revision, Field: world.Field, View: isometric ? 'isometric' : 'top', Slant: map.TileHeight / map.TileWidth, Depth: depth, Target: [middle.X, 0, middle.Y * depth], Height: world.Height / scale, Elevation: isometric ? 50 : 62});

			world.Order.forEach(function (id) {
				var item = world.Objects[id];
				var next = item.Path && item.Path[0];

				self.Engine().Stand(id, {X: item.X, Y: item.Y, Heading: next ? [next.X - item.X, 0, (next.Y - item.Y) * depth] : null, Walking: next && !self.Paused ? Number(item.Speed) || 0 : 0, Hidden: !item.Shown});
			});
		}

		function drawBuilding (item) {
			var map = world.Map;
			var zoom = world.Camera.Zoom;
			var picture = image(item.Image);
			var walls = item.Color || '#b58c5c';
			var roof = item.Roof || shade(teamColor(item.Team), -0.25);
			var height = (Number(item.Tall) || 1) * map.TileHeight * 1.1 * zoom;
			var top = toScreen(item.X, item.Y);
			var right = toScreen(item.X + item.Width, item.Y);
			var bottom = toScreen(item.X + item.Width, item.Y + item.Height);
			var left = toScreen(item.X, item.Y + item.Height);
			var ridge;
			var a;
			var b;
			var width;

			if (live()) {
				height = (Number(item.Tall) || 1) * map.TileHeight * zoom;
			}
			else if (picture) {
				width = Math.abs(right.X - left.X) || (item.Width * map.TileWidth * zoom);
				height = picture.naturalHeight * width / picture.naturalWidth;

				context.drawImage(picture, (left.X + right.X) / 2 - width / 2, bottom.Y - height, width, height);
			}
			else if (map.Projection === 'isometric') {
				/* Walls on the two sides that face the view, a roof of two slopes along its longer side. */
				polygon([left, bottom, up(bottom, height), up(left, height)], shade(walls, -0.18), 'rgba(0, 0, 0, 0.25)');
				polygon([bottom, right, up(right, height), up(bottom, height)], walls, 'rgba(0, 0, 0, 0.25)');

				ridge = height * 0.55;

				if (item.Width >= item.Height) {
					a = up(middle(top, left), height + ridge);
					b = up(middle(right, bottom), height + ridge);

					polygon([up(top, height), up(right, height), b, a], shade(roof, 0.12), 'rgba(0, 0, 0, 0.3)');
					polygon([a, b, up(bottom, height), up(left, height)], roof, 'rgba(0, 0, 0, 0.3)');
				}
				else {
					a = up(middle(top, right), height + ridge);
					b = up(middle(left, bottom), height + ridge);

					polygon([up(top, height), a, b, up(left, height)], shade(roof, 0.12), 'rgba(0, 0, 0, 0.3)');
					polygon([a, up(right, height), up(bottom, height), b], roof, 'rgba(0, 0, 0, 0.3)');
				}
			}
			else {
				/* From above: the roof, and the band of its wall on the side of the view. */
				polygon([top, right, bottom, left], roof, 'rgba(0, 0, 0, 0.35)');
				polygon([{X: left.X, Y: left.Y - 6 * zoom}, {X: bottom.X, Y: bottom.Y - 6 * zoom}, bottom, left], shade(walls, -0.2));

				context.strokeStyle = 'rgba(255, 255, 255, 0.2)';

				context.beginPath();
				context.moveTo((top.X + left.X) / 2, (top.Y + left.Y) / 2 + 2 * zoom);
				context.lineTo((right.X + bottom.X) / 2, (right.Y + bottom.Y) / 2 + 2 * zoom);
				context.stroke();
			}

			if (world.Selection.indexOf(item.ID) !== -1) {
				cellPath(item.X, item.Y, item.Width, item.Height);

				context.strokeStyle = '#7ad36b';
				context.lineWidth = 2;

				context.stroke();
			}

			if (item.MaxHealth && (item.Health < item.MaxHealth || world.Selection.indexOf(item.ID) !== -1))
				bar((left.X + right.X) / 2, Math.min(top.Y, right.Y, left.Y) - height - map.TileHeight * 0.6 * zoom, Math.abs(right.X - left.X) * 0.5 || 40 * zoom, item.Health / item.MaxHealth);
		}

		function drawUnit (item) {
			var map = world.Map;
			var zoom = world.Camera.Zoom;
			var feet = toScreen(item.X + 0.5, item.Y + 0.5);
			var radius = map.TileHeight * 0.24 * zoom;
			var color = item.Color || teamColor(item.Team);
			var picture = image(item.Image);
			var selected = world.Selection.indexOf(item.ID) !== -1;
			var width;
			var height;

			if (!live()) {
				context.fillStyle = 'rgba(0, 0, 0, 0.28)';

				context.beginPath();
				context.ellipse(feet.X, feet.Y, radius * 1.1, radius * 0.55, 0, 0, Math.PI * 2);
				context.fill();
			}
			else if (map.Projection !== 'isometric') {
				/* From above a model shows little more than its head: a mark of its team tells who it is. */
				context.fillStyle = color;
				context.strokeStyle = shade(color, -0.45);
				context.lineWidth = Math.max(1, zoom);
				context.globalAlpha = 0.75;

				context.beginPath();
				context.arc(feet.X, feet.Y, radius * 1.05, 0, Math.PI * 2);
				context.fill();
				context.stroke();

				context.globalAlpha = 1;
			}

			if (selected) {
				context.strokeStyle = '#7ad36b';
				context.lineWidth = Math.max(1.5, 2 * zoom);

				context.beginPath();
				context.ellipse(feet.X, feet.Y, radius * 1.5, radius * 0.75, 0, 0, Math.PI * 2);
				context.stroke();
			}

			if (picture) {
				height = map.TileHeight * 1.2 * zoom;
				width = picture.naturalWidth * height / picture.naturalHeight;

				context.drawImage(picture, feet.X - width / 2, feet.Y - height, width, height);
			}
			else if (!live()) {
				/* A pawn: its body and its head, of the color of its team. */
				context.fillStyle = color;
				context.strokeStyle = shade(color, -0.45);
				context.lineWidth = Math.max(1, zoom);

				context.beginPath();
				context.ellipse(feet.X, feet.Y - radius * 0.9, radius * 0.8, radius * 1.05, 0, 0, Math.PI * 2);
				context.fill();
				context.stroke();

				context.fillStyle = shade(color, 0.35);

				context.beginPath();
				context.arc(feet.X, feet.Y - radius * 2.3, radius * 0.55, 0, Math.PI * 2);
				context.fill();
				context.stroke();
			}

			if (item.MaxHealth && (item.Health < item.MaxHealth || selected))
				bar(feet.X, feet.Y - radius * 3.6, radius * 2.4, item.Health / item.MaxHealth);
		}

		function drawThing (item) {
			var map = world.Map;
			var zoom = world.Camera.Zoom;
			var feet = toScreen(item.X + item.Width / 2, item.Y + item.Height / 2);
			var size = map.TileHeight * zoom * Math.max(item.Width, item.Height);
			var picture = image(item.Image);
			var width;
			var height;

			if (live()) return;

			if (picture) {
				height = size * 1.4;
				width = picture.naturalWidth * height / picture.naturalHeight;

				context.drawImage(picture, feet.X - width / 2, feet.Y - height + size * 0.2, width, height);

				return;
			}

			if (item.Kind === 'tree') {
				context.fillStyle = 'rgba(0, 0, 0, 0.25)';

				context.beginPath();
				context.ellipse(feet.X, feet.Y, size * 0.35, size * 0.17, 0, 0, Math.PI * 2);
				context.fill();

				context.fillStyle = '#6b4a2b';

				context.fillRect(feet.X - size * 0.05, feet.Y - size * 0.3, size * 0.1, size * 0.3);

				polygon([{X: feet.X, Y: feet.Y - size * 1.25}, {X: feet.X + size * 0.32, Y: feet.Y - size * 0.25}, {X: feet.X - size * 0.32, Y: feet.Y - size * 0.25}], item.Color || '#2f6b2a', 'rgba(0, 0, 0, 0.25)');
				polygon([{X: feet.X, Y: feet.Y - size * 1.25}, {X: feet.X + size * 0.32, Y: feet.Y - size * 0.25}, {X: feet.X, Y: feet.Y - size * 0.32}], shade(item.Color || '#2f6b2a', -0.2));

				return;
			}

			if (item.Kind === 'rock') {
				polygon([{X: feet.X - size * 0.4, Y: feet.Y}, {X: feet.X - size * 0.25, Y: feet.Y - size * 0.35}, {X: feet.X + size * 0.15, Y: feet.Y - size * 0.42}, {X: feet.X + size * 0.4, Y: feet.Y - size * 0.1}, {X: feet.X + size * 0.3, Y: feet.Y + size * 0.08}], item.Color || '#8a8780', 'rgba(0, 0, 0, 0.35)');

				return;
			}

			context.fillStyle = item.Color || '#d0b14a';
			context.strokeStyle = 'rgba(0, 0, 0, 0.35)';

			context.beginPath();
			context.arc(feet.X, feet.Y - size * 0.25, size * 0.25, 0, Math.PI * 2);
			context.fill();
			context.stroke();
		}

		function drawFog (bounds) {
			var x;
			var y;
			var state;

			if (!self.Fog || !self.Team) return;

			for (y = bounds.Top; y <= bounds.Bottom; y++) {
				for (x = bounds.Left; x <= bounds.Right; x++) {
					state = world.Fog.Get(x, y);

					if (state !== 2) {
						cellPath(x, y, 1, 1);

						context.fillStyle = state === 1 ? 'rgba(6, 8, 12, 0.5)' : 'rgb(6, 8, 12)';

						context.fill();

						context.strokeStyle = context.fillStyle;

						context.stroke();
					}
				}
			}
		}

		function drawOrders () {
			var zoom = world.Camera.Zoom;

			/* The ways of the selected units, dashed to their goals. */
			context.setLineDash([4 * zoom, 4 * zoom]);

			context.strokeStyle = 'rgba(122, 211, 107, 0.75)';
			context.lineWidth = Math.max(1, 1.5 * zoom);

			world.Selection.forEach(function (id) {
				var item = world.Objects[id];
				var point;

				if (!item || !item.Path.length) return;

				point = toScreen(item.X + 0.5, item.Y + 0.5);

				context.beginPath();
				context.moveTo(point.X, point.Y);

				item.Path.forEach(function (step) {
					point = toScreen(step.X + 0.5, step.Y + 0.5);

					context.lineTo(point.X, point.Y);
				});

				context.stroke();
			});

			context.setLineDash([]);

			world.Markers.forEach(function (marker) {
				var point = toScreen(Math.floor(marker.X) + 0.5, Math.floor(marker.Y) + 0.5);
				var grow = marker.Time / 700;
				var radius = world.Map.TileHeight * (0.3 + grow * 0.5) * zoom;

				context.strokeStyle = marker.Kind === 'attack' ? 'rgba(216, 69, 60, ' + (1 - grow) + ')' : 'rgba(122, 211, 107, ' + (1 - grow) + ')';
				context.lineWidth = 2;

				context.beginPath();
				context.ellipse(point.X, point.Y, radius * 1.4, radius * 0.7, 0, 0, Math.PI * 2);
				context.stroke();
			});

			if (world.Drag && world.Drag.Kind === 'select' && world.Drag.Moved) {
				context.fillStyle = 'rgba(122, 211, 107, 0.12)';
				context.strokeStyle = 'rgba(122, 211, 107, 0.9)';
				context.lineWidth = 1;

				context.fillRect(Math.min(world.Drag.X, world.Drag.EndX), Math.min(world.Drag.Y, world.Drag.EndY), Math.abs(world.Drag.EndX - world.Drag.X), Math.abs(world.Drag.EndY - world.Drag.Y));
				context.strokeRect(Math.min(world.Drag.X, world.Drag.EndX) + 0.5, Math.min(world.Drag.Y, world.Drag.EndY) + 0.5, Math.abs(world.Drag.EndX - world.Drag.X), Math.abs(world.Drag.EndY - world.Drag.Y));
			}
		}

		/* The order of the drawing: the farther first, a building by the cell of its corner nearest the view. */
		function depth (item) {
			if (world.Map.Projection === 'isometric')
				return item.Class === 'unit' ? item.X + item.Y + 1 : item.X + item.Y + item.Width + item.Height - 1;

			return item.Class === 'unit' ? item.Y + 0.5 : item.Y + item.Height - 0.5;
		}

		function render () {
			var bounds;
			var items;
			var flat;

			if (!self.Cells || !world.Dirty || !world.Width) return;

			world.Dirty = false;

			context.setTransform(world.Ratio, 0, 0, world.Ratio, 0, 0);
			context.clearRect(0, 0, world.Width, world.Height);

			bounds = inView();

			drawGround(bounds);

			flat = !self.Supported() || pictures();

			if (self.Flat !== flat)
				self.Flat = flat;

			items = world.Order.map(function (id) {
				return world.Objects[id];
			}).filter(function (item) {
				item.Shown = shown(item);

				return item.Shown;
			}).sort(function (a, b) {
				return depth(a) - depth(b);
			});

			if (live())
				syncScene();

			items.forEach(function (item) {
				if (item.Class === 'building') drawBuilding(item);
				else if (item.Class === 'unit') drawUnit(item);
				else drawThing(item);
			});

			drawFog(bounds);

			drawOrders();

			miniTime();
		}

		/* The minimap: the ground once, then the fog, the objects and the frame of the view, a few times a second. */
		function miniTime () {
			var now = Date.now();
			if (now - world.MiniTime < 200) return;

			world.MiniTime = now;

			minimap();
		}

		function minimap () {
			var mini = element.querySelector('.elemenx-game-scene-minimap');
			var map = world.Map;
			var target;
			var scale;
			var width;
			var height;
			var ground;
			var draw;
			var x;
			var y;
			var top;

			if (!mini) return;

			width = mini.clientWidth || 180;
			height = mini.clientHeight || 180;

			if (mini.width !== Math.round(width * world.Ratio)) {
				mini.width = Math.round(width * world.Ratio);
				mini.height = Math.round(height * world.Ratio);
			}

			scale = Math.min(width / map.Width, height / map.Height);
			world.Mini = {Scale: scale, Left: (width - map.Width * scale) / 2, Top: (height - map.Height * scale) / 2};

			if (!world.MiniGround) {
				ground = element.ownerDocument.createElement('canvas');
				ground.width = map.Width;
				ground.height = map.Height;
				draw = ground.getContext('2d');

				for (y = 0; y < map.Height; y++) {
					for (x = 0; x < map.Width; x++) {
						top = kinds(x, y).pop();
						draw.fillStyle = top && top.Color ? top.Color : '#4a7d33';

						draw.fillRect(x, y, 1, 1);
					}
				}

				world.MiniGround = ground;
			}

			target = mini.getContext('2d');

			target.setTransform(world.Ratio, 0, 0, world.Ratio, 0, 0);
			target.clearRect(0, 0, width, height);

			target.imageSmoothingEnabled = false;

			target.drawImage(world.MiniGround, world.Mini.Left, world.Mini.Top, map.Width * scale, map.Height * scale);

			if (self.Fog && self.Team) {
				for (y = 0; y < map.Height; y++) {
					for (x = 0; x < map.Width; x++) {
						if (world.Fog.Get(x, y) !== 2) {
							target.fillStyle = world.Fog.Get(x, y) === 1 ? 'rgba(6, 8, 12, 0.5)' : 'rgb(6, 8, 12)';

							target.fillRect(world.Mini.Left + x * scale, world.Mini.Top + y * scale, scale + 0.5, scale + 0.5);
						}
					}
				}
			}

			world.Order.forEach(function (id) {
				var item = world.Objects[id];
				if (item.Class !== 'unit' && item.Class !== 'building') return;
				if (item.Shown === false) return;

				target.fillStyle = item.Color && item.Class === 'unit' ? item.Color : teamColor(item.Team);

				target.fillRect(world.Mini.Left + item.X * scale, world.Mini.Top + item.Y * scale, Math.max(2, item.Width * scale), Math.max(2, item.Height * scale));
			});

			/* The view: its four corners in cells. */
			target.strokeStyle = '#ffffff';
			target.lineWidth = 1.5;

			target.beginPath();

			[toCell(0, 0), toCell(world.Width, 0), toCell(world.Width, world.Height), toCell(0, world.Height)].forEach(function (corner, index) {
				var px = world.Mini.Left + corner.X * scale;
				var py = world.Mini.Top + corner.Y * scale;

				if (index) target.lineTo(px, py);
				else target.moveTo(px, py);
			});

			target.closePath();
			target.stroke();
		}

		/* What is under a point of the screen: the nearest object drawn over it, units first. */
		function pick (sx, sy) {
			var map = world.Map;
			var zoom = world.Camera.Zoom;
			var found = null;
			var best = Infinity;

			world.Order.forEach(function (id) {
				var item = world.Objects[id];
				var feet;
				var radius;
				var distance;
				var cell;
				var height;
				var top;
				var right;
				var bottom;
				var left;

				if (item.Shown === false) return;

				if (item.Class === 'unit') {
					feet = toScreen(item.X + 0.5, item.Y + 0.5);
					radius = map.TileHeight * 0.24 * zoom;

					if (Math.abs(sx - feet.X) <= radius * 1.4 && sy <= feet.Y + radius * 0.6 && sy >= feet.Y - radius * 3) {
						distance = Math.abs(sx - feet.X) + Math.abs(sy - (feet.Y - radius));

						if (distance < best) {
							best = distance;
							found = item;
						}
					}

					return;
				}

				if (found && found.Class === 'unit') return;

				cell = toCell(sx, sy);

				if (cell.X >= item.X && cell.X < item.X + item.Width && cell.Y >= item.Y && cell.Y < item.Y + item.Height) {
					found = item;

					return;
				}

				if (item.Class === 'building' && map.Projection === 'isometric') {
					height = (Number(item.Tall) || 1) * map.TileHeight * 1.65 * zoom;
					top = toScreen(item.X, item.Y);
					right = toScreen(item.X + item.Width, item.Y);
					bottom = toScreen(item.X + item.Width, item.Y + item.Height);
					left = toScreen(item.X, item.Y + item.Height);

					if (sx >= left.X && sx <= right.X && sy >= top.Y - height && sy <= bottom.Y)
						found = item;
				}
			});

			return found;
		}

		function cellOf (sx, sy) {
			var cell = toCell(sx, sy);

			return {X: Math.floor(cell.X), Y: Math.floor(cell.Y)};
		}

		/* A press that was no drag: a selection with the left button, an order with the right one (a tap: either). */
		function pressed (sx, sy, button, shift, touch) {
			var item = pick(sx, sy);
			var cell = cellOf(sx, sy);
			var hasOwn = world.Selection.some(function (id) {
				return own(world.Objects[id]);
			});

			if (button === 2 || (touch && hasOwn && !own(item))) {
				if (hasOwn) {
					order(world.Selection.filter(function (id) {
						return own(world.Objects[id]);
					}), {X: cell.X, Y: cell.Y, Target: item ? item.ID : null}, item && item.Class !== 'thing' && item.Team && String(item.Team) !== String(self.Team) ? 'attack' : 'move');

					return;
				}

				self.$Emit('cell', {X: cell.X, Y: cell.Y, Button: button, Object: item ? outward(item) : null});

				return;
			}

			if (item && own(item)) {
				if (shift) {
					select(world.Selection.indexOf(item.ID) === -1 ? world.Selection.concat([item.ID]) : world.Selection.filter(function (id) {
						return id !== item.ID;
					}));
				}
				else {
					select([item.ID]);
				}

				return;
			}

			if (item && (item.Class === 'building' || item.Class === 'unit')) select([item.ID]);
			else if (!shift) select([]);

			self.$Emit('cell', {X: cell.X, Y: cell.Y, Button: button, Object: item ? outward(item) : null});
		}

		function frame (drag, shift) {
			var left = Math.min(drag.X, drag.EndX);
			var right = Math.max(drag.X, drag.EndX);
			var top = Math.min(drag.Y, drag.EndY);
			var bottom = Math.max(drag.Y, drag.EndY);
			var inside = world.Order.filter(function (id) {
				var item = world.Objects[id];
				var feet;

				if (!own(item)) return false;

				feet = toScreen(item.X + 0.5, item.Y + 0.5);

				return feet.X >= left && feet.X <= right && feet.Y >= top && feet.Y <= bottom;
			});

			select(shift ? world.Selection.concat(inside) : inside);
		}

		function local (event) {
			var box = canvas.getBoundingClientRect();

			return {X: event.clientX - box.left, Y: event.clientY - box.top};
		}

		/* The declarations inside the world: read again as they come, go and change. */
		/* What is declared of the ground: GameTerrain and GameLayer; the objects are the ones of the scene. */
		function declarations () {
			var sources = element.querySelector('.elemenx-game-scene-sources');
			var terrain = {};
			var layers = [];

			Array.prototype.forEach.call(sources.querySelectorAll('.elemenx-game-source'), function (node) {
				var value;
				var rows;

				try {
					value = JSON.parse(node.getAttribute('data-value') || '{}');
				}
				catch (error) {
					return;
				}

				if (node.getAttribute('data-type') === 'terrain' && value.Key) {
					terrain[String(value.Key).charAt(0)] = maps.Kind(value, value.Key);
				}
				else if (node.getAttribute('data-type') === 'layer') {
					rows = value.Rows && value.Rows.length ? value.Rows : String(node.textContent || '').split(/\r?\n/).map(function (row) {
						return row.replace(/^\s+|\s+$/g, '');
					}).filter(function (row) {
						return row.length;
					});

					layers.push({Name: value.Name || 'layer-' + layers.length, Rows: rows.map(String)});
				}
			});

			if (JSON.stringify([terrain, layers]) === JSON.stringify([world.Declared.Terrain, world.Declared.Layers])) return;

			world.Declared = {Terrain: terrain, Layers: layers};

			activate();

			compose();

			world.Dirty = true;
		}

		/* A map from now on: its loop runs, the view of the scene gives way to the one of the map. */
		function activate () {
			if (!world.Loaded && !world.Declared.Layers.length && !Object.keys(world.Declared.Terrain).length && !self.Cells) return;

			self.Cells = true;

			if (!world.Running) {
				world.Running = true;

				world.Loop.Start();

				self.Engine().Compose();
			}
		}

		function load (source, callback) {
			var done = typeof callback === 'function' ? callback : function () {};

			function take (map) {
				var scene = self.Scene();

				scene.Added = [];

				world.Loaded = map;
				world.Centered = false;

				activate();

				compose();

				self.Add((map.Objects || []).map(function (item, index) {
					return Object.assign({}, item, {ID: item.ID === undefined || item.ID === null || item.ID === '' ? 'object-' + index : String(item.ID)});
				}));

				resize();

				self.$Emit('load', {Width: world.Map.Width, Height: world.Map.Height});

				done(null, world.Map);
			}

			if (!source) {
				world.Loaded = null;

				compose();

				done(null, world.Map);

				return;
			}

			if (typeof source === 'string') {
				maps.Load(source, function (error, map) {
					if (error) {
						self.$Emit('error', error);

						done(error, null);

						return;
					}

					take(map);
				});

				return;
			}

			take(source.tiledversion || source.orientation ? maps.FromTiled(source) : maps.Normalize(source));
		}

		function resize () {
			var width = element.clientWidth;
			var height = element.clientHeight;
			var ratio = view.devicePixelRatio || 1;

			if (!width || !height) return;

			if (width !== world.Width || height !== world.Height || ratio !== world.Ratio) {
				world.Width = width;
				world.Height = height;
				world.Ratio = ratio;
				canvas.width = Math.round(width * ratio);
				canvas.height = Math.round(height * ratio);
				world.Dirty = true;
			}

			/* The map in the middle of the view, the first time, unless the view is given. */
			if (!world.Centered && world.Map.Width > 1) {
				world.Centered = true;

				if (self.X === null || self.X === undefined || self.X === '') centerOn(world.Map.Width / 2, world.Map.Height / 2);
				else setView(Number(self.X) || 0, Number(self.Y) || 0, Number(self.Zoom) || 1, true);
			}

			render();
		}

		/* The props, after a drawing: a new map, a new projection, the view, the time. */
		engine.Props = function () {
			var camera = world.Camera;

			if (self.Map !== world.Given) {
				world.Given = self.Map;

				load(self.Map);
			}
			else if ((self.Projection || '') !== (world.Projected || '')) {
				compose();
			}

			world.Projected = self.Projection || '';

			if (self.X !== null && self.X !== undefined && self.X !== '' && (Number(self.X) !== camera.X || Number(self.Y) !== camera.Y || Number(self.Zoom) !== camera.Zoom))
				setView(Number(self.X) || 0, Number(self.Y) || 0, Number(self.Zoom) || 1, true);

			if (self.Paused && !world.Loop.Paused) world.Loop.Pause();
			else if (!self.Paused && world.Loop.Paused) world.Loop.Resume();

			world.Loop.Speed = Number(self.Speed) > 0 ? Number(self.Speed) : 1;
			world.FogTime = 0;
			world.Dirty = true;
		};

		engine.Load = load;
		engine.Reconcile = reconcile;
		engine.Outward = outward;
		engine.Select = select;
		engine.Order = order;
		engine.Stop = stop;
		engine.Route = route;
		engine.Kinds = kinds;
		engine.Rebuild = rebuild;
		engine.Compose = compose;
		engine.CenterOn = centerOn;
		engine.ToCell = toCell;
		engine.ToScreen = toScreen;
		engine.Local = local;
		engine.Pressed = pressed;
		engine.Frame = frame;
		engine.ZoomAt = zoomAt;
		engine.SetView = setView;
		engine.Own = own;
		engine.Pick = pick;
		engine.Render = render;
		engine.Minimap = minimap;

		world.Loop = this.$Service('GameLoop').Create({Window: view, Update: update, Render: render});

		world.Watcher = new MutationObserver(declarations);

		world.Watcher.observe(element.querySelector('.elemenx-game-scene-sources'), {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['data-value']});

		if (typeof view.ResizeObserver === 'function') {
			world.Sizes = new view.ResizeObserver(resize);

			world.Sizes.observe(element);
		}

		world.Given = this.Map;
		world.Projected = this.Projection || '';

		declarations();

		load(this.Map);

		activate();

		reconcile();

		resize();

		window.setTimeout(resize, 0);
	},

	StrategyStop: function () {
		var world = this.World ? this.World() : null;
		if (!world) return;

		if (world.Running)
			world.Loop.Stop();

		world.Watcher.disconnect();

		if (world.Sizes)
			world.Sizes.disconnect();
	},

	/* Pointers: the left button selects (a frame when it is dragged), the right one orders, the middle one or Space moves the view, two fingers zoom. */
	MarksDown: function (event) {
		var world = this.World();
		var point = this.Strategy().Local(event);
		var pointers = world.Pointers;
		var ids;

		event.preventDefault();

		this.$Element().focus({preventScroll: true});

		if (event.target.setPointerCapture)
			event.target.setPointerCapture(event.pointerId);

		pointers[event.pointerId] = point;
		ids = Object.keys(pointers);

		if (ids.length === 2) {
			world.Drag = null;
			world.Pinch = {Distance: Math.max(1, Math.sqrt(Math.pow(pointers[ids[0]].X - pointers[ids[1]].X, 2) + Math.pow(pointers[ids[0]].Y - pointers[ids[1]].Y, 2))), Zoom: world.Camera.Zoom};

			return;
		}

		if (event.button === 1 || world.Space) world.Drag = {Kind: 'pan', X: point.X, Y: point.Y, EndX: point.X, EndY: point.Y, CameraX: world.Camera.X, CameraY: world.Camera.Y, Moved: false};
		else if (event.pointerType === 'touch') world.Drag = {Kind: 'touch', X: point.X, Y: point.Y, EndX: point.X, EndY: point.Y, CameraX: world.Camera.X, CameraY: world.Camera.Y, Moved: false};
		else world.Drag = {Kind: event.button === 2 ? 'order' : 'select', X: point.X, Y: point.Y, EndX: point.X, EndY: point.Y, Moved: false, Shift: event.shiftKey};

		this.Panning = world.Drag.Kind === 'pan';
	},

	MarksMove: function (event) {
		var world = this.World();
		var point = this.Strategy().Local(event);
		var pointers = world.Pointers;
		var drag = world.Drag;
		var ids;
		var distance;

		if (pointers[event.pointerId])
			pointers[event.pointerId] = point;

		ids = Object.keys(pointers);

		if (world.Pinch && ids.length === 2) {
			distance = Math.max(1, Math.sqrt(Math.pow(pointers[ids[0]].X - pointers[ids[1]].X, 2) + Math.pow(pointers[ids[0]].Y - pointers[ids[1]].Y, 2)));

			this.Strategy().ZoomAt(world.Pinch.Zoom * distance / world.Pinch.Distance, (pointers[ids[0]].X + pointers[ids[1]].X) / 2, (pointers[ids[0]].Y + pointers[ids[1]].Y) / 2);

			return;
		}

		if (!drag) return;

		drag.EndX = point.X;
		drag.EndY = point.Y;

		if (Math.abs(drag.EndX - drag.X) + Math.abs(drag.EndY - drag.Y) > 6)
			drag.Moved = true;

		if ((drag.Kind === 'pan' || drag.Kind === 'touch') && drag.Moved) {
			this.Panning = true;

			this.Strategy().SetView(drag.CameraX - (drag.EndX - drag.X) / world.Camera.Zoom, drag.CameraY - (drag.EndY - drag.Y) / world.Camera.Zoom, world.Camera.Zoom);
		}

		world.Dirty = true;
	},

	MarksUp: function (event) {
		var world = this.World();
		var drag = world.Drag;
		var point = this.Strategy().Local(event);

		delete world.Pointers[event.pointerId];

		if (world.Pinch) {
			if (!Object.keys(world.Pointers).length)
				world.Pinch = null;

			return;
		}

		world.Drag = null;
		this.Panning = false;
		world.Dirty = true;

		if (!drag) return;

		if (drag.Kind === 'select' && drag.Moved) this.Strategy().Frame(drag, drag.Shift);
		else if (!drag.Moved && drag.Kind !== 'pan') this.Strategy().Pressed(point.X, point.Y, drag.Kind === 'order' ? 2 : 0, drag.Shift, drag.Kind === 'touch');
	},

	MarksCancel: function (event) {
		delete this.World().Pointers[event.pointerId];

		this.World().Drag = null;
		this.World().Pinch = null;
		this.Panning = false;
		this.World().Dirty = true;
	},

	MarksLeft: function () {
		this.World().Dirty = true;
	},

	MarksWheel: function (event) {
		var point = this.Strategy().Local(event);
		var amount = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;

		event.preventDefault();

		this.Strategy().ZoomAt(this.World().Camera.Zoom * Math.pow(1.0015, -amount), point.X, point.Y);
	},

	MarksMenu: function (event) {
		event.preventDefault();
	},

	/* A double click on a unit of the player: all of its Type in view. */
	MarksDouble: function (event) {
		var world = this.World();
		var engine = this.Strategy();
		var point = engine.Local(event);
		var item = engine.Pick(point.X, point.Y);
		if (!engine.Own(item)) return;

		engine.Select(world.Order.filter(function (id) {
			var other = world.Objects[id];
			var feet = engine.ToScreen(other.X + 0.5, other.Y + 0.5);

			return engine.Own(other) && String(other.Type || '') === String(item.Type || '') && feet.X >= 0 && feet.Y >= 0 && feet.X <= world.Width && feet.Y <= world.Height;
		}));
	},

	MarksKey: function (event) {
		var world = this.World();
		var engine = this.Strategy();
		var camera = world.Camera;
		var step = 48 / camera.Zoom;
		var moves = {ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step]};

		if (event.target !== this.$Element()) return;

		if (moves[event.key]) {
			event.preventDefault();

			engine.SetView(camera.X + moves[event.key][0], camera.Y + moves[event.key][1], camera.Zoom);

			return;
		}

		if (event.key === '+' || event.key === '=' || event.key === '-') {
			event.preventDefault();

			engine.ZoomAt(camera.Zoom * (event.key === '-' ? 1 / 1.25 : 1.25), world.Width / 2, world.Height / 2);

			return;
		}

		if (event.key === ' ') {
			event.preventDefault();

			world.Space = true;

			return;
		}

		if (event.key === 'Escape') {
			engine.Select([]);

			return;
		}

		if ((event.ctrlKey || event.metaKey) && (event.key === 'a' || event.key === 'A')) {
			event.preventDefault();

			engine.Select(world.Order.filter(function (id) {
				return engine.Own(world.Objects[id]);
			}));
		}
	},

	MarksKeyUp: function (event) {
		if (event.key === ' ')
			this.World().Space = false;
	},

	MarksBlurred: function () {
		this.World().Space = false;
	},

	/* The minimap: a press or a drag on it puts that place in the middle of the view. */
	MapDown: function (event) {
		event.preventDefault();

		if (event.target.setPointerCapture)
			event.target.setPointerCapture(event.pointerId);

		this.World().MiniDrag = true;

		this.MapMove(event);
	},

	MapMove: function (event) {
		var world = this.World();
		var box = event.target.getBoundingClientRect();
		var mini = world.Mini;
		if (!world.MiniDrag || !mini) return;

		this.Strategy().CenterOn((event.clientX - box.left - mini.Left) / mini.Scale, (event.clientY - box.top - mini.Top) / mini.Scale);

		world.MiniTime = 0;
	},

	MapUp: function () {
		this.World().MiniDrag = false;
	},

	/* The methods of the world (the ready event gives it). */
	/* What ids are told: to go to a cell ([x, y] or {X, Y}) or to attack (kind attack, Target an object). */
	Order: function (ids, target, kind) {
		this.Strategy().Order(ids, Array.isArray(target) ? {X: target[0], Y: target[1]} : target, kind);

		return true;
	},

	Stop: function (ids) {
		this.Strategy().Stop(ids);
	},

	/* A cell: the kinds of its ground from the lowest layer up, its cost and whether it hides. */
	Cell: function (x, y) {
		var world = this.World();

		return {X: x, Y: y, Terrain: this.Strategy().Kinds(x, y).map(function (kind) {
			return kind.Name;
		}), Cost: world.Ways.Get(x, y), Opaque: x < 0 || y < 0 || x >= world.Map.Width || y >= world.Map.Height || world.Hidden[y * world.Map.Width + x] === 1};
	},

	/* The ground of a cell changed: a key of the terrain on a layer (its name or its index; the last one by default; null empties it). */
	Paint: function (x, y, key, layer) {
		var world = this.World();
		var map = world.Map;
		var target = typeof layer === 'number' ? map.Layers[layer] : map.Layers.filter(function (each) {
			return each.Name === layer;
		})[0] || map.Layers[map.Layers.length - 1];
		if (!target || x < 0 || y < 0 || x >= map.Width || y >= map.Height) return false;

		target.Cells[y * map.Width + x] = key === null || key === undefined ? null : String(key);
		world.MiniGround = null;
		world.Revision++;

		this.Strategy().Rebuild();

		return true;
	},

	Near: function (x, y, radius, filter) {
		var world = this.World();
		var engine = this.Strategy();

		return world.Index.Radius(x + 0.5, y + 0.5, radius, function (id) {
			return typeof filter !== 'function' || !!filter(engine.Outward(world.Objects[String(id)]));
		});
	},

	Route: function (from, to) {
		return this.Strategy().Route(from, to);
	},

	PathGrid: function () {
		return this.World().Ways.Clone();
	},

	FogOfWar: function () {
		return this.World().Fog;
	},

	CenterOn: function (x, y) {
		this.Strategy().CenterOn(x, y);
	},

	ToCell: function (clientX, clientY) {
		var box = this.$Element().querySelector('.elemenx-game-scene-marks').getBoundingClientRect();
		var cell = this.Strategy().ToCell(clientX - box.left, clientY - box.top);

		return {X: Math.floor(cell.X), Y: Math.floor(cell.Y)};
	}
});
