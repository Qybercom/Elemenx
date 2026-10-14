/*
 * *popup="Open" shows the element as a floating panel next to its anchor while the expression is truthy.
 * The anchor is the closest .elemenx-popup-anchor ancestor, or the parent element.
 * data-placement: bottom-start (default), bottom-end, top-start, right-start.
 * The panel dispatches a "dismiss" DOM event on an outside pointer press and on Escape; the owner closes it.
 * The panel keeps to its anchor while the page scrolls or resizes and while its own size changes.
 */
Elemenx.Directive('popup', {
	$OnCreate: function (context) {
		var element = context.Element;
		var data = context.Data;

		element.hidden = true;
		data.Open = false;

		data.Anchor = function () {
			var parent = element.parentElement;

			while (parent) {
				if (parent.classList && parent.classList.contains('elemenx-popup-anchor')) return parent;

				parent = parent.parentElement;
			}

			return element.parentElement;
		};

		data.Position = function () {
			var anchor = data.Anchor();
			var placement = element.getAttribute('data-placement') || 'bottom-start';
			var margin = 8;
			var gap = 4;
			var rect;
			var width;
			var height;
			var top;
			var left;

			if (!anchor || !data.Open) return;

			rect = anchor.getBoundingClientRect();

			if (placement.indexOf('right') !== 0 && element.getAttribute('data-match-width') !== 'false')
				element.style.minWidth = rect.width + 'px';

			width = element.offsetWidth;
			height = element.offsetHeight;

			if (placement.indexOf('right') === 0) {
				left = rect.right + gap;
				top = rect.top - gap - 1;

				if (left + width > window.innerWidth - margin)
					left = rect.left - gap - width;

				if (top + height > window.innerHeight - margin)
					top = Math.max(margin, window.innerHeight - margin - height);
			}
			else {
				left = placement.indexOf('end') !== -1 ? rect.right - width : rect.left;
				top = rect.bottom + gap;

				/* Above the anchor when asked or when there is no room below; below it when there is no room above. */
				if (placement.indexOf('top') === 0 ? rect.top - gap - height >= margin || top + height > window.innerHeight - margin : top + height > window.innerHeight - margin && rect.top - gap - height >= margin)
					top = rect.top - gap - height;
			}

			left = Math.max(margin, Math.min(left, window.innerWidth - margin - width));

			element.style.left = Math.round(left) + 'px';
			element.style.top = Math.round(top) + 'px';
		};

		data.Dismiss = function (reason) {
			element.dispatchEvent(new CustomEvent('dismiss', {detail: {Reason: reason}}));
		};

		data.Press = function (event) {
			var anchor = data.Anchor();
			if (element.contains(event.target) || (anchor && anchor.contains(event.target))) return;

			data.Dismiss('outside');
		};

		data.Key = function (event) {
			var opened;

			if (event.key !== 'Escape') return;

			opened = document.querySelectorAll('.elemenx-popup:not([hidden])');

			if (opened[opened.length - 1] !== element) return;

			event.stopPropagation();

			data.Dismiss('escape');
		};

		data.Listen = function (on) {
			var method = on ? 'addEventListener' : 'removeEventListener';

			document[method]('mousedown', data.Press, true);
			document[method]('touchstart', data.Press, true);
			document[method]('keydown', data.Key, true);

			window[method]('scroll', data.Position, true);
			window[method]('resize', data.Position);

			/* Content that shows after the panel opens (a list that loads, a component behind *if) moves it again. */
			if (typeof ResizeObserver === 'undefined') return;

			data.Sizer = data.Sizer || new ResizeObserver(function () {
				data.Position();
			});

			if (on) data.Sizer.observe(element);
			else data.Sizer.disconnect();
		};
	},

	$OnUpdate: function (context) {
		var element = context.Element;
		var data = context.Data;
		var open = !!context.Value;
		if (open === data.Open) return;

		data.Open = open;
		element.hidden = !open;

		data.Listen(open);

		if (open) {
			element.style.left = '0px';
			element.style.top = '0px';

			data.Position();

			window.requestAnimationFrame(data.Position);
		}
	},

	$OnDestroy: function (context) {
		if (context.Data.Open)
			context.Data.Listen(false);

		context.Data.Open = false;
	}
});