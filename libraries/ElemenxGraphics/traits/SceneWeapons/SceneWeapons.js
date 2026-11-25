/*
 * SceneWeapons: what a Scene shoots and what a shot does where it hits. The scene knows no health: each hit is told (the
 * event hit, and the hook Hit of its behaviours: the Vitals of ElemenxGaming make damage of it).
 *
 * A weapon is a type (Weapons({name: {...}}) adds or changes them): Kind bullet (a ray at once, a tracer flying along it),
 * beam (a ray as long as it is held: the laser), rail (a ray at once that leaves a spiral of light), projectile (a body that
 * flies: Speed, Gravity, Homing, Size, Glow, Trail; plasma, rocket, shell, arrow); Damage (each hit; a beam a second), Type
 * (kinetic, energy, explosive, fire... for the resistances), Rate (shots a second), Range (metres), Spread (degrees),
 * Pellets (rays a shot), Radius (a blast where it ends: damage less with distance, things pushed, Then the effect of it),
 * Crater (metres: the hole its blast digs where it strikes the ground, Scene.Dig; rocket, artillery and mortar dig),
 * Color and Width (of its light), Muzzle (the effect at the muzzle), Recoil (how much the view of the hero kicks), Magazine
 * and Reload (seconds), Lock {Time (seconds on the aim to lock), Cone (degrees), Count (targets at once)}, Crosshair (dot,
 * cross, circle, chevron). Built in: pistol, rifle, shotgun, sniper, laser, railgun, plasma, rocket, artillery, mortar, bow;
 * of ships in space ship-laser (30 km), ship-cannon (1200 m/s, 3 km), ship-missile (it steers itself, SceneMissiles),
 * ship-pd (point defence), ship-massdriver (a slug of 20 km/s), ship-torpedo, ship-ftl and platform-ftl (Kind tunnel: a
 * railgun faster than light, see tunnel) and ship-lance (Charge: it charges first,
 * a glow, the event charge; Track: a beam on its target as it burns). In space there is no ground: a ray
 * meets only what is there; a body a ship fires flies by the body its ship goes round, from where the step of its ship
 * has it, and meets the ships there where their steps have them (half the size of their model; drawn, they are a frame
 * behind, their planet far on in a frame of quick time).
 *
 * Fire(id, options) shoots the weapon of an object (Values.Weapon, or options.Weapon) from its muzzle toward options.At (a
 * point [x, y, z] or the ID of an object; an artillery shell takes the arc to reach it) or along options.Way; false while the
 * weapon is not ready (its rate, its magazine); options.Hold, seconds a beam burns (its Hold, else). The hero with a Weapon
 * fires with the left button while the pointer is taken, or the right trigger of a pad held, toward the middle of the view, and locks what stays under its aim (Lock of the weapon): lock and unlock events,
 * Locked() the IDs; a homing shot goes to them. The hero at a turret (SceneTactics) fires the weapon of the turret so, from
 * it, its vehicle the source of the shot (Fired of an object: when it fired last, for the recoil of its parts).
 *
 * Where a shot hits it asks the material there (Values.Material of an object; the name of the material of the part of the
 * model hit; walkers flesh, vehicles metal, plants wood, buildings and rocks stone; of the ground: water, snow, a road, soil)
 * and the rules (HitRules({material: {Effect, Decal, Factor}, 'type/material': {...}})): the effect it bursts, the mark it
 * leaves (hole, dent, chip, scorch, crack: they stay for MarkSeconds, the oldest go past MarkCount, the marks of a thing go
 * with it) and the factor of its damage. The event hit: {Weapon, Type, Source, Team, Target (the ID, null for the ground),
 * Part, Point, Normal, Material, Amount, Distance, ID (of the hit)}; fire ({ID, Weapon, From, Way}).
 *
 * What a weapon locks on and what a blast hurts is for the game to say (the hook SceneTarget of its behaviours: GameCombat
 * takes what has health and lives); with none that says, a lock takes what stands with a Team other than the hero's, a
 * blast all that stands in it.
 *
 * Crosshair of the scene ('' as the weapon of the hero says, none, dot, cross, circle, chevron) is drawn over the view while
 * the hero holds a weapon, wider as it moves and fires; it flashes on a hit and red on a kill (Scene.Killed(id)). Locks are
 * marks on their targets, closing in as they lock, at the edge of the view when the target is out of it.
 */
