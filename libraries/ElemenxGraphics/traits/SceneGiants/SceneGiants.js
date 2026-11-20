/*
 * SceneGiants: the inside of a giant of gas or of ices, as its envelope has it (Envelope Service: Scene EnvelopeOf). The
 * eye under the top of its decks of clouds (40 km over the highest of them) is in it: what it sees there is its air at
 * that depth, over all that lies far (the sky, the stars, the giant from outside):
 * - its decks of clouds as they pass (billows of a noise round the eye, layered as the depth is, of the colour of the deck
 *   it is in), lit from above by as much of its sun as gets there (Light of the envelope, as an eye used to the dark sees
 *   it: to the power 0.4), on its day side, darker as it goes down;
 * - under them the dark, and the glow of the heat of the depth (Glow of the envelope: dark red past some 800 K, orange,
 *   yellow, white deep in its hydrogen made metal), from below, brighter as it goes down;
 * - in a deck of water (Lightning of its condensable, or its name of water) flashes of lightning in the clouds round it;
 * - in the seat of a ship (Person first of the Scene: scene.Inside) drops of its clouds on the glass;
 * - the light of the scene: its stars as much as their light gets there, the glow of the depth a light from the middle of
 *   the giant (engine.GiantLight, of Scene lights), a flash of lightning white over all.
 * A ship stops only at its core (engine.SolidOf of SceneVehicles: the Floor of its envelope), as fast deep in it as so high
 * over it; while the eye is in it its globe is not drawn from outside. engine.Giant: what the eye is in ({Body, Height (km
 * over its 1 bar), Fade (0 over its decks to 1 in them), State (Envelope At), Seen, Color, Opacity, Lightning, Up}) or null;
 * engine.GiantNow() the same, once a frame; engine.GiantDraw(sky) draws it over what lies far (and the drops over all);
 * engine.GiantStep(elapsed) its lightning. Seen in the demo Universe: Jove, a giant of the system of Terra.
 */
