/*
 * A pipeline of CI, as GitHub and GitLab show one: its stages in columns, the jobs of each as cards with their status,
 * their name, their time and an action, the links between them. Only the view: where the data comes from is the owner's.
 *
 * Stages: [{ID, Name, Status, Jobs: [{ID, Name, Status, Duration, Started, Needs, Group, Text, Href, Actions, Element,
 * Render}]}], or declared inside it: PipelineStage with its PipelineJob (the content of one is the content of its
 * card). Status is created, pending, scheduled, running, success, failed, warning (failed, allowed to), canceled,
 * skipped or manual; the one of a stage, without its own, is the one of its jobs (a failed job first). Duration is in
 * seconds; a running job with Started (a date, or milliseconds) counts its time as it goes. Needs are the IDs of the
 * jobs a job waits for. The jobs of one Group (a matrix) are one card, its count and its status, opened by a press.
 *
 * Links: needs (from the jobs of Needs; the default when a job has some), stages (from each stage to the next one, as
 * GitLab joins them) or none. Over a job its needs and the jobs that need it are marked, the others fade. A press or
 * Enter on a job emits select ({Job, Stage}), the arrows go from job to job; Actions (true) shows the action of a job:
 * retry (failed, canceled, success, warning), cancel (running, pending) or play (manual), which emits action ({Action,
 * Job}); a job may list its own Actions ([{ID, Icon, Label}]). Title and Summary (true) show the name of the pipeline,
 * its status and its time above it.
 */
