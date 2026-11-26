/*
 * GameDemo (Gaming): the game the demos of games come together in, one scene and one state of the game (GameState) for
 * all its levels, none of them loaded again. Its galaxy (Setting galaxy) is the one of Universe: home is the system of Terra
 * (the star of the main sequence nearest where a system lies by default); Galaxy map picks another star, Enter goes into its
 * system (or a jump, J, aimed at a star near), Home back; Warp to aims at a place of Terra at its step of warp. A ship of its
 * own round Terra (round the first planet of another system) with its pilot in the seat, G out of it to walk
 * in it as it flies (its consoles, its turret, its window), down onto the ground with whoever is in it, out of it by its
 * ramp, up to the orbit again. The character played is chosen live, in the seat, aboard or on the ground: the same one
 * goes on with another model. On the ground a weapon in hand (keys 1 to 0, the left button fires to the middle of the
 * view), none in orbit; Range lays the targets of Combat before the walker (DemoData.Range: wood, steel, glass, stone,
 * robots), each hit shown by its material. Car puts the car chosen by the walker (DemoData.Car: the cars of Racing), G
 * in and out of it; Track lays a track of a seed from there, away from the ship, the car on its line, its laps counted
 * (GameRace). Squads puts a squad of the player by the walker and robots of the red team across from it; Command takes
 * the view over them as a strategy (GameStrategy: a press selects, a right press orders), the walker standing, and gives
 * it back. The mannequin walks of the gaits graphs of the library: Gait graph opens the one chosen, a change of it on the
 * walker at once. Its galaxy is one of a universe (GameUniverse, SceneUniverse): Universe map shows the galaxies round it,
 * a galaxy pressed is picked and Enter the galaxy shows it; from a system, Warp to galaxy jumps to the neighbour chosen
 * at the step between galaxies chosen (12: some five minutes; 13 and 14, of tests, seconds), out at its edge in the system
 * of a star there; H on the way out between the galaxies, all of them round the ship. Its commands in the tabs of a Ribbon:
 * Flight, Galaxy, Character, Combat, Racing, Strategy. Keys of Orbit in the seat (W and S the speed, A and D yaw, R and F pitch, Q
 * and E roll, H warps), of a walker on foot (WASD, Shift runs, Space jumps, E takes a seat or a console).
 */
