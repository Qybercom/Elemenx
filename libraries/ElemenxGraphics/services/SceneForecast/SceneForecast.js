/*
 * SceneForecast: the weather of a planet over its body, of one source in the kernel language of Elemenx.Compilers (Kernel,
 * on the value noise of the Kernel of the Noise Service): the same in the page and in a shader. A graph of numbers of
 * Blueprints (blueprints/shader/forecast, the ForecastGraph of a Scene) is made of its blocks, so the shader that bakes the
 * weather of a planet (WEATHER of Scene) and the page that asks what it is over the eye read the very same map.
 * - Its functions: wx_wind (the wind of a direction, radians a day along the ground: the jets of the belts, storms that
 *   turn the air round their eyes, eddies of a noise; and how strong a storm is there), wx_air (where the air was: fronts
 *   and streams of a few hundred km drawn out along the wind, the middle of them, the storm), wx_fronts (the sheets of a
 *   front, how humid the air is: its belts, its land, its climb up a range), wx_heaps (heaps of the heat of the day and the
 *   kind of the clouds), wx_cirrus, wx_rain, wx_shroud (cover, kind, cirrus and rain, a world of a shroud or of none).
 * - Code(): the Kernel as js (made in the page); IR(): its module of the IR, with the noise it calls (for Blueprints.Numeric).
 * - Air(p, days, seed, radiusKm, scale, fine, eddy) and the others: what the functions give, in the page.
 */
