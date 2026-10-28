<!-- generated -->
# GameLoop

The loop of a game: its world updated in steps of the same time whatever the speed of the screen, drawn once a frame. Create({Step, Update, Render, Speed, MaxSteps, Window}) returns a loop:

- Update(step, loop) is called for every Step of the time of the game (1000 / 60 ms by default), Render(alpha, loop) once a frame, alpha (0 to 1) the part of a step past the last Update, to draw between two states;
- Start(), Stop(), Pause(), Resume(), Advance(elapsed) (time given by hand: a test, a loop of your own; returns the number of steps run), Running, Paused, Time (the time of the game, ms), Ticks (the steps run), Fps;
- Speed (1: real time; 2: twice as fast) and MaxSteps (5: the most steps a frame catches up; a tab back from the background does not run its lost minutes).

## Methods

- `Create(options)`

## Example

```example
<div style="position: relative; height: 80px; border: 1px solid var(--elemenx-border); border-radius: 8px; overflow: hidden;">
	<div #Ball style="position: absolute; top: 28px; left: 0; width: 24px; height: 24px; border-radius: 50%; background: var(--elemenx-accent);"></div>
</div>
<Button [label]="Running ? 'Pause' : 'Play'" (click)="Toggle" />
<RadioGroup Variant="segmented" Label="Speed" [options]="Speeds" [value]="Speed" (change)="Sped" />
<p class="elemenx-text small muted">{{Ticks}} steps of 1/60 s, drawn at {{Fps}} frames a second.</p>
<script>
({
	Running: true,
	Speed: 1,
	Speeds: [{Value: 0.5, Label: '×0.5'}, {Value: 1, Label: '×1'}, {Value: 2, Label: '×2'}],
	Ticks: 0,
	Fps: 0,

	$OnCreate: function () {
		var self = this;
		var x = 0;
		var previous = 0;
		var speed = 120;
		var frames = 0;
		/* The loop stays out of the state: it runs on its own, the template shows what it reports. */
		var loop = this.$Service('GameLoop').Create({
			/* The world: the same steps of time whatever the screen. */
			Update: function (step) {
				previous = x;
				x += speed * step / 1000;

				if (x > 400 || x < 0) speed = -speed;
			},

			/* The picture: between the last two states, once a frame. */
			Render: function (alpha, current) {
				var ball = self.$Ref('Ball');

				if (ball) ball.style.transform = 'translateX(' + (previous + (x - previous) * alpha) + 'px)';

				frames++;

				if (frames % 30 === 0) {
					self.Ticks = current.Ticks;
					self.Fps = Math.round(current.Fps);
				}
			}
		});

		/* The loop for the methods: a function, so the loop is not state. */
		this.Loop = function () {
			return loop;
		};

		loop.Start();
	},

	$OnDestroy: function () {
		this.Loop().Stop();
	},

	Toggle: function () {
		this.Running = !this.Running;

		if (this.Running) this.Loop().Resume();
		else this.Loop().Pause();
	},

	Sped: function (value) {
		this.Speed = value;
		this.Loop().Speed = value;
	}
})
</script>
```

## Tests

- [Random: the same numbers for the same seed, its helpers in their bounds, a fork of its own, a smooth noise](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-services.test.js#L27) — `tests/regression/game-services.test.js`
- [Spatial: the things in a rectangle, within a radius the nearest first, the nearest one, as they move and go](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-services.test.js#L67) — `tests/regression/game-services.test.js`
- [Pathfinding: a way round the walls, no corner cut, around costly cells, to the nearest reachable cell, on a graph of its own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-services.test.js#L104) — `tests/regression/game-services.test.js`
- [Visibility: a line, the sight past a wall, the field of view and its shadows, the fog of war](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-services.test.js#L181) — `tests/regression/game-services.test.js`
- [GameLoop: steps of the same time whatever the frames, a part of a step to draw between, its speed, pause and catch-up limit](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-services.test.js#L228) — `tests/regression/game-services.test.js`
