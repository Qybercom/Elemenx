import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';

/* Bytes packed by zlib, by the browser: what a binary FBX holds, made by another hand than the one that reads it. */
async function packed (bytes) {
	var stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'));

	return new Uint8Array(await new Response(stream).arrayBuffer());
}

/*
 * A binary FBX written here, apart from the library, after the format: a header, records of their end, their count of
 * values and their length, a name and values; lists of numbers packed. wide: the offsets of 8 bytes of 7500 and over.
 */
async function binaryFbx (nodes, wide) {
	var parts = [];
	var size = 27;

	async function value (each) {
		var out;
		var view;
		var data;
		var zipped;

		if (typeof each === 'string') {
			var name = each.split('::');
			var text = name.length === 2 ? name[1] + '\u0000\u0001' + name[0] : each;
			var bytes = new TextEncoder().encode(text);

			out = new Uint8Array(5 + bytes.length);
			out[0] = 83;

			new DataView(out.buffer).setUint32(1, bytes.length, true);

			out.set(bytes, 5);

			return out;
		}

		if (each.List) {
			data = new Uint8Array(each.List.buffer.slice(0));
			zipped = await packed(data);
			out = new Uint8Array(13 + zipped.length);
			view = new DataView(out.buffer);
			out[0] = each.Kind.charCodeAt(0);

			view.setUint32(1, each.List.length, true);
			view.setUint32(5, 1, true);
			view.setUint32(9, zipped.length, true);

			out.set(zipped, 13);

			return out;
		}

		out = new Uint8Array(each.Long !== undefined ? 9 : each.Int !== undefined ? 5 : 9);
		view = new DataView(out.buffer);

		if (each.Long !== undefined) {
			out[0] = 76;

			view.setUint32(1, each.Long % 4294967296, true);
			view.setUint32(5, Math.floor(each.Long / 4294967296), true);
		}
		else if (each.Int !== undefined) {
			out[0] = 73;

			view.setInt32(1, each.Int, true);
		}
		else {
			out[0] = 68;

			view.setFloat64(1, each, true);
		}

		return out;
	}

	async function record (node, at) {
		var values = [];
		var length = 0;
		var name = new TextEncoder().encode(node[0]);
		var head = wide ? 25 : 13;
		var inner = [];
		var end;
		var i;

		for (i = 0; i < node[1].length; i++) {
			values.push(await value(node[1][i]));

			length += values[i].length;
		}

		end = at + head + name.length + length;

		for (i = 0; i < (node[2] || []).length; i++) {
			var child = await record(node[2][i], end);

			inner.push(child);

			end += child.Size;
		}

		if ((node[2] || []).length)
			end += head;

		var top = new Uint8Array(head + name.length);
		var view = new DataView(top.buffer);

		if (wide) {
			view.setUint32(0, end, true);
			view.setUint32(8, values.length, true);
			view.setUint32(16, length, true);
		}
		else {
			view.setUint32(0, end, true);
			view.setUint32(4, values.length, true);
			view.setUint32(8, length, true);
		}

		top[head - 1] = name.length;

		top.set(name, head);

		return {Size: end - at, Bytes: [top].concat(values, [].concat.apply([], inner.map(function (each) {
			return each.Bytes;
		})), (node[2] || []).length ? [new Uint8Array(head)] : [])};
	}

	for (var i = 0; i < nodes.length; i++) {
		var made = await record(nodes[i], size);

		parts = parts.concat(made.Bytes);
		size += made.Size;
	}

	var start = new Uint8Array(27);

	start.set(new TextEncoder().encode('Kaydara FBX Binary  '), 0);

	start[21] = 26;

	new DataView(start.buffer).setUint32(23, wide ? 7500 : 7400, true);

	parts = [start].concat(parts, [new Uint8Array(wide ? 25 : 13)]);

	var whole = new Uint8Array(parts.reduce(function (sum, part) {
		return sum + part.length;
	}, 0));
	var at = 0;

	parts.forEach(function (part) {
		whole.set(part, at);

		at += part.length;
	});

	return whole;
}

