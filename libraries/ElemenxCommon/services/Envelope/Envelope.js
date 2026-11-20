/*
 * Envelope: what lies over and under the surface of a body, as one model for all of them: its air (gas, cloud decks,
 * haze), its seas and the oceans under ice, the hot fluid of a giant, its solid core. A body of no air has an envelope of
 * none (the Moon, Mercury); a rocky planet one of air over its ground; a giant one of thousands of kilometres of gas over a
 * small core. Of one source in the kernel language of Elemenx.Compilers (Kernel), the same in the page, in a worker, in
 * wasm and in a shader.
 *
 * Its zones, from the top down, each from its Top (km over the Radius of the body; under it negative, or Deep: a part of
 * the radius under it) to the Top of the next: {Name, Phase (gas, cloud, haze, liquid, supercritical, solid), Lapse (K a
 * km it grows warmer going down; under 0 colder), Opacity (how much of the light of its sun it takes a km, as it reaches
 * the ground: of the light spread too, not only the beam), Density (kg/m3: of a liquid, supercritical or solid zone),
 * Color}. Its Pressure (bar) and Temperature (K) at the level of its Radius (height 0), its MolarMass (kg/mol) and Core
 * (the solid under it, a part of the radius; none: the ground of the body) tell the rest: the temperature of each zone
 * goes on from the one over it; a gas is ideal (P = P(top) (T/T(top))^(M g / R L), or exponential where L is 0), a liquid
 * or a fluid weighs as its density does (P = P(top) + rho g d); g of the Mass and Radius of the body, the same all the way.
 * - Presets(): the envelopes of the library by their names (resources/astronomy/envelopes: earth, mars, venus, titan,
 *   jupiter, saturn, uranus, neptune, europa, none) and Types: the name of each type of a surface.
 * - Make(spec, body): an envelope made for a body ({Radius: km, Mass: of the Earth}): spec a name of a preset, an
 *   envelope, or {Preset, ...what changes}; {Zones (the numbers its Kernel reads), Names, Phases, Colors, Pressure,
 *   Temperature, Gravity, Floor (km: where the solid begins under it, -Infinity: the ground of the body), Top (km: where
 *   its air ends, the pressure under TopPressure; 0 with no air), Sky (km: as high as its sky lies, where the pressure is
 *   SkyPart of the one at height 0)}.
 * - Its weather of its air: Condensables of the envelope ({Name, Of: water, ammonia, methane or hydrogen sulphide of
 *   the library, or A and B of its saturation, Mix, Thick, Opacity, Color}; or {Name, Base, Top: bar} of a reaction) make
 *   its decks of clouds where they saturate going up (Decks of what Make gives, its zones cut there); Cells (of its winds
 *   over a half of it, of how fast its equator goes: 3 of the Earth), Warm, Contrast and Lapse its climate (Make: of
 *   body.Day too): what Scene gives the climate, the winds and the forecast of a planet.
 * - At(made, height): what is there, {Zone (its name, '' over all of it, 'core' under its floor), Phase ('space' over it,
 *   'solid' in its core), Pressure, Temperature, Density, Light (how much of its sun gets there from straight over it, 0
 *   to 1), Glow (the color of its own heat, [r, g, b] 0 to 1 times how bright: none under some 750 K), Inside, Solid}.
 * - Habitat(made, type): what kind of world its ground is, of its air there (Habitats of the library: the first rule that
 *   holds, of its Kelvin and Pressure at height 0, a Condensable it has, Types of the surface): living (where water may
 *   be liquid and life live: the Earth), scorched (Venus), hydrocarbon (Titan), dust (Mars), frozen (Europa, Pluto), barren
 *   (no air: the Moon, Mercury). What the lands and the plants of a ground are chosen of.
 * - Code(): its Kernel as js (made in the page; a worker makes it of the text it carries, Compiled); IR(): its module of
 *   the IR (the blocks EnvelopeState and EnvelopeLight of Blueprints, generator graphs: their input Zones a list of numbers).
 *   env_state(zones, height): vec4 of Pressure, Temperature, Density, the index of the zone (-1 over it, its count in the
 *   core); env_light(zones, height): vec2 of Light and the phase (-1 over it).
 * - Source(names) gives its members to a worker of the Workers Service.
 */
