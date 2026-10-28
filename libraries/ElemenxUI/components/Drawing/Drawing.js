/*
 * A vector drawing (SVG): shapes, lines, arrows, freehand strokes of brushes and texts, on layers, grouped or not.
 * Value is its model, as JSON keeps it: {Width, Height, Background, Layers: [{ID, Name, Visible, Locked, Items}]}, an
 * item {ID, Type, Stroke, Fill, Width, Opacity} with, by its Type: rect and ellipse {X, Y, W, H}, line and arrow
 * {Points: [{X, Y}, {X, Y}]}, path {Points: [{X, Y}], Brush}, text {X, Y, Text, Size} and group {Items}; the points are
 * in the units of the drawing (Width by Height), whatever its size on the screen. change emits the model after each
 * action, select the IDs of the items selected.
 * Tool is the one in hand: select (a press selects an item, Shift adds one, a drag on the empty drawing selects the
 * ones it covers, a drag moves them, the handles resize the one selected), rect, ellipse, line, arrow, path (freehand
 * with Brush: pen, marker, highlighter or calligraphy), text (a press writes a text there; a double press edits one)
 * and eraser (the items it passes over go). Stroke, Fill ('none' for no fill) and StrokeWidth paint the new items and
 * the ones selected. Layer is the ID of the layer the new items go into (the first one without; a DrawingLayers shows
 * and orders the layers). Toolbar shows the tools, the colors and the actions over it. ReadOnly shows the drawing
 * alone.
 * The keys on the drawing: Delete removes the selection, the arrows move it (Shift: by 10), Ctrl+Z and Ctrl+Y (or
 * Ctrl+Shift+Z) undo and redo, Ctrl+A selects the items of the layer, Ctrl+G groups, Ctrl+Shift+G ungroups, Escape
 * leaves the selection. Methods: Undo(), Redo(), Delete(), Group(), Ungroup(), Forward(), Backward() (the selection
 * up or down its layer), Select(ids), Selected(), Add(item, layer), Clear(), SVG() (the text of the SVG, without the
 * hidden layers) and PNG(callback, scale) (callback(error, data URL of the picture)).
 */
