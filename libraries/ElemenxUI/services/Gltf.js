/*
 * glTF 2.0, the models other programs make (Blender and the rest export it; FBX and OBJ go through them).
 * - Parse(data, callback, options): data an ArrayBuffer, a Uint8Array or the JSON of a .gltf (its text or the object);
 *   calls back (error, asset). options Buffers: {uri: ArrayBuffer} for the files a .gltf names.
 * - Load(url, callback): fetches a .glb or a .gltf with the files it names, and its pictures where there is a page.
 * - The asset: {Nodes: [{Name, Parent, Children, Translation, Rotation, Scale, Mesh, Skin}], Meshes: [[{Geometry, Material}]],
 *   Materials: [{Name, BaseColor, Metallic, Roughness, Emissive, ColorMap, NormalMap, MetalMap, OcclusionMap, EmissiveMap,
 *   Alpha, Cutoff, DoubleSided, Unlit}], Images: [{Data, Type, URI, Picture}], Skins: [{Joints, Inverse}], Animations:
 *   [{Name, Length, Channels: [{Node, Path, Times, Values, Step}]}], Scene (the indices of its roots)}. A Geometry has
 *   Positions, Normals, UVs, Indices, and Joints and Weights when it is skinned.
 * - The extensions read: KHR_mesh_quantization, KHR_texture_transform, KHR_materials_unlit, KHR_materials_specular, EXT_meshopt_compression
 *   (Meshopt(mode, source, count, stride, filter) decodes one buffer); a file that requires another is refused:
 *   'Elemenx Gltf: extension <name> is not supported'.
 * The same functions run in Node: they read no page, but for the pictures of Load.
 */
