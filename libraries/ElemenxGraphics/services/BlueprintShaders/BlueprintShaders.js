/*
 * BlueprintShaders: the graphs of Blueprints made into shaders and passes of a picture. Blueprints (ElemenxCommon) has
 * the graphs, their checks and what runs as code; this Service defines, as it is made, the kinds that need the parts
 * of the shaders of Renderer, and the GLSL of the blocks of numbers:
 * - pass: a fragment shader over the whole picture, its Output a vec4;
 * - material: a function of GLSL that changes a surface (blueprintSurface), its Surface the color, alpha, roughness,
 *   metalness, glow and normal;
 * - render: passes of a picture, each a block whose Pass(context, inputs, properties, block) gives its textures,
 *   ending at Present;
 * - vertex: a function of GLSL that moves a corner of a shape (blueprintVertex(position, normal, uv, sway, phase, size,
 *   inout world, inout bent): its place in the model, its normal and uv, how far the wind bends the copy, its phase and
 *   its size given; its place in the world and its normal moved), ending at Vertex. World is where the corner is
 *   before, Sway, Phase and Size those of the copy, Wind the gust of the scene. A Scene puts it, as the Vertex of a
 *   material, in every pass that draws the shape: the picture, its glow, its shadows, its view from above and the
 *   light it gives back; and its wind is a vertex graph too (Scene.WindGraph), run before.
 * A pass and a material are baked (Blueprints.Bake) as JSON and read back with no node at all. Both are written by
 * hand too: Blueprints.Compile({type: 'material' or 'pass', glsl}). The text of a material is its blueprintSurface and
 * what it calls; the one of a pass its main (the head, vQuad and outColor added) or a whole fragment shader (#version),
 * kept as it is. Its uniforms are read from its lines (uniform <type> <name>;): uParameter_<Key> a parameter of the
 * graph, its value by a comment after it (// = 0.5, // = #ff8000, // = 1, 0, 0), a sampler2D a texture (uTexture_Name
 * by its Name); // needs: Noise, Lights puts those parts of the shaders in.
 * The block GLSL is code written in a graph of shaders: its Code (lines of GLSL in a scope of their own, its Inputs
 * there as variables of their names, its Outputs given by setting them; a uniform line declares one), its pins named by
 * its properties Inputs and Outputs ("Tint: vec3, Gain: float"), Needs the parts of the shaders it calls. Its code is
 * numbered as a source of its own (#line 1 <1000 and on>, Sources of what Compile gives: {source: block id}); Lined(text)
 * numbers what follows it in a whole shader, Errors(made, log) gives the errors of the log of a shader that did not
 * compile each on its block: [{Block, Line, Message}].
 * The blocks it adds: UV, Pixel, Position, Normal, Texture, Output, Surface, Present; the numbers of Blueprints
 * (Number, Vector, Color, Bool, Parameter, Time, the operators, Mix, Clamp, Smoothstep, Remap, Dot, Length, Normalize,
 * Split, Combine, Noise, Fbm, NoiseSpec: its lines, the part Noises of Renderer for the functions of the Noise Service)
 * stand in its graphs with their GLSL. It declares them in $Provides: Blueprints makes it
 * when it meets a graph of these kinds or one of these blocks, so there is nothing to call first. The same functions run in Node: they read no page.
 */
