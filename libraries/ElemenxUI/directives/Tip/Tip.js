/*
 * *tip shows a tip of the theme over an element, as the ScreenTips of Microsoft Office: *tip="'Save the page'", or
 * *tip="{Title, Text, Placement, Delay, Class, Element, Render, Component, Props, Bare, Touch, Stay, Disabled}". Title
 * is written in bold with Text under it; Element (a node), Render(container) or Component (the name of a Component,
 * made with Props while the tip shows: the card of an item, a person) give the tip any content instead. A Component
 * brings its own look, so its tip is bare (no frame of a tip of its own; Bare: false keeps it, Bare: true makes any tip
 * bare). Placement: bottom (the default), top, left or right, the other side when there is no room; Delay the time
 * before it shows under the pointer (500 ms; a focus from the keyboard shows it at once). Pointer away, a press (not
 * with Stay), Escape hide it; while it shows it keeps beside its element, when the page scrolls or moves the element
 * without a scroll (a part above that renders later). Touch: a tap shows it too, and a scroll or a tap elsewhere hides
 * it, as the tooltips of a phone do. One tip shows at a time, an element of its own (role tooltip, the aria-describedby
 * of the element) in the top layer, so no scrolling box, transform or filter around the element cuts it; it is put in
 * the part of the page that has the theme of the element (the nearest data-theme or data-scheme, else the body), so it
 * takes that theme. It is in the document the element is in: a window of its own (Platform.OpenWindow) shows its tips
 * in itself.
 */
