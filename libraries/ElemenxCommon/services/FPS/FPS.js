/*
 * FPS: how smoothly a page draws, for any page, with WebGL or without: the frames of the window are timed by
 * requestAnimationFrame while someone watches, and what draws may tell its own numbers of a frame.
 * - Watch(callback(stats), every) calls back every every ms (500 by default) while it is watched; returns {Stop()}.
 *   Nothing is timed while no one watches, nor where there is no page (Node, a worker): it calls back never there.
 * - Stats(): {FPS, Frame (the median time between frames, ms), P95, Max, Slow (frames over 25 ms), Long (over 50 ms),
 *   Frames (how many the window holds), Heap (MB of the memory of scripts, where the browser tells it: Chrome; else null),
 *   Sources: {source: {key: {Last, Mean, Max}}}}, of the last Window frames.
 * - History(): the times between the last frames, ms, the oldest first.
 * - Report(source, values): numbers of a frame of what draws ({Cpu, Gpu, Quiet...}); kept for the same window.
 * - Watching(): whether anyone watches, so that what draws counts only then.
 * - Name(base): a name of a source of its own, for each of many of a kind on a page (Scene, Scene 2...).
 * - Forget(source): what is gone tells no more: its numbers are left out of Stats.
 * The numbers are of the page: the instance of the service of each application reads and adds to the same ones.
 * - Window: how many frames the numbers are of (240).
 */
Elemenx.Service('FPS', {
	$Meta: {
		Description: 'How smoothly a page draws, with WebGL or without: frames per second, the times of frames and what draws tells of its own.',
		Methods: ['Watch(callback, every)', 'Stats()', 'History()', 'Report(source, values)', 'Watching()', 'Name(base)', 'Forget(source)']
	},

	Window: 240,

	/* One for the page: each application has an instance of the service of its own, and all of them share this. */
	Page: {},

	Watch: function (callback, every) {
		var self = this;
		var state = this.State();
		var watcher = {Callback: callback, Every: Number(every) > 0 ? Number(every) : 500, At: 0};

		state.Watchers.push(watcher);

		if (state.Watchers.length === 1)
			this.Begin();

		return {
			Stop: function () {
				state.Watchers = state.Watchers.filter(function (item) {
					return item !== watcher;
				});

				if (!state.Watchers.length)
					self.End();
			}
		};
	},

	Watching: function () {
		return this.State().Watchers.length > 0;
	},

	/* A name of a source of its own, for each of many of a kind on a page: Scene, Scene 2, Scene 3... */
	Name: function (base) {
		var state = this.State();
		var count = state.Names[base] = (state.Names[base] || 0) + 1;

		return count === 1 ? base : base + ' ' + count;
	},

	Forget: function (source) {
		delete this.State().Sources[source];
	},

	Report: function (source, values) {
		var state = this.State();
		var kept = state.Sources[source] = state.Sources[source] || {};
		var size = this.Window;

		if (!state.Watchers.length) return;

		Object.keys(values || {}).forEach(function (key) {
			var number = Number(values[key]);
			var list = kept[key] = kept[key] || [];

			if (!isFinite(number)) return;

			list.push(number);

			if (list.length > size)
				list.shift();
		});
	},

	History: function () {
		return this.State().Gaps.slice();
	},

	Stats: function () {
		var state = this.State();
		var gaps = state.Gaps;
		var sorted = gaps.slice().sort(function (a, b) {
			return a - b;
		});
		var total = gaps.reduce(function (sum, gap) {
			return sum + gap;
		}, 0);
		var sources = {};

		Object.keys(state.Sources).forEach(function (source) {
			sources[source] = {};

			Object.keys(state.Sources[source]).forEach(function (key) {
				var list = state.Sources[source][key];
				if (!list.length) return;

				sources[source][key] = {Last: list[list.length - 1], Mean: list.reduce(function (sum, value) {
					return sum + value;
				}, 0) / list.length, Max: Math.max.apply(Math, list)};
			});
		});

		return {
			FPS: total > 0 ? Math.round(gaps.length * 1000 / total) : 0,
			Frame: sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0,
			P95: sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] : 0,
			Max: sorted.length ? sorted[sorted.length - 1] : 0,
			Slow: gaps.filter(function (gap) {
				return gap > 25;
			}).length,
			Long: gaps.filter(function (gap) {
				return gap > 50;
			}).length,
			Frames: gaps.length,
			Heap: typeof performance !== 'undefined' && performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
			Sources: sources
		};
	},

	/* What is timed, once for the page. */
	State: function () {
		if (!this.Page.Timed)
			this.Page.Timed = {Watchers: [], Gaps: [], Sources: {}, Names: {}, Last: null, Handle: null};

		return this.Page.Timed;
	},

	Begin: function () {
		var self = this;
		var state = this.State();

		function tick (now) {
			if (!state.Watchers.length) return;

			state.Handle = requestAnimationFrame(tick);

			if (state.Last !== null) {
				state.Gaps.push(now - state.Last);

				if (state.Gaps.length > self.Window)
					state.Gaps.shift();
			}

			state.Last = now;

			state.Watchers.slice().forEach(function (watcher) {
				if (now - watcher.At < watcher.Every) return;

				watcher.At = now;

				watcher.Callback(self.Stats());
			});
		}

		/* No frames to time where there is no page (Node, a worker): the watchers wait in silence. */
		if (typeof requestAnimationFrame !== 'function') return;

		state.Last = null;
		state.Handle = requestAnimationFrame(tick);
	},

	End: function () {
		var state = this.State();
		if (state.Handle !== null)
			cancelAnimationFrame(state.Handle);

		state.Handle = null;
		state.Last = null;
		state.Gaps = [];
		state.Sources = {};
	}
});
