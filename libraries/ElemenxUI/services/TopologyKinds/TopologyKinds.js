/*
 * The kinds of the nodes of a Topology seen in 3D (View isometric) and the shapes they are drawn as: what a node is decides
 * how it looks and how it shows what it carries.
 *
 * - Define(kind, {Shape, Color, Size, Icon, Load, Active}) names a kind: Shape (a shape below), Color (#rrggbb, or a token of
 *   the theme: accent, info, success, warning, danger, muted), Size (1: a cell), Icon (on its top), Load how its load (0 to
 *   1) shows: fill (a level inside it, as a store), pulse (its glow beats, faster and brighter with it), height (it grows
 *   with it), ring (an arc round its foot), none, or a function (context, node) that draws it (context of Shape below);
 *   Active how it shows it is active: glow (round its foot, by default) or a function. Kind(kind) gives it, made whole (an
 *   unknown kind is a server); Kinds() the names.
 * - Shape(name, {Draw (context)}) names a shape. context: {Canvas (2D), Project (function ([x, y, z]): [x, y] of the
 *   screen; y up, a cell of the floor 1), Prism (function (base [[x, z]...], bottom, top, color, alpha): a prism of its
 *   faces drawn, lit as the view sees it), Disc (function (x, z, y, radius, color, alpha)), Center [x, z], Size, Height,
 *   Color [r, g, b], Alpha}. Shapes() the names. Built in: cube, cylinder, hex, stack, pyramid, sphere, cloud.
 * A kind or a shape a Service declares ($Provides: {TopologyKinds: {Kinds: [...], Shapes: [...]}}) is made when it is
 * asked for.
 */
Elemenx.Service('TopologyKinds', {
	$Meta: {
		Description: 'The kinds of the nodes of a Topology in 3D and the shapes they are drawn as: color, size, icon, how they show their load and that they are active.',
		Methods: ['Define(kind, settings)', 'Kind(kind)', 'Kinds()', 'Shape(name, shape)', 'ShapeOf(name)', 'Shapes()']
	},

	$OnCreate: function () {
		var self = this;

		this.Registry = {};
		this.ShapeRegistry = {};

		/* A ring of points round a center: the base of a prism of n sides. */
		function ring (cx, cz, radius, sides, turn) {
			var points = [];
			var i;

			for (i = 0; i < sides; i++)
				points.push([cx + Math.cos(turn + i / sides * Math.PI * 2) * radius, cz + Math.sin(turn + i / sides * Math.PI * 2) * radius]);

			return points;
		}

		this.Shape('cube', {Draw: function (c) {
			c.Prism(ring(c.Center[0], c.Center[1], c.Size * 0.42 * Math.SQRT2, 4, Math.PI / 4), 0, c.Height, c.Color, c.Alpha);
		}});

		this.Shape('cylinder', {Draw: function (c) {
			c.Prism(ring(c.Center[0], c.Center[1], c.Size * 0.4, 28, 0), 0, c.Height, c.Color, c.Alpha);
		}});

		this.Shape('hex', {Draw: function (c) {
			c.Prism(ring(c.Center[0], c.Center[1], c.Size * 0.44, 6, 0), 0, c.Height, c.Color, c.Alpha);
		}});

		/* A stack: three slabs with a gap between, as a cluster or a store of disks. */
		this.Shape('stack', {Draw: function (c) {
			var slab = c.Height / 3;
			var i;

			for (i = 0; i < 3; i++)
				c.Prism(ring(c.Center[0], c.Center[1], c.Size * 0.42 * Math.SQRT2, 4, Math.PI / 4), i * slab, i * slab + slab * 0.78, c.Color, c.Alpha);
		}});

		this.Shape('pyramid', {Draw: function (c) {
			c.Prism(ring(c.Center[0], c.Center[1], c.Size * 0.44 * Math.SQRT2, 4, Math.PI / 4), 0, c.Height, c.Color, c.Alpha, 0.02);
		}});

		this.Shape('sphere', {Draw: function (c) {
			c.Disc(c.Center[0], c.Center[1], c.Height / 2, c.Size * 0.42, c.Color, c.Alpha);
		}});

		/* A cloud: a few balls of it, side by side and one over them. */
		this.Shape('cloud', {Draw: function (c) {
			var r = c.Size * 0.24;

			c.Disc(c.Center[0] - r * 0.9, c.Center[1] + r * 0.3, r, r, c.Color, c.Alpha);
			c.Disc(c.Center[0] + r * 0.9, c.Center[1] - r * 0.2, r * 0.95, r * 0.95, c.Color, c.Alpha);
			c.Disc(c.Center[0], c.Center[1] - r * 0.4, r * 1.6, r * 1.15, c.Color, c.Alpha);
		}});

		[
			['server', 'cube', 'info', 1, 'server', 'pulse'],
			['host', 'cube', 'info', 1, 'monitor', 'pulse'],
			['switch', 'cube', 'warning', 1.6, 'share', 'pulse'],
			['router', 'hex', 'warning', 1.3, 'share', 'pulse'],
			['firewall', 'hex', 'danger', 1.2, 'shield', 'pulse'],
			['database', 'cylinder', 'accent', 1.1, 'database', 'fill'],
			['storage', 'stack', 'accent', 1, 'database', 'fill'],
			['cluster', 'stack', 'info', 1.4, 'server', 'fill'],
			['service', 'hex', 'success', 0.9, 'box', 'ring'],
			['queue', 'cylinder', 'success', 0.8, 'list', 'fill'],
			['cloud', 'cloud', 'muted', 1.6, 'globe', 'none'],
			['internet', 'cloud', 'muted', 1.8, 'globe', 'none'],
			['user', 'sphere', 'success', 0.7, 'user', 'pulse'],
			['device', 'pyramid', 'muted', 0.8, 'smartphone', 'pulse']
		].forEach(function (one) {
			self.Define(one[0], {Shape: one[1], Color: one[2], Size: one[3], Icon: one[4], Load: one[5], Active: 'glow'});
		});
	},

	Define: function (kind, settings) {
		if (!kind || !settings || typeof settings !== 'object')
			throw new Error('TopologyKinds.Define expects (kind, settings)');

		this.Registry[String(kind)] = Object.assign({Shape: 'cube', Color: 'info', Size: 1, Icon: '', Load: 'pulse', Active: 'glow'}, settings, {Name: String(kind)});

		return this;
	},

	/* A kind made whole; an unknown one is drawn as a server is. */
	Kind: function (kind) {
		var name = String(kind || '');
		if (name && !Object.prototype.hasOwnProperty.call(this.Registry, name) && this.$Provide)
			this.$Provide('Kinds', name);

		return Object.prototype.hasOwnProperty.call(this.Registry, name) ? this.Registry[name] : Object.assign({}, this.Registry.server, {Name: name || 'server'});
	},

	Kinds: function () {
		if (this.$Provide)
			this.$Provide('Kinds');

		return Object.keys(this.Registry);
	},

	Shape: function (name, shape) {
		if (!name || !shape || typeof shape.Draw !== 'function')
			throw new Error('TopologyKinds.Shape expects (name, {Draw})');

		this.ShapeRegistry[String(name)] = shape;

		return this;
	},

	ShapeOf: function (name) {
		var key = String(name || 'cube');
		if (!Object.prototype.hasOwnProperty.call(this.ShapeRegistry, key) && this.$Provide)
			this.$Provide('Shapes', key);

		return this.ShapeRegistry[key] || this.ShapeRegistry.cube;
	},

	Shapes: function () {
		if (this.$Provide)
			this.$Provide('Shapes');

		return Object.keys(this.ShapeRegistry);
	}
});
