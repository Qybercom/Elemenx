/*
 * Fbx: the skeleton and the animation of an FBX file written as text, as Blender and Mixamo give it; a binary one is refused
 * with a word. It reads no mesh: it is the way a clip made for another skeleton comes to a model (Models.Retarget).
 *
 * - Parse(text) returns {Bones: [{ID, Name, Parent, Translation, Pre, Rotation}], Length, Curves}. Parent is an index, -1 for
 *   a root; Pre and Rotation are degrees, x, y, z. Curves: {bone index: {T: [x, y, z], R: [x, y, z]}}, each [{Times, Values}]
 *   in seconds, degrees and the units of the file, or null where nothing moves.
 * - Sample(curve, time, fallback) is the value of a curve at a second.
 * - Load(url, callback) fetches and parses: (error, parsed).
 */
Elemenx.Service('Fbx', {
	$Meta: {
		Description: 'The skeleton and the animation of an FBX file as text: a clip made for another skeleton.',
		Methods: ['Parse(text)', 'Sample(curve, time, fallback)', 'Load(url, callback)']
	},

	Second: 46186158000,

	Numbers: function (text) {
		return text.split(',').map(Number);
	},

	Vector: function (block, name) {
		var found = new RegExp('P: "' + name + '",[^\\n]*?,\\s*"[^"]*",((?:-?[\\d.e+-]+,?){3})').exec(block);

		return found ? this.Numbers(found[1]) : [0, 0, 0];
	},

	Parse: function (text) {
		var self = this;
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

		if (text.slice(0, 18) === 'Kaydara FBX Binary')
			throw new Error('Elemenx Fbx: a binary file; export it as text (ASCII FBX)');

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

		request.onload = function () {
			var parsed = null;

			if (request.status < 200 || request.status >= 300) {
				callback(new Error('Elemenx Fbx: ' + url + ' answers ' + request.status), null);

				return;
			}

			try {
				parsed = self.Parse(request.responseText);
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
	}
});
