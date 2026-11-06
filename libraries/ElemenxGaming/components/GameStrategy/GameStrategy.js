/*
 * A strategy game on the ground of a Scene, declared inside it: <Scene> ... <GameStrategy Team="blue" Fog="true" /> </Scene>
 * (the trait SceneBehaviour). The units of the player are the walkers of its Team: a press selects one (Shift adds or takes
 * it away), a frame drawn with the left button selects all in it, a double press all of its kind on the screen, Ctrl+A all
 * of them, Escape none. A right press orders them: on the ground they go there and spread round it (Spread metres apart),
 * on a unit of another team they attack it; S stops them. A unit with Damage (per second, 10) attacks what is within its
 * Range (3 metres), going to it first, and by itself what comes within half its Sight; a unit with no Health left is gone.
 * A unit with a Weapon (of the weapons of the Scene: rifle, rocket, mortar...) shoots it from its Range (25 metres) with a
 * Spread of its own (degrees, 2), its shots hitting what is in their way; the damage is of the health of the scene (Vitals).
 * Fog hides what the units of the Team do not see (Sight of a unit, 30 metres) and darkens what they have not seen yet or
 * see no more; the units of other teams are hidden there. The right button turns the view, the wheel brings it near.
 * Selected: the units selected from the start, as they come into the scene.
 *
 * Methods: Selection(), Select(ids), Order(ids, target, kind) (target [x, z], {X, Z} or the ID of a unit; kind move or
 * attack), Stop(ids), Seen(x, z) and Explored(x, z) (of the fog). Events: select ({IDs}), order ({Kind, IDs, X, Z, Target}),
 * death ({ID, By}).
 */
