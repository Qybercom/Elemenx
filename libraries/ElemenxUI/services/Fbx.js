/*
 * Fbx: the files of FBX, binary (7.x, its lists packed by zlib or not) and text, read and written.
 * - Read(data) returns a file as a model in the very form Gltf gives (its asset): nodes (the models of FBX, their pivots,
 *   pre- and post-rotations and orders of turns made matrices), meshes of polygons in triangles, a part for each material,
 *   materials of Phong made PBR (Lambert too), the pictures of their textures (inside the file, or the files it names),
 *   skins (clusters) and clips (a stack each, sampled at its keys); a file of Z up is turned Y up. ModelFormats reads it so.
 * - Write(asset, options): an asset (of Read, of Gltf) as a file: binary (an ArrayBuffer) by default, text with {Text:
 *   true}; FromAsset(asset) its tree, Binary(tree) and Text(tree) a tree as a file; Typed(type, value) a value of a type
 *   of its own for them (I, L, D, S, l).
 * - Tree(data): the tree of a file, {Version, Nodes: [{Name, Props, Nodes}]}; Child(node, name), Children(node, name),
 *   Properties(node) ({name: [values]} of its Properties70); Inflate(bytes) unpacks zlib; IsBinary(bytes).
 * - Parse(data) returns the skeleton and the clip of a file (text, or bytes binary or not): {Bones: [{ID, Name, Parent,
 *   Translation, Pre, Rotation}], Length, Curves}. Parent is an index, -1 for a root; Pre and Rotation are degrees, x, y,
 *   z. Curves: {bone index: {T: [x, y, z], R: [x, y, z]}}, each [{Times, Values}] in seconds, degrees and the units of the
 *   file, or null where nothing moves: the way a clip made for another skeleton comes to a model (Models.Retarget).
 *   Skeleton(tree) is the same of a tree.
 * - Sample(curve, time, fallback) is the value of a curve at a second.
 * - Load(url, callback) fetches and parses: (error, parsed).
 * The same functions run in Node: they read no page, but for Load.
 */
