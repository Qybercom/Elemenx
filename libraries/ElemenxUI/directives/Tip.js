/*
 * *tip shows a tip of the theme over an element, as the ScreenTips of Microsoft Office: *tip="'Save the page'",
 * or *tip="{Title, Text, Placement, Delay, Class, Element, Render, Disabled}". Title is written in bold with Text
 * under it; Element (a node) or Render(container) give the tip any content instead. Placement: bottom (the default),
 * top, left or right, the other side when there is no room; Delay the time before it shows under the pointer (500 ms;
 * a focus from the keyboard shows it at once). Pointer away, a press, Escape or a scroll hide it. One tip shows at a
 * time, an element of its own in the body (role tooltip, the aria-describedby of the element): the body of the document
 * the element is in, so a window of its own (Native.OpenWindow) shows its tips in itself.
 */
Elemenx.Directive('tip', {
	$Meta: {
		Description: '*tip shows a tip of the theme over an element, as the ScreenTips of Microsoft Office: a bold Title with Text under it, or any content.'
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

				node.hidden = true;

				owner().body.appendChild(node);
			}

			return node;
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

			node.style.left = Math.round(Math.max(4, Math.min(left, frame.innerWidth - width - 4))) + 'px';
			node.style.top = Math.round(Math.max(4, Math.min(top, frame.innerHeight - height - 4))) + 'px';

			node.setAttribute('data-placement', placement);
		}

		data.Show = function () {
			var options = data.Options || {};
			var node;
			var title;
			var text;

			window.clearTimeout(data.Timer);

			if (options.Disabled || !element.isConnected || !element.getClientRects().length || (!options.Title && !options.Text && !options.Element && !options.Render)) return;

			node = tip();
			node.textContent = '';
			node.className = 'elemenx-tip' + (options.Title && (options.Text || options.Element || options.Render) ? ' rich' : '') + (options.Class ? ' ' + options.Class : '');

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
			else if (options.Text) {
				text = owner().createElement('span');
				text.className = 'elemenx-tip-text';
				text.textContent = options.Text;

				node.appendChild(text);
			}

			node.hidden = false;
			node.ElemenxOwner = element;

			element.setAttribute('aria-describedby', id);

			data.Listened = owner();

			data.Listened.addEventListener('pointermove', data.Track, true);
			(data.Listened.defaultView || window).addEventListener('scroll', data.Hide, true);

			place(node, options.Placement || 'bottom');
		};

		data.Hide = function () {
			var node = owner().getElementById(id);

			window.clearTimeout(data.Timer);

			if (data.Listened) {
				data.Listened.removeEventListener('pointermove', data.Track, true);
				(data.Listened.defaultView || window).removeEventListener('scroll', data.Hide, true);

				data.Listened = null;
			}

			if (element.getAttribute('aria-describedby') === id)
				element.removeAttribute('aria-describedby');

			if (node && node.ElemenxOwner === element) {
				node.hidden = true;
				node.ElemenxOwner = null;
			}
		};

		/*
		 * A pointer that moves off the element hides the tip: an element hidden or drawn again under the pointer never hears
		 * it leave.
		 */
		data.Track = function (event) {
			if (!element.contains(event.target))
				data.Hide();
		};

		/* Under the pointer after the delay; a focus from the keyboard at once. */
		data.Enter = function (event) {
			if (event.pointerType === 'touch') return;

			window.clearTimeout(data.Timer);

			data.Timer = window.setTimeout(data.Show, data.Options && typeof data.Options.Delay === 'number' ? data.Options.Delay : 500);
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
		element.addEventListener('pointerleave', data.Hide);
		element.addEventListener('pointerdown', data.Hide);
		element.addEventListener('focus', data.Focus);
		element.addEventListener('blur', data.Hide);
		element.addEventListener('keydown', data.Key);
	},

	$OnUpdate: function (context) {
		var value = context.Value;

		context.Data.Options = value && typeof value === 'object' ? value : {Text: value === null || value === undefined ? '' : String(value)};
	},

	$OnDestroy: function (context) {
		var element = context.Element;
		var data = context.Data;

		data.Hide();

		element.removeEventListener('pointerenter', data.Enter);
		element.removeEventListener('pointerleave', data.Hide);
		element.removeEventListener('pointerdown', data.Hide);
		element.removeEventListener('focus', data.Focus);
		element.removeEventListener('blur', data.Hide);
		element.removeEventListener('keydown', data.Key);
	}
});
