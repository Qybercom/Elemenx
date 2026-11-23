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
 * - The kind star: the look of a star at a time, run each frame (it takes the blocks of a generator too: Time, Curve,
 *   Parameter...); Look(parameters, seconds) of what Compile gives is {Corona, Prominences, Flares, Count, Height, Speed,
 *   Strands, Tint}. Its end, Star, takes each as an input (its property when nothing comes): a Curve of the Time makes
 *   its prominences rise and fall as the keys say.
 * - The kind nebula: the look of a nebula at a time, run each frame as the one of a star; Look(parameters, seconds) is
 *   {Glow, Density, Turn, Grow, Detail, Outer, Inner, Turbulence, Thickness, Hollow}: how bright, how thick its dust, how
 *   far it is turned round its axis (degrees), how much larger than its Radius (a shell that spreads), how much fine
 *   grain it shows near, the tints of its outer and inner colors; Turbulence, Thickness and Hollow are of its shape (how
 *   torn, how thick its shell, how wide the hollow in its heart), taken at its time 0 (its shape is made once of them).
 * - The kind bake: the surface of a body of noise (not of ScenePlanet) baked into its two cubes, blueprintBake(p, inout
 *   surface, inout sky) of the shader Bake of a Scene (BakeGraph): surface its ground (rgb) and gloss (a), sky its clouds
 *   (r), glow (g) and sparks (b). Its inputs are Input blocks (PX, PY, PZ: the direction; Seed, Ocean, Cratered, Kind, Ice,
 *   Clouds), its numbers the blocks of a generator, so what comes to BakeLand (Land, H) is read in the page too: BakeLandGraph(graph)
 *   that part of it as a generator (its result Land), the ground of the body (SceneTerrainGenerator.Sphere) the very land its
 *   picture shows. Its other blocks: BakeRocky, BakeIcy, BakeLava, BakeGas (the surface of each kind: rgb and gloss), BakeKind
 *   (the one of the kind of the body), BakeIce (its caps), BakeClouds and BakeEnd.
 * - The kind weather: what the weather and the year do to the surface of a thing, the functions its shaders (Pbr, Solid)
 *   call (WeatherGraph of a Scene): WeatherSeason (weather_season(inout color, tree, at, turn): the leaves turn, fall,
 *   blossom), WeatherSnow (weather_snow_<For>(up, at): how much snow lies, For things, solid or plants), WeatherDissolve
 *   (weather_dissolve(world, inout color): a body beamed away), WeatherPuddles (weather_puddles(wet, level, at): water
 *   standing), WeatherEnd (they all come to it). Their numbers (thresholds, scales of their noise) are their properties.
 * - The kind air: the air between the eye and what it sees, functions of the shaders (AirGraph of a Scene), each block
 *   of them for those that ask (#define ENX_AIR_<FOR> before the place of the graph): AirHaze (air_haze_<For>(world), how
 *   much of it, air_horizon_<For>(light), its color; For globe: the things and the ground of a globe, ground: the land
 *   and the water of a scene), AirFog (the pass Air: air_fog(place, far, way) of a fog that lies low and of the sheets of
 *   rain, air_light(whiten), air_far(way), air_veil(ray)), AirUnder (air_under(color, place, depth): the eye under the
 *   sea), AirEnd. Their numbers are their properties. Chunk(context, name, lines, guard): the function of a block a part
 *   of the shaders of Renderer (its name of its text), asked by the block; guard: the name it stands under (#ifdef), or
 *   names, any of them (#if defined).
 * - The kind clouds: the clouds of the shaders (CloudsGraph of a Scene), each block of them for those that ask (#define
 *   ENX_CLOUDS_<FOR>): CloudCover (clouds_cover: the cover of the weather of a planet at a place, its billows), CloudGlobe
 *   (cloudSeen, cloudAt: the globe and the shadows of its clouds), CloudShell (shellThick: round the eye over a surface),
 *   CloudLayer (lobe, thick: the layer of a scene, of a cheap 3D noise), CloudsEnd.
 * - The weather of a planet as blocks of numbers of a generator (SceneForecast, its Kernel: the same in the page and in a
 *   shader): ForecastStorms, ForecastFronts, ForecastHeaps, ForecastCirrus, ForecastRain, ForecastShroud; LibraryForecast()
 *   the graph of them of the library (blueprints/shader/forecast), the WEATHER of a Scene (ForecastGraph).
 * - The arms of a galaxy as blocks of numbers of a generator (GalaxyData.Kernel: the page and a shader alike): GalaxyTurn,
 *   GalaxyBend, GalaxyWave, GalaxyArm; LibraryGalaxy() the graph of them of the library (blueprints/shader/galaxy),
 *   Galaxy(graph) {Of, Arm, GLSL (vec4 galaxy_spiral(...))}: its stars, its picture, the band of it from a system alike.
 * - The kind cosmos: the sky far behind a system (CosmosGraph of a Scene), its blocks the parts of that sky: see Cosmoses;
 *   LibraryCosmos() the graph of the library (blueprints/shader/cosmos).
 * - The kind ring: a ring round a body (RingGraph of a Scene), its bands, its gaps, its colors and its light as blocks:
 *   see Rings; LibraryRing() the graph of the library (blueprints/shader/ring).
 * - The kind planet: a globe from far (PlanetGraph of a Scene): its picture lit, its clouds and their shadows, the shadow
 *   of its ring, its towns at night, its air at its edge as blocks: see Planets; LibraryPlanet() the graph of the library
 *   (blueprints/shader/planet). Painted(kind, end, head): such a kind of a function of a body in a shader.
 * - The kind ground: the ground of a globe near and from over it (GroundGraph of a Scene): its picture, woods, fields,
 *   snow, dunes, relief, the tiles near, its light and the shadows of clouds and of its ring, water, towns at night, clouds
 *   from over them and air as blocks: see Grounds; LibraryGround() the graph of the library (blueprints/shader/ground).
 * - LibraryShader(name): a shader graph of the library (blueprints/shader/<name>) read; LibraryCosmos(), LibraryRing(),
 *   LibraryPlanet(), LibraryGround(), LibraryForecast(), LibraryBolt() and LibraryGalaxy() each give theirs of it.
 * - The shape of a lightning, one for the bolt of a storm (SceneLighting) and the one of an effect (SceneEffects, kind
 *   bolt): a generator of the jag of each of its steps (Step, Seed: X and Z, -0.5 to 0.5), its parameters Steps (of its
 *   way), Wide (a jag to its length), Fork (the step a branch leaves at), ForkSteps, ForkDown and ForkWide (the branch:
 *   its steps, how far down and how wide each, to the bolt). LibraryBolt() the one of the library (blueprints/shader/bolt);
 *   Bolt(graph) {Jag(step, seed) ([X, Z]), Steps.. ForkWide, GLSL (the text of vec2 bolt_jag(float step, float seed),
 *   the shape in a shader: of a hash of a sine, its floats part from the numbers of the page where the sine is large,
 *   the way the same)}, made once a graph.
 */
Elemenx.Service('SceneBlueprints', {
	$Meta: {
		Description: 'What a Scene adds to Blueprints: the graphs of effects and the blocks of the passes of its picture.',
		Methods: ['BakeLandGraph(graph)', 'LibraryShader(name)', 'LibraryBolt()', 'Bolt(graph)', 'Chunk(context, name, lines, guard)', 'LibraryForecast()', 'LibraryGalaxy()', 'Galaxy(graph)', 'LibraryCosmos()', 'LibraryRing()', 'Painted(kind, end, head)', 'LibraryPlanet()', 'LibraryGround()']
	},

	$Provides: {
		Blueprints: {Graphs: ['effect', 'water', 'sky', 'land', 'star', 'nebula', 'bake', 'weather', 'air', 'clouds', 'cosmos', 'ring', 'planet', 'ground'], Nodes: ['GroundPlace', 'GroundBase', 'GroundPicture', 'GroundIce', 'GroundMottle', 'GroundWoods', 'GroundFields', 'GroundCrowns', 'GroundSnow', 'GroundDunes', 'GroundRelief', 'GroundTiles', 'GroundRing', 'GroundLight', 'GroundWater', 'GroundClouds', 'GroundAir', 'GroundEnd', 'SunPlace', 'SunCells', 'SunSpots', 'SunBands', 'SunLimb', 'SunColor', 'SunBurn', 'StarSurface', 'CrownPlace', 'CrownCorona', 'CrownProminences', 'CrownFlare', 'StarCrown', 'BeamPlace', 'BeamGlow', 'StarBeam', 'PlanetPlace', 'PlanetSurface', 'PlanetRelief', 'PlanetGas', 'PlanetLight', 'PlanetHeat', 'PlanetClouds', 'RingShadow', 'PlanetShade', 'GlobeLights', 'PlanetMix', 'PlanetRim', 'PlanetHighlight', 'PlanetEnd', 'CloudShade', 'RingPlace', 'RingBands', 'RingGap', 'RingColor', 'RingLight', 'RingEnd', 'CosmosRay', 'CosmosGas', 'CosmosPlane', 'CosmosGlow', 'CosmosDust', 'CosmosBand', 'CosmosBursts', 'CosmosGalaxies', 'CosmosPillars', 'CosmosStars', 'CosmosBeacon', 'CosmosClusters', 'CosmosEnd', 'GalaxyTurn', 'GalaxyBend', 'GalaxyWave', 'GalaxyArm', 'ForecastStorms', 'ForecastFronts', 'ForecastHeaps', 'ForecastCirrus', 'ForecastRain', 'ForecastShroud', 'CloudCover', 'CloudGlobe', 'CloudShell', 'CloudLayer', 'CloudsEnd', 'AirHaze', 'AirFog', 'AirUnder', 'AirEnd', 'WeatherSeason', 'WeatherSnow', 'WeatherDissolve', 'WeatherPuddles', 'WeatherEnd', 'BakeLand', 'BakeRocky', 'BakeIcy', 'BakeLava', 'BakeGas', 'BakeKind', 'BakeIce', 'BakeClouds', 'BakeEnd', 'Star', 'Nebula', 'LandPoint', 'LandMaterial', 'LandGrain', 'LandPools', 'LandAlbedo', 'LandPaint', 'LandLight', 'LandCaustics', 'LandSheen', 'LandCompose', 'LandEnd', 'SkyRay', 'SkyDay', 'SkyAir', 'SkyDusk', 'SkyHalo', 'SkyPink', 'SkyWisps', 'SkyCover', 'SkyEclipse', 'SkyTowns', 'SkyAurora', 'SkyRainbow', 'SkyMoonHaze', 'SkyMoon', 'SkyCompose', 'SkyEnd', 'Place', 'View', 'Far', 'Flow', 'Sun', 'Waves', 'WaterNormal', 'Fresnel', 'Glints', 'Sky', 'Body', 'Foam', 'Under', 'Absorb', 'Below', 'Reflection', 'WaterFog', 'Water', 'Layer', 'Effect', 'Scene', 'Clouds', 'Occlusion', 'Air', 'Frames', 'Mirror', 'Rays', 'Exposure', 'Bokeh', 'Bloom', 'Picture', 'Shader']}
	},

	$OnCreate: function () {
		this.Effects();
		this.Stars();
		this.Nebulae();
		this.Passes();
		this.Waters();
		this.Skies();
		this.Lands();
		this.Bakes();
		this.Weathers();
		this.Airs();
		this.Clouds();
		this.Forecasts();
		this.Galaxies();
		this.Cosmoses();
		this.Rings();
		this.Planets();
		this.Grounds();
	},

	/*
	 * The look of a star as a graph, run each frame on its time: Star, the end, each of its fields an input a Parameter or
	 * a Curve of the Time can take, else its property. Corona, Prominences and Flares say how much of each; Count how many
	 * prominences (1 to 8), Height how high they rise (1 as they are), Speed how fast they breathe and their strands
	 * stream, Strands how torn they are, Tint the color they are tinted (white: their own).
	 */
	Stars: function () {
		var blueprints = this.$Service('Blueprints');
		var fields = [['Corona', 1], ['Prominences', 1], ['Flares', 1], ['Count', 5], ['Height', 1], ['Speed', 1], ['Strands', 1]];

		var shaders = this.$Service('BlueprintShaders');
		var star = ['star'];

		/* The first block of a type that is on, of a plan. */
		function endOf (plan, type) {
			return plan.Order.filter(function (id) {
				return plan.Blocks[id].type === type && plan.Blocks[id].enabled !== false;
			})[0];
		}

		/*
		 * A part of a star in a shader (its surface, its crown): a function of GLSL (head) of the blocks its end (type) reads
		 * and those they read, no more (the numbers of its Star block are of the page); null with no such end.
		 */
		function part (plan, type, head) {
			var end = endOf(plan, type);
			var wanted = {};
			var shader;
			var made;

			if (!end)
				return null;

			(function want (id) {
				if (wanted[id]) return;

				wanted[id] = true;

				Object.keys(plan.From[id] || {}).forEach(function (key) {
					want(plan.From[id][key].Block);
				});
			})(end);

			shader = shaders.Shader(Object.assign({}, plan, {Order: plan.Order.filter(function (id) {
				return wanted[id];
			})}), 'star');

			made = {
				Function: [head + ' {']
					.concat(shader.Lines.map(function (line) {
						return '\t' + line;
					}))
					.concat([shader.Result[type] || '', '}'])
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

		blueprints.Graph('star', {
			End: 'Star',
			Uses: ['generator'],
			Compile: function (plan) {
				var end = endOf(plan, 'Star');

				return {
					Look: function (parameters, seconds) {
						var run = {Outputs: {}, Parameters: parameters || {}, Inputs: {Time: Number(seconds) || 0}, Memo: true, Graph: {parameters: this && this.Parameters || plan.Graph.parameters}};

						return end ? blueprints.Pull(plan, end, 'Look', run, 0) : null;
					},
					Surface: part(plan, 'StarSurface', 'void blueprintSun(vec3 n, vec3 v, vec3 p, inout vec3 color)'),
					Crown: part(plan, 'StarCrown', 'void blueprintCrown(float r, float angle, float u, inout vec3 color)'),
					Beam: part(plan, 'StarBeam', 'void blueprintBeam(vec2 beam, inout vec3 color)')
				};
			}
		});

		function pin (key, type, fallback) {
			return {Key: key, Type: type, Default: fallback};
		}

		function out (key, type) {
			return {Key: key, Type: type || 'float'};
		}

		function number (key, value) {
			return {Key: key, Type: 'number', Value: value};
		}

		/* A block of lines of a part of a star: its name of its index, its inputs, the literal of each of its properties. */
		function node (type, group, properties, inputs, outputs, lines) {
			blueprints.Node(type, {Graphs: star, Group: inputs.length ? group : 'input', Properties: properties, Inputs: inputs, Outputs: outputs, GLSL: function (context) {
				if (group === 'sun')
					context.Need('Noise');

				return lines(context, 'st' + context.Index + '_', context.Inputs, function (key) {
					return shaders.Literal(Number(context.Properties[key]), 'float');
				});
			}});
		}

		var point = pin('Point', 'vec3', 'p');
		var color = pin('Color', 'vec3', 'color');

		/*
		 * Its surface (the Star shader of a Scene: blueprintSun(n, v, p, inout color); uColor, uSeed, uTime, uCells: how fine
		 * its cells are, uBands: a brown dwarf): SunPlace, SunCells (its cells of rising gas: Speed), SunSpots (spots in the
		 * belts of middle latitudes, BeltLow to BeltHigh, a bright ring of faculae round each: Scale, Drift, From, To,
		 * FaculaeFrom, FaculaeTo), SunBands (belts of cloud of a brown dwarf: Count, Stretch, Wobble, Drift), SunLimb (darker
		 * at its edge: Power), SunColor (of them all, a brown dwarf maroon), SunBurn (far brighter than white, the less the
		 * cooler it is: White, Hot, Cool); StarSurface its end.
		 */
		node('SunPlace', 'sun', [], [], [out('Normal', 'vec3'), out('View', 'vec3'), out('Point', 'vec3')], function () {
			return {Normal: 'n', View: 'v', Point: 'p'};
		});

		node('SunCells', 'sun', [number('Speed', 0.08), number('Octaves', 4)], [point], [out('Cells')], function (context, name, inputs, value) {
			context.Lines.push('float ' + name + 'cells = fbm3(' + inputs.Point + ' * uCells + vec3(0.0, uTime * ' + value('Speed') + ', uSeed), ' + Math.max(1, Math.min(8, Math.round(Number(context.Properties.Octaves) || 4))) + ');');

			return {Cells: name + 'cells'};
		});

		node('SunSpots', 'sun', [number('BeltLow', 0.08), number('BeltLowFull', 0.2), number('BeltHigh', 0.45), number('BeltHighEnd', 0.62), number('Scale', 2.6), number('Drift', 0.01), number('From', 0.66), number('To', 0.74), number('FaculaeFrom', 0.58), number('FaculaeTo', 0.66)], [point], [out('Spots'), out('Faculae')], function (context, name, inputs, value) {
			var p = inputs.Point;

			context.Lines.push('float ' + name + 'belt = smoothstep(' + value('BeltLow') + ', ' + value('BeltLowFull') + ', abs(' + p + '.y)) * (1.0 - smoothstep(' + value('BeltHigh') + ', ' + value('BeltHighEnd') + ', abs(' + p + '.y)));');
			context.Lines.push('float ' + name + 'field = fbm3(' + p + ' * ' + value('Scale') + ' + vec3(uSeed, uTime * ' + value('Drift') + ', 0.0), 3);');
			context.Lines.push('float ' + name + 'spots = smoothstep(' + value('From') + ', ' + value('To') + ', ' + name + 'field) * ' + name + 'belt * (1.0 - uBands);');
			context.Lines.push('float ' + name + 'faculae = (smoothstep(' + value('FaculaeFrom') + ', ' + value('FaculaeTo') + ', ' + name + 'field) - ' + name + 'spots) * ' + name + 'belt;');

			return {Spots: name + 'spots', Faculae: name + 'faculae'};
		});

		node('SunBands', 'sun', [number('Count', 15), number('Stretch', 7), number('Wobble', 4), number('Drift', 0.02)], [point], [out('Bands')], function (context, name, inputs, value) {
			var p = inputs.Point;

			context.Lines.push('float ' + name + 'bands = 0.5 + 0.5 * sin(' + p + '.y * ' + value('Count') + ' + fbm3(' + p + ' * vec3(1.5, ' + value('Stretch') + ', 1.5) + vec3(uSeed, 0.0, uTime * ' + value('Drift') + '), 3) * ' + value('Wobble') + ');');

			return {Bands: name + 'bands'};
		});

		node('SunLimb', 'sun', [number('Power', 0.45)], [pin('Normal', 'vec3', 'n'), pin('View', 'vec3', 'v')], [out('Limb')], function (context, name, inputs, value) {
			context.Lines.push('float ' + name + 'limb = pow(max(dot(' + inputs.Normal + ', ' + inputs.View + '), 0.0), ' + value('Power') + ');');

			return {Limb: name + 'limb'};
		});

		node('SunColor', 'sun', [number('Gamma', 2.2)], [pin('Cells', 'float', '0.5'), pin('Spots', 'float', '0.0'), pin('Faculae', 'float', '0.0'), pin('Bands', 'float', '0.5'), pin('Limb', 'float', '1.0')], [out('Color', 'vec3')], function (context, name, inputs, value) {
			var gamma = value('Gamma');

			context.Lines.push('vec3 ' + name + 'color = pow(uColor, vec3(' + gamma + ')) * mix(1.0, 0.55 + 0.75 * ' + inputs.Bands + ', uBands) * (0.7 + 0.6 * mix(' + inputs.Cells + ', 0.5, uBands * 0.7)) * (0.5 + 0.6 * ' + inputs.Limb + ') * (1.0 - ' + inputs.Spots + ' * 0.55) * (1.0 + ' + inputs.Faculae + ' * 0.35 * (1.0 - ' + inputs.Limb + '));');
			context.Lines.push(name + 'color = mix(' + name + 'color, ' + name + 'color * vec3(1.0, 0.5, 0.72) * 0.5, uBands);');

			return {Color: name + 'color'};
		});

		node('SunBurn', 'sun', [number('White', 0.28), number('Hot', 2.4), number('Cool', 1.1)], [color, pin('Limb', 'float', '1.0')], [out('Color', 'vec3')], function (context, name, inputs, value) {
			context.Lines.push('float ' + name + 'warm = 1.0 - clamp(uColor.b / max(uColor.r, 1e-3), 0.0, 1.0);');
			context.Lines.push('vec3 ' + name + 'color = mix(' + inputs.Color + ', vec3(1.0), ' + value('White') + ' * ' + inputs.Limb + ' * (1.0 - ' + name + 'warm) * (1.0 - ' + name + 'warm)) * mix(' + value('Hot') + ', ' + value('Cool') + ', clamp(' + name + 'warm * 1.5, 0.0, 1.0));');

			return {Color: name + 'color'};
		});

		blueprints.Node('StarSurface', {Graphs: star, Group: 'output', Inputs: [color], Outputs: [], GLSL: function (context) {
			return {Result: '\tcolor = ' + context.Inputs.Color + ';'};
		}});

		/*
		 * Its crown (the Corona of SceneDeepSpace: blueprintCrown(r, angle, u, inout color): r how far out in its radii, angle
		 * round it, u over its edge; uColor, uSeed, uTime, uParts: corona, prominences, flares, uShape: count, height, speed,
		 * strands of prominences, uTint, uPhase: of its Star block): CrownPlace, CrownCorona (streamers: Falloff, Glow, Fade),
		 * CrownProminences (arches of gas, up to 8: Glow), CrownFlare (one every Period seconds: Glow); StarCrown its end.
		 */
		node('CrownPlace', 'crown', [], [], [out('R'), out('Angle'), out('U')], function () {
			return {R: 'r', Angle: 'angle', U: 'u'};
		});

		node('CrownCorona', 'crown', [number('Falloff', 2.6), number('Glow', 0.55), number('Fade', 2.5)], [pin('R', 'float', 'r'), pin('Angle', 'float', 'angle'), pin('U', 'float', 'u')], [out('Color', 'vec3')], function (context, name, inputs, value) {
			context.Lines.push('float ' + name + 'streamers = 0.55 + 0.45 * wave(' + inputs.Angle + ' * 3.0 + uSeed) * wave(' + inputs.Angle + ' * 7.0 - uSeed + uTime * 0.02);');
			context.Lines.push('vec3 ' + name + 'color = uColor * exp(-' + inputs.U + ' * ' + value('Falloff') + ') * ' + name + 'streamers * ' + value('Glow') + ' * uParts.x * (1.0 - smoothstep(' + value('Fade') + ', 4.0, ' + inputs.R + '));');

			return {Color: name + 'color'};
		});

		node('CrownProminences', 'crown', [number('Glow', 1.3)], [color, pin('Angle', 'float', 'angle'), pin('U', 'float', 'u')], [out('Color', 'vec3')], function (context, name, inputs, value) {
			var angle = inputs.Angle;
			var u = inputs.U;

			context.Lines.push('vec3 ' + name + 'color = ' + inputs.Color + ';');
			context.Lines.push('vec3 ' + name + 'red = vec3(1.0, 0.36, 0.3);');
			context.Lines.push('for (int i = 0; i < 8; i++) {');
			context.Lines.push('\tfloat k = float(i);');
			context.Lines.push('\tif (k >= ceil(uShape.x)) break;');
			context.Lines.push('\tfloat whole = clamp(uShape.x - k, 0.0, 1.0);');
			context.Lines.push('\tfloat at = hash(uSeed + k * 7.3) * 6.2832 - 3.1416;');
			context.Lines.push('\tfloat wide = 0.08 + 0.1 * hash(uSeed + k * 3.1);');
			context.Lines.push('\tfloat high = min(2.4, (0.12 + 0.3 * hash(uSeed + k * 5.7)) * uShape.y * (0.85 + 0.15 * sin(uPhase * 0.4 + k)));');
			context.Lines.push('\tfloat t = (mod(' + angle + ' - at + 3.1416, 6.2832) - 3.1416) / wide;');
			context.Lines.push('\tif (abs(t) < 1.2) {');
			context.Lines.push('\t\tfloat arch = high * sqrt(max(0.0, 1.0 - t * t));');
			context.Lines.push('\t\tfloat d = abs(' + u + ' - arch);');
			context.Lines.push('\t\tfloat strands = 1.0 - 0.4 * clamp(uShape.w, 0.0, 2.5) * (1.0 - wave(t * 9.0 + uPhase * 0.5 + k * 13.0));');
			context.Lines.push('\t\tfloat body = exp(-d * 22.0) * 0.8 + exp(-d * 70.0) * 0.6 + step(' + u + ', arch) * smoothstep(0.0, arch, ' + u + ') * 0.25;');
			context.Lines.push('\t\t' + name + 'color += mix(' + name + 'red, uColor, 0.25) * uTint * body * max(strands, 0.0) * smoothstep(1.2, 0.85, abs(t)) * ' + value('Glow') + ' * uParts.y * whole;');
			context.Lines.push('\t}');
			context.Lines.push('}');

			return {Color: name + 'color'};
		});

		node('CrownFlare', 'crown', [number('Period', 23), number('Glow', 6)], [color, pin('Angle', 'float', 'angle'), pin('U', 'float', 'u')], [out('Color', 'vec3')], function (context, name, inputs, value) {
			var period = value('Period');

			context.Lines.push('float ' + name + 'round = floor(uTime / ' + period + ' + uSeed);');
			context.Lines.push('float ' + name + 'since = mod(uTime + uSeed * ' + period + ', ' + period + ');');
			context.Lines.push('float ' + name + 'where = hash(' + name + 'round) * 6.2832 - 3.1416;');
			context.Lines.push('float ' + name + 'off = mod(' + inputs.Angle + ' - ' + name + 'where + 3.1416, 6.2832) - 3.1416;');
			context.Lines.push('float ' + name + 'burst = smoothstep(0.0, 0.6, ' + name + 'since) * exp(-' + name + 'since * 0.8);');
			context.Lines.push('vec3 ' + name + 'color = ' + inputs.Color + ' + vec3(1.0, 0.95, 0.85) * exp(-' + name + 'off * ' + name + 'off * 120.0 - ' + inputs.U + ' * ' + inputs.U + ' * 18.0) * ' + name + 'burst * ' + value('Glow') + ' * uParts.z;');

			return {Color: name + 'color'};
		});

		blueprints.Node('StarCrown', {Graphs: star, Group: 'output', Inputs: [color], Outputs: [], GLSL: function (context) {
			return {Result: '\tcolor = ' + context.Inputs.Color + ';'};
		}});

		/*
		 * The beams of a pulsar (the Beam of SceneDeepSpace: blueprintBeam(beam, inout color): beam.x across it, beam.y along
		 * it, 0 at the star to 1; uColor, uStrength): BeamPlace, BeamGlow (as narrow as Width, fading along it by Taper, from
		 * Start, whitened by White, Glow); StarBeam its end.
		 */
		node('BeamPlace', 'beam', [], [], [out('Beam', 'vec2')], function () {
			return {Beam: 'beam'};
		});

		node('BeamGlow', 'beam', [number('Width', 7), number('Taper', 1.7), number('Start', 0.015), number('White', 0.4), number('Glow', 1.3)], [pin('Beam', 'vec2', 'beam')], [out('Color', 'vec3')], function (context, name, inputs, value) {
			var beam = inputs.Beam;

			context.Lines.push('float ' + name + 'across = exp(-' + beam + '.x * ' + beam + '.x * ' + value('Width') + ');');
			context.Lines.push('float ' + name + 'along = pow(1.0 - ' + beam + '.y, ' + value('Taper') + ') * smoothstep(0.0, ' + value('Start') + ', ' + beam + '.y);');

			return {Color: '(mix(uColor, vec3(1.0), ' + value('White') + ') * ' + name + 'across * ' + name + 'along * uStrength * ' + value('Glow') + ')'};
		});

		blueprints.Node('StarBeam', {Graphs: star, Group: 'output', Inputs: [color], Outputs: [], GLSL: function (context) {
			return {Result: '\tcolor = ' + context.Inputs.Color + ';'};
		}});

		blueprints.Node('Star', {
			Graphs: ['star'],
			Group: 'star',
			Properties: fields.map(function (field) {
				return {Key: field[0], Type: 'number', Value: field[1]};
			}).concat([{Key: 'Tint', Type: 'color', Value: '#ffffff'}]),
			Inputs: fields.map(function (field) {
				return {Key: field[0], Type: 'float'};
			}).concat([{Key: 'Tint', Type: 'vec3'}]),
			Outputs: [{Key: 'Look', Type: 'object'}],
			Compute: function (inputs, properties) {
				var look = {};

				fields.forEach(function (field) {
					var told = inputs[field[0]] !== undefined && inputs[field[0]] !== null ? inputs[field[0]] : properties[field[0]];

					look[field[0]] = told === undefined || told === null || told === '' || isNaN(Number(told)) ? field[1] : Number(told);
				});

				look.Tint = Array.isArray(inputs.Tint) ? inputs.Tint.slice(0, 3) : blueprints.Numbers(properties.Tint || '#ffffff', 3);

				return {Look: look};
			}
		});
	},

	/*
	 * The look of a nebula as a graph, run each frame on its time: Nebula, the end, each of its fields an input a Parameter
	 * or a block of a generator (Time, Sin, Curve...) can take, else its property.
	 */
	Nebulae: function () {
		var blueprints = this.$Service('Blueprints');
		var fields = [['Glow', 1], ['Density', 1], ['Turn', 0], ['Grow', 1], ['Detail', 1], ['Turbulence', 1], ['Thickness', 1], ['Hollow', 1]];

		blueprints.Graph('nebula', {
			End: 'Nebula',
			Uses: ['generator'],
			Compile: function (plan) {
				var end = plan.Order.filter(function (id) {
					return plan.Blocks[id].type === 'Nebula' && plan.Blocks[id].enabled !== false;
				})[0];

				return {
					Look: function (parameters, seconds) {
						var run = {Outputs: {}, Parameters: parameters || {}, Inputs: {Time: Number(seconds) || 0}, Memo: true, Graph: {parameters: this && this.Parameters || plan.Graph.parameters}};

						return blueprints.Pull(plan, end, 'Look', run, 0);
					}
				};
			}
		});

		blueprints.Node('Nebula', {
			Graphs: ['nebula'],
			Group: 'nebula',
			Properties: fields.map(function (field) {
				return {Key: field[0], Type: 'number', Value: field[1]};
			}).concat([{Key: 'Outer', Type: 'color', Value: '#ffffff'}, {Key: 'Inner', Type: 'color', Value: '#ffffff'}]),
			Inputs: fields.map(function (field) {
				return {Key: field[0], Type: 'float'};
			}).concat([{Key: 'Outer', Type: 'vec3'}, {Key: 'Inner', Type: 'vec3'}]),
			Outputs: [{Key: 'Look', Type: 'object'}],
			Compute: function (inputs, properties) {
				var look = {};

				fields.forEach(function (field) {
					var told = inputs[field[0]] !== undefined && inputs[field[0]] !== null ? inputs[field[0]] : properties[field[0]];

					look[field[0]] = told === undefined || told === null || told === '' || isNaN(Number(told)) ? field[1] : Number(told);
				});

				look.Outer = Array.isArray(inputs.Outer) ? inputs.Outer.slice(0, 3) : blueprints.Numbers(properties.Outer || '#ffffff', 3);
				look.Inner = Array.isArray(inputs.Inner) ? inputs.Inner.slice(0, 3) : blueprints.Numbers(properties.Inner || '#ffffff', 3);

				return {Look: look};
			}
		});
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
	 * depth: a lake, or a river with its silt), Foam, Under (what is under it, through it, and how deep), Absorb (its light
	 * taken as it is deep), Reflection (what is round it, mirrored) and WaterFog;
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

		/* The normal of the water: the slope of its ripples over Base, the normal of its waves (those of a sea; level elsewhere). */
		node('WaterNormal', [{Key: 'Slope', Type: 'vec2', Value: 0}, {Key: 'Base', Type: 'vec3', Default: 'vSurface'}], [{Key: 'Normal', Type: 'vec3'}], 'normalize(vec3({Base}.x - {Slope}.x * 0.22 * uWild * {Base}.y, {Base}.y, {Base}.z - {Slope}.y * 0.22 * uWild * {Base}.y))');
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
		/*
		 * White where a river rushes (Rush), where a wave of a sea breaks (Crest) and where the water is shallow at its edge
		 * (Shore: how deep it is there), broken up as foam is.
		 */
		node('Foam', [{Key: 'Color', Type: 'vec3', Value: 0}, {Key: 'Rush', Type: 'float', Value: 0}, {Key: 'Crest', Type: 'float', Default: 'vCrest'}, {Key: 'Shore', Type: 'float', Default: '1000.0'}], [{Key: 'Color', Type: 'vec3'}], 'mix({Color}, vec3(0.82, 0.86, 0.85) * (0.3 + 0.7 * clamp(uSun.y * 2.0, 0.0, 1.0)), max(max({Rush} * 0.45, {Crest} * smoothstep(0.35, 0.75, noise3(vec3((vWorld.xz + uEye.xz) * 0.9, uTime * 0.3)))), (1.0 - smoothstep(0.0, 0.45, {Shore})) * smoothstep(0.3, 0.6, noise3(vec3((vWorld.xz + uEye.xz) * 2.3, uTime * 0.6))) * 0.85))');

		/*
		 * What is under the water, seen through it: the picture of the scene before the water (uSeen, its depth uSeenDepth),
		 * bent by the waves as far as the water is thick there, and how thick it is along the ray (Depth). Cover is 1 where
		 * the water draws what is under it itself; with no picture of the scene (low quality) Color is black, Depth deep,
		 * Cover 0, and the water covers what is under it as it did.
		 */
		node('Under', [{Key: 'Normal', Type: 'vec3', Default: 'vec3(0.0, 1.0, 0.0)'}], [{Key: 'Color', Type: 'vec3'}, {Key: 'Depth', Type: 'float'}, {Key: 'Cover', Type: 'float'}], function (context) {
			var name = 'w' + context.Index;

			context.Lines.push('vec3 ' + name + '_color = vec3(0.0);');
			context.Lines.push('float ' + name + '_depth = 1000.0;');
			context.Lines.push('float ' + name + '_cover = 0.0;');
			context.Lines.push('if (uMirror > 0.5) {');
			context.Lines.push('\tvec4 ' + name + '_clip = uViewProjection * vec4(vWorld, 1.0);');
			context.Lines.push('\tvec2 ' + name + '_screen = ' + name + '_clip.xy / ' + name + '_clip.w * 0.5 + 0.5;');
			context.Lines.push('\tfloat ' + name + '_far = length(vWorld);');
			context.Lines.push('\tvec2 ' + name + '_bent = clamp(' + name + '_screen + ' + context.Inputs.Normal + '.xz * 0.05 * clamp(underDepth(' + name + '_screen, ' + name + '_far), 0.0, 2.0) / (1.0 + ' + name + '_far * 0.05), 0.001, 0.999);');
			/* What the waves bend the ray to is under the water too, or the ray goes straight. */
			context.Lines.push('\tif (underDepth(' + name + '_bent, ' + name + '_far) > 0.0) ' + name + '_screen = ' + name + '_bent;');
			context.Lines.push('\t' + name + '_color = texture(uSeen, ' + name + '_screen).rgb;');
			context.Lines.push('\t' + name + '_depth = max(underDepth(' + name + '_screen, ' + name + '_far), 0.0);');
			context.Lines.push('\t' + name + '_cover = 1.0;');
			context.Lines.push('}');

			return {Color: name + '_color', Depth: name + '_depth', Cover: name + '_cover'};
		});

		/*
		 * The water seen from under it (uEyeUnder): within the window of the sky (what the surface lets out, bent as it goes
		 * into the air) the sky and the sun; beyond it, the water itself mirrored back, deep blue-green. Over the water
		 * Color and Alpha go through as they are.
		 */
		node('Below', [{Key: 'Color', Type: 'vec3', Value: 0}, {Key: 'Alpha', Type: 'float', Default: '1.0'}, {Key: 'Normal', Type: 'vec3', Default: 'vec3(0.0, 1.0, 0.0)'}], [{Key: 'Color', Type: 'vec3'}, {Key: 'Alpha', Type: 'float'}], function (context) {
			var name = 'w' + context.Index;
			var inputs = context.Inputs;

			context.Lines.push('vec3 ' + name + '_color = ' + inputs.Color + ';');
			context.Lines.push('float ' + name + '_alpha = ' + inputs.Alpha + ';');
			context.Lines.push('if (uEyeUnder > 0.5) {');
			context.Lines.push('\tvec3 ' + name + '_out = refract(normalize(vWorld), -' + inputs.Normal + ', 1.333);');
			context.Lines.push('\tvec3 ' + name + '_deep = vec3(0.02, 0.12, 0.14) * (0.3 + 0.7 * clamp(uSun.y * 3.0, 0.0, 1.0));');
			context.Lines.push('\t' + name + '_color = dot(' + name + '_out, ' + name + '_out) < 0.001 ? ' + name + '_deep : reflectedSky(' + name + '_out) * uDay * 0.85 + uSunColor * pow(max(dot(' + name + '_out, uSun), 0.0), 600.0) * 4.0;');
			context.Lines.push('\t' + name + '_alpha = 1.0;');
			context.Lines.push('}');

			return {Color: name + '_color', Alpha: name + '_alpha'};
		});

		/* The water takes the light of what is under it as it is deep: red first, then green; deep, it is its own color (Body). */
		node('Absorb', [{Key: 'Color', Type: 'vec3', Value: 0}, {Key: 'Depth', Type: 'float', Default: '1000.0'}, {Key: 'Body', Type: 'vec3', Value: 0}, {Key: 'Cover', Type: 'float', Value: 0}], [{Key: 'Color', Type: 'vec3'}], 'mix({Body}, {Color} * exp(-{Depth} * vec3(0.42, 0.1, 0.07)), {Cover} * exp(-{Depth} * 0.22))');

		/* What is round the water, found on the screen along the ray it mirrors, at high quality (a mirror). */
		node('Reflection', [{Key: 'Color', Type: 'vec3', Value: 0}, {Key: 'Normal', Type: 'vec3', Default: 'vec3(0.0, 1.0, 0.0)'}, {Key: 'View', Type: 'vec3', Default: 'normalize(-vWorld)'}, {Key: 'Fresnel', Type: 'float', Value: 0}], [{Key: 'Color', Type: 'vec3'}], function (context) {
			var name = 'w' + context.Index;
			var inputs = context.Inputs;

			context.Lines.push('vec3 ' + name + '_color = ' + inputs.Color + ';');
			/* The sea at high and ultra: the world mirrored by its level, bent by the waves where it is read. */
			context.Lines.push('if (uPlanarOn > 0.5) {');
			context.Lines.push('\tvec4 ' + name + '_at = uViewProjection * vec4(vWorld, 1.0);');
			context.Lines.push('\tvec2 ' + name + '_seen = ' + name + '_at.xy / ' + name + '_at.w * 0.5 + 0.5 + ' + inputs.Normal + '.xz * 0.06 / (1.0 + length(vWorld) * 0.01);');
			context.Lines.push('\t' + name + '_color = mix(' + name + '_color, texture(uPlanar, clamp(' + name + '_seen, 0.001, 0.999)).rgb, clamp(' + inputs.Fresnel + ', 0.0, 1.0));');
			context.Lines.push('}');
			context.Lines.push('else if (uMirror > 0.5) {');
			context.Lines.push('\tvec4 image = mirrored(vWorld, reflect(-' + inputs.View + ', ' + inputs.Normal + '));');
			context.Lines.push('\t' + name + '_color = mix(' + name + '_color, image.rgb, image.a * clamp(0.3 + ' + inputs.Fresnel + ', 0.0, 1.0));');
			context.Lines.push('}');

			return {Color: name + '_color'};
		});

		node('WaterFog', [{Key: 'Color', Type: 'vec3', Value: 0}], [{Key: 'Color', Type: 'vec3'}], 'mix({Color}, air_horizon_ground(clamp(uSun.y * 3.0 + 0.3, 0.0, 1.0)), air_haze_ground(vWorld))');

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

		/* The blue of the air, from the horizon up; the sun low, the air takes its blue. Under thick air (uDiffuse) of the colour of the air only. */
		node('SkyAir', [float('Up', '0.0'), float('Day', '1.0'), float('Low', '0.0')], [{Key: 'Color', Type: 'vec3'}], 'mix(mix(uAir.rgb, vec3(1.0), 0.5), uAir.rgb * mix(vec3(0.38, 0.55, 1.0), vec3(0.8), uDiffuse), pow({Up}, 0.5)) * {Day} * mix(vec3(1.0), vec3(0.86, 0.74, 0.72), {Low})');

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
			context.Lines.push('\tfloat thin = smoothstep(0.52, 0.8, wisp) * smoothstep(0.02, 0.2, ' + inputs.Height + ') * (1.0 - uCover) * (1.0 - uNoWisps);');
			context.Lines.push('\t' + name + '_sky = mix(' + name + '_sky, mix(vec3(1.0, 0.98, 0.95), vec3(1.0, 0.62, 0.42), ' + inputs.Low + ') * max(' + inputs.Day + ', 0.04), thin * 0.42);');
			context.Lines.push('}');

			return {Color: name + '_sky'};
		});

		/* The clouds over all of it. */
		node('SkyCover', [vec3('Color', 'vec3(0.0)'), float('Day', '1.0')], [{Key: 'Color', Type: 'vec3'}], 'mix({Color}, mix(vec3(0.62, 0.65, 0.7), uAir.rgb * 0.75, uDiffuse) * {Day}, uCover * 0.8)');

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

		/*
		 * In the rain, across the sky from the sun (the sun behind, under 42 degrees): the bow of 42 degrees round the point
		 * opposite it, red outside and violet inside, the sky brighter inside it; the second of 51 degrees, fainter, its colors
		 * the other way; Alexander's darker band between them. Where the sun shines through (uCover none).
		 */
		node('SkyRainbow', [vec3('Color', 'vec3(0.0)'), vec3('Ray', 'vec3(0.0, 1.0, 0.0)'), float('Sun', 'dot(uSun, uUp)'), float('Height', '0.0')], [{Key: 'Color', Type: 'vec3'}], function (context) {
			var name = 's' + context.Index;
			var inputs = context.Inputs;

			context.Lines.push('vec3 ' + name + '_sky = ' + inputs.Color + ';');
			context.Lines.push('if (uRainbow > 0.0 && ' + inputs.Sun + ' > -0.02 && ' + inputs.Height + ' > 0.0) {');
			context.Lines.push('\tfloat ' + name + '_at = acos(clamp(-dot(' + inputs.Ray + ', uSun), -1.0, 1.0));');
			context.Lines.push('\tfloat ' + name + '_one = (' + name + '_at - 0.7155) / 0.0350;');
			context.Lines.push('\tfloat ' + name + '_two = (' + name + '_at - 0.8810) / 0.0610;');
			context.Lines.push('\tfloat ' + name + '_shown = uRainbow * (1.0 - uCover * 0.85) * smoothstep(0.0, 0.06, ' + inputs.Height + ');');
			context.Lines.push('\tvec3 ' + name + '_bow = vec3(0.0);');
			/* A hue of 0 red to 0.8 violet: red outside the first bow, inside the second. */
			context.Lines.push('\tfloat ' + name + '_h1 = 0.8 * (1.0 - clamp(' + name + '_one, 0.0, 1.0)) * 6.0;');
			context.Lines.push('\tfloat ' + name + '_h2 = 0.8 * clamp(' + name + '_two, 0.0, 1.0) * 6.0;');
			context.Lines.push('\tif (' + name + '_one > 0.0 && ' + name + '_one < 1.0) ' + name + '_bow += clamp(vec3(abs(' + name + '_h1 - 3.0) - 1.0, 2.0 - abs(' + name + '_h1 - 2.0), 2.0 - abs(' + name + '_h1 - 4.0)), 0.0, 1.0) * sin(' + name + '_one * 3.1416) * 0.32;');
			context.Lines.push('\tif (' + name + '_two > 0.0 && ' + name + '_two < 1.0) ' + name + '_bow += clamp(vec3(abs(' + name + '_h2 - 3.0) - 1.0, 2.0 - abs(' + name + '_h2 - 2.0), 2.0 - abs(' + name + '_h2 - 4.0)), 0.0, 1.0) * sin(' + name + '_two * 3.1416) * 0.12;');
			context.Lines.push('\tfloat ' + name + '_inside = 1.0 - smoothstep(0.66, 0.7155, ' + name + '_at);');
			context.Lines.push('\tfloat ' + name + '_band = smoothstep(0.75, 0.77, ' + name + '_at) * (1.0 - smoothstep(0.865, 0.885, ' + name + '_at));');
			context.Lines.push('\t' + name + '_sky = ' + name + '_sky * (1.0 + (' + name + '_inside * 0.08 - ' + name + '_band * 0.1) * ' + name + '_shown) + ' + name + '_bow * ' + name + '_shown;');
			context.Lines.push('}');

			return {Color: name + '_sky'};
		});

		/*
		 * The northern lights: curtains of light high over the land, their rays hanging down, green under and red to violet
		 * over (uAuroraLow, uAuroraHigh), waving slowly; as strong as uAurora.x (its time in .y). Aurora is how much of the
		 * sky they cover, for its alpha over the stars.
		 */
		node('SkyAurora', [vec3('Color', 'vec3(0.0)'), vec3('Ray', 'vec3(0.0, 1.0, 0.0)'), float('Height', '0.0')], [{Key: 'Color', Type: 'vec3'}, {Key: 'Aurora', Type: 'float'}], function (context) {
			var name = 's' + context.Index;
			var inputs = context.Inputs;
			var ray = inputs.Ray;

			/*
			 * Through the layer of the lights, in ten steps of height: two thin walls along waving lines over the land, their rays
			 * hanging down, brighter low (green) than high (to red and violet); seen through, a wall is a curtain.
			 */
			context.Lines.push('float ' + name + '_light = 0.0;');
			context.Lines.push('vec3 ' + name + '_glow = vec3(0.0);');
			context.Lines.push('if (uAurora.x > 0.0 && ' + inputs.Height + ' > 0.0) {');
			context.Lines.push('\tfloat ' + name + '_t = uAurora.y * 0.05;');
			/* Each pixel steps from a height of its own: no bands of the ten steps, a fine grain instead. */
			context.Lines.push('\tfloat ' + name + '_jit = enx_white2(' + ray + '.xz * 813.0 + ' + ray + '.y * 97.0 + fract(uAurora.y * 7.31));');
			context.Lines.push('\tfor (int j = 0; j < 16; j++) {');
			context.Lines.push('\t\tfloat up = (float(j) + ' + name + '_jit) / 16.0;');
			context.Lines.push('\t\tvec2 q = ' + ray + '.xz / max(' + ray + '.y, 0.03) * (1.0 + up * 1.4) * 0.3;');
			context.Lines.push('\t\tfor (int k = 0; k < 2; k++) {');
			context.Lines.push('\t\t\tfloat c = float(k);');
			context.Lines.push('\t\t\tfloat line = sin(q.x * 0.8 + ' + name + '_t * (1.0 + c * 0.4) + c * 2.3) * 0.9 + sin(q.x * 2.1 - ' + name + '_t * 1.6 + c) * 0.22 + c * 1.6 - 0.5;');
			context.Lines.push('\t\t\tfloat d = q.y - line;');
			context.Lines.push('\t\t\tfloat wall = exp(-d * d * 55.0);');
			context.Lines.push('\t\t\tfloat rays = 0.15 + 0.85 * pow(0.5 + 0.5 * sin(q.x * 38.0 + sin(q.x * 5.3 + ' + name + '_t * 2.5) * 4.0 + c * 1.9), 5.0);');
			context.Lines.push('\t\t\tfloat part = wall * rays * exp(-up * 2.2) * (1.0 - c * 0.35);');
			context.Lines.push('\t\t\t' + name + '_light += part;');
			context.Lines.push('\t\t\t' + name + '_glow += mix(uAuroraLow, uAuroraHigh, smoothstep(0.25, 1.0, up)) * part;');
			context.Lines.push('\t\t}');
			context.Lines.push('\t}');
			context.Lines.push('\tfloat ' + name + '_shown = uAurora.x * smoothstep(0.015, 0.12, ' + ray + '.y) * 0.26;');
			context.Lines.push('\t' + name + '_light *= ' + name + '_shown;');
			context.Lines.push('\t' + name + '_glow *= ' + name + '_shown * 3.4;');
			context.Lines.push('}');

			return {Color: '(' + inputs.Color + ' + ' + name + '_glow)', Aurora: 'min(' + name + '_light, 1.0)'};
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
		 * its warm light (as large as it is seen: uSunRadius, the angle of its radius), hidden by a moon before it; the moon over all.
		 */
		node('SkyCompose', [vec3('Color', 'vec3(0.0)'), vec3('Crown', 'vec3(0.0)'), vec3('Tint', 'vec3(1.0)'), float('Toward', '0.0'), float('Sun', 'dot(uSun, uUp)'), float('Day', '1.0'), float('Dusk', '0.0'), float('Haze', '0.0'), float('Towns', '0.0'), vec3('Moon', 'vec3(0.0)'), float('Shape', '0.0'), float('Aurora', '0.0')], [{Key: 'Color', Type: 'vec3'}, {Key: 'Alpha', Type: 'float'}], function (context) {
			var name = 's' + context.Index;
			var inputs = context.Inputs;

			context.Lines.push('float ' + name + '_density = uAir.a * (1.0 - uHigh);');
			context.Lines.push('float ' + name + '_disk = smoothstep(cos(uSunRadius * 1.35), cos(uSunRadius * 0.75), ' + inputs.Toward + ') * (1.0 - uCover);');
			context.Lines.push('float ' + name + '_alpha = clamp(' + name + '_density * (' + inputs.Day + ' * 0.97 * (1.0 - uEclipse) + ' + inputs.Dusk + ' * 0.6 + ' + inputs.Haze + ' + ' + inputs.Towns + ' * max(uGlow.r, uGlow.g) + ' + inputs.Aurora + '), 0.0, 1.0);');
			context.Lines.push('float ' + name + '_hidden = ' + inputs.Shape + ' * smoothstep(0.0, 0.05, uEclipse);');
			/*
			 * The disc where it is over the horizon of the eye (uDip: how far under the level the horizon is seen from high up),
			 * its light and its cover alike. Regression: under the level of the ground under the eye its light was none and
			 * its cover whole: from 40 000 km over a body the Sun was a black disc.
			 */
			context.Lines.push('float ' + name + '_up = smoothstep(-0.03 - uDip, 0.01 - uDip, ' + inputs.Sun + ');');

			return {Color: '((' + inputs.Color + ' + ' + inputs.Crown + ') * ' + name + '_density * (1.0 - ' + name + '_hidden) + ' + inputs.Tint + ' * ' + name + '_disk * (1.0 - smoothstep(0.0, 0.25, ' + inputs.Shape + ')) * 9.0 * ' + name + '_up + ' + inputs.Moon + ')', Alpha: 'max(max(' + name + '_alpha, ' + name + '_disk * ' + name + '_up), ' + inputs.Shape + ')'};
		});

		/* The end: the color of the sky at the point, and how much of it covers the stars behind. */
		blueprints.Node('SkyEnd', {Graphs: sky, Group: 'output', Inputs: [{Key: 'Color', Type: 'vec3', Default: 'color'}, {Key: 'Alpha', Type: 'float', Default: 'alpha'}], Outputs: [],
			GLSL: function (context) {
				return {Result: '\tcolor = ' + context.Inputs.Color + ';\n\talpha = ' + context.Inputs.Alpha + ';'};
			}
		});
	},

	/*
	 * The sky far behind a system as a graph (the kind cosmos: CosmosGraph of a Scene, SceneCosmos): a function of GLSL in
	 * the shader that bakes it into a cube (blueprintCosmos(d, s, inout color): d the way, s the seed), its blocks the parts
	 * of that sky, each its very GLSL, in their order: CosmosRay (the way and the seed), CosmosGas (how thick its gas is, how
	 * lit, the great star, its knots), CosmosPlane (the band of a galaxy drawn: how high a way stands, how much band),
	 * CosmosGlow (the deep of the sky, the gas glowing), CosmosDust (its lanes), CosmosBand (the band of the galaxy the system
	 * lies in: of rays through it as it is, or drawn; what of the far sky it lets through), CosmosBursts (rays out of the
	 * gas), CosmosGalaxies (those far off, seen through what is near), CosmosPillars, CosmosStars, CosmosBeacon (the young
	 * stars that light the gas), CosmosClusters (globular ones); CosmosEnd is its end. LibraryCosmos() the graph of them.
	 */
	Cosmoses: function () {
		var blueprints = this.$Service('Blueprints');
		var shaders = this.$Service('BlueprintShaders');
		var cosmos = ['cosmos'];

		function pin (key, type, fallback) {
			return {Key: key, Type: type, Default: fallback};
		}

		function out (key, type) {
			return {Key: key, Type: type || 'float'};
		}

		var ray = pin('Ray', 'vec3', 'd');
		var seed = pin('Seed', 'vec3', 's');
		var color = pin('Color', 'vec3', 'vec3(0.0)');

		/*
		 * A block of one of the parts (a function of the shader): its inputs in, its outputs of the variables it writes; one of
		 * a color the function gives it back.
		 */
		function node (type, inputs, outputs, name, gives) {
			blueprints.Node(type, {Graphs: cosmos, Group: inputs.length ? 'cosmos' : 'input', Inputs: inputs, Outputs: outputs, GLSL: function (context) {
				var prefix = 'c' + context.Index + '_';
				var args = inputs.map(function (input) {
					return context.Inputs[input.Key];
				});
				var made = {};

				outputs.forEach(function (output) {
					if (output.Key !== gives)
						context.Lines.push(output.Type + ' ' + prefix + output.Key + ';');

					made[output.Key] = prefix + output.Key;
				});

				args = args.concat(outputs.filter(function (output) {
					return output.Key !== gives;
				}).map(function (output) {
					return prefix + output.Key;
				}));

				context.Lines.push((gives ? 'vec3 ' + prefix + gives + ' = ' : '') + name + '(' + args.join(', ') + ');');

				return made;
			}});
		}

		blueprints.Graph('cosmos', {
			End: 'CosmosEnd',
			Text: function (glsl) {
				var written = shaders.Written(glsl);
				var made;

				if (!/\bvoid\s+blueprintCosmos\s*\(/.test(glsl))
					throw new Error('Elemenx Blueprints: a sky far off written by hand has no blueprintCosmos');

				made = {Function: written.Body, Needs: written.Needs, Uniforms: written.Uniforms, Textures: [], Parameters: written.Parameters};
				made.Values = shaders.Values(made);

				return made;
			},
			Compile: function (plan) {
				var shader = shaders.Shader(plan, 'cosmos');
				var made = {
					Function: ['void blueprintCosmos(vec3 d, vec3 s, inout vec3 color) {']
						.concat(shader.Lines.map(function (line) {
							return '\t' + line;
						}))
						.concat([shader.Result.CosmosEnd || '', '}'])
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

		/* The way of a texel of the cube and the seed of the sky. */
		blueprints.Node('CosmosRay', {Graphs: cosmos, Group: 'input', Inputs: [], Outputs: [out('Ray', 'vec3'), out('Seed', 'vec3')], GLSL: function () {
			return {Ray: 'd', Seed: 's'};
		}});

		node('CosmosGas', [ray, seed], [out('Gas'), out('Lit'), out('Near'), out('Core'), out('Reach'), out('Knots')], 'cosmosGas');
		node('CosmosPlane', [ray], [out('High'), out('Disc')], 'cosmosPlane');
		node('CosmosGlow', [ray, seed, pin('Gas', 'float', '0.0'), pin('Lit', 'float', '0.0'), pin('Core', 'float', '0.0'), pin('Reach', 'float', '0.0'), pin('Knots', 'float', '0.0')], [out('Color', 'vec3')], 'cosmosGlow', 'Color');
		node('CosmosDust', [ray, seed, color, pin('Gas', 'float', '0.0'), pin('High', 'float', '1.0')], [out('Color', 'vec3'), out('Dust')], 'cosmosDust', 'Color');
		node('CosmosBand', [ray, seed, color, pin('Disc', 'float', '0.0'), pin('High', 'float', '1.0')], [out('Color', 'vec3'), out('Through')], 'cosmosBand', 'Color');
		node('CosmosBursts', [ray, seed, color, pin('Dust', 'float', '0.0')], [out('Color', 'vec3')], 'cosmosBursts', 'Color');
		node('CosmosGalaxies', [ray, color, pin('Gas', 'float', '0.0'), pin('Dust', 'float', '0.0'), pin('Through', 'float', '1.0')], [out('Color', 'vec3')], 'cosmosGalaxies', 'Color');
		node('CosmosPillars', [ray, seed, color], [out('Color', 'vec3')], 'cosmosPillars', 'Color');
		node('CosmosStars', [ray, color, pin('Knots', 'float', '0.0'), pin('Disc', 'float', '0.0'), pin('Dust', 'float', '0.0')], [out('Color', 'vec3')], 'cosmosStars', 'Color');
		node('CosmosBeacon', [ray, color, pin('Near', 'float', '0.0')], [out('Color', 'vec3')], 'cosmosBeacon', 'Color');
		node('CosmosClusters', [ray, color], [out('Color', 'vec3')], 'cosmosClusters', 'Color');

		/* The end: the color of the sky that way. */
		blueprints.Node('CosmosEnd', {Graphs: cosmos, Group: 'output', Inputs: [pin('Color', 'vec3', 'color')], Outputs: [],
			GLSL: function (context) {
				return {Result: '\tcolor = ' + context.Inputs.Color + ';'};
			}
		});
	},

	/* The sky far behind a system of the library (blueprints/shader/cosmos): see the header. */
	/* A shader graph of the library (blueprints/shader/<name>), read: what each Library* of a shader gives. */
	LibraryShader: function (name) {
		return this.$Service('Blueprints').Read(Elemenx.Resources('Blueprints', 'ElemenxGraphics/shader/' + name));
	},

	LibraryCosmos: function () {
		return this.LibraryShader('cosmos');
	},

	/*
	 * A ring round a body as a graph (the kind ring: RingGraph of a Scene): a function of GLSL in the shader of rings
	 * (blueprintRing(r, world, normal, inout color, inout alpha): r how far across the ring, 0 at its inner edge and 1 at its
	 * outer), which reads what that shader has (uColors its four colors, uSeed, the lights and their shadows). Its blocks in
	 * their order: RingPlace (R, World, Normal, Seed), RingBands (its bands, wide and fine, of WideScale and FineScale across
	 * it: how thick it is, Base and as much as Wide and Fine of them, thinned at its edges, Inner and Outer), RingGap (a gap:
	 * At, Width, Depth; as many as there are, each after the last), RingColor (its colors by its bands, Mix of the fine),
	 * RingLight (lit from both sides as its dust scatters it: Back of the light whichever way, Side more as it faces it);
	 * RingEnd its end. LibraryRing() the one of the library (blueprints/shader/ring).
	 */
	Rings: function () {
		var blueprints = this.$Service('Blueprints');
		var shaders = this.$Service('BlueprintShaders');
		var ring = ['ring'];

		function pin (key, type, fallback) {
			return {Key: key, Type: type, Default: fallback};
		}

		function out (key, type) {
			return {Key: key, Type: type || 'float'};
		}

		function number (key, value) {
			return {Key: key, Type: 'number', Value: value};
		}

		function literal (context, key) {
			return shaders.Literal(Number(context.Properties[key]), 'float');
		}

		blueprints.Graph('ring', {
			End: 'RingEnd',
			Text: function (glsl) {
				var written = shaders.Written(glsl);
				var made;

				if (!/\bvoid\s+blueprintRing\s*\(/.test(glsl))
					throw new Error('Elemenx Blueprints: a ring written by hand has no blueprintRing');

				made = {Function: written.Body, Needs: written.Needs, Uniforms: written.Uniforms, Textures: [], Parameters: written.Parameters};
				made.Values = shaders.Values(made);

				return made;
			},
			Compile: function (plan) {
				var shader = shaders.Shader(plan, 'ring');
				var made = {
					Function: ['void blueprintRing(float r, vec3 world, vec3 normal, inout vec3 color, inout float alpha) {']
						.concat(shader.Lines.map(function (line) {
							return '\t' + line;
						}))
						.concat([shader.Result.RingEnd || '', '}'])
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

		/* Where on the ring: how far across it, the point, its normal, the seed of the ring. */
		blueprints.Node('RingPlace', {Graphs: ring, Group: 'input', Inputs: [], Outputs: [out('R'), out('World', 'vec3'), out('Normal', 'vec3'), out('Seed')], GLSL: function () {
			return {R: 'r', World: 'world', Normal: 'normal', Seed: 'uSeed'};
		}});

		blueprints.Node('RingBands', {Graphs: ring, Group: 'ring', Properties: [number('WideScale', 22), number('FineScale', 140), number('Base', 0.2), number('Wide', 0.55), number('Fine', 0.25), number('Inner', 0.05), number('Outer', 0.92)], Inputs: [pin('R', 'float', 'r'), pin('Seed', 'float', 'uSeed')], Outputs: [out('Wide'), out('Fine'), out('Density')], GLSL: function (context) {
			var name = 'r' + context.Index;
			var inputs = context.Inputs;

			context.Need('Noise');
			context.Lines.push('float ' + name + '_wide = noise3(vec3(' + inputs.R + ' * ' + literal(context, 'WideScale') + ', ' + inputs.Seed + ', 0.5));');
			context.Lines.push('float ' + name + '_fine = noise3(vec3(' + inputs.R + ' * ' + literal(context, 'FineScale') + ', ' + inputs.Seed + ', 3.5));');
			context.Lines.push('float ' + name + '_density = (' + literal(context, 'Base') + ' + ' + literal(context, 'Wide') + ' * ' + name + '_wide + ' + literal(context, 'Fine') + ' * ' + name + '_fine) * smoothstep(0.0, ' + literal(context, 'Inner') + ', ' + inputs.R + ') * (1.0 - smoothstep(' + literal(context, 'Outer') + ', 1.0, ' + inputs.R + '));');

			return {Wide: name + '_wide', Fine: name + '_fine', Density: name + '_density'};
		}});

		blueprints.Node('RingGap', {Graphs: ring, Group: 'ring', Properties: [number('At', 0.62), number('Width', 0.015), number('Depth', 0.9)], Inputs: [pin('R', 'float', 'r'), pin('Density', 'float', '1.0')], Outputs: [out('Density')], GLSL: function (context) {
			var name = 'r' + context.Index;
			var width = literal(context, 'Width');

			/*
			 * Never narrower than a pixel and a half across the ring, as dark on the whole (its depth less as it is wider).
			 * Regression: a gap of 0.005 far off was a line of dashes, broken where it was finer than a pixel.
			 */
			context.Lines.push('float ' + name + '_wide = max(' + width + ', fwidth(' + context.Inputs.R + ') * 1.5);');
			context.Lines.push('float ' + name + '_density = ' + context.Inputs.Density + ' * (1.0 - (1.0 - smoothstep(0.0, ' + name + '_wide, abs(' + context.Inputs.R + ' - ' + literal(context, 'At') + '))) * ' + literal(context, 'Depth') + ' * ' + width + ' / ' + name + '_wide);');

			return {Density: name + '_density'};
		}});

		blueprints.Node('RingColor', {Graphs: ring, Group: 'ring', Properties: [number('Mix', 0.6)], Inputs: [pin('Wide', 'float', '0.5'), pin('Fine', 'float', '0.5')], Outputs: [out('Color', 'vec3')], GLSL: function (context) {
			var inputs = context.Inputs;

			return {Color: 'mix(mix(uColors[0], uColors[1], ' + inputs.Wide + '), mix(uColors[2], uColors[3], ' + inputs.Fine + '), ' + inputs.Fine + ' * ' + literal(context, 'Mix') + ')'};
		}});

		blueprints.Node('RingLight', {Graphs: ring, Group: 'ring', Properties: [number('Back', 0.35), number('Side', 0.65)], Inputs: [pin('Color', 'vec3', 'vec3(1.0)'), pin('World', 'vec3', 'world'), pin('Normal', 'vec3', 'normal')], Outputs: [out('Color', 'vec3')], GLSL: function (context) {
			var name = 'r' + context.Index;
			var inputs = context.Inputs;

			context.Lines.push('vec3 ' + name + '_total = uAmbient;');
			context.Lines.push('for (int i = 0; i < 4; i++) {');
			context.Lines.push('\tif (i >= uLightCount) break;');
			context.Lines.push('\t' + name + '_total += uLightColors[i] * (' + literal(context, 'Back') + ' + ' + literal(context, 'Side') + ' * abs(dot(' + inputs.Normal + ', normalize(uLightPositions[i] - ' + inputs.World + ')))) * shadow(' + inputs.World + ', uLightPositions[i]);');
			context.Lines.push('}');

			return {Color: '(' + inputs.Color + ' * ' + name + '_total)'};
		}});

		/* The end: the color of the ring there and how much of it hides what lies behind. */
		blueprints.Node('RingEnd', {Graphs: ring, Group: 'output', Inputs: [pin('Color', 'vec3', 'color'), pin('Alpha', 'float', 'alpha')], Outputs: [],
			GLSL: function (context) {
				return {Result: '\tcolor = ' + context.Inputs.Color + ';\n\talpha = ' + context.Inputs.Alpha + ';'};
			}
		});
	},

	/* A ring of the library (blueprints/shader/ring): see Rings. */
	LibraryRing: function () {
		return this.LibraryShader('ring');
	},

	/*
	 * A kind of graph of a function of a body painted in a shader (planet...): its hook, End its end, its function made of
	 * the lines of its blocks (or written by hand with that function).
	 */
	Painted: function (kind, end, head) {
		var blueprints = this.$Service('Blueprints');
		var shaders = this.$Service('BlueprintShaders');
		var name = /void\s+(\w+)\s*\(/.exec(head)[1];

		blueprints.Graph(kind, {
			End: end,
			Text: function (glsl) {
				var written = shaders.Written(glsl);
				var made;

				if (glsl.indexOf(name + '(') === -1)
					throw new Error('Elemenx Blueprints: a ' + kind + ' written by hand has no ' + name);

				made = {Function: written.Body, Needs: written.Needs, Uniforms: written.Uniforms, Textures: [], Parameters: written.Parameters};
				made.Values = shaders.Values(made);

				return made;
			},
			Compile: function (plan) {
				var shader = shaders.Shader(plan, kind);
				var made = {
					Function: [head + ' {']
						.concat(shader.Lines.map(function (line) {
							return '\t' + line;
						}))
						.concat([shader.Result[end] || '', '}'])
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
	},

	/*
	 * A globe from far as a graph (the kind planet: PlanetGraph of a Scene): blueprintPlanet(n, v, p, inout color, inout
	 * alpha) in the Planet shader (n its normal, v the way to the eye, p the place on its body), which reads what that shader
	 * has (uGround its picture baked, uSky its clouds and heat baked, uWeather, uLights, uRelief, uAtmosphere, uHighlight).
	 * Its blocks: PlanetPlace (Normal, View, Point, World, Day: how much of a sun lights it there), PlanetSurface (its
	 * picture: Albedo, Gloss), PlanetRelief (its ranges for the light: Lean the slopes of its picture, Steep how much steeper),
	 * PlanetGas (the tops of the clouds of a giant near: its bands torn by a flow, its billows; Strength, Stretch, Swirl,
	 * Near, Bump), PlanetLight (Shine and Gloss its highlight), PlanetHeat (the glow of lava, Glow), PlanetClouds (of its weather or drawn:
	 * Cover, Color, Shade under them, Veil over its lights; Tint, Haze, Shadow, Veil, DrawnVeil), RingShadow (of its ring,
	 * the one of the ring graph, its gaps alike: Strength), PlanetShade, GlobeLights (its towns at night, a block of the
	 * ground of a globe too: Red, Green, Blue, Strength), PlanetMix (its clouds over it), PlanetRim (its air at its edge,
	 * Power), PlanetHighlight (Power), PlanetEnd (the clouds alone where the shader draws only them: uCloudsOnly).
	 * LibraryPlanet() the one of the library (blueprints/shader/planet).
	 */
	Planets: function () {
		var blueprints = this.$Service('Blueprints');
		var shaders = this.$Service('BlueprintShaders');
		var planet = ['planet'];

		function pin (key, type, fallback) {
			return {Key: key, Type: type, Default: fallback};
		}

		function out (key, type) {
			return {Key: key, Type: type || 'float'};
		}

		function number (key, value) {
			return {Key: key, Type: 'number', Value: value};
		}

		function literal (context, key) {
			return shaders.Literal(Number(context.Properties[key]), 'float');
		}

		/* A block of lines: its name of the index of the block, its inputs and literal of its properties at hand. */
		function node (type, graphs, properties, inputs, outputs, lines) {
			blueprints.Node(type, {Graphs: graphs, Group: inputs.length ? graphs[0] : 'input', Properties: properties, Inputs: inputs, Outputs: outputs, GLSL: function (context) {
				return lines(context, 'g' + context.Index + '_', context.Inputs, function (key) {
					return literal(context, key);
				});
			}});
		}

		var normal = pin('Normal', 'vec3', 'n');
		var view = pin('View', 'vec3', 'v');
		var point = pin('Point', 'vec3', 'p');
		var world = pin('World', 'vec3', 'vWorld');
		var color = pin('Color', 'vec3', 'color');

		this.Painted('planet', 'PlanetEnd', 'void blueprintPlanet(vec3 n, vec3 v, vec3 p, inout vec3 color, inout float alpha)');

		node('PlanetPlace', planet, [], [], [out('Normal', 'vec3'), out('View', 'vec3'), out('Point', 'vec3'), out('World', 'vec3'), out('Day')], function () {
			return {Normal: 'n', View: 'v', Point: 'p', World: 'vWorld', Day: 'daylight(vWorld, n)'};
		});

		node('PlanetSurface', planet, [], [point], [out('Albedo', 'vec3'), out('Gloss')], function (context, name, inputs) {
			context.Lines.push('vec4 ' + name + 'surface = texture(uGround, ' + inputs.Point + ');');

			return {Albedo: name + 'surface.rgb', Gloss: name + 'surface.a'};
		});

		/* Its ranges lit from orbit: the slopes made Steep times steeper, as the eye reads mountains by their light from space. */
		node('PlanetRelief', planet, [number('Lean', 2.5), number('Steep', 8)], [normal, point], [out('Lit', 'vec3')], function (context, name, inputs, value) {
			context.Lines.push('vec3 ' + name + 'lit = ' + inputs.Normal + ';');
			context.Lines.push('if (uReliefOn > 0.5) {');
			context.Lines.push('\tvec3 ' + name + 'lean = (texture(uRelief, ' + inputs.Point + ').xyz - 0.5) / ' + value('Lean') + ';');
			context.Lines.push('\t' + name + 'lit = normalize(mat3(uModel) * normalize(' + inputs.Point + ' + ' + name + 'lean * ' + value('Steep') + '));');
			context.Lines.push('}');

			return {Lit: name + 'lit'};
		});

		/*
		 * The tops of the clouds of a giant near (a body of the kind 4), finer the nearer the eye (Near: how many radii away
		 * they begin to show): its bands baked read where a flow of noise pushes them (Swirl: how far, Stretch: drawn out along
		 * its latitudes), their edges torn into festoons and eddies; nearer, the billows of its tops, lit as they stand (Bump:
		 * how much they lean its light), as much as Strength says.
		 */
		node('PlanetGas', planet, [number('Strength', 1), number('Stretch', 4), number('Swirl', 1), number('Near', 3), number('Bump', 0.8)], [pin('Albedo', 'vec3', 'vec3(0.5)'), pin('Lit', 'vec3', 'n'), point, world], [out('Albedo', 'vec3'), out('Lit', 'vec3')], function (context, name, inputs, value) {
			var p = inputs.Point;
			var n = name;

			context.Lines.push('vec3 ' + n + 'albedo = ' + inputs.Albedo + ';');
			context.Lines.push('vec3 ' + n + 'lit = ' + inputs.Lit + ';');
			context.Lines.push('if (uKind == 4 && uCloudsOnly < 0.5) {');
			context.Lines.push('\tfloat ' + n + 'far = length(' + inputs.World + ' - uCamera) / length(uModel[0].xyz);');
			context.Lines.push('\tfloat ' + n + 'bands = smoothstep(' + value('Near') + ', ' + value('Near') + ' * 0.4, ' + n + 'far) * ' + value('Strength') + ';');
			context.Lines.push('\tif (' + n + 'bands > 0.0) {');
			context.Lines.push('\t\tvec3 ' + n + 'q = vec3(' + p + '.x, ' + p + '.y * ' + value('Stretch') + ', ' + p + '.z);');
			context.Lines.push('\t\tvec3 ' + n + 'flow = vec3(fbm3(' + n + 'q * 14.0, 3), fbm3(' + n + 'q * 14.0 + 4.2, 3), fbm3(' + n + 'q * 14.0 - 2.7, 3)) - 0.5;');
			context.Lines.push('\t\tvec3 ' + n + 'eddy = vec3(fbm3(' + n + 'q * 70.0 + ' + n + 'flow * 6.0, 3), fbm3(' + n + 'q * 70.0 + ' + n + 'flow * 6.0 + 1.9, 3), fbm3(' + n + 'q * 70.0 + ' + n + 'flow * 6.0 - 3.3, 3)) - 0.5;');
			context.Lines.push('\t\tvec3 ' + n + 'moved = normalize(' + p + ' + (' + n + 'flow * 0.035 + ' + n + 'eddy * 0.012) * ' + value('Swirl') + ' * ' + n + 'bands);');
			context.Lines.push('\t\t' + n + 'albedo = mix(' + n + 'albedo, texture(uGround, ' + n + 'moved).rgb, ' + n + 'bands);');
			context.Lines.push('\t\t' + n + 'albedo *= max(0.45, 1.0 + (' + n + 'eddy.x * 1.3 + ' + n + 'flow.y * 0.9) * ' + n + 'bands * (1.0 - 0.5 * smoothstep(0.1, 0.01, ' + n + 'far)));');
			context.Lines.push('\t}');
			context.Lines.push('\tfloat ' + n + 'near = smoothstep(' + value('Near') + ' * 0.08, ' + value('Near') + ' * 0.015, ' + n + 'far) * ' + value('Strength') + ';');
			context.Lines.push('\tif (' + n + 'near > 0.0) {');
			context.Lines.push('\t\tfloat ' + n + 'fine = smoothstep(' + value('Near') + ' * 0.004, ' + value('Near') + ' * 0.0008, ' + n + 'far);');
			context.Lines.push('\t\tvec3 ' + n + 'b = ' + p + ' * vec3(900.0, 1500.0, 900.0);');
			context.Lines.push('\t\tfloat ' + n + 'puff = fbm3(' + n + 'b, 4) + (fbm3(' + n + 'b * 9.0, 3) - 0.5) * 0.3 * ' + n + 'fine;');
			context.Lines.push('\t\tfloat ' + n + 'dx = fbm3(' + n + 'b + vec3(0.08, 0.0, 0.0), 4);');
			context.Lines.push('\t\tfloat ' + n + 'dz = fbm3(' + n + 'b + vec3(0.0, 0.0, 0.08), 4);');
			context.Lines.push('\t\tvec3 ' + n + 'tilt = mat3(uModel) * vec3(' + n + 'dx - ' + n + 'puff, 0.0, ' + n + 'dz - ' + n + 'puff) / length(uModel[0].xyz);');
			context.Lines.push('\t\t' + n + 'albedo *= mix(1.0, 0.7 + 0.65 * ' + n + 'puff, ' + n + 'near);');
			context.Lines.push('\t\t' + n + 'lit = normalize(' + n + 'lit - ' + n + 'tilt * 6.0 * ' + value('Bump') + ' * ' + n + 'near);');
			context.Lines.push('\t}');
			context.Lines.push('}');

			return {Albedo: n + 'albedo', Lit: n + 'lit'};
		});

		node('PlanetLight', planet, [number('Shine', 12), number('Gloss', 70)], [pin('Albedo', 'vec3', 'vec3(0.5)'), pin('Gloss', 'float', '0.0'), pin('Lit', 'vec3', 'n'), view, world], [out('Color', 'vec3')], function (context, name, inputs, value) {
			context.Lines.push('vec3 ' + name + 'light = lighting(' + inputs.World + ', ' + inputs.Lit + ', ' + inputs.View + ', ' + value('Shine') + ' + ' + inputs.Gloss + ' * ' + value('Gloss') + ', ' + inputs.Gloss + ');');

			return {Color: '(' + inputs.Albedo + ' * ' + name + 'light)'};
		});

		/* The glow of lava (a body of the kind 3): its heat baked (uSky: g how much, b how hot). */
		node('PlanetHeat', planet, [number('Glow', 1.6)], [color, point], [out('Color', 'vec3')], function (context, name, inputs, value) {
			context.Lines.push('vec4 ' + name + 'heat = texture(uSky, ' + inputs.Point + ');');
			context.Lines.push('vec3 ' + name + 'color = ' + inputs.Color + ';');
			context.Lines.push('if (uKind == 3) ' + name + 'color += mix(uColors[2], uColors[3], ' + name + 'heat.b) * ' + name + 'heat.g * ' + value('Glow') + ';');

			return {Color: name + 'color'};
		});

		/*
		 * Its clouds: of its weather, when it has one (cloudSeen, cloudSide, cloudUnder of the clouds graph), each darker on
		 * its side away from the sun (white, tinted by its air by Tint), their shadows on the ground (Shadow); else of its
		 * clouds baked (uSky, turned by the wind: uDrift), hazy of its air when it is all clouds (Haze). Veil, DrawnVeil: how
		 * much of its lights at night they hide.
		 */
		node('PlanetClouds', planet, [number('Tint', 0.12), number('Shadow', 0.7), number('Veil', 0.8), number('Haze', 0.55), number('DrawnVeil', 0.7)], [normal, view, point, world], [out('Cover'), out('Color', 'vec3'), out('Shade'), out('Veil')], function (context, name, inputs, value) {
			var p = inputs.Point;

			context.Lines.push('vec3 ' + name + 'lit = lighting(' + inputs.World + ', ' + inputs.Normal + ', ' + inputs.View + ', 1.0, 0.0);');
			context.Lines.push('float ' + name + 'cover;');
			context.Lines.push('vec3 ' + name + 'color;');
			context.Lines.push('float ' + name + 'shade = 1.0;');
			context.Lines.push('float ' + name + 'veil;');
			context.Lines.push('if (uWeatherOn > 0.5) {');
			context.Lines.push('\tfloat ' + name + 'foot = max(length(fwidth(' + p + ')) * uRadiusKm, 0.05);');
			context.Lines.push('\tvec3 ' + name + 'sun = normalize(transpose(mat3(uModel)) * (uLightPositions[0] - ' + inputs.World + '));');
			context.Lines.push('\tfloat ' + name + 'high = dot(' + name + 'sun, ' + p + ');');
			context.Lines.push('\tvec3 ' + name + 'toward = normalize(' + name + 'sun - ' + p + ' * ' + name + 'high + vec3(1e-6));');
			context.Lines.push('\tvec4 ' + name + 'w = texture(uWeather, ' + p + ');');
			context.Lines.push('\t' + name + 'cover = cloudSeen(' + p + ', ' + name + 'w, ' + name + 'foot);');
			context.Lines.push('\tfloat ' + name + 'side = cloudSide(' + p + ', ' + name + 'w.r, ' + name + 'toward, ' + name + 'high, ' + name + 'foot);');
			context.Lines.push('\t' + name + 'shade = 1.0 - ' + value('Shadow') + ' * (cloudUnder(' + p + ', ' + name + 'w.g, ' + name + 'toward, ' + name + 'high) * smoothstep(0.0, 0.12, ' + name + 'high));');
			context.Lines.push('\t' + name + 'color = mix(vec3(0.97), uAtmosphere.rgb, ' + value('Tint') + ' * uAtmosphere.a) * ' + name + 'lit * (1.0 - ' + name + 'side);');
			context.Lines.push('\t' + name + 'veil = ' + name + 'cover * ' + value('Veil') + ';');
			context.Lines.push('}');
			context.Lines.push('else {');
			context.Lines.push('\tvec3 ' + name + 'drifted = vec3(' + p + '.x * cos(uDrift) - ' + p + '.z * sin(uDrift), ' + p + '.y, ' + p + '.x * sin(uDrift) + ' + p + '.z * cos(uDrift));');
			context.Lines.push('\tfloat ' + name + 'sky = texture(uSky, ' + name + 'drifted).r;');
			context.Lines.push('\t' + name + 'cover = uClouds > 0.0 ? ' + name + 'sky : 0.0;');
			context.Lines.push('\t' + name + 'color = mix(vec3(0.96), uAtmosphere.rgb, uClouds >= 1.0 ? ' + value('Haze') + ' * uAtmosphere.a : 0.0) * ' + name + 'lit;');
			context.Lines.push('\t' + name + 'veil = uClouds > 0.0 ? ' + name + 'sky * ' + value('DrawnVeil') + ' : 0.0;');
			context.Lines.push('}');

			return {Cover: name + 'cover', Color: name + 'color', Shade: name + 'shade', Veil: name + 'veil'};
		});

		/*
		 * The shadow of its ring on it (uRingOn: it has one; uRingAxis, uRingSpan: its inner and outer edge; uRingSeed): where
		 * the way to the sun crosses the ring, as much as the ring is there (planetRing: the ring graph, its gaps alike), by
		 * Strength. Of no branch (its gaps are as wide as a pixel of the shadow).
		 */
		node('RingShadow', planet, [number('Strength', 0.9)], [world], [out('Shade')], function (context, name, inputs, value) {
			var w = inputs.World;

			context.Lines.push('vec3 ' + name + 'sun = normalize(uLightPositions[0] - ' + w + ');');
			context.Lines.push('vec3 ' + name + 'centre = uModel[3].xyz;');
			context.Lines.push('float ' + name + 'facing = dot(' + name + 'sun, uRingAxis);');
			context.Lines.push('float ' + name + 'far = dot(' + name + 'centre - ' + w + ', uRingAxis) / (abs(' + name + 'facing) > 1e-4 ? ' + name + 'facing : 1e-4);');
			context.Lines.push('vec3 ' + name + 'hit = ' + w + ' + ' + name + 'sun * ' + name + 'far;');
			context.Lines.push('float ' + name + 'r = (length(' + name + 'hit - ' + name + 'centre) - uRingSpan.x) / (uRingSpan.y - uRingSpan.x);');
			context.Lines.push('vec3 ' + name + 'seen = vec3(0.0);');
			context.Lines.push('float ' + name + 'ring = 0.0;');
			context.Lines.push('planetRing(clamp(' + name + 'r, 0.0, 1.0), ' + name + 'hit, uRingAxis, ' + name + 'seen, ' + name + 'ring);');

			return {Shade: '(1.0 - ' + name + 'ring * ' + value('Strength') + ' * step(0.0, ' + name + 'far) * step(0.0, ' + name + 'r) * step(' + name + 'r, 1.0) * uRingOn)'};
		});

		node('PlanetShade', planet, [], [color, pin('Shade', 'float', '1.0'), pin('Ring', 'float', '1.0')], [out('Color', 'vec3')], function (context, name, inputs) {
			context.Lines.push('vec3 ' + name + 'color = ' + inputs.Color + ' * ' + inputs.Shade + ' * ' + inputs.Ring + ';');

			return {Color: name + 'color'};
		});

		/* Its towns at night: their light (uLights) where its sun is down (Day), as much as no cloud hides them (Veil). */
		node('GlobeLights', ['planet', 'ground'], [number('Red', 1), number('Green', 0.72), number('Blue', 0.38), number('Strength', 1.6)], [color, point, pin('Day', 'float', '0.0'), pin('Veil', 'float', '0.0')], [out('Color', 'vec3')], function (context, name, inputs, value) {
			context.Lines.push('vec3 ' + name + 'color = ' + inputs.Color + ';');
			context.Lines.push('if (uLightsOn > 0.5) ' + name + 'color += vec3(' + value('Red') + ', ' + value('Green') + ', ' + value('Blue') + ') * texture(uLights, ' + inputs.Point + ').r * ' + value('Strength') + ' * (1.0 - ' + inputs.Day + ') * (1.0 - ' + inputs.Veil + ');');

			return {Color: name + 'color'};
		});

		node('PlanetMix', planet, [], [color, pin('Clouds', 'vec3', 'vec3(1.0)'), pin('Cover', 'float', '0.0'), pin('Ring', 'float', '1.0')], [out('Color', 'vec3')], function (context, name, inputs) {
			context.Lines.push('vec3 ' + name + 'color = mix(' + inputs.Color + ', ' + inputs.Clouds + ' * ' + inputs.Ring + ', ' + inputs.Cover + ');');

			return {Color: name + 'color'};
		});

		node('PlanetRim', planet, [number('Power', 3)], [color, normal, view, pin('Day', 'float', '1.0')], [out('Color', 'vec3')], function (context, name, inputs, value) {
			context.Lines.push('vec3 ' + name + 'color = ' + inputs.Color + ' + uAtmosphere.rgb * pow(1.0 - max(dot(' + inputs.Normal + ', ' + inputs.View + '), 0.0), ' + value('Power') + ') * uAtmosphere.a * ' + inputs.Day + ';');

			return {Color: name + 'color'};
		});

		node('PlanetHighlight', planet, [number('Power', 6)], [color, normal, view], [out('Color', 'vec3')], function (context, name, inputs, value) {
			context.Lines.push('vec3 ' + name + 'color = ' + inputs.Color + ' + uHighlight.rgb * pow(1.0 - max(dot(' + inputs.Normal + ', ' + inputs.View + '), 0.0), ' + value('Power') + ') * uHighlight.a;');

			return {Color: name + 'color'};
		});

		/* The end: its color, whole; or (uCloudsOnly: a shell of its clouds over its ground near) its clouds alone, as much as they cover. */
		blueprints.Node('PlanetEnd', {Graphs: planet, Group: 'output', Inputs: [color, pin('Clouds', 'vec3', 'vec3(1.0)'), pin('Cover', 'float', '0.0')], Outputs: [],
			GLSL: function (context) {
				var inputs = context.Inputs;

				return {Result: '\tif (uCloudsOnly > 0.5) {\n\t\tcolor = ' + inputs.Clouds + ';\n\t\talpha = ' + inputs.Cover + ';\n\t}\n\telse {\n\t\tcolor = ' + inputs.Color + ';\n\t\talpha = 1.0;\n\t}'};
			}
		});
	},

	/* A globe of the library (blueprints/shader/planet): see Planets. */
	LibraryPlanet: function () {
		return this.LibraryShader('planet');
	},

	/*
	 * The ground of a globe near as a graph (the kind ground: GroundGraph of a Scene): blueprintGround(inout color) in the
	 * Ground shader, which reads what that shader has (the picture of its square, its woods, use and snow, the tiles near,
	 * its weather, its lights at night). Its blocks: GroundPlace (Normal, View, Up, Height, Sea, Place: km from the middle,
	 * Near: km from the anchor, exact, Foot: km a pixel, World), GroundBase (its colors by height, its rock where steep),
	 * GroundPicture (its square's picture read ragged: Albedo, Normal, Water, At, Soft, DX, DY), GroundIce (its caps),
	 * GroundMottle (its land mottled at kilometres to tens of metres), GroundWoods (stands of its woods: Wooded, Stands, Cover),
	 * GroundFields (its fields and houses: Rise of its hedges), GroundCrowns (what grows near: Green, Crowns), GroundSnow,
	 * GroundDunes, GroundRelief (its normal bent by its bumps and ridges: Normal, Smoothed before them), GroundTiles (the
	 * tiles of materials near: groundLaid of the shader, the materials of a location for a ground near), GroundRing (the
	 * shadow of a ring, the alpha of the ring graph), GroundLight (Color, Rise, Light, Dusk, Around, Toward, Day: for its
	 * lights at night), GroundWater, GlobeLights (of the planet graph too), GroundClouds (seen from over them), GroundAir,
	 * GroundEnd. LibraryGround() the one of the library (blueprints/shader/ground).
	 */
	Grounds: function () {
		var blueprints = this.$Service('Blueprints');
		var shaders = this.$Service('BlueprintShaders');
		var ground = ['ground'];
		var askew = 'mat3(0.80, 0.36, -0.48, -0.60, 0.48, -0.64, 0.0, 0.80, 0.60)';

		function pin (key, type, fallback) {
			return {Key: key, Type: type || 'float', Default: fallback};
		}

		function out (key, type) {
			return {Key: key, Type: type || 'float'};
		}

		function number (key, value) {
			return {Key: key, Type: 'number', Value: value};
		}

		/* A block of lines: its name of the index of the block, its inputs and literal of its properties at hand. */
		function node (type, properties, inputs, outputs, lines) {
			blueprints.Node(type, {Graphs: ground, Group: inputs.length ? 'ground' : 'input', Properties: properties, Inputs: inputs, Outputs: outputs, GLSL: function (context) {
				return lines(context, 'd' + context.Index + '_', context.Inputs, function (key) {
					return shaders.Literal(Number(context.Properties[key]), 'float');
				}, function (line) {
					context.Lines.push(line);
				});
			}});
		}

		var albedo = pin('Albedo', 'vec3', 'vec3(0.5)');
		var normal = pin('Normal', 'vec3', 'normalize(vNormal)');
		var up = pin('Up', 'vec3', 'vDirection');
		var water = pin('Water', 'float', '0.0');
		var place = pin('Place', 'vec3', 'vDirection * uRadius');
		var near = pin('Near', 'vec3', 'vWorld + uAnchor');
		var foot = pin('Foot', 'float', 'length(fwidth(vDirection * uRadius))');
		var at = pin('At', 'vec2', 'vPatch');
		var dx = pin('DX', 'vec2', 'vec2(0.0)');
		var dy = pin('DY', 'vec2', 'vec2(0.0)');
		var color = pin('Color', 'vec3', 'color');

		this.Painted('ground', 'GroundEnd', 'void blueprintGround(inout vec3 color)');

		node('GroundPlace', [], [], [out('Normal', 'vec3'), out('View', 'vec3'), out('Up', 'vec3'), out('Height'), out('Sea'), out('Place', 'vec3'), out('Near', 'vec3'), out('Foot'), out('World', 'vec3')], function (context, name, inputs, value, line) {
			line('vec3 ' + name + 'place = vDirection * uRadius;');
			/* Kilometres a pixel covers: what is finer than two pixels is not drawn, or it shimmers as the view moves. */
			line('float ' + name + 'foot = length(fwidth(' + name + 'place));');

			/*
			 * Regression: the place of the very point (its direction times the radius, thousands of km) trembles in the floats by
			 * half a metre from pixel to pixel; noises of tens of metres of it, and their slopes, were specks. What is finer than
			 * a kilometre is of the point from the anchor (uAnchor, km), exact: Near.
			 */
			return {Normal: 'normalize(vNormal)', View: 'normalize(-vWorld)', Up: 'vDirection', Height: 'vLand.x', Sea: 'vLand.y', Place: name + 'place', Near: '(vWorld + uAnchor)', Foot: name + 'foot', World: 'vWorld'};
		});

		/* Its colors by its height (uColors), its sea deeper darker; its slopes steeper for the light from far (uRelief), rock where steep. */
		node('GroundBase', [number('Shallow', 1.25), number('Deep', 0.55), number('Depth', 4), number('RockFrom', 0.55), number('RockTo', 0.75), number('Rock', 0.6), number('RockDark', 0.8), number('PaintedRock', 0.55)], [normal, up, pin('Height', 'float', 'vLand.x'), pin('Sea', 'float', 'vLand.y')], [out('Albedo', 'vec3'), out('Normal', 'vec3'), out('Water')], function (context, name, inputs, value, line) {
			var u = inputs.Up;
			var sea = inputs.Sea;

			line('vec3 ' + name + 'albedo = ' + sea + ' > 0.5 ? mix(uWater * ' + value('Shallow') + ', uWater * ' + value('Deep') + ', clamp(-' + inputs.Height + ' * ' + value('Depth') + ', 0.0, 1.0)) : ground(clamp(' + inputs.Height + ', 0.0, 1.0));');
			line('vec3 ' + name + 'n = ' + inputs.Normal + ';');
			/* From far its relief is told by its light: the slopes made steeper for the light (uRelief), as the eye reads mountains from orbit. */
			line('if (uRelief > 1.0) ' + name + 'n = normalize(' + u + ' + (' + name + 'n - ' + u + ' * dot(' + name + 'n, ' + u + ')) * uRelief);');
			line('if (' + sea + ' > 0.5) ' + name + 'n = ' + u + ';');
			line('float ' + name + 'rock = 1.0 - smoothstep(' + value('RockFrom') + ', ' + value('RockTo') + ', dot(' + name + 'n, ' + u + '));');
			line('if (' + sea + ' < 0.5) ' + name + 'albedo = mix(' + name + 'albedo, uColors[1] * ' + value('RockDark') + ', ' + name + 'rock * ' + value('Rock') + ');');
			line('if (uPainted > 0.5) ' + name + 'albedo = ' + sea + ' > 0.5 ? vPainted : mix(vPainted, vec3(0.42, 0.39, 0.35), ' + name + 'rock * ' + value('PaintedRock') + ');');

			return {Albedo: name + 'albedo', Normal: name + 'n', Water: sea};
		});

		/*
		 * Its picture (uTiled): read a little aside by a noise of its texels, so the edges between its colors are ragged within
		 * a texel and never a row of steps; its relief of its own normals, finer than its points, the slopes made steeper as
		 * above. Far ground, its texels wide on the screen: its edges ragged finer still (Ragged), each texel its own color up
		 * to a narrow seam (Seam: at least, of a texel), not one color drawn into the next over all its width. Regression:
		 * from a few kilometres up the ground was smears and stretched blotches.
		 */
		node('GroundPicture', [number('Ragged', 0.36), number('Seam', 0.22), number('Aside', 1.1)], [albedo, normal, water, up], [out('Albedo', 'vec3'), out('Normal', 'vec3'), out('Water'), out('At', 'vec2'), out('Soft', 'vec2'), out('DX', 'vec2'), out('DY', 'vec2')], function (context, name, inputs, value, line) {
			var u = inputs.Up;

			line('vec3 ' + name + 'albedo = ' + inputs.Albedo + ';');
			line('vec3 ' + name + 'n = ' + inputs.Normal + ';');
			line('float ' + name + 'water = ' + inputs.Water + ';');
			line('vec2 ' + name + 'at = vPatch;');
			line('vec2 ' + name + 'soft = vPatch;');
			line('vec2 ' + name + 'x = vec2(0.0);');
			line('vec2 ' + name + 'y = vec2(0.0);');
			line('if (uTiled > 0.5) {');
			line('\tvec2 ' + name + 'tc = vPatch * (uTexels - 1.0) / uTexels + 0.5 / uTexels;');
			line('\tvec2 ' + name + 'grid = ' + name + 'tc * uTexels;');
			line('\t' + name + 'x = dFdx(' + name + 'tc);');
			line('\t' + name + 'y = dFdy(' + name + 'tc);');
			/* Texels a pixel: a texel over two pixels wide is a square of a smear unless something finer is told in it. */
			line('\tfloat ' + name + 'texel = max(length(' + name + 'x), length(' + name + 'y)) * uTexels;');
			line('\tvec2 ' + name + 'aside = vec2(enx_fvalue3(vec3(' + name + 'grid * 1.7, 3.1)) + enx_fvalue3(vec3(' + name + 'grid * 4.3, 5.7)) * 0.5, enx_fvalue3(vec3(' + name + 'grid * 1.7, 9.7)) + enx_fvalue3(vec3(' + name + 'grid * 4.3, 1.3)) * 0.5) - 0.75;');
			line('\t' + name + 'aside += vec2(enx_fvalue3(vec3(' + name + 'grid * 11.0, 2.3)) - 0.5, enx_fvalue3(vec3(' + name + 'grid * 11.0, 8.9)) - 0.5) * ' + value('Ragged') + ' * (1.0 - smoothstep(0.02, 0.04, ' + name + 'texel));');
			line('\tvec2 ' + name + 'g = ' + name + 'grid + ' + name + 'aside * ' + value('Aside') + ' - 0.5;');
			line('\t' + name + 'soft = (' + name + 'g + 0.5) / uTexels;');
			line('\tvec2 ' + name + 'inside = fract(' + name + 'g);');
			line('\tfloat ' + name + 'seam = clamp(max(' + name + 'texel * 1.5, ' + value('Seam') + '), 0.0, 0.5);');
			line('\t' + name + 'inside = clamp((' + name + 'inside - 0.5) / (2.0 * ' + name + 'seam) + 0.5, 0.0, 1.0);');
			line('\t' + name + 'inside = ' + name + 'inside * ' + name + 'inside * (3.0 - 2.0 * ' + name + 'inside);');
			line('\t' + name + 'at = (floor(' + name + 'g) + ' + name + 'inside + 0.5) / uTexels;');
			line('\tvec4 ' + name + 'painted = textureGrad(uColorMap, ' + name + 'at, ' + name + 'x, ' + name + 'y);');
			line('\t' + name + 'albedo = ' + name + 'painted.rgb;');
			line('\t' + name + 'water = ' + name + 'painted.a;');
			line('\t' + name + 'n = normalize(texture(uReliefMap, ' + name + 'tc).xyz * 2.0 - 1.0);');
			line('\tif (uRelief > 1.0) ' + name + 'n = normalize(' + u + ' + (' + name + 'n - ' + u + ' * dot(' + name + 'n, ' + u + ')) * uRelief);');
			line('\t' + name + 'n = normalize(mix(' + name + 'n, ' + u + ', ' + name + 'water));');
			line('}');

			return {Albedo: name + 'albedo', Normal: name + 'n', Water: name + 'water', At: name + 'at', Soft: name + 'soft', DX: name + 'x', DY: name + 'y'};
		});

		/* Its caps of ice (uIce: how far from its poles), their edge ragged by Ragged. */
		node('GroundIce', [number('Scale', 6.6), number('Ragged', 0.3), number('Edge', 0.04)], [albedo, up], [out('Albedo', 'vec3')], function (context, name, inputs, value, line) {
			context.Need('Noise');

			line('vec3 ' + name + 'albedo = ' + inputs.Albedo + ';');
			line('if (uIce > 0.0 && uPainted < 0.5) {');
			line('\tfloat ' + name + 'pole = abs(' + inputs.Up + '.y) + (fbm3(' + inputs.Up + ' * ' + value('Scale') + ', 3) - 0.5) * ' + value('Ragged') + ';');
			line('\tfloat ' + name + 'cap = uIce >= 1.0 ? 1.0 : smoothstep(1.0 - uIce, 1.0 - uIce + ' + value('Edge') + ', ' + name + 'pole);');
			line('\t' + name + 'albedo = mix(' + name + 'albedo, vec3(0.93, 0.95, 0.98), ' + name + 'cap);');
			line('}');

			return {Albedo: name + 'albedo'};
		});

		/* Its land mottled at kilometres, hundreds and tens of metres (fields, woods, stone), each as long as it is over two pixels. */
		node('GroundMottle', [number('Far', 0.2), number('Middle', 0.14), number('Fine', 0.1)], [albedo, water, place, near, foot], [out('Albedo', 'vec3')], function (context, name, inputs, value, line) {
			var f = inputs.Foot;

			line('float ' + name + 'mottle = (enx_fvalue3(' + inputs.Place + ' * 0.35) - 0.5) * ' + value('Far') + ' * (1.0 - smoothstep(1.2, 4.0, ' + f + ')) + (enx_fvalue3(' + inputs.Place + ' * 1.9 + 7.0) - 0.5) * ' + value('Middle') + ' * (1.0 - smoothstep(0.25, 0.8, ' + f + ')) + (enx_fvalue3(' + inputs.Near + ' * 9.0 + 3.0) - 0.5) * ' + value('Fine') + ' * (1.0 - smoothstep(0.05, 0.15, ' + f + '));');

			return {Albedo: '(' + inputs.Albedo + ' * (1.0 + ' + name + 'mottle * (1.0 - ' + inputs.Water + ')))'};
		});

		/*
		 * Its woods (the share trees cover, of its picture, read aside as its colors are): stands of tens and hundreds of
		 * metres, as many as the share, each octave turned against the last (no grid of the noise in their edges); from far
		 * their mean, a darker green (Red, Green, Blue); their edges a pixel and a half wide at least (no specks along them).
		 */
		node('GroundWoods', [number('Red', 0.42), number('Green', 0.56), number('Blue', 0.4)], [albedo, water, place, near, foot, at, dx, dy], [out('Albedo', 'vec3'), out('Wooded'), out('Stands'), out('Cover')], function (context, name, inputs, value, line) {
			var f = inputs.Foot;

			line('float ' + name + 'cover = uTiled * uWoods > 0.5 ? textureGrad(uReliefMap, ' + inputs.At + ', ' + inputs.DX + ', ' + inputs.DY + ').a : 0.0;');
			line('mat3 ' + name + 'askew = ' + askew + ';');
			line('float ' + name + 'stands = enx_fvalue3(' + name + 'askew * ' + inputs.Place + ' * 14.0 + 21.0) * 0.5 + enx_fvalue3(' + inputs.Place + ' * 2.6 + 9.0) * 0.32 + enx_fvalue3(' + name + 'askew * (' + name + 'askew * ' + inputs.Near + ') * 61.0 + 4.0) * 0.18 * (1.0 - smoothstep(0.004, 0.012, ' + f + '));');
			line('float ' + name + 'spread = clamp(max(' + f + ' * 6.0, fwidth(' + name + 'stands) * 1.5), 0.02, 0.5);');
			line('float ' + name + 'wooded = mix(smoothstep(0.5 + (0.5 - ' + name + 'cover) * 0.5 - ' + name + 'spread, 0.5 + (0.5 - ' + name + 'cover) * 0.5 + ' + name + 'spread, ' + name + 'stands), ' + name + 'cover, smoothstep(0.05, 0.2, ' + f + ')) * step(0.01, ' + name + 'cover) * (1.0 - ' + inputs.Water + ');');
			line('vec3 ' + name + 'albedo = mix(' + inputs.Albedo + ', ' + inputs.Albedo + ' * vec3(' + value('Red') + ', ' + value('Green') + ', ' + value('Blue') + ') + vec3(0.0, 0.015, 0.0), ' + name + 'wooded);');

			return {Albedo: name + 'albedo', Wooded: name + 'wooded', Stands: name + 'stands', Cover: name + 'cover'};
		});

		/* Its fields and houses (dwelling of the shader: uDwelt, uUseMap), of the place on its face; Rise: km its hedges stand up. */
		node('GroundFields', [], [albedo, water, foot], [out('Albedo', 'vec3'), out('Rise')], function (context, name, inputs, value, line) {
			line('vec3 ' + name + 'albedo = ' + inputs.Albedo + ';');
			line('vec2 ' + name + 'at = uSquare.xy + vPatch * uSquare.z;');
			line('vec2 ' + name + 'wide = fwidth(' + name + 'at);');
			line('float ' + name + 'rise = 0.0;');
			line('if (uDwelt > 0.5) {');
			line('\tvec3 ' + name + 'use = texture(uUseMap, vPatch * (uTexels - 1.0) / uTexels + 0.5 / uTexels).rgb;');
			line('\t' + name + 'albedo = mix(dwelling(' + name + 'albedo, ' + name + 'at, ivec2(uSquareCell), int(uSquare.w + 0.5), ' + name + 'use, max(' + name + 'wide.x, ' + name + 'wide.y) * 1.5, ' + inputs.Foot + ', ' + name + 'rise), ' + name + 'albedo, ' + inputs.Water + ');');
			line('}');

			return {Albedo: name + 'albedo', Rise: name + 'rise'};
		});

		/*
		 * What grows near (where it is green): crowns and gaps of Scale a kilometre, darker and lighter by Dark and Light, as
		 * long as they are over two pixels; each octave turned against the grid of the noise. Regression: of the grid as it is,
		 * its cells of 29 m sharpened into squares, a chessboard of light and dark green over the near land.
		 */
		node('GroundCrowns', [number('Scale', 34), number('Dark', 0.7), number('Light', 0.55)], [albedo, water, near, foot], [out('Albedo', 'vec3'), out('Green'), out('Crowns')], function (context, name, inputs, value, line) {
			line('float ' + name + 'green = clamp((' + inputs.Albedo + '.g - max(' + inputs.Albedo + '.r, ' + inputs.Albedo + '.b)) * 6.0, 0.0, 1.0) * (1.0 - ' + inputs.Water + ');');
			line('float ' + name + 'crowns = enx_fvalue3(' + askew + ' * ' + inputs.Near + ' * ' + value('Scale') + ' + 11.0);');
			line('vec3 ' + name + 'albedo = ' + inputs.Albedo + ' * mix(1.0, ' + value('Dark') + ' + ' + value('Light') + ' * smoothstep(0.3, 0.75, ' + name + 'crowns), ' + name + 'green * (1.0 - smoothstep(0.006, 0.02, ' + inputs.Foot + ')));');

			return {Albedo: name + 'albedo', Green: name + 'green', Crowns: name + 'crowns'};
		});

		/* Its snow (of its picture): its edge torn by the stands of its woods (Torn) where it thins (a noise of the place made already). */
		node('GroundSnow', [number('Torn', 1.6)], [pin('Stands', 'float', '0.5'), at, dx, dy], [out('Snow')], function (context, name, inputs, value, line) {
			line('float ' + name + 'snow = uTiled > 0.5 ? textureGrad(uSnowMap, ' + inputs.At + ', ' + inputs.DX + ', ' + inputs.DY + ').r : 0.0;');
			line(name + 'snow = clamp(' + name + 'snow + (' + inputs.Stands + ' - 0.5) * ' + value('Torn') + ' * ' + name + 'snow * (1.0 - ' + name + 'snow), 0.0, 1.0);');

			return {Snow: name + 'snow'};
		});

		/*
		 * Its dunes (the sand of its deserts, Use.a): ridges of a kilometre or so bent by a noise of a few, a gentle side to the
		 * wind and a steep one away, some crossing them (star dunes), as long as a pixel is finer than a quarter of them;
		 * lighter and darker by Strength.
		 */
		node('GroundDunes', [number('Strength', 0.18)], [albedo, place, foot, at, dx, dy], [out('Albedo', 'vec3'), out('Dunes')], function (context, name, inputs, value, line) {
			var p = inputs.Place;

			line('vec3 ' + name + 'albedo = ' + inputs.Albedo + ';');
			line('float ' + name + 'sand = uTiled > 0.5 ? textureGrad(uUseMap, ' + inputs.At + ', ' + inputs.DX + ', ' + inputs.DY + ').a : 0.0;');
			line('float ' + name + 'dunes = 0.0;');
			line('if (' + name + 'sand > 0.003) {');
			line('\tfloat ' + name + 'seen = 1.0 - smoothstep(0.12, 0.45, ' + inputs.Foot + ');');
			line('\tfloat ' + name + 'bend = enx_fvalue3(' + p + ' * 0.28 + 4.0) * 3.2;');
			line('\tfloat ' + name + 'wave = fract((' + p + '.x * 0.6 + ' + p + '.z * 0.8) / 1.3 + ' + name + 'bend);');
			line('\tfloat ' + name + 'ridge = ' + name + 'wave < 0.72 ? ' + name + 'wave / 0.72 : (1.0 - ' + name + 'wave) / 0.28;');
			line('\tfloat ' + name + 'athwart = fract((' + p + '.x * -0.8 + ' + p + '.z * 0.6 + ' + p + '.y * 0.3) / 2.1 + ' + name + 'bend * 0.7);');
			line('\tfloat ' + name + 'star = 1.0 - abs(' + name + 'athwart * 2.0 - 1.0);');
			line('\t' + name + 'dunes = (' + name + 'ridge * ' + name + 'ridge * (3.0 - 2.0 * ' + name + 'ridge) * 0.75 + ' + name + 'star * ' + name + 'star * 0.25) * ' + name + 'sand * ' + name + 'seen;');
			line('\t' + name + 'albedo *= 1.0 + (' + name + 'dunes - 0.35 * ' + name + 'sand * ' + name + 'seen) * ' + value('Strength') + ';');
			line('}');

			return {Albedo: name + 'albedo', Dunes: name + 'dunes'};
		});

		/*
		 * Its relief finer than its points, in the light of its normal: hills (Hills km) and knolls (Knolls), its crowns
		 * (Crowns), the hedges of its fields, its dunes (Dunes); its slopes cut by ridges and gullies of 300 m and of 115 m
		 * (Ridges, Gullies: km) as steep as the slope is, round at their tops, each as long as it is over three pixels. The
		 * normal bent by them no more than Lean (a step over a pixel never lays it on its side, a black speck), none where a
		 * pixel is under a metre (rings of moiré of the rounding of kilometres there: the materials bend it). Smoothed: the
		 * normal before them. Regression: hills of 90 m by 20 m in the light of the normal, from low the ground was pits and
		 * blotches; no rise of its woods (their crowns 6 m at an edge laid the normal on its side, black specks).
		 */
		node('GroundRelief', [number('Hills', 0.015), number('Knolls', 0.003), number('Crowns', 0.006), number('Dunes', 0.07), number('Ridges', 0.035), number('Gullies', 0.012), number('Lean', 0.85)], [normal, up, water, near, foot, pin('Crowns', 'float', '0.5'), pin('Green', 'float', '0.0'), pin('Rise', 'float', '0.0'), pin('Dunes', 'float', '0.0')], [out('Normal', 'vec3'), out('Smoothed', 'vec3')], function (context, name, inputs, value, line) {
			var f = inputs.Foot;
			var q = inputs.Near;

			line('float ' + name + 'bumps = ((enx_fvalue3(' + q + ' * 11.0 + 5.0) - 0.5) * ' + value('Hills') + ' * (1.0 - smoothstep(0.03, 0.09, ' + f + ')) + (enx_fvalue3(' + q + ' * 52.0 + 2.0) - 0.5) * ' + value('Knolls') + ' * (1.0 - smoothstep(0.006, 0.02, ' + f + ')) + (' + inputs.Crowns + ' - 0.5) * ' + value('Crowns') + ' * ' + inputs.Green + ' * (1.0 - smoothstep(0.006, 0.02, ' + f + ')) + ' + inputs.Rise + ' + ' + inputs.Dunes + ' * ' + value('Dunes') + ') * (1.0 - ' + inputs.Water + ');');
			line('vec3 ' + name + 'n = ' + inputs.Normal + ';');
			line('float ' + name + 'rugged = smoothstep(0.06, 0.35, 1.0 - dot(' + name + 'n, ' + inputs.Up + ')) * (1.0 - ' + inputs.Water + ');');
			line('mat3 ' + name + 'askew = ' + askew + ';');
			line('float ' + name + 'ridge1 = enx_fvalue3(' + name + 'askew * ' + q + ' * 3.3 + 1.0) * 2.0 - 1.0;');
			line('float ' + name + 'ridge2 = enx_fvalue3(' + name + 'askew * (' + name + 'askew * ' + q + ') * 8.7 + 6.0) * 2.0 - 1.0;');
			line(name + 'ridge1 = 1.0 - ' + name + 'ridge1 * ' + name + 'ridge1;');
			line(name + 'ridge2 = 1.0 - ' + name + 'ridge2 * ' + name + 'ridge2;');
			line(name + 'bumps += ' + name + 'rugged * (' + name + 'ridge1 * ' + name + 'ridge1 * ' + value('Ridges') + ' * (1.0 - smoothstep(0.05, 0.1, ' + f + ')) + ' + name + 'ridge2 * ' + name + 'ridge2 * ' + value('Gullies') + ' * (1.0 - smoothstep(0.02, 0.04, ' + f + ')));');
			line('vec3 ' + name + 'px = dFdx(vWorld);');
			line('vec3 ' + name + 'py = dFdy(vWorld);');
			line('vec3 ' + name + 'across = cross(' + name + 'py, ' + name + 'n);');
			line('float ' + name + 'area = dot(' + name + 'px, ' + name + 'across);');
			line('vec3 ' + name + 'tilt = (dFdx(' + name + 'bumps) * ' + name + 'across + dFdy(' + name + 'bumps) * cross(' + name + 'n, ' + name + 'px)) / (abs(' + name + 'area) > 1e-12 ? ' + name + 'area : 1e-12);');
			line(name + 'tilt *= step(1e-12, abs(' + name + 'area)) / max(1.0, length(' + name + 'tilt) / ' + value('Lean') + ');');
			line(name + 'tilt *= smoothstep(0.0003, 0.0012, ' + f + ');');

			return {Normal: 'normalize(' + name + 'n - ' + name + 'tilt)', Smoothed: name + 'n'};
		});

		/*
		 * Nearer still: the tiles of the materials (uTextured), as the ground of a location draws them (groundLaid of the
		 * shader: of the tiles of the scene; of a ground near the materials of its biomes in their place).
		 */
		node('GroundTiles', [], [albedo, normal, pin('Smoothed', 'vec3', 'normalize(vNormal)'), near, foot, pin('Green', 'float', '0.0'), pin('Wooded', 'float', '0.0'), pin('Snow', 'float', '0.0'), water, pin('Cover', 'float', '0.0'), pin('Soft', 'vec2', 'vPatch')], [out('Albedo', 'vec3'), out('Normal', 'vec3')], function (context, name, inputs, value, line) {
			line('vec3 ' + name + 'albedo = ' + inputs.Albedo + ';');
			line('vec3 ' + name + 'n = ' + inputs.Normal + ';');
			line('groundLaid(' + name + 'albedo, ' + name + 'n, ' + inputs.Smoothed + ', ' + inputs.Near + ', ' + inputs.Foot + ', ' + inputs.Green + ', ' + inputs.Wooded + ', ' + inputs.Snow + ', ' + inputs.Water + ', ' + inputs.Cover + ', ' + inputs.Soft + ');');

			return {Albedo: name + 'albedo', Normal: name + 'n'};
		});

		/*
		 * The shadow of its ring (uRingOn: it has one; uRingAxis in the frame of its ground, uRingSpan its edges, km): where the
		 * way to the sun crosses the ring, as much as the ring is there (groundRing: the alpha of the ring graph, its gaps
		 * alike), by Strength.
		 */
		node('GroundRing', [number('Strength', 0.9)], [up], [out('Shade')], function (context, name, inputs, value, line) {
			line('vec3 ' + name + 'p = ' + inputs.Up + ' * uRadius;');
			line('float ' + name + 'facing = dot(uSun, uRingAxis);');
			line('float ' + name + 'far = -dot(' + name + 'p, uRingAxis) / (abs(' + name + 'facing) > 1e-4 ? ' + name + 'facing : 1e-4);');
			line('vec3 ' + name + 'hit = ' + name + 'p + uSun * ' + name + 'far;');
			line('float ' + name + 'r = (length(' + name + 'hit) - uRingSpan.x) / (uRingSpan.y - uRingSpan.x);');
			line('vec3 ' + name + 'seen = vec3(0.0);');
			line('float ' + name + 'ring = 0.0;');
			line('groundRing(clamp(' + name + 'r, 0.0, 1.0), ' + name + 'hit, uRingAxis, ' + name + 'seen, ' + name + 'ring);');

			return {Shade: '(1.0 - ' + name + 'ring * ' + value('Strength') + ' * step(0.0, ' + name + 'far) * step(0.0, ' + name + 'r) * step(' + name + 'r, 1.0) * uRingOn)'};
		});

		/*
		 * Its light: the sun (its shadows, of a ring: Ring), and the sky lights what the sun does not reach: at sunset the land
		 * is dim and red, not black (Sky, Dusk); the shadows of the clouds of its weather (cloudUnder of the clouds graph, its
		 * thick part only), by Shadow. Day: how much the sun is up for its lights at night (DayFrom, DayTo of its rise).
		 * Regression: what looked away from the sun was nearly black, a hole in the ground.
		 */
		node('GroundLight', [number('Sky', 0.42), number('Dusk', 0.35), number('Shadow', 0.5), number('DayFrom', -0.05), number('DayTo', 0.12)], [albedo, normal, up, pin('World', 'vec3', 'vWorld'), pin('Ring', 'float', '1.0')], [out('Color', 'vec3'), out('Rise'), out('Light'), out('Dusk'), out('Around', 'vec3'), out('Toward', 'vec3'), out('Day')], function (context, name, inputs, value, line) {
			var u = inputs.Up;

			line('float ' + name + 'rise = dot(' + u + ', uSun);');
			line('float ' + name + 'light = clamp(' + name + 'rise * 3.0 + 0.3, 0.0, 1.0);');
			line('float ' + name + 'dusk = 1.0 - smoothstep(0.0, 0.35, abs(' + name + 'rise));');
			line('vec3 ' + name + 'around = vec3(0.05, 0.06, 0.08) + uAir.rgb * uAir.a * ' + value('Sky') + ' * smoothstep(-0.25, 0.3, ' + name + 'rise) + vec3(0.5, 0.25, 0.15) * ' + name + 'dusk * uAir.a * ' + value('Dusk') + ';');
			line('float ' + name + 'day = max(dot(' + inputs.Normal + ', uSun), 0.0) * sunShadow(' + inputs.World + ', ' + inputs.Normal + ') * ' + inputs.Ring + ';');
			line('vec3 ' + name + 'toward = normalize(uSun - ' + u + ' * ' + name + 'rise + vec3(1e-6));');
			line('if (uWeatherOn > 0.5) {');
			line('\t' + name + 'day *= 1.0 - ' + value('Shadow') + ' * smoothstep(0.3, 1.0, cloudUnder(' + u + ', texture(uWeather, ' + u + ').g, ' + name + 'toward, ' + name + 'rise)) * smoothstep(0.0, 0.12, ' + name + 'rise);');
			line('}');

			return {Color: '(' + inputs.Albedo + ' * (uSunColor * ' + name + 'day + ' + name + 'around))', Rise: name + 'rise', Light: name + 'light', Dusk: name + 'dusk', Around: name + 'around', Toward: name + 'toward', Day: 'smoothstep(' + value('DayFrom') + ', ' + value('DayTo') + ', ' + name + 'rise)'};
		});

		/*
		 * Water mirrors the sky, more at a glance; waves (the slope of a noise of the very place, Waves) break the sun into a
		 * path of glints that reddens as it sets, seen where a pixel is smaller than a wave; past that the sun is spread wide
		 * over the sea, as from high over it (Glints, Spread: how bright).
		 */
		node('GroundWater', [number('Waves', 0.22), number('Glints', 7), number('Spread', 0.9)], [color, water, up, pin('View', 'vec3', 'normalize(-vWorld)'), place, foot, pin('Rise', 'float', 'dot(vDirection, uSun)'), pin('Light', 'float', '1.0'), pin('Dusk', 'float', '0.0')], [out('Color', 'vec3')], function (context, name, inputs, value, line) {
			var u = inputs.Up;
			var v = inputs.View;
			var rise = inputs.Rise;

			line('vec3 ' + name + 'color = ' + inputs.Color + ';');
			line('if (' + inputs.Water + ' > 0.01) {');
			line('\tfloat ' + name + 'seen = 1.0 - smoothstep(0.015, 0.06, ' + inputs.Foot + ');');
			line('\tvec3 ' + name + 'w = ' + u + ';');
			line('\tif (' + name + 'seen > 0.0) {');
			line('\t\tvec3 ' + name + 'q = ' + inputs.Place + ' * 9.0 + vec3(0.0, uTime * 0.05, 0.0);');
			line('\t\tvec3 ' + name + 'g = vec3(enx_fvalue3(' + name + 'q + vec3(0.2, 0.0, 0.0)) - enx_fvalue3(' + name + 'q - vec3(0.2, 0.0, 0.0)), enx_fvalue3(' + name + 'q + vec3(0.0, 0.2, 0.0)) - enx_fvalue3(' + name + 'q - vec3(0.0, 0.2, 0.0)), enx_fvalue3(' + name + 'q + vec3(0.0, 0.0, 0.2)) - enx_fvalue3(' + name + 'q - vec3(0.0, 0.0, 0.2))) * 2.5;');
			line('\t\t' + name + 'w = normalize(' + u + ' - (' + name + 'g - ' + u + ' * dot(' + name + 'g, ' + u + ')) * ' + value('Waves') + ' * ' + name + 'seen);');
			line('\t}');
			line('\tfloat ' + name + 'fresnel = 0.02 + 0.98 * pow(1.0 - max(dot(' + name + 'w, ' + v + '), 0.0), 5.0);');
			line('\tvec3 ' + name + 'r = reflect(-' + v + ', ' + name + 'w);');
			line('\tif (dot(' + name + 'r, ' + u + ') < 0.0) ' + name + 'r = ' + name + 'r - ' + u + ' * 2.0 * dot(' + name + 'r, ' + u + ');');
			line('\tfloat ' + name + 'toward = max(dot(' + name + 'r, uSun), 0.0);');
			line('\tvec3 ' + name + 'mirrored = mix(mix(uAir.rgb, vec3(1.0), 0.45), uAir.rgb * vec3(0.45, 0.6, 1.0), pow(max(dot(' + name + 'r, ' + u + '), 0.0), 0.6)) * ' + inputs.Light + ' + vec3(1.0, 0.5, 0.2) * ' + inputs.Dusk + ' * exp(-max(dot(' + name + 'r, ' + u + '), 0.0) * 5.0) * 0.8;');
			line('\tfloat ' + name + 'shine = (pow(' + name + 'toward, mix(90.0, 1400.0, ' + name + 'seen)) * mix(' + value('Spread') + ', ' + value('Glints') + ', ' + name + 'seen) + pow(' + name + 'toward, 180.0) * 0.16) * smoothstep(-0.02, 0.1, ' + rise + ');');
			line('\t' + name + 'color = mix(' + name + 'color, mix(' + name + 'color, ' + name + 'mirrored, ' + name + 'fresnel) + uSunColor * mix(vec3(1.0, 0.55, 0.25), vec3(1.0), smoothstep(0.0, 0.3, ' + rise + ')) * ' + name + 'shine, ' + inputs.Water + ');');
			line('}');

			return {Color: name + 'color'};
		});

		/*
		 * Its clouds, seen from high over them (uCloudsOn): laid over the ground where it is, as the shell of them would be (a
		 * shell so far over the ground fights it for the depth thousands of kilometres away, and flickers in stripes). Of its
		 * weather: the cover, each puff darker on its side away from the sun (cloudAt, cloudSide of the clouds graph); else
		 * of its clouds baked (uSky, turned by the wind), heaps of tens of kilometres and their gaps of their own as far as a
		 * pixel is smaller than they are. Lit by Sun of the rise of the sun.
		 */
		node('GroundClouds', [number('Sun', 1.4)], [color, up, foot, pin('Toward', 'vec3', 'uSun'), pin('Rise', 'float', 'dot(vDirection, uSun)'), pin('Around', 'vec3', 'vec3(0.05, 0.06, 0.08)')], [out('Color', 'vec3')], function (context, name, inputs, value, line) {
			var u = inputs.Up;
			var f = inputs.Foot;
			var rise = inputs.Rise;

			line('vec3 ' + name + 'color = ' + inputs.Color + ';');
			line('if (uCloudsOn > 0.0 && uWeatherOn > 0.5) {');
			line('\tfloat ' + name + 'cover = cloudAt(' + u + ', ' + f + ');');
			line('\tfloat ' + name + 'self = cloudSide(' + u + ', texture(uWeather, ' + u + ').r, ' + inputs.Toward + ', ' + rise + ', ' + f + ');');
			line('\tvec3 ' + name + 'cloud = uCloudTint * (uSunColor * clamp(' + rise + ' * ' + value('Sun') + ' + 0.1, 0.0, 1.0) * (1.0 - ' + name + 'self) + ' + inputs.Around + ');');
			line('\t' + name + 'color = mix(' + name + 'color, ' + name + 'cloud, ' + name + 'cover * min(uCloudsOn, 1.0));');
			line('}');
			line('else if (uCloudsOn > 0.0) {');
			line('\tvec3 ' + name + 'drifted = vec3(' + u + '.x * cos(uDrift) - ' + u + '.z * sin(uDrift), ' + u + '.y, ' + u + '.x * sin(uDrift) + ' + u + '.z * cos(uDrift));');
			line('\tfloat ' + name + 'cover = texture(uSky, ' + name + 'drifted).r * uCloudsOn;');
			line('\tvec3 ' + name + 'at = ' + name + 'drifted * uRadius;');
			line('\tmat3 ' + name + 'turned = ' + askew + ';');
			line('\tvec3 ' + name + 'a1 = ' + name + 'turned * ' + name + 'at * 0.035;');
			line('\tvec3 ' + name + 'a2 = ' + name + 'turned * ' + name + 'a1 * 3.1 + 7.0;');
			line('\tfloat ' + name + 'heaps = enx_fvalue3(' + name + 'a1) * 0.55 + enx_fvalue3(' + name + 'a2) * 0.3 + enx_fvalue3(' + name + 'turned * ' + name + 'a2 * 2.7 + 3.0) * 0.15;');
			line('\t' + name + 'heaps = smoothstep(0.25, 0.75, ' + name + 'heaps);');
			line('\t' + name + 'cover = clamp(' + name + 'cover * mix(1.0, 0.3 + 1.4 * ' + name + 'heaps, 1.0 - smoothstep(4.0, 12.0, ' + f + ')), 0.0, 1.0);');
			line('\tvec3 ' + name + 'cloud = uCloudTint * (uSunColor * clamp(' + rise + ' * ' + value('Sun') + ' + 0.1, 0.0, 1.0) + ' + inputs.Around + ');');
			line('\t' + name + 'color = mix(' + name + 'color, ' + name + 'cloud, clamp(' + name + 'cover, 0.0, 1.0));');
			line('}');

			return {Color: name + 'color'};
		});

		/* Its air (of the air graph): the haze of a globe between it and the eye, of the color of its horizon. */
		node('GroundAir', [], [color, pin('Light', 'float', '1.0'), pin('World', 'vec3', 'vWorld')], [out('Color', 'vec3')], function (context, name, inputs) {
			return {Color: 'mix(' + inputs.Color + ', air_horizon_globe(' + inputs.Light + '), clamp(air_haze_globe(' + inputs.World + '), 0.0, 1.0))'};
		});

		blueprints.Node('GroundEnd', {Graphs: ground, Group: 'output', Inputs: [color], Outputs: [],
			GLSL: function (context) {
				return {Result: '\tcolor = ' + context.Inputs.Color + ';'};
			}
		});
	},

	/* A ground of a globe of the library (blueprints/shader/ground): see Grounds. */
	LibraryGround: function () {
		return this.LibraryShader('ground');
	},

	/* The surface of a body of noise as a graph (the kind bake): see the header. */
	Bakes: function () {
		var blueprints = this.$Service('Blueprints');
		var shaders = this.$Service('BlueprintShaders');
		var bake = ['bake'];

		function node (type, inputs, outputs, glsl) {
			blueprints.Node(type, {Graphs: bake, Group: 'bake', Inputs: inputs, Outputs: outputs, GLSL: glsl});
		}

		function input (key, type, fallback) {
			return {Key: key, Type: type, Default: fallback};
		}

		/* What its Input blocks are in the shader of the bake. */
		shaders.GraphInputs.bake = {
			PX: {Code: 'p.x'}, PY: {Code: 'p.y'}, PZ: {Code: 'p.z'},
			Seed: {Code: 'uSeed'}, Ocean: {Code: 'uOcean'}, Ice: {Code: 'uIce'}, Clouds: {Code: 'uClouds'},
			Kind: {Code: 'float(uKind)'},
			/* Craters on a rocky body (its kind 0: rocky, desert, dwarf, moon), none under a sea (as the ground of it). */
			Cratered: {Code: '(uKind == 0 ? 1.0 : 0.0)'}
		};

		blueprints.Graph('bake', {
			End: 'BakeEnd',
			Compile: function (plan) {
				var shader = shaders.Shader(plan, 'bake');
				var made = {
					Function: ['void blueprintBake(vec3 p, inout vec4 surface, inout vec4 sky) {']
						.concat(shader.Lines.map(function (line) {
							return '\t' + line;
						}))
						.concat([shader.Result.BakeEnd || '', '}'])
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

		/* Its land and its height of noise (h): what the page reads of it too (BakeLandGraph), as it is in the shader. */
		node('BakeLand', [input('Land', 'float', '0.5'), input('H', 'float', '0.5')], [{Key: 'Land', Type: 'float'}, {Key: 'H', Type: 'float'}], function (context) {
			return {Land: context.Inputs.Land, H: context.Inputs.H};
		});

		/* A rocky or a terran body: its colors by the height of its land, its seas of their color, deeper the farther from the coast. */
		node('BakeRocky', [input('Land', 'float', '0.5')], [{Key: 'Surface', Type: 'vec4'}], function (context) {
			var name = 'k' + context.Index;

			context.Lines.push('vec4 ' + name + ' = vec4(bake_ground(clamp(' + context.Inputs.Land + ', 0.0, 1.0)), 0.04);');
			context.Lines.push('if (uOcean > 0.0 && ' + context.Inputs.Land + ' < 0.0) ' + name + ' = vec4(mix(uWater * 1.25, uWater * 0.55, clamp(-' + context.Inputs.Land + ' * 4.0, 0.0, 1.0)), 0.7);');

			return {Surface: name};
		});

		/* An icy body: its colors by its height, the first one along its ridges, a sheen. */
		node('BakeIcy', [input('H', 'float', '0.5'), input('Q', 'vec3', 'p')], [{Key: 'Surface', Type: 'vec4'}], function (context) {
			context.Need('Noise');

			return {Surface: 'vec4(mix(bake_ground(' + context.Inputs.H + '), uColors[0], smoothstep(0.7, 0.9, ridge3(' + context.Inputs.Q + ' * 1.4, 5)) * 0.6), 0.25)'};
		});

		/* A body of lava: its two colors by its height (where it glows: BakeClouds). */
		node('BakeLava', [input('H', 'float', '0.5')], [{Key: 'Surface', Type: 'vec4'}], function (context) {
			return {Surface: 'vec4(mix(uColors[0], uColors[1], smoothstep(0.3, 0.7, ' + context.Inputs.H + ')), 0.04)'};
		});

		/* A giant of gas: bands of its latitude warped, finer streaks, a storm. */
		node('BakeGas', [input('P', 'vec3', 'p')], [{Key: 'Surface', Type: 'vec4'}], function (context) {
			var name = 'k' + context.Index;
			var p = context.Inputs.P;

			context.Need('Noise');
			context.Lines.push('float ' + name + '_warp = fbm3(vec3(' + p + '.x * 3.0, ' + p + '.y * 9.0, ' + p + '.z * 3.0) + uSeed, 4);');
			context.Lines.push('float ' + name + '_band = sin((' + p + '.y * 6.5 + ' + name + '_warp * 2.4 + uSeed) * 3.14159);');
			context.Lines.push('float ' + name + '_fine = fbm3(vec3(' + p + '.x * 2.0, ' + p + '.y * 38.0, ' + p + '.z * 2.0) + uSeed, 3);');
			context.Lines.push('vec3 ' + name + ' = mix(uColors[0], uColors[1], ' + name + '_band * 0.5 + 0.5);');
			context.Lines.push(name + ' = mix(' + name + ', uColors[2], smoothstep(0.5, 0.78, ' + name + '_fine) * 0.7);');
			context.Lines.push('float ' + name + '_storm = 1.0 - smoothstep(0.0, 0.16, length(vec2((atan(' + p + '.z, ' + p + '.x) - uSeed) * 0.5, (' + p + '.y + 0.3) * 1.6)) + (' + name + '_warp - 0.5) * 0.08);');
			context.Lines.push(name + ' = mix(' + name + ', uColors[3], ' + name + '_storm * 0.85);');

			return {Surface: 'vec4(' + name + ', 0.08)'};
		});

		/* The surface of the kind of the body: 2 icy, 3 lava, 4 gas, else rocky (and terran). */
		node('BakeKind', [input('Rocky', 'vec4', 'vec4(0.5)'), input('Icy', 'vec4', 'vec4(0.5)'), input('Lava', 'vec4', 'vec4(0.5)'), input('Gas', 'vec4', 'vec4(0.5)')], [{Key: 'Surface', Type: 'vec4'}], function (context) {
			var inputs = context.Inputs;

			return {Surface: '(uKind == 4 ? ' + inputs.Gas + ' : uKind == 3 ? ' + inputs.Lava + ' : uKind == 2 ? ' + inputs.Icy + ' : ' + inputs.Rocky + ')'};
		});

		/* Caps of ice at its poles, ragged (Ice: how far they reach; all of it at 1); faint on an icy body, none on a giant of gas. */
		node('BakeIce', [input('Surface', 'vec4', 'vec4(0.5)'), input('P', 'vec3', 'p'), input('Q', 'vec3', 'p')], [{Key: 'Surface', Type: 'vec4'}], function (context) {
			var name = 'k' + context.Index;
			var inputs = context.Inputs;

			context.Need('Noise');
			context.Lines.push('vec4 ' + name + ' = ' + inputs.Surface + ';');
			context.Lines.push('if (uIce > 0.0 && uKind != 4) {');
			context.Lines.push('\tfloat ' + name + '_pole = abs(' + inputs.P + '.y) + (fbm3(' + inputs.Q + ' * 3.0, 3) - 0.5) * 0.3;');
			context.Lines.push('\tfloat ' + name + '_cap = uIce >= 1.0 ? 1.0 : smoothstep(1.0 - uIce, 1.0 - uIce + 0.04, ' + name + '_pole);');
			context.Lines.push('\t' + name + '.rgb = mix(' + name + '.rgb, vec3(0.93, 0.95, 0.98), ' + name + '_cap * (uKind == 2 ? 0.35 : 1.0));');
			context.Lines.push('}');

			return {Surface: name};
		});

		/* Its clouds (Clouds: how much of the sky), the glow of the cracks of lava, its sparks. */
		node('BakeClouds', [input('P', 'vec3', 'p'), input('Q', 'vec3', 'p')], [{Key: 'Sky', Type: 'vec4'}], function (context) {
			var name = 'k' + context.Index;
			var inputs = context.Inputs;

			context.Need('Noise');
			context.Lines.push('float ' + name + '_cloud = fbm3(' + inputs.P + ' * 3.2 + vec3(0.0, uSeed * 2.0, 0.0), 5);');
			context.Lines.push('float ' + name + '_edge = 0.5 + (0.5 - uClouds) * 0.4;');
			context.Lines.push('float ' + name + '_cover = uClouds > 0.0 ? smoothstep(' + name + '_edge, ' + name + '_edge + 0.12, ' + name + '_cloud) * (uClouds >= 1.0 ? 1.0 : 0.85) : 0.0;');
			context.Lines.push('float ' + name + '_ridge = ridge3(' + inputs.Q + ' * 1.6 + 4.0, 5);');

			return {Sky: 'vec4(' + name + '_cover, uKind == 3 ? smoothstep(0.8, 0.93, ' + name + '_ridge) : 0.0, smoothstep(0.88, 0.97, ' + name + '_ridge), 1.0)'};
		});

		blueprints.Node('BakeEnd', {Graphs: bake, Group: 'output', Inputs: [input('Surface', 'vec4', 'surface'), input('Sky', 'vec4', 'sky')], Outputs: [],
			GLSL: function (context) {
				return {Result: '\tsurface = ' + context.Inputs.Surface + ';\n\tsky = ' + context.Inputs.Sky + ';'};
			}
		});
	},

	/* What the weather and the year do to a surface (the kind weather): see the header. */
	Weathers: function () {
		var self = this;
		var blueprints = this.$Service('Blueprints');
		var shaders = this.$Service('BlueprintShaders');
		var weather = ['weather'];
		var done = [{Key: 'Done', Type: 'float'}];

		function number (key, value) {
			return {Key: key, Type: 'number', Value: value};
		}

		function define (context, name, lines) {
			context.Need('Noise');

			return self.Chunk(context, 'Weather_' + name, lines);
		}

		function literal (context, key) {
			return shaders.Literal(Number(context.Properties[key]), 'float');
		}

		blueprints.Graph('weather', {
			End: 'WeatherEnd',
			Compile: function (plan) {
				var shader = shaders.Shader(plan, 'weather');
				var made = {Function: '', Needs: shader.Needs, Uniforms: shader.Uniforms, Textures: [], Sources: shader.Sources};

				made.Values = shaders.Values(made);

				return made;
			}
		});

		/*
		 * The leaves of a plant are what is green of it (Leaf: how green): in autumn they turn, each tree (tree, 0 to 1) to a
		 * color of its own; they thin out to bare branches as the year goes cold (Bare), come back in spring with the flowers of
		 * some trees (Blossom: how many); at: the grain of them; turn: they do (else only the warm of summer).
		 */
		blueprints.Node('WeatherSeason', {Graphs: weather, Group: 'weather', Properties: [number('Leaf', 0.05), number('Bare', 1.08), number('Blossom', 0.45)], Inputs: [], Outputs: done, GLSL: function (context) {
			return define(context, 'season', [
				'void weather_season(inout vec3 color, float tree, vec3 at, bool turn) {',
				'\tfloat leaf = smoothstep(0.01, ' + literal(context, 'Leaf') + ', color.g - max(color.r, color.b) * 0.9);',
				'\tif (turn && leaf > 0.0) {',
				'\t\tvec3 fall = tree < 0.3 ? vec3(0.62, 0.42, 0.04) : tree < 0.55 ? vec3(0.55, 0.16, 0.02) : tree < 0.8 ? vec3(0.42, 0.05, 0.02) : vec3(0.25, 0.14, 0.05);',
				'\t\tcolor = mix(color, fall * (0.7 + 0.6 * dot(color, vec3(0.33))), uSeason.y * leaf);',
				'\t\tif (uSeason.x > 0.0 && noise3(at * 9.0 + tree * 7.0) * 0.5 + 0.5 < uSeason.x * leaf * ' + literal(context, 'Bare') + ') discard;',
				'\t\tif (uSeason.z > 0.0 && tree < ' + literal(context, 'Blossom') + ' && noise3(at * 26.0) > 0.35) color = mix(color, tree < 0.2 ? vec3(0.95, 0.62, 0.72) : vec3(0.95, 0.94, 0.9), uSeason.z * leaf);',
				'\t}',
				'\tcolor = mix(color, color * vec3(1.15, 1.0, 0.55), uSeason.w * leaf * 0.5);',
				'}'
			]);
		}});

		/*
		 * How much snow lies on what looks up (up: the normal of it up, at: where), thicker where its noise piles it: between Low
		 * and High of up shifted by its noise (Scale, Weight; a second one of Scale2, Weight2 where Weight2 is not 0; Shift),
		 * by Amount. For: of what (things: of their materials; solid: of their colors; plants: their slopes hold it too).
		 */
		blueprints.Node('WeatherSnow', {Graphs: weather, Group: 'weather', Properties: [{Key: 'For', Type: 'select', Options: ['things', 'solid', 'plants'], Value: 'things'}, number('Low', 0.3), number('High', 0.75), number('Scale', 0.23), number('Weight', 1), number('Scale2', 0.9), number('Weight2', 0.5), number('Shift', -0.75), number('Amount', 0.3)], Inputs: [], Outputs: done, GLSL: function (context) {
			var kind = ['things', 'solid', 'plants'].indexOf(context.Properties.For) === -1 ? 'things' : context.Properties.For;
			var second = Number(context.Properties.Weight2) ? ' + noise3(at * ' + literal(context, 'Scale2') + ') * ' + literal(context, 'Weight2') : '';
			var first = Number(context.Properties.Weight) === 1 ? 'noise3(at * ' + literal(context, 'Scale') + ')' : 'noise3(at * ' + literal(context, 'Scale') + ') * ' + literal(context, 'Weight');

			return define(context, 'snow_' + kind, [
				'float weather_snow_' + kind + '(float up, vec3 at) {',
				'\treturn smoothstep(' + literal(context, 'Low') + ', ' + literal(context, 'High') + ', up + (' + first + second + ' + ' + literal(context, 'Shift') + ') * ' + literal(context, 'Amount') + ');',
				'}'
			]);
		}});

		/*
		 * A body beamed away or coming (Teleport): it breaks up into sparkling grains in streaks up and down, from the top,
		 * glowing in the color of the beam where it goes; uDissolve [how far, foot, height, phase]. Gives how much it glows.
		 */
		blueprints.Node('WeatherDissolve', {Graphs: weather, Group: 'weather', Properties: [number('Grain', 30), number('Streak', 6)], Inputs: [], Outputs: done, GLSL: function (context) {
			return define(context, 'dissolve', [
				'float weather_dissolve(vec3 world, inout vec3 color) {',
				'\tif (uDissolve.x <= 0.0) return 0.0;',
				'\tfloat h = clamp((world.y - uDissolve.y) / max(uDissolve.z, 0.01), 0.0, 1.0);',
				'\tfloat grain = noise3((world + uEyeAt) * vec3(' + literal(context, 'Grain') + ', ' + literal(context, 'Streak') + ', ' + literal(context, 'Grain') + ') + vec3(0.0, uDissolve.w, 0.0)) * 0.5 + 0.5;',
				'\tfloat d = grain * 0.8 + (1.0 - h) * 0.2;',
				'\tfloat gone = uDissolve.x * 1.3 - 0.15;',
				'\tif (d < gone) discard;',
				'\tcolor = mix(color, uDissolveColor, min(1.0, uDissolve.x * 1.6));',
				'\treturn max(1.0 - smoothstep(0.0, 0.1, d - gone), uDissolve.x * 0.6) * (0.6 + 0.4 * sin(uDissolve.w * 9.0 + grain * 20.0));',
				'}'
			]);
		}});

		/*
		 * Water stands where a surface lies flat (level, 0 to 1) and it is wet (wet): pools between Low and High of its noise
		 * (Scale; a finer one of Scale2 by Weight2), that grow as it rains (Grow) and shrink as it dries.
		 */
		blueprints.Node('WeatherPuddles', {Graphs: weather, Group: 'weather', Properties: [number('Low', 0.66), number('High', 0.8), number('Grow', 0.18), number('Scale', 0.13), number('Scale2', 0.6), number('Weight2', 0.08)], Inputs: [], Outputs: done, GLSL: function (context) {
			var grow = literal(context, 'Grow');

			return define(context, 'puddles', [
				'float weather_puddles(float wet, float level, vec3 at) {',
				'\treturn wet * level * smoothstep(' + literal(context, 'Low') + ' - ' + grow + ' * wet, ' + literal(context, 'High') + ' - ' + grow + ' * wet, noise3(at * vec3(' + literal(context, 'Scale') + ', 0.0, ' + literal(context, 'Scale') + ')) + noise3(at * vec3(' + literal(context, 'Scale2') + ', 0.0, ' + literal(context, 'Scale2') + ')) * ' + literal(context, 'Weight2') + ');',
				'}'
			]);
		}});

		blueprints.Node('WeatherEnd', {Graphs: weather, Group: 'output', Inputs: ['Season', 'Things', 'Solid', 'Plants', 'Dissolve', 'Puddles'].map(function (key) {
			return {Key: key, Type: 'float', Default: '0.0'};
		}), Outputs: [], GLSL: function () {
			return {Result: ''};
		}});
	},

	/* The function of a block a part of the shaders of Renderer, asked by it: see the header. {Done: '1.0'}, what the block gives. */
	Chunk: function (context, name, lines, guard) {
		var text = (guard ? [Array.isArray(guard) ? '#if ' + guard.map(function (name) {
			return 'defined(' + name + ')';
		}).join(' || ') : '#ifdef ' + guard] : []).concat(lines, guard ? ['#endif'] : []).join('\n');
		var hash = 2166136261;
		var i;
		var need;

		for (i = 0; i < text.length; i++)
			hash = Math.imul(hash ^ text.charCodeAt(i), 16777619) >>> 0;

		need = name + '_' + hash.toString(36);
		this.$Service('Renderer').Chunks[need] = text;

		context.Need(need);

		return {Done: '1.0'};
	},

	/* A kind of graphs of functions of the shaders (weather, air, clouds): made of their blocks alone, an end of them all. */
	Functions: function (kind, end, inputs) {
		var blueprints = this.$Service('Blueprints');
		var shaders = this.$Service('BlueprintShaders');

		blueprints.Graph(kind, {
			End: end,
			Compile: function (plan) {
				var shader = shaders.Shader(plan, kind);
				var made = {Function: '', Needs: shader.Needs, Uniforms: shader.Uniforms, Textures: [], Sources: shader.Sources};

				made.Values = shaders.Values(made);

				return made;
			}
		});

		blueprints.Node(end, {Graphs: [kind], Group: 'output', Inputs: inputs.map(function (key) {
			return {Key: key, Type: 'float', Default: '0.0'};
		}), Outputs: [], GLSL: function () {
			return {Result: ''};
		}});
	},

	/* The air between the eye and what it sees (the kind air): see the header. */
	Airs: function () {
		var self = this;
		var blueprints = this.$Service('Blueprints');
		var shaders = this.$Service('BlueprintShaders');
		var air = ['air'];
		var done = [{Key: 'Done', Type: 'float'}];

		function number (key, value) {
			return {Key: key, Type: 'number', Value: value};
		}

		function literal (context, key) {
			return shaders.Literal(Number(context.Properties[key]), 'float');
		}

		this.Functions('air', 'AirEnd', ['Globe', 'Ground', 'Fog', 'Under']);

		/*
		 * The haze of the air over a distance (Fog of the scene: uFog its length): how much, as thin as its air is (Thin: by
		 * uAir.a), less up high (High: by uHigh, the eye over a globe); its color the air whitened (White, Whiten) in the light given.
		 */
		blueprints.Node('AirHaze', {Graphs: air, Group: 'air', Properties: [{Key: 'For', Type: 'select', Options: ['globe', 'ground'], Value: 'ground'}, {Key: 'Thin', Type: 'bool', Value: false}, number('High', 0), number('White', 1), number('Whiten', 0.45)], Inputs: [], Outputs: done, GLSL: function (context) {
			var kind = context.Properties.For === 'globe' ? 'globe' : 'ground';
			var amount = '(1.0 - exp(-length(world) / uFog))';

			if (context.Properties.Thin === true || context.Properties.Thin === 'true')
				amount += ' * uAir.a';

			if (Number(context.Properties.High))
				amount += ' * (1.0 - uHigh * ' + literal(context, 'High') + ')';

			return self.Chunk(context, 'Air_haze_' + kind, [
				'float air_haze_' + kind + '(vec3 world) {',
				'\treturn ' + amount.replace(/^\((.*)\)$/, function (all, inner) {
					return amount.indexOf(' * ') === -1 ? inner : all;
				}) + ';',
				'}',
				'vec3 air_horizon_' + kind + '(float light) {',
				'\treturn mix(uAir.rgb, vec3(' + literal(context, 'White') + '), ' + literal(context, 'Whiten') + ') * light;',
				'}'
			], 'ENX_AIR_' + kind.toUpperCase());
		}});

		/*
		 * The fog of the pass Air: of the scene (uFog: how thick a unit), the low one of a weather that falls with the height a
		 * ray climbs to (uFogLow), the sheets of rain that go past with the wind (uVeil: Sheets, Swing); its color the air
		 * whitened (Whiten, the sky's SkyWhiten) with the sun in it (Shine, ShinePower); far off, what stands melts into a sky
		 * of the same air (Veil, VeilMost, VeilFall).
		 */
		blueprints.Node('AirFog', {Graphs: air, Group: 'air', Properties: [number('Whiten', 0.4), number('SkyWhiten', 0.55), number('Shine', 0.6), number('ShinePower', 8), number('Sheets', 0.72), number('Swing', 0.56), number('Veil', 2.4), number('VeilMost', 0.96), number('VeilFall', 5)], Inputs: [], Outputs: done, GLSL: function (context) {
			return self.Chunk(context, 'Air_fog', [
				'vec3 air_light(float whiten) {',
				'\treturn pow(mix(uAir.rgb, vec3(1.0), whiten), vec3(2.2)) * uAirLight + pow(uAirGlow, vec3(2.2)) * 0.3;',
				'}',
				'vec3 air_sky() {',
				'\treturn air_light(' + literal(context, 'SkyWhiten') + ');',
				'}',
				'float air_fog(vec3 place, float far, vec3 way) {',
				'\tfloat climb = place.y * uFogLow.y;',
				'\tfloat low = uFogLow.z > 0.0 ? uFogLow.z * exp(-uFogLow.x * uFogLow.y) * (abs(climb) < 0.01 ? 1.0 : (1.0 - exp(-climb)) / climb) : 0.0;',
				'\tfloat sheets = uVeil > 0.01 ? ' + literal(context, 'Sheets') + ' + ' + literal(context, 'Swing') + ' * texture(uNoise, vec3(way.x * 1.6 + uVeilMove.x, way.y * 0.8, way.z * 1.6 + uVeilMove.y) + vec3(0.0, uVeilMove.z, 0.0)).b : 1.0;',
				'\treturn 1.0 - exp(-far * (uFog * sheets + low));',
				'}',
				'vec3 air_hazed() {',
				'\treturn air_light(' + literal(context, 'Whiten') + ');',
				'}',
				'vec3 air_far(vec3 way) {',
				'\tvec3 sky = air_hazed();',
				'\tsky += uSunColor * pow(max(dot(way, uSun), 0.0), ' + literal(context, 'ShinePower') + ') * ' + literal(context, 'Shine') + ';',
				'\treturn sky;',
				'}',
				'float air_veil(vec3 ray) {',
				'\treturn min(' + literal(context, 'VeilMost') + ', uVeil * ' + literal(context, 'Veil') + ') * exp(-max(ray.y, 0.0) * ' + literal(context, 'VeilFall') + ');',
				'}'
			], 'ENX_AIR_FOG');
		}});

		/*
		 * The eye under the sea: the water between takes the light (red first: Absorb), deep blue-green far off (Deep, Clear),
		 * lighter where it looks up toward the surface (Upward).
		 */
		blueprints.Node('AirUnder', {Graphs: air, Group: 'air', Properties: [{Key: 'Deep', Type: 'object', Value: [0.06, 0.32, 0.36]}, {Key: 'Absorb', Type: 'object', Value: [0.16, 0.045, 0.035]}, number('Clear', 0.045), number('Upward', 2.5), number('Far', 80)], Inputs: [], Outputs: done, GLSL: function (context) {
			var deep = shaders.Literal(context.Properties.Deep || [0.06, 0.32, 0.36], 'vec3');
			var absorb = shaders.Literal(context.Properties.Absorb || [0.16, 0.045, 0.035], 'vec3');

			return self.Chunk(context, 'Air_under', [
				'vec3 air_under(vec3 color, vec3 place, float depth) {',
				'\tfloat through = depth < 1.0 ? length(place) : ' + literal(context, 'Far') + ';',
				'\tvec3 deep = pow(' + deep + ', vec3(2.2)) * uAirLight * (0.25 + 0.75 * clamp(uSun.y * 3.0, 0.0, 1.0));',
				'\tvec3 ray = normalize(place);',
				'\tdeep *= 1.0 + ' + literal(context, 'Upward') + ' * smoothstep(0.2, 1.0, ray.y);',
				'\treturn mix(color * exp(-through * ' + absorb + '), deep, 1.0 - exp(-through * ' + literal(context, 'Clear') + '));',
				'}'
			], 'ENX_AIR_UNDER');
		}});
	},

	/* The clouds (the kind clouds): see the header. */
	Clouds: function () {
		var self = this;
		var blueprints = this.$Service('Blueprints');
		var shaders = this.$Service('BlueprintShaders');
		var clouds = ['clouds'];
		var done = [{Key: 'Done', Type: 'float'}];

		function number (key, value) {
			return {Key: key, Type: 'number', Value: value};
		}

		function literal (context, key) {
			return shaders.Literal(Number(context.Properties[key]), 'float');
		}

		this.Functions('clouds', 'CloudsEnd', ['Cover', 'Globe', 'Shade', 'Shell', 'Layer']);

		/*
		 * The cover of the clouds of the weather of a planet (cover, 0 to 1) at a place of its body (k, km): its billows of Size
		 * km and smaller by Shrink, Octaves of them (heaps most of the small, sheets of the large: heap), each only while a pixel
		 * there (foot, km) sees it, turned against the last (no squares along the grid of the noise); cut where the share the
		 * cover says is over (a logit for its quantile), softer the larger a pixel; what is not seen of them the cover as it is.
		 * narrow: how much less up high. One for the globe, the shadows and the clouds round the eye.
		 */
		blueprints.Node('CloudCover', {Graphs: clouds, Group: 'clouds', Properties: [number('Size', 80), number('Shrink', 2.7), number('Octaves', 5)], Inputs: [], Outputs: done, GLSL: function (context) {
			context.Need('Noise');

			return self.Chunk(context, 'Clouds_cover', [
				'float clouds_cover(vec3 k, float cover, float heap, float foot, float narrow) {',
				'\tfloat n = 0.0;',
				'\tfloat total = 0.0;',
				'\tfloat seen = 0.0;',
				'\tfloat size = ' + literal(context, 'Size') + ';',
				'\tmat3 askew = mat3(0.80, 0.36, -0.48, -0.60, 0.48, -0.64, 0.0, 0.80, 0.60);',
				'\tvec3 turned = k;',
				'\tfor (int i = 0; i < ' + Math.max(1, Math.min(8, Math.round(Number(context.Properties.Octaves) || 5))) + '; i++) {',
				'\t\tfloat a = i < 2 ? mix(0.6, 0.3, heap) : mix(0.22, 0.6, heap);',
				'\t\tfloat sharp = 1.0 - smoothstep(size * 0.12, size * 0.45, foot);',
				'\t\tturned = askew * turned;',
				'\t\tif (sharp > 0.0) n += ((noise3(turned / size + float(i) * 7.1) + noise3(askew * (turned / size) + float(i) * 3.7 + 11.0)) * 0.5 - 0.5) * 1.4 * a * sharp;',
				'\t\ttotal += a;',
				'\t\tseen += a * sharp;',
				'\t\tsize /= ' + literal(context, 'Shrink') + ';',
				'\t}',
				'\tfloat spread = mix(0.12, 0.06, heap) + clamp(foot / 40.0, 0.0, 0.2);',
				'\tfloat level = 0.5 + 0.13 * log((1.0 - clamp(cover, 0.01, 0.99)) / clamp(cover, 0.01, 0.99));',
				'\treturn mix(clamp(cover - narrow, 0.0, 1.0), smoothstep(level - spread, level + spread, 0.5 + n * 1.6 / max(seen / total, 0.05) - narrow), seen / total);',
				'}'
			], ['ENX_CLOUDS_GLOBE', 'ENX_CLOUDS_SHELL']);
		}});

		/*
		 * The clouds of a planet as they are seen from over it (uWeather, its weather baked; uRadiusKm): its cover (CloudCover),
		 * cirrus thin over all drawn out east and west (Cirrus: how much). cloudSeen(p, w, foot), cloudAt(p, foot): the globe,
		 * the shadows of its clouds on its ground.
		 */
		blueprints.Node('CloudGlobe', {Graphs: clouds, Group: 'clouds', Properties: [number('Cirrus', 0.18)], Inputs: [], Outputs: done, GLSL: function (context) {
			context.Need('Noise');

			return self.Chunk(context, 'Clouds_globe', [
				'float cloudSeen(vec3 p, vec4 w, float foot) {',
				'\tvec3 k = p * uRadiusKm;',
				'\tfloat heap = smoothstep(0.3, 0.6, w.g);',
				'\tfloat cloud = clouds_cover(k, w.r, heap, foot, 0.0) * step(0.01, w.r);',
				'\tfloat streak = noise3(vec3(k.x / 90.0, k.y / 9.0, k.z / 90.0) + 5.0) * 0.7 + noise3(vec3(k.x / 30.0, k.y / 3.0, k.z / 30.0)) * 0.3;',
				'\tfloat thin = w.b * smoothstep(0.45, 0.75, streak) * ' + literal(context, 'Cirrus') + ';',
				'\treturn clamp(cloud + thin * (1.0 - cloud), 0.0, 1.0);',
				'}',
				'float cloudAt(vec3 p, float foot) {',
				'\treturn cloudSeen(p, texture(uWeather, p), foot);',
				'}'
			], 'ENX_CLOUDS_GLOBE');
		}});

		/*
		 * The light and shade of the clouds of a planet seen from over it (uWeather, uRadiusKm; p: a place of its body, toward:
		 * the way to its sun along the ground, high: how high the sun stands there): cloudSide(p, cover, toward, high, foot) how
		 * much darker a cloud is on its side away from the sun (its cover Ahead km toward the sun, at least, more than here, by
		 * Gain, Most at most); cloudUnder(p, kind, toward, high) the cover of the clouds whose shadow falls there (as high as
		 * their kind: Low to High km). The globe and its ground alike.
		 */
		blueprints.Node('CloudShade', {Graphs: clouds, Group: 'clouds', Properties: [number('Ahead', 3), number('Gain', 1.3), number('Most', 0.55), number('Low', 1.5), number('High', 6)], Inputs: [], Outputs: done, GLSL: function (context) {
			return self.Chunk(context, 'Clouds_shade', [
				'float cloudSide(vec3 p, float cover, vec3 toward, float high, float foot) {',
				'\tfloat ahead = texture(uWeather, normalize(p + toward * max(' + literal(context, 'Ahead') + ', foot) / uRadiusKm)).r;',
				'\treturn clamp((ahead - cover) * ' + literal(context, 'Gain') + ', 0.0, ' + literal(context, 'Most') + ') * smoothstep(-0.05, 0.2, high);',
				'}',
				'float cloudUnder(vec3 p, float kind, vec3 toward, float high) {',
				'\treturn texture(uWeather, normalize(p + toward * mix(' + literal(context, 'Low') + ', ' + literal(context, 'High') + ', kind) * sqrt(max(0.0, 1.0 - high * high)) / max(0.06, high) / uRadiusKm)).r;',
				'}'
			], 'ENX_CLOUDS_GLOBE');
		}});

		/*
		 * The clouds of the weather of a planet round the eye over its surface (uShell: its radius, the ground under the eye, km):
		 * a shell from 0.4 to 13 km over its sea. Of the weather of each place (cover, kind, cirrus): sheets low and flat, heaps
		 * to Heaps km with round tops, towers of a storm to Towers, their cover of CloudCover; their edges eaten by billows in three
		 * dimensions near; cirrus at CirrusLow to CirrusHigh km. shellThick(q, foot, detail): how thick at q (detail under 0.5:
		 * the cheap one, to find cloud and for the light toward the sun).
		 */
		blueprints.Node('CloudShell', {Graphs: clouds, Group: 'clouds', Properties: [number('Heaps', 3.2), number('Towers', 12), number('CirrusLow', 8.5), number('CirrusHigh', 11)], Inputs: [], Outputs: done, GLSL: function (context) {
			var low = literal(context, 'CirrusLow');
			var high = literal(context, 'CirrusHigh');
			var heaps = literal(context, 'Heaps');

			context.Need('Noise');

			return self.Chunk(context, 'Clouds_shell', [
				'float shellThick(vec3 q, float foot, float detail) {',
				'\tfloat R = uShell.x;',
				'\tfloat r = length(q);',
				'\tfloat h = r - R;',
				'\tmat3 back = transpose(uTurn);',
				'\tvec4 w = texture(uWeather, back * (q / r));',
				'\tvec3 k = back * q;',
				'\tfloat kind = w.g;',
				'\tfloat heap = smoothstep(0.3, 0.6, kind);',
				'\tfloat base = mix(0.6, 1.0, heap);',
				'\tfloat top = kind < 0.5 ? mix(1.5, ' + heaps + ', kind * 2.0) : mix(' + heaps + ', ' + literal(context, 'Towers') + ', (kind - 0.5) * 2.0);',
				'\ttop = base + (top - base) * mix(0.8 + 0.2 * mix(noise3(k / 8.0 + 4.0), 0.5, smoothstep(1.5, 4.0, foot)), 0.45 + 0.55 * mix(noise3(k / 2.6 + 2.0), 0.5, smoothstep(0.5, 1.5, foot)), heap);',
				'\tfloat hn = (h - base) / (top - base);',
				'\tfloat d = 0.0;',
				'\tif (hn > 0.0 && hn < 1.0 && w.r > 0.02) {',
				'\t\tif (detail < 0.5) return clamp(w.r * mix(smoothstep(0.0, 0.25, hn) * (1.0 - smoothstep(0.55, 1.0, hn)), (1.0 - smoothstep(0.2, 1.0, hn)), heap) * 3.0 + 0.05, 0.0, 1.0);',
				'\t\tmat3 askew = mat3(0.80, 0.36, -0.48, -0.60, 0.48, -0.64, 0.0, 0.80, 0.60);',
				'\t\tfloat narrow = max(hn - 0.3, 0.0) * mix(0.15, 0.5, heap);',
				'\t\tfloat cover = clouds_cover(k, w.r, heap, foot, narrow);',
				'\t\tfloat sheet = smoothstep(0.0, 0.25, hn) * (1.0 - smoothstep(0.55, 1.0, hn));',
				'\t\tfloat round1 = smoothstep(0.0, 0.07, hn) * (1.0 - smoothstep(0.45, 1.0, hn));',
				'\t\tfloat shape = mix(sheet, round1, heap);',
				'\t\tfloat near = 1.0 - smoothstep(0.3, 1.2, foot);',
				'\t\tfloat closer = 1.0 - smoothstep(0.1, 0.45, foot);',
				'\t\tfloat closest = 1.0 - smoothstep(0.04, 0.18, foot);',
				'\t\tfloat billow = 0.5 + (noise3(askew * k / 0.9 + 9.0) - 0.5) * near * 0.75 + (noise3(askew * (askew * k) / 0.35 + 3.0) - 0.5) * closer * 0.45 + (noise3(k / 0.14 + 5.0) - 0.5) * closest * 0.3;',
				'\t\td = cover * shape - 0.04 - (1.0 - billow) * mix(0.25, 0.5, heap) + 0.5 * mix(0.25, 0.5, heap);',
				'\t\td -= (1.0 - billow) * 0.3 * (1.0 - clamp(d * 2.0, 0.0, 1.0)) * near;',
				'\t\td = clamp(d * 2.5, 0.0, 1.0);',
				'\t}',
				'\tif (h > ' + low + ' && h < ' + high + ' && w.b > 0.02 && (detail < 0.2 || detail > 0.5)) {',
				'\t\tmat3 turn2 = mat3(0.80, 0.36, -0.48, -0.60, 0.48, -0.64, 0.0, 0.80, 0.60);',
				'\t\tfloat fray = noise3(turn2 * k / 6.0 + 5.0) * 0.6 + noise3(k / 2.0 + 1.0) * 0.4;',
				'\t\td = max(d, smoothstep(0.35, 0.85, w.b) * smoothstep(0.35, 0.65, fray) * smoothstep(' + low + ', ' + shaders.Literal(Number(context.Properties.CirrusLow) + 0.8, 'float') + ', h) * (1.0 - smoothstep(' + shaders.Literal(Number(context.Properties.CirrusHigh) - 0.8, 'float') + ', ' + high + ', h)) * 0.08);',
				'\t}',
				'\treturn d;',
				'}'
			], 'ENX_CLOUDS_SHELL');
		}});

		/*
		 * The clouds of the layer of a scene (uLayer: its foot, its top, its scale; uCover; uShape: kind, high, storm; uDrift):
		 * a map of its 3D noise (uNoise, cheap: many steps a ray) where there is cloud, cut by the cover (Clear: the cut of no
		 * cover, Full: of all of it), heaps that rise to their top, their edges eaten near (fine); Dense: how thick it gets.
		 * lobe(toward, g): how light goes through it. thick(p, fine).
		 */
		blueprints.Node('CloudLayer', {Graphs: clouds, Group: 'clouds', Properties: [number('Clear', 0.86), number('Full', 0.2), number('Dense', 4.2)], Inputs: [], Outputs: done, GLSL: function (context) {
			return self.Chunk(context, 'Clouds_layer', [
				'float lobe(float toward, float g) {',
				'\treturn (1.0 - g * g) / (12.57 * pow(1.0 + g * g - 2.0 * g * toward, 1.5)) * 6.0;',
				'}',
				'float thick(vec3 p, float fine) {',
				'\tfloat h = clamp((p.y - uLayer.x) / (uLayer.y - uLayer.x), 0.0, 1.0);',
				'\tvec2 flat2 = p.xz * uLayer.z + uDrift;',
				'\tvec4 big = texture(uNoise, vec3(flat2 * 0.05, 0.31));',
				'\tvec4 mid = texture(uNoise, vec3(flat2 * 0.17 + 3.1, 0.62));',
				'\tfloat map = big.b * 0.7 + mid.g * 0.3;',
				'\tfloat amount = clamp((map - mix(' + literal(context, 'Clear') + ', ' + literal(context, 'Full') + ', uCover)) / 0.2, 0.0, 1.0);',
				'\tif (amount <= 0.0) return 0.0;',
				'\tfloat kind = clamp(uShape.x + (mid.b - 0.5) * 0.7, 0.0, 1.0);',
				'\tfloat top = kind < 0.5 ? mix(0.24, 0.62, kind * 2.0) : mix(0.62, 1.0, kind * 2.0 - 1.0);',
				'\tfloat rise = smoothstep(0.0, 0.08, h) * (1.0 - smoothstep(top * 0.55, top * (0.72 + amount * 0.28), h));',
				'\tvec4 shape = texture(uNoise, vec3(p.x, p.y * 1.4, p.z) * uLayer.z * 0.42 + vec3(uDrift.x * 2.0, 0.0, uDrift.y * 2.0));',
				'\tfloat body = (shape.r * rise - (1.0 - amount) * 0.9) / max(0.12, amount);',
				'\tif (body <= 0.0) return 0.0;',
				'\tif (fine > 0.5) {',
				'\t\tvec4 edge = texture(uNoise, vec3(p.x, p.y * 1.2, p.z) * uLayer.z * 2.6 + vec3(uDrift.x, -uDrift.x, uDrift.y) * 6.0);',
				'\t\tvec4 finer = texture(uNoise, vec3(p.z, p.x, p.y * 1.3) * uLayer.z * 7.3 + vec3(uDrift, 0.0) * 9.0);',
				'\t\tbody -= (1.0 - edge.g * 0.7 - edge.a * 0.3) * 0.34 * (0.6 + uShape.z) * (1.0 - clamp(body * 1.6, 0.0, 1.0)) + (1.0 - finer.g) * 0.05;',
				'\t}',
				'\treturn clamp(body * ' + literal(context, 'Dense') + ', 0.0, 1.0);',
				'}'
			], 'ENX_CLOUDS_LAYER');
		}});
	},

	/*
	 * The weather of a planet as blocks of numbers (generator; SceneForecast, its Kernel): ForecastStorms (its winds, storms,
	 * fronts and streams), ForecastFronts (sheets, how humid), ForecastHeaps (heaps, the kind of the clouds), ForecastCirrus,
	 * ForecastRain, ForecastShroud (cover, kind, cirrus, rain). The same in the page (Compute) and in a shader (Numeric).
	 */
	Forecasts: function () {
		var blueprints = this.$Service('Blueprints');
		var numeric = ['generator'];

		function forecast () {
			return blueprints.$Service('SceneForecast');
		}

		function number (key, value) {
			return {Key: key, Type: 'number', Value: value};
		}

		function inputs (keys) {
			return keys.map(function (key) {
				return {Key: key, Type: 'float', Value: 0};
			});
		}

		function outputs (keys) {
			return keys.map(function (key) {
				return {Key: key, Type: 'float'};
			});
		}

		function value (given, key) {
			return Number(given[key]) || 0;
		}

		/* A block of a function of the Kernel: its arguments of its inputs and properties, its results by their names. */
		function block (type, keys, properties, results, name, args) {
			blueprints.Node(type, {Graphs: numeric, Group: 'forecast', Properties: properties, Inputs: inputs(keys), Outputs: outputs(results),
				Compute: function (given, props) {
					var made = forecast().Code()[name].apply(null, args(function (key) {
						return value(given, key);
					}, function (key) {
						return Number(props[key]);
					}, function (x, y, z) {
						return [value(given, x), value(given, y), value(given, z)];
					}));
					var out = {};

					results.forEach(function (key, index) {
						out[key] = typeof made === 'number' ? made : made[index];
					});

					return out;
				},
				Numeric: function (given, props, kit) {
					var made;

					kit.Kernel('forecast', forecast().IR());

					made = {E: kit.Call.apply(null, [name].concat(args(function (key) {
						return kit.Sized(given[key], 1).E;
					}, function (key) {
						return kit.Const(Number(props[key]), 'float');
					}, function (x, y, z) {
						return kit.Call('vec3', kit.Sized(given[x], 1).E, kit.Sized(given[y], 1).E, kit.Sized(given[z], 1).E);
					}))), T: results.length === 1 ? 'float' : 'vec' + results.length};

					if (results.length === 1) {
						made = {Out: made};
						made[results[0]] = made.Out;
						delete made.Out;

						return made;
					}

					return kit.Parts(made, results);
				}
			});
		}

		/* The winds of the planet, its storms, where the air came from: fronts and streams drawn out along the wind (StreamScale, StreamFine), Eddies. */
		block('ForecastStorms', ['PX', 'PY', 'PZ', 'Days', 'Seed', 'RadiusKm', 'Cells'], [number('StreamScale', 2.6), number('StreamFine', 14), number('Eddies', 0.06)], ['Fronts', 'Streams', 'Mid', 'Storm'], 'wx_air', function (input, prop, vector) {
			return [vector('PX', 'PY', 'PZ'), input('Days'), input('Seed'), input('RadiusKm'), prop('StreamScale'), prop('StreamFine'), prop('Eddies'), input('Cells')];
		});

		/* The sheets of a front where the air is humid enough (Cut less humid by CutBy, Soft), and how humid it is. */
		block('ForecastFronts', ['Fronts', 'Mid', 'Moist', 'Ground', 'Climb', 'PY', 'Storm', 'Cloudiness'], [number('Cut', 1.15), number('CutBy', 0.8), number('Soft', 0.08)], ['Sheet', 'Humid'], 'wx_fronts', function (input, prop) {
			return [input('Fronts'), input('Mid'), input('Moist'), input('Ground'), input('Climb'), input('PY'), input('Storm'), input('Cloudiness'), prop('Cut'), prop('CutBy'), prop('Soft')];
		});

		/* Heaps of the heat of the day, fair weather ones (FairSea, FairLand), the kind of the clouds. */
		block('ForecastHeaps', ['PX', 'PY', 'PZ', 'SunX', 'SunY', 'SunZ', 'Warm', 'Moist', 'Ground', 'Climb', 'Streams', 'Mid', 'Humid', 'Storm', 'Sheet', 'Cloudiness'], [number('FairSea', 0.22), number('FairLand', 0.38)], ['Heaps', 'Kind'], 'wx_heaps', function (input, prop, vector) {
			return [vector('PX', 'PY', 'PZ'), vector('SunX', 'SunY', 'SunZ'), input('Warm'), input('Moist'), input('Ground'), input('Climb'), input('Streams'), input('Mid'), input('Humid'), input('Storm'), input('Sheet'), input('Cloudiness'), prop('FairSea'), prop('FairLand')];
		});

		/* Cirrus on the streams (Low to High of them). */
		block('ForecastCirrus', ['Streams', 'PY', 'Sheet'], [number('Low', 0.55), number('High', 0.82)], ['Cirrus'], 'wx_cirrus', function (input, prop) {
			return [input('Streams'), input('PY'), input('Sheet'), prop('Low'), prop('High')];
		});

		/* Rain of a front as humid as From to To, and of the towers of a storm. */
		block('ForecastRain', ['Sheet', 'Humid', 'Storm', 'Heaps', 'Kind'], [number('From', 0.62), number('To', 0.95)], ['Rain'], 'wx_rain', function (input, prop) {
			return [input('Sheet'), input('Humid'), input('Storm'), input('Heaps'), input('Kind'), prop('From'), prop('To')];
		});

		/* Cover, kind, cirrus and rain of the weather: a shroud on a world of clouds, none on one with none. */
		block('ForecastShroud', ['Sheet', 'Heaps', 'Kind', 'Cirrus', 'Rain', 'Cloudiness'], [], ['Cover', 'Kind', 'Cirrus', 'Rain'], 'wx_shroud', function (input) {
			return [input('Sheet'), input('Heaps'), input('Kind'), input('Cirrus'), input('Rain'), input('Cloudiness')];
		});
	},

	/*
	 * The weather of a planet of the library, a graph of numbers (blueprints/shader/forecast): of a direction of its body
	 * (PX, PY, PZ), its days, seed, radius (km), the way to its sun (SunX..), how cloudy it is, and its climate there (Moist,
	 * Warm, Ground, Climb): Cover, Kind, Cirrus, Rain.
	 */
	LibraryForecast: function () {
		return this.LibraryShader('forecast');
	},

	/* The shape of a lightning of the library (blueprints/shader/bolt): see the header. */
	LibraryBolt: function () {
		return this.LibraryShader('bolt');
	},

	/* The shape of a lightning of a graph (none: the library one) for the page and for a shader: see the header. */
	Bolt: function (graph) {
		var blueprints = this.$Service('Blueprints');
		var read = blueprints.Read(graph || this.LibraryBolt());
		var key = JSON.stringify([read.blocks, read.links, read.parameters]);
		var code;
		var shader;
		var values = {};
		var made;

		this.Bolts = this.Bolts || {};

		if (this.Bolts[key])
			return this.Bolts[key];

		code = blueprints.NumericCode(read, {}, {});

		if (!code || code.Keys.join() !== 'X,Z')
			throw new Error('Elemenx SceneBlueprints: the shape of a bolt is a generator of numbers of its results X and Z');

		shader = this.$Service('BlueprintShaders').NumericGLSL(read, {});

		(read.parameters || []).forEach(function (parameter) {
			values[parameter.key] = Number(parameter.value);
		});

		function value (name, fallback) {
			return isFinite(values[name]) ? values[name] : fallback;
		}

		made = {
			Jag: function (step, seed) {
				var given = {Step: step, Seed: seed};

				return code.Run.Main.apply(null, code.Numeric.Inputs.map(function (one) {
					return given[one.Name] || 0;
				}));
			},
			Steps: Math.max(1, Math.min(64, Math.round(value('Steps', 14)))),
			Wide: value('Wide', 0.09),
			Fork: Math.round(value('Fork', 5)),
			ForkSteps: Math.max(0, Math.round(value('ForkSteps', 6))),
			ForkDown: value('ForkDown', 0.8),
			ForkWide: value('ForkWide', 1.2),
			GLSL: this.$Service('Renderer').Chunks[shader.Need] + '\nvec2 bolt_jag(float step, float seed) {\n\treturn ' + shader.Name + '(' + shader.Inputs.map(function (one) {
				return one.Name === 'Step' ? 'step' : one.Name === 'Seed' ? 'seed' : '0.0';
			}).join(', ') + ');\n}'
		};

		this.Bolts[key] = made;

		return made;
	},

	/*
	 * The arms of a galaxy as blocks of numbers of a generator (GalaxyData.Kernel: the same in the page and in a shader):
	 * GalaxyTurn (where a place stands round its spiral), GalaxyBend (its arms bent by a noise; Bend: how much), GalaxyWave
	 * (the wave of its arms, shifted inward for its dust), GalaxyArm (how much of its disc is in its arms: Low, High, Power).
	 */
	Galaxies: function () {
		var blueprints = this.$Service('Blueprints');
		var numeric = ['generator'];

		function galaxy () {
			return blueprints.$Service('GalaxyData');
		}

		function block (type, keys, properties, name) {
			blueprints.Node(type, {Graphs: numeric, Group: 'galaxy', Properties: properties.map(function (one) {
				return {Key: one[0], Type: 'number', Value: one[1]};
			}), Inputs: keys.map(function (key) {
				return {Key: key, Type: 'float', Value: 0};
			}), Outputs: [{Key: 'Value', Type: 'float'}],
			Compute: function (given, props) {
				return {Value: galaxy().Code()[name].apply(null, keys.map(function (key) {
					return Number(given[key]) || 0;
				}).concat(properties.map(function (one) {
					return Number(props[one[0]]);
				})))};
			},
			Numeric: function (given, props, kit) {
				kit.Kernel('galaxy', galaxy().IR());

				return {Value: {E: kit.Call.apply(null, [name].concat(keys.map(function (key) {
					return kit.Sized(given[key], 1).E;
				}), properties.map(function (one) {
					return kit.Const(Number(props[one[0]]), 'float');
				}))), T: 'float'}};
			}
			});
		}

		block('GalaxyTurn', ['X', 'Z', 'Scale', 'Pitch', 'Phase'], [], 'gx_turn');
		block('GalaxyBend', ['X', 'Z', 'Radius', 'Seed'], [['Bend', 0.5]], 'gx_bend');
		block('GalaxyWave', ['Turn', 'Bend', 'Arms', 'Shift'], [], 'gx_wave');
		block('GalaxyArm', ['Wave'], [['Low', 0.3], ['High', 1.7], ['Power', 2.2]], 'gx_arm');
	},

	/* The arms of a galaxy of the library (blueprints/shader/galaxy): see the header. */
	LibraryGalaxy: function () {
		return this.LibraryShader('galaxy');
	},

	/*
	 * The arms of a galaxy of a graph (none: the library one), made once a graph: a generator of its inputs X, Z (kly), Scale
	 * (of its disc, kly), Radius (kly), Pitch, Phase (radians), Arms, Seed (GalaxyData.SeedNumber), Shift (radians) of its
	 * results Turn, Bend, Wave and Arm. {Of(manifest, x, z, shift, seed): [Turn, Bend, Wave, Arm] in the page (kly),
	 * Arm(manifest, x, z, shift, seed): its Arm alone, GLSL: the text of vec4 galaxy_spiral(vec2 p, float scale, float radius,
	 * float pitch, float phase, float arms, float seed, float shift) for a shader}.
	 */
	Galaxy: function (graph) {
		var blueprints = this.$Service('Blueprints');
		var read = blueprints.Read(graph || this.LibraryGalaxy());
		var key = JSON.stringify([read.blocks, read.links, read.parameters]);
		var code;
		var shader;
		var made;
		var names = {X: 'p.x', Z: 'p.y', Scale: 'scale', Radius: 'radius', Pitch: 'pitch', Phase: 'phase', Arms: 'arms', Seed: 'seed', Shift: 'shift'};

		this.Spirals = this.Spirals || {};

		if (this.Spirals[key])
			return this.Spirals[key];

		code = blueprints.NumericCode(read, {}, {});

		if (!code || code.Keys.join() !== 'Turn,Bend,Wave,Arm')
			throw new Error('Elemenx SceneBlueprints: the arms of a galaxy are a generator of numbers of its results Turn, Bend, Wave and Arm');

		shader = this.$Service('BlueprintShaders').NumericGLSL(read, {});

		function of (manifest, x, z, shift, seed) {
			var given = {X: x, Z: z, Scale: manifest.Radius / 4500, Radius: manifest.Radius / 1000, Pitch: manifest.Pitch * Math.PI / 180, Phase: manifest.Phase * Math.PI / 180, Arms: manifest.Arms, Seed: seed, Shift: shift || 0};

			return code.Run.Main.apply(null, code.Numeric.Inputs.map(function (one) {
				return given[one.Name] || 0;
			}));
		}

		made = {
			Of: of,
			Arm: function (manifest, x, z, shift, seed) {
				return of(manifest, x, z, shift, seed)[3];
			},
			GLSL: this.$Service('Renderer').Chunks[shader.Need] + '\nvec4 galaxy_spiral(vec2 p, float scale, float radius, float pitch, float phase, float arms, float seed, float shift) {\n\treturn ' + shader.Name + '(' + shader.Inputs.map(function (one) {
				return names[one.Name] || '0.0';
			}).join(', ') + ');\n}'
		};

		this.Spirals[key] = made;

		return made;
	},

	/*
	 * What comes to the block BakeLand of a graph of a bake (its Land) as a generator of numbers: its blocks of that, their
	 * Input blocks, a Result Land. What the page reads of the surface of a body (SceneTerrainGenerator.Sphere), null with none.
	 */
	BakeLandGraph: function (graph) {
		var read = this.$Service('Blueprints').Read(graph);
		var land = (read.blocks || []).filter(function (block) {
			return block.type === 'BakeLand' && block.enabled !== false;
		})[0];
		var keep = {};
		var links = read.links || [];
		var into;

		function owner (pin) {
			return String(pin).split(/-(?:in|out)-/)[0];
		}

		function visit (id) {
			if (keep[id]) return;

			keep[id] = true;

			links.forEach(function (link) {
				if (owner(link.p2) === id)
					visit(owner(link.p1));
			});
		}

		if (!land)
			return null;

		into = links.filter(function (link) {
			return link.p2 === land.id + '-in-Land';
		})[0];

		if (!into)
			return null;

		visit(owner(into.p1));

		return {version: read.version, type: 'generator', name: (read.name || 'bake') + '-land', parameters: read.parameters || [], blocks: read.blocks.filter(function (block) {
			return keep[block.id];
		}).concat([{id: 'bake-land-result', type: 'Result', x: 0, y: 0, properties: [{key: 'Key', value: 'Land'}]}]), links: links.filter(function (link) {
			return keep[owner(link.p1)] && keep[owner(link.p2)];
		}).concat([{id: 'bake-land-link', p1: into.p1, p2: 'bake-land-result-in-Value', kind: 'value'}])};
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

		/*
		 * What the ground is made of there (SceneMaterials, by the weights of its materials): its color and its normal bent by
		 * their patterns, as near as the eye sees them.
		 */
		/* Open: how much of the daylight comes there (vOpen); under rock the rock of a cave (landUnder, SceneMaterials). */
		node('LandMaterial', [vec3('Place', 'vPlace'), vec3('Color', 'vColor'), vec3('Normal', 'normalize(vNormal)'), float('Open', 'vOpen')], [{Key: 'Color', Type: 'vec3'}, {Key: 'Normal', Type: 'vec3'}], function (context) {
			var name = 'l' + context.Index;
			var inputs = context.Inputs;

			context.Lines.push('landUnder = 1.0 - clamp(' + inputs.Open + ', 0.0, 1.0);');
			context.Lines.push('vec3 ' + name + '_color = ' + inputs.Color + ';');
			context.Lines.push('float ' + name + '_height = 0.0;');
			context.Lines.push('landMaterials(' + inputs.Place + ', length(fwidth(' + inputs.Place + '.xz)), ' + name + '_color, ' + name + '_height);');
			context.Lines.push('vec3 ' + name + '_normal = enx_bump(vWorld, ' + inputs.Normal + ', ' + name + '_height);');

			return {Color: name + '_color', Normal: name + '_normal'};
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
		/* Open: how much of the sky it sees (a cave under rock: little); the sun, the sky and what they bounce, by it; the lamps not. */
		node('LandLight', [vec3('World', 'vWorld'), vec3('Normal', 'normalize(vNormal)'), float('Open', 'vOpen')], [{Key: 'Light', Type: 'vec3'}, {Key: 'Sunlit', Type: 'float'}], function (context) {
			var name = 'l' + context.Index;
			var inputs = context.Inputs;

			context.Lines.push('float ' + name + '_sunlit = sunLit(' + inputs.World + ', ' + inputs.Normal + ') * smoothstep(0.0, 0.6, ' + inputs.Open + ');');
			/* The lamps, and their glints on what is wet of the rock of a cave (landGloss, SceneMaterials). */
			context.Lines.push('vec3 ' + name + '_gloss;');
			context.Lines.push('vec3 ' + name + '_lamps = localLit(' + inputs.World + ', ' + inputs.Normal + ', landGloss, ' + name + '_gloss);');

			return {Light: '((uSunColor * 1.35 * max(dot(' + inputs.Normal + ', uSun), 0.0) * ' + name + '_sunlit + aroundOpen(' + inputs.World + ', ' + inputs.Normal + ', skyLight(' + inputs.Normal + ', 1.0, uSkyLight, uFloorLight, uSun, 1.25)) * ' + inputs.Open + ') + ' + name + '_lamps + ' + name + '_gloss)', Sunlit: name + '_sunlit'};
		});

		/*
		 * Under the sea (uSea: the ground has one; its level is 0) the waves gather the sun into a web of light on the
		 * ground: two ridges of noise that run on, met where both are bright; less of it as the water deepens, none in the
		 * shadow, none over the water.
		 */
		node('LandCaustics', [vec3('Place', 'vPlace'), vec3('Light', 'vec3(1.0)'), float('Sunlit', '1.0')], [{Key: 'Light', Type: 'vec3'}], function (context) {
			var name = 'l' + context.Index;
			var inputs = context.Inputs;

			context.Lines.push('float ' + name + '_deep = -' + inputs.Place + '.y;');
			context.Lines.push('vec3 ' + name + '_at = vec3(' + inputs.Place + '.xz * 0.45, uTime2 * 0.35);');
			context.Lines.push('float ' + name + '_a = 1.0 - abs(noise3(' + name + '_at) * 2.0 - 1.0);');
			context.Lines.push('float ' + name + '_b = 1.0 - abs(noise3(' + name + '_at * vec3(1.7, 1.7, 1.25) + vec3(5.2, 1.3, 0.0)) * 2.0 - 1.0);');
			context.Lines.push('float ' + name + '_web = pow(' + name + '_a, 6.0) * pow(' + name + '_b, 6.0) * 6.0 + pow(' + name + '_a * ' + name + '_b, 12.0) * 4.0;');

			return {Light: '(' + inputs.Light + ' + uSunColor * max(uSun.y, 0.0) * ' + inputs.Sunlit + ' * ' + name + '_web * uSea * smoothstep(0.05, 0.6, ' + name + '_deep) * exp(-max(' + name + '_deep, 0.0) * 0.18))'};
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
			context.Lines.push('vec3 ' + name + '_horizon = air_horizon_ground(clamp(uSun.y * 3.0 + 0.3, 0.0, 1.0));');
			context.Lines.push('vec3 ' + name + '_lit = pow(' + inputs.Albedo + ' * ' + inputs.Light + ' + uSunColor * ' + inputs.Sheen + ' * ' + inputs.Sunlit + ' + ' + inputs.Glow + ', vec3(1.0 / 2.2));');
			context.Lines.push('float ' + name + '_mirror = ' + inputs.Pool + ' * (0.25 + 0.65 * pow(1.0 - max(' + name + '_v.y, 0.0), 3.0));');
			context.Lines.push(name + '_lit = mix(' + name + '_lit, mix(uAir.rgb, vec3(1.0), 0.5) * clamp(uSkyLight.b * 2.4, 0.03, 1.0), ' + name + '_mirror);');
			/* What it mirrors for the picture (MirrorCode): the pools and what is wet, as strong as they are, in the last third of the codes. */
			context.Lines.push('float ' + name + '_strength = clamp(' + name + '_mirror + uWet * 0.27 * (1.0 - ' + inputs.Pool + '), 0.0, 1.0);');
			context.Lines.push('float ' + name + '_code = ' + name + '_strength > 0.002 ? 1.0 - 0.45 * (0.7 + ' + name + '_strength * 0.3) : 1.0;');

			return {Color: 'mix(' + name + '_lit, ' + name + '_horizon, air_haze_ground(' + inputs.World + '))', Alpha: name + '_code'};
		});

		/* The end: the color of the land at the point, and how much of it covers what is under it. */
		blueprints.Node('LandEnd', {Graphs: land, Group: 'output', Inputs: [{Key: 'Color', Type: 'vec3', Default: 'color'}, {Key: 'Alpha', Type: 'float', Default: 'alpha'}], Outputs: [],
			GLSL: function (context) {
				return {Result: '\tcolor = ' + context.Inputs.Color + ';\n\talpha = ' + context.Inputs.Alpha + ';'};
			}
		});
	}
});