Elemenx.Trait('SceneWeapons', {
	WeaponsStart: function () {
		var self = this;
		var scene = this.Scene();
		var engine = this.Engine();
		var renderer = engine.Renderer;
		var math = this.$Service('Math');
		var vectors = math.Vectors;
		var library = this.$Service('SceneModels');
		var state = scene.Weapons = {Clock: 0, Shots: [], Streaks: [], Marks: [], MarksMesh: null, MarksVersion: 0, MarksBuilt: -1, Ready: {}, Rounds: {}, Charging: {}, Tunnels: [], Holding: false, Spread: 0, Locks: {}, Hits: 0, Counter: 0, Kick: 0};
		var programs = null;
		var head = '#version 300 es\nprecision highp float;\n';
		var shaders = this.WeaponShaders(head);

		/* Asked for when the scene starts (engine.Warm), waited for with the rest: none is made in the play. */
		(engine.Warms = engine.Warms || []).push(function (setting) {
			if (setting === 'galaxy' || !renderer) return;

			programs = programs || {Streak: renderer.Program(shaders.StreakVertex, shaders.Streak), Mark: renderer.Program(shaders.MarkVertex, shaders.Mark)};
		});

		/* Its weapon types (resources/weapons/types.json), a copy of its own: Weapons changes it. */
		scene.WeaponTypes = Elemenx.Resources('Data', 'ElemenxGraphics/weapons/types') || {};

		/*
		 * What a hit does, by the material it hits: its effect, its mark, the factor of its damage. Its effects (muzzle, cannon,
		 * backblast, railflash, the hits of each material, blast, plasmaburst) are the effect graphs of the library
		 * (blueprints/effects). Regression: written here too, they took the place of the graphs: a graph changed never reached
		 * a scene.
		 */
		scene.HitRules = Elemenx.Resources('Data', 'ElemenxGraphics/weapons/hit-rules') || {};

		function number (value, fallback) {
			return value === null || value === undefined || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		function colorOf (text, fallback) {
			return engine.Hex(text, fallback || [1, 1, 1]);
		}

		function typeOf (name) {
			if (name && typeof name === 'object') return name;

			return scene.WeaponTypes[name] || null;
		}

		function traitOf (object, name) {
			return object && object.Traits ? object.Traits[name] || null : null;
		}

		/* The height of a thing, for where it holds what it shoots and where one aims at it. */
		function heightOf (object) {
			var body = engine.BodyOf ? engine.BodyOf(object) : null;

			return body ? Math.max(0.2 * metre(), body.Max[1] - body.Min[1]) : Math.max(0.5 * metre(), object.Size || metre());
		}

		/* Where a shot leaves an object: its muzzle (the far end of what it holds), else at its chest, ahead of it. */
		function muzzleOf (object, toward) {
			/* A ship in space: from the middle of its hull (the way out of it is no one's to hit: a shot passes its source). */
			if (object.Ship && !scene.Ground) return centerOf(object);

			var height = heightOf(object);
			var way = toward ? vectors.Subtract(toward, object.World) : object.Heading || [0, 0, 1];
			var flat = Math.hypot(way[0], way[2]) || 1;

			return [object.World[0] + way[0] / flat * 0.45 * metre(), object.World[1] + height * 0.72, object.World[2] + way[2] / flat * 0.45 * metre()];
		}

		/* Where one aims at an object: the middle of its body. */
		/*
		 * Whether a weapon may aim at an object and its blast hurt it: as the behaviours of the scene say (SceneTarget of
		 * GameCombat: what has health and lives); with none that says, what stands with a team of its own (aim) or anything
		 * that stands (a blast). The scene knows no health.
		 */
		function targetable (object, aiming) {
			var said = [];

			(self.Behaviours ? self.Behaviours() : []).forEach(function (behaviour) {
				var answer = typeof behaviour.Target === 'function' ? behaviour.Target(object) : undefined;
				if (answer === true || answer === false)
					said.push(answer);
			});

			if (said.length)
				return said.indexOf(true) !== -1;

			return aiming ? !!object.Team : true;
		}

		function centerOf (object) {
			var body = engine.BodyOf ? engine.BodyOf(object) : null;
			if (body)
				return [(body.Min[0] + body.Max[0]) / 2, (body.Min[1] + body.Max[1]) / 2, (body.Min[2] + body.Max[2]) / 2];

			return [object.World[0], object.World[1] + heightOf(object) * 0.5, object.World[2]];
		}

		/*
		 * The material of a thing a shot hits (resources/weapons/materials): of the name of the material of its part (Names, the
		 * first that matches), else a walker, a vehicle, the Type or the Group of its model, else Otherwise. Regression: in the
		 * code alone, by the names of the kinds.
		 */
		var materials = Elemenx.Resources('Data', 'ElemenxGraphics/weapons/materials') || {Names: [], Types: {}, Groups: {}};

		/* What a material of a part of a model is called, its kind. */
		function materialNamed (name) {
			var text = String(name || '').toLowerCase();
			var found = materials.Names.filter(function (rule) {
				return new RegExp(rule.Match).test(text);
			})[0];

			return found ? found.Material : '';
		}

		/* The material of a thing where a shot hits it. */
		function materialOf (object, piece) {
			var info;
			var named;

			if (object.Values.Material)
				return String(object.Values.Material);

			named = piece && piece.Material ? materialNamed(piece.Material.Name) : '';

			if (named)
				return named;

			if (traitOf(object, 'Walker') || object.Kind === 'unit') return materials.Walker;

			if (object.Values.Vehicle) return materials.Vehicle;

			info = library.Has(String(object.Values.Model || (traitOf(object, 'Model') || {}).Shape || '')) ? library.Info(String(object.Values.Model || traitOf(object, 'Model').Shape)) : null;

			if (info && materials.Types[info.Type]) return materials.Types[info.Type];
			if (info && materials.Groups[info.Group]) return materials.Groups[info.Group];

			return materials.Otherwise;
		}

		/* The material of the ground at a point: water under the sea, snow, a road, the soil. */
		function groundMaterial (point) {
			var ground = scene.Ground;
			var surface = self.SurfaceAt ? self.SurfaceAt(point[0], point[2]) : null;

			if (ground && ground.Field && ground.Field.Water && point[1] < 0.06) return 'water';

			if (engine.Snowed && engine.Snowed() > 0.5) return 'snow';

			if (surface && surface.Road) return 'stone';

			return 'soil';
		}

		/*
		 * The first thing a ray meets: the ground and what is rigid or walks (CastRay), and every model (its box, then its
		 * triangles), but what shoots and what it holds. {ID, Point, Normal, Distance, Material, Part, Object}, or null.
		 */
		function trace (from, way, range, skip) {
			var best = null;
			var ray = {Origin: from, Direction: way};
			var cast = engine.RigidRay ? engine.RigidRay(from, way, range) : null;
			var field = scene.Ground ? scene.Ground.Field : null;

			/*
			 * Its ground only where there is one: in space the rigid world has none (its plane of heights 0 there is nothing).
			 * Regression: a missile that crossed the plane of a system went into that ground.
			 */
			if (cast && cast.ID !== skip && (cast.ID || scene.Ground))
				best = {ID: cast.ID, Point: cast.At, Normal: cast.Normal, Distance: cast.Distance};

			/* The ground by steps, where no rigid world was asked for. */
			if (!best && field && !cast) {
				var step = 0.5;
				var t;

				for (t = step; t <= range; t += step) {
					var p = vectors.Add(from, vectors.Scale(way, t));

					if (p[1] <= Math.max(field.Height(p[0], p[2], p[1] + 0.5), field.Water ? 0 : -1e9)) {
						var low = t - step;
						var high = t;
						var k;

						for (k = 0; k < 10; k++) {
							var mid = (low + high) / 2;
							var q = vectors.Add(from, vectors.Scale(way, mid));

							if (q[1] <= Math.max(field.Height(q[0], q[2], q[1] + 0.5), field.Water ? 0 : -1e9)) high = mid;
							else low = mid;
						}

						var at = vectors.Add(from, vectors.Scale(way, high));
						var e = 0.2;

						best = {ID: null, Point: at, Normal: at[1] <= 0.001 && field.Water ? [0, 1, 0] : vectors.Normalize([field.Height(at[0] - e, at[2]) - field.Height(at[0] + e, at[2]), 2 * e, field.Height(at[0], at[2] - e) - field.Height(at[0], at[2] + e)]), Distance: high};

						break;
					}

					if (t > 60)
						step = 1.5;
				}
			}

			Object.keys(scene.Objects).forEach(function (id) {
				var object = scene.Objects[id];
				var found;

				if (id === skip || object.Hidden || !object.World || object.Owner === skip || skip && object.Values.Aboard === skip || object.Values.Shootable === false) return;

				found = engine.ModelHit ? engine.ModelHit(object, ray, best ? best.Distance : range) : null;

				if (found && (!best || found.Distance < best.Distance))
					best = {ID: id, Point: found.Point, Normal: found.Normal, Distance: found.Distance, Piece: found.Piece, Height: found.Height};
			});

			if (!best)
				return null;

			var object = best.ID ? scene.Objects[best.ID] : null;

			best.Object = object;

			if (object && best.Height === undefined)
				best.Height = (best.Point[1] - object.World[1]) / heightOf(object);

			best.Material = object ? materialOf(object, best.Piece) : groundMaterial(best.Point);
			best.Part = object ? partOf(object, best) : '';

			return best;
		}

		/* The part of a body a hit took: head over the top eighth of a walker, else the piece hit. */
		function partOf (object, found) {
			if ((traitOf(object, 'Walker') || object.Kind === 'unit') && found.Height !== undefined && found.Height > 0.86) return 'head';

			return found.Piece ? String(found.Piece.ID || '') : '';
		}

		/* The rule of a hit: the type of the weapon and the material, the material, the type. */
		function ruleOf (type, material) {
			var rules = scene.HitRules;

			return Object.assign({Effect: '', Decal: '', Factor: 1}, rules[material] || {}, rules[type] || {}, rules[type + '/' + material] || {});
		}

		/* A mark where a shot hit: on the ground or on a thing, then with it as it moves. */
		/*
		 * A metre in units of the scene: the distances of a weapon (Range, Speed, Gravity, Radius, Width, Size) are metres. On
		 * a ground (a location) a unit is a metre; in space of real sizes a metre is tiny. Regression: in space a laser of
		 * 400 m reached 400 units, far past the planets, and a shot left its ship behind.
		 */
		function metre () {
			return !scene.Ground && engine.Metre && engine.Metre() || 1;
		}

		engine.WeaponsMetre = metre;

		function mark (kind, point, normal, size, object) {
			var count = number(self.MarkCount, 200);
			var turn = object && object.Turn ? object.Turn : null;

			if (!kind || !renderer) return;

			state.Marks.push({Kind: kind, Point: point.slice(), Normal: normal.slice(), Size: size * metre(), Seed: Math.random(), Born: state.Clock, Object: object ? object.ID : '', Local: object ? local(object, point, turn) : null, LocalNormal: object && turn ? applyNormal(math.Invert(turn), normal) : normal.slice()});

			while (state.Marks.length > count)
				state.Marks.shift();

			state.MarksVersion++;
		}

		function local (object, point, turn) {
			var offset = vectors.Subtract(point, object.World);

			return turn ? applyNormal(math.Invert(turn), offset) : offset;
		}

		function applyNormal (matrix, v) {
			return [matrix[0] * v[0] + matrix[4] * v[1] + matrix[8] * v[2], matrix[1] * v[0] + matrix[5] * v[1] + matrix[9] * v[2], matrix[2] * v[0] + matrix[6] * v[1] + matrix[10] * v[2]];
		}

		var marksKinds = {hole: 0, dent: 1, chip: 2, pit: 3, scorch: 4, crack: 5};

		/* A hit, told and shown: the effect and the mark of its rule, the event, the behaviours (damage). */
		function hit (shot, found, amount, way) {
			var type = shot.Type;
			var rule = ruleOf(type.Type || 'kinetic', found.Material);
			var told;

			if (rule.Effect && self.Burst)
				self.Burst(rule.Effect, vectors.Add(found.Point, vectors.Scale(found.Normal, 0.02)), {Aim: found.Normal, Size: shot.Blast ? 1.4 : 1});

			if (rule.Decal && !(found.Object && (traitOf(found.Object, 'Walker') || found.Object.Values.Vehicle && found.Material === 'flesh')))
				mark(rule.Decal, found.Point, found.Normal, shot.Blast ? Math.min(6, number(type.Radius, 4) * 0.6) : rule.Decal === 'scorch' ? 0.35 : rule.Decal === 'pit' ? 0.22 : rule.Decal === 'crack' ? 0.3 : 0.1, found.Object);

			if (found.Object && found.Object.Values.Rigid !== false && engine.RigidPush && type.Push)
				engine.RigidPush(found.ID, vectors.Scale(way, number(type.Push, 0) * 0.02), found.Point);

			told = {ID: 'h' + (++state.Counter) + '-' + shot.ID, Weapon: shot.Name, Type: type.Type || 'kinetic', Source: shot.Source, Team: shot.Team, Target: found.ID || null, Part: found.Part || '', Point: found.Point, Normal: found.Normal, Material: found.Material, Amount: amount * number(rule.Factor, 1), Distance: vectors.Distance(shot.From, found.Point)};

			state.Hits++;

			/* A hit on a ship in flight is felt in it (SceneAboard). */
			if (found.Object && engine.AboardHit)
				engine.AboardHit(found.Object, way, told.Amount);

			if (shot.Source === gunnerID() && found.ID)
				state.Marked = {At: state.Clock, Kill: false, Target: found.ID};

			self.$Emit('hit', told);
			self.RunBehaviours('Hit', [told]);

			return told;
		}

		/* A blast where a shot ends: each thing near takes less the farther it stands, rigid things are pushed away. */
		function blast (shot, point, normal) {
			var type = shot.Type;
			var radius = number(type.Radius, 0) * metre();

			if (type.Then && self.Burst)
				self.Burst(type.Then, vectors.Add(point, vectors.Scale(normal, 0.1 * metre())), {Size: Math.max(0.4, number(type.Radius, 0) / 6), Aim: normal});

			/* Struck in the ground (rock a little behind the point): a hole dug there. */
			if (number(type.Crater, 0) > 0 && scene.Ground && scene.Ground.Field && !scene.Ground.Field.Whole && scene.Ground.Field.Density(point[0] - normal[0] * 0.3, point[1] - normal[1] * 0.3, point[2] - normal[2] * 0.3) > 0)
				self.Dig(point, number(type.Crater, 0));

			if (!radius) return;

			Object.keys(scene.Objects).forEach(function (id) {
				var object = scene.Objects[id];
				var middle;
				var far;
				var way;

				/* What a missile burst by was hit by it already (SceneMissiles: its fuse). */
				if (!object.World || object.Hidden || object.Owner || shot.Spare === id) return;

				middle = centerOf(object);
				far = vectors.Distance(middle, point);

				if (far > radius) return;

				way = far > 0.01 * metre() ? vectors.Normalize(vectors.Subtract(middle, point)) : [0, 1, 0];

				if (engine.RigidPush && type.Push)
					engine.RigidPush(id, vectors.Scale(way, number(type.Push, 0) * (1 - far / radius)), point);

				if (!targetable(object, false)) return;

				hit({ID: shot.ID, Type: type, Name: shot.Name, Source: shot.Source, Team: shot.Team, From: point, Blast: true}, {ID: id, Object: object, Point: middle, Normal: vectors.Scale(way, -1), Material: materialOf(object, null), Part: ''}, number(type.Damage, 0) * (1 - far / radius), way);
			});

			hit({ID: shot.ID, Type: type, Name: shot.Name, Source: shot.Source, Team: shot.Team, From: point, Blast: true}, {ID: null, Object: null, Point: point, Normal: normal, Material: groundMaterial(point), Part: ''}, 0, normal);
		}

		/* A way spread round a way by up to so many degrees. */
		function spread (way, degrees) {
			var angle = degrees * Math.PI / 180 * Math.sqrt(Math.random());
			var turn = Math.random() * Math.PI * 2;
			var side = vectors.Normalize(vectors.Cross(way, Math.abs(way[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]));
			var up = vectors.Cross(side, way);

			return vectors.Normalize(vectors.Add(vectors.Scale(way, Math.cos(angle)), vectors.Add(vectors.Scale(side, Math.sin(angle) * Math.cos(turn)), vectors.Scale(up, Math.sin(angle) * Math.sin(turn)))));
		}

		/* The arc of a shell to a point: the low one of the two at its speed, or the high one (Arc: 'high', as a mortar or a gun far off). */
		function arc (from, to, speed, gravity, high) {
			var flat = [to[0] - from[0], 0, to[2] - from[2]];
			var x = Math.hypot(flat[0], flat[2]);
			var y = to[1] - from[1];
			var v2 = speed * speed;
			var root = v2 * v2 - gravity * (gravity * x * x + 2 * y * v2);
			var angle;

			if (root < 0 || x < 0.01) return null;

			angle = Math.atan((v2 - Math.sqrt(root)) / (gravity * x));

			if (high)
				angle = Math.atan((v2 + Math.sqrt(root)) / (gravity * x));

			return [flat[0] / x * Math.cos(angle), Math.sin(angle), flat[2] / x * Math.cos(angle)];
		}

		/* A streak of light to draw: a tracer, a beam, a rail and its spiral, a trail. */
		function streak (from, to, color, width, lasts, kind) {
			state.Streaks.push({From: from.slice(), To: to.slice(), Color: color, Width: width * metre(), Born: state.Clock, Lasts: lasts, Kind: kind || 'tracer'});
		}

		/*
		 * A shot of a weapon of an object: its rate and its magazine first; then rays at once (bullet, rail), a beam held,
		 * or a body that flies (projectile). True if it shot.
		 */
		engine.Fire = function (id, options) {
			var object = scene.Objects[id];
			var settings = options || {};
			var name = settings.Weapon || object && object.Values.Weapon;
			var type = typeOf(name);
			var key = id + ':' + (typeof name === 'string' ? name : 'own');
			var rounds;
			var from;
			var at;
			var way;
			var target;
			var count;
			var i;

			if (!object || !object.World || !type) return false;

			if ((state.Ready[key] || 0) > state.Clock && (type.Kind !== 'beam' || type.Charge)) return false;

			/*
			 * A weapon that charges (Charge seconds: the lance) charges first, a glow at its muzzle, then fires as asked (the event
			 * charge {ID, Weapon, Seconds}); asked again while it charges or burns, it does not.
			 */
			if (type.Charge && !settings.Charged) {
				if (state.Charging[key] || state.Shots.some(function (shot) {
					return shot.Source === id && shot.Type === type;
				})) return false;

				state.Charging[key] = {ID: id, Name: name, Type: type, Settings: Object.assign({}, settings, {Charged: true}), Born: state.Clock, Until: state.Clock + number(type.Charge, 2)};

				self.$Emit('charge', {ID: id, Weapon: typeof name === 'string' ? name : 'own', Seconds: number(type.Charge, 2)});

				return true;
			}

			/* The magazine: empty, it reloads; then it is full. */
			if (type.Magazine) {
				rounds = state.Rounds[key];

				if (rounds === undefined || rounds.Reloading && rounds.Reloading <= state.Clock)
					rounds = state.Rounds[key] = {Left: number(type.Magazine, 1), Reloading: 0};

				if (rounds.Reloading) return false;
			}

			target = typeof settings.At === 'string' ? scene.Objects[settings.At] : null;
			at = target ? centerOf(target) : Array.isArray(settings.At) ? settings.At : null;
			from = settings.From || muzzleOf(object, at);
			way = settings.Way ? vectors.Normalize(settings.Way) : at ? vectors.Normalize(vectors.Subtract(at, from)) : vectors.Normalize(object.Heading || [0, 0, 1]);

			/* A beam already held goes on, turned to where it is aimed now (not one that charges: it burns its Hold). */
			if (type.Kind === 'beam' && !type.Charge) {
				var held = state.Shots.filter(function (shot) {
					return shot.Source === id && shot.Type === type;
				})[0];

				if (held) {
					held.Until = state.Clock + number(type.Hold, 0.12) + 0.05;
					held.From = from;
					held.Way = way;

					return true;
				}
			}

			state.Ready[key] = state.Clock + 1 / Math.max(0.01, number(type.Rate, 2));

			/* Its weapons need their power for a moment (SceneShipSystems). */
			if (engine.SystemsFired)
				engine.SystemsFired(id);

			if (rounds) {
				rounds.Left--;

				if (rounds.Left <= 0)
					rounds.Reloading = state.Clock + number(type.Reload, 2);
			}

			if (type.Muzzle && self.Burst && type.Kind !== 'beam')
				self.Burst(type.Muzzle, from, {Aim: way, Size: type.Kind === 'projectile' && type.Arc ? 1.5 : 1});

			if (type.Arc && at && type.Gravity) {
				var arced = arc(from, at, number(type.Speed, 100) * metre(), number(type.Gravity, 9.81) * metre(), type.Arc === 'high');
				if (arced)
					way = arced;
			}

			count = Math.max(1, number(type.Pellets, 1));

			for (i = 0; i < count; i++) {
				var shot = {ID: id + '-' + (++state.Counter), Name: typeof name === 'string' ? name : 'own', Type: type, Source: id, Team: object.Team || object.Values.Team || '', From: from.slice(), Way: spread(way, number(settings.Spread, number(type.Spread, 0)) + (id === gunnerID() ? state.Spread : 0)), Target: target ? target.ID : settings.Target || (id === gunnerID() ? lockedFirst() : ''), Born: state.Clock, Hold: Number(settings.Hold) || 0, Mode: settings.Mode || ''};

				launch(shot);
			}

			/* Its turret and barrel parts recoil (the drive fire). */
			object.Values.Fired = scene.Seconds;

			if (id === gunnerID()) {
				state.Spread = Math.min(4, state.Spread + number(type.Recoil, 0.4) * 0.6);
				state.Kick += number(type.Recoil, 0.4) * 0.012;
			}

			self.$Emit('fire', {ID: id, Weapon: typeof name === 'string' ? name : 'own', From: from, Way: way});

			return true;
		};

		/* How a thing goes by the body a ship there goes round (a ship: its way by it), else as it is seen going. */
		function wayIn (object) {
			return object.Ship ? object.Ship.Way.slice() : (object.WorldWay || [0, 0, 0]).slice();
		}

		/*
		 * A tunnel of warp for one slug only (Kind tunnel: the railgun faster than light), opened from the muzzle as it fires
		 * (no warning to its target: it is no missile). Its Mode (of the shot: settings.Mode, else of its type): predict, the
		 * slug comes out Exit metres (3000) short of where its target will be as it goes now, Delay seconds (0.4) in the
		 * tunnel and its way out at Speed, and flies there (a target that turns is missed); direct, it comes out in its target
		 * (only its shields take it). A blocker of warp (the trait WarpBlocker) by the target lets no tunnel open there. The
		 * event tunnel {ID, Weapon, Source, Target, Mode, Blocked}.
		 */
		function tunnel (shot, source) {
			var type = shot.Type;
			var target = shot.Target ? scene.Objects[shot.Target] : null;
			var mode = shot.Mode || type.Mode || 'predict';
			var unit = metre();
			var delay = number(type.Delay, 0.4);
			var from;
			var to;
			var blocked;
			var round;
			var told;

			if (!target || !target.World || !source) return;

			from = placeOf(source);
			to = placeOf(target);
			blocked = scene.Order.filter(function (object) {
				var blocker = (object.Traits || {}).WarpBlocker;

				return blocker && blocker.Active !== false && blocker.Active !== 'false' && object.World && vectors.Distance(object.World, target.World) < number(blocker.Radius, 20) * (object.Size || 1);
			})[0] || null;
			told = {ID: shot.ID, Weapon: shot.Name, Source: shot.Source, Target: target.ID, Mode: mode, Blocked: !!blocked};

			if (vectors.Distance(from, to) > number(type.Range, 1e9) * unit || blocked) {
				self.$Emit('tunnel', told);

				return;
			}

			round = target.Ship && target.Values.Vehicle && target.Values.Vehicle.Around && !scene.Ground ? scene.Objects[target.Values.Vehicle.Around] : null;

			if (mode === 'direct') {
				state.Tunnels.push({Shot: shot, Mode: mode, At: state.Clock + delay, Target: target.ID, Born: state.Clock});
			}
			else {
				var speed = number(type.Speed, 30000) * unit;
				var exit = number(type.Exit, 3000) * unit;
				var going = wayIn(target);
				var meets = vectors.Add(to, vectors.Scale(going, delay + exit / Math.max(1e-12, speed)));
				var way = vectors.Normalize(vectors.Subtract(meets, from));
				var out = vectors.Subtract(meets, vectors.Scale(way, exit));

				state.Tunnels.push({Shot: shot, Mode: mode, At: state.Clock + delay, Target: target.ID, Born: state.Clock, Around: round ? round.ID : '', Rel: round && round.World ? vectors.Subtract(out, round.World) : null, Out: out, Way: way, Speed: speed});
			}

			/* The tunnel drawn: a coil of light from the muzzle to where the slug comes out, as long as it is in it. */
			var drawnOut = vectors.Add(centerOf(target), mode === 'direct' ? [0, 0, 0] : vectors.Subtract(state.Tunnels[state.Tunnels.length - 1].Out, to));
			var glow = colorOf(type.Color, [0.85, 0.7, 1]);

			streak(muzzleOf(source, drawnOut), drawnOut, glow, number(type.Width, 4), delay + 0.6, 'spiral');
			streak(muzzleOf(source, drawnOut), drawnOut, glow, number(type.Width, 4) * 0.3, delay + 0.3, 'rail');

			self.$Emit('tunnel', told);
		}

		/* The tunnels open: as each one's Delay is gone, its slug comes out (predict) or strikes (direct). */
		function tunnelsStep () {
			state.Tunnels = state.Tunnels.filter(function (one) {
				var shot = one.Shot;
				var type = shot.Type;
				var target = scene.Objects[one.Target];
				var round;

				if (state.Clock < one.At) return true;

				if (one.Mode === 'direct') {
					if (target && target.World && !target.Hidden) {
						var middle = centerOf(target);

						hit(shot, {ID: target.ID, Object: target, Point: middle, Normal: vectors.Scale(shot.Way, -1), Material: materialOf(target, null), Part: '', Distance: 0}, number(type.Damage, 100), shot.Way);

						blast(Object.assign({}, shot, {Spare: target.ID}), middle, vectors.Scale(shot.Way, -1));
					}

					return false;
				}

				round = one.Around ? scene.Objects[one.Around] : null;

				/* Out as late as the frame let it be (it went on in the tunnel so long): on its way by that time. Regression: out a frame late, it passed a target going across 30 m behind it. */
				var late = vectors.Scale(one.Way, one.Speed * Math.max(0, state.Clock - one.At));

				one.Rel = one.Rel ? vectors.Add(one.Rel, late) : null;
				one.Out = vectors.Add(one.Out, late);
				shot.At = round && round.World && one.Rel ? vectors.Add(round.World, one.Rel) : one.Out.slice();
				shot.From = shot.At.slice();
				shot.Way = one.Way;
				shot.Around = round ? round.ID : '';
				shot.Rel = round ? one.Rel.slice() : null;
				shot.Carried = [0, 0, 0];
				shot.Velocity = vectors.Scale(one.Way, one.Speed);
				shot.Flown = 0;
				shot.Trail = [shot.At.slice()];
				shot.Out = true;

				state.Shots.push(shot);

				return false;
			});
		}

		/* The flight of a shot begins: a ray hits now, a beam is held, a body flies. */
		function launch (shot) {
			var type = shot.Type;
			var range = number(type.Range, 200) * metre();
			var color = colorOf(type.Color, [1, 0.85, 0.55]);
			var source = scene.Objects[shot.Source];
			var found;
			var end;

			if (type.Kind === 'tunnel') {
				tunnel(shot, source);

				return;
			}

			if (type.Kind === 'projectile') {
				shot.At = shot.From.slice();

				/*
				 * As fast as it is fired, and as its ship goes (a shot of a ship in space would be left behind): by the body its
				 * ship goes round, in its frame, as the ships there are (a body carries them round its star; a shot going on in a
				 * straight line of the world left that curve by kilometres in seconds: it missed what it was fired at).
				 */
				var round = source && source.Ship && source.Values.Vehicle && source.Values.Vehicle.Around && !scene.Ground ? scene.Objects[source.Values.Vehicle.Around] : null;

				shot.Around = round && round.World ? round.ID : '';
				/*
				 * By its ship where its step has it (its place by the body), not where it is drawn: drawn, it is by where the body
				 * was a frame ago. Regression: a planet going round its star hundreds of km a frame (time quickened), a shot began
				 * hundreds of km off its ship and never met anything.
				 */
				shot.Rel = shot.Around ? source.Ship && source.Ship.At ? vectors.Add(source.Ship.At, vectors.Subtract(shot.From, source.World)) : vectors.Subtract(shot.From, round.World) : null;

				if (shot.Rel) {
					shot.From = vectors.Add(round.World, shot.Rel);
					shot.At = shot.From.slice();
				}

				shot.Carried = shot.Around ? source.Ship.Way.slice() : source && source.WorldWay && !scene.Ground ? source.WorldWay.slice() : [0, 0, 0];
				shot.Velocity = vectors.Add(vectors.Scale(shot.Way, number(type.Speed, 40) * metre()), shot.Carried);
				shot.Flown = 0;
				shot.Trail = [shot.From.slice()];

				state.Shots.push(shot);

				return;
			}

			if (type.Kind === 'beam') {
				shot.Until = state.Clock + (shot.Hold > 0 ? shot.Hold : number(type.Hold, 0.12));
				shot.Burned = 0;
				shot.Marked = 0;

				state.Shots.push(shot);

				return;
			}

			found = trace(shot.From, shot.Way, range, shot.Source);
			end = found ? found.Point : vectors.Add(shot.From, vectors.Scale(shot.Way, range));

			if (type.Kind === 'rail') {
				streak(shot.From, end, color, number(type.Width, 0.06), 0.9, 'rail');
				streak(shot.From, end, color, number(type.Width, 0.06) * 4, 1.6, 'spiral');
			}
			else {
				streak(shot.From, end, color, number(type.Width, 0.025), Math.min(0.5, vectors.Distance(shot.From, end) / 700 + 0.06), 'tracer');
			}

			if (found)
				hit(shot, found, number(type.Damage, 10), shot.Way);
		}

		/*
		 * What a body that flies by a body (a shot of a ship in space, in the frame of what its ship goes round) meets in a
		 * step: the ships of that frame where their steps have them (by the body where the shot has it, as they go on in
		 * the step), each as far as half the size of its model, none of its own side. Regression: ships drawn a frame behind (their planet
		 * hundreds of km on since, time quickened), no shot of a ship in space met the hull it was fired at.
		 */
		function contactOf (shot, before, from, to) {
			var origin = vectors.Subtract(shot.At, shot.Rel);
			var best = null;
			var own = sideOf(scene.Objects[shot.Source]);

			scene.Order.forEach(function (object) {
				var body;
				var middle;
				var start;
				var end;
				var segment;
				var length;
				var t;
				var near;
				var reach;

				if (object.ID === shot.Source || !object.Ship || object.Hidden || !object.World || !object.Values.Vehicle || object.Values.Vehicle.Around !== shot.Around || object.Values.Aboard) return;

				/* Not one of its own side (a slug passes through its own wing). */
				if (own && sideOf(object) === own) return;

				body = engine.BodyOf ? engine.BodyOf(object) : null;
				middle = vectors.Add(vectors.Add(origin, object.Ship.At), vectors.Subtract(centerOf(object), object.World));
				reach = Math.max(body ? vectors.Distance(body.Max, body.Min) / 2 : 0, (object.Traits && object.Traits.Model && Number(object.Traits.Model.Size) || 0) * 0.5, metre());
				start = vectors.Subtract(before, vectors.Add(middle, vectors.Scale(object.Ship.Way, from)));
				end = vectors.Subtract(shot.At, vectors.Add(middle, vectors.Scale(object.Ship.Way, to)));
				segment = vectors.Subtract(end, start);
				length = vectors.Dot(segment, segment);
				t = length > 0 ? Math.max(0, Math.min(1, -vectors.Dot(start, segment) / length)) : 1;
				near = vectors.Length(vectors.Add(start, vectors.Scale(segment, t)));

				if (near <= reach && (!best || t < best.T))
					best = {T: t, Object: object, Offset: vectors.Add(start, vectors.Scale(segment, t))};
			});

			if (!best)
				return null;

			var normal = vectors.Length(best.Offset) > 0 ? vectors.Normalize(best.Offset) : vectors.Scale(shot.Way, -1);
			var drawn = vectors.Add(centerOf(best.Object), best.Offset);

			shot.At = vectors.Add(before, vectors.Scale(vectors.Subtract(shot.At, before), best.T));

			return {ID: best.Object.ID, Object: best.Object, Point: drawn, Normal: normal, Material: materialOf(best.Object, null), Part: '', Distance: 0};
		}

		/* The side of a thing: its Team, else the scene's for the hero, its ship and who sits in it. */
		function sideOf (object) {
			var hero = scene.Hero ? scene.Objects[scene.Hero] : null;
			var seated = scene.Seated && scene.Seated[scene.Hero];

			if (!object) return '';

			if (object.Values.Team || object.Team)
				return String(object.Values.Team || object.Team);

			return hero && (object === hero || seated && seated.Vehicle === object.ID) ? String(self.Team || '') : '';
		}

		/* Where a ship in space is by where its step has it (the body it goes round, now), else the middle of a thing. */
		function placeOf (object) {
			var round = object.Ship && object.Values.Vehicle && object.Values.Vehicle.Around && !scene.Ground ? scene.Objects[object.Values.Vehicle.Around] : null;

			return round && round.World ? vectors.Add(round.World, object.Ship.At) : centerOf(object);
		}

		/*
		 * What a ray of a ship in space meets: the nearest ship of its frame (where their steps have them) within half the size
		 * of its model of the ray, none of its own side. Regression: by the drawn places (thousands of km apart in a step of
		 * quick time) the lasers of ships in space met nothing.
		 */
		function rayContact (holder, from, way, range) {
			var own = sideOf(holder);
			var best = null;

			scene.Order.forEach(function (object) {
				var middle;
				var along;
				var off;
				var body;
				var reach;

				if (object === holder || !object.Ship || object.Hidden || !object.World || !object.Values.Vehicle || object.Values.Vehicle.Around !== holder.Values.Vehicle.Around || object.Values.Aboard) return;

				if (own && sideOf(object) === own) return;

				middle = placeOf(object);
				along = vectors.Dot(vectors.Subtract(middle, from), way);

				if (along < 0 || along > range || best && along > best.Distance) return;

				body = engine.BodyOf ? engine.BodyOf(object) : null;
				reach = Math.max(body ? vectors.Distance(body.Max, body.Min) / 2 : 0, (object.Traits && object.Traits.Model && Number(object.Traits.Model.Size) || 0) * 0.5, metre());
				off = vectors.Distance(middle, vectors.Add(from, vectors.Scale(way, along)));

				if (off <= reach)
					best = {ID: object.ID, Object: object, Point: centerOf(object), Normal: vectors.Scale(way, -1), Distance: along, Material: materialOf(object, null), Part: ''};
			});

			return best;
		}

		/* The shots that fly and the beams held, a step of time. */
		function step (elapsed) {
			var field = scene.Ground ? scene.Ground.Field : null;

			state.Shots = state.Shots.filter(function (shot) {
				var type = shot.Type;
				var found;

				if (type.Kind === 'beam') {
					var holder = scene.Objects[shot.Source];
					var range = number(type.Range, 400) * metre();
					var end;

					if (!holder || state.Clock > shot.Until) return false;

					/* The beam of the hero held by the button goes where the view looks. */
					if (shot.Source === gunnerID() && state.Holding)
						aimFromView(shot);

					/* One that tracks (Track: the lance) stays on its target as it burns, from the muzzle of its ship as it goes. */
					/*
					 * One that tracks holds its target while it is in its reach (by where their steps have them: drawn, in this step
					 * a ship may be by where its planet was, another by where it is, thousands of km apart in quick time). It is
					 * drawn from its ship to its target as they are drawn. Regression: the lance burnt past a raider 10 km off.
					 */
					var tracked = type.Track && shot.Target ? scene.Objects[shot.Target] : null;
					var spot = tracked && tracked.World && !tracked.Hidden ? placeOf(tracked) : null;

					if (spot) {
						shot.From = placeOf(holder);
						shot.Way = vectors.Normalize(vectors.Subtract(spot, shot.From));
					}

					/* A beam of a ship in space: from where its step has it, to the ships of its frame where theirs have them. */
					var spaced = !spot && holder.Ship && holder.Values.Vehicle && holder.Values.Vehicle.Around && !scene.Ground;
					if (spaced)
						shot.From = placeOf(holder);

					found = spot && vectors.Distance(spot, shot.From) <= range ? {ID: tracked.ID, Object: tracked, Point: centerOf(tracked), Normal: vectors.Scale(shot.Way, -1), Distance: vectors.Distance(spot, shot.From), Material: materialOf(tracked, null), Part: ''} : spot ? null : spaced ? rayContact(holder, shot.From, shot.Way, range) : trace(shot.From, shot.Way, range, shot.Source);
					shot.Struck = found ? found.ID : '';
					shot.Spaced = !!spaced;
					end = found ? found.Point : vectors.Add(shot.From, vectors.Scale(shot.Way, range));
					shot.End = end;

					/* What burns takes its damage a tenth of a second at a time, a mark where the beam stays. */
					shot.Burned += elapsed;

					if (found && shot.Burned >= 0.1) {
						hit(shot, Object.assign({}, found), number(type.Damage, 40) * shot.Burned, shot.Way);

						shot.Burned = 0;
					}

					return true;
				}

				/* A missile steers itself (SceneMissiles): its seeker, its motor, its turn; brought down, it is gone. */
				if (type.Guidance && engine.MissileGuide && engine.MissileGuide(shot, elapsed) === false) return false;

				/* In the frame of its body: where that body is now. */
				var round = shot.Around ? scene.Objects[shot.Around] : null;
				if (round && round.World && shot.Rel)
					shot.At = vectors.Add(round.World, shot.Rel);

				var substeps = Math.max(1, Math.min(64, Math.ceil(vectors.Length(shot.Velocity) * elapsed / (2 * metre()))));
				var dt = elapsed / substeps;
				var k;

				for (k = 0; k < substeps; k++) {
					var target = shot.Target ? scene.Objects[shot.Target] : null;
					var speed = vectors.Length(shot.Velocity);
					var before = shot.At.slice();
					var way;
					var moved;

					/* A homing body turns toward its target, so far a second. */
					if (target && type.Homing) {
						var wanted = vectors.Normalize(vectors.Subtract(centerOf(target), shot.At));
						var now = vectors.Normalize(shot.Velocity);
						var turn = Math.min(1, number(type.Homing, 2) * dt);

						shot.Velocity = vectors.Scale(vectors.Normalize(vectors.Add(vectors.Scale(now, 1 - turn), vectors.Scale(wanted, turn))), speed);
					}

					shot.Velocity[1] -= number(type.Gravity, 0) * metre() * dt;
					moved = vectors.Scale(shot.Velocity, dt);
					shot.At = vectors.Add(shot.At, moved);

					if (shot.Rel)
						shot.Rel = vectors.Add(shot.Rel, moved);

					/* How far it flew of its own (not as its ship went): what its Range counts. Regression: carried at the speed of its ship round its planet, a shot of 200 m was gone in its first step. */
					shot.Flown += vectors.Length(vectors.Subtract(moved, vectors.Scale(shot.Carried || [0, 0, 0], dt)));
					way = vectors.Normalize(moved);

					found = trace(before, way, vectors.Length(moved) + 0.01 * metre(), shot.Source);

					if (found) {
						shot.At = found.Point;

						shot.Trail.push(found.Point.slice());

						if (type.Stick)
							mark('chip', found.Point, found.Normal, 0.06, found.Object);

						hit(shot, found, number(type.Damage, 10), way);

						blast(shot, found.Point, found.Normal);

						if (type.Guidance && engine.MissileEnded)
							engine.MissileEnded(shot, 'hit', found.ID);

						return false;
					}

					/* A body of a ship in space meets the ships of its frame where their steps have them (see contactOf). */
					if (!type.Guidance && shot.Rel) {
						var met = contactOf(shot, before, k * dt, (k + 1) * dt);

						if (met) {
							shot.Trail.push(shot.At.slice());

							hit(shot, met, number(type.Damage, 10), way);

							blast(shot, met.Point, met.Normal);

							return false;
						}
					}

					/* A missile bursts by what it goes to as it passes (its fuse). */
					if (type.Guidance && engine.MissileFuse && engine.MissileFuse(shot, before, k * dt, (k + 1) * dt)) return false;

					/* (A slug out of a tunnel flies four times its Exit at most.) */
					if (shot.Flown > (shot.Out ? number(type.Exit, 3000) * 4 : number(type.Range, 200) * (type.Arc ? 3 : 1)) * metre() || field && shot.At[1] < -500) {
						if (type.Guidance && engine.MissileEnded)
							engine.MissileEnded(shot, 'spent', '');

						return false;
					}
				}

				if (shot.Trail.length > 24)
					shot.Trail.shift();

				shot.Trail.push(shot.At.slice());

				return true;
			});

			state.Streaks = state.Streaks.filter(function (one) {
				return state.Clock - one.Born < one.Lasts;
			});

			/* The marks that are too old fade out, then go. */
			var keep = number(self.MarkSeconds, 60);
			var before = state.Marks.length;

			state.Marks = state.Marks.filter(function (one) {
				return state.Clock - one.Born < keep && (!one.Object || scene.Objects[one.Object]);
			});

			if (state.Marks.length !== before)
				state.MarksVersion++;

			state.Spread = Math.max(0, state.Spread - elapsed * 3);
		}

		/*
		 * Who shoots for the hero: a turret it mans (SceneTactics, HeroTurret: {ID of its vehicle, Weapon, From}), else itself
		 * with the Weapon it has: {ID, Object, Weapon, From (null: its muzzle)}; null for none.
		 */
		function gunner () {
			var hero = scene.Objects[scene.Hero];
			var turret = engine.HeroTurret ? engine.HeroTurret() : null;
			if (turret && scene.Objects[turret.ID])
				return {ID: turret.ID, Object: scene.Objects[turret.ID], Weapon: turret.Weapon, From: turret.From, Turret: true};

			return hero && hero.Values.Weapon ? {ID: hero.ID, Object: hero, Weapon: hero.Values.Weapon, From: null, Turret: false} : null;
		}

		function gunnerID () {
			var shooter = scene.Hero ? gunner() : null;

			return shooter ? shooter.ID : scene.Hero;
		}

		engine.HeroGunner = gunner;

		/* The aim of the hero: from its muzzle toward what the middle of the view shows. */
		function aimFromView (shot) {
			var shooter = gunner();
			var ray = engine.Ray(scene.Width / 2, scene.Height / 2);
			var range = number(shot.Type.Range, 300) * metre();
			var found = shooter ? trace(ray.Origin, ray.Direction, range + 50 * metre(), shooter.ID) : null;
			var point = found ? found.Point : vectors.Add(ray.Origin, vectors.Scale(ray.Direction, range));

			if (!shooter) return;

			shot.From = shooter.From || muzzleOf(shooter.Object, point);
			shot.Way = vectors.Normalize(vectors.Subtract(point, shot.From));
		}

		/*
		 * The right trigger of a pad (a pad on the screen too) held: the hero on foot with a weapon fires as the left button
		 * does, where the middle of the view is (a beam burns while it is held). In a vehicle the trigger is its gas.
		 * Regression: each demo held the trigger by a timer of its own.
		 */
		function padTrigger () {
			var shooter = gunner();
			if (!shooter || !shooter.Turret && shooter.Object.Values.Vehicle) return false;

			return self.$Service('InputDevices').Axes().RightTrigger > 0.5;
		}

		function heroFire () {
			var shooter = gunner();
			var type = shooter ? typeOf(shooter.Weapon) : null;
			var ray;
			var range;
			var found;
			var point;

			if (!type || !scene.Width) return false;

			ray = engine.Ray(scene.Width / 2, scene.Height / 2);
			range = number(type.Range, 300) * metre();
			found = trace(ray.Origin, ray.Direction, range + 50 * metre(), shooter.ID);
			point = found ? found.Point : vectors.Add(ray.Origin, vectors.Scale(ray.Direction, range));

			/* A beam held is one shot made longer. */
			if (type.Kind === 'beam') {
				var held = state.Shots.filter(function (shot) {
					return shot.Source === shooter.ID && shot.Type === type;
				})[0];

				if (held) {
					held.Until = state.Clock + 0.12;

					return true;
				}
			}

			return shooter.Turret ? engine.Fire(shooter.ID, {At: point, Weapon: shooter.Weapon, From: shooter.From}) : engine.Fire(shooter.ID, {At: point});
		}

		/* The lock of the hero: what stays under its aim, the nearest to the middle, seen. */
		function lockedFirst () {
			var ids = Object.keys(state.Locks).filter(function (id) {
				return state.Locks[id].Locked;
			});

			return ids[0] || '';
		}

		function locking (elapsed) {
			var hero = scene.Objects[scene.Hero];
			var shooter = hero ? gunner() : null;
			var type = shooter ? typeOf(shooter.Weapon) : null;
			var lock = type && type.Lock;
			var cone;
			var range;
			var ray;
			var candidates;

			if (!lock || !scene.Width) {
				Object.keys(state.Locks).forEach(function (id) {
					if (state.Locks[id].Locked)
						self.$Emit('unlock', {ID: id});
				});

				state.Locks = {};

				return;
			}

			cone = number(lock.Cone, 6) * Math.PI / 180;
			range = number(type.Range, 300) * metre();
			ray = engine.Ray(scene.Width / 2, scene.Height / 2);

			candidates = Object.keys(scene.Objects).map(function (id) {
				var object = scene.Objects[id];
				var middle;
				var way;
				var far;
				var angle;
				var seen;

				if (id === scene.Hero || id === shooter.ID || object.Values.Aboard === shooter.ID || !object.World || object.Hidden || object.Owner || !targetable(object, true)) return null;

				if (hero.Team && object.Team && String(hero.Team) === String(object.Team)) return null;

				middle = centerOf(object);
				way = vectors.Subtract(middle, ray.Origin);
				far = vectors.Length(way);

				if (far > range) return null;

				angle = Math.acos(Math.max(-1, Math.min(1, vectors.Dot(vectors.Scale(way, 1 / far), ray.Direction))));

				if (angle > cone) return null;

				seen = trace(ray.Origin, vectors.Scale(way, 1 / far), far + 1, shooter.ID);

				if (seen && seen.ID !== id && seen.Distance < far - heightOf(object)) return null;

				return {ID: id, Angle: angle};
			}).filter(Boolean).sort(function (a, b) {
				return a.Angle - b.Angle;
			}).slice(0, Math.max(1, number(lock.Count, 1)));

			var keep = {};

			candidates.forEach(function (one) {
				var was = state.Locks[one.ID] || {Progress: 0, Locked: false};

				was.Progress = Math.min(1, was.Progress + elapsed / Math.max(0.05, number(lock.Time, 0.8)));

				if (was.Progress >= 1 && !was.Locked) {
					was.Locked = true;

					self.$Emit('lock', {ID: one.ID, Weapon: shooter.Weapon});
				}

				keep[one.ID] = was;
			});

			/* A target gone from the aim lets go slowly: a moment of looking away keeps it. */
			Object.keys(state.Locks).forEach(function (id) {
				var was = state.Locks[id];

				if (keep[id] || !scene.Objects[id]) return;

				was.Progress -= elapsed * 1.5;

				if (was.Progress > 0 && was.Locked && was.Progress > 0.5) {
					keep[id] = was;

					return;
				}

				if (was.Locked)
					self.$Emit('unlock', {ID: id});
			});

			state.Locks = keep;
		}

		engine.WeaponsStep = function (elapsed) {
			/* Its own clock: the shots go on in a scene whose days are Paused. */
			state.Clock += elapsed;

			if ((state.Holding || padTrigger()) && scene.Hero)
				heroFire();

			/* What charged fires. */
			Object.keys(state.Charging).forEach(function (key) {
				var one = state.Charging[key];

				if (!scene.Objects[one.ID]) {
					delete state.Charging[key];

					return;
				}

				if (state.Clock < one.Until) return;

				delete state.Charging[key];
				engine.Fire(one.ID, one.Settings);
			});

			tunnelsStep();

			step(elapsed);

			locking(elapsed);

			/* The view of the hero kicks up with each shot, then settles. */
			if (state.Kick > 0.0001) {
				var taken = engine.CameraShake({Kick: state.Kick, Elapsed: elapsed}).KickTaken;

				scene.Pitch = Math.max(-1.3, scene.Pitch - taken);
				state.Kick -= taken;
			}

			aimLayer();
		};

		engine.WeaponsHold = function (on) {
			state.Holding = !!on;

			if (on)
				heroFire();
		};

		engine.WeaponTrace = trace;

		/* For SceneMissiles: a hit, a blast, a streak of light, the middle and the material of a thing. */
		engine.WeaponsHit = hit;

		engine.WeaponsBlast = blast;

		engine.WeaponsStreak = streak;

		engine.WeaponsCenter = centerOf;

		engine.WeaponsMaterial = materialOf;

		engine.WeaponsContact = contactOf;

		/* How far a weapon of an object has charged (0 to 1), -1 when it does not charge now. */
		engine.WeaponsCharge = function (id, name) {
			var one = state.Charging[id + ':' + name];

			return one ? Math.min(1, (state.Clock - one.Born) / Math.max(0.01, one.Until - one.Born)) : -1;
		};

		/* The crosshair and the locks over the view. */
		function aimLayer () {
			var layer = self.$Element().querySelector('.elemenx-scene-aim');
			var hero = scene.Objects[scene.Hero];
			var shooter = hero ? gunner() : null;
			var type = shooter ? typeOf(shooter.Weapon) : null;
			var kind = self.Crosshair || type && type.Crosshair || 'cross';
			var cross;
			var marked = state.Marked && state.Clock - state.Marked.At < 0.18 ? state.Marked : null;
			var html = [];

			if (!layer) return;

			if (!type || kind === 'none') {
				if (layer.innerHTML)
					layer.innerHTML = '';

				return;
			}

			cross = layer.querySelector('.elemenx-scene-crosshair');

			if (!cross) {
				layer.innerHTML = '<div class="elemenx-scene-crosshair"><i></i><i></i><i></i><i></i></div>';
				cross = layer.querySelector('.elemenx-scene-crosshair');
			}

			cross.className = 'elemenx-scene-crosshair is-' + kind + (marked ? marked.Kill ? ' kill' : ' hit' : '');

			cross.style.setProperty('--elemenx-scene-aim-spread', (6 + state.Spread * 6 + (hero.Walking ? 6 : 0)).toFixed(1) + 'px');

			Object.keys(state.Locks).forEach(function (id) {
				var object = scene.Objects[id];
				var spot;
				var x;
				var y;
				var off;

				if (!object) return;

				spot = scene.Camera.Project(centerOf(object), scene.Width, scene.Height);
				x = spot.X;
				y = spot.Y;
				off = !spot.Visible || x < 0 || y < 0 || x > scene.Width || y > scene.Height;

				if (off) {
					var dx = x - scene.Width / 2;
					var dy = y - scene.Height / 2;
					var reach = Math.min((scene.Width / 2 - 24) / Math.max(1e-3, Math.abs(dx)), (scene.Height / 2 - 24) / Math.max(1e-3, Math.abs(dy)));

					if (!spot.Visible) {
						dx = -dx;
						dy = -dy;
					}

					x = scene.Width / 2 + dx * reach;
					y = scene.Height / 2 + dy * reach;
				}

				html.push('<div class="elemenx-scene-lock' + (state.Locks[id].Locked ? ' locked' : '') + (off ? ' off' : '') + '" data-id="' + String(id).replace(/"/g, '') + '" style="left: ' + x.toFixed(1) + 'px; top: ' + y.toFixed(1) + 'px; --elemenx-scene-lock-close: ' + state.Locks[id].Progress.toFixed(3) + '; --elemenx-scene-lock-turn: ' + (off ? Math.atan2(y - scene.Height / 2, x - scene.Width / 2) : 0).toFixed(3) + 'rad"></div>');
			});

			var locks = layer.querySelector('.elemenx-scene-locks');

			if (!locks) {
				locks = document.createElement('div');
				locks.className = 'elemenx-scene-locks';

				layer.appendChild(locks);
			}

			if (locks.innerHTML !== html.join(''))
				locks.innerHTML = html.join('');
		}

		/* The lights of the shots: streaks, beams, bodies that fly and their trails; the marks where they hit. */
		engine.WeaponsDraw = function (matrix) {
			var eye = scene.Eye || [0, 0, 0];
			var ribbons = {Positions: [], UVs: [], Colors: [], Indices: []};
			var smoke = {Positions: [], UVs: [], Colors: [], Indices: []};
			var now = state.Clock;

			if (!renderer) return;

			if (!programs)
				programs = {Streak: renderer.Program(shaders.StreakVertex, shaders.Streak), Mark: renderer.Program(shaders.MarkVertex, shaders.Mark)};

			/*
			 * The width of a streak of light seen at least so many pixels wide (at its point nearest the eye): a beam of 3 m
			 * kilometres off is thinner than a pixel. Regression: the lance burnt on a raider 10 km off, unseen.
			 */
			function seen (a, b, width, pixels) {
				var line = vectors.Subtract(b, a);
				var length = vectors.Dot(line, line);
				var t = length > 0 ? Math.max(0, Math.min(1, vectors.Dot(vectors.Subtract(eye, a), line) / length)) : 0;
				var far = vectors.Distance(eye, vectors.Add(a, vectors.Scale(line, t)));
				var pixel = 2 * Math.tan((scene.Camera && scene.Camera.Fov || 60) * Math.PI / 360) / Math.max(1, scene.Height || 600);

				return Math.max(width, far * pixel * pixels);
			}

			engine.WeaponsSeen = seen;

			function ribbon (into, a, b, width, color, alpha, round) {
				var pa = vectors.Subtract(a, eye);
				var pb = vectors.Subtract(b, eye);
				var along = vectors.Subtract(pb, pa);
				var side = vectors.Cross(along, vectors.Add(pa, vectors.Scale(along, 0.5)));
				var length = vectors.Length(side);
				var base = into.Positions.length / 3;

				if (length < 1e-9) return;

				side = vectors.Scale(side, width / length);

				[[pa, -1, 0], [pa, 1, 0], [pb, 1, 1], [pb, -1, 1]].forEach(function (corner) {
					var p = vectors.Add(corner[0], vectors.Scale(side, corner[1]));

					into.Positions.push(p[0], p[1], p[2]);
					into.UVs.push(corner[1], round ? corner[2] * 2 - 1 : 0);
					into.Colors.push(color[0], color[1], color[2], alpha);
				});

				into.Indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
			}

			state.Streaks.forEach(function (one) {
				var age = (now - one.Born) / one.Lasts;
				var fade = 1 - age;
				var i;

				if (one.Kind === 'tracer') {
					/* A tracer is a short dash that flies along the ray. */
					var length = vectors.Distance(one.From, one.To);
					var way = vectors.Scale(vectors.Subtract(one.To, one.From), 1 / Math.max(1e-6, length));
					var head = Math.min(length, age * length * 1.15 + metre());
					var tail = Math.max(0, head - Math.min(6 * metre(), length * 0.4));

					ribbon(ribbons, vectors.Add(one.From, vectors.Scale(way, tail)), vectors.Add(one.From, vectors.Scale(way, head)), one.Width, vectors.Scale(one.Color, 3), 1, false);
				}
				else if (one.Kind === 'rail') {
					ribbon(ribbons, one.From, one.To, one.Width * (1 + age * 2), vectors.Scale(one.Color, 5 * fade * fade), 1, false);
				}
				else {
					/* The spiral the rail leaves: a coil round its line, widening as it fades. */
					var span = vectors.Distance(one.From, one.To);
					var axis = vectors.Scale(vectors.Subtract(one.To, one.From), 1 / Math.max(1e-6, span));
					var u = vectors.Normalize(vectors.Cross(axis, Math.abs(axis[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]));
					var w = vectors.Cross(axis, u);
					var turns = Math.min(300, Math.ceil(span / 0.6));
					var radius = one.Width * (0.4 + age * 1.6);
					var last = null;

					for (i = 0; i <= turns * 12; i++) {
						var t = i / (turns * 12);
						var angle = t * turns * Math.PI * 2;
						var point = vectors.Add(vectors.Add(one.From, vectors.Scale(axis, t * span)), vectors.Add(vectors.Scale(u, Math.cos(angle) * radius), vectors.Scale(w, Math.sin(angle) * radius)));

						if (last)
							ribbon(ribbons, last, point, one.Width * 0.12, vectors.Scale(one.Color, 1.6 * fade), 1, false);

						last = point;
					}
				}
			});

			state.Shots.forEach(function (shot) {
				var type = shot.Type;
				var color = colorOf(type.Color, [1, 0.85, 0.55]);
				var size = number(type.Size, 0.1) * metre();
				var i;

				if (type.Kind === 'beam') {
					if (!shot.End) return;

					/* One that tracks: from its ship to its target as they are drawn now. */
					if (type.Track && shot.Target && scene.Objects[shot.Target] && scene.Objects[shot.Source] && vectors.Distance(placeOf(scene.Objects[shot.Target]), placeOf(scene.Objects[shot.Source])) <= number(type.Range, 400) * metre()) {
						var lanceFrom = centerOf(scene.Objects[shot.Source]);
						var lanceTo = centerOf(scene.Objects[shot.Target]);

						ribbon(ribbons, lanceFrom, lanceTo, seen(lanceFrom, lanceTo, number(type.Width, 0.05) * metre(), 2), vectors.Scale(color, 6), 1, false);
						ribbon(ribbons, lanceFrom, lanceTo, seen(lanceFrom, lanceTo, number(type.Width, 0.05) * 5 * metre(), 6), vectors.Scale(color, 0.8), 1, false);

						return;
					}

					/* A beam of a ship in space: from its ship to what it struck as they are drawn now (else on along its way). */
					var beamFrom = shot.From;
					var beamTo = shot.End;

					if (shot.Spaced && scene.Objects[shot.Source]) {
						beamFrom = centerOf(scene.Objects[shot.Source]);
						beamTo = shot.Struck && scene.Objects[shot.Struck] ? centerOf(scene.Objects[shot.Struck]) : vectors.Add(beamFrom, vectors.Subtract(shot.End, shot.From));
					}

					ribbon(ribbons, beamFrom, beamTo, seen(beamFrom, beamTo, number(type.Width, 0.05) * metre(), 1.5), vectors.Scale(color, 6), 1, false);
					ribbon(ribbons, beamFrom, beamTo, seen(beamFrom, beamTo, number(type.Width, 0.05) * 5 * metre(), 4), vectors.Scale(color, 0.8), 1, false);

					return;
				}

				/* The body: a glowing dash along its flight; its trail behind it, of light or of smoke. */
				var way = vectors.Normalize(shot.Velocity);

				ribbon(ribbons, vectors.Subtract(shot.At, vectors.Scale(way, size * 3)), vectors.Add(shot.At, vectors.Scale(way, size)), size, vectors.Scale(color, 4), 1, true);

				for (i = 1; i < shot.Trail.length; i++) {
					var part = i / shot.Trail.length;

					if (type.Trail === 'smoke') ribbon(smoke, shot.Trail[i - 1], shot.Trail[i], (0.12 + (1 - part) * 0.5) * metre(), [0.6, 0.6, 0.62], 0.28 * part, false);
					else if (type.Trail === 'thin') ribbon(ribbons, shot.Trail[i - 1], shot.Trail[i], 0.01 * metre(), vectors.Scale(color, 0.5 * part), 1, false);
					else if (type.Trail === 'exhaust') ribbon(ribbons, shot.Trail[i - 1], shot.Trail[i], size * (0.4 + (1 - part) * 1.6), vectors.Scale(color, 0.9 * part * part), 1, false);
					else ribbon(ribbons, shot.Trail[i - 1], shot.Trail[i], size * 0.6 * part, vectors.Scale(color, 1.5 * part), 1, false);
				}
			});

			/* A weapon charging: a glow at its muzzle, growing. */
			Object.keys(state.Charging).forEach(function (key) {
				var one = state.Charging[key];
				var object = scene.Objects[one.ID];
				var part = Math.min(1, (now - one.Born) / Math.max(0.01, one.Until - one.Born));
				var at;
				var size;

				if (!object || !object.World) return;

				at = muzzleOf(object, null);
				size = number(one.Type.Width, 1) * metre() * (1 + part * 6);

				ribbon(ribbons, vectors.Subtract(at, [0, size, 0]), vectors.Add(at, [0, size, 0]), size, vectors.Scale(colorOf(one.Type.Color, [0.7, 0.85, 1]), 2 + part * 8), 1, true);
			});

			/* The flares of SceneMissiles. */
			if (engine.MissilesDraw)
				engine.MissilesDraw(function (a, b, width, color, alpha, round) {
					ribbon(ribbons, a, b, width, color, alpha, round);
				});

			drawMarks(matrix);

			[[smoke, 'alpha'], [ribbons, 'add']].forEach(function (pass) {
				var mesh;

				if (!pass[0].Indices.length) return;

				mesh = renderer.Mesh(pass[0]);

				engine.DrawReady(mesh, programs.Streak, {uViewProjection: matrix, uSmoke: pass[1] === 'alpha' ? 1 : 0}, {Blend: pass[1], DepthWrite: false, Cull: 'none'});

				mesh.Destroy();
			});
		};

		/* The marks: one mesh, made again when one comes or goes, or when a thing that carries one moved. */
		function drawMarks (matrix) {
			var moved = false;
			var ground = scene.Ground;

			if (!state.Marks.length) return;

			state.Marks.forEach(function (one) {
				var object = one.Object ? scene.Objects[one.Object] : null;
				var turn;
				var point;

				if (!object || !object.World) return;

				turn = object.Turn || null;
				point = vectors.Add(object.World, turn ? applyNormal(turn, one.Local) : one.Local);

				if (vectors.Distance(point, one.Point) > 0.001) {
					one.Point = point;
					one.Normal = turn ? vectors.Normalize(applyNormal(turn, one.LocalNormal)) : one.LocalNormal;
					moved = true;
				}
			});

			if (moved || state.MarksBuilt !== state.MarksVersion || !state.MarksMesh) {
				var geometry = {Positions: [], Normals: [], UVs: [], Colors: [], Indices: []};

				state.Marks.forEach(function (one, index) {
					var n = vectors.Normalize(one.Normal);
					var u = vectors.Normalize(vectors.Cross(n, Math.abs(n[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]));
					var w = vectors.Cross(n, u);
					var angle = one.Seed * Math.PI * 2;
					var a = vectors.Add(vectors.Scale(u, Math.cos(angle)), vectors.Scale(w, Math.sin(angle)));
					var b = vectors.Cross(n, a);
					var lift = vectors.Add(one.Point, vectors.Scale(n, 0.006 + index * 0.00002));

					[[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (corner) {
						var p = vectors.Add(lift, vectors.Add(vectors.Scale(a, corner[0] * one.Size), vectors.Scale(b, corner[1] * one.Size)));

						geometry.Positions.push(p[0], p[1], p[2]);
						geometry.Normals.push(n[0], n[1], n[2]);
						geometry.UVs.push(corner[0], corner[1]);
						geometry.Colors.push(marksKinds[one.Kind] || 0, one.Seed, one.Born, one.Size);
					});

					geometry.Indices.push(index * 4, index * 4 + 1, index * 4 + 2, index * 4, index * 4 + 2, index * 4 + 3);
				});

				if (state.MarksMesh)
					state.MarksMesh.Destroy();

				state.MarksMesh = renderer.Mesh(geometry);
				state.MarksBuilt = state.MarksVersion;
			}

			engine.DrawReady(state.MarksMesh, programs.Mark, {uViewProjection: matrix, uEye: scene.Eye || [0, 0, 0], uSun: ground ? ground.Sun : [0.3, 0.8, 0.5], uSunColor: ground ? ground.SunColor : [1, 1, 1], uSky: ground ? ground.SkyLight : [0.3, 0.3, 0.32], uTime: state.Clock, uKeep: number(self.MarkSeconds, 60)}, {Blend: 'over', DepthWrite: false, Depth: 'lequal', Cull: 'none'});
		}

		engine.WeaponsMarked = function (id, kill) {
			state.Marked = {At: state.Clock, Kill: !!kill, Target: id};
		};
	},

	/* Weapon types of its own, or changed ones (each over the one of its name): {name: {Kind, Damage, Rate...}}. */
	Weapons: function (types) {
		var scene = this.Scene();

		Object.keys(types || {}).forEach(function (name) {
			scene.WeaponTypes[name] = Object.assign({}, scene.WeaponTypes[name] || {}, types[name]);
		});

		return Object.keys(scene.WeaponTypes);
	},

	/* What hits do, by material and by type of weapon: {material | type | 'type/material': {Effect, Decal, Factor}}. */
	HitRules: function (rules) {
		var scene = this.Scene();

		Object.keys(rules || {}).forEach(function (key) {
			scene.HitRules[key] = Object.assign({}, scene.HitRules[key] || {}, rules[key]);
		});

		return scene.HitRules;
	},

	/* A shot of the weapon of an object: Fire(id, {At, Way, Weapon, Spread, From, Hold}); false while it is not ready. */
	Fire: function (id, options) {
		var engine = this.Engine();

		return !!(engine && engine.Fire && engine.Fire(id, options));
	},

	/* The targets the hero has locked (the Lock of its weapon). */
	Locked: function () {
		var state = this.Scene().Weapons;

		return state ? Object.keys(state.Locks).filter(function (id) {
			return state.Locks[id].Locked;
		}) : [];
	},

	/* What a ray of the world meets, as a shot would: {ID, Point, Normal, Distance, Material, Part} or null. */
	Trace: function (from, way, range) {
		var engine = this.Engine();
		var found = engine && engine.WeaponTrace ? engine.WeaponTrace(from, this.$Service('Math').Vectors.Normalize(way), Number(range) || 300, '') : null;

		return found ? {ID: found.ID, Point: found.Point, Normal: found.Normal, Distance: found.Distance, Material: found.Material, Part: found.Part} : null;
	},

	/* The marks of the shots there are: [{Kind, Point, Normal, Size, Object}]. */
	Marks: function () {
		var state = this.Scene().Weapons;

		return state ? state.Marks.map(function (one) {
			return {Kind: one.Kind, Point: one.Point.slice(), Normal: one.Normal.slice(), Size: one.Size, Object: one.Object};
		}) : [];
	},

	/* The crosshair shows a kill: red for a moment (a game tells it, Vitals death of what the hero hit). */
	Killed: function (id) {
		var engine = this.Engine();
		if (engine && engine.WeaponsMarked)
			engine.WeaponsMarked(id, true);
	},

	/* The left button fires the weapon of the hero (or the turret it mans) while the pointer is taken. */
	WeaponsPointer: function (kind, event) {
		var scene = this.Scene();
		var engine = this.Engine();
		var hero = scene.Hero ? scene.Objects[scene.Hero] : null;

		if (!engine || !engine.WeaponsHold || !hero || !(engine.HeroGunner && engine.HeroGunner()) || event.button !== 0 && kind === 'down' || !this.Captured()) {
			if (kind === 'up' && engine && engine.WeaponsHold)
				engine.WeaponsHold(false);

			return false;
		}

		if (kind === 'down') {
			engine.WeaponsHold(true);

			return true;
		}

		if (kind === 'up')
			engine.WeaponsHold(false);

		return false;
	},

	WeaponShaders: function (head) {
		return {
			StreakVertex: head + [
				'in vec3 aPosition;',
				'in vec2 aUV;',
				'in vec4 aColor;',
				'uniform mat4 uViewProjection;',
				'out vec2 vAt;',
				'out vec4 vColor;',
				'void main() {',
				'	vAt = aUV;',
				'	vColor = aColor;',
				'	gl_Position = uViewProjection * vec4(aPosition, 1.0);',
				'}'
			].join('\n'),

			/* A streak of light, brightest along its middle; or of smoke, soft at its edges. */
			Streak: head + [
				'in vec2 vAt;',
				'in vec4 vColor;',
				'uniform float uSmoke;',
				'out vec4 outColor;',
				'void main() {',
				'	float across = 1.0 - abs(vAt.x);',
				'	float end = 1.0 - vAt.y * vAt.y;',
				'	if (uSmoke > 0.5) {',
				'		outColor = vec4(vColor.rgb, vColor.a * across * across);',
				'		return;',
				'	}',
				'	float core = pow(across, 6.0) * 1.5 + pow(across, 2.0) * 0.5;',
				'	outColor = vec4(vColor.rgb * core * end, 1.0);',
				'}'
			].join('\n'),

			MarkVertex: head + [
				'in vec3 aPosition;',
				'in vec3 aNormal;',
				'in vec2 aUV;',
				'in vec4 aColor;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uEye;',
				'out vec2 vAt;',
				'out vec4 vMark;',
				'out vec3 vNormal;',
				'void main() {',
				'	vAt = aUV;',
				'	vMark = aColor;',
				'	vNormal = aNormal;',
				'	gl_Position = uViewProjection * vec4(aPosition - uEye, 1.0);',
				'}'
			].join('\n'),

			/*
			 * A mark of a shot, drawn of its kind: a hole (dark, a torn ring), a dent (bright scratched metal round a dark
			 * middle), a chip (light splinters of wood), a pit (earth thrown round), a scorch (soot, glowing at first) and a
			 * crack (the star of a broken glass). Lit by the sun and the sky; it fades before it goes.
			 */
			Mark: head + [
				'in vec2 vAt;',
				'in vec4 vMark;',
				'in vec3 vNormal;',
				'uniform vec3 uSun;',
				'uniform vec3 uSunColor;',
				'uniform vec3 uSky;',
				'uniform float uTime;',
				'uniform float uKeep;',
				'out vec4 outColor;',
				this.$Service('Noise').GLSLChunk(['enx_white2']),
				'float hash(vec2 p) { return enx_white2(p); }',
				'float noise(vec2 p) {',
				'	vec2 i = floor(p);',
				'	vec2 f = fract(p);',
				'	f = f * f * (3.0 - 2.0 * f);',
				'	return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);',
				'}',
				'void main() {',
				'	float kind = vMark.x;',
				'	float seed = vMark.y * 97.0;',
				'	float age = uTime - vMark.z;',
				'	float r = length(vAt);',
				'	float angle = atan(vAt.y, vAt.x);',
				'	float rough = noise(vec2(angle * 3.0 + seed, seed)) * 0.25 + noise(vAt * 6.0 + seed) * 0.2;',
				'	vec3 color = vec3(0.0);',
				'	float alpha = 0.0;',
				'	vec3 glow = vec3(0.0);',
				'	if (kind < 0.5) {',
				'		float core = 1.0 - smoothstep(0.18, 0.28 + rough * 0.2, r);',
				'		float ring = (1.0 - smoothstep(0.3, 0.9 + rough, r)) * 0.55;',
				'		color = mix(vec3(0.12, 0.11, 0.1), vec3(0.02), core);',
				'		alpha = max(core, ring * (0.5 + 0.5 * noise(vAt * 9.0 + seed)));',
				'	}',
				'	else if (kind < 1.5) {',
				'		float core = 1.0 - smoothstep(0.15, 0.25, r);',
				'		float rim = smoothstep(0.2, 0.3, r) * (1.0 - smoothstep(0.35, 0.6 + rough, r));',
				'		color = mix(vec3(0.75, 0.74, 0.72), vec3(0.05), core);',
				'		alpha = max(core, rim * 0.8);',
				'	}',
				'	else if (kind < 2.5) {',
				'		float splinters = step(0.55, noise(vec2(angle * 5.0 + seed, r * 3.0))) * (1.0 - smoothstep(0.25, 1.0, r));',
				'		float core = 1.0 - smoothstep(0.15, 0.3, r);',
				'		color = mix(vec3(0.82, 0.68, 0.46), vec3(0.15, 0.1, 0.06), core);',
				'		alpha = max(core, splinters);',
				'	}',
				'	else if (kind < 3.5) {',
				'		float pit = 1.0 - smoothstep(0.25, 0.55 + rough, r);',
				'		float thrown = (1.0 - smoothstep(0.4, 1.0, r)) * step(0.5, noise(vAt * 7.0 + seed));',
				'		color = mix(vec3(0.2, 0.16, 0.12), vec3(0.06, 0.05, 0.04), pit);',
				'		alpha = max(pit * 0.9, thrown * 0.6);',
				'	}',
				'	else if (kind < 4.5) {',
				'		float soot = (1.0 - smoothstep(0.2, 1.0, r + rough * 0.6 - 0.1));',
				'		color = vec3(0.03, 0.025, 0.02);',
				'		alpha = soot * 0.85;',
				'		glow = vec3(1.0, 0.35, 0.08) * exp(-age * 1.5) * (1.0 - smoothstep(0.0, 0.5, r)) * 3.0;',
				'	}',
				'	else {',
				'		float lines = 0.0;',
				'		for (int k = 0; k < 7; k++) {',
				'			float a = (float(k) + hash(vec2(seed, float(k)))) / 7.0 * 6.2832;',
				'			vec2 d = vec2(cos(a), sin(a));',
				'			float along = dot(vAt, d);',
				'			float off = abs(dot(vAt, vec2(-d.y, d.x)) + sin(along * 14.0 + seed) * 0.02);',
				'			lines = max(lines, step(0.0, along) * (1.0 - smoothstep(0.0, 0.015, off)) * (1.0 - smoothstep(0.3, 1.0, along)));',
				'		}',
				'		float rings = (1.0 - smoothstep(0.004, 0.014, abs(r - 0.35 - rough * 0.2))) * 0.7;',
				'		color = vec3(0.9, 0.95, 1.0);',
				'		alpha = max(max(lines, rings), 1.0 - smoothstep(0.04, 0.08, r)) * 0.8;',
				'	}',
				'	if (r > 1.0) alpha = 0.0;',
				'	alpha *= 1.0 - smoothstep(uKeep * 0.8, uKeep, age);',
				'	if (alpha < 0.01) discard;',
				'	vec3 n = normalize(vNormal);',
				'	vec3 light = uSky * 1.2 + uSunColor * max(dot(n, normalize(uSun)), 0.0);',
				'	outColor = vec4(pow(pow(color, vec3(2.2)) * light + glow, vec3(1.0 / 2.2)), alpha);',
				'}'
			].join('\n')
		};
	}
});
