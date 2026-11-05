/*
 * SceneTriggers: the places of a scene where something happens, in a game, a tour, a plan of a building or any other world.
 * An object of kind trigger (the trait Trigger) is a shape on the ground: Shape circle (Radius round its X and Y), area
 * (Points [[x, z]...]) or line (Points, Width); empty: an area of three points or more, a line of two, else a circle. Height
 * (0: any) is how high over the ground it reaches. What goes into it are the walkers, the vehicles and the hero (Kinds: the
 * kinds of what counts in their place, their bases too), of its Team when it has one. The scene emits enter when one comes
 * in and leave when it goes out or is removed, with {Trigger, ID, Object}: Trigger is the trigger itself, Trigger(id) of
 * the scene ({ID, Inside(), Action(name, data), Enable(on)}): Inside() tells who stays in it, a handler sends it an action,
 * and the scene emits action ({Trigger, Name, Data}). Once: it fires its first enter alone; Enabled false holds it.
 *
 * A trigger with Blueprint (a flow graph of the Blueprints Service) runs it: its Event blocks enter and leave start
 * with {Trigger, Object} (the IDs), an action starts the Event block of its name with {Trigger, Data}; its Action blocks call
 * the actions TriggerActions({Name: function (value, done)}) gave the scene. A graph that cannot be made is told once.
 * The action achievement is there by itself: value the ID of an achievement of the Achievements Service (it unlocks it) or
 * {ID, Amount} (it adds to its progress). Achievement of a trigger, the same value, does it as one comes in, with no graph.
 *
 * An object of kind zone (the trait Zone: Points or a Radius round its X and Y, Tags, Team) is a place of rules a game asks
 * for: ZonesAt(x, z) gives [{ID, Name, Tags, Team}] of the zones there, safe, pvp, no-build or any tag of its own.
 *
 * Triggers and zones are drawn in a sketch of a ground too (Terrain: trigger, triggerpoint, triggerline, zone).
 */
