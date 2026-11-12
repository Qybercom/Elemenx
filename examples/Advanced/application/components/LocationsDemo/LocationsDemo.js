/*
 * LocationsDemo (Graphics): Scene · a location of a model: a click takes the mouse, WASD walk, Shift runs, Shift and
 * Alt sprint, A and D step aside, Space jumps, the right button looks round without turning the walk, V changes the
 * camera, Escape frees the mouse
 */
Elemenx.Component('LocationsDemo', {
	$TemplateURL: 'LocationsDemo.html',
	$Traits: ['SceneDemo'],
	PlaceReady: function (scene) {
		this.PlaceScene = function () {
			return scene;
		};

		/* The demo alone on its page: its location at once (tens of megabytes: the catalogue waited to be asked). */
		this.PlaceLoad();
	},
	/* A location of the files kept out of git, and a walker on it; a copy without them says so. */
	PlaceLoad: function () {
		var self = this;
		var scene = this.PlaceScene ? this.PlaceScene() : null;
		var sites = {tree: {File: 'tree_house.glb', Size: 1, Without: 'Sphere_Envi', Plane: true, Under: 15}, forest: {File: 'a_forest_3_with_a_road_at_night_for_game.glb', Size: 5, Without: '', Plane: false}, gulch: {File: 'halo_1multiplayerxboxblood_gulch.glb', Size: 1, Without: '', Plane: false, Hour: 14.5, Noon: 33.7, Latitude: 60, DayOfYear: 121, Color: '#f6e6d0', Shade: '#ffcfa0', Body: 2.9}, infinity: {File: 'halo_1multiplayerpcdefaultinfinity.glb', Size: 1, Without: '', Plane: false, Hour: 14.5, Latitude: 60, DayOfYear: 121, Body: 2.9}};
		var site = sites[this.PlaceName];
		var address = '/data/models/' + site.File;
		var request = new XMLHttpRequest();

		if (!scene) return;

		this.PlaceOpen = true;

		request.open('HEAD', address);

		request.onload = function () {
			if (request.status !== 200) {
				self.PlaceNote = site.File + ' is not in data/models of this copy';

				return;
			}

			scene.Objects().forEach(function (object) {
				scene.Remove(object.ID);
			});

			/* The maps of a game are seen by the day they were made for. */
			if (site.Hour)
				self.PlaceHour = site.Hour;

			self.PlaceSky = Object.assign({}, self.PlaceSky, {Latitude: site.Latitude || 45, DayOfYear: site.DayOfYear || 172});

			scene.Add('sun', Object.assign({ID: 'day', Time: self.PlaceHour, Noon: site.Noon || 180, Color: site.Color || '#fff4e0', Shade: site.Shade || '#ffffff', MoonElevation: self.PlaceMoonHeld ? self.PlaceMoonElevation : null, MoonAzimuth: self.PlaceMoonAzimuth}, self.PlaceSky));
			scene.Add('location', {ID: 'place', Model: address, Size: site.Size, Without: site.Without, Plane: site.Plane});

			self.PlaceNote = 'Loading ' + site.File;

			self.PlaceWalker(scene, site, address, 0);
		};

		request.send();
	},
	/* When the ground has come: the walker on it, a lamp that goes with it and a few along the way. */
	PlaceWalker: function (scene, site, address, tries) {
		var self = this;
		var ground = scene.Scene().Ground;
		var start;
		var i;

		if (!ground || !ground.Field.Start || ground.Key.indexOf(address) === -1) {
			if (tries < 400)
				window.setTimeout(function () {
					self.PlaceWalker(scene, site, address, tries + 1);
				}, 50);

			return;
		}

		/* On the tree the largest floors are its roofs: the walker starts on what is under them. */
		start = ground.Field.Spots().filter(function (spot) {
			return !site.Under || spot.Y < site.Under;
		})[0];

		scene.Add('unit', {ID: 'hero', Name: 'You', Model: this.PlaceHero(), Hold: this.PlaceHold(), Size: site.Body || 1.8, X: start.X, Y: start.Z, Z: start.Y});
		scene.Add('light', {ID: 'lantern', Follow: 'hero', Height: (site.Body || 1.8) * 1.15, Radius: 9, Power: 0.22, Color: '#ffd9a8', Flicker: 0.08});

		for (i = 0; i < 4; i++)
			scene.Add('light', {ID: 'lamp-' + i, X: start.X + Math.cos(i * 1.57) * 9, Y: start.Z + Math.sin(i * 1.57) * 9, Z: start.Y, Height: 2.2, Radius: 8, Power: 0.35, Color: i % 2 ? '#ffb46a' : '#9ad0ff', Flicker: i % 2 ? 0.2 : 0});

		window.setTimeout(function () {
			scene.Control('hero');

			self.PlaceNote = '';
		}, 300);
	},
	PlaceNote: '',
	/* The walker chosen, with the clips of their files: they were made for another skeleton, and come to its own. */
	/* What the character holds: the rifle in the hand of the one that has its clips. */
	PlaceHold: function () {
		var chosen = this.PlaceCharacter;
		var character = this.PlaceCharacters.filter(function (each) {
			return each.Value === chosen;
		})[0];

		return character.Clips === 'rifle' ? {Model: 'rifle', Bone: 'HandR', Aim: 'HandL', At: [0.0914, -0.0369, 0], Turn: [0, 180, -4.9], Size: 0.145} : undefined;
	},
	/* Who walks on the locations: a line for a file of data/models, and the set of clips that suits it if not the usual one. */
	PlaceCharacters: [{Value: 'elf', Label: 'Elf', File: 'rigged_elf_woman.glb'}, {Value: 'nyx', Label: 'Nyx', File: 'nyx_common.glb'}, {Value: 'swordsman', Label: 'Swordswoman', File: 'hit2_female_swordsman.glb'}, {Value: 'killjoy', Label: 'Killjoy', File: 'killjoy__valorant.glb'}, {Value: 'warrior', Label: 'Warrior', File: 'low_poly_female_warrior_charctor.glb'}, {Value: 'chief', Label: 'Master Chief', File: 'master_chief_high_poly.glb', Clips: 'rifle'}, {Value: 'xbot', Label: 'X Bot (FBX)', File: 'elf_anim/X Bot.fbx'}],
	PlaceCharacter: 'elf',
	PlaceHero: function () {
		var models = this.$Service('SceneModels');
		var chosen = this.PlaceCharacter;
		var name = 'walker-' + chosen;
		var character = this.PlaceCharacters.filter(function (each) {
			return each.Value === chosen;
		})[0];

		function rifle (file, stride) {
			return {URL: '/data/models/riffle_anim/' + file + '.fbx', Stride: stride || 1, Held: true};
		}

		if (!models.Has('rifle'))
			models.Define('rifle', {URL: '/data/models/halo_ma4b_assault_rifle.glb', Type: 'prop'});

		if (!models.Has(name))
			models.Define(name, {URL: '/data/models/' + character.File, Type: 'unit', Motions: character.Clips === 'rifle' ? {
				idle: rifle('idle'),
				walk: rifle('walk forward', 0.85),
				run: rifle('run forward', 1.5),
				sprint: rifle('sprint forward', 2),
				jump: rifle('jump loop'),
				'strafe-left': rifle('walk left', 0.8),
				'strafe-right': rifle('walk right', 0.8),
				'strafe-left-run': rifle('run left', 1.4),
				'strafe-right-run': rifle('run right', 1.4),
				'turn-left': rifle('turn 90 left'),
				'turn-right': rifle('turn 90 right')
			} : {
				idle: '/data/models/elf_anim/idle.fbx',
				walk: {URL: '/data/models/elf_anim/walking.fbx', Stride: 0.85},
				run: {URL: '/data/models/elf_anim/running.fbx', Stride: 1.5},
				sprint: {URL: '/data/models/Fast Run.fbx', Stride: 2},
				jump: '/data/models/elf_anim/jump.fbx',
				'strafe-left': {URL: '/data/models/elf_anim/left strafe walk.fbx', Stride: 0.8},
				'strafe-right': {URL: '/data/models/elf_anim/right strafe walk.fbx', Stride: 0.8},
				'strafe-left-run': {URL: '/data/models/elf_anim/left strafe.fbx', Stride: 1.4},
				'strafe-right-run': {URL: '/data/models/elf_anim/right strafe.fbx', Stride: 1.4},
				'turn-left': '/data/models/elf_anim/left turn.fbx',
				'turn-right': '/data/models/elf_anim/right turn.fbx'
			}});

		models.Load(name);

		return name;
	},
	PlaceMoonAzimuth: 180,
	PlaceMoonElevation: 45,
	PlaceMoonHeld: false,
	PlaceSky: {DayHours: 24, Latitude: 45, Tilt: 23.44, DayOfYear: 172, Moon: true, MoonLight: 1, MoonSize: 1, MoonPhase: 0.5, NightLight: 1, SkyGlow: 0},
	PlaceHour: 17.5,
	PlaceOpen: false,
	PlaceName: 'tree',
	/* How a spell changes as it lasts. */
	PlacePulseChosen: function (value) {
		this.PlacePulse = value;

		this.PlaceSpellTold('Pulse', this.PlacePulses[value] || null);
	},
	PlacePulses: {
		breath: {Intensity: {From: 0.45, To: 1.5, Time: 3.2}, Size: {From: 0.9, To: 1.12, Time: 3.2}},
		throb: {Intensity: {From: 0.3, To: 1.9, Time: 0.9, Shape: 'ping'}, Spin: {From: 0.6, To: 2.4, Time: 0.9, Shape: 'ping'}},
		flicker: {Intensity: {From: 0.35, To: 1.7, Time: 1.6, Shape: 'flicker'}},
		shift: {Color: {From: '#ff4a6a', To: '#4ac8ff', Time: 4}, Hot: {From: '#ffd8a0', To: '#d8f8ff', Time: 4}},
		grow: {Size: {From: 0.2, To: 1.4, Time: 2.5, Shape: 'once'}, Intensity: {From: 2.2, To: 1, Time: 2.5, Shape: 'once'}}
	},
	PlaceSpellTold: function (key, value) {
		var scene = this.PlaceScene ? this.PlaceScene() : null;
		var changes = {};

		this.PlaceSpell = Object.assign({}, this.PlaceSpell);
		this.PlaceSpell[key] = value;

		changes[key] = value;

		(this.PlaceSpellsMade || []).forEach(function (id) {
			if (scene && scene.Get(id))
				scene.Change(id, changes);
		});
	},
	PlaceSpell: {Color: '#7fc4ff', Hot: '#ffffff'},
	PlacePulse: '',
	PlacePulseList: [{Value: '', Label: 'Steady'}, {Value: 'breath', Label: 'Breath'}, {Value: 'throb', Label: 'Throb'}, {Value: 'flicker', Label: 'Flicker'}, {Value: 'shift', Label: 'Color shift'}, {Value: 'grow', Label: 'Grows once'}],
	PlaceFireSpin: function (value) {
		this.PlaceFireTold('Spin', Number(value));
	},
	/* What the sliders say goes to all that burns. */
	PlaceFireTold: function (key, value) {
		var scene = this.PlaceScene ? this.PlaceScene() : null;
		var fire = Object.assign({}, this.PlaceFire);
		var changes = {};
		var i;

		fire[key] = value;
		changes[key] = value;

		this.PlaceFire = fire;

		for (i = 1; scene && i <= (this.PlaceEffects || 0); i++) {
			if (scene.Get('effect-' + i))
				scene.Change('effect-' + i, changes);
		}
	},
	PlaceFire: {Color: '#ff9a3c', Hot: '#fff0b0', Volume: 1, Intensity: 1, Length: 1, Width: 1, Smoke: 1, Spin: 1},
	PlaceSpellHot: function (value) {
		this.PlaceSpellTold('Hot', value);
	},
	PlaceSpellColor: function (value) {
		this.PlaceSpellTold('Color', value);
	},
	PlaceEffectsGone: function () {
		var scene = this.PlaceScene ? this.PlaceScene() : null;
		var left = this.PlaceEffects || 0;

		while (scene && left > 0) {
			scene.Remove('effect-' + left);

			left--;
		}
	},
	PlaceFireSmoke: function (value) {
		this.PlaceFireTold('Smoke', Number(value));
	},
	PlaceFireWidth: function (value) {
		this.PlaceFireTold('Width', Number(value));
	},
	PlaceFireLength: function (value) {
		this.PlaceFireTold('Length', Number(value));
	},
	PlaceFireIntensity: function (value) {
		this.PlaceFireTold('Intensity', Number(value));
	},
	PlaceFireVolume: function (value) {
		this.PlaceFireTold('Volume', Number(value));
	},
	PlaceFireHot: function (value) {
		this.PlaceFireTold('Hot', value);
	},
	PlaceFireColor: function (value) {
		this.PlaceFireTold('Color', value);
	},
	/* What burns a few steps before the walker; an explosion happens once. */
	PlaceEffect: function (type) {
		var scene = this.PlaceScene ? this.PlaceScene() : null;
		var hero = scene ? scene.Scene().Objects.hero : null;
		if (!hero || !hero.World) return;

		var size = hero.Size || 1.8;
		var heading = hero.Heading || [0, 0, 1];
		var x = hero.World[0] + heading[0] * size * 2.4;
		var z = hero.World[2] + heading[2] * size * 2.4;

		this.PlaceEffects = (this.PlaceEffects || 0) + 1;

		if (type === 'explosion' || type === 'teleport') {
			scene.Burst(type, [x, hero.World[1] + (type === 'teleport' ? 0.05 : size * 0.4), z], {Size: size * 0.6});

			return;
		}

		if (type === 'fireball') {
			scene.Burst(type, [hero.World[0] + heading[0] * size * 0.6, hero.World[1] + size * 0.7, hero.World[2] + heading[2] * size * 0.6], {Size: size * 0.5, Aim: heading});

			return;
		}

		this.PlaceSpellsMade = (this.PlaceSpellsMade || []).concat(['effect-' + this.PlaceEffects]);

		if (['portal', 'beam'].indexOf(type) !== -1) {
			scene.Add('effect', Object.assign({ID: 'effect-' + this.PlaceEffects, Type: type, X: x, Y: z, Z: hero.World[1] + size, Size: size * 0.8, Aim: heading}, this.PlaceSpellOwn ? this.PlaceSpellLook() : {Spin: this.PlaceFire.Spin}));

			return;
		}

		if (['aura', 'circle', 'shield', 'lightning', 'healing', 'frost', 'poison', 'pillar'].indexOf(type) !== -1) {
			scene.Add('effect', Object.assign({ID: 'effect-' + this.PlaceEffects, Type: type, X: x, Y: z, Z: hero.World[1] + size, Size: size * 0.8, Height: 0.04}, this.PlaceSpellOwn ? this.PlaceSpellLook() : {Spin: this.PlaceFire.Spin}));

			return;
		}

		scene.Add('effect', Object.assign({ID: 'effect-' + this.PlaceEffects, Type: type, X: x, Y: z, Z: hero.World[1] + size, Size: size * 0.55, Height: type === 'torch' ? size * 0.7 : type === 'exhaust' ? size * 0.7 : 0.02, Aim: type === 'exhaust' ? [heading[2], 0, -heading[0]] : null}, type === 'exhaust' ? {Volume: this.PlaceFire.Volume, Intensity: this.PlaceFire.Intensity, Length: this.PlaceFire.Length} : this.PlaceFire));
	},
	/* What a spell is told by the Magic tab of the ribbon. */
	PlaceSpellLook: function () {
		var fire = this.PlaceFire;
		var look = {Volume: fire.Volume, Intensity: fire.Intensity, Length: fire.Length, Width: fire.Width, Spin: fire.Spin, Pulse: this.PlacePulses[this.PlacePulse] || null};

		if (this.PlaceSpell.Color)
			look.Color = this.PlaceSpell.Color;

		if (this.PlaceSpell.Hot)
			look.Hot = this.PlaceSpell.Hot;

		return look;
	},
	PlaceMoonRound: function (value) {
		this.PlaceMoonAzimuth = Number(value);

		this.PlaceMoonHold(this.PlaceMoonHeld);
	},
	/* The moon goes its way, or stands where the two sliders say. */
	PlaceMoonHold: function (value) {
		var scene = this.PlaceScene ? this.PlaceScene() : null;

		this.PlaceMoonHeld = value;

		if (scene)
			scene.Change('day', {MoonElevation: value ? this.PlaceMoonElevation : null, MoonAzimuth: this.PlaceMoonAzimuth});
	},
	PlaceMoonHigh: function (value) {
		this.PlaceMoonElevation = Number(value);

		this.PlaceMoonHold(this.PlaceMoonHeld);
	},
	PlaceMoonSize: function (value) {
		this.PlaceSkied('MoonSize', Number(value));
	},
	/* A value of the sky of the location changed: the scene takes it at once. */
	PlaceSkied: function (key, value) {
		var scene = this.PlaceScene ? this.PlaceScene() : null;
		var sky = Object.assign({}, this.PlaceSky);
		var changes = {};

		sky[key] = value;
		changes[key] = value;

		this.PlaceSky = sky;

		if (scene)
			scene.Change('day', changes);
	},
	PlaceMoonPhase: function (value) {
		this.PlaceSkied('MoonPhase', Number(value));
	},
	PlaceMoonLight: function (value) {
		this.PlaceSkied('MoonLight', Number(value));
	},
	PlaceMoonShown: function (value) {
		this.PlaceSkied('Moon', value);
	},
	/* A day on the node of the moon: at a new moon its shadow, at a full one the shadow of the planet on it. */
	PlaceEclipse: function (kind) {
		this.PlaceSkied('DayOfYear', 80);
		this.PlaceSkied('MoonPhase', kind === 'sun' ? 0 : 0.5);
		this.PlaceTimed(kind === 'sun' ? 12 : 0);
	},
	PlaceTimed: function (value) {
		var scene = this.PlaceScene ? this.PlaceScene() : null;

		this.PlaceHour = Number(value);

		if (scene)
			scene.Change('day', {Time: this.PlaceHour});
	},
	PlaceTownGlow: function (value) {
		this.PlaceSkied('SkyGlow', Number(value));
	},
	PlaceNightLight: function (value) {
		this.PlaceSkied('NightLight', Number(value));
	},
	PlaceTiltChosen: function (value) {
		this.PlaceSkied('Tilt', Number(value));
	},
	PlaceLatitudeChosen: function (value) {
		this.PlaceSkied('Latitude', Number(value));
	},
	PlaceDayChosen: function (value) {
		this.PlaceSkied('DayOfYear', Number(value));
	},
	PlaceDayLength: function (value) {
		this.PlaceSkied('DayHours', Number(value));

		if (this.PlaceHour > Number(value))
			this.PlaceTimed(Number(value));
	},
	PlaceOrigin: false,
	PlaceAxes: true,
	PlaceMana: false,
	PlaceGlow: false,
	/* The lamps of a location, and the one the walker carries, for a picture of the sun alone. */
	PlaceLampsShown: function (value) {
		var scene = this.PlaceScene ? this.PlaceScene() : null;
		var i;

		this.PlaceLamps = value;

		if (!scene) return;

		scene.Change('lantern', {Power: value ? 0.22 : 0});

		for (i = 0; i < 4; i++)
			scene.Change('lamp-' + i, {Power: value ? 0.35 : 0});
	},
	PlaceLamps: true,
	PlaceShoulder: 'right',
	PlaceNextPerson: function () {
		this.PlacePerson = {third: 'first', first: 'shoulder', shoulder: 'third'}[this.PlacePerson];
	},
	PlacePerson: 'third',
	PlaceFree: true,
	/* Another walker on the same spot: only its model changes. */
	PlaceCharacterChosen: function (value) {
		var self = this;
		var scene = this.PlaceScene ? this.PlaceScene() : null;
		var hero = scene ? scene.Scene().Objects.hero : null;
		var character = this.PlaceCharacters.filter(function (each) {
			return each.Value === value;
		})[0];
		var request = new XMLHttpRequest();

		this.PlaceCharacter = value;

		if (!hero) return;

		request.open('HEAD', '/data/models/' + character.File);

		request.onload = function () {
			if (request.status !== 200) {
				self.PlaceNote = character.File + ' is not in data/models of this copy';

				return;
			}

			var place = {X: hero.Values.X, Y: hero.Values.Y, Z: hero.Air === undefined ? hero.Values.Z : hero.Air, Size: hero.Size};

			scene.Remove('hero');
			scene.Add('unit', Object.assign({ID: 'hero', Name: 'You', Model: self.PlaceHero(), Hold: self.PlaceHold()}, place));
			scene.Control('hero');
		};

		request.send();
	},
	PlaceChosen: function (value) {
		this.PlaceName = value;

		if (this.PlaceOpen)
			this.PlaceLoad();
	},
	PlaceList: [{Value: 'tree', Label: 'Tree house'}, {Value: 'forest', Label: 'Forest road'}, {Value: 'gulch', Label: 'Blood Gulch'}, {Value: 'infinity', Label: 'Infinity'}],
	RibbonTab: 'home',
	PlaceTab: 'place'
});