Elemenx.Directive('tip', {
	$Meta: {
		Description: '*tip shows a tip of the theme over an element, as the ScreenTips of Microsoft Office: a bold Title with Text under it, or any content, a Component among them.'
	},
	$OnCreate: function (context) {
		var element = context.Element;
		var data = context.Data;
		var id = 'elemenx-tip';

		/* The document and the window of the element, wherever it is now. */
		function owner () {
			return element.ownerDocument || document;
		}

		function view () {
			return owner().defaultView || window;
		}

		/* The one tip of the document of the element, made the first time one shows there. */
		function tip () {
			var node = owner().getElementById(id);

			if (!node) {
				node = owner().createElement('div');
				node.id = id;
				node.className = 'elemenx-tip';

				node.setAttribute('role', 'tooltip');

				/* In the top layer, as the panels of *popup: the tip shown last is over them. */
				if (typeof node.showPopover === 'function')
					node.setAttribute('popover', 'manual');

				node.hidden = true;

				owner().body.appendChild(node);
			}

			return node;
		}

		/*
		 * Where the tip goes: in the part of the page with the theme of the element, so it takes that theme. Out of the top
		 * layer (a browser without popovers) a box with a transform around it would move a fixed tip: there, the body.
		 */
		function host (node) {
			var themed = element.closest('[data-theme], [data-scheme]');

			return node.hasAttribute('popover') && themed ? themed : owner().body;
		}

		/* What the tip held goes, a Component made for it destroyed. */
		function clear (node) {
			if (node.ElemenxInstance) {
				node.ElemenxInstance.$Destroy();
				node.ElemenxInstance = null;
			}

			node.textContent = '';
		}

		/*
		 * Whether something is over the middle of the element (a panel opened over it while the tip waited): a tip of
		 * what cannot be seen is not shown.
		 */
		function covered () {
			var box = element.getBoundingClientRect();
			var root = element.getRootNode && element.getRootNode().elementFromPoint ? element.getRootNode() : owner();
			var hit = root.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);

			return !!hit && hit !== element && !element.contains(hit) && !hit.closest('#' + id);
		}

		/* The tip beside the element, on the side of Placement when there is room, on the other side when not. */
		function place (node, placement) {
			var box = element.getBoundingClientRect();
			var frame = view();
			var width = node.offsetWidth;
			var height = node.offsetHeight;
			var room = {top: box.top, bottom: frame.innerHeight - box.bottom, left: box.left, right: frame.innerWidth - box.right};
			var other = {top: 'bottom', bottom: 'top', left: 'right', right: 'left'};
			var gap = 6;
			var left;
			var top;

			if (room[placement] < (placement === 'top' || placement === 'bottom' ? height : width) + gap && room[other[placement]] > room[placement])
				placement = other[placement];

			if (placement === 'top' || placement === 'bottom') {
				left = box.left + box.width / 2 - width / 2;
				top = placement === 'top' ? box.top - height - gap : box.bottom + gap;
			}
			else {
				left = placement === 'left' ? box.left - width - gap : box.right + gap;
				top = box.top + box.height / 2 - height / 2;
			}

			left = Math.round(Math.max(4, Math.min(left, frame.innerWidth - width - 4))) + 'px';
			top = Math.round(Math.max(4, Math.min(top, frame.innerHeight - height - 4))) + 'px';

			/* Placed again at each frame: written only when it moved. */
			if (node.style.left !== left)
				node.style.left = left;

			if (node.style.top !== top)
				node.style.top = top;

			if (node.getAttribute('data-placement') !== placement)
				node.setAttribute('data-placement', placement);
		}

		/* Whether the tip of the document is this element's now. */
		function mine () {
			var node = owner().getElementById(id);

			return !!node && node.ElemenxOwner === element;
		}

		/* What the options show, to tell a new value from the same one given again at each render. */
		function signature (options) {
			try {
				return JSON.stringify([options.Title, options.Text, options.Component, options.Props, options.Class, options.Bare, options.Disabled]);
			}
			catch (error) {
				return String(Math.random());
			}
		}

		data.Signature = signature;

		data.Show = function () {
			var options = data.Options || {};
			var bare = options.Bare !== undefined ? !!options.Bare : !!options.Component;
			var application = context.Component && context.Component.$Application ? context.Component.$Application() : null;
			var node;
			var title;
			var text;
			var made;

			window.clearTimeout(data.Timer);

			if (options.Disabled || !element.isConnected || !element.getClientRects().length || (!options.Title && !options.Text && !options.Element && !options.Render && !options.Component)) return;
			if (covered()) return;

			node = tip();

			if (node.hasAttribute('popover') && node.matches(':popover-open'))
				node.hidePopover();

			clear(node);

			if (node.parentNode !== host(node))
				host(node).appendChild(node);

			node.className = 'elemenx-tip' + (options.Title && (options.Text || options.Element || options.Render || options.Component) ? ' rich' : '') + (bare ? ' bare' : '') + (options.Class ? ' ' + options.Class : '');

			if (options.Title) {
				title = owner().createElement('strong');
				title.className = 'elemenx-tip-title';
				title.textContent = options.Title;

				node.appendChild(title);
			}

			if (options.Element) {
				node.appendChild(options.Element);
			}
			else if (typeof options.Render === 'function') {
				options.Render(node);
			}
			else if (options.Component) {
				made = Elemenx.Component(String(options.Component))(options.Props || {}, null, application ? {Application: application} : undefined);

				node.ElemenxInstance = made;

				node.appendChild(made.$Element());
			}
			else if (options.Text) {
				text = owner().createElement('span');
				text.className = 'elemenx-tip-text';
				text.textContent = options.Text;

				node.appendChild(text);
			}

			node.hidden = false;
			node.ElemenxOwner = element;
			data.Shown = signature(options);

			/* Shown again: on top of the top layer, over a panel opened since it was shown last. */
			if (node.hasAttribute('popover'))
				node.showPopover();

			element.setAttribute('aria-describedby', id);

			if (!data.Listened) {
				data.Listened = owner();

				data.Listened.addEventListener('pointermove', data.Track, true);
				data.Listened.addEventListener('pointerdown', data.Outside, true);
				(data.Listened.defaultView || window).addEventListener('scroll', data.Scrolled, true);

				data.Frame = view().requestAnimationFrame(data.Follow);
			}

			place(node, options.Placement || 'bottom');
		};

		data.Hide = function () {
			var node = owner().getElementById(id);

			window.clearTimeout(data.Timer);

			if (data.Listened) {
				data.Listened.removeEventListener('pointermove', data.Track, true);
				data.Listened.removeEventListener('pointerdown', data.Outside, true);
				(data.Listened.defaultView || window).removeEventListener('scroll', data.Scrolled, true);
				(data.Listened.defaultView || window).cancelAnimationFrame(data.Frame);

				data.Listened = null;
			}

			if (element.getAttribute('aria-describedby') === id)
				element.removeAttribute('aria-describedby');

			if (node && node.ElemenxOwner === element) {
				if (node.hasAttribute('popover') && node.matches(':popover-open'))
					node.hidePopover();

				clear(node);

				node.hidden = true;
				node.ElemenxOwner = null;
			}

			data.ByTouch = false;
		};

		/* The page moves the element without a scroll too (a part above it renders, a panel opens): the tip looks at each frame. */
		data.Follow = function () {
			var node = owner().getElementById(id);

			if (!data.Listened) return;

			if (!node || node.ElemenxOwner !== element || !element.isConnected) {
				data.Hide();

				return;
			}

			place(node, (data.Options || {}).Placement || 'bottom');

			data.Frame = view().requestAnimationFrame(data.Follow);
		};

		/* A scroll takes the tip along with its element; one a finger opened goes, as the tooltips of a phone do. */
		data.Scrolled = function () {
			var node = owner().getElementById(id);

			if (data.ByTouch) data.Hide();
			else if (node && node.ElemenxOwner === element) place(node, (data.Options || {}).Placement || 'bottom');
		};

		/*
		 * A pointer that moves off the element hides the tip: an element hidden or drawn again under the pointer never hears
		 * it leave. One a finger opened stays till a scroll or a tap elsewhere.
		 */
		data.Track = function (event) {
			if (!data.ByTouch && !element.contains(event.target))
				data.Hide();
		};

		data.Outside = function (event) {
			if (data.ByTouch && !element.contains(event.target))
				data.Hide();
		};

		/* Under the pointer after the delay; a focus from the keyboard at once. */
		data.Enter = function (event) {
			if (event.pointerType === 'touch') return;

			window.clearTimeout(data.Timer);

			data.Timer = window.setTimeout(data.Show, data.Options && typeof data.Options.Delay === 'number' ? data.Options.Delay : 500);
		};

		/* A press hides the tip (not with Stay); with Touch a finger shows it instead (a tablet has no pointer to rest on the element). */
		data.Pressed = function (event) {
			if ((event.pointerType === 'touch' || event.pointerType === 'pen') && data.Options && data.Options.Touch) {
				data.Show();

				data.ByTouch = mine();

				return;
			}

			/* Stay: a press leaves it (the card of an item pressed to choose it). */
			if (data.Options && data.Options.Stay) return;

			data.Hide();
		};

		/* The pointer away (or the focus): the tip goes, but one a finger opened stays. */
		data.Leave = function () {
			if (!data.ByTouch)
				data.Hide();
		};

		data.Focus = function () {
			if (element.matches(':focus-visible'))
				data.Show();
		};

		data.Key = function (event) {
			if (event.key === 'Escape')
				data.Hide();
		};

		element.addEventListener('pointerenter', data.Enter);
		element.addEventListener('pointerleave', data.Leave);
		element.addEventListener('pointerdown', data.Pressed);
		element.addEventListener('focus', data.Focus);
		element.addEventListener('blur', data.Leave);
		element.addEventListener('keydown', data.Key);
	},

	$OnUpdate: function (context) {
		var value = context.Value;
		var data = context.Data;
		var node;

		data.Options = value && typeof value === 'object' ? value : {Text: value === null || value === undefined ? '' : String(value)};

		/* A tip that shows takes what it is given now (the item under it changed); the same, given again at a render, is left. */
		node = (context.Element.ownerDocument || document).getElementById('elemenx-tip');

		if (node && node.ElemenxOwner === context.Element && data.Signature && data.Shown !== data.Signature(data.Options)) {
			if (data.Options.Disabled || !data.Options.Title && !data.Options.Text && !data.Options.Element && !data.Options.Render && !data.Options.Component) data.Hide();
			else data.Show();
		}
	},

	$OnDestroy: function (context) {
		var element = context.Element;
		var data = context.Data;

		data.Hide();

		element.removeEventListener('pointerenter', data.Enter);
		element.removeEventListener('pointerleave', data.Leave);
		element.removeEventListener('pointerdown', data.Pressed);
		element.removeEventListener('focus', data.Focus);
		element.removeEventListener('blur', data.Leave);
		element.removeEventListener('keydown', data.Key);
	}
});
