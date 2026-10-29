/*
 * The scenarios of the bench (npm run bench): each makes its components in #mount, measures, and takes them away.
 * Bench.Run(name, callback) calls back {Name, Ms} — the median of its runs, each with the layout it causes (a read of
 * offsetHeight), as the page pays for it. Updates come in a loop of assignments, as a feed of data would make them.
 */
(function () {
	var mount = document.getElementById('mount');
	var count = 0;

	function unique (name) {
		count++;

		return name + count;
	}

	function rows (length) {
		var list = [];

		for (var i = 0; i < length; i++)
			list.push({ID: 'r' + i, Title: 'Row ' + i, Count: i, Done: i % 3 === 0});

		return list;
	}

	function median (values) {
		var sorted = values.slice().sort(function (a, b) {
			return a - b;
		});

		return sorted[Math.floor(sorted.length / 2)];
	}

	function layout () {
		return document.body.offsetHeight;
	}

	function make (template, state) {
		var component = Elemenx.Component(unique('Bench'), Object.assign({$Template: template}, state || {}))();

		mount.appendChild(component.$Element());

		layout();

		return component;
	}

	function clear (component) {
		component.$Destroy();

		mount.innerHTML = '';
	}

	/* A child of four bindings and eight props, as the components of a library have them. */
	Elemenx.Component('BenchItem', {
		$Template: '<div class="bench-item" [class.done]="Done"><strong>{{Title}}</strong> <span>{{Count}}</span> <em>{{Tick}}</em></div>',
		Title: '',
		Count: 0,
		Done: false,
		Tick: 0,
		Size: 'medium',
		Tone: 'accent',
		Label: '',
		Hint: ''
	});

	/* A child of a larger template of plain elements, two bindings in it: most of a page is markup. */
	Elemenx.Component('BenchCard', {
		$Template: '<article class="bench-card"><header class="bench-card-head"><div class="bench-card-avatar"><span class="bench-card-initials">AB</span></div><div class="bench-card-names"><h3 class="bench-card-title">{{Title}}</h3><p class="bench-card-sub">A card of the bench</p></div></header><section class="bench-card-body"><ul class="bench-card-list"><li><span class="bench-card-key">Owner</span><span class="bench-card-value">Ada</span></li><li><span class="bench-card-key">Team</span><span class="bench-card-value">Core</span></li><li><span class="bench-card-key">Place</span><span class="bench-card-value">London</span></li><li><span class="bench-card-key">Since</span><span class="bench-card-value">2024</span></li></ul><div class="bench-card-tags"><span class="bench-card-tag">One</span><span class="bench-card-tag">Two</span><span class="bench-card-tag">Three</span></div></section><footer class="bench-card-foot"><span class="bench-card-count">{{Count}}</span><small class="bench-card-note">Updated today</small></footer></article>',
		Title: '',
		Count: 0
	});

	var Scenarios = {
		/* 1000 rows of a list: an element each, its bindings and a handler. */
		'mount-list': function () {
			var times = [];
			var k;

			for (k = 0; k < 7; k++) {
				var start = performance.now();
				var component = make('<ul><li *for="row of Rows" *key="row.ID" [class.done]="row.Done" (click)="Toggle">{{row.Title}} <b>{{row.Count}}</b></li></ul>', {Rows: rows(1000), Toggle: function () {}});

				times.push(performance.now() - start);

				clear(component);
			}

			return median(times);
		},

		/* 300 rows, a Component each with its props. */
		'mount-components': function () {
			var times = [];
			var k;

			for (k = 0; k < 7; k++) {
				var start = performance.now();
				var component = make('<div><BenchItem *for="row of Rows" *key="row.ID" [title]="row.Title" [count]="row.Count" [done]="row.Done" Size="small" Tone="success" Label="Item" Hint="A row" /></div>', {Rows: rows(300)});

				times.push(performance.now() - start);

				clear(component);
			}

			return median(times);
		},

		/* 200 cards of a larger template of plain elements, a Component each. */
		'mount-cards': function () {
			var times = [];
			var k;

			for (k = 0; k < 7; k++) {
				var start = performance.now();
				var component = make('<div><BenchCard *for="row of Rows" *key="row.ID" [title]="row.Title" [count]="row.Count" /></div>', {Rows: rows(200)});

				times.push(performance.now() - start);

				clear(component);
			}

			return median(times);
		},

		/* 200 rows; one row changes (a new list, one new item), 100 times: the time of one change. */
		'update-one-row': function () {
			var component = make('<ul><li *for="row of Rows" *key="row.ID" [class.done]="row.Done">{{row.Title}} <b>{{row.Count}}</b></li></ul>', {Rows: rows(200)});
			var start = performance.now();
			var k;

			for (k = 0; k < 100; k++) {
				var next = component.Rows.slice();

				next[k % 200] = Object.assign({}, next[k % 200], {Count: k * 7});
				component.Rows = next;

				layout();
			}

			var time = (performance.now() - start) / 100;

			clear(component);

			return time;
		},

		/* 200 rows that read a value of their owner (the selected one): it changes, the rows stay, 100 times. */
		'update-outside-value': function () {
			var component = make('<ul><li *for="row of Rows" *key="row.ID" [class.selected]="row.ID === Selected">{{row.Title}}</li></ul>', {Rows: rows(200), Selected: ''});
			var start = performance.now();
			var k;

			for (k = 0; k < 100; k++) {
				component.Selected = 'r' + k;

				layout();
			}

			var time = (performance.now() - start) / 100;

			clear(component);

			return time;
		},

		/* 100 Components of eight props each; one prop of all of them changes, 100 times. */
		'update-one-prop': function () {
			var component = make('<div><BenchItem *for="row of Rows" *key="row.ID" [title]="row.Title" [count]="row.Count" [done]="row.Done" [tick]="Tick" Size="small" Tone="success" Label="Item" Hint="A row" /></div>', {Rows: rows(100), Tick: 0});
			var start = performance.now();
			var k;

			for (k = 0; k < 100; k++) {
				component.Tick = k + 1;

				layout();
			}

			var time = (performance.now() - start) / 100;

			clear(component);

			return time;
		},

		/* A value of one Component of many, as a field of a form: 100 inputs, one changes, 100 times. */
		'update-one-field': function () {
			var fields = {};
			var list = rows(100);
			var component;
			var start;
			var k;

			list.forEach(function (row) {
				fields[row.ID] = row.Title;
			});

			component = make('<form><label *for="row of Rows" *key="row.ID">{{row.Title}} <input [value]="Fields[row.ID]" /></label></form>', {Rows: list, Fields: fields});
			start = performance.now();

			for (k = 0; k < 100; k++) {
				var next = Object.assign({}, component.Fields);

				next['r' + (k % 100)] = 'Value ' + k;
				component.Fields = next;

				layout();
			}

			var time = (performance.now() - start) / 100;

			clear(component);

			return time;
		}
	};

	/* 60 Meters of ElemenxUI (an Application with the Library) whose values all change together, 100 times: a board of telemetry. */
	Scenarios['update-meters'] = function () {
		var root = unique('BenchMeters');
		var values = {};
		var board = null;
		var k;

		for (k = 0; k < 60; k++) values['m' + k] = k;

		Elemenx.Component(root, {
			$Template: '<div><Meter *for="id of Ids" *key="id" [value]="Values[id]" Min="0" Max="200" [label]="id" Unit="%" ShowValue="true" Size="small" /></div>',
			Ids: Object.keys(values),
			Values: values,
			$OnCreate: function () {
				board = this;
			}
		});

		return new Promise(function (resolve) {
			var application = Elemenx.Application(unique('BenchApplication'), {$Component: root, $Mount: '#mount', $Use: ['ElemenxUI']});

			(function wait () {
				if (!board || document.querySelectorAll('#mount .elemenx-meter').length < 60) {
					setTimeout(wait, 20);

					return;
				}

				var start = performance.now();
				var j;

				for (j = 0; j < 100; j++) {
					var next = {};

					for (var key in values) next[key] = (values[key] + j * 3) % 200;

					board.Values = next;

					layout();
				}

				var time = (performance.now() - start) / 100;

				application.$Destroy();

				mount.innerHTML = '';

				resolve(time);
			})();
		});
	};

	window.Bench = {
		Names: Object.keys(Scenarios),
		Run: function (name) {
			return Promise.resolve(Scenarios[name]()).then(function (ms) {
				return {Name: name, Ms: Math.round(ms * 100) / 100};
			});
		}
	};
})();
