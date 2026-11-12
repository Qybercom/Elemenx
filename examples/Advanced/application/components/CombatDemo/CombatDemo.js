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
		var targets = [
			{ID: 'crate', Kind: 'thing', Model: 'demo-crate', Size: 1.2, X: -6, Y: 14, Material: 'wood', Traits: {Fracture: {Material: 'wood', Pieces: 7}}},
			{ID: 'plate', Kind: 'thing', Model: 'demo-plate', Size: 1.6, X: -2, Y: 14, Material: 'metal', Traits: {Health: {Max: 400, Death: 'keep'}, Fracture: {Material: 'metal', Pattern: 'parts'}}},
			{ID: 'pane', Kind: 'thing', Model: 'demo-pane', Size: 1.7, X: 2, Y: 14, Material: 'glass', Traits: {Fracture: {Material: 'glass'}}},
			{ID: 'wall', Kind: 'thing', Model: 'demo-wall', Size: 2.5, X: 7, Y: 16, Material: 'stone', Traits: {Fracture: {Material: 'stone', Pieces: 14}}},
			{ID: 'robot-1', Kind: 'unit', Model: 'robot', X: -3, Y: 24, Team: 'red', Health: 120, Damage: 0, Sight: 1},
			{ID: 'robot-2', Kind: 'unit', Model: 'robot', X: 3, Y: 26, Team: 'red', Health: 120, Damage: 0, Sight: 1}
		];

		if (!scene) return;

		targets.forEach(function (one) {
			if (scene.Get(one.ID))
				scene.Remove(one.ID);
		});

		scene.Add(targets);

		/* The wall already hit twice: its cracks show at once, and grow with each shot. */
		this.CombatCrack();
	},
	/* Two blows to the wall: a web of cracks where they struck (SceneFracture). */
	CombatCrack: function () {
		var scene = this.CombatScene ? this.CombatScene() : null;
		var self = this;
		var wall = scene ? scene.Scene().Objects.wall : null;
		if (!wall) return;

		/* Not standing on its ground yet (the ground comes after the scene is ready): a little later. */
		if (!wall.World || !scene.Scene().Ground) {
			setTimeout(function () {
				self.CombatCrack();
			}, 300);

			return;
		}

		[[-1, 1.2], [0.8, 1.9]].forEach(function (at) {
			scene.Damage('wall', 90, {Point: [wall.World[0] + at[0], wall.World[1] + at[1], wall.World[2] - 0.52], Normal: [0, 0, -1]});
		});
	},
	/* The models of the range: a crate of planks, a steel plate on posts, a pane of glass in a frame, a wall of stone. */
	CombatModels: function () {
		var models = this.$Service('SceneModels');
		if (models.Has('demo-crate')) return;

		models.Define('demo-crate', {Group: 'props', Type: 'thing', Size: 1, Build: function (tools) {
			var wood = [0.62, 0.45, 0.26];
			var dark = [0.42, 0.29, 0.16];

			return [tools.Piece('body', [tools.Box(1, 1, 1, [0, 0.5, 0], wood), tools.Box(1.02, 0.12, 1.02, [0, 0.08, 0], dark), tools.Box(1.02, 0.12, 1.02, [0, 0.92, 0], dark), tools.Box(0.12, 1.02, 1.02, [-0.45, 0.5, 0], dark), tools.Box(0.12, 1.02, 1.02, [0.45, 0.5, 0], dark)])];
		}});

		models.Define('demo-plate', {Group: 'props', Type: 'thing', Size: 1, Build: function (tools) {
			var steel = [0.58, 0.6, 0.64];

			return [tools.Piece('body', [tools.Box(1.2, 0.9, 0.06, [0, 0.95, 0], steel), tools.Box(0.08, 1.4, 0.08, [-0.5, 0.7, 0.06], [0.3, 0.3, 0.32]), tools.Box(0.08, 1.4, 0.08, [0.5, 0.7, 0.06], [0.3, 0.3, 0.32])])];
		}});

		models.Define('demo-pane', {Group: 'props', Type: 'thing', Size: 1, Build: function (tools) {
			var frame = [0.25, 0.25, 0.28];

			return [tools.Piece('body', [tools.Box(1, 1.3, 0.02, [0, 0.95, 0], [0.7, 0.85, 0.95]), tools.Box(1.1, 0.06, 0.06, [0, 0.3, 0], frame), tools.Box(1.1, 0.06, 0.06, [0, 1.6, 0], frame), tools.Box(0.06, 1.36, 0.06, [-0.55, 0.95, 0], frame), tools.Box(0.06, 1.36, 0.06, [0.55, 0.95, 0], frame), tools.Box(0.06, 0.3, 0.06, [0, 0.15, 0], frame)])];
		}});

		models.Define('demo-wall', {Group: 'buildings', Type: 'building', Size: 1, Build: function (tools) {
			return [tools.Piece('body', [tools.Box(4, 2.5, 0.4, [0, 1.25, 0], [0.62, 0.6, 0.56]), tools.Box(4.1, 0.2, 0.5, [0, 2.5, 0], [0.5, 0.48, 0.45])])];
		}});
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

		this.CombatNote = 'Mortar shells fly high and blast where they land: what has health near takes less the farther it stands, the ground is scorched.';
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
			blue.push({ID: 'blue-' + i, Kind: 'unit', Model: 'soldier', X: -30 + i * 3, Y: 34 + (i % 2) * 3, Team: 'blue', Weapon: i === 3 ? 'rocket' : 'rifle', Range: 28, Sight: 40, Health: 100});
			red.push({ID: 'red-' + i, Kind: 'unit', Model: 'robot', X: 22 + i * 3, Y: 36 + (i % 2) * 3, Team: 'red', Weapon: 'plasma', Range: 24, Sight: 40, Health: 100});
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
		var self = this;
		var scene = this.CombatScene ? this.CombatScene() : null;
		var point = this.CombatPoint();
		var held = 0;
		var clock;

		if (!scene || !point) return;

		this.CombatAimed({detail: this.CombatTarget});

		/* A laser is held for a moment and a half. */
		if (this.CombatWeapon === 'laser') {
			clock = window.setInterval(function () {
				held += 50;

				if (held > 1500 || !scene.$Element().isConnected) {
					window.clearInterval(clock);

					return;
				}

				scene.Fire('hero', {At: self.CombatPoint() || point});
			}, 50);

			return;
		}

		scene.Fire('hero', {At: point});
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
	/* Combat and magic: the weapons of the hero, what it aims at, the crosshair, what was hit. */
	CombatWeapons: [
		{Value: 'rifle', Label: 'Rifle', Icon: 'games:crosshair', Key: '1'},
		{Value: 'pistol', Label: 'Pistol', Icon: 'games:joystick', Key: '2'},
		{Value: 'shotgun', Label: 'Shotgun', Icon: 'games:star-power', Key: '3'},
		{Value: 'sniper', Label: 'Sniper rifle', Icon: 'science:telescope', Key: '4'},
		{Value: 'laser', Label: 'Laser', Icon: 'science:prism', Key: '5'},
		{Value: 'railgun', Label: 'Railgun', Icon: 'science:magnet', Key: '6'},
		{Value: 'plasma', Label: 'Plasma', Icon: 'science:atom', Key: '7'},
		{Value: 'rocket', Label: 'Rocket (locks)', Icon: 'science:rocket', Key: '8'},
		{Value: 'mortar', Label: 'Mortar', Icon: 'games:bomb', Key: '9'},
		{Value: 'bow', Label: 'Bow', Icon: 'games:bow', Key: '0'}
	],
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
	},

	/*
	 * The trigger of the gamepad on the screen fires where the crosshair is, as a press of the mouse does, the view staying
	 * where it was turned; a laser burns while it is held. Regression: it fired as the Fire button does, the view turned to
	 * the target of the list each time.
	 */
	CombatPad: function (event) {
		var scene = this.CombatScene ? this.CombatScene() : null;

		if (event.Button !== 'rt') return;

		window.clearInterval(this.CombatHeld);

		if (!event.Down || !scene) return;

		scene.Fire('hero');

		if (this.CombatWeapon === 'laser') {
			this.CombatHeld = window.setInterval(function () {
				if (scene.$Element().isConnected)
					scene.Fire('hero');
			}, 50);
		}
	},

	$OnDestroy: function () {
		window.clearInterval(this.CombatHeld);
	}
});
