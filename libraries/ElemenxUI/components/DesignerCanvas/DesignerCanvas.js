/*
 * The canvas of a designer of pages (the Designer Service): the page of the document running as a component of its own
 * (made again on every change), at the width of a desktop, a tablet or a phone (Width). A layer over it takes the
 * pointer, so the components of the page stay still while they are built: it marks the element under the pointer and
 * the selected one, selects what is pressed, and takes the kinds of a DesignerPalette dropped on it and the elements
 * moved by the grip of the selection, with a line where they go and words that say it (In Screen, after Row). Near the
 * edge of a container a drop goes beside it, in its parent; Shift held takes it one level up. Shift held without a
 * drag measures, as the designers of pictures do: from the selected element to the one under the pointer (to the sides
 * of the one around it, when that is under the pointer), or to the edges of the canvas when the pointer is on it or on
 * nothing (the element under the pointer to them, with nothing selected). A press on a tab of a
 * component of declared children (Tabs, Ribbon) selects the child it shows, and the canvas shows the child the
 * selection is in. While a drag goes on, a bar over the canvas names the container the drop goes into and those around
 * it: a drop on one of them puts the element at its end, whatever the edges. The canvas is the body of the page: as
 * high as the room it has (a screen with Sizing fill fills it), as wide as Width says. Outlines draws the frame of
 * every container, Gaps gives the containers without a padding of their own some room to drop into (8 pixels); neither
 * is in the page. Preview takes the layer away, the outlines and the places to drop with it: the page works as it will.
 * Inspect (in a preview) shows the box of the element under the pointer as the tools of a browser do: its margin, its
 * padding, its size; a press keeps one, and Shift held measures the distance from it to the one under the pointer (to
 * the edges of the canvas without one). Lines draws the outlines in a preview too. Rulers (Ruler) run along the top and
 * the side of the canvas, the pointer and the selected element marked on them. Empty is the text of an empty container
 * (the phrase of the language of the page by default).
 * Events: select (the ID of an element, or null), drop ({Kind or Node, Parent, Index, ID}).
 */
