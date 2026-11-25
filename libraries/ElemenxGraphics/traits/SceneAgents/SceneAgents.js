/*
 * SceneAgents: what flies, drives or walks by a mind of its own: a tree of behaviour of the Blueprints Service (a graph of
 * kind behaviour, run by its Agent), its tasks done here. An object is an agent with Values.Agent {Brain (a graph of the
 * scene's Graphs or of the library: ai/fighter by default), Leader (the ID it flies by), Slot ([right, up, ahead] metres of
 * the leader, [30, 0, -30]), Patrol (the IDs or the points of the world it goes round), Home (an ID or a point to go back
 * to), Range (metres it sees, 4 times its weapon's), Every (seconds between its thoughts, 0.2), Closing (m/s it closes
 * on or draws off from its enemy by at most, 1000), Run (metres of its runs at its enemy at most, 3000), Accel (m/s² its
 * way changes by at most in a fight, 500: SceneVehicles)}; a ship of the player or a
 * walker the player plays is none while it is played.
 *
 * Each thought it knows (its board, the Input blocks of its tree read it): Health and Shield (0 to 1), Threat (how near
 * the nearest of another team is, 0 to 1), Hurt (how hard it was hit lately, fading), EnemyNear, HasLeader, HasPatrol and
 * its order (OrderAttack, OrderForm, OrderHold, OrderRetreat: 0 or 1), Incoming (how soon a missile meets it, SceneMissiles:
 * 1 now, 0 in 8 seconds or more). Its tasks (Task blocks by Name): follow (its place by its leader), attack (runs at its
 * enemy, its weapon fired while it is turned to it and in its range, its missiles launched at it locked, its torpedoes
 * at one of Health Big (500) or more, its lance at it in its reach), evade (aside
 * and away a while), defend (flares out and a hard turn across the way a missile comes), retreat (away from its enemy, or home), patrol (round its points), hold (on as it goes). A ship does
 * them by its autopilot (SceneVehicles: Autopilot); its attack on a ship is on its tail, its nose on it. Of another team: of a Team of its own, else of the scene's (the hero
 * and its ship); with no team, of none.
 *
 * AgentOrder(ids, order, target) gives agents an order (attack: at target, or what they see; form: by their leader;
 * hold; retreat; '' none): how many took it. AgentOf(id) is {Brain, Task, Board, Running, Order, Enemy}, null for no
 * agent. The event agent tells a task begun: {ID, Task, Enemy}.
 */
