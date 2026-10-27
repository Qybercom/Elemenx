/*
 * A long list that draws only the rows in view (and Overscan more on each side): a hundred thousand items scroll as
 * lightly as ten. Items: objects (or strings); every row is ItemHeight pixels high; Height is the height of the list.
 * A row shows Icon, Label (LabelKey) and Hint of its item, or the content of Render(container, item, index).
 * Value is the key (ItemKey) of the selected item. Keys: arrows, Page Up and Down, Home, End; Enter selects.
 * ScrollTo(index) brings an item into view. Events: select (the item), range ({Start, End}: the rows drawn).
 */
Elemenx.Component('VirtualList', {
	$TemplateURL: 'VirtualList.html',
	$StyleURL: 'VirtualList.css',
	$Meta: {
		Group: 'layout',
		Icon: 'list',
		Description: 'A long list that draws only the rows in view (and Overscan more on each side): a hundred thousand items scroll as lightly as ten.',
		Events: {
			select: 'An item was chosen: the item.',
			range: 'The rows drawn changed: {Start, End}.'
		},
		Methods: ['ScrollTo(index)'],
		Props: {
			Items: 'The items: objects, or texts.',
			ItemHeight: 'The height of a row, in pixels.',
			Height: 'The height of the list: a CSS length, or a number of pixels.',
			Overscan: 'Rows drawn beyond the view on each side.',
			ItemKey: 'The field that identifies an item.',
			LabelKey: 'The field shown as the label.',
			Render: 'A function (container, item, index) that draws a row.',
			Value: 'The key of the selected item.',
			Label: 'The name of the list for screen readers.',
			Empty: 'The text without items.',
			Start: 'The first row drawn.'
		},
		Sample: {ItemHeight: 36, Height: '300px', Label: 'A hundred thousand rows'}
	},
	Items: [],
	ItemHeight: 32,
	Height: '320px',
	Overscan: 6,
	ItemKey: 'ID',
	LabelKey: 'Label',
	Render: null,
	Value: null,
	Label: '',
	Empty: '',
	Start: 0,
	Visible: 20,
	Active: 0,

	$OnCreate: function () {
		var self = this;

		/* The height of the viewport: a number is pixels (regression: Height 300 made it as tall as every row, and drew them all). */
		this.Length = function (value) {
			return typeof value === 'number' || /^\d+(\.\d+)?$/.test(String(value)) ? value + 'px' : value;
		};

		/* The rows to draw: [{Item, Index, Top, Key}]. */
		this.Window = function (items, start, visible, height) {
			var rows = [];
			var list = items || [];
			var first = Math.max(0, start - Number(self.Overscan));
			var last = Math.min(list.length, start + visible + Number(self.Overscan));
			var i = first;

			while (i < last) {
				rows.push({Item: list[i], Index: i, Top: i * height, Key: self.KeyOf(list[i], i)});

				i++;
			}

			return rows;
		};

		this.LabelOf = function (item) {
			return item !== null && typeof item === 'object' ? item[self.LabelKey] : String(item);
		};

		this.Mounted = function (render, item, index) {
			return {
				Render: function (container) {
					render(container, item, index);
				}
			};
		};

		this.Scrolled = function () {
			var viewport = self.Viewport;
			var start;

			self.Frame = 0;

			if (!viewport) return;

			start = Math.floor(viewport.scrollTop / Number(self.ItemHeight));

			if (start !== self.Start)
				self.Start = start;

			self.Measure();
		};
	},

	$OnReady: function () {
		var self = this;

		this.Viewport = this.$Element().querySelector('.elemenx-virtual-viewport');

		this.Measure();

		if (typeof ResizeObserver === 'function') {
			this.Observer = new ResizeObserver(function () {
				self.Measure();
			});

			this.Observer.observe(this.Viewport);
		}
	},

	$OnDestroy: function () {
		if (this.Observer)
			this.Observer.disconnect();

		window.cancelAnimationFrame(this.Frame);
	},

	KeyOf: function (item, index) {
		if (item !== null && typeof item === 'object' && item[this.ItemKey] != null) return String(item[this.ItemKey]);

		return typeof item === 'object' ? '#' + index : String(item);
	},

	/* The number of rows that fit in the viewport. */
	Measure: function () {
		var visible = this.Viewport ? Math.ceil(this.Viewport.clientHeight / Number(this.ItemHeight)) + 1 : 20;
		if (visible !== this.Visible)
			this.Visible = visible;

		this.$Emit('range', {Start: this.Start, End: Math.min(this.Items.length, this.Start + visible)});
	},

	/* Scroll events come faster than frames: the rows follow once a frame. */
	Scroll: function () {
		if (!this.Frame)
			this.Frame = window.requestAnimationFrame(this.Scrolled);
	},

	ScrollTo: function (index) {
		var viewport = this.Viewport;
		var height = Number(this.ItemHeight);
		var top = index * height;

		if (!viewport) return;

		if (top < viewport.scrollTop) viewport.scrollTop = top;
		else if (top + height > viewport.scrollTop + viewport.clientHeight) viewport.scrollTop = top + height - viewport.clientHeight;

		this.Scrolled();
	},

	Pick: function (event, node) {
		var index = Number(node.getAttribute('data-index'));

		this.Active = index;

		this.Choose(index);
	},

	Choose: function (index) {
		var item = this.Items[index];
		if (item === undefined) return;

		this.Value = item !== null && typeof item === 'object' ? item[this.ItemKey] : item;

		this.$Emit('select', item);
	},

	Key: function (event) {
		var page = Math.max(1, this.Visible - 1);
		var steps = {ArrowDown: 1, ArrowUp: -1, PageDown: page, PageUp: -page};
		var count = this.Items.length;
		if (!count) return;

		if (steps[event.key]) this.Active = Math.max(0, Math.min(count - 1, this.Active + steps[event.key]));
		else if (event.key === 'Home') this.Active = 0;
		else if (event.key === 'End') this.Active = count - 1;
		else if (event.key === 'Enter' || event.key === ' ') this.Choose(this.Active);
		else return;

		event.preventDefault();

		this.ScrollTo(this.Active);
	}
});
