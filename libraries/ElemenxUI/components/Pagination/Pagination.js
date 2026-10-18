/*
 * Pages of a list of Count items, PageSize (10) on each: the range shown ('11–20 of 57'), a choice of PageSizes
 * (none when empty), and the buttons of the first page, the previous one, the numbers (the first, the last and the
 * ones around Page, with gaps between), the next one and the last. Page is from 1. Used by Table; works under any list.
 * ShowRange, ShowPages, ShowFirstLast and ShowPrevNext switch the range, the numbers, the buttons of the first and the
 * last page and those of the previous and the next one. Siblings is how many numbers show on each side of Page (1),
 * Boundaries how many at each end (1); a gap that would hide a single page shows that page.
 * Events: page ({Page, PageSize}).
 */
Elemenx.Component('Pagination', {
	$TemplateURL: 'Pagination.html',
	$StyleURL: 'Pagination.css',
	Page: 1,
	Count: 0,
	PageSize: 10,
	PageSizes: [10, 25, 50, 100],
	OfLabel: '',
	SizeLabel: '',
	Label: '',
	ShowRange: true,
	ShowPages: true,
	ShowFirstLast: true,
	ShowPrevNext: true,
	Siblings: 1,
	Boundaries: 1,

	$OnCreate: function () {
		var self = this;

		this.Pages = function (count, size) {
			return Number(size) > 0 ? Math.max(1, Math.ceil(Number(count) / Number(size))) : 1;
		};

		this.Current = function (page, count, size) {
			return Math.max(1, Math.min(Number(page) || 1, self.Pages(count, size)));
		};

		this.List = function (page, count, size, siblings, boundaries) {
			var pages = self.Pages(count, size);
			var current = self.Current(page, count, size);
			var list = [];
			var last = 0;
			var i = 1;

			siblings = Math.max(0, Math.floor(Number(siblings) || 0));
			boundaries = Math.max(0, Math.floor(Number(boundaries) || 0));

			while (i <= pages) {
				if (i <= boundaries || i > pages - boundaries || Math.abs(i - current) <= siblings) {
					if (last && i - last === 2) list.push({Key: 'page-' + (i - 1), Number: i - 1, Current: false});
					else if (i - last > 1) list.push({Key: 'gap-' + i, Gap: true});

					list.push({Key: 'page-' + i, Number: i, Current: i === current});

					last = i;
				}

				i++;
			}

			if (last < pages)
				list.push({Key: 'gap-end', Gap: true});

			return list;
		};

		this.Range = function (page, count, size) {
			var current = self.Current(page, count, size);
			var per = Number(size) || Number(count);

			if (!Number(count))
				return self.OfLabel ? '0 ' + self.OfLabel + ' 0' : Elemenx.Locale.Text('ui.pagination.range', {from: 0, to: 0, count: 0});

			if (self.OfLabel)
				return ((current - 1) * per + 1) + '–' + Math.min(Number(count), current * per) + ' ' + self.OfLabel + ' ' + count;

			return Elemenx.Locale.Text('ui.pagination.range', {from: (current - 1) * per + 1, to: Math.min(Number(count), current * per), count: count});
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
