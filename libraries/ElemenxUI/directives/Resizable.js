/*
 * *resizable="'right bottom'" adds resize handles to the element: right, left, bottom, top and corner (bottom right).
 * The value may also be {Edges, MinWidth, MaxWidth, MinHeight, MaxHeight}. A handle is dragged with the pointer or
 * moved with the arrow keys (Shift for larger steps). The element dispatches "resize" while it changes and "resizeend"
 * after, both with the detail {Width, Height, Edge}.
 */
Elemenx.Directive('resizable', {
	$Meta: {
		Description: '*resizable="\'right bottom\'" adds resize handles to the element: right, left, bottom, top and corner (bottom right).'
	},
	$OnCreate: function (context) {
		var element = context.Element;
		var data = context.Data;

		data.Handles = [];
		data.Options = {};

		data.Limit = function (value, min, max) {
			if (min != null && min !== '')
				value = Math.max(Number(min), value);

			if (max != null && max !== '')
				value = Math.min(Number(max), value);

			return Math.round(value);
		};

		data.Apply = function (edge, width, height, final) {
			var options = data.Options;

			if (edge !== 'top' && edge !== 'bottom') {
				width = data.Limit(width, options.MinWidth, options.MaxWidth);
				element.style.width = width + 'px';
			}

			if (edge !== 'left' && edge !== 'right') {
				height = data.Limit(height, options.MinHeight, options.MaxHeight);
				element.style.height = height + 'px';
			}

			element.dispatchEvent(new CustomEvent(final ? 'resizeend' : 'resize', {detail: {Width: element.offsetWidth, Height: element.offsetHeight, Edge: edge}}));
		};

		data.Start = function (event) {
			var handle = event.currentTarget;
			var rect = element.getBoundingClientRect();

			if (event.button !== 0) return;

			event.preventDefault();
			event.stopPropagation();

			handle.setPointerCapture(event.pointerId);

			data.Drag = {
				Edge: handle.getAttribute('data-edge'),
				X: event.clientX,
				Y: event.clientY,
				Width: rect.width,
				Height: rect.height
			};

			element.classList.add('resizing');
		};

		data.Move = function (event) {
			var drag = data.Drag;
			var dx;
			var dy;

			if (!drag) return;

			dx = event.clientX - drag.X;
			dy = event.clientY - drag.Y;

			data.Apply(drag.Edge, drag.Width + (drag.Edge === 'left' ? -dx : dx), drag.Height + (drag.Edge === 'top' ? -dy : dy), false);
		};

		data.End = function (event) {
			var drag = data.Drag;
			if (!drag) return;

			if (event.currentTarget.hasPointerCapture(event.pointerId))
				event.currentTarget.releasePointerCapture(event.pointerId);

			data.Drag = null;

			element.classList.remove('resizing');

			data.Apply(drag.Edge, element.offsetWidth, element.offsetHeight, true);
		};

		data.Key = function (event) {
			var edge = event.currentTarget.getAttribute('data-edge');
			var step = event.shiftKey ? 32 : 8;
			var dx = {ArrowLeft: -step, ArrowRight: step}[event.key] || 0;
			var dy = {ArrowUp: -step, ArrowDown: step}[event.key] || 0;

			if (edge === 'left')
				dx = -dx;

			if (edge === 'top')
				dy = -dy;

			if (!dx && !dy) return;

			event.preventDefault();

			data.Apply(edge, element.offsetWidth + dx, element.offsetHeight + dy, true);
		};

		data.Build = function (edges) {
			var i = 0;
			var handle;

			while (data.Handles.length) {
				handle = data.Handles.pop();

				if (handle.parentNode)
					handle.parentNode.removeChild(handle);
			}

			while (i < edges.length) {
				handle = document.createElement('span');
				handle.className = 'elemenx-resize-handle ' + edges[i];
				handle.tabIndex = 0;

				handle.setAttribute('data-edge', edges[i]);
				handle.setAttribute('role', 'separator');
				handle.setAttribute('aria-label', 'Resize');
				handle.setAttribute('aria-orientation', edges[i] === 'top' || edges[i] === 'bottom' ? 'horizontal' : 'vertical');
				handle.addEventListener('pointerdown', data.Start);
				handle.addEventListener('pointermove', data.Move);
				handle.addEventListener('pointerup', data.End);
				handle.addEventListener('pointercancel', data.End);
				handle.addEventListener('keydown', data.Key);

				element.appendChild(handle);

				data.Handles.push(handle);

				i++;
			}
		};
	},

	$OnUpdate: function (context) {
		var data = context.Data;
		var value = context.Value;
		var options = value && typeof value === 'object' ? value : {Edges: value};
		var edges = String(options.Edges || '').split(/[\s,]+/).filter(function (edge) {
			return ['right', 'left', 'bottom', 'top', 'corner'].indexOf(edge) !== -1;
		});

		data.Options = options;

		context.Element.classList.toggle('elemenx-resizable', edges.length > 0);

		if (edges.join(' ') !== data.Edges) {
			data.Edges = edges.join(' ');

			data.Build(edges);
		}
	},

	$OnDestroy: function (context) {
		context.Element.classList.remove('elemenx-resizable');

		context.Data.Build([]);
	}
});