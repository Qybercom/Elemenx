/*
 * Physics: how things move, apart from what shows them. Nothing here knows a scene: a state goes in, with what is asked of it and
 * how long a step is, and comes out moved. Steps are short and of one length, so a slow machine moves a thing as a fast one does.
 *
 * - Steps(clock, elapsed, length, each): runs each(length) as many times as the time asks, keeping the rest in clock {Left}; returns
 *   how far into the next step the time has come, for Blend.
 * - Blend(from, to, part): a place between two, a number or a list.
 * - Spring(value, speed, target, stiffness, damping, elapsed): [value, speed] of a thing pulled to a target.
 * - Car(state, input, surface, settings, elapsed): input {Gas, Brake (and then back; true, or 0 to 1 as far as a trigger is pressed), Stop (all wheels, and it stays), Steer (-1 to 1, left
 *   over 0), Hand, Drift (the rear lets go while it is held)}; docs/VEHICLES.md says how all of it hangs together; surface(x, z) is {Height, Grip, Drag}. Settings: Mass, Power, Top, Brake, Base (from axle to axle), Width (between the
 *   wheels), Lock (the most the wheels turn, radians), Answer (how fast they turn, and the car after them), Keep (at what speed they have
 *   half their lock left), Turn (a table of how fast it turns at full steering: [[speed m/s, degrees a second], ...], instead of what Lock and Keep
 *   give; the ground still limits it, it needs Assist, and a drift goes by the tyres), Build ([at a standstill, at Top]: seconds the steering takes to reach full, so that a touch is a little
 *   turn; it comes back twice as fast), Bite (how far brakes go past the grip), Coast (what slows it off the gas, m/s²), Agility (how much harder than its grip alone it turns: above 1 a game has it sharper than a real car), Assist
 *   (0 a simulator: only the tyres turn it; 1 an arcade: it goes where the wheels point), Rear (the grip behind against the front), Slide
 *   (the grip behind that is left when it drifts), Angle (how far a drift may open, radians), Peak (the slip, radians, at which a tyre gives most), Grip, Downforce (how much grip the air adds at top speed, as a part of it), Ride (how soft the springs are),
 *   Travel (how far a wheel goes up or down), Balance (how high its weight lies), AntiRoll (the bars that hold it level in a turn, N m a
 *   radian), Gears with Shift, ShiftTime, Redline and Idle (a gearbox: Gearbox; with none, the engine gives its power at any speed). State: {X, Z, Heading, Forward, Aside, Rate, Steer, Y, Rise, Pitch, PitchSpeed, Roll, RollSpeed,
 *   Spin, Wheels, Strokes, Touching}. Force is what the engine gives at a speed, as far as the tyres that touch hold; air and the ground
 *   take it back. Each of the four wheels [front left, front right, rear left, rear right] is a weight of its own on a spring and a
 *   damper under the body, so it follows the road and the body rides over it, leaning as it speeds up, brakes and turns. Strokes is how
 *   far each spring has gone from rest, above 0 when the wheel hangs lower than it did.
 * - Gearbox(state, input, settings, gas, braking, speed, elapsed): the gears of a car (Car runs it when it has Gears): Gear, Rpm,
 *   Shifting, Shifted in the state; returns how much of its power the engine gives now.
 * - Hit(state, normal, depth, at, settings): a car at a wall: normal [x, z] looks out of the wall, depth is how far in it went, at [x, z] is
 *   the corner that met it, from its middle. It comes out, gives up its speed into the wall but for a bounce (Bounce, default 0.25),
 *   scrapes (Scrape, default 0.12), and turns round what it hit.
 * - Bounce(way, normal, depth, bounce): the same for a list [x, y, z]: returns the way after it.
 * - Ship(state, input, settings, elapsed): input {Yaw, Pitch, Roll, Throttle, Lift, Boost, Stop (all of it comes to rest)}. Settings: Top,
 *   Boost, Turn, Roll, Assist (how soon it gives up a way it no longer points). State: {At, Right, Up, Ahead, Way, Spin: [pitch, yaw, roll], Throttle}.
 * - Boat(state, input, sea, bed, settings, elapsed): input {Gas, Brake (and astern; true, or 0 to 1), Steer (-1 to 1, left over 0),
 *   Stop}; sea(x, z) is {Height} of the water there (SceneWaves.At), bed(x, z) the height of the ground under it. Settings: Power
 *   (m/s² the motor gives, 6), Top (m/s, 16), Turn (radians a second at speed, 0.9), Length (4.5), Width (1.8), Draft (how deep it
 *   lies, 0.35), Plane (how far its bow rises at speed, radians, 0.09), Lean (how far it leans into a turn, 0.12). State: {X, Z,
 *   Heading, Forward, Aside, Rate, Y, Rise, Pitch, PitchSpeed, Roll, RollSpeed, Aground}.
 * - World(settings): a world of solid bodies. Settings: Gravity (m/s² down, or a list [x, y, z]), Ground (a height, a function (x, z)
 *   of the height, or null for none; 0 by default), Friction, Bounce and Rolling of the ground, Step (1/120 s), Iterations (10), Sleep (false:
 *   none sleep), Touch(a, b, {At, Normal, Impulse}) (when two begin to touch; b is null for the ground). It has:
 *   - Add(body): body {ID, Shape ('sphere', 'box', 'capsule' standing along its y, 'prism': a convex outline Points [[x, z]...]
 *     round its middle standing Height high, that never moves; 'tube': a pipe that never moves, its axis Points [[x, y, z]...]
 *     from its At, Radius out to its outside, Wall (its thickness, a tenth of it): what is outside stays out of it, what is in
 *     it stays in, its ends open), Radius, Size [x, y, z] (a box), Height (a capsule, between the
 *     middles of its ends; a prism, all of it), Mass (0: it never moves), Static, At, Turn [x, y, z, w], Way, Spin (radians a second round
 *     each axis), Bounce, Friction, Rolling (what holds back its rolling: 0 rolls on for ever, 0.03 by default), Damping, Angular
 *     (how it slows by itself), Gravity (how much of it the body feels), Sleeping};
 *     the world moves the body itself, so what shows it reads At and Turn, or blends from Was and WasTurn (where it was a
 *     step before) by what Step returns, for frames that come between steps;
 *   - Remove(body), Bodies(), Clear(), Step(elapsed) (returns how far into the next step the time has come, as Steps does);
 *   - Push(body, impulse, at) (an impulse [x, y, z], N s, at a point of the world, the middle when none), Wake(body);
 *   - Joint(a, b, {At, From, To, Length, Rope}): holds a point of a (From, or At) to a point of b, or of the world when b is null
 *     (To, or At), at a Length (what it is now by default; 0 is a ball joint): a rod, or a rope that only pulls; returns {Remove()};
 *   - Ray(from, direction, max, filter(body, null for the ground)): the nearest {Body (null: the ground), At, Normal, Distance}, or null;
 *   - Contacts(): what touched in the last step, {A, B, At, Normal (out of B into A), Depth, Impulse}.
 *   - Ragdoll(at, {Height, Mass, Group}): a body of a person standing at a point, eleven parts on ball joints (Parts {Head, Chest,
 *     Hips, ThighLeft, ShinLeft, ArmLeft, ForearmLeft and the Right ones}), that falls limp; returns {Parts, Remove()}.
 *   Water ({Level: a height or a function (x, z), Density 1000, Drag 1}) floats what is lighter than the water it puts aside, a box
 *   on its face; a body's Group (any word) is one with the others of it: they never strike one another.
 * - Cloth({Columns, Rows, Spacing, At, Across, Down, Pinned (top, ends, corners, none, or the indices), Shear, Bend, Gravity,
 *   Iterations, Damping, Ground, Wind, Colliders [{At, Radius}]}): a grid of points held to their neighbours: {Columns, Rows,
 *   Points (row by row, each [x, y, z]), Links ([a, b, length]), Index(column, row), Step(elapsed), Pin(i, at), Release(i), Blow(wind)}.
 * - Rope({From, To, Segments, Pinned (start by default)} and those of Cloth): a cloth one point wide.
 * - Waves({Columns, Rows, Cell, At [x, z], Speed, Damping}): the face of water as a grid of heights: {Heights, Step(elapsed),
 *   Disturb(x, z, amount, radius), Height(x, z)}.
 * - Fluid({Radius (how far a particle feels the others), Density, Stiffness, Viscosity, Gravity, Min, Max (its box), Ground (a
 *   height or a function (x, z) of it: it lies on it and spreads over it), Friction (of the ground: the part of its speed along it it loses in a second, 0.3), Step (seconds, 1/120;
 *   longer is cheaper and coarser), MaxSpeed (m/s: no particle faster)}): water of particles:
 *   Add(at, way), Pour(at, count, across), Step(elapsed), Particles() ([{At, Way, Density, Age}]), Count(), Clear(), Keep(test)
 *   (only the particles test(particle, index) is true of stay: what soaked away, what ran off).
 */