Elemenx.Component('Pipeline', {
	$TemplateURL: 'Pipeline.html',
	$StyleURL: 'Pipeline.css',
	$Traits: ['Declared'],
	$Meta: {
		Group: 'data',
		Icon: 'branch',
		Description: 'A pipeline of CI as GitHub and GitLab show one: stages in columns, jobs with their status and time, the links between them.',
		Container: true,
		Children: ['PipelineStage'],
		Events: {
			select: 'A job was pressed: {Job, Stage}.',
			action: 'The action of a job was pressed: {Action, Job}.'
		},
		Props: {
			Stages: {Schema: {ID: 'text', Name: 'text', Status: 'text'}, Description: 'The stages: [{ID, Name, Status, Jobs: [{ID, Name, Status, Duration, Started, Needs, Group, Text, Href, Actions, Element, Render}]}].'},
			Links: {Options: ['', 'needs', 'stages', 'none'], Description: 'The links: needs, stages or none (needs when a job has some, else stages).'},
			Title: 'The name of the pipeline, above it.',
			Summary: 'Shows its status and its time beside the title.',
			Actions: 'Shows the action of each job: retry, cancel or play.',
			Selected: 'The ID of the job shown as selected.',
			Label: 'The name of the pipeline for screen readers.'
		},
		Sample: {Title: 'main', Stages: [{ID: 'build', Name: 'Build', Jobs: [{ID: 'compile', Name: 'Compile', Status: 'success', Duration: 72}]}, {ID: 'test', Name: 'Test', Jobs: [{ID: 'unit', Name: 'Unit', Status: 'running', Needs: ['compile']}]}]}
	},
	Stages: [],
	Links: '',
	Title: '',
	Summary: true,
	Actions: true,
	Selected: '',
	Label: '',
	Version: 0,
	Now: 0,
	Hovered: '',
	Opened: {},
	Lines: [],

	/* A failed job first: the order in which the statuses of jobs make the one of their stage or group. */
	Order: ['failed', 'running', 'canceled', 'manual', 'pending', 'scheduled', 'warning', 'created', 'success', 'skipped'],
	Icons: {created: 'circle', pending: 'clock', scheduled: 'clock', running: 'loader', success: 'check', failed: 'close', warning: 'warning', canceled: 'stop', skipped: 'chevrons-right', manual: 'play'},

	$OnCreate: function () {
		var self = this;
		var own = {Declared: [], Contents: {}, Last: null, Arguments: null, Timer: 0, Frame: 0};

		this.Own = function () {
			return own;
		};

		/* The model of the view, made again only when what it is made of changes (a template calls it). */
		this.Model = function () {
			var args = Array.prototype.slice.call(arguments);
			if (own.Arguments && own.Arguments.length === args.length && own.Arguments.every(function (value, index) {
				return value === args[index];
			})) return own.Last;

			own.Arguments = args;
			own.Last = self.Build();

			return own.Last;
		};
	},

	/* The PipelineStage declared inside it (the Trait Declared reads them). */
	DeclaredSources: '.elemenx-pipeline-sources',

	$OnReady: function () {
		var self = this;
		var own = this.Own();
		var element = this.$Element();

		if (typeof ResizeObserver === 'function') {
			own.Sizes = new ResizeObserver(function () {
				self.Later();
			});

			own.Sizes.observe(element);
		}

		this.Later();
	},

	$OnDestroy: function () {
		var own = this.Own();
		if (own.Sizes)
			own.Sizes.disconnect();

		window.clearInterval(own.Timer);
		window.cancelAnimationFrame(own.Frame);
	},

	/* The stages declared inside it, each with its jobs, the content of a job taken out for its card. */
	Declarations: function (node) {
		var own = this.Own();

		return Array.prototype.map.call(node.querySelectorAll('.elemenx-pipeline-stage-source'), function (source, index) {
			var stage = JSON.parse(source.getAttribute('data-item') || '{}');

			stage.ID = stage.ID || 'stage-' + index;
			stage.Jobs = Array.prototype.map.call(source.querySelectorAll('.elemenx-pipeline-job-source'), function (job, at) {
				var item = JSON.parse(job.getAttribute('data-item') || '{}');
				var content = job.querySelector('.elemenx-pipeline-job-source-content');
				var holder = own.Contents[item.ID] || null;

				item.ID = item.ID || stage.ID + '-' + at;

				Array.prototype.slice.call(content.childNodes).forEach(function (child) {
					/* Only elements and texts: a comment (the place of an empty slot) is no content. */
					if (child.nodeType !== 1 && (child.nodeType !== 3 || !/\S/.test(child.nodeValue))) return;

					if (!holder) {
						holder = document.createElement('div');
						holder.className = 'elemenx-pipeline-content';
					}

					holder.appendChild(child);
				});

				if (holder)
					own.Contents[item.ID] = holder;

				return item;
			});

			return stage;
		});
	},

	/* The status that stands for several: the first of Order among them. */
	Worst: function (statuses) {
		var order = this.Order;
		var found = statuses.filter(function (status) {
			return order.indexOf(status) !== -1;
		}).sort(function (a, b) {
			return order.indexOf(a) - order.indexOf(b);
		});

		return found[0] || 'created';
	},

	/* A time in seconds as GitHub writes it: 45s, 1m 23s, 2h 5m. */
	Time: function (seconds) {
		var total = Math.max(0, Math.round(Number(seconds) || 0));
		var hours = Math.floor(total / 3600);
		var minutes = Math.floor(total % 3600 / 60);

		if (hours)
			return hours + 'h ' + minutes + 'm';

		if (minutes)
			return minutes + 'm ' + (total % 60) + 's';

		return total + 's';
	},

	/* The seconds of a job: its Duration, or the time since Started while it runs. */
	Seconds: function (job, now) {
		var started;

		if (job.Status === 'running' && job.Started !== undefined && job.Started !== null && job.Started !== '') {
			started = typeof job.Started === 'number' ? job.Started : new Date(job.Started).getTime();

			if (isFinite(started))
				return Math.max(0, ((now || Date.now()) - started) / 1000);
		}

		return job.Duration !== undefined && job.Duration !== null && job.Duration !== '' ? Number(job.Duration) : null;
	},

	/* The action of a job by its status: retry, cancel or play; none for the others. */
	Action: function (status) {
		if (status === 'failed' || status === 'canceled' || status === 'success' || status === 'warning') return 'retry';
		if (status === 'running' || status === 'pending') return 'cancel';
		if (status === 'manual') return 'play';

		return '';
	},

	/* The stages and the cards of the view: a job, or a group of jobs (opened: its jobs after it). */
	Build: function () {
		var self = this;
		var own = this.Own();
		var stages = (this.Stages || []).concat(own.Declared);
		var now = this.Now || Date.now();
		var opened = this.Opened || {};
		var running = false;
		var all = {};
		var model = {Stages: [], Jobs: all, Needs: false, Status: 'created', Seconds: 0};

		model.Stages = stages.map(function (stage, index) {
			var groups = {};
			var cards = [];
			var jobs = (stage.Jobs || []).map(function (job, at) {
				var copy = {};
				var key;

				for (key in job) {
					if (Object.prototype.hasOwnProperty.call(job, key))
						copy[key] = job[key];
				}

				copy.ID = String(job.ID !== undefined && job.ID !== '' ? job.ID : (stage.ID || index) + '-' + at);
				copy.Status = self.Icons[job.Status] ? job.Status : 'created';
				copy.Needs = (Array.isArray(job.Needs) ? job.Needs : job.Needs ? String(job.Needs).split(',') : []).map(function (each) {
					return String(each).trim();
				}).filter(Boolean);
				copy.Stage = stage.ID || String(index);
				copy.Item = job;

				if (copy.Needs.length)
					model.Needs = true;

				if (copy.Status === 'running')
					running = true;

				all[copy.ID] = copy;

				return copy;
			});

			jobs.forEach(function (job) {
				var group;

				if (!job.Group) {
					cards.push(self.Card(job, now));

					return;
				}

				group = groups[job.Group];

				if (!group) {
					group = groups[job.Group] = {Key: 'group:' + job.Group, Group: job.Group, Jobs: []};

					cards.push(group);
				}

				group.Jobs.push(job);
			});

			cards = [].concat.apply([], cards.map(function (card) {
				var status;

				if (!card.Group) return [card];

				status = self.Worst(card.Jobs.map(function (job) {
					return job.Status;
				}));

				card.Name = card.Group;
				card.Status = status;
				card.Icon = self.Icons[status];
				card.Count = card.Jobs.length;
				card.Open = !!opened[card.Key];
				card.IDs = card.Jobs.map(function (job) {
					return job.ID;
				});
				card.Label = card.Group + ', ' + card.Jobs.length + ' jobs, ' + status;

				return [card].concat(card.Open ? card.Jobs.map(function (job) {
					var inner = self.Card(job, now);

					inner.Inner = true;

					return inner;
				}) : []);
			}));

			return {
				ID: stage.ID || String(index),
				Name: stage.Name || stage.ID || '',
				Status: stage.Status && self.Icons[stage.Status] ? stage.Status : self.Worst(jobs.map(function (job) {
					return job.Status;
				})),
				Cards: cards
			};
		});

		model.Status = this.Worst(model.Stages.map(function (stage) {
			return stage.Status;
		}));
		model.Seconds = Object.keys(all).reduce(function (sum, id) {
			return sum + (self.Seconds(all[id], now) || 0);
		}, 0);

		own.Running = running;

		this.Tick(running);
		this.Later();

		return model;
	},

	/* The card of a job. */
	Card: function (job, now) {
		var seconds = this.Seconds(job, now);
		var actions = Array.isArray(job.Actions) ? job.Actions : null;
		var action = this.Action(job.Status);

		return {
			Key: job.ID,
			ID: job.ID,
			Job: job,
			Name: job.Name || job.ID,
			Text: job.Text || '',
			Href: job.Href || '',
			Status: job.Status,
			Icon: this.Icons[job.Status],
			Time: seconds === null ? '' : this.Time(seconds),
			Actions: actions || (action ? [{ID: action, Icon: action === 'retry' ? 'refresh' : action === 'cancel' ? 'stop' : 'play', Default: true}] : []),
			Custom: this.Own().Contents[job.ID] || (job.Element || job.Render ? job : null),
			Label: (job.Name || job.ID) + ', ' + job.Status + (seconds === null ? '' : ', ' + this.Time(seconds))
		};
	},

	/* The clock of the running jobs: a second at a time while one runs. */
	Tick: function (running) {
		var self = this;
		var own = this.Own();

		if (running && !own.Timer) {
			own.Timer = window.setInterval(function () {
				self.Now = Date.now();
			}, 1000);
		}
		else if (!running && own.Timer) {
			window.clearInterval(own.Timer);

			own.Timer = 0;
		}
	},

	/* The links again on the next frame: the cards are where the page drew them. */
	Later: function () {
		var self = this;
		var own = this.Own();

		window.cancelAnimationFrame(own.Frame);

		own.Frame = window.requestAnimationFrame(function () {
			self.Draw();
		});
	},

	/* The mode of the links: the one asked, else needs when a job has some, else stages. */
	Mode: function (model) {
		if (this.Links === 'needs' || this.Links === 'stages' || this.Links === 'none') return this.Links;

		return model && model.Needs ? 'needs' : 'stages';
	},

	/* The card of a job in the page: its own, or the one of its group when the group is closed. */
	Place: function (id) {
		var element = this.$Element();
		var card = element.querySelector('.elemenx-pipeline-job[data-id="' + id + '"]');
		var model = this.Own().Last;
		var job = model && model.Jobs[id];
		if (card || !job || !job.Group) return card;

		return element.querySelector('.elemenx-pipeline-job[data-group="' + job.Group + '"][data-stage="' + job.Stage + '"]');
	},

	/* The lines of the links, in pixels of the board: from the right of a card to the left of the next. */
	Draw: function () {
		var self = this;
		var element = this.$Element();
		var board = element.querySelector('.elemenx-pipeline-board');
		var model = this.Own().Last;
		var mode;
		var origin;
		var lines = [];
		var columns;

		if (!board || !model) return;

		mode = this.Mode(model);
		origin = board.getBoundingClientRect();

		function box (node) {
			var rect = node.getBoundingClientRect();

			return {Left: rect.left - origin.left + board.scrollLeft, Right: rect.right - origin.left + board.scrollLeft, Middle: rect.top + rect.height / 2 - origin.top + board.scrollTop};
		}

		function curve (from, to, key, ids) {
			var bend = Math.max(16, (to.Left - from.Right) / 2);

			/* A job of its own stage (or of one before): round the left of the cards, from one to the other. */
			if (to.Left <= from.Right) {
				lines.push({Key: key, IDs: ids, Path: 'M ' + from.Left + ' ' + from.Middle + ' C ' + (from.Left - 28) + ' ' + from.Middle + ', ' + (to.Left - 28) + ' ' + to.Middle + ', ' + to.Left + ' ' + to.Middle});

				return;
			}

			lines.push({Key: key, IDs: ids, Path: 'M ' + from.Right + ' ' + from.Middle + ' C ' + (from.Right + bend) + ' ' + from.Middle + ', ' + (to.Left - bend) + ' ' + to.Middle + ', ' + to.Left + ' ' + to.Middle});
		}

		if (mode === 'needs') {
			/* One line for two cards: the jobs of a closed group are its card. */
			var drawn = {};

			Object.keys(model.Jobs).forEach(function (id) {
				var job = model.Jobs[id];
				var target = self.Place(id);

				job.Needs.forEach(function (need) {
					var source = self.Place(need);
					var key;

					if (!source || !target || source === target) return;

					key = (source.getAttribute('data-id') || source.getAttribute('data-group-key')) + '>' + (target.getAttribute('data-id') || target.getAttribute('data-group-key'));

					if (drawn[key]) {
						drawn[key].IDs.push(need, id);

						return;
					}

					curve(box(source), box(target), key, [need, id]);

					drawn[key] = lines[lines.length - 1];
				});
			});
		}
		else if (mode === 'stages') {
			columns = Array.prototype.map.call(element.querySelectorAll('.elemenx-pipeline-stage'), function (stage) {
				return Array.prototype.map.call(stage.querySelectorAll('.elemenx-pipeline-job:not(.inner)'), box);
			});

			/* From each card of a stage to a line between the two, and from it to each card of the next. */
			columns.forEach(function (cards, index) {
				var next = columns[index + 1];
				var middle;

				if (!next || !cards.length || !next.length) return;

				middle = (Math.max.apply(Math, cards.map(function (card) {
					return card.Right;
				})) + Math.min.apply(Math, next.map(function (card) {
					return card.Left;
				}))) / 2;

				cards.forEach(function (card, at) {
					curve(card, {Left: middle, Middle: next[0].Middle}, 'out:' + index + ':' + at, []);
				});

				next.forEach(function (card, at) {
					curve({Right: middle, Middle: cards[0].Middle}, card, 'in:' + index + ':' + at, []);
				});
			});
		}

		if (JSON.stringify(lines) !== JSON.stringify(this.Lines))
			this.Lines = lines;
	},

	/* The jobs a job needs and the ones that need it, all the way (the chain marked over a job). */
	Chain: function (id, model) {
		var found = {};
		var jobs = model ? model.Jobs : {};

		function up (key) {
			(jobs[key] ? jobs[key].Needs : []).forEach(function (need) {
				if (!found[need]) {
					found[need] = true;

					up(need);
				}
			});
		}

		function down (key) {
			Object.keys(jobs).forEach(function (other) {
				if (jobs[other].Needs.indexOf(key) !== -1 && !found[other]) {
					found[other] = true;

					down(other);
				}
			});
		}

		if (!id || !jobs[id]) return found;

		found[id] = true;

		up(id);

		down(id);

		return found;
	},

	/* The class of a card or a line while a job is under the pointer: marked in its chain, faded out of it. */
	Mark: function (ids, hovered, model) {
		var chain;

		if (!hovered) return '';

		chain = this.Chain(hovered, model);

		return ids.some(function (id) {
			return chain[id];
		}) ? 'related' : 'faded';
	},

	Entered: function (event) {
		var node = event.currentTarget;

		this.Hovered = node.getAttribute('data-id') || '';
	},

	Left: function () {
		this.Hovered = '';
	},

	/* A press on a card: a group opens or closes, a job is selected. */
	Pressed: function (event) {
		var node = event.currentTarget;
		var model = this.Own().Last;
		var group = node.getAttribute('data-group-key');
		var id = node.getAttribute('data-id');
		var opened;
		var job;

		if (event.target.closest('.elemenx-pipeline-action, a')) return;

		if (group) {
			opened = Object.assign({}, this.Opened);
			opened[group] = !opened[group];
			this.Opened = opened;

			return;
		}

		job = model && model.Jobs[id];

		if (!job) return;

		this.Selected = id;

		this.$Emit('select', {Job: job.Item, Stage: job.Stage});
	},

	Acted: function (event) {
		var node = event.currentTarget;
		var model = this.Own().Last;
		var job = model && model.Jobs[node.getAttribute('data-job')];

		event.stopPropagation();

		if (job)
			this.$Emit('action', {Action: node.getAttribute('data-action'), Job: job.Item});
	},

	/* The keys on a card: Enter or Space presses it, the arrows go to the job above, below, before or after. */
	Key: function (event) {
		var cards = Array.prototype.slice.call(this.$Element().querySelectorAll('.elemenx-pipeline-job'));
		var current = event.currentTarget;
		var index = cards.indexOf(current);
		var stage = current.closest('.elemenx-pipeline-stage');
		var stages = Array.prototype.slice.call(this.$Element().querySelectorAll('.elemenx-pipeline-stage'));
		var target = null;
		var row;
		var next;

		if (event.target !== current) return;

		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();

			this.Pressed(event);

			return;
		}

		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			target = cards[index + (event.key === 'ArrowDown' ? 1 : -1)];

			if (target && target.closest('.elemenx-pipeline-stage') !== stage)
				target = null;
		}
		else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
			next = stages[stages.indexOf(stage) + (event.key === 'ArrowRight' ? 1 : -1)];
			row = Array.prototype.indexOf.call(stage.querySelectorAll('.elemenx-pipeline-job'), current);

			if (next) {
				next = next.querySelectorAll('.elemenx-pipeline-job');
				target = next[Math.min(row, next.length - 1)] || null;
			}
		}
		else {
			return;
		}

		event.preventDefault();

		if (target)
			target.focus();
	}
});
