/*
 * What a graph of Blueprints that makes a thing of data gives, drawn flat as it is changed: a cloud (CloudBlueprints) its
 * points, turned round its height (a drag turns it; Turn and Pitch in radians), each of its color and brightness, larger
 * the larger it is; one of no places its fields (Distance and Anomaly round a middle, else its first two across and up); a
 * network (NetworkBlueprints) its ways, each of a color of its class, wider the more it carries, on a globe turned as a
 * cloud is, on a ground seen from over it (Inputs: what it is given, else a sample of each of its inputs); a layout
 * (LayoutBlueprints) its streets, walls, roads and ramps and its lots and houses of a sample, seen from over it (Drawing); an
 * image (ImageBlueprints) its picture, as large as it fits.
 * Graph is the graph (an object, its JSON, or the name of a resource), Parameters what it is run with, Height its height
 * in pixels (it is as wide as its place); Label names it for screen readers. A graph that cannot be made tells why. What
 * it drew is told: drawn ({Kind, Count}).
 */
Elemenx.Component('BlueprintPreview', {
	$TemplateURL: 'BlueprintPreview.html',
	$StyleURL: 'BlueprintPreview.css',
	$Meta: {
		Group: 'game',
		Icon: 'eye',
		Description: 'What a graph of Blueprints that makes a thing of data gives (a cloud of points, a network, a layout, a picture), drawn flat as it is changed.',
		Events: {
			drawn: 'It was drawn: {Kind, Count}.'
		},
		Props: {
			Graph: 'The graph: an object, its JSON, or the name of a resource (ElemenxGraphics/cloud/sky).',
			Parameters: 'What the graph is run with: {key: value}.',
			Inputs: 'What a network graph is given: {name: value} of its Input blocks; empty, a sample of each (NetworkBlueprints.Sample).',
			Turn: 'How far it is turned round its height, in radians.',
			Pitch: 'How far it is seen from over it, in radians.',
			Height: 'Its height in pixels.',
			Label: 'Its name for screen readers.'
		},
		Sample: {Graph: 'ElemenxGraphics/cloud/sky', Height: 240}
	},
	Graph: null,
	Parameters: null,
	Inputs: null,
	Turn: 0.4,
	Pitch: 0.35,
	Height: 280,
	Label: '',
	Note: '',
	Kind: '',

	$OnCreate: function () {
		this.Pending = false;
	},

	$OnReady: function () {
		this.Later();
	},

	$OnProps: function () {
		this.Later();
	},

	/* Drawn once after what changed together. */
	Later: function () {
		var self = this;

		if (this.Pending) return;

		this.Pending = true;

		setTimeout(function () {
			self.Pending = false;

			if (self.$Element && self.$Element())
				self.Draw();
		}, 0);
	},

	/* The graph read: the object of it, or null. */
	Read: function () {
		var graph = this.Graph;
		if (!graph)
			return null;

		if (typeof graph === 'string')
			return /^\s*\{/.test(graph) ? JSON.parse(graph) : Elemenx.Resources('Blueprints', graph);

		return graph;
	},

	Draw: function () {
		var canvas = this.$Element().querySelector('canvas');
		var context = canvas ? canvas.getContext('2d') : null;
		var graph;
		var made;

		if (!context) return;

		canvas.width = Math.max(80, Math.round(canvas.clientWidth || this.$Element().clientWidth || 320));
		canvas.height = Math.max(60, Number(this.Height) || 280);

		context.clearRect(0, 0, canvas.width, canvas.height);

		try {
			graph = this.Read();

			if (!graph) {
				this.Told('', 0, '');

				return;
			}

			if (graph.type === 'cloud') {
				made = this.$Service('CloudBlueprints').Points(graph, this.Parameters || {});

				this.Cloud(context, canvas.width, canvas.height, made);
				this.Told('cloud', made.Count, Elemenx.Locale.Text('graphics.blueprintPreview.points', {count: made.Count}));

				return;
			}

			if (graph.type === 'network') {
				var networks = this.$Service('NetworkBlueprints');

				made = networks.Make(graph, this.Parameters || {}, this.Inputs || networks.Sample(graph));

				this.Network(context, canvas.width, canvas.height, made);
				this.Told('network', made.Ways.length, Elemenx.Locale.Text('graphics.blueprintPreview.ways', {count: made.Ways.length}));

				return;
			}

			if (graph.type === 'image') {
				var images = this.$Service('ImageBlueprints');

				made = images.Make(graph, this.Parameters || {}, this.Inputs || images.Sample(graph));

				this.Image(context, canvas.width, canvas.height, made.Picture);
				this.Told('image', made.Picture.Width * made.Picture.Height, Elemenx.Locale.Text('graphics.blueprintPreview.image', {width: made.Picture.Width, height: made.Picture.Height}));

				return;
			}

			if (graph.type === 'layout') {
				made = this.$Service('LayoutBlueprints').Drawing(graph, this.Parameters || {});

				this.Layout(context, canvas.width, canvas.height, made);
				this.Told('layout', made.Boxes.length, Elemenx.Locale.Text('graphics.blueprintPreview.layout', {lines: made.Lines.length, boxes: made.Boxes.length}));

				return;
			}

			this.Told(graph.type, 0, Elemenx.Locale.Text('graphics.blueprintPreview.none', {kind: graph.type}));
		}
		catch (error) {
			this.Told(graph && graph.type || '', 0, Elemenx.Locale.Text('graphics.blueprintPreview.failed', {error: error.message}));
		}
	},

	Told: function (kind, count, note) {
		this.Kind = kind;
		this.Note = note;

		this.$Emit('drawn', {Kind: kind, Count: count});
	},

	/* The places of a cloud: its positions, else of its fields (Distance and Anomaly round a middle, else the first two). */
	Places: function (cloud) {
		var places = [];
		var fields = Object.keys(cloud.Fields || {});
		var i;

		for (i = 0; i < cloud.Count; i++) {
			if (cloud.Positions) {
				places.push([cloud.Positions[i * 3], cloud.Positions[i * 3 + 1], cloud.Positions[i * 3 + 2]]);
			}
			else if (cloud.Fields.Distance && cloud.Fields.Anomaly) {
				var turn = cloud.Fields.Anomaly[i] * Math.PI / 180;

				places.push([Math.cos(turn) * cloud.Fields.Distance[i], 0, Math.sin(turn) * cloud.Fields.Distance[i]]);
			}
			else {
				places.push([fields[0] ? cloud.Fields[fields[0]][i] : i, fields[1] ? cloud.Fields[fields[1]][i] : 0, 0]);
			}
		}

		return places;
	},

	Cloud: function (context, width, height, cloud) {
		var places = this.Places(cloud);
		var turn = Number(this.Turn) || 0;
		var pitch = Number(this.Pitch) || 0;
		var cosTurn = Math.cos(turn);
		var sinTurn = Math.sin(turn);
		var cosPitch = Math.cos(pitch);
		var sinPitch = Math.sin(pitch);
		var middle = [0, 0, 0];
		var reach = 0;
		var largest = 0;
		var seen;
		var i;

		places.forEach(function (place) {
			middle[0] += place[0] / places.length;
			middle[1] += place[1] / places.length;
			middle[2] += place[2] / places.length;
		});

		/* Each point turned round the middle, then tilted to the eye: x across, y up, depth away. */
		seen = places.map(function (place, index) {
			var x = place[0] - middle[0];
			var y = place[1] - middle[1];
			var z = place[2] - middle[2];
			var across = x * cosTurn - z * sinTurn;
			var deep = x * sinTurn + z * cosTurn;

			reach = Math.max(reach, Math.hypot(x, y, z));
			largest = Math.max(largest, cloud.Sizes ? cloud.Sizes[index] : 0);

			return {Index: index, X: across, Y: y * cosPitch - deep * sinPitch, Depth: deep * cosPitch + y * sinPitch};
		}).sort(function (a, b) {
			return b.Depth - a.Depth;
		});

		var scale = Math.min(width, height) * 0.46 / (reach || 1);

		for (i = 0; i < seen.length; i++) {
			var one = seen[i];
			var at = one.Index;
			var color = cloud.Colors ? [cloud.Colors[at * 4], cloud.Colors[at * 4 + 1], cloud.Colors[at * 4 + 2], cloud.Colors[at * 4 + 3]] : [0.85, 0.88, 1, 0.9];
			var size = cloud.Sizes && largest ? 1 + 3 * cloud.Sizes[at] / largest : 1.4;

			context.globalAlpha = Math.max(0.12, Math.min(1, color[3]));
			context.fillStyle = 'rgb(' + Math.round(color[0] * 255) + ', ' + Math.round(color[1] * 255) + ', ' + Math.round(color[2] * 255) + ')';

			context.fillRect(width / 2 + one.X * scale - size / 2, height / 2 - one.Y * scale - size / 2, size, size);
		}

		context.globalAlpha = 1;
	},

	/*
	 * A network: its ways as lines, each of a color of its class, wider the more it carries (Flow along it); on a globe (points
	 * of three numbers) turned as a cloud is, the far side fainter; on a ground ([x, z]) seen from over it.
	 */
	Network: function (context, width, height, network) {
		var ways = network.Ways || [];
		var globe = ways.some(function (way) {
			return way.Points.length && way.Points[0].length > 2;
		});
		var turn = Number(this.Turn) || 0;
		var pitch = Number(this.Pitch) || 0;
		var low = [Infinity, Infinity];
		var high = [-Infinity, -Infinity];
		var most = 1;
		var scale;
		var place;

		ways.forEach(function (way) {
			way.Points.forEach(function (point) {
				low = [Math.min(low[0], point[0]), Math.min(low[1], point[1])];
				high = [Math.max(high[0], point[0]), Math.max(high[1], point[1])];
			});

			(Array.isArray(way.Values && way.Values.Flow) ? way.Values.Flow : []).forEach(function (flow) {
				most = Math.max(most, flow);
			});
		});

		if (globe) {
			scale = Math.min(width, height) * 0.46;
			place = function (point) {
				var across = point[0] * Math.cos(turn) - point[2] * Math.sin(turn);
				var deep = point[0] * Math.sin(turn) + point[2] * Math.cos(turn);

				return [width / 2 + across * scale, height / 2 - (point[1] * Math.cos(pitch) - deep * Math.sin(pitch)) * scale, deep * Math.cos(pitch) + point[1] * Math.sin(pitch)];
			};

			context.strokeStyle = 'rgba(128, 140, 160, 0.4)';

			context.beginPath();
			context.arc(width / 2, height / 2, scale, 0, Math.PI * 2);
			context.stroke();
		}
		else {
			scale = Math.min(width / (high[0] - low[0] || 1), height / (high[1] - low[1] || 1)) * 0.9;
			place = function (point) {
				return [width / 2 + (point[0] - (low[0] + high[0]) / 2) * scale, height / 2 + (point[1] - (low[1] + high[1]) / 2) * scale, -1];
			};
		}

		ways.forEach(function (way) {
			var hue = 0;
			var k;

			for (k = 0; k < String(way.Class).length; k++)
				hue = (hue * 31 + String(way.Class).charCodeAt(k)) % 360;

			context.strokeStyle = way.Class === 'river' ? '#3d8bfd' : 'hsl(' + hue + ', 60%, 55%)';

			for (k = 0; k + 1 < way.Points.length + (way.Closed ? 1 : 0); k++) {
				var a = place(way.Points[k]);
				var b = place(way.Points[(k + 1) % way.Points.length]);
				var flow = Array.isArray(way.Values && way.Values.Flow) ? way.Values.Flow[k] : 0;

				context.globalAlpha = a[2] > 0 ? 0.25 : 1;
				context.lineWidth = flow ? 0.6 + 3 * Math.sqrt(flow / most) : 2;

				context.beginPath();
				context.moveTo(a[0], a[1]);
				context.lineTo(b[0], b[1]);
				context.stroke();
			}
		});

		context.globalAlpha = 1;
	},

	/*
	 * A layout seen from over it: its lines (streets, walls, roads and ramps) as wide as they are, each of a color of its
	 * class, its boxes (lots, houses) turned as they stand.
	 */
	Layout: function (context, width, height, drawing) {
		var low = [Infinity, Infinity];
		var high = [-Infinity, -Infinity];
		var scale;

		function color (kind) {
			var hue = 0;
			var k;

			for (k = 0; k < String(kind).length; k++)
				hue = (hue * 31 + String(kind).charCodeAt(k)) % 360;

			return 'hsl(' + hue + ', 55%, 55%)';
		}

		drawing.Lines.forEach(function (line) {
			line.Points.forEach(function (point) {
				low = [Math.min(low[0], point[0]), Math.min(low[1], point[1])];
				high = [Math.max(high[0], point[0]), Math.max(high[1], point[1])];
			});
		});

		drawing.Boxes.forEach(function (box) {
			low = [Math.min(low[0], box.X), Math.min(low[1], box.Z)];
			high = [Math.max(high[0], box.X), Math.max(high[1], box.Z)];
		});

		scale = Math.min(width / (high[0] - low[0] || 1), height / (high[1] - low[1] || 1)) * 0.92;

		function place (x, z) {
			return [width / 2 + (x - (low[0] + high[0]) / 2) * scale, height / 2 + (z - (low[1] + high[1]) / 2) * scale];
		}

		context.lineCap = 'round';
		context.lineJoin = 'round';

		drawing.Lines.forEach(function (line) {
			context.strokeStyle = line.Class === 'edge' ? 'rgba(128, 140, 160, 0.6)' : color(line.Class);
			context.lineWidth = Math.max(1, (Number(line.Width) || 1) * scale);

			context.beginPath();

			line.Points.forEach(function (point, index) {
				var at = place(point[0], point[1]);

				if (index) context.lineTo(at[0], at[1]);
				else context.moveTo(at[0], at[1]);
			});

			context.stroke();
		});

		drawing.Boxes.forEach(function (box) {
			var turn = Number(box.Turn) || 0;
			var forward = [Math.sin(turn), Math.cos(turn)];
			var right = [Math.cos(turn), -Math.sin(turn)];

			context.fillStyle = color(box.Class);

			context.beginPath();

			[[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (corner, index) {
				var x = box.X + right[0] * corner[0] * box.Width / 2 + forward[0] * corner[1] * box.Depth / 2;
				var z = box.Z + right[1] * corner[0] * box.Width / 2 + forward[1] * corner[1] * box.Depth / 2;
				var at = place(x, z);

				if (index) context.lineTo(at[0], at[1]);
				else context.moveTo(at[0], at[1]);
			});

			context.closePath();
			context.fill();
		});
	},

	/* A picture, as large as it fits, over a checker where it is clear. */
	Image: function (context, width, height, picture) {
		var copy = document.createElement('canvas');
		var scale = Math.min(width / picture.Width, height / picture.Height);
		var size;

		copy.width = picture.Width;
		copy.height = picture.Height;

		copy.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(picture.Data.buffer, picture.Data.byteOffset, picture.Data.length), picture.Width, picture.Height), 0, 0);

		for (size = 0; size < width * height / 400; size++) {
			context.fillStyle = (Math.floor(size % Math.ceil(width / 20)) + Math.floor(size / Math.ceil(width / 20))) % 2 ? 'rgba(128, 128, 128, 0.25)' : 'rgba(128, 128, 128, 0.1)';

			context.fillRect(size % Math.ceil(width / 20) * 20, Math.floor(size / Math.ceil(width / 20)) * 20, 20, 20);
		}

		context.drawImage(copy, (width - picture.Width * scale) / 2, (height - picture.Height * scale) / 2, picture.Width * scale, picture.Height * scale);
	},

	/* A drag turns it round its height and tilts it. */
	Pressed: function (event) {
		this.Dragged = {X: event.clientX, Y: event.clientY, Turn: Number(this.Turn) || 0, Pitch: Number(this.Pitch) || 0};

		if (event.target && event.target.setPointerCapture && event.pointerId !== undefined)
			event.target.setPointerCapture(event.pointerId);
	},

	Moved: function (event) {
		if (!this.Dragged) return;

		this.Turn = this.Dragged.Turn + (event.clientX - this.Dragged.X) * 0.01;
		this.Pitch = Math.max(-1.5, Math.min(1.5, this.Dragged.Pitch + (event.clientY - this.Dragged.Y) * 0.01));

		this.Later();
	},

	Released: function () {
		this.Dragged = null;
	}
});