Elemenx.Component('GameStrategy', {
	$Template: '<canvas class="elemenx-game-strategy" aria-hidden="true"></canvas>',
	$Traits: ['SceneBehaviour'],
	$Meta: {
		Group: 'game',
		Icon: 'flag',
		Description: 'A strategy game on the ground of a Scene, declared inside it: selection, orders, paths round the land, attacks, the fog of war.',
		Events: {
			select: 'The units selected changed: {IDs}.',
			order: 'Units were told to move or attack: {Kind, IDs, X, Z, Target}.',
			death: 'A unit has no health left and is gone: {ID, By}.'
		},
		Props: {
			Team: 'The team of the player: its walkers are its units.',
			Fog: 'The fog of war: what the units do not see is hidden and darkened.',
			Spread: 'Metres between the units sent to one place.',
			Selected: 'The units selected from the start (IDs: a list, or text with commas), as they come.',
			Label: 'The name of it for screen readers.'
		}
	},
	Team: 'blue',
	Fog: false,
	Spread: 2.5,
	Selected: '',
	Label: '',

	SceneStart: function (scene) {
		var canvas = this.$Element();

		this.Chosen = [];
		this.Orders = {};
		this.Marks = [];
		this.Box = null;
		this.Clock = 0;
		this.FogMade = null;
		this.Hurt = {};
		this.Watching = null;

		/* A death by anything of the scene (a shot of a weapon too) leaves the orders and the selection. */
		this.Ledger();

		/* Over the canvas of the scene, as large as it; the presses go through it to the scene. */
		scene.$Element().appendChild(canvas);

		canvas.style.cssText = 'position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1';
	},

	SceneStop: function () {
		this.Chosen = [];
		this.Orders = {};
		this.Watching = null;
	},

	/* The scene and its inner state. */
	/* A range of sight as the weather and the light of the scene leave it: shorter in fog, rain and the dark. */
	Seeing: function (range) {
		var scene = this.ParentScene();

		return scene && scene.SightOf ? scene.SightOf(range) : range;
	},

	Space: function () {
		var scene = this.ParentScene();

		return scene ? scene.Scene() : null;
	},

	Mine: function (object) {
		return !!(object && object.Traits && object.Traits.Walker && String(object.Team || '') === String(this.Team));
	},

	Foe: function (object) {
		return !!(object && object.Traits && object.Traits.Health && object.Team && String(object.Team) !== String(this.Team));
	},

	Units: function () {
		var self = this;
		var space = this.Space();

		return space ? Object.keys(space.Objects).map(function (id) {
			return space.Objects[id];
		}).filter(function (object) {
			return self.Mine(object) && object.World && !object.Owner;
		}) : [];
	},

	Selection: function () {
		return (this.Chosen || []).slice();
	},

	Select: function (ids) {
		var space = this.Space();
		var self = this;

		this.Chosen = (ids || []).filter(function (id) {
			return space && self.Mine(space.Objects[id]);
		});

		this.$Emit('select', {IDs: this.Chosen.slice()});

		return this;
	},

	/* Where a point of the page is on the canvas of the scene. */
	Local: function (event) {
		var box = this.ParentScene().$Element().querySelector('.elemenx-scene-canvas').getBoundingClientRect();

		return [event.clientX - box.left, event.clientY - box.top];
	},

	ScenePointer: function (kind, event) {
		var self = this;
		var scene = this.ParentScene();
		var at;
		var picked;
		var object;

		if (!this.Space() || !this.Space().Ground || !event || event.clientX === undefined) return false;

		at = this.Local(event);

		if (kind === 'down' && event.button === 0) {
			this.Box = {From: at, To: at, Add: !!event.shiftKey};

			return true;
		}

		if (kind === 'move' && this.Box) {
			this.Box.To = at;

			return true;
		}

		if (kind === 'down' && event.button === 2) {
			this.Right = at;

			return false;
		}

		if (kind === 'up' && event.button === 2 && this.Right && Math.hypot(at[0] - this.Right[0], at[1] - this.Right[1]) < 6) {
			this.Right = null;

			if (!this.Chosen.length) return false;

			picked = scene.Pick(event.clientX, event.clientY);
			object = picked ? this.Space().Objects[picked] : null;

			if (this.Foe(object)) {
				this.Order(this.Chosen, picked, 'attack');

				return true;
			}

			var ground = scene.GroundAt(event.clientX, event.clientY);
			if (ground)
				this.Order(this.Chosen, [ground[0], ground[2], ground[1]], 'move');

			return true;
		}

		if (kind === 'up' && this.Box) {
			var box = this.Box;
			var chosen = box.Add ? this.Chosen.slice() : [];

			this.Box = null;

			/* A press, not a frame: the unit under it. */
			if (Math.hypot(box.To[0] - box.From[0], box.To[1] - box.From[1]) < 5) {
				picked = scene.Pick(event.clientX, event.clientY);

				if (picked && this.Mine(this.Space().Objects[picked])) {
					if (box.Add && chosen.indexOf(picked) !== -1) chosen.splice(chosen.indexOf(picked), 1);
					else if (chosen.indexOf(picked) === -1) chosen.push(picked);
				}

				this.Select(chosen);

				return true;
			}

			var left = Math.min(box.From[0], box.To[0]);
			var right = Math.max(box.From[0], box.To[0]);
			var top = Math.min(box.From[1], box.To[1]);
			var bottom = Math.max(box.From[1], box.To[1]);

			this.Units().forEach(function (unit) {
				var spot = self.ParentScene().Engine().Project(unit.World);
				if (spot.Visible !== false && spot.X >= left && spot.X <= right && spot.Y >= top && spot.Y <= bottom && chosen.indexOf(unit.ID) === -1)
					chosen.push(unit.ID);
			});

			this.Select(chosen);

			return true;
		}

		/* A double press: all of that kind on the screen. */
		if (kind === 'double') {
			picked = scene.Pick(event.clientX, event.clientY);
			object = picked ? this.Space().Objects[picked] : null;

			if (!this.Mine(object)) return false;

			this.Select(this.Units().filter(function (unit) {
				var spot = self.ParentScene().Engine().Project(unit.World);

				return unit.Kind === object.Kind && spot.Visible !== false && spot.X >= 0 && spot.Y >= 0 && spot.X <= self.Space().Width && spot.Y <= self.Space().Height;
			}).map(function (unit) {
				return unit.ID;
			}));

			return true;
		}

		return false;
	},

	SceneKey: function (event) {
		if ((event.ctrlKey || event.metaKey) && event.code === 'KeyA') {
			this.Select(this.Units().map(function (unit) {
				return unit.ID;
			}));

			if (event.preventDefault)
				event.preventDefault();

			return true;
		}

		if (event.code === 'Escape' && this.Chosen.length) {
			this.Select([]);

			return true;
		}

		if (event.code === 'KeyS' && this.Chosen.length && !event.ctrlKey) {
			this.Stop(this.Chosen);

			return true;
		}

		return false;
	},

	/* Units told to go to a place (each to its own spot round it) or to attack a unit. */
	Order: function (ids, target, kind) {
		var self = this;
		var scene = this.ParentScene();
		var space = this.Space();
		var list = (Array.isArray(ids) ? ids : [ids]).filter(function (id) {
			return space && space.Objects[id];
		});
		var point = typeof target === 'string' ? null : Array.isArray(target) ? target : target ? [Number(target.X) || 0, Number(target.Z !== undefined ? target.Z : target.Y) || 0] : null;
		var side = Math.ceil(Math.sqrt(list.length));
		var spread = Number(this.Spread) || 2.5;
		var made = kind === 'attack' && typeof target === 'string' ? 'attack' : 'move';
		if (!scene || !list.length || made === 'move' && !point) return false;

		list.forEach(function (id, index) {
			if (made === 'attack') {
				self.Orders[id] = {Kind: 'attack', Target: target, Next: 0};

				return;
			}

			var row = Math.floor(index / side);
			var column = index % side;
			/* The height of the floor told goes too: a cave under a hill is another place than the hill. */
			var spot = [point[0] + (column - (side - 1) / 2) * spread, point[1] + (row - (side - 1) / 2) * spread].concat(point.length > 2 ? [point[2]] : []);

			self.Orders[id] = {Kind: 'move'};

			scene.Move(id, spot, function () {
				if (self.Orders[id] && self.Orders[id].Kind === 'move')
					delete self.Orders[id];
			});
		});

		this.Marks.push({Kind: made, At: made === 'attack' ? null : point, Target: made === 'attack' ? target : null, Time: 0});
		this.$Emit('order', {Kind: made, IDs: list, X: point ? point[0] : null, Z: point ? point[1] : null, Target: made === 'attack' ? target : null});

		return true;
	},

	Stop: function (ids) {
		var self = this;
		var space = this.Space();

		(Array.isArray(ids) ? ids : [ids]).forEach(function (id) {
			delete self.Orders[id];

			if (space)
				delete space.Ways[id];
		});

		this.$Emit('order', {Kind: 'stop', IDs: (Array.isArray(ids) ? ids : [ids]).slice(), X: null, Z: null, Target: null});

		return this;
	},

	Value: function (value, fallback) {
		var number = Number(value);

		return value === undefined || value === null || value === '' || isNaN(number) ? fallback : number;
	},

	SceneStep: function (elapsed) {
		var space = this.Space();
		/* A frame given out of its order (a time before the last) moves nothing back. */
		var spent = Math.max(0, Number(elapsed) || 0);

		if (!space || !space.Ground || !space.Objects) return;

		this.Clock += spent;

		this.Initial();

		this.Fight(spent);

		if (this.Fog === true || this.Fog === 'true')
			this.Fogged();

		this.Draw(spent);
	},

	/* The units Selected names, selected once they are all there. */
	Initial: function () {
		var space = this.Space();
		var given = this.Selected;
		var ids = (Array.isArray(given) ? given : String(given || '').split(',')).map(function (one) {
			return String(one).trim();
		}).filter(Boolean);
		if (this.Started || !ids.length) return;

		if (!ids.every(function (id) {
			return space.Objects[id] && space.Objects[id].World;
		})) return;

		this.Started = true;

		this.Select(ids);
	},

	/* Who attacks whom: going to it, striking within its range, and the ones near by themselves. */
	Fight: function (elapsed) {
		var self = this;
		var scene = this.ParentScene();
		var space = this.Space();
		var objects = space.Objects;
		var fighters = Object.keys(objects).map(function (id) {
			return objects[id];
		}).filter(function (object) {
			return object.World && object.Traits.Walker && object.Traits.Health && !object.Owner;
		});

		fighters.forEach(function (unit) {
			var order = self.Orders[unit.ID];
			/* A unit with a Weapon shoots from afar (the shots of the scene, SceneWeapons), one without strikes near. */
			var armed = unit.Values.Weapon && typeof scene.Fire === 'function';
			var range = self.Value(unit.Values.Range, armed ? 25 : 3);
			var target;
			var far;

			/* Idle, it takes on a foe that comes near. */
			if (!order && !space.Ways[unit.ID]) {
				/* As far as the weather and the light let it see (Scene.SightOf). */
				var sight = self.Seeing(self.Value(unit.Values.Sight, 30)) / 2;
				var near = fighters.filter(function (other) {
					return other.Team && unit.Team && String(other.Team) !== String(unit.Team) && Math.hypot(other.World[0] - unit.World[0], other.World[2] - unit.World[2]) <= sight;
				})[0];
				if (near)
					order = self.Orders[unit.ID] = {Kind: 'attack', Target: near.ID, Next: 0};
			}

			if (!order || order.Kind !== 'attack') return;

			target = objects[order.Target];

			if (!target || !target.World) {
				delete self.Orders[unit.ID];

				return;
			}

			far = Math.hypot(target.World[0] - unit.World[0], target.World[2] - unit.World[2]);

			if (far > range) {
				order.Next -= elapsed;

				if (order.Next <= 0) {
					order.Next = 1;

					scene.Move(unit.ID, [target.World[0], target.World[2]]);
				}

				return;
			}

			delete space.Ways[unit.ID];
			unit.Heading = [target.World[0] - unit.World[0], 0, target.World[2] - unit.World[2]];

			if (armed) {
				scene.Fire(unit.ID, {At: target.ID, Spread: self.Value(unit.Values.Spread, 2)});

				return;
			}

			self.Strike(unit, target, self.Value(unit.Values.Damage, 10) * elapsed);
		});
	},

	/* Damage to a unit, through the health of the scene (Vitals): its Health goes down, and at nothing it is gone. */
	Strike: function (by, target, amount) {
		this.Ledger().Damage(target.ID, {Amount: amount, Source: by.ID, Team: by.Team, Type: 'melee'});
	},

	/*
	 * The health of the scene (Vitals.Of): one for all that hurts there, a death there leaves the orders and the selection.
	 * The ledger is held in a function: a field would hold a reactive copy of it, never the same.
	 */
	Ledger: function () {
		var self = this;
		var ledger = this.$Service('Vitals').Of(this.ParentScene());

		if (!this.Watching || this.Watching() !== ledger) {
			this.Watching = function () {
				return ledger;
			};

			ledger.On('death', function (event) {
				if (!self.Watching || self.Watching() !== ledger) return;

				delete self.Orders[event.ID];

				self.Chosen = self.Chosen.filter(function (id) {
					return id !== event.ID;
				});

				self.$Emit('death', {ID: event.ID, By: event.By});
			});
		}

		return ledger;
	},

	/* The fog: a grid over the ground, what the units see now and what they have seen; the units of others hidden out of sight. */
	Fogged: function () {
		var self = this;
		var space = this.Space();
		var size = space.Ground.Field.Size || 1000;
		var side = 96;
		var cell = size / side;
		var fog = this.FogMade;
		var objects = space.Objects;

		if (!fog || fog.Size !== size || fog.Ground !== space.Ground.Key) {
			fog = this.FogMade = {Size: size, Side: side, Cell: cell, Ground: space.Ground.Key, State: this.$Service('Visibility').Fog(side, side), Heights: [], Version: 0, Last: -1};

			for (var i = 0; i <= side; i++) {
				for (var j = 0; j <= side; j++)
					fog.Heights.push(Math.max(0, space.Ground.Field.Height(j * cell - size / 2, i * cell - size / 2)) + 0.3);
			}
		}

		if (this.Clock - fog.Last < 0.2) return;

		fog.Last = this.Clock;
		fog.Version++;

		fog.State.Hide();

		this.Units().forEach(function (unit) {
			var sight = self.Seeing(self.Value(unit.Values.Sight, 30)) / cell;
			var cx = (unit.World[0] + size / 2) / cell;
			var cz = (unit.World[2] + size / 2) / cell;
			var x;
			var z;

			for (z = Math.max(0, Math.floor(cz - sight)); z <= Math.min(side - 1, Math.ceil(cz + sight)); z++) {
				for (x = Math.max(0, Math.floor(cx - sight)); x <= Math.min(side - 1, Math.ceil(cx + sight)); x++) {
					if (Math.hypot(x + 0.5 - cx, z + 0.5 - cz) <= sight)
						fog.State.Show({Cells: [{X: x, Y: z}]});
				}
			}
		});

		Object.keys(objects).forEach(function (id) {
			var object = objects[id];
			if (!object.World || !object.Team || String(object.Team) === String(self.Team) || object.Owner) return;

			object.Hidden = !self.Seen(object.World[0], object.World[2]);
		});
	},

	Seen: function (x, z) {
		var fog = this.FogMade;
		if (!fog)
			return true;

		return fog.State.Seen(Math.floor((x + fog.Size / 2) / fog.Cell), Math.floor((z + fog.Size / 2) / fog.Cell));
	},

	Explored: function (x, z) {
		var fog = this.FogMade;
		if (!fog)
			return true;

		return fog.State.Explored(Math.floor((x + fog.Size / 2) / fog.Cell), Math.floor((z + fog.Size / 2) / fog.Cell));
	},

	/* What lies over the picture: the fog, the rings of the selected, the bars of health, the marks of orders and the frame. */
	Draw: function (elapsed) {
		var self = this;
		var canvas = this.$Element();
		var space = this.Space();
		var engine = this.ParentScene().Engine();
		var ratio = window.devicePixelRatio || 1;
		var width = space.Width || canvas.clientWidth;
		var height = space.Height || canvas.clientHeight;
		var context;

		if (!canvas.getContext || !width || !height) return;

		if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
			canvas.width = Math.round(width * ratio);
			canvas.height = Math.round(height * ratio);
		}

		context = canvas.getContext('2d');

		if (!context) return;

		context.setTransform(ratio, 0, 0, ratio, 0, 0);
		context.clearRect(0, 0, width, height);

		function project (x, z) {
			var field = space.Ground.Field;

			return engine.Project([x, Math.max(0, field.Height(x, z)) + 0.1, z]);
		}

		function ring (object, color) {
			var radius = (object.Size || 1) * 0.6 + 0.4;
			var i;

			context.beginPath();

			for (i = 0; i <= 24; i++) {
				var spot = project(object.World[0] + Math.cos(i / 24 * Math.PI * 2) * radius, object.World[2] + Math.sin(i / 24 * Math.PI * 2) * radius);

				if (i) context.lineTo(spot.X, spot.Y);
				else context.moveTo(spot.X, spot.Y);
			}

			context.strokeStyle = color;
			context.lineWidth = 2;

			context.stroke();
		}

		if (this.FogMade && (this.Fog === true || this.Fog === 'true'))
			this.DrawFog(context, width, height, ratio);

		this.Chosen.forEach(function (id) {
			var object = space.Objects[id];
			if (object && object.World)
				ring(object, 'rgba(122, 211, 107, 0.95)');
		});

		/* Bars of health: of the selected and of the hurt that are seen. */
		Object.keys(space.Objects).forEach(function (id) {
			var object = space.Objects[id];
			var max;
			var health;
			var top;

			if (!object.World || object.Hidden || !object.Traits.Health || object.Owner || !object.Team) return;

			max = self.Value(object.Traits.Health.Max, 100);
			health = self.Value(object.Values.Health, max);

			if (health >= max && self.Chosen.indexOf(id) === -1) return;

			top = engine.Project([object.World[0], object.World[1] + (object.Size || 1) * 1.2 + 0.4, object.World[2]]);

			if (top.Visible === false) return;

			context.fillStyle = 'rgba(0, 0, 0, 0.6)';

			context.fillRect(top.X - 16, top.Y - 3, 32, 5);

			context.fillStyle = String(object.Team) === String(self.Team) ? '#6ad15f' : '#e0503f';

			context.fillRect(top.X - 15, top.Y - 2, 30 * Math.max(0, health / max), 3);
		});

		/* The marks of orders: a ring that grows and fades where they go, on what they attack. */
		this.Marks = this.Marks.filter(function (mark) {
			var object = mark.Target ? space.Objects[mark.Target] : null;
			var at = object && object.World ? [object.World[0], object.World[2]] : mark.At;
			var spot;

			mark.Time += elapsed;

			if (!at || mark.Time > 0.8) return false;

			spot = project(at[0], at[1]);

			context.beginPath();
			context.arc(spot.X, spot.Y, 6 + mark.Time * 22, 0, Math.PI * 2);

			context.strokeStyle = mark.Kind === 'attack' ? 'rgba(216, 69, 60, ' + (1 - mark.Time / 0.8) + ')' : 'rgba(122, 211, 107, ' + (1 - mark.Time / 0.8) + ')';
			context.lineWidth = 2;

			context.stroke();

			return true;
		});

		if (this.Box) {
			context.fillStyle = 'rgba(122, 211, 107, 0.12)';
			context.strokeStyle = 'rgba(122, 211, 107, 0.9)';
			context.lineWidth = 1;

			context.fillRect(Math.min(this.Box.From[0], this.Box.To[0]), Math.min(this.Box.From[1], this.Box.To[1]), Math.abs(this.Box.To[0] - this.Box.From[0]), Math.abs(this.Box.To[1] - this.Box.From[1]));
			context.strokeRect(Math.min(this.Box.From[0], this.Box.To[0]) + 0.5, Math.min(this.Box.From[1], this.Box.To[1]) + 0.5, Math.abs(this.Box.To[0] - this.Box.From[0]), Math.abs(this.Box.To[1] - this.Box.From[1]));
		}
	},

	/*
	 * The fog over the ground, cell by cell of its grid: black where nothing was seen, dim where nothing is seen now. Drawn
	 * into a picture of its own again only when the fog or the view changed.
	 */
	DrawFog: function (context, width, height, ratio) {
		var fog = this.FogMade;
		var engine = this.ParentScene().Engine();
		var view = this.ParentScene().Viewpoint();
		var key = [fog.Version, width, height, view.Yaw, view.Pitch, view.Distance].concat(view.Target || []).join(',');
		var size = fog.Size;
		var cell = fog.Cell;
		var side = fog.Side;
		var picture = fog.Picture;
		var spots = [];
		var paint;
		var x;
		var z;

		if (!picture) {
			picture = fog.Picture = this.$Element().ownerDocument.createElement('canvas');
		}

		if (fog.Key !== key) {
			fog.Key = key;
			picture.width = Math.round(width * ratio);
			picture.height = Math.round(height * ratio);
			paint = picture.getContext('2d');

			if (!paint) return;

			paint.setTransform(ratio, 0, 0, ratio, 0, 0);

			for (z = 0; z <= side; z++) {
				for (x = 0; x <= side; x++)
					spots.push(engine.Project([x * cell - size / 2, fog.Heights[z * (side + 1) + x], z * cell - size / 2]));
			}

			[1, 0].forEach(function (shade) {
				paint.fillStyle = shade === 1 ? 'rgba(8, 10, 14, 0.45)' : 'rgba(8, 10, 14, 0.88)';

				paint.beginPath();

				for (z = 0; z < side; z++) {
					for (x = 0; x < side; x++) {
						var a = spots[z * (side + 1) + x];
						var b = spots[z * (side + 1) + x + 1];
						var c = spots[(z + 1) * (side + 1) + x + 1];
						var d = spots[(z + 1) * (side + 1) + x];

						if (fog.State.Get(x, z) !== shade) continue;
						/* A cell partly behind the eye would be turned inside out over all the picture: only one wholly before it. */
						if (!a.Visible || !b.Visible || !c.Visible || !d.Visible) continue;

						paint.moveTo(a.X, a.Y);
						paint.lineTo(b.X, b.Y);
						paint.lineTo(c.X, c.Y);
						paint.lineTo(d.X, d.Y);
						paint.closePath();
					}
				}

				paint.fill();
			});
		}

		context.drawImage(picture, 0, 0, width, height);
	}
});