Elemenx.Service('Envelope', {
	$Meta: {
		Description: 'What lies over and under the surface of a body as one model: its air, cloud decks and haze, seas and oceans under ice, the hot fluid of a giant, its core; pressure, temperature, light and glow at any height.',
		Methods: ['Presets()', 'Make(spec, body)', 'At(made, height)', 'Habitat(made, type)', 'Code()', 'IR()', 'Source(names)']
	},

	Source: function (names) {
		return this.$Service('Workers').Source(this, names);
	},

	/* The phases by their numbers in its Kernel. */
	Phases: ['gas', 'cloud', 'haze', 'liquid', 'supercritical', 'solid'],

	/* Its air ends where the pressure is this (bar), and its sky where it is this part of the one at height 0: 120 and 100 km of the Earth. */
	TopPressure: 1.748e-8,
	SkyPart: 3.617e-7,

	/* Numbers a zone: Top, its temperature there, Lapse, its pressure there, MolarMass, g, phase, Density, Opacity, the light lost over it. */
	Stride: 10,

	Kernel: [
		'/* The zone of a height: its index (zones from the top down after two numbers: their count and the floor), -1 over all, the count under the floor. */',
		'int env_zone(float[] z, float h) {',
		'	int count = int(z[0]);',
		'	if (count < 1 || h > z[2]) return -1;',
		'	if (h < z[1]) return count;',
		'	int found = 0;',
		'	for (int k = 1; k < count; k++) {',
		'		if (z[2 + k * 10] > h) found = k;',
		'	}',
		'	return found;',
		'}',
		'/* Pressure (bar), temperature (K) and density (kg/m3) at a height of a zone: a gas ideal, a liquid as heavy as its density. */',
		'vec3 env_in(float[] z, int k, float h) {',
		'	int i = 2 + k * 10;',
		'	float d = z[i] - h;',
		'	float top = z[i + 1];',
		'	float lapse = z[i + 2];',
		'	float pressure = z[i + 3];',
		'	float molar = z[i + 4];',
		'	float g = z[i + 5];',
		'	float t = max(1.0, top + lapse * d);',
		'	if (z[i + 6] >= 2.5) return vec3(pressure + z[i + 7] * g * d * 1000.0 / 100000.0, t, z[i + 7]);',
		'	float p = abs(lapse) > 0.000001 ? pressure * pow(t / max(top, 1.0), molar * g / (8.314462 * lapse / 1000.0)) : pressure * exp(molar * g * d * 1000.0 / (8.314462 * t));',
		'	return vec3(p, t, p * 100000.0 * molar / (8.314462 * t));',
		'}',
		'/* What is at a height: vec4 of pressure, temperature, density and the index of its zone (-1 over it, the count in the core). */',
		'vec4 env_state(float[] z, float h) {',
		'	int k = env_zone(z, h);',
		'	int count = int(z[0]);',
		'	if (k < 0) return vec4(0.0, 0.0, 0.0, -1.0);',
		'	if (k >= count) {',
		'		vec3 under = env_in(z, count - 1, z[1]);',
		'		return vec4(under.x, under.y, 0.0, float(count));',
		'	}',
		'	vec3 made = env_in(z, k, h);',
		'	return vec4(made.x, made.y, made.z, float(k));',
		'}',
		'/* How much of the light of its sun gets to a height from straight over it, and its phase (-1 over it, 5 in the core). */',
		'vec2 env_light(float[] z, float h) {',
		'	int k = env_zone(z, h);',
		'	int count = int(z[0]);',
		'	if (k < 0) return vec2(1.0, -1.0);',
		'	if (k >= count) return vec2(0.0, 5.0);',
		'	int i = 2 + k * 10;',
		'	return vec2(exp(-(z[i + 9] + z[i + 8] * (z[i] - h))), z[i + 6]);',
		'}'
	].join('\n'),

	/* What a worker carries of this Service besides its methods: the js of its Kernel, made in the page (a worker has no compiler). */
	Carried: ['Compiled'],

	$OnCreate: function () {
		this.Code();
		this.Blocks();
	},

	/* The functions of the Kernel as js: made of the text the page made once (Compiled), the same text in a worker. */
	Code: function () {
		var self = this;

		if (this.Made)
			return this.Made;

		if (!this.Compiled && typeof Elemenx !== 'undefined' && Elemenx.Compilers) {
			Elemenx.Compilers.Run({From: 'kernel', To: 'js', Value: this.Kernel, Entry: 'envelope'}, function (error, result) {
				if (error)
					throw error;

				self.Compiled = result.Value;
			});
		}

		this.Made = new Function(this.Compiled)();

		return this.Made;
	},

	/* The Kernel in the IR of Elemenx.Compilers, made once: its functions for the blocks of Blueprints.Numeric. */
	IR: function () {
		var self = this;

		if (!this.IRMade) {
			Elemenx.Compilers.Run({From: 'kernel', To: 'ir', Value: this.Kernel}, function (error, result) {
				if (error)
					throw error;

				self.IRMade = result.Value;
			});
		}

		return this.IRMade;
	},

	Presets: function () {
		return Elemenx.Resources('Data', 'ElemenxCommon/astronomy/envelopes') || {Types: {}, Envelopes: {}};
	},

	/*
	 * What kind of world the ground of a body is, of its air at height 0 (Habitats of the library, the first rule that holds:
	 * Kelvin and Pressure ranges [from, to], null no end; Condensable: one it has, by name; Types: of its surface). type: the
	 * Type of its surface.
	 */
	Habitat: function (made, type) {
		var rules = this.Presets().Habitats || [];
		var kelvin = made.Names.length ? made.Temperature : 0;
		var pressure = made.Names.length ? made.Pressure : 0;
		var i;

		function within (range, value) {
			return !range || (range[0] === null || value >= range[0]) && (range[1] === null || value <= range[1]);
		}

		for (i = 0; i < rules.length; i++) {
			var rule = rules[i];
			var has = !rule.Condensable || (made.Condensables || []).some(function (name) {
				return name.indexOf(rule.Condensable) !== -1;
			});
			if (within(rule.Kelvin, kelvin) && within(rule.Pressure, pressure) && has && (!rule.Types || rule.Types.indexOf(type) !== -1)) return rule.Class;
		}

		return 'living';
	},

	/* An envelope given as a name, an envelope or {Preset, ...what changes}: the envelope itself. */
	Spec: function (spec) {
		var presets = this.Presets();
		var envelopes = presets.Envelopes || {};

		if (typeof spec === 'string')
			return envelopes[spec] || envelopes.none || {Zones: []};

		if (spec && spec.Preset)
			return Object.assign({}, envelopes[spec.Preset] || {}, spec);

		return spec || envelopes.none || {Zones: []};
	},

	Make: function (spec, body) {
		var given = this.Spec(spec);
		var radius = Math.max(1, Number(body && body.Radius) || 6371);
		var mass = Number(body && body.Mass) || Math.pow(radius / 6371, 3);
		var g = 9.80665 * mass / Math.pow(radius / 6371, 2);
		var molar = Number(given.MolarMass) || 0.029;
		var phases = this.Phases;
		var stride = this.Stride;
		var zones = (given.Zones || []).map(function (zone) {
			return {Name: zone.Name || '', Top: zone.Deep !== undefined ? -Number(zone.Deep) * radius : Number(zone.Top) || 0, Lapse: Number(zone.Lapse) || 0, Phase: Math.max(0, phases.indexOf(zone.Phase || 'gas')), Density: Number(zone.Density) || 0, Opacity: Number(zone.Opacity) || 0, Color: zone.Color || '', Molar: Number(zone.MolarMass) || molar};
		}).sort(function (a, b) {
			return b.Top - a.Top;
		});
		var floor = given.Core !== undefined ? -(1 - Number(given.Core)) * radius : given.Floor !== undefined ? Number(given.Floor) : -Infinity;
		var p0 = Number(given.Pressure) || 0;
		var t0 = Number(given.Temperature) || 288;
		var data = [zones.length, floor];
		var made = {Zones: null, Names: [], Phases: [], Colors: [], Condensables: [], Pressure: p0, Temperature: t0, Gravity: g, Floor: floor, Top: 0, Sky: 0, Radius: radius, Decks: [], Lapse: 0};
		var day = Math.abs(Number(body && body.Day) || 0);

		/*
		 * Its weather as its air and its turning make it: Cells, the cells of its winds over a half of it (3 of the Earth: the
		 * jets at 30 and 60 degrees; more as it turns faster and is larger, as a giant's many belts; 1 of a slow one, as
		 * Venus), the cube root of how fast its equator goes; Warm (degrees its mean is over the Earth's, 15 °C), Contrast
		 * (how much its cold and warm places differ to the Earth's: a thick air spreads its heat, a thin one does not).
		 */
		made.Cells = day > 0 ? Math.max(1, Math.min(12, Math.round(3 * Math.pow(2 * Math.PI * radius * 1000 / (day * 3600) / 465.1, 1 / 3)))) : 3;
		made.Warm = p0 > 0 ? t0 - 288.15 : 0;
		made.Contrast = p0 > 0 ? Math.max(0.02, Math.min(2, Math.sqrt(1.01325 / p0))) : 2;

		var at;
		var k;

		/* Pressure and temperature at a height of a zone of its numbers at its top (as env_in). */
		function within (zone, h) {
			var d = zone.Top - h;
			var t = Math.max(1, zone.T + zone.Lapse * d);

			if (zone.Phase >= 3)
				return {P: zone.P + zone.Density * g * d * 1000 / 100000, T: t};

			return {P: Math.abs(zone.Lapse) > 0.000001 ? zone.P * Math.pow(t / Math.max(zone.T, 1), zone.Molar * g / (8.314462 * zone.Lapse / 1000)) : zone.P * Math.exp(zone.Molar * g * d * 1000 / (8.314462 * t)), T: t};
		}

		/* Its numbers at its top of the ones at a height h in it (the way back of within). */
		function from (zone, h, p, t) {
			var d = zone.Top - h;

			zone.T = Math.max(1, t - zone.Lapse * d);

			if (zone.Phase >= 3) zone.P = Math.max(0, p - zone.Density * g * d * 1000 / 100000);
			else zone.P = Math.abs(zone.Lapse) > 0.000001 ? p / Math.pow(t / zone.T, zone.Molar * g / (8.314462 * zone.Lapse / 1000)) : p / Math.exp(zone.Molar * g * d * 1000 / (8.314462 * t));
		}

		if (zones.length) {
			/* The zone of height 0 of its numbers there; the ones over it from it up, the ones under it from it down. */
			at = 0;

			for (k = 1; k < zones.length; k++) {
				if (zones[k].Top > 0)
					at = k;
			}

			from(zones[at], Math.min(0, zones[at].Top), p0, t0);

			for (k = at - 1; k >= 0; k--)
				from(zones[k], zones[k + 1].Top, zones[k + 1].P, zones[k + 1].T);

			for (k = at + 1; k < zones.length; k++) {
				var bottom = within(zones[k - 1], zones[k].Top);

				zones[k].T = bottom.T;
				zones[k].P = bottom.P;
			}

			made.Lapse = zones[at].Lapse;
			/* A condensable of a name (Of) takes its saturation of the library (Condensables: water, ammonia, methane, hydrogen sulphide). */
			made.Condensables = (given.Condensables || []).map(function (one) {
				return one.Of || one.Name || '';
			});
			made.Decks = this.Decks((given.Condensables || []).map(function (one) {
				return Object.assign({}, one.Of ? (this.Presets().Condensables || {})[one.Of] || {} : {}, one);
			}, this), zones, floor, within);
			zones = this.Split(zones, made.Decks, floor, within);
			data[0] = zones.length;

			var light = 0;

			zones.forEach(function (zone, index) {
				zone.Lost = light;
				light += zone.Opacity * Math.max(0, zone.Top - (index + 1 < zones.length ? zones[index + 1].Top : Math.max(floor, zone.Top - 1e6)));

				data.push(zone.Top, zone.T, zone.Lapse, zone.P, zone.Molar, g, zone.Phase, zone.Density, zone.Opacity, zone.Lost);
				made.Names.push(zone.Name);
				made.Phases.push(phases[zone.Phase]);
				made.Colors.push(zone.Color);
			});
		}

		made.Zones = data;
		made.Stride = stride;

		/* Where its air ends and where its sky lies: the heights of those pressures, found by halves in its top gas. */
		if (zones.length && p0 > 0) {
			made.Top = this.HeightOf(made, this.TopPressure);
			made.Sky = this.HeightOf(made, p0 * this.SkyPart);
		}

		return made;
	},

	/*
	 * Its decks of clouds, as its air makes them: a condensable ({Name, A, B: its vapour saturates at ln P = A - B / T (bar,
	 * Clausius-Clapeyron), Critical: K over which it never condenses, Mix: how much of the air it is, Thick: km its deck goes
	 * up, Opacity, Color}) condenses where the air it is in, going up, first holds no more of it (Mix P reaches its saturation,
	 * colder than its Critical). Regression: with no Critical the methane of Neptune "condensed" thousands of km deep, where
	 * the line of its saturation means nothing (a fluid past its critical point). One of a reaction or of droplets
	 * ({Name, Base, Top: bar}) lies between those pressures. [{Name, Base, Top (km), Opacity, Color}], none it never meets.
	 */
	Decks: function (condensables, zones, floor, within) {
		var top = zones.length ? zones[0].Top : 0;
		var bottom = zones.length ? zones[zones.length - 1].Top : 0;
		var low;
		var decks = [];

		/* The thermal zone of a height (as env_zone) and what is there. */
		function at (h) {
			var k = 0;
			var i;

			for (i = 1; i < zones.length; i++) {
				if (zones[i].Top > h)
					k = i;
			}

			return within(zones[k], h);
		}

		/* The gas only: from the lowest of its zones of gas (or its ground, 0) up. */
		low = zones.reduce(function (least, zone, index) {
			var under = index + 1 < zones.length ? zones[index + 1].Top : Math.max(floor, zone.Top - 2000);

			return zone.Phase <= 2 ? Math.min(least, under) : least;
		}, Math.max(0, bottom));
		low = Math.max(low, isFinite(floor) ? floor : low);

		/* The height where the pressure falls to a value, by halves between low and top. */
		function heightOf (pressure) {
			var a = low;
			var b = top;
			var i;

			if (at(a).P <= pressure) return a;

			for (i = 0; i < 60; i++) {
				var m = (a + b) / 2;

				if (at(m).P > pressure) a = m;
				else b = m;
			}

			return (a + b) / 2;
		}

		condensables.forEach(function (one) {
			var base = null;
			var h;
			var state;

			if (one.Base !== undefined) {
				base = heightOf(Number(one.Base));

				decks.push({Name: one.Name || '', Base: base, Top: one.Top !== undefined ? heightOf(Number(one.Top)) : base + (Number(one.Thick) || 10), Opacity: Number(one.Opacity) || 0, Color: one.Color || ''});

				return;
			}

			for (h = low; h <= top; h += 0.25) {
				state = at(h);

				if (state.T < (Number(one.Critical) || Infinity) && (Number(one.Mix) || 0) * state.P >= Math.exp((Number(one.A) || 0) - (Number(one.B) || 0) / Math.max(1, state.T))) {
					base = h;

					break;
				}
			}

			if (base !== null)
				decks.push({Name: one.Name || '', Base: base, Top: Math.min(top, base + (Number(one.Thick) || 10)), Opacity: Number(one.Opacity) || 0, Color: one.Color || ''});
		});

		return decks;
	},

	/*
	 * Its zones cut where its decks begin and end: in a deck its name, its color, its opacity on its own, a cloud of what was
	 * gas or haze; what is in each the same (each its numbers at its top of the zone it was cut of).
	 */
	Split: function (zones, decks, floor, within) {
		var heights = [];
		var made = [];

		if (!decks.length) return zones;

		zones.forEach(function (zone) {
			heights.push(zone.Top);
		});
		decks.forEach(function (deck) {
			heights.push(deck.Base, deck.Top);
		});

		heights = heights.filter(function (h, index, all) {
			return all.indexOf(h) === index && h <= zones[0].Top && h > floor;
		}).sort(function (a, b) {
			return b - a;
		});

		heights.forEach(function (h, index) {
			var k = 0;
			var i;
			var next = index + 1 < heights.length ? heights[index + 1] : -Infinity;
			var deck;
			var state;

			for (i = 1; i < zones.length; i++) {
				if (zones[i].Top >= h)
					k = i;
			}

			state = within(zones[k], h);
			deck = decks.filter(function (one) {
				return one.Base <= next && one.Top >= h;
			})[0];

			made.push(Object.assign({}, zones[k], {Top: h, T: state.T, P: state.P, Name: deck ? deck.Name : zones[k].Name, Color: deck ? deck.Color : zones[k].Color, Opacity: zones[k].Opacity + (deck ? deck.Opacity : 0), Phase: deck && zones[k].Phase <= 2 ? 1 : zones[k].Phase}));
		});

		return made;
	},

	/* The height (km) over 0 where the pressure falls to a value, by halves; 0 when it is under it at 0. */
	HeightOf: function (made, pressure) {
		var code = this.Code();
		var low = 0;
		var high = made.Zones[2];
		var i;

		if (code.env_state(made.Zones, 0)[0] <= pressure) return 0;

		for (i = 0; i < 60; i++) {
			var middle = (low + high) / 2;

			if (code.env_state(made.Zones, middle)[0] > pressure) low = middle;
			else high = middle;
		}

		return (low + high) / 2;
	},

	At: function (made, height) {
		var code = this.Code();
		var state = code.env_state(made.Zones, height);
		var light = code.env_light(made.Zones, height);
		var index = Math.round(state[3]);
		var count = made.Names.length;
		var glow = this.Glow(state[1]);

		return {
			Zone: index < 0 ? '' : index >= count ? 'core' : made.Names[index],
			Phase: index < 0 ? 'space' : index >= count ? 'solid' : made.Phases[index],
			Pressure: state[0],
			Temperature: state[1],
			Density: state[2],
			Light: light[0],
			Glow: glow,
			Inside: index >= 0,
			Solid: index >= count || made.Phases[index] === 'solid'
		};
	},

	/*
	 * The color of the heat of what is so hot, times how bright it is to the eye: nothing under some 750 K (the red that
	 * first shows is about 800 K), dark red, then orange and yellow, white past 5000 K, brighter yet.
	 */
	Glow: function (temperature) {
		var t = Number(temperature) || 0;
		var bright = Math.pow(Math.max(0, Math.min(1, (t - 750) / 1250)), 2) * Math.min(4, Math.max(1, t / 2000));
		var color = this.$Service('Astronomy').Blackbody(Math.max(1000, t));

		return color.map(function (part) {
			return Math.max(0, Math.min(255, part)) / 255 * bright;
		});
	},

	/*
	 * Its blocks of Blueprints (generator graphs; of numbers, the same in js, wasm and a shader): EnvelopeState (Pressure,
	 * Temperature, Density, Zone of its Zones at a Height), EnvelopeLight (Light, Phase).
	 */
	Blocks: function () {
		var self = this;
		var blueprints = this.$Service('Blueprints');

		function block (type, fn, results) {
			blueprints.Node(type, {Graphs: ['generator'], Group: 'envelope', Inputs: [{Key: 'Zones', Type: 'floats'}, {Key: 'Height', Type: 'float', Value: 0}], Outputs: results.map(function (key) {
				return {Key: key, Type: 'float'};
			}),
			Compute: function (given) {
				var made = self.Code()[fn](given.Zones || [0, 0], Number(given.Height) || 0);
				var out = {};

				results.forEach(function (key, index) {
					out[key] = made[index];
				});

				return out;
			},
			Numeric: function (given, props, kit) {
				if (!given.Zones || given.Zones.T !== 'floats') return null;

				kit.Kernel('envelope', self.IR());

				return kit.Parts({E: kit.Call(fn, given.Zones.E, kit.Sized(given.Height, 1).E), T: 'vec' + results.length}, results);
			}});
		}

		block('EnvelopeState', 'env_state', ['Pressure', 'Temperature', 'Density', 'Zone']);
		block('EnvelopeLight', 'env_light', ['Light', 'Phase']);
	}
});
