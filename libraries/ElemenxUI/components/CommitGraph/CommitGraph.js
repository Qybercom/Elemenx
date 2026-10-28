/*
 * The history of a repository as git draws it: Commits, newest first as git log gives them ([{ID, Parents: [ID],
 * Message, Author, Date, Refs: [{Name, Kind: branch, remote, tag or head}]}]), each in a lane of its own color; a merge
 * joins its lanes, a branch leaves one. Lanes are laid out once for the whole list, as git log --graph does.
 * - Layout list (the default): a row for each commit, its graph on the left, then its refs, message, author, date and
 *   short ID (Columns: the ones shown, of message, author, date and id). Height is the height of the list in pixels:
 *   it shows the rows in view only, so a history of thousands scrolls; 'auto' shows them all.
 * - Layout scheme: the history across, oldest on the left, a lane for each branch, its name at its start (the refs of
 *   its tip), the commits as dots with their refs over them (ShowMessages writes the messages under them), as the
 *   schemes of git-flow draw it.
 * Selected is the ID of the commit chosen: a press, the arrows, Home and End choose; Enter or a double press opens it.
 * Events: select (the commit), open (the commit).
 */
Elemenx.Component('CommitGraph', {
	$TemplateURL: 'CommitGraph.html',
	$StyleURL: 'CommitGraph.css',
	$Meta: {
		Group: 'data',
		Icon: 'branch',
		Description: 'The history of a repository as git draws it: commits in lanes of their colors, merges and branches.',
		Events: {
			select: 'A commit was chosen: the commit.',
			open: 'A commit was opened (Enter, a double press): the commit.'
		},
		Props: {
			Commits: 'The commits, newest first: [{ID, Parents, Message, Author, Date, Refs: [{Name, Kind}]}].',
			Layout: {Options: ['list', 'scheme'], Description: 'list (a row for each commit) or scheme (across, a lane for each branch).'},
			Selected: 'The ID of the commit chosen.',
			Columns: 'The columns of the list: message, author, date and id.',
			Height: 'The height of the list in pixels (it shows the rows in view only), or auto.',
			ShowMessages: 'In a scheme, writes the message under each commit.',
			Label: 'The name of the history for screen readers.'
		},
		Sample: {Commits: [
			{ID: 'f3a9c21', Parents: ['b81d07e', 'e42c9aa'], Message: 'Merge feature/login', Author: 'Ada', Date: '2026-10-27', Refs: [{Name: 'main', Kind: 'branch'}, {Name: 'HEAD', Kind: 'head'}]},
			{ID: 'e42c9aa', Parents: ['c17be50'], Message: 'Remember the user', Author: 'Grace', Date: '2026-10-26', Refs: [{Name: 'feature/login', Kind: 'branch'}]},
			{ID: 'b81d07e', Parents: ['c17be50'], Message: 'Fix the footer', Author: 'Ada', Date: '2026-10-25'},
			{ID: 'c17be50', Parents: ['0a1b2c3'], Message: 'The login form', Author: 'Grace', Date: '2026-10-24', Refs: [{Name: 'v1.0', Kind: 'tag'}]},
			{ID: '0a1b2c3', Parents: [], Message: 'First commit', Author: 'Ada', Date: '2026-10-20'}
		]}
	},
	Commits: [],
	Layout: 'list',
	Selected: null,
	Columns: ['message', 'author', 'date', 'id'],
	Height: 360,
	ShowMessages: false,
	Label: '',
	Top: 0,
	Palette: ['#3f6c9e', '#c2477f', '#2f8f83', '#d99a1e', '#7a4fb0', '#d25f3a', '#5f7d2e', '#0f8fae'],

	$OnCreate: function () {
		var self = this;
		/* The layout of the last list, for the list and for the scheme. */
		var cache = {list: {Commits: null, Graph: null}, scheme: {Commits: null, Graph: null}};

		/* The width of a lane and the height of a row of the list, in pixels. */
		this.Lane = 14;
		this.Row = 28;

		this.ColorOf = function (lane) {
			return self.Palette[lane % self.Palette.length];
		};

		/*
		 * The lanes of the commits, as git log --graph lays them out: {Rows: [{Commit, Index, Lane, Before, After,
		 * Converging, Edges: [{From, To, Color}]}], Lanes (the most at once), Tips: {lane: refs of its first commit}}.
		 * Before and After are the lanes (the ID each waits for, or null) above and under the row; lanes keep their
		 * places, so a line goes down its lane from row to row. With spread (the scheme) a lane once ended is not taken
		 * again: each branch has a lane of its own.
		 */
		this.Graph = function (commits, spread) {
			var list = Array.isArray(commits) ? commits : [];
			var lanes = [];
			var rows = [];
			var most = 0;
			var tips = {};
			var next = 0;
			var store = cache[spread ? 'scheme' : 'list'];
			var free = function () {
				var index;

				if (spread)
					return next++;

				index = lanes.indexOf(null);

				return index === -1 ? lanes.length : index;
			};

			if (store.Commits === list) return store.Graph;

			list.forEach(function (commit, index) {
				var id = String(commit.ID);
				var parents = (commit.Parents || []).map(String);
				var before = lanes.slice();
				var lane = lanes.indexOf(id);
				var converging = [];
				var edges = [];
				var k;

				if (lane === -1) {
					lane = free();
					lanes[lane] = id;
					before = lanes.slice();
					before[lane] = null;
				}

				if (!tips[lane] && (commit.Refs || []).length)
					tips[lane] = commit.Refs;

				/* The other lanes that wait for this commit end here: their branches merged into it. */
				for (k = 0; k < lanes.length; k++) {
					if (k !== lane && lanes[k] === id) {
						converging.push(k);

						lanes[k] = null;
					}
				}

				lanes[lane] = parents.length ? parents[0] : null;

				if (parents.length)
					edges.push({From: lane, To: lane, Color: self.ColorOf(lane)});

				/* The parents after the first: a lane that waits for one already, or a new lane. */
				parents.slice(1).forEach(function (parent) {
					var at = lanes.indexOf(parent);

					if (at === -1) {
						at = free();
						lanes[at] = parent;
					}

					edges.push({From: lane, To: at, Color: self.ColorOf(at)});
				});

				while (!spread && lanes.length && lanes[lanes.length - 1] === null)
					lanes.pop();

				most = Math.max(most, before.length, lanes.length, lane + 1, next);

				rows.push({Commit: commit, Index: index, Lane: lane, Before: before, After: lanes.slice(), Converging: converging, Edges: edges});
			});

			store.Commits = list;
			store.Graph = {Rows: rows, Lanes: most, Tips: tips};

			return store.Graph;
		};

		/* The paths of the graph of a row of the list: [{D, Color}] in its own SVG (a line through, or into and out of its dot). */
		this.Paths = function (row) {
			var lane = self.Lane;
			var height = self.Row;
			var middle = height / 2;
			var x = function (index) {
				return index * lane + lane / 2;
			};
			var paths = [];
			var k;

			for (k = 0; k < row.Before.length; k++) {
				if (row.Before[k] === null || k === row.Lane || row.Converging.indexOf(k) !== -1) continue;

				/* A lane that goes through the row. */
				if (row.After[k] === row.Before[k])
					paths.push({D: 'M' + x(k) + ' 0V' + height, Color: self.ColorOf(k)});
			}

			/* Into the dot: its own lane from above, and the lanes that merge into it. */
			if (row.Before[row.Lane] !== null && row.Before[row.Lane] !== undefined)
				paths.push({D: 'M' + x(row.Lane) + ' 0V' + middle, Color: self.ColorOf(row.Lane)});

			row.Converging.forEach(function (from) {
				paths.push({D: 'M' + x(from) + ' 0C' + x(from) + ' ' + middle + ' ' + x(row.Lane) + ' ' + (middle / 2) + ' ' + x(row.Lane) + ' ' + middle, Color: self.ColorOf(from)});
			});

			/* Out of it, to its parents. */
			row.Edges.forEach(function (edge) {
				paths.push({D: edge.To === edge.From ? 'M' + x(edge.From) + ' ' + middle + 'V' + height : 'M' + x(edge.From) + ' ' + middle + 'C' + x(edge.From) + ' ' + (middle * 1.5) + ' ' + x(edge.To) + ' ' + middle + ' ' + x(edge.To) + ' ' + height, Color: edge.Color});
			});

			return paths;
		};

		/* The width of the graph column. */
		this.GraphWidth = function (commits) {
			return Math.max(1, self.Graph(commits).Lanes) * self.Lane;
		};

		/* The rows of the list in view (all with Height auto), a few more around them. */
		this.Visible = function (commits, top, height) {
			var rows = self.Graph(commits).Rows;
			var first;
			var count;

			if (height === 'auto' || !Number(height)) return rows;

			first = Math.max(0, Math.floor(Number(top) / self.Row) - 8);
			count = Math.ceil(Number(height) / self.Row) + 16;

			return rows.slice(first, first + count);
		};

		this.Shown = function (columns, name) {
			return (Array.isArray(columns) ? columns : String(columns || '').split(',').map(function (each) {
				return each.trim();
			})).indexOf(name) !== -1;
		};

		this.RefNames = function (refs) {
			return (refs || []).map(function (ref) {
				return ref.Name;
			}).join(', ');
		};

		/* A text of the scheme, cut to the room between two commits (the whole of it is the title of the commit). */
		this.Clip = function (text, length) {
			var value = String(text || '');

			return value.length > length ? value.substring(0, length - 1) + '…' : value;
		};

		this.Short = function (id) {
			return String(id || '').substring(0, 7);
		};

		this.When = function (date) {
			var value = date instanceof Date ? date : new Date(date);

			if (!date)
				return '';

			if (isNaN(value.getTime())) return String(date);

			try {
				return new Intl.DateTimeFormat(Elemenx.Locale.Language ? Elemenx.Locale.Language() : undefined, {year: 'numeric', month: 'short', day: 'numeric'}).format(value);
			}
			catch (error) {
				return value.toISOString().substring(0, 10);
			}
		};

		this.Spoken = function (commit) {
			return Elemenx.Locale.Text('ui.commitGraph.commit', {message: commit.Message || '', author: commit.Author || '', date: self.When(commit.Date), id: self.Short(commit.ID)});
		};

		/*
		 * The scheme: the history across, oldest on the left. {Width, Height, Lanes: [{Y, Color, Name, From, To}], Dots:
		 * [{X, Y, Color, Commit, Refs}], Edges: [{D, Color}]}.
		 */
		this.Scheme = function (commits, messages) {
			var graph = self.Graph(commits, true);
			var count = graph.Rows.length;
			var step = messages ? 120 : 64;
			var gap = messages ? 64 : 48;
			var left = 112;
			var top = 34;
			var place = {};
			var extent = {};
			var result = {Lanes: [], Dots: [], Edges: []};

			graph.Rows.forEach(function (row) {
				var x = left + (count - 1 - row.Index) * step;
				var y = top + row.Lane * gap;

				place[String(row.Commit.ID)] = {X: x, Y: y, Lane: row.Lane};

				extent[row.Lane] = extent[row.Lane] || {From: x, To: x};
				extent[row.Lane].From = Math.min(extent[row.Lane].From, x);
				extent[row.Lane].To = Math.max(extent[row.Lane].To, x);

				result.Dots.push({X: x, Y: y, Color: self.ColorOf(row.Lane), Commit: row.Commit, Refs: row.Commit.Refs || [], Key: String(row.Commit.ID)});
			});

			graph.Rows.forEach(function (row) {
				var from = place[String(row.Commit.ID)];

				(row.Commit.Parents || []).forEach(function (parent) {
					var to = place[String(parent)];
					var middle;

					if (!to) return;

					middle = (from.X + to.X) / 2;

					result.Edges.push({
						Key: row.Commit.ID + '>' + parent,
						D: to.Y === from.Y ? 'M' + to.X + ' ' + to.Y + 'H' + from.X : 'M' + to.X + ' ' + to.Y + 'C' + middle + ' ' + to.Y + ' ' + middle + ' ' + from.Y + ' ' + from.X + ' ' + from.Y,
						Color: self.ColorOf(to.Y === from.Y ? from.Lane : (from.Lane > to.Lane ? from.Lane : to.Lane))
					});
				});
			});

			Object.keys(extent).forEach(function (lane) {
				var refs = graph.Tips[lane] || [];
				var named = refs.filter(function (ref) {
					return ref.Kind !== 'tag' && ref.Kind !== 'head';
				})[0];

				result.Lanes.push({Key: lane, Y: top + Number(lane) * gap, Color: self.ColorOf(Number(lane)), Name: named ? named.Name : '', From: extent[lane].From, To: extent[lane].To});
			});

			result.Width = left + Math.max(1, count) * step;
			result.Height = top + Math.max(1, graph.Lanes) * gap + (messages ? 10 : -14);

			return result;
		};
	},

	Scrolled: function (event, node) {
		this.Top = node.scrollTop;
	},

	/* The commit of a row pressed, by its data-id. */
	CommitOf: function (node) {
		var id = node && node.getAttribute('data-id');

		return (this.Commits || []).filter(function (commit) {
			return String(commit.ID) === id;
		})[0] || null;
	},

	Pressed: function (event, node) {
		var commit = this.CommitOf(node);
		if (!commit) return;

		this.Select(commit);
	},

	Opened: function (event, node) {
		var commit = this.CommitOf(node);
		if (commit)
			this.$Emit('open', commit);
	},

	Select: function (commit) {
		this.Selected = commit.ID;

		this.$Emit('select', commit);
	},

	/* The arrows, Home and End choose a commit, Enter opens it; the list scrolls to it. */
	Keyed: function (event) {
		var list = this.Commits || [];
		var index = -1;
		var self = this;
		var body;
		var next;

		list.forEach(function (commit, at) {
			if (String(commit.ID) === String(self.Selected))
				index = at;
		});

		if (event.key === 'Enter' && index !== -1) {
			event.preventDefault();

			this.$Emit('open', list[index]);

			return;
		}

		if (event.key === 'ArrowDown') next = Math.min(list.length - 1, index + 1);
		else if (event.key === 'ArrowUp') next = Math.max(0, index - 1);
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = list.length - 1;
		else return;

		event.preventDefault();

		if (next < 0 || !list[next]) return;

		this.Select(list[next]);

		body = this.$Ref('Body');

		if (body && this.Height !== 'auto') {
			if (next * this.Row < body.scrollTop) body.scrollTop = next * this.Row;
			else if ((next + 1) * this.Row > body.scrollTop + body.clientHeight) body.scrollTop = (next + 1) * this.Row - body.clientHeight;
		}
	}
});
