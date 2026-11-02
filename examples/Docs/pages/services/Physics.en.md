<!-- generated -->
# Physics

Physics: how things move, apart from what shows them. Nothing here knows a scene: a state goes in, with what is asked of it and how long a step is, and comes out moved. Steps are short and of one length, so a slow machine moves a thing as a fast one does.

- Steps(clock, elapsed, length, each): runs each(length) as many times as the time asks, keeping the rest in clock {Left}; returns how far into the next step the time has come, for Blend.
- Blend(from, to, part): a place between two, a number or a list.
- Spring(value, speed, target, stiffness, damping, elapsed): [value, speed] of a thing pulled to a target.
- Car(state, input, surface, settings, elapsed): input {Gas, Brake (and then back), Stop (all wheels, and it stays), Steer (-1 to 1, left over 0), Hand, Drift (the rear lets go while it is held)}; docs/VEHICLES.md says how all of it hangs together; surface(x, z) is {Height, Grip, Drag}. Settings: Mass, Power, Top, Brake, Base (from axle to axle), Width (between the wheels), Lock (the most the wheels turn, radians), Answer (how fast they turn, and the car after them), Keep (at what speed they have half their lock left), Turn (a table of how fast it turns at full steering: [[speed m/s, degrees a second], ...], instead of what Lock and Keep give; the ground still limits it, it needs Assist, and a drift goes by the tyres), Build ([at a standstill, at Top]: seconds the steering takes to reach full, so that a touch is a little turn; it comes back twice as fast), Bite (how far brakes go past the grip), Coast (what slows it off the gas, m/s²), Agility (how much harder than its grip alone it turns: above 1 a game has it sharper than a real car), Assist (0 a simulator: only the tyres turn it; 1 an arcade: it goes where the wheels point), Rear (the grip behind against the front), Slide (the grip behind that is left when it drifts), Angle (how far a drift may open, radians), Peak (the slip, radians, at which a tyre gives most), Grip, Downforce (how much grip the air adds at top speed, as a part of it), Ride (how soft the springs are), Travel (how far a wheel goes up or down), Balance (how high its weight lies), AntiRoll (the bars that hold it level in a turn, N m a radian). State: {X, Z, Heading, Forward, Aside, Rate, Steer, Y, Rise, Pitch, PitchSpeed, Roll, RollSpeed, Spin, Wheels, Strokes, Touching}. Force is what the engine gives at a speed, as far as the tyres that touch hold; air and the ground take it back. Each of the four wheels [front left, front right, rear left, rear right] is a weight of its own on a spring and a damper under the body, so it follows the road and the body rides over it, leaning as it speeds up, brakes and turns. Strokes is how far each spring has gone from rest, above 0 when the wheel hangs lower than it did.
- Hit(state, normal, depth, at, settings): a car at a wall: normal [x, z] looks out of the wall, depth is how far in it went, at [x, z] is the corner that met it, from its middle. It comes out, gives up its speed into the wall but for a bounce (Bounce, default 0.25), scrapes (Scrape, default 0.12), and turns round what it hit.
- Bounce(way, normal, depth, bounce): the same for a list [x, y, z]: returns the way after it.
- Ship(state, input, settings, elapsed): input {Yaw, Pitch, Roll, Throttle, Lift, Boost, Stop (all of it comes to rest)}. Settings: Top, Boost, Turn, Roll, Assist (how soon it gives up a way it no longer points). State: {At, Right, Up, Ahead, Way, Spin: [pitch, yaw, roll], Throttle}.

## Methods

- `Steps(clock, elapsed, length, each)`
- `Blend(from, to, part)`
- `Spring(value, speed, target, stiffness, damping, elapsed)`
- `Car(state, input, surface, settings, elapsed)`
- `Hit(state, normal, depth, at, settings)`
- `Bounce(way, normal, depth, bounce)`
- `Ship(state, input, settings, elapsed)`

## Tests

- [Physics runs steps of one length, whatever the frames are, and blends what shows](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L2931) — `tests/regression/library-scene.test.js`
- [Physics drives a car: slowed by grass, on its springs, leaning as it goes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L2970) — `tests/regression/library-scene.test.js`
- [Physics keeps the wheels on the road: each on a spring of its own, the body riding over them](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3055) — `tests/regression/library-scene.test.js`
- [Physics stops and turns a car as it is told: brakes, grip, downforce, steering](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3149) — `tests/regression/library-scene.test.js`
- [Physics turns a car by a table of its own, whatever the speed, and a touch of the key is a little turn](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3196) — `tests/regression/library-scene.test.js`
- [Physics holds a car level in a turn by its bars, and keeps all its wheels down](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3358) — `tests/regression/library-scene.test.js`
- [Physics turns a car as sharply as it is told, with no more lean for that](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3393) — `tests/regression/library-scene.test.js`
- [Physics is a simulator or an arcade by its numbers, and lets the tail go when it is asked](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3423) — `tests/regression/library-scene.test.js`
- [Physics takes a car off a wall: out of it, its way into it gone, turned round the corner that struck](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3539) — `tests/regression/library-scene.test.js`
- [Physics brings a ship to rest, all of it, and then it stays](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3570) — `tests/regression/library-scene.test.js`
- [Physics flies a ship: its speed comes after its throttle, its axes stay square](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3594) — `tests/regression/library-scene.test.js`