Elemenx.Component('GameDemo', {
	$TemplateURL: 'GameDemo.html',
	$Traits: ['SceneDemo'],
	GameCharacters: [],
	GameCharacter: 'chief',
	GameShips: [],
	GameShip: 'space_ship (1).glb',
	/* Where to warp in the system of Terra: each at a step of warp of some seconds there, what to see when there. */
	GamePlaces: [
		{Value: 'luna', Label: 'Luna (no air)', Step: '2', Note: 'no air: black sky down to its ground'},
		{Value: 'terra', Label: 'Terra', Step: '3', Note: 'its seas, its lands and its clouds'},
		{Value: 'battleship', Label: 'Battleship', Step: '3', Note: 'a battleship in orbit'},
		{Value: 'jove', Label: 'Jove (gas giant)', Step: '4', Note: 'down through its clouds of ammonia, of water (lightning), the dark and the glow of its depth, to its core'},
		{Value: 'nerid', Label: 'Nerid (ice giant)', Step: '5', Note: 'down through its clouds of methane and of hydrogen sulphide, the dark, the heat of its mantle of ices'},
		{Value: 'tidra', Label: 'Tidra (haze, as Titan)', Step: '5', Note: 'its orange haze and its clouds of methane, a tenth of the light of its sun on its ground'},
		{Value: 'vesper', Label: 'Vesper (thick air, as Venus)', Step: '4', Note: 'its clouds of sulphuric acid at 50 to 70 km, 92 bar and 737 K on its ground'},
		{Value: 'ferro', Label: 'Ferro (no air, as Mercury)', Step: '4', Note: 'no air: black sky down to its ground'}
	],
	GamePlace: 'luna',
	GameSteps: [{Value: '1', Label: 'Step 1'}, {Value: '2', Label: 'Step 2'}, {Value: '3', Label: 'Step 3'}, {Value: '4', Label: 'Step 4'}, {Value: '5', Label: 'Step 5'}, {Value: '6', Label: 'Step 6'}],
	GameStep: '2',
	/* The galaxy of the game (Setting galaxy): its home the star of the system of Terra, the system entered, the star picked on the map. */
	GameGalaxy: {Seed: 'orbit', Kind: 'spiral'},
	/* The universe of the game: its galaxy (home) at its place, the others of its seed round it (UniverseData). */
	GameUniverse: {Seed: 'game', Galaxies: [{ID: 'home', Name: 'Orbit', Seed: 'orbit', Kind: 'spiral', Coordinates: [123.4, -5, 60]}], Home: 'home'},
	/* The steps of a jump between galaxies (travel.json): 12 is the one of a ship, 13 and 14 of tests and demonstrations. */
	GameFarSteps: [{Value: '9', Label: 'Step 9 · 1 ly/s'}, {Value: '10', Label: 'Step 10 · 21 ly/s'}, {Value: '11', Label: 'Step 11 · 420 ly/s'}, {Value: '12', Label: 'Step 12 · ~5 min'}, {Value: '13', Label: 'Step 13 · ~16 s (test)'}, {Value: '14', Label: 'Step 14 · ~2 s (test)'}],
	GameFarStep: '13',
	/* The galaxies round the one the ship is in (its sky: Far), the one chosen to jump to, the one picked on the map. */
	GameNeighbours: [],
	GameNeighbour: '',
	GameGalaxyPicked: '',
	/* Out of the well of a body first, by a warp of its own, before a jump between galaxies (GameWellOut). */
	GameLeaving: false,
	GameWellTried: false,
	GameHome: '',
	GameEntered: '',
	GamePicked: '',
	/* Out of a jump between stars: the ship made at the edge of the system it came to, its star ahead. */
	GameArriving: false,
	GameCockpit: false,
	GameTravel: '',
	GameAim: '',
	/* The wing of the player and the patrol of the other team (SceneAgents), what each does now, the last order. */
	GameWings: ['wing-1', 'wing-2'],
	GameRaiders: ['raider-1', 'raider-2'],
	GameAgentTasks: null,
	GameAgents: '',
	GameMissiles: null,
	GameDefenceOn: true,
	GameRailDirect: false,
	GameWingOrder: '',
	GameLevel: 'orbit',
	GamePhase: '',
	GameNote: '',
	GameGraphOpen: '',
	GameGraphs: null,
	GameWeapons: [],
	GameCars: [],
	GameCar: 'mclaren',
	GameTrackSeed: 0,
	GameTab: 'flight',
	GameGait: 'walk',
	GameGaitGraph: null,
	/* The mannequin made again of a gait graph changed (SceneMannequin.Define), '' the one of the library. */
	GameMannequin: '',
	GameMannequins: 0,
	GameCommanding: false,
	GameFog: false,
	/* At the wheel of a car: no weapon in hand. */
	GameDriving: false,
	/* Where a landing goes: under the ship (most of Terra is sea), or a marker of its planet (terra.json). */
	GameSites: [
		{Value: '', Label: 'Under the ship'},
		{Value: 'hills', Label: 'Green Hills'},
		{Value: 'peaks', Label: 'High Peaks'},
		{Value: 'river', Label: 'Great River'},
		{Value: 'base', Label: 'Sea Base'}
	],
	GameSite: 'hills',
	GameWeapon: 'rifle',

	$OnCreate: function () {
		var self = this;
		var state = this.$Service('GameState').Get();

		/* The walkers of the game (data/characters, SceneCharacters), read once. */
		this.$Service('DemoData').CharactersRead(function (error, list) {
			if (!error)
				self.GameCharacters = list;
		});

		this.GameCharacter = state.Character;
		this.GameShip = state.Ship;
		this.GameLevel = state.Level;
		this.GameWeapons = this.$Service('DemoData').Weapons;
		this.GameWeapon = state.Weapon;

		/* The cars (data/vehicles/cars, SceneCars), read once. */
		this.$Service('DemoData').CarsRead(function (error, list) {
			if (!error)
				self.GameCars = list;
		});

		this.GameCar = state.Car;

		/* The state of the game is one for its levels: what changes it, from here or from another part of the game, shows. */
		this.GameHeard = function (now) {
			self.GameCharacter = now.Character;
			self.GameShip = now.Ship;
			self.GameLevel = now.Level;
			self.GameWeapon = now.Weapon;
			self.GameCar = now.Car;
		};

		this.$Service('GameState').On(this.GameHeard);
	},

	$OnDestroy: function () {
		this.$Service('GameState').Off(this.GameHeard);
	},

	GameLevelLabel: function (level) {
		return {orbit: 'In orbit', flight: 'In flight', ground: 'On the ground'}[level] || level;
	},

	GameReady: function (scene) {
		var self = this;
		var data = this.$Service('DemoData');

		this.GameScene = function () {
			return scene;
		};

		/* A scene begins in orbit, whatever level the last one was left at. */
		this.$Service('GameState').Set({Level: 'orbit'});

		/* The system of Terra is the one of the home star of the galaxy (GameHomeMade), its ship made once it is entered (GameIn). */
		data.Get('/data/systems/terra.json', function (error, system) {
			if (error || !scene.$Element().isConnected) return;

			data.Models(system, self.$Service('SceneModels'));
			data.RangeModels(self.$Service('SceneModels'));

			self.GameTerra = system.Objects;

			data.Get('/data/vehicles/ships.json', function (failed, ships) {
				if (failed || !scene.$Element().isConnected) return;

				self.GameShips = ships;

				/* Its pilot is one of the walkers: they are read first. */
				/* Its galaxy the home one of its universe (its skies of it), then the system of Terra in it. */
				data.CharactersRead(function () {
					self.GameWait(function () {
						return scene.UniverseData();
					}, function () {
						scene.EnterGalaxy('home', function (failed, key) {
							if (!failed)
								self.GameGalaxy = key;

							self.GameWait(function () {
								return scene.GalaxyData() && scene.GalaxyData().Manifest.ID === 'home';
							}, function () {
								self.GameHomeMade(scene);
							});
						}, {Now: true});
					});
				});
			});
		});

		/* Where the ship goes and what it aims at (the Ether). */
		this.$Ether.On('travel', 'me', this.GameGoing.bind(this));
		this.$Ether.On('aim', '', this.GameAimed.bind(this));
	},

	/* Calls then() once ready() is true, looked at four times a second while the demo is on the page. */
	GameWait: function (ready, then) {
		var self = this;
		var clock = window.setInterval(function () {
			if (!self.$Element().isConnected) {
				window.clearInterval(clock);

				return;
			}

			if (!ready()) return;

			window.clearInterval(clock);

			then();
		}, 250);
	},

	/*
	 * The home of the game: the star of the main sequence nearest where a system lies by default (GalaxyData.Cosmos), its
	 * system the one of Terra (SetSystem), gone into at once.
	 */
	GameHomeMade: function (scene) {
		var galaxies = this.$Service('GalaxyData');
		var data = scene.GalaxyData();
		var place = galaxies.Cosmos(data, '').Place;
		var best = (galaxies.Search(data, {Centre: place, Radius: 60, Type: 'main', Limit: 1}).Items || [])[0] || null;

		if (!best) {
			this.GameNote = 'no star near the home of the game';

			return;
		}

		this.GameHome = best.ID;

		galaxies.SetSystem(data, best.ID, this.$Service('SystemData').Make({Objects: this.GameTerra}, {ID: best.ID, Name: 'Sol'}));

		scene.EnterSystem(best.ID);
	},

	/* The galaxies of the sky of where the ship is, to jump to: the largest to the eye first. */
	GameNeighboursOf: function () {
		var scene = this.GameScene();
		var far = scene.Cosmos && scene.Cosmos.Far || [];

		this.GameNeighbours = far.map(function (one) {
			return {Value: one.ID, Label: one.Name + ' · ' + one.Kind + ' · ' + (one.Distance * 3.2616).toFixed(1) + ' Mly'};
		});
		this.GameNeighbour = this.GameNeighbours.length ? this.GameNeighbours[0].Value : '';
	},

	/* In a system (the event enter): the ship of the game round its first planet (Terra at home), the pilot in its seat. */
	GameIn: function (event) {
		var self = this;
		var scene = this.GameScene();

		this.GameEntered = event.ID;

		this.GameNeighboursOf();

		this.GameNote = event.ID === this.GameHome ? '' : 'the system of ' + (event.Star && event.Star.Name || event.ID) + ': T aims, G turns to it, H warps, J jumps';

		this.GameWait(function () {
			return scene.Scene().Order.some(function (object) {
				return object.World && (object.Kind === 'planet' || object.Kind === 'star');
			});
		}, function () {
			self.GameShipPut();
		});
	},

	/* Between galaxies (the event entervoid, out of a jump on its way): the ship there, the galaxies round it to jump to. */
	GameVoid: function (event) {
		var given = event && event.detail ? event.detail : event;

		this.GameEntered = 'void';
		this.GameArriving = true;
		this.GameNote = 'between the galaxies, ' + given.Place.map(function (value) {
			return value.toFixed(2);
		}).join(', ') + ' Mpc: Warp to galaxy jumps to one of them';

		this.GameNeighboursOf();
		this.GameShipPut();
	},

	/* Into a galaxy of the universe (the event entergalaxy): its key the Galaxy of the scene. */
	GameGalaxyIn: function (event) {
		var given = event && event.detail ? event.detail : event;

		this.GameGalaxy = given.Key;
		this.GameGalaxyPicked = '';

		if (given.ID !== 'home')
			this.GameNote = 'the galaxy ' + (given.Galaxy && given.Galaxy.Name || given.ID);
	},

	GameUniversePick: function (event) {
		var given = event && event.detail ? event.detail : event;

		this.GameGalaxyPicked = given && given.ID || '';
	},

	/* From the map of the galaxy to the one of its universe, and into the galaxy picked there. */
	GameUniverseMap: function () {
		var scene = this.GameScene ? this.GameScene() : null;

		if (scene && scene.Setting === 'galaxy') {
			scene.LeaveGalaxy();

			this.GameNote = 'the universe: press a galaxy to pick it, then Enter the galaxy';
		}
	},

	GameGalaxyEnter: function () {
		var scene = this.GameScene ? this.GameScene() : null;
		if (scene && this.GameGalaxyPicked)
			scene.EnterGalaxy(this.GameGalaxyPicked);
	},

	GameFarStepChosen: function (value) {
		this.GameFarStep = String(value && value.detail !== undefined ? value.detail : value);

		if (this.GameScene && this.GameScene().Get('me'))
			this.GameScene().TravelStep('me', Number(this.GameFarStep));
	},

	GameNeighbourChosen: function (value) {
		this.GameNeighbour = String(value && value.detail !== undefined ? value.detail : value);
	},

	/* A jump to the galaxy chosen at the step chosen: out at its edge, in the system of a star there. */
	GameWarpGalaxy: function () {
		var self = this;
		var scene = this.GameScene ? this.GameScene() : null;
		var me = scene ? scene.Scene().Objects.me : null;
		if (!scene || !this.GameNeighbour || !me) return;

		scene.Travel('me', 'warp', {To: 'galaxy:' + this.GameNeighbour, FarStep: Number(this.GameFarStep)}, function (error) {
			/* Once out of its well by a warp of its own (GameWellOut): not again, the jump refused then is told. */
			if (error && me.Refused && me.Refused.Reason === 'well' && !self.GameLeaving && !self.GameWellTried) {
				self.GameWellOut();

				return;
			}

			if (error)
				self.GameNote = error.message;

			self.GameWellTried = false;
		});
	},

	/*
	 * Too deep in the well of a body for a jump between galaxies (HyperWell: a pull of 0.0005 of its surface, some 45 of
	 * its radii): out of it by a warp of step 6 straight ahead, stopped once every body is far enough, then the jump.
	 */
	GameWellOut: function () {
		var self = this;
		var scene = this.GameScene();
		var me = scene.Scene().Objects.me;

		function out () {
			return me.World && scene.Scene().Order.every(function (object) {
				var traits = object.Traits || {};
				if (object === me || !object.World || !object.Size || !traits.Body && !traits.Star) return true;

				return Math.hypot(object.World[0] - me.World[0], object.World[1] - me.World[1], object.World[2] - me.World[2]) > object.Size * 50;
			});
		}

		this.GameLeaving = true;
		this.GameWellTried = true;
		this.GameNote = 'out of the well of ' + me.Refused.By + ' first, then the jump';

		scene.Aim('');
		scene.Travel('me', 'warp', {Step: 6, To: ''}, function (error) {
			if (error) {
				self.GameLeaving = false;
				self.GameNote = error.message;
			}
		});

		this.GameWait(function () {
			return !me.Travel || me.Travel.Phase === 'inside' && out();
		}, function () {
			scene.TravelStop('me');

			self.GameWait(function () {
				return !me.Travel;
			}, function () {
				self.GameLeaving = false;

				self.GameWarpGalaxy();
			});
		});
	},

	/* The map of the galaxy (the event leave): a star pressed is picked, Enter the system goes into it. */
	GameOut: function () {
		this.GameEntered = '';
		this.GameNote = 'the galaxy: press a star to pick it, then Enter';
	},

	GamePick: function (event) {
		var given = event && event.detail ? event.detail : event;

		this.GamePicked = given && given.ID || '';
	},

	/* Out of the system to its map: from orbit only (no walker, car or squad is on a ground then). */
	GameMap: function () {
		if (this.GameLevel === 'orbit')
			this.GameScene().LeaveSystem();
	},

	GameEnter: function () {
		if (this.GamePicked)
			this.GameScene().EnterSystem(this.GamePicked);
	},

	/* Home: the system of Terra, in its galaxy (back into it first from another galaxy or from between them). */
	GameGoHome: function () {
		var self = this;
		var scene = this.GameScene();

		if (!this.GameHome || this.GameLevel !== 'orbit') return;

		if (scene.UniverseEntered() === 'home') {
			scene.EnterSystem(this.GameHome, null, {Now: !!this.GameEntered});

			return;
		}

		scene.EnterGalaxy('home', function () {
			scene.Engine().Galaxy.Wanted();
			scene.EnterSystem(self.GameHome, null, {Now: true});
		}, {Now: true});
	},

	/* The view from the seat of the ship (Person first). */
	GameCockpitToggled: function (value) {
		this.GameCockpit = value && value.detail !== undefined ? !!value.detail : !!value;
		this.GameScene().Person = this.GameCockpit ? 'first' : 'third';
	},

	GameStepChosen: function (value) {
		this.GameStep = String(value && value.detail !== undefined ? value.detail : value);

		if (this.GameScene().Get('me'))
			this.GameScene().TravelStep('me', Number(this.GameStep));
	},

	GameGoing: function (data) {
		var record = data && data.me;

		this.GameTravel = record && record.Phase !== 'done' ? record.Kind + ' ' + record.Phase + (record.Light !== null && record.Light !== undefined ? ' · ' + record.Light.toFixed(1) + ' ly left' : record.Speed ? ' · ' + Math.round(record.Speed).toLocaleString() + ' km/s' : '') : record && record.Reason && record.Reason !== 'arrived' ? record.Kind + ' out: ' + record.Reason : '';
	},

	GameAimed: function (data) {
		this.GameAim = data && data.Target ? 'aim: ' + data.Name + ' ' + Math.round(data.Angle) + '°' + (data.Ready ? ' ready' : data.Why ? ' (' + data.Why + ')' : '') : '';
	},

	/* The walker played: a unit of the model of its character, Hold what it holds. */
	GameWalker: function () {
		var walker = this.$Service('DemoData').Character(this.GameCharacter);

		if (this.GameCharacter === 'mannequin' && this.GameMannequin)
			walker.Model = this.GameMannequin;

		return walker;
	},

	/* The gaits and the poses of the mannequin, each a graph of the library (blueprints/animation). */
	GameGaits: function () {
		var mannequin = this.$Service('SceneMannequin');

		return mannequin.Gaits.concat(mannequin.Poses).map(function (name) {
			return {Value: name, Label: name};
		});
	},

	GameGaitChosen: function (value) {
		this.GameGait = String(value && value.detail !== undefined ? value.detail : value);

		if (this.GameGaitGraph)
			this.GameGaitGraph = JSON.parse(JSON.stringify(Elemenx.Resources('Blueprints', 'ElemenxGraphics/animation/' + this.GameGait)));
	},

	GameGaitOpened: function () {
		this.GameGaitGraph = this.GameGaitGraph ? null : JSON.parse(JSON.stringify(Elemenx.Resources('Blueprints', 'ElemenxGraphics/animation/' + this.GameGait)));

		if (this.GameGaitGraph && this.GameCharacter !== 'mannequin')
			this.GameNote = 'the mannequin walks of these graphs: Character, Mannequin';
	},

	/* The graph changed: the one of the library in its place, the mannequin made again of it, the walker of it if it is one. */
	GameGaitChanged: function (value) {
		var self = this;
		var graph = value && value.detail !== undefined ? value.detail : value;
		var scene = this.GameScene ? this.GameScene() : null;
		var name;

		if (!graph) return;

		Elemenx.Resources('Blueprints', 'ElemenxGraphics/animation/' + this.GameGait, typeof graph === 'string' ? JSON.parse(graph) : graph);

		this.GameMannequins++;
		name = this.$Service('SceneMannequin').Define('game-mannequin-' + this.GameMannequins, {});

		this.$Service('SceneModels').Load(name, function () {
			self.GameMannequin = name;

			if (scene && scene.Get('pilot') && self.GameCharacter === 'mannequin')
				scene.Change('pilot', {Model: name});
		});
	},

	/* Another ship, the same pilot in its seat; in orbit only. */
	GameShipChosen: function (value) {
		if (this.GameLevel !== 'orbit') {
			this.GameNote = 'a ship is changed in orbit';

			return;
		}

		this.GameNote = '';

		this.$Service('GameState').Set({Ship: value});

		this.GameShipPut();
	},

	/*
	 * The ship of the game where it is now: round Terra at home, else round the first planet of a ground of the system (its
	 * star out of a jump between stars, at its edge); its pilot (the walker played) in its seat.
	 */
	GameShipPut: function () {
		var scene = this.GameScene ? this.GameScene() : null;
		var models = this.$Service('SceneModels');
		var value = this.GameShip;
		var name = 'ship-' + value;
		var arriving = this.GameArriving;
		var walker;
		var order;
		var planets;
		var grounded;
		var star;
		var around;
		var ship = this.GameShips.filter(function (each) {
			return each.Value === value;
		})[0];
		if (!scene || !ship) return;

		order = scene.Scene().Order;
		planets = order.filter(function (object) {
			return object.Kind === 'planet' && object.World;
		});
		grounded = planets.filter(function (object) {
			return object.Traits.Surface && object.Traits.Surface.Planet;
		});
		star = order.filter(function (object) {
			return object.Kind === 'star';
		})[0];
		around = arriving && star ? star.ID : scene.Scene().Objects.terra ? 'terra' : grounded.length ? grounded[0].ID : planets.length ? planets[0].ID : star ? star.ID : '';

		this.GameArriving = false;
		this.GameTravel = '';
		this.GameAim = '';

		if (!models.Has(name))
			models.Define(name, {URL: '/data/models/' + value, Type: 'prop'});

		models.Load(name);

		if (scene.Get('me'))
			scene.Remove('me');

		if (scene.Get('pilot'))
			scene.Remove('pilot');

		scene.Add('ship', this.$Service('DemoData').Ship(ship, {ID: 'me', Name: '', Model: name, Size: ship.Size || 0.012, Parent: around, Missiles: 'ship-missile', Hunters: 'ship-hunter', Torpedoes: 'ship-torpedo', Driver: 'ship-massdriver', Lance: 'ship-lance', Railgun: 'ship-ftl', Flares: 24, Defence: 'ship-pd', Vehicle: {Top: 0.09, Speed: 3000, Around: around, From: arriving ? [0, 6, -150] : [-2.6, 0.3, 1.5], Facing: arriving ? [0, -0.04, 1] : [1, -0.08, -0.5], Follow: [4.6, 1.1], Warp: {To: around === 'terra' ? this.GamePlace : '', Step: Number(this.GameStep), Well: 0.25, Far: 14, FarStep: Number(this.GameFarStep)}}}));

		walker = this.GameWalker();

		scene.Add('unit', {ID: 'pilot', Name: 'You', Model: walker.Model, Hold: walker.Hold, Size: walker.Size, X: 0, Y: 0});
		scene.Control('pilot');
		scene.Board('pilot', 'me');

		this.GameArm();
		this.GameWingPut(around);
	},

	/*
	 * The wing of the player (two fighters of the blue team by the ship, SceneAgents: ai/fighter) and, at home, a patrol of
	 * the red team by the Battleship: each its own mind, its weapon; near, they fight (Wing: the orders of the player).
	 */
	GameWingPut: function (around) {
		var scene = this.GameScene();
		var data = this.$Service('DemoData');
		var models = this.$Service('SceneModels');
		var ships = this.GameShips;
		var battleship = scene.Scene().Objects.battleship;
		var home = scene.Scene().Objects[around];
		var self = this;

		this.GameWings.concat(this.GameRaiders).forEach(function (id) {
			if (scene.Get(id))
				scene.Remove(id);
		});

		function put (id, value, more) {
			var ship = ships.filter(function (each) {
				return each.Value === value;
			})[0];
			if (!ship || !home) return;

			if (!models.Has('ship-' + value))
				models.Define('ship-' + value, {URL: '/data/models/' + value, Type: 'prop'});

			models.Load('ship-' + value);

			scene.Add('ship', data.Ship(ship, Object.assign({ID: id, Name: more.Name, Model: 'ship-' + value, Size: ship.Size || 0.012, Parent: around, Health: 120}, more.Values, {Vehicle: {Top: 0.09, Speed: 3000, Around: around, From: more.From, Facing: [1, -0.08, -0.5]}})));
		}

		put('wing-1', 'space_ship.glb', {Name: 'Wing 1', From: [-2.6, 0.32, 1.52], Values: {Team: 'blue', Weapon: 'ship-laser', Missiles: 'ship-missile', Hunters: 'ship-hunter', Flares: 16, Defence: 'ship-pd', Agent: {Leader: 'me', Slot: [90, 10, -80], Range: 300000}}});
		put('wing-2', 'tempest.glb', {Name: 'Wing 2', From: [-2.62, 0.3, 1.48], Values: {Team: 'blue', Weapon: 'ship-massdriver', Missiles: 'ship-missile', Flares: 16, Defence: 'ship-pd', Agent: {Leader: 'me', Slot: [-90, 10, -80], Range: 300000}}});

		/* At home, by the Battleship as it goes round Terra (where it is now, in sizes of Terra). */
		if (battleship && battleship.World && home && around === 'terra') {
			[['raider-1', [0.02, 0.01, 0]], ['raider-2', [-0.02, 0.01, 0.01]]].forEach(function (one, index) {
				var from = [0, 1, 2].map(function (axis) {
					return (battleship.World[axis] - home.World[axis]) / home.Size + one[1][axis];
				});

				put(one[0], 'millenium_falcon_star_wars.glb', {Name: 'Raider ' + (index + 1), From: from, Values: {Team: 'red', Weapon: 'ship-cannon', Missiles: 'ship-missile', Hunters: 'ship-hunter', Defence: 'ship-pd', Flares: 12, Agent: {Leader: 'battleship', Slot: [index ? -400 : 400, 120, 300], Range: 300000}}});
			});
		}

		this.GameAgentTasks = {};
		this.GameNote = this.GameNote || '';
		self.GameWingOrder = '';
	},

	/* An order to the wing (SceneAgents: AgentOrder): attack (what the ship aims at, else what they see), form, hold, retreat. */
	GameWingOrdered: function (order) {
		var scene = this.GameScene ? this.GameScene() : null;
		var aimed = scene && scene.Scene().Aim ? scene.Scene().Aim.Target : '';
		var given = scene ? scene.AgentOrder(this.GameWings, order, order === 'attack' && aimed && /^raider-/.test(aimed) ? aimed : '') : 0;

		this.GameWingOrder = given ? order : this.GameWingOrder;
		this.GameNote = given ? 'wing: ' + (order || 'free') : 'no wing';
	},

	/* What the agents do (the event agent), in the status: the wing and the patrol. */
	GameAgent: function (event) {
		var given = event && event.detail ? event.detail : event;
		var tasks = Object.assign({}, this.GameAgentTasks || {});

		if (!given) return;

		tasks[given.ID] = given.Task;
		this.GameAgentTasks = tasks;
		this.GameAgents = Object.keys(tasks).sort().map(function (id) {
			return id.replace(/^wing-/, 'W').replace(/^raider-/, 'R') + ' ' + (tasks[id] || '–');
		}).join(', ');
	},

	/*
	 * The missiles of the fight (SceneMissiles: the event missile): how many flew, hit, were brought down, taken by flares,
	 * lost, in the line of the status.
	 */
	GameMissile: function (event) {
		var given = event && event.detail ? event.detail : event;
		var counts = Object.assign({launch: 0, hit: 0, intercepted: 0, decoyed: 0, lost: 0}, this.GameMissiles || {});
		if (!given || counts[given.State] === undefined) return;

		counts[given.State]++;
		this.GameMissiles = counts;
		this.GameNote = 'missiles ' + counts.launch + ', hit ' + counts.hit + ', shot down ' + counts.intercepted + ', flares ' + counts.decoyed + ', lost ' + counts.lost;
	},

	/* A salvo of the ship at what it locked (M), flares (N), its point defence on and off (SceneMissiles). */
	GameLaunch: function () {
		var scene = this.GameScene();
		if (scene && !scene.Launch('me', {}))
			this.GameNote = 'Nothing locked: hold a ship of the red team before the nose, or make it the target (T, the radar)';
	},

	/* A torpedo at what the ship locked (K), the mass driver at its target with the lead (U). */
	/* A salvo of heavy missiles (Y) at what the ship locked. */
	GameHunters: function () {
		var scene = this.GameScene();
		if (scene && !scene.Launch('me', {Kind: 'hunter'}))
			this.GameNote = 'Nothing locked for heavy missiles, or none left';
	},

	GameTorpedo: function () {
		var scene = this.GameScene();
		if (scene && !scene.Launch('me', {Kind: 'torpedo'}))
			this.GameNote = 'Nothing locked for a torpedo (a lock of 3 seconds), or none left';
	},

	GameDrive: function () {
		var scene = this.GameScene();
		if (scene && !scene.Driver('me', ''))
			this.GameNote = 'The mass driver: no target (T, the radar), or reloading';
	},

	/* The lance at the target of the ship (I): it charges, then burns on it. */
	GameLance: function () {
		var scene = this.GameScene();
		if (scene && !scene.Lance('me', ''))
			this.GameNote = 'The lance: no target (T, the radar), or charging or cooling';
	},

	/* The railgun faster than light of the ship (O), or of the platform over Terra, at the target of the ship. */
	GameRailgun: function (from) {
		var scene = this.GameScene();
		var inner = scene ? scene.Scene() : null;
		var target = inner && inner.Objects.me && inner.Objects.me.Tactics ? inner.Objects.me.Tactics.Target : '';
		if (scene && !scene.Railgun(from === 'platform' ? 'railgun-platform' : 'me', target, {Mode: this.GameRailDirect ? 'direct' : 'predict'}))
			this.GameNote = 'The railgun: no target (T, the radar), charging, reloading, or the platform is away (at home only)';
	},

	GameFlares: function () {
		var scene = this.GameScene();
		if (scene)
			scene.Flares('me');
	},

	GameDefence: function (value) {
		var scene = this.GameScene();

		this.GameDefenceOn = !!(value && value.detail !== undefined ? value.detail : value);

		if (scene)
			scene.Defence('me', this.GameDefenceOn);
	},

	/*
	 * Another character, live: the same one (its seat, its place aboard, its place on the ground) of another model. One
	 * of a file only in a copy that has it.
	 */
	GameCharacterChosen: function (value) {
		var self = this;
		var scene = this.GameScene ? this.GameScene() : null;
		var character = this.GameCharacters.filter(function (each) {
			return each.Value === value;
		})[0];
		var request;

		function swap () {
			var walker;

			self.GameNote = '';

			self.$Service('GameState').Set({Character: value});

			if (!scene || !scene.Get('pilot')) return;

			walker = self.GameWalker();

			scene.Change('pilot', {Model: walker.Model, Hold: walker.Hold});
		}

		if (!character) return;

		if (character.Model) {
			swap();

			return;
		}

		request = new XMLHttpRequest();

		request.open('HEAD', character.File);

		request.onload = function () {
			if (request.status !== 200) {
				self.GameNote = character.File + ' is not in this copy';

				return;
			}

			swap();
		};

		request.send();
	},

	/* A place of the system of Terra: aimed at and turned to, its step of warp set; H (Warp) goes there. */
	GamePlaced: function (value) {
		var scene = this.GameScene ? this.GameScene() : null;
		var ship = scene ? scene.Scene().Objects.me : null;
		var goal = this.GamePlaces.filter(function (one) {
			return one.Value === value;
		})[0];

		this.GamePlace = value;

		if (!goal) return;

		this.GameStep = goal.Step;
		this.GameNote = goal.Label + ': H warps there, then ' + goal.Note;

		if (!ship) return;

		ship.Values.Vehicle.Warp = {To: value, Step: Number(goal.Step), Well: 0.25};

		scene.Aim(value);
		scene.AimAlign(true);
	},

	/* H as a button: into warp to the place chosen, out of it if in it. */
	GameWarp: function () {
		var self = this;
		var scene = this.GameScene ? this.GameScene() : null;
		var ship = scene ? scene.Scene().Objects.me : null;
		if (!ship) return;

		if (ship.Travel && ship.Travel.Kind === 'warp') {
			scene.TravelStop('me');

			return;
		}

		/* At home to the place chosen; in another system to what it aims at (T). */
		scene.Travel('me', 'warp', this.GameEntered === this.GameHome ? {To: this.GamePlace, Step: Number(this.GameStep)} : {Step: Number(this.GameStep)}, function (error) {
			if (error)
				self.GamePhase = 'warp: ' + error.message.replace(/^Elemenx Scene: me /, '');
		});
	},

	/*
	 * Down onto the ground at the marker chosen, or under the ship (SceneLanding: no point given, the one under it); in
	 * another system under the ship, on the body it flies round.
	 */
	GameLand: function () {
		var scene = this.GameScene ? this.GameScene() : null;
		var home = this.GameEntered === this.GameHome;
		if (scene && !scene.Land('me', home ? this.GameSite ? {Body: 'terra', Marker: this.GameSite} : {Body: 'terra'} : {}))
			this.GamePhase = 'land: not from here';
	},

	/*
	 * An influence on the weather of the planet under the ship (Scene Influence): over its surface or in a location under
	 * the eye, in orbit under the ship (its way from the middle of the body, in the frame of the body), 400 km wide there:
	 * one of 30 is a speck from orbit.
	 */
	GameInfluence: function (kind) {
		var scene = this.GameScene ? this.GameScene() : null;
		var inner = scene ? scene.Scene() : null;
		var me = inner ? inner.Objects.me : null;
		var body = inner ? inner.Objects.terra : null;
		var math = this.$Service('Math');
		var made = scene ? scene.Influence(kind) : null;
		if (!made && me && body && me.World && body.World && body.Turn)
			made = scene.Influence(kind, {Body: 'terra', Direction: math.Apply(math.Invert(body.Turn), math.Vectors.Normalize(math.Vectors.Subtract(me.World, body.World)))}, {Radius: 400});

		this.GameNote = made ? kind + ' over ' + Math.round(made.Radius) + ' km for ' + Math.round(made.Length * 24) + ' h' : 'no planet under the ship';
	},

	/* The time of the scene moved on (days): the weather, the clouds and what they left on the ground as they are then. */
	GameLater: function (days) {
		var scene = this.GameScene ? this.GameScene() : null;
		if (scene)
			scene.SetTime(scene.Now() + days);
	},

	/* The autopilot of the ship: hold its course, approach what it aims at (50 km short of it), or off. */
	GameAutopilot: function (mode) {
		var scene = this.GameScene ? this.GameScene() : null;
		var aimed = scene && scene.Scene().Aim ? scene.Scene().Aim.Target : '';

		if (!scene) return;

		if (!scene.Autopilot('me', mode, {Target: aimed || this.GamePlace, Distance: 50000}))
			this.GamePhase = 'autopilot: nothing to fly to';
	},

	/* Round the body the ship is near (the command of the ship, as on the console of the pilot and in its instruments). */
	GameToOrbit: function () {
		var scene = this.GameScene ? this.GameScene() : null;
		if (scene && !scene.ShipCommand('me', 'orbit'))
			this.GamePhase = 'orbit: not from here';
	},

	GameTakeOff: function () {
		var scene = this.GameScene ? this.GameScene() : null;
		if (scene && !scene.TakeOff('me'))
			this.GamePhase = 'take off: not from here';
	},

	GameTravelled: function (event) {
		this.GamePhase = event.Phase === 'done' ? '' : event.Kind + ': ' + event.Phase;

		/* A warp goes at the step chosen. */
		if (event.Kind === 'warp' && event.Phase === 'enter' && !this.GameLeaving)
			this.GameScene().TravelStep('me', Number(this.GameStep));

		/* Out of a jump between stars: the ship of the system it came to at its edge (GameIn). */
		if (event.Kind === 'hyper' && event.Phase === 'exit' && event.Reason === 'arrived')
			this.GameArriving = true;
	},

	/* The phases of a landing and of a take-off: the level of the game they lead to, the weapon in hand on the ground only. */
	GameLanding: function (event) {
		var level = event.Phase === 'orbit' ? 'orbit' : event.Phase === 'landed' ? 'ground' : 'flight';

		this.GamePhase = level === 'flight' ? event.Phase : '';

		this.$Service('GameState').Set({Level: level});
		this.GameArm();
	},

	/* The weapon in hand: the one chosen on the ground, none elsewhere (in orbit a click is not a shot). */
	GameArm: function () {
		var scene = this.GameScene ? this.GameScene() : null;
		var pilot = scene ? scene.Scene().Objects.pilot : null;
		if (pilot)
			pilot.Values.Weapon = this.GameLevel === 'ground' && !this.GameDriving && !this.GameCommanding ? this.GameWeapon : '';
	},

	GameWeaponChosen: function (value) {
		this.$Service('GameState').Set({Weapon: value && value.detail !== undefined ? value.detail : value});
		this.GameArm();
	},

	/*
	 * The targets of Combat before the walker, toward the evenest ground near where the view looks, the view turned to them;
	 * again: what broke or fell comes back. Regression: laid up a steep slope, the shots at them went into the ground.
	 */
	GameRange: function () {
		var scene = this.GameScene ? this.GameScene() : null;
		var inner = scene ? scene.Scene() : null;
		var pilot = inner ? inner.Objects.pilot : null;
		var data = this.$Service('DemoData');
		var field = inner && inner.Ground ? inner.Ground.Field : null;
		var looked = inner ? Math.atan2(-Math.sin(inner.Yaw), -Math.cos(inner.Yaw)) : 0;
		var best = looked;
		var bestScore = Infinity;
		var at;
		var targets;
		var i;

		if (!pilot || !pilot.World || this.GameLevel !== 'ground') return;

		at = [pilot.World[0], pilot.World[2]];

		function height (x, z) {
			return Math.max(0, field.Height(x, z));
		}

		/* How far the ground of a way stands off the line of a shot to each target: up or down at it, over the line before it. */
		function rough (angle) {
			return data.Range(at, [Math.sin(angle), Math.cos(angle)], '').reduce(function (worst, spot) {
				var end = height(spot.X, spot.Y);
				var most = Math.abs(end - pilot.World[1]);

				for (var t = 0.2; t < 1; t += 0.2)
					most = Math.max(most, 2 * (height(at[0] + (spot.X - at[0]) * t, at[1] + (spot.Y - at[1]) * t) - (pilot.World[1] + (end - pilot.World[1]) * t)));

				return Math.max(worst, most);
			}, 0);
		}

		for (i = 0; field && i < 16; i++) {
			var angle = looked + i * Math.PI / 8;
			var off = Math.abs(Math.atan2(Math.sin(angle - looked), Math.cos(angle - looked)));
			var score = rough(angle) + off * 0.8;

			if (score < bestScore) {
				bestScore = score;
				best = angle;
			}
		}

		inner.Yaw = best + Math.PI;
		inner.Pitch = 0.1;

		targets = data.Range(at, [Math.sin(best), Math.cos(best)], 'range-');

		targets.forEach(function (one) {
			if (scene.Get(one.ID))
				scene.Remove(one.ID);
		});

		scene.Add(targets);

		this.GameNote = 'a click takes the mouse, the left button fires';
	},

	GameCarChosen: function (value) {
		var scene = this.GameScene ? this.GameScene() : null;

		this.$Service('GameState').Set({Car: value && value.detail !== undefined ? value.detail : value});

		/* One there already: the other in its place. */
		if (scene && scene.Get('game-car'))
			this.GameCarPut();
	},

	/* The car chosen beside the walker, along the view (or on the line of a track: at, heading), in its place if one was there. */
	GameCarPut: function (at, heading) {
		var scene = this.GameScene ? this.GameScene() : null;
		var inner = scene ? scene.Scene() : null;
		var pilot = inner ? inner.Objects.pilot : null;
		var ahead;

		if (!pilot || !pilot.World || this.GameLevel !== 'ground' || inner.Seated.pilot) return;

		if (!Array.isArray(at)) {
			ahead = [-Math.sin(inner.Yaw), -Math.cos(inner.Yaw)];
			/* Beside the walker, its door within reach of G (SceneVehicles: its size and 1.5 m). */
			at = [pilot.World[0] + ahead[1] * 2.2, pilot.World[2] - ahead[0] * 2.2];
			heading = Math.atan2(ahead[0], ahead[1]);
		}

		if (scene.Get('game-car'))
			scene.Remove('game-car');

		scene.Add('unit', this.$Service('DemoData').Car(this.GameCar, {ID: 'game-car', X: at[0], Y: at[1], Heading: heading}));

		this.GameNote = 'G by its door gets in';
	},

	/*
	 * A track of a seed (SceneRoadGenerator.Track) from where the walker stands: its start line there, the loop turned away
	 * from the ship, the car on the line, the race from it. Of the location (Scene.Include): it goes with it.
	 */
	GameTrack: function () {
		var scene = this.GameScene ? this.GameScene() : null;
		var inner = scene ? scene.Scene() : null;
		var pilot = inner ? inner.Objects.pilot : null;
		var ship = inner ? inner.Objects.me : null;
		var track;
		var middle = [0, 0];
		var away;
		var turn;
		var start;
		var way;
		var element;

		if (!pilot || !pilot.World || !ship || !ship.World || this.GameLevel !== 'ground' || inner.Seated.pilot) return;

		this.GameTrackSeed++;

		track = this.$Service('SceneRoadGenerator').Track('game-' + this.GameTrackSeed, {ID: 'game-track', Length: 1600});
		start = track.Start;

		track.Spec.Points.forEach(function (point) {
			middle[0] += point[0] / track.Spec.Points.length;
			middle[1] += point[1] / track.Spec.Points.length;
		});

		/* The turn that takes the middle of its loop from its start away from the ship. */
		away = [pilot.World[0] - ship.World[0], pilot.World[2] - ship.World[2]];
		turn = Math.atan2(away[1], away[0]) - Math.atan2(middle[1] - start.Z, middle[0] - start.X);

		function placed (x, z) {
			var dx = x - start.X;
			var dz = z - start.Z;

			return [pilot.World[0] + dx * Math.cos(turn) - dz * Math.sin(turn), pilot.World[2] + dx * Math.sin(turn) + dz * Math.cos(turn)];
		}

		track.Spec.Points = track.Spec.Points.map(function (point) {
			return placed(point[0], point[1]).map(function (value) {
				return Math.round(value * 100) / 100;
			});
		});

		way = placed(start.X + Math.sin(start.Heading), start.Z + Math.cos(start.Heading));

		if (scene.Get('game-track'))
			scene.Remove('game-track');

		scene.Add('road', track.Spec);

		this.GameCarPut([pilot.World[0], pilot.World[2]], Math.atan2(way[0] - pilot.World[0], way[1] - pilot.World[2]));

		/* The walker a step aside, off the line, by the door. */
		way = [way[0] - pilot.World[0], way[1] - pilot.World[2]];

		pilot.Values.X = pilot.World[0] - way[1] * 2.2;
		pilot.Values.Y = pilot.World[2] + way[0] * 2.2;

		element = scene.$Element().querySelector('.elemenx-game-race');

		if (element && Elemenx.Instance(element))
			Elemenx.Instance(element).Start();

		this.GameNote = 'G gets in: ' + Math.round(track.Length / 100) / 10 + ' km, 3 laps';
	},

	/* The pilot up out of the seat (in orbit), on foot at the airlock of the ship: the hatch in its floor, else by the seat. */
	GameAirlock: function () {
		var scene = this.GameScene ? this.GameScene() : null;
		var inner = scene ? scene.Scene() : null;
		var inside = scene ? scene.Interior('me') : null;
		var hatch = inside && inside.Plan.Ramp ? inside.Plan.Ramp.Hatch : null;
		var seat = inside ? inside.Plan.Seats[0] : null;

		if (!inner || !inside || this.GameLevel !== 'orbit') return;

		if (inner.Seated.pilot)
			scene.Leave('pilot');

		if (!inner.Afoot.pilot || inner.Afoot.pilot.Out) return;

		inner.Afoot.pilot.At = hatch ? [(hatch.Low[0] + hatch.High[0]) / 2, hatch.High[1], (hatch.Low[2] + hatch.High[2]) / 2] : (seat.Exit || seat.At).slice();

		this.GameNote = 'G opens the airlock';
	},

	/* Out of the ship and in again (SceneAboard: eva). */
	GameEva: function (event) {
		var given = event && event.detail ? event.detail : event;
		if (!given || given.Actor !== 'pilot') return;

		this.GameNote = given.Step === 'cycle' ? 'the airlock cycles' : given.Step === 'out' ? 'out in a suit: WASD, Space up, C down, Shift faster; G by the airlock in' : 'back in';
	},

	/* In a seat or on foot (SceneVehicles: context): in a car the weapon is put away, out of it taken again. */
	GameContext: function (event) {
		var given = event && event.detail ? event.detail : event;
		if (!given || given.Actor !== 'pilot') return;

		this.GameDriving = given.Kind === 'seat' && given.Vehicle === 'game-car';

		this.GameArm();
	},

	/*
	 * A squad of the player by the walker (soldiers, one of them with rockets) and robots of the red team 50 m across from it,
	 * away from the ship; again: the ones that fell come back. Of the location: they go with it.
	 */
	GameSquads: function () {
		var scene = this.GameScene ? this.GameScene() : null;
		var inner = scene ? scene.Scene() : null;
		var pilot = inner ? inner.Objects.pilot : null;
		var ship = inner ? inner.Objects.me : null;
		var away;
		var side;
		var length;
		var squads = [];
		var i;

		if (!pilot || !pilot.World || !ship || !ship.World || this.GameLevel !== 'ground') return;

		away = [pilot.World[0] - ship.World[0], pilot.World[2] - ship.World[2]];
		length = Math.hypot(away[0], away[1]) || 1;
		away = [away[0] / length, away[1] / length];
		side = [away[1], -away[0]];

		for (i = 0; i < 4; i++) {
			squads.push({ID: 'squad-blue-' + i, Name: 'Soldier', Kind: 'unit', Model: 'soldier', Team: 'blue', Weapon: i === 3 ? 'rocket' : 'rifle', X: pilot.World[0] + away[0] * 6 + side[0] * (i - 1.5) * 3, Y: pilot.World[2] + away[1] * 6 + side[1] * (i - 1.5) * 3});
			squads.push({ID: 'squad-red-' + i, Name: 'Robot', Kind: 'unit', Model: 'robot', Team: 'red', Weapon: 'plasma', X: pilot.World[0] + away[0] * 56 + side[0] * (i - 1.5) * 3, Y: pilot.World[2] + away[1] * 56 + side[1] * (i - 1.5) * 3});
		}

		squads.forEach(function (one) {
			if (scene.Get(one.ID))
				scene.Remove(one.ID);
		});

		scene.Add(squads);

		this.GameNote = 'Command: the view over them, a right press orders';
	},

	/* The view over the squads as a strategy, the walker standing where it is; off: the walker under the keys again. */
	GameCommanded: function (value) {
		var self = this;
		var scene = this.GameScene ? this.GameScene() : null;
		var inner = scene ? scene.Scene() : null;
		var mine;
		var middle;

		this.GameCommanding = !!(value && value.detail !== undefined ? value.detail : value) && this.GameLevel === 'ground';

		this.GameArm();

		if (!inner) return;

		if (!this.GameCommanding) {
			scene.Control('pilot');

			inner.Wanted = inner.Distance = 3.2;
			this.GameNote = '';

			return;
		}

		mine = Object.keys(inner.Objects).filter(function (id) {
			return id.indexOf('squad-') === 0 && inner.Objects[id].World;
		}).map(function (id) {
			return inner.Objects[id].World;
		});

		if (!mine.length && inner.Objects.pilot && inner.Objects.pilot.World)
			mine = [inner.Objects.pilot.World];

		middle = mine.reduce(function (sum, at) {
			return [sum[0] + at[0] / mine.length, sum[1] + at[1] / mine.length, sum[2] + at[2] / mine.length];
		}, [0, 0, 0]);

		scene.Control('');
		scene.SetViewpoint({Target: middle, Yaw: inner.Yaw, Pitch: 0.85, Distance: 70});

		inner.Wanted = 70;

		/* The robots come at the squad once it is commanded (GameStrategy made with the toggle: the frame after). */
		window.requestAnimationFrame(function () {
			var element = scene.$Element().querySelector('.elemenx-game-strategy');
			var strategy = element ? Elemenx.Instance(element) : null;
			var red = Object.keys(inner.Objects).filter(function (id) {
				return id.indexOf('squad-red-') === 0;
			});
			if (strategy && red.length && inner.Objects['squad-blue-0'])
				strategy.Order(red, 'squad-blue-0', 'attack');

			self.GameNote = 'a press selects, a right press orders (on a foe: attack)';
		});
	},

	GameSelected: function (event) {
		this.GameNote = event.IDs.length ? event.IDs.length + ' selected' : 'nothing selected';
	},

	GameOrdered: function (event) {
		this.GameNote = event.Kind === 'attack' ? 'attack ' + event.Target : event.Kind === 'stop' ? 'stop' : 'move: ' + event.IDs.length;
	},

	GameLapped: function (event) {
		this.GameNote = 'lap ' + event.Lap + ' ' + Math.floor(event.Time / 60) + ':' + ('0' + (event.Time % 60).toFixed(1)).slice(-4);
	},

	/* What the player hit, by its material. */
	GameHit: function (event) {
		if (event.Source !== 'pilot') return;

		this.GameNote = event.Weapon + ' hit ' + (event.Target ? event.Target.replace(/^range-/, '') : 'the ground') + ' (' + event.Material + ') for ' + Math.round(event.Amount);
	},

	GameGraphOpened: function (name) {
		this.GameGraphOpen = this.GameGraphOpen === name ? '' : name;
	},

	/* What is felt aboard is read each frame: the scene goes on as it is. */
	GameGraphChanged: function (event) {
		var given = event && event.detail ? event.detail : event;
		var graphs = Object.assign({}, this.GameGraphs || {});

		if (given.Graph) graphs[given.Name] = given.Graph;
		else delete graphs[given.Name];

		this.GameGraphs = Object.keys(graphs).length ? graphs : null;
	}
});
