/*
 * Lighting: what a Scene does with its light after it drew. It draws into a texture of floats, so a sun can be far
 * brighter than white, and makes the picture of it: the air between the eye and what it sees (Fog of the distance),
 * rays of the sun through what stands before it, the darkening of corners (ambient occlusion), the glow of what is too
 * bright (bloom), and a filmic curve (ACES) that keeps the colors of highlights.
 *
 * The bounce of the sun: the view of a map from the sun, in colors and a few times a second, is blurred into a texture
 * every surface reads, so a shadow on a meadow turns green and a wall by a sunny field is lit from below (one bounce, as
 * far as the shadows reach).
 *
 * The light of a field, instead of the bounce, at high and ultra: all of a ground is drawn from above into a map of colors
 * and heights, houses and trees too. On it each place looks round along twelve ways for what stands near: what it hides of
 * the sky, and what light comes from there, lit by the sun or by the light that already came to it, so light goes on
 * bouncing. A valley is darker than a hill, a shadow by a sunny wall takes its color, a forest is dim under its leaves. It
 * is worked out in strips, a few frames for all of it, and again when the sun or what stands on the ground changes. It
 * sees a height for each place: nothing under a roof, as the outdoors of a game needs no more.
 *
 * Quality: low, medium, high or ultra; empty chooses by the graphics card and steps down while frames are late.
 * - low: no picture after the drawing, one shadow, the masses nearer, no grass. A machine with no graphics card gets it.
 * - medium: bloom, the air, edges smoothed (4 samples).
 * - high: two shadow maps, rays, ambient occlusion at half size, the bounce, water that mirrors what is on the screen, and
 *   frames that add up (TAA: the view shakes by less than a pixel, and each frame is mixed with the last), so what is
 *   thin, as grass, does not shimmer.
 * - ultra: ambient occlusion at full size, the masses farther.
 *
 * Colors in the texture are encoded by a gamma of 2.2, as the shaders of the scene write them; the picture decodes them.
 */