Elemenx.Service('BlueprintShaders', {
	$Meta: {
		Description: 'The graphs of Blueprints made into shaders and passes of a picture: the kinds pass, material and render.',
		Methods: []
	},

	$Provides: {
		Blueprints: {Graphs: ['pass', 'material', 'render', 'vertex'], Nodes: ['UV', 'Pixel', 'Position', 'Normal', 'World', 'Sway', 'Phase', 'Size', 'Wind', 'Texture', 'Output', 'Surface', 'Vertex', 'Present', 'GLSL']}
	},

	$OnCreate: function () {
		this.Core = this.$Service('Blueprints');

		this.Library();
	},

	/* BlueprintShaders: GLSL */

	Literal: function (value, type) {
		var size = this.Core.Sizes[type] || 1;
		var list;

		function number (n) {
			var text = String(Number(n) || 0);

			return /[.e]/.test(text) ? text : text + '.0';
		}

		if (type === 'bool')
			return value ? 'true' : 'false';

		if (type === 'int')
			return String(Math.round(Number(value) || 0));

		list = this.Core.Numbers(value, size);

		if (size === 1)
			return number(list[0]);

		return type + '(' + list.map(function (n) {
			return number(n);
		}).join(', ') + ')';
	},

	/* Code of one type made code of another. */
	Convert: function (code, from, to) {
		var sizes = this.Core.Sizes;

		if (!from || !to || from === to || to === 'any' || from === 'any' || to === 'same') return code;

		if (from === 'bool')
			return this.Convert('(' + code + ' ? 1.0 : 0.0)', 'float', to);

		if (from === 'int')
			return this.Convert('float(' + code + ')', 'float', to);

		if (to === 'int')
			return 'int(' + this.Convert(code, from, 'float') + ')';

		if (to === 'bool')
			return '(' + this.Convert(code, from, 'float') + ' != 0.0)';

		if (sizes[from] === 1)
			return to + '(' + code + ')';

		if (sizes[to] === 1)
			return '(' + code + ').x';

		if (sizes[to] < sizes[from])
			return '(' + code + ').' + 'xyzw'.slice(0, sizes[to]);

		if (from === 'vec2' && to === 'vec3') return 'vec3(' + code + ', 0.0)';

		if (from === 'vec2')
			return 'vec4(' + code + ', 0.0, 1.0)';

		return 'vec4(' + code + ', 1.0)';
	},

	Widest: function (types) {
		var sizes = this.Core.Sizes;

		return types.reduce(function (widest, type) {
			return (sizes[type] || 0) > (sizes[widest] || 0) ? type : widest;
		}, 'float');
	},

	Name: function (text) {
		return String(text).replace(/[^A-Za-z0-9]/g, '_');
	},

	/*
	 * A graph as GLSL: a line for each block in order, its outputs local variables (b<number>_<key>), the parameters,
	 * the time, the size of a pixel and the textures uniforms. kind: pass or material. Gives {Lines, Result, Uniforms,
	 * Textures, Needs}.
	 */
	Shader: function (plan, kind) {
		var self = this;
		var graph = plan.Graph;
		var lines = [];
		var uniforms = [];
		var textures = [];
		var needs = [];
		var names = {};
		var types = {};
		var result = {};
		var sources = {};
		var index = 0;

		graph.parameters.forEach(function (parameter) {
			uniforms.push({Name: 'uParameter_' + self.Name(parameter.key), Type: parameter.type || 'float', Key: parameter.key, Value: parameter.value});
		});

		function uniform (name, type) {
			var known = uniforms.some(function (one) {
				return one.Name === name;
			});
			if (!known)
				uniforms.push({Name: name, Type: type});

			return name;
		}

		plan.Order.forEach(function (id) {
			var block = plan.Blocks[id];
			var node = plan.Nodes[id];
			var properties = self.Core.Properties(block);
			var inputs = {};
			var inputTypes = {};
			var same = [];
			var outputs = self.Core.Outputs(node, block) || [];
			var context;
			var made;
			var working;

			index++;
			names[id] = {};
			types[id] = {};

			(self.Core.Inputs(node, block) || []).forEach(function (input) {
				var from = plan.From[id][input.Key];
				if (from && input.Type === 'same')
					same.push(types[from.Block][from.Key]);
			});

			working = self.Widest(same);

			(self.Core.Inputs(node, block) || []).forEach(function (input) {
				var from = plan.From[id][input.Key];
				var type = input.Type === 'same' ? working : input.Type;

				inputTypes[input.Key] = type;

				if (from) inputs[input.Key] = self.Convert(names[from.Block][from.Key], types[from.Block][from.Key], type);
				else if (input.Default != null) inputs[input.Key] = input.Default;
				else inputs[input.Key] = self.Literal(input.Value == null ? 0 : input.Value, type);
			});

			(node.Needs || []).forEach(function (need) {
				if (needs.indexOf(need) === -1)
					needs.push(need);
			});

			context = {Inputs: inputs, Types: inputTypes, Type: working, Properties: properties, Block: block, Graph: kind, Lines: [], Index: index, Uniform: uniform, Texture: function (name) {
				var made = 'uTexture_' + self.Name(name);
				var known = textures.some(function (one) {
					return one.Name === name;
				});
				if (!known)
					textures.push({Name: name, Uniform: made});

				return made;
			}, Need: function (need) {
				if (needs.indexOf(need) === -1)
					needs.push(need);
			}, Source: function () {
				sources[1000 + index] = block.id;

				return 1000 + index;
			}};

			if (block.enabled === false) {
				made = {};

				outputs.forEach(function (output) {
					var type = output.Type === 'same' ? working : output.Type;
					var key = Object.keys(inputs).filter(function (input) {
						return plan.From[id][input] && self.Core.Fits(inputTypes[input], type);
					})[0];

					made[output.Key] = key ? self.Convert(inputs[key], inputTypes[key], type) : self.Literal(0, type);
				});
			}
			else if (typeof node.GLSL === 'function') {
				made = node.GLSL.call(self, context) || {};
			}
			else if (typeof node.GLSL === 'string') {
				made = {};
				made[outputs.length ? outputs[0].Key : 'Out'] = node.GLSL.replace(/\{([A-Za-z0-9_]+)\}/g, function (all, key) {
					return '(' + inputs[key] + ')';
				});
			}
			else {
				throw new Error('Elemenx Blueprints: a block ' + block.type + ' has no GLSL');
			}

			lines.push.apply(lines, context.Lines);

			outputs.forEach(function (output) {
				var type = output.Type === 'same' ? working : output.Type;
				var name = 'b' + index + '_' + self.Name(output.Key);

				if (made[output.Key] == null) return;

				names[id][output.Key] = name;
				types[id][output.Key] = type;

				lines.push(type + ' ' + name + ' = ' + made[output.Key] + ';');
			});

			if (made.Result)
				result[block.type] = made.Result;
		});

		return {Lines: lines, Result: result, Uniforms: uniforms, Textures: textures, Needs: needs, Sources: sources};
	},

	Chunks: function (needs) {
		var chunks = this.$Service('Renderer').Chunks;

		return needs.map(function (need) {
			if (!chunks[need])
				throw new Error('Elemenx Blueprints: no part of shaders ' + need);

			return chunks[need];
		}).join('\n');
	},

	Declare: function (shader) {
		return shader.Uniforms.map(function (uniform) {
			return 'uniform ' + uniform.Type + ' ' + uniform.Name + ';';
		}).concat(shader.Textures.map(function (texture) {
			return 'uniform sampler2D ' + texture.Uniform + ';';
		})).join('\n');
	},

	/* The uniforms of a made shader: of its parameters (by key, else their value) and of extra {Time, Pixel, Textures}. */
	Values: function (made) {
		var self = this;

		return function (parameters, extra) {
			var values = {};

			parameters = parameters || {};
			extra = extra || {};

			made.Uniforms.forEach(function (uniform) {
				var value;

				if (uniform.Key != null) {
					value = Object.prototype.hasOwnProperty.call(parameters, uniform.Key) ? parameters[uniform.Key] : uniform.Value;
					values[uniform.Name] = self.Core.Sizes[uniform.Type] > 1 ? self.Core.Numbers(value, self.Core.Sizes[uniform.Type]) : uniform.Type === 'bool' ? !!value : Number(value) || 0;
				}
				else if (uniform.Name === 'uTime') {
					values.uTime = Number(extra.Time) || 0;
				}
				else if (uniform.Name === 'uPixel') {
					values.uPixel = extra.Pixel || [0, 0];
				}
			});

			made.Textures.forEach(function (texture) {
				if (extra.Textures && extra.Textures[texture.Name])
					values[texture.Uniform] = extra.Textures[texture.Name];
			});

			return values;
		};
	},

	/*
	 * GLSL written by hand, read as a graph made: its uniforms (uniform <type> <name>; lines; uParameter_<Key> a parameter
	 * of the graph, its value by "// = value" after it, a number, a color #rrggbb or numbers with commas; a sampler2D a
	 * texture, uTexture_<Name> by its Name), its parts of shaders (// needs: Noise, Lights) and the rest, its Body.
	 * Gives {Body, Uniforms, Textures, Needs, Parameters}.
	 */
	Written: function (glsl) {
		var made = {Body: [], Uniforms: [], Textures: [], Needs: [], Parameters: []};

		function value (text, type) {
			var list;

			if (text === undefined || text === '') return type === 'bool' ? false : 0;

			if (/^#[0-9a-f]{6,8}$/i.test(text) || type === 'bool') return type === 'bool' ? text === 'true' : text;

			list = text.split(',').map(function (part) {
				return Number(part.trim()) || 0;
			});

			return list.length > 1 ? list : list[0];
		}

		String(glsl).split('\n').forEach(function (line) {
			var needs = /^\s*\/\/\s*needs\s*:\s*(.+?)\s*$/i.exec(line);
			var uniform = /^\s*uniform\s+(\w+)\s+(\w+)\s*;\s*(?:\/\/\s*=\s*(.*?)\s*)?$/.exec(line);
			var key;
			var texture;

			if (needs) {
				needs[1].split(/[\s,]+/).filter(Boolean).forEach(function (need) {
					if (made.Needs.indexOf(need) === -1)
						made.Needs.push(need);
				});

				return;
			}

			if (!uniform) {
				made.Body.push(line);

				return;
			}

			if (uniform[1] === 'sampler2D') {
				texture = /^uTexture_(\w+)$/.exec(uniform[2]);

				made.Textures.push({Name: texture ? texture[1] : uniform[2], Uniform: uniform[2]});

				return;
			}

			key = /^uParameter_(\w+)$/.exec(uniform[2]);

			if (key) {
				made.Parameters.push({key: key[1], type: uniform[1], value: value(uniform[3], uniform[1])});
				made.Uniforms.push({Name: uniform[2], Type: uniform[1], Key: key[1], Value: value(uniform[3], uniform[1])});
			}
			else {
				made.Uniforms.push({Name: uniform[2], Type: uniform[1]});
			}
		});

		made.Body = made.Body.join('\n').replace(/^\n+|\n+$/g, '');

		return made;
	},

	/*
	 * The lines of a shader with the code of its GLSL blocks in it: each block's code is numbered as its own (#line 1
	 * <source>, the source of the block, 1000 and on), and what follows it gets its number in the whole text back. A
	 * shader a material goes into is lined after it has the material in it.
	 */
	Lined: function (text) {
		return String(text).split('\n').map(function (line, index) {
			return /^\s*#line\s+back\s*$/.test(line) ? '#line ' + (index + 2) + ' 0' : line;
		}).join('\n');
	},

	/*
	 * The errors of the log of a shader that did not compile, each on the block of GLSL it is in: [{Block (its id, null
	 * for the rest of the shader), Line (in the code of the block), Message}]. made: what Compile gave (its Sources).
	 */
	Errors: function (made, log) {
		var sources = made && made.Sources || {};
		var found = [];

		String(log || '').split('\n').forEach(function (line) {
			var match = /(?:ERROR|WARNING):\s*(\d+):(\d+):\s*(.*)$/.exec(line);

			if (match) {
				found.push({Block: sources[match[1]] || null, Line: Number(match[2]), Message: match[3].trim()});
			}
		});

		return found;
	},

	/* The pins a GLSL block names in a property: "A: vec3, B: float" (a name alone is a float). */
	PinList: function (text) {
		return String(text || '').split(/[,;\n]+/).map(function (part) {
			var pair = part.split(':');
			var key = (pair[0] || '').trim();
			var type = (pair[1] || 'float').trim();

			return /^[A-Za-z_]\w*$/.test(key) ? {Key: key, Type: type} : null;
		}).filter(Boolean);
	},

	/* BlueprintShaders: the library */

	Library: function () {
		var self = this;
		var core = this.Core;
		var shaders = ['pass', 'material', 'vertex'];
		/* The kinds of shaders of the Libraries over this one, where the numbers and GLSL stand too (water, sky, land: SceneBlueprints). */
		var numeric = shaders.concat(['water', 'sky', 'land']);

		function baked (made) {
			return {version: core.Version, type: made.Type, hash: made.Hash, parameters: made.Parameters, baked: {Fragment: made.Fragment, Source: made.Source, Function: made.Function, Needs: made.Needs, Uniforms: made.Uniforms, Textures: made.Textures, Sources: made.Sources}};
		}

		function unbaked (record) {
			var made = {Type: record.type, Hash: record.hash, Parameters: record.parameters || [], Fragment: record.baked.Fragment, Source: record.baked.Source, Function: record.baked.Function, Needs: record.baked.Needs || [], Uniforms: record.baked.Uniforms || [], Textures: record.baked.Textures || [], Sources: record.baked.Sources || {}};

			made.Values = self.Values(made);

			return made;
		}

		/* The kinds of graphs. */
		core.Graph('pass', {
			End: 'Output',
			Bake: baked,
			Unbake: unbaked,
			/* A pass written by hand: a whole fragment shader (#version) as it is, or what goes after its head (main). */
			Text: function (glsl) {
				var shader = self.Written(glsl);
				var whole = /^\s*#version/.test(glsl);
				var made;

				if (!/\bvoid\s+main\s*\(/.test(glsl))
					throw new Error('Elemenx Blueprints: a pass written by hand has no main');

				made = {
					Fragment: whole ? glsl : ['#version 300 es', 'precision highp float;', 'in vec2 vQuad;', 'out vec4 outColor;', self.Declare(shader), self.Chunks(shader.Needs), shader.Body].filter(Boolean).join('\n'),
					Needs: shader.Needs,
					Uniforms: shader.Uniforms,
					Textures: shader.Textures,
					Parameters: shader.Parameters
				};

				made.Values = self.Values(made);

				return made;
			},
			Compile: function (plan) {
				var shader = self.Shader(plan, 'pass');
				var made = {
					Fragment: ['#version 300 es', 'precision highp float;', 'in vec2 vQuad;', 'out vec4 outColor;', self.Declare(shader), self.Chunks(shader.Needs), 'void main() {', '\tvec2 uv = vQuad * 0.5 + 0.5;']
						.concat(shader.Lines.map(function (line) {
							return '\t' + line;
						}))
						.concat(['\toutColor = ' + (shader.Result.Output || 'vec4(0.0)') + ';', '}'])
						.filter(function (line) {
							return line !== '';
						})
						.join('\n'),
					Uniforms: shader.Uniforms,
					Textures: shader.Textures,
					Sources: shader.Sources
				};

				made.Fragment = self.Lined(made.Fragment);
				made.Values = self.Values(made);

				return made;
			}
		});

		core.Graph('material', {
			End: 'Surface',
			Bake: baked,
			Unbake: unbaked,
			/* A material written by hand: its function blueprintSurface, and what it calls, after its uniforms. */
			Text: function (glsl) {
				var shader = self.Written(glsl);
				var made;

				if (!/\bvoid\s+blueprintSurface\s*\(/.test(glsl))
					throw new Error('Elemenx Blueprints: a material written by hand has no blueprintSurface');

				made = {
					Source: [self.Declare(shader), self.Chunks(shader.Needs), shader.Body].filter(Boolean).join('\n'),
					Function: shader.Body,
					Needs: shader.Needs,
					Uniforms: shader.Uniforms,
					Textures: shader.Textures,
					Parameters: shader.Parameters
				};

				made.Values = self.Values(made);

				return made;
			},
			Compile: function (plan) {
				var shader = self.Shader(plan, 'material');
				var body = ['void blueprintSurface(vec3 position, vec3 normal, vec2 uv, inout vec3 color, inout float alpha, inout float rough, inout float metal, inout vec3 emission, inout vec3 bent) {']
					.concat(shader.Lines.map(function (line) {
						return '\t' + line;
					}))
					.concat([shader.Result.Surface || '', '}'])
					.filter(function (line) {
						return line !== '';
					})
					.join('\n');

				/* Source stands alone; a shader that has the parts already takes Function, after its uniforms, and the Needs it lacks. */
				var made = {
					Source: self.Lined([self.Declare(shader), self.Chunks(shader.Needs), body].filter(Boolean).join('\n')),
					Function: body,
					Needs: shader.Needs,
					Uniforms: shader.Uniforms,
					Textures: shader.Textures,
					Sources: shader.Sources
				};

				made.Values = self.Values(made);

				return made;
			}
		});

		/*
		 * A vertex graph: a function of GLSL that moves a corner of a shape (blueprintVertex: its place in the space of the
		 * model, its normal and uv given, its place in the world and its normal moved), in every pass that draws it.
		 */
		core.Graph('vertex', {
			End: 'Vertex',
			Bake: baked,
			Unbake: unbaked,
			Text: function (glsl) {
				var shader = self.Written(glsl);
				var made;

				if (!/\bvoid\s+blueprintVertex\s*\(/.test(glsl))
					throw new Error('Elemenx Blueprints: a vertex written by hand has no blueprintVertex');

				made = {Function: shader.Body, Needs: shader.Needs, Uniforms: shader.Uniforms, Textures: [], Parameters: shader.Parameters};
				made.Values = self.Values(made);

				return made;
			},
			Compile: function (plan) {
				var shader = self.Shader(plan, 'vertex');
				var made = {
					Function: ['void blueprintVertex(vec3 position, vec3 normal, vec2 uv, float sway, float phase, float size, inout vec3 world, inout vec3 bent) {']
						.concat(shader.Lines.map(function (line) {
							return '\t' + line;
						}))
						.concat([shader.Result.Vertex || '', '}'])
						.filter(function (line) {
							return line !== '';
						})
						.join('\n'),
					Needs: shader.Needs,
					Uniforms: shader.Uniforms,
					Textures: [],
					Sources: shader.Sources
				};

				made.Values = self.Values(made);

				return made;
			}
		});

		/* Passes of a picture: each block gives its textures by Pass, in order; what Present takes is the picture. */
		core.Graph('render', {
			End: 'Present',
			Compile: function (plan) {
				var passes = plan.Order.map(function (id) {
					return {ID: id, Type: plan.Blocks[id].type, Properties: self.Core.Properties(plan.Blocks[id]), Inputs: plan.From[id], Keys: Object.keys(plan.From[id] || {}), Enabled: plan.Blocks[id].enabled !== false};
				});

				passes.forEach(function (pass, index) {
					pass.Last = index;

					passes.forEach(function (other, later) {
						Object.keys(other.Inputs).forEach(function (key) {
							if (other.Inputs[key].Block === pass.ID && later > pass.Last)
								pass.Last = later;
						});
					});
				});

				return {
					Passes: passes,
					Run: function (context, parameters) {
						var outputs = {};
						var picture = null;

						passes.forEach(function (pass) {
							var node = plan.Nodes[pass.ID];
							var inputs = {};

							pass.Keys.forEach(function (key) {
								var from = pass.Inputs[key];

								inputs[key] = (outputs[from.Block] || {})[from.Key];
							});

							if (pass.Type === 'Parameter') {
								outputs[pass.ID] = {Value: (parameters || {})[pass.Properties.Key]};

								return;
							}

							/* A pass switched off gives on what came to it by the same name (its Color): its other textures are none. */
							if (!pass.Enabled) {
								outputs[pass.ID] = {};

								(self.Core.Outputs(node, plan.Blocks[pass.ID]) || []).forEach(function (output) {
									outputs[pass.ID][output.Key] = inputs[output.Key] === undefined ? null : inputs[output.Key];
								});

								return;
							}

							outputs[pass.ID] = node.Pass.call(self, context, inputs, pass.Properties, plan.Blocks[pass.ID], parameters || {}) || {};

							if (pass.Type === 'Present')
								picture = inputs.Color;
						});

						return picture;
					}
				};
			}
		});

		/*
		 * GLSL written in a block: its Code (lines of GLSL in its own scope: its Inputs there as variables of their names,
		 * its Outputs given by setting them; a uniform line declares one, Needs the parts of the shaders it calls), its
		 * pins named by Inputs and Outputs ("A: vec3, B: float"). An error of its code is told on the block (Errors).
		 */
		core.Node('GLSL', {
			Graphs: numeric,
			Group: 'code',
			Properties: [{Key: 'Code', Type: 'code', Value: 'Out = A;'}, {Key: 'Inputs', Type: 'text', Value: 'A: float'}, {Key: 'Outputs', Type: 'text', Value: 'Out: float'}, {Key: 'Needs', Type: 'text', Value: ''}],
			Inputs: function (properties) {
				return self.PinList(properties.Inputs).map(function (pin) {
					return {Key: pin.Key, Type: pin.Type, Value: 0};
				});
			},
			Outputs: function (properties) {
				return self.PinList(properties.Outputs);
			},
			GLSL: function (context) {
				var name = 'g' + context.Index;
				var outputs = self.PinList(context.Properties.Outputs);
				var lines = [];
				var made = {};

				String(context.Properties.Needs || '').split(/[\s,]+/).filter(Boolean).forEach(context.Need);

				outputs.forEach(function (output) {
					context.Lines.push(output.Type + ' ' + name + '_' + output.Key + ';');
				});

				String(context.Properties.Code || '').split('\n').forEach(function (line) {
					var uniform = /^\s*uniform\s+(\w+)\s+(\w+)\s*;\s*$/.exec(line);

					if (uniform) {
						context.Uniform(uniform[2], uniform[1]);

						lines.push('');
					}
					else {
						lines.push(line);
					}
				});

				context.Lines.push('{');

				self.PinList(context.Properties.Inputs).forEach(function (input) {
					context.Lines.push('\t' + input.Type + ' ' + input.Key + ' = ' + context.Inputs[input.Key] + ';');
				});

				outputs.forEach(function (output) {
					context.Lines.push('\t' + output.Type + ' ' + output.Key + ' = ' + self.Literal(0, output.Type) + ';');
				});

				context.Lines.push('#line 1 ' + context.Source());
				context.Lines.push.apply(context.Lines, lines);
				context.Lines.push('#line back');

				outputs.forEach(function (output) {
					context.Lines.push('\t' + name + '_' + output.Key + ' = ' + output.Key + ';');

					made[output.Key] = name + '_' + output.Key;
				});

				context.Lines.push('}');

				return made;
			}
		});

		/* The blocks of shaders only. */
		core.Node('UV', {Graphs: shaders, Group: 'input', Outputs: [{Key: 'UV', Type: 'vec2'}], GLSL: 'uv'});

		core.Node('Pixel', {Graphs: ['pass'], Group: 'input', Outputs: [{Key: 'Size', Type: 'vec2'}],
			GLSL: function (context) {
				return {Size: context.Uniform('uPixel', 'vec2')};
			}
		});

		core.Node('Position', {Graphs: ['material', 'vertex'], Group: 'input', Outputs: [{Key: 'Position', Type: 'vec3'}], GLSL: 'position'});

		core.Node('Normal', {Graphs: ['material', 'vertex'], Group: 'input', Outputs: [{Key: 'Normal', Type: 'vec3'}], GLSL: 'normal'});

		core.Node('Texture', {Graphs: ['pass', 'material'], Group: 'input', Properties: [{Key: 'Name', Type: 'text', Value: 'Color'}], Inputs: [{Key: 'UV', Type: 'vec2', Default: 'uv'}], Outputs: [{Key: 'RGBA', Type: 'vec4'}, {Key: 'RGB', Type: 'vec3'}, {Key: 'Alpha', Type: 'float'}],
			GLSL: function (context) {
				var name = 'b' + self.Name(context.Block.id) + '_sample';

				context.Lines.push('vec4 ' + name + ' = texture(' + context.Texture(context.Properties.Name || 'Color') + ', ' + context.Inputs.UV + ');');

				return {RGBA: name, RGB: name + '.rgb', Alpha: name + '.a'};
			}
		});

		core.Node('Output', {Graphs: ['pass'], Group: 'output', Inputs: [{Key: 'Color', Type: 'vec4', Value: [0, 0, 0, 1]}], Outputs: [],
			GLSL: function (context) {
				return {Result: context.Inputs.Color};
			}
		});

		core.Node('Surface', {Graphs: ['material'], Group: 'output', Inputs: [{Key: 'Color', Type: 'vec3', Default: 'color'}, {Key: 'Alpha', Type: 'float', Default: 'alpha'}, {Key: 'Rough', Type: 'float', Default: 'rough'}, {Key: 'Metal', Type: 'float', Default: 'metal'}, {Key: 'Emission', Type: 'vec3', Default: 'emission'}, {Key: 'Normal', Type: 'vec3', Default: 'bent'}], Outputs: [],
			GLSL: function (context) {
				var inputs = context.Inputs;

				return {Result: '\tcolor = ' + inputs.Color + ';\n\talpha = ' + inputs.Alpha + ';\n\trough = ' + inputs.Rough + ';\n\tmetal = ' + inputs.Metal + ';\n\temission = ' + inputs.Emission + ';\n\tbent = ' + inputs.Normal + ';'};
			}
		});

		/* Where a corner is in the world before the graph moves it. */
		core.Node('World', {Graphs: ['vertex'], Group: 'input', Outputs: [{Key: 'World', Type: 'vec3'}], GLSL: 'world'});

		/* Of the copy the corner is of: how far the wind bends it (Sway of a model), its own phase, its size; the gust of the scene. */
		core.Node('Sway', {Graphs: ['vertex'], Group: 'input', Outputs: [{Key: 'Sway', Type: 'float'}], GLSL: 'sway'});
		core.Node('Phase', {Graphs: ['vertex'], Group: 'input', Outputs: [{Key: 'Phase', Type: 'float'}], GLSL: 'phase'});
		core.Node('Size', {Graphs: ['vertex'], Group: 'input', Outputs: [{Key: 'Size', Type: 'float'}], GLSL: 'size'});
		core.Node('Wind', {Graphs: ['vertex'], Group: 'input', Outputs: [{Key: 'Gust', Type: 'float'}],
			GLSL: function (context) {
				return {Gust: context.Uniform('uWind', 'float')};
			}
		});

		/* The end of a vertex graph: where the corner goes in the world, and its normal there. */
		core.Node('Vertex', {Graphs: ['vertex'], Group: 'output', Inputs: [{Key: 'World', Type: 'vec3', Default: 'world'}, {Key: 'Normal', Type: 'vec3', Default: 'bent'}], Outputs: [],
			GLSL: function (context) {
				return {Result: '\tworld = ' + context.Inputs.World + ';\n\tbent = ' + context.Inputs.Normal + ';'};
			}
		});

		core.Node('Present', {Graphs: ['render'], Group: 'output', Inputs: [{Key: 'Color', Type: 'texture'}], Outputs: [],
			Pass: function () {
				return {};
			}
		});

		/* The blocks of numbers of Blueprints, in the graphs of shaders too, with their GLSL. */
		function shaded (type, glsl, more) {
			var node = core.NodeOf(type);
			var graphs = node.Graphs === '*' ? '*' : (node.Graphs || []).concat(numeric.filter(function (kind) {
				return (node.Graphs || []).indexOf(kind) === -1;
			}));

			core.Node(type, Object.assign({}, node, {Graphs: graphs, GLSL: glsl}, more || {}));
		}

		shaded('Number', function (context) {
			return {Value: self.Literal(context.Properties.Value, 'float')};
		}, {
			Graphs: core.NodeOf('Number').Graphs.concat(numeric, ['render']),
			Pass: function (context, inputs, properties) {
				return {Value: Number(properties.Value) || 0};
			}
		});

		shaded('Vector', function (context) {
			var size = Number(context.Properties.Size) || 3;

			return {Value: self.Literal([context.Properties.X, context.Properties.Y, context.Properties.Z, context.Properties.W].slice(0, size), 'vec' + size)};
		});

		shaded('Color', function (context) {
			var rgb = self.Literal(context.Properties.Color, 'vec3');

			return {RGB: rgb, RGBA: 'vec4(' + rgb + ', ' + self.Literal(context.Properties.Alpha == null ? 1 : context.Properties.Alpha, 'float') + ')'};
		});

		shaded('Bool', function (context) {
			return {Value: context.Properties.Value === true || context.Properties.Value === 'true' ? 'true' : 'false'};
		});

		/* A parameter of the graph is a uniform in a shader. */
		shaded('Parameter', function (context) {
			return {Value: 'uParameter_' + self.Name(context.Properties.Key)};
		});

		shaded('Time', function (context) {
			return {Seconds: context.Uniform('uTime', 'float')};
		});

		[['Add', '+'], ['Subtract', '-'], ['Multiply', '*'], ['Divide', '/']].forEach(function (one) {
			shaded(one[0], '{A} ' + one[1] + ' {B}');
		});

		['Min', 'Max', 'Pow', 'Step'].forEach(function (name) {
			shaded(name, name.toLowerCase() + '({A}, {B})');
		});

		[['Sin', 'sin({X})'], ['Cos', 'cos({X})'], ['Abs', 'abs({X})'], ['Floor', 'floor({X})'], ['Fract', 'fract({X})'], ['Sqrt', 'sqrt({X})'], ['Exp', 'exp({X})'], ['OneMinus', '1.0 - ({X})'], ['Saturate', 'clamp({X}, 0.0, 1.0)']].forEach(function (one) {
			shaded(one[0], one[1]);
		});

		shaded('Mix', 'mix({A}, {B}, {T})');
		shaded('Clamp', 'clamp({X}, {Low}, {High})');
		shaded('Smoothstep', 'smoothstep({Low}, {High}, {X})');
		shaded('Remap', '{ToLow} + ({X} - {FromLow}) / ({FromHigh} - {FromLow}) * ({ToHigh} - {ToLow})');
		shaded('Dot', 'dot({A}, {B})');
		shaded('Length', 'length({X})');
		shaded('Normalize', 'normalize({X})');

		shaded('Split', function (context) {
			var v = '(' + context.Inputs.Vector + ')';

			return {X: v + '.x', Y: v + '.y', Z: v + '.z', W: v + '.w'};
		});

		shaded('Combine', function (context) {
			var inputs = context.Inputs;

			return {XYZW: 'vec4(' + inputs.X + ', ' + inputs.Y + ', ' + inputs.Z + ', ' + inputs.W + ')', XYZ: 'vec3(' + inputs.X + ', ' + inputs.Y + ', ' + inputs.Z + ')', XY: 'vec2(' + inputs.X + ', ' + inputs.Y + ')'};
		});

		/* The noise of Math is the noise of the shaders of Renderer: the same numbers. */
		shaded('Noise', 'noise3({Position} * {Scale})', {Needs: ['Noise']});

		shaded('Fbm', function (context) {
			return {Value: 'fbm3(' + context.Inputs.Position + ' * ' + context.Inputs.Scale + ', ' + Math.max(1, Math.round(Number(context.Properties.Octaves) || 4)) + ')'};
		}, {Needs: ['Noise']});

		/* A noise of the Noise Service by its spec: its lines in the body of the shader, its functions a part of the shaders (Noises). */
		if (!self.$Service('Renderer').Chunks.Noises)
			self.$Service('Renderer').Chunks.Noises = self.$Service('Noise').GLSLChunk();

		shaded('NoiseSpec', function (context) {
			var made = self.$Service('Noise').GLSLLines(core.NoiseOf(context.Properties), 'n' + context.Index, context.Inputs.Position + ' * ' + context.Inputs.Scale);

			context.Lines.push.apply(context.Lines, made.Lines);

			return {Value: made.Value};
		}, {Needs: ['Noises']});
	}
});
