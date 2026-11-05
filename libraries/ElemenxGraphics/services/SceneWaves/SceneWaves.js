/*
 * SceneWaves: the waves of a sea as Gerstner waves, the same for the shader that draws them and for what floats on them.
 * Make(settings) makes the waves of a sea state: {Swell (0 calm to 1.5 a storm, 0.35), Way (degrees the wind blows to,
 * 30), Length (the length of the longest wave, 40 units), Choppy (0 to 1: how sharp their crests, 0.6), Count (up to
 * 8), Seed}: {Waves: [{Way: [x, z], Length, Height, Sharp, Speed, Phase}], Count}. A calm sea (Swell 0) has none.
 * - At(made, x, z, time): the surface over a point: {Height, Normal, Crest (0 to 1: how much the water folds over itself
 *   there, where it breaks white)}. A wave moves the water round and round: the place under a point is found again.
 * - Values(made, time): the uniforms of the shader: uWaveA[8] (way, number, height), uWaveB[8] (sharpness, speed, phase),
 *   uWaveCount, uWaveTime.
 * - GLSL: the function of the shader, gerstner(vec2 place, float time, float far, float fade, out vec3 normal, out float
 *   crest): how far a point of a level sea moves; each wave fades with the distance as a pixel can no longer tell it, and
 *   all of them by fade (shallow water).
 */
Elemenx.Service('SceneWaves', {
	$Meta: {
		Description: 'The waves of a sea as Gerstner waves: for the shader that draws them and for what floats on them.',
		Methods: ['Make(settings)', 'At(made, x, z, time)', 'Values(made, time)']
	},

	Gravity: 9.81,

	/* The waves of a sea state. */
	Make: function (settings) {
		var options = settings || {};
		var swell = Math.max(0, Math.min(1.5, number(options.Swell, 0.35)));
		var way = number(options.Way, 30) * Math.PI / 180;
		var longest = Math.max(1, number(options.Length, 40)) * (0.6 + swell * 0.6);
		var choppy = Math.max(0, Math.min(1, number(options.Choppy, 0.6)));
		var count = swell > 0 ? Math.max(1, Math.min(8, Math.round(number(options.Count, 8)))) : 0;
		var random = this.$Service('Random').Create(options.Seed === undefined ? 'sea' : String(options.Seed));
		var waves = [];
		var i;

		function number (value, fallback) {
			return value === undefined || value === null || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		for (i = 0; i < count; i++) {
			var length = longest * Math.pow(0.68, i);
			var turn = way + (random.Next() - 0.5) * (i ? 1.4 : 0.3);
			var wavenumber = 2 * Math.PI / length;
			/* As steep as the sea is wild, the short ones less: a sum of them never folds over. */
			var height = (0.004 + swell * 0.02) * length / (1 + i * 0.25);

			waves.push({Way: [Math.cos(turn), Math.sin(turn)], Length: length, Height: height, Sharp: choppy / (wavenumber * height * count + 1e-6), Speed: Math.sqrt(this.Gravity * wavenumber), Phase: random.Next() * Math.PI * 2});
		}

		return {Waves: waves, Count: count};
	},

	/* The surface over a point of a sea at a time: its height, its normal and how much it folds there. */
	At: function (made, x, z, time) {
		var waves = made && made.Waves || [];
		var place = [x, z];
		var round;
		var i;

		function displaced (px, pz) {
			var moved = [px, 0, pz];
			var normal = [0, 1, 0];

			waves.forEach(function (wave) {
				var k = 2 * Math.PI / wave.Length;
				var phase = k * (wave.Way[0] * px + wave.Way[1] * pz) - wave.Speed * time + wave.Phase;
				var c = Math.cos(phase);
				var s = Math.sin(phase);
				var q = Math.min(wave.Sharp, 1 / (k * wave.Height * Math.max(1, waves.length)));

				moved[0] += q * wave.Height * wave.Way[0] * c;
				moved[1] += wave.Height * s;
				moved[2] += q * wave.Height * wave.Way[1] * c;
				normal[0] -= wave.Way[0] * k * wave.Height * c;
				normal[1] -= q * k * wave.Height * s;
				normal[2] -= wave.Way[1] * k * wave.Height * c;
			});

			return {Place: moved, Normal: normal};
		}

		/* The water at x, z came from somewhere near: found in a few steps. */
		for (round = 0; round < 4; round++) {
			var seen = displaced(place[0], place[1]);

			place = [place[0] - (seen.Place[0] - x), place[1] - (seen.Place[2] - z)];
		}

		var surface = displaced(place[0], place[1]);
		var length = Math.sqrt(surface.Normal[0] * surface.Normal[0] + surface.Normal[1] * surface.Normal[1] + surface.Normal[2] * surface.Normal[2]) || 1;

		for (i = 0; i < 3; i++)
			surface.Normal[i] /= length;

		return {Height: surface.Place[1], Normal: surface.Normal, Crest: Math.max(0, Math.min(1, (0.55 - surface.Normal[1] * length) * 2))};
	},

	/* The uniforms of the shader of a sea: its waves at a time. */
	Values: function (made, time) {
		var a = new Array(32).fill(0);
		var b = new Array(32).fill(0);
		var waves = made && made.Waves || [];

		waves.forEach(function (wave, index) {
			var k = 2 * Math.PI / wave.Length;

			a.splice(index * 4, 4, wave.Way[0], wave.Way[1], k, wave.Height);
			b.splice(index * 4, 4, Math.min(wave.Sharp, 1 / (k * wave.Height * Math.max(1, waves.length))), wave.Speed, wave.Phase, wave.Length);
		});

		return {uWaveA: a, uWaveB: b, uWaveCount: waves.length, uWaveTime: time || 0};
	},

	GLSL: [
		'uniform vec4 uWaveA[8];',
		'uniform vec4 uWaveB[8];',
		'uniform int uWaveCount;',
		'uniform float uWaveTime;',
		'vec3 gerstner(vec2 place, float far, float fade, out vec3 normal, out float crest) {',
		'	vec3 moved = vec3(0.0);',
		'	vec3 n = vec3(0.0, 1.0, 0.0);',
		'	for (int i = 0; i < 8; i++) {',
		'		if (i >= uWaveCount) break;',
		'		vec4 a = uWaveA[i];',
		'		vec4 b = uWaveB[i];',
		/* A wave fades as it grows too small for the pixels that far. */
		'		float h = a.w * fade * (1.0 - smoothstep(b.w * 30.0, b.w * 90.0, far));',
		'		float phase = a.z * dot(a.xy, place) - b.y * uWaveTime + b.z;',
		'		float c = cos(phase);',
		'		float s = sin(phase);',
		'		moved += vec3(b.x * h * a.x * c, h * s, b.x * h * a.y * c);',
		'		n -= vec3(a.x * a.z * h * c, b.x * a.z * h * s, a.y * a.z * h * c);',
		'	}',
		'	crest = clamp((0.55 - n.y) * 2.0, 0.0, 1.0);',
		'	normal = normalize(n);',
		'	return moved;',
		'}'
	].join('\n')
});
