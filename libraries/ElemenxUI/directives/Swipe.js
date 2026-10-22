/*
 * *swipe makes an element follow a finger (a pen, or a mouse with Mouse) along an axis and tells the end of the move:
 * *swipe, *swipe="'y'" or *swipe="{Axis: 'x' or 'y', Threshold: 40, Mouse: false}". The page still scrolls along the
 * other axis (touch-action). While the finger moves the element dispatches swipemove with {DX, DY} (the move along its
 * axis, the other one 0); when it lifts, swipe with {Direction (left, right, up or down), DX, DY} if it went past
 * Threshold pixels (or flicked), or swipecancel if not (and when the browser takes the gesture). An owner listens with
 * (swipe)="Handler" (event.detail). A move that began on a field, a slider or anything marked data-no-swipe is left to it.
 */
Elemenx.Directive('swipe', {
	$OnCreate: function (context) {
		var element = context.Element;
		var data = context.Data;

		data.Options = {Axis: 'x', Threshold: 40, Mouse: false};

		data.Emit = function (name, detail) {
			element.dispatchEvent(new CustomEvent(name, {detail: detail}));
		};

		data.Move = function (event) {
			var dx;
			var dy;

			if (!data.Start || event.pointerId !== data.Start.ID) return;

			dx = event.clientX - data.Start.X;
			dy = event.clientY - data.Start.Y;

			/* The first few pixels decide: along the axis it is a swipe, across it the page scrolls. */
			if (!data.Start.Moving) {
				if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;

				if (data.Options.Axis === 'y' ? Math.abs(dx) > Math.abs(dy) : Math.abs(dy) > Math.abs(dx)) {
					data.Start = null;

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

			data.Start.Last = {X: event.clientX, Y: event.clientY, Time: Date.now()};

			data.Emit('swipemove', data.Options.Axis === 'y' ? {DX: 0, DY: dy} : {DX: dx, DY: 0});
		};

		data.Up = function (event) {
			var start = data.Start;
			var distance;
			var speed;

			if (!start || event.pointerId !== start.ID) return;

			data.Start = null;

			if (!start.Moving) return;

			distance = data.Options.Axis === 'y' ? event.clientY - start.Y : event.clientX - start.X;
			speed = Math.abs(distance) / Math.max(1, Date.now() - start.Time);

			if (event.type !== 'pointercancel' && (Math.abs(distance) > data.Options.Threshold || (Math.abs(distance) > 12 && speed > 0.5))) {
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

			data.Start = {ID: event.pointerId, X: event.clientX, Y: event.clientY, Time: Date.now(), Moving: false};
		};

		element.addEventListener('pointerdown', data.Down);
		element.addEventListener('pointermove', data.Move);
		element.addEventListener('pointerup', data.Up);
		element.addEventListener('pointercancel', data.Up);
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
	}
});