Elemenx.Component('Drawing', {
	$TemplateURL: 'Drawing.html',
	$StyleURL: 'Drawing.css',
	$Meta: {
		Group: 'media',
		Icon: 'brush',
		Description: 'A vector drawing: shapes, lines, arrows, freehand brushes and texts on layers, with groups and an export to SVG and PNG.',
		Events: {
			change: 'The drawing changed: its model.',
			select: 'The selection changed: the IDs of the items selected.'
		},
		Methods: ['Undo()', 'Redo()', 'Delete()', 'Group()', 'Ungroup()', 'Forward()', 'Backward()', 'Select(ids)', 'Selected()', 'Add(item, layer)', 'Clear()', 'SVG()', 'PNG(callback, scale)'],
		Props: {
			Value: 'The model: {Width, Height, Background, Layers: [{ID, Name, Visible, Locked, Items}]}.',
			Tool: {Options: ['select', 'rect', 'ellipse', 'line', 'arrow', 'path', 'text', 'eraser'], Description: 'The tool in hand.'},
			Brush: {Options: ['pen', 'marker', 'highlighter', 'calligraphy'], Description: 'The brush of the freehand tool.'},
			Stroke: 'The color of the lines of new items.',
			Fill: 'The color inside new shapes (none: no fill).',
			StrokeWidth: 'The width of the lines in the units of the drawing.',
			Layer: 'The ID of the layer new items go into.',
			Toolbar: 'Shows the tools, the colors and the actions over it.',
			ReadOnly: 'Shows the drawing alone.',
			Label: 'What it shows, for screen readers.'
		},
		Sample: {Value: {Width: 320, Height: 200, Layers: [{ID: 'layer-1', Name: 'Layer 1', Visible: true, Locked: false, Items: [{ID: 'a', Type: 'rect', X: 30, Y: 30, W: 120, H: 80, Stroke: '#3f6c9e', Fill: '#dbe7f5', Width: 2}, {ID: 'b', Type: 'ellipse', X: 170, Y: 60, W: 110, H: 90, Stroke: '#c0392b', Fill: 'none', Width: 3}]}]}}
	},
	Value: null,
	Tool: 'select',
	Brush: 'pen',
	Stroke: '#1f2328',
	Fill: 'none',
	StrokeWidth: 3,
	Layer: '',
	Toolbar: true,
	ReadOnly: false,
	Label: '',

	Tools: [
		{ID: 'select', Icon: 'pointer', Key: 'ui.drawing.select'},
		{ID: 'rect', Icon: 'square', Key: 'ui.drawing.rect'},
		{ID: 'ellipse', Icon: 'circle', Key: 'ui.drawing.ellipse'},
		{ID: 'line', Icon: 'line', Key: 'ui.drawing.line'},
		{ID: 'arrow', Icon: 'arrow-line', Key: 'ui.drawing.arrow'},
		{ID: 'path', Icon: 'freehand', Key: 'ui.drawing.path'},
		{ID: 'text', Icon: 'type', Key: 'ui.drawing.text'},
		{ID: 'eraser', Icon: 'eraser', Key: 'ui.drawing.eraser'}
	],
	Brushes: ['pen', 'marker', 'highlighter', 'calligraphy'],

	/* The brushes of the freehand tool: the width they give the stroke, their opacity and the ends of their lines. */
	BrushStyles: {
		pen: {Key: 'ui.drawing.brushes.pen', Scale: 1, Opacity: 1, Cap: 'round'},
		marker: {Key: 'ui.drawing.brushes.marker', Scale: 2.5, Opacity: 0.9, Cap: 'round'},
		highlighter: {Key: 'ui.drawing.brushes.highlighter', Scale: 6, Opacity: 0.35, Cap: 'square'},
		calligraphy: {Key: 'ui.drawing.brushes.calligraphy', Scale: 3, Opacity: 1, Cap: 'round'}
	},

	/* The state of the tools and of the selection: none of it is rendered by the template. */
	Chosen: [],
	Past: 0,
	Future: 0,

	$OnCreate: function () {
		var own = {Model: null, Emitted: '', Past: [], Future: [], Drag: null, Svg: null, Editor: null, Sequence: 0};

		this.Own = function () {
			return own;
		};

		own.Model = this.Normalize(this.Value);
		own.Emitted = JSON.stringify(own.Model);
	},

	$OnReady: function () {
		var stage = this.$Element().querySelector('.elemenx-drawing-stage');
		var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

		svg.setAttribute('class', 'elemenx-drawing-svg');
		svg.setAttribute('role', 'img');

		stage.insertBefore(svg, stage.firstChild);

		this.Own().Svg = svg;

		this.Render();
	},

	$OnProps: function () {
		var own = this.Own();
		var text = JSON.stringify(this.Value || null);

		/* A model given from outside (not the one emitted here) takes the place of this one; the history stays. */
		if (this.Value && text !== own.Emitted) {
			own.Model = this.Normalize(this.Value);
			own.Emitted = JSON.stringify(own.Model);

			this.Chosen = this.Chosen.filter(function (id) {
				return !!this.Find(id);
			}, this);
		}

		this.Render();
	},

	Model: function () {
		return this.Own().Model;
	},

	/* A model of its own from a value: a copy, with a size, a layer at least and an ID on every layer and item. */
	Normalize: function (value) {
		var self = this;
		var model = value ? JSON.parse(JSON.stringify(value)) : {};

		model.Width = Number(model.Width) > 0 ? Number(model.Width) : 800;
		model.Height = Number(model.Height) > 0 ? Number(model.Height) : 500;
		model.Background = model.Background || '';
		model.Layers = Array.isArray(model.Layers) && model.Layers.length ? model.Layers : [{Name: Elemenx.Locale.Text('ui.drawing.layer') + ' 1'}];

		model.Layers.forEach(function (layer, index) {
			layer.ID = layer.ID || 'layer-' + (index + 1);
			layer.Name = layer.Name || Elemenx.Locale.Text('ui.drawing.layer') + ' ' + (index + 1);
			layer.Visible = layer.Visible !== false;
			layer.Locked = !!layer.Locked;
			layer.Items = Array.isArray(layer.Items) ? layer.Items : [];

			self.Walk(layer.Items, function (item) {
				item.ID = item.ID || self.NewID();
			});
		});

		return model;
	},

	NewID: function () {
		return 'item-' + Date.now().toString(36) + '-' + (++this.Own().Sequence);
	},

	/* Calls visit for each item of a list and of its groups, deep first; visit(item, list) returns true to stop. */
	Walk: function (items, visit) {
		var i;

		for (i = 0; i < items.length; i++) {
			if (visit(items[i], items)) return true;
			if (items[i].Type === 'group' && this.Walk(items[i].Items || [], visit)) return true;
		}

		return false;
	},

	/* The layer of new items: Layer, or the first one. */
	Current: function () {
		var layers = this.Model().Layers;
		var found = layers.filter(function (layer) {
			return layer.ID === this.Layer;
		}, this)[0];

		return found || layers[0];
	},

	/* An item on the top level of a layer by its ID, with its layer and its place: {Item, Layer, Index}, or null. */
	Find: function (id) {
		var layers = this.Model().Layers;
		var i;
		var k;

		for (i = 0; i < layers.length; i++) {
			for (k = 0; k < layers[i].Items.length; k++) {
				if (layers[i].Items[k].ID === id)
					return {Item: layers[i].Items[k], Layer: layers[i], Index: k};
			}
		}

		return null;
	},

	Editable: function () {
		return !(this.ReadOnly && this.ReadOnly !== 'false');
	},

	/* The history: the model before each action, to go back to (100 at most). */
	Snapshot: function () {
		return JSON.stringify(this.Model());
	},

	Commit: function (before) {
		var own = this.Own();
		var after = this.Snapshot();

		if (before === after) {
			this.Render();

			return;
		}

		own.Past.push(before);

		if (own.Past.length > 100)
			own.Past.shift();

		own.Future = [];

		this.Emit(after);
	},

	/* The model goes out: Value and change; the selection keeps the items still there. */
	Emit: function (text) {
		var own = this.Own();

		own.Emitted = text;

		this.Past = own.Past.length;
		this.Future = own.Future.length;
		this.Value = JSON.parse(text);

		this.Chosen = this.Chosen.filter(function (id) {
			return !!this.Find(id);
		}, this);

		this.Render();
		this.$Emit('change', JSON.parse(text));
	},

	Undo: function () {
		var own = this.Own();
		if (!own.Past.length) return this;

		own.Future.push(this.Snapshot());

		own.Model = JSON.parse(own.Past.pop());

		this.Emit(this.Snapshot());

		return this;
	},

	Redo: function () {
		var own = this.Own();
		if (!own.Future.length) return this;

		own.Past.push(this.Snapshot());

		own.Model = JSON.parse(own.Future.pop());

		this.Emit(this.Snapshot());

		return this;
	},

	Selected: function () {
		return this.Chosen.slice();
	},

	Select: function (ids) {
		var self = this;
		var list = (ids || []).filter(function (id) {
			return !!self.Find(id);
		});

		if (list.join('|') !== this.Chosen.join('|')) {
			this.Chosen = list;

			this.$Emit('select', list.slice());
		}

		this.Render();

		return this;
	},

	/* An item added to a layer (by its ID; the current one without), on top of it: its ID. */
	Add: function (item, layer) {
		var before = this.Snapshot();
		var target = this.Model().Layers.filter(function (each) {
			return each.ID === layer;
		})[0] || this.Current();
		var copy = JSON.parse(JSON.stringify(item));
		var self = this;

		this.Walk([copy], function (each) {
			each.ID = each.ID && !self.Find(each.ID) ? each.ID : self.NewID();
		});

		target.Items.push(copy);

		this.Commit(before);

		return copy.ID;
	},

	Clear: function () {
		var before = this.Snapshot();

		this.Model().Layers.forEach(function (layer) {
			layer.Items = [];
		});

		this.Chosen = [];

		this.Commit(before);

		return this;
	},

	Delete: function () {
		var before = this.Snapshot();
		var self = this;

		this.Chosen.forEach(function (id) {
			var found = self.Find(id);
			if (found && !found.Layer.Locked)
				found.Layer.Items.splice(found.Index, 1);
		});

		this.Select([]);
		this.Commit(before);

		return this;
	},

	/* The items selected in one group, in the place of the topmost of them (in its layer). */
	Group: function () {
		var before = this.Snapshot();
		var self = this;
		var found = this.Chosen.map(function (id) {
			return self.Find(id);
		}).filter(function (each) {
			return each && !each.Layer.Locked;
		});
		var layer;
		var group;
		var place;

		if (found.length < 2) return this;

		/* In the order of their layers, then of their places: the group keeps how they cover each other. */
		found.sort(function (a, b) {
			var layers = self.Model().Layers;

			return layers.indexOf(a.Layer) - layers.indexOf(b.Layer) || a.Index - b.Index;
		});

		layer = found[found.length - 1].Layer;
		place = found[found.length - 1].Index;
		group = {ID: this.NewID(), Type: 'group', Items: found.map(function (each) {
			return each.Item;
		})};

		found.slice().reverse().forEach(function (each) {
			var index = each.Layer.Items.indexOf(each.Item);

			each.Layer.Items.splice(index, 1);

			if (each.Layer === layer && index < place)
				place--;
		});

		layer.Items.splice(place, 0, group);

		this.Chosen = [group.ID];

		this.Commit(before);
		this.$Emit('select', [group.ID]);

		return this;
	},

	/* The groups selected give their items back, in their place. */
	Ungroup: function () {
		var before = this.Snapshot();
		var self = this;
		var chosen = [];

		this.Chosen.forEach(function (id) {
			var found = self.Find(id);

			if (!found || found.Item.Type !== 'group' || found.Layer.Locked) {
				chosen.push(id);

				return;
			}

			Array.prototype.splice.apply(found.Layer.Items, [found.Index, 1].concat(found.Item.Items || []));

			chosen = chosen.concat((found.Item.Items || []).map(function (item) {
				return item.ID;
			}));
		});

		this.Chosen = chosen;

		this.Commit(before);
		this.$Emit('select', chosen.slice());

		return this;
	},

	/* The selection one place up (Forward) or down (Backward) in its layer. */
	Order: function (step) {
		var before = this.Snapshot();
		var self = this;
		var found = this.Chosen.map(function (id) {
			return self.Find(id);
		}).filter(Boolean);

		found.sort(function (a, b) {
			return step > 0 ? b.Index - a.Index : a.Index - b.Index;
		});

		found.forEach(function (each) {
			var items = each.Layer.Items;
			var index = items.indexOf(each.Item);
			var target = index + step;
			if (each.Layer.Locked || target < 0 || target >= items.length || self.Chosen.indexOf(items[target].ID) !== -1) return;

			items.splice(index, 1);
			items.splice(target, 0, each.Item);
		});

		this.Commit(before);

		return this;
	},

	Forward: function () {
		return this.Order(1);
	},

	Backward: function () {
		return this.Order(-1);
	},

	/* Geometry. The box of an item {X, Y, W, H}, in the units of the drawing. */
	Bounds: function (item) {
		var self = this;
		var boxes;
		var lines;
		var left;
		var top;
		var right;
		var bottom;

		if (item.Type === 'rect' || item.Type === 'ellipse')
			return {X: Math.min(item.X, item.X + item.W), Y: Math.min(item.Y, item.Y + item.H), W: Math.abs(item.W), H: Math.abs(item.H)};

		if (item.Type === 'text') {
			lines = String(item.Text || '').split('\n');

			return {X: item.X, Y: item.Y, W: Math.max(1, Math.max.apply(null, lines.map(function (line) {
				return line.length;
			})) * (item.Size || 24) * 0.58), H: lines.length * (item.Size || 24) * 1.25};
		}

		if (item.Type === 'group') {
			boxes = (item.Items || []).map(function (child) {
				return self.Bounds(child);
			});

			if (!boxes.length)
				return {X: 0, Y: 0, W: 0, H: 0};

			left = Math.min.apply(null, boxes.map(function (box) {
				return box.X;
			}));
			top = Math.min.apply(null, boxes.map(function (box) {
				return box.Y;
			}));
			right = Math.max.apply(null, boxes.map(function (box) {
				return box.X + box.W;
			}));
			bottom = Math.max.apply(null, boxes.map(function (box) {
				return box.Y + box.H;
			}));

			return {X: left, Y: top, W: right - left, H: bottom - top};
		}

		left = Math.min.apply(null, (item.Points || [{X: 0}]).map(function (point) {
			return point.X;
		}));
		top = Math.min.apply(null, (item.Points || [{Y: 0}]).map(function (point) {
			return point.Y;
		}));
		right = Math.max.apply(null, (item.Points || [{X: 0}]).map(function (point) {
			return point.X;
		}));
		bottom = Math.max.apply(null, (item.Points || [{Y: 0}]).map(function (point) {
			return point.Y;
		}));

		return {X: left, Y: top, W: right - left, H: bottom - top};
	},

	/* The width a stroke of an item is drawn with: a brush widens a freehand one. */
	LineWidth: function (item) {
		var width = Number(item.Width) || 0;

		return item.Type === 'path' ? width * (this.BrushStyles[item.Brush] || this.BrushStyles.pen).Scale : width;
	},

	/* How far a point is from the segment a-b. */
	Distance: function (point, a, b) {
		var dx = b.X - a.X;
		var dy = b.Y - a.Y;
		var length = dx * dx + dy * dy;
		var t = length ? Math.max(0, Math.min(1, ((point.X - a.X) * dx + (point.Y - a.Y) * dy) / length)) : 0;

		return Math.sqrt(Math.pow(point.X - a.X - t * dx, 2) + Math.pow(point.Y - a.Y - t * dy, 2));
	},

	/* Whether a point (with a tolerance in the units of the drawing) is on an item: its lines, or inside a filled shape, a text or a group. */
	Hits: function (item, point, tolerance) {
		var self = this;
		var box = this.Bounds(item);
		var reach = tolerance + this.LineWidth(item) / 2;
		var points = item.Points || [];
		var filled = item.Fill && item.Fill !== 'none';
		var rx;
		var ry;
		var spot;
		var i;

		if (item.Type === 'group')
			return (item.Items || []).some(function (child) {
				return self.Hits(child, point, tolerance);
			});

		if (item.Type === 'text')
			return point.X >= box.X - tolerance && point.X <= box.X + box.W + tolerance && point.Y >= box.Y - tolerance && point.Y <= box.Y + box.H + tolerance;

		if (item.Type === 'rect') {
			if (filled && point.X >= box.X && point.X <= box.X + box.W && point.Y >= box.Y && point.Y <= box.Y + box.H) return true;

			return [[0, 0, 1, 0], [1, 0, 1, 1], [1, 1, 0, 1], [0, 1, 0, 0]].some(function (side) {
				return self.Distance(point, {X: box.X + side[0] * box.W, Y: box.Y + side[1] * box.H}, {X: box.X + side[2] * box.W, Y: box.Y + side[3] * box.H}) <= reach;
			});
		}

		if (item.Type === 'ellipse') {
			rx = box.W / 2;
			ry = box.H / 2;

			if (!rx || !ry) return false;

			spot = Math.sqrt(Math.pow((point.X - box.X - rx) / rx, 2) + Math.pow((point.Y - box.Y - ry) / ry, 2));

			return filled ? spot <= 1 + reach / Math.min(rx, ry) : Math.abs(spot - 1) * Math.min(rx, ry) <= reach;
		}

		if (points.length === 1)
			return Math.sqrt(Math.pow(point.X - points[0].X, 2) + Math.pow(point.Y - points[0].Y, 2)) <= reach;

		for (i = 1; i < points.length; i++) {
			if (this.Distance(point, points[i - 1], points[i]) <= reach) return true;
		}

		return false;
	},

	/* The topmost item under a point, of the visible layers not locked: {Item, Layer, Index}, or null. */
	Hit: function (point, tolerance) {
		var layers = this.Model().Layers;
		var i;
		var k;

		for (i = layers.length - 1; i >= 0; i--) {
			if (!layers[i].Visible || layers[i].Locked) continue;

			for (k = layers[i].Items.length - 1; k >= 0; k--) {
				if (this.Hits(layers[i].Items[k], point, tolerance))
					return {Item: layers[i].Items[k], Layer: layers[i], Index: k};
			}
		}

		return null;
	},

	/* An item moved by dx, dy. */
	Translate: function (item, dx, dy) {
		var self = this;

		if (item.Type === 'group') {
			(item.Items || []).forEach(function (child) {
				self.Translate(child, dx, dy);
			});

			return;
		}

		if (item.Points) {
			item.Points.forEach(function (point) {
				point.X = self.Round(point.X + dx);
				point.Y = self.Round(point.Y + dy);
			});

			return;
		}

		item.X = this.Round(item.X + dx);
		item.Y = this.Round(item.Y + dy);
	},

	/* An item taken from the box from to the box to: its points placed again in it (a text grows with its height). */
	Scale: function (item, from, to) {
		var self = this;
		var sx = from.W ? to.W / from.W : 1;
		var sy = from.H ? to.H / from.H : 1;

		function x (value) {
			return self.Round(to.X + (value - from.X) * sx);
		}

		function y (value) {
			return self.Round(to.Y + (value - from.Y) * sy);
		}

		if (item.Type === 'group') {
			(item.Items || []).forEach(function (child) {
				self.Scale(child, from, to);
			});

			return;
		}

		if (item.Points) {
			item.Points.forEach(function (point) {
				point.X = x(point.X);
				point.Y = y(point.Y);
			});

			return;
		}

		if (item.Type === 'text')
			item.Size = Math.max(4, this.Round((item.Size || 24) * Math.abs(sy)));

		if (item.Type === 'rect' || item.Type === 'ellipse') {
			item.W = this.Round(item.W * sx);
			item.H = this.Round(item.H * sy);
		}

		item.X = x(item.X);
		item.Y = y(item.Y);
	},

	Round: function (value) {
		return Math.round(value * 10) / 10;
	},

	/* Markup. An attribute value, escaped. */
	Escape: function (value) {
		return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	},

	/* A freehand stroke as quadratic curves through the middles of its points. */
	Curve: function (points) {
		var d;
		var i;

		if (!points.length) return '';

		if (points.length === 1)
			return 'M' + points[0].X + ' ' + points[0].Y + 'l0.01 0';

		d = 'M' + points[0].X + ' ' + points[0].Y;

		for (i = 1; i < points.length - 1; i++)
			d += 'Q' + points[i].X + ' ' + points[i].Y + ' ' + this.Round((points[i].X + points[i + 1].X) / 2) + ' ' + this.Round((points[i].Y + points[i + 1].Y) / 2);

		return d + 'L' + points[points.length - 1].X + ' ' + points[points.length - 1].Y;
	},

	/* A stroke of the calligraphy brush: the outline of a flat nib held at 45 degrees along the points. */
	Nib: function (points, width) {
		var nx = width / 2 * Math.SQRT1_2;
		var ny = -width / 2 * Math.SQRT1_2;
		var self = this;
		var left = points.map(function (point) {
			return self.Round(point.X + nx) + ' ' + self.Round(point.Y + ny);
		});
		var right = points.map(function (point) {
			return self.Round(point.X - nx) + ' ' + self.Round(point.Y - ny);
		}).reverse();

		return 'M' + left.join('L') + 'L' + right.join('L') + 'Z';
	},

	/* The SVG of an item. */
	Markup: function (item) {
		var self = this;
		var stroke = this.Escape(item.Stroke || 'none');
		var fill = this.Escape(item.Fill || 'none');
		var width = this.LineWidth(item);
		var brush = this.BrushStyles[item.Brush] || this.BrushStyles.pen;
		var opacity = (item.Opacity === undefined || item.Opacity === null ? 1 : Number(item.Opacity)) * (item.Type === 'path' ? brush.Opacity : 1);
		var common = ' data-id="' + this.Escape(item.ID) + '"' + (opacity < 1 ? ' opacity="' + this.Round(opacity * 100) / 100 + '"' : '');
		var points = item.Points || [];
		var box = this.Bounds(item);
		var head;
		var angle;
		var end;
		var size;

		if (item.Type === 'group')
			return '<g' + common + '>' + (item.Items || []).map(function (child) {
				return self.Markup(child);
			}).join('') + '</g>';

		if (item.Type === 'rect')
			return '<rect' + common + ' x="' + box.X + '" y="' + box.Y + '" width="' + box.W + '" height="' + box.H + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + width + '" stroke-linejoin="round"/>';

		if (item.Type === 'ellipse')
			return '<ellipse' + common + ' cx="' + this.Round(box.X + box.W / 2) + '" cy="' + this.Round(box.Y + box.H / 2) + '" rx="' + this.Round(box.W / 2) + '" ry="' + this.Round(box.H / 2) + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + width + '"/>';

		if (item.Type === 'text')
			return '<text' + common + ' x="' + item.X + '" y="' + item.Y + '" font-size="' + (item.Size || 24) + '" font-family="sans-serif" fill="' + this.Escape(item.Stroke || 'currentColor') + '" dominant-baseline="hanging">' + String(item.Text || '').split('\n').map(function (line, index) {
				return '<tspan x="' + item.X + '"' + (index ? ' dy="1.25em"' : '') + '>' + self.Escape(line || ' ') + '</tspan>';
			}).join('') + '</text>';

		if (item.Type === 'line' || item.Type === 'arrow') {
			if (points.length < 2) return '';

			head = '';

			if (item.Type === 'arrow') {
				end = points[points.length - 1];
				angle = Math.atan2(end.Y - points[0].Y, end.X - points[0].X);
				size = Math.max(8, width * 4);
				head = '<path d="M' + this.Round(end.X - size * Math.cos(angle - 0.45)) + ' ' + this.Round(end.Y - size * Math.sin(angle - 0.45)) + 'L' + end.X + ' ' + end.Y + 'L' + this.Round(end.X - size * Math.cos(angle + 0.45)) + ' ' + this.Round(end.Y - size * Math.sin(angle + 0.45)) + 'Z" fill="' + stroke + '" stroke="' + stroke + '" stroke-width="' + width + '" stroke-linejoin="round"/>';
			}

			return '<g' + common + '><path d="M' + points[0].X + ' ' + points[0].Y + 'L' + points[1].X + ' ' + points[1].Y + '" fill="none" stroke="' + stroke + '" stroke-width="' + width + '" stroke-linecap="round"/>' + head + '</g>';
		}

		if (item.Brush === 'calligraphy')
			return '<path' + common + ' d="' + this.Nib(points, width) + '" fill="' + stroke + '" stroke="' + stroke + '" stroke-width="1" stroke-linejoin="round"/>';

		return '<path' + common + ' d="' + this.Curve(points) + '" fill="none" stroke="' + stroke + '" stroke-width="' + width + '" stroke-linecap="' + brush.Cap + '" stroke-linejoin="round"/>';
	},

	/* The SVG of the layers shown, in their order. */
	Layers: function () {
		var self = this;

		return this.Model().Layers.filter(function (layer) {
			return layer.Visible;
		}).map(function (layer) {
			return '<g data-layer="' + self.Escape(layer.ID) + '">' + layer.Items.map(function (item) {
				return self.Markup(item);
			}).join('') + '</g>';
		}).join('');
	},

	/* The drawing as the text of an SVG file: its size, its background and its visible layers. */
	SVG: function () {
		var model = this.Model();

		return '<svg xmlns="http://www.w3.org/2000/svg" width="' + model.Width + '" height="' + model.Height + '" viewBox="0 0 ' + model.Width + ' ' + model.Height + '">' + (model.Background ? '<rect width="100%" height="100%" fill="' + this.Escape(model.Background) + '"/>' : '') + this.Layers() + '</svg>';
	},

	/* The drawing as a PNG: callback(error, data URL), scale the pixels for each unit (1). */
	PNG: function (callback, scale) {
		var model = this.Model();
		var factor = Number(scale) > 0 ? Number(scale) : 1;
		var picture = new Image();

		picture.onload = function () {
			var canvas = document.createElement('canvas');
			var context;

			canvas.width = Math.round(model.Width * factor);
			canvas.height = Math.round(model.Height * factor);
			context = canvas.getContext('2d');

			context.drawImage(picture, 0, 0, canvas.width, canvas.height);

			callback(null, canvas.toDataURL('image/png'));
		};

		picture.onerror = function () {
			callback(new Error('Elemenx Drawing PNG could not draw the SVG'));
		};

		picture.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(this.SVG());
	},

	/* The units of the drawing in a pixel of the screen. */
	Unit: function () {
		var svg = this.Own().Svg;
		var width = svg ? svg.getBoundingClientRect().width : 0;

		return width ? this.Model().Width / width : 1;
	},

	/* The drawing on the screen: the layers, the selection with its handles, and the frame of a drag that selects. */
	Render: function () {
		var self = this;
		var own = this.Own();
		var model = this.Model();
		var unit;
		var handle;
		var marks = '';
		var box;

		if (!own.Svg) return;

		own.Svg.setAttribute('viewBox', '0 0 ' + model.Width + ' ' + model.Height);
		own.Svg.setAttribute('aria-label', this.Label || Elemenx.Locale.Text('ui.drawing.label'));

		own.Svg.style.background = model.Background || '';

		unit = this.Unit();
		handle = 8 * unit;

		this.Chosen.forEach(function (id) {
			var found = self.Find(id);
			if (!found || !found.Layer.Visible) return;

			box = self.Bounds(found.Item);
			marks += '<rect class="elemenx-drawing-selection" x="' + (box.X - 3 * unit) + '" y="' + (box.Y - 3 * unit) + '" width="' + (box.W + 6 * unit) + '" height="' + (box.H + 6 * unit) + '" stroke-width="' + unit + '"/>';
		});

		/* One item selected, not locked: the handles of its box. */
		if (this.Chosen.length === 1 && this.Find(this.Chosen[0]) && !this.Find(this.Chosen[0]).Layer.Locked && this.Editable()) {
			box = this.Bounds(this.Find(this.Chosen[0]).Item);

			this.Handles(box).forEach(function (spot) {
				marks += '<rect class="elemenx-drawing-handle" data-handle="' + spot.Name + '" x="' + (spot.X - handle / 2) + '" y="' + (spot.Y - handle / 2) + '" width="' + handle + '" height="' + handle + '" stroke-width="' + unit + '"/>';
			});
		}

		if (own.Drag && own.Drag.Mode === 'marquee' && own.Drag.Box)
			marks += '<rect class="elemenx-drawing-marquee" x="' + own.Drag.Box.X + '" y="' + own.Drag.Box.Y + '" width="' + own.Drag.Box.W + '" height="' + own.Drag.Box.H + '" stroke-width="' + unit + '"/>';

		own.Svg.innerHTML = this.Layers() + '<g class="elemenx-drawing-marks">' + marks + '</g>';
	},

	/* The handles of a box: its corners and the middles of its sides. */
	Handles: function (box) {
		return [
			{Name: 'nw', X: box.X, Y: box.Y}, {Name: 'n', X: box.X + box.W / 2, Y: box.Y}, {Name: 'ne', X: box.X + box.W, Y: box.Y},
			{Name: 'e', X: box.X + box.W, Y: box.Y + box.H / 2}, {Name: 'se', X: box.X + box.W, Y: box.Y + box.H},
			{Name: 's', X: box.X + box.W / 2, Y: box.Y + box.H}, {Name: 'sw', X: box.X, Y: box.Y + box.H}, {Name: 'w', X: box.X, Y: box.Y + box.H / 2}
		];
	},

	/* The point of a pointer event in the units of the drawing. */
	Point: function (event) {
		var rect = this.Own().Svg.getBoundingClientRect();
		var unit = this.Unit();

		return {X: this.Round((event.clientX - rect.left) * unit), Y: this.Round((event.clientY - rect.top) * unit)};
	},

	/* The tools. */
	Pick: function (event) {
		var node = event && event.target && event.target.closest ? event.target.closest('[data-tool]') : null;
		if (node)
			this.Tool = node.getAttribute('data-tool');

		this.Finish();
	},

	BrushOptions: function () {
		var self = this;

		return this.Brushes.map(function (brush) {
			return {Value: brush, Label: Elemenx.Locale.Text(self.BrushStyles[brush].Key)};
		});
	},

	Brushed: function (value) {
		this.Brush = value;
		this.Tool = 'path';
	},

	/* A color or a width chosen: the new items take it, and the items selected too. */
	Paint: function (key, value) {
		var before = this.Snapshot();
		var self = this;

		this.Chosen.forEach(function (id) {
			var found = self.Find(id);
			if (!found || found.Layer.Locked) return;

			self.Walk([found.Item], function (item) {
				if (key === 'Fill' && (item.Type === 'rect' || item.Type === 'ellipse'))
					item.Fill = value;

				if (key === 'Stroke' && item.Type !== 'group')
					item.Stroke = value;

				if (key === 'Width' && item.Type !== 'group' && item.Type !== 'text')
					item.Width = value;
			});
		});

		this.Commit(before);
	},

	Stroked: function (event) {
		this.Stroke = event.target.value;

		this.Paint('Stroke', this.Stroke);
	},

	Filled: function (event) {
		this.Fill = event.target.value;

		this.Paint('Fill', this.Fill);
	},

	/* The checkbox of the fill: off leaves the shapes empty, on fills them with the color chosen. */
	Unfilled: function (event) {
		this.Fill = event.target.checked ? this.$Element().querySelector('.elemenx-drawing-fill').value : 'none';

		this.Paint('Fill', this.Fill);
	},

	Widened: function (event) {
		this.StrokeWidth = Math.max(0.5, Number(event.target.value) || 1);

		this.Paint('Width', this.StrokeWidth);
	},

	/* The pointer on the drawing. */
	Down: function (event) {
		var own = this.Own();
		var point;
		var layer = this.Current();
		var found;
		var handle;
		var item;

		if (!this.Editable() || (event.button !== undefined && event.button > 0)) return;

		this.Finish();

		point = this.Point(event);

		event.preventDefault();

		if (event.pointerId !== undefined && own.Svg.setPointerCapture)
			own.Svg.setPointerCapture(event.pointerId);

		this.$Element().querySelector('.elemenx-drawing-stage').focus();

		if (this.Tool === 'select') {
			handle = event.target && event.target.getAttribute ? event.target.getAttribute('data-handle') : null;

			if (handle && this.Chosen.length === 1) {
				found = this.Find(this.Chosen[0]);
				own.Drag = {Mode: 'resize', Handle: handle, Start: point, Before: this.Snapshot(), From: this.Bounds(found.Item), Original: JSON.stringify(found.Item), ID: found.Item.ID};

				return;
			}

			found = this.Hit(point, 4 * this.Unit());

			if (found && event.shiftKey) {
				this.Select(this.Chosen.indexOf(found.Item.ID) === -1 ? this.Chosen.concat([found.Item.ID]) : this.Chosen.filter(function (id) {
					return id !== found.Item.ID;
				}));
			}
			else if (found && this.Chosen.indexOf(found.Item.ID) === -1) {
				this.Select([found.Item.ID]);
			}

			if (found) {
				own.Drag = {Mode: 'move', Start: point, Last: point, Before: this.Snapshot()};

				return;
			}

			if (!event.shiftKey)
				this.Select([]);

			own.Drag = {Mode: 'marquee', Start: point, Box: null, Kept: this.Chosen.slice()};

			return;
		}

		if (this.Tool === 'eraser') {
			own.Drag = {Mode: 'erase', Before: this.Snapshot()};

			this.Erase(point);

			return;
		}

		if (this.Tool === 'text') {
			this.Write(point, null);

			return;
		}

		/* A new item goes into the layer of new items, unless it is hidden or locked. */
		if (!layer.Visible || layer.Locked) return;

		item = {ID: this.NewID(), Type: this.Tool, Stroke: this.Stroke, Width: Number(this.StrokeWidth) || 1};

		if (this.Tool === 'rect' || this.Tool === 'ellipse') {
			item.X = point.X;
			item.Y = point.Y;
			item.W = 0;
			item.H = 0;
			item.Fill = this.Fill;
		}
		else if (this.Tool === 'path') {
			item.Points = [point];
			item.Brush = this.Brush;
		}
		else {
			item.Points = [point, {X: point.X, Y: point.Y}];
		}

		own.Drag = {Mode: 'draw', Start: point, Before: this.Snapshot(), Item: item};

		layer.Items.push(item);

		this.Render();
	},

	Move: function (event) {
		var own = this.Own();
		var drag = own.Drag;
		var point;
		var item;
		var self = this;
		var dx;
		var dy;
		var last;
		var found;
		var box;

		if (!drag) return;

		point = this.Point(event);

		if (drag.Mode === 'erase') {
			this.Erase(point);

			return;
		}

		if (drag.Mode === 'move') {
			dx = point.X - drag.Last.X;
			dy = point.Y - drag.Last.Y;
			drag.Last = point;

			this.Chosen.forEach(function (id) {
				found = self.Find(id);

				if (found && !found.Layer.Locked)
					self.Translate(found.Item, dx, dy);
			});

			this.Render();

			return;
		}

		if (drag.Mode === 'marquee') {
			drag.Box = {X: Math.min(drag.Start.X, point.X), Y: Math.min(drag.Start.Y, point.Y), W: Math.abs(point.X - drag.Start.X), H: Math.abs(point.Y - drag.Start.Y)};

			this.Covered(drag);

			return;
		}

		if (drag.Mode === 'resize') {
			found = this.Find(drag.ID);
			box = this.Resized(drag.From, drag.Handle, point.X - drag.Start.X, point.Y - drag.Start.Y, event.shiftKey);
			item = JSON.parse(drag.Original);

			this.Scale(item, drag.From, box);

			found.Layer.Items[found.Index] = item;

			this.Render();

			return;
		}

		item = drag.Item;

		if (item.Type === 'rect' || item.Type === 'ellipse') {
			dx = point.X - drag.Start.X;
			dy = point.Y - drag.Start.Y;

			/* Shift keeps a square or a circle. */
			if (event.shiftKey) {
				dx = Math.sign(dx || 1) * Math.max(Math.abs(dx), Math.abs(dy));
				dy = Math.sign(dy || 1) * Math.abs(dx);
			}

			item.W = this.Round(dx);
			item.H = this.Round(dy);
		}
		else if (item.Type === 'path') {
			last = item.Points[item.Points.length - 1];

			/* Points closer than a pixel of the screen add nothing. */
			if (Math.abs(point.X - last.X) + Math.abs(point.Y - last.Y) < this.Unit()) return;

			item.Points.push(point);
		}
		else {
			item.Points[1] = point;
		}

		this.Render();
	},

	Up: function () {
		var own = this.Own();
		var drag = own.Drag;
		var item;
		var found;

		if (!drag) return;

		own.Drag = null;

		if (drag.Mode === 'marquee') {
			this.Render();

			return;
		}

		if (drag.Mode === 'draw') {
			item = drag.Item;
			found = this.Find(item.ID);

			/* A shape without a size, or a line of no length, is left out. */
			if (found && ((item.Type === 'rect' || item.Type === 'ellipse') ? !item.W || !item.H : item.Type !== 'path' && item.Points[0].X === item.Points[1].X && item.Points[0].Y === item.Points[1].Y))
				found.Layer.Items.splice(found.Index, 1);
		}

		this.Commit(drag.Before);
	},

	/* A box resized by a handle moved by dx, dy (Shift keeps its proportions). */
	Resized: function (box, handle, dx, dy, keep) {
		var left = box.X;
		var top = box.Y;
		var right = box.X + box.W;
		var bottom = box.Y + box.H;
		var ratio = box.H ? box.W / box.H : 1;

		if (handle.indexOf('w') !== -1)
			left += dx;

		if (handle.indexOf('e') !== -1)
			right += dx;

		if (handle.indexOf('n') !== -1)
			top += dy;

		if (handle.indexOf('s') !== -1)
			bottom += dy;

		if (keep && handle.length === 2) {
			if (Math.abs(right - left) / ratio > Math.abs(bottom - top)) {
				if (handle.indexOf('n') !== -1) top = bottom - Math.abs(right - left) / ratio;
				else bottom = top + Math.abs(right - left) / ratio;
			}
			else {
				if (handle.indexOf('w') !== -1) left = right - Math.abs(bottom - top) * ratio;
				else right = left + Math.abs(bottom - top) * ratio;
			}
		}

		return {X: left, Y: top, W: right - left, H: bottom - top};
	},

	/* The items a drag that selects covers whole, with the ones kept by Shift. */
	Covered: function (drag) {
		var self = this;
		var chosen = drag.Kept.slice();

		this.Model().Layers.forEach(function (layer) {
			if (!layer.Visible || layer.Locked) return;

			layer.Items.forEach(function (item) {
				var box = self.Bounds(item);
				if (box.X >= drag.Box.X && box.Y >= drag.Box.Y && box.X + box.W <= drag.Box.X + drag.Box.W && box.Y + box.H <= drag.Box.Y + drag.Box.H && chosen.indexOf(item.ID) === -1)
					chosen.push(item.ID);
			});
		});

		this.Select(chosen);
	},

	/* The eraser at a point: the item under it goes. */
	Erase: function (point) {
		var found = this.Hit(point, 6 * this.Unit());
		if (!found) return;

		found.Layer.Items.splice(found.Index, 1);

		this.Chosen = this.Chosen.filter(function (id) {
			return id !== found.Item.ID;
		});

		this.Render();
	},

	/* A text written at a point, or the text item edited: a field over the drawing, kept by Enter or by leaving it, dropped by Escape. */
	Write: function (point, item) {
		var self = this;
		var own = this.Own();
		var stage = this.$Element().querySelector('.elemenx-drawing-stage');
		var editor = document.createElement('textarea');
		var unit = this.Unit();
		var size = item ? item.Size || 24 : Math.max(12, (Number(this.StrokeWidth) || 3) * 6);
		var at = item ? {X: item.X, Y: item.Y} : point;
		var layer = this.Current();
		if (!item && (!layer.Visible || layer.Locked)) return;

		editor.className = 'elemenx-drawing-editor';
		editor.value = item ? item.Text || '' : '';

		editor.setAttribute('aria-label', Elemenx.Locale.Text('ui.drawing.text'));

		editor.style.left = at.X / unit + 'px';
		editor.style.top = at.Y / unit + 'px';
		editor.style.fontSize = size / unit + 'px';
		editor.style.color = item ? item.Stroke || '' : this.Stroke;

		own.Editor = {Element: editor, Item: item, Point: at, Size: size, Layer: layer, Before: this.Snapshot()};

		editor.addEventListener('keydown', function (event) {
			event.stopPropagation();

			if (event.key === 'Escape') {
				own.Editor.Dropped = true;

				self.Finish();
			}
			else if (event.key === 'Enter' && !event.shiftKey) {
				event.preventDefault();

				self.Finish();
			}
		});

		editor.addEventListener('blur', function () {
			self.Finish();
		});

		stage.appendChild(editor);

		window.setTimeout(function () {
			editor.focus();
		}, 0);
	},

	/* The text field closed: its text goes into the drawing (an empty one takes an edited text away). */
	Finish: function () {
		var own = this.Own();
		var editor = own.Editor;
		var found;
		var text;

		if (!editor) return;

		own.Editor = null;
		text = editor.Element.value.replace(/\s+$/, '');

		if (editor.Element.parentNode)
			editor.Element.parentNode.removeChild(editor.Element);

		if (editor.Dropped) return;

		if (editor.Item) {
			found = this.Find(editor.Item.ID);

			if (found && text) found.Item.Text = text;
			else if (found) found.Layer.Items.splice(found.Index, 1);
		}
		else if (text) {
			editor.Layer.Items.push({ID: this.NewID(), Type: 'text', X: editor.Point.X, Y: editor.Point.Y, Text: text, Size: this.Round(editor.Size), Stroke: this.Stroke});
		}

		this.Commit(editor.Before);
	},

	/* A double press on a text with the select tool edits it. */
	Edit: function (event) {
		var found;

		if (!this.Editable() || this.Tool !== 'select') return;

		found = this.Hit(this.Point(event), 4 * this.Unit());

		if (found && found.Item.Type === 'text')
			this.Write(null, found.Item);
	},

	Key: function (event) {
		var mod = event.ctrlKey || event.metaKey;
		var key = String(event.key || '').toLowerCase();
		var step = event.shiftKey ? 10 : 1;
		var before;
		var self = this;
		var moves = {arrowleft: [-step, 0], arrowright: [step, 0], arrowup: [0, -step], arrowdown: [0, step]};

		if (!this.Editable()) return;

		if (moves[key] && this.Chosen.length) {
			before = this.Snapshot();

			this.Chosen.forEach(function (id) {
				var found = self.Find(id);
				if (found && !found.Layer.Locked)
					self.Translate(found.Item, moves[key][0], moves[key][1]);
			});

			this.Commit(before);

			event.preventDefault();

			return;
		}

		if (mod && key === 'z' && !event.shiftKey) this.Undo();
		else if (mod && (key === 'y' || (key === 'z' && event.shiftKey))) this.Redo();
		else if (mod && key === 'g' && event.shiftKey) this.Ungroup();
		else if (mod && key === 'g') this.Group();
		else if (mod && key === 'a') this.Select(this.Current().Items.map(function (item) {
			return item.ID;
		}));
		else if ((key === 'delete' || key === 'backspace') && this.Chosen.length) this.Delete();
		else if (key === 'escape' && this.Chosen.length) this.Select([]);
		else return;

		event.preventDefault();
	}
});
