/*
 * The layers of a Drawing, the top one first: each shown or hidden, locked or not, named (a double press or F2 renames
 * it), with the count of its items. Value is the model of the drawing (as Drawing takes and emits it), Layer the ID of
 * the current one (where the new items go). The buttons add a layer over the current one, remove it (a drawing keeps
 * one), and move it up or down. change emits the model, select the ID of the layer chosen; bind both to a Drawing.
 */
Elemenx.Component('DrawingLayers', {
	$TemplateURL: 'DrawingLayers.html',
	$StyleURL: 'DrawingLayers.css',
	$Meta: {
		Group: 'media',
		Icon: 'layers',
		Description: 'The layers of a Drawing: shown or hidden, locked, named, ordered.',
		Events: {
			change: 'The layers changed: the model of the drawing.',
			select: 'A layer was chosen: its ID.'
		},
		Props: {
			Value: 'The model of the Drawing.',
			Layer: 'The ID of the current layer.',
			ReadOnly: 'Shows the layers without letting them change.'
		},
		Sample: {Value: {Width: 320, Height: 200, Layers: [{ID: 'back', Name: 'Background', Visible: true, Locked: true, Items: [{ID: 'a', Type: 'rect', X: 0, Y: 0, W: 320, H: 200}]}, {ID: 'sketch', Name: 'Sketch', Visible: true, Locked: false, Items: []}]}, Layer: 'sketch'}
	},
	Value: null,
	Layer: '',
	ReadOnly: false,
	Renaming: '',

	/* The layers, the top one first. */
	Rows: function () {
		return ((this.Value && this.Value.Layers) || []).slice().reverse();
	},

	Editable: function () {
		return !(this.ReadOnly && this.ReadOnly !== 'false');
	},

	/* The ID of the current layer: Layer, or the first one. */
	Current: function () {
		var layers = (this.Value && this.Value.Layers) || [];
		var found = layers.filter(function (layer) {
			return layer.ID === this.Layer;
		}, this)[0];

		return found ? found.ID : layers.length ? layers[0].ID : '';
	},

	Count: function (items) {
		var count = 0;

		(items || []).forEach(function walk (item) {
			count++;

			if (item.Type === 'group')
				(item.Items || []).forEach(walk);
		});

		return count;
	},

	/* A copy of the model changed by change(model), then emitted. */
	Change: function (change) {
		var model = JSON.parse(JSON.stringify(this.Value || {Layers: []}));

		model.Layers = model.Layers || [];

		if (change(model) === false) return;

		this.Value = model;

		this.$Emit('change', JSON.parse(JSON.stringify(model)));
	},

	/* The ID of the layer of a row an event comes from. */
	Of: function (event) {
		var row = event && event.target && event.target.closest ? event.target.closest('[data-layer]') : null;

		return row ? row.getAttribute('data-layer') : '';
	},

	Choose: function (id) {
		if (!id || id === this.Current()) return;

		this.Layer = id;

		this.$Emit('select', id);
	},

	Picked: function (event) {
		this.Choose(this.Of(event));
	},

	Shown: function (event) {
		var id = this.Of(event);

		event.stopPropagation();

		this.Change(function (model) {
			model.Layers.forEach(function (layer) {
				if (layer.ID === id)
					layer.Visible = layer.Visible === false;
			});
		});
	},

	Locked: function (event) {
		var id = this.Of(event);

		event.stopPropagation();

		this.Change(function (model) {
			model.Layers.forEach(function (layer) {
				if (layer.ID === id)
					layer.Locked = !layer.Locked;
			});
		});
	},

	/* A new layer over the current one, which becomes the current one. */
	Added: function () {
		var self = this;
		var id = 'layer-' + Date.now().toString(36);

		this.Change(function (model) {
			var index = model.Layers.map(function (layer) {
				return layer.ID;
			}).indexOf(self.Current());

			model.Layers.splice(index + 1, 0, {ID: id, Name: Elemenx.Locale.Text('ui.drawing.layer') + ' ' + (model.Layers.length + 1), Visible: true, Locked: false, Items: []});
		});

		this.Layer = id;

		this.$Emit('select', id);
	},

	/* The current layer goes with its items; the one under it (or over it) becomes the current one. */
	Removed: function () {
		var self = this;
		var next = '';

		this.Change(function (model) {
			var index = model.Layers.map(function (layer) {
				return layer.ID;
			}).indexOf(self.Current());
			if (model.Layers.length < 2 || index === -1) return false;

			model.Layers.splice(index, 1);

			next = model.Layers[Math.max(0, index - 1)].ID;
		});

		if (next) {
			this.Layer = next;

			this.$Emit('select', next);
		}
	},

	/* The current layer one place up (over the next one) or down. */
	Shift: function (step) {
		var self = this;

		this.Change(function (model) {
			var index = model.Layers.map(function (layer) {
				return layer.ID;
			}).indexOf(self.Current());
			var layer;

			if (index === -1 || index + step < 0 || index + step >= model.Layers.length) return false;

			layer = model.Layers.splice(index, 1)[0];

			model.Layers.splice(index + step, 0, layer);
		});
	},

	Raised: function () {
		this.Shift(1);
	},

	Lowered: function () {
		this.Shift(-1);
	},

	Rename: function (event) {
		var self = this;

		if (!this.Editable()) return;

		this.Renaming = this.Of(event);

		this.Choose(this.Renaming);

		/* The field shows with the next render: it takes the focus then, its name selected. */
		window.setTimeout(function () {
			var field = self.$Element().querySelector('.elemenx-drawing-layer-field');

			if (field) {
				field.focus();
				field.select();
			}
		}, 0);
	},

	/* The field of a new name: Enter or leaving it keeps it, Escape drops it. */
	Named: function (event) {
		var id = this.Renaming;
		var name = String(event.target.value || '').trim();

		if (!id) return;

		this.Renaming = '';

		if (!name) return;

		this.Change(function (model) {
			model.Layers.forEach(function (layer) {
				if (layer.ID === id)
					layer.Name = name;
			});
		});
	},

	Typed: function (event) {
		event.stopPropagation();

		if (event.key === 'Enter') event.target.blur();
		else if (event.key === 'Escape') this.Renaming = '';
	},

	/* The keys on a row: Enter or Space chooses it, F2 renames it, the arrows go to the row over or under it. */
	Key: function (event) {
		var rows = Array.prototype.slice.call(this.$Element().querySelectorAll('.elemenx-drawing-layer'));
		var row = event.target.closest ? event.target.closest('.elemenx-drawing-layer') : null;
		var index = rows.indexOf(row);
		var next = null;

		if (!row || event.target !== row) return;

		if (event.key === 'Enter' || event.key === ' ') this.Choose(row.getAttribute('data-layer'));
		else if (event.key === 'F2') this.Rename(event);
		else if (event.key === 'ArrowDown') next = rows[index + 1];
		else if (event.key === 'ArrowUp') next = rows[index - 1];
		else return;

		event.preventDefault();

		if (next) {
			next.focus();

			this.Choose(next.getAttribute('data-layer'));
		}
	}
});
