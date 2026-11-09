/*
 * SceneShowcase: one big world made of every primitive of the generation of a Scene, district by district, as a demo of
 * what they make together and as a benchmark of a scene as large as a game has.
 * - World(options) gives the world: {Name, Seed (of its ground: a Scene of a Seed would make a star system round it),
 *   Size, Time, Weather, Objects (specs for Scene.Add, the ground first), Districts ([{ID, Name, X, Y, Radius, Shows (the
 *   primitives it shows)}]), Route (the views a tour of it goes through: [{ID, Name, Target [x, y, z], Yaw, Pitch,
 *   Distance}])}. Options: Size (of the ground, 3000 metres), Seed ('showcase'), Districts (the IDs of those wanted; all
 *   of them by default).
 * - Districts(): the districts it lays out: [{ID, Name, X, Y, Radius, Shows}].
 * The ground holds the sketch of all of them: mountains, a crater and a canyon, a river from the hills to a sea with its
 * beach and dunes, a lake and a swamp, towns of each kind with their districts, squares, walls and a landmark, farms in
 * rows, woods of each kind, the strokes and stamps of an editor, the triggers and zones of a game. Over it stand the
 * roads (motorway with its bridges and tunnels, railway, a lane over the motorway, a level crossing with its barriers down, a
 * roundabout, interchanges of every form (stack, cloverleaf, diamond, roundabout, trumpet), a country road on a viaduct, the motorway on one over the sea, a road under the big mountain with a branch ending on it in a tunnel, a race track with its barriers and a
 * paved street bending inside it, a
 * gallery of every type of road),
 * a gallery of every model of SceneModels and every class of SceneBuildingGenerator, the effects and lights, a mirror and
 * a glass, walkers, a car and a boat. Its galleries are read from the Services, so a model or a type added shows too.
 * The same functions run in Node: they read no page (World defines the buildings of its gallery in SceneModels).
 */
