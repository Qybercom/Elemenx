/*
 * Rigid: solid things of a ground that fall, roll, tumble and are knocked over, by the World of the Physics Service. An
 * object with the trait Rigid ({Shape: box, sphere or capsule; Size [x, y, z], Radius, Height, Mass (0: it never moves),
 * Bounce, Friction, Rolling}) starts at its X and Y, Lift over the ground, turned by its Facing; from then on the world moves
 * it and it lies as it fell. The walkers and the hero are capsules the world cannot move (Radius 0.4, 1.8 high) that push
 * what they walk into. The ground is the ground of the scene.
 *
 * The scene emits touch ({ID, With (null: the ground), At, Normal, Impulse}) when two begin to touch. Push(id, impulse, at)
 * knocks one (an impulse [x, y, z], N s, at a point, its middle when none), CastRay(from, direction, max) gives the first
 * {ID (null: the ground), At, Normal, Distance} along a ray, or null; RigidWorld() the World itself.
 */
Elemenx.Trait('ScenePhysics', {
	RigidStart: function () {
		var self = this;
		var scene = this.Scene();
		var engine = this.Engine();
		var physics = this.$Service('Physics');
		var number = physics.Number;
		var state = {World: null, Bodies: {}, Movers: {}};

		function world () {
			if (!state.World) {
				state.World = physics.World({Ground: function (x, z) {
					return scene.Ground && scene.Ground.Field ? scene.Ground.Field.Height(x, z) : 0;
				}, Touch: function (a, b, contact) {
					self.$Emit('touch', {ID: a.ID, With: b ? b.ID : null, At: contact.At, Normal: contact.Normal, Impulse: contact.Impulse});
				}});
			}

			return state.World;
		}

		/* How far the middle of a body is over what it stands on. */
		function rise (body) {
			return body.Shape === 'box' ? body.Size[1] / 2 : body.Shape === 'capsule' ? body.Height / 2 + body.Radius : body.Radius;
		}

		/* What the trait says, read again every frame: a Change of it is taken at once. */
		function take (body, settings) {
			body.Mass = number(settings.Mass, 1);
			body.Bounce = number(settings.Bounce, 0.2);
			body.Friction = number(settings.Friction, 0.5);
			body.Rolling = number(settings.Rolling, 0.03);
		}

		function made (object, settings) {
			var x = number(object.Values.X, 0);
			var z = number(object.Values.Y, 0);
			var facing = number(object.Values.Facing, 0) * Math.PI / 360;
			var shape = settings.Shape === 'sphere' || settings.Shape === 'capsule' ? settings.Shape : 'box';
			var body = {ID: object.ID, Shape: shape, Size: Array.isArray(settings.Size) ? settings.Size.slice() : [1, 1, 1], Radius: number(settings.Radius, 0.5), Height: number(settings.Height, 1), Turn: [0, Math.sin(facing), 0, Math.cos(facing)]};

			take(body, settings);

			body.At = [x, scene.Ground.Field.Height(x, z) + number(object.Values.Lift, 0) + rise(body), z];

			return world().Add(body);
		}

		function mover (object) {
			var body = state.Movers[object.ID];
			if (!body)
				body = state.Movers[object.ID] = world().Add({ID: object.ID, Shape: 'capsule', Radius: 0.4, Height: 1, Mass: 0, At: object.World.slice(), Friction: 0.8});

			return body;
		}

		/* A turn between two: the nearer way round, normalized. */
		function between (from, to, part) {
			var side = from[0] * to[0] + from[1] * to[1] + from[2] * to[2] + from[3] * to[3] < 0 ? -1 : 1;
			var q = [0, 1, 2, 3].map(function (i) {
				return from[i] + (to[i] * side - from[i]) * part;
			});
			var l = Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3]) || 1;

			return q.map(function (value) {
				return value / l;
			});
		}

		/*
		 * The body as the model shows it: its base under its middle, turned as the body is, between where it was a step before
		 * and where it is now by part (how far the time came into the next step), so a screen faster than the steps sees it glide.
		 */
		function show (object, body, part) {
			var at = body.Was ? physics.Blend(body.Was, body.At, part) : body.At;
			var q = body.WasTurn ? between(body.WasTurn, body.Turn, part) : body.Turn;
			var up = [2 * (q[0] * q[1] - q[2] * q[3]), 1 - 2 * (q[0] * q[0] + q[2] * q[2]), 2 * (q[1] * q[2] + q[0] * q[3])];
			var m = [1 - 2 * (q[1] * q[1] + q[2] * q[2]), 2 * (q[0] * q[1] + q[2] * q[3]), 2 * (q[0] * q[2] - q[1] * q[3]), 0, up[0], up[1], up[2], 0, 2 * (q[0] * q[2] + q[1] * q[3]), 2 * (q[1] * q[2] - q[0] * q[3]), 1 - 2 * (q[0] * q[0] + q[1] * q[1]), 0, 0, 0, 0, 1];
			var lift = rise(body);

			object.Flight = {At: [at[0] - up[0] * lift, at[1] - up[1] * lift, at[2] - up[2] * lift], Turn: m};
			object.Values.X = body.At[0];
			object.Values.Y = body.At[2];
			scene.Overrides[object.ID] = scene.Overrides[object.ID] || {};
			scene.Overrides[object.ID].Values = Object.assign(scene.Overrides[object.ID].Values || {}, {X: body.At[0], Y: body.At[2]});
		}

		/* A step of the world, on a ground only: its bodies made for the objects that came, gone with those that went. */
		engine.RigidStep = function (elapsed) {
			var alive = {};
			var moving = {};
			var part;

			if (!scene.Ground || !scene.Ground.Field || self.Paused) return;

			/* No rigid object, none was: the walkers need no world either. */
			if (!state.World && !scene.Roots.some(function (object) {
				return object.Traits.Rigid;
			})) return;

			scene.Roots.forEach(function (object) {
				var settings = object.Traits.Rigid;
				var body;

				if (settings) {
					body = state.Bodies[object.ID] || (state.Bodies[object.ID] = made(object, settings));
					alive[object.ID] = true;

					take(body, settings);

					return;
				}

				if (!object.World || !(object.Traits.Walker || object.ID === scene.Hero)) return;

				/* A walker moves the world, not the world it: its way is how far it went since the last frame. */
				body = mover(object);
				moving[object.ID] = true;
				body.Way = elapsed > 0 ? [(object.World[0] - body.At[0]) / elapsed, (object.World[1] + 0.9 - body.At[1]) / elapsed, (object.World[2] - body.At[2]) / elapsed] : [0, 0, 0];
				body.At = [object.World[0], object.World[1] + 0.9, object.World[2]];
			});

			Object.keys(state.Bodies).forEach(function (id) {
				if (alive[id]) return;

				world().Remove(state.Bodies[id]);

				delete state.Bodies[id];
			});

			Object.keys(state.Movers).forEach(function (id) {
				if (moving[id]) return;

				world().Remove(state.Movers[id]);

				delete state.Movers[id];
			});

			if (!Object.keys(state.Bodies).length) return;

			part = world().Step(elapsed);

			Object.keys(state.Bodies).forEach(function (id) {
				if (scene.Objects[id])
					show(scene.Objects[id], state.Bodies[id], part);
			});
		};

		engine.RigidPush = function (id, impulse, at) {
			var body = state.Bodies[id];
			if (!body)
				return false;

			world().Push(body, impulse, at);

			return true;
		};

		engine.RigidRay = function (from, direction, max) {
			var hit = world().Ray(from, direction, max);

			return hit ? {ID: hit.Body ? hit.Body.ID : null, At: hit.At, Normal: hit.Normal, Distance: hit.Distance} : null;
		};

		engine.RigidWorld = world;
	},

	/* Knocks a rigid object: an impulse [x, y, z] (N s) at a point of the world, its middle when none; false if it is none. */
	Push: function (id, impulse, at) {
		return this.Engine().RigidPush(id, impulse, at);
	},

	/* The first thing a ray meets, of the rigid objects, the walkers and the ground: {ID (null: the ground), At, Normal, Distance}. */
	CastRay: function (from, direction, max) {
		return this.Engine().RigidRay(from, direction, max);
	},

	/* The World of the Physics Service the rigid objects are in, for joints and the rest. */
	RigidWorld: function () {
		return this.Engine().RigidWorld();
	}
});