Elemenx.Trait('SceneAgents', {
	AgentsStart: function () {
		var self = this;
		var scene = this.Scene();
		var engine = this.Engine();
		var math = this.$Service('Math');
		var vectors = math.Vectors;
		var blueprints = this.$Service('Blueprints');
		var records = scene.Agents = scene.Agents || {};
		var minds = [];

		function number (value, fallback) {
			return value === null || value === undefined || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		/* A metre in units of the scene (real sizes of space: tiny). */
		function metre () {
			return engine.Metre && engine.Metre() || 1;
		}

		function settingsOf (object) {
			var given = object && object.Values ? object.Values.Agent : null;

			return given && typeof given === 'object' ? given : given ? {} : null;
		}

		/* The team of an object: its own, else the scene's for the hero, its ship and who sits in it. */
		function teamOf (object) {
			var hero = scene.Hero ? scene.Objects[scene.Hero] : null;
			var seated = scene.Seated && scene.Seated[scene.Hero];

			if (object.Values.Team)
				return String(object.Values.Team);

			if (hero && (object === hero || object.ID === hero.Pilot || seated && seated.Vehicle === object.ID)) return String(self.Team || '');

			return '';
		}

		function alive (object) {
			return !!object && !!object.World && !object.Hidden && !(object.Values.Health !== undefined && object.Values.Health !== '' && Number(object.Values.Health) <= 0);
		}

		function pointOf (given) {
			var object = typeof given === 'string' ? scene.Objects[given] : null;

			if (Array.isArray(given)) return given;

			return object && object.World ? object.World : null;
		}

		/* The weapon of an object, its type (Weapons of the scene). */
		function weaponOf (object) {
			var name = object.Values.Weapon;

			return name && scene.WeaponTypes ? scene.WeaponTypes[name] || null : null;
		}

		function rangeOf (object, settings) {
			var weapon = weaponOf(object);

			return number(settings.Range, weapon ? number(weapon.Range, 800) * 4 : 3000);
		}

		/*
		 * The mind of a tree (one made of each graph, its blocks compiled once): kept by the graph given (its own, or of the
		 * scene), else by the name of the library one. Regression: compared with a new copy of the library graph at each call
		 * (Elemenx.Resources gives one), it was read again and kept anew each time, the list of minds growing without end.
		 */
		function mindOf (settings) {
			var name = settings.Brain || 'ai/fighter';
			var given = typeof name === 'object' ? name : self.Graphs && typeof self.Graphs === 'object' && self.Graphs[name] || null;
			var key = given || name;
			var found = minds.filter(function (one) {
				return one.Key === key;
			})[0];
			var graph;

			if (found)
				return found;

			graph = given || Elemenx.Resources('Blueprints', 'ElemenxGraphics/' + name);

			if (!graph)
				return null;

			found = {Key: key, Graph: graph, Read: blueprints.Read(typeof graph === 'string' ? graph : JSON.parse(JSON.stringify(graph)))};

			minds.push(found);

			return found;
		}

		/* The autopilot asked only when what it is to do changes (each ask begins it again). */
		function fly (object, mode, options) {
			var pilot = object.Autopilot;
			var asked = options || {};
			var key = JSON.stringify([mode, asked.Target, asked.Offset, asked.Distance]);
			if (pilot && pilot.Key === key) return pilot;

			if (!engine.AutopilotSet || !engine.AutopilotSet(object, mode, asked)) return null;

			object.Autopilot.Key = key;

			return object.Autopilot;
		}

		/* How soon a missile meets it (SceneMissiles): 1 now, 0 in 8 seconds or more, or none. */
		function incomingOf (object) {
			var list = engine.MissilesAt ? engine.MissilesAt(object.ID) : [];

			return list.length ? Math.max(0, Math.min(1, 1 - list[0].Seconds / 8)) : 0;
		}

		/* What an agent knows now: its board. */
		function perceive (object, record, settings, elapsed) {
			var range = rangeOf(object, settings) * metre();
			var own = teamOf(object);
			var health = number(object.Values.Health, NaN);
			var leader = settings.Leader ? scene.Objects[settings.Leader] : null;
			var layers = object.ShipState && object.ShipState.Layers || [];
			var capacity = layers.reduce(function (sum, layer) {
				return sum + number(layer.Capacity, 0);
			}, 0);
			var enemy = null;
			var nearest = Infinity;
			var ordered = record.Order === 'attack' && record.Target ? scene.Objects[record.Target] : null;

			if (!isNaN(health)) {
				record.Max = Math.max(record.Max || 0, health);

				/* Hit since it last thought: hurt as much as it lost of its health, fading in some seconds. */
				if (record.Health !== undefined && health < record.Health)
					record.Hurt = Math.min(1, (record.Hurt || 0) + (record.Health - health) / Math.max(1, record.Max) * 6);

				record.Health = health;
			}

			record.Hurt = (record.Hurt || 0) * Math.exp(-elapsed / 3);

			if (ordered && alive(ordered)) {
				enemy = ordered;
				nearest = vectors.Distance(ordered.World, object.World);
			}
			else if (own) {
				scene.Order.forEach(function (other) {
					var team;
					var far;

					if (other === object || !alive(other) || other.Kind === 'planet' || other.Kind === 'star' || other.Kind === 'moon' || other.Values.Vehicle && other.Values.Vehicle.Kind === 'ship' && !other.Ship) return;

					team = teamOf(other);

					if (!team || team === own) return;

					far = vectors.Distance(other.World, object.World);

					/* Of a wing: none farther from its leader than its leash (the fight stays by the leader). */
					if (leader && alive(leader) && vectors.Distance(other.World, leader.World) > number(settings.Leash, 8000) * metre()) return;

					if (far < range && far < nearest) {
						nearest = far;
						enemy = other;
					}
				});
			}

			record.Enemy = enemy ? enemy.ID : '';

			return {
				Health: isNaN(health) ? 1 : Math.max(0, Math.min(1, health / Math.max(1, record.Max))),
				Shield: capacity > 0 ? layers.reduce(function (sum, layer) {
					return sum + Math.max(0, number(layer.Value, 0));
				}, 0) / capacity : 0,
				Threat: enemy ? Math.max(0, Math.min(1, 1 - nearest / Math.max(1e-12, range))) : 0,
				Hurt: record.Hurt,
				EnemyNear: enemy ? 1 : 0,
				HasLeader: leader && alive(leader) ? 1 : 0,
				HasPatrol: Array.isArray(settings.Patrol) && settings.Patrol.length ? 1 : 0,
				OrderAttack: record.Order === 'attack' ? 1 : 0,
				OrderForm: record.Order === 'form' ? 1 : 0,
				OrderHold: record.Order === 'hold' ? 1 : 0,
				OrderRetreat: record.Order === 'retreat' ? 1 : 0,
				Incoming: incomingOf(object)
			};
		}

		/*
		 * The middle of a ship in space where its step has it (by the body it goes round: as its shots start, SceneWeapons),
		 * else as it is drawn. Regression: by the drawn places (a part of a step behind) a slug of 20 km/s missed a fighter
		 * going 3 km/s by tens of metres.
		 */
		function placeOf (object) {
			var round = object.Ship && object.Values.Vehicle && object.Values.Vehicle.Around && !scene.Ground ? scene.Objects[object.Values.Vehicle.Around] : null;
			var middle = centerOf(object);

			return round && round.World ? vectors.Add(vectors.Add(round.World, object.Ship.At), vectors.Subtract(middle, object.World)) : middle;
		}

		/* The middle of an object: of its model, else where it is. */
		function centerOf (object) {
			var body = engine.BodyOf ? engine.BodyOf(object) : null;

			return body ? vectors.Scale(vectors.Add(body.Min, body.Max), 0.5) : object.World;
		}

		/*
		 * Where a shot of a weapon meets a target that goes on as it goes now: the way to fire (from the middle of the shooter),
		 * how far, in how many seconds ({Way, Far, Seconds, At}). A ray, a rail and a beam meet it at once; a body flies at
		 * its Speed and goes on as its ship goes (SceneWeapons), so what counts is how the target goes by the shooter.
		 */
		function leadOf (shooter, target, weapon) {
			var from = placeOf(shooter);
			var at = placeOf(target);
			var unit = metre();
			var speed = weapon && weapon.Kind === 'projectile' ? number(weapon.Speed, 40) * unit : 0;
			/* Of two ships by one body: their ways by it, where their steps have them; else as they are seen going. */
			var framed = shooter.Ship && target.Ship && shooter.Values.Vehicle && target.Values.Vehicle && shooter.Values.Vehicle.Around && shooter.Values.Vehicle.Around === target.Values.Vehicle.Around;
			var moving = framed ? vectors.Subtract(target.Ship.Way, shooter.Ship.Way) : vectors.Subtract(target.WorldWay || [0, 0, 0], shooter.WorldWay || [0, 0, 0]);
			var r = vectors.Subtract(at, from);
			var a = vectors.Dot(moving, moving) - speed * speed;
			var b = 2 * vectors.Dot(r, moving);
			var c = vectors.Dot(r, r);
			var t = 0;
			var root;
			var point;

			if (speed > 0) {
				root = b * b - 4 * a * c;

				/* None (it goes away faster than the shot): straight at it. */
				if (Math.abs(a) < 1e-30) t = b ? -c / b : 0;
				else if (root >= 0) t = Math.max((-b - Math.sqrt(root)) / (2 * a), (-b + Math.sqrt(root)) / (2 * a));

				t = isFinite(t) && t > 0 ? Math.min(t, 10) : 0;
			}

			point = vectors.Add(r, vectors.Scale(moving, t));

			return {Way: vectors.Normalize(point), Far: vectors.Length(point), Seconds: t, At: vectors.Add(from, point)};
		}

		engine.AgentLead = leadOf;

		/* Its tasks: what each Task block of its tree does to it. */
		function tasksOf (object, record, settings) {
			var unit = metre();

			return {
				follow: function () {
					var leader = settings.Leader ? scene.Objects[settings.Leader] : null;
					if (!leader || !alive(leader)) return 'failure';

					return fly(object, 'follow', {Target: leader.ID, Offset: settings.Slot || [30, 0, -30]}) ? 'running' : 'failure';
				},

				/*
				 * Runs at its enemy: in (closing on it as it goes, firing at where its shot meets it), past it to a third of the
				 * reach of its weapon, then out (aside and away a while, Break seconds, 3), and in again. Regression: two that sat on
				 * each other's tail pulled each other away, the fight left its ships behind, and no shot met what moved.
				 */
				attack: function (request) {
					var enemy = record.Enemy ? scene.Objects[record.Enemy] : null;
					var weapon = weaponOf(object);
					var range = weapon ? number(weapon.Range, 800) : 800;
					var reach = range * unit;
					/* Its runs no longer than Run metres (3000), whatever the reach of its weapon: it fires from afar, it turns close. */
					var run = Math.min(range, number(settings.Run, 3000));
					var memory = request.Memory;
					var state = object.Ship;
					var aim;
					var far;
					var side;

					if (!enemy || !alive(enemy) || !state) return 'failure';

					if (request.First || !memory.Phase)
						memory.Phase = 'in';

					far = vectors.Distance(centerOf(enemy), centerOf(object));

					if (memory.Phase === 'in') {
						fly(object, 'approach', {Target: enemy.ID, Distance: run * 0.25, Closing: number(settings.Closing, 1000)});

						/* Past it: out, to its right or left, up a little, away from it. */
						if (far < run * unit * 0.33) {
							side = Math.random() < 0.5 ? -1 : 1;
							memory.Phase = 'out';
							memory.Since = request.Time;
							memory.Point = vectors.Add(object.World, vectors.Scale(vectors.Add(vectors.Add(vectors.Scale(state.Right, side), vectors.Scale(state.Up, 0.3)), state.Ahead), run * unit * 2));
						}
					}
					else {
						fly(object, 'approach', {Target: memory.Point, Distance: 0, Frame: enemy.ID, Closing: number(settings.Closing, 1000)});

						if (request.Time - memory.Since > number(settings.Break, 3) || far > run * unit * 1.5)
							memory.Phase = 'in';
					}

					/* Where its shot meets the enemy (a ray at once: where it is), turned to it (12 degrees) and in reach: fired. */
					aim = leadOf(object, enemy, weapon);

					if (weapon && aim.Far < reach && vectors.Dot(state.Ahead, aim.Way) > Math.cos(12 * Math.PI / 180) && typeof self.Fire === 'function')
						self.Fire(object.ID, {Way: aim.Way, Target: enemy.ID});

					/* Its missiles (SceneMissiles), its enemy locked: a salvo now and then. */
					/*
					 * Its missiles: at one with point defence on, the fast ones (Values.Missiles: through it before it fires); else the
					 * heavy ones (Values.Hunters: more harm), what it has of either.
					 */
					var guarded = !!(enemy.Values.Defence && engine.ArmsOf && engine.ArmsOf(enemy) && engine.ArmsOf(enemy).Defence && engine.ArmsOf(enemy).Defence.On);
					var kind = object.Values.Hunters && (!guarded || !object.Values.Missiles) ? 'hunter' : object.Values.Missiles ? 'missile' : '';
					if (kind && engine.MissileReady && engine.MissileReady(object, enemy.ID, kind))
						engine.MissileLaunch(object, {Target: enemy.ID, Kind: kind});

					/* Its lance (Values.Lance) at its enemy in its reach, when it is ready (it charges, then burns). */
					if (object.Values.Lance && engine.MissileLance && scene.WeaponTypes[object.Values.Lance] && far < number(scene.WeaponTypes[object.Values.Lance].Range, 0) * unit)
						engine.MissileLance(object, enemy.ID);

					/* Its torpedoes at what is big (Health 500 and more), locked. */
					if (object.Values.Torpedoes && number(enemy.Values.Health, 0) >= number(settings.Big, 500) && engine.MissileReady && engine.MissileReady(object, enemy.ID, 'torpedo'))
						engine.MissileLaunch(object, {Target: enemy.ID, Kind: 'torpedo'});

					record.Aim = aim;

					return 'running';
				},

				evade: function (request) {
					var enemy = record.Enemy ? scene.Objects[record.Enemy] : null;
					var state = object.Ship;
					var side;

					if (!state)
						return 'failure';

					/* Aside and away a while: a point of its own right (or left) and up, picked as it begins. */
					if (request.First || !request.Memory.Point) {
						side = Math.random() < 0.5 ? -1 : 1;
						request.Memory.Point = vectors.Add(object.World, vectors.Scale(vectors.Add(vectors.Add(vectors.Scale(state.Right, side), vectors.Scale(state.Up, 0.4)), enemy ? vectors.Scale(vectors.Normalize(vectors.Subtract(object.World, enemy.World)), 0.6) : [0, 0, 0]), 600 * unit));
						request.Memory.Since = request.Time;
					}

					fly(object, 'approach', {Target: request.Memory.Point, Distance: 60, Frame: enemy ? enemy.ID : '', Closing: number(settings.Closing, 1000)});

					return request.Time - request.Memory.Since > 4 || object.Autopilot && object.Autopilot.Arrived ? 'success' : 'running';
				},

				/*
				 * Against a missile at it: flares out (if it has them) and a hard turn across the way the missile comes (its seeker
				 * loses it, its turn cannot follow), then on while one still comes.
				 */
				defend: function (request) {
					var list = engine.MissilesAt ? engine.MissilesAt(object.ID) : [];
					var state = object.Ship;
					var line;
					var across;

					if (!state || !list.length)
						return list.length ? 'failure' : 'success';

					if (object.Values.Flares && engine.MissileFlares)
						engine.MissileFlares(object);

					if (request.First || !request.Memory.Point || request.Time - request.Memory.Since > 2.5) {
						line = vectors.Normalize(vectors.Subtract(object.World, list[0].At));
						across = vectors.Normalize(vectors.Cross(line, Math.abs(line[1]) > 0.9 ? [1, 0, 0] : state.Up));

						if (Math.random() < 0.5)
							across = vectors.Scale(across, -1);

						request.Memory.Point = vectors.Add(object.World, vectors.Scale(vectors.Add(across, vectors.Scale(line, 0.3)), 3000 * unit));
						request.Memory.Since = request.Time;
					}

					fly(object, 'approach', {Target: request.Memory.Point, Distance: 0, Frame: scene.Objects[list[0].Source] ? list[0].Source : '', Closing: number(settings.Closing, 1000)});

					return 'running';
				},

				retreat: function () {
					var enemy = record.Enemy ? scene.Objects[record.Enemy] : null;
					var home = pointOf(settings.Home);
					var to = home || (enemy ? vectors.Add(object.World, vectors.Scale(vectors.Normalize(vectors.Subtract(object.World, enemy.World)), 4000 * unit)) : null);
					var ordered = record.Order === 'retreat';

					/* Nowhere to go back to and none to go from: on as it goes while told to, else done. */
					if (!to)
						return ordered && fly(object, 'hold') ? 'running' : 'success';

					fly(object, 'approach', {Target: home ? settings.Home : to.map(function (value) {
						return Math.round(value / (500 * unit)) * 500 * unit;
					}), Distance: 200});

					return enemy || ordered ? 'running' : 'success';
				},

				patrol: function (request) {
					var points = Array.isArray(settings.Patrol) ? settings.Patrol : [];
					var index = number(request.Memory.Index, 0) % Math.max(1, points.length);
					var pilot;

					if (!points.length) return 'failure';

					pilot = fly(object, 'approach', {Target: points[index], Distance: 300});

					if (pilot && pilot.Arrived)
						request.Memory.Index = index + 1;

					return 'running';
				},

				hold: function () {
					return fly(object, 'hold') ? 'running' : 'failure';
				}
			};
		}

		function think (object, record, settings, elapsed) {
			var mind = mindOf(settings);
			var result;
			var task;

			if (!mind) return;

			/* A ship not flying yet (no step of its flight: where it is is not known): on as it goes first, then it thinks. */
			if (object.Values.Vehicle && object.Values.Vehicle.Kind === 'ship' && !object.Ship) {
				if (!object.Autopilot && engine.AutopilotSet)
					engine.AutopilotSet(object, 'hold');

				return;
			}

			/*
			 * Its tree begun again at each step: what it does is chosen anew of what it sees and is told (an order is followed
			 * at once; no task it ran last holds it). It always was, its mind being kept anew at each call; the fleet was tuned so.
			 */
			record.Mind = mind;
			record.Agent = blueprints.Agent(mind.Read, {Agent: object.ID, Tasks: tasksOf(object, record, settings), Parameters: settings.Parameters || {}});

			record.Board = perceive(object, record, settings, elapsed);
			result = record.Agent.Tick(record.Board, elapsed);
			record.Running = result.Running;

			task = result.Leaves.map(function (id) {
				var block = mind.Read.blocks.filter(function (one) {
					return one.id === id;
				})[0];
				var name = block ? block.properties.filter(function (property) {
					return property.key === 'Name';
				})[0] : null;

				return name ? String(name.value) : '';
			})[0] || '';

			if (task !== record.Task) {
				record.Task = task;

				self.$Emit('agent', {ID: object.ID, Task: task, Enemy: record.Enemy});
			}
		}

		/* Each frame: each agent thinks every Every seconds; one played, dead or gone thinks no more. */
		this.AddBehaviour({
			Step: function (elapsed) {
				var played = scene.Hero;
				var seated = scene.Seated && scene.Seated[played];

				Object.keys(records).forEach(function (id) {
					var object = scene.Objects[id];

					if (!object || !settingsOf(object) || !alive(object) || id === played || seated && seated.Vehicle === id) {
						if (records[id].Agent)
							records[id].Agent.Stop();

						if (object && object.Autopilot && records[id].Task && engine.AutopilotSet)
							engine.AutopilotSet(object, 'off');

						delete records[id];
					}
				});

				scene.Order.forEach(function (object) {
					var settings = settingsOf(object);
					var record;

					if (!settings || !alive(object) || object.ID === played || seated && seated.Vehicle === object.ID) return;

					record = records[object.ID] = records[object.ID] || {Clock: Infinity, Order: '', Target: ''};
					record.Clock += elapsed;

					if (record.Clock < number(settings.Every, 0.2)) return;

					think(object, record, settings, Math.min(1, record.Clock === Infinity ? 0 : record.Clock));

					record.Clock = 0;
				});
			}
		});

		engine.AgentsOrder = function (ids, order, target) {
			var list = Array.isArray(ids) ? ids : [ids];
			var given = 0;

			list.forEach(function (id) {
				var object = scene.Objects[id];
				if (!object || !settingsOf(object)) return;

				records[id] = records[id] || {Clock: Infinity, Order: '', Target: ''};
				records[id].Order = order || '';
				records[id].Target = target || '';
				given++;
			});

			return given;
		};
	},

	/*
	 * An order to agents (Values.Agent): attack (at target, an ID; else what each sees), form (by its leader), hold, retreat,
	 * or '' (none: each as its mind says). How many took it.
	 */
	AgentOrder: function (ids, order, target) {
		var engine = this.Engine();

		if (['', 'attack', 'form', 'hold', 'retreat'].indexOf(order || '') < 0) return 0;

		return engine.AgentsOrder ? engine.AgentsOrder(ids, order, target) : 0;
	},

	/* What an agent does now: {Brain, Task, Board, Running, Order, Enemy}; null for no agent (or one not thinking yet). */
	AgentOf: function (id) {
		var record = this.Scene().Agents ? this.Scene().Agents[id] : null;

		return record && record.Agent ? {Brain: record.Mind.Read.name || '', Task: record.Task || '', Board: Object.assign({}, record.Board), Running: (record.Running || []).slice(), Order: record.Order, Enemy: record.Enemy || ''} : null;
	}
});