Elemenx.Component('DesignerCanvas', {
	$TemplateURL: 'DesignerCanvas.html',
	$StyleURL: 'DesignerCanvas.css',
	$Meta: {
		Group: 'tools',
		Icon: 'layout',
		Description: 'The canvas of a designer of pages: the page as it is built, with the selection and the drops.',
		Events: ['select', 'drop'],
		Props: {
			Width: {Options: ['desktop', 'tablet', 'phone'], Description: 'The width of the page: desktop (all of it), tablet (768 pixels) or phone (390).'},
			Preview: 'Takes the layer away: the page works as it will.',
			Outlines: 'Draws the frame of every container while the page is built.',
			Gaps: 'Gives the containers without a padding of their own 8 pixels of room to drop into while the page is built.',
			Inspect: 'In a preview, shows the margin, the padding and the size of the element under the pointer.',
			Lines: 'Draws the frame of every container in a preview too.',
			Rulers: 'Shows the rulers along the top and the side, with the pointer and the selected element marked on them.',
			Empty: 'The text of an empty container; the phrase of the language of the page without one.'
		}
	},
	Width: 'desktop',
	Preview: false,
	Outlines: true,
	Gaps: true,
	Inspect: false,
	Lines: false,
	Rulers: true,
	Empty: '',
	Version: 0,
	Hovered: null,
	Tick: 0,
	Marker: null,
	Note: '',
	Target: null,
	Chain: [],
	Into: '',
	Measured: null,
	Pin: null,
	Distances: [],
	Spaces: [],
	RulerX: 0,
	RulerY: 0,
	PointX: null,
	PointY: null,

	$OnCreate: function () {
		var self = this;
		var designer = this.$Service('Designer');
		var own = {Instance: null, Source: '', Frame: 0, Observers: [], Changed: null, Shift: false, Point: null, Keys: null, Ending: null, Hover: null, Pinned: null, Into: ''};

		own.Changed = function () {
			self.Version++;
		};

		/* The page, the observers that measure it again and the listener: not state, so they render nothing. */
		this.Own = function () {
			return own;
		};

		/*
		 * The page is made again when the document changes, the language does (the text of an empty container is in it)
		 * or the preview does (it has none).
		 */
		this.Draw = function (version, preview) {
			return {
				Render: function () {
					if (version >= 0 && preview !== undefined)
						self.Paint();
				}
			};
		};

		/* A box over the canvas as a style; none without one. */
		function style (rect) {
			return rect ? 'left: ' + rect.Left + 'px; top: ' + rect.Top + 'px; width: ' + rect.Width + 'px; height: ' + rect.Height + 'px;' : 'display: none;';
		}

		/* The place of an element over the canvas, as a style; none when it is not there. */
		this.Box = function (id, tick) {
			return style(tick >= 0 && id ? self.Rect(id) : null);
		};

		this.Style = style;

		/* The span of the selected element along a ruler (x or y), in the units of the page. */
		this.Span = function (id, tick, axis) {
			var rect = tick >= 0 && id ? self.Rect(id) : null;
			if (!rect)
				return null;

			return axis === 'x' ? {From: rect.Left, To: rect.Right} : {From: rect.Top, To: rect.Bottom};
		};

		/* The tooltip of a measured element, under its margin box. */
		this.Tip = function (measured) {
			return 'left: ' + Math.max(0, measured.Border.Left) + 'px; top: ' + (measured.Margin.Top + measured.Margin.Height + 6) + 'px;';
		};

		this.Selected = function (version) {
			return version >= 0 ? designer.Selected() : null;
		};

		this.Label = function (id, version) {
			var node = version >= 0 && id ? designer.Find(id) : null;

			return node ? designer.Label(node.Kind) : '';
		};

		designer.OnChange(own.Changed);

		Elemenx.Locale.OnChange(own.Changed);

		designer.Load();
	},

	$OnReady: function () {
		var self = this;
		var surface = this.$Element().querySelector('.elemenx-designer-surface');
		var resize = new ResizeObserver(function () {
			self.Measure();
		});
		var mutation = new MutationObserver(function () {
			self.Measure();
		});

		resize.observe(surface);
		mutation.observe(surface.querySelector('.elemenx-designer-page-host'), {childList: true, subtree: true, attributes: true});

		this.Own().Observers = [resize, mutation];

		/*
		 * Shift held while a drag goes over the canvas takes the drop one level up; in an inspection it measures at once,
		 * the pointer still.
		 */
		this.Own().Keys = function (event) {
			var own = self.Own();
			if (own.Shift === event.shiftKey) return;

			own.Shift = event.shiftKey;

			if (self.Preview && self.Inspect && own.Point)
				self.Inspected({clientX: own.Point.X, clientY: own.Point.Y});

			if (!self.Preview)
				self.Spaced();
		};

		window.addEventListener('keydown', this.Own().Keys, true);
		window.addEventListener('keyup', this.Own().Keys, true);
	},

	$OnDestroy: function () {
		var own = this.Own();

		this.$Service('Designer').OffChange(own.Changed);

		Elemenx.Locale.OffChange(own.Changed);

		window.removeEventListener('keydown', own.Keys, true);
		window.removeEventListener('keyup', own.Keys, true);

		own.Observers.forEach(function (observer) {
			observer.disconnect();
		});

		window.cancelAnimationFrame(own.Frame);

		if (own.Instance)
			own.Instance.$Destroy();
	},

	/* Makes the page again when its template changed: a component of its own, in the Application of the canvas. */
	Paint: function () {
		var own = this.Own();
		var designer = this.$Service('Designer');
		var host = this.$Element().querySelector('.elemenx-designer-page-host');
		var source = designer.Ready() ? designer.Template(true, this.Preview ? '' : this.Empty || Elemenx.Locale.Text('ui.designer.drop')) : '';
		var page = Elemenx.Component('DesignerCanvasPage');

		if (own.Instance && own.Source === source) return;

		if (own.Instance)
			own.Instance.$Destroy();

		own.Source = source;
		page.Source = source;

		/* The components of the Library the page names load as in any template. */
		own.Instance = page({}, null, {Application: this.$Application()});

		host.textContent = '';

		host.appendChild(own.Instance.$Element());

		this.Measure();
	},

	/* Measures the marks again on the next frame: the components of the page draw themselves after it is made. */
	Measure: function () {
		var self = this;
		var own = this.Own();

		window.cancelAnimationFrame(own.Frame);

		own.Frame = window.requestAnimationFrame(function () {
			self.Tick++;

			self.Origin();
		});
	},

	/* The element of a node on the canvas: the wrapper the canvas template puts around it. */
	Wrapper: function (id) {
		return this.$Element().querySelector('.elemenx-designer-page-host [data-designer-id="' + id + '"]');
	},

	/* The box of a node, relative to the surface: the box of its content (the wrapper itself has none); exact: not rounded. */
	Rect: function (id, exact) {
		var wrapper = id === 'root' ? this.$Element().querySelector('.elemenx-designer-page-host') : this.Wrapper(id);
		var surface = this.$Element().querySelector('.elemenx-designer-surface');
		var range;
		var rect;
		var base;

		if (!wrapper || !surface) return null;

		range = document.createRange();

		range.selectNodeContents(wrapper);

		rect = exact ? this.Union(wrapper) || range.getBoundingClientRect() : range.getBoundingClientRect();
		base = surface.getBoundingClientRect();

		if (!rect.width && !rect.height) return null;

		if (exact)
			return {Left: rect.left - base.left, Top: rect.top - base.top, Width: rect.width, Height: rect.height, Right: rect.right - base.left, Bottom: rect.bottom - base.top};

		return {Left: Math.round(rect.left - base.left), Top: Math.round(rect.top - base.top), Width: Math.round(rect.width), Height: Math.round(rect.height), Right: Math.round(rect.right - base.left), Bottom: Math.round(rect.bottom - base.top)};
	},

	/*
	 * The boxes of the elements in a wrapper, as one: what a distance is measured from (the box of its text would stand
	 * out of a heading by the glyphs of its font). Null for a wrapper of text alone.
	 */
	Union: function (wrapper) {
		var result = null;

		Array.prototype.forEach.call(wrapper.children, function (child) {
			var box = child.getBoundingClientRect();
			if (!box.width && !box.height) return;

			result = result ? {
				left: Math.min(result.left, box.left),
				top: Math.min(result.top, box.top),
				right: Math.max(result.right, box.right),
				bottom: Math.max(result.bottom, box.bottom)
			} : {left: box.left, top: box.top, right: box.right, bottom: box.bottom};
		});

		if (result) {
			result.width = result.right - result.left;
			result.height = result.bottom - result.top;
		}

		return result;
	},

	/* The node under a point of the window: the layer steps aside for a moment to let the page answer. */
	At: function (x, y) {
		var layer = this.$Element().querySelector('.elemenx-designer-layer');
		var element;
		var wrapper;

		if (layer)
			layer.style.pointerEvents = 'none';

		element = document.elementFromPoint(x, y);

		if (layer)
			layer.style.pointerEvents = '';

		wrapper = element && element.closest ? element.closest('.elemenx-designer-page-host [data-designer-id]') : null;

		if (!wrapper)
			return 'root';

		return this.Declared(wrapper.getAttribute('data-designer-id'), element) || wrapper.getAttribute('data-designer-id');
	},

	/*
	 * The tab of a component of declared children under the pointer (a tab of a Tabs, of a Ribbon, a page of a backstage)
	 * is the child it shows: the one of the same name. A press on it selects it, and the canvas shows it.
	 */
	Declared: function (id, element) {
		var designer = this.$Service('Designer');
		var node = designer.Find(id);
		var kind = node ? designer.Kind(node.Kind) : null;
		var tab = element.closest('[role="tab"], .elemenx-ribbon-backstage-item');
		var text = tab ? tab.textContent.replace(/\s+/g, ' ').trim() : '';
		var found = null;

		if (!kind || !kind.Current || !text) return null;

		node.Children.forEach(function (child) {
			var label = String(child.Props.Label || child.Props.Title || '').trim();
			if (!found && label && text.indexOf(label) !== -1)
				found = child.ID;
		});

		return found;
	},

	/*
	 * Where a drop at a point goes: the container under it (or the one around the element under it), and the place among
	 * its children before the first one whose middle the point is before. Near an edge of a container across the flow of
	 * its parent (a quarter of it, 32 pixels at most) the drop goes beside it, in its parent: a row in a screen that a row
	 * fills goes after that row from the lower part of it. Shift held (up) takes the drop one level up. A moved node never
	 * goes into itself.
	 */
	Place: function (x, y, moving, up) {
		var designer = this.$Service('Designer');
		var surface = this.$Element().querySelector('.elemenx-designer-surface').getBoundingClientRect();
		var id = this.At(x, y);
		var px = x - surface.left;
		var py = y - surface.top;
		var rect;
		var parent;
		var across;
		var edge;
		var node;
		var index;

		function outside () {
			while (id !== 'root' && moving && designer.Within(id, moving)) {
				id = designer.Parent(id).ID;
			}
		}

		while (id !== 'root' && (!designer.Container(id) || (moving && designer.Within(id, moving)))) {
			id = designer.Parent(id).ID;
		}

		rect = id !== 'root' ? this.Rect(id) : null;

		if (rect) {
			parent = designer.Parent(id);
			across = this.Across(parent);
			edge = Math.min(32, (across ? rect.Width : rect.Height) / 4);

			if (across ? px - rect.Left < edge || rect.Right - px < edge : py - rect.Top < edge || rect.Bottom - py < edge) {
				id = parent.ID;

				outside();
			}
		}

		if (up && id !== 'root') {
			id = designer.Parent(id).ID;

			outside();
		}

		node = designer.Find(id);
		index = node.Children.length;
		across = this.Across(node);

		node.Children.some(function (child, at) {
			var box = this.Rect(child.ID);

			if (box && (across ? py < box.Top || (py <= box.Bottom && px < box.Left + box.Width / 2) : py < box.Top + box.Height / 2)) {
				index = at;

				return true;
			}

			return false;
		}, this);

		return {Parent: id, Index: index};
	},

	/* The words at the line of a drop: the container it goes into, and the element it goes before or after. */
	Caption: function (place) {
		var designer = this.$Service('Designer');
		var node = designer.Find(place.Parent);
		var name = place.Parent === 'root' ? Elemenx.Locale.Text('ui.designer.page') : designer.Label(node.Kind);
		var child = node.Children[place.Index] || node.Children[node.Children.length - 1];
		if (!child)
			return Elemenx.Locale.Text('ui.designer.into', {name: name});

		return Elemenx.Locale.Text(node.Children[place.Index] ? 'ui.designer.before' : 'ui.designer.after', {name: name, element: designer.Label(child.Kind)});
	},

	/* Whether the children of a node go across: a row by its kind, or children that stand side by side. */
	Across: function (node) {
		var kind = this.$Service('Designer').Kind(node.Kind);
		var first;
		var second;

		if (kind && kind.Flow === 'row') return true;

		if (node.Children.length < 2) return false;

		first = this.Rect(node.Children[0].ID);
		second = this.Rect(node.Children[1].ID);

		return !!first && !!second && Math.abs(first.Top - second.Top) < 4 && second.Left > first.Left;
	},

	/* The line where a drop goes: before the child at Index, after the last one, or over the whole of an empty container. */
	Line: function (place) {
		var node = this.$Service('Designer').Find(place.Parent);
		var across = this.Across(node);
		var child = node.Children[Math.min(place.Index, node.Children.length - 1)];
		var after = place.Index >= node.Children.length;
		var box = child ? this.Rect(child.ID) : null;
		if (!box)
			return this.Rect(place.Parent);

		if (across)
			return {Left: (after ? box.Right : box.Left) - 2, Top: box.Top, Width: 4, Height: box.Height};

		return {Left: box.Left, Top: (after ? box.Bottom : box.Top) - 2, Width: box.Width, Height: 4};
	},

	Moved: function (event) {
		var id = this.At(event.clientX, event.clientY);

		this.Own().Point = {X: event.clientX, Y: event.clientY};
		this.Hovered = id === 'root' ? null : id;

		this.Spaced();
	},

	/*
	 * The distances Shift shows while the page is built (no drag going on): from the selected element to the one under
	 * the pointer, inside the one around it when that is under the pointer, or to the edges of the canvas.
	 */
	Spaced: function () {
		var own = this.Own();
		var selected = this.$Service('Designer').Selected();
		var hovered = this.Hovered;
		var from = selected ? this.Rect(selected, true) : null;
		var to = hovered && hovered !== selected ? this.Rect(hovered, true) : null;
		var inside;

		if (!own.Shift || !own.Point || this.Marker || this.Target) {
			if (this.Spaces.length)
				this.Spaces = [];

			return;
		}

		if (from && to) {
			inside = from.Left >= to.Left && from.Top >= to.Top && from.Right <= to.Right && from.Bottom <= to.Bottom;

			this.Spaces = inside ? this.Spacing(to, from) : this.Spacing(from, to);

			return;
		}

		from = from || (hovered ? this.Rect(hovered, true) : null);

		this.Spaces = from ? this.Spacing(this.Edges(), from) : [];
	},

	Left: function () {
		this.Own().Point = null;
		this.Spaces = [];
		this.Hovered = null;
		this.Marker = null;
		this.Note = '';
		this.Target = null;
	},

	Pressed: function (event) {
		var id = this.At(event.clientX, event.clientY);

		this.$Service('Designer').Select(id);

		this.$Emit('select', id === 'root' ? null : id);

		this.Spaced();
	},

	Over: function (event) {
		var detail = event.detail || {};
		var place;
		var links;

		if (detail.Kind !== 'item') return;

		place = this.Place(detail.ClientX, detail.ClientY, detail.Type === 'elemenx-designer-node' ? detail.Data : null, this.Own().Shift);
		links = this.Links(place.Parent);

		this.Marker = this.Line(place);
		this.Note = this.Caption(place);
		this.Target = place.Parent === 'root' ? null : this.Rect(place.Parent);
		this.Into = '';

		/* On the way out to the bar the drag crosses the containers around: a chain that starts the one shown keeps it. */
		if (JSON.stringify(links) !== JSON.stringify(this.Chain.slice(0, links.length)))
			this.Chain = links;

		this.Follow();
	},

	/* A drop: a kind of the palette makes a new element there, an element moves there; either is selected. */
	Dropped: function (event) {
		var detail = event.detail || {};
		var place;

		this.Left();

		if (detail.Kind !== 'item') return;

		place = this.Place(detail.ClientX, detail.ClientY, detail.Type === 'elemenx-designer-node' ? detail.Data : null, this.Own().Shift);

		this.Put(detail, place.Parent, place.Index);
	},

	/* Puts what a drag carried into a container at an index (at its end without one) and selects it. */
	Put: function (detail, parent, index) {
		var designer = this.$Service('Designer');
		var drop = {Kind: detail.Type === 'elemenx-designer-kind' ? detail.Data : null, Node: detail.Type === 'elemenx-designer-node' ? detail.Data : null, Parent: parent, Index: index, ID: null};

		this.Chain = [];
		this.Into = '';

		if (drop.Kind) drop.ID = designer.Insert(drop.Kind, drop.Parent, drop.Index);
		else if (drop.Node && designer.Move(drop.Node, drop.Parent, drop.Index)) drop.ID = drop.Node;

		if (drop.ID)
			designer.Select(drop.ID);

		this.$Emit('drop', drop);
	},

	/* The containers from the page down to one, named: the links of the bar of a drag. */
	Links: function (id) {
		var designer = this.$Service('Designer');
		var node = designer.Find(id);
		var links = [];

		while (node) {
			links.unshift({ID: node.ID, Label: node.ID === 'root' ? Elemenx.Locale.Text('ui.designer.page') : designer.Label(node.Kind)});

			node = node.ID === 'root' ? null : designer.Parent(node.ID);
		}

		return links;
	},

	/* The bar of a drag goes when the drag ends, wherever it ends (a drop on the canvas or the bar clears it first). */
	Follow: function () {
		var self = this;
		var own = this.Own();
		if (own.Ending) return;

		own.Ending = function () {
			window.removeEventListener('pointerup', own.Ending, true);

			own.Ending = null;

			/* After the drop, which the drag dispatches on its next frame. */
			window.setTimeout(function () {
				own.Into = '';

				self.Chain = [];
				self.Into = '';
			}, 250);
		};

		window.addEventListener('pointerup', own.Ending, true);
	},

	/* A drag over the bar: the container of the link under the pointer, its whole box marked. */
	ChainOver: function (event) {
		var detail = event.detail || {};
		var element = document.elementFromPoint(detail.ClientX, detail.ClientY);
		var link = element && element.closest ? element.closest('.elemenx-designer-chain-item') : null;
		var id = link ? link.getAttribute('data-id') : '';

		this.Marker = null;
		this.Hovered = null;

		this.Own().Into = id;

		if (this.Into !== id)
			this.Into = id;

		this.Note = id ? Elemenx.Locale.Text('ui.designer.into', {name: link.textContent}) : '';
		this.Target = id && id !== 'root' ? this.Rect(id) : null;
	},

	ChainDropped: function (event) {
		var detail = event.detail || {};
		var into = this.Own().Into;

		this.Left();

		if (detail.Kind === 'item' && into)
			this.Put(detail, into);
	},

	/* The drag leaves the bar (a drop on it dispatches the leave first: the link it was over stays for the drop). */
	ChainLeft: function () {
		this.Into = '';
		this.Target = null;
	},

	Scrolled: function () {
		this.Measure();
	},

	/* Where the rulers start in the units of the page: 0 is the edge of the page, wherever the stage scrolled it. */
	Origin: function () {
		var surface = this.$Element().querySelector('.elemenx-designer-surface');
		var top = this.$Element().querySelector('.elemenx-designer-ruler.horizontal');
		var side = this.$Element().querySelector('.elemenx-designer-ruler.vertical');
		var box;
		var x;
		var y;

		if (!surface || !top || !side) return;

		box = surface.getBoundingClientRect();
		x = Math.round(top.getBoundingClientRect().left - box.left);
		y = Math.round(side.getBoundingClientRect().top - box.top);

		if (this.RulerX !== x)
			this.RulerX = x;

		if (this.RulerY !== y)
			this.RulerY = y;
	},

	/* The pointer over the stage, marked on the rulers in the units of the page. */
	Pointed: function (event) {
		var box = this.$Element().querySelector('.elemenx-designer-surface').getBoundingClientRect();

		this.PointX = Math.round(event.clientX - box.left);
		this.PointY = Math.round(event.clientY - box.top);
	},

	Unpointed: function () {
		this.PointX = null;
		this.PointY = null;
	},

	/* The element of the page under a point of the window, under the layer of the inspection. */
	Under: function (x, y) {
		var layer = this.$Element().querySelector('.elemenx-designer-layer.inspect');
		var host = this.$Element().querySelector('.elemenx-designer-page-host');
		var element;

		if (layer)
			layer.style.pointerEvents = 'none';

		element = document.elementFromPoint(x, y);

		if (layer)
			layer.style.pointerEvents = '';

		return element && host.contains(element) && element !== host && !element.classList.contains('elemenx-designer-page') ? element : null;
	},

	/*
	 * The boxes of an element over the surface, as the tools of a browser show them: its margin, its border box and its
	 * content; its name (the kind of its node, or its tag and its first class), its size and its margin and padding.
	 */
	Boxes: function (element) {
		var designer = this.$Service('Designer');
		var base = this.$Element().querySelector('.elemenx-designer-surface').getBoundingClientRect();
		var rect = element.getBoundingClientRect();
		var style = window.getComputedStyle(element);
		var wrapper = element.parentNode && element.parentNode.getAttribute ? element.parentNode.getAttribute('data-designer-id') : null;
		var node = wrapper ? designer.Find(wrapper) : null;
		var left = rect.left - base.left;
		var top = rect.top - base.top;
		var margin;
		var padding;
		var border;

		function sides (name, suffix) {
			return ['top', 'right', 'bottom', 'left'].map(function (side) {
				return parseFloat(style.getPropertyValue(name + '-' + side + (suffix || ''))) || 0;
			});
		}

		function text (values) {
			return values.some(function (value) {
				return value !== 0;
			}) ? values.map(function (value) {
					return Math.round(value);
				}).join(' ') : '';
		}

		margin = sides('margin');
		padding = sides('padding');
		border = sides('border', '-width');

		return {
			Name: node ? designer.Label(node.Kind) : element.tagName.toLowerCase() + (element.classList.length ? '.' + element.classList[0] : ''),
			Size: Math.round(rect.width) + '×' + Math.round(rect.height),
			Margins: text(margin),
			Paddings: text(padding),
			Border: {Left: left, Top: top, Width: rect.width, Height: rect.height},
			Margin: {Left: left - margin[3], Top: top - margin[0], Width: rect.width + margin[1] + margin[3], Height: rect.height + margin[0] + margin[2]},
			Content: {Left: left + border[3] + padding[3], Top: top + border[0] + padding[0], Width: Math.max(0, rect.width - border[1] - border[3] - padding[1] - padding[3]), Height: Math.max(0, rect.height - border[0] - border[2] - padding[0] - padding[2])}
		};
	},

	/*
	 * The distances from one box to another: the gaps between them across and along, or, for a box inside the other, the
	 * room from each of its sides to the sides of the one around it.
	 */
	Spacing: function (from, to) {
		var lines = [];
		var inside = to.Left >= from.Left && to.Top >= from.Top && to.Left + to.Width <= from.Left + from.Width && to.Top + to.Height <= from.Top + from.Height;
		var middle = {X: to.Left + to.Width / 2, Y: to.Top + to.Height / 2};

		function line (key, left, top, width, height, across) {
			var size = Math.round(across ? width : height);
			if (size > 0)
				lines.push({Key: key, Left: left, Top: top, Width: across ? width : 1, Height: across ? 1 : height, Across: across, Text: String(size)});
		}

		if (inside) {
			line('left', from.Left, middle.Y, to.Left - from.Left, 0, true);
			line('right', to.Left + to.Width, middle.Y, from.Left + from.Width - to.Left - to.Width, 0, true);
			line('top', middle.X, from.Top, 0, to.Top - from.Top, false);
			line('bottom', middle.X, to.Top + to.Height, 0, from.Top + from.Height - to.Top - to.Height, false);

			return lines;
		}

		if (to.Left >= from.Left + from.Width) line('across', from.Left + from.Width, middle.Y, to.Left - from.Left - from.Width, 0, true);
		else if (to.Left + to.Width <= from.Left) line('across', to.Left + to.Width, middle.Y, from.Left - to.Left - to.Width, 0, true);

		if (to.Top >= from.Top + from.Height) line('along', middle.X, from.Top + from.Height, 0, to.Top - from.Top - from.Height, false);
		else if (to.Top + to.Height <= from.Top) line('along', middle.X, to.Top + to.Height, 0, from.Top - to.Top - to.Height, false);

		return lines;
	},

	Inspected: function (event) {
		var own = this.Own();
		var element = this.Under(event.clientX, event.clientY);

		own.Hover = element;
		own.Point = {X: event.clientX, Y: event.clientY};

		this.Measured = element ? this.Boxes(element) : null;
		this.Distances = own.Shift && element && element !== own.Pinned ? this.Spacing(own.Pinned ? this.Boxes(own.Pinned).Border : this.Edges(), this.Measured.Border) : [];
	},

	/* The box of the canvas itself, the page: Shift without an element pressed measures to its edges. */
	Edges: function () {
		var box = this.$Element().querySelector('.elemenx-designer-surface').getBoundingClientRect();

		return {Left: 0, Top: 0, Width: box.width, Height: box.height};
	},

	Uninspected: function () {
		this.Own().Point = null;
		this.Measured = null;
		this.Distances = [];
	},

	/* A press keeps the element measured, the one Shift measures from; a press on it again lets it go. */
	Pinned: function () {
		var own = this.Own();

		own.Pinned = own.Hover && own.Hover !== own.Pinned ? own.Hover : null;

		this.Pin = own.Pinned ? {Border: this.Boxes(own.Pinned).Border} : null;
	}
});

/* The page of a canvas: its template is the one the canvas sets (Source) right before it makes it. */
Elemenx.Component('DesignerCanvasPage', {
	$Template: function () {
		return '<div class="elemenx-designer-page">' + (Elemenx.Component('DesignerCanvasPage').Source || '') + '</div>';
	}
});