Elemenx.Trait('SceneLighting', {
	Quality: '',
	Flare: true,
	Weather: 'clear',
	Exposure: null,
	Wind: null,
	WindWay: 70,
	Front: null,
	Pipeline: null,
	PipelineParameters: null,

	LightingStart: function () {
		var self = this;
		var scene = this.Scene();
		var engine = this.Engine();
		var renderer = engine.Renderer;
		var graphics = this.$Service('Renderer');
		var math = this.$Service('Math');
		var shaders = this.LightingShaders(graphics);
		var blueprints = this.$Service('Blueprints');
		var state = {Width: 0, Height: 0, Level: '', Scene: null, Bloom: [], Dark: null, Soft: null, Programs: null, Late: 0, Frames: 0, Step: 0, Screen: {}, Shaders: {}};
		var levels = ['low', 'medium', 'high', 'ultra'];
		var sets = {
			low: {Post: false, Cascades: 1, Bounce: false, Occlusion: 0, Rays: false, Samples: 0, Reach: 0.6, Grass: false},
			medium: {Post: true, Cascades: 1, Bounce: false, Occlusion: 0, Rays: false, Samples: 4, Reach: 0.8, Clouds: 9},
			high: {Post: true, Cascades: 2, Bounce: true, Occlusion: 0.5, Rays: true, Samples: 4, Reach: 1, Mirror: true, Frames: true, Field: true, Clouds: 16, Lamps: 2},
			ultra: {Post: true, Cascades: 2, Bounce: true, Occlusion: 1, Rays: true, Samples: 4, Reach: 1.4, Mirror: true, Frames: true, Field: true, Clouds: 26, Lamps: 2}
		};

		state.Floats = !!renderer.GL.getExtension('EXT_color_buffer_float');

		/* A guess by the name of the graphics card: the frames correct it. */
		function guess () {
			var gl = renderer.GL;
			var info = gl.getExtension('WEBGL_debug_renderer_info');
			var name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
			if (/SwiftShader|llvmpipe|Software|Microsoft Basic/i.test(name)) return 'low';
			if (/Adreno|Mali|PowerVR|Apple A|Intel|UHD/i.test(name)) return 'medium';

			return 'high';
		}

		function level () {
			var wanted = String(self.Quality || '').toLowerCase();

			/* A picture needs a texture of floats to draw into. */
			if (!state.Floats) return 'low';

			if (sets[wanted]) return wanted;

			if (!state.Level)
				state.Level = guess();

			return state.Level;
		}

		this.Graphics = function () {
			return Object.assign({Level: level()}, sets[level()]);
		};

		this.ScatterReach = function () {
			return sets[level()].Reach;
		};

		engine.PostWarm = function () {
			programs();
		};

		function programs () {
			if (!state.Programs) {
				state.Programs = {
					Down: renderer.Program(graphics.Shaders.Quad, shaders.Down),
					Up: renderer.Program(graphics.Shaders.Quad, shaders.Up),
					Dark: renderer.Program(graphics.Shaders.Quad, shaders.Dark),
					Soft: renderer.Program(graphics.Shaders.Quad, shaders.Soft),
					Picture: renderer.Program(graphics.Shaders.Quad, shaders.Picture),
					Frames: renderer.Program(graphics.Shaders.Quad, shaders.Frames),
					FieldLit: renderer.Program(graphics.Shaders.Quad, shaders.FieldLit),
					FieldGlow: renderer.Program(graphics.Shaders.Quad, shaders.FieldGlow),
					Shafts: renderer.Program(graphics.Shaders.Quad, shaders.Shafts),
					Clouds: renderer.Program(graphics.Shaders.Quad, shaders.Clouds),
					Air: renderer.Program(graphics.Shaders.Quad, shaders.Air),
					Sunlit: renderer.Program(graphics.Shaders.Quad, shaders.Sunlit),
					Measure: renderer.Program(graphics.Shaders.Quad, shaders.Measure),
					Adapt: renderer.Program(graphics.Shaders.Quad, shaders.Adapt),
					CloudMap: renderer.Program(graphics.Shaders.Quad, shaders.CloudMap),
					CloudFrames: renderer.Program(graphics.Shaders.Quad, shaders.CloudFrames),
					Mirror: renderer.Program(graphics.Shaders.Quad, shaders.Mirror),
					Focus: renderer.Program(graphics.Shaders.Quad, shaders.Focus),
					Circle: renderer.Program(graphics.Shaders.Quad, shaders.Circle),
					Disc: renderer.Program(graphics.Shaders.Quad, shaders.Disc),
					Focused: renderer.Program(graphics.Shaders.Quad, shaders.Focused),
					Copy: renderer.Program(graphics.Shaders.Quad, shaders.Copy)
				};
			}

			return state.Programs;
		}

		function destroy () {
			[state.Scene, state.Dark, state.Soft, state.Now, state.Before, state.Shaft, state.ShaftSoft, state.Cloud, state.CloudPast, state.CloudNext, state.Mirror, state.Circle, state.Disc, state.Focused].concat(state.Bloom).forEach(function (target) {
				if (target)
					target.Destroy();
			});

			state.Scene = null;
			state.Dark = null;
			state.Soft = null;
			state.Now = null;
			state.Before = null;
			state.Shaft = null;
			state.ShaftSoft = null;
			state.Cloud = null;
			state.CloudPast = null;
			state.CloudNext = null;
			state.Mirror = null;
			state.Past = null;
			state.Bloom = [];
			state.Circle = null;
			state.Disc = null;
			state.Focused = null;
			state.BokehKey = '';
		}

		/* The textures, as large as the view, again when it changed. */
		function prepare (set) {
			var width = renderer.Width;
			var height = renderer.Height;
			var key = width + ':' + height + ':' + set.Samples + ':' + set.Occlusion;
			var i;

			if (state.Key === key) return;

			destroy();

			state.Key = key;
			state.Scene = renderer.Target(width, height, {Float: true, DepthTexture: true, Samples: set.Samples});
			state.Aired = renderer.Target(width, height, {Float: true});

			for (i = 1; i <= 6; i++)
				state.Bloom.push(renderer.Target(Math.max(1, width >> i), Math.max(1, height >> i), {Float: true}));

			if (set.Clouds) {
				state.Cloud = renderer.Target(Math.max(1, width >> 1), Math.max(1, height >> 1), {Float: true});
				state.CloudPast = renderer.Target(state.Cloud.Width, state.Cloud.Height, {Float: true});
				state.CloudNext = renderer.Target(state.Cloud.Width, state.Cloud.Height, {Float: true});
				state.CloudMatrix = null;
			}

			if (set.Mirror)
				state.Mirror = renderer.Target(Math.max(1, width >> 1), Math.max(1, height >> 1), {Float: true});

			if (set.Rays) {
				state.Shaft = renderer.Target(Math.max(1, width >> 1), Math.max(1, height >> 1), {Float: true});
				state.ShaftSoft = renderer.Target(Math.max(1, width >> 2), Math.max(1, height >> 2), {Float: true});
				state.ShaftPast = renderer.Target(state.ShaftSoft.Width, state.ShaftSoft.Height, {Float: true});
				state.ShaftNext = renderer.Target(state.ShaftSoft.Width, state.ShaftSoft.Height, {Float: true});
				state.Sunlit = renderer.Target(1, 1, {Float: true});
				state.SunlitNext = renderer.Target(1, 1, {Float: true});
				state.SunlitOn = false;
				state.EyeBuffer = null;
				state.EyeFence = null;
				state.ShaftMatrix = null;
			}

			if (set.Occlusion) {
				state.Dark = renderer.Target(Math.max(1, Math.round(width * set.Occlusion)), Math.max(1, Math.round(height * set.Occlusion)));
				state.Soft = renderer.Target(state.Dark.Width, state.Dark.Height);
			}

			if (set.Frames) {
				state.Now = renderer.Target(width, height, {Float: true});
				state.Before = renderer.Target(width, height, {Float: true});
			}
		}

		/* A shake of less than a pixel of a view, another each frame: the steps of Halton's sequence. */
		function halton (index, base) {
			var result = 0;
			var fraction = 1 / base;
			var at = index;

			while (at > 0) {
				result += fraction * (at % base);
				at = Math.floor(at / base);
				fraction /= base;
			}

			return result;
		}

		engine.PostJitter = function (projection) {
			var set = sets[level()];
			var shaken = projection.slice();

			if (!set.Frames || !renderer.Width) return projection;

			state.Step = state.Step % 8 + 1;

			/* In parallel rays nothing divides by the depth: the shake is a move of the view, not a slant of it. */
			var slanted = projection[15] !== 1;

			shaken[slanted ? 8 : 12] += (halton(state.Step, 2) - 0.5) / renderer.Width;
			shaken[slanted ? 9 : 13] += (halton(state.Step, 3) - 0.5) / renderer.Height;

			return shaken;
		};

		/* The step of the shake: what fades by a pattern shifts it each frame, and the frames add up to a smooth fade. */
		engine.PostStep = function () {
			return sets[level()].Frames ? state.Step : 0;
		};

		/* What was drawn so far, to read while the water is drawn over it. */
		engine.PostMiddle = function () {
			if (!sets[level()].Mirror) return null;

			state.Scene.End();
			state.Scene.Begin();

			return {Color: state.Scene.Textures[0], Depth: state.Scene.Depth};
		};

		engine.FieldOn = function () {
			return !!(sets[level()].Field && scene.Ground && !scene.Ground.Field.Whole);
		};

		/* The map of the ground from above: the land alone, then with what stands on it. */
		function fieldMaps (view) {
			var field = scene.Ground.Field;
			var side = 2 / field.Size;
			var depth = -1 / (field.Top * 2 + 60);
			var top = [side, 0, 0, 0, 0, 0, depth, 0, 0, side, 0, 0, 0, 0, 0, 1];
			var light = state.Field;

			light.Bare.Begin();

			renderer.Clear([0.3, 0.3, 0.3, 0]);

			engine.GroundTop(top, false);

			light.Bare.End();

			light.Surface.Begin();

			renderer.Clear([0.3, 0.3, 0.3, 0]);

			engine.GroundTop(top, true, view);

			light.Surface.End();
		}

		/*
		 * A step of the light of a field, before a frame is drawn: what stands is mapped again when it changed (a forest
		 * grows for seconds: once in a while), and the light is worked out in strips, three times over for the bounces.
		 */
		engine.FieldLight = function (view) {
			var ground = scene.Ground;
			var gl = renderer.GL;
			var side = 256;
			var strip = 32;
			var run;
			var light;
			var stands;
			var sun;

			if (!engine.FieldOn() || !engine.GroundTopReady()) return {};

			if (!state.Field) {
				state.Field = {Key: '', Stands: '', Sun: '', Row: 0, Rounds: 0, Wait: 0, Started: false};

				['Bare', 'Surface', 'Lit', 'Glow'].forEach(function (name) {
					state.Field[name] = renderer.Target(side, side, {Float: true, Depth: true});
				});
			}

			light = state.Field;
			run = programs();
			stands = (self.Sown ? self.Sown().Things : 0) + ':' + scene.Order.length;
			sun = ground.Sun.join(',');

			if (!scene.PostQuad)
				scene.PostQuad = renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});

			light.Wait--;

			if (light.Key !== ground.Key || light.Stands !== stands && light.Wait <= 0) {
				if (light.Key !== ground.Key) {
					light.Glow.Begin();

					renderer.Clear([0, 0, 0, 1]);

					light.Glow.End();
				}

				light.Key = ground.Key;
				light.Stands = stands;
				light.Wait = 120;
				light.Rounds = 3;
				light.Row = 0;

				fieldMaps(view);
			}
			else if (light.Sun !== sun) {
				light.Rounds = Math.max(light.Rounds, 2);
			}

			light.Sun = sun;

			if (light.Rounds > 0) {
				if (!light.Row)
					pass(light.Lit, run.FieldLit, {uSurface: light.Surface.Textures[0], uGlow: light.Glow.Textures[0], uSun: ground.Sun, uSunColor: ground.SunColor, uSize: ground.Field.Size});

				light.Glow.Begin();

				gl.enable(gl.SCISSOR_TEST);
				gl.scissor(0, light.Row, side, strip);

				renderer.Draw(scene.PostQuad, run.FieldGlow, {uSurface: light.Surface.Textures[0], uBare: light.Bare.Textures[0], uLit: light.Lit.Textures[0], uSize: ground.Field.Size}, {Depth: false, DepthWrite: false, Cull: 'none'});

				gl.disable(gl.SCISSOR_TEST);

				light.Glow.End();

				light.Row += strip;

				if (light.Row >= side) {
					light.Row = 0;
					light.Rounds--;
				}
			}

			return {uGlow: light.Glow.Textures[0], uGlowOn: 1, uGlowPlace: [scene.Eye[0], scene.Eye[2], ground.Field.Size]};
		};

		/* The light of a field at a place: [red, green, blue, the sky it sees]. */
		engine.FieldRead = function (x, z) {
			var gl = renderer.GL;
			var data = new Float32Array(4);
			var size = scene.Ground.Field.Size;

			if (!state.Field) return null;

			state.Field.Glow.Begin();

			gl.readPixels(Math.floor((x / size + 0.5) * 256), Math.floor((z / size + 0.5) * 256), 1, 1, gl.RGBA, gl.FLOAT, data);

			state.Field.Glow.End();

			return Array.from(data);
		};

		/*
		 * The weather of a scene: what each kind brings, and the way the sky goes from one to the next. Weather is one of the
		 * names of the table; Renderer has no idea of it: all of it is a few numbers that the shaders read.
		 */
		var calm = {Clouds: 0.3, Kind: 0.5, High: 0.5, Wind: 0.6, Fog: 0, Rain: 0, Snow: 0, Wet: 0, Storm: 0, Flash: 0, Cover: 0, Rainbow: 0};
		var kinds = {
			clear: calm,
			cloudy: {Clouds: 0.62, Kind: 0.6, High: 0.4, Wind: 1, Fog: 0, Rain: 0, Snow: 0, Wet: 0, Storm: 0},
			overcast: {Clouds: 0.9, Kind: 0.15, High: 0, Wind: 1.2, Fog: 0.15, Rain: 0, Snow: 0, Wet: 0, Storm: 0},
			rain: {Clouds: 0.8, Kind: 0.35, High: 0, Wind: 1.6, Fog: 0.35, Rain: 0.8, Snow: 0, Wet: 1, Storm: 0},
			storm: {Clouds: 0.82, Kind: 1, High: 0, Wind: 3.2, Fog: 0.5, Rain: 1.3, Snow: 0, Wet: 1, Storm: 1},
			snow: {Clouds: 0.85, Kind: 0.2, High: 0, Wind: 1, Fog: 0.3, Rain: 0, Snow: 1, Wet: 0, Storm: 0},
			fog: {Clouds: 0.4, Kind: 0.1, High: 0, Wind: 0.2, Fog: 1, Rain: 0, Snow: 0, Wet: 0.2, Storm: 0}
		};
		var turns = ['clear', 'cloudy', 'overcast', 'rain', 'storm', 'rain', 'cloudy'];

		function given (value, fallback) {
			return value === null || value === undefined || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		/* A step of the weather towards what it should be, in the seconds a front takes. */
		engine.WeatherStep = function (elapsed) {
			var named = String(self.Weather || 'clear').toLowerCase();
			var changing = named === 'changing';
			var front = given(self.Front, changing ? 40 : 1.1);

			/* Changing: one weather after the other, each for a few minutes. */
			if (changing) {
				state.Turn = state.Turn || {Index: 0, Left: 90};
				state.Turn.Left -= elapsed;

				if (state.Turn.Left <= 0) {
					state.Turn.Index = (state.Turn.Index + 1) % turns.length;
					state.Turn.Left = 60 + Math.random() * 120;
				}

				named = turns[state.Turn.Index];
			}

			var wanted = kinds[named] || calm;
			var now = state.Now2 = state.Now2 || Object.assign({}, calm, wanted);
			var way = given(self.WindWay, 70) * Math.PI / 180;
			var wind;

			['Clouds', 'Kind', 'High', 'Wind', 'Fog', 'Rain', 'Snow', 'Storm'].forEach(function (name) {
				now[name] += (wanted[name] - now[name]) * Math.min(1, elapsed / front);
			});

			/* What the weather leaves on the ground stays: it gets wet in half a minute, dries and melts in minutes. */
			now.Wet += (wanted.Wet - now.Wet) * Math.min(1, elapsed / (wanted.Wet > now.Wet ? 14 : 30));
			now.Cover += ((wanted.Snow > 0.3 ? 1 : 0) - now.Cover) * Math.min(1, elapsed / (wanted.Snow > 0.3 ? 30 : 16));

			wind = given(self.Wind, now.Wind);

			now.Blow = wind;
			now.Way = [Math.sin(way), -Math.cos(way)];
			now.DriftX = (now.DriftX || 0) + now.Way[0] * wind * elapsed * 0.02;
			now.DriftY = (now.DriftY || 0) + now.Way[1] * wind * elapsed * 0.02;
			now.PathX = (now.PathX || 0) + now.Way[0] * wind * elapsed * 2.4;
			now.PathY = (now.PathY || 0) + now.Way[1] * wind * elapsed * 2.4;
			scene.Gust = (scene.Gust || 0) + elapsed * (0.5 + wind * 0.75);

			/* A storm strikes somewhere: a flash, and a bolt from the clouds to the land. */
			if (now.Storm > 0.5 && Math.random() < elapsed * 0.14) {
				now.Flash = 1.4;
				now.Strike = {Way: Math.random() * Math.PI * 2, Far: 0.5 + Math.random() * 0.8, Seed: Math.random() * 1000};
			}
			else {
				now.Flash = (now.Flash || 0) * Math.exp(-elapsed * 7);
			}

			/* Past the rain, with the clouds opening. */
			now.Rainbow += ((now.Wet > 0.25 && wanted.Rain === 0 && now.Rain < 0.1 && wanted.Clouds < 0.8 ? 1 : 0) - now.Rainbow) * Math.min(1, elapsed / 8);

			return now;
		};

		/*
		 * The block of noise of the clouds (Renderer.CloudBlock), made once by a worker: until it comes, the empty one
		 * stands for it, and no cloud shows.
		 */
		function cloudNoise () {
			if (!state.NoiseAsked) {
				state.NoiseAsked = true;

				graphics.Work().Run('Renderer', 'CloudBlock', [40], function (error, data) {
					if (scene.Gone) return;

					state.Noise = renderer.Volume(40, error ? graphics.CloudBlock(40) : data);
				});
			}

			return state.Noise || emptyNoise();
		}

		/* How bright the picture is, on the mean of its logarithm, and the eye that follows it in a second or two. */
		function eyeSteps (view, run, color) {
			var keep;
			var moment = performance.now();
			var passed = state.EyeAt ? Math.min(0.5, (moment - state.EyeAt) / 1000) : 0;

			if (!view.Sky || given(view.Exposure, null) !== null) return;

			if (!state.Measure) {
				state.Measure = renderer.Target(32, 18, {Float: true, Mipmaps: true});
				state.Eye = renderer.Target(1, 1, {Float: true});
				state.EyePast = renderer.Target(1, 1, {Float: true});
			}

			pass(state.Measure, run.Measure, {uColor: color});
			pass(state.EyePast, run.Adapt, {uMeasure: state.Measure.Textures[0], uOld: state.Eye.Textures[0], uMix: state.EyeAt ? 1 - Math.exp(-passed * 1.3) : 1});

			keep = state.Eye;
			state.Eye = state.EyePast;
			state.EyePast = keep;
			state.EyeAt = moment;
		}

		/* The depth of what was drawn so far, to read while the frame goes on: only where it is drawn with samples of its own. */
		engine.PostDepth = function () {
			var set = sets[level()];
			if (!set.Post || !set.Samples || !state.Scene || !state.Scene.Depth) return null;

			state.Scene.End();
			state.Scene.Begin();

			return state.Scene.Depth;
		};

		/* The block of noise, for all that wants it. */
		engine.NoiseBlock = function () {
			return cloudNoise();
		};

		/* For what reads a picture when there is none. */
		function emptyPicture () {
			state.NoPicture = state.NoPicture || renderer.Texture({Width: 1, Height: 1, Data: new Uint8Array([0, 0, 0, 0])}, {Nearest: true});

			return state.NoPicture;
		}

		/* How shut the eye is to the sun: all the way where nothing measures it. */
		engine.SunEye = function () {
			state.EyeAsked = true;

			return state.SunlitOn && state.EyeShut !== undefined ? state.EyeShut : 1;
		};

		/* The eye comes back to the code a frame or two late, so that no frame waits for the card to finish. */
		function readEye () {
			var gl = renderer.GL;

			/* Only for what asks, and a few times a second: it changes slowly, and a read has a cost even so. */
			state.EyeWait = (state.EyeWait || 0) - (state.Step || 1 / 60);

			if (!state.EyeAsked || state.EyeWait > 0) return;

			state.EyeAsked = false;
			state.EyeWait = 0.12;

			if (state.EyeFence) {
				if (gl.clientWaitSync(state.EyeFence, 0, 0) === gl.TIMEOUT_EXPIRED) return;

				var data = new Float32Array(4);

				gl.bindBuffer(gl.PIXEL_PACK_BUFFER, state.EyeBuffer);
				gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, data);
				gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
				gl.deleteSync(state.EyeFence);

				state.EyeFence = null;
				state.EyeShut = data[1];
			}

			state.EyeBuffer = state.EyeBuffer || gl.createBuffer();

			state.Sunlit.Begin();

			gl.bindBuffer(gl.PIXEL_PACK_BUFFER, state.EyeBuffer);
			gl.bufferData(gl.PIXEL_PACK_BUFFER, 16, gl.STREAM_READ);
			gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, 0);
			gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);

			state.Sunlit.End();

			state.EyeFence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
		}

		/* For the picture of a scene that has no clouds. */
		function emptyNoise () {
			state.NoNoise = state.NoNoise || renderer.Volume(1, new Uint8Array([128, 128, 128, 128]));

			return state.NoNoise;
		}

		/* What the clouds hold, seen from above, round the eye: their shadows on the land, a few times a second. */
		function cloudMap (air, run, now) {
			if (!state.CloudMap)
				state.CloudMap = renderer.Target(256, 256);

			state.CloudTick = (state.CloudTick || 0) + 1;

			if (state.CloudTick % 6 !== 1) return;

			pass(state.CloudMap, run.CloudMap, cloudValues(air, now, {uSpan: (air.Layer[1] - air.Layer[0]) * 30, uFrom: air.From}));
		}

		/* What the shape of the clouds takes. */
		function cloudValues (air, now, more) {
			return Object.assign({uNoise: state.Noise, uLayer: air.Layer, uCover: now.Clouds, uShape: [now.Kind, now.High, 0.5 + now.Storm * 0.5], uDrift: [now.DriftX || 0, now.DriftY || 0]}, more);
		}

		/* Shadows of the clouds for all that is lit: the map, how far along the way to the sun, its scale, its strength. */
		engine.CloudShade = function (air, sun) {
			var now = state.Now2 || calm;
			var span = (air.Layer[1] - air.Layer[0]) * 30;
			var high = (air.Layer[0] + air.Layer[1]) / 2 - air.From[1];
			var along = high / Math.max(0.15, sun[1]);

			var shade = {uCloudShade: [sun[0] * along, sun[2] * along, 1 / span, state.CloudMap && now.Clouds > 0.02 ? 0.88 : 0]};

			if (state.CloudMap)
				shade.uCloudMap = state.CloudMap.Textures[0];

			return shade;
		};

		/* The bolt of a strike: a broken line from the clouds to the land, and its branch, for the moment of its flash. */
		engine.BoltDraw = function (matrix, eye, ground) {
			var now = state.Now2 || calm;
			var strike = now.Strike;
			var points = [];

			if (!ground || !strike || now.Flash < 0.08 || scene.Camera.Ortho) return;

			var low = Math.max(ground.Field.Top * 1.6, 90);

			var random = strike.Seed;

			function next () {
				random = (random * 9301 + 49297) % 233280;

				return random / 233280 - 0.5;
			}

			function line (x, y, z, down, steps, wide) {
				var i;

				for (i = 0; i < steps; i++) {
					var nextX = x + next() * wide;
					var nextZ = z + next() * wide;
					var nextY = y - down;

					points.push(x, y, z, nextX, nextY, nextZ);

					if (i === 5 && steps > 6)
						line(nextX, nextY, nextZ, down * 0.8, 6, wide * 1.2);

					x = nextX;
					y = nextY;
					z = nextZ;
				}
			}

			line(Math.cos(strike.Way) * low * 2.4 * strike.Far, low - eye[1], Math.sin(strike.Way) * low * 2.4 * strike.Far, low / 14, 14, low * 0.09);

			if (!state.BoltProgram)
				state.BoltProgram = renderer.Program(shaders.BoltVertex, shaders.Bolt);

			var mesh = renderer.Lines(points);

			renderer.Draw(mesh, state.BoltProgram, {uViewProjection: matrix, uColor: [6 * now.Flash, 6.4 * now.Flash, 8 * now.Flash]}, {Mode: 'lines', Blend: 'add', DepthWrite: false});

			mesh.Destroy();
		};

		/* Rain and snow, in the world round the eye. */
		engine.FallDraw = function (matrix, eye, ground) {
			var now = state.Now2 || calm;
			var amount = Math.max(now.Rain, now.Snow);
			var set = sets[level()];
			var snow = now.Snow > now.Rain;
			var tone = ground.SkyLight;
			var geometry;
			var i;

			if (amount < 0.02 || scene.Camera.Ortho) return;

			if (!state.Fall) {
				geometry = {Positions: [], Normals: [], UVs: [], Indices: []};

				for (i = 0; i < (set.Frames ? 14000 : 6000); i++) {
					var seed = [Math.random(), Math.random(), Math.random()];
					var base = i * 4;

					[[-1, 0], [1, 0], [1, 1], [-1, 1]].forEach(function (corner) {
						geometry.Positions.push(corner[0], corner[1], 0);
						geometry.Normals.push(seed[0], seed[1], seed[2]);
						geometry.UVs.push(0, 0);
					});

					geometry.Indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
				}

				state.Fall = {Mesh: renderer.Mesh(geometry), Program: renderer.Program(shaders.FallVertex, shaders.Fall)};
			}

			renderer.Draw(state.Fall.Mesh, state.Fall.Program, {uViewProjection: matrix, uEye: eye, uBox: [36, 24, 36], uWind: [now.Way ? now.Way[0] * now.Blow * 2 : 1.6, now.Way ? now.Way[1] * now.Blow * 2 : 0.7], uPath: [now.PathX || 0, now.PathY || 0], uTime: scene.Seconds % 3000, uSnow: snow ? 1 : 0, uAmount: Math.min(1, amount), uTone: snow ? [Math.min(1, tone[2] * 2.2 + 0.1), Math.min(1, tone[2] * 2.3 + 0.1), Math.min(1, tone[2] * 2.5 + 0.12)] : [Math.min(1, tone[2] * 2.4 + 0.22), Math.min(1, tone[2] * 2.5 + 0.22), Math.min(1, tone[2] * 2.7 + 0.25)]}, {Blend: 'alpha', DepthWrite: false, Cull: 'none'});
		};

		engine.WeatherNow = function () {
			return state.Now2 || calm;
		};

		/* Before anything of a frame is drawn: into the texture of floats. */
		engine.PostBegin = function () {
			var set = sets[level()];
			if (!set.Post) return false;

			prepare(set);

			state.Scene.Begin();

			return true;
		};

		/* Clouds at half the size, this frame's noise different each time, and mixed with what they were where they are now. */
		function cloudFrames (air, run, depth, inverse, plain, now, set) {
			var keep;

			state.CloudStep = (state.CloudStep || 0) + 1;

			var strike = now.Strike && now.Flash > 0.05 ? [Math.cos(now.Strike.Way), Math.sin(now.Strike.Way), now.Flash] : [0, 0, 0];

			pass(state.Cloud, run.Clouds, cloudValues(air, now, {uDepth: depth, uInverse: inverse, uTurn: air.Turn, uFrom: air.From, uSunWay: air.Sun, uSunLight: air.SunLight, uSkyTone: air.SkyTone, uUnder: air.Under, uBelow: air.Below || [0, 0, 0], uBelowWay: air.BelowWay || [0, 0, 0], uBolt: strike, uHaze: air.Haze || [0, 0, 0, 0], uSteps: set.Clouds, uStep: state.CloudStep % 64, uBehind: air.Over ? 0 : 1}));
			pass(state.CloudNext, run.CloudFrames, {uNew: state.Cloud.Textures[0], uOld: state.CloudPast.Textures[0], uInverse: math.Invert(plain), uMatrix: state.CloudMatrix || plain, uMix: state.CloudMatrix ? 0.9 : 0, uPixel: [1 / state.Cloud.Width, 1 / state.Cloud.Height]});

			keep = state.CloudPast;
			state.CloudPast = state.CloudNext;
			state.CloudNext = keep;
			state.CloudMatrix = plain;
		}

		/* Flare is true, false or how strong, up to 2. */
		function flareOf () {
			if (self.Flare === false || self.Flare === 'false') return 0;
			if (self.Flare === true || self.Flare === 'true' || self.Flare === undefined) return 1;

			return Math.max(0, Math.min(2, Number(self.Flare) || 0));
		}

		function pass (target, program, uniforms) {
			if (target) target.Begin();
			else renderer.Viewport(0, 0, renderer.Width, renderer.Height);

			renderer.Draw(scene.PostQuad, program, uniforms, {Depth: false, DepthWrite: false, Cull: 'none'});

			if (target)
				target.End();
		}

		/*
		 * The depth of field (view.Bokeh, 0 to 1: how wide the lens is open): what is far from the distance in focus is blurred, a bright
		 * point of it a disc. The focus is view.Focus (a distance), or found at the middle of the view and followed slowly, as a camera
		 * does. At half the size: the circle of each pixel, its disc gathered from a spiral of samples, then laid over the sharp picture by
		 * how blurred each pixel is at its full size, so the edges of what is in focus stay sharp.
		 */
		function bokeh (view, run, color, depth, plain) {
			var width = Math.max(1, renderer.Width >> 1);
			var height = Math.max(1, renderer.Height >> 1);
			var key = renderer.Width + ':' + renderer.Height;
			var inverse = math.Invert(plain || view.Matrix);
			var kept;

			if (state.BokehKey !== key) {
				[state.Circle, state.Disc, state.Focused].forEach(function (target) {
					if (target)
						target.Destroy();
				});

				state.BokehKey = key;
				state.Circle = renderer.Target(width, height, {Float: true});
				state.Disc = renderer.Target(width, height, {Float: true});
				state.Focused = renderer.Target(renderer.Width, renderer.Height, {Float: true});
				state.FocusPast = state.FocusPast || renderer.Target(1, 1, {Float: true});
				state.FocusNext = state.FocusNext || renderer.Target(1, 1, {Float: true});
				state.FocusOn = false;
			}

			pass(state.FocusNext, run.Focus, {uDepth: depth, uInverse: inverse, uOld: state.FocusPast.Textures[0], uMix: state.FocusOn ? 1 - Math.exp(-Math.min(state.Step || 1 / 60, 0.1) / 0.35) : 1, uFixed: view.Focus || 0});

			kept = state.FocusPast;
			state.FocusPast = state.FocusNext;
			state.FocusNext = kept;
			state.FocusOn = true;

			pass(state.Circle, run.Circle, {uColor: color, uDepth: depth, uFocus: state.FocusPast.Textures[0], uInverse: inverse, uOpen: view.Bokeh, uPixel: [1 / renderer.Width, 1 / renderer.Height]});
			pass(state.Disc, run.Disc, {uNear: state.Circle.Textures[0], uPixel: [1 / width, 1 / height], uRadius: 3 + view.Bokeh * 13});
			pass(state.Focused, run.Focused, {uColor: color, uDepth: depth, uDisc: state.Disc.Textures[0], uFocus: state.FocusPast.Textures[0], uInverse: inverse, uOpen: view.Bokeh, uDiscPixel: [1 / width, 1 / height]});

			return state.Focused.Textures[0];
		}

		/*
		 * Lighting: the passes of the picture. What a frame drew is made into its picture by a render graph of the Blueprints
		 * Service: each pass below is a block of it, its textures flowing from one to the next. The graph of the library
		 * (PipelineGraph) runs them in the order they always ran; the Pipeline of the scene, a graph of its own, takes its
		 * place: passes left out, others added (Shader: a pass of a graph of its own), their properties changed.
		 */
		var steps = {
			Scene: function () {
				return {Color: state.Scene.Textures[0], Depth: state.Scene.Depth};
			},

			/* Clouds: at half the size, over all that is nearer than them or behind them; none before their noise came. */
			Clouds: function (frame, inputs) {
				var view = frame.View;
				var now = frame.Now;
				var air = view.Clouds && state.Cloud && now.Clouds > 0.02 && cloudNoise() === state.Noise ? view.Clouds : null;

				frame.Air = air;

				if (air) {
					if (!air.Over)
						cloudMap(air, frame.Run, now);

					cloudFrames(air, frame.Run, inputs.Depth, frame.Inverse, frame.Plain, now, frame.Set);
				}

				return {Cloud: state.Cloud && view.Clouds ? state.CloudPast.Textures[0] : null};
			},

			/* The darkening of corners, where there is a sky. */
			Occlusion: function (frame, inputs) {
				var view = frame.View;
				if (!state.Dark || !view.Sky) return {Dark: null};

				pass(state.Dark, frame.Run.Dark, {uDepth: inputs.Depth, uInverse: frame.Inverse, uMatrix: view.Matrix, uReach: view.Reach || 2, uSunWay: frame.Sun, uSunOn: view.Sky ? Math.min(1, ((view.SunColor || [0, 0, 0])[0] + (view.SunColor || [0, 0, 0])[1]) * 1.2) : 0, uSeed: scene.Frames = (scene.Frames || 0) + 1});
				pass(state.Soft, frame.Run.Soft, {uColor: state.Dark.Textures[0], uDepth: inputs.Depth, uPixel: [1 / state.Dark.Width, 1 / state.Dark.Height]});

				return {Dark: state.Soft.Textures[0]};
			},

			/* The air between the eye and what it sees, with the clouds and the darkened corners laid in. */
			Air: function (frame, inputs) {
				var view = frame.View;
				var now = frame.Now;

				pass(state.Aired, frame.Run.Air, {
					uColor: inputs.Color,
					uDepth: inputs.Depth,
					uDark: inputs.Dark || scene.White || inputs.Color,
					uDarkOn: inputs.Dark ? 1 : 0,
					uCloud: inputs.Cloud || scene.White || inputs.Color,
					uCover: inputs.Cloud && now.Clouds > 0.02 ? 1 : 0,
					uBehind: view.Clouds && view.Clouds.Over ? 0 : 1,
					uFogSky: view.Clouds ? Math.min(0.92, now.Fog * 0.92) : 0,
					uAirLight: frame.AirLight,
					uAirGlow: view.AirGlow || [0, 0, 0],
					uVeil: view.Veil || 0,
					uVeilMove: [(now.DriftX || 0) * 9, (now.DriftY || 0) * 9, scene.Seconds * 0.07],
					uNoise: state.Noise || emptyNoise(),
					uInverse: frame.Inverse,
					uSun: frame.Sun,
					uSunColor: view.SunColor || [1, 1, 1],
					uAir: view.Air || [0, 0, 0, 0],
					uFog: view.Fog || 0,
					uFogLow: view.FogLow || [0, 0, 0],
					uParallel: scene.Camera.Ortho ? 1 : 0
				});

				return {Color: state.Aired.Textures[0]};
			},

			/* This frame with the ones before it, where they are now. */
			Frames: function (frame, inputs) {
				var view = frame.View;
				var color;

				if (!frame.Set.Frames || !view.Eye) return {Color: inputs.Color};

				pass(state.Now, frame.Run.Frames, {uColor: inputs.Color, uDepth: inputs.Depth, uPast: state.Past ? state.Past.Textures[0] : inputs.Color, uInverse: math.Invert(frame.Plain), uMatrix: state.PastMatrix || frame.Plain, uMoved: state.PastEye ? math.Vectors.Subtract(view.Eye, state.PastEye) : [0, 0, 0], uMix: state.Past ? 0.92 : 0, uPixel: [1 / renderer.Width, 1 / renderer.Height]});

				color = state.Now.Textures[0];

				state.Past = state.Now;
				state.Now = state.Before;
				state.Before = state.Past;
				state.PastMatrix = frame.Plain;
				state.PastEye = view.Eye.slice();

				return {Color: color};
			},

			/* What glossy surfaces mirror of what is on the screen. */
			Mirror: function (frame, inputs) {
				var view = frame.View;
				if (!state.Mirror || !view.Eye) return {Mirror: null};

				pass(state.Mirror, frame.Run.Mirror, {uColor: inputs.Color, uDepth: inputs.Depth, uMask: state.Scene.Textures[0], uInverse: math.Invert(frame.Plain), uMatrix: frame.Plain, uAir: view.Air || [0, 0, 0, 0], uAirLight: frame.AirLight, uAirGlow: view.AirGlow || [0, 0, 0]});

				return {Mirror: state.Mirror.Textures[0]};
			},

			/* The light of the sun past what stands before it, drawn out from it; rays and how much of the sun shows go over frames. */
			Rays: function (frame, inputs) {
				var spot = frame.Spot;
				var plain = frame.Plain;
				var view = frame.View;
				var kept;
				var step;
				var ring;

				if (!frame.Rays) {
					state.SunlitOn = false;
					state.ShaftMatrix = null;

					return {Shaft: null, Sunlit: null};
				}

				pass(state.Shaft, frame.Run.Shafts, {uDepth: inputs.Depth, uSpot: [spot[0] * 0.5 + 0.5, spot[1] * 0.5 + 0.5], uSize: [renderer.Width / Math.max(1, renderer.Height), 1], uClear: view.Clear || 0.9999});
				pass(state.ShaftSoft, frame.Run.Down, {uColor: state.Shaft.Textures[0], uPixel: [1 / state.Shaft.Width, 1 / state.Shaft.Height], uThreshold: 0});
				pass(state.ShaftNext, frame.Run.CloudFrames, {uNew: state.ShaftSoft.Textures[0], uOld: state.ShaftPast.Textures[0], uInverse: math.Invert(plain), uMatrix: state.ShaftMatrix || plain, uMix: state.ShaftMatrix ? 0.85 : 0, uPixel: [1 / state.ShaftSoft.Width, 1 / state.ShaftSoft.Height]});

				kept = state.ShaftPast;
				state.ShaftPast = state.ShaftNext;
				state.ShaftNext = kept;
				state.ShaftMatrix = plain;

				step = Math.min(state.Step || 1 / 60, 0.1);
				ring = Math.max(0.02, (view.Ring || 0) * 0.7);

				pass(state.SunlitNext, frame.Run.Sunlit, {uDepth: inputs.Depth, uCloud: inputs.Cloud && frame.Air ? inputs.Cloud : emptyPicture(), uOld: state.Sunlit.Textures[0], uSpot: [spot[0] * 0.5 + 0.5, spot[1] * 0.5 + 0.5], uRing: [ring / Math.max(1e-6, renderer.Width / Math.max(1, renderer.Height)), ring], uClear: view.Clear || 0.9999, uMix: state.SunlitOn ? 0.14 : 1, uEyeMix: state.SunlitOn ? [1 - Math.exp(-step / 0.07), 1 - Math.exp(-step / 0.4)] : [1, 1]});

				kept = state.Sunlit;
				state.Sunlit = state.SunlitNext;
				state.SunlitNext = kept;
				state.SunlitOn = true;

				readEye();

				return {Shaft: state.ShaftPast.Textures[0], Sunlit: state.Sunlit.Textures[0]};
			},

			/* How bright the picture is, followed by the eye in a second or two; none with an Exposure given. */
			Exposure: function (frame, inputs) {
				var view = frame.View;

				eyeSteps(view, frame.Run, inputs.Color);

				return {Eye: state.Eye && given(view.Exposure, null) === null && view.Sky ? state.Eye.Textures[0] : null};
			},

			Bokeh: function (frame, inputs) {
				return {Color: frame.View.Bokeh > 0 ? bokeh(frame.View, frame.Run, inputs.Color, inputs.Depth, frame.Plain) : inputs.Color};
			},

			/* The glow of what is too bright (above Threshold), down six steps and up again. */
			Bloom: function (frame, inputs, properties) {
				var run = frame.Run;
				var i;

				pass(state.Bloom[0], run.Down, {uColor: inputs.Color, uPixel: [1 / renderer.Width, 1 / renderer.Height], uThreshold: given(properties.Threshold, 0.85)});

				for (i = 1; i < state.Bloom.length; i++)
					pass(state.Bloom[i], run.Down, {uColor: state.Bloom[i - 1].Textures[0], uPixel: [1 / state.Bloom[i - 1].Width, 1 / state.Bloom[i - 1].Height], uThreshold: 0});

				for (i = state.Bloom.length - 1; i > 0; i--)
					pass(state.Bloom[i - 1], run.Up, {uColor: state.Bloom[i].Textures[0], uPixel: [1 / state.Bloom[i].Width, 1 / state.Bloom[i].Height]});

				return {Bloom: state.Bloom[0].Textures[0]};
			},

			/* The picture: the filmic curve, the glow, the mirror, the rays and the flare; on the screen when Present shows it. */
			Picture: function (frame, inputs, properties, block) {
				var view = frame.View;
				var now = frame.Now;
				var rays = frame.Rays;
				var spot = frame.Spot;
				var white = scene.White || inputs.Color;
				var direct = frame.Direct === block.id;
				if (!direct)
					state.Final = target(state.Final, renderer.Width, renderer.Height, {});

				pass(direct ? null : state.Final, frame.Run.Picture, {
					uColor: inputs.Color,
					uDepth: inputs.Depth,
					uBloom: inputs.Bloom || emptyPicture(),
					uPixel: [1 / renderer.Width, 1 / renderer.Height],
					uSharp: frame.Set.Frames ? 0.16 : 0.12,
					uHeat: view.Heat || 0,
					uMirror: inputs.Mirror || white,
					uMirrorOn: inputs.Mirror ? 1 : 0,
					uFlash: now.Flash,
					uShimmer: view.Shimmer || new Array(16).fill(0),
					uTick: scene.Seconds % 1000,
					uEye: inputs.Eye || white,
					uEyeOn: state.Eye && view.Sky ? 1 : 0,
					uExposure: given(view.Exposure, 1),
					uNight: view.Night || 0,
					uNoise: state.Noise || emptyNoise(),
					uGrade: [1 - (view.Veil || 0) * 0.14, 1 - (view.Veil || 0) * 0.05, 1 + (view.Veil || 0) * 0.02, Math.min(0.5, (view.Veil || 0) * 0.5 + (now.Clouds * now.Clouds) * 0.16)],
					uSunColor: view.SunColor || [1, 1, 1],
					uRays: rays * (view.Star ? view.Glare : Math.pow(1 - Math.min(1, now.Fog), 2)),
					uShaft: inputs.Shaft || white,
					uSunlit: inputs.Sunlit || white,
					uFlare: rays ? flareOf() * (view.Glare === undefined ? 1 : view.Glare) : 0,
					uAspect: renderer.Width / Math.max(1, renderer.Height),
					uSpot: [spot[0] * 0.5 + 0.5, spot[1] * 0.5 + 0.5, spot[2]],
					uParallel: scene.Camera.Ortho ? 1 : 0
				});

				return {Color: direct ? frame.Screen : state.Final.Textures[0]};
			},

			/*
			 * A pass of a graph of its own (a pass of the Blueprints Service, its property Graph: a graph, GLSL written by hand
			 * or the URL of a file of it) over Color and Depth, at Scale of the view; its parameters are those of Parameters,
			 * then of the pipeline, then its own. A file that has not come yet passes Color on as it is.
			 */
			Shader: function (frame, inputs, properties, block, parameters) {
				var own = state.Shaders[block.id] = state.Shaders[block.id] || {};
				var scale = Math.max(0.05, Math.min(1, given(properties.Scale, 1)));
				var width = Math.max(1, Math.round(renderer.Width * scale));
				var height = Math.max(1, Math.round(renderer.Height * scale));
				var graph;

				if (own.Source !== properties.Graph) {
					graph = engine.Written(properties.Graph, 'pass');

					if (graph === null)
						return {Color: inputs.Color};

					own.Source = properties.Graph;
					own.Program = null;

					try {
						own.Made = blueprints.Compile(graph);
					}
					catch (error) {
						own.Made = null;

						engine.Told('pass', block.id, [{Block: null, Line: 0, Message: error.message}], error.message);
					}

					/* One that does not compile is told (the event shader of the scene) and passes Color on as it is. */
					if (own.Made && engine.Checked('pass', block.id, own.Made, graphics.Shaders.Quad, own.Made.Fragment))
						own.Program = renderer.Program(graphics.Shaders.Quad, own.Made.Fragment);
				}

				if (!own.Program)
					return {Color: inputs.Color};

				own.Target = target(own.Target, width, height, {Float: true});

				pass(own.Target, own.Program, own.Made.Values(Object.assign({}, parameters, properties.Parameters || {}), {Time: scene.Seconds, Pixel: [1 / width, 1 / height], Textures: {Color: inputs.Color, Depth: inputs.Depth}}));

				return {Color: own.Target.Textures[0]};
			}
		};

		/* A target of this size, the one there when it has it. */
		function target (kept, width, height, options) {
			if (kept && kept.Width === width && kept.Height === height) return kept;

			if (kept)
				kept.Destroy();

			return renderer.Target(width, height, options);
		}

		/* The pipeline of the scene made once for each graph given; one that cannot be made is told once, and the library's runs. */
		function pipeline () {
			var given = self.Pipeline || null;
			var made;
			var present;

			if (state.Pipeline && state.PipelineGiven === given) return state.Pipeline;


			state.PipelineGiven = given;

			try {
				made = blueprints.Compile(given || state.Library || (state.Library = self.PipelineGraph()));
			}
			catch (error) {
				if (window.console && window.console.warn)
					window.console.warn('Elemenx Scene: the Pipeline cannot be made, the picture of the library is drawn: ' + error.message);

				made = blueprints.Compile(state.Library || (state.Library = self.PipelineGraph()));
			}

			present = made.Passes.filter(function (pass) {
				return pass.Type === 'Present';
			})[0];

			state.Direct = present && present.Inputs.Color && made.Passes.some(function (pass) {
				return pass.ID === present.Inputs.Color.Block && pass.Type === 'Picture' && pass.Enabled;
			}) ? present.Inputs.Color.Block : null;
			state.Pipeline = made;

			return made;
		}

		/*
		 * After all was drawn: the picture of it. view {Matrix (of the view, the eye at the origin), Plain (the same with no shake), Sun, SunColor, Air, Fog
		 * (how thick the air is), Sky (true: there is a sky to see the sun in)}.
		 */
		engine.PostEnd = function (view) {
			var set = sets[level()];
			var run = programs();
			var plain = view.Plain || view.Matrix;
			var sun = view.Sun || [0, 1, 0];
			var spot = math.Apply(view.Plain || view.Matrix, sun);
			var made = pipeline();
			var frame = {
				Steps: steps,
				View: view,
				Set: set,
				Run: run,
				Inverse: math.Invert(view.Matrix),
				Plain: plain,
				Sun: sun,
				Spot: spot,
				Now: state.Now2 || calm,
				Rays: (view.Sky && sun[1] > -0.02 || view.Star) && set.Rays && spot[2] < 1 && !scene.Camera.Ortho ? 1 : 0,
				AirLight: view.AirLight === undefined ? Math.max(0.05, Math.min(1, sun[1] * 2.5 + 0.2)) : view.AirLight,
				Direct: state.Direct,
				Screen: state.Screen
			};
			var picture;

			state.Scene.End();

			if (!scene.PostQuad)
				scene.PostQuad = renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});

			picture = made.Run(frame, self.PipelineParameters || {});

			/* A picture that is not on the screen yet (passes after Picture, or none): put there as it is. */
			if (picture !== state.Screen)
				pass(null, run.Copy, {uColor: picture || scene.White || state.Scene.Textures[0]});
		};

		/* Frames late for long: a level down, while nobody asked for one. */
		engine.PostTime = function (elapsed) {
			if (elapsed > 0)
				state.Step = elapsed;

			if (self.Quality || !elapsed) return;

			state.Late = elapsed > 0.03 ? state.Late + 1 : Math.max(0, state.Late - 1);

			/* The guess of low is for a machine with no graphics card: a card that hurries stays where its grass is. */
			if (state.Late > 90 && levels.indexOf(level()) > 1) {
				state.Level = levels[levels.indexOf(level()) - 1];
				state.Late = 0;
			}
		};

		engine.PostDestroy = destroy;
	},

	/* The render graph of the library: the passes of the picture as they always ran, in their order; a Pipeline starts from it. */
	PipelineGraph: function () {
		var blueprints = this.$Service('Blueprints');
		var graph;
		var ids = {};

		graph = blueprints.Create('render', {name: 'Picture'});

		['Scene', 'Clouds', 'Occlusion', 'Air', 'Frames', 'Mirror', 'Rays', 'Exposure', 'Bokeh', 'Bloom', 'Picture', 'Present'].forEach(function (type, index) {
			ids[type] = blueprints.Add(graph, type, {id: type.toLowerCase(), x: 40 + index * 220, y: index % 2 ? 220 : 40}).id;
		});

		[
			['Scene', 'Depth', 'Clouds', 'Depth'], ['Scene', 'Depth', 'Occlusion', 'Depth'],
			['Scene', 'Color', 'Air', 'Color'], ['Scene', 'Depth', 'Air', 'Depth'], ['Clouds', 'Cloud', 'Air', 'Cloud'], ['Occlusion', 'Dark', 'Air', 'Dark'],
			['Air', 'Color', 'Frames', 'Color'], ['Scene', 'Depth', 'Frames', 'Depth'],
			['Frames', 'Color', 'Mirror', 'Color'], ['Scene', 'Depth', 'Mirror', 'Depth'],
			['Scene', 'Depth', 'Rays', 'Depth'], ['Clouds', 'Cloud', 'Rays', 'Cloud'],
			['Frames', 'Color', 'Exposure', 'Color'],
			['Frames', 'Color', 'Bokeh', 'Color'], ['Scene', 'Depth', 'Bokeh', 'Depth'],
			['Bokeh', 'Color', 'Bloom', 'Color'],
			['Bokeh', 'Color', 'Picture', 'Color'], ['Scene', 'Depth', 'Picture', 'Depth'], ['Bloom', 'Bloom', 'Picture', 'Bloom'], ['Mirror', 'Mirror', 'Picture', 'Mirror'], ['Exposure', 'Eye', 'Picture', 'Eye'], ['Rays', 'Shaft', 'Picture', 'Shaft'], ['Rays', 'Sunlit', 'Picture', 'Sunlit'],
			['Picture', 'Color', 'Present', 'Color']
		].forEach(function (link) {
			blueprints.Link(graph, [ids[link[0]], link[1]], [ids[link[2]], link[3]]);
		});

		return graph;
	},

	LightingShaders: function (graphics) {
		var head = '#version 300 es\nprecision highp float;\nprecision highp sampler3D;\n';

		/*
		 * The clouds as they stand in the air: a map of fronts and gaps, the kind of cloud of each place (0 a flat sheet, 0.5 heaps,
		 * 1 towers of a storm) and how it rises, then the billows of the block of noise, their edges eaten by a finer one.
		 */
		var cloudShape = [
			'uniform highp sampler3D uNoise;',
			'uniform vec3 uLayer;',
			'uniform float uCover;',
			'uniform vec3 uShape;',
			'uniform vec2 uDrift;',
			'float lobe(float toward, float g) {',
			'	return (1.0 - g * g) / (12.57 * pow(1.0 + g * g - 2.0 * g * toward, 1.5)) * 6.0;',
			'}',
			'float thick(vec3 p, float fine) {',
			'	float h = clamp((p.y - uLayer.x) / (uLayer.y - uLayer.x), 0.0, 1.0);',
			'	vec2 flat2 = p.xz * uLayer.z + uDrift;',
			'	vec4 big = texture(uNoise, vec3(flat2 * 0.05, 0.31));',
			'	vec4 mid = texture(uNoise, vec3(flat2 * 0.17 + 3.1, 0.62));',
			'	float map = big.b * 0.7 + mid.g * 0.3;',
			'	float amount = clamp((map - mix(0.86, 0.2, uCover)) / 0.2, 0.0, 1.0);',
			'	if (amount <= 0.0) return 0.0;',
			'	float kind = clamp(uShape.x + (mid.b - 0.5) * 0.7, 0.0, 1.0);',
			'	float top = kind < 0.5 ? mix(0.24, 0.62, kind * 2.0) : mix(0.62, 1.0, kind * 2.0 - 1.0);',
			'	float rise = smoothstep(0.0, 0.08, h) * (1.0 - smoothstep(top * 0.55, top * (0.72 + amount * 0.28), h));',
			'	vec4 shape = texture(uNoise, vec3(p.x, p.y * 1.4, p.z) * uLayer.z * 0.42 + vec3(uDrift.x * 2.0, 0.0, uDrift.y * 2.0));',
			'	float body = (shape.r * rise - (1.0 - amount) * 0.9) / max(0.12, amount);',
			'	if (body <= 0.0) return 0.0;',
			'	if (fine > 0.5) {',
			'		vec4 edge = texture(uNoise, vec3(p.x, p.y * 1.2, p.z) * uLayer.z * 2.6 + vec3(uDrift.x, -uDrift.x, uDrift.y) * 6.0);',
			'		vec4 finer = texture(uNoise, vec3(p.z, p.x, p.y * 1.3) * uLayer.z * 7.3 + vec3(uDrift, 0.0) * 9.0);',
			'		body -= (1.0 - edge.g * 0.7 - edge.a * 0.3) * 0.34 * (0.6 + uShape.z) * (1.0 - clamp(body * 1.6, 0.0, 1.0)) + (1.0 - finer.g) * 0.05;',
			'	}',
			'	return clamp(body * 4.2, 0.0, 1.0);',
			'}'
		].join('\n');

		return {
			/* A picture put on the screen as it is: what a pipeline made after its Picture. */
			Copy: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uColor;',
				'out vec4 outColor;',
				'void main() {',
				'	outColor = vec4(texture(uColor, vQuad * 0.5 + 0.5).rgb, 1.0);',
				'}'
			].join('\n'),

			/* A step down: the mean of four, of what is too bright the first time. */
			Down: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uColor;',
				'uniform vec2 uPixel;',
				'uniform float uThreshold;',
				'out vec4 outColor;',
				'void main() {',
				'	vec2 uv = vQuad * 0.5 + 0.5;',
				'	vec3 c = vec3(0.0);',
				'	c += texture(uColor, uv + uPixel * vec2(-1.0, -1.0)).rgb;',
				'	c += texture(uColor, uv + uPixel * vec2(1.0, -1.0)).rgb;',
				'	c += texture(uColor, uv + uPixel * vec2(-1.0, 1.0)).rgb;',
				'	c += texture(uColor, uv + uPixel * vec2(1.0, 1.0)).rgb;',
				'	c *= 0.25;',
				'	if (uThreshold > 0.0) {',
				'		c = pow(max(c, vec3(0.0)), vec3(2.2));',
				'		float bright = max(c.r, max(c.g, c.b));',
				'		c *= smoothstep(uThreshold * 0.8, uThreshold * 1.6, bright);',
				'	}',
				'	outColor = vec4(min(c, vec3(40.0)), 1.0);',
				'}'
			].join('\n'),

			/* A step up: the glow of a smaller texture over the larger one. */
			Up: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uColor;',
				'uniform vec2 uPixel;',
				'out vec4 outColor;',
				'void main() {',
				'	vec2 uv = vQuad * 0.5 + 0.5;',
				'	vec3 c = texture(uColor, uv).rgb * 4.0;',
				'	c += texture(uColor, uv + uPixel * vec2(1.0, 0.0)).rgb * 2.0 + texture(uColor, uv - uPixel * vec2(1.0, 0.0)).rgb * 2.0;',
				'	c += texture(uColor, uv + uPixel * vec2(0.0, 1.0)).rgb * 2.0 + texture(uColor, uv - uPixel * vec2(0.0, 1.0)).rgb * 2.0;',
				'	c += texture(uColor, uv + uPixel).rgb + texture(uColor, uv - uPixel).rgb + texture(uColor, uv + uPixel * vec2(1.0, -1.0)).rgb + texture(uColor, uv + uPixel * vec2(-1.0, 1.0)).rgb;',
				'	outColor = vec4(c / 16.0 * 0.85, 1.0);',
				'}'
			].join('\n'),

			/* A frame mixed with the last one, at the place each point was, and no farther from the colors round it. */
			/* The distance in focus: the one given, or what the middle of the view shows, followed slowly. */
			Focus: head + [
				'uniform sampler2D uDepth;',
				'uniform sampler2D uOld;',
				'uniform mat4 uInverse;',
				'uniform float uMix;',
				'uniform float uFixed;',
				'out vec4 outColor;',
				'float far(vec2 ndc) {',
				'	vec4 p = uInverse * vec4(ndc, texture(uDepth, ndc * 0.5 + 0.5).r * 2.0 - 1.0, 1.0);',
				'	return length(p.xyz / p.w);',
				'}',
				'void main() {',
				'	float seen = min(min(far(vec2(0.0)), far(vec2(0.04, 0.0))), min(far(vec2(-0.04, 0.0)), min(far(vec2(0.0, 0.05)), far(vec2(0.0, -0.05)))));',
				'	float wanted = uFixed > 0.0 ? uFixed : min(seen, 1e6);',
				'	outColor = vec4(uFixed > 0.0 ? wanted : mix(texture(uOld, vec2(0.5)).r, wanted, uMix), 0.0, 0.0, 1.0);',
				'}'
			].join('\n'),

			/* How blurred each pixel is (-1 near to 1 far, 0 in focus), with its color, at half the size. */
			Circle: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uColor;',
				'uniform sampler2D uDepth;',
				'uniform sampler2D uFocus;',
				'uniform mat4 uInverse;',
				'uniform float uOpen;',
				'uniform vec2 uPixel;',
				'out vec4 outColor;',
				'void main() {',
				'	vec2 uv = vQuad * 0.5 + 0.5;',
				'	vec3 color = vec3(0.0);',
				/* Over three pixels each way: the dither of leaves and of what fades does not stay as a grain in the discs. */
				'	for (int y = -1; y <= 1; y++) {',
				'		for (int x = -1; x <= 1; x++)',
				'			color += texture(uColor, uv + vec2(float(x), float(y)) * uPixel * 1.5).rgb;',
				'	}',
				'	color /= 9.0;',
				'	vec4 p = uInverse * vec4(vQuad, texture(uDepth, uv).r * 2.0 - 1.0, 1.0);',
				'	float d = length(p.xyz / p.w);',
				'	float f = max(0.05, texture(uFocus, vec2(0.5)).r);',
				'	outColor = vec4(color, clamp((d - f) / max(d, 1e-3) * (0.6 + uOpen * 2.4), -1.0, 1.0));',
				'}'
			].join('\n'),

			/*
			 * A disc of each pixel: a spiral of samples, each one there as far as its own blur reaches it (what is nearer spreads over what
			 * is behind it, not the other way); a bright one counts more, so a point of light becomes a disc.
			 */
			Disc: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uNear;',
				'uniform vec2 uPixel;',
				'uniform float uRadius;',
				'out vec4 outColor;',
				'void main() {',
				'	vec2 uv = vQuad * 0.5 + 0.5;',
				'	vec4 middle = texture(uNear, uv);',
				'	vec3 sum = middle.rgb;',
				'	float total = 1.0;',
				'	for (int i = 0; i < 48; i++) {',
				'		float r = sqrt((float(i) + 0.5) / 48.0);',
				'		float a = float(i) * 2.39996;',
				'		vec4 s = texture(uNear, uv + vec2(cos(a), sin(a)) * r * uRadius * uPixel);',
				'		float reach = s.a < middle.a ? abs(s.a) : min(abs(s.a), abs(middle.a));',
				'		float w = smoothstep(r - 0.3, r + 0.05, reach) * (1.0 + 3.0 * max(0.0, dot(s.rgb, vec3(0.2126, 0.7152, 0.0722)) - 1.0));',
				'		sum += s.rgb * w;',
				'		total += w;',
				'	}',
				'	outColor = vec4(sum / total, abs(middle.a));',
				'}'
			].join('\n'),

			/* The sharp picture and its discs, by how blurred each pixel is at its full size: the edges in focus stay sharp. */
			Focused: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uColor;',
				'uniform sampler2D uDepth;',
				'uniform sampler2D uDisc;',
				'uniform sampler2D uFocus;',
				'uniform mat4 uInverse;',
				'uniform float uOpen;',
				'uniform vec2 uDiscPixel;',
				'out vec4 outColor;',
				'void main() {',
				'	vec2 uv = vQuad * 0.5 + 0.5;',
				'	vec4 sharp = texture(uColor, uv);',
				'	vec4 p = uInverse * vec4(vQuad, texture(uDepth, uv).r * 2.0 - 1.0, 1.0);',
				'	float d = length(p.xyz / p.w);',
				'	float f = max(0.05, texture(uFocus, vec2(0.5)).r);',
				'	float blur = abs(clamp((d - f) / max(d, 1e-3) * (0.6 + uOpen * 2.4), -1.0, 1.0));',
				'	vec3 disc = (texture(uDisc, uv).rgb * 2.0 + texture(uDisc, uv + uDiscPixel * vec2(0.75, 0.25)).rgb + texture(uDisc, uv - uDiscPixel * vec2(0.75, 0.25)).rgb + texture(uDisc, uv + uDiscPixel * vec2(-0.25, 0.75)).rgb + texture(uDisc, uv - uDiscPixel * vec2(-0.25, 0.75)).rgb) / 6.0;',
				'	outColor = vec4(mix(sharp.rgb, disc, smoothstep(0.04, 0.3, blur)), sharp.a);',
				'}'
			].join('\n'),

			Frames: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uColor;',
				'uniform sampler2D uDepth;',
				'uniform sampler2D uPast;',
				'uniform mat4 uInverse;',
				'uniform mat4 uMatrix;',
				'uniform vec3 uMoved;',
				'uniform float uMix;',
				'uniform vec2 uPixel;',
				'out vec4 outColor;',
				/* What the last frame showed at a place between its pixels, and no softer for that (five samples of Catmull-Rom). */
				'vec3 sharp(vec2 at) {',
				'	vec2 size = 1.0 / uPixel;',
				'	vec2 p = at * size - 0.5;',
				'	vec2 base = floor(p);',
				'	vec2 f = p - base;',
				'	vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f));',
				'	vec2 w1 = 1.0 + f * f * (-2.5 + 1.5 * f);',
				'	vec2 w2 = f * (0.5 + f * (2.0 - 1.5 * f));',
				'	vec2 w3 = f * f * (-0.5 + 0.5 * f);',
				'	vec2 w12 = w1 + w2;',
				'	vec2 middle = (base + 0.5 + w2 / w12) * uPixel;',
				'	vec2 first = (base - 0.5) * uPixel;',
				'	vec2 last = (base + 2.5) * uPixel;',
				'	vec3 sum = texture(uPast, vec2(middle.x, first.y)).rgb * w12.x * w0.y;',
				'	sum += texture(uPast, vec2(first.x, middle.y)).rgb * w0.x * w12.y;',
				'	sum += texture(uPast, middle).rgb * w12.x * w12.y;',
				'	sum += texture(uPast, vec2(last.x, middle.y)).rgb * w3.x * w12.y;',
				'	sum += texture(uPast, vec2(middle.x, last.y)).rgb * w12.x * w3.y;',
				'	return sum / (w12.x * w0.y + w0.x * w12.y + w12.x * w12.y + w3.x * w12.y + w12.x * w3.y);',
				'}',
				'void main() {',
				'	vec2 uv = vQuad * 0.5 + 0.5;',
				'	vec4 seen = texture(uColor, uv);',
				'	vec3 color = seen.rgb;',
				'	vec3 low = color;',
				'	vec3 high = color;',
				'	for (int y = -1; y <= 1; y++) {',
				'		for (int x = -1; x <= 1; x++) {',
				'			vec3 near = texture(uColor, uv + vec2(float(x), float(y)) * uPixel).rgb;',
				'			low = min(low, near);',
				'			high = max(high, near);',
				'		}',
				'	}',
				'	vec4 p = uInverse * vec4(vQuad, texture(uDepth, uv).r * 2.0 - 1.0, 1.0);',
				'	vec4 q = uMatrix * vec4(p.xyz / p.w + uMoved, 1.0);',
				'	vec2 before = q.xy / q.w * 0.5 + 0.5;',
				'	float inside = step(0.0, before.x) * step(0.0, before.y) * step(before.x, 1.0) * step(before.y, 1.0);',
				/*
				 * What moves by itself is marked by its alpha, and only the view is known to have moved. Its history is not where the view
				 * says: it takes a little, from where it is on the screen, as a body the view follows stays there. And what it has just left
				 * shows no history at all, or the body would trail after itself; the alpha of the frames keeps where it was.
				 */
				'	float moving = 1.0 - step(0.5, seen.a);',
				'	float was = max(texture(uPast, before).a, max(max(texture(uPast, before + vec2(uPixel.x, 0.0)).a, texture(uPast, before - vec2(uPixel.x, 0.0)).a), max(texture(uPast, before + vec2(0.0, uPixel.y)).a, texture(uPast, before - vec2(0.0, uPixel.y)).a)));',
				'	vec3 past = clamp(sharp(moving > 0.5 ? uv : before), low, high);',
				'	float keep = moving > 0.5 ? 0.3 : 1.0 - step(0.25, was);',
				'	outColor = vec4(mix(color, past, uMix * inside * keep), moving);',
				'}'
			].join('\n'),

			/* The light a place of a field gives away: the sun on it, as far as nothing stands before it, and what already came. */
			FieldLit: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uSurface;',
				'uniform sampler2D uGlow;',
				'uniform vec3 uSun;',
				'uniform vec3 uSunColor;',
				'uniform float uSize;',
				'out vec4 outColor;',
				'void main() {',
				'	vec2 uv = vQuad * 0.5 + 0.5;',
				'	vec4 here = texture(uSurface, uv);',
				'	float pixel = 1.0 / 256.0;',
				'	float across = uSize * pixel * 2.0;',
				'	vec3 n = normalize(vec3(texture(uSurface, uv - vec2(pixel, 0.0)).a - texture(uSurface, uv + vec2(pixel, 0.0)).a, across, texture(uSurface, uv - vec2(0.0, pixel)).a - texture(uSurface, uv + vec2(0.0, pixel)).a));',
				'	float seen = 1.0;',
				'	for (int i = 1; i <= 12 && uSun.y > 0.0; i++) {',
				'		float t = float(i * i) * 0.7;',
				'		if (texture(uSurface, uv + uSun.xz * t / uSize).a > here.a + uSun.y * t + 0.4) {',
				'			seen = 0.0;',
				'			break;',
				'		}',
				'	}',
				'	vec3 albedo = pow(here.rgb, vec3(2.2));',
				'	outColor = vec4(albedo * (uSunColor * 1.35 * max(dot(n, uSun), 0.0) * seen + texture(uGlow, uv).rgb * 0.8), 1.0);',
				'}'
			].join('\n'),

			/*
			 * The light that comes to a place: along twelve ways, farther and farther, what rises over the horizon so far hides
			 * that much of the sky and gives its own light. a: the sky it sees; under leaves, less for what stands over it.
			 */
			FieldGlow: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uSurface;',
				'uniform sampler2D uBare;',
				'uniform sampler2D uLit;',
				'uniform float uSize;',
				'out vec4 outColor;',
				'void main() {',
				'	vec2 uv = vQuad * 0.5 + 0.5;',
				'	float height = texture(uSurface, uv).a;',
				'	float cover = smoothstep(0.6, 4.0, height - texture(uBare, uv).a);',
				'	vec3 gathered = vec3(0.0);',
				'	float sky = 0.0;',
				'	for (int way = 0; way < 12; way++) {',
				'		float angle = float(way) * 0.5235988 + 0.26;',
				'		vec2 along = vec2(cos(angle), sin(angle));',
				'		float horizon = 0.0;',
				'		float t = 3.0;',
				'		for (int i = 0; i < 8; i++) {',
				'			vec2 at = uv + along * t / uSize;',
				'			float rise = texture(uSurface, at).a - height - 0.3;',
				'			float slope = rise / sqrt(t * t + rise * rise);',
				'			if (slope > horizon) {',
				'				gathered += texture(uLit, at).rgb * (slope - horizon);',
				'				horizon = slope;',
				'			}',
				'			t *= 1.6;',
				'		}',
				'		sky += 1.0 - horizon;',
				'	}',
				'	outColor = vec4(gathered / 12.0 * 2.2, sky / 12.0 * (1.0 - cover * 0.5));',
				'}'
			].join('\n'),

			/* The sky on the way from a point to the sun: nothing where something stands between, a beam where it does not. */
			Shafts: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uDepth;',
				'uniform vec2 uSpot;',
				'uniform vec2 uSize;',
				'uniform float uClear;',
				'out vec4 outColor;',
				'void main() {',
				'	vec2 uv = vQuad * 0.5 + 0.5;',
				'	vec2 way = uSpot - uv;',
				'	float shift = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));',
				'	float sum = 0.0;',
				'	float weight = 0.0;',
				'	for (int i = 0; i < 36; i++) {',
				'		float t = (float(i) + shift) / 36.0;',
				'		vec2 at = uv + way * t;',
				'		float near = exp(-t * -1.6) * 0.2;',
				'		float inside = step(0.0, at.x) * step(0.0, at.y) * step(at.x, 1.0) * step(at.y, 1.0);',
				'		sum += inside * step(uClear, texture(uDepth, at).r) * near;',
				'		weight += near;',
				'	}',
				'	float far = length(way * uSize);',
				'	float beam = sum / weight * exp(-far * 2.4);',
				'	outColor = vec4(vec3(beam * beam * 1.1), 1.0);',
				'}'
			].join('\n'),

			/*
			 * Clouds: a ray through their layer, in strides from where it enters, each step asking how thick the air is there
			 * and how much of it lies towards the sun. What stands nearer than the cloud hides it.
			 */
			Clouds: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uDepth;',
				'uniform mat4 uInverse;',
				'uniform mat3 uTurn;',
				'uniform vec3 uFrom;',
				'uniform vec3 uSunWay;',
				'uniform vec3 uSunLight;',
				'uniform vec3 uSkyTone;',
				'uniform vec3 uUnder;',
				'uniform vec3 uBelow;',
				'uniform vec3 uBelowWay;',
				'uniform vec3 uBolt;',
				'uniform vec4 uHaze;',
				'uniform float uStep;',
				'uniform float uBehind;',
				'uniform int uSteps;',
				'out vec4 outColor;',
				cloudShape,
				'void main() {',
				'	vec4 far = uInverse * vec4(vQuad, 1.0, 1.0);',
				'	vec3 ray = normalize(uTurn * (far.xyz / far.w));',
				'	float depth = texture(uDepth, vQuad * 0.5 + 0.5).r;',
				'	vec4 hit = uInverse * vec4(vQuad, depth * 2.0 - 1.0, 1.0);',
				/* From the ground the sky is behind all that stands: it needs no depth, and leaves no halo round leaves. */
				'	float stops = uBehind > 0.5 || depth >= 1.0 ? 1e12 : length(hit.xyz / hit.w);',
				'	float a = (uLayer.x - uFrom.y) / ray.y;',
				'	float b = (uLayer.y - uFrom.y) / ray.y;',
				'	float enter = max(min(a, b), 0.0);',
				'	float reach = (uLayer.y - uLayer.x) * 30.0;',
				'	float leave = min(max(a, b), min(stops, reach));',
				'	outColor = vec4(0.0);',
				'	if (leave <= enter || uCover <= 0.0) return;',
				'	float stride = min(leave - enter, (uLayer.y - uLayer.x) * 2.2) / float(uSteps);',
				'	float t = enter + stride * fract(fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) + uStep * 0.618034);',
				'	float toward = dot(ray, uSunWay);',
				/* Light goes on through a cloud mostly as it came, a little goes back: the edge by the sun is silver. */
				'	float phase = 0.55 * lobe(toward, 0.72) + 0.45 * lobe(toward, -0.2) + 0.32;',
				'	float thickness = uLayer.y - uLayer.x;',
				/* The towns light the bellies of the clouds, most of all over them. */
				'	vec3 below = uBelow * (uBelowWay.z > 0.5 ? pow(dot(normalize(ray.xz + vec2(1e-5)), uBelowWay.xy) * 0.5 + 0.5, 2.0) : 1.0);',
				'	vec3 sum = vec3(0.0);',
				'	float seen = 1.0;',
				'	for (int i = 0; i < uSteps && seen > 0.02; i++) {',
				'		vec3 p = uFrom + ray * t;',
				'		float d = thick(p, 1.0);',
				'		if (d > 0.01) {',
				'			float lit = thick(p + uSunWay * thickness * 0.07, 0.0) + thick(p + uSunWay * thickness * 0.18, 0.0) * 0.9 + thick(p + uSunWay * thickness * 0.4, 0.0) * 0.8;',
				'			float h = clamp((p.y - uLayer.x) / thickness, 0.0, 1.0);',
				/* Light through it, and the sky on it: the belly of a cloud is dark, its top bright; a low sun lights it from under. */
				'			float through = (exp(-lit * 2.4) + 0.32 * exp(-lit * 0.5)) * (1.0 - exp(-(lit + d) * 2.6)) * 1.5;',
				/* Thick cloud shuts the sky out too: the belly of a storm goes dark, and shows its folds. */
				'			vec3 tone = uSunLight * through * phase + uSkyTone * (0.3 + 0.8 * h) * (0.28 + 0.72 * exp(-lit * 0.55)) + uUnder * pow(1.0 - h, 2.0) * (0.3 + 0.7 * pow(toward * 0.5 + 0.5, 3.0)) ;',
				/* What lies under a place of a cloud shades it from the towns: that is what draws its folds. */
				'			if (uBolt.z > 0.0) tone += vec3(0.75, 0.8, 1.0) * uBolt.z * 1.6 * pow(max(dot(normalize(ray.xz + vec2(1e-5)), uBolt.xy), 0.0), 6.0);',
				'			if (below.r + below.g > 0.001) tone += below * 0.2 * pow(1.0 - h, 1.5) * exp(-thick(p - vec3(0.0, thickness * 0.14, 0.0), 0.0) * 5.0);',
				'			tone = mix(tone, uHaze.rgb * (0.82 + 0.3 * h), uHaze.a * (0.75 + 0.25 * exp(-lit * 0.4)));',
				'			float take = 1.0 - exp(-d * stride / thickness * 8.0);',
				'			sum += tone * take * seen;',
				'			seen *= 1.0 - take;',
				'		}',
				'		t += stride;',
				'		if (t > leave) break;',
				'	}',
				/* High thin clouds, over all the others, drawn out along the wind. */
				'	if (uShape.y > 0.01 && uBehind > 0.5 && ray.y > 0.03) {',
				'		vec2 place = (uFrom.xz + ray.xz * (uLayer.y * 1.8 - uFrom.y) / ray.y) * uLayer.z * 0.06 + uDrift * 0.5;',
				'		float wisp = texture(uNoise, vec3(place.x * 0.4, place.y * 1.3, 0.2)).b * 0.7 + texture(uNoise, vec3(place * 3.1, 0.7)).g * 0.3;',
				'		float thin = smoothstep(0.52, 0.86, wisp) * uShape.y * 0.75 * smoothstep(0.03, 0.2, ray.y) * seen;',
				'		sum += (uSunLight * (0.5 + 0.5 * phase) + uSkyTone * 0.9 + uUnder * 0.5) * thin;',
				'		seen *= 1.0 - thin;',
				'	}',
				'	float fade = 1.0 - smoothstep(reach * 0.45, reach, enter);',
				'	outColor = vec4(sum * fade, (1.0 - seen) * fade);',
				'}'
			].join('\n'),

			/* The logarithm of how bright the picture is, in a few texels: their mips average it. */
			Measure: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uColor;',
				'out vec4 outColor;',
				'void main() {',
				'	vec2 uv = vQuad * 0.5 + 0.5;',
				'	float sum = 0.0;',
				'	for (int x = 0; x < 3; x++) {',
				'		for (int y = 0; y < 3; y++) {',
				'			vec2 at = uv + (vec2(float(x), float(y)) - 1.0) * vec2(0.01, 0.018);',
				'			float bright = dot(textureLod(uColor, at, 0.0).rgb, vec3(0.3, 0.59, 0.11));',
				'			sum += log((bright > 0.0 ? min(bright, 100.0) : 0.0) + 0.002);',
				'		}',
				'	}',
				'	outColor = vec4(vec3(sum / 9.0), 1.0);',
				'}'
			].join('\n'),

			/* The eye follows the picture. */
			Adapt: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uMeasure;',
				'uniform sampler2D uOld;',
				'uniform float uMix;',
				'out vec4 outColor;',
				'void main() {',
				/* What is not a number once would stay in the eye for good. */
				'	float old = texture(uOld, vec2(0.5)).r;',
				'	float seen = textureLod(uMeasure, vec2(0.5), 8.0).r;',
				'	if (!(seen > -9.0)) seen = -6.2;',
				'	if (!(old > -9.0)) old = seen;',
				'	outColor = vec4(vec3(mix(old, seen, uMix)), 1.0);',
				'}'
			].join('\n'),

			/* What the clouds hold over a place of the land, for their shadows. */
			CloudMap: head + [
				'in vec2 vQuad;',
				'uniform vec3 uFrom;',
				'uniform float uSpan;',
				'out vec4 outColor;',
				cloudShape,
				'void main() {',
				'	vec2 place = uFrom.xz + vQuad * 0.5 * uSpan;',
				'	float low = uLayer.x + (uLayer.y - uLayer.x) * 0.2;',
				'	float high = uLayer.x + (uLayer.y - uLayer.x) * 0.5;',
				'	float held = thick(vec3(place.x, low, place.y), 0.0) + thick(vec3(place.x, high, place.y), 0.0);',
				'	outColor = vec4(vec3(1.0 - exp(-held * 3.5)), 1.0);',
				'}'
			].join('\n'),

			/* The bolt of a strike. */
			BoltVertex: head + [
				'in vec3 aPosition;',
				'uniform mat4 uViewProjection;',
				'void main() {',
				'	gl_Position = uViewProjection * vec4(aPosition, 1.0);',
				'}'
			].join('\n'),

			Bolt: head + [
				'uniform vec3 uColor;',
				'out vec4 outColor;',
				'void main() {',
				'	outColor = vec4(uColor, 1.0);',
				'}'
			].join('\n'),

			/* Clouds of this frame over those of the last ones, at the place of the sky they were. */
			CloudFrames: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uNew;',
				'uniform sampler2D uOld;',
				'uniform mat4 uInverse;',
				'uniform mat4 uMatrix;',
				'uniform float uMix;',
				'uniform vec2 uPixel;',
				'out vec4 outColor;',
				'void main() {',
				'	vec2 uv = vQuad * 0.5 + 0.5;',
				'	vec4 far = uInverse * vec4(vQuad, 1.0, 1.0);',
				'	vec4 past = uMatrix * vec4(normalize(far.xyz / far.w) * 1000.0, 1.0);',
				'	vec2 before = past.xy / past.w * 0.5 + 0.5;',
				'	float inside = step(0.0, past.w) * step(0.0, before.x) * step(0.0, before.y) * step(before.x, 1.0) * step(before.y, 1.0);',
				'	vec4 fresh = texture(uNew, uv);',
				'	vec4 low = fresh;',
				'	vec4 high = fresh;',
				'	for (int y = -1; y <= 1; y++) {',
				'		for (int x = -1; x <= 1; x++) {',
				'			vec4 near = texture(uNew, uv + vec2(float(x), float(y)) * uPixel);',
				'			low = min(low, near);',
				'			high = max(high, near);',
				'		}',
				'	}',
				/* This goes by the sky alone: where a body passed before it, its shape would stay in the old frames with nothing to clear it. */
				'	vec4 spread = (high - low) * 0.25;',
				'	outColor = mix(fresh, clamp(texture(uOld, before), low - spread, high + spread), uMix * inside);',
				'}'
			].join('\n'),

			/*
			 * All that hangs on the depth of a frame: the dark of corners, the air, the clouds behind what stands. It comes before
			 * the frames add up: the view shakes by less than a pixel, and after them each edge would tremble with it.
			 */
			Air: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uColor;',
				'uniform sampler2D uDepth;',
				'uniform sampler2D uDark;',
				'uniform float uDarkOn;',
				'uniform mat4 uInverse;',
				'uniform vec3 uSun;',
				'uniform vec3 uSunColor;',
				'uniform vec4 uAir;',
				'uniform float uFog;',
				'uniform float uParallel;',
				'uniform sampler2D uCloud;',
				'uniform float uCover;',
				'uniform float uFogSky;',
				'uniform vec3 uFogLow;',
				'uniform float uAirLight;',
				'uniform vec3 uAirGlow;',
				'uniform float uVeil;',
				'uniform vec3 uVeilMove;',
				'uniform highp sampler3D uNoise;',
				'uniform float uBehind;',
				'out vec4 outColor;',
				'void main() {',
				'	vec2 uv = vQuad * 0.5 + 0.5;',
				'	vec4 given = texture(uColor, uv);',
				'	vec3 color = pow(max(given.rgb, vec3(0.0)), vec3(2.2));',
				'	float depth = texture(uDepth, uv).r;',
				'	vec4 p = uInverse * vec4(vQuad, depth * 2.0 - 1.0, 1.0);',
				'	vec3 place = p.xyz / p.w;',
				'	if (uDarkOn > 0.5 && depth < 1.0) color *= mix(1.0, texture(uDark, uv).r, 0.85);',
				/* Thick air hides the sky too. */
				'	if (uFogSky > 0.0 && depth >= 1.0) color = mix(color, pow(mix(uAir.rgb, vec3(1.0), 0.55), vec3(2.2)) * uAirLight + pow(uAirGlow, vec3(2.2)) * 0.3, uFogSky);',
				'	if (uFog > 0.0 && depth < 1.0 && uParallel < 0.5) {',
				'		float far = length(place);',
				'		vec3 way = place / far;',
				/* The fog of a weather lies low: what a ray meets of it falls with the height the ray climbs to. */
				'		float climb = place.y * uFogLow.y;',
				'		float low = uFogLow.z > 0.0 ? uFogLow.z * exp(-uFogLow.x * uFogLow.y) * (abs(climb) < 0.01 ? 1.0 : (1.0 - exp(-climb)) / climb) : 0.0;',
				/* Rain does not lie even: its sheets go past with the wind, and what is far comes and goes behind them. */
				'		float sheets = uVeil > 0.01 ? 0.72 + 0.56 * texture(uNoise, vec3(way.x * 1.6 + uVeilMove.x, way.y * 0.8, way.z * 1.6 + uVeilMove.y) + vec3(0.0, uVeilMove.z, 0.0)).b : 1.0;',
				'		float air = 1.0 - exp(-far * (uFog * sheets + low));',
				'		vec3 sky = pow(mix(uAir.rgb, vec3(1.0), 0.4), vec3(2.2)) * uAirLight + pow(uAirGlow, vec3(2.2)) * 0.3;',
				'		sky += uSunColor * pow(max(dot(way, uSun), 0.0), 8.0) * 0.6;',
				'		color = mix(color, sky, air);',
				'	}',
				'	if (uCover > 0.0 && (uBehind < 0.5 || depth >= 1.0)) {',
				'		vec4 cloud = texture(uCloud, uv);',
				'		color = color * (1.0 - cloud.a) + cloud.rgb;',
				'	}',
				/* Far off, what stands melts into a sky of the same air: there is no line between them. */
				'	if (uVeil > 0.01 && depth >= 1.0 && uParallel < 0.5) {',
				'		vec3 ray = normalize(place);',
				'		color = mix(color, pow(mix(uAir.rgb, vec3(1.0), 0.4), vec3(2.2)) * uAirLight + pow(uAirGlow, vec3(2.2)) * 0.3, min(0.96, uVeil * 2.4) * exp(-max(ray.y, 0.0) * 5.0));',
				'	}',
				'	outColor = vec4(pow(max(color, vec3(0.0)), vec3(1.0 / 2.2)), given.a);',
				'}'
			].join('\n'),

			/* How much of a sun is seen: a few places round it, the clouds before it, and the last frames, so a leaf does not flash it. */
			Sunlit: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uDepth;',
				'uniform sampler2D uCloud;',
				'uniform sampler2D uOld;',
				'uniform vec2 uSpot;',
				'uniform vec2 uRing;',
				'uniform float uClear;',
				'uniform float uMix;',
				'uniform vec2 uEyeMix;',
				'out vec4 outColor;',
				'void main() {',
				'	float seen = 0.0;',
				'	float shut = 0.0;',
				'	for (int i = 0; i < 8; i++) {',
				'		float a = float(i) * 0.7854;',
				'		vec2 at = clamp(uSpot + vec2(cos(a), sin(a)) * uRing, 0.0, 1.0);',
				'		seen += step(uClear, texture(uDepth, at).r);',
				'		shut += texture(uCloud, at).a;',
				'	}',
				/* Past the edge of the frame it is seen by what of it is left there: not all at once. */
				'	vec2 past = abs(uSpot - 0.5);',
				'	float now = seen / 8.0 * (1.0 - shut / 8.0) * (1.0 - smoothstep(0.5 + uRing.y, 1.1 + uRing.y, max(past.x, past.y)));',
				/* What the lens shows goes with the sun; the eye, in green, shuts at once and opens slowly. */
				'	vec4 old = texture(uOld, vec2(0.5));',
				'	outColor = vec4(mix(old.r, now, uMix), mix(old.g, now, now > old.g ? uEyeMix.x : uEyeMix.y), 0.0, 1.0);',
				'}'
			].join('\n'),

			/*
			 * What falls: each drop or flake a quad of its own, in a box of air that goes with the eye and wraps round it, so
			 * they stand in the world and stay behind as the eye moves. A flake falls at a speed of its own, and drifts.
			 */
			FallVertex: head + [
				'in vec3 aPosition;',
				'in vec3 aNormal;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uEye;',
				'uniform vec3 uBox;',
				'uniform vec2 uWind;',
				'uniform vec2 uPath;',
				'uniform float uTime;',
				'uniform float uSnow;',
				'out vec2 vAt;',
				'out float vFar;',
				'void main() {',
				'	vec3 seed = aNormal;',
				'	float speed = uSnow > 0.5 ? 0.45 + seed.z * seed.z * 1.5 : 16.0 + seed.z * 7.0;',
				'	vec3 p = seed * uBox;',
				'	p.y -= speed * uTime;',
				'	p.xz += uPath * (uSnow > 0.5 ? 0.45 : 1.0);',
				'	if (uSnow > 0.5) {',
				'		p.x += sin(uTime * (0.5 + seed.x) + seed.y * 40.0) * 0.5;',
				'		p.z += cos(uTime * (0.4 + seed.z) + seed.x * 30.0) * 0.5;',
				'	}',
				'	vec3 at = mod(p - uEye, uBox) - uBox * 0.5;',
				'	vec3 way = normalize(vec3(uWind.x, -speed, uWind.y));',
				'	vec3 side = normalize(cross(way, at + vec3(0.001, 0.0, 0.0)));',
				'	vec3 world;',
				'	if (uSnow > 0.5) {',
				'		vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), at + vec3(0.001, 0.0, 0.0)));',
				'		vec3 up = normalize(cross(at, right));',
				'		world = at + (right * aPosition.x + up * (aPosition.y * 2.0 - 1.0)) * (0.024 + seed.x * seed.x * 0.05) * min(1.0, length(at) / 3.0);',
				'	}',
				'	else {',
				'		world = at + side * aPosition.x * 0.011 + way * aPosition.y * (0.45 + seed.x * 0.55);',
				'	}',
				'	vAt = vec2(aPosition.x, aPosition.y * 2.0 - 1.0);',
				'	vFar = length(at) / length(uBox);',
				'	gl_Position = uViewProjection * vec4(world, 1.0);',
				'}'
			].join('\n'),

			Fall: head + [
				'in vec2 vAt;',
				'in float vFar;',
				'uniform vec3 uTone;',
				'uniform float uSnow;',
				'uniform float uAmount;',
				'out vec4 outColor;',
				'void main() {',
				'	float edge = uSnow > 0.5 ? 1.0 - smoothstep(0.3, 1.0, length(vAt)) : (1.0 - abs(vAt.x)) * (1.0 - vAt.y * vAt.y);',
				'	outColor = vec4(uTone, edge * (uSnow > 0.5 ? 0.95 : 0.36) * uAmount * (1.0 - smoothstep(0.32, 0.5, vFar)) * smoothstep(0.015, 0.07, vFar));',
				'}'
			].join('\n'),

			/*
			 * What a glossy surface mirrors: from a point along its reflection, in strides that grow, until the ray goes behind
			 * what is on the screen; past the screen, the sky. How glossy a point is comes in the alpha of the scene.
			 */
			Mirror: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uColor;',
				'uniform sampler2D uDepth;',
				'uniform sampler2D uMask;',
				'uniform mat4 uInverse;',
				'uniform mat4 uMatrix;',
				'uniform vec4 uAir;',
				'uniform float uAirLight;',
				'uniform vec3 uAirGlow;',
				'out vec4 outColor;',
				'vec3 place(vec2 uv) {',
				'	vec4 p = uInverse * vec4(uv * 2.0 - 1.0, texture(uDepth, uv).r * 2.0 - 1.0, 1.0);',
				'	return p.xyz / p.w;',
				'}',
				'void main() {',
				'	vec2 uv = vQuad * 0.5 + 0.5;',
				/* The edge of a body against what is behind it comes smoothed, between their values: nothing mirrors by a body, the rest as what is whole. */
				'	ivec2 top = textureSize(uMask, 0) - 1;',
				'	ivec2 texel = ivec2(gl_FragCoord.xy) * 2;',
				'	float mask = texelFetch(uMask, clamp(texel, ivec2(0), top), 0).a;',
				'	float near = mask;',
				'	ivec2 sides[4] = ivec2[4](ivec2(2, 0), ivec2(-2, 0), ivec2(0, 2), ivec2(0, -2));',
				'	for (int i = 0; i < 4; i++) {',
				'		float side = texelFetch(uMask, clamp(texel + sides[i], ivec2(0), top), 0).a;',
				'		near = min(near, side);',
				'		mask = max(mask, side);',
				'	}',
				'	float gloss = clamp((1.0 - mask) / 0.45, 0.0, 1.0);',
				'	float depth = texture(uDepth, uv).r;',
				'	outColor = vec4(0.0);',
				'	if (depth >= 1.0 || gloss < 0.02 || near < 0.5) return;',
				'	vec3 p = place(uv);',
				'	vec3 n = normalize(cross(dFdx(p), dFdy(p)));',
				'	vec3 v = normalize(p);',
				'	if (dot(n, v) > 0.0) n = -n;',
				'	vec3 r = reflect(v, n);',
				'	vec3 found = mix(mix(uAir.rgb, vec3(1.0), 0.5), uAir.rgb * vec3(0.38, 0.55, 1.0), pow(max(r.y, 0.0), 0.5)) * uAirLight + uAirGlow * 0.2;',
				'	float stride = max(length(p) * 0.015, 0.05);',
				'	vec3 at = p + n * 0.02;',
				'	for (int i = 0; i < 26; i++) {',
				'		at += r * stride;',
				'		vec4 s = uMatrix * vec4(at, 1.0);',
				'		vec2 suv = s.xy / s.w * 0.5 + 0.5;',
				'		if (s.w <= 0.0 || suv.x < 0.0 || suv.y < 0.0 || suv.x > 1.0 || suv.y > 1.0) break;',
				'		float there = texture(uDepth, suv).r;',
				'		float through = length(at) - length(place(suv));',
				'		if (there < 1.0 && through > 0.0 && through < stride * 2.5) {',
				'			vec2 edge = smoothstep(vec2(0.0), vec2(0.1), min(suv, 1.0 - suv));',
				'			found = mix(found, texture(uColor, suv).rgb, edge.x * edge.y);',
				'			break;',
				'		}',
				'		stride *= 1.14;',
				'	}',
				'	outColor = vec4(found, gloss);',
				'}'
			].join('\n'),

			/* How much of the sky a point sees: a spiral of samples round it, of the depth. */
			Dark: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uDepth;',
				'uniform mat4 uInverse;',
				'uniform mat4 uMatrix;',
				'uniform float uReach;',
				'uniform vec3 uSunWay;',
				'uniform float uSunOn;',
				'uniform float uSeed;',
				'out vec4 outColor;',
				'vec3 place(vec2 uv) {',
				'	vec4 p = uInverse * vec4(uv * 2.0 - 1.0, texture(uDepth, uv).r * 2.0 - 1.0, 1.0);',
				'	return p.xyz / p.w;',
				'}',
				'void main() {',
				'	vec2 uv = vQuad * 0.5 + 0.5;',
				'	float depth = texture(uDepth, uv).r;',
				'	if (depth >= 1.0) { outColor = vec4(1.0); return; }',
				'	vec3 p = place(uv);',
				'	vec3 n = normalize(cross(dFdx(p), dFdy(p)));',
				'	if (dot(n, p) > 0.0) n = -n;',
				'	float noise = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));',
				'	float reach = uReach;',
				'	float dark = 0.0;',
				'	for (int i = 0; i < 10; i++) {',
				'		float t = (float(i) + 0.5) / 10.0;',
				'		float angle = t * 15.0 + noise * 6.2831853;',
				'		vec3 way = vec3(cos(angle), sin(angle), cos(angle * 1.7)) * sqrt(t) * reach;',
				'		if (dot(way, n) < 0.0) way = -way;',
				'		vec3 at = p + way + n * reach * 0.05;',
				'		vec4 s = uMatrix * vec4(at, 1.0);',
				'		vec2 suv = s.xy / s.w * 0.5 + 0.5;',
				'		if (suv.x < 0.0 || suv.y < 0.0 || suv.x > 1.0 || suv.y > 1.0) continue;',
				'		vec3 q = place(suv);',
				'		float near = length(q) + reach * 0.03 < length(at) ? 1.0 : 0.0;',
				'		dark += near * smoothstep(reach * 2.0, reach * 0.5, abs(length(q) - length(p)));',
				'	}',
				/* A short way to the sun on the screen: what the shadow maps are too coarse for, under a foot, in a fold. */
				'	float touch = 0.0;',
				'	if (uSunOn > 0.02) {',
				'		for (int i = 0; i < 8; i++) {',
				'			vec3 at = p + n * reach * 0.02 + uSunWay * reach * 0.3 * (float(i) + noise) / 8.0;',
				'			vec4 s = uMatrix * vec4(at, 1.0);',
				'			vec2 suv = s.xy / s.w * 0.5 + 0.5;',
				'			if (s.w <= 0.0 || suv.x < 0.0 || suv.y < 0.0 || suv.x > 1.0 || suv.y > 1.0) break;',
				'			float gap = length(at) - length(place(suv));',
				'			if (gap > reach * 0.015 && gap < reach * 0.3) {',
				'				touch = 1.0;',
				'				break;',
				'			}',
				'		}',
				'	}',
				'	outColor = vec4(vec3((1.0 - dark / 10.0) * (1.0 - touch * uSunOn * 0.5)), 1.0);',
				'}'
			].join('\n'),

			/* The dark of a point with its neighbours that are as far: no noise, and edges stay. */
			Soft: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uColor;',
				'uniform sampler2D uDepth;',
				'uniform vec2 uPixel;',
				'out vec4 outColor;',
				'void main() {',
				'	vec2 uv = vQuad * 0.5 + 0.5;',
				'	float depth = texture(uDepth, uv).r;',
				'	float sum = 0.0;',
				'	float weight = 0.0;',
				'	for (int y = -2; y <= 2; y++) {',
				'		for (int x = -2; x <= 2; x++) {',
				'			vec2 at = uv + vec2(float(x), float(y)) * uPixel;',
				'			float w = exp(-abs(texture(uDepth, at).r - depth) * 800.0);',
				'			sum += texture(uColor, at).r * w;',
				'			weight += w;',
				'		}',
				'	}',
				'	outColor = vec4(vec3(sum / max(weight, 0.001)), 1.0);',
				'}'
			].join('\n'),

			Picture: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uColor;',
				'uniform sampler2D uBloom;',
				'uniform vec3 uSun;',
				'uniform vec3 uSunColor;',
				'uniform float uRays;',
				'uniform sampler2D uShaft;',
				'uniform sampler2D uSunlit;',
				'uniform float uFlare;',
				'uniform float uAspect;',
				'uniform vec3 uSpot;',
				'uniform vec2 uPixel;',
				'uniform float uSharp;',
				'uniform float uHeat;',
				'uniform sampler2D uMirror;',
				'uniform float uMirrorOn;',
				'uniform float uFlash;',
				'uniform vec4 uShimmer[4];',
				'uniform float uTick;',
				'uniform sampler2D uEye;',
				'uniform float uEyeOn;',
				'uniform float uExposure;',
				'uniform float uNight;',
				'uniform vec4 uGrade;',
				'uniform highp sampler3D uNoise;',
				'out vec4 outColor;',
				'vec3 aces(vec3 x) {',
				'	return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);',
				'}',
				'vec3 decoded(vec2 uv) {',
				'	return pow(max(texture(uColor, uv).rgb, vec3(0.0)), vec3(2.2));',
				'}',
				'void main() {',
				'	vec2 uv = vQuad * 0.5 + 0.5;',
				/* Over what burns the air trembles: it bends the picture behind it. */
				'	for (int i = 0; i < 4; i++) {',
				'		if (uShimmer[i].a > 0.0) {',
				'			float near = 1.0 - smoothstep(0.0, uShimmer[i].z, length((uv - uShimmer[i].xy) * vec2(1.0, 0.55)));',
				'			if (near > 0.0) uv += (texture(uNoise, vec3(uv * vec2(22.0, 9.0) - vec2(0.0, uTick * 0.9), uTick * 0.3)).gb - 0.5) * 0.0028 * near * uShimmer[i].a;',
				'		}',
				'	}',
				'	vec3 color = decoded(uv);',
				'	vec3 round = decoded(uv + vec2(uPixel.x, 0.0)) + decoded(uv - vec2(uPixel.x, 0.0)) + decoded(uv + vec2(0.0, uPixel.y)) + decoded(uv - vec2(0.0, uPixel.y));',
				'	color = max(color + (color - round * 0.25) * uSharp, vec3(0.0));',
				'	if (uMirrorOn > 0.5) {',
				'		vec4 mirrored = texture(uMirror, uv);',
				'		color = mix(color, pow(max(mirrored.rgb, vec3(0.0)), vec3(2.2)), mirrored.a);',
				'	}',
				/* A grey day takes the color out of things. */
				'	if (uGrade.a > 0.0) color = mix(color, vec3(dot(color, vec3(0.3, 0.59, 0.11))), uGrade.a) * uGrade.rgb;',
				'	color += vec3(0.75, 0.8, 1.0) * uFlash;',
				'	if (uRays > 0.0) {',
				'		color += uSunColor * texture(uShaft, uv).rgb * 0.75 * texture(uSunlit, vec2(0.5)).r * 2.0 * uRays;',
				'	}',
				/* What the glass of a lens makes of a sun in view: a glow, and rings along the line through the middle. */
				'	if (uFlare > 0.0) {',
				/* A sun that leaves the frame fades with how far it went: the eye does not open at once. */
				'		vec2 past = abs(uSpot.xy - 0.5);',
				'		float seen = texture(uSunlit, vec2(0.5)).r * (1.0 - smoothstep(0.42, 0.95, max(past.x, past.y)));',
				'		vec2 from = (uv - 0.5) * vec2(uAspect, 1.0);',
				'		vec2 spot = (uSpot.xy - 0.5) * vec2(uAspect, 1.0);',
				'		vec3 lens = vec3(0.0);',
				/* The ghosts of the glass along the line through the middle. */
				'		lens += vec3(0.5, 0.42, 0.34) * smoothstep(0.075, 0.03, distance(from, spot * -0.32)) * 0.12;',
				'		lens += vec3(0.3, 0.5, 0.42) * smoothstep(0.13, 0.11, distance(from, spot * -0.62)) * 0.08;',
				'		lens += vec3(0.4, 0.46, 0.62) * smoothstep(0.05, 0.03, distance(from, spot * 0.42)) * 0.12;',
				/* A wide disc that breaks the light into its colors, and the veil it casts over the frame. */
				'		float disc = distance(from, spot * -1.15);',
				'		vec3 rainbow = 0.5 + 0.5 * cos(6.2831 * (disc / 0.26 * 1.5 + vec3(0.0, 0.33, 0.67)));',
				'		lens += rainbow * smoothstep(0.27, 0.23, disc) * smoothstep(0.1, 0.24, disc) * 0.2;',
				'		lens += vec3(0.62, 0.34, 0.48) * smoothstep(0.32, 0.3, disc) * 0.035;',
				'		float ring = length(from + spot * 0.5);',
				'		lens += (0.5 + 0.5 * cos(6.2831 * (ring * 5.0 + vec3(0.0, 0.33, 0.67)))) * smoothstep(0.035, 0.0, abs(ring - 0.46)) * 0.09;',
				'		lens += vec3(1.0, 0.7, 0.45) * pow(max(1.0 - distance(from, spot) * 0.8, 0.0), 3.0) * 0.28;',
				/* A streak across the view. */
				'		lens += vec3(0.55, 0.62, 1.0) * exp(-abs(from.y - spot.y) * 60.0) * pow(max(1.0 - abs(from.x - spot.x) * 0.55, 0.0), 2.0) * 0.14;',
				/* The eye shuts against a sun in view: what lies away from it sinks into the dark, corners first. */
				'		float away = clamp(length(from - spot) / (0.72 * uAspect), 0.0, 1.0);',
				'		float blind = min(texture(uSunlit, vec2(0.5)).g * (1.0 - smoothstep(0.42, 0.95, max(past.x, past.y))) * 2.5, 1.0) * min(uFlare, 1.5);',
				'		color *= 1.0 - min(blind * 0.95, 0.93) * smoothstep(0.12, 0.85, away);',
				'		color += lens * mix(uSunColor, vec3(1.0), 0.35) * min(seen * 2.5, 1.0) * uFlare;',
				'	}',
				'	color += texture(uBloom, uv).rgb * 0.62;',
				/* The air burning round what comes down through it, at the edges of the view. */
				'	color += vec3(1.0, 0.36, 0.1) * uHeat * smoothstep(0.5, 1.25, length(vQuad));',
				'	float open = uEyeOn > 0.5 && uExposure == 1.0 ? clamp(0.3 / exp(texture(uEye, vec2(0.5)).r), 0.8, 1.35) : uExposure;',
				/* At night an eye holds no color, but where something burns: the moon lays no red on the sand, and turning away changes nothing. */
				'	if (uNight > 0.0) {',
				'		float seen = dot(color, vec3(0.3, 0.6, 0.1));',
				'		color = mix(color, vec3(0.74, 0.83, 1.0) * seen, uNight * 0.8 * (1.0 - smoothstep(0.1, 0.5, seen)));',
				'		open = mix(open, 1.0, uNight);',
				'	}',
				'	color = aces(color * 0.9 * open);',
				'	float grain = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) / 255.0;',
				'	outColor = vec4(pow(color, vec3(1.0 / 2.2)) + grain, 1.0);',
				'}'
			].join('\n')
		};
	}
});
