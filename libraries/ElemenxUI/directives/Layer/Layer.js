/*
 * *layer puts its element in the top layer of the page (a popover of the browser) while it is in the page; *layer="Open"
 * only while the expression is truthy. A part fixed to the viewport (a host of toasts, a tour, a window of the page, a
 * point a menu opens at) is placed by the viewport there, wherever it is in the page: a box around it with containment
 * (content-visibility, contain), a transform or a filter would otherwise place it by that box, and an overflow or a
 * stacking context would cut or hide it. The element keeps its own place, size and look (elemenx-layer takes back the
 * defaults of the browser for a popover), stays in the DOM where it is, so it takes the theme and the styles of that
 * part of the page and its events bubble as before. An element put in the page later (a part of a *if, a component
 * placed after it is built, one Elemenx.Cache brings back) goes in when it is there. Out of the top layer it is the
 * element it was (no popover: the panel of a group that is part of its bar while it is not open). The last one shown
 * is on top, and a new truthy value brings it on top again (*layer="Z": windows in the order of their stack), the
 * focus inside it kept. A browser without popovers leaves it fixed as it was.
 */
Elemenx.Directive('layer', {
	$Meta: {
		Description: '*layer puts its element in the top layer of the page while it is in the page (*layer="Open": while the expression is truthy), placed by the viewport wherever it is.'
	},
	$OnCreate: function (context) {
		var element = context.Element;
		var data = context.Data;

		data.Popover = typeof element.showPopover === 'function';
		data.Wanted = !/\S/.test(context.Expression || '');

		element.classList.add('elemenx-layer');

		/* Into the top layer (a popover while it is there) or out of it; an element not in the page yet goes in once it is. */
		data.Apply = function () {
			window.clearTimeout(data.Waiting);

			if (!data.Popover) return;

			/*
			 * A part of a *if is made before it is put in the page, in the same task: it goes in at the end of that task
			 * (a press right after it opened found it still placed by its section); one put in later, at a next look.
			 */
			if (data.Wanted && !element.isConnected) {
				data.Waiting = window.setTimeout(data.Apply, 16);

				if (!data.Queued && typeof queueMicrotask === 'function') {
					data.Queued = true;

					queueMicrotask(function () {
						data.Queued = false;

						if (element.isConnected)
							data.Apply();
					});
				}

				return;
			}

			if (data.Wanted) {
				if (element.getAttribute('popover') !== 'manual')
					element.setAttribute('popover', 'manual');

				if (!element.matches(':popover-open'))
					element.showPopover();
			}
			else if (element.hasAttribute('popover')) {
				if (element.matches(':popover-open'))
					element.hidePopover();

				element.removeAttribute('popover');
			}
		};

		/* On top of the others again: out and in, the focus where it was. */
		data.Raise = function () {
			var focused = (element.ownerDocument || document).activeElement;

			if (!data.Popover || !element.matches(':popover-open')) return;

			element.hidePopover();
			element.showPopover();

			if (focused && focused !== element.ownerDocument.activeElement && element.contains(focused))
				focused.focus({preventScroll: true});
		};

		data.Apply();
	},

	$OnUpdate: function (context) {
		var data = context.Data;
		var was = data.Value;

		if (!/\S/.test(context.Expression || '')) return;

		data.Value = context.Value;
		data.Wanted = !!context.Value;

		if (data.Wanted && was && was !== context.Value) data.Raise();
		else data.Apply();
	},

	/* Out of the page the browser takes it out of the top layer; back in, it goes in again. */
	$OnWake: function (context) {
		context.Data.Apply();
	},

	$OnDestroy: function (context) {
		window.clearTimeout(context.Data.Waiting);

		if (context.Data.Popover && context.Element.hasAttribute('popover') && context.Element.matches(':popover-open'))
			context.Element.hidePopover();
	}
});
