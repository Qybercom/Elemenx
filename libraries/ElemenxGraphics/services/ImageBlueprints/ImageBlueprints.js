/*
 * ImageBlueprints: pictures made on the processor of graphs of Blueprints, declared in $Provides (Blueprints makes it when it
 * meets such a graph or block): the bark and the leaves of plants. A graph of the kind image ends at Image: Width and
 * Height (pixels), and either the Color (vec4, 0 to 1) and the Bump (its relief) of each pixel, the graph run once for each
 * (its Input blocks U and V, 0 to 1 across and down, X and Y, the pixel, and what it is given), or a Picture made whole
 * ({Width, Height, Data}, as a block of an algorithm gives it), the graph run once. Of its bumps a normal map is made
 * (Strength: how steep; Wrap: seamless across, as round a trunk), and its mean color (Mean, every seventh pixel).
 * - Compiled(graph): what runs it, made in a page ({Source: its code of numbers, Image: the properties of its Image, Told:
 *   the inputs of Image a link reaches}); a worker runs it of that (its Source is code, no graph is read there).
 * - Run(compiled, parameters, inputs): {Picture: {Width, Height, Data (RGBA bytes), Mean}, Normal: {Width, Height, Data} (of
 *   Bump; null with none)}. Make(graph, parameters, inputs): Run of Compiled. Sample(graph): what it is run with to be seen
 *   (Preset: the first plant of SceneFlora, when it reads one).
 * - Its blocks: Bark (Preset, U, V: a pixel of the bark of a preset of SceneFlora, round its trunk across and up the plant,
 *   of the graph of its pattern: R, G, B, Bump) and Leaves (Preset: the atlas of the leaves of a preset, Size by Tall
 *   pixels, Tile a cluster: SceneFlora.LeafPicture).
 * The library's pictures (ElemenxGraphics/image/<name>): bark and leaves (SceneFlora.Textures). The same functions run in Node.
 */
