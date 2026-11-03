/*
 * The files of models, read and written in one form: the asset of Gltf ({Nodes, Meshes, Materials, Images, Skins,
 * Animations, Scene, Lights}). glb and gltf (Gltf), fbx binary or text (Fbx: meshes, materials, pictures inside or
 * beside, skins, clips), obj with its mtl.
 * - Formats(): the formats it reads and writes. Detect(data, name): the format of bytes or a text (or of the name of its
 *   file): glb, gltf, fbx, obj, or ''.
 * - Read(data, options): the asset of a file (an ArrayBuffer, a Uint8Array or a text); options Format (else detected),
 *   Name, Buffers (the files a .gltf names), Materials (the text of the mtl of an obj). An error tells what is wrong.
 * - Parse(data, callback, options): the same, called back (error, asset).
 * - Load(url, callback): fetches a file of any of them, what it names beside it (the buffers of a .gltf, the mtl of an
 *   obj) and its pictures where there is a page: (error, asset). Models loads its files so.
 * - Write(asset, format, options): glb and fbx an ArrayBuffer (fbx {Text: true}: text), gltf the text of its JSON, obj its
 *   text (positions in the space of the scene, a group for each mesh) and mtl the text of its materials.
 * - FromModel(model): a model of Models as an asset: of a file, its asset; of code, a node for each piece (at its pivot),
 *   its colors in its vertices, its clips sampled 30 times a second: what Write exports.
 * The same functions run in Node: they read no page, but for Load.
 */
