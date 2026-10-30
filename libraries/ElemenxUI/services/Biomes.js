/*
 * The lands of a game: what a ground looks like and what grows on it, and the places people made on it.
 * - Names(), Has(name), Get(name), Define(name, biome): a biome is {Ground: {Sand, Low, High, Rock, Snow, Deep, Road}
 *   ([r, g, b], 0 to 1, each by what it is the color of; the others stay the ones of the ground), Scatter: [rules of the
 *   trait Scatter], Grass: {rule of the trait Grass, or null}}. temperate, taiga, tundra, desert, savanna, swamp, alien.
 * - Village(field, {X, Y, Houses, Radius, Seed, Shapes}) lays out a village on a ground (Terrain.Flat): {Objects (specs
 *   for GameScene.Add), Roads ([[x, z]...], one way to each house and one out of it), Center}. It keeps to what is level
 *   and dry, and moves to the nearest such place when its own is not.
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('Biomes', {
	$Meta: {
		Description: 'The lands of a game: the colors of a ground, what grows on it, and villages laid out on it.',
		Methods: ['Names()', 'Has(name)', 'Get(name)', 'Define(name, biome)', 'Village(field, options)']
	},

	$OnCreate: function () {
		this.Registry = {
			temperate: {
				Ground: {},
				Scatter: [
					{Shapes: ['pine', 'pine', 'oak', 'birch', 'bush', 'stump'], Density: 2.2, Cover: 0.55, Patch: 70, MaxSlope: 0.3},
					{Shapes: ['oak', 'birch', 'bush'], Density: 0.8, Cover: 0.45, Patch: 40, MaxSlope: 0.25},
					{Shapes: ['bush', 'bush', 'mushroom', 'stump'], Density: 5, Cover: 0.5, Patch: 25, MaxSlope: 0.3, Size: [0.6, 1.2]},
					{Shapes: ['rock', 'rock', 'boulder'], Density: 0.5, MinHeight: 0, MaxSlope: 0.8, Size: [0.5, 1.4]}
				],
				Grass: {Density: 1, Height: 0.75, Color: '#7fae4a', Root: '#2f5a22'}
			},
			taiga: {
				Ground: {Low: [0.27, 0.4, 0.26], High: [0.36, 0.42, 0.34], Sand: [0.5, 0.48, 0.4]},
				Scatter: [
					{Shapes: ['pine'], Density: 4, Cover: 0.7, Patch: 80, MaxSlope: 0.35, Size: [0.9, 1.6]},
					{Shapes: ['bush', 'stump', 'rock'], Density: 2, Cover: 0.5, Patch: 30, MaxSlope: 0.4, Size: [0.5, 1.1]},
					{Shapes: ['boulder', 'rock'], Density: 0.6, MinHeight: 0, MaxSlope: 0.8}
				],
				Grass: {Density: 0.7, Height: 0.5, Color: '#6d8f58', Root: '#2c4a2c'}
			},
			tundra: {
				Ground: {Low: [0.86, 0.88, 0.92], High: [0.92, 0.93, 0.96], Sand: [0.74, 0.76, 0.78], Rock: [0.5, 0.52, 0.56]},
				Scatter: [
					{Shapes: ['pine'], Density: 0.5, Cover: 0.4, Patch: 60, MaxSlope: 0.3, Size: [0.6, 1.1]},
					{Shapes: ['boulder', 'rock', 'stump'], Density: 0.7, MinHeight: 0, MaxSlope: 0.8}
				],
				Grass: null
			},
			desert: {
				Ground: {Low: [0.82, 0.68, 0.44], High: [0.76, 0.58, 0.36], Sand: [0.88, 0.76, 0.52], Rock: [0.62, 0.42, 0.28], Snow: [0.8, 0.62, 0.42], Road: [0.66, 0.52, 0.34]},
				Scatter: [
					{Shapes: ['palm'], Density: 1.6, MaxHeight: 5, Cover: 0.6, Patch: 30, MaxSlope: 0.2},
					{Shapes: ['rock', 'rock', 'rock', 'boulder'], Density: 0.12, MinHeight: 0, MaxSlope: 0.9},
					{Shapes: ['crystal'], Density: 0.04, MinHeight: 2, MaxSlope: 0.5}
				],
				Grass: null
			},
			savanna: {
				Ground: {Low: [0.66, 0.6, 0.3], High: [0.58, 0.5, 0.28], Sand: [0.78, 0.68, 0.46]},
				Scatter: [
					{Shapes: ['oak'], Density: 0.25, MaxSlope: 0.25, Size: [0.9, 1.5]},
					{Shapes: ['bush', 'rock'], Density: 0.8, Cover: 0.5, Patch: 40, MaxSlope: 0.4}
				],
				Grass: {Density: 0.9, Height: 0.95, Color: '#c9b35a', Root: '#6f6a2e'}
			},
			swamp: {
				Ground: {Low: [0.22, 0.3, 0.18], High: [0.28, 0.32, 0.2], Sand: [0.3, 0.3, 0.2], Deep: [0.12, 0.16, 0.12]},
				Scatter: [
					{Shapes: ['oak', 'birch', 'stump'], Density: 1.8, Cover: 0.7, Patch: 45, MaxSlope: 0.3},
					{Shapes: ['bush', 'mushroom', 'mushroom', 'stump'], Density: 6, Cover: 0.6, Patch: 20, MaxSlope: 0.3, Size: [0.6, 1.4]}
				],
				Grass: {Density: 1, Height: 1, Color: '#7c8a3c', Root: '#2c3a1e'}
			},
			alien: {
				Ground: {Low: [0.36, 0.2, 0.46], High: [0.26, 0.24, 0.5], Sand: [0.5, 0.34, 0.56], Rock: [0.2, 0.16, 0.3], Snow: [0.62, 0.86, 0.9], Road: [0.56, 0.5, 0.66]},
				Scatter: [
					{Shapes: ['crystal'], Density: 0.9, Cover: 0.5, Patch: 50, MaxSlope: 0.6, Size: [0.7, 2.2]},
					{Shapes: ['mushroom'], Density: 3, Cover: 0.5, Patch: 30, MaxSlope: 0.4, Size: [1, 3.5]},
					{Shapes: ['boulder'], Density: 0.3, MinHeight: 0, MaxSlope: 0.9}
				],
				Grass: {Density: 0.8, Height: 0.6, Color: '#5fd6c0', Root: '#2a2a6a'}
			}
		};
	},

	Names: function () {
		return Object.keys(this.Registry);
	},

	Has: function (name) {
		return !!this.Registry[name];
	},

	Get: function (name) {
		return this.Registry[name] || null;
	},

	Define: function (name, biome) {
		this.Registry[name] = biome;

		return this;
	},

	/* The numbers of a seed, always the same. */
	Random: function (seed) {
		var value = 2166136261;
		var text = String(seed);
		var i;

		for (i = 0; i < text.length; i++)
			value = Math.imul(value ^ text.charCodeAt(i), 16777619);

		return function () {
			value = Math.imul(value ^ value >>> 15, 2246822519) + 1 | 0;

			return (value >>> 0) / 4294967296;
		};
	},

	/* Whether a point can take a building: dry and level, round it too. */
	Level: function (field, x, z, reach) {
		return [[0, 0], [reach, 0], [-reach, 0], [0, reach], [0, -reach]].every(function (step) {
			return field.Height(x + step[0], z + step[1]) > 1 && field.Slope(x + step[0], z + step[1]) < 0.16;
		});
	},

	Village: function (field, options) {
		var self = this;
		var settings = options || {};
		var random = this.Random(settings.Seed === undefined ? 'village' : settings.Seed);
		var count = Number(settings.Houses) || 8;
		var radius = Number(settings.Radius) || 30;
		var shapes = settings.Shapes || ['house', 'house', 'house', 'barracks', 'windmill', 'tower'];
		var center = {X: Number(settings.X) || 0, Z: Number(settings.Y) || 0};
		var half = field.Size / 2 - radius - 8;
		var found = this.Level(field, center.X, center.Z, 8);
		var objects = [];
		var roads = [];
		var turn;
		var ring;
		var i;

		/* The nearest level place, ring by ring. */
		for (ring = 1; ring < 24 && !found; ring++) {
			for (turn = 0; turn < 16 && !found; turn++) {
				var x = center.X + Math.cos(turn / 16 * Math.PI * 2) * ring * 16;
				var z = center.Z + Math.sin(turn / 16 * Math.PI * 2) * ring * 16;

				if (Math.abs(x) < half && Math.abs(z) < half && this.Level(field, x, z, 8)) {
					center = {X: x, Z: z};
					found = true;
				}
			}
		}

		if (!found)
			return {Objects: [], Roads: [], Center: center};

		for (i = 0; i < count * 6 && objects.length < count; i++) {
			var angle = i * 2.39996 + random() * 0.5;
			var far = radius * (0.35 + 0.65 * Math.sqrt((objects.length + random()) / count));
			var hx = center.X + Math.cos(angle) * far;
			var hz = center.Z + Math.sin(angle) * far;
			var name = shapes[objects.length ? Math.floor(random() * shapes.length) : 0];
			var size = name === 'barracks' ? 12 : name === 'windmill' ? 11 : name === 'tower' ? 9 : 8;
			if (!self.Level(field, hx, hz, size * 0.55) || objects.some(function (other) {
				return Math.abs(other.X - hx) < (other.Size + size) * 0.6 && Math.abs(other.Y - hz) < (other.Size + size) * 0.6;
			})) continue;

			objects.push({Kind: name, X: Math.round(hx), Y: Math.round(hz), Size: size, Blocks: true});
			roads.push([[center.X, center.Z], [hx, hz]]);
		}

		/* The road out of it. */
		var away = Math.atan2(-center.Z, -center.X) + (random() - 0.5);
		var out = field.Path({X: center.X, Z: center.Z}, {X: center.X + Math.cos(away) * radius * 2.4, Z: center.Z + Math.sin(away) * radius * 2.4}, {MaxSlope: 0.4});

		if (out) {
			roads.push(out.map(function (point) {
				return [point.X, point.Z];
			}));
		}

		return {Objects: objects, Roads: roads, Center: center};
	}
});