Elemenx.Service('Gltf', {
	$Meta: {
		Description: 'glTF 2.0 and GLB: meshes, materials, skins and animations of the models other programs make.',
		Methods: ['Parse(data, callback, options)', 'Load(url, callback)', 'Meshopt(mode, source, count, stride, filter)']
	},

	Supported: ['KHR_mesh_quantization', 'KHR_texture_transform', 'KHR_materials_unlit', 'KHR_materials_specular', 'EXT_meshopt_compression'],

	Parse: function (data, callback, options) {
		var asset;

		try {
			asset = this.Read(data, options || {});
		}
		catch (error) {
			callback(error, null);

			return;
		}

		callback(null, asset);
	},

	Load: function (url, callback) {
		var self = this;

		this.Fetch(url, function (error, data) {
			if (error) {
				callback(error, null);

				return;
			}

			self.Files(url, data, function (problem, buffers) {
				var asset;

				if (problem) {
					callback(problem, null);

					return;
				}

				try {
					asset = self.Read(data, {Buffers: buffers});
				}
				catch (failure) {
					callback(failure, null);

					return;
				}

				self.Pictures(asset, url, function () {
					callback(null, asset);
				});
			});
		});
	},

	Fetch: function (url, callback) {
		var request = new XMLHttpRequest();

		request.open('GET', url);

		request.responseType = 'arraybuffer';

		request.onload = function () {
			if (request.status >= 200 && request.status < 300 || request.status === 0) callback(null, request.response);
			else callback(new Error('Elemenx Gltf: ' + url + ' answered ' + request.status), null);
		};

		request.onerror = function () {
			callback(new Error('Elemenx Gltf: ' + url + ' could not be fetched'), null);
		};

		request.send();
	},

	/* The binary files a .gltf names, next to it. */
	Files: function (url, data, callback) {
		var self = this;
		var bytes = new Uint8Array(data);
		var buffers = {};
		var json;
		var names;
		var left;

		if (this.IsBinary(bytes)) {
			callback(null, buffers);

			return;
		}

		try {
			json = JSON.parse(new TextDecoder().decode(bytes));
		}
		catch (error) {
			callback(new Error('Elemenx Gltf: ' + url + ' is no glTF'), null);

			return;
		}

		names = (json.buffers || []).map(function (buffer) {
			return buffer.uri;
		}).filter(function (uri) {
			return uri && !/^data:/.test(uri);
		});

		left = names.length;

		if (!left)
			callback(null, buffers);

		names.forEach(function (name) {
			self.Fetch(self.Beside(url, name), function (error, file) {
				if (error && left > 0) {
					left = -1;

					callback(error, null);

					return;
				}

				buffers[name] = file;
				left--;

				if (left === 0)
					callback(null, buffers);
			});
		});
	},

	Beside: function (url, name) {
		return /^[a-z]+:|^\//i.test(name) ? name : url.replace(/[^/]*$/, '') + name;
	},

	/* The pictures as elements of the page, each with its mean color; nothing where there is no page. */
	Pictures: function (asset, url, done) {
		var self = this;
		var left = asset.Images.length;

		function finished () {
			left--;

			if (left === 0)
				done();
		}

		if (!left || typeof Image === 'undefined') {
			done();

			return;
		}

		asset.Images.forEach(function (image) {
			var picture = new Image();
			var address = image.Data ? URL.createObjectURL(new Blob([image.Data], {type: image.Type || 'image/png'})) : self.Beside(url, image.URI);

			picture.crossOrigin = 'anonymous';

			picture.onload = function () {
				image.Picture = picture;
				image.Mean = self.Mean(picture);

				if (image.Data)
					URL.revokeObjectURL(address);

				finished();
			};

			picture.onerror = function () {
				finished();
			};

			picture.src = address;
		});
	},

	Mean: function (picture) {
		var canvas = document.createElement('canvas');
		var context = canvas.getContext('2d');
		var data;

		canvas.width = 1;
		canvas.height = 1;

		context.drawImage(picture, 0, 0, 1, 1);

		data = context.getImageData(0, 0, 1, 1).data;

		return [Math.pow(data[0] / 255, 2.2), Math.pow(data[1] / 255, 2.2), Math.pow(data[2] / 255, 2.2)];
	},

	IsBinary: function (bytes) {
		return bytes.length >= 12 && bytes[0] === 0x67 && bytes[1] === 0x6c && bytes[2] === 0x54 && bytes[3] === 0x46;
	},

	/* The JSON and the binary chunk of a GLB, or the JSON of a .gltf. */
	Chunks: function (data) {
		var bytes = data instanceof Uint8Array ? data : data instanceof ArrayBuffer ? new Uint8Array(data) : null;
		var view;
		var at = 12;
		var result = {Json: null, Binary: null};

		if (!bytes)
			return {Json: typeof data === 'string' ? JSON.parse(data) : data, Binary: null};

		if (!this.IsBinary(bytes))
			return {Json: JSON.parse(new TextDecoder().decode(bytes)), Binary: null};

		view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

		if (view.getUint32(4, true) !== 2)
			throw new Error('Elemenx Gltf: only version 2 of GLB is read');

		while (at + 8 <= bytes.length) {
			var length = view.getUint32(at, true);
			var type = view.getUint32(at + 4, true);
			var chunk = bytes.subarray(at + 8, at + 8 + length);

			if (type === 0x4e4f534a) result.Json = JSON.parse(new TextDecoder().decode(chunk));
			else if (type === 0x004e4942) result.Binary = chunk;

			at += 8 + length + (4 - length % 4) % 4;
		}

		if (!result.Json)
			throw new Error('Elemenx Gltf: a GLB with no JSON');

		return result;
	},

	Base64: function (text) {
		var binary = atob(text);
		var bytes = new Uint8Array(binary.length);
		var i;

		for (i = 0; i < binary.length; i++)
			bytes[i] = binary.charCodeAt(i);

		return bytes;
	},

	Read: function (data, options) {
		var self = this;
		var chunks = this.Chunks(data);
		var json = chunks.Json;
		var buffers;
		var views;
		var asset;
		if (!json.asset || String(json.asset.version).charAt(0) !== '2')
			throw new Error('Elemenx Gltf: only glTF 2 is read');

		(json.extensionsRequired || []).forEach(function (name) {
			if (self.Supported.indexOf(name) === -1)
				throw new Error('Elemenx Gltf: extension ' + name + ' is not supported');
		});

		buffers = (json.buffers || []).map(function (buffer, index) {
			var file;

			if (buffer.uri && /^data:/.test(buffer.uri))
				return self.Base64(buffer.uri.slice(buffer.uri.indexOf(',') + 1));

			if (buffer.uri) {
				file = (options.Buffers || {})[buffer.uri];

				return file ? new Uint8Array(file) : null;
			}

			return index === 0 ? chunks.Binary : null;
		});

		views = (json.bufferViews || []).map(function (view) {
			return self.View(view, buffers);
		});

		asset = {Nodes: [], Meshes: [], Materials: [], Images: [], Textures: [], Skins: [], Animations: [], Scene: []};

		asset.Images = (json.images || []).map(function (image) {
			if (image.bufferView !== undefined)
				return {Data: views[image.bufferView].slice(), Type: image.mimeType, URI: '', Picture: null, Mean: null};

			if (image.uri && /^data:/.test(image.uri))
				return {Data: self.Base64(image.uri.slice(image.uri.indexOf(',') + 1)), Type: image.uri.slice(5, image.uri.indexOf(';')), URI: '', Picture: null, Mean: null};

			return {Data: null, Type: image.mimeType, URI: image.uri, Picture: null, Mean: null};
		});

		asset.Materials = (json.materials || []).map(function (material) {
			return self.Material(material, json);
		});

		if (!asset.Materials.length)
			asset.Materials.push(this.Material({}, json));

		asset.Meshes = (json.meshes || []).map(function (mesh) {
			return mesh.primitives.filter(function (primitive) {
				return primitive.mode === undefined || primitive.mode === 4;
			}).map(function (primitive) {
				return {Geometry: self.Primitive(primitive, json, views), Material: primitive.material === undefined ? 0 : primitive.material};
			});
		});

		asset.Nodes = (json.nodes || []).map(function (node) {
			return self.Node(node);
		});

		asset.Nodes.forEach(function (node, index) {
			node.Children.forEach(function (child) {
				asset.Nodes[child].Parent = index;
			});
		});

		asset.Skins = (json.skins || []).map(function (skin) {
			return {Joints: skin.joints, Inverse: skin.inverseBindMatrices === undefined ? null : self.Accessor(json, views, skin.inverseBindMatrices).Values};
		});

		asset.Animations = (json.animations || []).map(function (animation, index) {
			return self.Animation(animation, index, json, views);
		});

		asset.Scene = json.scenes && json.scenes.length ? json.scenes[json.scene || 0].nodes || [] : asset.Nodes.map(function (node, index) {
			return node.Parent === -1 ? index : -1;
		}).filter(function (index) {
			return index !== -1;
		});

		return asset;
	},

	View: function (view, buffers) {
		var compressed = view.extensions && view.extensions.EXT_meshopt_compression;
		var buffer;

		if (compressed) {
			buffer = buffers[compressed.buffer];

			if (!buffer)
				throw new Error('Elemenx Gltf: a compressed buffer is missing');

			return this.Meshopt(compressed.mode, buffer.subarray(compressed.byteOffset || 0, (compressed.byteOffset || 0) + compressed.byteLength), compressed.count, compressed.byteStride, compressed.filter || 'NONE');
		}

		buffer = buffers[view.buffer];

		if (!buffer)
			throw new Error('Elemenx Gltf: a buffer is missing');

		return buffer.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
	},

	Material: function (material, json) {
		var pbr = material.pbrMetallicRoughness || {};
		var specular = material.extensions && material.extensions.KHR_materials_specular || {};

		function texture (info) {
			var transform;

			if (!info || !json.textures || !json.textures[info.index]) return null;

			transform = info.extensions && info.extensions.KHR_texture_transform;

			return {Image: json.textures[info.index].source, Sampler: json.samplers ? json.samplers[json.textures[info.index].sampler] || null : null, Set: info.texCoord || 0, Offset: transform && transform.offset || [0, 0], Repeat: transform && transform.scale || [1, 1], Scale: info.scale === undefined ? 1 : info.scale, Strength: info.strength === undefined ? 1 : info.strength};
		}

		return {
			Name: material.name || '',
			BaseColor: pbr.baseColorFactor || [1, 1, 1, 1],
			Metallic: pbr.metallicFactor === undefined ? 1 : pbr.metallicFactor,
			Roughness: pbr.roughnessFactor === undefined ? 1 : pbr.roughnessFactor,
			Emissive: material.emissiveFactor || [0, 0, 0],
			ColorMap: texture(pbr.baseColorTexture),
			MetalMap: texture(pbr.metallicRoughnessTexture),
			NormalMap: texture(material.normalTexture),
			OcclusionMap: texture(material.occlusionTexture),
			EmissiveMap: texture(material.emissiveTexture),
			Alpha: material.alphaMode || 'OPAQUE',
			Cutoff: material.alphaCutoff === undefined ? 0.5 : material.alphaCutoff,
			DoubleSided: !!material.doubleSided,
			Unlit: !!(material.extensions && material.extensions.KHR_materials_unlit),
			Specular: specular.specularFactor === undefined ? 1 : specular.specularFactor,
			SpecularColor: specular.specularColorFactor || [1, 1, 1],
			SpecularMap: texture(specular.specularTexture)
		};
	},

	Node: function (node) {
		var matrix = node.matrix;
		var scale;
		var rotation;

		if (matrix) {
			scale = [Math.sqrt(matrix[0] * matrix[0] + matrix[1] * matrix[1] + matrix[2] * matrix[2]), Math.sqrt(matrix[4] * matrix[4] + matrix[5] * matrix[5] + matrix[6] * matrix[6]), Math.sqrt(matrix[8] * matrix[8] + matrix[9] * matrix[9] + matrix[10] * matrix[10])];
			rotation = this.Quaternion([matrix[0] / scale[0], matrix[1] / scale[0], matrix[2] / scale[0], matrix[4] / scale[1], matrix[5] / scale[1], matrix[6] / scale[1], matrix[8] / scale[2], matrix[9] / scale[2], matrix[10] / scale[2]]);
		}

		return {
			Name: node.name || '',
			Parent: -1,
			Children: node.children || [],
			Translation: matrix ? [matrix[12], matrix[13], matrix[14]] : node.translation || [0, 0, 0],
			Rotation: rotation || node.rotation || [0, 0, 0, 1],
			Scale: scale || node.scale || [1, 1, 1],
			Mesh: node.mesh === undefined ? -1 : node.mesh,
			Skin: node.skin === undefined ? -1 : node.skin
		};
	},

	/* A rotation matrix of 3 by 3, column by column, as a quaternion [x, y, z, w]. */
	Quaternion: function (m) {
		var trace = m[0] + m[4] + m[8];
		var s;

		if (trace > 0) {
			s = Math.sqrt(trace + 1) * 2;

			return [(m[5] - m[7]) / s, (m[6] - m[2]) / s, (m[1] - m[3]) / s, s / 4];
		}

		if (m[0] > m[4] && m[0] > m[8]) {
			s = Math.sqrt(1 + m[0] - m[4] - m[8]) * 2;

			return [s / 4, (m[3] + m[1]) / s, (m[6] + m[2]) / s, (m[5] - m[7]) / s];
		}

		if (m[4] > m[8]) {
			s = Math.sqrt(1 + m[4] - m[0] - m[8]) * 2;

			return [(m[3] + m[1]) / s, s / 4, (m[7] + m[5]) / s, (m[6] - m[2]) / s];
		}

		s = Math.sqrt(1 + m[8] - m[0] - m[4]) * 2;

		return [(m[6] + m[2]) / s, (m[7] + m[5]) / s, s / 4, (m[1] - m[3]) / s];
	},

	/* The numbers of an accessor as floats (normalized ones made 0 to 1, or -1 to 1). */
	Accessor: function (json, views, index) {
		var accessor = json.accessors[index];
		var sizes = {SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16};
		var size = sizes[accessor.type];
		var count = accessor.count;
		var values = new Float32Array(count * size);
		var kinds = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4};
		var bytes = kinds[accessor.componentType];
		var view = accessor.bufferView === undefined ? null : json.bufferViews[accessor.bufferView];
		var data = accessor.bufferView === undefined ? null : views[accessor.bufferView];
		var stride = view && view.byteStride || bytes * size;
		var offset = accessor.byteOffset || 0;
		var reader;
		var i;
		var j;
		var at;

		if (accessor.sparse)
			throw new Error('Elemenx Gltf: sparse accessors are not read');

		if (data) {
			reader = new DataView(data.buffer, data.byteOffset, data.byteLength);

			for (i = 0; i < count; i++) {
				for (j = 0; j < size; j++) {
					at = offset + i * stride + j * bytes;

					values[i * size + j] = this.Number(reader, at, accessor.componentType, accessor.normalized);
				}
			}
		}

		return {Values: values, Size: size, Count: count};
	},

	Number: function (reader, at, type, normalized) {
		switch (type) {
			case 5120:
				return normalized ? Math.max(reader.getInt8(at) / 127, -1) : reader.getInt8(at);
			case 5121:
				return normalized ? reader.getUint8(at) / 255 : reader.getUint8(at);
			case 5122:
				return normalized ? Math.max(reader.getInt16(at, true) / 32767, -1) : reader.getInt16(at, true);
			case 5123:
				return normalized ? reader.getUint16(at, true) / 65535 : reader.getUint16(at, true);
			case 5125:
				return reader.getUint32(at, true);
			default:
				return reader.getFloat32(at, true);
		}
	},

	Primitive: function (primitive, json, views) {
		var self = this;
		var attributes = primitive.attributes;
		var positions = this.Accessor(json, views, attributes.POSITION).Values;
		var count = positions.length / 3;
		var geometry = {Positions: positions, Normals: attributes.NORMAL === undefined ? null : this.Accessor(json, views, attributes.NORMAL).Values, UVs: attributes.TEXCOORD_0 === undefined ? new Float32Array(count * 2) : this.Accessor(json, views, attributes.TEXCOORD_0).Values, Colors: null, Joints: null, Weights: null, Indices: null};
		var transform = this.Transform(primitive, json);
		var i;

		if (attributes.JOINTS_0 !== undefined) {
			geometry.Joints = this.Accessor(json, views, attributes.JOINTS_0).Values;
			geometry.Weights = this.Accessor(json, views, attributes.WEIGHTS_0).Values;
		}

		if (attributes.COLOR_0 !== undefined) {
			var colors = this.Accessor(json, views, attributes.COLOR_0);

			geometry.Colors = new Float32Array(count * 3);

			for (i = 0; i < count; i++) {
				geometry.Colors[i * 3] = colors.Values[i * colors.Size];
				geometry.Colors[i * 3 + 1] = colors.Values[i * colors.Size + 1];
				geometry.Colors[i * 3 + 2] = colors.Values[i * colors.Size + 2];
			}
		}

		if (transform) {
			for (i = 0; i < count; i++) {
				geometry.UVs[i * 2] = geometry.UVs[i * 2] * transform.scale[0] + transform.offset[0];
				geometry.UVs[i * 2 + 1] = geometry.UVs[i * 2 + 1] * transform.scale[1] + transform.offset[1];
			}
		}

		if (primitive.indices !== undefined) {
			geometry.Indices = Array.prototype.slice.call(this.Accessor(json, views, primitive.indices).Values);
		}
		else {
			geometry.Indices = [];

			for (i = 0; i < count; i++)
				geometry.Indices.push(i);
		}

		if (!geometry.Normals)
			geometry.Normals = self.Flat(geometry);

		return geometry;
	},

	/* The move of the texture coordinates of a primitive, written into them. */
	Transform: function (primitive, json) {
		var material = primitive.material === undefined || !json.materials ? null : json.materials[primitive.material];
		var pbr = material && material.pbrMetallicRoughness;
		var info = pbr && pbr.baseColorTexture;
		var transform = info && info.extensions && info.extensions.KHR_texture_transform;

		return transform ? {offset: transform.offset || [0, 0], scale: transform.scale || [1, 1]} : null;
	},

	/* The normals of what came with none. */
	Flat: function (geometry) {
		var p = geometry.Positions;
		var normals = new Float32Array(p.length);
		var i;

		for (i = 0; i + 2 < geometry.Indices.length; i += 3) {
			var a = geometry.Indices[i] * 3;
			var b = geometry.Indices[i + 1] * 3;
			var c = geometry.Indices[i + 2] * 3;
			var ux = p[b] - p[a];
			var uy = p[b + 1] - p[a + 1];
			var uz = p[b + 2] - p[a + 2];
			var vx = p[c] - p[a];
			var vy = p[c + 1] - p[a + 1];
			var vz = p[c + 2] - p[a + 2];
			var x = uy * vz - uz * vy;
			var y = uz * vx - ux * vz;
			var z = ux * vy - uy * vx;

			[a, b, c].forEach(function (at) {
				normals[at] += x;
				normals[at + 1] += y;
				normals[at + 2] += z;
			});
		}

		for (i = 0; i < normals.length; i += 3) {
			var length = Math.sqrt(normals[i] * normals[i] + normals[i + 1] * normals[i + 1] + normals[i + 2] * normals[i + 2]) || 1;

			normals[i] /= length;
			normals[i + 1] /= length;
			normals[i + 2] /= length;
		}

		return normals;
	},

	Animation: function (animation, index, json, views) {
		var self = this;
		var length = 0;
		var channels = [];

		animation.channels.forEach(function (channel) {
			var sampler = animation.samplers[channel.sampler];
			var times;
			var values;

			if (channel.target.node === undefined || channel.target.path === 'weights') return;

			times = self.Accessor(json, views, sampler.input).Values;
			values = self.Accessor(json, views, sampler.output);

			length = Math.max(length, times[times.length - 1] || 0);

			channels.push({Node: channel.target.node, Path: channel.target.path, Times: times, Values: values.Values, Size: values.Size, Step: sampler.interpolation === 'STEP', Cubic: sampler.interpolation === 'CUBICSPLINE'});
		});

		return {Name: animation.name || 'animation-' + index, Length: length, Channels: channels};
	},

	/*
	 * EXT_meshopt_compression: mode ATTRIBUTES, TRIANGLES or INDICES, source the bytes, count the elements, stride their
	 * size, filter NONE, OCTAHEDRAL, QUATERNION or EXPONENTIAL. Returns a Uint8Array of count * stride bytes.
	 */
	Meshopt: function (mode, source, count, stride, filter) {
		var result = new Uint8Array(count * stride);

		if (mode === 'ATTRIBUTES') this.MeshoptAttributes(source, result, count, stride);
		else if (mode === 'TRIANGLES') this.MeshoptTriangles(source, result, count, stride);
		else if (mode === 'INDICES') this.MeshoptIndices(source, result, count, stride);
		else throw new Error('Elemenx Gltf: unknown mode of meshopt ' + mode);

		if (filter === 'OCTAHEDRAL') this.FilterOctahedral(result, count, stride);
		else if (filter === 'QUATERNION') this.FilterQuaternion(result, count, stride);
		else if (filter === 'EXPONENTIAL') this.FilterExponential(result, count, stride);

		return result;
	},

	MeshoptAttributes: function (source, target, count, stride) {
		var limit = Math.min(Math.floor(8192 / stride) & ~15, 256);
		/* The first element closes the stream, after the padding that makes the end at least 32 long. */
		var last = new Uint8Array(source.subarray(source.length - stride));
		var buffer = new Uint8Array(limit + 16);
		var at = 1;
		var done = 0;

		if (source[0] !== 0xa0)
			throw new Error('Elemenx Gltf: unknown meshopt attributes header 0x' + source[0].toString(16));

		while (done < count) {
			var elements = Math.min(count - done, limit);
			var groups = Math.ceil(elements / 16);
			var lane;

			for (lane = 0; lane < stride; lane++) {
				at = this.MeshoptLane(source, at, buffer, groups);

				var value = last[lane];
				var i;

				for (i = 0; i < elements; i++) {
					var code = buffer[i];

					/* The delta of the byte, its sign in its lowest bit. */
					value = value + (code & 1 ? ~(code >> 1) : code >> 1) & 255;

					target[(done + i) * stride + lane] = value;
				}

				last[lane] = value;
			}

			done += elements;
		}
	},

	/* The codes of one byte of the elements of a block: a head of 2 bits a group, then each group. */
	MeshoptLane: function (source, start, target, groups) {
		var head = Math.ceil(groups / 4);
		var at = start + head;
		var group;

		for (group = 0; group < groups; group++) {
			var kind = source[start + (group >> 2)] >> ((group & 3) * 2) & 3;
			var offset = group * 16;
			var i;

			if (kind === 0) {
				target.fill(0, offset, offset + 16);
			}
			else if (kind === 3) {
				target.set(source.subarray(at, at + 16), offset);

				at += 16;
			}
			else {
				var bits = kind === 1 ? 2 : 4;
				var packed = at;
				var mask = (1 << bits) - 1;
				var extra = at + (kind === 1 ? 4 : 8);

				for (i = 0; i < 16; i++) {
					var shift = 8 - bits - (i * bits) % 8;
					var code = source[packed + (i * bits >> 3)] >> shift & mask;

					target[offset + i] = code === mask ? source[extra++] : code;
				}

				at = extra;
			}
		}

		return at;
	},

	MeshoptTriangles: function (source, target, count, stride) {
		var view = new DataView(target.buffer, target.byteOffset, target.byteLength);
		var triangles = count / 3;
		var codes = 1;
		var data = codes + triangles;
		var aux = source.length - 16;
		var edges = new Uint32Array(32);
		var vertices = new Uint32Array(16);
		var edgeAt = 0;
		var vertexAt = 0;
		var next = 0;
		var last = 0;
		var written = 0;

		if (source[0] !== 0xe1)
			throw new Error('Elemenx Gltf: unknown meshopt triangles header 0x' + source[0].toString(16));

		function varint () {
			var value = 0;
			var shift = 0;
			var byte;

			do {
				byte = source[data++];
				value += (byte & 127) * Math.pow(2, shift);

				shift += 7;
			} while (byte & 128);

			return value;
		}

		function decode () {
			var value = varint();

			last = last + (value % 2 ? -Math.floor(value / 2) - 1 : Math.floor(value / 2)) | 0;

			return last >>> 0;
		}

		function edge (a, b) {
			edges[edgeAt * 2] = a;
			edges[edgeAt * 2 + 1] = b;
			edgeAt = edgeAt + 1 & 15;
		}

		function vertex (a) {
			vertices[vertexAt] = a;
			vertexAt = vertexAt + 1 & 15;
		}

		function emit (a, b, c) {
			[a, b, c].forEach(function (index) {
				if (stride === 2) view.setUint16(written, index, true);
				else view.setUint32(written, index, true);

				written += stride;
			});
		}

		function recent (index) {
			return vertices[vertexAt - 1 - index & 15];
		}

		var i;

		for (i = 0; i < triangles; i++) {
			var code = source[codes + i];
			var high = code >> 4;
			var low = code & 15;
			var a;
			var b;
			var c;

			if (high < 15) {
				a = edges[(edgeAt - 1 - high & 15) * 2];
				b = edges[(edgeAt - 1 - high & 15) * 2 + 1];

				if (low === 0) {
					c = next++;

					vertex(c);
				}
				else if (low < 13) {
					c = recent(low);
				}
				else {
					c = low === 13 ? last - 1 >>> 0 : low === 14 ? last + 1 >>> 0 : decode();

					if (low !== 15)
						last = c | 0;

					vertex(c);
				}

				edge(c, b);
				edge(a, c);

				emit(a, b, c);
			}
			else if (low < 14) {
				var table = source[aux + low];
				var z = table >> 4;
				var w = table & 15;

				a = next++;
				b = z === 0 ? next++ : recent(z - 1);
				c = w === 0 ? next++ : recent(w - 1);

				edge(b, a);
				edge(c, b);
				edge(a, c);

				vertex(a);

				if (z === 0)
					vertex(b);

				if (w === 0)
					vertex(c);

				emit(a, b, c);
			}
			else {
				var byte = source[data++];
				var first = byte >> 4;
				var second = byte & 15;

				if (byte === 0)
					next = 0;

				a = low === 15 ? decode() : next++;
				b = first === 0 ? next++ : first < 15 ? recent(first - 1) : decode();
				c = second === 0 ? next++ : second < 15 ? recent(second - 1) : decode();

				edge(b, a);
				edge(c, b);
				edge(a, c);

				vertex(a);

				if (first === 0 || first === 15)
					vertex(b);

				if (second === 0 || second === 15)
					vertex(c);

				emit(a, b, c);
			}
		}
	},

	MeshoptIndices: function (source, target, count, stride) {
		var view = new DataView(target.buffer, target.byteOffset, target.byteLength);
		var last = [0, 0];
		var at = 1;
		var i;

		if (source[0] !== 0xd1)
			throw new Error('Elemenx Gltf: unknown meshopt indices header 0x' + source[0].toString(16));

		for (i = 0; i < count; i++) {
			var value = 0;
			var shift = 0;
			var byte;

			do {
				byte = source[at++];
				value += (byte & 127) * Math.pow(2, shift);

				shift += 7;
			} while (byte & 128);

			var base = value % 2;
			var delta = value % 4 >= 2 ? -Math.floor(value / 4) - 1 : Math.floor(value / 4);

			last[base] = last[base] + delta | 0;

			if (stride === 2) view.setUint16(i * 2, last[base] & 65535, true);
			else view.setUint32(i * 4, last[base] >>> 0, true);
		}
	},

	FilterOctahedral: function (data, count, stride) {
		var view = new DataView(data.buffer, data.byteOffset, data.byteLength);
		var wide = stride === 8;
		var most = wide ? 32767 : 127;
		var i;

		function read (at) {
			return wide ? view.getInt16(at, true) : view.getInt8(at);
		}

		function write (at, value) {
			if (wide) view.setInt16(at, value, true);
			else view.setInt8(at, value);
		}

		for (i = 0; i < count; i++) {
			var at = i * stride;
			var part = stride / 4;
			var one = read(at + part * 2);
			var x = read(at) / one;
			var y = read(at + part) / one;
			var z = 1 - Math.abs(x) - Math.abs(y);
			var t = Math.min(z, 0);

			x -= x < 0 ? -Math.abs(t) : Math.abs(t);
			y -= y < 0 ? -Math.abs(t) : Math.abs(t);

			var length = Math.sqrt(x * x + y * y + z * z) || 1;

			write(at, Math.round(x / length * most));
			write(at + part, Math.round(y / length * most));
			write(at + part * 2, Math.round(z / length * most));
		}
	},

	FilterQuaternion: function (data, count) {
		var view = new DataView(data.buffer, data.byteOffset, data.byteLength);
		var range = 1 / Math.SQRT2;
		var i;

		for (i = 0; i < count; i++) {
			var at = i * 8;
			var head = view.getInt16(at + 6, true);
			var one = head | 3;
			var x = view.getInt16(at, true) / one * range;
			var y = view.getInt16(at + 2, true) / one * range;
			var z = view.getInt16(at + 4, true) / one * range;
			var w = Math.sqrt(Math.max(0, 1 - x * x - y * y - z * z));
			var largest = head & 3;

			view.setInt16(at + (largest + 1) % 4 * 2, Math.round(x * 32767), true);
			view.setInt16(at + (largest + 2) % 4 * 2, Math.round(y * 32767), true);
			view.setInt16(at + (largest + 3) % 4 * 2, Math.round(z * 32767), true);
			view.setInt16(at + largest * 2, Math.round(w * 32767), true);
		}
	},

	FilterExponential: function (data, count, stride) {
		var view = new DataView(data.buffer, data.byteOffset, data.byteLength);
		var i;

		for (i = 0; i < count * stride; i += 4) {
			var word = view.getInt32(i, true);

			view.setFloat32(i, Math.pow(2, word >> 24) * (word << 8 >> 8), true);
		}
	}
});
