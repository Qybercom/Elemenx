/*
 * SceneWeapons: what a Scene shoots and what a shot does where it hits. The scene knows no health: each hit is told (the
 * event hit, and the hook Hit of its behaviours: the Vitals of ElemenxGaming make damage of it).
 *
 * A weapon is a type (Weapons({name: {...}}) adds or changes them): Kind bullet (a ray at once, a tracer flying along it),
 * beam (a ray as long as it is held: the laser), rail (a ray at once that leaves a spiral of light), projectile (a body that
 * flies: Speed, Gravity, Homing, Size, Glow, Trail; plasma, rocket, shell, arrow); Damage (each hit; a beam a second), Type
 * (kinetic, energy, explosive, fire... for the resistances), Rate (shots a second), Range (metres), Spread (degrees),
 * Pellets (rays a shot), Radius (a blast where it ends: damage less with distance, things pushed, Then the effect of it),
 * Color and Width (of its light), Muzzle (the effect at the muzzle), Recoil (how much the view of the hero kicks), Magazine
 * and Reload (seconds), Lock {Time (seconds on the aim to lock), Cone (degrees), Count (targets at once)}, Crosshair (dot,
 * cross, circle, chevron). Built in: pistol, rifle, shotgun, sniper, laser, railgun, plasma, rocket, artillery, mortar, bow.
 *
 * Fire(id, options) shoots the weapon of an object (Values.Weapon, or options.Weapon) from its muzzle toward options.At (a
 * point [x, y, z] or the ID of an object; an artillery shell takes the arc to reach it) or along options.Way; false while the
 * weapon is not ready (its rate, its magazine). The hero with a Weapon fires with the left button while the pointer is
 * taken, toward the middle of the view, and locks what stays under its aim (Lock of the weapon): lock and unlock events,
 * Locked() the IDs; a homing shot goes to them.
 *
 * Where a shot hits it asks the material there (Values.Material of an object; the name of the material of the part of the
 * model hit; walkers flesh, vehicles metal, plants wood, buildings and rocks stone; of the ground: water, snow, a road, soil)
 * and the rules (HitRules({material: {Effect, Decal, Factor}, 'type/material': {...}})): the effect it bursts, the mark it
 * leaves (hole, dent, chip, scorch, crack: they stay for MarkSeconds, the oldest go past MarkCount, the marks of a thing go
 * with it) and the factor of its damage. The event hit: {Weapon, Type, Source, Team, Target (the ID, null for the ground),
 * Part, Point, Normal, Material, Amount, Distance, ID (of the hit)}; fire ({ID, Weapon, From, Way}).
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
		var state = scene.Weapons = {Clock: 0, Shots: [], Streaks: [], Marks: [], MarksMesh: null, MarksVersion: 0, MarksBuilt: -1, Ready: {}, Rounds: {}, Holding: false, Spread: 0, Locks: {}, Hits: 0, Counter: 0, Kick: 0};
		var programs = null;
		var head = '#version 300 es\nprecision highp float;\n';
		var shaders = this.WeaponShaders(head);

		var fire = [[1, 0.96, 0.7], [1, 0.62, 0.18], [0.5, 0.16, 0.04]];

		scene.WeaponTypes = {
			pistol: {Kind: 'bullet', Damage: 18, Type: 'kinetic', Rate: 4, Range: 120, Spread: 0.9, Color: '#ffd890', Width: 0.02, Muzzle: 'muzzle', Recoil: 0.6, Magazine: 12, Reload: 1.2, Crosshair: 'dot'},
			rifle: {Kind: 'bullet', Damage: 12, Type: 'kinetic', Rate: 10, Range: 300, Spread: 0.7, Color: '#ffd890', Width: 0.025, Muzzle: 'muzzle', Recoil: 0.35, Magazine: 30, Reload: 2, Crosshair: 'cross'},
			shotgun: {Kind: 'bullet', Damage: 9, Type: 'kinetic', Rate: 1.2, Range: 40, Spread: 5, Pellets: 9, Color: '#ffd890', Width: 0.018, Muzzle: 'muzzle', Recoil: 1.6, Magazine: 6, Reload: 2.4, Crosshair: 'circle'},
			sniper: {Kind: 'bullet', Damage: 90, Type: 'kinetic', Rate: 0.7, Range: 900, Spread: 0.05, Color: '#ffe6b0', Width: 0.03, Muzzle: 'muzzle', Recoil: 2.4, Magazine: 5, Reload: 2.6, Crosshair: 'dot'},
			laser: {Kind: 'beam', Damage: 45, Type: 'energy', Range: 400, Color: '#ff3030', Width: 0.05, Muzzle: '', Recoil: 0, Crosshair: 'dot', Heat: 1},
			railgun: {Kind: 'rail', Damage: 110, Type: 'kinetic', Rate: 0.6, Range: 1200, Color: '#7fd8ff', Width: 0.06, Muzzle: 'railflash', Recoil: 2.8, Magazine: 4, Reload: 3, Crosshair: 'chevron', Push: 400},
			plasma: {Kind: 'projectile', Damage: 30, Type: 'energy', Rate: 3, Range: 200, Speed: 45, Gravity: 0, Size: 0.22, Color: '#62ffb0', Spread: 0.6, Muzzle: '', Recoil: 0.5, Magazine: 20, Reload: 2, Crosshair: 'circle', Then: 'plasmaburst'},
			rocket: {Kind: 'projectile', Damage: 90, Type: 'explosive', Rate: 0.8, Range: 500, Speed: 32, Gravity: 0, Size: 0.12, Color: '#ffb060', Trail: 'smoke', Homing: 2.2, Radius: 6, Then: 'blast', Muzzle: 'backblast', Recoil: 1.2, Magazine: 1, Reload: 2.6, Crosshair: 'chevron', Lock: {Time: 0.9, Cone: 7, Count: 1}, Push: 900},
			artillery: {Kind: 'projectile', Damage: 160, Type: 'explosive', Rate: 0.25, Range: 2000, Speed: 140, Gravity: 9.81, Arc: 'high', Size: 0.1, Color: '#ffcf90', Trail: 'thin', Radius: 10, Then: 'blast', Muzzle: 'cannon', Recoil: 3, Crosshair: 'chevron', Push: 1600},
			mortar: {Kind: 'projectile', Damage: 100, Type: 'explosive', Rate: 0.5, Range: 600, Speed: 38, Gravity: 9.81, Arc: 'high', Size: 0.08, Color: '#ffcf90', Trail: 'thin', Radius: 7, Then: 'blast', Muzzle: 'cannon', Recoil: 2, Crosshair: 'chevron', Push: 1200},
			bow: {Kind: 'projectile', Damage: 35, Type: 'kinetic', Rate: 1, Range: 150, Speed: 55, Gravity: 9.81, Size: 0.03, Color: '#d8c8a0', Trail: 'thin', Muzzle: '', Recoil: 0.3, Crosshair: 'dot', Stick: true}
		};

		/* What a hit does, by the material it hits: its effect, its mark, the factor of its damage. */
		scene.HitRules = {
			metal: {Effect: 'hit-metal', Decal: 'dent', Factor: 0.6},
			stone: {Effect: 'hit-stone', Decal: 'hole', Factor: 0.8},
			wood: {Effect: 'hit-wood', Decal: 'chip', Factor: 1},
			soil: {Effect: 'hit-soil', Decal: 'pit', Factor: 1},
			snow: {Effect: 'hit-snow', Decal: 'pit', Factor: 1},
			water: {Effect: 'hit-water', Decal: '', Factor: 1},
			flesh: {Effect: 'hit-flesh', Decal: '', Factor: 1},
			glass: {Effect: 'hit-glass', Decal: 'crack', Factor: 1.5},
			fabric: {Effect: 'hit-dust', Decal: 'hole', Factor: 1},
			energy: {Effect: 'hit-energy', Decal: 'scorch'},
			explosive: {Effect: '', Decal: 'scorch'},
			'energy/water': {Effect: 'hit-steam', Decal: ''},
			'energy/flesh': {Effect: 'hit-energy', Decal: ''},
			'explosive/water': {Effect: 'hit-water', Decal: ''}
		};

		self.Effects({
			muzzle: {Lamp: {Color: '#ffb060', Power: 0.6, Radius: 7, Flicker: 0}, Once: true, Lasts: 0.08, Layers: [
				{Kind: 'flame', Count: 10, Life: 0.06, Speed: [6, 14], Spread: 0.25, Drag: 6, Size: [0.12, 0.3], Color: fire, Blend: 'add'},
				{Kind: 'spark', Count: 6, Life: 0.25, Speed: [4, 10], Spread: 0.3, Drag: 2, Size: [0.008, 0.003], Stretch: 0.02, Color: [1, 0.75, 0.4], Blend: 'add'}
			]},
			cannon: {Lamp: {Color: '#ffb060', Power: 2, Radius: 16, Flicker: 0}, Once: true, Lasts: 0.25, Layers: [
				{Kind: 'flame', Count: 30, Life: 0.15, Speed: [10, 26], Spread: 0.35, Drag: 5, Size: [0.5, 1.6], Color: fire, Blend: 'add'},
				{Kind: 'smoke', Count: 22, Life: 3, Speed: [2, 7], Spread: 0.6, Rise: 0.5, Drag: 1.6, Size: [0.6, 3], Wander: 0.4, Color: [0.5, 0.49, 0.48], Opacity: 0.3, Blend: 'alpha'}
			]},
			backblast: {Lamp: {Color: '#ffb060', Power: 1, Radius: 10, Flicker: 0}, Once: true, Lasts: 0.2, Layers: [
				{Kind: 'flame', Count: 16, Life: 0.12, Speed: [4, 10], Spread: 0.5, Drag: 4, Size: [0.2, 0.7], Color: fire, Blend: 'add'},
				{Kind: 'smoke', Count: 18, Life: 2, Speed: [1, 4], Spread: 0.9, Rise: 0.4, Drag: 1.6, Size: [0.3, 1.8], Wander: 0.4, Color: [0.62, 0.62, 0.62], Opacity: 0.25, Blend: 'alpha'}
			]},
			railflash: {Lamp: {Color: '#7fd8ff', Power: 1.4, Radius: 12, Flicker: 0}, Once: true, Lasts: 0.15, Layers: [
				{Kind: 'spark', Count: 30, Life: 0.4, Speed: [3, 9], Spread: 0.7, Drag: 2, Size: [0.012, 0.004], Stretch: 0.03, Color: [0.6, 0.9, 1], Blend: 'add'},
				{Kind: 'wave', Life: 0.25, Size: [0.8, 0.8], Color: [0.4, 0.8, 1], Hot: [0.9, 1, 1], Blend: 'add'}
			]},
			'hit-metal': {Lamp: {Color: '#ffc070', Power: 0.25, Radius: 4, Flicker: 0}, Once: true, Lasts: 0.1, Layers: [
				{Kind: 'spark', Count: 22, Life: 0.6, Speed: [2, 8], Spread: 0.7, Gravity: 9, Drag: 0.8, Bounce: 0.3, Size: [0.012, 0.004], Stretch: 0.025, Color: [1, 0.75, 0.4], Blend: 'add'},
				{Kind: 'smoke', Count: 3, Life: 0.8, Speed: [0.3, 1], Spread: 0.5, Rise: 0.3, Drag: 2, Size: [0.04, 0.25], Color: [0.5, 0.5, 0.5], Opacity: 0.15, Blend: 'alpha'}
			]},
			'hit-stone': {Lamp: null, Once: true, Lasts: 0.1, Layers: [
				{Kind: 'smoke', Count: 10, Life: 1.4, Speed: [0.6, 2.4], Spread: 0.6, Rise: 0.2, Gravity: 1, Drag: 1.6, Size: [0.06, 0.5], Wander: 0.2, Color: [0.62, 0.6, 0.56], Opacity: 0.35, Blend: 'alpha'},
				{Kind: 'spark', Count: 12, Life: 0.7, Speed: [2, 6], Spread: 0.6, Gravity: 9, Drag: 0.5, Bounce: 0.3, Size: [0.014, 0.014], Stretch: 0, Color: [0.35, 0.33, 0.3], Blend: 'alpha'}
			]},
			'hit-wood': {Lamp: null, Once: true, Lasts: 0.1, Layers: [
				{Kind: 'spark', Count: 14, Life: 0.9, Speed: [1.5, 5], Spread: 0.6, Gravity: 9, Drag: 0.6, Bounce: 0.2, Size: [0.02, 0.008], Stretch: 0.01, Color: [0.55, 0.4, 0.22], Blend: 'alpha'},
				{Kind: 'smoke', Count: 6, Life: 1, Speed: [0.4, 1.6], Spread: 0.5, Rise: 0.2, Drag: 1.8, Size: [0.05, 0.35], Color: [0.6, 0.52, 0.4], Opacity: 0.25, Blend: 'alpha'}
			]},
			'hit-soil': {Lamp: null, Once: true, Lasts: 0.1, Layers: [
				{Kind: 'smoke', Count: 12, Life: 1.2, Speed: [1, 3.6], Spread: 0.45, Gravity: 4, Drag: 1.4, Size: [0.08, 0.6], Wander: 0.2, Color: [0.36, 0.3, 0.22], Opacity: 0.4, Blend: 'alpha'},
				{Kind: 'spark', Count: 14, Life: 0.8, Speed: [2, 5], Spread: 0.5, Gravity: 9, Drag: 0.4, Size: [0.016, 0.016], Stretch: 0, Color: [0.25, 0.2, 0.14], Blend: 'alpha'}
			]},
			'hit-snow': {Lamp: null, Once: true, Lasts: 0.1, Layers: [
				{Kind: 'smoke', Count: 14, Life: 1.2, Speed: [1, 3], Spread: 0.5, Gravity: 3, Drag: 1.4, Size: [0.08, 0.6], Wander: 0.3, Color: [0.95, 0.97, 1], Opacity: 0.45, Blend: 'alpha'}
			]},
			'hit-water': {Lamp: null, Once: true, Lasts: 0.1, Layers: [
				{Kind: 'smoke', Count: 14, Life: 0.9, Speed: [2, 5], Spread: 0.3, Rise: 0.4, Gravity: 9, Drag: 0.8, Size: [0.05, 0.4], Wander: 0.1, Color: [0.92, 0.95, 0.97], Opacity: 0.45, Blend: 'alpha'},
				{Kind: 'wave', Life: 0.8, Size: [0.6, 0.6], Color: [0.6, 0.7, 0.75], Hot: [0.9, 0.95, 1], Blend: 'add'}
			]},
			'hit-flesh': {Lamp: null, Once: true, Lasts: 0.1, Layers: [
				{Kind: 'smoke', Count: 9, Life: 0.5, Speed: [0.8, 2.4], Spread: 0.5, Gravity: 3, Drag: 2, Size: [0.05, 0.3], Color: [0.45, 0.03, 0.03], Opacity: 0.55, Blend: 'alpha'},
				{Kind: 'spark', Count: 10, Life: 0.6, Speed: [1, 3.5], Spread: 0.5, Gravity: 9, Drag: 0.5, Size: [0.014, 0.014], Stretch: 0, Color: [0.4, 0.02, 0.02], Blend: 'alpha'}
			]},
			'hit-glass': {Lamp: null, Once: true, Lasts: 0.1, Layers: [
				{Kind: 'spark', Count: 26, Life: 0.9, Speed: [1, 5], Spread: 0.7, Gravity: 9, Drag: 0.3, Bounce: 0.2, Size: [0.016, 0.006], Stretch: 0.004, Color: [0.85, 0.95, 1], Blend: 'add'}
			]},
			'hit-dust': {Lamp: null, Once: true, Lasts: 0.1, Layers: [
				{Kind: 'smoke', Count: 8, Life: 1.2, Speed: [0.4, 1.6], Spread: 0.5, Rise: 0.2, Drag: 1.8, Size: [0.05, 0.4], Wander: 0.2, Color: [0.7, 0.68, 0.64], Opacity: 0.3, Blend: 'alpha'}
			]},
			'hit-energy': {Lamp: {Color: '#ff7040', Power: 0.4, Radius: 5, Flicker: 0.2}, Once: true, Lasts: 0.12, Layers: [
				{Kind: 'spark', Count: 16, Life: 0.5, Speed: [1, 4], Spread: 0.8, Gravity: 3, Drag: 1, Size: [0.012, 0.004], Stretch: 0.02, Color: [1, 0.55, 0.3], Blend: 'add'},
				{Kind: 'smoke', Count: 4, Life: 1.4, Speed: [0.2, 0.8], Spread: 0.4, Rise: 0.8, Drag: 1.2, Size: [0.06, 0.4], Color: [0.3, 0.3, 0.3], Opacity: 0.2, Blend: 'alpha'}
			]},
			'hit-steam': {Lamp: null, Once: true, Lasts: 0.1, Layers: [
				{Kind: 'smoke', Count: 10, Life: 1.4, Speed: [0.5, 1.4], Spread: 0.4, Rise: 1, Drag: 1, Size: [0.1, 0.8], Wander: 0.3, Color: [0.85, 0.87, 0.9], Opacity: 0.3, Blend: 'alpha'}
			]},
			/* A shell or a rocket that lands: a short fireball, earth and dust thrown up, light, grey-brown in the sun. */
			blast: {Lamp: {Color: '#ffa050', Power: 2, Radius: 22, Flicker: 0}, Heat: 1.5, Once: true, Lasts: 3, Layers: [
				{Kind: 'flame', Count: 70, Life: 0.45, Speed: [3, 11], Spread: 1.6, Rise: 1.6, Drag: 3.4, Size: [0.8, 1.8], Wander: 0.3, Color: fire, Blend: 'add'},
				{Kind: 'smoke', Count: 34, Life: 3, Speed: [2, 8], Spread: 1.3, Rise: 0.7, Gravity: 1.5, Drag: 2, Size: [0.8, 4], Wander: 0.6, Color: [0.82, 0.76, 0.66], Opacity: 0.3, Blend: 'alpha', Start: 0.08},
				{Kind: 'spark', Count: 60, Life: 1.6, Speed: [4, 14], Spread: 1.2, Gravity: 9, Drag: 0.6, Bounce: 0.3, Size: [0.03, 0.03], Stretch: 0, Color: [0.28, 0.22, 0.15], Blend: 'alpha'},
				{Kind: 'spark', Count: 50, Life: 1.2, Speed: [6, 20], Spread: 1.6, Gravity: 10, Drag: 0.9, Size: [0.025, 0.008], Stretch: 0.02, Color: [1, 0.7, 0.3], Blend: 'add'}
			]},
			plasmaburst: {Lamp: {Color: '#62ffb0', Power: 1, Radius: 8, Flicker: 0}, Once: true, Lasts: 0.3, Layers: [
				{Kind: 'wave', Life: 0.35, Size: [1.2, 1.2], Color: [0.3, 1, 0.6], Hot: [0.85, 1, 0.9], Blend: 'add'},
				{Kind: 'spark', Count: 26, Life: 0.6, Speed: [2, 6], Spread: 1.2, Gravity: 2, Drag: 1.4, Size: [0.012, 0.004], Stretch: 0.02, Color: [0.5, 1, 0.7], Blend: 'add'}
			]}
		});

		function number (value, fallback) {
			return value === null || value === undefined || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		function colorOf (text, fallback) {
			var hex = String(text || '').replace('#', '');
			if (!/^[0-9a-f]{6}$/i.test(hex)) return fallback || [1, 1, 1];

			return [parseInt(hex.slice(0, 2), 16) / 255, parseInt(hex.slice(2, 4), 16) / 255, parseInt(hex.slice(4, 6), 16) / 255];
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

			return body ? Math.max(0.2, body.Max[1] - body.Min[1]) : Math.max(0.5, object.Size || 1);
		}

		/* Where a shot leaves an object: its muzzle (the far end of what it holds), else at its chest, ahead of it. */
		function muzzleOf (object, toward) {
			var height = heightOf(object);
			var way = toward ? vectors.Subtract(toward, object.World) : object.Heading || [0, 0, 1];
			var flat = Math.hypot(way[0], way[2]) || 1;

			return [object.World[0] + way[0] / flat * 0.45, object.World[1] + height * 0.72, object.World[2] + way[2] / flat * 0.45];
		}

		/* Where one aims at an object: the middle of its body. */
		function centerOf (object) {
			var body = engine.BodyOf ? engine.BodyOf(object) : null;
			if (body)
				return [(body.Min[0] + body.Max[0]) / 2, (body.Min[1] + body.Max[1]) / 2, (body.Min[2] + body.Max[2]) / 2];

			return [object.World[0], object.World[1] + heightOf(object) * 0.5, object.World[2]];
		}

		/* What a material of a part of a model is called, its kind. */
		function materialNamed (name) {
			var text = String(name || '').toLowerCase();
			if (/glass|window|windscreen|windshield|crystal/.test(text)) return 'glass';
			if (/metal|steel|iron|chrome|alumin|copper|brass|gun|car_paint|carpaint|body_paint/.test(text)) return 'metal';
			if (/wood|bark|plank|log|timber|crate/.test(text)) return 'wood';
			if (/stone|brick|concrete|rock|marble|tile|plaster/.test(text)) return 'stone';
			if (/skin|flesh|face|body|hair/.test(text)) return 'flesh';
			if (/cloth|fabric|leather|cotton|seat/.test(text)) return 'fabric';

			return '';
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

			if (traitOf(object, 'Walker') || object.Kind === 'unit') return 'flesh';

			if (object.Values.Vehicle) return 'metal';

			info = library.Has(String(object.Values.Model || (traitOf(object, 'Model') || {}).Shape || '')) ? library.Info(String(object.Values.Model || traitOf(object, 'Model').Shape)) : null;

			if (info && info.Type === 'plant') return 'wood';
			if (info && (info.Type === 'building' || info.Type === 'rock' || info.Group === 'buildings')) return 'stone';
			if (info && (info.Group === 'transport' || info.Type === 'ship' || info.Type === 'vehicle')) return 'metal';

			return 'wood';
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

			if (cast && cast.ID !== skip)
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

				if (id === skip || object.Hidden || !object.World || object.Owner === skip || object.Values.Shootable === false) return;

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
		function mark (kind, point, normal, size, object) {
			var count = number(self.MarkCount, 200);
			var turn = object && object.Turn ? object.Turn : null;

			if (!kind || !renderer) return;

			state.Marks.push({Kind: kind, Point: point.slice(), Normal: normal.slice(), Size: size, Seed: Math.random(), Born: state.Clock, Object: object ? object.ID : '', Local: object ? local(object, point, turn) : null, LocalNormal: object && turn ? applyNormal(math.Invert(turn), normal) : normal.slice()});

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

			if (shot.Source === scene.Hero && found.ID)
				state.Marked = {At: state.Clock, Kill: false, Target: found.ID};

			self.$Emit('hit', told);
			self.RunBehaviours('Hit', [told]);

			return told;
		}

		/* A blast where a shot ends: each thing near takes less the farther it stands, rigid things are pushed away. */
		function blast (shot, point, normal) {
			var type = shot.Type;
			var radius = number(type.Radius, 0);

			if (type.Then && self.Burst)
				self.Burst(type.Then, vectors.Add(point, vectors.Scale(normal, 0.1)), {Size: Math.max(0.4, radius / 6), Aim: normal});

			if (!radius) return;

			Object.keys(scene.Objects).forEach(function (id) {
				var object = scene.Objects[id];
				var middle;
				var far;
				var way;

				if (!object.World || object.Hidden || object.Owner) return;

				middle = centerOf(object);
				far = vectors.Distance(middle, point);

				if (far > radius) return;

				way = far > 0.01 ? vectors.Normalize(vectors.Subtract(middle, point)) : [0, 1, 0];

				if (engine.RigidPush && type.Push)
					engine.RigidPush(id, vectors.Scale(way, number(type.Push, 0) * (1 - far / radius)), point);

				if (!traitOf(object, 'Health') && !object.Values.Health) return;

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
			state.Streaks.push({From: from.slice(), To: to.slice(), Color: color, Width: width, Born: state.Clock, Lasts: lasts, Kind: kind || 'tracer'});
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

			if ((state.Ready[key] || 0) > state.Clock && type.Kind !== 'beam') return false;

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

			/* A beam already held goes on, turned to where it is aimed now. */
			if (type.Kind === 'beam') {
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

			if (rounds) {
				rounds.Left--;

				if (rounds.Left <= 0)
					rounds.Reloading = state.Clock + number(type.Reload, 2);
			}

			if (type.Muzzle && self.Burst && type.Kind !== 'beam')
				self.Burst(type.Muzzle, from, {Aim: way, Size: type.Kind === 'projectile' && type.Arc ? 1.5 : 1});

			if (type.Arc && at && type.Gravity) {
				var arced = arc(from, at, number(type.Speed, 100), number(type.Gravity, 9.81), type.Arc === 'high');
				if (arced)
					way = arced;
			}

			count = Math.max(1, number(type.Pellets, 1));

			for (i = 0; i < count; i++) {
				var shot = {ID: id + '-' + (++state.Counter), Name: typeof name === 'string' ? name : 'own', Type: type, Source: id, Team: object.Team || object.Values.Team || '', From: from.slice(), Way: spread(way, number(settings.Spread, number(type.Spread, 0)) + (id === scene.Hero ? state.Spread : 0)), Target: target ? target.ID : settings.Target || (id === scene.Hero ? lockedFirst() : ''), Born: state.Clock};

				launch(shot);
			}

			if (id === scene.Hero) {
				state.Spread = Math.min(4, state.Spread + number(type.Recoil, 0.4) * 0.6);
				state.Kick += number(type.Recoil, 0.4) * 0.012;
			}

			self.$Emit('fire', {ID: id, Weapon: typeof name === 'string' ? name : 'own', From: from, Way: way});

			return true;
		};

		/* The flight of a shot begins: a ray hits now, a beam is held, a body flies. */
		function launch (shot) {
			var type = shot.Type;
			var range = number(type.Range, 200);
			var color = colorOf(type.Color, [1, 0.85, 0.55]);
			var found;
			var end;

			if (type.Kind === 'projectile') {
				shot.At = shot.From.slice();
				shot.Velocity = vectors.Scale(shot.Way, number(type.Speed, 40));
				shot.Flown = 0;
				shot.Trail = [shot.From.slice()];

				state.Shots.push(shot);

				return;
			}

			if (type.Kind === 'beam') {
				shot.Until = state.Clock + number(type.Hold, 0.12);
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

		/* The shots that fly and the beams held, a step of time. */
		function step (elapsed) {
			var field = scene.Ground ? scene.Ground.Field : null;

			state.Shots = state.Shots.filter(function (shot) {
				var type = shot.Type;
				var found;

				if (type.Kind === 'beam') {
					var holder = scene.Objects[shot.Source];
					var range = number(type.Range, 400);
					var end;

					if (!holder || state.Clock > shot.Until) return false;

					/* The beam of the hero held by the button goes where the view looks. */
					if (shot.Source === scene.Hero && state.Holding)
						aimFromView(shot);

					found = trace(shot.From, shot.Way, range, shot.Source);
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

				var substeps = Math.max(1, Math.ceil(vectors.Length(shot.Velocity) * elapsed / 2));
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

					shot.Velocity[1] -= number(type.Gravity, 0) * dt;
					moved = vectors.Scale(shot.Velocity, dt);
					shot.At = vectors.Add(shot.At, moved);
					shot.Flown += vectors.Length(moved);
					way = vectors.Normalize(moved);

					found = trace(before, way, vectors.Length(moved) + 0.01, shot.Source);

					if (found) {
						shot.At = found.Point;

						shot.Trail.push(found.Point.slice());

						if (type.Stick)
							mark('chip', found.Point, found.Normal, 0.06, found.Object);

						hit(shot, found, number(type.Damage, 10), way);

						blast(shot, found.Point, found.Normal);

						return false;
					}

					if (shot.Flown > number(type.Range, 200) * (type.Arc ? 3 : 1) || field && shot.At[1] < -500) return false;
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

		/* The aim of the hero: from its muzzle toward what the middle of the view shows. */
		function aimFromView (shot) {
			var hero = scene.Objects[scene.Hero];
			var ray = engine.Ray(scene.Width / 2, scene.Height / 2);
			var range = number(shot.Type.Range, 300);
			var found = trace(ray.Origin, ray.Direction, range + 50, scene.Hero);
			var point = found ? found.Point : vectors.Add(ray.Origin, vectors.Scale(ray.Direction, range));

			shot.From = muzzleOf(hero, point);
			shot.Way = vectors.Normalize(vectors.Subtract(point, shot.From));
		}

		function heroFire () {
			var hero = scene.Objects[scene.Hero];
			var type = hero ? typeOf(hero.Values.Weapon) : null;
			var ray;
			var range;
			var found;
			var point;

			if (!type || !scene.Width) return false;

			ray = engine.Ray(scene.Width / 2, scene.Height / 2);
			range = number(type.Range, 300);
			found = trace(ray.Origin, ray.Direction, range + 50, scene.Hero);
			point = found ? found.Point : vectors.Add(ray.Origin, vectors.Scale(ray.Direction, range));

			/* A beam held is one shot made longer. */
			if (type.Kind === 'beam') {
				var held = state.Shots.filter(function (shot) {
					return shot.Source === scene.Hero && shot.Type === type;
				})[0];

				if (held) {
					held.Until = state.Clock + 0.12;

					return true;
				}
			}

			return engine.Fire(scene.Hero, {At: point});
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
			var type = hero ? typeOf(hero.Values.Weapon) : null;
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
			range = number(type.Range, 300);
			ray = engine.Ray(scene.Width / 2, scene.Height / 2);

			candidates = Object.keys(scene.Objects).map(function (id) {
				var object = scene.Objects[id];
				var middle;
				var way;
				var far;
				var angle;
				var seen;

				if (id === scene.Hero || !object.World || object.Hidden || object.Owner || !traitOf(object, 'Health') && !object.Values.Health) return null;

				if (hero.Team && object.Team && String(hero.Team) === String(object.Team)) return null;

				middle = centerOf(object);
				way = vectors.Subtract(middle, ray.Origin);
				far = vectors.Length(way);

				if (far > range) return null;

				angle = Math.acos(Math.max(-1, Math.min(1, vectors.Dot(vectors.Scale(way, 1 / far), ray.Direction))));

				if (angle > cone) return null;

				seen = trace(ray.Origin, vectors.Scale(way, 1 / far), far + 1, scene.Hero);

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

					self.$Emit('lock', {ID: one.ID, Weapon: hero.Values.Weapon});
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

			if (state.Holding && scene.Hero)
				heroFire();

			step(elapsed);

			locking(elapsed);

			/* The view of the hero kicks up with each shot, then settles. */
			if (state.Kick > 0.0001) {
				var taken = Math.min(state.Kick, elapsed * 0.6 + state.Kick * elapsed * 12);

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

		/* The crosshair and the locks over the view. */
		function aimLayer () {
			var layer = self.$Element().querySelector('.elemenx-scene-aim');
			var hero = scene.Objects[scene.Hero];
			var type = hero ? typeOf(hero.Values.Weapon) : null;
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
					var head = Math.min(length, age * length * 1.15 + 1);
					var tail = Math.max(0, head - Math.min(6, length * 0.4));

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
				var size = number(type.Size, 0.1);
				var i;

				if (type.Kind === 'beam') {
					if (!shot.End) return;

					ribbon(ribbons, shot.From, shot.End, number(type.Width, 0.05), vectors.Scale(color, 6), 1, false);
					ribbon(ribbons, shot.From, shot.End, number(type.Width, 0.05) * 5, vectors.Scale(color, 0.8), 1, false);

					return;
				}

				/* The body: a glowing dash along its flight; its trail behind it, of light or of smoke. */
				var way = vectors.Normalize(shot.Velocity);

				ribbon(ribbons, vectors.Subtract(shot.At, vectors.Scale(way, size * 3)), vectors.Add(shot.At, vectors.Scale(way, size)), size, vectors.Scale(color, 4), 1, true);

				for (i = 1; i < shot.Trail.length; i++) {
					var part = i / shot.Trail.length;

					if (type.Trail === 'smoke') ribbon(smoke, shot.Trail[i - 1], shot.Trail[i], 0.12 + (1 - part) * 0.5, [0.6, 0.6, 0.62], 0.28 * part, false);
					else if (type.Trail === 'thin') ribbon(ribbons, shot.Trail[i - 1], shot.Trail[i], 0.01, vectors.Scale(color, 0.5 * part), 1, false);
					else ribbon(ribbons, shot.Trail[i - 1], shot.Trail[i], size * 0.6 * part, vectors.Scale(color, 1.5 * part), 1, false);
				}
			});

			drawMarks(matrix);

			[[smoke, 'alpha'], [ribbons, 'add']].forEach(function (pass) {
				var mesh;

				if (!pass[0].Indices.length) return;

				mesh = renderer.Mesh(pass[0]);

				renderer.Draw(mesh, programs.Streak, {uViewProjection: matrix, uSmoke: pass[1] === 'alpha' ? 1 : 0}, {Blend: pass[1], DepthWrite: false, Cull: 'none'});

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

			renderer.Draw(state.MarksMesh, programs.Mark, {uViewProjection: matrix, uEye: scene.Eye || [0, 0, 0], uSun: ground ? ground.Sun : [0.3, 0.8, 0.5], uSunColor: ground ? ground.SunColor : [1, 1, 1], uSky: ground ? ground.SkyLight : [0.3, 0.3, 0.32], uTime: state.Clock, uKeep: number(self.MarkSeconds, 60)}, {Blend: 'over', DepthWrite: false, Depth: 'lequal', Cull: 'none'});
		}

		engine.WeaponsState = function () {
			return state;
		};

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

	/* A shot of the weapon of an object: Fire(id, {At, Way, Weapon, Spread, From}); false while it is not ready. */
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

	/* The left button fires the weapon of the hero while the pointer is taken. */
	WeaponsPointer: function (kind, event) {
		var scene = this.Scene();
		var engine = this.Engine();
		var hero = scene.Hero ? scene.Objects[scene.Hero] : null;

		if (!engine || !engine.WeaponsHold || !hero || !hero.Values.Weapon || event.button !== 0 && kind === 'down' || !this.Captured()) {
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
				'float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
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