Elemenx.Trait('SceneGiants', {
	GiantsStart: function () {
		var scene = this.Scene();
		var engine = this.Engine();
		var self = this;
		var renderer = engine.Renderer;
		var math = this.$Service('Math');
		var vectors = math.Vectors;
		var head = '#version 300 es\nprecision highp float;\n';
		var graphics = this.$Service('Renderer');
		var program = null;
		var quad = null;
		var flash = {Now: 0, Next: 2, Bolt: [0, 1, 0]};
		var made = {At: -1, Eye: null, Value: null};

		function trait (object, name) {
			return object && object.Traits ? object.Traits[name] || null : null;
		}

		function colorOf (text) {
			var hex = String(text || '').trim().replace('#', '');

			return /^[0-9a-f]{6}$/i.test(hex) ? [parseInt(hex.slice(0, 2), 16) / 255, parseInt(hex.slice(2, 4), 16) / 255, parseInt(hex.slice(4, 6), 16) / 255] : [0.5, 0.45, 0.4];
		}

		function smooth (from, to, value) {
			var t = Math.max(0, Math.min(1, (value - from) / (to - from)));

			return t * t * (3 - 2 * t);
		}

		/* The giant the eye is in (or just over), once a frame. */
		function inside () {
			var best = null;

			if (made.At === scene.Seconds && made.Eye === scene.Eye) return made.Value;

			made.At = scene.Seconds;
			made.Eye = scene.Eye;

			if (scene.Ground || scene.Surface || !engine.EnvelopeOf || !scene.Eye) {
				made.Value = null;
				engine.Giant = null;

				return null;
			}

			scene.Order.forEach(function (object) {
				var surface = trait(object, 'Surface');
				var envelope;
				var height;
				var ceiling;

				if (!surface || surface.Type !== 'gas' && surface.Type !== 'ice-giant' || !object.World || !object.Size || !object.Radius) return;

				envelope = engine.EnvelopeOf(object);
				height = (vectors.Distance(scene.Eye, object.World) / object.Size - 1) * object.Radius;
				ceiling = envelope.Decks.length ? Math.max.apply(null, envelope.Decks.map(function (deck) {
					return deck.Top;
				})) + 40 : 60;

				if (height > ceiling || best && best.Height < height) return;

				best = {Body: object, Height: height, Made: envelope, Ceiling: ceiling};
			});

			if (best) {
				var state = engine.EnvelopeAt(best.Made, best.Height);
				var index = Math.max(0, best.Made.Names.indexOf(state.Zone));
				var deck = best.Made.Decks.filter(function (one) {
					return one.Name === state.Zone;
				})[0];

				best.State = state;
				best.Fade = smooth(best.Ceiling, best.Ceiling - 40, best.Height);
				best.Color = colorOf(deck ? deck.Color : best.Made.Colors[index]);
				best.Opacity = best.Made.Zones[2 + index * best.Made.Stride + 8] || 0;
				best.Lightning = !!deck && (deck.Lightning || /water/.test(deck.Name));
				best.Up = vectors.Normalize(vectors.Subtract(scene.Eye, best.Body.World));
				/* As much of the light as the eye sees there, used to the dark as it goes down (a power of 0.4 of what gets there). */
				best.Seen = Math.pow(Math.max(0, state.Light), 0.4);
			}

			made.Value = best;
			engine.Giant = best;

			return best;
		}

		engine.GiantNow = inside;

		/*
		 * The lights of the scene in a giant (Scene lights): its stars as much as their light gets there, the glow of its
		 * depth a light from its middle (its colour times how bright), a flash of lightning white over all.
		 */
		engine.GiantLight = function (positions, colors, count) {
			var giant = inside();
			var light;
			var glow;
			var at;
			var i;

			if (!giant)
				return count;

			light = 1 - giant.Fade * (1 - giant.Seen);

			for (i = 0; i < count * 3; i++)
				colors[i] *= light;

			glow = giant.State.Glow;

			if (count < 4 && giant.Fade > 0 && (glow[0] + glow[1] + glow[2] > 0.001 || flash.Now > 0.01)) {
				at = vectors.Subtract(giant.Body.World, scene.Eye);
				positions[count * 3] = at[0];
				positions[count * 3 + 1] = at[1];
				positions[count * 3 + 2] = at[2];
				colors[count * 3] = ((1 - Math.exp(-glow[0] * 1.5)) * 1.3 + flash.Now * 0.9) * giant.Fade;
				colors[count * 3 + 1] = ((1 - Math.exp(-glow[1] * 1.5)) * 1.3 + flash.Now * 0.95) * giant.Fade;
				colors[count * 3 + 2] = ((1 - Math.exp(-glow[2] * 1.5)) * 1.3 + flash.Now) * giant.Fade;
				count++;
			}

			return count;
		};

		/* Flashes of lightning in a deck of water: now and then, a quarter of a second each. */
		function flashStep (giant, elapsed) {
			flash.Now = Math.max(0, flash.Now - elapsed * 4);

			if (!giant || !giant.Lightning) return;

			flash.Next -= elapsed;

			if (flash.Next <= 0) {
				flash.Now = 0.6 + Math.random() * 0.4;
				flash.Next = 0.4 + Math.random() * 3.5;
				flash.Bolt = vectors.Normalize([Math.random() * 2 - 1, Math.random() * 1.2 - 0.6, Math.random() * 2 - 1]);
			}
		}

		engine.GiantStep = function (elapsed) {
			flashStep(inside(), elapsed);
		};

		/* What lies far, over all of it: the air of the giant round the eye, as the shader of it draws it. */
		engine.GiantDraw = function (sky) {
			var giant = inside();
			if (!giant || giant.Fade < 0.002 || !renderer) return;

			quad = quad || renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});
			program = program || renderer.Program(self.GiantsShaders(head, graphics).Vertex, self.GiantsShaders(head, graphics).Inside);

			var star = scene.Order.filter(function (object) {
				return trait(object, 'Star') && object.World;
			})[0];
			var values = {
				uInverse: math.Invert(sky),
				uUp: giant.Up,
				uSun: star ? vectors.Normalize(vectors.Subtract(star.World, scene.Eye)) : [0, 1, 0],
				uDeck: giant.Color,
				uLight: giant.Seen,
				uBolt: flash.Bolt,
				uGlow: giant.State.Glow,
				uThick: Math.min(1, giant.Opacity * 20),
				uCloud: giant.State.Phase === 'cloud' ? 1 : 0,
				uHeight: giant.Height,
				uTime: scene.Seconds % 1000,
				uFlash: flash.Now,
				uFade: giant.Fade,
				uDrops: (scene.Inside || 0) > 0.5 && (giant.State.Phase === 'cloud' || giant.State.Phase === 'liquid' || giant.State.Phase === 'supercritical') ? giant.Fade : 0,
				uPart: 0,
				uAspect: scene.Width && scene.Height ? scene.Width / scene.Height : 1,
				uDepth: 0.99999
			};

			/* Behind all that stands: its air over the far; the drops on the glass over all, in the seat of the ship. */
			engine.DrawReady(quad, program, values, {DepthWrite: false, Blend: 'over', Cull: 'none'});

			if (values.uDrops > 0.01) {
				values.uPart = 1;
				values.uDepth = -0.99999;

				engine.DrawReady(quad, program, values, {Depth: false, DepthWrite: false, Blend: 'over', Cull: 'none'});
			}
		};

		/*
		 * Asked for when the scene starts (engine.Warm) only where there is a giant to go into. Regression: made for every scene,
		 * it made each of them slower to be ready.
		 */
		(engine.Warms = engine.Warms || []).push(function (setting) {
			var giants = scene.Order.some(function (object) {
				var surface = trait(object, 'Surface');

				return surface && (surface.Type === 'gas' || surface.Type === 'ice-giant');
			});
			if (!renderer || setting === 'galaxy' || !giants) return;

			program = program || renderer.Program(self.GiantsShaders(head, graphics).Vertex, self.GiantsShaders(head, graphics).Inside, true);
		});
	},

	/*
	 * Its shader: a ray of a pixel (of the view of the sky), how far it looks up in the giant (uUp), its decks as billows
	 * of a noise round the eye layered as the depth is (uHeight, km), lit from above (uLight, uSun), its glow from below
	 * (uGlow), a flash (uFlash), as much as it is in it (uFade); uPart 1 the drops on the glass (uDrops).
	 */
	GiantsShaders: function (head, graphics) {
		return {
			Vertex: head + [
				'in vec3 aPosition;',
				'uniform float uDepth;',
				'out vec2 vQuad;',
				'void main() {',
				'	vQuad = aPosition.xy;',
				'	gl_Position = vec4(aPosition.xy, uDepth, 1.0);',
				'}'
			].join('\n'),
			Inside: head + [
				'in vec2 vQuad;',
				'uniform mat4 uInverse;',
				'uniform vec3 uUp;',
				'uniform vec3 uSun;',
				'uniform vec3 uDeck;',
				'uniform float uLight;',
				'uniform vec3 uGlow;',
				'uniform float uThick;',
				'uniform float uCloud;',
				'uniform float uHeight;',
				'uniform float uTime;',
				'uniform float uFlash;',
				'uniform vec3 uBolt;',
				'uniform float uFade;',
				'uniform float uDrops;',
				'uniform float uPart;',
				'uniform float uAspect;',
				'out vec4 outColor;',
				graphics.Chunks.Noise,
				/* Drops of its clouds on the glass: three layers of cells, in each maybe one, its place and size its own, sliding down and gone. */
				'vec4 drop(vec2 uv, float scale, float seed) {',
				'	vec2 grid = uv * scale;',
				'	vec2 cell = floor(grid);',
				'	float h = hash3(vec3(cell, seed));',
				'	float speed = 0.04 + 0.12 * hash3(vec3(cell, seed + 1.0));',
				'	float life = fract(uTime * speed + h * 7.0);',
				'	float r = 0.1 + 0.16 * hash3(vec3(cell, seed + 2.0));',
				'	vec2 at = vec2(0.25 + 0.5 * hash3(vec3(cell, seed + 3.0)), 0.8 - 0.6 * life * life);',
				'	vec2 d = (fract(grid) - at) * vec2(1.0, 0.85);',
				'	float body = 1.0 - smoothstep(r * 0.8, r, length(d));',
				'	float here = step(0.82, h) * sin(3.14159 * life);',
				'	float glint = 1.0 - smoothstep(0.0, r * 0.35, length(d - vec2(-0.3, 0.4) * r));',
				'	float rim = smoothstep(r * 0.55, r * 0.9, length(d)) * smoothstep(0.0, -r, d.y);',
				'	float a = body * here * (0.1 + 0.5 * rim + 0.7 * glint);',
				'	return vec4(mix(vec3(0.02, 0.03, 0.04), vec3(0.95, 0.97, 1.0), clamp(rim + glint, 0.0, 1.0)), a);',
				'}',
				'vec4 drops(vec2 uv) {',
				'	vec4 all = vec4(0.0);',
				'	for (int i = 0; i < 3; i++) {',
				'		vec4 one = drop(uv + vec2(float(i) * 0.37, float(i) * 0.61), 7.0 + float(i) * 6.0, float(i) * 11.0 + 5.0);',
				'		all = vec4(mix(all.rgb, one.rgb, one.a), max(all.a, one.a));',
				'	}',
				'	return all;',
				'}',
				'void main() {',
				'	if (uPart > 0.5) {',
				'		vec4 d = drops((vQuad * 0.5 + 0.5) * vec2(uAspect, 1.0));',
				'		outColor = vec4(d.rgb, d.a * uDrops);',
				'		return;',
				'	}',
				'	vec4 far = uInverse * vec4(vQuad, 1.0, 1.0);',
				'	vec4 close = uInverse * vec4(vQuad, -1.0, 1.0);',
				'	vec3 ray = normalize(far.xyz / far.w - close.xyz / close.w);',
				'	float up = dot(ray, uUp);',
				/* Its decks over and round the eye: billows of a noise along the way it looks, layered as the depth is. */
				'	vec3 q = ray * 3.0 + uUp * (uHeight * 0.05) + vec3(uTime * 0.02, 0.0, uTime * 0.013);',
				'	float billows = fbm3(q * 1.7, 4);',
				'	float layers = 0.5 + 0.5 * sin(up * 9.0 + uHeight * 0.31 + billows * 4.0);',
				'	float cloud = clamp(mix(billows, layers, 0.35) * (0.6 + 0.8 * uThick) + uCloud * 0.25, 0.0, 1.0);',
				/* Light from above, as much as gets there; its sun a brighter haze where it is; the glow of the depth from below. */
				'	float above = smoothstep(-0.35, 1.0, up);',
				'	float day = smoothstep(-0.2, 0.25, dot(uUp, uSun));',
				'	vec3 lit = day * (uDeck * uLight * (0.55 + 0.65 * above) * (0.75 + 0.55 * cloud) + vec3(1.0, 0.95, 0.85) * uLight * pow(max(dot(ray, uSun), 0.0), 6.0) * 0.6);',
				'	vec3 hot = vec3(1.0) - exp(-uGlow * 1.5 * (0.5 + 0.9 * smoothstep(0.4, -1.0, up)) * (0.75 + 0.5 * cloud));',
				'	float near = pow(max(dot(ray, uBolt), 0.0), 3.0);',
				'	vec3 color = lit + hot + uDeck * 0.012 + vec3(0.8, 0.85, 1.0) * uFlash * (0.12 + 3.0 * near * (0.3 + cloud));',
				'	outColor = vec4(color, uFade);',
				'}'
			].join('\n')
		};
	}
});
