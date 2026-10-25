/*
 * *draggable="{Data: item, Type: 'task', Handle: '.grip'}" (or just *draggable="item") lets the element be dragged
 * with the pointer onto *droppable elements that accept Type. A ghost copy follows the pointer; Escape cancels.
 * The element dispatches "dragbegin" and "dragfinish" ({Dropped, Target}); the target dispatches "dropmove" (once a
 * frame while the item is over it) and "dropped". Over a target with Sort, Index in their detail is the place the item
 * would take among the draggable items of that target (the dragged item left out), and a line marks it. OffsetX and
 * OffsetY are the point of the element that the pointer holds, so ClientX - OffsetX is the left edge of the ghost.
 * Disabled turns dragging off; Handle limits where the drag may start. Hold (milliseconds) leaves a finger to the page:
 * on a touch screen a move scrolls it, and a press held still that long takes the element (it shows held). A drag outlives a new rendering of its element
 * (a list that moves the item to another place while it is dragged): it ends on the release of the pointer.
 */
Elemenx.Directive('draggable', {
	$Meta: {
		Description: '*draggable="{Data: item, Type: \'task\', Handle: \'.grip\'}" (or just *draggable="item") lets the element be dragged with the pointer onto *droppable elements that accept Type.'
	},
	$OnCreate: function (context) {
		var element = context.Element;
		var data = context.Data;

		data.Options = {};

		/*
		 * The document of the drag: the one the element was pressed in (the page, or a window the Application opened). A
		 * drag stays in its window: its listeners, its targets and its ghost are of that document.
		 */
		function owner () {
			return data.Doc || element.ownerDocument || document;
		}

		/* Where a floating copy of an element goes: the shadow root of the element, so its styles reach it, or the body. */
		function layer (node) {
			var root = node && node.getRootNode ? node.getRootNode() : owner();

			return root && root.nodeType === 11 && root.host ? root : owner().body;
		}

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
			var node = owner().elementFromPoint(x, y);

			while (node && node !== owner().documentElement) {
				if (node.classList && node.classList.contains('elemenx-droppable') && accepts(node)) return node;

				node = node.parentNode;
			}

			return null;
		}

		function detail (event, index) {
			return {
				Kind: 'item',
				Type: data.Options.Type || '',
				Data: data.Options.Data,
				Source: element,
				ClientX: event.clientX,
				ClientY: event.clientY,
				OffsetX: data.OffsetX || 0,
				OffsetY: data.OffsetY || 0,
				Index: index === undefined ? -1 : index
			};
		}

		/*
		 * The draggable items of target itself (not of a target inside it), without the dragged one, and the place the
		 * dragged item holds among them when it is in target (its own element, or a new rendering of it).
		 */
		function items (target) {
			var nodes = target.querySelectorAll('.elemenx-draggable');
			var list = [];
			var own = null;
			var i = 0;
			var owner;

			while (i < nodes.length) {
				owner = nodes[i].parentNode ? nodes[i].parentNode.closest('.elemenx-droppable') : null;

				if (owner === target && (nodes[i] === element || nodes[i].classList.contains('dragging'))) own = {Node: nodes[i], Index: list.length};
				else if (owner === target) list.push(nodes[i]);

				i++;
			}

			return {List: list, Own: own};
		}

		function inside (rect, event) {
			return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
		}

		/*
		 * The place of the item in a sorted target: over its own place it stays; else next to the item nearest to the
		 * pointer, before or after it by the side of its middle the pointer is on (vertical lists compare heights,
		 * horizontal lists widths, grids heights for a pointer above or below the item and widths beside it).
		 */
		function place (target, event) {
			var sort = target.ElemenxDrop && target.ElemenxDrop.Sort;
			var found;
			var list;
			var nearest = -1;
			var best = Infinity;
			var rect;
			var dx;
			var dy;
			var distance;
			var after;
			var i = 0;

			if (!sort)
				return {Index: -1};

			found = items(target);
			list = found.List;

			if (found.Own && inside(found.Own.Node.getBoundingClientRect(), event)) return {Index: found.Own.Index, Sort: sort, Rect: null, After: false};

			while (i < list.length) {
				rect = list[i].getBoundingClientRect();
				dx = Math.max(rect.left - event.clientX, 0, event.clientX - rect.right);
				dy = Math.max(rect.top - event.clientY, 0, event.clientY - rect.bottom);
				distance = dx * dx + dy * dy;

				if (distance < best) {
					best = distance;
					nearest = i;
				}

				i++;
			}

			if (nearest === -1)
				return {Index: 0, Sort: sort, Rect: null, After: false};

			rect = list[nearest].getBoundingClientRect();

			if (sort === 'vertical') after = event.clientY > rect.top + rect.height / 2;
			else if (sort === 'grid' && (event.clientY < rect.top || event.clientY > rect.bottom)) after = event.clientY > rect.bottom;
			else after = event.clientX > rect.left + rect.width / 2;

			return {Index: nearest + (after ? 1 : 0), Sort: sort, Rect: rect, After: after};
		}

		/* A line in the gap before or after the nearest item; none for an empty target or without Marker. */
		function mark (target, spot) {
			var marker = data.Marker;
			var rect = spot && spot.Rect;
			var show = !!rect && target.ElemenxDrop.Marker !== false;

			if (!show) {
				if (marker)
					marker.style.display = 'none';

				return;
			}

			if (!marker) {
				marker = document.createElement('div');
				marker.className = 'elemenx-drop-marker';

				layer(target).appendChild(marker);

				data.Marker = marker;
			}

			marker.style.display = '';

			if (spot.Sort === 'vertical') {
				marker.style.width = rect.width + 'px';
				marker.style.height = '2px';
				marker.style.transform = 'translate3d(' + rect.left + 'px, ' + (spot.After ? rect.bottom + 1 : rect.top - 3) + 'px, 0)';
			}
			else {
				marker.style.width = '2px';
				marker.style.height = rect.height + 'px';
				marker.style.transform = 'translate3d(' + (spot.After ? rect.right + 1 : rect.left - 3) + 'px, ' + rect.top + 'px, 0)';
			}
		}

		function highlight (on) {
			var targets = owner().querySelectorAll('.elemenx-droppable');
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

			layer(element).appendChild(ghost);

			/* A selection made before the pointer moved far enough would otherwise grow under the ghost. */
			if ((owner().defaultView || window).getSelection)
				(owner().defaultView || window).getSelection().removeAllRanges();

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

			window.clearTimeout(data.HoldTimer);

			data.Ready = false;

			element.classList.remove('held');

			owner().removeEventListener('pointermove', data.Move, true);
			owner().removeEventListener('pointerup', data.Up, true);
			owner().removeEventListener('pointercancel', data.Cancel, true);
			owner().removeEventListener('keydown', data.Key, true);
			owner().removeEventListener('selectstart', data.Prevent, true);

			(owner().defaultView || window).cancelAnimationFrame(data.Frame);

			data.Frame = 0;

			if (!data.Active) return;

			data.Active = false;

			if (dropped)
				over(targetAt(event.clientX, event.clientY), event);

			target = data.Over;

			if (data.Marker && data.Marker.parentNode)
				data.Marker.parentNode.removeChild(data.Marker);

			data.Marker = null;

			if (data.Ghost && data.Ghost.parentNode)
				data.Ghost.parentNode.removeChild(data.Ghost);

			data.Ghost = null;

			element.classList.remove('dragging');

			if (target)
				target.classList.remove('drop-over');

			data.Over = null;

			highlight(false);

			if (dropped && target)
				emit(target, 'dropped', detail(event, place(target, event).Index));

			emit(element, 'dragfinish', {Dropped: !!(dropped && target), Target: dropped ? target : null});

			/* The click that ends a drag is not a click on the element. */
			owner().addEventListener('click', data.Swallow, true);

			window.setTimeout(function () {
				owner().removeEventListener('click', data.Swallow, true);
			}, 0);
		}

		/* Text selection is blocked by an event, not by a style on the whole document, which costs a full repaint per move. */
		data.Prevent = function (event) {
			event.preventDefault();
		};

		data.Swallow = function (event) {
			event.stopPropagation();
			event.preventDefault();

			owner().removeEventListener('click', data.Swallow, true);
		};

		data.Down = function (event) {
			var handle = data.Options.Handle;

			if (data.Options.Disabled || event.button !== 0) return;
			if (handle && !(event.target.closest && event.target.closest(handle) && element.contains(event.target.closest(handle)))) return;
			if (!handle && event.target.closest && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;

			data.StartX = event.clientX;
			data.StartY = event.clientY;
			data.Active = false;
			data.Ready = true;

			/* A finger with Hold: the page scrolls by it until it stays still long enough to take the element. */
			if (data.Options.Hold && event.pointerType !== 'mouse') {
				data.Ready = false;

				data.HoldTimer = window.setTimeout(function () {
					data.Ready = true;

					element.classList.add('held');
				}, Number(data.Options.Hold));
			}

			data.Doc = element.ownerDocument || document;

			owner().addEventListener('pointermove', data.Move, true);
			owner().addEventListener('pointerup', data.Up, true);
			owner().addEventListener('pointercancel', data.Cancel, true);
			owner().addEventListener('keydown', data.Key, true);
			owner().addEventListener('selectstart', data.Prevent, true);
		};

		data.Move = function (event) {
			if (!data.Active) {
				if (Math.abs(event.clientX - data.StartX) + Math.abs(event.clientY - data.StartY) < 4) return;

				/* Moved before the hold: it is a scroll of the page, not a drag. */
				if (!data.Ready) {
					finish(event, false);

					return;
				}

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
				data.Frame = (owner().defaultView || window).requestAnimationFrame(data.Track);
		};

		data.Track = function () {
			var event = data.Last;
			var spot;

			data.Frame = 0;

			if (!data.Active || !event) return;

			over(targetAt(event.clientX, event.clientY), event);

			spot = data.Over ? place(data.Over, event) : null;

			mark(data.Over, spot);

			if (data.Over)
				emit(data.Over, 'dropmove', detail(event, spot.Index));
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

		/* Once a held finger takes the element, the page does not scroll by it (nor shows its menu of a long press). */
		data.Touch = function (event) {
			if (data.Ready && data.Options.Hold && (data.Active || element.classList.contains('held')))
				event.preventDefault();
		};

		element.addEventListener('pointerdown', data.Down);
		element.addEventListener('touchmove', data.Touch, {passive: false});
		element.addEventListener('contextmenu', data.Touch);
	},

	$OnUpdate: function (context) {
		var value = context.Value;
		var options = value && typeof value === 'object' && !Array.isArray(value) && Object.prototype.hasOwnProperty.call(value, 'Data') ? value : {Data: value};

		context.Data.Options = options;

		context.Element.classList.add('elemenx-draggable');
		context.Element.classList.toggle('disabled', !!options.Disabled);
		context.Element.classList.toggle('hold', !!options.Hold);
		context.Element.setAttribute('aria-roledescription', 'draggable');
	},

	$OnDestroy: function (context) {
		context.Element.removeEventListener('pointerdown', context.Data.Down);
		context.Element.removeEventListener('touchmove', context.Data.Touch);
		context.Element.removeEventListener('contextmenu', context.Data.Touch);

		window.clearTimeout(context.Data.HoldTimer);

		/* A drag in progress keeps its listeners and ghost until the pointer is released. */
		if (context.Data.Active) return;

		(context.Data.Doc || document).removeEventListener('pointermove', context.Data.Move, true);
		(context.Data.Doc || document).removeEventListener('pointerup', context.Data.Up, true);
		(context.Data.Doc || document).removeEventListener('pointercancel', context.Data.Cancel, true);
		(context.Data.Doc || document).removeEventListener('keydown', context.Data.Key, true);
		(context.Data.Doc || document).removeEventListener('selectstart', context.Data.Prevent, true);

		if (context.Data.Ghost && context.Data.Ghost.parentNode)
			context.Data.Ghost.parentNode.removeChild(context.Data.Ghost);
	}
});