/*
 * Pages of a list of Count items, PageSize (10) on each: the range shown ('11–20 of 57'), a choice of PageSizes
 * (none when empty), and the buttons of the first page, the previous one, the numbers (the first, the last and the
 * ones around Page, with gaps between), the next one and the last. Page is from 1. Used by Table; works under any list.
 * Events: page ({Page, PageSize}).
 */
Elemenx.Component('Pagination', {
	$TemplateURL: 'Pagination.html',
	$StyleURL: 'Pagination.css',
	Page: 1,
	Count: 0,
	PageSize: 10,
	PageSizes: [10, 25, 50, 100],
	OfLabel: 'of',
	SizeLabel: '/ page',
	Label: 'Pages',

	$OnCreate: function () {
		var self = this;

		this.Pages = function (count, size) {
			return Number(size) > 0 ? Math.max(1, Math.ceil(Number(count) / Number(size))) : 1;
		};

		this.Current = function (page, count, size) {
			return Math.max(1, Math.min(Number(page) || 1, self.Pages(count, size)));
		};

		this.List = function (page, count, size) {
			var pages = self.Pages(count, size);
			var current = self.Current(page, count, size);
			var list = [];
			var last = 0;
			var i = 1;

			while (i <= pages) {
				if (i === 1 || i === pages || Math.abs(i - current) <= 1) {
					if (i - last > 1)
						list.push({Key: 'gap-' + i, Gap: true});

					list.push({Key: 'page-' + i, Number: i, Current: i === current});

					last = i;
				}

				i++;
			}

			return list;
		};

		this.Range = function (page, count, size) {
			var current = self.Current(page, count, size);
			var per = Number(size) || Number(count);

			if (!Number(count))
				return '0 ' + self.OfLabel + ' 0';

			return ((current - 1) * per + 1) + '–' + Math.min(Number(count), current * per) + ' ' + self.OfLabel + ' ' + count;
		};
	},

	GoTo: function (page) {
		page = this.Current(page, this.Count, this.PageSize);

		if (page === Number(this.Page)) return;

		this.Page = page;

		this.$Emit('page', {Page: page, PageSize: Number(this.PageSize)});
	},

	First: function () {
		this.GoTo(1);
	},

	Previous: function () {
		this.GoTo(Number(this.Page) - 1);
	},

	Next: function () {
		this.GoTo(Number(this.Page) + 1);
	},

	Last: function () {
		this.GoTo(Infinity);
	},

	To: function (event, node) {
		this.GoTo(Number(node.getAttribute('data-page')));
	},

	Resize: function (event, node) {
		this.PageSize = Number(node.value);
		this.Page = 1;

		this.$Emit('page', {Page: 1, PageSize: this.PageSize});
	}
});