Elemenx.Service('ModelFormats', {
	$Meta: {
		Description: 'The files of models read and written in one form: glb, gltf, fbx (binary and text) and obj.',
		Methods: ['Formats()', 'Detect(data, name)', 'Read(data, options)', 'Parse(data, callback, options)', 'Load(url, callback)', 'Write(asset, format, options)', 'FromModel(model)']
	},

	Formats: function () {
		return ['glb', 'gltf', 'fbx', 'obj'];
	},

	Detect: function (data, name) {
		var bytes = typeof data === 'string' || !data ? null : data instanceof ArrayBuffer ? new Uint8Array(data) : data;
		var head = typeof data === 'string' ? data.slice(0, 400) : bytes ? new TextDecoder().decode(bytes.subarray(0, 400)) : '';
		var extension = String(name || '').split('?')[0].split('.').pop().toLowerCase();

		if (bytes && bytes.length >= 4 && bytes[0] === 0x67 && bytes[1] === 0x6c && bytes[2] === 0x54 && bytes[3] === 0x46) return 'glb';
		if (head.indexOf('Kaydara FBX Binary') === 0 || /^\s*;\s*FBX/.test(head) || /FBXHeaderExtension/.test(head)) return 'fbx';
		if (/^\s*\{/.test(head) && /"asset"/.test(typeof data === 'string' ? data : head + new TextDecoder().decode(bytes))) return 'gltf';
		if (/^\s*(#.*\n\s*)*(v|vn|vt|o|g|mtllib|usemtl|f)\s/m.test(head)) return 'obj';

		return ['glb', 'gltf', 'fbx', 'obj'].indexOf(extension) === -1 ? '' : extension;
	},

	Read: function (data, options) {
		var settings = options || {};
		var format = settings.Format || this.Detect(data, settings.Name);
		var text;

		if (format === 'glb' || format === 'gltf')
			return this.$Service('Gltf').Read(typeof data === 'string' ? new TextEncoder().encode(data) : data, settings);

		if (format === 'fbx')
			return this.$Service('Fbx').Read(data);

		if (format === 'obj') {
			text = typeof data === 'string' ? data : new TextDecoder().decode(data);

			return this.ReadObj(text, settings.Materials || '');
		}

		throw new Error('Elemenx ModelFormats: not a file of a model it reads' + (settings.Name ? ': ' + settings.Name : ''));
	},

	Parse: function (data, callback, options) {
		var asset;

		try {
			asset = this.Read(data, options);
		}
		catch (error) {
			callback(error, null);

			return;
		}

		callback(null, asset);
	},

	Load: function (url, callback) {
		var self = this;
		var gltf = this.$Service('Gltf');

		gltf.Fetch(url, function (error, data) {
			var format;

			if (error) {
				callback(error, null);

				return;
			}

			format = self.Detect(data, url);

			if (format === 'glb' || format === 'gltf') {
				gltf.Files(url, data, function (problem, buffers) {
					self.Done(problem, function () {
						return gltf.Read(data, {Buffers: buffers});
					}, url, callback);
				});

				return;
			}

			if (format !== 'obj') {
				self.Done(null, function () {
					return self.Read(data, {Format: format, Name: url});
				}, url, callback);

				return;
			}

			/* An obj names its materials in a file beside it. */
			var named = /^\s*mtllib\s+(.+?)\s*$/m.exec(new TextDecoder().decode(data));

			if (!named) {
				self.Done(null, function () {
					return self.Read(data, {Format: 'obj'});
				}, url, callback);

				return;
			}

			gltf.Fetch(gltf.Beside(url, named[1]), function (missing, materials) {
				self.Done(null, function () {
					return self.Read(data, {Format: 'obj', Materials: missing ? '' : new TextDecoder().decode(materials)});
				}, url, callback);
			});
		});
	},

	/* What Load ends with: the asset made, its pictures fetched, or the error. */
	Done: function (error, make, url, callback) {
		var asset;

		if (error) {
			callback(error, null);

			return;
		}

		try {
			asset = make();
		}
		catch (failure) {
			callback(failure, null);

			return;
		}

		this.$Service('Gltf').Pictures(asset, url, function () {
			callback(null, asset);
		});
	},

	Write: function (asset, format, options) {
		if (format === 'glb')
			return this.$Service('Gltf').Write(asset);

		if (format === 'gltf')
			return this.$Service('Gltf').Write(asset, {Text: true});

		if (format === 'fbx')
			return this.$Service('Fbx').Write(asset, options);

		if (format === 'obj')
			return this.WriteObj(asset, options);

		if (format === 'mtl')
			return this.WriteMtl(asset);

		throw new Error('Elemenx ModelFormats: no writer of ' + format);
	},

	/* The matrix of each node in the space of the scene. */
	Globals: function (asset) {
		var graphics = this.$Service('Graphics3D');
		var models = this.$Service('Models');
		var made = [];

		function global (index) {
			var node = asset.Nodes[index];
			var local;

			if (made[index])
				return made[index];

			local = models.NodeMatrix(node.Translation || [0, 0, 0], node.Rotation || [0, 0, 0, 1], node.Scale || [1, 1, 1]);
			made[index] = node.Parent === -1 || node.Parent === undefined ? local : graphics.Multiply(global(node.Parent), local);

			return made[index];
		}

		return asset.Nodes.map(function (node, index) {
			return global(index);
		});
	},

	/* An obj: its points where they stand in the scene, a group for each mesh of a node, its materials by name. */
	WriteObj: function (asset, options) {
		var graphics = this.$Service('Graphics3D');
		var settings = options || {};
		var globals = this.Globals(asset);
		var lines = ['# Made by Elemenx', 'mtllib ' + (settings.Materials || 'model.mtl')];
		var count = 0;

		asset.Nodes.forEach(function (node, index) {
			var parts = node.Mesh === -1 || node.Mesh === undefined ? null : asset.Meshes[node.Mesh];
			var turn = graphics.NormalMatrix(globals[index]);

			if (!parts) return;

			lines.push('o ' + (node.Name || 'node' + index).replace(/\s+/g, '_'));

			parts.forEach(function (part) {
				var shape = part.Geometry;
				var points = shape.Positions.length / 3;
				var material = asset.Materials[part.Material];
				var indices = shape.Indices && shape.Indices.length ? shape.Indices : null;
				var i;

				lines.push('usemtl ' + ((material && material.Name) || 'material' + part.Material).replace(/\s+/g, '_'));

				for (i = 0; i < points; i++) {
					var at = graphics.Apply(globals[index], [shape.Positions[i * 3], shape.Positions[i * 3 + 1], shape.Positions[i * 3 + 2]]);
					var normal = shape.Normals && shape.Normals.length ? [shape.Normals[i * 3], shape.Normals[i * 3 + 1], shape.Normals[i * 3 + 2]] : [0, 1, 0];
					var way = graphics.Vectors.Normalize([turn[0] * normal[0] + turn[3] * normal[1] + turn[6] * normal[2], turn[1] * normal[0] + turn[4] * normal[1] + turn[7] * normal[2], turn[2] * normal[0] + turn[5] * normal[1] + turn[8] * normal[2]]);

					lines.push('v ' + at[0] + ' ' + at[1] + ' ' + at[2]);
					lines.push('vt ' + (shape.UVs && shape.UVs.length ? shape.UVs[i * 2] + ' ' + (1 - shape.UVs[i * 2 + 1]) : '0 0'));
					lines.push('vn ' + way[0] + ' ' + way[1] + ' ' + way[2]);
				}

				for (i = 0; i + 2 < (indices ? indices.length : points); i += 3) {
					lines.push('f ' + [0, 1, 2].map(function (k) {
						var corner = count + (indices ? indices[i + k] : i + k) + 1;

						return corner + '/' + corner + '/' + corner;
					}).join(' '));
				}

				count += points;
			});
		});

		return lines.join('\n') + '\n';
	},

	/* The materials of an asset as an mtl: color, light, shine, how clear, and the names of their pictures. */
	WriteMtl: function (asset) {
		var lines = ['# Made by Elemenx'];

		(asset.Materials || []).forEach(function (material, index) {
			var color = material.BaseColor || [1, 1, 1, 1];
			var rough = Math.max(0.05, material.Roughness === undefined ? 1 : material.Roughness);
			var image = material.ColorMap ? (asset.Images || [])[material.ColorMap.Image] : null;

			lines.push('newmtl ' + (material.Name || 'material' + index).replace(/\s+/g, '_'));
			lines.push('Kd ' + color[0] + ' ' + color[1] + ' ' + color[2]);
			lines.push('Ke ' + (material.Emissive || [0, 0, 0]).slice(0, 3).join(' '));
			lines.push('Ns ' + (2 / (rough * rough) - 2));
			lines.push('d ' + (color[3] === undefined ? 1 : color[3]));

			if (image && image.URI)
				lines.push('map_Kd ' + image.URI);
		});

		return lines.join('\n') + '\n';
	},

	/* An obj with its mtl: a mesh for each object (o) or group (g), a part for each material, polygons in fans. */
	ReadObj: function (text, materialsText) {
		var gltf = this.$Service('Gltf');
		var graphics = this.$Service('Graphics3D');
		var positions = [];
		var uvs = [];
		var normals = [];
		var asset = {Nodes: [], Meshes: [], Materials: [], Images: [], Textures: [], Skins: [], Animations: [], Scene: [], Lights: []};
		var materials = {};
		var images = {};
		var current = null;
		var part = null;
		var chosen = '';

		/* The materials of the mtl, by name. */
		function picture (name) {
			var file = name.replace(/\\/g, '/');

			if (images[file] === undefined) {
				images[file] = asset.Images.length;

				asset.Images.push({Data: null, Type: /\.jpe?g$/i.test(file) ? 'image/jpeg' : 'image/png', URI: file, Picture: null, Mean: null});
			}

			return {Image: images[file], Sampler: null, Set: 0, Offset: [0, 0], Repeat: [1, 1], Scale: 1, Strength: 1};
		}

		var made = null;

		String(materialsText || '').split(/\r?\n/).forEach(function (line) {
			var words = line.trim().split(/\s+/);
			var key = words[0];
			var rest = line.trim().slice(key.length).trim();

			if (key === 'newmtl') {
				made = gltf.Material({}, {});
				made.Name = rest;
				made.Metallic = 0;
				made.Roughness = 0.8;
				materials[rest] = asset.Materials.length;

				asset.Materials.push(made);
			}

			if (!made) return;

			if (key === 'Kd')
				made.BaseColor = [Number(words[1]), Number(words[2]), Number(words[3]), made.BaseColor[3]];

			if (key === 'Ke')
				made.Emissive = [Number(words[1]), Number(words[2]), Number(words[3])];

			if (key === 'Ns')
				made.Roughness = Math.max(0.05, Math.min(1, Math.sqrt(2 / (Number(words[1]) + 2))));

			if (key === 'd')
				made.BaseColor[3] = Number(words[1]);

			if (key === 'Tr')
				made.BaseColor[3] = 1 - Number(words[1]);

			if (key === 'map_Kd')
				made.ColorMap = picture(words[words.length - 1]);

			if (key === 'map_Ke')
				made.EmissiveMap = picture(words[words.length - 1]);

			if (key === 'map_Bump' || key === 'bump' || key === 'norm')
				made.NormalMap = picture(words[words.length - 1]);

			if (made.BaseColor[3] < 0.999)
				made.Alpha = 'BLEND';
		});

		function material (name) {
			if (materials[name] === undefined) {
				materials[name] = asset.Materials.length;

				asset.Materials.push(Object.assign(gltf.Material({}, {}), {Name: name, Metallic: 0, Roughness: 0.8}));
			}

			return materials[name];
		}

		function mesh (name) {
			current = {Name: name, Parts: {}, Order: []};

			asset.Nodes.push({Name: name, Parent: -1, Children: [], Translation: [0, 0, 0], Rotation: [0, 0, 0, 1], Scale: [1, 1, 1], Mesh: -1, Skin: -1, Light: -1, Own: current});

			part = null;
		}

		function partOf () {
			var key = chosen;

			if (!current)
				mesh('object');

			if (!current.Parts[key]) {
				current.Parts[key] = {Material: material(key || 'default'), Keys: {}, Geometry: {Positions: [], Normals: [], UVs: [], Indices: []}};

				current.Order.push(key);
			}

			part = current.Parts[key];

			return part;
		}

		/* A corner v/vt/vn as a vertex of its part, once for the same three. */
		function corner (word) {
			var own = part;
			var refs = word.split('/');
			var v = Number(refs[0]);
			var t = refs[1] ? Number(refs[1]) : 0;
			var n = refs[2] ? Number(refs[2]) : 0;
			var key;

			v = v < 0 ? positions.length / 3 + v : v - 1;
			t = t < 0 ? uvs.length / 2 + t : t - 1;
			n = n < 0 ? normals.length / 3 + n : n - 1;
			key = v + '/' + t + '/' + n;

			if (own.Keys[key] === undefined) {
				own.Keys[key] = own.Geometry.Positions.length / 3;

				own.Geometry.Positions.push(positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]);
				own.Geometry.UVs.push(t >= 0 ? uvs[t * 2] : 0, t >= 0 ? 1 - uvs[t * 2 + 1] : 0);

				if (n >= 0)
					own.Geometry.Normals.push(normals[n * 3], normals[n * 3 + 1], normals[n * 3 + 2]);
			}

			return own.Keys[key];
		}

		text.split(/\r?\n/).forEach(function (line) {
			var words = line.trim().split(/\s+/);
			var key = words[0];
			var corners;
			var i;

			if (key === 'v') positions.push(Number(words[1]), Number(words[2]), Number(words[3]));
			else if (key === 'vt') uvs.push(Number(words[1]), Number(words[2] || 0));
			else if (key === 'vn') normals.push(Number(words[1]), Number(words[2]), Number(words[3]));
			else if (key === 'o' || key === 'g') mesh(words.slice(1).join(' ') || 'object');
			else if (key === 'usemtl') chosen = words.slice(1).join(' ');

			if (key !== 'f' || words.length < 4) return;

			partOf();

			corners = words.slice(1).map(corner);

			for (i = 1; i + 1 < corners.length; i++)
				part.Geometry.Indices.push(corners[0], corners[i], corners[i + 1]);
		});

		asset.Nodes = asset.Nodes.filter(function (node) {
			return node.Own.Order.length;
		});

		asset.Nodes.forEach(function (node, index) {
			var own = node.Own;

			delete node.Own;

			node.Mesh = asset.Meshes.length;

			asset.Scene.push(index);
			asset.Meshes.push(own.Order.map(function (key) {
				var geometry = own.Parts[key].Geometry;
				if (geometry.Normals.length !== geometry.Positions.length)
					geometry = graphics.Normals({Positions: geometry.Positions, UVs: geometry.UVs, Indices: geometry.Indices});

				return {Geometry: geometry, Material: own.Parts[key].Material};
			}));
		});

		if (!asset.Materials.length)
			asset.Materials.push(gltf.Material({}, {}));

		return asset;
	},

	FromModel: function (model) {
		var graphics = this.$Service('Graphics3D');
		var gltf = this.$Service('Gltf');
		var models = this.$Service('Models');
		var asset = {Nodes: [], Meshes: [], Materials: [Object.assign(gltf.Material({}, {}), {Name: model.Name || 'model', Metallic: 0, Roughness: model.Matte === false ? 0.4 : 0.85})], Images: [], Textures: [], Skins: [], Animations: [], Scene: [], Lights: []};
		var byID = {};

		if (model.Asset)
			return model.Asset;

		model.Pieces.forEach(function (piece, index) {
			byID[piece.ID] = index;
		});

		/* A node at the pivot of each piece, its geometry round it. */
		model.Pieces.forEach(function (piece, index) {
			var parent = piece.Parent && byID[piece.Parent] !== undefined ? byID[piece.Parent] : -1;
			var pivot = piece.Pivot || [0, 0, 0];
			var from = parent === -1 ? [0, 0, 0] : model.Pieces[parent].Pivot || [0, 0, 0];
			var geometry = graphics.Transform(piece.Geometry, graphics.Translation(-pivot[0], -pivot[1], -pivot[2]));

			asset.Nodes.push({Name: piece.ID, Parent: parent, Children: [], Translation: [pivot[0] - from[0], pivot[1] - from[1], pivot[2] - from[2]], Rotation: [0, 0, 0, 1], Scale: [1, 1, 1], Mesh: index, Skin: -1, Light: -1});
			asset.Meshes.push([{Geometry: geometry, Material: 0}]);
		});

		asset.Nodes.forEach(function (node, index) {
			if (node.Parent === -1) asset.Scene.push(index);
			else asset.Nodes[node.Parent].Children.push(index);
		});

		/* Each clip, 30 times a second: the pose of each piece made the turn and move of its node. */
		Object.keys(model.Clips || {}).forEach(function (name) {
			var length = models.Length(model, name);
			var steps = Math.max(2, Math.ceil(length * 30) + 1);
			var times = [];
			var channels = model.Pieces.map(function () {
				return {Translation: [], Rotation: []};
			});
			var step;

			for (step = 0; step < steps; step++) {
				var time = length * step / (steps - 1);
				var pose = models.Pose(model, name, time);

				times.push(time);

				model.Pieces.forEach(function (piece, index) {
					var parent = asset.Nodes[index].Parent;
					var world = graphics.Multiply(pose[piece.ID] || graphics.Identity(), graphics.Translation.apply(graphics, piece.Pivot || [0, 0, 0]));
					var above = parent === -1 ? graphics.Identity() : graphics.Multiply(pose[model.Pieces[parent].ID] || graphics.Identity(), graphics.Translation.apply(graphics, model.Pieces[parent].Pivot || [0, 0, 0]));
					var node = gltf.Node({matrix: graphics.Multiply(graphics.Invert(above), world)});
					var last = channels[index].Rotation.slice(-4);

					if (last.length && last[0] * node.Rotation[0] + last[1] * node.Rotation[1] + last[2] * node.Rotation[2] + last[3] * node.Rotation[3] < 0) {
						node.Rotation = node.Rotation.map(function (value) {
							return -value;
						});
					}

					Array.prototype.push.apply(channels[index].Translation, node.Translation);
					Array.prototype.push.apply(channels[index].Rotation, node.Rotation);
				});
			}

			asset.Animations.push({Name: name, Length: length, Channels: [].concat.apply([], channels.map(function (channel, index) {
				return [
					{Node: index, Path: 'translation', Times: new Float32Array(times), Values: new Float32Array(channel.Translation), Size: 3, Step: false, Cubic: false},
					{Node: index, Path: 'rotation', Times: new Float32Array(times), Values: new Float32Array(channel.Rotation), Size: 4, Step: false, Cubic: false}
				];
			}))});
		});

		return asset;
	}
});
