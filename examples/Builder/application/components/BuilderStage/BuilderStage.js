/*
 * The canvas of the builder: the page of the Design Service running as a component of its own (made again on every
 * change of the page, Version), at the width of a desktop, a tablet or a phone. A layer over it takes the pointer, so
 * the components of the page stay still while they are built: it marks the element under the pointer and the selected
 * one (Selected), and takes the drops of the palette and of the elements moved by the grip of the selection, with a line
 * where they go. Preview takes the layer away: the page works as it will. Events: select (the ID of an element, or
 * null), drop ({Kind or Node, Parent, Index}).
 */
Elemenx.Component('BuilderStage', {
	$TemplateURL: 'BuilderStage.html',
	$StyleURL: 'BuilderStage.css',
	Version: 0,
	Selected: null,
	Width: 'desktop',
	Preview: false,
	Hovered: null,
	Tick: 0,
	Marker: null,
	Target: null,

	$OnCreate: function () {
		var self = this;
		var own = {Instance: null, Source: '', Frame: 0, Observers: []};

		/* The page and the observers that measure it again: not state, so they render nothing. */
		this.Own = function () {
			return own;
		};

		/* The page is made again when it changes or the language does (the text of an empty container is in it). */
		this.Draw = function (version, language) {
			return {
				Render: function () {
					self.Paint(language);
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

		this.Label = function (id) {
			var node = id ? self.$Service('Design').Find(id) : null;

			return node ? self.$Service('Design').Label(node.Kind) : '';
		};

		this.Lang = function () {
			return Elemenx.Locale.Language();
		};

		if (!window.ElemenxBuilderPage) {
			window.ElemenxBuilderPage = {Source: ''};

			Elemenx.Component('BuilderPage', {
				$Template: function () {
					return '<div class="builder-page">' + window.ElemenxBuilderPage.Source + '</div>';
				}
			});
		}
	},

	$OnReady: function () {
		var self = this;
		var surface = this.$Element().querySelector('.builder-surface');
		var resize = new ResizeObserver(function () {
			self.Measure();
		});
		var mutation = new MutationObserver(function () {
			self.Measure();
		});

		resize.observe(surface);
		mutation.observe(surface.querySelector('.builder-canvas'), {childList: true, subtree: true, attributes: true});

		this.Own().Observers = [resize, mutation];
	},

	$OnDestroy: function () {
		var own = this.Own();

		own.Observers.forEach(function (observer) {
			observer.disconnect();
		});

		window.cancelAnimationFrame(own.Frame);

		if (own.Instance)
			own.Instance.$Destroy();
	},

	Paint: function (language) {
		var own = this.Own();
		var canvas = this.$Element().querySelector('.builder-canvas');
		var source = this.$Service('Design').Template(true, Elemenx.Locale.Text('builder.drop'));
		if (own.Instance && own.Source === source + language) return;

		if (own.Instance)
			own.Instance.$Destroy();

		own.Source = source + language;
		window.ElemenxBuilderPage.Source = source;

		/* In the Application of the builder: the components of ElemenxUI the page names load as in any template. */
		own.Instance = Elemenx.Component('BuilderPage')({}, null, {Application: this.$Application()});

		canvas.textContent = '';

		canvas.appendChild(own.Instance.$Element());

		this.Measure();
	},

	/* Measures the marks again on the next frame: the components of the page draw themselves after it is made. */
	Measure: function () {
		var self = this;
		var own = this.Own();

		window.cancelAnimationFrame(own.Frame);

		own.Frame = window.requestAnimationFrame(function () {
			self.Tick++;
		});
	},

	/* The element of a node on the canvas: the wrapper the canvas template puts around it. */
	Wrapper: function (id) {
		return this.$Element().querySelector('.builder-canvas [data-builder-id="' + id + '"]');
	},

	/* The box of a node, relative to the surface: the box of its content (the wrapper itself has none). */
	Rect: function (id) {
		var wrapper = id === 'root' ? this.$Element().querySelector('.builder-canvas') : this.Wrapper(id);
		var surface = this.$Element().querySelector('.builder-surface');
		var range;
		var rect;
		var base;

		if (!wrapper || !surface) return null;

		range = document.createRange();

		range.selectNodeContents(wrapper);

		rect = range.getBoundingClientRect();
		base = surface.getBoundingClientRect();

		if (!rect.width && !rect.height) return null;

		return {Left: Math.round(rect.left - base.left), Top: Math.round(rect.top - base.top), Width: Math.round(rect.width), Height: Math.round(rect.height), Right: Math.round(rect.right - base.left), Bottom: Math.round(rect.bottom - base.top)};
	},

	/* The node under a point of the window: the layer steps aside for a moment to let the page answer. */
	At: function (x, y) {
		var layer = this.$Element().querySelector('.builder-layer');
		var element;
		var wrapper;

		if (layer)
			layer.style.pointerEvents = 'none';

		element = document.elementFromPoint(x, y);

		if (layer)
			layer.style.pointerEvents = '';

		wrapper = element && element.closest ? element.closest('.builder-canvas [data-builder-id]') : null;

		return wrapper ? wrapper.getAttribute('data-builder-id') : 'root';
	},

	/*
	 * Where a drop at a point goes: the container under it (or the one around the element under it), and the place among
	 * its children before the first one the point is before. Near the edge of a container the drop goes beside it.
	 * A moved node never goes into itself.
	 */
	Place: function (x, y, moving) {
		var design = this.$Service('Design');
		var surface = this.$Element().querySelector('.builder-surface').getBoundingClientRect();
		var id = this.At(x, y);
		var px = x - surface.left;
		var py = y - surface.top;
		var rect;
		var node;
		var index;

		while (id !== 'root' && (!design.Container(id) || (moving && design.Within(id, moving)))) {
			id = design.Parent(id).ID;
		}

		rect = id !== 'root' ? this.Rect(id) : null;

		if (rect && (py - rect.Top < 8 || rect.Bottom - py < 8)) {
			id = design.Parent(id).ID;

			while (id !== 'root' && moving && design.Within(id, moving)) {
				id = design.Parent(id).ID;
			}
		}

		node = design.Find(id);
		index = node.Children.length;

		node.Children.some(function (child, at) {
			var box = this.Rect(child.ID);

			if (box && (py < box.Top || (py <= box.Bottom && px < box.Left + box.Width / 2))) {
				index = at;

				return true;
			}

			return false;
		}, this);

		return {Parent: id, Index: index};
	},

	/* Whether the children of a node go across: a row by its kind, or children that stand side by side. */
	Across: function (node) {
		var kind = this.$Service('Design').Kind(node.Kind);
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
		var node = this.$Service('Design').Find(place.Parent);
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

		this.Hovered = id === 'root' ? null : id;
	},

	Left: function () {
		this.Hovered = null;
		this.Marker = null;
		this.Target = null;
	},

	Pressed: function (event) {
		var id = this.At(event.clientX, event.clientY);

		this.$Emit('select', id === 'root' ? null : id);
	},

	Over: function (event) {
		var detail = event.detail || {};
		var place;

		if (detail.Kind !== 'item') return;

		place = this.Place(detail.ClientX, detail.ClientY, detail.Type === 'builder-node' ? detail.Data : null);

		this.Marker = this.Line(place);
		this.Target = place.Parent === 'root' ? null : this.Rect(place.Parent);
	},

	Dropped: function (event) {
		var detail = event.detail || {};
		var place;

		this.Marker = null;
		this.Target = null;

		if (detail.Kind !== 'item') return;

		place = this.Place(detail.ClientX, detail.ClientY, detail.Type === 'builder-node' ? detail.Data : null);

		this.$Emit('drop', {Kind: detail.Type === 'builder-kind' ? detail.Data : null, Node: detail.Type === 'builder-node' ? detail.Data : null, Parent: place.Parent, Index: place.Index});
	},

	Scrolled: function () {
		this.Measure();
	}
});