Elemenx.Service('SceneForecast', {
	$Meta: {
		Description: 'The weather of a planet of one source in the kernel language: its winds and storms, fronts, heaps, cirrus and rain, the same in the page and in a shader.',
		Methods: ['Code()', 'IR()', 'Air(p, days, seed, radiusKm, scale, fine, eddy, cells)', 'Fronts(fronts, mid, moist, ground, climb, py, storm, cloudiness, cut, cutBy, soft)', 'Heaps(p, sun, warm, moist, ground, climb, streams, mid, humid, storm, sheet, cloudiness, fairLow, fairHigh)', 'Cirrus(streams, py, sheet, low, high)', 'Rain(sheet, humid, storm, heaps, kind, from, to)', 'Shroud(sheet, heaps, kind, cirrus, rain, cloudiness)']
	},

	Kernel: [
		'/* The turn of each octave against the last (no squares along the grid of the noise). */',
		'vec3 wx_askew(vec3 v) {',
		'	return vec3(0.80 * v.x - 0.60 * v.y + 0.0 * v.z, 0.36 * v.x + 0.48 * v.y + 0.80 * v.z, -0.48 * v.x - 0.64 * v.y + 0.60 * v.z);',
		'}',
		'/* The octaves of the value noise of the Noise Service (fbm3 of Renderer). */',
		'float wx_fbm(vec3 p, int octaves) {',
		'	float total = 0.0, amplitude = 0.5, weight = 0.0;',
		'	vec3 q = p;',
		'	for (int i = 0; i < octaves; i++) {',
		'		total += n_value0(q.x, q.y, q.z) * amplitude;',
		'		weight += amplitude;',
		'		q = q * 2.03 + vec3(1.7, 9.2, 3.1);',
		'		amplitude *= 0.5;',
		'	}',
		'	return weight != 0.0 ? total / weight : 0.0;',
		'}',
		'/* Radians of longitude a day the wind of a latitude takes what it carries (8 m/s, east positive): of the cells of its winds (cells; 0: 3, as the Earth: trades to 30 degrees, westerlies to 60, polar easterlies). */',
		'float wx_zonal(float lat, float radiusKm, float cells) {',
		'	float n = cells > 0.5 ? cells : 3.0;',
		'	float w = 90.0 / n;',
		'	float band = abs(lat) * 57.29578;',
		'	float east = -1.0;',
		'	for (int k = 1; k < 12; k++) {',
		'		if (float(k) < n) {',
		'			float odd = float(k) - 2.0 * floor(float(k) / 2.0);',
		'			float value = odd > 0.5 ? 1.3 : (float(k) >= n - 1.0 ? -0.6 : -1.0);',
		'			east = mix(east, value, smoothstep(w * float(k) - 4.0, w * float(k) + 4.0, band));',
		'		}',
		'	}',
		'	return east * 8.0 * 86.4 / radiusKm;',
		'}',
		'/* A number of each cell of the winds a band is in: even, odd, and the last of three or more its own (the polar cell). */',
		'float wx_cell(float band, float cells, float even, float odd, float last) {',
		'	float n = cells > 0.5 ? cells : 3.0;',
		'	float i = floor(band / (90.0 / n));',
		'	if (i >= n - 1.0 && i >= 2.0) return last;',
		'	return i - 2.0 * floor(i / 2.0) > 0.5 ? odd : even;',
		'}',
		'/* The latitude of a direction (radians), its band (degrees) and the wet band of the equator (ITCZ). */',
		'vec3 wx_belts(float py) {',
		'	float lat = asin(clamp(py, -1.0, 1.0));',
		'	return vec3(abs(lat) * 57.29578, exp(-pow((lat * 57.29578 - 5.0) / 8.0, 2.0)), lat);',
		'}',
		'/*',
		' * The wind at a direction (radians a day, along the ground) and how strong a storm is there (w): the jets of its belts,',
		' * ten storms that turn the air round their eyes (counterclockwise in the north), born and gone in a week, eddies of a',
		' * curl of a noise that changes over days (eddy: how much).',
		' */',
		'vec4 wx_wind(vec3 q, float days, float seed, float radiusKm, float eddy, float cells) {',
		'	vec3 east = normalize(vec3(q.z, 0.0, -q.x) + vec3(1e-6, 0.0, 0.0));',
		'	vec3 north = cross(q, east);',
		'	float lat = asin(clamp(q.y, -1.0, 1.0));',
		'	float band = abs(lat) * 57.29578;',
		'	vec3 v = east * wx_zonal(lat, radiusKm, cells) + north * wx_cell(band, cells, -0.12, 0.1, -0.06) * sign(lat) * 8.0 * 86.4 / radiusKm;',
		'	float wide = 90.0 / (cells > 0.5 ? cells : 3.0) / 30.0;',
		'	float storm = 0.0;',
		'	for (int k = 0; k < 10; k++) {',
		'		float fk = float(k);',
		'		float life = days / 7.0 + fract(fk * 0.618);',
		'		float gen = floor(life);',
		'		float age = fract(life);',
		'		float h1 = n_hash(int(fk * 13.0), int(gen), int(seed));',
		'		float h2 = n_hash(int(fk * 13.0 + 5.0), int(gen + 3.0), int(seed));',
		'		float hemi = fk - floor(fk / 2.0) * 2.0 < 0.5 ? 1.0 : -1.0;',
		'		bool tropical = k >= 8;',
		'		float lat0 = hemi * (min(85.0, (tropical ? mix(12.0, 22.0, h1) : mix(38.0, 64.0, h1)) * wide) * 0.017453292519943295);',
		'		float lon0 = h2 * 6.28318 + wx_zonal(lat0, radiusKm, cells) * age * 7.0 * (tropical ? 0.5 : 1.0);',
		'		vec3 c = vec3(cos(lat0) * cos(lon0), sin(lat0), cos(lat0) * sin(lon0));',
		'		float d = acos(clamp(dot(q, c), -1.0, 1.0));',
		'		float r = (tropical ? mix(3.0, 6.0, h1) : mix(7.0, 13.0, h1)) * 0.017453292519943295;',
		'		float strength = sin(3.14159 * age) * (tropical ? step(0.5, h2) : 1.0);',
		'		float f = exp(-d * d / (r * r));',
		'		v = v + cross(c, q) * hemi * strength * 5.0 * f / max(r, 0.02) * 0.1;',
		'		storm = max(storm, strength * f);',
		'	}',
		'	vec3 at = q * 7.0 + vec3(seed, days * 0.15, 0.0);',
		'	float e = 0.02;',
		'	vec3 grad = vec3(n_value0(at.x + e, at.y, at.z) - n_value0(at.x - e, at.y, at.z), n_value0(at.x, at.y + e, at.z) - n_value0(at.x, at.y - e, at.z), n_value0(at.x, at.y, at.z + e) - n_value0(at.x, at.y, at.z - e)) / (2.0 * e);',
		'	v = v + cross(q, grad - q * dot(grad, q)) * eddy;',
		'	return vec4(v.x, v.y, v.z, storm);',
		'}',
		'/*',
		' * A noise taken along the way the air came (six steps back of a third of a day each), the mean of it: fronts (x, of',
		' * scale) and streams of a few hundred km (y, of fine), bands bent round a storm, its arms spiralling in.',
		' */',
		'vec2 wx_streamed(vec3 p, float scale, float fine, float salt, float days, float seed, float radiusKm, float eddy, float cells) {',
		'	vec3 x = p;',
		'	vec2 sum = vec2(0.0, 0.0);',
		'	float weight = 0.0;',
		'	for (int i = 0; i < 6; i++) {',
		'		float w = 1.0 - float(i) / 6.0;',
		'		sum = sum + vec2(wx_fbm(wx_askew(x) * scale + vec3(salt, salt * 0.7, seed), 4), wx_fbm(wx_askew(wx_askew(x)) * fine + vec3(salt * 1.3, 2.0, seed), 3)) * w;',
		'		weight += w;',
		'		vec4 wind = wx_wind(x, days, seed, radiusKm, eddy, cells);',
		'		x = normalize(x - vec3(wind.x, wind.y, wind.z) * 0.33);',
		'	}',
		'	return sum / weight;',
		'}',
		'/*',
		' * Where the air is now, of where it was (new every three days, crossed, so nothing smears): fronts, streams, the middle',
		' * of them (0 to 1, their spread made as wide again: the mean of six flattens a noise), and the storm there.',
		' */',
		'vec4 wx_air(vec3 p, float days, float seed, float radiusKm, float scale, float fine, float eddy, float cells) {',
		'	vec4 wind = wx_wind(p, days, seed, radiusKm, eddy, cells);',
		'	vec3 flow = vec3(wind.x, wind.y, wind.z);',
		'	float phase = days / 3.0;',
		'	float pa = fract(phase);',
		'	float pb = fract(phase + 0.5);',
		'	vec3 qa = normalize(p - flow * pa * 3.0);',
		'	vec3 qb = normalize(p - flow * pb * 3.0);',
		'	float wa = 1.0 - abs(2.0 * pa - 1.0);',
		'	vec2 sa = wx_streamed(qa, scale, fine, floor(phase) * 7.31, days, seed, radiusKm, eddy, cells);',
		'	vec2 sb = wx_streamed(qb, scale, fine, floor(phase + 0.5) * 7.31 + 50.0, days, seed, radiusKm, eddy, cells);',
		'	float keep = sqrt(wa * wa + (1.0 - wa) * (1.0 - wa));',
		'	float bx = clamp((sa.x * wa + sb.x * (1.0 - wa) - 0.5) / keep * 1.0 + 0.5, 0.0, 1.0);',
		'	float by = clamp((sa.y * wa + sb.y * (1.0 - wa) - 0.5) / keep * 1.8 + 0.5, 0.0, 1.0);',
		'	float m1 = floor(phase) * 3.1;',
		'	float m2 = floor(phase + 0.5) * 3.1;',
		'	float mid = clamp((wx_fbm(qa * 9.0 + vec3(m1, m1, m1), 3) * wa + wx_fbm(qb * 9.0 + vec3(m2, m2, m2) + vec3(20.0, 20.0, 20.0), 3) * (1.0 - wa) - 0.5) / keep + 0.5, 0.0, 1.0);',
		'	return vec4(bx * 0.55 + by * 0.45, by, mid, wind.w);',
		'}',
		'/* The sheets of a front where the air is humid enough (its cut: cut less humid by cutBy, soft), and how humid it is. */',
		'vec2 wx_fronts(float fronts, float mid, float moist, float ground, float climb, float py, float storm, float cloudiness, float cut, float cutBy, float soft) {',
		'	vec3 belts = wx_belts(py);',
		'	float land = smoothstep(0.03, 0.3, ground);',
		'	float dry = smoothstep(14.0, 22.0, belts.x) * (1.0 - smoothstep(30.0, 38.0, belts.x));',
		'	float tracks = smoothstep(35.0, 45.0, belts.x) * (1.0 - smoothstep(60.0, 70.0, belts.x));',
		'	float humid = moist * 0.7 + (1.0 - land) * 0.1 + climb * 0.45 + belts.y * 0.12 + tracks * 0.15 + storm * 0.7 - dry * 0.18 + (cloudiness - 0.5) * 0.8;',
		'	float level = clamp(cut - humid * cutBy, 0.35, 0.95);',
		'	return vec2(smoothstep(level - soft, level + soft, fronts * 0.75 + mid * 0.25), humid);',
		'}',
		'/* Heaps of the heat of the day over warm wet land, in clusters cut by the streams, fair weather ones by day (fairLow over the sea, fairHigh over land); the kind of the clouds. */',
		'vec2 wx_heaps(vec3 p, vec3 sun, float warm, float moist, float ground, float climb, float streams, float mid, float humid, float storm, float sheet, float cloudiness, float fairLow, float fairHigh) {',
		'	vec3 belts = wx_belts(p.y);',
		'	float land = smoothstep(0.03, 0.3, ground);',
		'	float heat = smoothstep(-0.1, 0.55, dot(p, sun));',
		'	float convect = clamp((warm - 0.42) * 2.4, 0.0, 1.0) * mix(0.35 + 0.25 * heat, heat, land) * smoothstep(0.2, 0.55, moist + climb * 0.3);',
		'	float heaps = convect * smoothstep(0.5, 0.75, streams * 0.7 + mid * 0.3 + humid * 0.15);',
		'	float fair = heat * smoothstep(0.05, 0.3, moist) * mix(fairLow, fairHigh, land) * smoothstep(0.2, 0.4, warm) * clamp(cloudiness * 2.0, 0.0, 1.0);',
		'	heaps = max(heaps, fair);',
		'	float kind = clamp(0.15 + heaps * 0.55 + convect * belts.y * 0.6 + storm * 0.25 * (1.0 - sheet) - (1.0 - warm) * 0.2, 0.0, 1.0);',
		'	kind = max(kind, 0.5 * smoothstep(0.03, 0.1, fair) * (1.0 - sheet));',
		'	return vec2(heaps, kind);',
		'}',
		'/* Cirrus on the streams (low to high of them), more in the middle latitudes and the ITCZ, less over a front. */',
		'float wx_cirrus(float streams, float py, float sheet, float low, float high) {',
		'	vec3 belts = wx_belts(py);',
		'	return smoothstep(low, high, streams) * (0.35 + 0.65 * smoothstep(25.0, 45.0, belts.x) + belts.y * 0.4) * (1.0 - sheet * 0.5);',
		'}',
		'/* Rain of a front as humid as from to to, and of the towers of a storm. */',
		'float wx_rain(float sheet, float humid, float storm, float heaps, float kind, float from, float to) {',
		'	return sheet * smoothstep(from, to, humid + storm * 0.3) + heaps * smoothstep(0.75, 1.0, kind) * 0.8;',
		'}',
		'/* Cover, kind, cirrus and rain: a shroud all over on a world of clouds (as Venus), none at all on one with none. */',
		'vec4 wx_shroud(float sheet, float heaps, float kind, float cirrus, float rain, float cloudiness) {',
		'	float shroud = smoothstep(0.85, 1.0, cloudiness);',
		'	float on = step(0.001, cloudiness);',
		'	float cover = mix(max(sheet, heaps * 0.8), 1.0, shroud);',
		'	return vec4(clamp(cover, 0.0, 1.0) * on, clamp(mix(kind, 0.1, shroud), 0.0, 1.0), clamp(cirrus * on, 0.0, 1.0), clamp(rain, 0.0, 1.0) * on);',
		'}'
	],

	/* What a worker carries of this Service besides its methods: the js of its Kernel, made in the page. */
	Carried: ['Compiled'],

	/* The Kernel with the noise it reads (the Kernel of the Noise Service), as one text of the kernel language. */
	Whole: function () {
		return this.$Service('Noise').Kernel + '\n' + this.Kernel.join('\n');
	},

	/* The functions of the Kernel as js: made of the text the page made once (Compiled), the same text in a worker. */
	Code: function () {
		var self = this;

		if (this.Made)
			return this.Made;

		if (!this.Compiled && typeof Elemenx !== 'undefined' && Elemenx.Compilers) {
			Elemenx.Compilers.Run({From: 'kernel', To: 'js', Value: this.Whole(), Entry: 'forecast'}, function (error, result) {
				if (error)
					throw error;

				self.Compiled = result.Value;
			});
		}

		this.Made = new Function(this.Compiled)();

		return this.Made;
	},

	/* The Kernel in the IR of Elemenx.Compilers, made once: its functions (and those of the noise) for a module of another. */
	IR: function () {
		var self = this;

		if (!this.IRMade) {
			Elemenx.Compilers.Run({From: 'kernel', To: 'ir', Value: this.Whole()}, function (error, result) {
				if (error)
					throw error;

				self.IRMade = result.Value;
			});
		}

		return this.IRMade;
	},

	Air: function (p, days, seed, radiusKm, scale, fine, eddy, cells) {
		var made = this.Code().wx_air(p, days, seed, radiusKm, scale, fine, eddy, Number(cells) || 0);

		return {Fronts: made[0], Streams: made[1], Mid: made[2], Storm: made[3]};
	},

	Fronts: function (fronts, mid, moist, ground, climb, py, storm, cloudiness, cut, cutBy, soft) {
		var made = this.Code().wx_fronts(fronts, mid, moist, ground, climb, py, storm, cloudiness, cut, cutBy, soft);

		return {Sheet: made[0], Humid: made[1]};
	},

	Heaps: function (p, sun, warm, moist, ground, climb, streams, mid, humid, storm, sheet, cloudiness, fairLow, fairHigh) {
		var made = this.Code().wx_heaps(p, sun, warm, moist, ground, climb, streams, mid, humid, storm, sheet, cloudiness, fairLow, fairHigh);

		return {Heaps: made[0], Kind: made[1]};
	},

	Cirrus: function (streams, py, sheet, low, high) {
		return this.Code().wx_cirrus(streams, py, sheet, low, high);
	},

	Rain: function (sheet, humid, storm, heaps, kind, from, to) {
		return this.Code().wx_rain(sheet, humid, storm, heaps, kind, from, to);
	},

	Shroud: function (sheet, heaps, kind, cirrus, rain, cloudiness) {
		var made = this.Code().wx_shroud(sheet, heaps, kind, cirrus, rain, cloudiness);

		return {Cover: made[0], Kind: made[1], Cirrus: made[2], Rain: made[3]};
	}
});