/* A quad and a triangle, two materials, a texture inside, two bones, a turn of the second one in a clip: as text. */
var picture = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
var text = [
	'; FBX 7.4.0 project file',
	'GlobalSettings:  {',
	'	Properties70:  {',
	'		P: "UpAxis", "int", "Integer", "",1',
	'	}',
	'}',
	'Objects:  {',
	'	Geometry: 10, "Geometry::Shape", "Mesh" {',
	'		Vertices: *15 {',
	'			a: 0,0,0,1,0,0,1,1,0,0,1,0,2,0,0',
	'		}',
	'		PolygonVertexIndex: *7 {',
	'			a: 0,1,2,-4,1,4,-3',
	'		}',
	'		LayerElementNormal: 0 {',
	'			MappingInformationType: "ByVertice"',
	'			ReferenceInformationType: "Direct"',
	'			Normals: *15 {',
	'				a: 0,0,1,0,0,1,0,0,1,0,0,1,0,0,1',
	'			}',
	'		}',
	'		LayerElementUV: 0 {',
	'			MappingInformationType: "ByPolygonVertex"',
	'			ReferenceInformationType: "IndexToDirect"',
	'			UV: *8 {',
	'				a: 0,0,1,0,1,1,0,1',
	'			}',
	'			UVIndex: *7 {',
	'				a: 0,1,2,3,0,1,2',
	'			}',
	'		}',
	'		LayerElementMaterial: 0 {',
	'			MappingInformationType: "ByPolygon"',
	'			ReferenceInformationType: "IndexToDirect"',
	'			Materials: *2 {',
	'				a: 0,1',
	'			}',
	'		}',
	'	}',
	'	Model: 20, "Model::Body", "Mesh" {',
	'		Properties70:  {',
	'			P: "Lcl Translation", "Lcl Translation", "", "A",0,2,0',
	'		}',
	'	}',
	'	Model: 21, "Model::Root", "LimbNode" {',
	'	}',
	'	Model: 22, "Model::Arm", "LimbNode" {',
	'		Properties70:  {',
	'			P: "PreRotation", "Vector3D", "Vector", "",0,0,90',
	'			P: "Lcl Translation", "Lcl Translation", "", "A",1,0,0',
	'		}',
	'	}',
	'	Material: 30, "Material::Red", "" {',
	'		Properties70:  {',
	'			P: "DiffuseColor", "Color", "", "A",1,0,0',
	'			P: "Opacity", "Number", "", "A",0.5',
	'			P: "Shininess", "Number", "", "A",18',
	'		}',
	'	}',
	'	Material: 31, "Material::Blue", "" {',
	'		Properties70:  {',
	'			P: "DiffuseColor", "Color", "", "A",0,0,1',
	'		}',
	'	}',
	'	Texture: 40, "Texture::Skin", "" {',
	'		RelativeFilename: "skin.png"',
	'	}',
	'	Video: 41, "Video::Skin", "Clip" {',
	'		Content: "' + picture + '"',
	'	}',
	'	Deformer: 50, "Deformer::Skin", "Skin" {',
	'	}',
	'	Deformer: 51, "SubDeformer::Root", "Cluster" {',
	'		Indexes: *3 {',
	'			a: 0,3,1',
	'		}',
	'		Weights: *3 {',
	'			a: 1,1,0.25',
	'		}',
	'		Transform: *16 {',
	'			a: 1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1',
	'		}',
	'		TransformLink: *16 {',
	'			a: 1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1',
	'		}',
	'	}',
	'	Deformer: 52, "SubDeformer::Arm", "Cluster" {',
	'		Indexes: *3 {',
	'			a: 1,2,4',
	'		}',
	'		Weights: *3 {',
	'			a: 0.75,1,1',
	'		}',
	'		Transform: *16 {',
	'			a: 1,0,0,0,0,1,0,0,0,0,1,0,-1,0,0,1',
	'		}',
	'	}',
	'	AnimationStack: 60, "AnimStack::Wave", "" {',
	'	}',
	'	AnimationLayer: 61, "AnimLayer::Base", "" {',
	'	}',
	'	AnimationCurveNode: 62, "AnimCurveNode::R", "" {',
	'		Properties70:  {',
	'			P: "d|X", "Number", "", "A",0',
	'			P: "d|Y", "Number", "", "A",0',
	'			P: "d|Z", "Number", "", "A",0',
	'		}',
	'	}',
	'	AnimationCurve: 63, "AnimCurve::", "" {',
	'		KeyTime: *2 {',
	'			a: 0,46186158000',
	'		}',
	'		KeyValueFloat: *2 {',
	'			a: 0,90',
	'		}',
	'	}',
	'}',
	'Connections:  {',
	'	C: "OO",20,0',
	'	C: "OO",21,0',
	'	C: "OO",22,21',
	'	C: "OO",10,20',
	'	C: "OO",30,20',
	'	C: "OO",31,20',
	'	C: "OO",41,40',
	'	C: "OP",40,30, "DiffuseColor"',
	'	C: "OO",50,10',
	'	C: "OO",51,50',
	'	C: "OO",52,50',
	'	C: "OO",21,51',
	'	C: "OO",22,52',
	'	C: "OO",61,60',
	'	C: "OO",62,61',
	'	C: "OP",62,22, "Lcl Rotation"',
	'	C: "OP",63,62, "d|X"',
	'}'
].join('\n');