Elemenx.Service('Physics', {
	$Meta: {
		Description: 'How things move, apart from what shows them: steps of one length, springs, a car on its tyres and springs, a ship in space, a boat on the waves, a world of solid bodies with ragdolls and water to float in, cloth and ropes, waves and a fluid of particles.',
		Methods: ['Steps(clock, elapsed, length, each)', 'Blend(from, to, part)', 'Spring(value, speed, target, stiffness, damping, elapsed)', 'Car(state, input, surface, settings, elapsed)', 'Gearbox(state, input, settings, gas, braking, speed, elapsed)', 'Hit(state, normal, depth, at, settings)', 'Bounce(way, normal, depth, bounce)', 'Ship(state, input, settings, elapsed)', 'Boat(state, input, sea, bed, settings, elapsed)', 'World(settings)', 'Cloth(settings)', 'Rope(settings)', 'Waves(settings)', 'Fluid(settings)']
	},

	Gravity: 9.81,

	Steps: function (clock, elapsed, length, each) {
		var count = 0;

		clock.Left = (clock.Left || 0) + elapsed;

		while (clock.Left >= length && count < 40) {
			each(length);

			clock.Left -= length;

			count++;
		}

		if (count === 40)
			clock.Left = 0;

		return clock.Left / length;
	},

	Blend: function (from, to, part) {
		if (!Array.isArray(to))
			return from + (to - from) * part;

		return to.map(function (value, index) {
			return from[index] + (value - from[index]) * part;
		});
	},

	Spring: function (value, speed, target, stiffness, damping, elapsed) {
		var moved = speed + ((target - value) * stiffness - speed * damping) * elapsed;

		return [value + moved * elapsed, moved];
	},

	Number: function (value, fallback) {
		return value === null || value === undefined || value === '' || isNaN(Number(value)) ? fallback : Number(value);
	},

	/*
	 * The body on its four springs, the wheels under it. What presses on a body is the weight it rests on each wheel, what its spring
	 * has gone from rest and how fast; a wheel has its own weight, is pushed down by the same force and is stopped by the road.
	 */
	Ride: function (state, surface, settings, ahead, pressed, sideways, elapsed) {
		var number = this.Number;
		var gravity = this.Gravity;
		var mass = number(settings.Mass, 1500);
		var base = number(settings.Base, 2.7) / 2;
		var wide = number(settings.Width, 1.6) / 2;
		var ride = number(settings.Ride, 1);
		var travel = number(settings.Travel, 0.1);
		var high = number(settings.Balance, 0.42);
		var stiff = 36000 / ride;
		var damp = 2 * 0.42 * Math.sqrt(stiff * mass / 4);
		var carried = mass * gravity / 4;
		var unsprung = 42;
		var corners = [[base, wide], [base, -wide], [-base, wide], [-base, -wide]];
		var inertia = {Pitch: mass * base * base * 1.05, Roll: mass * wide * wide * 1.15};
		var push = {Y: 0, Pitch: mass * pressed * high, Roll: mass * sideways * high};
		var touching = 0;
		var bars = number(settings.AntiRoll, 150000);

		function under (forward, aside) {
			return surface(state.X + ahead[0] * forward + ahead[1] * aside, state.Z + ahead[1] * forward - ahead[0] * aside).Height;
		}

		if (!state.Wheels) {
			state.Wheels = corners.map(function (corner) {
				var height = under(corner[0], corner[1]);

				return {Y: height, Speed: 0, Ground: height};
			});

			state.Strokes = [0, 0, 0, 0];
		}

		corners.forEach(function (corner, index) {
			var wheel = state.Wheels[index];
			var at = state.Y + corner[0] * state.Pitch + corner[1] * state.Roll;
			var speed = state.Rise + corner[0] * state.PitchSpeed + corner[1] * state.RollSpeed;
			var stroke = at - wheel.Y;
			var force = carried - stiff * stroke - damp * (speed - wheel.Speed);
			var ground = under(corner[0], corner[1]);

			/* At the end of its way a spring meets rubber. */
			if (stroke < -travel)
				force += stiff * 7 * (-travel - stroke);

			force = Math.max(0, force);

			push.Y += force;
			push.Pitch += force * corner[0];
			push.Roll += force * corner[1];

			wheel.Speed -= (force / unsprung + gravity) * elapsed;
			wheel.Y += wheel.Speed * elapsed;

			/* It hangs from the body no lower than its way lets it. */
			if (wheel.Y < at - travel) {
				wheel.Speed = Math.max(wheel.Speed, speed);
				wheel.Y = at - travel;
			}

			/* A wheel does not go into the road: it rises as the road does. */
			if (wheel.Y <= ground) {
				wheel.Speed = Math.min(1.2, Math.max(0, ground - wheel.Ground) / elapsed);
				wheel.Y = ground;

				touching++;
			}

			wheel.Ground = ground;
			state.Strokes[index] = at - wheel.Y;
		});

		state.Rise += (push.Y / mass - gravity) * elapsed;
		state.PitchSpeed += push.Pitch / inertia.Pitch * elapsed;
		state.RollSpeed += (push.Roll - bars * state.Roll - 1.4 * Math.sqrt(bars * inertia.Roll) * state.RollSpeed) / inertia.Roll * elapsed;
		state.Y += state.Rise * elapsed;
		state.Pitch += state.PitchSpeed * elapsed;
		state.Roll += state.RollSpeed * elapsed;
		state.Touching = touching;

		/* Nothing goes as far as to put the body through the wheels. */
		var lowest = (state.Wheels[0].Y + state.Wheels[1].Y + state.Wheels[2].Y + state.Wheels[3].Y) / 4 - travel * 1.5;

		if (state.Y < lowest) {
			state.Y = lowest;
			state.Rise = Math.max(0, state.Rise);
		}
	},

	Car: function (state, input, surface, settings, elapsed) {
		var number = this.Number;
		var mass = number(settings.Mass, 1500);
		var power = number(settings.Power, 520000);
		var top = number(settings.Top, 92);
		var brake = number(settings.Brake, 11);
		var base = number(settings.Base, 2.7);
		var lock = number(settings.Lock, 0.55);
		var answer = number(settings.Answer, 9);
		var keep = number(settings.Keep, 51);
		var ground = surface(state.X, state.Z);
		var touching = state.Touching === undefined ? 4 : state.Touching;
		var speed = state.Forward;
		var size = Math.abs(speed);
		var pressedDown = 1 + number(settings.Downforce, 0) * Math.pow(size / top, 2);
		var grip = number(settings.Grip, 1.15) * pressedDown * ground.Grip * this.Gravity * (touching / 4);
		var pull = 0;
		var bite = number(settings.Bite, 1);
		var ahead;

		var asked = input.Steer || 0;
		var build = settings.Build;

		/* The wheels come round slowly, and turn less the faster it goes. */
		if (build) {
			var move = elapsed / Math.max(0.01, build[0] + (build[1] - build[0]) * Math.min(1, size / top)) * (asked * state.Steer > 0 ? 1 : 2);

			state.Steer += Math.max(-move, Math.min(move, asked - state.Steer));
		}
		else {
			state.Steer += (asked - state.Steer) * Math.min(1, elapsed * answer * 0.8);
		}

		/* Gas and Brake true are full; a number (0 to 1) is a pedal pressed so far, as a trigger of a pad. */
		var gas = typeof input.Gas === 'number' ? Math.max(0, Math.min(1, input.Gas)) : input.Gas ? 1 : 0;
		var braking = typeof input.Brake === 'number' ? Math.max(0, Math.min(1, input.Brake)) : input.Brake ? 1 : 0;

		/* With a gearbox the engine gives what its revolutions give, nothing while it changes gear, and no more past the red line. */
		var engine = settings.Gears ? this.Gearbox(state, input, settings, gas, braking, speed, elapsed) : 1;

		if (gas)
			pull = Math.min(power * engine / Math.max(size, 6) / mass, grip) * gas;

		if (braking) {
			if (speed > 0.5) pull = -Math.min(brake, grip * bite) * braking;
			else pull = -Math.min(power * 0.3 * engine / Math.max(size, 6) / mass, grip) * (speed < -14 ? 0 : 1) * braking;
		}

		if (input.Hand)
			pull = -Math.sign(speed) * Math.min(brake * 0.6, grip * 0.6, size / elapsed);

		if (input.Stop)
			pull = -Math.sign(speed) * Math.min(brake, grip * bite, size / elapsed);

		var air = power / mass / (top * top * top) * speed * size;
		var resist = (0.012 * this.Gravity + (input.Gas ? 0 : number(settings.Coast, 1.5)) + ground.Drag * size * 0.5) * Math.sign(speed);
		var slowed = (air + resist) * elapsed;

		speed += pull * elapsed;
		speed = Math.abs(slowed) > Math.abs(speed) ? 0 : speed - slowed;

		var angle = state.Steer * lock / (1 + size * size / (keep * keep));
		var agility = number(settings.Agility, 1);
		var assist = Math.max(0, Math.min(1, number(settings.Assist, 0.6)));
		var drifting = !!(input.Drift || input.Hand);
		var most = grip * agility / Math.max(size, 2);
		var wanted = Math.max(-most, Math.min(most, speed * Math.tan(angle) / base));

		/* A table says how fast it turns outright, on what grip the ground has; a car at a walk still turns no tighter than its wheels. */
		if (settings.Turn)
			wanted = Math.sign(speed) * state.Steer * Math.min(this.Table(settings.Turn, size) * Math.PI / 180 * ground.Grip * touching / 4, size * Math.tan(lock) / base);

		var half = base / 2;
		var peak = number(settings.Peak, 0.14);
		var rear = grip * number(settings.Rear, 1.1) * (drifting ? number(settings.Slide, 0.45) : 1);
		var along = Math.max(size, 1);

		/* Below a walk nothing slips: the car goes where its wheels point. Above it the tyres take over. */
		var rolling = Math.max(0, Math.min(1, (speed - 4) / 6));
		var held = Math.min(0.95, Math.abs(pull) / Math.max(rear, 0.1));
		var front = this.Tyre((angle - Math.atan2(state.Aside + half * state.Rate, along)) / peak) * grip / 2 * Math.cos(angle);
		var back = this.Tyre(-Math.atan2(state.Aside - half * state.Rate, along) / peak) * rear / 2 * Math.sqrt(1 - held * held);

		state.Aside += (front + back - speed * state.Rate) * elapsed * rolling;
		state.Rate += (front - back) * half / (half * half * 0.85 / agility) * elapsed * rolling * (settings.Turn && !drifting ? 1 - assist : 1);

		/* What is asked of the driver is taken off by as much as Assist says; a drift is left to the hands. */
		var helped = (1 - rolling) + rolling * assist * (drifting ? 0.12 : 1);

		state.Rate += (wanted - state.Rate) * Math.min(1, elapsed * answer * helped);
		state.Aside -= state.Aside * Math.min(1, elapsed * 10 * helped);

		/* However it goes, a car does not spin faster than its tyres could throw it round, and a drift comes back from its widest. */
		var spin = most * 1.6 + 0.4;
		var past = Math.max(0, Math.abs(Math.atan2(state.Aside, along)) - number(settings.Angle, 0.7));

		state.Rate = Math.max(-spin, Math.min(spin, state.Rate));

		if (past > 0) {
			state.Rate *= 1 - Math.min(1, elapsed * past * 14);
			state.Aside *= 1 - Math.min(1, elapsed * past * 10);
		}

		state.Heading += state.Rate * elapsed;
		state.Slip = Math.atan2(state.Aside, along);

		/* Sideways the tyres scrub it down. */
		speed *= 1 - Math.min(0.5, Math.abs(state.Aside) / along) * elapsed;

		ahead = [Math.sin(state.Heading), Math.cos(state.Heading)];

		state.X += (ahead[0] * speed + ahead[1] * state.Aside) * elapsed;
		state.Z += (ahead[1] * speed - ahead[0] * state.Aside) * elapsed;
		state.Forward = speed;
		state.Spin = (state.Spin + speed * elapsed / 0.34) % (Math.PI * 2);

		/* What leans it is what the tyres can give, however sharply it turns. */
		this.Ride(state, surface, settings, ahead, pull, Math.max(-grip, Math.min(grip, speed * state.Rate)), elapsed);

		return state;
	},

	/*
	 * The gearbox of a car: Gears, the part of Top each gear reaches at the red line ([0.3, 0.45, ...], the last 1 or less); Shift
	 * auto (up near the red line, down when it labours, into reverse when it stops and is asked back) or manual (ShiftUp and
	 * ShiftDown of the input, once a press; down past 1 is neutral, then reverse); ShiftTime (seconds without drive, 0.22), Redline and
	 * Idle (revolutions a minute). Keeps Gear (-1 reverse, 0 neutral, 1 and on), Rpm, Shifting (the seconds of a change left) and
	 * Shifted (1 up, -1 down, while it changes) in the state, and gives how much of its power the engine gives now, 0 to 1.
	 */
	Gearbox: function (state, input, settings, gas, braking, speed, elapsed) {
		var number = this.Number;
		var gears = settings.Gears;
		var count = gears.length;
		var top = number(settings.Top, 92);
		var redline = number(settings.Redline, 7500);
		var idle = number(settings.Idle, 900);
		var time = number(settings.ShiftTime, 0.22);
		var manual = settings.Shift === 'manual';
		var size = Math.abs(speed);
		var before;
		var reach;
		var turning;

		if (state.Gear === undefined) {
			state.Gear = 0;
			state.Rpm = idle;
			state.Shifting = 0;
			state.Shifted = 0;
		}

		before = state.Gear;

		function change (gear) {
			if (gear === state.Gear) return;

			state.Shifted = gear > state.Gear ? 1 : -1;
			state.Gear = gear;
			state.Shifting = time;
		}

		if (manual) {
			if (input.ShiftUp)
				change(Math.min(count, state.Gear + 1));

			if (input.ShiftDown)
				change(Math.max(-1, state.Gear - 1));
		}
		else if (state.Shifting <= 0 && gas && state.Gear <= 0 && speed > -0.5) {
			change(1);
		}
		else if (state.Shifting <= 0 && braking && !gas && speed < 0.5 && state.Gear >= 0) {
			change(-1);
		}
		else if (state.Shifting <= 0 && state.Gear > 0) {
			reach = size / (top * gears[state.Gear - 1]);

			if (reach > 0.93 && state.Gear < count) change(state.Gear + 1);
			else if (reach < 0.42 && state.Gear > 1) change(state.Gear - 1);
		}

		state.Shifting = Math.max(0, state.Shifting - elapsed);

		if (state.Shifting <= 0)
			state.Shifted = 0;

		/* The revolutions follow the wheels in gear; in neutral the gas alone raises them. */
		if (state.Gear === 0) {
			state.Rpm += (idle + (redline - idle) * gas - state.Rpm) * Math.min(1, elapsed * 6);

			return 0;
		}

		reach = size / (top * gears[Math.max(0, state.Gear - 1)]);
		turning = Math.max(idle, idle * 0.6 + redline * reach);
		state.Rpm += (turning - state.Rpm) * Math.min(1, elapsed * (before === state.Gear ? 20 : 8));

		if (state.Shifting > 0 || reach >= 1) return 0;

		/* Most at four fifths of the red line, less below and above it. */
		return Math.max(0.35, 1 - Math.pow((state.Rpm / redline - 0.8) / 0.8, 2));
	},

	/* What a table of [at, value] gives between its rows, and its ends beyond them. */
	Table: function (rows, at) {
		var i = 1;

		while (i < rows.length - 1 && rows[i][0] < at)
			i++;

		var from = rows[i - 1];
		var to = rows[i];

		return from[1] + (to[1] - from[1]) * Math.max(0, Math.min(1, (at - from[0]) / (to[0] - from[0])));
	},

	/* What a tyre gives at a slip, Peak being 1: it grows, tops about there, and falls a little past it. */
	Tyre: function (slip) {
		return Math.sin(1.6 * Math.atan(1.4 * slip));
	},

	Hit: function (state, normal, depth, at, settings) {
		var bounce = this.Number(settings.Bounce, 0.25);
		var scrape = this.Number(settings.Scrape, 0.12);
		var ahead = [Math.sin(state.Heading), Math.cos(state.Heading)];
		var side = [ahead[1], -ahead[0]];
		var x = ahead[0] * state.Forward + side[0] * state.Aside;
		var z = ahead[1] * state.Forward + side[1] * state.Aside;
		var into = x * normal[0] + z * normal[1];

		state.X += normal[0] * depth;
		state.Z += normal[1] * depth;

		if (into >= 0) return state;

		var along = [x - normal[0] * into, z - normal[1] * into];
		var left = Math.max(0, 1 + scrape * into / Math.max(Math.hypot(along[0], along[1]), 1));
		var push = -(1 + bounce) * into;

		x = along[0] * left - normal[0] * into * bounce;
		z = along[1] * left - normal[1] * into * bounce;

		state.Forward = x * ahead[0] + z * ahead[1];
		state.Aside = x * side[0] + z * side[1];

		/* Struck at a corner it turns: as far as the blow does not go through its middle. */
		state.Rate += push * (at[1] * normal[0] - at[0] * normal[1]) / (at[0] * at[0] + at[1] * at[1] + 1.5);

		return state;
	},

	/*
	 * A boat on water. sea(x, z) is {Height} of the water there, bed(x, z) the height of the ground under it. The motor pushes
	 * it, the water holds it back (it comes to Top at full gas) and holds it sideways; the rudder turns it as far as water goes
	 * past it; it rides on the waves at its four ends, as on springs damped by the water, its bow up as it goes fast, leaning
	 * into a turn; where the bed comes up under its bow (its stern, going back) it runs aground and stops.
	 */
	Boat: function (state, input, sea, bed, settings, elapsed) {
		var number = this.Number;
		var power = number(settings.Power, 6);
		var top = Math.max(1, number(settings.Top, 16));
		var turn = number(settings.Turn, 0.9);
		var half = number(settings.Length, 4.5) / 2;
		var side = number(settings.Width, 1.8) / 2;
		var draft = number(settings.Draft, 0.35);
		var gas = Math.max(0, Math.min(1, Number(input.Gas) || 0));
		var brake = Math.max(0, Math.min(1, Number(input.Brake) || 0));
		var steer = Math.max(-1, Math.min(1, Number(input.Steer) || 0));
		var ahead = [Math.sin(state.Heading), Math.cos(state.Heading)];
		var last = {X: state.X, Z: state.Z};
		var push = gas * power - brake * power * 0.6;
		var flow;
		var ends;
		var level;
		var pitch;
		var roll;
		var moved;

		if (input.Stop)
			push = Math.abs(state.Forward) > 0.2 ? -Math.sign(state.Forward) * power * 0.8 : -state.Forward / Math.max(elapsed, 1e-3);

		/* The water: what grows with the square of the speed (Top where the motor gives no more), and a little more. */
		state.Forward += (push - Math.max(0, power - 0.15 * top) / (top * top) * state.Forward * Math.abs(state.Forward) - 0.15 * state.Forward) * elapsed;
		state.Forward = Math.max(-top * 0.35, state.Forward);

		/* The rudder turns it as far as water goes past it; going back, the other way. */
		flow = Math.min(1, Math.abs(state.Forward) / 4);
		state.Rate += (steer * turn * flow * (state.Forward >= 0 ? 1 : -1) - state.Rate) * Math.min(1, elapsed * 3);
		state.Heading += state.Rate * elapsed;

		/* Thrown out of a turn, held by the water. */
		state.Aside = (state.Aside - state.Rate * state.Forward * 0.25 * elapsed) * Math.exp(-elapsed * 2.5);

		ahead = [Math.sin(state.Heading), Math.cos(state.Heading)];
		state.X += (ahead[0] * state.Forward + ahead[1] * state.Aside) * elapsed;
		state.Z += (ahead[1] * state.Forward - ahead[0] * state.Aside) * elapsed;

		/* Aground: the bed under its bow going on, under its stern going back, nearer than it lies deep. */
		state.Aground = state.Forward >= 0 ? bed(state.X + ahead[0] * half, state.Z + ahead[1] * half) > -draft * 0.6 : bed(state.X - ahead[0] * half, state.Z - ahead[1] * half) > -draft * 0.6;

		if (state.Aground) {
			state.X = last.X;
			state.Z = last.Z;
			state.Forward *= -0.15;
			state.Aside = 0;
		}

		function water (forward, aside) {
			return sea(state.X + ahead[0] * forward + ahead[1] * aside, state.Z + ahead[1] * forward - ahead[0] * aside).Height;
		}

		ends = [water(half * 0.8, 0), water(-half * 0.8, 0), water(0, side), water(0, -side)];
		level = (ends[0] + ends[1] + ends[2] + ends[3]) / 4 - draft + Math.min(1, Math.abs(state.Forward) / top) * 0.12;
		pitch = Math.atan2(ends[0] - ends[1], half * 1.6) + number(settings.Plane, 0.09) * Math.min(1, Math.max(0, state.Forward) / (top * 0.6));
		roll = Math.atan2(ends[2] - ends[3], side * 2) - state.Rate * Math.min(1, Math.abs(state.Forward) / top) * number(settings.Lean, 0.12) / Math.max(0.1, turn);

		moved = this.Spring(state.Y, state.Rise, level, 30, 7, elapsed);
		state.Y = moved[0];
		state.Rise = moved[1];
		moved = this.Spring(state.Pitch, state.PitchSpeed, pitch, 26, 6, elapsed);
		state.Pitch = moved[0];
		state.PitchSpeed = moved[1];
		moved = this.Spring(state.Roll, state.RollSpeed, roll, 26, 5, elapsed);
		state.Roll = moved[0];
		state.RollSpeed = moved[1];

		return state;
	},

	Bounce: function (way, normal, depth, bounce) {
		var vectors = this.$Service('Math').Vectors;
		var into = vectors.Dot(way, normal);

		return into >= 0 ? way : vectors.Subtract(way, vectors.Scale(normal, into * (1 + this.Number(bounce, 0.3))));
	},

	Ship: function (state, input, settings, elapsed) {
		var vectors = this.$Service('Math').Vectors;
		var math = this.$Service('Math');
		var number = this.Number;
		var top = number(settings.Top, 1);
		var turn = number(settings.Turn, 1.1);
		var roll = number(settings.Roll, 1.7);
		var assist = number(settings.Assist, 1.6);
		var boost = input.Boost ? number(settings.Boost, 2.4) : 1;
		var answer = Math.min(1, elapsed * 3.5);
		var rest = Math.min(1, elapsed * 3);

		state.Spin = [state.Spin[0] + ((input.Pitch || 0) * turn - state.Spin[0]) * answer, state.Spin[1] + ((input.Yaw || 0) * turn - state.Spin[1]) * answer, state.Spin[2] + ((input.Roll || 0) * roll - state.Spin[2]) * answer];

		var moved = math.Multiply(math.Rotation(state.Up, state.Spin[1] * elapsed), math.Multiply(math.Rotation(state.Right, -state.Spin[0] * elapsed), math.Rotation(state.Ahead, state.Spin[2] * elapsed)));

		state.Ahead = vectors.Normalize(math.Apply(moved, state.Ahead));
		state.Up = vectors.Normalize(math.Apply(moved, state.Up));
		state.Right = vectors.Normalize(vectors.Cross(state.Up, state.Ahead));
		state.Up = vectors.Cross(state.Ahead, state.Right);
		state.Throttle = Math.max(-0.25, Math.min(1, state.Throttle + (input.Throttle || 0) * elapsed * 0.7));

		if (input.Stop)
			state.Throttle = Math.abs(state.Throttle) < 0.01 ? 0 : state.Throttle * (1 - rest);

		var wanted = input.Stop ? [0, 0, 0] : vectors.Add(vectors.Scale(state.Ahead, state.Throttle * top * boost), vectors.Scale(state.Up, (input.Lift || 0) * top * 0.3));

		state.Way = vectors.Lerp(state.Way, wanted, input.Stop ? rest : Math.min(1, elapsed * assist));

		/* Asked for nothing, it comes to rest and not only near it. */
		if (vectors.Length(wanted) === 0 && vectors.Length(state.Way) < top * 0.002)
			state.Way = [0, 0, 0];

		state.At = vectors.Add(state.At, vectors.Scale(state.Way, elapsed));

		return state;
	},

	/*
	 * A world of solid bodies: balls, boxes and capsules that fall, strike, rest on one another and on the ground. Each step finds
	 * what touches (a sweep along x, then the shapes themselves), pushes the bodies apart by impulses many times over, with friction
	 * and a bounce, then moves them. A body that has stayed still a while sleeps until something strikes it or it is pushed.
	 */
	World: function (settings) {
		var self = this;
		var options = settings || {};
		var number = this.Number;
		var gravity = Array.isArray(options.Gravity) ? options.Gravity.slice() : [0, -number(options.Gravity, self.Gravity), 0];
		var length = number(options.Step, 1 / 120);
		var iterations = Math.max(1, Math.round(number(options.Iterations, 10)));
		var groundFriction = number(options.Friction, 0.6);
		var groundBounce = number(options.Bounce, 0.1);
		var groundRolling = number(options.Rolling, 0.05);
		var ground = options.Ground === undefined ? 0 : options.Ground;
		var hasGround = ground !== null && ground !== false;
		var sleeps = options.Sleep !== false;
		var water = options.Water ? {Level: options.Water.Level, Density: number(options.Water.Density, 1000), Drag: number(options.Water.Drag, 1)} : null;
		var api;
		var clock = {};
		var records = [];
		var joints = [];
		var contacts = [];
		var touching = {};
		var next = 1;

		function add (a, b) {
			return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
		}

		function sub (a, b) {
			return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
		}

		function scale (a, s) {
			return [a[0] * s, a[1] * s, a[2] * s];
		}

		function dot (a, b) {
			return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
		}

		function cross (a, b) {
			return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
		}

		function size (a) {
			return Math.sqrt(dot(a, a));
		}

		function unit (a) {
			var l = size(a);

			return l > 1e-12 ? scale(a, 1 / l) : [0, 1, 0];
		}

		/* The turn [x, y, z, w] as a matrix of 3 by 3, by rows: its columns are the axes of the body in the world. */
		function matrix (q) {
			var x = q[0];
			var y = q[1];
			var z = q[2];
			var w = q[3];

			return [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w), 2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w), 2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)];
		}

		function apply (m, v) {
			return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
		}

		function local (m, v) {
			return [m[0] * v[0] + m[3] * v[1] + m[6] * v[2], m[1] * v[0] + m[4] * v[1] + m[7] * v[2], m[2] * v[0] + m[5] * v[1] + m[8] * v[2]];
		}

		function axis (m, i) {
			return [m[i], m[3 + i], m[6 + i]];
		}

		function height (x, z) {
			return typeof ground === 'function' ? number(ground(x, z), 0) : number(ground, 0);
		}

		function slope (x, z) {
			var e = 0.05;

			if (typeof ground !== 'function') return [0, 1, 0];

			return unit([height(x - e, z) - height(x + e, z), 2 * e, height(x, z - e) - height(x, z + e)]);
		}

		/* What a body weighs and how it turns, read again each step, so a body changed between steps is taken as it is. */
		function refresh (record) {
			var body = record.Body;
			var mass = number(body.Mass, 1);
			var r = body.Radius;
			var long = body.Height + r;
			var half = body.Shape === 'box' ? scale(body.Size, 0.5) : [r, r, r];
			var inertia;

			if (body.Shape === 'box') {
				inertia = [mass * (half[1] * half[1] + half[2] * half[2]) / 3, mass * (half[0] * half[0] + half[2] * half[2]) / 3, mass * (half[0] * half[0] + half[1] * half[1]) / 3];
			}
			else if (body.Shape === 'capsule') {
				inertia = [mass * (3 * r * r + long * long) / 12, 0.4 * mass * r * r, mass * (3 * r * r + long * long) / 12];
			}
			else {
				inertia = [0.4 * mass * r * r, 0.4 * mass * r * r, 0.4 * mass * r * r];
			}

			/* Woken by hand: it was still, it has not slept since. */
			if (!body.Sleeping && record.Still > 0.6)
				record.Still = 0;

			/* A prism (a wall of a shape of its own) and a tube never move. */
			record.Static = body.Static === true || !(mass > 0) || body.Shape === 'prism' || body.Shape === 'tube';
			record.Mass = record.Static ? 0 : 1 / mass;
			record.Inertia = inertia.map(function (value) {
				return record.Static || !(value > 0) ? 0 : 1 / value;
			});
			record.Half = half;
			record.Reach = body.Shape === 'box' ? size(half) : body.Shape === 'capsule' ? r + body.Height / 2 : r;
			record.Matrix = matrix(body.Turn);

			if (body.Shape === 'prism')
				prismOf(record);

			if (body.Shape === 'tube')
				tubeOf(record);
		}

		function free (record) {
			return !!record && !record.Static && !record.Body.Sleeping;
		}

		/* A body the world does not move, moved by its owner: it has a way, so it strikes what it goes into. */
		function driven (record) {
			var body = record.Body;

			return record.Static && dot(body.Way, body.Way) + dot(body.Spin, body.Spin) > 0;
		}

		function turning (record, v) {
			var l;

			if (!free(record)) return [0, 0, 0];

			l = local(record.Matrix, v);

			return apply(record.Matrix, [l[0] * record.Inertia[0], l[1] * record.Inertia[1], l[2] * record.Inertia[2]]);
		}

		function velocity (record, r) {
			return record ? add(record.Body.Way, cross(record.Body.Spin, r)) : [0, 0, 0];
		}

		function impulse (record, push, r) {
			pushed(record, push[0], push[1], push[2], r);
		}

		/* The turn a twist (x, y, z) gives a free body, as turning, of numbers: into out, no array made. */
		function turned (record, x, y, z, out) {
			var m = record.Matrix;
			var k = record.Inertia;
			var a = (m[0] * x + m[3] * y + m[6] * z) * k[0];
			var b = (m[1] * x + m[4] * y + m[7] * z) * k[1];
			var c = (m[2] * x + m[5] * y + m[8] * z) * k[2];

			out[0] = m[0] * a + m[1] * b + m[2] * c;
			out[1] = m[3] * a + m[4] * b + m[5] * c;
			out[2] = m[6] * a + m[7] * b + m[8] * c;
		}

		var twist = [0, 0, 0];

		/*
		 * A push (x, y, z) at the arm r of a body, as impulse, of numbers (the solver gave each contact tens of them a step, each
		 * making arrays): its way and its spin are new arrays each step still, so what holds the old ones keeps them.
		 */
		function pushed (record, x, y, z, r) {
			var way;
			var spin;

			if (!record || record.Static || record.Body.Sleeping) return;

			way = record.Body.Way;
			spin = record.Body.Spin;

			turned(record, r[1] * z - r[2] * y, r[2] * x - r[0] * z, r[0] * y - r[1] * x, twist);

			/* While it is solved its arrays are its own (made for that step): changed in their place. */
			if (record.Solving) {
				way[0] += x * record.Mass;
				way[1] += y * record.Mass;
				way[2] += z * record.Mass;
				spin[0] += twist[0];
				spin[1] += twist[1];
				spin[2] += twist[2];

				return;
			}

			record.Body.Way = [way[0] + x * record.Mass, way[1] + y * record.Mass, way[2] + z * record.Mass];
			record.Body.Spin = [spin[0] + twist[0], spin[1] + twist[1], spin[2] + twist[2]];
		}

		/* How fast the two points of a contact close along a line d: of numbers, as dot(velocity(a) - velocity(b), d). */
		function closing (item, d) {
			var a = item.A.Body;
			var ra = item.RA;
			var x = a.Way[0] + a.Spin[1] * ra[2] - a.Spin[2] * ra[1];
			var y = a.Way[1] + a.Spin[2] * ra[0] - a.Spin[0] * ra[2];
			var z = a.Way[2] + a.Spin[0] * ra[1] - a.Spin[1] * ra[0];
			var b;
			var rb;

			if (item.B) {
				b = item.B.Body;
				rb = item.RB;
				x -= b.Way[0] + b.Spin[1] * rb[2] - b.Spin[2] * rb[1];
				y -= b.Way[1] + b.Spin[2] * rb[0] - b.Spin[0] * rb[2];
				z -= b.Way[2] + b.Spin[0] * rb[1] - b.Spin[1] * rb[0];
			}

			return x * d[0] + y * d[1] + z * d[2];
		}

		function wake (record) {
			if (!record || record.Static || !record.Body.Sleeping) return;

			record.Body.Sleeping = false;
			record.Still = 0;
		}

		/* How hard it is to change the speed of two points apart along a line: the impulse that changes it by 1. */
		function stiffness (a, b, ra, rb, n) {
			var k = (free(a) ? a.Mass : 0) + (free(b) ? b.Mass : 0) + dot(n, cross(turning(a, cross(ra, n)), ra));

			if (b)
				k += dot(n, cross(turning(b, cross(rb, n)), rb));

			return k > 1e-12 ? 1 / k : 0;
		}

		function corners (record) {
			var result = [];
			var h = record.Half;
			var i = 0;

			while (i < 8) {
				result.push(add(record.Body.At, apply(record.Matrix, [i & 1 ? h[0] : -h[0], i & 2 ? h[1] : -h[1], i & 4 ? h[2] : -h[2]])));

				i++;
			}

			return result;
		}

		function ends (record) {
			var up = scale(axis(record.Matrix, 1), record.Body.Height / 2);

			return [sub(record.Body.At, up), add(record.Body.At, up)];
		}

		function nearest (p, q, x) {
			var d = sub(q, p);
			var l = dot(d, d);

			return l > 1e-12 ? add(p, scale(d, Math.max(0, Math.min(1, dot(sub(x, p), d) / l)))) : p;
		}

		/* The nearest points of two segments. */
		function between (p0, p1, q0, q1) {
			var d1 = sub(p1, p0);
			var d2 = sub(q1, q0);
			var r = sub(p0, q0);
			var a = dot(d1, d1);
			var e = dot(d2, d2);
			var f = dot(d2, r);
			var c = dot(d1, r);
			var b = dot(d1, d2);
			var denominator = a * e - b * b;
			var s = denominator > 1e-12 ? Math.max(0, Math.min(1, (b * f - c * e) / denominator)) : 0;
			var t = e > 1e-12 ? (b * s + f) / e : 0;

			if (t < 0) {
				t = 0;
				s = a > 1e-12 ? Math.max(0, Math.min(1, -c / a)) : 0;
			}
			else if (t > 1) {
				t = 1;
				s = a > 1e-12 ? Math.max(0, Math.min(1, (b - c) / a)) : 0;
			}

			return [add(p0, scale(d1, s)), add(q0, scale(d2, t))];
		}

		/* A contact pushes a out of b along its normal; b is null for the ground. */
		function contact (a, b, point, normal, depth) {
			contacts.push({A: a, B: b, Point: point, Normal: normal, Depth: depth, Pressed: 0, Slid: [0, 0]});
		}

		function balls (a, ca, ra, b, cb, rb) {
			var d = sub(ca, cb);
			var distance = size(d);
			var n;

			if (distance >= ra + rb) return;

			n = distance > 1e-9 ? scale(d, 1 / distance) : [0, 1, 0];

			contact(a, b, add(cb, scale(n, rb - (ra + rb - distance) / 2)), n, ra + rb - distance);
		}

		function ballBox (a, c, r, b) {
			var l = local(b.Matrix, sub(c, b.Body.At));
			var h = b.Half;
			var near = [Math.max(-h[0], Math.min(h[0], l[0])), Math.max(-h[1], Math.min(h[1], l[1])), Math.max(-h[2], Math.min(h[2], l[2]))];
			var d = sub(l, near);
			var distance = size(d);
			var least = Infinity;
			var side = 0;
			var n = [0, 0, 0];
			var i = 0;

			if (distance >= r) return;

			if (distance > 1e-9) {
				contact(a, b, add(b.Body.At, apply(b.Matrix, near)), apply(b.Matrix, scale(d, 1 / distance)), r - distance);

				return;
			}

			/* The middle inside the box: out through the nearest face. */
			while (i < 3) {
				if (h[i] - Math.abs(l[i]) < least) {
					least = h[i] - Math.abs(l[i]);
					side = i;
				}

				i++;
			}

			n[side] = l[side] < 0 ? -1 : 1;
			near[side] = n[side] * h[side];

			contact(a, b, add(b.Body.At, apply(b.Matrix, near)), apply(b.Matrix, n), r + least);
		}

		/*
		 * A prism: its points [x, z] round its middle, made to turn left (a convex outline), its height along its y; the planes
		 * of its sides, its top and its bottom ({N, D}: inside where N . p <= D), in its own frame; its reach.
		 */
		function prismOf (record) {
			var body = record.Body;
			var points = (body.Points || []).map(function (point) {
				return [number(point[0], 0), number(point[1], 0)];
			});
			var half = number(body.Height, 1) / 2;
			var turn = 0;
			var far = 0;
			var key = JSON.stringify([points, half]);

			/* Its reach and its half sizes each time (refresh sets them as for a ball); its planes once. */
			if (record.PrismKey === key) {
				record.Half = record.PrismHalf;
				record.Reach = record.PrismReach;

				return;
			}

			points.forEach(function (point, i) {
				var next = points[(i + 1) % points.length];

				turn += point[0] * next[1] - next[0] * point[1];
				far = Math.max(far, Math.hypot(point[0], point[1]));
			});

			/* Its corners round to the left: the inside of each side is on its left. */
			if (turn < 0)
				points.reverse();

			record.PrismKey = key;
			record.Points = points;
			record.Planes = [{N: [0, 1, 0], D: half}, {N: [0, -1, 0], D: half}].concat(points.map(function (point, i) {
				var next = points[(i + 1) % points.length];
				var n = [next[1] - point[1], 0, -(next[0] - point[0])];
				var l = Math.hypot(n[0], n[2]) || 1;

				n = [n[0] / l, 0, n[2] / l];

				return {N: n, D: n[0] * point[0] + n[2] * point[1]};
			}));
			record.PrismHalf = [far, half, far];
			record.PrismReach = Math.hypot(far, half);
			record.Half = record.PrismHalf;
			record.Reach = record.PrismReach;
		}

		/*
		 * Where a point is against a prism, in the frame of the world: {Inside, Near (the nearest point of its surface), Normal
		 * (out of it, toward the point), Distance (from it; how deep within it, inside)}.
		 */
		function prismNear (record, c) {
			var l = local(record.Matrix, sub(c, record.Body.At));
			var half = record.Half[1];
			var points = record.Points;
			var worst = -Infinity;
			var face = null;
			var near;
			var best;
			var d;

			record.Planes.forEach(function (plane) {
				var out = dot(plane.N, l) - plane.D;

				if (out > worst) {
					worst = out;
					face = plane;
				}
			});

			if (worst <= 0) {
				near = sub(l, scale(face.N, worst));

				return {Inside: true, Near: add(record.Body.At, apply(record.Matrix, near)), Normal: apply(record.Matrix, face.N), Distance: -worst};
			}

			/* Outside: the nearest point of its outline (or within it), at the height of the point as far as it reaches. */
			best = null;

			if (record.Planes.slice(2).every(function (plane) {
				return dot(plane.N, l) - plane.D <= 0;
			})) {
				best = [l[0], l[2]];
			}
			else {
				points.forEach(function (point, i) {
					var next = points[(i + 1) % points.length];
					var e = [next[0] - point[0], next[1] - point[1]];
					var t = Math.max(0, Math.min(1, ((l[0] - point[0]) * e[0] + (l[2] - point[1]) * e[1]) / Math.max(1e-12, e[0] * e[0] + e[1] * e[1])));
					var q = [point[0] + e[0] * t, point[1] + e[1] * t];
					if (!best || Math.hypot(q[0] - l[0], q[1] - l[2]) < Math.hypot(best[0] - l[0], best[1] - l[2]))
						best = q;
				});
			}

			near = [best[0], Math.max(-half, Math.min(half, l[1])), best[1]];
			d = sub(l, near);

			return {Inside: false, Near: add(record.Body.At, apply(record.Matrix, near)), Normal: apply(record.Matrix, unit(d)), Distance: size(d)};
		}

		/* A tube: the segments of its axis in the world, its radius in and out, its reach round its At; once for the same points. */
		function tubeOf (record) {
			var body = record.Body;
			var key = JSON.stringify([body.Points, body.Radius, body.Wall, body.At]);
			var points;
			var far = 0;

			if (record.TubeKey !== key) {
				points = (body.Points || []).map(function (point) {
					return [number(point[0], 0) + body.At[0], number(point[1], 0) + body.At[1], number(point[2], 0) + body.At[2]];
				});

				points.forEach(function (point) {
					far = Math.max(far, size(sub(point, body.At)));
				});

				record.TubeKey = key;
				record.Axis = points;
				record.Outer = body.Radius;
				record.Inner = Math.max(0, body.Radius - Math.max(0.001, number(body.Wall, body.Radius * 0.1)));
				record.TubeReach = far + body.Radius;
			}

			record.Half = [record.TubeReach, record.TubeReach, record.TubeReach];
			record.Reach = record.TubeReach;
		}

		/* The nearest point of the axis of a tube to c: {At, Distance, End (beyond its first or last point: none of its wall there)}. */
		function tubeNear (record, c) {
			var best = {At: null, Distance: Infinity, End: false};
			var axis = record.Axis;
			var i;

			for (i = 0; i + 1 < axis.length; i++) {
				var a = axis[i];
				var d = sub(axis[i + 1], a);
				var l = dot(d, d);
				var t = l > 1e-12 ? dot(sub(c, a), d) / l : 0;
				var q = add(a, scale(d, Math.max(0, Math.min(1, t))));
				var far = size(sub(c, q));
				if (far < best.Distance)
					best = {At: q, Distance: far, End: i === 0 && t < 0 || i === axis.length - 2 && t > 1};
			}

			return best;
		}

		/*
		 * A ball (its middle c, radius r) of a against a tube b: within it (its middle nearer the axis than halfway through
		 * its wall) it is held in, out of it out; past its open ends nothing holds it.
		 */
		function ballTube (a, c, r, b) {
			var met = tubeNear(b, c);
			var n;

			if (!met.At || met.End) return;

			n = met.Distance > 1e-9 ? scale(sub(c, met.At), 1 / met.Distance) : [0, 1, 0];

			if (met.Distance < (b.Outer + b.Inner) / 2) {
				if (met.Distance > b.Inner - r)
					contact(a, b, add(met.At, scale(n, b.Inner)), scale(n, -1), met.Distance - (b.Inner - r));

				return;
			}

			if (met.Distance < b.Outer + r)
				contact(a, b, add(met.At, scale(n, b.Outer)), n, b.Outer + r - met.Distance);
		}

		/* A ray into a tube: its wall from outside, or from inside out; -1 when it meets none. */
		function castTube (record, from, direction) {
			var axis = record.Axis;
			var inside = tubeNear(record, from);
			var radius = inside.At && !inside.End && inside.Distance < (record.Outer + record.Inner) / 2 ? record.Inner : record.Outer;
			var best = {Distance: -1};
			var i;

			for (i = 0; i + 1 < axis.length; i++) {
				var a = axis[i];
				var u = unit(sub(axis[i + 1], a));
				var l = size(sub(axis[i + 1], a));
				var o = sub(from, a);
				var d = sub(direction, scale(u, dot(direction, u)));
				var p = sub(o, scale(u, dot(o, u)));
				var qa = dot(d, d);
				var qb = 2 * dot(p, d);
				var disc = qb * qb - 4 * qa * (dot(p, p) - radius * radius);
				if (qa < 1e-12 || disc < 0) continue;

				[(-qb - Math.sqrt(disc)) / (2 * qa), (-qb + Math.sqrt(disc)) / (2 * qa)].some(function (t) {
					var hit = add(from, scale(direction, t));
					var along = dot(sub(hit, a), u);
					if (t < 0 || along < 0 || along > l) return false;

					if (best.Distance < 0 || t < best.Distance) {
						var normal = unit(sub(hit, add(a, scale(u, along))));

						best = {Distance: t, Normal: radius === record.Inner ? scale(normal, -1) : normal};
					}

					return true;
				});
			}

			return best;
		}

		/* A ball (its middle c, radius r) of a against a prism b. */
		function ballPrism (a, c, r, b) {
			var met = prismNear(b, c);

			if (met.Inside) {
				contact(a, b, met.Near, met.Normal, r + met.Distance);

				return;
			}

			if (met.Distance < r)
				contact(a, b, met.Near, met.Normal, r - met.Distance);
		}

		/* A box of a against a prism b: its corners in the prism, and the corners of the prism in it. */
		function boxPrism (a, b) {
			var half = b.Half[1];

			corners(a).forEach(function (corner) {
				ballPrism(a, corner, 0, b);
			});

			b.Points.forEach(function (point) {
				[-half, half].forEach(function (y) {
					ballBox(b, add(b.Body.At, apply(b.Matrix, [point[0], y, point[1]])), 0, a);
				});
			});
		}

		/* A ray into a prism: where it first comes in through its planes, or -1. */
		function castPrism (record, from, direction) {
			var o = local(record.Matrix, sub(from, record.Body.At));
			var d = local(record.Matrix, direction);
			var near = -Infinity;
			var far = Infinity;
			var normal = [0, 1, 0];
			var i;

			for (i = 0; i < record.Planes.length; i++) {
				var plane = record.Planes[i];
				var along = dot(plane.N, d);
				var room = plane.D - dot(plane.N, o);

				if (Math.abs(along) < 1e-12) {
					if (room < 0)
						return {Distance: -1};

					continue;
				}

				var t = room / along;

				if (along < 0) {
					if (t > near) {
						near = t;
						normal = plane.N;
					}
				}
				else {
					far = Math.min(far, t);
				}

				if (near > far)
					return {Distance: -1};
			}

			if (far < 0)
				return {Distance: -1};

			if (near < 0)
				return {Distance: 0, Normal: scale(direction, -1)};

			return {Distance: near, Normal: apply(record.Matrix, normal)};
		}

		function support (record, n) {
			var m = record.Matrix;
			var h = record.Half;

			return h[0] * Math.abs(dot(axis(m, 0), n)) + h[1] * Math.abs(dot(axis(m, 1), n)) + h[2] * Math.abs(dot(axis(m, 2), n));
		}

		function inside (record, point, margin) {
			var l = local(record.Matrix, sub(point, record.Body.At));
			var h = record.Half;

			return Math.abs(l[0]) <= h[0] + margin && Math.abs(l[1]) <= h[1] + margin && Math.abs(l[2]) <= h[2] + margin;
		}

		/* Two boxes: the axis of the least overlap (a face is taken before an edge of about as much), the corners of each inside the other. */
		function boxes (a, b) {
			var t = sub(a.Body.At, b.Body.At);
			var axes = [axis(a.Matrix, 0), axis(a.Matrix, 1), axis(a.Matrix, 2), axis(b.Matrix, 0), axis(b.Matrix, 1), axis(b.Matrix, 2)];
			var best = Infinity;
			var normal = null;
			var found = contacts.length;
			var plane;
			var i = 0;
			var j;

			function test (line, edge) {
				var l = size(line);
				var n;
				var distance;
				var overlap;

				if (l < 1e-6) return true;

				n = scale(line, 1 / l);
				distance = dot(t, n);
				overlap = support(a, n) + support(b, n) - Math.abs(distance);

				if (overlap < 0) return false;

				if (edge ? overlap < best * 0.95 - 0.01 : overlap < best) {
					best = overlap;
					normal = distance < 0 ? scale(n, -1) : n;
				}

				return true;
			}

			while (i < 6) {
				if (!test(axes[i], false)) return;

				i++;
			}

			i = 0;

			while (i < 3) {
				j = 3;

				while (j < 6) {
					if (!test(cross(axes[i], axes[j]), true)) return;

					j++;
				}

				i++;
			}

			plane = dot(b.Body.At, normal) + support(b, normal);

			corners(a).forEach(function (corner) {
				var depth = plane - dot(corner, normal);
				if (depth >= 0 && inside(b, corner, 0.01 + best))
					contact(a, b, corner, normal, Math.min(depth, best));
			});

			plane = dot(a.Body.At, normal) - support(a, normal);

			corners(b).forEach(function (corner) {
				var depth = dot(corner, normal) - plane;
				if (depth >= 0 && inside(a, corner, 0.01 + best))
					contact(a, b, corner, normal, Math.min(depth, best));
			});

			/* An edge across an edge: no corner is in, they meet between. */
			if (contacts.length === found)
				contact(a, b, sub(a.Body.At, scale(normal, support(a, normal) - best / 2)), normal, best);
		}

		function collide (a, b) {
			var kinds = a.Body.Shape + '|' + b.Body.Shape;
			var pair;

			if (kinds === 'sphere|sphere') {
				balls(a, a.Body.At, a.Body.Radius, b, b.Body.At, b.Body.Radius);
			}
			else if (kinds === 'sphere|capsule') {
				pair = ends(b);

				balls(a, a.Body.At, a.Body.Radius, b, nearest(pair[0], pair[1], a.Body.At), b.Body.Radius);
			}
			else if (kinds === 'capsule|capsule') {
				pair = between(ends(a)[0], ends(a)[1], ends(b)[0], ends(b)[1]);

				balls(a, pair[0], a.Body.Radius, b, pair[1], b.Body.Radius);
			}
			else if (kinds === 'sphere|box') {
				ballBox(a, a.Body.At, a.Body.Radius, b);
			}
			else if (kinds === 'capsule|box') {
				pair = ends(a);

				[pair[0], pair[1], nearest(pair[0], pair[1], b.Body.At)].forEach(function (point) {
					ballBox(a, point, a.Body.Radius, b);
				});
			}
			else if (kinds === 'box|box') {
				boxes(a, b);
			}
			else if (kinds === 'sphere|prism') {
				ballPrism(a, a.Body.At, a.Body.Radius, b);
			}
			else if (kinds === 'capsule|prism') {
				pair = ends(a);

				[pair[0], pair[1], nearest(pair[0], pair[1], b.Body.At)].forEach(function (point) {
					ballPrism(a, point, a.Body.Radius, b);
				});
			}
			else if (kinds === 'box|prism') {
				boxPrism(a, b);
			}
			else if (kinds === 'sphere|tube') {
				ballTube(a, a.Body.At, a.Body.Radius, b);
			}
			else if (kinds === 'capsule|tube') {
				pair = ends(a);

				[pair[0], pair[1], scale(add(pair[0], pair[1]), 0.5)].forEach(function (point) {
					ballTube(a, point, a.Body.Radius, b);
				});
			}
			else if (kinds === 'box|tube') {
				corners(a).forEach(function (corner) {
					ballTube(a, corner, 0, b);
				});
			}
			else if (kinds !== 'prism|prism' && kinds !== 'tube|tube' && kinds !== 'prism|tube' && kinds !== 'tube|prism') {
				collide(b, a);
			}
		}

		function landing (record, c, r) {
			var n = slope(c[0], c[2]);
			var d = (c[1] - height(c[0], c[2])) * n[1];
			if (d >= r) return;

			contact(record, null, sub(c, scale(n, r)), n, r - d);
		}

		function grounded (record) {
			var body = record.Body;

			if (body.Shape === 'sphere') {
				landing(record, body.At, body.Radius);

				return;
			}

			(body.Shape === 'capsule' ? ends(record) : corners(record)).forEach(function (point) {
				landing(record, point, body.Shape === 'capsule' ? body.Radius : 0);
			});
		}

		/* The bodies whose reach overlaps along x, then along y and z, met by their shapes. */
		function detect () {
			var sorted = records.slice().sort(function (a, b) {
				return a.Body.At[0] - a.Reach - (b.Body.At[0] - b.Reach);
			});
			var i = 0;
			var j;
			var a;
			var b;

			contacts = [];

			while (i < sorted.length) {
				a = sorted[i];

				if (hasGround && free(a))
					grounded(a);

				j = i + 1;

				while (j < sorted.length && sorted[j].Body.At[0] - sorted[j].Reach <= a.Body.At[0] + a.Reach) {
					b = sorted[j];

					if ((free(a) || free(b) || driven(a) && !b.Static || driven(b) && !a.Static) && !(a.Body.Group && a.Body.Group === b.Body.Group) && Math.abs(a.Body.At[1] - b.Body.At[1]) <= a.Reach + b.Reach && Math.abs(a.Body.At[2] - b.Body.At[2]) <= a.Reach + b.Reach)
						collide(a, b);

					j++;
				}

				i++;
			}
		}

		/* What the solver keeps of a contact: where it presses on each body, how hard it is to move there, and how fast it must part. */
		function ready (item, elapsed) {
			var a = item.A;
			var b = item.B;
			var n = item.Normal;
			var t1 = unit(Math.abs(n[0]) > 0.57 ? [n[1], -n[0], 0] : [0, n[2], -n[1]]);
			var parting;
			var bounce;

			item.RA = sub(item.Point, a.Body.At);
			item.RB = b ? sub(item.Point, b.Body.At) : [0, 0, 0];
			item.Tangents = [t1, cross(n, t1)];
			item.Firm = stiffness(a, b, item.RA, item.RB, n);
			item.Slide = [stiffness(a, b, item.RA, item.RB, item.Tangents[0]), stiffness(a, b, item.RA, item.RB, item.Tangents[1])];
			item.Friction = Math.sqrt(number(a.Body.Friction, 0.5) * (b ? number(b.Body.Friction, 0.5) : groundFriction));
			item.Rolling = Math.max(number(a.Body.Rolling, 0.03), b ? number(b.Body.Rolling, 0.03) : groundRolling) * Math.min(a.Reach, b ? b.Reach : a.Reach);
			item.Rolled = 0;

			parting = dot(sub(velocity(a, item.RA), velocity(b, item.RB)), n);
			bounce = Math.max(number(a.Body.Bounce, 0.2), b ? number(b.Body.Bounce, 0.2) : groundBounce);

			item.Bias = Math.max(parting < -1 ? -bounce * parting : 0, 0.2 / elapsed * Math.max(0, item.Depth - 0.005));
		}

		/* A contact solved once more (of numbers: it runs for each contact as many times as the iterations, each step). */
		function solve (item) {
			var a = item.A;
			var b = item.B;
			var n = item.Normal;
			var amount = (item.Bias - closing(item, n)) * item.Firm;
			var total = Math.max(0, item.Pressed + amount);
			var limit;
			var spin;
			var sx;
			var sy;
			var sz;
			var t;
			var i = 0;

			amount = total - item.Pressed;
			item.Pressed = total;

			pushed(a, n[0] * amount, n[1] * amount, n[2] * amount, item.RA);
			pushed(b, -n[0] * amount, -n[1] * amount, -n[2] * amount, item.RB);

			limit = item.Friction * item.Pressed;

			while (i < 2) {
				t = item.Tangents[i];
				amount = -closing(item, t) * item.Slide[i];
				total = Math.max(-limit, Math.min(limit, item.Slid[i] + amount));
				amount = total - item.Slid[i];
				item.Slid[i] = total;

				pushed(a, t[0] * amount, t[1] * amount, t[2] * amount, item.RA);
				pushed(b, -t[0] * amount, -t[1] * amount, -t[2] * amount, item.RB);

				i++;
			}

			/* What holds back rolling: the spin of one on the other is slowed, as far as the press allows. */
			spin = a.Body.Spin;
			sx = spin[0] - (b ? b.Body.Spin[0] : 0);
			sy = spin[1] - (b ? b.Body.Spin[1] : 0);
			sz = spin[2] - (b ? b.Body.Spin[2] : 0);
			amount = Math.sqrt(sx * sx + sy * sy + sz * sz);

			if (amount < 1e-9) return;

			sx /= amount;
			sy /= amount;
			sz /= amount;
			limit = 0;

			if (free(a)) {
				turned(a, sx, sy, sz, twist);

				limit += sx * twist[0] + sy * twist[1] + sz * twist[2];
			}

			if (free(b)) {
				turned(b, sx, sy, sz, twist);

				limit += sx * twist[0] + sy * twist[1] + sz * twist[2];
			}

			if (limit < 1e-12) return;

			total = Math.min(item.Rolling * item.Pressed, item.Rolled + amount / limit);
			amount = total - item.Rolled;
			item.Rolled = total;

			if (amount <= 0) return;

			if (free(a)) {
				turned(a, sx * amount, sy * amount, sz * amount, twist);

				spin = a.Body.Spin;
				a.Body.Spin = [spin[0] - twist[0], spin[1] - twist[1], spin[2] - twist[2]];
			}

			if (free(b)) {
				turned(b, sx * amount, sy * amount, sz * amount, twist);

				spin = b.Body.Spin;
				b.Body.Spin = [spin[0] + twist[0], spin[1] + twist[1], spin[2] + twist[2]];
			}
		}

		function anchor (record, point) {
			return record ? add(record.Body.At, apply(record.Matrix, point)) : point;
		}

		/* A joint holds two points at a length: a rod, or a rope that only pulls; at length 0 the points are one (a ball joint). */
		function hold (joint, elapsed) {
			var a = joint.A;
			var b = joint.B;
			var pa = anchor(a, joint.From);
			var pb = anchor(b, joint.To);
			var ra = sub(pa, a.Body.At);
			var rb = b ? sub(pb, b.Body.At) : [0, 0, 0];
			var d = sub(pb, pa);
			var distance = size(d);
			var lines = joint.Length > 0 ? [distance > 1e-9 ? scale(d, 1 / distance) : [0, 1, 0]] : [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

			lines.forEach(function (n) {
				var error = joint.Length > 0 ? distance - joint.Length : dot(d, n);
				var moving = dot(sub(velocity(b, rb), velocity(a, ra)), n);
				var amount = -(moving + 0.2 / elapsed * error) * stiffness(a, b, ra, rb, n);
				if (joint.Rope && (error <= 0 || amount > 0)) return;

				impulse(b, scale(n, amount), rb);
				impulse(a, scale(n, -amount), ra);
			});
		}

		function find (body) {
			var i = 0;

			while (i < records.length) {
				if (records[i].Body === body) return records[i];

				i++;
			}

			return null;
		}

		function level (x, z) {
			return typeof water.Level === 'function' ? number(water.Level(x, z), 0) : number(water.Level, 0);
		}

		function volume (body) {
			var r = body.Radius;

			if (body.Shape === 'box')
				return body.Size[0] * body.Size[1] * body.Size[2];

			if (body.Shape === 'capsule')
				return Math.PI * r * r * body.Height + 4 / 3 * Math.PI * r * r * r;

			return 4 / 3 * Math.PI * r * r * r;
		}

		/* The pieces a body floats by, each with how far it reaches up and down: a box by its eight corners, so it rights itself. */
		function pieces (record) {
			var body = record.Body;
			var m = record.Matrix;
			var h = record.Half;
			var u = axis(m, 1);
			var quarter = body.Height / 4;
			var result = [];
			var i = 0;

			if (body.Shape === 'sphere')
				return [{At: body.At, Half: body.Radius, Share: 1}];

			if (body.Shape === 'capsule') {
				return [-1, 1].map(function (side) {
					return {At: add(body.At, scale(u, side * quarter)), Half: body.Radius + quarter * Math.abs(u[1]), Share: 0.5};
				});
			}

			while (i < 8) {
				result.push({At: add(body.At, apply(m, [i & 1 ? h[0] / 2 : -h[0] / 2, i & 2 ? h[1] / 2 : -h[1] / 2, i & 4 ? h[2] / 2 : -h[2] / 2])), Half: (h[0] * Math.abs(m[3]) + h[1] * Math.abs(m[4]) + h[2] * Math.abs(m[5])) / 2, Share: 0.125});

				i++;
			}

			return result;
		}

		/* What is under water is pushed up by the water it puts aside, and slowed by it. */
		function float (record, elapsed) {
			var body = record.Body;
			var whole = volume(body);
			var mass = 1 / record.Mass;
			var weight = size(gravity);

			pieces(record).forEach(function (piece) {
				var under = Math.max(0, Math.min(1, (level(piece.At[0], piece.At[2]) - (piece.At[1] - piece.Half)) / (2 * piece.Half)));
				var r;

				if (!under) return;

				r = sub(piece.At, body.At);

				impulse(record, [0, water.Density * whole * piece.Share * under * weight * elapsed, 0], r);
				impulse(record, scale(velocity(record, r), -Math.min(1, water.Drag * elapsed) * mass * piece.Share * under), r);
			});
		}

		/* Moved by its way and its spin; still a while, it sleeps. */
		function move (record, elapsed) {
			var body = record.Body;
			var w = body.Spin;
			var q = body.Turn;
			var turned = [q[0] + 0.5 * elapsed * (w[0] * q[3] + w[1] * q[2] - w[2] * q[1]), q[1] + 0.5 * elapsed * (w[1] * q[3] - w[0] * q[2] + w[2] * q[0]), q[2] + 0.5 * elapsed * (w[2] * q[3] + w[0] * q[1] - w[1] * q[0]), q[3] - 0.5 * elapsed * (w[0] * q[0] + w[1] * q[1] + w[2] * q[2])];
			var l = Math.sqrt(turned[0] * turned[0] + turned[1] * turned[1] + turned[2] * turned[2] + turned[3] * turned[3]);
			var moving;

			body.Was = body.At;
			body.WasTurn = body.Turn;
			body.At = add(body.At, scale(body.Way, elapsed));
			body.Turn = turned.map(function (value) {
				return value / l;
			});
			record.Matrix = matrix(body.Turn);

			if (!sleeps) return;

			moving = dot(body.Way, body.Way) + dot(body.Spin, body.Spin) * record.Reach * record.Reach;
			record.Still = moving < 0.01 ? record.Still + elapsed : 0;

			if (record.Still > 0.6) {
				body.Sleeping = true;
				body.Way = [0, 0, 0];
				body.Spin = [0, 0, 0];
				body.Was = body.At;
				body.WasTurn = body.Turn;
			}
		}

		function step (elapsed) {
			var i = 0;

			joints.forEach(function (joint) {
				if (free(joint.A) || free(joint.B)) {
					wake(joint.A);
					wake(joint.B);
				}
			});

			records.forEach(function (record) {
				var body = record.Body;

				if (!free(record)) return;

				body.Way = scale(add(body.Way, scale(gravity, elapsed * number(body.Gravity, 1))), 1 / (1 + elapsed * number(body.Damping, 0.05)));
				body.Spin = scale(body.Spin, 1 / (1 + elapsed * number(body.Angular, 0.1)));
			});

			if (water) {
				records.forEach(function (record) {
					if (free(record))
						float(record, elapsed);
				});
			}

			detect();

			/* A body that strikes a sleeping one wakes it; one that only rests on it leaves it asleep. */
			contacts.forEach(function (item) {
				if (item.B && (item.A.Body.Sleeping || item.B.Body.Sleeping) && size(sub(velocity(item.A, sub(item.Point, item.A.Body.At)), velocity(item.B, sub(item.Point, item.B.Body.At)))) > 0.3) {
					wake(item.A);
					wake(item.B);
				}
			});

			contacts.forEach(function (item) {
				ready(item, elapsed);
			});

			/* Its own arrays for the way and the spin of each free body while it is solved: changed in their place, never one it was given. */
			records.forEach(function (record) {
				var body = record.Body;

				if (!free(record)) return;

				body.Way = [body.Way[0], body.Way[1], body.Way[2]];
				body.Spin = [body.Spin[0], body.Spin[1], body.Spin[2]];
				record.Solving = true;
			});

			while (i < iterations) {
				contacts.forEach(solve);

				joints.forEach(function (joint) {
					hold(joint, elapsed);
				});

				i++;
			}

			records.forEach(function (record) {
				record.Solving = false;
			});

			records.forEach(function (record) {
				if (free(record))
					move(record, elapsed);
			});

			touched();
		}

		/* Told once, when two begin to touch, with how hard they met; asleep on each other they still touch. */
		function touched () {
			var now = {};

			Object.keys(touching).forEach(function (key) {
				if (!free(touching[key].Records[0]) && !free(touching[key].Records[1]))
					now[key] = touching[key];
			});

			contacts.forEach(function (item) {
				var key = item.A.Key + '|' + (item.B ? item.B.Key : 'ground');
				if (!now[key] || now[key] === touching[key])
					now[key] = {Records: [item.A, item.B], A: item.A.Body, B: item.B ? item.B.Body : null, At: item.Point, Normal: item.Normal, Impulse: 0};

				now[key].Impulse += item.Pressed;
			});

			if (typeof options.Touch === 'function') {
				Object.keys(now).forEach(function (key) {
					if (!touching[key])
						options.Touch(now[key].A, now[key].B, {At: now[key].At, Normal: now[key].Normal, Impulse: now[key].Impulse});
				});
			}

			touching = now;
		}

		/* How far along a ray a ball is met: 0 from inside, -1 when it is not. */
		function hitBall (from, direction, c, r) {
			var o = sub(from, c);
			var b = dot(o, direction);
			var k = dot(o, o) - r * r;
			var disc = b * b - k;

			if (k <= 0) return 0;
			if (disc < 0 || -b - Math.sqrt(disc) < 0) return -1;

			return -b - Math.sqrt(disc);
		}

		function castBall (record, from, direction) {
			var t = hitBall(from, direction, record.Body.At, record.Body.Radius);

			return {Distance: t, Normal: t === 0 ? scale(direction, -1) : unit(sub(add(from, scale(direction, t)), record.Body.At))};
		}

		/* A capsule: the balls at its ends, then the side between them. */
		function castCapsule (record, from, direction) {
			var r = record.Body.Radius;
			var pair = ends(record);
			var u = axis(record.Matrix, 1);
			var o = sub(from, pair[0]);
			var d = sub(direction, scale(u, dot(direction, u)));
			var p = sub(o, scale(u, dot(o, u)));
			var qa = dot(d, d);
			var qb = 2 * dot(p, d);
			var disc = qb * qb - 4 * qa * (dot(p, p) - r * r);
			var best = {Distance: -1};
			var t;
			var along;

			pair.forEach(function (end) {
				var hit = hitBall(from, direction, end, r);
				if (hit >= 0 && (best.Distance < 0 || hit < best.Distance))
					best = {Distance: hit, Normal: hit === 0 ? scale(direction, -1) : unit(sub(add(from, scale(direction, hit)), end))};
			});

			if (qa < 1e-12 || disc < 0) return best;

			t = (-qb - Math.sqrt(disc)) / (2 * qa);
			along = dot(sub(add(from, scale(direction, t)), pair[0]), u);

			if (t >= 0 && along >= 0 && along <= record.Body.Height && (best.Distance < 0 || t < best.Distance))
				best = {Distance: t, Normal: unit(sub(add(from, scale(direction, t)), add(pair[0], scale(u, along))))};

			return best;
		}

		/* A box: the ray in the box's own axes, through its three slabs. */
		function castBox (record, from, direction) {
			var m = record.Matrix;
			var h = record.Half;
			var o = local(m, sub(from, record.Body.At));
			var d = local(m, direction);
			var near = -Infinity;
			var far = Infinity;
			var normal = [0, 0, 0];
			var side = 0;
			var sign = 1;
			var i = 0;
			var t1;
			var t2;

			while (i < 3) {
				if (Math.abs(d[i]) < 1e-12) {
					if (Math.abs(o[i]) > h[i]) return {Distance: -1};
				}
				else {
					t1 = (-h[i] - o[i]) / d[i];
					t2 = (h[i] - o[i]) / d[i];

					if (Math.min(t1, t2) > near) {
						near = Math.min(t1, t2);
						side = i;
						sign = d[i] > 0 ? -1 : 1;
					}

					far = Math.min(far, Math.max(t1, t2));
				}

				i++;
			}

			if (near > far || far < 0) return {Distance: -1};

			if (near < 0)
				return {Distance: 0, Normal: scale(direction, -1)};

			normal[side] = sign;

			return {Distance: near, Normal: apply(m, normal)};
		}

		/* The ground under a ray: walked in strides, then halved down to where it meets. */
		function castGround (from, direction, max) {
			var stride = Math.max(0.05, Math.min(0.5, max / 200));
			var low = 0;
			var high;
			var t = 0;
			var i = 0;

			function above (at) {
				var point = add(from, scale(direction, at));

				return point[1] - height(point[0], point[2]);
			}

			if (above(0) <= 0) return 0;

			while (t < max) {
				t = Math.min(max, t + stride);

				if (above(t) <= 0) break;

				low = t;
			}

			if (above(t) > 0) return -1;

			high = t;

			while (i < 20) {
				t = (low + high) / 2;

				if (above(t) > 0) low = t;
				else high = t;

				i++;
			}

			return high;
		}

		api = {
			Add: function (body) {
				var record = {Body: body, Key: next, Still: 0, Solving: false};

				body.ID = body.ID === undefined ? 'body' + next : body.ID;
				body.Shape = body.Shape === 'box' || body.Shape === 'capsule' || body.Shape === 'prism' || body.Shape === 'tube' ? body.Shape : 'sphere';
				body.Radius = number(body.Radius, 0.5);
				body.Size = Array.isArray(body.Size) ? body.Size : [1, 1, 1];
				body.Height = number(body.Height, 1);
				body.At = Array.isArray(body.At) ? body.At : [0, 0, 0];
				body.Turn = Array.isArray(body.Turn) ? body.Turn : [0, 0, 0, 1];
				body.Way = Array.isArray(body.Way) ? body.Way : [0, 0, 0];
				body.Spin = Array.isArray(body.Spin) ? body.Spin : [0, 0, 0];
				body.Sleeping = body.Sleeping === true;
				next++;

				refresh(record);

				records.push(record);

				return body;
			},
			Remove: function (body) {
				var record = find(body);
				if (!record)
					return false;

				records.splice(records.indexOf(record), 1);

				joints = joints.filter(function (joint) {
					return joint.A !== record && joint.B !== record;
				});

				return true;
			},
			Bodies: function () {
				return records.map(function (record) {
					return record.Body;
				});
			},
			Step: function (elapsed) {
				records.forEach(refresh);

				return self.Steps(clock, Math.min(0.25, Math.max(0, number(elapsed, 0))), length, step);
			},
			Push: function (body, push, at) {
				var record = find(body);
				if (!record) return;

				wake(record);

				refresh(record);

				impulse(record, push, at ? sub(at, body.At) : [0, 0, 0]);
			},
			Wake: function (body) {
				wake(find(body));
			},
			Joint: function (a, b, settings) {
				var given = settings || {};
				var first = find(a);
				var second = b ? find(b) : null;
				var from = given.At || given.From || a.At;
				var to = given.At || given.To || (b ? b.At : from);
				var joint;

				if (!first)
					throw new Error('Physics World Joint: the body is not in the world');

				refresh(first);

				if (second)
					refresh(second);

				joint = {A: first, B: second, From: local(first.Matrix, sub(from, a.At)), To: second ? local(second.Matrix, sub(to, b.At)) : to.slice(), Length: number(given.Length, size(sub(to, from))), Rope: given.Rope === true};

				joints.push(joint);

				return {
					Remove: function () {
						joints = joints.filter(function (item) {
							return item !== joint;
						});
					}
				};
			},
			Ray: function (from, direction, max, filter) {
				var way = unit(direction);
				var limit = number(max, 1000);
				var best = null;
				var t;

				records.forEach(function (record) {
					var shape = record.Body.Shape;
					var hit;

					if (typeof filter === 'function' && !filter(record.Body)) return;

					hit = shape === 'box' ? castBox(record, from, way) : shape === 'capsule' ? castCapsule(record, from, way) : shape === 'prism' ? castPrism(record, from, way) : shape === 'tube' ? castTube(record, from, way) : castBall(record, from, way);

					if (hit.Distance >= 0 && hit.Distance <= limit && (!best || hit.Distance < best.Distance))
						best = {Body: record.Body, At: add(from, scale(way, hit.Distance)), Normal: hit.Normal, Distance: hit.Distance};
				});

				if (hasGround && (typeof filter !== 'function' || filter(null))) {
					t = castGround(from, way, best ? best.Distance : limit);

					if (t >= 0 && (!best || t < best.Distance))
						best = {Body: null, At: add(from, scale(way, t)), Normal: slope(from[0] + way[0] * t, from[2] + way[2] * t), Distance: t};
				}

				return best;
			},
			Contacts: function () {
				return contacts.map(function (item) {
					return {A: item.A.Body, B: item.B ? item.B.Body : null, At: item.Point, Normal: item.Normal, Depth: item.Depth, Impulse: item.Pressed};
				});
			},
			Clear: function () {
				records = [];
				joints = [];
				contacts = [];
				touching = {};
			},
			/* A body of a person, eleven parts on ball joints that do not strike one another: it falls as one that has let go. */
			Ragdoll: function (at, settings) {
				var given = settings || {};
				var s = number(given.Height, 1.8) / 1.8;
				var mass = number(given.Mass, 70);
				var group = given.Group || 'ragdoll' + next;
				var parts = {};
				var made = [];

				function part (name, shape, x, y, radius, height, share) {
					parts[name] = api.Add({ID: name + next, Shape: shape, Radius: radius * s, Height: height * s, Mass: mass * share, At: [at[0] + x * s, at[1] + y * s, at[2]], Group: group, Friction: 0.7, Bounce: 0.05});

					made.push(parts[name]);
				}

				function joint (a, b, x, y) {
					api.Joint(parts[a], parts[b], {At: [at[0] + x * s, at[1] + y * s, at[2]], Length: 0});
				}

				part('Head', 'sphere', 0, 1.65, 0.11, 0, 0.08);
				part('Chest', 'capsule', 0, 1.32, 0.14, 0.25, 0.3);
				part('Hips', 'capsule', 0, 0.98, 0.13, 0.1, 0.15);

				[['Left', 1], ['Right', -1]].forEach(function (side) {
					part('Thigh' + side[0], 'capsule', side[1] * 0.1, 0.68, 0.07, 0.3, 0.1);
					part('Shin' + side[0], 'capsule', side[1] * 0.1, 0.25, 0.055, 0.32, 0.05);
					part('Arm' + side[0], 'capsule', side[1] * 0.25, 1.33, 0.05, 0.22, 0.03);
					part('Forearm' + side[0], 'capsule', side[1] * 0.25, 1.0, 0.045, 0.22, 0.025);
				});

				joint('Head', 'Chest', 0, 1.53);
				joint('Chest', 'Hips', 0, 1.1);

				[['Left', 1], ['Right', -1]].forEach(function (side) {
					joint('Hips', 'Thigh' + side[0], side[1] * 0.1, 0.88);
					joint('Thigh' + side[0], 'Shin' + side[0], side[1] * 0.1, 0.47);
					joint('Chest', 'Arm' + side[0], side[1] * 0.25, 1.46);
					joint('Arm' + side[0], 'Forearm' + side[0], side[1] * 0.25, 1.165);
				});

				return {
					Parts: parts,
					Remove: function () {
						made.forEach(api.Remove);
					}
				};
			}
		};

		return api;
	},

	/*
	 * Cloth: a grid of points, each held to its neighbours at their distance, moved as they were moved (Verlet) and pulled
	 * straight many times a step. It hangs where it is pinned, blows in the wind and lies over balls and the ground.
	 */
	Cloth: function (settings) {
		var self = this;
		var options = settings || {};
		var number = this.Number;
		var columns = Math.max(1, Math.round(number(options.Columns, 10)));
		var rows = Math.max(2, Math.round(number(options.Rows, 10)));
		var spacing = number(options.Spacing, 0.1);
		var origin = options.At || [0, 0, 0];
		var across = options.Across || [1, 0, 0];
		var down = options.Down || [0, -1, 0];
		var gravity = Array.isArray(options.Gravity) ? options.Gravity.slice() : [0, -number(options.Gravity, self.Gravity), 0];
		var iterations = Math.max(1, Math.round(number(options.Iterations, 12)));
		var damping = number(options.Damping, 0.01);
		var ground = options.Ground === undefined ? null : options.Ground;
		var wind = Array.isArray(options.Wind) ? options.Wind.slice() : [0, 0, 0];
		var clock = {};
		var points = [];
		var last = [];
		var pinned = [];
		var links = [];
		var row;
		var column;

		function index (c, r) {
			return r * columns + c;
		}

		function link (a, b) {
			var d = [points[b][0] - points[a][0], points[b][1] - points[a][1], points[b][2] - points[a][2]];

			links.push([a, b, Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2])]);
		}

		function height (x, z) {
			return typeof ground === 'function' ? number(ground(x, z), 0) : number(ground, 0);
		}

		for (row = 0; row < rows; row++) {
			for (column = 0; column < columns; column++) {
				points.push([origin[0] + (across[0] * column + down[0] * row) * spacing, origin[1] + (across[1] * column + down[1] * row) * spacing, origin[2] + (across[2] * column + down[2] * row) * spacing]);
				last.push(points[points.length - 1].slice());
				pinned.push(false);
			}
		}

		for (row = 0; row < rows; row++) {
			for (column = 0; column < columns; column++) {
				if (column + 1 < columns)
					link(index(column, row), index(column + 1, row));

				if (row + 1 < rows)
					link(index(column, row), index(column, row + 1));

				if (options.Shear !== false && column + 1 < columns && row + 1 < rows) {
					link(index(column, row), index(column + 1, row + 1));
					link(index(column + 1, row), index(column, row + 1));
				}

				if (options.Bend === true && column + 2 < columns)
					link(index(column, row), index(column + 2, row));

				if (options.Bend === true && row + 2 < rows)
					link(index(column, row), index(column, row + 2));
			}
		}

		/* Pinned: top (the first row, by default), ends (the first and the last), corners (of the first row), none, or a list of indices. */
		(Array.isArray(options.Pinned) ? options.Pinned : options.Pinned === 'none' ? [] : options.Pinned === 'ends' ? [0, points.length - 1] : options.Pinned === 'corners' ? [0, columns - 1] : points.slice(0, columns).map(function (point, i) {
			return i;
		})).forEach(function (i) {
			pinned[i] = true;
		});

		function step (elapsed) {
			var colliders = options.Colliders || [];
			var pull = [(gravity[0] + wind[0]) * elapsed * elapsed, (gravity[1] + wind[1]) * elapsed * elapsed, (gravity[2] + wind[2]) * elapsed * elapsed];
			var i = 0;
			var j;
			var p;
			var was;
			var x;
			var y;
			var z;
			var k;

			while (i < points.length) {
				if (!pinned[i]) {
					p = points[i];
					was = last[i];
					x = p[0];
					y = p[1];
					z = p[2];
					p[0] += (x - was[0]) * (1 - damping) + pull[0];
					p[1] += (y - was[1]) * (1 - damping) + pull[1];
					p[2] += (z - was[2]) * (1 - damping) + pull[2];
					was[0] = x;
					was[1] = y;
					was[2] = z;
				}

				i++;
			}

			/* Each link held at its length, of numbers (a step went through all of them ten times, each making an array). */
			for (j = 0; j < iterations; j++) {
				for (k = 0; k < links.length; k++) {
					var item = links[k];
					var a = points[item[0]];
					var b = points[item[1]];
					var wa = pinned[item[0]] ? 0 : 1;
					var wb = pinned[item[1]] ? 0 : 1;
					var dx = b[0] - a[0];
					var dy = b[1] - a[1];
					var dz = b[2] - a[2];
					var l = Math.sqrt(dx * dx + dy * dy + dz * dz);
					var part;

					if (l < 1e-9 || wa + wb === 0) continue;

					part = (l - item[2]) / l / (wa + wb);

					a[0] += dx * part * wa;
					a[1] += dy * part * wa;
					a[2] += dz * part * wa;
					b[0] -= dx * part * wb;
					b[1] -= dy * part * wb;
					b[2] -= dz * part * wb;
				}
			}

			/* Out of the balls and over the ground; on the ground it drags. */
			points.forEach(function (point, k) {
				var floor;

				if (pinned[k]) return;

				colliders.forEach(function (ball) {
					var d = [point[0] - ball.At[0], point[1] - ball.At[1], point[2] - ball.At[2]];
					var l = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
					var r = number(ball.Radius, 0.5) + spacing * 0.1;
					if (l >= r || l < 1e-9) return;

					point[0] = ball.At[0] + d[0] / l * r;
					point[1] = ball.At[1] + d[1] / l * r;
					point[2] = ball.At[2] + d[2] / l * r;

					/* It drags on the ball as on the ground, so it lies over it and does not slide off. */
					last[k][0] += (point[0] - last[k][0]) * 0.5;
					last[k][1] += (point[1] - last[k][1]) * 0.5;
					last[k][2] += (point[2] - last[k][2]) * 0.5;
				});

				if (ground === null || ground === false) return;

				floor = height(point[0], point[2]) + spacing * 0.1;

				if (point[1] < floor) {
					point[1] = floor;
					last[k][0] += (point[0] - last[k][0]) * 0.5;
					last[k][2] += (point[2] - last[k][2]) * 0.5;
				}
			});
		}

		return {
			Columns: columns,
			Rows: rows,
			Points: points,
			Links: links,
			Index: index,
			Step: function (elapsed) {
				return self.Steps(clock, Math.min(0.25, Math.max(0, number(elapsed, 0))), 1 / 120, step);
			},
			Pin: function (i, at) {
				pinned[i] = true;

				if (at) {
					points[i] = at.slice();
					last[i] = at.slice();
				}
			},
			Release: function (i) {
				pinned[i] = false;
			},
			Blow: function (way) {
				wind = way.slice();
			}
		};
	},

	/* A rope: a cloth one point wide, from a point to another, held at its start (Pinned: start, ends, none or a list). */
	Rope: function (settings) {
		var given = settings || {};
		var from = given.From || [0, 0, 0];
		var to = given.To || [0, -1, 0];
		var segments = Math.max(1, Math.round(this.Number(given.Segments, 20)));
		var d = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
		var l = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]) || 1;

		return this.Cloth(Object.assign({}, given, {Columns: 1, Rows: segments + 1, At: from, Down: [d[0] / l, d[1] / l, d[2] / l], Spacing: l / segments, Shear: false, Pinned: given.Pinned === 'start' || given.Pinned === undefined ? [0] : given.Pinned}));
	},

	/*
	 * Waves: the face of water on a grid of heights, each pulled to its neighbours (the wave equation), so what falls in sends
	 * rings out, they run off the shores and die away.
	 */
	Waves: function (settings) {
		var self = this;
		var options = settings || {};
		var number = this.Number;
		var columns = Math.max(3, Math.round(number(options.Columns, 64)));
		var rows = Math.max(3, Math.round(number(options.Rows, 64)));
		var cell = number(options.Cell, 1);
		var speed = number(options.Speed, 4);
		var damping = number(options.Damping, 0.3);
		var origin = options.At || [0, 0];
		var heights = new Float32Array(columns * rows);
		var rises = new Float32Array(columns * rows);
		var clock = {};

		function at (c, r) {
			return Math.max(0, Math.min(rows - 1, r)) * columns + Math.max(0, Math.min(columns - 1, c));
		}

		function step (elapsed) {
			var pull = speed * speed / (cell * cell) * elapsed;
			var keep = Math.max(0, 1 - damping * elapsed);
			var r;
			var c;
			var i;

			for (r = 0; r < rows; r++) {
				for (c = 0; c < columns; c++) {
					i = r * columns + c;
					rises[i] = (rises[i] + (heights[at(c - 1, r)] + heights[at(c + 1, r)] + heights[at(c, r - 1)] + heights[at(c, r + 1)] - 4 * heights[i]) * pull) * keep;
				}
			}

			for (i = 0; i < heights.length; i++)
				heights[i] += rises[i] * elapsed;
		}

		return {
			Columns: columns,
			Rows: rows,
			Heights: heights,
			/* Steps short enough for the waves never to outrun a cell. */
			Step: function (elapsed) {
				return self.Steps(clock, Math.min(0.25, Math.max(0, number(elapsed, 0))), Math.min(1 / 60, cell / speed * 0.4), step);
			},
			Disturb: function (x, z, amount, radius) {
				var reach = Math.max(cell, number(radius, cell));
				var r;
				var c;
				var d;

				for (r = 0; r < rows; r++) {
					for (c = 0; c < columns; c++) {
						d = Math.hypot(origin[0] + c * cell - x, origin[1] + r * cell - z);

						if (d < reach)
							heights[r * columns + c] += number(amount, 0.5) * 0.5 * (1 + Math.cos(Math.PI * d / reach));
					}
				}
			},
			Height: function (x, z) {
				var fx = Math.max(0, Math.min(columns - 1, (x - origin[0]) / cell));
				var fz = Math.max(0, Math.min(rows - 1, (z - origin[1]) / cell));
				var c = Math.min(columns - 2, Math.floor(fx));
				var r = Math.min(rows - 2, Math.floor(fz));
				var tx = fx - c;
				var tz = fz - r;

				return (heights[at(c, r)] * (1 - tx) + heights[at(c + 1, r)] * tx) * (1 - tz) + (heights[at(c, r + 1)] * (1 - tx) + heights[at(c + 1, r + 1)] * tx) * tz;
			}
		};
	},

	/*
	 * Fluid: water as particles (smoothed particle hydrodynamics): each is pressed by those near it as much as they crowd it
	 * past the density of the water, and takes on some of their way, so a block of them falls, spreads and settles in its box.
	 */
	Fluid: function (settings) {
		var self = this;
		var options = settings || {};
		var number = this.Number;
		var h = number(options.Radius, 0.2);
		var rest = number(options.Density, 1000);
		var stiffness = number(options.Stiffness, 0.05);
		var closeness = number(options.Near, 0.2);
		var viscosity = number(options.Viscosity, 2);
		var gravity = Array.isArray(options.Gravity) ? options.Gravity.slice() : [0, -number(options.Gravity, self.Gravity), 0];
		var min = options.Min || [-2, 0, -2];
		var max = options.Max || [2, 4, 2];
		var ground = options.Ground === undefined || options.Ground === null ? null : options.Ground;
		var friction = number(options.Friction, 0.3);
		var length = number(options.Step, 1 / 120);
		var fastest = number(options.MaxSpeed, Infinity);

		function groundAt (x, z) {
			return typeof ground === 'function' ? ground(x, z) : ground;
		}

		var crowd = 0;
		var clock = {};
		var particles = [];
		var x;
		var y;
		var z;

		/* How crowded water at rest is: its particles half a reach apart. */
		for (x = -2; x <= 2; x++) {
			for (y = -2; y <= 2; y++) {
				for (z = -2; z <= 2; z++) {
					if (x || y || z)
						crowd += Math.pow(Math.max(0, 1 - Math.sqrt(x * x + y * y + z * z) / 2), 2);
				}
			}
		}

		/* A cell of the grid as one number (cells far apart may share one: they are only looked through, never trusted). */
		function key (x, y, z) {
			return (x * 73856093 ^ y * 19349663 ^ z * 83492791) | 0;
		}

		/*
		 * The particles within reach of each, after it (each pair once): a grid of cells the size of the reach, hashed into a
		 * table of numbers (twice as many places as particles; cells that meet in a place are only looked through, never trusted),
		 * the particles of each place one after the other in a list of numbers. Kept from step to step: nothing made but as the
		 * water grows.
		 */
		var table = {Size: 0, Start: null, Count: null, Order: null, Cell: null};

		function neighbours () {
			var count = particles.length;
			var size = 16;
			var mask;
			var i;
			var at;

			while (size < count * 2)
				size *= 2;

			if (table.Size !== size) {
				table.Size = size;
				table.Start = new Int32Array(size + 1);
				table.Count = new Int32Array(size);
			}

			if (!table.Order || table.Order.length < count) {
				table.Order = new Int32Array(Math.max(16, count * 2));
				table.Cell = new Int32Array(Math.max(16, count * 2));
			}

			mask = size - 1;

			table.Count.fill(0);

			for (i = 0; i < count; i++) {
				var p = particles[i];

				p.Cx = Math.floor(p.At[0] / h);
				p.Cy = Math.floor(p.At[1] / h);
				p.Cz = Math.floor(p.At[2] / h);
				at = key(p.Cx, p.Cy, p.Cz) & mask;
				table.Cell[i] = at;
				table.Count[at]++;
			}

			table.Start[0] = 0;

			for (i = 0; i < size; i++)
				table.Start[i + 1] = table.Start[i] + table.Count[i];

			table.Count.fill(0);

			for (i = 0; i < count; i++) {
				at = table.Cell[i];
				table.Order[table.Start[at] + table.Count[at]] = i;
				table.Count[at]++;
			}

			for (i = 0; i < count; i++) {
				var q = particles[i];
				var near = q.Near;
				var x;
				var y;
				var z;
				var k;
				var last;
				var seen = [];

				near.length = 0;

				for (x = q.Cx - 1; x <= q.Cx + 1; x++) {
					for (y = q.Cy - 1; y <= q.Cy + 1; y++) {
						for (z = q.Cz - 1; z <= q.Cz + 1; z++) {
							at = key(x, y, z) & mask;

							/* Two cells of one place: it is looked through once. */
							if (seen.indexOf(at) >= 0) continue;

							seen.push(at);

							last = table.Start[at + 1];

							for (k = table.Start[at]; k < last; k++) {
								if (table.Order[k] > i)
									near.push(table.Order[k]);
							}
						}
					}
				}
			}
		}

		/*
		 * Each pair near enough once, in its order: kind 0 slows them against each other (the viscosity), 1 counts how crowded
		 * each is, 2 pushes them apart. Of numbers alone, no array made for a pair (three runs of every pair a step made them in
		 * millions). n: the line from the first to the second, near: 1 - r / h.
		 */
		function pairs (kind, elapsed) {
			var count = particles.length;
			var reach = h * h;
			var i;
			var k;

			for (i = 0; i < count; i++) {
				var p = particles[i];
				var near = p.Near;
				var pa = p.At;

				for (k = 0; k < near.length; k++) {
					var q = particles[near[k]];
					var qa = q.At;
					var dx = qa[0] - pa[0];
					var dy = qa[1] - pa[1];
					var dz = qa[2] - pa[2];
					var r2 = dx * dx + dy * dy + dz * dz;
					var r;
					var s;
					var close;
					var u;
					var slow;
					var press;

					/* Past the reach: no root taken. */
					if (r2 >= reach) continue;

					r = Math.sqrt(r2);

					/* Two in one place are set apart along a line of their own. */
					if (r < 1e-9) {
						dx = Math.cos(i);
						dy = 0.5;
						dz = Math.sin(i);
						r = 1e-9;
					}

					s = Math.max(r, 1e-6);
					dx /= s;
					dy /= s;
					dz /= s;
					close = 1 - r / h;

					if (kind === 0) {
						u = (p.Way[0] - q.Way[0]) * dx + (p.Way[1] - q.Way[1]) * dy + (p.Way[2] - q.Way[2]) * dz;

						if (u <= 0) continue;

						slow = elapsed * close * (viscosity * u + 0.3 * u * u) / 2;
						slow = Math.min(slow, u / 2);
						p.Way[0] -= dx * slow;
						q.Way[0] += dx * slow;
						p.Way[1] -= dy * slow;
						q.Way[1] += dy * slow;
						p.Way[2] -= dz * slow;
						q.Way[2] += dz * slow;
					}
					else if (kind === 1) {
						p.Crowd += close * close;
						q.Crowd += close * close;
						p.Close += close * close * close;
						q.Close += close * close * close;
					}
					else {
						press = (stiffness * (p.Crowd + q.Crowd - 2 * crowd) / 2 * close + closeness * (p.Close + q.Close) / 2 * close * close) * h / 2;
						pa[0] -= dx * press;
						qa[0] += dx * press;
						pa[1] -= dy * press;
						qa[1] += dy * press;
						pa[2] -= dz * press;
						qa[2] += dz * press;
					}
				}
			}
		}

		/*
		 * A step by the relaxation of two densities: the particles move on their way, then those crowded past the rest of the water
		 * push their neighbours apart (and those very near harder still, so none sit on each other), and their way is how far they
		 * went. Neighbours that come together are slowed against each other: the viscosity.
		 */
		function step (elapsed) {
			neighbours();

			pairs(0, elapsed);

			particles.forEach(function (p) {
				var i = 0;

				p.Was[0] = p.At[0];
				p.Was[1] = p.At[1];
				p.Was[2] = p.At[2];

				while (i < 3) {
					p.Way[i] += gravity[i] * elapsed;
					p.At[i] += p.Way[i] * elapsed;

					i++;
				}

				p.Crowd = 0;
				p.Close = 0;
			});

			pairs(1, elapsed);
			pairs(2, elapsed);

			particles.forEach(function (p) {
				var i = 0;

				/* The walls of its box hold it in. */
				while (i < 3) {
					p.At[i] = Math.max(min[i], Math.min(max[i], p.At[i]));
					p.Way[i] = (p.At[i] - p.Was[i]) / elapsed;

					i++;
				}

				/* No faster than MaxSpeed: what was pushed apart hard does not fly off. */
				var speed = Math.sqrt(p.Way[0] * p.Way[0] + p.Way[1] * p.Way[1] + p.Way[2] * p.Way[2]);

				if (speed > fastest) {
					p.Way = [p.Way[0] * fastest / speed, p.Way[1] * fastest / speed, p.Way[2] * fastest / speed];
					p.At = [p.Was[0] + p.Way[0] * elapsed, p.Was[1] + p.Way[1] * elapsed, p.Was[2] + p.Way[2] * elapsed];
				}

				/* The ground under it: out of it along its slope (so it runs down it), its way into it gone, slowed along it as it spreads. */
				if (ground !== null) {
					var floor = groundAt(p.At[0], p.At[2]) + h * 0.25;

					if (p.At[1] < floor) {
						var e = h * 0.5;
						var n = [groundAt(p.At[0] - e, p.At[2]) - groundAt(p.At[0] + e, p.At[2]), 2 * e, groundAt(p.At[0], p.At[2] - e) - groundAt(p.At[0], p.At[2] + e)];
						var l = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
						var depth;
						var into;
						var keep = Math.pow(1 - Math.min(0.99, friction), elapsed);

						n = [n[0] / l, n[1] / l, n[2] / l];
						depth = (floor - p.At[1]) * n[1];
						p.At = [p.At[0] + n[0] * depth, p.At[1] + n[1] * depth, p.At[2] + n[2] * depth];
						p.At[1] = Math.max(p.At[1], groundAt(p.At[0], p.At[2]) + h * 0.25 - 1e-6);
						into = Math.min(0, p.Way[0] * n[0] + p.Way[1] * n[1] + p.Way[2] * n[2]);
						/* Struck hard, it splashes: the harder it came into it, the less of its way along it is left. */
						keep /= 1 - into * 0.15;
						p.Way = [(p.Way[0] - n[0] * into) * keep, p.Way[1] - n[1] * into, (p.Way[2] - n[2] * into) * keep];
					}
				}

				p.Age += elapsed;

				p.Density = rest * p.Crowd / crowd;
			});
		}

		return {
			Add: function (at, way) {
				particles.push({At: at.slice(), Way: way ? way.slice() : [0, 0, 0], Density: rest, Near: [], Was: at.slice(), Crowd: 0, Close: 0, Age: 0, Cx: 0, Cy: 0, Cz: 0});

				return particles.length - 1;
			},
			/* A block of water: count particles from a corner, half a reach apart, as wide and deep as across says. */
			Pour: function (at, count, across) {
				var wide = Math.max(1, Math.round(number(across, 5)));
				var spacing = h / 2;
				var i = 0;

				while (i < count) {
					this.Add([at[0] + i % wide * spacing, at[1] + Math.floor(i / (wide * wide)) * spacing, at[2] + Math.floor(i / wide) % wide * spacing]);

					i++;
				}
			},
			Step: function (elapsed) {
				return self.Steps(clock, Math.min(0.1, Math.max(0, number(elapsed, 0))), length, step);
			},
			Particles: function () {
				return particles.map(function (p) {
					return {At: p.At, Way: p.Way, Density: p.Density, Age: p.Age};
				});
			},
			Count: function () {
				return particles.length;
			},
			Clear: function () {
				particles = [];
			},
			Keep: function (test) {
				particles = particles.filter(function (p, index) {
					return test({At: p.At, Way: p.Way, Density: p.Density, Age: p.Age}, index);
				});
			}
		};
	}
});