Elemenx.Service('Fbx', {
	$Meta: {
		Description: 'The files of FBX, binary and text: models with meshes, materials, pictures, skins and clips, read and written.',
		Methods: ['Read(data)', 'Write(asset, options)', 'Tree(data)', 'Parse(data)', 'Skeleton(tree)', 'Sample(curve, time, fallback)', 'Load(url, callback)', 'FromAsset(asset)', 'Binary(tree)', 'Text(tree)', 'Inflate(bytes)']
	},

	Second: 46186158000,

	Numbers: function (text) {
		return text.split(',').map(Number);
	},

	Vector: function (block, name) {
		var found = new RegExp('P: "' + name + '",[^\\n]*?,\\s*"[^"]*",((?:-?[\\d.e+-]+,?){3})').exec(block);

		return found ? this.Numbers(found[1]) : [0, 0, 0];
	},

	Parse: function (data) {
		var self = this;
		var text = data;
		var bones = [];
		var byID = {};
		var curves = {};
		var nodes = {};
		var tracks = {};
		var length = 0;
		var found;
		var model = /Model: (\d+), "Model::([^"]+)", "LimbNode" \{([\s\S]*?)\n\t\}/g;
		var curve = /AnimationCurve: (\d+), "AnimCurve::", "" \{[\s\S]*?KeyTime: \*\d+ \{\s*a: ([^}]*)\}[\s\S]*?KeyValueFloat: \*\d+ \{\s*a: ([^}]*)\}/g;
		var node = /AnimationCurveNode: (\d+), "AnimCurveNode::([TRS])"/g;
		var link = /C: "(OO|OP)",(\d+),(\d+)(?:, "([^"]+)")?/g;

		/* A binary file, or its bytes: the same, of its tree. */
		if (typeof data !== 'string') {
			if (this.IsBinary(data instanceof ArrayBuffer ? new Uint8Array(data) : data)) return this.Skeleton(this.Tree(data));

			text = new TextDecoder().decode(data);
		}

		if (text.slice(0, 18) === 'Kaydara FBX Binary')
			return this.Skeleton(this.BinaryTree(new Uint8Array(Array.prototype.map.call(text, function (letter) {
				return letter.charCodeAt(0) & 255;
			}))));

		while ((found = model.exec(text))) {
			byID[found[1]] = bones.length;

			bones.push({ID: found[1], Name: found[2].replace(/^.*:/, ''), Parent: -1, Translation: this.Vector(found[3], 'Lcl Translation'), Pre: this.Vector(found[3], 'PreRotation'), Rotation: this.Vector(found[3], 'Lcl Rotation')});
		}

		while ((found = curve.exec(text))) {
			curves[found[1]] = {Times: this.Numbers(found[2]).map(function (time) {
				return time / self.Second;
			}), Values: this.Numbers(found[3])};
		}

		while ((found = node.exec(text)))
			nodes[found[1]] = found[2];

		while ((found = link.exec(text))) {
			var from = found[2];
			var to = found[3];
			var axis = found[4] ? 'XYZ'.indexOf(found[4].slice(-1)) : -1;

			if (found[1] === 'OO' && byID[from] !== undefined && byID[to] !== undefined)
				bones[byID[from]].Parent = byID[to];

			/* A curve goes to its node of curves by its axis, the node to its bone by what it moves. */
			if (found[1] === 'OP' && curves[from] && nodes[to]) {
				tracks[to] = tracks[to] || [null, null, null];
				tracks[to][axis] = curves[from];

				length = Math.max(length, curves[from].Times[curves[from].Times.length - 1]);
			}

			if (found[1] === 'OP' && nodes[from] && byID[to] !== undefined) {
				tracks[from] = tracks[from] || [null, null, null];
				tracks[from].Bone = byID[to];
			}
		}

		var result = {};

		Object.keys(tracks).forEach(function (id) {
			var bone = tracks[id].Bone;
			if (bone === undefined) return;

			result[bone] = result[bone] || {};
			result[bone][nodes[id]] = [tracks[id][0], tracks[id][1], tracks[id][2]];
		});

		return {Bones: bones, Length: length, Curves: result};
	},

	Sample: function (curve, time, fallback) {
		var times;
		var low = 0;
		var high;
		var t;

		if (!curve)
			return fallback;

		times = curve.Times;
		high = times.length - 1;

		if (time <= times[0])
			return curve.Values[0];

		if (time >= times[high])
			return curve.Values[high];

		while (high - low > 1) {
			var middle = (low + high) >> 1;

			if (times[middle] <= time) low = middle;
			else high = middle;
		}

		t = (time - times[low]) / (times[high] - times[low]);

		return curve.Values[low] + (curve.Values[high] - curve.Values[low]) * t;
	},

	Load: function (url, callback) {
		var self = this;
		var request = new XMLHttpRequest();

		request.open('GET', url);

		request.responseType = 'arraybuffer';

		request.onload = function () {
			var parsed = null;

			if (request.status < 200 || request.status >= 300) {
				callback(new Error('Elemenx Fbx: ' + url + ' answers ' + request.status), null);

				return;
			}

			try {
				parsed = self.Parse(request.response);
			}
			catch (error) {
				callback(error, null);

				return;
			}

			callback(null, parsed);
		};

		request.onerror = function () {
			callback(new Error('Elemenx Fbx: ' + url + ' does not answer'), null);
		};

		request.send();
	},

	/* Whether bytes are of a binary file. */
	IsBinary: function (bytes) {
		var head = 'Kaydara FBX Binary';
		var i;

		if (!bytes || typeof bytes === 'string' || bytes.length < head.length) return false;

		for (i = 0; i < head.length; i++) {
			if (bytes[i] !== head.charCodeAt(i)) return false;
		}

		return true;
	},

	/*
	 * The tree of a file, text or binary: {Version, Nodes: [{Name, Props, Nodes}]}. The props are numbers, strings and
	 * lists (typed arrays); a name and a class of a binary file read as the text writes them, Class::Name. An ID too large
	 * for a number is a string, the same in the objects and in the connections.
	 */
	Tree: function (data) {
		var bytes = typeof data === 'string' ? null : data instanceof ArrayBuffer ? new Uint8Array(data) : data;
		if (this.IsBinary(bytes))
			return this.BinaryTree(bytes);

		return this.TextTree(typeof data === 'string' ? data : new TextDecoder().decode(bytes));
	},

	TextTree: function (text) {
		var at = 0;
		var length = text.length;
		var version = /FBX (\d+)\.(\d+)/.exec(text.slice(0, 200));

		function space (lines) {
			var code;

			while (at < length) {
				code = text.charCodeAt(at);

				if (code === 59) {
					while (at < length && text.charCodeAt(at) !== 10)
						at++;
				}
				else if (code === 32 || code === 9 || code === 13 || lines && code === 10) {
					at++;
				}
				else {
					return;
				}
			}
		}

		function value () {
			var start = at;
			var code = text.charCodeAt(at);
			var word;

			if (code === 34) {
				at = text.indexOf('"', at + 1);

				if (at === -1)
					throw new Error('Elemenx Fbx: a text that does not end');

				at++;

				return text.slice(start + 1, at - 1).replace(/&quot;/g, '"');
			}

			while (at < length && ',{}\n\r\t ;'.indexOf(text.charAt(at)) === -1)
				at++;

			word = text.slice(start, at);

			if (/^-?\d+$/.test(word))
				return word.replace(/^-/, '').length > 15 ? word : Number(word);

			if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(word)) return Number(word);

			return word;
		}

		/* The numbers of a list (a: 1,2,3...) up to its brace, at once. */
		function list () {
			var end = text.indexOf('}', at);
			var body = text.slice(at, end).replace(/^\s*a:/, '').trim();
			var numbers = body ? body.split(',') : [];
			var made = new Float64Array(numbers.length);
			var i;

			for (i = 0; i < numbers.length; i++)
				made[i] = Number(numbers[i]);

			at = end + 1;

			return made;
		}

		function block () {
			var nodes = [];
			var node;
			var start;

			for (;;) {
				space(true);

				if (at >= length) return nodes;

				if (text.charAt(at) === '}') {
					at++;

					return nodes;
				}

				start = at;

				while (at < length && text.charAt(at) !== ':' && text.charAt(at) !== '\n')
					at++;

				if (text.charAt(at) !== ':')
					throw new Error('Elemenx Fbx: no name at ' + start);

				node = {Name: text.slice(start, at).trim(), Props: [], Nodes: []};
				at++;

				space(false);

				/* A list: *count { a: numbers }. */
				if (text.charAt(at) === '*') {
					while (at < length && text.charAt(at) !== '{')
						at++;

					at++;

					node.Props.push(list());
					nodes.push(node);

					continue;
				}

				while (at < length && text.charAt(at) !== '\n' && text.charAt(at) !== '{' && text.charAt(at) !== '}') {
					node.Props.push(value());

					space(false);

					if (text.charAt(at) === ',') {
						at++;

						space(true);
					}
				}

				if (text.charAt(at) === '{') {
					at++;
					node.Nodes = block();
				}

				nodes.push(node);
			}
		}

		return {Version: version ? Number(version[1]) * 1000 + Number(version[2]) * 100 : 7400, Nodes: block()};
	},

	BinaryTree: function (bytes) {
		var self = this;
		var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
		var version;
		var wide;
		var at = 27;
		var nodes = [];
		var node;

		if (bytes.length < 27)
			throw new Error('Elemenx Fbx: a binary file too short');

		version = view.getUint32(23, true);
		wide = version >= 7500;

		function long (where) {
			var low = view.getUint32(where, true);
			var high = view.getInt32(where + 4, true);
			var value = high * 4294967296 + low;
			if (Math.abs(value) <= 9007199254740991) return value;

			return 'x' + (high >>> 0).toString(16) + ('00000000' + low.toString(16)).slice(-8);
		}

		function offset () {
			var value = wide ? view.getUint32(at, true) + view.getUint32(at + 4, true) * 4294967296 : view.getUint32(at, true);

			at += wide ? 8 : 4;

			return value;
		}

		/* A list of numbers: of its kind, packed by zlib or not. */
		function array (type) {
			var count = view.getUint32(at, true);
			var packed = view.getUint32(at + 4, true);
			var size = view.getUint32(at + 8, true);
			var raw = bytes.subarray(at + 12, at + 12 + size);
			var data = packed ? self.Inflate(raw) : raw.slice();
			var numbers;
			var made;
			var i;

			at += 12 + size;

			if (type === 'f')
				return new Float32Array(data.buffer, data.byteOffset, count);

			if (type === 'd')
				return new Float64Array(data.buffer, data.byteOffset, count);

			if (type === 'i')
				return new Int32Array(data.buffer, data.byteOffset, count);

			if (type === 'b')
				return new Uint8Array(data.buffer, data.byteOffset, count);

			made = new Float64Array(count);
			numbers = new DataView(data.buffer, data.byteOffset, data.byteLength);

			for (i = 0; i < count; i++)
				made[i] = numbers.getInt32(i * 8 + 4, true) * 4294967296 + numbers.getUint32(i * 8, true);

			return made;
		}

		function text (size) {
			var made = new TextDecoder().decode(bytes.subarray(at, at + size));
			var parts = made.split('\u0000\u0001');

			at += size;

			return parts.length === 2 ? parts[1] + '::' + parts[0] : made;
		}

		function prop () {
			var type = String.fromCharCode(bytes[at]);
			var value;

			at++;

			if (type === 'Y') {
				value = view.getInt16(at, true);
				at += 2;
			}
			else if (type === 'C') {
				value = bytes[at] ? 1 : 0;
				at += 1;
			}
			else if (type === 'I') {
				value = view.getInt32(at, true);
				at += 4;
			}
			else if (type === 'F') {
				value = view.getFloat32(at, true);
				at += 4;
			}
			else if (type === 'D') {
				value = view.getFloat64(at, true);
				at += 8;
			}
			else if (type === 'L') {
				value = long(at);
				at += 8;
			}
			else if (type === 'S' || type === 'R') {
				value = view.getUint32(at, true);
				at += 4;
				value = type === 'S' ? text(value) : bytes.slice(at, at += value);
			}
			else if ('fdlib'.indexOf(type) !== -1) {
				value = array(type);
			}
			else {
				throw new Error('Elemenx Fbx: a binary value of an unknown type ' + type);
			}

			return value;
		}

		function record () {
			var end = offset();
			var count = offset();
			var made;
			var child;
			var i;

			offset();

			made = {Name: '', Props: [], Nodes: []};

			if (end === 0) {
				at += 1;

				return null;
			}

			if (end > bytes.length)
				throw new Error('Elemenx Fbx: a binary file cut short');

			made.Name = new TextDecoder().decode(bytes.subarray(at + 1, at + 1 + bytes[at]));
			at += 1 + bytes[at];

			for (i = 0; i < count; i++)
				made.Props.push(prop());

			while (at < end) {
				child = record();

				if (!child) break;

				made.Nodes.push(child);
			}

			at = end;

			return made;
		}

		while (at + (wide ? 25 : 13) <= bytes.length) {
			node = record();

			if (!node) break;

			nodes.push(node);
		}

		return {Version: version, Nodes: nodes};
	},

	/* The data of zlib (RFC 1950 and 1951): what the lists of a binary file are packed with. */
	Inflate: function (bytes) {
		var out = new Uint8Array(Math.max(1024, bytes.length * 4));
		var size = 0;
		var at = 2;
		var bit = 0;
		var last;
		var type;
		var lengthBase = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
		var lengthExtra = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
		var distanceBase = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
		var distanceExtra = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
		var order = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
		var fixed = null;

		function bits (count) {
			var value = 0;
			var i;

			for (i = 0; i < count; i++) {
				if (at >= bytes.length)
					throw new Error('Elemenx Fbx: packed data cut short');

				value |= (bytes[at] >> bit & 1) << i;
				bit++;

				if (bit === 8) {
					bit = 0;
					at++;
				}
			}

			return value;
		}

		function put (value) {
			var grown;

			if (size === out.length) {
				grown = new Uint8Array(out.length * 2);

				grown.set(out);

				out = grown;
			}

			out[size++] = value;
		}

		/* A code of Huffman of lengths: counts and symbols, read a bit at a time. */
		function table (lengths) {
			var counts = new Uint16Array(16);
			var offsets = new Uint16Array(16);
			var symbols = new Uint16Array(lengths.length);
			var i;

			for (i = 0; i < lengths.length; i++)
				counts[lengths[i]]++;

			counts[0] = 0;

			for (i = 1; i < 16; i++)
				offsets[i] = offsets[i - 1] + counts[i - 1];

			for (i = 0; i < lengths.length; i++) {
				if (lengths[i])
					symbols[offsets[lengths[i]]++] = i;
			}

			return {Counts: counts, Symbols: symbols};
		}

		function decode (code) {
			var value = 0;
			var first = 0;
			var index = 0;
			var length;
			var count;

			for (length = 1; length < 16; length++) {
				value |= bits(1);
				count = code.Counts[length];

				if (value - first < count)
					return code.Symbols[index + value - first];

				index += count;
				first = (first + count) << 1;
				value <<= 1;
			}

			throw new Error('Elemenx Fbx: packed data of a wrong code');
		}

		function codes () {
			var literals = bits(5) + 257;
			var distances = bits(5) + 1;
			var count = bits(4) + 4;
			var lengths = new Uint8Array(19);
			var all = new Uint8Array(literals + distances);
			var code;
			var i = 0;
			var symbol;
			var repeat;
			var previous;

			for (i = 0; i < count; i++)
				lengths[order[i]] = bits(3);

			code = table(lengths);
			i = 0;

			while (i < literals + distances) {
				symbol = decode(code);

				if (symbol < 16) {
					all[i++] = symbol;

					continue;
				}

				previous = symbol === 16 ? all[i - 1] : 0;
				repeat = symbol === 16 ? 3 + bits(2) : symbol === 17 ? 3 + bits(3) : 11 + bits(7);

				while (repeat--)
					all[i++] = previous;
			}

			return [table(all.subarray(0, literals)), table(all.subarray(literals))];
		}

		function fixedCodes () {
			var lengths = new Uint8Array(288);
			var i;

			for (i = 0; i < 288; i++)
				lengths[i] = i < 144 ? 8 : i < 256 ? 9 : i < 280 ? 7 : 8;

			return [table(lengths), table(new Uint8Array(30).fill(5))];
		}

		function inflated (pair) {
			var symbol;
			var length;
			var distance;
			var i;

			for (;;) {
				symbol = decode(pair[0]);

				if (symbol < 256) {
					put(symbol);
				}
				else if (symbol === 256) {
					return;
				}
				else {
					symbol -= 257;
					length = lengthBase[symbol] + bits(lengthExtra[symbol]);
					symbol = decode(pair[1]);
					distance = distanceBase[symbol] + bits(distanceExtra[symbol]);

					for (i = 0; i < length; i++)
						put(out[size - distance]);
				}
			}
		}

		do {
			last = bits(1);
			type = bits(2);

			if (type === 0) {
				var stored;

				if (bit) {
					bit = 0;
					at++;
				}

				stored = bytes[at] | bytes[at + 1] << 8;
				at += 4;

				while (stored--)
					put(bytes[at++]);
			}
			else if (type === 1) {
				fixed = fixed || fixedCodes();

				inflated(fixed);
			}
			else if (type === 2) {
				inflated(codes());
			}
			else {
				throw new Error('Elemenx Fbx: packed data of a wrong block');
			}
		} while (!last);

		return out.slice(0, size);
	},

	/* The first node of a name among the nodes of a node (or of a tree), and all of them. */
	Child: function (node, name) {
		return this.Children(node, name)[0] || null;
	},

	Children: function (node, name) {
		return (node ? node.Nodes : []).filter(function (each) {
			return each.Name === name;
		});
	},

	/* What Parse gives, of a tree: for a binary file. */
	Skeleton: function (tree) {
		var self = this;
		var objects = this.Child(tree, 'Objects');
		var bones = [];
		var byID = {};
		var curves = {};
		var nodes = {};
		var tracks = {};
		var length = 0;
		var result = {};

		function name (node) {
			var text = String(node.Props[1] || '');

			return text.indexOf('::') === -1 ? text : text.slice(text.indexOf('::') + 2);
		}

		function vector (props, key) {
			return props[key] ? [Number(props[key][0]), Number(props[key][1]), Number(props[key][2])] : [0, 0, 0];
		}

		(objects ? objects.Nodes : []).forEach(function (node) {
			var id = String(node.Props[0]);
			var props;
			var times;
			var values;

			if (node.Name === 'Model' && node.Props[2] === 'LimbNode') {
				props = self.Properties(node);
				byID[id] = bones.length;

				bones.push({ID: id, Name: name(node).replace(/^.*:/, ''), Parent: -1, Translation: vector(props, 'Lcl Translation'), Pre: vector(props, 'PreRotation'), Rotation: vector(props, 'Lcl Rotation')});
			}

			if (node.Name === 'AnimationCurve') {
				times = self.Child(node, 'KeyTime');
				values = self.Child(node, 'KeyValueFloat');

				if (times && values) {
					curves[id] = {Times: Array.prototype.map.call(times.Props[0], function (time) {
						return time / self.Second;
					}), Values: Array.from(values.Props[0])};
				}
			}

			if (node.Name === 'AnimationCurveNode' && /^[TRS]$/.test(name(node)))
				nodes[id] = name(node);
		});

		this.Children(this.Child(tree, 'Connections'), 'C').forEach(function (link) {
			var from = String(link.Props[1]);
			var to = String(link.Props[2]);
			var axis = link.Props[3] ? 'XYZ'.indexOf(String(link.Props[3]).slice(-1)) : -1;

			if (link.Props[0] === 'OO' && byID[from] !== undefined && byID[to] !== undefined)
				bones[byID[from]].Parent = byID[to];

			if (link.Props[0] === 'OP' && curves[from] && nodes[to]) {
				tracks[to] = tracks[to] || [null, null, null];
				tracks[to][axis] = curves[from];
				length = Math.max(length, curves[from].Times[curves[from].Times.length - 1]);
			}

			if (link.Props[0] === 'OP' && nodes[from] && byID[to] !== undefined) {
				tracks[from] = tracks[from] || [null, null, null];
				tracks[from].Bone = byID[to];
			}
		});

		Object.keys(tracks).forEach(function (id) {
			var bone = tracks[id].Bone;
			if (bone === undefined) return;

			result[bone] = result[bone] || {};
			result[bone][nodes[id]] = [tracks[id][0], tracks[id][1], tracks[id][2]];
		});

		return {Bones: bones, Length: length, Curves: result};
	},

	/* The matrix of rotations of degrees x, y, z in an order of FBX (0 XYZ, 1 XZY, 2 YZX, 3 YXZ, 4 ZXY, 5 ZYX: the first turns first). */
	Euler: function (degrees, order) {
		var graphics = this.$Service('Graphics3D');
		var names = ['XYZ', 'XZY', 'YZX', 'YXZ', 'ZXY', 'ZYX'][order || 0] || 'XYZ';
		var axes = {X: [1, 0, 0], Y: [0, 1, 0], Z: [0, 0, 1]};
		var matrix = graphics.Identity();
		var i;

		for (i = 0; i < 3; i++)
			matrix = graphics.Multiply(graphics.Rotation(axes[names.charAt(i)], (degrees['XYZ'.indexOf(names.charAt(i))] || 0) * Math.PI / 180), matrix);

		return matrix;
	},

	/*
	 * The matrix of a model of FBX of its properties, some of them given anew (the values of a frame of a clip): T Roff Rp
	 * Rpre R Rpost⁻¹ Rp⁻¹ Soff Sp S Sp⁻¹.
	 */
	Local: function (props, given) {
		var graphics = this.$Service('Graphics3D');
		var own = given || {};

		function vector (name, fallback) {
			var value = own[name] || props[name];

			return value ? [Number(value[0]) || 0, Number(value[1]) || 0, Number(value[2]) || 0] : fallback;
		}

		function moved (value) {
			return graphics.Translation(value[0], value[1], value[2]);
		}

		var pivot = vector('RotationPivot', [0, 0, 0]);
		var scalePivot = vector('ScalingPivot', [0, 0, 0]);
		var scale = vector('Lcl Scaling', [1, 1, 1]);
		var order = props.RotationOrder ? Number(props.RotationOrder[0]) || 0 : 0;
		var parts = [
			moved(vector('Lcl Translation', [0, 0, 0])),
			moved(vector('RotationOffset', [0, 0, 0])),
			moved(pivot),
			this.Euler(vector('PreRotation', [0, 0, 0]), 0),
			this.Euler(vector('Lcl Rotation', [0, 0, 0]), order),
			graphics.Invert(this.Euler(vector('PostRotation', [0, 0, 0]), 0)),
			moved([-pivot[0], -pivot[1], -pivot[2]]),
			moved(vector('ScalingOffset', [0, 0, 0])),
			moved(scalePivot),
			graphics.Scaling(scale[0], scale[1], scale[2]),
			moved([-scalePivot[0], -scalePivot[1], -scalePivot[2]])
		];

		return parts.reduce(function (whole, part) {
			return graphics.Multiply(whole, part);
		});
	},

	/*
	 * A file as a model, in the very form Gltf gives (its asset): its nodes (the models of FBX, their pivots and turns made
	 * matrices), meshes of polygons in triangles, one for each material, materials of Phong made PBR, the pictures of
	 * its textures (inside it, or the files it names), skins (clusters) and clips (stacks), a file of Z up turned Y up.
	 */
	Read: function (data) {
		var self = this;
		var graphics = this.$Service('Graphics3D');
		var gltf = this.$Service('Gltf');
		var tree = data && data.Nodes ? data : this.Tree(data);
		var objects = this.Child(tree, 'Objects');
		var byID = {};
		var parents = {};
		var children = {};
		var models = [];
		var asset = {Nodes: [], Meshes: [], Materials: [], Images: [], Textures: [], Skins: [], Animations: [], Scene: [], Lights: []};
		var materials = {};
		var images = {};
		var settings = this.Properties(this.Child(tree, 'GlobalSettings'));

		if (!objects)
			throw new Error('Elemenx Fbx: a file with no objects');

		objects.Nodes.forEach(function (node) {
			var name = String(node.Props[1] || '');

			byID[String(node.Props[0])] = {Kind: node.Name, Name: name.indexOf('::') === -1 ? name : name.slice(name.indexOf('::') + 2), Type: node.Props[2] || '', Node: node, Props: self.Properties(node)};
		});

		this.Children(this.Child(tree, 'Connections'), 'C').forEach(function (link) {
			var from = String(link.Props[1]);
			var to = String(link.Props[2]);
			var edge = {From: from, To: to, Kind: link.Props[0], Prop: link.Props[3] || ''};

			(parents[from] = parents[from] || []).push(edge);
			(children[to] = children[to] || []).push(edge);
		});

		/* What is linked to an object, of a kind, by its property or any. */
		function under (id, kind, prop) {
			return (children[id] || []).filter(function (edge) {
				return byID[edge.From] && byID[edge.From].Kind === kind && (prop === undefined || edge.Prop === prop);
			}).map(function (edge) {
				return byID[edge.From];
			});
		}

		function over (id, kind) {
			return (parents[id] || []).filter(function (edge) {
				return byID[edge.To] && byID[edge.To].Kind === kind;
			}).map(function (edge) {
				return byID[edge.To];
			});
		}

		Object.keys(byID).forEach(function (id) {
			if (byID[id].Kind === 'Model') {
				byID[id].ID = id;
				byID[id].Index = models.length;

				models.push(byID[id]);
			}
		});

		/* The nodes: the matrix of each made of its properties. */
		models.forEach(function (model) {
			var node = gltf.Node({name: model.Name, matrix: self.Local(model.Props)});
			var up = over(model.ID, 'Model')[0];

			node.Parent = up ? up.Index : -1;
			node.Children = [];
			model.Node = node;

			asset.Nodes.push(node);
		});

		asset.Nodes.forEach(function (node, index) {
			if (node.Parent !== -1) asset.Nodes[node.Parent].Children.push(index);
			else asset.Scene.push(index);
		});

		/* A picture of a texture: of the video linked to it (its content, or the file it names), once. */
		function image (texture) {
			var video = under(texture.ID, 'Video')[0];
			var named = String(self.Child(texture.Node, 'RelativeFilename') && self.Child(texture.Node, 'RelativeFilename').Props[0] || self.Child(texture.Node, 'FileName') && self.Child(texture.Node, 'FileName').Props[0] || '');
			var content = video ? self.Child(video.Node, 'Content') : null;
			var key = video ? video.ID : named;
			var data = content ? content.Props[0] : null;
			var types = {png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', bmp: 'image/bmp', tga: 'image/x-tga'};
			var file;

			if (video && !named)
				named = String(self.Child(video.Node, 'RelativeFilename') && self.Child(video.Node, 'RelativeFilename').Props[0] || '');

			file = named.replace(/\\/g, '/');

			if (images[key] !== undefined) return images[key];

			if (typeof data === 'string' && data)
				data = gltf.Base64(data);

			if (!data || !data.length)
				data = null;

			images[key] = asset.Images.length;

			asset.Images.push({Data: data, Type: types[(file.split('.').pop() || '').toLowerCase()] || 'image/png', URI: data ? '' : file, Picture: null, Mean: null});

			return images[key];
		}

		function map (material, names) {
			var texture = null;

			names.some(function (name) {
				texture = under(material.ID, 'Texture', name)[0] || null;

				return !!texture;
			});

			if (!texture) return null;

			texture.ID = texture.ID || String(texture.Node.Props[0]);

			var props = self.Properties(texture.Node);
			var scaling = props.Scaling || [1, 1];
			var translation = props.Translation || [0, 0];

			return {Image: image(texture), Sampler: null, Set: 0, Offset: [Number(translation[0]) || 0, Number(translation[1]) || 0], Repeat: [Number(scaling[0]) || 1, Number(scaling[1]) || 1], Scale: 1, Strength: 1};
		}

		/* A material of Phong (or Lambert) as one of PBR: its color, its shine as roughness, its light, its pictures. */
		function material (made) {
			var props = made.Props;
			var color = props.DiffuseColor || props.Diffuse || [0.8, 0.8, 0.8];
			var factor = props.DiffuseFactor ? Number(props.DiffuseFactor[0]) : 1;
			var opacity = props.Opacity ? Number(props.Opacity[0]) : props.TransparencyFactor ? 1 - Number(props.TransparencyFactor[0]) : 1;
			var emissive = props.EmissiveColor || props.Emissive || [0, 0, 0];
			var glow = props.EmissiveFactor ? Number(props.EmissiveFactor[0]) : 1;
			var shine = props.ShininessExponent || props.Shininess;
			var result;

			made.ID = made.ID || String(made.Node.Props[0]);

			if (materials[made.ID] !== undefined) return materials[made.ID];

			result = gltf.Material({}, {});
			result.Name = made.Name;
			result.BaseColor = [color[0] * factor, color[1] * factor, color[2] * factor, opacity];
			result.Metallic = 0;
			result.Roughness = shine ? Math.max(0.05, Math.min(1, Math.sqrt(2 / (Number(shine[0]) + 2)))) : 0.8;
			result.Emissive = [emissive[0] * glow, emissive[1] * glow, emissive[2] * glow];
			result.ColorMap = map(made, ['DiffuseColor', 'Maya|baseColor', '3dsMax|Parameters|base_color_map']);
			result.NormalMap = map(made, ['NormalMap', 'Bump', 'Maya|normalCamera']);
			result.EmissiveMap = map(made, ['EmissiveColor', 'EmissiveFactor']);
			result.SpecularMap = map(made, ['SpecularColor', 'SpecularFactor']);
			result.Alpha = opacity < 0.999 || map(made, ['TransparentColor', 'TransparencyFactor']) ? 'BLEND' : 'OPAQUE';

			if (result.EmissiveMap && !(result.Emissive[0] + result.Emissive[1] + result.Emissive[2]))
				result.Emissive = [1, 1, 1];

			materials[made.ID] = asset.Materials.length;

			asset.Materials.push(result);

			return materials[made.ID];
		}

		/* The meshes of a model: its geometry in triangles, a part for each material, skinned by the clusters on it. */
		models.forEach(function (model) {
			var geometry = under(model.ID, 'Geometry')[0];
			var own = under(model.ID, 'Material');
			var geometric;
			var skin;

			if (!geometry || geometry.Type !== 'Mesh' && geometry.Type !== '') return;

			geometry.ID = String(geometry.Node.Props[0]);
			geometric = graphics.Multiply(graphics.Multiply(graphics.Translation.apply(graphics, (model.Props.GeometricTranslation || [0, 0, 0]).map(Number)), self.Euler((model.Props.GeometricRotation || [0, 0, 0]).map(Number), 0)), graphics.Scaling.apply(graphics, (model.Props.GeometricScaling || [1, 1, 1]).map(Number)));

			own.forEach(function (each) {
				each.ID = String(each.Node.Props[0]);
			});

			skin = under(geometry.ID, 'Deformer').filter(function (each) {
				return each.Type === 'Skin';
			})[0];

			var parts = self.Mesh(geometry.Node, geometric, skin ? self.Weights(skin, under, models) : null);
			if (!parts.length) return;

			model.Node.Mesh = asset.Meshes.length;

			asset.Meshes.push(parts.map(function (part) {
				return {Geometry: part.Geometry, Material: own[part.Material] ? material(own[part.Material]) : material({Name: '', Props: {}, Node: {Props: ['none']}, ID: 'none'})};
			}));

			if (skin) {
				model.Node.Skin = asset.Skins.length;

				asset.Skins.push(self.Weights(skin, under, models).Skin);
			}
		});

		if (!asset.Materials.length)
			asset.Materials.push(gltf.Material({}, {}));

		asset.Animations = this.Clips(byID, under, over, parents);

		/* A file of Z up: a node over all that turns it Y up. */
		if (settings.UpAxis && Number(settings.UpAxis[0]) === 2) {
			asset.Nodes.push({Name: 'Z up', Parent: -1, Children: asset.Scene.slice(), Translation: [0, 0, 0], Rotation: [-Math.SQRT1_2, 0, 0, Math.SQRT1_2], Scale: [1, 1, 1], Mesh: -1, Skin: -1, Light: -1});

			asset.Scene.forEach(function (index) {
				asset.Nodes[index].Parent = asset.Nodes.length - 1;
			});

			asset.Scene = [asset.Nodes.length - 1];
		}

		return asset;
	},

	/* The clusters of a skin: for each point of the geometry its four strongest bones, and the skin of the asset. */
	Weights: function (skin, under, models) {
		var graphics = this.$Service('Graphics3D');
		var self = this;
		var points = {};
		var joints = [];
		var inverse = [];

		if (skin.Made)
			return skin.Made;

		under(String(skin.Node.Props[0]), 'Deformer').forEach(function (cluster) {
			var bone = under(String(cluster.Node.Props[0]), 'Model')[0];
			var indexes = self.Child(cluster.Node, 'Indexes');
			var weights = self.Child(cluster.Node, 'Weights');
			var transform = self.Child(cluster.Node, 'Transform');
			var link = self.Child(cluster.Node, 'TransformLink');
			var joint;
			var i;

			if (!bone) return;

			joint = joints.length;

			joints.push(bone.Index);
			/* Transform is already the bone at the bind seen from the mesh (the inverse of its link, the mesh in it). */
			inverse.push(transform ? Array.from(transform.Props[0]) : graphics.Invert(link ? Array.from(link.Props[0]) : graphics.Identity()));

			if (!indexes || !weights) return;

			for (i = 0; i < indexes.Props[0].length; i++)
				(points[indexes.Props[0][i]] = points[indexes.Props[0][i]] || []).push([joint, weights.Props[0][i]]);
		});

		Object.keys(points).forEach(function (point) {
			var list = points[point].sort(function (a, b) {
				return b[1] - a[1];
			}).slice(0, 4);
			var total = list.reduce(function (sum, each) {
				return sum + each[1];
			}, 0) || 1;

			points[point] = list.map(function (each) {
				return [each[0], each[1] / total];
			});
		});

		skin.Made = {Points: points, Skin: {Joints: joints, Inverse: new Float32Array([].concat.apply([], inverse))}};

		return skin.Made;
	},

	/*
	 * A geometry of FBX in triangles: its polygons cut in fans, the values of its layers (normals, UVs, colors) as each
	 * maps and refers them, a part for each material; its points moved by the geometric matrix of its model.
	 */
	Mesh: function (node, geometric, skin) {
		var graphics = this.$Service('Graphics3D');
		var self = this;
		var vertices = (this.Child(node, 'Vertices') || {Props: [[]]}).Props[0];
		var polygons = (this.Child(node, 'PolygonVertexIndex') || {Props: [[]]}).Props[0];
		var normals = this.Child(node, 'LayerElementNormal');
		var uvs = this.Child(node, 'LayerElementUV');
		var colors = this.Child(node, 'LayerElementColor');
		var materials = this.Child(node, 'LayerElementMaterial');
		var turn = graphics.NormalMatrix(geometric);
		var parts = {};
		var polygon = 0;
		var corner = 0;
		var start = 0;
		var i;

		/* The index of the value of a layer for a corner of a polygon. */
		function layer (element, name) {
			var values;
			var index;
			var mapping;

			if (!element) return null;

			values = self.Child(element, name);
			index = self.Child(element, name + 'Index') || self.Child(element, name === 'Normals' ? 'NormalsIndex' : name + 'Index');
			mapping = String((self.Child(element, 'MappingInformationType') || {Props: ['']}).Props[0]);

			if (!values)
				return null;

			return {Values: values.Props[0], Index: index ? index.Props[0] : null, Mapping: mapping, Direct: String((self.Child(element, 'ReferenceInformationType') || {Props: ['Direct']}).Props[0]) === 'Direct'};
		}

		function at (element, point, polygon, corner) {
			var index;

			if (element.Mapping === 'ByPolygonVertex') index = corner;
			else if (element.Mapping === 'ByPolygon') index = polygon;
			else if (element.Mapping === 'AllSame') index = 0;
			else index = point;

			return !element.Direct && element.Index ? element.Index[index] : index;
		}

		var normal = layer(normals, 'Normals');
		var uv = layer(uvs, 'UV');
		var color = layer(colors, 'Colors');
		var chosen = layer(materials, 'Materials');

		function part (index) {
			if (!parts[index])
				parts[index] = {Material: index, Keys: {}, Geometry: {Positions: [], Normals: [], UVs: [], Colors: color ? [] : null, Indices: [], Joints: skin ? [] : null, Weights: skin ? [] : null}};

			return parts[index];
		}

		/* A corner as a vertex of its part: the same point with the same values is one vertex. */
		function vertex (made, point, polygonIndex, cornerIndex) {
			var n = normal ? at(normal, point, polygonIndex, cornerIndex) : -1;
			var t = uv ? at(uv, point, polygonIndex, cornerIndex) : -1;
			var c = color ? at(color, point, polygonIndex, cornerIndex) : -1;
			var key = point + ':' + n + ':' + t + ':' + c;
			var geometry = made.Geometry;
			var place;
			var way;
			var bones;
			var j;

			if (made.Keys[key] !== undefined) return made.Keys[key];

			made.Keys[key] = geometry.Positions.length / 3;
			place = graphics.Apply(geometric, [vertices[point * 3], vertices[point * 3 + 1], vertices[point * 3 + 2]]);

			geometry.Positions.push(place[0], place[1], place[2]);

			if (normal) {
				way = graphics.Vectors.Normalize([turn[0] * normal.Values[n * 3] + turn[3] * normal.Values[n * 3 + 1] + turn[6] * normal.Values[n * 3 + 2], turn[1] * normal.Values[n * 3] + turn[4] * normal.Values[n * 3 + 1] + turn[7] * normal.Values[n * 3 + 2], turn[2] * normal.Values[n * 3] + turn[5] * normal.Values[n * 3 + 1] + turn[8] * normal.Values[n * 3 + 2]]);

				geometry.Normals.push(way[0], way[1], way[2]);
			}

			if (uv)
				geometry.UVs.push(uv.Values[t * 2], 1 - uv.Values[t * 2 + 1]);

			if (color)
				geometry.Colors.push(color.Values[c * 4], color.Values[c * 4 + 1], color.Values[c * 4 + 2]);

			if (skin) {
				bones = skin.Points[point] || [];

				for (j = 0; j < 4; j++) {
					geometry.Joints.push(bones[j] ? bones[j][0] : 0);
					geometry.Weights.push(bones[j] ? bones[j][1] : 0);
				}
			}

			return made.Keys[key];
		}

		for (i = 0; i < polygons.length; i++) {
			if (polygons[i] >= 0) continue;

			var count = i - start + 1;
			var made = part(chosen ? chosen.Values[chosen.Mapping === 'AllSame' ? 0 : polygon] || 0 : 0);
			var corners = [];
			var k;

			for (k = 0; k < count; k++) {
				var point = polygons[start + k] < 0 ? -polygons[start + k] - 1 : polygons[start + k];

				corners.push(vertex(made, point, polygon, corner + k));
			}

			for (k = 1; k + 1 < count; k++)
				made.Geometry.Indices.push(corners[0], corners[k], corners[k + 1]);

			corner += count;
			polygon++;
			start = i + 1;
		}

		return Object.keys(parts).sort(function (a, b) {
			return a - b;
		}).map(function (key) {
			var geometry = parts[key].Geometry;
			if (!geometry.Normals.length)
				geometry = graphics.Normals(geometry);

			if (!geometry.Colors)
				delete geometry.Colors;

			if (!geometry.Joints)
				delete geometry.Joints;

			if (!geometry.Joints)
				delete geometry.Weights;

			return {Material: parts[key].Material, Geometry: geometry};
		});
	},

	/*
	 * The clips of a file, a stack each: the curves of each model sampled at all their keys and made its matrix, given
	 * as its translation, rotation (quaternions) and scale, as Gltf gives a clip.
	 */
	Clips: function (byID, under, over, parents) {
		var self = this;
		var gltf = this.$Service('Gltf');

		return Object.keys(byID).filter(function (id) {
			return byID[id].Kind === 'AnimationStack';
		}).map(function (id, index) {
			var stack = byID[id];
			var start = stack.Props.LocalStart ? Number(stack.Props.LocalStart[0]) / self.Second : 0;
			var layer = under(id, 'AnimationLayer')[0];
			var moved = {};
			var length = 0;
			var channels = [];

			(layer ? under(String(layer.Node.Props[0]), 'AnimationCurveNode') : []).forEach(function (node) {
				var nodeID = String(node.Node.Props[0]);
				var target = over(nodeID, 'Model')[0];
				var prop = ((parents[nodeID] || []).filter(function (edge) {
					return byID[edge.To] && byID[edge.To].Kind === 'Model';
				})[0] || {}).Prop || '';
				var curves = [];

				if (!target) return;

				['d|X', 'd|Y', 'd|Z'].forEach(function (axis, at) {
					var curve = under(nodeID, 'AnimationCurve', axis)[0];
					var times = curve ? self.Child(curve.Node, 'KeyTime') : null;
					var values = curve ? self.Child(curve.Node, 'KeyValueFloat') : null;

					curves[at] = times && values ? {Times: Array.prototype.map.call(times.Props[0], function (time) {
						return time / self.Second - start;
					}), Values: Array.from(values.Props[0])} : null;
				});

				moved[target.Index] = moved[target.Index] || {Model: target};
				moved[target.Index][prop] = {Curves: curves, Rest: node.Props['d|X'] ? [node.Props['d|X'][0], node.Props['d|Y'][0], node.Props['d|Z'][0]] : null};
			});

			Object.keys(moved).forEach(function (index) {
				var own = moved[index];
				var times = [];
				var translations = [];
				var rotations = [];
				var scales = [];

				['Lcl Translation', 'Lcl Rotation', 'Lcl Scaling'].forEach(function (prop) {
					(own[prop] ? own[prop].Curves : []).forEach(function (curve) {
						if (curve)
							times = times.concat(curve.Times);
					});
				});

				times = times.sort(function (a, b) {
					return a - b;
				}).filter(function (time, at) {
					return !at || time - times[at - 1] > 1e-6;
				});

				times.forEach(function (time) {
					var given = {};
					var node;
					var last = rotations.length ? rotations.slice(-4) : null;

					['Lcl Translation', 'Lcl Rotation', 'Lcl Scaling'].forEach(function (prop) {
						var rest;

						if (!own[prop]) return;

						rest = own[prop].Rest || own.Model.Props[prop] || (prop === 'Lcl Scaling' ? [1, 1, 1] : [0, 0, 0]);
						given[prop] = own[prop].Curves.map(function (curve, axis) {
							return self.Sample(curve, time, Number(rest[axis]) || 0);
						});
					});

					node = gltf.Node({matrix: self.Local(own.Model.Props, given)});

					/* The shortest way from the last turn: no flip between keys. */
					if (last && last[0] * node.Rotation[0] + last[1] * node.Rotation[1] + last[2] * node.Rotation[2] + last[3] * node.Rotation[3] < 0)
						node.Rotation = node.Rotation.map(function (value) {
							return -value;
						});

					translations.push(node.Translation[0], node.Translation[1], node.Translation[2]);
					rotations.push(node.Rotation[0], node.Rotation[1], node.Rotation[2], node.Rotation[3]);
					scales.push(node.Scale[0], node.Scale[1], node.Scale[2]);
				});

				if (!times.length) return;

				length = Math.max(length, times[times.length - 1]);

				channels.push({Node: Number(index), Path: 'translation', Times: new Float32Array(times), Values: new Float32Array(translations), Size: 3, Step: false, Cubic: false});
				channels.push({Node: Number(index), Path: 'rotation', Times: new Float32Array(times), Values: new Float32Array(rotations), Size: 4, Step: false, Cubic: false});
				channels.push({Node: Number(index), Path: 'scale', Times: new Float32Array(times), Values: new Float32Array(scales), Size: 3, Step: false, Cubic: false});
			});

			return {Name: stack.Name || 'Clip ' + (index + 1), Length: length, Channels: channels};
		}).filter(function (clip) {
			return clip.Channels.length;
		});
	},

	/* A value of a type of its own for a writer (I int, L long, D double, S text, l a list of longs): Typed('L', id). */
	Typed: function (type, value) {
		return {Type: type, Value: value};
	},

	/*
	 * A tree as a binary file (version 7400): the values of their types (numbers are doubles unless Typed, typed arrays of
	 * their kind, a Uint8Array raw), Class::Name of the objects as the binary file writes it, and the footer it ends with.
	 */
	Binary: function (tree) {
		var chunks = [];
		var size = 0;
		var encoder = new TextEncoder();
		var head = encoder.encode('Kaydara FBX Binary  ');

		function push (bytes) {
			chunks.push(bytes);

			size += bytes.length;
		}

		function number (type, value) {
			var bytes = new Uint8Array({Y: 2, C: 1, I: 4, F: 4, D: 8, L: 8}[type] + 1);
			var view = new DataView(bytes.buffer);

			bytes[0] = type.charCodeAt(0);

			if (type === 'Y') view.setInt16(1, value, true);
			else if (type === 'C') view.setUint8(1, value ? 1 : 0);
			else if (type === 'I') view.setInt32(1, value, true);
			else if (type === 'F') view.setFloat32(1, value, true);
			else if (type === 'D') view.setFloat64(1, value, true);
			else long(view, 1, value);

			return bytes;
		}

		function long (view, at, value) {
			var high = Math.floor(value / 4294967296);

			view.setUint32(at, value - high * 4294967296, true);
			view.setInt32(at + 4, high, true);
		}

		function sized (type, data) {
			var bytes = new Uint8Array(5 + data.length);

			bytes[0] = type.charCodeAt(0);

			new DataView(bytes.buffer).setUint32(1, data.length, true);

			bytes.set(data, 5);

			return bytes;
		}

		function list (type, values) {
			var width = {f: 4, d: 8, l: 8, i: 4, b: 1}[type];
			var bytes = new Uint8Array(13 + values.length * width);
			var view = new DataView(bytes.buffer);
			var i;

			bytes[0] = type.charCodeAt(0);

			view.setUint32(1, values.length, true);
			view.setUint32(5, 0, true);
			view.setUint32(9, values.length * width, true);

			for (i = 0; i < values.length; i++) {
				if (type === 'f') view.setFloat32(13 + i * 4, values[i], true);
				else if (type === 'd') view.setFloat64(13 + i * 8, values[i], true);
				else if (type === 'i') view.setInt32(13 + i * 4, values[i], true);
				else if (type === 'b') view.setUint8(13 + i, values[i] ? 1 : 0);
				else long(view, 13 + i * 8, values[i]);
			}

			return bytes;
		}

		function prop (value, named) {
			var parts;

			if (value && value.Type && value.Value !== undefined) {
				if ('fdlib'.indexOf(value.Type) !== -1) return list(value.Type, value.Value);

				if (value.Type === 'S')
					return sized('S', encoder.encode(String(value.Value)));

				return number(value.Type, value.Value);
			}

			if (typeof value === 'string') {
				parts = named ? /^(\w+)::([\s\S]*)$/.exec(value) : null;

				if (parts) {
					var name = encoder.encode(parts[2]);
					var kind = encoder.encode(parts[1]);
					var joined = new Uint8Array(name.length + 2 + kind.length);

					joined.set(name, 0);

					joined[name.length + 1] = 1;

					joined.set(kind, name.length + 2);

					return sized('S', joined);
				}

				return sized('S', encoder.encode(value));
			}

			if (value instanceof Float64Array) return list('d', value);
			if (value instanceof Float32Array) return list('f', value);
			if (value instanceof Int32Array) return list('i', value);
			if (value instanceof Uint8Array) return sized('R', value);
			if (typeof value === 'boolean') return number('C', value);

			return number('D', Number(value) || 0);
		}

		/* A record: its end, the count and the length of its values, its name, its values, its children and a null record. */
		function record (node, start, named) {
			var values = node.Props.map(function (value, index) {
				return prop(value, named && index === 1);
			});
			var length = values.reduce(function (sum, each) {
				return sum + each.length;
			}, 0);
			var name = encoder.encode(node.Name);
			var top = new Uint8Array(13 + name.length);
			var view = new DataView(top.buffer);
			var at = start + top.length + length;
			var inner = [];

			node.Nodes.forEach(function (child) {
				var made = record(child, at, node.Name === 'Objects');

				inner.push(made);

				at += made.Size;
			});

			if (node.Nodes.length)
				at += 13;

			view.setUint32(0, at, true);
			view.setUint32(4, values.length, true);
			view.setUint32(8, length, true);

			top[12] = name.length;

			top.set(name, 13);

			return {Size: at - start, Write: function () {
				push(top);

				values.forEach(push);

				inner.forEach(function (child) {
					child.Write();
				});

				if (node.Nodes.length)
					push(new Uint8Array(13));
			}};
		}

		var start = new Uint8Array(27);
		var at = 27;

		start.set(head, 0);

		start[21] = 0x1a;

		new DataView(start.buffer).setUint32(23, 7400, true);

		push(start);

		tree.Nodes.forEach(function (node) {
			var made = record(node, at, false);

			at += made.Size;

			made.Write();
		});

		push(new Uint8Array(13));

		/* The footer: its mark, the version again, and the closing mark. */
		push(new Uint8Array([0xfa, 0xbc, 0xab, 0x09, 0xd0, 0xc8, 0xd4, 0x66, 0xb1, 0x76, 0xfb, 0x83, 0x1c, 0xf7, 0x26, 0x7e]));
		push(new Uint8Array(4));
		push(new Uint8Array(16 - size % 16 || 16));

		var tail = new Uint8Array(4 + 120 + 16);

		new DataView(tail.buffer).setUint32(0, 7400, true);

		tail.set([0xf8, 0x5a, 0x8c, 0x6a, 0xde, 0xf5, 0xd9, 0x7e, 0xec, 0xe9, 0x0c, 0xe3, 0x75, 0x8f, 0x29, 0x0b], 124);

		push(tail);

		var whole = new Uint8Array(size);

		at = 0;

		chunks.forEach(function (chunk) {
			whole.set(chunk, at);

			at += chunk.length;
		});

		return whole.buffer;
	},

	/* A tree as a file of text (version 7400), the very form Tree reads back. */
	Text: function (tree) {
		var lines = ['; FBX 7.4.0 project file', '; Made by Elemenx', ''];

		function value (each) {
			var given = each && each.Type && each.Value !== undefined ? each.Value : each;
			if (typeof given === 'string')
				return '"' + given.replace(/"/g, '&quot;') + '"';

			if (typeof given === 'boolean') return given ? 'T' : 'F';

			return String(given);
		}

		function write (node, depth) {
			var tabs = new Array(depth + 1).join('\t');
			var given = node.Props[0] && node.Props[0].Type && node.Props[0].Value !== undefined ? node.Props[0].Value : node.Props[0];

			/* A list: *count { a: numbers }. */
			if (node.Props.length === 1 && given && given.length !== undefined && typeof given !== 'string' && !(given instanceof Uint8Array)) {
				lines.push(tabs + node.Name + ': *' + given.length + ' {', tabs + '\ta: ' + Array.prototype.join.call(given, ','), tabs + '}');

				return;
			}

			if (given instanceof Uint8Array) {
				lines.push(tabs + node.Name + ': "' + btoa(Array.prototype.map.call(given, function (code) {
					return String.fromCharCode(code);
				}).join('')) + '"');

				return;
			}

			lines.push(tabs + node.Name + ': ' + node.Props.map(value).join(', ') + (node.Nodes.length ? ' {' : ''));

			node.Nodes.forEach(function (child) {
				write(child, depth + 1);
			});

			if (node.Nodes.length)
				lines.push(tabs + '}');
		}

		tree.Nodes.forEach(function (node) {
			write(node, 0);
		});

		return lines.join('\n') + '\n';
	},

	/*
	 * An asset (as Read and Gltf give it) as a tree of FBX: its nodes as models (bones of its skins LimbNode), a geometry
	 * for each mesh with a layer of materials, materials of Phong with their pictures inside, skins as clusters, clips
	 * as stacks of curves of degrees.
	 */
	FromAsset: function (asset) {
		var self = this;
		var graphics = this.$Service('Graphics3D');
		var typed = this.Typed;
		var objects = [];
		var links = [];
		var next = 1000;
		var nodeIDs = [];
		var materialIDs = [];
		var bones = {};
		var counts = {};

		function id () {
			next += 1;

			return next;
		}

		function node (name, props, children) {
			return {Name: name, Props: props || [], Nodes: children || []};
		}

		function p (name, type, label, flags, values) {
			return node('P', [name, type, label, flags].concat(values));
		}

		function object (kind, own, name, type, children) {
			counts[kind] = (counts[kind] || 0) + 1;

			objects.push(node(kind, [typed('L', own), kind + '::' + name, type], children));
		}

		function link (kind, from, to, prop) {
			links.push(node('C', [kind, typed('L', from), typed('L', to)].concat(prop ? [prop] : [])));
		}

		/* A quaternion as degrees of FBX, x turning first. */
		function degrees (q) {
			var x = q[0];
			var y = q[1];
			var z = q[2];
			var w = q[3];
			var sinY = Math.max(-1, Math.min(1, 2 * (w * y - z * x)));

			return [Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y)) * 180 / Math.PI, Math.asin(sinY) * 180 / Math.PI, Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z)) * 180 / Math.PI];
		}

		(asset.Skins || []).forEach(function (skin) {
			skin.Joints.forEach(function (joint) {
				bones[joint] = true;
			});
		});

		asset.Nodes.forEach(function (each, index) {
			var own = id();
			var turn = degrees(each.Rotation || [0, 0, 0, 1]);
			var type = each.Mesh !== -1 && each.Mesh !== undefined ? 'Mesh' : bones[index] ? 'LimbNode' : 'Null';

			nodeIDs.push(own);

			if (type !== 'Mesh') {
				var attribute = id();

				object('NodeAttribute', attribute, each.Name || 'node' + index, type, type === 'LimbNode' ? [node('TypeFlags', ['Skeleton'])] : [node('TypeFlags', ['Null'])]);

				link('OO', attribute, own);
			}

			object('Model', own, each.Name || 'node' + index, type, [
				node('Version', [typed('I', 232)]),
				node('Properties70', [], [
					p('Lcl Translation', 'Lcl Translation', '', 'A', (each.Translation || [0, 0, 0]).slice()),
					p('Lcl Rotation', 'Lcl Rotation', '', 'A', turn),
					p('Lcl Scaling', 'Lcl Scaling', '', 'A', (each.Scale || [1, 1, 1]).slice())
				]),
				node('Culling', ['CullingOff'])
			]);
		});

		asset.Nodes.forEach(function (each, index) {
			link('OO', nodeIDs[index], each.Parent === -1 || each.Parent === undefined ? 0 : nodeIDs[each.Parent]);
		});

		/* The pictures of a material inside it: a texture and its video. */
		function texture (map, material, prop) {
			var image = map ? asset.Images[map.Image] : null;
			var own;
			var video;
			var name;

			if (!image || !image.Data && !image.URI) return;

			own = id();
			video = id();
			name = image.URI || 'picture' + map.Image + '.' + ((image.Type || 'image/png').split('/')[1] || 'png').replace('jpeg', 'jpg');

			object('Video', video, name, 'Clip', [node('Type', ['Clip']), node('RelativeFilename', [name])].concat(image.Data ? [node('Content', [image.Data instanceof Uint8Array ? image.Data : new Uint8Array(image.Data)])] : []));
			object('Texture', own, name, '', [node('Type', ['TextureVideoClip']), node('FileName', [name]), node('RelativeFilename', [name])]);

			link('OO', video, own);
			link('OP', own, material, prop);
		}

		(asset.Materials || []).forEach(function (material, index) {
			var own = id();
			var color = material.BaseColor || [1, 1, 1, 1];
			var rough = Math.max(0.05, material.Roughness === undefined ? 1 : material.Roughness);

			materialIDs.push(own);

			object('Material', own, material.Name || 'material' + index, '', [
				node('Version', [typed('I', 102)]),
				node('ShadingModel', ['phong']),
				node('Properties70', [], [
					p('DiffuseColor', 'Color', '', 'A', [color[0], color[1], color[2]]),
					p('DiffuseFactor', 'Number', '', 'A', [1]),
					p('Opacity', 'Number', '', 'A', [color[3] === undefined ? 1 : color[3]]),
					p('EmissiveColor', 'Color', '', 'A', (material.Emissive || [0, 0, 0]).slice(0, 3)),
					p('EmissiveFactor', 'Number', '', 'A', [1]),
					p('Shininess', 'Number', '', 'A', [2 / (rough * rough) - 2]),
					p('ShininessExponent', 'Number', '', 'A', [2 / (rough * rough) - 2])
				])
			]);

			texture(material.ColorMap, own, 'DiffuseColor');
			texture(material.NormalMap, own, 'NormalMap');
			texture(material.EmissiveMap, own, 'EmissiveColor');
		});

		/* A mesh: the parts of its materials in one geometry, a polygon for each triangle, the layers by corner. */
		asset.Nodes.forEach(function (each, index) {
			var parts = each.Mesh === -1 || each.Mesh === undefined ? null : asset.Meshes[each.Mesh];
			var vertices = [];
			var polygons = [];
			var normals = [];
			var normalIndex = [];
			var uvs = [];
			var uvIndex = [];
			var chosen = [];
			var used = [];
			var skinned = [];
			var geometry;

			if (!parts) return;

			parts.forEach(function (part) {
				var shape = part.Geometry;
				var base = vertices.length / 3;
				var slot = used.indexOf(part.Material);
				var i;

				if (slot === -1) {
					slot = used.length;

					used.push(part.Material);
				}

				for (i = 0; i < shape.Positions.length; i++)
					vertices.push(shape.Positions[i]);

				/* A normal and a UV for each vertex, its corners pointing at them: the same vertex comes back as one. */
				for (i = 0; i < shape.Positions.length / 3; i++) {
					if (shape.Normals && shape.Normals.length)
						normals.push(shape.Normals[i * 3], shape.Normals[i * 3 + 1], shape.Normals[i * 3 + 2]);

					if (shape.UVs && shape.UVs.length)
						uvs.push(shape.UVs[i * 2], 1 - shape.UVs[i * 2 + 1]);

					if (shape.Joints && shape.Weights)
						skinned[base + i] = [Array.from(shape.Joints.slice(i * 4, i * 4 + 4)), Array.from(shape.Weights.slice(i * 4, i * 4 + 4))];
				}

				var indices = shape.Indices && shape.Indices.length ? shape.Indices : Array.from({length: shape.Positions.length / 3}, function (value, at) {
					return at;
				});

				for (i = 0; i + 2 < indices.length; i += 3) {
					[indices[i], indices[i + 1], indices[i + 2]].forEach(function (corner, k) {
						polygons.push(k === 2 ? -(base + corner) - 1 : base + corner);

						if (shape.Normals && shape.Normals.length)
							normalIndex.push(base + corner);

						if (shape.UVs && shape.UVs.length)
							uvIndex.push(base + corner);
					});

					chosen.push(slot);
				}
			});

			geometry = id();

			object('Geometry', geometry, each.Name || 'mesh' + index, 'Mesh', [
				node('Vertices', [new Float64Array(vertices)]),
				node('PolygonVertexIndex', [new Int32Array(polygons)]),
				node('GeometryVersion', [typed('I', 124)])
			].concat(normals.length ? [node('LayerElementNormal', [typed('I', 0)], [node('Version', [typed('I', 101)]), node('Name', ['']), node('MappingInformationType', ['ByPolygonVertex']), node('ReferenceInformationType', ['IndexToDirect']), node('Normals', [new Float64Array(normals)]), node('NormalsIndex', [new Int32Array(normalIndex)])])] : []).concat(uvs.length ? [node('LayerElementUV', [typed('I', 0)], [node('Version', [typed('I', 101)]), node('Name', ['map1']), node('MappingInformationType', ['ByPolygonVertex']), node('ReferenceInformationType', ['IndexToDirect']), node('UV', [new Float64Array(uvs)]), node('UVIndex', [new Int32Array(uvIndex)])])] : []).concat([
				node('LayerElementMaterial', [typed('I', 0)], [node('Version', [typed('I', 101)]), node('Name', ['']), node('MappingInformationType', ['ByPolygon']), node('ReferenceInformationType', ['IndexToDirect']), node('Materials', [new Int32Array(chosen)])]),
				node('Layer', [typed('I', 0)], [node('Version', [typed('I', 100)])].concat(['LayerElementNormal', 'LayerElementUV', 'LayerElementMaterial'].filter(function (name) {
					return name !== 'LayerElementNormal' || normals.length;
				}).filter(function (name) {
					return name !== 'LayerElementUV' || uvs.length;
				}).map(function (name) {
					return node('LayerElement', [], [node('Type', [name]), node('TypedIndex', [typed('I', 0)])]);
				})))
			]));

			link('OO', geometry, nodeIDs[index]);

			used.forEach(function (material) {
				link('OO', materialIDs[material] || materialIDs[0], nodeIDs[index]);
			});

			/* Its skin: a cluster for each bone, the points it moves and how much, its bind (the inverse) and its link. */
			if (each.Skin !== -1 && each.Skin !== undefined && asset.Skins[each.Skin]) {
				var skin = asset.Skins[each.Skin];
				var deformer = id();

				object('Deformer', deformer, 'Skin', 'Skin', [node('Version', [typed('I', 101)]), node('Link_DeformAcuracy', [50])]);

				link('OO', deformer, geometry);

				skin.Joints.forEach(function (joint, at) {
					var cluster = id();
					var points = [];
					var weights = [];
					var inverse = skin.Inverse ? Array.from(skin.Inverse.slice(at * 16, at * 16 + 16)) : graphics.Identity();

					skinned.forEach(function (bound, point) {
						var k;

						for (k = 0; k < 4; k++) {
							if (bound[0][k] === at && bound[1][k] > 0) {
								points.push(point);
								weights.push(bound[1][k]);
							}
						}
					});

					object('Deformer', cluster, asset.Nodes[joint].Name || 'bone' + joint, 'Cluster', [node('Version', [typed('I', 100)]), node('UserData', ['', '']), node('Indexes', [new Int32Array(points)]), node('Weights', [new Float64Array(weights)]), node('Transform', [new Float64Array(inverse)]), node('TransformLink', [new Float64Array(graphics.Invert(inverse) || graphics.Identity())])]);

					link('OO', cluster, deformer);
					link('OO', nodeIDs[joint], cluster);
				});
			}
		});

		/* The clips: a stack and a layer each, a node of curves for each moved property of a model. */
		(asset.Animations || []).forEach(function (clip) {
			var stack = id();
			var layer = id();
			var moved = {};
			var ticks = function (seconds) {
				return Math.round(seconds * self.Second);
			};

			object('AnimationStack', stack, clip.Name || 'Take', '', [node('Properties70', [], [p('LocalStop', 'KTime', 'Time', '', [typed('L', ticks(clip.Length || 0))]), p('ReferenceStop', 'KTime', 'Time', '', [typed('L', ticks(clip.Length || 0))])])]);
			object('AnimationLayer', layer, 'BaseLayer', '', []);

			link('OO', layer, stack);

			clip.Channels.forEach(function (channel) {
				var values = [];
				var size = channel.Size || (channel.Path === 'rotation' ? 4 : 3);
				var curveNode = id();
				var prop = {translation: 'Lcl Translation', rotation: 'Lcl Rotation', scale: 'Lcl Scaling'}[channel.Path];
				var i;

				if (!prop || nodeIDs[channel.Node] === undefined) return;

				for (i = 0; i < channel.Times.length; i++) {
					var given = Array.from(channel.Values.slice(i * size, i * size + size));

					values.push(channel.Path === 'rotation' ? degrees(given) : given);
				}

				/* Degrees go on from the last key, not back round. */
				if (channel.Path === 'rotation') {
					for (i = 1; i < values.length; i++) {
						values[i] = values[i].map(function (angle, axis) {
							return angle + Math.round((values[i - 1][axis] - angle) / 360) * 360;
						});
					}
				}

				moved[channel.Node + prop] = true;

				object('AnimationCurveNode', curveNode, {translation: 'T', rotation: 'R', scale: 'S'}[channel.Path], '', [node('Properties70', [], ['d|X', 'd|Y', 'd|Z'].map(function (name, axis) {
					return p(name, 'Number', '', 'A', [values.length ? values[0][axis] : 0]);
				}))]);

				link('OO', curveNode, layer);
				link('OP', curveNode, nodeIDs[channel.Node], prop);

				['d|X', 'd|Y', 'd|Z'].forEach(function (name, axis) {
					var curve = id();

					object('AnimationCurve', curve, '', '', [
						node('Default', [values.length ? values[0][axis] : 0]),
						node('KeyVer', [typed('I', 4008)]),
						node('KeyTime', [typed('l', Array.prototype.map.call(channel.Times, ticks))]),
						node('KeyValueFloat', [new Float32Array(values.map(function (each) {
							return each[axis];
						}))]),
						node('KeyAttrFlags', [new Int32Array([24840])]),
						node('KeyAttrDataFloat', [new Float32Array([0, 0, 0, 0])]),
						node('KeyAttrRefCount', [new Int32Array([channel.Times.length])])
					]);

					link('OP', curve, curveNode, name);
				});
			});
		});

		return {Version: 7400, Nodes: [
			node('FBXHeaderExtension', [], [node('FBXHeaderVersion', [typed('I', 1003)]), node('FBXVersion', [typed('I', 7400)]), node('Creator', ['Elemenx'])]),
			node('FileId', [new Uint8Array([0x28, 0xb3, 0x2a, 0xeb, 0xb6, 0x24, 0xcc, 0xc2, 0xbf, 0xc8, 0xb0, 0x2a, 0xa9, 0x2b, 0xfc, 0xf1])]),
			node('CreationTime', ['1970-01-01 10:00:00:000']),
			node('Creator', ['Elemenx']),
			node('GlobalSettings', [], [node('Version', [typed('I', 1000)]), node('Properties70', [], [
				p('UpAxis', 'int', 'Integer', '', [typed('I', 1)]),
				p('UpAxisSign', 'int', 'Integer', '', [typed('I', 1)]),
				p('FrontAxis', 'int', 'Integer', '', [typed('I', 2)]),
				p('FrontAxisSign', 'int', 'Integer', '', [typed('I', 1)]),
				p('CoordAxis', 'int', 'Integer', '', [typed('I', 0)]),
				p('CoordAxisSign', 'int', 'Integer', '', [typed('I', 1)]),
				p('UnitScaleFactor', 'double', 'Number', '', [100])
			])]),
			node('Documents', [], [node('Count', [typed('I', 1)])]),
			node('References', []),
			node('Definitions', [], [node('Version', [typed('I', 100)]), node('Count', [typed('I', objects.length)])].concat(Object.keys(counts).map(function (kind) {
				return node('ObjectType', [kind], [node('Count', [typed('I', counts[kind])])]);
			}))),
			node('Objects', [], objects),
			node('Connections', [], links)
		]};
	},

	/* An asset as a file of FBX: binary (an ArrayBuffer) by default, text with {Text: true}. */
	Write: function (asset, options) {
		var tree = this.FromAsset(asset);

		return options && options.Text ? this.Text(tree) : this.Binary(tree);
	},

	/* The properties of an object (Properties70, or Properties60 of older files): {name: [values]}. */
	Properties: function (node) {
		var found = {};
		var block = this.Child(node, 'Properties70') || this.Child(node, 'Properties60');

		(block ? block.Nodes : []).forEach(function (each) {
			found[each.Props[0]] = each.Props.slice(block.Name === 'Properties70' ? 4 : 3);
		});

		return found;
	}
});
