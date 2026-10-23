/*
 * *popup="Open" shows the element as a floating panel next to its anchor while the expression is truthy.
 * The anchor is the closest .elemenx-popup-anchor ancestor, or the parent element.
 * data-placement: bottom-start (default), bottom-end, top-start, top-end, right-start; start and end, and the side of
 * right-start, follow the direction of the page (on a right-to-left page start is the right edge). A right-start panel
 * without room on either side (a submenu on a phone) goes under its anchor, a step in.
 * The panel dispatches a "dismiss" DOM event on an outside pointer press and on Escape; the owner closes it.
 * The panel keeps to its anchor while the page scrolls or resizes and while its own size changes. It opens in the top
 * layer (a popover of the browser): no overflow, transform or stacking of the parts of the page around it cuts or hides
 * it; a browser without popovers places it as a fixed panel over the page.
 */
Elemenx.Directive('popup', {
	$Meta: {
		Description: '*popup="Open" shows the element as a floating panel next to its anchor while the expression is truthy.'
	},
	$OnCreate: function (context) {
		var element = context.Element;
		var data = context.Data;

		element.hidden = true;
		data.Open = false;
		data.Popover = typeof element.showPopover === 'function';

		if (data.Popover)
			element.setAttribute('popover', 'manual');

		/* Into the top layer, or out of it; a panel out of the document waits for its next opening. */
		data.Layer = function (open) {
			if (!data.Popover || !element.isConnected) return;

			if (open && !element.matches(':popover-open')) element.showPopover();
			else if (!open && element.matches(':popover-open')) element.hidePopover();
		};

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
			var rtl;

			if (!anchor || !data.Open) return;

			rect = anchor.getBoundingClientRect();

			/* On a right-to-left page start is the right edge and a side panel opens to the left. */
			rtl = window.getComputedStyle(anchor).direction === 'rtl';

			if (placement.indexOf('right') !== 0 && element.getAttribute('data-match-width') !== 'false')
				element.style.minWidth = rect.width + 'px';

			width = element.offsetWidth;
			height = element.offsetHeight;

			if (placement.indexOf('right') === 0) {
				left = rtl ? rect.left - gap - width : rect.right + gap;
				top = rect.top - gap - 1;

				if (rtl && left < margin) left = rect.right + gap;
				else if (!rtl && left + width > window.innerWidth - margin) left = rect.left - gap - width;

				if (top + height > window.innerHeight - margin)
					top = Math.max(margin, window.innerHeight - margin - height);

				/*
				 * No room on either side (a submenu on a phone): under its anchor, a step in, rather than over it, where
				 * the press that opened it would land on one of its items; above it when there is no room below.
				 */
				if (left < margin || left + width > window.innerWidth - margin) {
					left = rtl ? rect.right - 16 - width : rect.left + 16;
					top = rect.bottom + gap;

					if (top + height > window.innerHeight - margin && rect.top - gap - height >= margin)
						top = rect.top - gap - height;
				}
			}
			else {
				left = (placement.indexOf('end') !== -1) !== rtl ? rect.right - width : rect.left;
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
			/* In a shadow root the document sees the host as the target: the path holds the pressed node. */
			var target = event.composedPath ? event.composedPath()[0] : event.target;
			if (element.contains(target) || (anchor && anchor.contains(target))) return;

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

		data.Layer(open);
		data.Listen(open);

		if (open) {
			element.style.left = '0px';
			element.style.top = '0px';

			data.Position();

			window.requestAnimationFrame(data.Position);
		}
	},

	$OnDestroy: function (context) {
		if (context.Data.Open) {
			context.Data.Listen(false);
			context.Data.Layer(false);
		}

		context.Data.Open = false;
	}
});