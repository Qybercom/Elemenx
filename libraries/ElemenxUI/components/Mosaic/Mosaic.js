/*
 * Items laid out in a box by the Layouts Service, as Layout says: bento (a grid of cells packed without holes, the
 * items of Width and Height cells), masonry (columns of one width, each item into the shortest one: Height in pixels,
 * or the Ratio of its picture), justified (rows of one height filling the width, each picture keeping its Ratio) or
 * treemap (rectangles of areas by their Value, Children inside their parent). The width comes from the room the
 * Mosaic has: Columns (bento, masonry) or as many columns as fit ColumnWidth; CellHeight is the height of a cell of a
 * bento (its width by default), RowHeight the wanted height of a justified row (MaxRowHeight, LastRow), Height the one
 * of a treemap. Gap is the room between the items.
 *
 * Items: [{ID, Title, Text, Image, Color, Width, Height, Ratio, Span, Value, Row, Column, Children, Class, Element,
 * Render}], or declared inside it: MosaicItem (its content is the content of the item, a MosaicItem in it a child). An
 * item shows its Image (covering it), its Title and Text over it, or its own content (Element, Render(container, item),
 * the content of its MosaicItem). Selectable makes the items buttons: a press or Enter emits select with the item.
 * The items move to their new places when the layout or the room changes. Arrangement() returns the places as the
 * Layouts Service gives them.
 */
