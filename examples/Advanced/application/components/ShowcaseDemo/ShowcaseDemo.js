/*
 * ShowcaseDemo (Graphics): Scene · SceneShowcase: every primitive of the generation in one world of three kilometres,
 * district by district; Benchmark tours them all and measures each
 */
Elemenx.Component('ShowcaseDemo', {
	$TemplateURL: 'ShowcaseDemo.html',
	$Traits: ['SceneDemo'],
	ShowColumns: [{Key: 'District', Title: 'District'}, {Key: 'Arrival', Title: 'Arrival', Align: 'end'}, {Key: 'Fps', Title: 'Frames a second', Align: 'end'}, {Key: 'Slowest', Title: 'Slowest frame, ms', Align: 'end'}, {Key: 'Cpu', Title: 'CPU a frame, ms', Align: 'end'}, {Key: 'Draws', Title: 'Draws a frame', Align: 'end'}, {Key: 'Triangles', Title: 'Triangles a frame', Align: 'end'}],
	ShowResults: [],
	/*
	 * The showcase world (SceneShowcase): every primitive of the generation, district by district. It is made once the scene
	 * is ready, and timed until the ground is sown; a district picked flies there; the benchmark goes to each one in turn,
	 * lets it settle and measures its frames (their rate, the slowest of them) and what a frame draws.
	 */
	ShowReady: function (scene) {
		var self = this;
		var world = this.$Service('SceneShowcase').World();
		var start = performance.now();
		var steady = 0;
		var told = 0;
		var ground = '';

		this.ShowScene = function () {
			return scene;
		};

		/* What the cache keeps, every few seconds while the scene is there. */
		var telling = window.setInterval(function () {
			if (!scene.$Element().isConnected) {
				window.clearInterval(telling);

				return;
			}

			self.ShowCacheTold();
		}, 4000);

		this.ShowWorld = world;
		this.ShowDistricts = world.Districts.map(function (district) {
			return {Value: district.ID, Label: district.Name};
		});
		this.ShowDistrict = world.Districts[0] ? world.Districts[0].ID : '';
		this.ShowShows = world.Districts[0] ? world.Districts[0].Shows : [];

		scene.Add(world.Objects);

		this.ShowFly(this.ShowDistrict);

		/*
		 * Made: the ground at once, then all it grows, a few squares a frame (the nearest first): how far it is told twice a
		 * second, and the time of all of it once nothing waits, ten frames in a row.
		 */
		(function wait () {
			var sown = scene.$Element().isConnected && scene.Sown ? scene.Sown() : null;
			var seconds = ((performance.now() - start) / 1000).toFixed(1);

			if (!sown) return;

			steady = sown.Waiting || !sown.Things ? 0 : steady + 1;
			ground = ground || (scene.Scene().Ground ? seconds : '');

			if (steady < 10) {
				if (performance.now() - told > 500) {
					told = performance.now();
					self.ShowMade = 'Ground in ' + (ground || seconds) + ' s; sowing: ' + sown.Squares + ' of ' + (sown.Squares + sown.Waiting) + ' squares, ' + sown.Things + ' things';
				}

				window.requestAnimationFrame(wait);

				return;
			}

			self.ShowMade = 'Ground in ' + ground + ' s, all of it in ' + seconds + ' s: ' + scene.Scene().Order.length + ' objects, ' + sown.Things + ' things sown';
		})();
	},
	/* A district picked: the view flies over it, its primitives named. */
	ShowFly: function (id) {
		var scene = this.ShowScene ? this.ShowScene() : null;
		var stop = this.ShowWorld ? this.ShowWorld.Route.filter(function (each) {
			return each.ID === id;
		})[0] : null;
		var district = stop ? this.ShowWorld.Districts.filter(function (each) {
			return each.ID === id;
		})[0] : null;
		var field;

		if (!scene || !stop) return;

		field = scene.Scene().Ground && scene.Scene().Ground.Field;

		this.ShowDistrict = id;
		this.ShowShows = district.Shows;

		scene.SetViewpoint({Target: [stop.Target[0], field ? Math.max(0, field.Height(stop.Target[0], stop.Target[2])) : 0, stop.Target[2]], Yaw: stop.Yaw, Pitch: stop.Pitch, Distance: stop.Distance});
	},
	ShowShows: [],
	ShowDistrict: '',
	ShowWorld: null,
	ShowMade: '',
	ShowDistricts: [],
	/*
	 * The benchmark: each district in turn, two seconds to settle and three measured: the frames the scene drew a second
	 * (Scene.Drawn: not the frames of the browser, a slow frame rests through some), the slowest time between two of them
	 * (of a hundred, the one past 99), the CPU of a frame, its draws and its triangles. The last row is all of them.
	 */
	/* How much the browser keeps of what the scene made (SceneCache), told by the side of the button that clears it. */
	ShowCacheTold: function () {
		var self = this;

		this.$Service('SceneCache').Usage(function (error, usage) {
			self.ShowCacheUsed = error ? '' : 'Kept: ' + (usage.Bytes / 1048576).toFixed(1) + ' MB in ' + usage.Entries + ' entries';
		});
	},
	ShowCacheUsed: '',
	ShowCacheClear: function () {
		var self = this;

		this.$Service('SceneCache').Clear(null, function () {
			self.ShowCacheTold();
		});
	},
	ShowCacheSize: 200,
	ShowCacheSizes: [{Value: 0, Label: 'No cache'}, {Value: 50, Label: '50 MB'}, {Value: 200, Label: '200 MB'}, {Value: 1000, Label: '1 GB'}],
	ShowProxies: true,
	/* What the Showcase shows of the levels of detail: their colors (Levels, Ctrl+Shift+L in any scene), the proxies of far tiles, the cache of the browser. */
	ShowLevels: false,
	ShowBench: function () {
		var self = this;
		var scene = this.ShowScene ? this.ShowScene() : null;
		var stops = this.ShowWorld ? this.ShowWorld.Route.slice() : [];
		var rows = [];
		var whole = {Frames: 0, Seconds: 0, Cpu: 0, Draws: 0, Triangles: 0, Gaps: []};

		if (!scene || this.ShowRunning) return;

		this.ShowRunning = true;
		this.ShowResults = [];

		function row (id, name, measured) {
			var frames = Math.max(1, measured.Frames);
			var sorted = measured.Gaps.slice().sort(function (a, b) {
				return a - b;
			});

			return {ID: id, District: name, Arrival: measured.Arrival === undefined ? '' : (measured.Arrival / 1000).toFixed(1) + ' s', Fps: Math.round(measured.Frames / Math.max(0.001, measured.Seconds) * 10) / 10, Slowest: Math.round(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.99))] || 0), Cpu: Math.round(measured.Cpu / frames * 10) / 10, Draws: Math.round(measured.Draws / frames), Triangles: Math.round(measured.Triangles / frames / 1000) + ' k'};
		}

		function next () {
			var stop = stops.shift();

			if (!stop || !scene.$Element().isConnected) {
				rows.push(row('all', 'All', whole));

				self.ShowResults = rows;
				self.ShowRunning = false;
				self.ShowNote = 'Benchmark done at ' + (self.SceneQuality === 'auto' ? 'the quality chosen by itself' : 'the quality ' + self.SceneQuality);

				return;
			}

			self.ShowFly(stop.ID);

			self.ShowNote = 'Benchmark: ' + stop.Name;

			/*
			 * Arrived: the frames of the scene stopped getting faster (its ground made, what it sows and its models of the
			 * district made, two seconds in a row no faster than the one before; at most 20 s). How long that took is a number
			 * of its own (Arrival); the frames are measured after it.
			 */
			var flown = performance.now();
			var windows = [];
			var mark = scene.Drawn();

			(function arrived () {
				var now = scene.Drawn();
				var rate = now.Frames - mark.Frames;
				var count = windows.length;

				mark = now;

				windows.push(rate);

				if (performance.now() - flown < 20000 && (count < 2 || windows[count] > windows[count - 1] * 1.05 + 1 || windows[count - 1] > windows[count - 2] * 1.05 + 1)) {
					window.setTimeout(arrived, 1000);

					return;
				}

				measure(performance.now() - flown);
			})();

			function measure (arrival) {
				var first = scene.Drawn();
				var last = first;
				var gaps = [];

				(function frame () {
					var now = scene.Drawn();
					var measured;

					/* A frame drawn since the last look: the time from the one before it. */
					if (now.Frames > last.Frames && last.At)
						gaps.push((now.At - last.At) / (now.Frames - last.Frames));

					last = now;

					if (now.At - first.At < 3000 && performance.now() - first.At < 6000 && scene.$Element().isConnected) {
						window.requestAnimationFrame(frame);

						return;
					}

					measured = {Arrival: arrival, Frames: now.Frames - first.Frames, Seconds: (now.At - first.At) / 1000, Cpu: now.Cpu - first.Cpu, Draws: now.Draws - first.Draws, Triangles: now.Triangles - first.Triangles, Gaps: gaps};

					['Frames', 'Seconds', 'Cpu', 'Draws', 'Triangles'].forEach(function (key) {
						whole[key] += measured[key];
					});

					whole.Gaps = whole.Gaps.concat(gaps);

					rows.push(row(stop.ID, stop.Name, measured));

					self.ShowResults = rows.slice();

					next();
				})();
			}
		}

		next();
	},
	ShowNote: '',
	ShowRunning: false
});
