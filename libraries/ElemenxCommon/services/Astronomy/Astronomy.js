/*
 * The numbers of a star system, as a game needs them: where a body is on its orbit at a time (the laws of Kepler),
 * what a star and a planet are made of and how warm they are, and whole systems made of a seed. Nothing is drawn here.
 *
 * Units: distances in astronomical units (AU), times in days, the masses of stars in the masses of the Sun, the ones
 * of planets and moons in the masses of the Earth, the radii of stars in the radii of the Sun, of planets in km, angles
 * in degrees. Space is the one of the ecliptic: X and Y in its plane, Z to its north.
 * - Length(value): a length in AU, of a number (in AU) or a text with its unit: '384400 km', '2.5 Mkm', '5.2 AU',
 *   '4.2 ly', '1.3 pc'.
 * - Period(distance, mass): the days of an orbit round a mass (in masses of the Sun).
 * - Position(orbit, time, mass): where a body is ([x, y, z] in AU from what it goes round) at a time (days). An orbit is
 *   {Distance (the half of its long axis), Eccentricity (0 a circle, below 1), Inclination, Node (the longitude of the
 *   ascending node), Periapsis (the argument of the periapsis), Anomaly (the mean anomaly at the time 0), Period (days:
 *   of the mass by default)}.
 * - Path(orbit, count): count points of the whole orbit (the ellipse to draw).
 * - Star(star): a star {Mass, Radius, Luminosity, Temperature, Type} completed by what is missing (as a star of the main
 *   sequence), with its Class (O, B, A, F, G, K, M), Color, Habitable ({Inner, Outer}: the zone of liquid water, AU) and
 *   Frost (the line beyond which ice stays). Type (Types): main (by default), giant and supergiant (their class with III
 *   and I: K3III), white-dwarf (DA, its radius of its mass when not told), neutron, pulsar and magnetar (NS, PSR, MAG,
 *   ten kilometres across), brown-dwarf (L, T, Y as it is warm, a tenth of the Sun across).
 * - Describe(body, context): what a planet or a moon {Kind, Radius, Mass, Albedo, Day, Orbit} is: Radius, Mass,
 *   Gravity (m/s²), Escape (km/s), Density (g/cm³), Temperature (K, of the light of the star), Period (days), Day
 *   (hours), Habitable; context {Star (of Star), Distance (from it, AU), Mass (of what it goes round, Suns)}.
 * - Color(temperature): the color of a star of a temperature (K), as '#rrggbb'.
 * - Kinds: the kinds of planets and their colors (rocky, desert, terran, ocean, ice, lava, gas, ice-giant, dwarf,
 *   moon).
 * - Generate(seed, options): a whole system of a seed, always the same for the same seed: {Name, Seed, Bodies: [{ID,
 *   Type (star, planet, belt), Parent, Name, Kind, ...}]}, the planets with their moons, rings and belts. Options:
 *   Name, Planets (how many, 3 to 9 by default), Moons (false: none), Belts (false: none), Mass (of its star, in masses
 *   of the Sun: made of the seed by default), Type (of its star: Types, main by default; its star has it as Kind).
 * - Blackbody(temperature): the colour of a body as hot (kelvins, 1000 to 40000), [r, g, b] of about 0 to 255, not
 *   clamped: of a star, of a lamp.
 * - Kinds: the kinds of planets of resources/astronomy/kinds.json, and those an application adds.
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('Astronomy', {
	$Meta: {
		Description: 'The numbers of a star system: Kepler orbits, stars and planets, their warmth, and whole systems of a seed.',
		Methods: ['Length(value)', 'Period(distance, mass)', 'Position(orbit, time, mass)', 'Path(orbit, count)', 'Star(star)', 'Describe(body, context)', 'Color(temperature)', 'Generate(seed, options)', 'Blackbody(temperature)']
	},

	Units: {km: 1 / 149597870.7, mkm: 1e6 / 149597870.7, au: 1, ly: 63241.077, pc: 206264.806},
	EarthRadius: 6371,
	EarthMass: 1 / 332946,
	SunRadius: 695700,

	/* Of resources/astronomy/kinds.json ($OnCreate), and what an application sets. */
	Kinds: {},

	$OnCreate: function () {
		this.Kinds = Object.assign(Elemenx.Resources('Data', 'ElemenxCommon/astronomy/kinds') || {}, this.Kinds);
	},

	Length: function (value) {
		var match;
		var unit;

		if (typeof value === 'number') return value;
		if (value === null || value === undefined || value === '') return 0;

		match = /^\s*([-+]?[\d.]+(?:e[-+]?\d+)?)\s*([a-z]*)\s*$/i.exec(String(value));

		if (!match)
			return Number(value) || 0;

		unit = (match[2] || 'au').toLowerCase();

		return Number(match[1]) * (this.Units[unit] || 1);
	},

	Period: function (distance, mass) {
		var a = Math.abs(this.Length(distance));

		return 365.25 * Math.sqrt(a * a * a / Math.max(1e-12, mass === undefined ? 1 : mass));
	},

	/* The eccentric anomaly of a mean one (radians): the equation of Kepler, M = E - e sin E, by Newton. */
	Eccentric: function (mean, e) {
		var E = e < 0.8 ? mean : Math.PI;
		var step = 0;
		var delta;

		while (step < 30) {
			delta = (E - e * Math.sin(E) - mean) / (1 - e * Math.cos(E));
			E -= delta;

			if (Math.abs(delta) < 1e-12) break;

			step++;
		}

		return E;
	},

	/* An orbit turned from its own plane to the one of the ecliptic: x along the periapsis, y ahead of it. */
	Turn: function (orbit, x, y) {
		var rad = Math.PI / 180;
		var i = (Number(orbit.Inclination) || 0) * rad;
		var node = (Number(orbit.Node) || 0) * rad;
		var w = (Number(orbit.Periapsis) || 0) * rad;
		var cn = Math.cos(node);
		var sn = Math.sin(node);
		var cw = Math.cos(w);
		var sw = Math.sin(w);
		var ci = Math.cos(i);
		var si = Math.sin(i);

		return [
			(cn * cw - sn * sw * ci) * x + (-cn * sw - sn * cw * ci) * y,
			(sn * cw + cn * sw * ci) * x + (-sn * sw + cn * cw * ci) * y,
			sw * si * x + cw * si * y
		];
	},

	Position: function (orbit, time, mass) {
		var a = this.Length(orbit && orbit.Distance);
		var e = Math.min(0.99, Math.max(0, Number(orbit && orbit.Eccentricity) || 0));
		var period = Number(orbit && orbit.Period) || this.Period(a, mass);
		var mean;
		var E;

		if (!a)
			return [0, 0, 0];

		mean = ((Number(orbit.Anomaly) || 0) * Math.PI / 180 + Math.PI * 2 * (Number(time) || 0) / period) % (Math.PI * 2);
		E = this.Eccentric(mean, e);

		return this.Turn(orbit, a * (Math.cos(E) - e), a * Math.sqrt(1 - e * e) * Math.sin(E));
	},

	Path: function (orbit, count) {
		var a = this.Length(orbit && orbit.Distance);
		var e = Math.min(0.99, Math.max(0, Number(orbit && orbit.Eccentricity) || 0));
		var total = Math.max(8, count || 128);
		var points = [];
		var i;
		var E;

		for (i = 0; i < total; i++) {
			E = i / total * Math.PI * 2;

			points.push(this.Turn(orbit, a * (Math.cos(E) - e), a * Math.sqrt(1 - e * e) * Math.sin(E)));
		}

		return points;
	},

	/* The kinds of stars: of the main sequence, swollen old ones, and what is left when a star ends. */
	Types: ['main', 'giant', 'supergiant', 'white-dwarf', 'neutron', 'pulsar', 'magnetar', 'brown-dwarf'],

	Star: function (star) {
		var given = star || {};
		var type = this.Types.indexOf(given.Type) !== -1 ? given.Type : 'main';
		var mass = Number(given.Mass) || 1;
		var compact = type === 'neutron' || type === 'pulsar' || type === 'magnetar';
		var radius = Number(given.Radius) || (type === 'white-dwarf' ? 0.0126 * Math.pow(mass, -1 / 3) : compact ? 1.4e-5 : type === 'brown-dwarf' ? 0.1 : type === 'giant' ? 20 * Math.sqrt(mass) : type === 'supergiant' ? 400 * Math.sqrt(mass / 15) : mass < 1 ? Math.pow(mass, 0.8) : Math.pow(mass, 0.57));
		var luminosity = Number(given.Luminosity);
		/* A star not of the main sequence: as warm as its kind is when not told (its light of its size and warmth). */
		var temperature = Number(given.Temperature) || (luminosity || type === 'main' ? 0 : {giant: 4500, supergiant: 3800, 'white-dwarf': 15000, neutron: 1e6, pulsar: 1e6, magnetar: 1e6, 'brown-dwarf': 1300}[type]);
		var classes = [[30000, 'O'], [10000, 'B'], [7500, 'A'], [6000, 'F'], [5200, 'G'], [3700, 'K'], [0, 'M']];
		var kind;

		if (!luminosity && temperature) luminosity = radius * radius * Math.pow(temperature / 5772, 4);
		else if (!luminosity && mass < 0.43) luminosity = 0.23 * Math.pow(mass, 2.3);
		else if (!luminosity && mass < 2) luminosity = Math.pow(mass, 4);
		else if (!luminosity) luminosity = 1.4 * Math.pow(mass, 3.5);

		if (!temperature)
			temperature = 5772 * Math.pow(luminosity / (radius * radius), 0.25);

		kind = classes.filter(function (each) {
			return temperature >= each[0];
		})[0][1];

		if (type === 'giant' || type === 'supergiant') kind += type === 'giant' ? 'III' : 'I';
		else if (type === 'white-dwarf') kind = 'DA';
		else if (compact) kind = {neutron: 'NS', pulsar: 'PSR', magnetar: 'MAG'}[type];
		else if (type === 'brown-dwarf') kind = temperature >= 1300 ? 'L' : temperature >= 550 ? 'T' : 'Y';

		return {
			Type: type,
			Mass: mass,
			Radius: radius,
			Luminosity: luminosity,
			Temperature: temperature,
			Class: given.Class || kind,
			Color: given.Color || this.Color(temperature),
			Habitable: {Inner: Math.sqrt(luminosity / 1.1), Outer: Math.sqrt(luminosity / 0.53)},
			Frost: 2.7 * Math.sqrt(luminosity)
		};
	},

	Describe: function (body, context) {
		var given = body || {};
		var place = context || {};
		var kind = this.Kinds[given.Kind] || this.Kinds.rocky;
		var radius = Number(given.Radius) || (kind.Radius[0] + kind.Radius[1]) / 2;
		var relative = radius / this.EarthRadius;
		var mass = Number(given.Mass) || kind.Density / 5.514 * relative * relative * relative;
		var albedo = given.Albedo === undefined || given.Albedo === null || given.Albedo === '' ? kind.Albedo : Number(given.Albedo);
		var star = place.Star || this.Star({});
		var distance = place.Distance === undefined ? this.Length(given.Orbit && given.Orbit.Distance) : place.Distance;
		var orbit = given.Orbit || {};
		var temperature = distance ? 278.6 * Math.pow(Math.max(0, 1 - albedo), 0.25) * Math.pow(star.Luminosity, 0.25) / Math.sqrt(distance) : 0;

		return {
			Kind: given.Kind || 'rocky',
			Radius: radius,
			Mass: mass,
			Gravity: 9.807 * mass / (relative * relative),
			Escape: 11.186 * Math.sqrt(mass / relative),
			Density: 5.514 * mass / (relative * relative * relative),
			Temperature: temperature,
			Albedo: albedo,
			Period: orbit.Distance ? Number(orbit.Period) || this.Period(orbit.Distance, place.Mass === undefined ? star.Mass : place.Mass) : 0,
			Day: Number(given.Day) || 24,
			Habitable: distance >= star.Habitable.Inner && distance <= star.Habitable.Outer
		};
	},

	/* The color of a black body of a temperature, near enough for a star (after the curves of Tanner Helland). */
	/*
	 * The colour of a body as hot as temperature (kelvin, 1000 to 40000; the Sun 5772 of none): [r, g, b], 0 to 255 not
	 * rounded (a fit of Tanner Helland). Color gives it as #rrggbb, the white balance of a camera as light.
	 */
	Blackbody: function (temperature) {
		var t = Math.max(1000, Math.min(40000, Number(temperature) || 5772)) / 100;
		if (t <= 66)
			return [255, 99.4708025861 * Math.log(t) - 161.1195681661, t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307];

		return [329.698727446 * Math.pow(t - 60, -0.1332047592), 288.1221695283 * Math.pow(t - 60, -0.0755148492), 255];
	},

	Color: function (temperature) {
		var made = this.Blackbody(temperature);

		function hex (value) {
			var clamped = Math.max(0, Math.min(255, Math.round(value)));

			return (clamped < 16 ? '0' : '') + clamped.toString(16);
		}

		return '#' + hex(made[0]) + hex(made[1]) + hex(made[2]);
	},

	/* Numbers of a seed (Mulberry32): the same system for the same seed. */
	Random: function (seed) {
		var text = String(seed === undefined || seed === null ? '' : seed);
		var state = 1779033703 ^ text.length;
		var i;

		for (i = 0; i < text.length; i++) {
			state = Math.imul(state ^ text.charCodeAt(i), 3432918353);
			state = (state << 13) | (state >>> 19);
		}

		function next () {
			var t;

			state = state + 0x6D2B79F5 | 0;
			t = Math.imul(state ^ (state >>> 15), 1 | state);
			t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;

			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		}

		return {
			Next: next,

			Float: function (min, max) {
				return min + (max - min) * next();
			},

			Int: function (min, max) {
				return min + Math.floor(next() * (max - min + 1));
			},

			Chance: function (probability) {
				return next() < probability;
			},

			Pick: function (list) {
				return list[Math.floor(next() * list.length)];
			}
		};
	},

	Name: function (random) {
		var starts = ['Ka', 'Ve', 'Or', 'Tal', 'Ny', 'Sel', 'Ar', 'Zo', 'Mi', 'Eth', 'Ri', 'Qua', 'Lo', 'Den', 'Ish'];
		var middles = ['ra', 'lo', 'mi', 'the', 'va', 'ru', 'ne', 'xi', 'do', 'sa'];
		var ends = ['n', 's', 'ra', 'on', 'is', 'ar', 'eth', 'ux', 'a', 'or'];

		return random.Pick(starts) + (random.Chance(0.5) ? random.Pick(middles) : '') + random.Pick(ends);
	},

	Roman: function (number) {
		var numerals = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
		var text = '';
		var value = number;

		numerals.forEach(function (each) {
			while (value >= each[0]) {
				text += each[1];

				value -= each[0];
			}
		});

		return text;
	},

	Generate: function (seed, options) {
		var self = this;
		var settings = options || {};
		var random = this.Random(seed === undefined || seed === null ? '' : seed);
		var name = settings.Name || this.Name(random);
		var picked = random.Pick([0.35, 0.6, 0.8, 0.95, 1, 1.05, 1.2, 1.5, 2]) * random.Float(0.92, 1.08);
		/* The mass of its star told (a star of a galaxy, GalaxyData): the rest of it made of the seed as ever. */
		var mass = Number(settings.Mass) > 0 ? Number(settings.Mass) : picked;
		/* Its kind told too (a white dwarf, a pulsar of a galaxy): its light and its zones of that kind. */
		var star = this.Star({Mass: mass, Type: settings.Type});
		var bodies = [];
		var count = settings.Planets || random.Int(3, 9);
		var distance = random.Float(0.22, 0.45) * Math.sqrt(star.Luminosity);
		var letters = 'bcdefghijk';
		var planets = [];
		var i;
		var belt;
		var type;
		var range;
		var planet;

		bodies.push({ID: 'star', Type: 'star', Kind: star.Type, Parent: '', Name: name, Mass: Math.round(mass * 1000) / 1000, Radius: star.Radius >= 0.01 ? Math.round(star.Radius * 1000) / 1000 : Number(star.Radius.toPrecision(3)), Temperature: Math.round(star.Temperature)});

		/* What a planet is, of how far it is from its star: hot and rocky near, gas beyond the frost, ice and dwarfs far. */
		function kind (at) {
			if (at < star.Habitable.Inner * 0.45)
				return random.Chance(0.5) ? 'lava' : 'rocky';

			if (at < star.Habitable.Inner)
				return random.Pick(['rocky', 'desert', 'desert', 'lava']);

			if (at <= star.Habitable.Outer)
				return random.Pick(['terran', 'terran', 'ocean', 'desert']);

			if (at < star.Frost)
				return random.Pick(['rocky', 'desert', 'ice']);

			if (at < star.Frost * 3.5)
				return random.Chance(0.75) ? 'gas' : 'ice-giant';

			return random.Pick(['ice-giant', 'ice-giant', 'ice', 'dwarf']);
		}

		function orbit (at, eccentricity, inclination) {
			return {
				Distance: Math.round(at * 100000) / 100000,
				Eccentricity: Math.round(random.Float(0, eccentricity) * 1000) / 1000,
				Inclination: Math.round(random.Float(0, inclination) * 100) / 100,
				Node: Math.round(random.Float(0, 360)),
				Periapsis: Math.round(random.Float(0, 360)),
				Anomaly: Math.round(random.Float(0, 360))
			};
		}

		for (i = 0; i < Math.min(count, letters.length); i++) {
			type = kind(distance);
			range = this.Kinds[type].Radius;
			planet = {
				ID: 'planet-' + letters.charAt(i),
				Type: 'planet',
				Parent: 'star',
				Name: name + ' ' + letters.charAt(i),
				Kind: type,
				Radius: Math.round(random.Float(range[0], range[1])),
				Day: Math.round(type === 'gas' || type === 'ice-giant' ? random.Float(9, 18) : random.Float(10, 60) * 10) / 10,
				Tilt: Math.round(random.Chance(0.1) ? random.Float(60, 98) : random.Float(0, 30)),
				Orbit: orbit(distance, type === 'dwarf' ? 0.25 : 0.1, type === 'dwarf' ? 15 : 4)
			};

			planets.push(planet);
			bodies.push(planet);

			distance *= random.Float(1.45, 2.05);
		}

		/* A belt of asteroids in the widest gap before the first giant, as the one between Mars and Jupiter. */
		if (settings.Belts !== false) {
			planets.forEach(function (planet, index) {
				var before = planets[index - 1];
				if (belt || !before || (planet.Kind !== 'gas' && planet.Kind !== 'ice-giant') || before.Kind === 'gas' || before.Kind === 'ice-giant') return;

				belt = {ID: 'belt', Type: 'belt', Parent: 'star', Name: name + ' belt', Kind: 'asteroids', Inner: Math.round(before.Orbit.Distance * 1.25 * 1000) / 1000, Outer: Math.round(planet.Orbit.Distance * 0.75 * 1000) / 1000, Count: 260};
			});

			if (belt && belt.Outer > belt.Inner)
				bodies.push(belt);
		}

		/* The moons of each planet, and the rings of some giants. */
		planets.forEach(function (planet) {
			var giant = planet.Kind === 'gas' || planet.Kind === 'ice-giant';
			var moons = settings.Moons === false ? 0 : giant ? random.Int(1, 4) : planet.Kind === 'dwarf' || planet.Orbit.Distance < star.Habitable.Inner * 0.45 ? 0 : random.Int(0, 2);
			var radii = giant ? 4 : 18;
			var at;

			for (at = 1; at <= moons; at++) {
				radii *= random.Float(1.5, 2.3);

				bodies.push({
					ID: planet.ID + '-' + at,
					Type: 'planet',
					Parent: planet.ID,
					Name: planet.Name + ' ' + self.Roman(at),
					Kind: giant && at === 1 && random.Chance(0.4) ? 'lava' : random.Pick(['moon', 'moon', 'ice', 'rocky']),
					Radius: Math.round(random.Float(250, giant ? 2600 : 1800)),
					Day: 0,
					Orbit: orbit(radii * planet.Radius * self.Units.km, 0.03, 5)
				});
			}

			if (giant && random.Chance(planet.Kind === 'gas' ? 0.45 : 0.3))
				bodies.push({ID: planet.ID + '-rings', Type: 'belt', Parent: planet.ID, Name: planet.Name + ' rings', Kind: 'ring', Inner: Math.round(random.Float(1.2, 1.5) * 100) / 100, Outer: Math.round(random.Float(1.9, 2.6) * 100) / 100});
		});

		return {Name: name, Seed: seed, Bodies: bodies};
	}
});