Elemenx.Component('Mosaic', {
	$TemplateURL: 'Mosaic.html',
	$StyleURL: 'Mosaic.css',
	$Traits: ['Declared'],
	$Meta: {
		Group: 'layout',
		Icon: 'grid',
		Description: 'Items laid out as a bento grid, masonry, justified rows or a treemap.',
		Container: true,
		Children: ['MosaicItem'],
		Events: {
			select: 'A Selectable item was pressed: the item.'
		},
		Methods: ['Arrangement()'],
		Props: {
			Layout: {Options: ['bento', 'masonry', 'justified', 'treemap'], Description: 'bento, masonry, justified or treemap.'},
			Items: {Schema: {ID: 'text', Title: 'text', Text: 'text', Image: 'text', Width: 'number', Height: 'number', Ratio: 'number', Value: 'number'}, Description: 'The items: [{ID, Title, Text, Image, Color, Width, Height, Ratio, Span, Value, Row, Column, Children, Class, Element, Render}].'},
			Columns: 'The columns of a bento or a masonry (0: as many as fit ColumnWidth).',
			ColumnWidth: 'The least width of a column when Columns is 0, in pixels.',
			CellHeight: 'The height of a cell of a bento in pixels (its width by default).',
			RowHeight: 'The wanted height of a justified row in pixels.',
			MaxRowHeight: 'The largest height of a justified row of few items.',
			LastRow: {Options: ['left', 'justify', 'hide'], Description: 'The last justified row: left (at RowHeight), justify (filling the width) or hide.'},
			Height: 'The height of a treemap in pixels.',
			Gap: 'The room between the items in pixels.',
			Selectable: 'Makes the items buttons: a press or Enter emits select.',
			Label: 'The name of the Mosaic for screen readers.'
		},
		Sample: {Layout: 'bento', Columns: 4, Items: [{ID: 'a', Title: 'Wide', Width: 2}, {ID: 'b', Title: 'Tall', Height: 2}, {ID: 'c', Title: 'One'}, {ID: 'd', Title: 'Two'}]}
	},
	Layout: 'bento',
	Items: [],
	Columns: 0,
	ColumnWidth: 0,
	CellHeight: 0,
	RowHeight: 200,
	MaxRowHeight: 0,
	LastRow: 'left',
	Height: 360,
	Gap: 8,
	Selectable: false,
	Label: '',
	Room: 0,
	Version: 0,
	Palette: ['#3f6c9e', '#c2477f', '#2f8f83', '#d99a1e', '#7a4fb0', '#d25f3a', '#5f7d2e', '#0f8fae'],

	$OnCreate: function () {
		var self = this;
		var own = {Declared: [], Contents: {}, Last: null, Arguments: null};

		this.Own = function () {
			return own;
		};

		/* The places of the items, made again only when what they are made of changes (a template calls it). */
		this.Arranged = function () {
			var args = Array.prototype.slice.call(arguments);
			if (own.Arguments && own.Arguments.length === args.length && own.Arguments.every(function (value, index) {
				return value === args[index];
			})) return own.Last;

			own.Arguments = args;
			own.Last = self.Arrange();

			return own.Last;
		};
	},

	/* The MosaicItem declared inside it (the Trait Declared reads them). */
	DeclaredSources: '.elemenx-mosaic-sources',

	$OnReady: function () {
		var self = this;
		var own = this.Own();
		var element = this.$Element();

		own.Measure = function () {
			if (element.clientWidth && element.clientWidth !== self.Room)
				self.Room = element.clientWidth;
		};

		/* On the next frame: the height the layout gives the box changes no size the observer is telling of. */
		if (typeof ResizeObserver === 'function') {
			own.Sizes = new ResizeObserver(function () {
				window.cancelAnimationFrame(own.Frame);

				own.Frame = window.requestAnimationFrame(own.Measure);
			});

			own.Sizes.observe(element);
		}

		own.Measure();
	},

	$OnDestroy: function () {
		var own = this.Own();
		if (own.Sizes)
			own.Sizes.disconnect();

		window.cancelAnimationFrame(own.Frame);
	},

	/* The items declared in a node: each MosaicItem, its content taken out for the item, the MosaicItem in it its children. */
	Declarations: function (node) {
		var self = this;
		var own = this.Own();
		/* The declarations of this level: those whose nearest MosaicItem around is the one of node (none at the top). */
		var owner = node.closest('.elemenx-mosaic-source');

		return Array.prototype.filter.call(node.querySelectorAll('.elemenx-mosaic-source'), function (source) {
			return source.parentNode.closest('.elemenx-mosaic-source') === owner;
		}).map(function (source, index) {
			var item;
			var content = source.querySelector('.elemenx-mosaic-source-content');
			var holder;

			try {
				item = JSON.parse(source.getAttribute('data-item') || '{}');
			}
			catch (error) {
				item = {};
			}

			item.ID = item.ID !== undefined ? item.ID : 'item-' + index;

			['Width', 'Height', 'Ratio', 'Span', 'Value', 'Row', 'Column'].forEach(function (name) {
				if (item[name] !== undefined)
					item[name] = Number(item[name]);
			});

			item.Children = self.Declarations(content);

			if (!item.Children.length)
				delete item.Children;

			/* The content of the item (what is not a MosaicItem), moved once into a holder the item shows. */
			holder = own.Contents[item.ID] || null;

			Array.prototype.slice.call(content.childNodes).forEach(function (child) {
				if (child.nodeType === 1 && (child.matches('.elemenx-mosaic-source') || child.querySelector('.elemenx-mosaic-source'))) return;
				if (child.nodeType === 3 && !/\S/.test(child.nodeValue)) return;

				if (!holder) {
					holder = document.createElement('div');
					holder.className = 'elemenx-mosaic-content';
				}

				holder.appendChild(child);
			});

			if (holder) {
				own.Contents[item.ID] = holder;
				item.Content = true;
			}

			return item;
		});
	},

	/* The items given and the ones declared. */
	Data: function () {
		return (this.Items || []).concat(this.Own().Declared);
	},

	/* The places of the items, with the styles that put them there; the size of the box. */
	Arrange: function () {
		var self = this;
		var own = this.Own();
		var layouts = this.$Service('Layouts');
		var items = this.Data();
		var width = this.Room || 0;
		var gap = Math.max(0, Number(this.Gap) || 0);
		var columns = Math.max(0, Math.floor(Number(this.Columns) || 0));
		var layout = ['bento', 'masonry', 'justified', 'treemap'].indexOf(this.Layout) === -1 ? 'bento' : this.Layout;
		var result;
		var cell;
		var cellHeight;
		var spots;
		var height;

		if (layout === 'bento') {
			columns = columns || Math.max(1, Math.floor((width + gap) / ((Number(this.ColumnWidth) || 120) + gap)));
			cell = columns ? (width - gap * (columns - 1)) / columns : 0;
			cellHeight = Number(this.CellHeight) || cell;
			result = layouts.Pack(items, {Columns: columns});
			spots = result.Items.map(function (spot) {
				return {ID: spot.ID, Item: spot.Item, X: spot.Column * (cell + gap), Y: spot.Row * (cellHeight + gap), Width: spot.Width * cell + gap * (spot.Width - 1), Height: spot.Height * cellHeight + gap * (spot.Height - 1)};
			});
			height = result.Rows ? result.Rows * (cellHeight + gap) - gap : 0;
		}
		else if (layout === 'masonry') {
			result = layouts.Masonry(items, {Width: width, Columns: columns || undefined, ColumnWidth: Number(this.ColumnWidth) || 240, Gap: gap});
			spots = result.Items;
			height = result.Height;
		}
		else if (layout === 'justified') {
			result = layouts.Justified(items, {Width: width, RowHeight: Number(this.RowHeight) || 200, MaxRowHeight: Number(this.MaxRowHeight) || undefined, Gap: gap, LastRow: this.LastRow});
			spots = result.Items;
			height = result.Height;
		}
		else {
			result = layouts.Treemap(items, {Width: width, Height: Number(this.Height) || 360, Gap: gap, Padding: 4, Header: items.some(function (item) {
				return item.Children && item.Children.length && item.Title;
			}) ? 22 : 0});
			spots = result.Items;
			height = result.Height;
		}

		own.Arrangement = result;

		return {
			Layout: layout,
			Style: 'height:' + Math.max(0, Math.round(height)) + 'px;',
			Spots: spots.map(function (spot, index) {
				var item = spot.Item || {};
				var parent = spot.Leaf === false;
				var color = item.Color || (layout === 'treemap' && !parent ? self.Palette[(spot.Depth ? index : index) % self.Palette.length] : '');

				return {
					Key: String(spot.ID),
					ID: spot.ID,
					Item: item,
					Title: item.Title || '',
					Text: item.Text || '',
					Image: item.Image || '',
					Parent: parent,
					Class: (item.Class || '') + (parent ? ' parent' : '') + (item.Image ? ' picture' : '') + (color ? ' colored' : ''),
					Custom: own.Contents[spot.ID] || (item.Element || item.Render ? item : null),
					Name: (item.Title || String(spot.ID)) + (item.Text ? ', ' + item.Text : ''),
					Style: 'transform:translate(' + Math.round(spot.X) + 'px,' + Math.round(spot.Y) + 'px);width:' + Math.max(0, Math.round(spot.Width)) + 'px;height:' + Math.max(0, Math.round(spot.Height)) + 'px;' + (color ? 'background:' + color + ';' : '')
				};
			})
		};
	},

	Arrangement: function () {
		return this.Own().Arrangement || null;
	},

	Pressed: function (event) {
		var node = event.currentTarget;
		var id = node.getAttribute('data-id');
		var spot;

		if (!this.Selectable) return;

		spot = this.Own().Last && this.Own().Last.Spots.filter(function (entry) {
			return String(entry.ID) === id;
		})[0];

		if (spot)
			this.$Emit('select', spot.Item);
	},

	Key: function (event) {
		if (event.key !== 'Enter' && event.key !== ' ') return;

		event.preventDefault();

		this.Pressed(event);
	}
});