describe('Contract: ModelFormats and Fbx, the files of models read and written', function () {
	var formats;
	var fbx;
	var gltf;
	var models;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:ModelFormats', 'service:Fbx', 'service:Gltf', 'service:Renderer', 'service:Meshes', 'service:Math', 'service:SceneModels']);

		formats = Elemenx.Service('ModelFormats');
		fbx = Elemenx.Service('Fbx');
		gltf = Elemenx.Service('Gltf');
		models = Elemenx.Service('SceneModels');
	});

	/* What a file holds, to tell two of them apart: counts, and every number rounded. */
	function shape (asset) {
		return JSON.stringify({
			Nodes: asset.Nodes.map(function (node) {
				return [node.Name, node.Parent, node.Mesh, node.Skin, Array.from(node.Translation).concat(Array.from(node.Rotation).map(function (value) {
					return value * Math.sign(node.Rotation[3] || 1);
				}), Array.from(node.Scale)).map(function (value) {
					return Math.round(value * 1e4) / 1e4 || 0;
				})];
			}),
			Meshes: asset.Meshes.map(function (mesh) {
				return mesh.map(function (part) {
					return [part.Material, part.Geometry.Positions.length, part.Geometry.Indices.length, Array.from(part.Geometry.Positions).concat(Array.from(part.Geometry.UVs), part.Geometry.Weights ? Array.from(part.Geometry.Weights) : []).map(function (value) {
						return Math.round(value * 1e4) / 1e4 || 0;
					})];
				});
			}),
			Materials: asset.Materials.map(function (material) {
				return [material.BaseColor.map(function (value) {
					return Math.round(value * 1e3) / 1e3;
				}), Math.round(material.Roughness * 1e3) / 1e3, material.Alpha, material.ColorMap ? material.ColorMap.Image : -1];
			}),
			Skins: asset.Skins.map(function (skin) {
				return [skin.Joints, Array.from(skin.Inverse).map(function (value) {
					return Math.round(value * 1e4) / 1e4 || 0;
				})];
			}),
			Clips: asset.Animations.map(function (clip) {
				return [clip.Name, Math.round(clip.Length * 1e4) / 1e4, clip.Channels.map(function (channel) {
					return [channel.Node, channel.Path, Array.from(channel.Times).map(function (value) {
						return Math.round(value * 1e4) / 1e4;
					}), Array.from(channel.Values).map(function (value) {
						return Math.round(Math.abs(value) * 1e4) / 1e4;
					})];
				})];
			})
		});
	}

	it('unpacks zlib as the browser packs it: blocks stored, fixed and of their own codes', async function () {
		var plain = new Uint8Array(70000);
		var noise = new Uint8Array(40000);
		var seed = 7;
		var i;

		for (i = 0; i < plain.length; i++)
			plain[i] = 'the quick brown fox '.charCodeAt(i % 20) + (i % 997 === 0 ? 1 : 0);

		for (i = 0; i < noise.length; i++) {
			seed = seed * 16807 % 2147483647;
			noise[i] = seed & 255;
		}

		expect(Array.from(fbx.Inflate(await packed(plain)))).toEqual(Array.from(plain));
		expect(Array.from(fbx.Inflate(await packed(noise)))).toEqual(Array.from(noise));
		expect(Array.from(fbx.Inflate(await packed(new Uint8Array([1, 2, 3]))))).toEqual([1, 2, 3]);
	});

	it('reads an FBX as a model: polygons in triangles by material, its picture inside, its skin and its clip', function () {
		var asset = fbx.Read(text);
		var body = asset.Nodes[0];
		var arm = asset.Nodes[2];
		var parts = asset.Meshes[body.Mesh];
		var skin = asset.Skins[body.Skin];
		var clip = asset.Animations[0];
		var turn;

		expect(formats.Detect(text)).toBe('fbx');
		expect(asset.Nodes.map(function (node) {
			return node.Name;
		})).toEqual(['Body', 'Root', 'Arm']);
		expect(body.Translation).toEqual([0, 2, 0]);
		expect(arm.Parent).toBe(1);

		/* A quad in two triangles of the first material, a triangle of the second; V turned to the top of a picture. */
		expect(parts.map(function (part) {
			return [part.Material, part.Geometry.Indices.length / 3];
		})).toEqual([[0, 2], [1, 1]]);
		expect(Array.from(parts[0].Geometry.Indices)).toEqual([0, 1, 2, 0, 2, 3]);
		expect(Array.from(parts[0].Geometry.UVs)).toEqual([0, 1, 1, 1, 1, 0, 0, 0]);
		expect(Array.from(parts[0].Geometry.Normals.slice(0, 3))).toEqual([0, 0, 1]);

		/* Phong made PBR: half clear is blended, its picture comes from inside the file. */
		expect(asset.Materials[0].BaseColor).toEqual([1, 0, 0, 0.5]);
		expect(asset.Materials[0].Alpha).toBe('BLEND');
		expect(asset.Materials[0].Roughness).toBeCloseTo(Math.sqrt(2 / 20), 6);
		expect(asset.Materials[1].BaseColor).toEqual([0, 0, 1, 1]);
		expect(asset.Materials[0].ColorMap.Image).toBe(0);
		expect(asset.Images[0].Type).toBe('image/png');
		expect(Array.from(asset.Images[0].Data.slice(1, 4))).toEqual([80, 78, 71]);

		/* The weights of a point together are 1, the strongest bone first; the inverse of a bind as the file gives it. */
		expect(skin.Joints).toEqual([1, 2]);
		expect(Array.from(parts[0].Geometry.Joints.slice(4, 8))).toEqual([1, 0, 0, 0]);
		expect(Array.from(parts[0].Geometry.Weights.slice(4, 8))).toEqual([0.75, 0.25, 0, 0]);
		expect(Array.from(skin.Inverse.slice(16 + 12, 16 + 15))).toEqual([-1, 0, 0]);

		/* The clip: the pre-rotation of the bone under its own turn, as quaternions; a second long. */
		expect(clip.Name).toBe('Wave');
		expect(clip.Length).toBeCloseTo(1, 6);

		turn = clip.Channels.filter(function (channel) {
			return channel.Node === 2 && channel.Path === 'rotation';
		})[0];

		/* At the end: 90 degrees round X after 90 round Z: (z90) * (x90). */
		var end = Array.from(turn.Values.slice(4, 8));
		var expected = [0.5, 0.5, 0.5, 0.5];

		expect(end.map(function (value) {
			return Math.round(value * 1e4) / 1e4;
		})).toEqual(expected);
		expect(Array.from(arm.Rotation).map(function (value) {
			return Math.round(value * 1e4) / 1e4;
		})).toEqual([0, 0, 0.7071, 0.7071]);
	});

	it('reads a binary FBX the same as its text, of either width, its lists packed', async function () {
		var tree = fbx.Tree(text);

		/* The tree again as values of the binary file, written here, not by the library. */
		function convert (node) {
			return [node.Name, node.Props.map(function (value) {
				if (value instanceof Float64Array) {
					return node.Name === 'PolygonVertexIndex' || node.Name === 'UVIndex' || node.Name === 'Indexes' || node.Name === 'Materials' ? {Kind: 'i', List: new Int32Array(value)} : node.Name === 'KeyTime' ? {Kind: 'l', List: new BigInt64Array(Array.from(value, BigInt))} : node.Name === 'KeyValueFloat' ? {Kind: 'f', List: new Float32Array(value)} : {Kind: 'd', List: value};
				}

				if (typeof value === 'number' && node.Name === 'C') return {Long: value};
				if (typeof value === 'number' && Number.isInteger(value) && value >= 10 && node.Name !== 'P') return {Long: value};
				if (typeof value === 'number' && Number.isInteger(value) && node.Name !== 'P') return {Int: value};

				return value;
			}), node.Nodes.map(convert)];
		}

		var source = shape(fbx.Read(text));

		for (var wide of [false, true]) {
			var bytes = await binaryFbx(tree.Nodes.map(convert), wide);

			expect(fbx.IsBinary(bytes)).toBe(true);
			expect(formats.Detect(bytes)).toBe('fbx');
			expect(shape(fbx.Read(bytes))).toBe(source);
		}
	});

	it('writes a model in every format, and reads back the very same model', function () {
		var asset = fbx.Read(text);
		var source = shape(asset);
		var glb = formats.Write(asset, 'glb');
		var json = formats.Write(asset, 'gltf');
		var binary = formats.Write(asset, 'fbx');
		var written = formats.Write(asset, 'fbx', {Text: true});
		var obj = formats.Write(asset, 'obj');
		var mtl = formats.Write(asset, 'mtl');
		var back;

		expect(formats.Formats()).toEqual(['glb', 'gltf', 'fbx', 'obj']);
		expect(formats.Detect(new Uint8Array(glb))).toBe('glb');
		expect(formats.Detect(json)).toBe('gltf');
		expect(formats.Detect(new Uint8Array(binary))).toBe('fbx');
		expect(formats.Detect(written)).toBe('fbx');
		expect(formats.Detect(obj)).toBe('obj');
		expect(formats.Detect(new Uint8Array(0), 'model.OBJ')).toBe('obj');

		expect(shape(formats.Read(glb))).toBe(source);
		expect(shape(formats.Read(json))).toBe(source);
		expect(shape(formats.Read(binary))).toBe(source);
		expect(shape(formats.Read(written))).toBe(source);

		/* Its picture inside each of them. */
		expect(Array.from(formats.Read(glb).Images[0].Data)).toEqual(Array.from(asset.Images[0].Data));
		expect(Array.from(formats.Read(binary).Images[0].Data)).toEqual(Array.from(asset.Images[0].Data));

		/* The binary file ends as the format says. */
		expect(Array.from(new Uint8Array(binary).slice(-16))).toEqual([0xf8, 0x5a, 0x8c, 0x6a, 0xde, 0xf5, 0xd9, 0x7e, 0xec, 0xe9, 0x0c, 0xe3, 0x75, 0x8f, 0x29, 0x0b]);
		expect((new Uint8Array(binary).length - 140) % 16).toBe(0);
		expect(new DataView(binary).getUint32(binary.byteLength - 140, true)).toBe(7400);

		/* An obj: its points where they stand in the scene, its materials by name. */
		back = formats.Read(obj, {Materials: mtl});

		expect(back.Meshes[0].map(function (part) {
			return back.Materials[part.Material].Name;
		})).toEqual(['Red', 'Blue']);
		expect(Array.from(back.Meshes[0][0].Geometry.Positions.slice(0, 3))).toEqual([0, 2, 0]);
		expect(back.Materials[0].BaseColor).toEqual([1, 0, 0, 0.5]);
		expect(back.Meshes[0][1].Geometry.Indices.length).toBe(3);

		expect(function () {
			formats.Read('nothing at all');
		}).toThrow(/not a file of a model/);

		expect(function () {
			formats.Write(asset, 'stl');
		}).toThrow(/no writer of stl/);
	});

	it('keeps to the letter of the formats: turns in their order, layers by polygon, four bones, names, degrees, bounds', function () {
		var graphics = Elemenx.Service('Renderer');
		var math = Elemenx.Service('Math');
		var x = math.Rotation([1, 0, 0], Math.PI / 2);
		var y = math.Rotation([0, 1, 0], Math.PI / 4);
		var z = math.Rotation([0, 0, 1], Math.PI / 2);

		function close (a, b) {
			a.forEach(function (value, index) {
				expect(value).toBeCloseTo(b[index], 6);
			});
		}

		/* XYZ: x turns first, then y, then z; ZXY: z first. */
		close(fbx.Euler([90, 45, 90], 0), math.Multiply(z, math.Multiply(y, x)));
		close(fbx.Euler([90, 45, 90], 4), math.Multiply(y, math.Multiply(x, z)));

		/* Colors by polygon, five bones on a point: its four strongest, weighed again. */
		var lines = ['Objects:  {', '	Geometry: 1, "Geometry::Tri", "Mesh" {', '		Vertices: *12 {', '			a: 0,0,0,1,0,0,0,1,0,1,1,0', '		}', '		PolygonVertexIndex: *6 {', '			a: 0,1,-3,1,3,-3', '		}',
			'		LayerElementColor: 0 {', '			MappingInformationType: "ByPolygon"', '			ReferenceInformationType: "Direct"', '			Colors: *8 {', '				a: 1,0,0,1,0,0,1,1', '			}', '		}', '	}', '	Model: 2, "Model::Tri", "Mesh" {', '	}', '	Deformer: 3, "Deformer::Skin", "Skin" {', '	}'];
		var links = ['Connections:  {', '	C: "OO",2,0', '	C: "OO",1,2', '	C: "OO",3,1'];
		var bone;

		for (bone = 0; bone < 5; bone++) {
			lines.push('	Model: ' + (10 + bone) + ', "Model::Bone' + bone + '", "LimbNode" {', '	}', '	Deformer: ' + (20 + bone) + ', "SubDeformer::Bone' + bone + '", "Cluster" {', '		Indexes: *1 {', '			a: 0', '		}', '		Weights: *1 {', '			a: ' + (bone + 1), '		}', '	}');
			links.push('	C: "OO",' + (10 + bone) + ',0', '	C: "OO",' + (20 + bone) + ',3', '	C: "OO",' + (10 + bone) + ',' + (20 + bone));
		}

		var tri = fbx.Read(lines.concat(['}'], links, ['}']).join('\n'));
		var made = tri.Meshes[0][0].Geometry;

		expect(Array.from(made.Colors)).toEqual([1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
		expect(Array.from(made.Joints.slice(0, 4))).toEqual([4, 3, 2, 1]);
		expect(made.Weights[0]).toBeCloseTo(5 / 14, 6);
		expect(made.Weights[3]).toBeCloseTo(2 / 14, 6);

		/* A binary file writes the name of an object, then its class, between them 0 and 1. */
		var bytes = new Uint8Array(fbx.Binary(fbx.Tree(text)));
		var mark = Array.from(new TextEncoder().encode('Root\u0000\u0001Model')).join(',');

		expect(Array.from(bytes).join(',')).toContain(mark);

		/* A turn of 340 degrees is 340 in the file, not -20: what is between two keys turns the right way. */
		var turning = {Nodes: [{Name: 'Spinner', Parent: -1, Children: [], Translation: [0, 0, 0], Rotation: [0, 0, 0, 1], Scale: [1, 1, 1], Mesh: -1, Skin: -1}], Meshes: [], Materials: [], Images: [], Skins: [], Scene: [0], Animations: [{Name: 'Spin', Length: 2, Channels: [{Node: 0, Path: 'rotation', Size: 4, Times: new Float32Array([0, 1, 2]), Values: new Float32Array([0, 0, 0, 1].concat([170, 340].reduce(function (all, degrees) {
			return all.concat([Math.sin(degrees * Math.PI / 360), 0, 0, Math.cos(degrees * Math.PI / 360)]);
		}, [])))}]}]};
		var curves = fbx.Child(fbx.Tree(fbx.Write(turning, {Text: true})), 'Objects').Nodes.filter(function (node) {
			return node.Name === 'AnimationCurve';
		});

		expect(Array.from(fbx.Child(curves[0], 'KeyValueFloat').Props[0]).map(Math.round)).toEqual([0, 170, 340]);

		/* An obj counts back from its last point. */
		var obj = formats.Read('v 0 0 0\nv 1 0 0\nv 0 1 0\nf -3 -2 -1\n');

		expect(Array.from(obj.Meshes[0][0].Geometry.Positions)).toEqual([0, 0, 0, 1, 0, 0, 0, 1, 0]);

		/* glTF: light over 1 keeps its strength; positions have their bounds. */
		var bright = fbx.Read(text);

		bright.Materials[1].Emissive = [4, 2, 0];

		var glb = formats.Write(bright, 'glb');
		var json = JSON.parse(new TextDecoder().decode(new Uint8Array(glb, 20, new DataView(glb).getUint32(12, true))));

		expect(json.materials[1].extensions.KHR_materials_emissive_strength.emissiveStrength).toBe(4);
		expect(json.materials[1].emissiveFactor).toEqual([1, 0.5, 0]);
		expect(formats.Read(glb).Materials[1].Emissive).toEqual([4, 2, 0]);
		expect(json.accessors[json.meshes[0].primitives[0].attributes.POSITION]).toMatchObject({min: [0, 0, 0], max: [1, 1, 0]});
	});

	it('exports a model of code with its clips, and its skeleton for a clip of another binary file', function () {
		var knight = models.Make('knight');
		var asset = formats.FromModel(knight);
		var back = formats.Read(formats.Write(asset, 'glb'));
		var clip = Object.keys(knight.Clips)[0];
		var graphics = Elemenx.Service('Renderer');
		var math = Elemenx.Service('Math');
		var arm = knight.Pieces.map(function (piece) {
			return piece.ID;
		}).indexOf('arm-l');
		var time = models.Length(knight, clip) / 2;
		var pose = models.Pose(knight, clip, time);

		expect(asset.Nodes.length).toBe(knight.Pieces.length);
		expect(back.Animations.map(function (each) {
			return each.Name;
		})).toEqual(Object.keys(knight.Clips));

		/* The node of a piece where the clip puts it: the pose of the piece at its pivot, in its parent. */
		var channel = back.Animations[0].Channels.filter(function (each) {
			return each.Node === arm && each.Path === 'rotation';
		})[0];
		var step = Array.from(channel.Times).findIndex(function (each) {
			return Math.abs(each - time) < 1e-4;
		});
		var turn = Array.from(channel.Values.slice(step * 4, step * 4 + 4));
		var wanted = gltf.Node({matrix: math.Multiply(math.Invert(math.Multiply(pose.body, math.Translation.apply(graphics, knight.Pieces[0].Pivot))), math.Multiply(pose['arm-l'], math.Translation.apply(graphics, knight.Pieces[arm].Pivot)))}).Rotation;
		var sign = Math.sign(turn[3] * wanted[3]) || 1;

		turn.forEach(function (value, axis) {
			expect(value * sign).toBeCloseTo(wanted[axis], 4);
		});

		/* A clip of another file, binary: its skeleton the same as of its text. */
		var tree = fbx.Tree(text);
		var binary = fbx.Binary(tree);

		expect(fbx.Parse(new Uint8Array(binary))).toEqual(fbx.Parse(text));
		expect(fbx.Parse(text).Bones.map(function (bone) {
			return bone.Name;
		})).toEqual(['Root', 'Arm']);
	});

	it('makes a model of a file of FBX through Models, as one of glTF', async function () {
		var asset = fbx.Read(text);
		var url = URL.createObjectURL(new Blob([formats.Write(asset, 'fbx')]));
		var made = null;

		models.Define('test-fbx-shape', {URL: url, Type: 'unit', Size: 1});

		await new Promise(function (resolve) {
			models.Load('test-fbx-shape', function (error, model) {
				made = error || model;

				resolve();
			});
		});

		URL.revokeObjectURL(url);

		expect(made instanceof Error).toBe(false);
		expect(made.Pieces.length).toBeGreaterThan(0);
		expect(Object.keys(made.Clips)).toContain('Wave');
	});
});
