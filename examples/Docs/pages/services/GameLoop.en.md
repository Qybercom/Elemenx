<!-- generated -->
# GameLoop

The loop of a game: its world updated in steps of the same time whatever the speed of the screen, drawn once a frame. Create({Step, Update, Render, Speed, MaxSteps, Window}) returns a loop:

- Update(step, loop) is called for every Step of the time of the game (1000 / 60 ms by default), Render(alpha, loop) once a frame, alpha (0 to 1) the part of a step past the last Update, to draw between two states;
- Start(), Stop(), Pause(), Resume(), Advance(elapsed) (time given by hand: a test, a loop of your own; returns the number of steps run), Running, Paused, Time (the time of the game, ms), Ticks (the steps run), Fps;
- Speed (1: real time; 2: twice as fast) and MaxSteps (5: the most steps a frame catches up; a tab back from the background does not run its lost minutes).

## Methods

- `Create(options)`
