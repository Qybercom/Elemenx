/*
 * The stage of a call: where its videos are and its bars. Slots: main (the video in front: the speaker, a screen
 * shared), participants (their CallTiles), self (the own video, in a corner over the stage; it can be dragged to
 * another corner), controls (a CallControls), side (a panel: the chat, the people; shown with Side), status (the time,
 * the recording). Layout: grid (the participants in a grid of as many columns as they need, main in it when it has
 * content), speaker (main large, the participants in a strip under it), screen (main large, the participants in a
 * column beside it). The grid pages the participants past PerPage (the page with Page, the buttons by its side).
 */
Elemenx.Component('CallStage', {
	$TemplateURL: 'CallStage.html',
	$StyleURL: 'CallStage.css',
	$Meta: {
		Group: 'layout',
		Icon: 'users',
		Description: 'The stage of a call: the video in front, the tiles of the participants, the own video, the controls and a side panel.',
		Container: true,
		Slots: ['main', 'participants', 'self', 'controls', 'side', 'status'],
		Events: ['layout', 'corner', 'page'],
		Props: {
			Layout: {Options: ['grid', 'speaker', 'screen'], Description: 'grid, speaker (main large, a strip under it) or screen (main large, a column beside it).'},
			Side: 'Shows the side panel.',
			Corner: {Options: ['bottom-right', 'bottom-left', 'top-right', 'top-left'], Description: 'The corner of the own video.'},
			PerPage: 'How many participants a page of the grid shows (0: all).',
			Page: 'The page of the grid.'
		},
		Sample: {Layout: 'grid'}
	},
	Layout: 'grid',
	Side: false,
	Corner: 'bottom-right',
	PerPage: 0,
	Page: 0,
	Count: 0,

	$OnReady: function () {
		var self = this;
		var element = this.$Element();

		/* The grid takes as many columns as its tiles need: it counts them as they come and go. */
		this.Counted = function () {
			var list = element.querySelector('.elemenx-call-stage-participants');
			var tiles = list ? Array.prototype.filter.call(list.querySelectorAll('.elemenx-call-tile'), function (tile) {
				return !tile.parentNode.closest('.elemenx-call-tile');
			}) : [];
			var per = Number(self.PerPage) || 0;
			var pages = per ? Math.max(1, Math.ceil(tiles.length / per)) : 1;
			var page = Math.min(Number(self.Page) || 0, pages - 1);

			/* The tiles of the other pages hidden (the slot holds them in an element of display contents: the tiles themselves). */
			tiles.forEach(function (tile, index) {
				tile.hidden = !!per && Math.floor(index / per) !== page;
			});

			/* The slots that hold something (main in front, the own video, the bars): an element past the wrappers of the slot. */
			['main', 'self', 'status', 'controls'].forEach(function (name) {
				element.classList.toggle('has-' + name, Array.prototype.some.call(element.querySelectorAll('.elemenx-call-stage-' + name + ' *'), function (node) {
					return node.tagName !== 'SLOT' && node.style.display !== 'contents';
				}));
			});

			if (self.Count !== tiles.length)
				self.Count = tiles.length;

			self.Pages = pages;
		};

		this.Watch = new MutationObserver(this.Counted);

		this.Watch.observe(element, {childList: true, subtree: true});

		this.Counted();
	},

	$OnDestroy: function () {
		if (this.Watch)
			this.Watch.disconnect();
	},

	$OnCreate: function () {
		var self = this;

		/* The columns of the grid for count tiles (main counted as one more): as square as the stage allows. */
		this.Columns = function (count, layout, per) {
			var shown = Math.max(1, per ? Math.min(Number(per), count) : count);

			if (layout !== 'grid') return 1;

			return Math.ceil(Math.sqrt(shown));
		};

		this.Pages = 1;

		this.HasPages = function (count, per) {
			return !!per && count > Number(per);
		};

		/* The page is the last one: the next button off. */
		this.Last = function (count, per, page) {
			return !per || (Number(page) || 0) >= Math.ceil(count / Number(per)) - 1;
		};

		/* The page or its size changed by the Application: the tiles counted again, after the drawing (a template calls it). */
		this.Paged = function (page) {
			if (self.Counted)
				window.setTimeout(self.Counted, 0);

			return page;
		};

		this.Own = function () {
			return self.Drag || (self.Drag = {});
		};
	},

	Previous: function () {
		this.Page = Math.max(0, (Number(this.Page) || 0) - 1);

		this.Counted();

		this.$Emit('page', {Page: this.Page});
	},

	Next: function () {
		this.Page = Math.min(this.Pages - 1, (Number(this.Page) || 0) + 1);

		this.Counted();

		this.$Emit('page', {Page: this.Page});
	},

	/* The own video dragged: it goes to the corner of the stage nearest to where it is let go. */
	Grabbed: function (event, node) {
		var own = this.Own();

		if (event.button !== 0) return;

		own.Start = {X: event.clientX, Y: event.clientY};
		own.Node = node;

		if (node.setPointerCapture)
			node.setPointerCapture(event.pointerId);

		node.classList.add('dragging');
	},

	Dragged: function (event) {
		var own = this.Own();
		if (!own.Start) return;

		own.Node.style.transform = 'translate(' + (event.clientX - own.Start.X) + 'px, ' + (event.clientY - own.Start.Y) + 'px)';
	},

	Dropped: function (event) {
		var own = this.Own();
		var box;
		var corner;

		if (!own.Start) return;

		box = this.$Element().querySelector('.elemenx-call-stage-area').getBoundingClientRect();
		corner = (event.clientY < box.top + box.height / 2 ? 'top' : 'bottom') + '-' + (event.clientX < box.left + box.width / 2 ? 'left' : 'right');

		own.Node.style.transform = '';

		own.Node.classList.remove('dragging');

		own.Start = null;

		if (corner !== this.Corner) {
			this.Corner = corner;

			this.$Emit('corner', {Corner: corner});
		}
	}
});
