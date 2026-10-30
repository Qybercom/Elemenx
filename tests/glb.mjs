/*
 * A small model of glTF made by hand, for the tests and the example of the catalogue: a column of two bones that bends
 * (a skin, an animation Bend), a box that a node turns (an animation Spin), a material with a picture of 2 by 2.
 * Binary(options) returns the bytes of a .glb; options Png the bytes of the picture, Required the extensions it requires.
 */
function align (bytes) {
	var padded = new Uint8Array(bytes.length + (4 - bytes.length % 4) % 4);

	padded.set(bytes);

	return padded;
}

function floats (list) {
	return new Uint8Array(new Float32Array(list).buffer);
}

function shorts (list) {
	return new Uint8Array(new Uint16Array(list).buffer);
}

function matrices (list) {
	return floats([].concat.apply([], list));
}

function translation (x, y, z) {
	return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
}

/* A column of rings round the axis Y: its positions, normals, joints, weights and faces. */
function column (rings, sides, height, radius) {
	var geometry = {Positions: [], Normals: [], UVs: [], Joints: [], Weights: [], Indices: []};
	var ring;
	var side;

	for (ring = 0; ring <= rings; ring++) {
		var y = ring / rings * height;
		var upper = ring / rings;

		for (side = 0; side < sides; side++) {
			var angle = side / sides * Math.PI * 2;

			geometry.Positions.push(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
			geometry.Normals.push(Math.cos(angle), 0, Math.sin(angle));
			geometry.UVs.push(side / sides, upper);
			geometry.Joints.push(0, 1, 0, 0);
			geometry.Weights.push(1 - upper, upper, 0, 0);
		}
	}

	for (ring = 0; ring < rings; ring++) {
		for (side = 0; side < sides; side++) {
			var a = ring * sides + side;
			var b = ring * sides + (side + 1) % sides;
			var c = a + sides;
			var d = b + sides;

			geometry.Indices.push(a, c, b, b, c, d);
		}
	}

	return geometry;
}

export var Picture = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0, 144, 119, 83, 222, 0, 0, 0, 12, 73, 68, 65, 84, 8, 215, 99, 248, 207, 192, 0, 0, 3, 1, 1, 0, 24, 221, 141, 176, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);

export function Binary (options) {
	var settings = options || {};
	var shape = column(6, 8, 2, 0.25);
	var parts = [];
	var views = [];
	var accessors = [];
	var at = 0;
	var half = Math.SQRT1_2;

	function add (bytes, target) {
		var padded = align(bytes);
		var view = {buffer: 0, byteOffset: at, byteLength: bytes.length};

		if (target)
			view.target = target;

		views.push(view);
		parts.push(padded);

		at += padded.length;

		return views.length - 1;
	}

	function accessor (bytes, type, kind, count, bounds) {
		var made = Object.assign({bufferView: add(bytes), componentType: kind, count: count, type: type}, bounds || {});

		accessors.push(made);

		return accessors.length - 1;
	}

	var positions = accessor(floats(shape.Positions), 'VEC3', 5126, shape.Positions.length / 3, {min: [-0.25, 0, -0.25], max: [0.25, 2, 0.25]});
	var normals = accessor(floats(shape.Normals), 'VEC3', 5126, shape.Normals.length / 3);
	var uvs = accessor(floats(shape.UVs), 'VEC2', 5126, shape.UVs.length / 2);
	var joints = accessor(shorts(shape.Joints), 'VEC4', 5123, shape.Joints.length / 4);
	var weights = accessor(floats(shape.Weights), 'VEC4', 5126, shape.Weights.length / 4);
	var indices = accessor(shorts(shape.Indices), 'SCALAR', 5123, shape.Indices.length);
	var boxPositions = accessor(floats([-0.2, 0, -0.2, 0.2, 0, -0.2, 0.2, 0, 0.2, -0.2, 0, 0.2, -0.2, 0.4, -0.2, 0.2, 0.4, -0.2, 0.2, 0.4, 0.2, -0.2, 0.4, 0.2]), 'VEC3', 5126, 8, {min: [-0.2, 0, -0.2], max: [0.2, 0.4, 0.2]});
	var boxIndices = accessor(shorts([0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7]), 'SCALAR', 5123, 36);
	var inverse = accessor(matrices([translation(0, 0, 0), translation(0, -1, 0)]), 'MAT4', 5126, 2);
	var times = accessor(floats([0, 0.5, 1]), 'SCALAR', 5126, 3, {min: [0], max: [1]});
	var bend = accessor(floats([0, 0, 0, 1, 0, 0, half, half, 0, 0, 0, 1]), 'VEC4', 5126, 3);
	var spin = accessor(floats([0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1]), 'VEC4', 5126, 3);
	var picture = add(settings.Png || Picture);
	var json = {
		asset: {version: '2.0', generator: 'Elemenx tests'},
		extensionsUsed: settings.Required || [],
		extensionsRequired: settings.Required || [],
		scene: 0,
		scenes: [{nodes: [0, 1, 3]}],
		nodes: [
			{name: 'Root', translation: [0, 0, 0], children: [2]},
			{name: 'Column', mesh: 0, skin: 0},
			{name: 'Upper', translation: [0, 1, 0]},
			{name: 'Crate', mesh: 1, translation: [1, 0, 0]}
		],
		meshes: [
			{primitives: [{attributes: {POSITION: positions, NORMAL: normals, TEXCOORD_0: uvs, JOINTS_0: joints, WEIGHTS_0: weights}, indices: indices, material: 0}]},
			{primitives: [{attributes: {POSITION: boxPositions}, indices: boxIndices, material: 1}]}
		],
		skins: [{joints: [0, 2], inverseBindMatrices: inverse}],
		materials: [
			{name: 'Skin', pbrMetallicRoughness: {baseColorFactor: [0.9, 0.6, 0.4, 1], baseColorTexture: {index: 0}, metallicFactor: 0, roughnessFactor: 0.6}},
			{name: 'Steel', pbrMetallicRoughness: {baseColorFactor: [0.7, 0.7, 0.75, 1], metallicFactor: 1, roughnessFactor: 0.3}, emissiveFactor: [0, 0, 0]}
		],
		textures: [{source: 0}],
		images: [{bufferView: picture, mimeType: 'image/png'}],
		animations: [
			{name: 'Bend', channels: [{sampler: 0, target: {node: 2, path: 'rotation'}}], samplers: [{input: times, output: bend, interpolation: 'LINEAR'}]},
			{name: 'Spin', channels: [{sampler: 0, target: {node: 3, path: 'rotation'}}], samplers: [{input: times, output: spin, interpolation: 'LINEAR'}]}
		],
		buffers: [{byteLength: at}],
		bufferViews: views,
		accessors: accessors
	};
	var text = new TextEncoder().encode(JSON.stringify(json));
	var header = align(text);
	var total = 12 + 8 + (header.length + (4 - header.length % 4) % 4) + 8 + at;
	var result = new Uint8Array(total);
	var view = new DataView(result.buffer);
	var offset = 20;

	/* The padding of the JSON is spaces, as the format says. */
	header.fill(32, text.length);

	view.setUint32(0, 0x46546c67, true);
	view.setUint32(4, 2, true);
	view.setUint32(8, total, true);
	view.setUint32(12, header.length, true);
	view.setUint32(16, 0x4e4f534a, true);

	result.set(header, offset);

	offset += header.length;

	view.setUint32(offset, at, true);
	view.setUint32(offset + 4, 0x004e4942, true);

	offset += 8;

	parts.forEach(function (part) {
		result.set(part, offset);

		offset += part.length;
	});

	return result;
}
