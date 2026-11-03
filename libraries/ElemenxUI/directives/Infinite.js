/*
 * *infinite asks for more when the end of a list comes near: on an element that scrolls (or on one inside the page, the
 * page scrolling), *infinite, *infinite="{Margin: 300, Direction: 'down' or 'up', Busy: false, Done: false}". The element
 * dispatches more ({Direction}) when its end (up: its start, as the older messages of a chat) is within Margin pixels of
 * the view, and when it is too short to scroll at all; once a time: again only when it grew, or the view went away from
 * the end and came back. Busy: what was asked is coming; Done: there is no more. Up keeps what the reader sees in its
 * place when rows come above it; it asks only once the list was scrolled (a chat opens at its top before it goes to its
 * end), or when there is nothing to scroll.
 */
Elemenx.Directive('infinite', {
	$Meta: {
		Description: '*infinite asks for more (the event more) when the end of a list comes near: *infinite="{Margin: 300, Direction: \'down\' or \'up\', Busy: false, Done: false}".'
	},

	$OnCreate: function (context) {
		var element = context.Element;
		var data = context.Data;

		data.Options = {Margin: 300, Direction: 'down', Busy: false, Done: false};
		data.Armed = true;
		data.Height = 0;
		data.Anchor = null;

		/* What scrolls: the element when it can, else the page. */
		data.Scroller = function () {
			var style = window.getComputedStyle(element);

			return /(auto|scroll)/.test(style.overflowY) ? element : null;
		};

		/* How far the end (up: the start) is out of the view, in pixels. */
		data.Distance = function () {
			var scroller = data.Scroller();
			var box;

			if (scroller)
				return data.Options.Direction === 'up' ? scroller.scrollTop : scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;

			box = element.getBoundingClientRect();

			return data.Options.Direction === 'up' ? -box.top : box.bottom - window.innerHeight;
		};

		data.Check = function () {
			var scroller = data.Scroller();
			var height = scroller ? scroller.scrollHeight : element.offsetHeight;
			var near;

			data.Frame = 0;

			/* Rows that came above, while the reader was near the top: what they see stays where it was. */
			if (data.Anchor && scroller && height !== data.Anchor.Height) {
				scroller.scrollTop = data.Anchor.Top + height - data.Anchor.Height;
				data.Anchor = null;
			}

			if (height !== data.Height) {
				data.Height = height;
				data.Armed = true;
			}

			near = data.Distance() <= data.Options.Margin;

			/* Up: a list not scrolled yet is at its top only until its owner takes it to its end. */
			if (near && data.Options.Direction === 'up' && !data.Scrolled && scroller && scroller.scrollHeight > scroller.clientHeight) return;

			if (!near) {
				data.Armed = true;

				return;
			}

			if (!data.Armed || data.Options.Busy || data.Options.Done || !element.isConnected) return;

			data.Armed = false;

			if (data.Options.Direction === 'up' && scroller)
				data.Anchor = {Height: height, Top: scroller.scrollTop};

			element.dispatchEvent(new CustomEvent('more', {detail: {Direction: data.Options.Direction}}));
		};

		data.Moved = function () {
			data.Scrolled = true;

			data.Later();
		};

		/* Scrolls and changes come faster than frames: one look a frame. */
		data.Later = function () {
			if (!data.Frame)
				data.Frame = window.requestAnimationFrame(data.Check);
		};

		data.Changes = new MutationObserver(function () {
			var scroller = data.Scroller();

			/* Before the frame: a row added above must not show for a frame where it pushed the others down. */
			if (data.Anchor && scroller && scroller.scrollHeight !== data.Anchor.Height) data.Check();
			else data.Later();
		});

		data.Changes.observe(element, {childList: true, subtree: true});

		data.Sizes = typeof ResizeObserver === 'function' ? new ResizeObserver(data.Later) : null;

		if (data.Sizes)
			data.Sizes.observe(element);

		element.addEventListener('scroll', data.Moved);
		window.addEventListener('scroll', data.Later, true);
		window.addEventListener('resize', data.Later);
	},

	$OnUpdate: function (context) {
		var value = context.Value;
		var options = value && typeof value === 'object' ? value : {};

		context.Data.Options = {
			Margin: options.Margin === undefined ? 300 : Number(options.Margin) || 0,
			Direction: options.Direction === 'up' ? 'up' : 'down',
			Busy: !!options.Busy,
			Done: !!options.Done
		};

		/* What came while it was busy is looked at again: a list that grew and is still short asks once more. */
		context.Data.Later();
	},

	$OnDestroy: function (context) {
		var element = context.Element;
		var data = context.Data;

		data.Changes.disconnect();

		if (data.Sizes)
			data.Sizes.disconnect();

		window.cancelAnimationFrame(data.Frame);

		element.removeEventListener('scroll', data.Moved);
		window.removeEventListener('scroll', data.Later, true);
		window.removeEventListener('resize', data.Later);
	}
});
