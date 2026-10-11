/*
 * *draggable="{Data: item, Type: 'task', Handle: '.grip'}" (or just *draggable="item") lets the element be dragged
 * with the pointer onto *droppable elements that accept Type. A ghost copy follows the pointer; Escape cancels.
 * The element dispatches "dragbegin" and "dragfinish" ({Dropped, Target}); the target dispatches "dropped".
 * Disabled turns dragging off; Handle limits where the drag may start.
 */
Elemenx.Directive('draggable', {
	$OnCreate: function (context) {
		var element = context.Element;
		var data = context.Data;

		data.Options = {};

		function emit (target, name, detail) {
			target.dispatchEvent(new CustomEvent(name, {detail: detail}));
		}

		function accepts (target) {
			var drop = target && target.ElemenxDrop;
			var type = data.Options.Type || '';

			if (!drop || drop.Disabled) return false;
			if (drop.Accept === true) return true;

			return Array.isArray(drop.Accept) && drop.Accept.indexOf(type) !== -1;
		}

		function targetAt (x, y) {
			var node = document.elementFromPoint(x, y);

			while (node && node !== document.documentElement) {
				if (node.classList && node.classList.contains('elemenx-droppable') && accepts(node)) return node;

				node = node.parentNode;
			}

			return null;
		}

		function detail (event) {
			return {
				Kind: 'item',
				Type: data.Options.Type || '',
				Data: data.Options.Data,
				Source: element,
				ClientX: event.clientX,
				ClientY: event.clientY
			};
		}

		function highlight (on) {
			var targets = document.querySelectorAll('.elemenx-droppable');
			var i = 0;

			while (i < targets.length) {
				targets[i].classList.toggle('drop-target', on && accepts(targets[i]));

				i++;
			}
		}

		function over (target, event) {
			if (target === data.Over) return;

			if (data.Over) {
				data.Over.classList.remove('drop-over');

				emit(data.Over, 'dropleave', detail(event));
			}

			data.Over = target;

			if (target) {
				target.classList.add('drop-over');

				emit(target, 'dropenter', detail(event));
			}
		}

		function begin (event) {
			var rect = element.getBoundingClientRect();
			var ghost = element.cloneNode(true);

			ghost.classList.add('elemenx-drag-ghost');
			ghost.removeAttribute('id');

			/* Inline, so that the own styles of the element (position: relative, a grid span...) cannot move the ghost. */
			ghost.style.position = 'fixed';
			ghost.style.top = '0';
			ghost.style.left = '0';
			ghost.style.margin = '0';
			ghost.style.pointerEvents = 'none';
			ghost.style.width = rect.width + 'px';
			ghost.style.height = rect.height + 'px';
			ghost.style.transform = 'translate3d(' + rect.left + 'px, ' + rect.top + 'px, 0)';

			document.body.appendChild(ghost);

			/* A selection made before the pointer moved far enough would otherwise grow under the ghost. */
			if (window.getSelection)
				window.getSelection().removeAllRanges();

			element.classList.add('dragging');

			data.Ghost = ghost;
			data.OffsetX = data.StartX - rect.left;
			data.OffsetY = data.StartY - rect.top;
			data.Active = true;

			highlight(true);

			emit(element, 'dragbegin', detail(event));
		}

		function finish (event, dropped) {
			var target = data.Over;

			document.removeEventListener('pointermove', data.Move, true);
			document.removeEventListener('pointerup', data.Up, true);
			document.removeEventListener('pointercancel', data.Cancel, true);
			document.removeEventListener('keydown', data.Key, true);
			document.removeEventListener('selectstart', data.Prevent, true);

			window.cancelAnimationFrame(data.Frame);

			data.Frame = 0;

			if (!data.Active) return;

			data.Active = false;

			if (dropped)
				over(targetAt(event.clientX, event.clientY), event);

			target = data.Over;

			if (data.Ghost && data.Ghost.parentNode)
				data.Ghost.parentNode.removeChild(data.Ghost);

			data.Ghost = null;

			element.classList.remove('dragging');

			if (target)
				target.classList.remove('drop-over');

			data.Over = null;

			highlight(false);

			if (dropped && target)
				emit(target, 'dropped', detail(event));

			emit(element, 'dragfinish', {Dropped: !!(dropped && target), Target: dropped ? target : null});

			/* The click that ends a drag is not a click on the element. */
			document.addEventListener('click', data.Swallow, true);

			window.setTimeout(function () {
				document.removeEventListener('click', data.Swallow, true);
			}, 0);
		}

		/* Text selection is blocked by an event, not by a style on the whole document, which costs a full repaint per move. */
		data.Prevent = function (event) {
			event.preventDefault();
		};

		data.Swallow = function (event) {
			event.stopPropagation();
			event.preventDefault();

			document.removeEventListener('click', data.Swallow, true);
		};

		data.Down = function (event) {
			var handle = data.Options.Handle;

			if (data.Options.Disabled || event.button !== 0) return;
			if (handle && !(event.target.closest && event.target.closest(handle) && element.contains(event.target.closest(handle)))) return;
			if (!handle && event.target.closest && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;

			data.StartX = event.clientX;
			data.StartY = event.clientY;
			data.Active = false;

			document.addEventListener('pointermove', data.Move, true);
			document.addEventListener('pointerup', data.Up, true);
			document.addEventListener('pointercancel', data.Cancel, true);
			document.addEventListener('keydown', data.Key, true);
			document.addEventListener('selectstart', data.Prevent, true);
		};

		data.Move = function (event) {
			if (!data.Active) {
				if (Math.abs(event.clientX - data.StartX) + Math.abs(event.clientY - data.StartY) < 4) return;

				begin(event);
			}

			event.preventDefault();

			data.Last = event;

			/*
			 * The ghost moves by transform (no layout) and the target is looked up once a frame: elementFromPoint
			 * forces a layout, which is slow on a large page when it runs for every pointer event.
			 */
			data.Ghost.style.transform = 'translate3d(' + (event.clientX - data.OffsetX) + 'px, ' + (event.clientY - data.OffsetY) + 'px, 0)';

			if (!data.Frame)
				data.Frame = window.requestAnimationFrame(data.Track);
		};

		data.Track = function () {
			var event = data.Last;

			data.Frame = 0;

			if (data.Active && event)
				over(targetAt(event.clientX, event.clientY), event);
		};

		data.Up = function (event) {
			finish(event, true);
		};

		data.Cancel = function (event) {
			finish(event, false);
		};

		data.Key = function (event) {
			if (event.key !== 'Escape' || !data.Active) return;

			event.preventDefault();
			event.stopPropagation();

			finish({clientX: data.StartX, clientY: data.StartY}, false);
		};

		element.addEventListener('pointerdown', data.Down);
	},

	$OnUpdate: function (context) {
		var value = context.Value;
		var options = value && typeof value === 'object' && !Array.isArray(value) && Object.prototype.hasOwnProperty.call(value, 'Data') ? value : {Data: value};

		context.Data.Options = options;

		context.Element.classList.add('elemenx-draggable');
		context.Element.classList.toggle('disabled', !!options.Disabled);
		context.Element.setAttribute('aria-roledescription', 'draggable');
	},

	$OnDestroy: function (context) {
		context.Element.removeEventListener('pointerdown', context.Data.Down);

		document.removeEventListener('pointermove', context.Data.Move, true);
		document.removeEventListener('pointerup', context.Data.Up, true);
		document.removeEventListener('pointercancel', context.Data.Cancel, true);
		document.removeEventListener('keydown', context.Data.Key, true);
		document.removeEventListener('selectstart', context.Data.Prevent, true);

		if (context.Data.Ghost && context.Data.Ghost.parentNode)
			context.Data.Ghost.parentNode.removeChild(context.Data.Ghost);
	}
});