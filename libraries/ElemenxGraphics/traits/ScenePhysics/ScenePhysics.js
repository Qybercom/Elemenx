/*
 * Rigid: solid things of a ground that fall, roll, tumble and are knocked over, by the World of the Physics Service. An
 * object with the trait Rigid ({Shape: box, sphere or capsule; Size [x, y, z], Radius, Height, Mass (0: it never moves),
 * Bounce, Friction, Rolling}) starts at its X and Y, Lift over the ground, turned by its Facing; from then on the world moves
 * it and it lies as it fell. The walkers and the hero are capsules the world cannot move (Radius 0.4, 1.8 high) that push
 * what they walk into. The ground is the ground of the scene.
 *
 * A collider is a wall of a shape of its own that stops what comes to it and never moves: an object of kind collider (the
 * trait Collider: Points [[x, z]...] of a convex outline round its X and Y, turned by its Facing, Height, Lift over the
 * ground; or Model, the outline and the height of that model as large as its Size), or an area of type collider of the
 * sketch of the ground (Height, Lift). The rigid bodies strike it, a ray meets it, a car is held off it and a walker walks
 * round it (ColliderHit); the editor (Origin) shows them as outlines. Colliders() gives them: [{ID, Points (the outline
 * in the world, turning left), Bottom, Top}].
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
		var state = {World: null, Bodies: {}, Movers: {}, Colliders: [], ColliderKey: '', Prisms: {}, Hulls: {}};

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

		/* The outline round a list of points [x, z]: its convex hull, turning left (the chain of Andrew). */
		function hull (points) {
			var sorted = points.slice().sort(function (a, b) {
				return a[0] - b[0] || a[1] - b[1];
			});
			var lower = [];
			var upper = [];

			function cross (o, a, b) {
				return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
			}

			sorted.forEach(function (point) {
				while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0)
					lower.pop();

				lower.push(point);
			});

			sorted.slice().reverse().forEach(function (point) {
				while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0)
					upper.pop();

				upper.push(point);
			});

			return lower.slice(0, -1).concat(upper.slice(0, -1));
		}

		/* The outline and the height of a model as large as size (its height), made once: {Points, Height} or null. */
		function modelHull (name, size) {
			var library = self.$Service('SceneModels');
			var key = name + '@' + size;
			var made;
			var whole;
			var low = Infinity;
			var high = -Infinity;
			var points = [];
			var p;
			var k;
			var i;

			if (state.Hulls[key] !== undefined) return state.Hulls[key];

			if (!library.Has(name) || !library.Ready(name)) return null;

			made = library.Make(name);
			whole = library.Whole(made);
			p = whole.Positions;

			for (i = 0; i < p.length; i += 3) {
				low = Math.min(low, p[i + 1]);
				high = Math.max(high, p[i + 1]);
			}

			k = size / Math.max(1e-6, high - low);

			for (i = 0; i < p.length; i += 3)
				points.push([Math.round(p[i] * k * 100) / 100, Math.round(p[i + 2] * k * 100) / 100]);

			state.Hulls[key] = {Points: hull(points), Height: (high - low) * k};

			return state.Hulls[key];
		}

		/* The colliders of the scene and of the sketch of its ground: [{ID, Points (in the world), Bottom, Top}], made again when they change. */
		function colliders () {
			var field = scene.Ground && scene.Ground.Field;
			var sketch = field && field.Options && field.Options.Sketch;
			var given = [];
			var key;

			/* The parts of models with the role collider: their outlines where they stand. */
			scene.Roots.forEach(function (object) {
				if (!engine.RoleColliders || object.Away || !object.Rig || !object.Rig.Made || !(object.Rig.Made.Colliders || []).length) return;

				engine.RoleColliders(object).forEach(function (one) {
					given.push({ID: one.ID, X: 0, Z: 0, Facing: 0, Points: one.Points, Height: one.Top - one.Bottom, Lift: 0, Bottom: one.Bottom});
				});
			});

			scene.Roots.forEach(function (object) {
				var settings = object.Traits.Collider;
				var shape;

				if (!settings || object.Away) return;

				shape = settings.Model ? modelHull(settings.Model, number(object.Values.Size, number(settings.Size, 1))) : null;

				given.push({ID: object.ID, X: number(object.Values.X, 0), Z: number(object.Values.Y, 0), Facing: number(object.Values.Facing, 0), Points: shape ? shape.Points : settings.Points || [[-1, -1], [1, -1], [1, 1], [-1, 1]], Height: shape && (settings.Height === null || settings.Height === undefined || settings.Height === '') ? shape.Height : number(settings.Height, 3), Lift: number(object.Values.Lift, number(settings.Lift, 0))});
			});

			(sketch && sketch.Layers || []).forEach(function (layer) {
				if (layer.Visible === false || layer.Visible === 'false') return;

				(layer.Items || []).forEach(function (item) {
					if (item.Type === 'collider' && item.Points && item.Points.length > 2)
						given.push({ID: 'sketch-' + (item.ID || given.length), X: 0, Z: 0, Facing: 0, Points: item.Points, Height: number(item.Height, 3), Lift: number(item.Lift, 0)});
				});
			});

			key = JSON.stringify(given) + ':' + (field ? field.Size : 0);

			if (key === state.ColliderKey) return state.Colliders;

			state.ColliderKey = key;
			state.Colliders = given.map(function (one) {
				var turn = one.Facing * Math.PI / 180;
				var c = Math.cos(turn);
				var s = Math.sin(turn);
				/* Turned as a model is by its Facing: its x to (cos, -sin), its z to (sin, cos). */
				var points = hull(one.Points.map(function (point) {
					return [one.X + point[0] * c + point[1] * s, one.Z - point[0] * s + point[1] * c];
				}));
				var middle = [0, 0];
				var base;

				points.forEach(function (point) {
					middle[0] += point[0] / points.length;
					middle[1] += point[1] / points.length;
				});

				base = one.Bottom !== undefined ? one.Bottom : field ? Math.min.apply(null, points.map(function (point) {
					return field.Height(point[0], point[1]);
				}).concat([field.Height(middle[0], middle[1])])) : 0;

				return {ID: one.ID, Points: points, Middle: middle, Bottom: base + one.Lift, Top: base + one.Lift + one.Height};
			}).filter(function (one) {
				return one.Points.length > 2;
			});

			return state.Colliders;
		}

		/* The colliders as prisms of the world: made again when they change. */
		function prisms () {
			var list = colliders();
			var wanted = {};

			list.forEach(function (one) {
				var id = 'collider:' + one.ID;
				var body = state.Prisms[id];
				var points = one.Points.map(function (point) {
					return [point[0] - one.Middle[0], point[1] - one.Middle[1]];
				});
				var at = [one.Middle[0], (one.Bottom + one.Top) / 2, one.Middle[1]];

				wanted[id] = true;

				if (body && JSON.stringify([body.Points, body.At, body.Height]) === JSON.stringify([points, at, one.Top - one.Bottom])) return;

				if (body)
					world().Remove(body);

				state.Prisms[id] = world().Add({ID: one.ID, Shape: 'prism', Points: points, Height: one.Top - one.Bottom, At: at, Mass: 0, Friction: 0.6, Bounce: 0.1});
			});

			Object.keys(state.Prisms).forEach(function (id) {
				if (wanted[id]) return;

				world().Remove(state.Prisms[id]);

				delete state.Prisms[id];
			});
		}

		engine.Colliders = function () {
			return colliders();
		};

		/*
		 * A point against the colliders (at the height y, any height when null), margin metres round them: {ID, Normal [x, z] out
		 * of the nearest side, Depth (how far in it is)} of the deepest, or null.
		 */
		engine.ColliderHit = function (x, z, y, margin) {
			var far = number(margin, 0);
			var best = null;

			colliders().forEach(function (one) {
				var points = one.Points;
				var least = Infinity;
				var normal = null;
				var i;

				if (y !== null && y !== undefined && (y < one.Bottom - far || y > one.Top + far)) return;

				for (i = 0; i < points.length; i++) {
					var a = points[i];
					var b = points[(i + 1) % points.length];
					var e = [b[0] - a[0], b[1] - a[1]];
					var l = Math.hypot(e[0], e[1]) || 1;
					/* Out of the side: on its right, the outline turning left. */
					var n = [e[1] / l, -e[0] / l];
					var inside = -((x - a[0]) * n[0] + (z - a[1]) * n[1]) + far;
					if (inside < 0) return;

					if (inside < least) {
						least = inside;
						normal = n;
					}
				}

				if (!best || least > best.Depth)
					best = {ID: one.ID, Normal: normal, Depth: least};
			});

			return best;
		};

		/* The outlines of the colliders, bottom and top and the edges between: for the editor. */
		engine.ColliderLines = function () {
			var lines = [];

			colliders().forEach(function (one) {
				one.Points.forEach(function (point, i) {
					var next = one.Points[(i + 1) % one.Points.length];

					lines.push([point[0], one.Bottom, point[1]], [next[0], one.Bottom, next[1]], [point[0], one.Top, point[1]], [next[0], one.Top, next[1]], [point[0], one.Bottom, point[1]], [point[0], one.Top, point[1]]);
				});
			});

			return lines;
		};

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

			prisms();

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
			var hit;

			if (scene.Ground && scene.Ground.Field)
				prisms();

			hit = world().Ray(from, direction, max);

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

	/* The colliders of the scene and of its sketch: [{ID, Points (their outline in the world), Bottom, Top}]. */
	Colliders: function () {
		return this.Engine().Colliders();
	},

	/* The World of the Physics Service the rigid objects are in, for joints and the rest. */
	RigidWorld: function () {
		return this.Engine().RigidWorld();
	}
});
