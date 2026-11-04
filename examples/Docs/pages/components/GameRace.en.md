<!-- generated -->
# GameRace

A race on a road of a Scene, declared inside it: <Scene> ... <GameRace Road="track" Laps="3" /> </Scene> (the trait SceneBehaviour). The racers (Racers: the IDs of the vehicles, a list or text with commas; empty: the one under the keys) go round a closed road (Road: its ID; empty: the first closed one), a lap counted as a racer crosses its start line (the mark start of the road, else its first point) having passed its checkpoints (Checkpoints: how many, evenly round it, 3), so a short way back over the line counts nothing. Countdown (seconds, 3) counts down before it starts; Start() starts it again from the countdown, Stop() ends it.

Events: countdown ({Seconds}), start, checkpoint ({ID, Lap, Index}), lap ({ID, Lap, Time, Best}: the lap done and its seconds), position ({ID, Position}: a racer passed another), wrong ({ID, Wrong}: it goes the wrong way, or again the right way), finish ({ID, Position, Time, Best}), end (all of them finished). Standings() gives the racers in their order: [{ID, Position, Lap, Progress (metres from the start of the race), Time, Last, Best, Finished, Wrong}].

## Properties

| Property | Default |
| --- | --- |
| `Road` | `''` |
| `Laps` | `3` |
| `Racers` | `''` |
| `Checkpoints` | `3` |
| `Countdown` | `3` |

## Events

- `countdown`: A second of the countdown before the start: {Seconds}.
- `start`: The race started.
- `wrong`: A racer goes the wrong way, or the right way again: {ID, Wrong}.
- `checkpoint`: A racer passed a checkpoint: {ID, Lap, Index}.
- `lap`: A racer finished a lap: {ID, Lap, Time, Best}.
- `finish`: A racer finished: {ID, Position, Time, Best}.
- `end`: All the racers finished.
- `position`: A racer came to another position: {ID, Position}.

## Methods

- `Start()`
- `Stop()`
- `Standings()`

## Tests

- [counts down, counts the laps of each racer through its checkpoints, their times and best, finishes and ends](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-race.test.js#L100) — `tests/regression/library-game-race.test.js`
- [counts no lap of a racer that goes back over the line, and tells the wrong way and the right way again](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-race.test.js#L157) — `tests/regression/library-game-race.test.js`