Elemenx.Service('SceneShowcase', {
	$Meta: {
		Description: 'One big world made of every primitive of the generation of a Scene: a demo and a benchmark.',
		Methods: ['World(options)', 'Districts()']
	},

	/* The effects of the plaza: every type that stands by itself (glow, mana, wake and spray go with what moves). */
	Effects: ['campfire', 'torch', 'spark', 'smoke', 'steam', 'dust', 'exhaust', 'fumes', 'backfire', 'explosion', 'aura', 'circle', 'portal', 'shield', 'lightning', 'healing', 'frost', 'poison', 'beam', 'fireball', 'teleport', 'pillar'],

	Districts: function () {
		return [
			{ID: 'mountains', Name: 'Mountains', X: -100, Y: -1050, Radius: 520, Shows: ['mountain', 'ridge', 'cliff', 'canyon', 'crater', 'rock', 'snow', 'tunnel', 'rocks', 'cave']},
			{ID: 'river', Name: 'River and lake', X: -350, Y: -350, Radius: 380, Shows: ['river', 'valley', 'floodplain', 'lake', 'swamp', 'bridge']},
			{ID: 'sea', Name: 'Sea', X: 1150, Y: 150, Radius: 420, Shows: ['basin', 'beach', 'dunes', 'waves', 'boat']},
			{ID: 'town', Name: 'Town', X: 150, Y: 250, Radius: 260, Shows: ['settlement', 'district', 'square', 'street', 'landmark', 'junction']},
			{ID: 'city', Name: 'City', X: -750, Y: 450, Radius: 300, Shows: ['settlement city', 'business district', 'runway']},
			{ID: 'villages', Name: 'Villages and a fort', X: 600, Y: -500, Radius: 380, Shows: ['village', 'hamlet', 'fort', 'citywall', 'village kind']},
			{ID: 'farms', Name: 'Farms', X: 450, Y: 900, Radius: 330, Shows: ['fields', 'orchard', 'row', 'fence', 'hedge', 'wall', 'powerline', 'meadow', 'terraces']},
			{ID: 'woods', Name: 'Woods', X: -1150, Y: -250, Radius: 330, Shows: ['forest', 'sequoia', 'jungle', 'bushes', 'thicket', 'clearing', 'biome']},
			{ID: 'workshop', Name: 'Editor strokes', X: 1000, Y: -1050, Radius: 300, Shows: ['raise', 'lower', 'flatten', 'smooth', 'stamp', 'erosion', 'mask', 'plateau']},
			{ID: 'galleries', Name: 'Galleries', X: -700, Y: 1120, Radius: 330, Near: 0.9, Shows: ['models', 'buildings', 'road types', 'effects', 'lights', 'mirror', 'glass']},
			{ID: 'race', Name: 'Race track', X: 1050, Y: 1000, Radius: 300, Shows: ['track', 'barriers', 'car']},
			{ID: 'game', Name: 'Game', X: -150, Y: 700, Radius: 220, Shows: ['trigger', 'triggerpoint', 'triggerline', 'zone', 'collider', 'marker', 'units', 'location']}
		];
	},

	World: function (options) {
		var settings = options || {};
		var size = Number(settings.Size) || 3000;
		var seed = settings.Seed === undefined ? 'showcase' : String(settings.Seed);
		var wanted = settings.Districts || null;
		var scale = size / 3000;
		var models = this.$Service('SceneModels');
		var objects = [];
		var layers = [];
		var districts = this.Districts().filter(function (district) {
			return !wanted || wanted.indexOf(district.ID) !== -1;
		});
		var on = {};
		var route;

		districts.forEach(function (district) {
			on[district.ID] = true;
		});

		/* A point of the plan, at the scale of the ground. */
		function at (x, z, y) {
			return y === undefined ? [x * scale, z * scale] : [x * scale, z * scale, y];
		}

		function points (list) {
			return list.map(function (point) {
				return at(point[0], point[1], point[2]);
			});
		}

		/* A ring of points round a place: a district drawn as an area. */
		function ring (x, z, radius, count, wobble) {
			var list = [];
			var i;

			for (i = 0; i < count; i++)
				list.push(at(x + Math.cos(i / count * Math.PI * 2) * radius * (1 + (wobble || 0) * Math.sin(i * 2.3)), z + Math.sin(i / count * Math.PI * 2) * radius * (1 + (wobble || 0) * Math.cos(i * 1.7))));

			return list;
		}

		function rect (x0, z0, x1, z1) {
			return [at(x0, z0), at(x1, z0), at(x1, z1), at(x0, z1)];
		}

		function layer (id, items) {
			if (!items.length) return;

			layers.push({ID: id, Name: id, Visible: true, Strength: 1, Items: items.map(function (item, index) {
				return Object.assign({ID: id + '-' + index, Strength: 1}, item);
			})});
		}

		function add (spec) {
			objects.push(spec);
		}

		/* The relief of the mountains: peaks, a ridge between them, a cliff, a canyon and a crater. */
		if (on.mountains) {
			layer('mountains', [
				{Type: 'mountain', At: at(-450, -1100), Radius: 260 * scale, Height: 260, Ridged: true},
				{Type: 'mountain', At: at(-80, -1220), Radius: 220 * scale, Height: 220, Ridged: true},
				{Type: 'mountain', At: at(300, -1150), Radius: 240 * scale, Height: 300, Ridged: false},
				{Type: 'ridge', Points: points([[-450, -1100], [-80, -1220], [300, -1150]]), Width: 90 * scale, Height: 120, Sharp: 0.6},
				{Type: 'cliff', Points: points([[-650, -800], [-450, -760], [-250, -790]]), Height: 35, Reach: 40 * scale},
				{Type: 'canyon', Points: points([[60, -1450], [120, -1250], [100, -1080]]), Width: 40 * scale, Depth: 45},
				{Type: 'crater', At: at(620, -1000), Radius: 110 * scale, Depth: 40, Rim: 18}
			]);
		}

		/* Water: a river from the hills to the sea, its valley and floodplain, a lake and its swamp. */
		if (on.river) {
			layer('river', [
				{Type: 'valley', Points: points([[-300, -700], [-150, -350], [150, -100]]), Width: 160 * scale, Depth: 18},
				{Type: 'river', Points: points([[-300, -720, 20], [-150, -350], [150, -100], [450, 80], [750, 160], [1000, 160]]), Width: 18 * scale, Depth: 4, Bank: 10 * scale, Flow: 1},
				{Type: 'floodplain', Points: ring(150, -100, 140, 10, 0.15), Level: 2},
				{Type: 'lake', Points: ring(-600, -320, 130, 12, 0.2), Level: 6, Depth: 9},
				{Type: 'swamp', Points: ring(-430, -180, 90, 10, 0.25), Level: 5}
			]);
		}

		/* The sea in the east: a basin under its level, a beach along it and dunes south of it. */
		if (on.sea) {
			layer('sea', [
				{Type: 'basin', Points: points([[880, -400], [1500, -500], [1500, 650], [900, 600], [820, 200]]), Edge: 140 * scale, Depth: 60},
				{Type: 'beach', Points: points([[780, -380], [880, -400], [820, 200], [900, 600], [800, 620], [730, 200]]), Edge: 40 * scale},
				{Type: 'dunes', Points: points([[820, 640], [1250, 640], [1250, 760], [820, 760]]), Edge: 40 * scale, Height: 6, Length: 30, Way: 30},
				{Type: 'biome', Points: points([[820, 640], [1250, 640], [1250, 760], [820, 760]]), Edge: 40 * scale, Palette: 'desert'}
			]);

			add({ID: 'boat', Kind: 'unit', Name: 'Boat', Model: 'boat', Size: 5.5, X: 1150 * scale, Y: 100 * scale, Vehicle: {Kind: 'boat', Heading: Math.PI / 2}});
		}

		/* The town: a settlement with its districts, a square, a street and a landmark. */
		if (on.town) {
			layer('town', [
				{Type: 'settlement', Points: ring(150, 250, 230, 14, 0.1), Kind: 'town', Density: 0.85, Seed: seed + '-town'},
				{Type: 'district', Points: ring(80, 170, 110, 8), Kind: 'market'},
				{Type: 'district', Points: ring(260, 330, 120, 8), Kind: 'residential'},
				{Type: 'square', Points: ring(150, 250, 28, 8)},
				{Type: 'street', Points: points([[-60, 250], [360, 250]]), Width: 10},
				{Type: 'landmark', At: at(150, 276), Radius: 14, Model: 'temple', Name: 'Temple'}
			]);
		}

		/* The city: business in its core, a runway beside it. */
		if (on.city) {
			layer('city', [
				{Type: 'plateau', Points: ring(-750, 450, 320, 12, 0.08), Edge: 80 * scale, Height: 14},
				{Type: 'settlement', Points: ring(-750, 380, 240, 14, 0.08), Kind: 'city', Density: 0.8, Seed: seed + '-city'},
				{Type: 'district', Points: ring(-750, 380, 100, 8), Kind: 'business'},
				{Type: 'district', Points: ring(-900, 300, 90, 8), Kind: 'industry'}
			]);

			add({ID: 'runway', Kind: 'road', Name: 'Runway', Type: 'runway', Points: points([[-1000, 640], [-500, 640]])});
			/* Its taxiway on the side away from the city (Regression: it ran through the streets, crossing them at no level). */
			add({ID: 'taxiway', Kind: 'road', Type: 'taxiway', Points: points([[-900, 640], [-900, 700], [-650, 700], [-650, 640]])});
		}

		/* Villages of each kind, a fort with its wall, and a village of the kind village (SceneBiomes). */
		if (on.villages) {
			layer('villages', [
				{Type: 'settlement', Points: ring(450, -450, 120, 10, 0.15), Kind: 'village', Seed: seed + '-village'},
				{Type: 'settlement', Points: ring(780, -650, 70, 8, 0.15), Kind: 'hamlet', Seed: seed + '-hamlet'},
				{Type: 'settlement', Points: ring(400, -200, 110, 8), Kind: 'fort', Seed: seed + '-fort'},
				{Type: 'citywall', Points: ring(400, -200, 118, 8).concat([ring(400, -200, 118, 8)[0]])}
			]);

			add({ID: 'hamlet', Kind: 'village', Name: 'Village', X: 700 * scale, Y: -380 * scale, Houses: 9});
		}

		/* Farms: fields and an orchard in rows, the lines of things between them, a meadow and terraces on the slope. */
		if (on.farms) {
			layer('farms', [
				{Type: 'fields', Points: rect(250, 750, 550, 950), Spacing: 3, Gap: 6, Way: 0},
				{Type: 'orchard', Points: rect(570, 750, 720, 950), Spacing: 7, Gap: 7, Way: 90},
				{Type: 'meadow', Points: rect(250, 970, 720, 1100), Density: 1},
				{Type: 'terraces', Points: ring(150, 1050, 110, 10, 0.1), Edge: 30 * scale, Step: 4},
				{Type: 'hedge', Points: points([[240, 740], [730, 740]]), Spacing: 1.5},
				{Type: 'fence', Points: points([[240, 960], [730, 960]]), Spacing: 2.5},
				{Type: 'wall', Points: points([[240, 740], [240, 1110]]), Spacing: 2},
				{Type: 'row', Points: points([[730, 740], [730, 1110]]), Shapes: ['birch'], Spacing: 9},
				{Type: 'powerline', Points: points([[150, 400], [450, 700], [700, 1150]]), Spacing: 60},
				{Type: 'road', Points: points([[250, 1120, 12], [480, 1130], [720, 1120]]), Width: 6, Shoulder: 2}
			]);
		}

		/* Woods of every kind, with a clearing; a corner of another biome. */
		if (on.woods) {
			layer('woods', [
				{Type: 'forest', Points: rect(-1400, -500, -1050, -200), Density: 1, Passability: 0.5},
				{Type: 'sequoia', Points: rect(-1400, -180, -1150, 100), Density: 1},
				{Type: 'jungle', Points: rect(-1130, -180, -900, 100), Density: 1},
				{Type: 'bushes', Points: rect(-1030, -500, -900, -200), Density: 1},
				{Type: 'thicket', Points: ring(-1280, 200, 80, 8, 0.2), Density: 1},
				{Type: 'clearing', Points: ring(-1220, -350, 50, 8, 0.2)},
				{Type: 'biome', Points: rect(-1420, -520, -880, 120), Edge: 60 * scale, Palette: 'taiga'}
			]);
		}

		/* The tools of an editor: strokes that raise, lower, flatten and smooth, a stamp, erosion, a mask and a plateau. */
		if (on.workshop) {
			layer('workshop', [
				{Type: 'plateau', Points: ring(1000, -1050, 260, 12, 0.05), Edge: 60 * scale, Height: 30},
				{Type: 'raise', Points: points([[850, -1150], [950, -1180], [1050, -1150]]), Radius: 30 * scale, Amount: 12},
				{Type: 'lower', Points: points([[850, -950], [950, -920], [1050, -950]]), Radius: 30 * scale, Amount: 10},
				{Type: 'flatten', Points: points([[1150, -1150], [1150, -950]]), Radius: 25 * scale, Height: 40},
				{Type: 'smooth', Points: points([[900, -1050], [1100, -1050]]), Radius: 40 * scale},
				{Type: 'stamp', At: at(1180, -1200), Radius: 60 * scale, Height: 25, Turn: 30, Data: this.Stamp(16)},
				{Type: 'erosion', Points: ring(830, -1180, 60, 8), Edge: 20 * scale, Amount: 0.8},
				{Type: 'mask', Points: ring(1180, -900, 50, 8), Edge: 10 * scale}
			]);
		}

		/* The game: its triggers, a zone, markers to spawn at, walkers and a location. */
		if (on.game) {
			layer('game', [
				{Type: 'trigger', Points: ring(-150, 700, 40, 6), Team: '', Once: false},
				{Type: 'triggerpoint', At: at(-60, 640), Radius: 12},
				{Type: 'triggerline', Points: points([[-260, 620], [-260, 780]]), Width: 6},
				{Type: 'zone', Points: ring(-150, 700, 120, 8), Tags: ['safe'], Team: 'blue'},
				{Type: 'collider', Points: rect(-230, 760, -210, 790), Height: 4},
				{Type: 'marker', At: at(-200, 760), Radius: 4, Role: 'spawn', Team: 'blue', Name: 'Blue base'},
				{Type: 'marker', At: at(-80, 760), Radius: 4, Role: 'spawn', Team: 'red', Name: 'Red base'}
			]);

			['scout', 'builder', 'ranger'].forEach(function (id, index) {
				add({ID: id, Kind: 'unit', Name: id.charAt(0).toUpperCase() + id.substring(1), Team: 'blue', X: (-180 + index * 12) * scale, Y: 720 * scale});
			});

			add({ID: 'gate', Kind: 'trigger', Name: 'Gate', X: -150 * scale, Y: 640 * scale, Radius: 6});
			add({ID: 'camp', Kind: 'zone', Name: 'Camp', X: -40 * scale, Y: 780 * scale, Radius: 30, Tags: ['camp']});
			add({ID: 'spawn', Kind: 'marker', Name: 'Spawn', X: -120 * scale, Y: 780 * scale});
			add({ID: 'cave', Kind: 'location', Name: 'Location', X: -230 * scale, Y: 660 * scale, Size: 3});
		}

		/* The galleries on a flat place: every model, every class of building, every type of road, every effect. */
		if (on.galleries) {
			layer('galleries', [
				{Type: 'plateau', Points: rect(-1100, 820, -300, 1480), Edge: 60 * scale, Height: 10},
				{Type: 'clearing', Points: rect(-1100, 820, -300, 1480)}
			]);

			this.Galleries(at, add);
		}

		/* The race track: a closed ring with its barriers, a car on it. */
		if (on.race) {
			layer('race', [
				{Type: 'plateau', Points: ring(1050, 1000, 280, 14, 0.05), Edge: 70 * scale, Height: 8}
			]);

			add({ID: 'track', Kind: 'road', Name: 'Race track', Type: 'track', Closed: true, Points: ring(1050, 1000, 200, 12, 0.12)});
			add({ID: 'tyres', Kind: 'barrier', Road: 'track', Type: 'tyres', Side: 'right'});
			add({ID: 'rails', Kind: 'barrier', Road: 'track', Type: 'guardrail', Side: 'left'});
			add({ID: 'pit', Kind: 'barrier', Type: 'jersey', Points: points([[1000, 880], [1100, 880]])});

			/* A street that bends inside the ring: its paving and asphalt turn with it (tiles laid by its way, not by the world). */
			add({ID: 'bend', Kind: 'road', Name: 'Paved bend', Type: 'street', Points: points([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (i) {
				var angle = Math.PI * (-0.15 + 1.3 * i / 12);

				return [1050 + Math.cos(angle) * 75, 1040 + Math.sin(angle) * 75];
			}))});

			this.Car(at, add);
		}

		/*
		 * The roads between them: a motorway round the city and the town (never through them), over the floodplain and under
		 * the mountains, a road from it to the main street of the town, a railway, country roads, a junction.
		 */
		if (on.town || on.river || on.mountains) {
			add({ID: 'motorway', Kind: 'road', Name: 'Motorway', Type: 'motorway', Structures: true, Points: points([[-1480, 0], [-700, 0], [-200, -40], [150, -60], [560, -30], [820, -200], [500, -900], [300, -1400]]), Barriers: ['guardrail']});
			add({ID: 'town-road', Kind: 'road', Name: 'To the town', Type: 'road', Points: points([[-110, -46], [-90, 120], [-60, 250]])});
			add({ID: 'railway', Kind: 'road', Name: 'Railway', Type: 'rail-double', Structures: true, Points: points([[-1400, -650], [-500, -600], [0, -500], [500, -650], [1400, -700]])});
			/* The country road on a viaduct for a stretch (Elevated: 8 m over the fields), as a road over a marsh is. */
			add({ID: 'country', Kind: 'road', Name: 'Country road', Type: 'country', Points: points([[360, 250], [420, 600], [450, 760]]), Elevated: [[170, 330, 8]]});
			/*
			 * Under the big mountain: a road through it west to east in a tunnel, and a branch from the south that ends on it
			 * in the mountain, a fork under the ground (a chamber where they meet, the tunnels a graph: SceneRoads.TunnelGraph).
			 */
			add({ID: 'pass-road', Kind: 'road', Name: 'Road under the mountain', Type: 'road', Structures: true, Points: points([[-900, -1100], [-180, -1100]])});
			add({ID: 'pass-branch', Kind: 'road', Name: 'Branch in the mountain', Type: 'country', Structures: true, Points: points([[-520, -1460], [-520, -1100]])});
			add({ID: 'track-to-woods', Kind: 'road', Type: 'gravel', Points: points([[-900, -90], [-1000, -160], [-1100, -350]])});
			/* A road from the city that ends on the motorway: a trumpet (the ramps where the motorway goes on the ground). */
			add({ID: 'city-link', Kind: 'road', Name: 'Road to the city', Type: 'road', Points: points([[-510, 210], [-510, 0]])});
			/* Where the country road leaves the main street of the town: a roundabout. */
			add({ID: 'cross', Kind: 'junction', X: 360 * scale, Y: 250 * scale, Radius: 14, Form: 'ring'});

			/*
			 * A lane over the railway west of the city: a level crossing, its barriers down. Where the line of the railway is at
			 * x = -800 (its curve, as SceneRoads makes it; on the ground there), the lane straight across it.
			 */
			var rail = this.$Service('SceneRoads').Line(points([[-1400, -650], [-500, -600], [0, -500], [500, -650], [1400, -700]]), {}).reduce(function (best, point) {
				return Math.abs(point.X + 800 * scale) < Math.abs(best.X + 800 * scale) ? point : best;
			});

			add({ID: 'level-lane', Kind: 'road', Name: 'Lane over the railway', Type: 'country', Points: [[rail.X, rail.Z - 140 * scale], [rail.X, rail.Z + 140 * scale]]});
			add({ID: 'level-crossing', Kind: 'junction', X: rail.X, Y: rail.Z, Closed: true});

			/* A lane over the motorway west of the town: an overpass, the lane up on its banks and a bridge over it. */
			add({ID: 'overpass-lane', Kind: 'road', Name: 'Lane over the motorway', Type: 'country', Points: points([[-860, 220], [-860, -130]])});

			/*
			 * Interchanges along a motorway on the west edge, north to south: a roundabout one (two rings) and a diamond with roads
			 * across it, a cloverleaf where it crosses the main motorway (told: two motorways would make a stack), a stack where
			 * it crosses another motorway; the road to the town ends on the main motorway in a trumpet. Their ramps: SceneRoads.
			 */
			add({ID: 'motorway-west', Kind: 'road', Name: 'West motorway', Type: 'motorway', Structures: true, Points: points([[-1260, -1450], [-1260, 1450]])});
			add({ID: 'motorway-south', Kind: 'road', Name: 'South motorway', Type: 'motorway', Structures: true, Points: points([[-1480, -1000], [-700, -1000]])});
			add({ID: 'diamond-road', Kind: 'road', Name: 'Road to the west', Type: 'road', Points: points([[-1480, 600], [-1060, 600]])});
			add({ID: 'ring-road', Kind: 'road', Name: 'Road of two rings', Type: 'road', Points: points([[-1480, 1150], [-1100, 1150]])});
			add({ID: 'clover', Kind: 'junction', X: -1260 * scale, Y: 0, Form: 'cloverleaf'});
			add({ID: 'rings', Kind: 'junction', X: -1260 * scale, Y: 1150 * scale, Form: 'roundabout'});
		}

		/*
		 * Pipes by the river: a water main on supports, half full, running out of its end and out of a hole in its side; a steam line with a leak; a culvert on the ground a ball rests in; a sewer under the ground a man may walk in,
		 * open where it comes out by the river; a thin gas pipe on the ground, closed at both ends.
		 */
		if (on.river) {
			add({ID: 'water-main', Kind: 'pipe', Name: 'Water main', Points: points([[-600, -180], [-500, -180], [-460, -220], [-420, -220]]), Radius: 0.5, Laid: 'above', Lift: 2, Fluid: {Type: 'water', Fill: 0.5, Flow: 1.5, Pressure: 2}, Leaks: [{Along: 115, Angle: -115, Size: 0.05}]});
			add({ID: 'sewer', Kind: 'pipe', Name: 'Sewer', Points: points([[-600, -300], [-450, -300], [-260, -351], [-196, -370, 11.5]]), Radius: 1.1, Laid: 'buried', Depth: 1.5, Color: [0.5, 0.49, 0.46], Metal: 0, Fluid: {Type: 'sewage', Fill: 0.25, Flow: 0.8}});
			/* A culvert a man walks in, on the ground: a ball rolls down in it, a crate lies on it (trait Rigid: the Physics hold them in and on it). */
			add({ID: 'culvert', Kind: 'pipe', Name: 'Culvert', Points: points([[-600, -140], [-540, -140]]), Radius: 1.6, Wall: 0.18, Laid: 'ground', Color: [0.6, 0.59, 0.56], Metal: 0, Flanges: 4});

			if (!models.Has('showcase-ball'))
				models.Define('showcase-ball', {Group: 'props', Type: 'thing', Size: 1, Parts: [{ID: 'ball', Shape: 'ball', Size: [1, 1, 1], At: [0, 0.5, 0], Color: '#c8402e'}]});

			if (!models.Has('showcase-crate'))
				models.Define('showcase-crate', {Group: 'props', Type: 'thing', Size: 1, Parts: [{ID: 'crate', Shape: 'box', Size: [1, 1, 1], At: [0, 0.5, 0], Color: '#9a6a3a'}]});

			add({ID: 'ball-in', Kind: 'thing', Name: 'Ball in the culvert', Model: 'showcase-ball', Size: 0.8, X: -570 * scale, Y: -140 * scale, Lift: 0.8, Traits: {Rigid: {Shape: 'sphere', Radius: 0.4, Mass: 20}}});
			add({ID: 'crate-on', Kind: 'thing', Name: 'Crate on the culvert', Model: 'showcase-crate', Size: 0.8, X: -560 * scale, Y: -140 * scale, Lift: 4.5, Traits: {Rigid: {Shape: 'box', Size: [0.8, 0.8, 0.8], Mass: 20}}});
			add({ID: 'steam-line', Kind: 'pipe', Name: 'Steam line', Points: points([[-600, -115], [-520, -115]]), Radius: 0.15, Laid: 'above', Lift: 1.2, Color: [0.75, 0.73, 0.7], Ends: 'closed', Fluid: {Type: 'steam', Fill: 1, Pressure: 6}, Leaks: [{Along: 40, Angle: 0, Size: 0.02}]});
			add({ID: 'gas-line', Kind: 'pipe', Name: 'Gas line', Points: points([[-600, -250], [-480, -250], [-470, -262]]), Radius: 0.08, Laid: 'ground', Ends: 'closed', Color: [0.85, 0.7, 0.1], Fluid: {Type: 'gas', Pressure: 4}});
		}

		/* The sun, a third of the way through the day. */
		add({ID: 'sun', Kind: 'sun', Latitude: 45, DayOfYear: 172, Noon: 180, Time: 10.5});

		/* What grows on all of the ground, before the districts tell otherwise: grass, groves, thickets and rocks. */
		add({ID: 'meadows', Kind: 'grass', Density: 0.8, Height: 0.6});
		add({ID: 'groves', Kind: 'grove', Density: 0.5, Cover: 0.3});
		add({ID: 'thickets', Kind: 'thicket', Density: 2, Cover: 0.2});
		add({ID: 'stones', Kind: 'rocks', Density: 0.3});

		/*
		 * A cave in the big mountain, a graph of passages: a mouth at its foot, a way level into its slope to a fork, a hall at
		 * the end of one branch, and down the other to a lower hall; its walls rough.
		 */
		if (on.mountains)
			add({ID: 'cave-mouth', Kind: 'marker', Name: 'Cave', X: -540 * scale, Y: -905 * scale});

		var passages = on.mountains ? [{Rough: 0.6, Seed: 'showcase-cave', Radius: 2.6, Crust: 1.5, Nodes: [{ID: 'mouth', At: at(-540, -895, 49)}, {ID: 'fork', At: at(-540, -990, 48)}, {ID: 'hall', At: at(-490, -1040, 47), Radius: 12}, {ID: 'deep', At: at(-590, -1050, 34), Radius: 7}], Ways: [{From: 'mouth', To: 'fork'}, {From: 'fork', To: 'hall', Radius: 3}, {From: 'fork', To: 'deep', Points: [at(-580, -1010)]}]}] : [];

		objects.unshift({ID: 'land', Kind: 'ground', Name: '', Swell: 0.5, World: this.$Service('SceneWorld').Library({Size: size, Height: 60, Water: 0.12, Scale: 380, Ridges: 0.2, Rock: 0.8, Snow: 0.95, Seed: seed, Sketch: {Layers: layers}, Passages: passages})});

		route = districts.map(function (district) {
			return {ID: district.ID, Name: district.Name, Target: [district.X * scale, 0, district.Y * scale], Yaw: 0.6, Pitch: 0.5, Distance: district.Radius * scale * (district.Near || 1.6)};
		});

		return {
			Name: 'Showcase',
			Seed: seed,
			Size: size,
			Time: 10.5,
			Weather: '',
			Objects: objects,
			Districts: districts.map(function (district) {
				return Object.assign({}, district, {X: district.X * scale, Y: district.Y * scale, Radius: district.Radius * scale});
			}),
			Route: route
		};
	},

	/* The heights of a stamp: a ring of hills round a hollow, side by side points from 0 to 1. */
	Stamp: function (side) {
		var heights = [];
		var x;
		var z;
		var d;

		for (z = 0; z < side; z++) {
			for (x = 0; x < side; x++) {
				d = Math.sqrt(Math.pow(x / (side - 1) * 2 - 1, 2) + Math.pow(z / (side - 1) * 2 - 1, 2));

				heights.push(Math.round(Math.max(0, Math.cos((d - 0.6) * Math.PI * 1.6)) * (d < 1 ? 1 : 0) * 100) / 100);
			}
		}

		return {Side: side, Heights: heights};
	},

	/* The galleries: rows of every model, every class of building, every type of road, every effect, lights, a mirror and a glass. */
	Galleries: function (at, add) {
		var models = this.$Service('SceneModels');
		var buildings = this.$Service('SceneBuildingGenerator');
		var roads = this.$Service('SceneRoads');
		var x;
		var z;

		/* Every model, a row of them, each its own size. */
		x = -1060;

		models.Names().forEach(function (name) {
			var info = models.Info(name) || {};
			var size = Math.min(40, Number(info.Size) || 2);

			add({ID: 'model-' + name, Kind: 'thing', Name: name, Model: name, Size: size, X: at(x, 0)[0], Y: at(0, 860)[1]});

			x += Math.max(6, size * 1.4);

			if (x > -320)
				x = -1060;
		});

		/* Every class of building, defined as a model of its own. */
		x = -1060;

		buildings.Classes().forEach(function (name) {
			var model = 'showcase-' + name;
			var made = buildings.Define(model, {Class: name, Seed: 'showcase'});

			add({ID: 'building-' + name, Kind: 'house', Name: name, Model: model, Size: made.Height, X: at(x + made.Width / 2, 0)[0], Y: at(0, 990)[1]});

			x += Math.max(made.Width, made.Depth) + 14;
		});

		/* Every type of road: a short straight of each, side by side, as far apart as they are wide (no junction between them). */
		x = -1060;
		z = 1100;

		roads.Types().forEach(function (name) {
			var width = roads.Road({Type: name, Points: [[0, 0], [0, 10]]}).Width || 10;

			if (x + width > -320) {
				x = -1060;
				z += 140;
			}

			x += width / 2;

			add({ID: 'road-' + name, Kind: 'road', Name: name, Type: name, Points: [at(x, z), at(x, z + 80)]});

			x += width / 2 + 30;
		});

		/* Every effect that stands by itself, with a light between each two. */
		x = -1060;

		this.Effects.forEach(function (type, index) {
			add({ID: 'effect-' + type, Kind: 'effect', Name: type, Type: type, X: at(x, 0)[0], Y: at(0, 1400)[1]});

			if (index % 2)
				add({ID: 'light-' + type, Kind: 'light', X: at(x - 15, 0)[0], Y: at(0, 1420)[1], Color: index % 4 === 1 ? '#ffd39a' : '#9ad0ff', Radius: 18});

			x += 30;
		});

		add({ID: 'mirror', Kind: 'mirror', Name: 'Mirror', X: at(-420, 0)[0], Y: at(0, 1450)[1], Width: 8, Height: 5, Lift: 2.6, Yaw: 200});
		add({ID: 'glass', Kind: 'glass', Name: 'Glass', X: at(-360, 0)[0], Y: at(0, 1450)[1], Width: 6, Height: 4, Lift: 2, Yaw: 160, Frost: 0.2});
	},

	/* A car of the models of SceneModels on the race track. */
	Car: function (at, add) {
		var models = this.$Service('SceneModels');
		var cars = models.Names({Type: 'vehicle'});
		var name = cars.indexOf('car') !== -1 ? 'car' : cars[0];
		if (!name) return;

		add({ID: 'car', Kind: 'unit', Name: 'Car', Model: name, Size: Number((models.Info(name) || {}).Size) || 4.5, X: at(1250, 0)[0], Y: at(0, 1000)[1], Vehicle: {Kind: 'car', Heading: 0}});
	}
});
