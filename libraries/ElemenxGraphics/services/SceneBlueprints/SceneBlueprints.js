/*
 * SceneBlueprints: what a Scene adds to Blueprints, declared in $Provides: Blueprints makes it as a graph of an
 * effect or one of its blocks is met, so a Scene calls nothing first.
 * - The kind effect: a graph of the layers of an effect of a scene, ending at Effect (it takes the blocks of a
 *   generator too). Make(parameters) of what Compile gives is the type of the effect. Its blocks: Layer (each of a
 *   Kind, its numbers as inputs a Parameter can take, else its properties; each one after the layers under it) and
 *   Effect, the end (its lamp, heat, aim and flight, the layers given).
 * - The blocks of the passes of the picture of a render graph (of BlueprintShaders): Scene, Clouds, Occlusion, Air,
 *   Frames, Mirror, Rays, Exposure, Bokeh, Bloom, Picture and Shader; each one runs the step of the scene that runs
 *   it (frame.Steps).
 * - The kind water: the water of a Scene as a graph (blueprintWater in its shader of water), its blocks the parts of
 *   the water of the library (Waters).
 */
Elemenx.Service('SceneBlueprints', {
	$Meta: {
		Description: 'What a Scene adds to Blueprints: the graphs of effects and the blocks of the passes of its picture.',
		Methods: []
	},

	$Provides: {
		Blueprints: {Graphs: ['effect', 'water', 'sky', 'land'], Nodes: ['LandPoint', 'LandGrain', 'LandPools', 'LandAlbedo', 'LandPaint', 'LandLight', 'LandSheen', 'LandCompose', 'LandEnd', 'SkyRay', 'SkyDay', 'SkyAir', 'SkyDusk', 'SkyHalo', 'SkyPink', 'SkyWisps', 'SkyCover', 'SkyEclipse', 'SkyTowns', 'SkyRainbow', 'SkyMoonHaze', 'SkyMoon', 'SkyCompose', 'SkyEnd', 'Place', 'View', 'Far', 'Flow', 'Sun', 'Waves', 'WaterNormal', 'Fresnel', 'Glints', 'Sky', 'Body', 'Foam', 'Reflection', 'WaterFog', 'Water', 'Layer', 'Effect', 'Scene', 'Clouds', 'Occlusion', 'Air', 'Frames', 'Mirror', 'Rays', 'Exposure', 'Bokeh', 'Bloom', 'Picture', 'Shader']}
	},

	$OnCreate: function () {
		this.Effects();
		this.Passes();
		this.Waters();
		this.Skies();
		this.Lands();
	},

	/*
	 * The blocks of effect graphs: Layer (each of a Kind, its numbers as inputs a Parameter can take, else its properties;
	 * each one after the layers under it) and Effect, the end (its lamp, heat, aim and flight, the layers given).
	 */
	Effects: function () {
		var blueprints = this.$Service('Blueprints');
		var numbers = ['Count', 'Life', 'Spread', 'Gravity', 'Rise', 'Drag', 'Bounce', 'Stretch', 'Wander', 'Wind', 'Opacity', 'Start', 'Base', 'Hollow', 'Soft', 'Reach', 'Seed'];
		var layer = [{Key: 'Speed', Type: 'vec2'}, {Key: 'Size', Type: 'vec2'}, {Key: 'Color', Type: 'vec3'}, {Key: 'Hot', Type: 'vec3'}].concat(numbers.map(function (key) {
			return {Key: key, Type: 'float'};
		}));
		var effect = [{Key: 'Heat', Type: 'float'}, {Key: 'Stand', Type: 'float'}, {Key: 'Lasts', Type: 'float'}, {Key: 'Fly', Type: 'float'}, {Key: 'Aim', Type: 'vec3'}, {Key: 'Glow', Type: 'vec3'}, {Key: 'LampColor', Type: 'any'}, {Key: 'LampPower', Type: 'float'}, {Key: 'LampRadius', Type: 'float'}, {Key: 'LampFlicker', Type: 'float'}];

		/* A value of a field: what comes to its input, else its property; none is left out. Lists may be written "1, 2". */
		function value (inputs, properties, field) {
			var told = inputs[field.Key] !== undefined ? inputs[field.Key] : properties[field.Key];
			if (told === undefined || told === null || told === '') return undefined;
			if (field.Type === 'float') return Number(told);
			if (typeof told === 'string' && told.indexOf(',') !== -1) return told.split(',').map(Number);

			return told;
		}

		blueprints.Graph('effect', {
			End: 'Effect',
			Uses: ['generator'],
			Compile: function (plan) {
				return {
					Make: function (parameters) {
						var run = {Outputs: {}, Parameters: parameters || {}, Inputs: {}, Memo: true, Graph: {parameters: this && this.Parameters || plan.Graph.parameters}};
						var end = plan.Order.filter(function (id) {
							return plan.Blocks[id].type === 'Effect' && plan.Blocks[id].enabled !== false;
						})[0];

						return blueprints.Pull(plan, end, 'Type', run, 0);
					}
				};
			}
		});

		blueprints.Node('Layer', {
			Graphs: ['effect'],
			Group: 'effect',
			Properties: [{Key: 'Kind', Type: 'select', Options: ['flame', 'smoke', 'spark', 'mote', 'bubble', 'fire', 'stream', 'ball', 'beam', 'shell', 'bolt', 'sigil', 'swirl', 'pool', 'wave', 'nozzle', 'flare'], Value: 'mote'}, {Key: 'Blend', Type: 'select', Options: ['add', 'alpha'], Value: 'add'}, {Key: 'Hold', Type: 'bool', Value: false}, {Key: 'Rings', Type: 'object', Value: null}].concat(layer.map(function (field) {
				return {Key: field.Key, Type: field.Type === 'float' ? 'number' : 'vector'};
			})),
			Inputs: [{Key: 'Under', Type: 'object'}].concat(layer),
			Outputs: [{Key: 'Layers', Type: 'object'}],
			Compute: function (inputs, properties) {
				var made = {Kind: properties.Kind || 'mote', Blend: properties.Blend || 'add'};

				layer.forEach(function (field) {
					var told = value(inputs, properties, field);
					if (told !== undefined)
						made[field.Key] = told;
				});

				if (properties.Hold === true || properties.Hold === 'true')
					made.Hold = true;

				if (properties.Rings)
					made.Rings = typeof properties.Rings === 'string' ? JSON.parse(properties.Rings) : properties.Rings;

				return {Layers: (Array.isArray(inputs.Under) ? inputs.Under : []).concat([made])};
			}
		});

		blueprints.Node('Effect', {
			Graphs: ['effect'],
			Group: 'effect',
			Properties: [{Key: 'Once', Type: 'bool', Value: false}, {Key: 'Then', Type: 'text', Value: ''}].concat(effect.map(function (field) {
				return {Key: field.Key, Type: field.Type === 'float' ? 'number' : 'vector'};
			})),
			Inputs: [{Key: 'Layers', Type: 'object'}].concat(effect),
			Outputs: [],
			Compute: function (inputs, properties) {
				var told = {};
				var type = {Lamp: null};

				effect.forEach(function (field) {
					told[field.Key] = value(inputs, properties, field);
				});

				if (told.LampColor !== undefined)
					type.Lamp = {Color: told.LampColor, Power: told.LampPower, Radius: told.LampRadius, Flicker: told.LampFlicker};

				['Heat', 'Stand', 'Lasts', 'Fly', 'Aim', 'Glow'].forEach(function (key) {
					if (told[key] !== undefined)
						type[key] = told[key];
				});

				if (properties.Once === true || properties.Once === 'true')
					type.Once = true;

				if (properties.Then)
					type.Then = properties.Then;

				type.Layers = Array.isArray(inputs.Layers) ? inputs.Layers : [];

				return {Type: type};
			}
		});
	},

	/* The types of the blocks of the passes: the same for every scene, each one runs the steps of the scene that runs it. */
	Passes: function () {
		var blueprints = this.$Service('Blueprints');
		var types = {
			Scene: [[], ['Color', 'Depth']],
			Clouds: [['Depth'], ['Cloud']],
			Occlusion: [['Depth'], ['Dark']],
			Air: [['Color', 'Depth', 'Cloud', 'Dark'], ['Color']],
			Frames: [['Color', 'Depth'], ['Color']],
			Mirror: [['Color', 'Depth'], ['Mirror']],
			Rays: [['Depth', 'Cloud'], ['Shaft', 'Sunlit']],
			Exposure: [['Color'], ['Eye']],
			Bokeh: [['Color', 'Depth'], ['Color']],
			Bloom: [['Color'], ['Bloom']],
			Picture: [['Color', 'Depth', 'Bloom', 'Mirror', 'Eye', 'Shaft', 'Sunlit'], ['Color']],
			Shader: [['Color', 'Depth'], ['Color']]
		};
		var properties = {
			Bloom: [{Key: 'Threshold', Type: 'number', Value: 0.85, Min: 0, Max: 4}],
			Shader: [{Key: 'Graph', Type: 'object', Value: null}, {Key: 'Scale', Type: 'number', Value: 1, Min: 0.05, Max: 1}, {Key: 'Parameters', Type: 'object', Value: null}]
		};

		Object.keys(types).forEach(function (type) {
			blueprints.Node(type, {
				Graphs: ['render'],
				Group: 'picture',
				Properties: properties[type] || [],
				Inputs: types[type][0].map(function (key) {
					return {Key: key, Type: 'texture'};
				}),
				Outputs: types[type][1].map(function (key) {
					return {Key: key, Type: 'texture'};
				}),
				Pass: function (frame, inputs, values, block, parameters) {
					return frame.Steps[type](frame, inputs, values, block, parameters);
				}
			});
		});
	},
	/*
	 * The water of a scene as a graph: a function of GLSL in the shader of water of a Scene (blueprintWater(inout color,
	 * inout alpha)), which reads what that shader has: where the point is (Place, View, Far), how the water runs there
	 * (Flow), the sun (Sun) and the time. Its blocks are the parts of the water of the library, each its very GLSL:
	 * Waves (the slope of the surface: the waves of a lake, or drawn out along a river and carried down it; Rush where it
	 * runs white), WaterNormal, Fresnel, Glints (the path of the sun), Sky (the sky it mirrors), Body (the color of the
	 * depth: a lake, or a river with its silt), Foam, Reflection (what is round it, mirrored on the screen) and WaterFog;
	 * Water is its end. Scene.LibraryWater() is the water of the library made of them.
	 */
	Waters: function () {
		var blueprints = this.$Service('Blueprints');
		var shaders = this.$Service('BlueprintShaders');
		var water = ['water'];

		function node (type, inputs, outputs, glsl) {
			blueprints.Node(type, {Graphs: water, Group: inputs.length ? 'water' : 'input', Inputs: inputs, Outputs: outputs, GLSL: glsl});
		}

		blueprints.Graph('water', {
			End: 'Water',
			Text: function (glsl) {
				var written = shaders.Written(glsl);
				var made;

				if (!/\bvoid\s+blueprintWater\s*\(/.test(glsl))
					throw new Error('Elemenx Blueprints: a water written by hand has no blueprintWater');

				made = {Function: written.Body, Needs: written.Needs, Uniforms: written.Uniforms, Textures: [], Parameters: written.Parameters};
				made.Values = shaders.Values(made);

				return made;
			},
			Compile: function (plan) {
				var shader = shaders.Shader(plan, 'water');
				var made = {
					Function: ['void blueprintWater(inout vec3 color, inout float alpha) {']
						.concat(shader.Lines.map(function (line) {
							return '\t' + line;
						}))
						.concat([shader.Result.Water || '', '}'])
						.filter(function (line) {
							return line !== '';
						})
						.join('\n'),
					Needs: shader.Needs,
					Uniforms: shader.Uniforms,
					Textures: [],
					Sources: shader.Sources
				};

				made.Values = shaders.Values(made);

				return made;
			}
		});

		/* What the shader of water has at a point. */
		node('Place', [], [{Key: 'Place', Type: 'vec3'}], 'vWorld + uEye');
		node('View', [], [{Key: 'View', Type: 'vec3'}], 'normalize(-vWorld)');
		node('Far', [], [{Key: 'Far', Type: 'float'}], 'length(vWorld)');
		node('Flow', [], [{Key: 'Speed', Type: 'float'}, {Key: 'Way', Type: 'vec2'}], function () {
			return {Speed: 'vColor.z * uFlow', Way: 'vColor.xy'};
		});
		node('Sun', [], [{Key: 'Way', Type: 'vec3'}, {Key: 'Color', Type: 'vec3'}, {Key: 'Height', Type: 'float'}], function () {
			return {Way: 'uSun', Color: 'uSunColor', Height: 'uSun.y'};
		});

		/*
		 * The slope of the surface. Running water: waves drawn out along the way it runs, carried down it in two phases that
		 * take over from each other, so the pattern runs on and never stretches; white where it rushes. Still water: the
		 * waves of a lake, finer with a mirror. The farther, the calmer: a pixel tells less of them.
		 */
		node('Waves', [{Key: 'Place', Type: 'vec3', Default: 'vWorld + uEye'}, {Key: 'Far', Type: 'float', Default: 'length(vWorld)'}, {Key: 'Speed', Type: 'float', Default: 'vColor.z * uFlow'}, {Key: 'Way', Type: 'vec2', Default: 'vColor.xy'}, {Key: 'Time', Type: 'float', Default: 'uTime'}], [{Key: 'Slope', Type: 'vec2'}, {Key: 'Rush', Type: 'float'}], function (context) {
			var name = 'w' + context.Index;
			var inputs = context.Inputs;

			context.Lines.push('vec2 ' + name + '_slope;');
			context.Lines.push('float ' + name + '_rush = 0.0;');
			context.Lines.push('if (' + inputs.Speed + ' > 0.01) {');
			context.Lines.push('\tvec2 along = normalize(' + inputs.Way + ');');
			context.Lines.push('\tvec2 side = vec2(-along.y, along.x);');
			context.Lines.push('\tvec2 q = vec2(dot(' + inputs.Place + '.xz, along) * 0.6, dot(' + inputs.Place + '.xz, side) * 2.2);');
			context.Lines.push('\tfloat phase = fract(' + inputs.Time + ' * 0.2);');
			context.Lines.push('\tvec2 a = wavesAt(q - vec2(' + inputs.Speed + ' * phase * 3.0, 0.0), ' + inputs.Time + ' * 0.5, 6);');
			context.Lines.push('\tvec2 b = wavesAt(q - vec2(' + inputs.Speed + ' * fract(phase + 0.5) * 3.0, 0.0) + vec2(17.0, 3.0), ' + inputs.Time + ' * 0.5, 6);');
			context.Lines.push('\tvec2 s = mix(a, b, abs(phase * 2.0 - 1.0));');
			context.Lines.push('\t' + name + '_slope = (along * s.x * 0.6 + side * s.y * 2.2) * 0.45 / (1.0 + ' + inputs.Far + ' * 0.012);');
			context.Lines.push('\t' + name + '_rush = smoothstep(1.8, 4.0, ' + inputs.Speed + ') * smoothstep(0.6, 1.6, length(s));');
			context.Lines.push('}');
			context.Lines.push('else {');
			context.Lines.push('\t' + name + '_slope = wavesAt(' + inputs.Place + '.xz * 1.5, ' + inputs.Time + ' * 1.6, uMirror > 0.5 ? 14 : 7) / (1.0 + ' + inputs.Far + ' * 0.012);');
			context.Lines.push('}');

			return {Slope: name + '_slope', Rush: name + '_rush'};
		});

		node('WaterNormal', [{Key: 'Slope', Type: 'vec2', Value: 0}], [{Key: 'Normal', Type: 'vec3'}], 'normalize(vec3(-{Slope}.x * 0.22 * uWild, 1.0, -{Slope}.y * 0.22 * uWild))');
		node('Fresnel', [{Key: 'Normal', Type: 'vec3', Default: 'vec3(0.0, 1.0, 0.0)'}, {Key: 'View', Type: 'vec3', Default: 'normalize(-vWorld)'}], [{Key: 'Fresnel', Type: 'float'}], '0.02 + 0.98 * pow(1.0 - max(dot({Normal}, {View}), 0.0), 5.0)');

		/* What a wave turns to the eye is the sky it faces, and the sun: so the path of light is made of the waves. */
		node('Glints', [{Key: 'Normal', Type: 'vec3', Default: 'vec3(0.0, 1.0, 0.0)'}, {Key: 'View', Type: 'vec3', Default: 'normalize(-vWorld)'}], [{Key: 'Shine', Type: 'vec3'}], function (context) {
			var name = 'w' + context.Index;

			context.Lines.push('vec3 ' + name + '_r = reflect(-' + context.Inputs.View + ', ' + context.Inputs.Normal + ');');
			context.Lines.push(name + '_r.y = abs(' + name + '_r.y);');
			context.Lines.push('float ' + name + '_toward = max(dot(' + name + '_r, uSun), 0.0);');

			return {Shine: 'uSunColor * ((pow(' + name + '_toward, 1400.0) * 7.0 + pow(' + name + '_toward, 180.0) * 0.16) * smoothstep(-0.02, 0.06, uSun.y))'};
		});

		node('Sky', [{Key: 'Normal', Type: 'vec3', Default: 'vec3(0.0, 1.0, 0.0)'}, {Key: 'View', Type: 'vec3', Default: 'normalize(-vWorld)'}], [{Key: 'Color', Type: 'vec3'}], function (context) {
			var name = 'w' + context.Index;

			context.Lines.push('vec3 ' + name + '_r = reflect(-' + context.Inputs.View + ', ' + context.Inputs.Normal + ');');
			context.Lines.push(name + '_r.y = abs(' + name + '_r.y);');

			return {Color: 'reflectedSky(' + name + '_r) * uDay + vec3(0.012, 0.016, 0.03)'};
		});

		/* A river carries its silt: greener and duller than a lake or the sea; darker as the sun goes down. */
		node('Body', [{Key: 'Speed', Type: 'float', Default: 'vColor.z * uFlow'}], [{Key: 'Color', Type: 'vec3'}], '({Speed} > 0.01 ? vec3(0.05, 0.13, 0.11) : vec3(0.02, 0.11, 0.17)) * (0.25 + 0.75 * clamp(uSun.y * 2.0, 0.0, 1.0))');
		node('Foam', [{Key: 'Color', Type: 'vec3', Value: 0}, {Key: 'Rush', Type: 'float', Value: 0}], [{Key: 'Color', Type: 'vec3'}], 'mix({Color}, vec3(0.82, 0.86, 0.85) * (0.3 + 0.7 * clamp(uSun.y * 2.0, 0.0, 1.0)), {Rush} * 0.45)');

		/* What is round the water, found on the screen along the ray it mirrors, at high quality (a mirror). */
		node('Reflection', [{Key: 'Color', Type: 'vec3', Value: 0}, {Key: 'Normal', Type: 'vec3', Default: 'vec3(0.0, 1.0, 0.0)'}, {Key: 'View', Type: 'vec3', Default: 'normalize(-vWorld)'}, {Key: 'Fresnel', Type: 'float', Value: 0}], [{Key: 'Color', Type: 'vec3'}], function (context) {
			var name = 'w' + context.Index;
			var inputs = context.Inputs;

			context.Lines.push('vec3 ' + name + '_color = ' + inputs.Color + ';');
			context.Lines.push('if (uMirror > 0.5) {');
			context.Lines.push('\tvec4 image = mirrored(vWorld, reflect(-' + inputs.View + ', ' + inputs.Normal + '));');
			context.Lines.push('\t' + name + '_color = mix(' + name + '_color, image.rgb, image.a * clamp(0.3 + ' + inputs.Fresnel + ', 0.0, 1.0));');
			context.Lines.push('}');

			return {Color: name + '_color'};
		});

		node('WaterFog', [{Key: 'Color', Type: 'vec3', Value: 0}], [{Key: 'Color', Type: 'vec3'}], 'mix({Color}, mix(uAir.rgb, vec3(1.0), 0.45) * clamp(uSun.y * 3.0 + 0.3, 0.0, 1.0), 1.0 - exp(-length(vWorld) / uFog))');

		/* The end: the color of the water and how much of it covers what is under it. */
		blueprints.Node('Water', {Graphs: water, Group: 'output', Inputs: [{Key: 'Color', Type: 'vec3', Default: 'color'}, {Key: 'Alpha', Type: 'float', Default: 'alpha'}], Outputs: [],
			GLSL: function (context) {
				return {Result: '\tcolor = ' + context.Inputs.Color + ';\n\talpha = ' + context.Inputs.Alpha + ';'};
			}
		});
	},

	/*
	 * The sky of a scene as a graph: a function of GLSL in the shader of the sky of a Scene (blueprintSky(inout color,
	 * inout alpha)), which reads what that shader has: its uniforms (the sun, the air, the moon, the cover of clouds, the
	 * eclipse, the glow of towns, the rainbow) and its noise. Its blocks are the parts of the sky of the library, each its
	 * very GLSL, in their order: SkyRay (the way of the eye, how high it looks, how high the sun stands, how near the sun),
	 * SkyDay (day, low sun, how far up), SkyAir (the blue of the air), SkyDusk (the warm band of a low sun), SkyHalo
	 * (the light round the sun), SkyPink, SkyWisps (high thin clouds), SkyCover (the clouds over all), SkyEclipse (dark
	 * round the moon before the sun, the crown), SkyTowns (their glow), SkyRainbow, SkyMoonHaze, SkyMoon (its ball, lit as
	 * its phase) and SkyCompose (the air over the stars, the disc of the sun, the moon); SkyEnd is its end.
	 * Scene.LibrarySky() is the sky of the library made of them.
	 */
	Skies: function () {
		var blueprints = this.$Service('Blueprints');
		var shaders = this.$Service('BlueprintShaders');
		var sky = ['sky'];

		function node (type, inputs, outputs, glsl) {
			blueprints.Node(type, {Graphs: sky, Group: inputs.length ? 'sky' : 'input', Inputs: inputs, Outputs: outputs, GLSL: glsl});
		}

		function float (key, fallback) {
			return {Key: key, Type: 'float', Default: fallback};
		}

		function vec3 (key, fallback) {
			return {Key: key, Type: 'vec3', Default: fallback};
		}

		blueprints.Graph('sky', {
			End: 'SkyEnd',
			Text: function (glsl) {
				var written = shaders.Written(glsl);
				var made;

				if (!/\bvoid\s+blueprintSky\s*\(/.test(glsl))
					throw new Error('Elemenx Blueprints: a sky written by hand has no blueprintSky');

				made = {Function: written.Body, Needs: written.Needs, Uniforms: written.Uniforms, Textures: [], Parameters: written.Parameters};
				made.Values = shaders.Values(made);

				return made;
			},
			Compile: function (plan) {
				var shader = shaders.Shader(plan, 'sky');
				var made = {
					Function: ['void blueprintSky(inout vec3 color, inout float alpha) {']
						.concat(shader.Lines.map(function (line) {
							return '\t' + line;
						}))
						.concat([shader.Result.SkyEnd || '', '}'])
						.filter(function (line) {
							return line !== '';
						})
						.join('\n'),
					Needs: shader.Needs,
					Uniforms: shader.Uniforms,
					Textures: [],
					Sources: shader.Sources
				};

				made.Values = shaders.Values(made);

				return made;
			}
		});

		/* The way of the eye through a point of the sky, how high it looks and the sun stands, how near the sun it looks. */
		node('SkyRay', [], [{Key: 'Ray', Type: 'vec3'}, {Key: 'Height', Type: 'float'}, {Key: 'Sun', Type: 'float'}, {Key: 'Toward', Type: 'float'}], function (context) {
			var name = 's' + context.Index;

			context.Lines.push('vec4 ' + name + '_far = uInverse * vec4(vQuad, 1.0, 1.0);');
			context.Lines.push('vec4 ' + name + '_close = uInverse * vec4(vQuad, -1.0, 1.0);');
			context.Lines.push('vec3 ' + name + '_ray = normalize(' + name + '_far.xyz / ' + name + '_far.w - ' + name + '_close.xyz / ' + name + '_close.w);');

			return {Ray: name + '_ray', Height: 'dot(' + name + '_ray, uUp)', Sun: 'dot(uSun, uUp)', Toward: 'max(dot(' + name + '_ray, uSun), 0.0)'};
		});

		/* How much it is day, how low the sun stands, how far up the eye looks. */
		node('SkyDay', [float('Sun', 'dot(uSun, uUp)'), float('Height', '0.0')], [{Key: 'Day', Type: 'float'}, {Key: 'Low', Type: 'float'}, {Key: 'Up', Type: 'float'}], function (context) {
			return {Day: 'smoothstep(-0.3, 0.25, ' + context.Inputs.Sun + ')', Low: '(1.0 - smoothstep(0.0, 0.5, abs(' + context.Inputs.Sun + ')))', Up: 'clamp(' + context.Inputs.Height + ', 0.0, 1.0)'};
		});

		/* The blue of the air, from the horizon up; the sun low, the air takes its blue. */
		node('SkyAir', [float('Up', '0.0'), float('Day', '1.0'), float('Low', '0.0')], [{Key: 'Color', Type: 'vec3'}], 'mix(mix(uAir.rgb, vec3(1.0), 0.5), uAir.rgb * vec3(0.38, 0.55, 1.0), pow({Up}, 0.5)) * {Day} * mix(vec3(1.0), vec3(0.86, 0.74, 0.72), {Low})');

		/* The band of the horizon warms all round a low sun, most of all under it. */
		node('SkyDusk', [vec3('Color', 'vec3(0.0)'), vec3('Ray', 'vec3(0.0, 1.0, 0.0)'), float('Up', '0.0'), float('Low', '0.0')], [{Key: 'Color', Type: 'vec3'}, {Key: 'Dusk', Type: 'float'}], function (context) {
			var name = 's' + context.Index;
			var inputs = context.Inputs;

			context.Lines.push('float ' + name + '_dusk = ' + inputs.Low + ' * exp(-' + inputs.Up + ' * 5.5);');

			return {Color: '(' + inputs.Color + ' + vec3(1.0, 0.54, 0.2) * ' + name + '_dusk * (0.3 + 1.1 * pow(dot(' + inputs.Ray + ', uSun) * 0.5 + 0.5, 4.0)))', Dusk: name + '_dusk'};
		});

		/* The light the air spreads round the sun: wide and faint, then narrow and bright; warm when it is low. */
		node('SkyHalo', [vec3('Color', 'vec3(0.0)'), float('Toward', '0.0'), float('Sun', 'dot(uSun, uUp)')], [{Key: 'Color', Type: 'vec3'}, {Key: 'Tint', Type: 'vec3'}], function (context) {
			var name = 's' + context.Index;
			var inputs = context.Inputs;

			context.Lines.push('vec3 ' + name + '_tint = mix(vec3(1.0, 0.54, 0.2) * 1.5, vec3(1.0), smoothstep(0.05, 0.5, ' + inputs.Sun + '));');

			return {Color: '(' + inputs.Color + ' + ' + name + '_tint * (pow(' + inputs.Toward + ', 6.0) * 0.2 + pow(' + inputs.Toward + ', 48.0) * 0.38 + pow(' + inputs.Toward + ', 500.0) * 1.1) * smoothstep(-0.12, 0.02, ' + inputs.Sun + ') * (1.0 - uCover))', Tint: name + '_tint'};
		});

		/* The pink over the gold of a sunset. */
		node('SkyPink', [vec3('Color', 'vec3(0.0)'), float('Low', '0.0'), float('Up', '0.0'), float('Sun', 'dot(uSun, uUp)')], [{Key: 'Color', Type: 'vec3'}], '({Color} + vec3(0.85, 0.3, 0.42) * {Low} * exp(-{Up} * 2.2) * 0.42 * smoothstep(-0.2, 0.02, {Sun}))');

		/* High thin clouds drawn out by the wind. */
		node('SkyWisps', [vec3('Color', 'vec3(0.0)'), vec3('Ray', 'vec3(0.0, 1.0, 0.0)'), float('Height', '0.0'), float('Day', '1.0'), float('Low', '0.0')], [{Key: 'Color', Type: 'vec3'}], function (context) {
			var name = 's' + context.Index;
			var inputs = context.Inputs;

			context.Lines.push('vec3 ' + name + '_sky = ' + inputs.Color + ';');
			context.Lines.push('if (' + inputs.Height + ' > 0.02) {');
			context.Lines.push('\tvec2 high = ' + inputs.Ray + '.xz / (' + inputs.Height + ' + 0.12);');
			context.Lines.push('\tfloat wisp = noise3(vec3(high.x * 1.1, high.y * 3.4, uSun.x * 0.0)) * 0.65 + noise3(vec3(high.x * 3.1, high.y * 7.0, 3.0)) * 0.35;');
			context.Lines.push('\tfloat thin = smoothstep(0.52, 0.8, wisp) * smoothstep(0.02, 0.2, ' + inputs.Height + ') * (1.0 - uCover);');
			context.Lines.push('\t' + name + '_sky = mix(' + name + '_sky, mix(vec3(1.0, 0.98, 0.95), vec3(1.0, 0.62, 0.42), ' + inputs.Low + ') * max(' + inputs.Day + ', 0.04), thin * 0.42);');
			context.Lines.push('}');

			return {Color: name + '_sky'};
		});

		/* The clouds over all of it. */
		node('SkyCover', [vec3('Color', 'vec3(0.0)'), float('Day', '1.0')], [{Key: 'Color', Type: 'vec3'}], 'mix({Color}, vec3(0.62, 0.65, 0.7) * {Day}, uCover * 0.8)');

		/* The moon before the sun: the air goes dark round it, and the crown of the sun shows. */
		node('SkyEclipse', [vec3('Color', 'vec3(0.0)'), float('Toward', '0.0')], [{Key: 'Color', Type: 'vec3'}, {Key: 'Crown', Type: 'vec3'}], function (context) {
			return {Color: '(' + context.Inputs.Color + ' * (1.0 - 0.96 * uEclipse))', Crown: 'vec3(0.85, 0.9, 1.0) * smoothstep(0.8, 1.0, uEclipse) * (pow(' + context.Inputs.Toward + ', 2400.0) * 1.3 + pow(' + context.Inputs.Toward + ', 320.0) * 0.3)'};
		});

		/* The towns light the air from the horizon up. */
		node('SkyTowns', [vec3('Color', 'vec3(0.0)'), vec3('Ray', 'vec3(0.0, 1.0, 0.0)'), float('Height', '0.0')], [{Key: 'Color', Type: 'vec3'}, {Key: 'Towns', Type: 'float'}], function (context) {
			var name = 's' + context.Index;
			var inputs = context.Inputs;

			context.Lines.push('float ' + name + '_towns = (exp(-max(' + inputs.Height + ', 0.0) * 5.0) * 0.5 + 0.03) * (uGlowWay.z > 0.5 ? pow(dot(normalize(' + inputs.Ray + '.xz + vec2(1e-5)), uGlowWay.xy) * 0.5 + 0.5, 2.0) : 1.0);');

			return {Color: '(' + inputs.Color + ' + uGlow * ' + name + '_towns)', Towns: name + '_towns'};
		});

		/* Past the rain, across the sky from the sun: red outside, violet inside. */
		node('SkyRainbow', [vec3('Color', 'vec3(0.0)'), vec3('Ray', 'vec3(0.0, 1.0, 0.0)'), float('Sun', 'dot(uSun, uUp)'), float('Height', '0.0')], [{Key: 'Color', Type: 'vec3'}], function (context) {
			var name = 's' + context.Index;
			var inputs = context.Inputs;

			context.Lines.push('vec3 ' + name + '_sky = ' + inputs.Color + ';');
			context.Lines.push('if (uRainbow > 0.0 && ' + inputs.Sun + ' > 0.0 && ' + inputs.Height + ' > 0.0) {');
			context.Lines.push('\tfloat bow = (acos(clamp(-dot(' + inputs.Ray + ', uSun), -1.0, 1.0)) - 0.70) / 0.05;');
			context.Lines.push('\tif (bow > 0.0 && bow < 1.0) ' + name + '_sky += (0.5 + 0.5 * cos(6.28 * (bow * 0.8 + vec3(0.62, 0.33, 0.0)))) * sin(bow * 3.14) * 0.16 * uRainbow * smoothstep(0.0, 0.1, ' + inputs.Height + ');');
			context.Lines.push('}');

			return {Color: name + '_sky'};
		});

		/* A moon up lights the air round it a little, more the fuller it is. */
		node('SkyMoonHaze', [vec3('Color', 'vec3(0.0)'), vec3('Ray', 'vec3(0.0, 1.0, 0.0)'), float('Day', '1.0')], [{Key: 'Color', Type: 'vec3'}, {Key: 'Haze', Type: 'float'}], function (context) {
			var name = 's' + context.Index;
			var inputs = context.Inputs;

			context.Lines.push('float ' + name + '_haze = uMoonGlow * (1.0 - ' + inputs.Day + ') * (0.1 + 0.5 * pow(max(dot(' + inputs.Ray + ', uMoon), 0.0), 24.0));');

			return {Color: '(' + inputs.Color + ' + vec3(0.32, 0.4, 0.62) * ' + name + '_haze)', Haze: name + '_haze'};
		});

		/* The ball of the moon, lit from where its sun stands: that is the shape of its phase; what is dark hides the stars. */
		node('SkyMoon', [vec3('Ray', 'vec3(0.0, 1.0, 0.0)'), float('Day', '1.0')], [{Key: 'Color', Type: 'vec3'}, {Key: 'Shape', Type: 'float'}], function (context) {
			var name = 's' + context.Index;
			var inputs = context.Inputs;

			context.Lines.push('vec3 ' + name + '_moon = vec3(0.0);');
			context.Lines.push('float ' + name + '_shape = 0.0;');
			context.Lines.push('float ' + name + '_far = dot(' + inputs.Ray + ', uMoon);');
			context.Lines.push('if (uMoonSize > 0.0 && ' + name + '_far > 0.0) {');
			context.Lines.push('\tfloat radius = 0.018 * uMoonSize;');
			context.Lines.push('\tvec3 across = (' + inputs.Ray + ' - uMoon * ' + name + '_far) / radius;');
			context.Lines.push('\tfloat off = length(across);');
			context.Lines.push('\tif (off < 1.0) {');
			context.Lines.push('\t\tvec3 face = across - uMoon * sqrt(1.0 - off * off);');
			context.Lines.push('\t\tfloat lit = smoothstep(-0.04, 0.1, dot(face, uMoonLit));');
			context.Lines.push('\t\tfloat seas = 0.68 + 0.5 * noise3(face * 3.5 + 11.0);');
			context.Lines.push('\t\tfloat edge = 1.0 - smoothstep(0.95, 1.0, off);');
			context.Lines.push('\t\t' + name + '_moon = mix(vec3(0.98, 0.98, 1.0), vec3(0.42, 0.11, 0.05), uMoonShade) * lit * seas * edge * (1.0 - uCover) * mix(1.5, 0.5, ' + inputs.Day + ');');
			context.Lines.push('\t\t' + name + '_shape = edge * max(max(1.0 - ' + inputs.Day + ', lit), min(1.0, uEclipse * 4.0)) * (1.0 - uCover);');
			context.Lines.push('\t}');
			context.Lines.push('}');

			return {Color: name + '_moon', Shape: name + '_shape'};
		});

		/*
		 * The air over the stars, as thick as it is by day, at dusk, round the moon and over towns; the disc of the sun with
		 * its warm light, hidden by a moon before it; the moon over all.
		 */
		node('SkyCompose', [vec3('Color', 'vec3(0.0)'), vec3('Crown', 'vec3(0.0)'), vec3('Tint', 'vec3(1.0)'), float('Toward', '0.0'), float('Sun', 'dot(uSun, uUp)'), float('Day', '1.0'), float('Dusk', '0.0'), float('Haze', '0.0'), float('Towns', '0.0'), vec3('Moon', 'vec3(0.0)'), float('Shape', '0.0')], [{Key: 'Color', Type: 'vec3'}, {Key: 'Alpha', Type: 'float'}], function (context) {
			var name = 's' + context.Index;
			var inputs = context.Inputs;

			context.Lines.push('float ' + name + '_density = uAir.a * (1.0 - uHigh);');
			context.Lines.push('float ' + name + '_disk = smoothstep(0.99972, 0.99990, ' + inputs.Toward + ') * (1.0 - uCover);');
			context.Lines.push('float ' + name + '_alpha = clamp(' + name + '_density * (' + inputs.Day + ' * 0.97 * (1.0 - uEclipse) + ' + inputs.Dusk + ' * 0.6 + ' + inputs.Haze + ' + ' + inputs.Towns + ' * max(uGlow.r, uGlow.g)), 0.0, 1.0);');
			context.Lines.push('float ' + name + '_hidden = ' + inputs.Shape + ' * smoothstep(0.0, 0.05, uEclipse);');

			return {Color: '((' + inputs.Color + ' + ' + inputs.Crown + ') * ' + name + '_density * (1.0 - ' + name + '_hidden) + ' + inputs.Tint + ' * ' + name + '_disk * (1.0 - smoothstep(0.0, 0.25, ' + inputs.Shape + ')) * 9.0 * smoothstep(-0.03, 0.01, ' + inputs.Sun + ') + ' + inputs.Moon + ')', Alpha: 'max(max(' + name + '_alpha, ' + name + '_disk), ' + inputs.Shape + ')'};
		});

		/* The end: the color of the sky at the point, and how much of it covers the stars behind. */
		blueprints.Node('SkyEnd', {Graphs: sky, Group: 'output', Inputs: [{Key: 'Color', Type: 'vec3', Default: 'color'}, {Key: 'Alpha', Type: 'float', Default: 'alpha'}], Outputs: [],
			GLSL: function (context) {
				return {Result: '\tcolor = ' + context.Inputs.Color + ';\n\talpha = ' + context.Inputs.Alpha + ';'};
			}
		});
	},

	/*
	 * The land of a scene as a graph: a function of GLSL in the shader of the land of a Scene (blueprintLand(inout color,
	 * inout alpha)), which reads what that shader has: the point (LandPoint: where it is in the world and on the land, its
	 * normal, its color of the heights and slopes), the sun, the air, the wet and the snow, the shadows and the light of
	 * the sky and of the lamps. Its blocks are the parts of the land of the library, each its very GLSL: LandGrain (the
	 * grain of the soil), LandPools (water in the hollows of what is level, its rings in the rain), LandAlbedo (darker
	 * wet, white under snow), LandPaint (the Blueprint of the ground: its own surface, or nothing), LandLight (the sun with
	 * its shadows, the sky, the light bounced and the lamps), LandSheen (wet ground shines) and LandCompose (the pools
	 * mirror the sky, the haze of the distance, how much shows through where water stands); LandEnd is its end.
	 * Scene.LibraryLand() is the land of the library made of them.
	 */
	Lands: function () {
		var blueprints = this.$Service('Blueprints');
		var shaders = this.$Service('BlueprintShaders');
		var land = ['land'];

		function node (type, inputs, outputs, glsl) {
			blueprints.Node(type, {Graphs: land, Group: inputs.length ? 'land' : 'input', Inputs: inputs, Outputs: outputs, GLSL: glsl});
		}

		function float (key, fallback) {
			return {Key: key, Type: 'float', Default: fallback};
		}

		function vec3 (key, fallback) {
			return {Key: key, Type: 'vec3', Default: fallback};
		}

		blueprints.Graph('land', {
			End: 'LandEnd',
			Text: function (glsl) {
				var written = shaders.Written(glsl);
				var made;

				if (!/\bvoid\s+blueprintLand\s*\(/.test(glsl))
					throw new Error('Elemenx Blueprints: a land written by hand has no blueprintLand');

				made = {Function: written.Body, Needs: written.Needs, Uniforms: written.Uniforms, Textures: [], Parameters: written.Parameters};
				made.Values = shaders.Values(made);

				return made;
			},
			Compile: function (plan) {
				var shader = shaders.Shader(plan, 'land');
				var made = {
					Function: ['void blueprintLand(inout vec3 color, inout float alpha) {']
						.concat(shader.Lines.map(function (line) {
							return '\t' + line;
						}))
						.concat([shader.Result.LandEnd || '', '}'])
						.filter(function (line) {
							return line !== '';
						})
						.join('\n'),
					Needs: shader.Needs,
					Uniforms: shader.Uniforms,
					Textures: [],
					Sources: shader.Sources
				};

				made.Values = shaders.Values(made);

				return made;
			}
		});

		/* What the shader of the land has at a point: in the world (from the eye) and on the land, its normal and its color. */
		node('LandPoint', [], [{Key: 'World', Type: 'vec3'}, {Key: 'Place', Type: 'vec3'}, {Key: 'Normal', Type: 'vec3'}, {Key: 'Color', Type: 'vec3'}], function () {
			return {World: 'vWorld', Place: 'vPlace', Normal: 'normalize(vNormal)', Color: 'vColor'};
		});

		/* The grain of the soil. */
		node('LandGrain', [vec3('Place', 'vPlace')], [{Key: 'Grain', Type: 'float'}], '(0.88 + 0.24 * noise3({Place} * 0.35))');

		/* Water stands in the hollows of what is level: the pools grow while it rains and shrink as it dries; its rings in the rain. */
		node('LandPools', [vec3('Place', 'vPlace'), vec3('Normal', 'normalize(vNormal)')], [{Key: 'Pool', Type: 'float'}, {Key: 'Water', Type: 'vec3'}], function (context) {
			var name = 'l' + context.Index;
			var inputs = context.Inputs;

			context.Lines.push('float ' + name + '_pool = uWet * smoothstep(0.64 - 0.2 * uWet, 0.74 - 0.2 * uWet, noise3(' + inputs.Place + ' * 0.09) + noise3(' + inputs.Place + ' * 0.41) * 0.07) * smoothstep(0.9, 0.97, ' + inputs.Normal + '.y);');
			context.Lines.push('vec3 ' + name + '_water = vec3(0.0, 1.0, 0.0);');
			context.Lines.push('float ' + name + '_seen = 1.0 - smoothstep(0.03, 0.09, length(fwidth(' + inputs.Place + '.xz * 1.7)));');
			context.Lines.push('if (' + name + '_pool > 0.02 && uRainDrops > 0.0 && ' + name + '_seen > 0.0) {');
			context.Lines.push('\tvec2 ring = ' + inputs.Place + '.xz * 1.7;');
			context.Lines.push('\tfloat h0 = rings(ring, uTime2);');
			context.Lines.push('\t' + name + '_water = normalize(' + name + '_water + vec3(rings(ring + vec2(0.03, 0.0), uTime2) - h0, 0.0, rings(ring + vec2(0.0, 0.03), uTime2) - h0) * 0.9 * min(1.0, uRainDrops) * ' + name + '_seen);');
			context.Lines.push('}');

			return {Pool: name + '_pool', Water: name + '_water'};
		});

		/* The color of the soil, in light: darker when wet and under water, white under snow where it is level enough. */
		node('LandAlbedo', [vec3('Color', 'vColor'), float('Grain', '1.0'), float('Pool', '0.0'), vec3('Normal', 'normalize(vNormal)')], [{Key: 'Albedo', Type: 'vec3'}], 'mix(pow({Color} * {Grain}, vec3(2.2)) * (1.0 - uWet * 0.42) * (1.0 - {Pool} * 0.35), vec3(0.86, 0.9, 0.95), uSnowed * smoothstep(0.55, 0.85, {Normal}.y + ({Grain} - 1.0)))');

		/* The Blueprint of the ground, when it has one: its own surface (blueprintSurface) over the albedo; its glow. */
		node('LandPaint', [vec3('Albedo', 'vec3(0.5)'), vec3('Place', 'vPlace'), vec3('Normal', 'normalize(vNormal)')], [{Key: 'Albedo', Type: 'vec3'}, {Key: 'Normal', Type: 'vec3'}, {Key: 'Glow', Type: 'vec3'}], function (context) {
			var name = 'l' + context.Index;
			var inputs = context.Inputs;

			context.Lines.push('vec3 ' + name + '_albedo = ' + inputs.Albedo + ';');
			context.Lines.push('vec3 ' + name + '_normal = ' + inputs.Normal + ';');
			context.Lines.push('float ' + name + '_alpha = 1.0;');
			context.Lines.push('float ' + name + '_rough = 1.0;');
			context.Lines.push('float ' + name + '_metal = 0.0;');
			context.Lines.push('vec3 ' + name + '_glow = vec3(0.0);');
			context.Lines.push('blueprintSurface(' + inputs.Place + ', ' + name + '_normal, ' + inputs.Place + '.xz, ' + name + '_albedo, ' + name + '_alpha, ' + name + '_rough, ' + name + '_metal, ' + name + '_glow, ' + name + '_normal);');

			return {Albedo: name + '_albedo', Normal: name + '_normal', Glow: name + '_glow'};
		});

		/* The light on a point: the sun as its shadows let it, the sky over it, what the land bounces back, the lamps. */
		node('LandLight', [vec3('World', 'vWorld'), vec3('Normal', 'normalize(vNormal)')], [{Key: 'Light', Type: 'vec3'}, {Key: 'Sunlit', Type: 'float'}], function (context) {
			var name = 'l' + context.Index;
			var inputs = context.Inputs;

			context.Lines.push('float ' + name + '_sunlit = sunLit(' + inputs.World + ', ' + inputs.Normal + ');');

			return {Light: '(uSunColor * 1.35 * max(dot(' + inputs.Normal + ', uSun), 0.0) * ' + name + '_sunlit + mix(uFloorLight, uSkyLight, ' + inputs.Normal + '.y * 0.5 + 0.5) * skySeen(' + inputs.World + ') + sunBounce(' + inputs.World + ') + localLight(' + inputs.World + ', ' + inputs.Normal + '))', Sunlit: name + '_sunlit'};
		});

		/* Wet ground takes a sheen: the sun on it, wide where it is only wet, a sharp glint where water stands and its rings break it. */
		node('LandSheen', [vec3('World', 'vWorld'), vec3('Normal', 'normalize(vNormal)'), vec3('Water', 'vec3(0.0, 1.0, 0.0)'), float('Pool', '0.0')], [{Key: 'Sheen', Type: 'float'}], function (context) {
			var name = 'l' + context.Index;
			var inputs = context.Inputs;

			context.Lines.push('vec3 ' + name + '_v = normalize(-' + inputs.World + ');');
			context.Lines.push('vec3 ' + name + '_surface = normalize(mix(' + inputs.Normal + ', ' + inputs.Water + ', ' + inputs.Pool + '));');
			context.Lines.push('vec3 ' + name + '_h = normalize(uSun + ' + name + '_v);');
			context.Lines.push('float ' + name + '_glance = 0.02 + 0.98 * pow(1.0 - max(dot(' + name + '_surface, ' + name + '_v), 0.0), 5.0);');

			return {Sheen: '(pow(max(dot(' + name + '_surface, ' + name + '_h), 0.0), mix(28.0, 1400.0, ' + inputs.Pool + ')) * mix(0.35, 60.0, ' + inputs.Pool + ') * (0.1 + ' + name + '_glance) * uWet * step(0.0, uSun.y))'};
		});

		/*
		 * The color seen: the albedo in its light, the sheen of the sun, its own glow, made for the screen; the pools mirror
		 * the sky at a glance; the haze of the distance; and how much shows through where water stands.
		 */
		node('LandCompose', [vec3('World', 'vWorld'), vec3('Albedo', 'vec3(0.5)'), vec3('Light', 'vec3(1.0)'), float('Sheen', '0.0'), float('Sunlit', '1.0'), vec3('Glow', 'vec3(0.0)'), float('Pool', '0.0')], [{Key: 'Color', Type: 'vec3'}, {Key: 'Alpha', Type: 'float'}], function (context) {
			var name = 'l' + context.Index;
			var inputs = context.Inputs;

			context.Lines.push('vec3 ' + name + '_v = normalize(-' + inputs.World + ');');
			context.Lines.push('vec3 ' + name + '_horizon = mix(uAir.rgb, vec3(1.0), 0.45) * clamp(uSun.y * 3.0 + 0.3, 0.0, 1.0);');
			context.Lines.push('vec3 ' + name + '_lit = pow(' + inputs.Albedo + ' * ' + inputs.Light + ' + uSunColor * ' + inputs.Sheen + ' * ' + inputs.Sunlit + ' + ' + inputs.Glow + ', vec3(1.0 / 2.2));');
			context.Lines.push('float ' + name + '_mirror = ' + inputs.Pool + ' * (0.25 + 0.65 * pow(1.0 - max(' + name + '_v.y, 0.0), 3.0));');
			context.Lines.push(name + '_lit = mix(' + name + '_lit, mix(uAir.rgb, vec3(1.0), 0.5) * clamp(uSkyLight.b * 2.4, 0.03, 1.0), ' + name + '_mirror);');

			return {Color: 'mix(' + name + '_lit, ' + name + '_horizon, 1.0 - exp(-length(' + inputs.World + ') / uFog))', Alpha: '(1.0 - ' + name + '_mirror * 0.45 - uWet * 0.12 * (1.0 - ' + inputs.Pool + '))'};
		});

		/* The end: the color of the land at the point, and how much of it covers what is under it. */
		blueprints.Node('LandEnd', {Graphs: land, Group: 'output', Inputs: [{Key: 'Color', Type: 'vec3', Default: 'color'}, {Key: 'Alpha', Type: 'float', Default: 'alpha'}], Outputs: [],
			GLSL: function (context) {
				return {Result: '\tcolor = ' + context.Inputs.Color + ';\n\talpha = ' + context.Inputs.Alpha + ';'};
			}
		});
	}
});
