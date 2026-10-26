/*
 * The loop of a game: its world updated in steps of the same time whatever the speed of the screen, drawn once a
 * frame. Create({Step, Update, Render, Speed, MaxSteps, Window}) returns a loop:
 * - Update(step, loop) is called for every Step of the time of the game (1000 / 60 ms by default), Render(alpha,
 *   loop) once a frame, alpha (0 to 1) the part of a step past the last Update, to draw between two states;
 * - Start(), Stop(), Pause(), Resume(), Advance(elapsed) (time given by hand: a test, a loop of your own; returns the
 *   number of steps run), Running, Paused, Time (the time of the game, ms), Ticks (the steps run), Fps;
 * - Speed (1: real time; 2: twice as fast) and MaxSteps (5: the most steps a frame catches up; a tab back from the
 *   background does not run its lost minutes).
 */
Elemenx.Service('GameLoop', {
	$Meta: {
		Description: 'The loop of a game: updates in steps of the same time, drawn once a frame.',
		Methods: ['Create(options)']
	},

	Create: function (options) {
		var settings = options || {};
		var view = settings.Window || window;
		var frame = typeof view.requestAnimationFrame === 'function' ? function (callback) {
			return view.requestAnimationFrame(callback);
		} : function (callback) {
			return view.setTimeout(function () {
				callback(Date.now());
			}, 16);
		};
		var cancel = typeof view.cancelAnimationFrame === 'function' ? function (handle) {
			view.cancelAnimationFrame(handle);
		} : function (handle) {
			view.clearTimeout(handle);
		};
		var accumulated = 0;
		var last = null;
		var handle = null;
		var frames = 0;
		var counted = null;
		var loop;

		function tick (now) {
			handle = frame(tick);

			if (last !== null)
				loop.Advance(now - last);

			last = now;
			frames++;

			if (counted === null)
				counted = now;

			if (now - counted >= 1000) {
				loop.Fps = Math.round(frames * 1000 / (now - counted));
				frames = 0;
				counted = now;
			}
		}

		loop = {
			Step: Number(settings.Step) > 0 ? Number(settings.Step) : 1000 / 60,
			Speed: settings.Speed === undefined ? 1 : Number(settings.Speed),
			MaxSteps: Number(settings.MaxSteps) > 0 ? Number(settings.MaxSteps) : 5,
			Update: settings.Update || null,
			Render: settings.Render || null,
			Running: false,
			Paused: false,
			Time: 0,
			Ticks: 0,
			Fps: 0,
			Start: function () {
				if (this.Running) return;

				this.Running = true;
				last = null;
				counted = null;
				frames = 0;
				handle = frame(tick);
			},
			Stop: function () {
				this.Running = false;

				if (handle !== null)
					cancel(handle);

				handle = null;
				last = null;
				accumulated = 0;
			},
			Pause: function () {
				this.Paused = true;
			},
			Resume: function () {
				this.Paused = false;
				last = null;
			},
			Advance: function (elapsed) {
				var steps = 0;

				if (!this.Paused) {
					accumulated += Math.max(0, Number(elapsed) || 0) * this.Speed;

					while (accumulated >= this.Step) {
						if (steps >= this.MaxSteps) {
							accumulated = 0;

							break;
						}

						accumulated -= this.Step;
						this.Time += this.Step;
						this.Ticks++;
						steps++;

						if (typeof this.Update === 'function')
							this.Update(this.Step, this);
					}
				}

				if (typeof this.Render === 'function')
					this.Render(accumulated / this.Step, this);

				return steps;
			}
		};

		return loop;
	}
});
