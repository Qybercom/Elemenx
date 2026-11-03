# How a car drives

The service `Physics` knows nothing of a scene: `Physics.Car(state, input, surface, settings, elapsed)` takes a state and gives it back moved, 120 times a second. All a car is lies in `Vehicle` of its object, so the same model is a simulator or an arcade by its numbers alone.

## What depends on what

| Setting | Default | What it does | More of it |
| --- | --- | --- | --- |
| `Power` | 520000 | Force at a speed: power / speed / mass | Harder acceleration |
| `Top` | 92 | Top speed, m/s: air drag is set from it and `Power` | |
| `Mass` | 1500 | Divides the force of the engine, weighs on the springs | Slower to speed up, softer on its springs |
| `Brake` | 11 | Deceleration of the brakes, m/s² | Limited by `Grip` |
| `Bite` | 1 | How far brakes go past `Grip` | Above 1 stops shorter than the tyres could |
| `Coast` | 1.5 | What slows it off the gas: engine and rolling, m/s² | A short touch of gas ends sooner |
| `Grip` | 1.15 | What the tyres hold, in g | Everything: brakes, cornering, traction |
| `Downforce` | 0 | Share of `Grip` the air adds at `Top` | Better at speed, nothing at a walk |
| `Rear` | 1.1 | Rear grip against the front | Below 1 the tail steps out (oversteer), above it the nose washes out (understeer) |
| `Peak` | 0.14 | Slip angle, radians, where a tyre gives most | Higher is softer and more forgiving |
| `Base`, `Width` | 2.7, 1.6 | Axle to axle, side to side | A short car turns quicker |
| `Lock` | 0.55 | Most angle of the wheels, radians | Tighter at low speed |
| `Keep` | 51 | Speed, m/s, at which half the lock is left | Steers more at speed |
| `Turn` | none | Table `[[speed m/s, degrees a second], ...]`: how fast it turns at full steering. Takes the place of what `Lock` and `Keep` give to `Assist`, and of the limit of `Grip` and `Agility`; the grip of the ground still lowers it, and a drift goes by the tyres | The same car at every speed, as you ask |
| `Build` | none | `[at a standstill, at Top]`: seconds for the steering to reach full; back to the middle is twice as fast | A touch of the key is a small turn |
| `Answer` | 9 | How fast the wheels turn and the body follows, per second | Quicker turn-in |
| `Agility` | 1 | How far the turn may go past what grip allows; also shortens the body for the tyres | Above 1 is sharper than a real car |
| `Assist` | 0.6 | 0: only the tyres turn it. 1: it goes where the wheels point | Easier, with less sliding |
| `Slide` | 0.45 | Share of the rear grip left while `Drift` is held | Lower breaks away sooner |
| `Angle` | 0.7 | Widest a drift opens, radians | A longer slide before it comes back |
| `Ride`, `AntiRoll`, `Balance`, `Travel` | 1, 150000, 0.42, 0.1 | Soft springs, bars, height of the weight, way of a wheel | How much it leans |

## From a simulator to an arcade

- **Simulator:** `Assist: 0, Agility: 1`. Only tyres act: lift or brake in a corner and the weight moves, too much gas and the tail goes.
- **Sport:** `Assist: 0.6, Agility: 1.5`.
- **Arcade:** `Assist: 0.85, Agility: 3`, and `Keep` high so that it still steers at speed, or a `Turn` table: `[[14, 55], [28, 60], [56, 70], [83, 75]]`. With `Assist: 0` the table does nothing: only the tyres turn the car.

## A drift

`input.Drift` lets the rear go without braking: the rear keeps `Slide` of its grip and `Assist` stops helping. It is an input of the physics, so a game binds it as it likes. In a scene it is held on Shift. Ctrl is not used, because a browser takes Ctrl+W to close the tab. `state.Slip` is the angle the car goes at to where it points, for sounds, smoke and scores.

## A gearbox

With `Gears` a car has a gearbox: each number is the part of `Top` that gear reaches at `Redline` (`[0.3, 0.45, 0.58, 0.7, 0.81, 0.91, 1]` for seven). The engine gives most at four fifths of the red line and less round it, nothing while it changes gear (`ShiftTime`, 0.22 s) and nothing past the red line in that gear. `Shift: 'auto'` changes up at 93% of a gear and down below 42%, and goes into reverse when the car stands and is asked back; `Shift: 'manual'` changes on `ShiftUp` and `ShiftDown` of the input (E and Q in a scene), down past first to neutral, where the gas only revs the engine, and then reverse. The state keeps `Gear` (-1 reverse, 0 neutral), `Rpm`, `Shifting` (seconds left) and `Shifted` (1 up, -1 down) for a dashboard, a lever, paddles and sounds. Without `Gears` the engine gives its power at any speed, as before.

## Lights and a wet road

`Lamps` are the lights of a car. Each names its glass as an opening does (`Match`, a box, `Both` for a pair): the glass glows when the lamp is lit and the light comes from its middle, or from `At`. `head` throws a spot ahead while the lights are on (L; by default on at dusk, at night, in rain and fog), `rear` glows dim with them and bright as the car brakes, `brake` only as it brakes, `reverse` in reverse, `indicator` blinks on the side Z or X shows and goes off once the wheel has turned and come back; Z and X together are the hazard lights. The state is in `Signals` {Lights, Indicate, Hazard, Wipers} of the car, for a dashboard and its stalk. A wet road holds `WetGrip` of its grip (0.75 where it is wet through), as the weather wets it and dries it.

## Mirrors and screens

A car carries `Mirrors` and `Screens`: panes in its model, each `{At, Normal, Up, Width, Height}`, `Normal` the way it faces. A mirror shows the world reflected by its plane, a picture a quarter of the view, made again every `Every` frames (2). A screen shows an element of the page: put it in the `screens` slot of the scene with `data-screen` the screen's `Source`; it is drawn as it is styled, every `Every` seconds (0.15), into `Pixels` [width, height], so a dashboard is made of the components and bindings of the page. Only the panes of the car that is driven are drawn: those of the others are too small to see and too dear to make.

## Doors and hatches

A door is an opening on a `Hinge`: a point of the model and an `Axis` through it, `Angle` degrees as far as it goes. `Both: true` makes the pair, the other side turning the other way; what the door carries (its glass, its mirror) follows it with `Follow` and `Both`, each half with its own door. Where the file has no door of its own, `Low` and `High` cut it out of the body by its triangles: the cut follows the triangles, so its edge is as fine as the mesh. An ordinary door turns round an upright at its front edge, a scissor door round the axle across the car at its front, a butterfly door round the line of the pillar. A ship opens its hatches the same way. `OpenPart(id, 'doors', 1)` opens them by degrees.

## Order of a step

1. The wheels come round to the steering by `Answer`, or in the time `Build` says, less the faster it goes (`Keep`).
2. The engine (through its gearbox, if it has `Gears`) or the brakes give a force, as far as `Grip` holds.
3. Each axle gives a sideways force by its slip (`Tyre`, `Peak`), the rear less by what the engine takes and by `Slide`.
4. Those forces change the sideways speed and the turn; `Assist` pulls them to what the wheels ask.
5. Below 4 m/s nothing slips.
6. The body rides on four springs, leaning by what the tyres gave.
