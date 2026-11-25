/*
 * CombatDemo (Gaming): weapons, hits by material, marks, locks, health, what breaks, a transporter beam and circles of
 * magic on any surface (SceneWeapons, SceneDebris, SceneFracture, SceneEffects; GameCombat, GameStrategy); on a touch
 * screen its gamepad walks, looks, jumps (A) and fires where the crosshair is (RT); the weapons (keys 1 to 0) and the
 * magic are slots of a game (GameSlot) over the scene.
 */
Elemenx.Component('CombatDemo', {
	$TemplateURL: 'CombatDemo.html',
	$StyleURL: 'CombatDemo.css',
	$Traits: ['SceneDemo'],
	$OnCreate: function () {
		this.CombatWeapons = this.$Service('DemoData').Weapons;
	},
	/* Combat and magic: the weapons of the hero (DemoData.Weapons), what it aims at, the crosshair, what was hit. */
	CombatWeapons: [],
	CombatDied: function (event) {
		if (event.ID === 'plate')
			this.CombatNote = 'The steel plate holds no more (Death: keep): it stays where it stands.';
	},
	CombatNote: 'Press the scene to take the pointer: the hero shoots with the left button toward the middle of the view (WASD walks it, Escape gives the pointer back). Fire and Burst shoot at what Aim at names. Each hit shows by its material: sparks on steel, chips of wood, dust of stone, shards of glass; its mark stays. The rocket locks what stays under the crosshair.',
	CombatBroke: function (event) {
		this.CombatNote = event.ID + ' broke into ' + event.Pieces + ' pieces.';
	},
	CombatCracked: function (event) {
		this.CombatNote = event.ID + ' cracked: ' + Math.round(event.Integrity * 100) + '% of it still whole.';
	},
	CombatLocked: function (event) {
		this.CombatNote = 'Locked ' + event.ID + ': a rocket fired now flies to it.';
	},
	CombatHit: function (event) {
		var scene = this.CombatScene ? this.CombatScene() : null;
		var combat = scene ? Elemenx.Instance(scene.$Element().querySelector('.elemenx-game-combat')) : null;
		var health = combat && event.Target ? combat.HealthOf(event.Target) : null;

		if (event.Source !== 'hero') return;

		/* The health of what was hit last, on a GameBar of the HUD. */
		this.CombatTargetHealth = health && event.Target ? {Name: event.Target, Value: Math.max(0, health.Value), Max: health.Max} : this.CombatTargetHealth;
		this.CombatNote = event.Weapon + ' hit ' + (event.Target || 'the ground') + ' (' + event.Material + (event.Part ? ', ' + event.Part : '') + ') for ' + Math.round(event.Amount) + (health ? ' · health ' + Math.round(health.Value) + ' of ' + health.Max : '');
	},
	CombatReady: function (scene) {
		this.CombatScene = function () {
			return scene;
		};

		this.CombatModels();
		this.CombatReset();

		scene.Add('unit', {ID: 'hero', Name: 'Hero', X: 0, Y: 0, Team: 'hero', Weapon: this.CombatWeapon, Facing: 0, Speed: 4});
		scene.Control('hero');

		this.CombatAimed({detail: this.CombatTarget});
	},
	CombatTarget: 'crate',
	CombatTargetHealth: null,
	/* The hero turns to what it aims at, the view behind it. */
	CombatAimed: function (value) {
		var scene = this.CombatScene ? this.CombatScene() : null;
		var inner = scene ? scene.Scene() : null;
		var hero = inner ? inner.Objects.hero : null;
		var at;

		this.CombatTarget = value && value.detail !== undefined ? value.detail : value;

		if (!hero || !hero.World) return;

		if (inner.Hero !== 'hero')
			scene.Control('hero');

		at = this.CombatPoint();

		if (!at) return;

		inner.Yaw = Math.atan2(at[0] - hero.World[0], at[2] - hero.World[2]) + Math.PI;
		inner.Pitch = 0.12;
		hero.Heading = [at[0] - hero.World[0], 0, at[2] - hero.World[2]];
	},
	/* Where the shots go: the middle of the target, or the ground before the hero. */
	CombatPoint: function () {
		var scene = this.CombatScene ? this.CombatScene() : null;
		var inner = scene ? scene.Scene() : null;
		var target = inner ? inner.Objects[this.CombatTarget] : null;
		var body;

		if (this.CombatTarget === 'ground')
			return [0, this.CombatGround(0, 9), 9];

		if (!target || !target.World) return null;

		body = scene.Engine().BodyOf(target);

		return body ? [(body.Min[0] + body.Max[0]) / 2, body.Min[1] + (body.Max[1] - body.Min[1]) * 0.55, (body.Min[2] + body.Max[2]) / 2] : [target.World[0], target.World[1] + 1, target.World[2]];
	},
	/* The height of the ground of the range at a point. */
	CombatGround: function (x, z) {
		var scene = this.CombatScene ? this.CombatScene() : null;
		var ground = scene ? scene.Scene().Ground : null;

		return ground && ground.Field ? Math.max(0, ground.Field.Height(x, z)) : 0;
	},
	CombatWeapon: 'rifle',
	/* The targets again: what broke or fell comes back, the marks stay where they were. */
	CombatReset: function () {
		var scene = this.CombatScene ? this.CombatScene() : null;
		var targets = this.$Service('DemoData').Range([0, 0], [0, 1], '');

		if (!scene) return;

		targets.forEach(function (one) {
			if (scene.Get(one.ID))
				scene.Remove(one.ID);
		});

		scene.Add(targets);

		/* The wall already hit twice: its cracks show at once, and grow with each shot. */
		this.CombatCrack();
	},
	/* A crack asked for before the ground came; its ground came (ground of the Scene): the wall stands on it the frame after. */
	CombatCrackLater: false,
	CombatGrounded: function () {
		var self = this;

		if (!this.CombatCrackLater) return;

		this.CombatCrackLater = false;

		window.requestAnimationFrame(function () {
			self.CombatCrack();
		});
	},
	/* Two blows to the wall: a web of cracks where they struck (SceneFracture). */
	CombatCrack: function () {
		var scene = this.CombatScene ? this.CombatScene() : null;
		var self = this;
		var wall = scene ? scene.Scene().Objects.wall : null;
		if (!wall) return;

		/* No ground yet (it comes after the scene is ready): once it comes (CombatGrounded). */
		if (!scene.Scene().Ground) {
			this.CombatCrackLater = true;

			return;
		}

		/* The wall just put back: it stands on the ground the frame after. */
		if (!wall.World) {
			window.requestAnimationFrame(function () {
				self.CombatCrack();
			});

			return;
		}

		[[-1, 1.2], [0.8, 1.9]].forEach(function (at) {
			scene.Damage('wall', 90, {Point: [wall.World[0] + at[0], wall.World[1] + at[1], wall.World[2] - 0.52], Normal: [0, 0, -1]});
		});
	},
	/* The models of the range (DemoData.RangeModels). */
	CombatModels: function () {
		this.$Service('DemoData').RangeModels(this.$Service('SceneModels'));
	},
	CombatBreak: function () {
		var scene = this.CombatScene ? this.CombatScene() : null;
		if (scene && scene.Get('crate'))
			scene.Break('crate', {Point: [-6, this.CombatGround(-6, 13.4) + 0.6, 13.4], Pattern: 'voronoi', Pieces: 9, Inner: [0.78, 0.62, 0.42]});
	},
	CombatDispel: function () {
		var scene = this.CombatScene ? this.CombatScene() : null;

		(this.CombatCast || []).forEach(function (id) {
			if (scene)
				scene.Dispel(id, 1.4);
		});

		this.CombatCast = [];
	},
	CombatGroundCircle: function () {
		var scene = this.CombatScene ? this.CombatScene() : null;
		var id;

		if (!scene) return;

		id = scene.CastOn('circle', {From: [0, this.CombatGround(0, 6) + 4, 6], Way: [0, -1, 0]}, {Size: 1.4, Draw: 2.6, Seed: 'range-' + Math.round(Math.random() * 1000)});

		this.CombatCast = (this.CombatCast || []).concat(id ? [id] : []);
	},
	/* A circle written on the wall, across it; one on the ground before the hero. */
	CombatCircle: function () {
		var scene = this.CombatScene ? this.CombatScene() : null;
		var id;

		if (!scene) return;

		id = scene.CastOn('circle', {From: [7, this.CombatGround(7, 8) + 1.4, 8], Way: [0, 0, 1]}, {Size: 0.9, Draw: 2.2});

		this.CombatCast = (this.CombatCast || []).concat(id ? [id] : []);
		this.CombatNote = 'CastOn lays a circle across whatever a ray meets (here the wall), written ring by ring; Dispel unwrites it.';
	},
	/* The hero beamed ahead, then back where it was. */
	CombatBeam: function () {
		var scene = this.CombatScene ? this.CombatScene() : null;
		var hero = scene ? scene.Scene().Objects.hero : null;
		var from;

		if (!hero || !hero.World) return;

		from = hero.World.slice();

		scene.Teleport('hero', [from[0] + 6, null, from[2] + 8], {Seconds: 1.4}, function () {
			window.setTimeout(function () {
				if (scene.$Element().isConnected)
					scene.Teleport('hero', [from[0], null, from[2]], {Seconds: 1.4, Color: '#ffd27a'});
			}, 1500);
		});

		this.CombatNote = 'Teleport: the body breaks up into sparkling grains from the top in a column of light and gathers again at the place, the same way.';
	},
	CombatBarrage: function () {
		var self = this;
		var scene = this.CombatScene ? this.CombatScene() : null;
		var count = 0;
		var clock;

		if (!scene) return;

		/* The view turns toward where the shells fall. */
		if (scene.Scene().Hero !== 'hero')
			scene.Control('hero');

		scene.Scene().Yaw = Math.atan2(1, 30) + Math.PI;
		scene.Scene().Pitch = 0.05;

		clock = window.setInterval(function () {
			if (count >= 4 || !scene.$Element().isConnected) {
				window.clearInterval(clock);

				return;
			}

			var x = -8 + count * 6;
			var z = 28 + (count % 2) * 4;
			if (scene.Fire('hero', {Weapon: 'mortar', At: [x, self.CombatGround(x, z), z]}))
				count++;
		}, 700);

		this.CombatNote = 'Mortar shells fly high and blast where they land: what has health near takes less the farther it stands, the ground is scorched and a crater dug in it (Crater of the weapon: Scene.Dig).';
	},
	/* Two squads far apart, sent at each other: blue riflemen and a rocket man, red robots with plasma. */
	CombatSquads: function () {
		var scene = this.CombatScene ? this.CombatScene() : null;
		var strategy = scene ? Elemenx.Instance(scene.$Element().querySelector('.elemenx-game-strategy')) : null;
		var blue = [];
		var red = [];
		var i;

		if (!scene || !strategy) return;

		for (i = 0; i < 4; i++) {
			blue.push({ID: 'blue-' + i, Kind: 'unit', Model: 'soldier', X: -30 + i * 3, Y: 34 + (i % 2) * 3, Team: 'blue', Weapon: i === 3 ? 'rocket' : 'rifle'});
			red.push({ID: 'red-' + i, Kind: 'unit', Model: 'robot', X: 22 + i * 3, Y: 36 + (i % 2) * 3, Team: 'red', Weapon: 'plasma'});
		}

		blue.concat(red).forEach(function (one) {
			if (scene.Get(one.ID))
				scene.Remove(one.ID);
		});

		scene.Add(blue.concat(red));

		strategy.Order(blue.map(function (one) {
			return one.ID;
		}), 'red-0', 'attack');
		strategy.Order(red.map(function (one) {
			return one.ID;
		}), 'blue-0', 'attack');

		/* The view leaves the hero to watch them: a weapon chosen or a target aimed at gives it back. */
		scene.Control('');
		scene.SetViewpoint({Target: [-2, this.CombatGround(-2, 36) + 1, 36], Yaw: Math.PI, Pitch: 0.42, Distance: 34});

		scene.Scene().Wanted = 34;

		this.CombatNote = 'Units with a Weapon shoot from their Range; what they hit is told and makes damage through the health of the scene (Vitals), the bars show who is hurt.';
	},
	CombatBurst: function () {
		var self = this;
		var shots = 0;
		var clock = window.setInterval(function () {
			var scene = self.CombatScene ? self.CombatScene() : null;
			var point = self.CombatPoint();

			if (!scene || !point || !scene.$Element().isConnected || shots >= 5) {
				window.clearInterval(clock);

				return;
			}

			if (scene.Fire('hero', {At: point}))
				shots++;
		}, 60);

		this.CombatAimed({detail: this.CombatTarget});
	},
	CombatFire: function () {
		var scene = this.CombatScene ? this.CombatScene() : null;
		var point = this.CombatPoint();
		if (!scene || !point) return;

		this.CombatAimed({detail: this.CombatTarget});

		/* A beam (the laser) burns for a moment and a half (Hold of the shot); the rest fire once. */
		scene.Fire('hero', {At: point, Hold: 1.5});
	},
	CombatTargets: [
		{Value: 'crate', Label: 'Wooden crate'},
		{Value: 'plate', Label: 'Steel plate'},
		{Value: 'pane', Label: 'Glass pane'},
		{Value: 'wall', Label: 'Stone wall'},
		{Value: 'robot-1', Label: 'Robot'},
		{Value: 'ground', Label: 'The ground'}
	],
	CombatCrosshair: '',
	CombatCrosshairs: [
		{Value: '', Label: 'As the weapon says'},
		{Value: 'dot', Label: 'Dot'},
		{Value: 'cross', Label: 'Cross'},
		{Value: 'circle', Label: 'Circle'},
		{Value: 'chevron', Label: 'Chevron'},
		{Value: 'none', Label: 'None'}
	],
	CombatWeaponChosen: function (value) {
		var scene = this.CombatScene ? this.CombatScene() : null;

		this.CombatWeapon = value && value.detail !== undefined ? value.detail : value;

		if (scene && scene.Get('hero'))
			scene.Scene().Objects.hero.Values.Weapon = this.CombatWeapon;
	},
	/* The magic of the slots over the scene: each one a button of the rows above. */
	CombatSpells: [
		{Value: 'CombatBeam', Label: 'Beam the hero', Icon: 'games:wand', Color: '#ffd27a'},
		{Value: 'CombatCircle', Label: 'Circle on the wall', Icon: 'circle', Color: '#8fb8ff'},
		{Value: 'CombatGroundCircle', Label: 'Circle on the ground', Icon: 'science:galaxy', Color: '#8fb8ff'},
		{Value: 'CombatDispel', Label: 'Dispel', Icon: 'close', Color: '#c9a0ff'},
		{Value: 'CombatBreak', Label: 'Break the crate', Icon: 'games:chest', Color: '#e0a060'},
		{Value: 'CombatCrack', Label: 'Crack the wall', Icon: 'games:pickaxe', Color: '#e0a060'}
	],
	CombatSpell: function (name) {
		if (typeof this[name] === 'function')
			this[name]();
	}
});