Elemenx.Trait('SceneTriggers', {
	TriggersStart: function () {
		var self = this;
		var scene = this.Scene();
		var engine = this.Engine();
		var kinds = this.$Service('SceneKinds');
		var state = {Inside: {}, Handles: {}, Flows: {}, Done: {}};

		scene.TriggerActions = scene.TriggerActions || {};

		/* The achievements of the Application, unlocked or brought on by a place. */
		function achieve (value) {
			var achievements = self.$Service('Achievements');
			var given = typeof value === 'string' ? {ID: value} : value || {};
			if (!given.ID || !achievements) return null;
			if (given.Amount !== undefined && given.Amount !== null && given.Amount !== '') return achievements.Progress(given.ID, Number(given.Amount));

			return achievements.Unlock(given.ID);
		}

		if (!scene.TriggerActions.achievement) {
			scene.TriggerActions.achievement = function (value, done) {
				var state;

				try {
					state = achieve(value);
				}
				catch (error) {
					done(error);

					return;
				}

				done(null, state);
			};
		}

		function list (value) {
			if (!value) return [];

			return (typeof value === 'string' ? value.split(',') : value).map(function (one) {
				return String(one).trim();
			}).filter(Boolean);
		}

		function inside (polygon, x, z) {
			var within = false;
			var a;
			var b;

			for (a = 0, b = polygon.length - 1; a < polygon.length; b = a++) {
				if (polygon[a][1] > z !== polygon[b][1] > z && x < (polygon[b][0] - polygon[a][0]) * (z - polygon[a][1]) / (polygon[b][1] - polygon[a][1]) + polygon[a][0])
					within = !within;
			}

			return within;
		}

		function distance (line, x, z) {
			var best = Infinity;
			var a;

			for (a = 0; a + 1 < line.length; a++) {
				var dx = line[a + 1][0] - line[a][0];
				var dz = line[a + 1][1] - line[a][1];
				var t = Math.max(0, Math.min(1, ((x - line[a][0]) * dx + (z - line[a][1]) * dz) / (dx * dx + dz * dz || 1)));

				best = Math.min(best, Math.hypot(line[a][0] + dx * t - x, line[a][1] + dz * t - z));
			}

			return best;
		}

		function teamOf (object) {
			var found = object.Values.Team;

			Object.keys(object.Traits).forEach(function (name) {
				if (found === undefined && object.Traits[name] && object.Traits[name].Team !== undefined)
					found = object.Traits[name].Team;
			});

			return found === undefined || found === null ? '' : String(found);
		}

		function kindsOf (object) {
			return object.Kind && kinds.Has(object.Kind) ? [object.Kind].concat(kinds.Resolve(object.Kind).Chain) : [object.Kind];
		}

		/* Whether a point (x, z, the height y) is in the shape of a trigger or a zone. */
		function holds (object, settings, x, y, z) {
			var points = settings.Points || [];
			var shape = settings.Shape || (points.length > 2 ? 'area' : points.length > 1 ? 'line' : 'circle');
			var center = object.World || [0, 0, 0];
			var base;

			if (shape === 'area' && !inside(points, x, z)) return false;
			if (shape === 'line' && !(points.length > 1 && distance(points, x, z) <= Number(settings.Width || 4) / 2)) return false;
			if (shape === 'circle' && Math.hypot(x - center[0], z - center[2]) > Number(settings.Radius || 0)) return false;

			if (Number(settings.Height) > 0) {
				base = scene.Ground && scene.Ground.Field ? scene.Ground.Field.Height(x, z) : center[1];

				return y >= base - 1 && y <= base + Number(settings.Height);
			}

			return true;
		}

		/* The trigger itself, as a handler gets it: one for each trigger. */
		function handle (id) {
			var made = state.Handles[id];
			if (made)
				return made;

			made = {
				ID: id,
				Inside: function () {
					return Object.keys(state.Inside[id] || {});
				},
				Action: function (name, data) {
					var flow = state.Flows[id];
					if (flow && flow.Instance)
						flow.Instance.Emit(name, {Trigger: id, Data: data}, failed(id));

					self.$Emit('action', {Trigger: made, Name: name, Data: data});

					return made;
				},
				Enable: function (on) {
					self.Change(id, {Enabled: on !== false});

					return made;
				}
			};
			state.Handles[id] = made;

			return made;
		}

		function failed (id) {
			return function (error) {
				if (error)
					window.console.warn('Elemenx Scene: the flow of the trigger ' + id + ' failed: ' + error.message);
			};
		}

		/* The flow of a trigger's Blueprint, started once for each graph it is given. */
		function flowOf (object, settings) {
			var key = settings.Blueprint ? JSON.stringify([settings.Blueprint, settings.Parameters || null]) : '';
			var flow = state.Flows[object.ID];
			var blueprints;
			var graph;

			if (flow && flow.Key === key) return flow.Instance;

			if (flow && flow.Instance)
				flow.Instance.Stop();

			flow = state.Flows[object.ID] = {Key: key, Instance: null};

			if (!key)
				return null;

			try {
				blueprints = self.$Service('Blueprints');
				graph = typeof settings.Blueprint === 'string' ? blueprints.Read(settings.Blueprint) : settings.Blueprint;
				flow.Instance = blueprints.Start(graph, {Actions: scene.TriggerActions, Scene: self, Trigger: handle(object.ID), Parameters: settings.Parameters || {}});
			}
			catch (error) {
				window.console.warn('Elemenx Scene: the flow of the trigger ' + object.ID + ' cannot be made: ' + error.message);
			}

			return flow.Instance;
		}

		function tell (kind, object, settings, id) {
			var flow = flowOf(object, settings);
			if (flow)
				flow.Emit(kind, {Trigger: object.ID, Object: id}, failed(object.ID));

			/* Each by its name, as the events of the scene are declared. */
			self.$Emit(kind === 'enter' ? 'enter' : 'leave', {Trigger: handle(object.ID), ID: id, Object: self.Get(id)});
		}

		/* A step of the triggers: who came in, who stays and who went out of each since the last frame. */
		engine.TriggersStep = function () {
			var triggers = scene.Roots.filter(function (object) {
				return object.Traits.Trigger;
			});
			var roots = scene.Roots.filter(function (object) {
				return object.World && !object.Traits.Trigger && !object.Traits.Zone;
			});
			var movers = roots.filter(function (object) {
				return object.Traits.Walker || object.Values.Vehicle || object.ID === scene.Hero;
			});
			var alive = {};

			triggers.forEach(function (object) {
				var settings = object.Traits.Trigger;
				var id = object.ID;
				var before = state.Inside[id] || {};
				var now = {};
				var wanted = list(settings.Kinds);
				var team = settings.Team === undefined || settings.Team === null ? '' : String(settings.Team);

				alive[id] = true;

				if (settings.Enabled === false || settings.Enabled === 'false' || state.Done[id]) {
					state.Inside[id] = {};

					return;
				}

				(wanted.length ? roots.filter(function (one) {
					return kindsOf(one).some(function (name) {
						return wanted.indexOf(name) >= 0;
					});
				}) : movers).forEach(function (one) {
					if (team && teamOf(one) !== team) return;

					if (holds(object, settings, one.World[0], one.World[1], one.World[2]))
						now[one.ID] = true;
				});

				state.Inside[id] = now;

				Object.keys(now).forEach(function (one) {
					if (state.Done[id] || before[one]) return;

					tell('enter', object, settings, one);

					if (settings.Achievement) {
						try {
							achieve(settings.Achievement);
						}
						catch (error) {
							window.console.warn('Elemenx Scene: the achievement of the trigger ' + id + ': ' + error.message);
						}
					}

					if (settings.Once === true || settings.Once === 'true')
						state.Done[id] = true;
				});

				Object.keys(before).forEach(function (one) {
					if (now[one]) return;

					if (!state.Done[id])
						tell('leave', object, settings, one);
				});
			});

			/* A trigger that went takes its flow with it. */
			Object.keys(state.Inside).forEach(function (id) {
				if (alive[id]) return;

				if (state.Flows[id] && state.Flows[id].Instance)
					state.Flows[id].Instance.Stop();

				delete state.Inside[id];
				delete state.Flows[id];
				delete state.Handles[id];
				delete state.Done[id];
			});
		};

		engine.Trigger = function (id) {
			var object = scene.Objects[id];

			return object && object.Traits.Trigger ? handle(id) : null;
		};

		engine.ZonesAt = function (x, z) {
			return scene.Roots.filter(function (object) {
				var settings = object.Traits.Zone;
				var points = settings && settings.Points || [];
				var center = object.World || [Number(object.Values.X) || 0, 0, Number(object.Values.Y) || 0];

				if (!settings) return false;

				return points.length > 2 ? inside(points, x, z) : Math.hypot(x - center[0], z - center[2]) <= Number(settings.Radius || 0);
			}).map(function (object) {
				return {ID: object.ID, Name: object.Values.Name || '', Tags: list(object.Traits.Zone.Tags), Team: object.Traits.Zone.Team || ''};
			});
		};
	},

	/* A trigger of the scene by its ID, as its events give it: {ID, Inside(), Action(name, data), Enable(on)}; null if none. */
	Trigger: function (id) {
		return this.Engine().Trigger(id);
	},

	/* The actions the flows of triggers call by name: {Name: function (value, done (error, result))}. */
	TriggerActions: function (actions) {
		Object.assign(this.Scene().TriggerActions, actions);
	},

	/* The zones at a point of the ground: [{ID, Name, Tags, Team}]. */
	ZonesAt: function (x, z) {
		return this.Engine().ZonesAt(x, z);
	}
});