Elemenx.Service('ImageBlueprints', {
	$Meta: {
		Description: 'Pictures made on the processor of graphs of Blueprints: the bark and the leaves of plants, each pixel of a graph or a picture of an algorithm.',
		Methods: ['Compiled(graph)', 'Run(compiled, parameters, inputs)', 'Make(graph, parameters, inputs)', 'Sample(graph)']
	},

	$Provides: {
		Blueprints: {Graphs: ['image'], Nodes: ['Image', 'Bark', 'Leaves']}
	},

	$OnCreate: function () {
		this.Blocks();
	},

	/* What a worker carries of it (Workers.Source). */
	Source: function (names) {
		return this.$Service('Workers').Source(this, names);
	},

	/* What a graph of it is run with to be seen (BlueprintPreview): Preset, a plant of SceneFlora (its first species), when it reads one. */
	Sample: function (graph) {
		var blueprints = this.$Service('Blueprints');
		var read = blueprints.Read(typeof graph === 'string' && !/^\s*\{/.test(graph) ? Elemenx.Resources('Blueprints', graph) : graph);
		var flora;

		if (!read.blocks.some(function (block) {
			return block.type === 'Input' && blueprints.Properties(block).Name === 'Preset';
		})) return {};

		flora = this.$Service('SceneFlora');

		return {Preset: flora.Preset(flora.Species()[0])};
	},

	Make: function (graph, parameters, inputs) {
		return this.Run(this.Compiled(graph), parameters, inputs);
	},

	Compiled: function (graph) {
		var blueprints = this.$Service('Blueprints');
		var given = typeof graph === 'string' && !/^\s*\{/.test(graph) ? Elemenx.Resources('Blueprints', graph) : typeof graph === 'string' ? JSON.parse(graph) : graph;
		if (!given || !Array.isArray(given.blocks))
			throw new Error('Elemenx ImageBlueprints: no graph of an image ' + (typeof graph === 'string' ? graph : ''));

		var read = blueprints.Read(given);
		if (read.type !== 'image')
			throw new Error('Elemenx ImageBlueprints: not a graph of an image but of ' + read.type);

		var end = read.blocks.filter(function (block) {
			return block.type === 'Image' && block.enabled !== false;
		})[0];
		if (!end)
			throw new Error('Elemenx ImageBlueprints: an image graph has no Image');

		var image = blueprints.Properties(end);
		var code = blueprints.Code(read);
		var told = code ? code.Keys : [];

		if (!code)
			throw new Error('Elemenx ImageBlueprints: a block of the image graph has no code');

		return {Source: code.Source, Image: {Width: Number(image.Width) || 256, Height: Number(image.Height) || 256, Strength: Number(image.Strength) || 0, Wrap: image.Wrap === true || image.Wrap === 'true'}, Told: told};
	},

	Run: function (compiled, parameters, inputs) {
		var run = this.RunOf(compiled.Source);
		var image = compiled.Image;
		var given = Object.assign({}, inputs || {});
		var width = image.Width;
		var height = image.Height;
		var data;
		var bumps;
		var normal = null;
		var made;
		var x;
		var y;

		/* A picture made whole: the graph once. */
		if (compiled.Told.indexOf('Picture') !== -1) {
			made = run(parameters || {}, given).Picture;

			return {Picture: made, Normal: null};
		}

		data = new Uint8Array(width * height * 4);
		bumps = compiled.Told.indexOf('Bump') !== -1 ? new Float32Array(width * height) : null;

		for (y = 0; y < height; y++) {
			for (x = 0; x < width; x++) {
				var o = (y * width + x) * 4;
				var color;

				given.U = x / width;
				given.V = y / height;
				given.X = x;
				given.Y = y;
				made = run(parameters || {}, given);
				color = made.Color || [0, 0, 0, 1];

				if (bumps)
					bumps[y * width + x] = made.Bump;

				data[o] = Math.round(Math.max(0, Math.min(1, color[0])) * 255);
				data[o + 1] = Math.round(Math.max(0, Math.min(1, color[1])) * 255);
				data[o + 2] = Math.round(Math.max(0, Math.min(1, color[2])) * 255);
				data[o + 3] = color.length > 3 ? Math.round(Math.max(0, Math.min(1, color[3])) * 255) : 255;
			}
		}

		/* Its relief: the slopes of its bumps (across wrapped when it is seamless), as a normal map of tangent space. */
		if (bumps) {
			normal = new Uint8Array(width * height * 4);

			for (y = 0; y < height; y++) {
				for (x = 0; x < width; x++) {
					var dx = image.Wrap ? bumps[y * width + (x + 1) % width] - bumps[y * width + (x + width - 1) % width] : bumps[y * width + Math.min(width - 1, x + 1)] - bumps[y * width + Math.max(0, x - 1)];
					var dy = bumps[Math.min(height - 1, y + 1) * width + x] - bumps[Math.max(0, y - 1) * width + x];
					var nx = -dx * image.Strength;
					var ny = -dy * image.Strength;
					var l = Math.sqrt(nx * nx + ny * ny + 1);
					var q = (y * width + x) * 4;

					normal[q] = Math.round((nx / l * 0.5 + 0.5) * 255);
					normal[q + 1] = Math.round((ny / l * 0.5 + 0.5) * 255);
					normal[q + 2] = Math.round((1 / l * 0.5 + 0.5) * 255);
					normal[q + 3] = 255;
				}
			}
		}

		/* Its mean color (0 to 1): what a far copy of a plant is painted (SceneModels.Painted). */
		var mean = [0, 0, 0];

		for (x = 0; x < width * height; x += 7) {
			mean[0] += data[x * 4] / 255;
			mean[1] += data[x * 4 + 1] / 255;
			mean[2] += data[x * 4 + 2] / 255;
		}

		mean = mean.map(function (part) {
			return part / Math.ceil(width * height / 7);
		});

		return {Picture: {Width: width, Height: height, Data: data, Mean: mean}, Normal: normal ? {Width: width, Height: height, Data: normal} : null};
	},

	/* The function of the code of an image graph, made once for the same code (in a page or a worker). */
	RunOf: function (source) {
		this.Runs = this.Runs || {};

		if (!this.Runs[source])
			this.Runs[source] = new Function('B', 'M', 'N', source)(this.$Service('Blueprints'), this.$Service('Math'), this.$Service('Noise'));

		return this.Runs[source];
	},

	/*
	 * A pixel of the bark of a preset (SceneFlora), round its trunk across (U) and up the plant (V): the graph of its pattern
	 * (BarkRun) of its numbers, the same for each pixel (its colors, where it turns, its rings, the seeds of its noises).
	 */
	Bark: function (preset, u, v) {
		var flora = this.$Service('SceneFlora');
		var last = this.BarkLast;
		var kept = this.Barks = this.Barks || {};
		var made = last && last.Preset === preset ? last.Made : null;
		var key;
		var a;

		/* The same preset pixel after pixel: its numbers kept by it, else by what it is. */
		if (!made) {
			key = preset.Name + JSON.stringify(preset.Bark);
			made = kept[key];
		}

		if (!made) {
			var math = this.$Service('Math');
			var run = flora.BarkRun(preset.Bark);
			var fixed = {Split: preset.Bark.Split, Rings: preset.Bark.Rings || 140, LowR: preset.Bark.Low[0], LowG: preset.Bark.Low[1], LowB: preset.Bark.Low[2], HighR: preset.Bark.High[0], HighG: preset.Bark.High[1], HighB: preset.Bark.High[2], SFine: math.SeedOffset(preset.Name + ':bark'), SCells: math.SeedOffset(preset.Name + ':plates')};

			made = kept[key] = {Run: run, List: run.Inputs.map(function (name) {
				return fixed[name] === undefined ? 0 : fixed[name];
			}), At: {CX: run.Inputs.indexOf('CX'), CZ: run.Inputs.indexOf('CZ'), T: run.Inputs.indexOf('T')}};
		}

		this.BarkLast = {Preset: preset, Made: made};

		a = u * Math.PI * 2;
		made.List[made.At.CX] = Math.cos(a);
		made.List[made.At.CZ] = Math.sin(a);
		made.List[made.At.T] = v;

		return made.Run.Main.apply(null, made.List);
	},

	Leaves: function (preset, size, tall, tile) {
		return this.$Service('SceneFlora').LeafPicture(preset, {Size: Number(size) || 512, Tall: Number(tall) || 1024, Tile: Number(tile) || 256});
	},

	Blocks: function () {
		var self = this;
		var blueprints = this.$Service('Blueprints');

		function number (key, value) {
			return {Key: key, Type: 'number', Value: value};
		}

		blueprints.Graph('image', {
			End: 'Image',
			Uses: ['generator'],
			Coded: ['Color', 'Bump', 'Picture'],
			Compile: function (plan) {
				return {
					Make: function (parameters, inputs) {
						return self.Make(plan.Graph, parameters, inputs);
					}
				};
			}
		});

		blueprints.Node('Image', {Graphs: ['image'], Group: 'output', Comment: 'The picture: the color and relief of each pixel, or a picture made whole', Properties: [number('Width', 256), number('Height', 256), number('Strength', 2.5), {Key: 'Wrap', Type: 'bool', Value: false}], Inputs: [{Key: 'Color', Type: 'vec4', Value: [0, 0, 0, 1]}, {Key: 'Bump', Type: 'float', Value: 0}, {Key: 'Picture', Type: 'any'}], Outputs: []});

		blueprints.Node('Bark', {Graphs: ['image'], Group: 'image', Comment: 'A pixel of the bark of a plant, of the graph of its pattern', Inputs: [{Key: 'Preset', Type: 'any'}, {Key: 'U', Type: 'float', Value: 0}, {Key: 'V', Type: 'float', Value: 0}], Outputs: [{Key: 'R', Type: 'float'}, {Key: 'G', Type: 'float'}, {Key: 'B', Type: 'float'}, {Key: 'Bump', Type: 'float'}],
			Compute: function (inputs) {
				var made = self.Bark(inputs.Preset, inputs.U, inputs.V);

				return {R: made[0], G: made[1], B: made[2], Bump: made[3]};
			},
			Code: function (context) {
				var at = 'b' + context.Index;

				context.Prelude('var ' + at + ' = null, i' + context.Index + ' = B.$Service("ImageBlueprints");');

				return {R: '(' + at + ' = i' + context.Index + '.Bark(' + [context.Inputs.Preset, context.Inputs.U, context.Inputs.V].join(', ') + '))[0]', G: at + '[1]', B: at + '[2]', Bump: at + '[3]'};
			}
		});

		blueprints.Node('Leaves', {Graphs: ['image'], Group: 'image', Comment: 'The atlas of the leaves of a plant: four clusters, in the light above, in the shade below', Properties: [number('Size', 512), number('Tall', 1024), number('Tile', 256)], Inputs: [{Key: 'Preset', Type: 'any'}], Outputs: [{Key: 'Picture', Type: 'any'}],
			Compute: function (inputs, properties) {
				return {Picture: self.Leaves(inputs.Preset, properties.Size, properties.Tall, properties.Tile)};
			},
			Code: function (context) {
				var told = context.Properties;

				return {Picture: 'B.$Service("ImageBlueprints").Leaves(' + [context.Inputs.Preset, JSON.stringify(told.Size), JSON.stringify(told.Tall), JSON.stringify(told.Tile)].join(', ') + ')'};
			}
		});
	}
});
