/*
 * *swipe makes an element follow a finger (a pen, or a mouse with Mouse) along an axis and tells the end of the move:
 * *swipe, *swipe="'y'" or *swipe="{Axis: 'x' or 'y', Threshold: 40, Mouse: false}". The page still scrolls along the
 * other axis (touch-action). While the finger moves the element dispatches swipemove with {DX, DY} (the move along its
 * axis, the other one 0); when it lifts, swipe with {Direction (left, right, up or down), DX, DY} if it went past
 * Threshold pixels (or flicked), or swipecancel if not (and when the browser takes the gesture). An owner listens with
 * (swipe)="Handler" (event.detail). A move that began on a field, a slider or anything marked data-no-swipe is left to it.
 * With Mouse a mouse drags the element too: the click that ends a move is no press (a link, a picture that opens),
 * and a picture inside is not dragged away by the browser. What the finger does is told by the Recognizer of the Gestures
 * Service, as (pan) and (swipe) of templates are.
 */
Elemenx.Directive('swipe', {
	$Meta: {
		Description: '*swipe makes an element follow a finger (a pen, or a mouse with Mouse) along an axis and tells the end of the move: *swipe, *swipe="\'y\'" or *swipe="{Axis: \'x\' or \'y\', Threshold: 40, Mouse: false}".'
	},
	$OnCreate: function (context) {
		var element = context.Element;
		var data = context.Data;

		data.Options = {Axis: 'x', Threshold: 40, Mouse: false};

		/*
		 * Its element gives swipe itself: the events of templates of the Gestures Service ((swipe) among them) are not started
		 * on it, and one started before it is stopped.
		 */
		element.__ElemenxSwipe = true;

		if (typeof element.__ElemenxGestures === 'function')
			element.__ElemenxGestures();

		data.Emit = function (name, detail) {
			element.dispatchEvent(new CustomEvent(name, {detail: detail}));
		};

		/*
		 * What a finger does, of the Gestures Service (its Recognizer, the one of (pan) and (swipe) of templates): a pan of it
		 * past 6 px, a swipe of it quick at its end. Regression: a recognizer of its own beside that one, the two told a pan
		 * and a flick each its own way.
		 */
		data.Recognizer = context.Component.$Service('Gestures').Recognizer({Slop: 6});

		data.Push = function (kind, event) {
			return data.Recognizer.Push(kind, event.pointerId, event.clientX, event.clientY, Date.now());
		};

		data.Move = function (event) {
			if (!data.Start || event.pointerId !== data.Start.ID) return;

			data.Push('move', event).forEach(function (gesture) {
				if (gesture.Type !== 'pan' || !data.Start) return;

				/* The first few pixels decide: along the axis it is a swipe, across it the page scrolls. */
				if (gesture.Phase === 'start') {
					if (data.Options.Axis === 'y' ? Math.abs(gesture.DX) > Math.abs(gesture.DY) : Math.abs(gesture.DY) > Math.abs(gesture.DX)) {
						data.Start = null;

						data.Recognizer.Reset();

						return;
					}

					data.Start.Moving = true;

					/* A pointer the browser no longer knows (gone meanwhile) cannot be captured: the move goes on without it. */
					try {
						element.setPointerCapture(event.pointerId);
					}
					catch (error) {
					}
				}

				data.Emit('swipemove', data.Options.Axis === 'y' ? {DX: 0, DY: gesture.DY} : {DX: gesture.DX, DY: 0});
			});
		};

		data.Up = function (event) {
			var start = data.Start;
			var told;
			var distance;
			var flicked;

			if (!start || event.pointerId !== start.ID) return;

			data.Start = null;
			told = data.Push(event.type === 'pointercancel' ? 'cancel' : 'up', event);

			if (!start.Moving) return;

			/* The click the browser sends after a move of the mouse is no press on the element. */
			data.Swallow = true;

			window.setTimeout(function () {
				data.Swallow = false;
			}, 0);

			distance = data.Options.Axis === 'y' ? event.clientY - start.Y : event.clientX - start.X;
			/* Flicked: a swipe of the Recognizer along its axis, the way it went. */
			flicked = told.some(function (gesture) {
				return gesture.Type === 'swipe' && gesture.Direction === (data.Options.Axis === 'y' ? (distance < 0 ? 'up' : 'down') : (distance < 0 ? 'left' : 'right'));
			});

			if (event.type !== 'pointercancel' && (Math.abs(distance) > data.Options.Threshold || (Math.abs(distance) > 12 && flicked))) {
				data.Emit('swipe', {
					Direction: data.Options.Axis === 'y' ? (distance < 0 ? 'up' : 'down') : (distance < 0 ? 'left' : 'right'),
					DX: data.Options.Axis === 'y' ? 0 : distance,
					DY: data.Options.Axis === 'y' ? distance : 0
				});
			}
			else {
				data.Emit('swipecancel', {});
			}
		};

		data.Down = function (event) {
			if (event.pointerType === 'mouse' && !data.Options.Mouse) return;
			if (event.button > 0 || data.Start) return;
			if (event.target.closest && event.target.closest('input, textarea, select, [contenteditable="true"], [role="slider"], [data-no-swipe]')) return;

			data.Start = {ID: event.pointerId, X: event.clientX, Y: event.clientY, Moving: false};

			data.Recognizer.Reset();
			data.Push('down', event);
		};

		data.Click = function (event) {
			if (!data.Swallow) return;

			data.Swallow = false;

			event.preventDefault();
			event.stopPropagation();
		};

		/* A mouse that drags the element does not drag a picture or a link inside it away. */
		data.Drag = function (event) {
			if (data.Options.Mouse)
				event.preventDefault();
		};

		element.addEventListener('pointerdown', data.Down);
		element.addEventListener('pointermove', data.Move);
		element.addEventListener('pointerup', data.Up);
		element.addEventListener('pointercancel', data.Up);
		element.addEventListener('click', data.Click, true);
		element.addEventListener('dragstart', data.Drag);
	},

	$OnUpdate: function (context) {
		var value = context.Value;
		var options = value && typeof value === 'object' ? value : {Axis: value === 'y' ? 'y' : 'x'};

		context.Data.Options = {
			Axis: options.Axis === 'y' ? 'y' : 'x',
			Threshold: Number(options.Threshold) || 40,
			Mouse: !!options.Mouse
		};

		context.Element.style.touchAction = context.Data.Options.Axis === 'y' ? 'pan-x pinch-zoom' : 'pan-y pinch-zoom';
	},

	$OnDestroy: function (context) {
		var element = context.Element;
		var data = context.Data;

		element.removeEventListener('pointerdown', data.Down);
		element.removeEventListener('pointermove', data.Move);
		element.removeEventListener('pointerup', data.Up);
		element.removeEventListener('pointercancel', data.Up);
		element.removeEventListener('click', data.Click, true);
		element.removeEventListener('dragstart', data.Drag);

		delete element.__ElemenxSwipe;
	}
});
